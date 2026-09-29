import { fundingCapital } from '$lib/finance/fi';
import { futureValue, futureValueOfMonthlySeries } from '$lib/finance/growth';
import { annualCost, monthlyCost } from '$lib/finance/recurrence';
import {
	formatDuration,
	formatElapsed,
	formatMoney,
	formatNumber,
	formatPercent
} from '$lib/format';
import { severity, THRESHOLDS } from './thresholds';
import type { Lens, LensContext } from './types';

const DAYS_PER_MONTH = 365.25 / 12;

function fiPoint(months: number, age: number | undefined): string {
	const years = months / 12;
	return age === undefined ? `${years.toFixed(1)} years` : (age + years).toFixed(1);
}

function when(months: number, age: number | undefined): string {
	return `${age === undefined ? 'in' : 'at'} ${fiPoint(months, age)}`;
}

function retirementSentence(before: number, after: number, age: number | undefined): string {
	const [was, now] = [fiPoint(before, age), fiPoint(after, age)];
	return was === now
		? `Financially independent ${when(after, age)} either way, just a little later.`
		: `Financially independent ${when(after, age)} instead of ${was}.`;
}

function capitalAtRisk({ purchase, profile, recurring }: LensContext): number {
	return recurring ? fundingCapital(purchase, profile.swr) : purchase.amount;
}

export const retirementDelayLens: Lens = {
	id: 'retirement-delay',
	title: 'Retirement delay',
	group: 'future',
	requires: ['netWorth', 'annualSavings', 'annualSpend'],
	appliesTo: 'both',
	compute(ctx) {
		const { retirement, profile } = ctx;
		if (!retirement) return null;
		const { baseline, withPurchase, delayMonths } = retirement;
		const fiNumber = profile.annualSpend! / profile.swr;
		const working = [
			`FI number: ${formatMoney(profile.annualSpend!)} spending ÷ ${formatPercent(profile.swr)} = ${formatMoney(fiNumber)}`,
			`Net worth grows ${formatPercent(profile.realReturn)} a year above inflation, plus ${formatMoney(profile.annualSavings!)} saved a year`
		];
		if (ctx.recurring) {
			working.push(`With this cost the FI number starts at ${formatMoney(withPurchase.target[0])}`);
		}

		if (baseline.fiMonth === 0) {
			const lostIncome = capitalAtRisk(ctx) * profile.swr;
			return {
				value: lostIncome,
				headline: formatMoney(lostIncome),
				caption: 'a year less to spend, for good',
				sentence:
					"You're already financially independent, so this comes out of your safe spending instead.",
				severity: severity(lostIncome / profile.annualSpend!, THRESHOLDS.spendShare),
				working: [...working, `Capital × ${formatPercent(profile.swr)} safe withdrawal rate`]
			};
		}
		if (baseline.fiMonth === null) {
			return {
				value: NaN,
				headline: 'Out of reach',
				caption: 'at your current savings rate',
				sentence:
					"With these numbers you don't reach financial independence within 80 years, so there's no date to delay.",
				working
			};
		}
		if (withPurchase.fiMonth === null || delayMonths === null) {
			return {
				value: Infinity,
				headline: 'Out of reach',
				caption: 'retirement with this cost',
				sentence: `Without it you'd be financially independent ${when(baseline.fiMonth, profile.age)}.`,
				severity: 3,
				working
			};
		}
		const days = delayMonths * DAYS_PER_MONTH;
		return {
			value: days,
			headline: formatElapsed(days),
			caption: 'later retirement',
			sentence: retirementSentence(baseline.fiMonth, withPurchase.fiMonth, profile.age),
			severity: severity(days, THRESHOLDS.days),
			working
		};
	}
};

export const futureValueLens: Lens = {
	id: 'future-value',
	title: 'Invested instead',
	group: 'future',
	requires: ['netWorth', 'annualSavings', 'annualSpend'],
	appliesTo: 'both',
	compute({ retirement, purchase, profile, recurring }) {
		const fiMonth = retirement?.baseline.fiMonth;
		if (!fiMonth) return null;
		const years = fiMonth / 12;
		const rate = formatPercent(profile.realReturn);
		if (!recurring) {
			const value = futureValue(purchase.amount, profile.realReturn, years);
			return {
				value,
				headline: formatMoney(value),
				caption: `by the time you retire, ${when(fiMonth, profile.age)}`,
				sentence: `Invested at ${rate} a year above inflation, in today's money.`,
				working: [`${formatMoney(purchase.amount)} × (1 + ${rate})^${formatNumber(years)}`]
			};
		}
		const duration = purchase.duration ?? { kind: 'lifelong' };
		const months = duration.kind === 'fixed' ? Math.min(duration.months, fiMonth) : fiMonth;
		const payment = monthlyCost(purchase);
		const value = futureValueOfMonthlySeries(payment, profile.realReturn, months);
		return {
			value,
			headline: formatMoney(value),
			caption: `by the time you retire, ${when(fiMonth, profile.age)}`,
			sentence: `The payments made before retirement, invested at ${rate} a year above inflation, in today's money.`,
			working: [
				`${formatNumber(months)} monthly payments of ${formatMoney(payment)}, each compounded to retirement`
			]
		};
	}
};

export const capitalNeeded: Lens = {
	id: 'capital-needed',
	title: 'Capital to fund it',
	group: 'future',
	requires: [],
	appliesTo: 'recurring',
	compute(ctx) {
		const { purchase, profile } = ctx;
		const duration = purchase.duration ?? { kind: 'lifelong' };
		if (duration.kind === 'untilFI') return null;
		const capital = fundingCapital(purchase, profile.swr);
		const swr = formatPercent(profile.swr);
		return {
			value: capital,
			headline: formatMoney(capital),
			caption: `invested to pay for it ${formatDuration(duration)}`,
			sentence:
				duration.kind === 'lifelong'
					? `${formatMoney(annualCost(purchase))} a year ÷ ${swr} safe withdrawal rate. This is what it adds to your FI number.`
					: `Enough to cover every payment while drawing down at ${swr} a year.`,
			severity:
				profile.netWorth && profile.netWorth > 0
					? severity(capital / profile.netWorth, THRESHOLDS.netWorthShare)
					: undefined,
			working: [
				duration.kind === 'lifelong'
					? `${formatMoney(annualCost(purchase))} ÷ ${swr}`
					: `Present value of ${duration.months} payments of ${formatMoney(monthlyCost(purchase))}, discounted at ${swr} a year`
			]
		};
	}
};

export const futureLenses = [retirementDelayLens, futureValueLens, capitalNeeded];
