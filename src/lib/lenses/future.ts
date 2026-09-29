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
import type { Lens, LensContext } from './types';

const DAYS_PER_MONTH = 365.25 / 12;

const RETIREMENT_FIELDS: Lens['requires'] = ['netWorth', 'annualSavings', 'retirementTarget'];

function yearsText(months: number): string {
	return `${(months / 12).toFixed(1)} years`;
}

function retirementSentence(before: number, after: number): string {
	const [was, now] = [yearsText(before), yearsText(after)];
	return was === now
		? `On these figures, net worth reaches the retirement target in about ${now} either way; the difference is under 0.1 years.`
		: `On these figures, net worth reaches the retirement target in ${now} instead of ${was}.`;
}

export const retirementDelayLens: Lens = {
	id: 'retirement-delay',
	title: 'Retirement delay',
	group: 'future',
	requires: RETIREMENT_FIELDS,
	appliesTo: 'both',
	compute(ctx) {
		const { retirement, profile } = ctx;
		if (!retirement) return null;
		const { baseline, withPurchase, delayMonths } = retirement;
		const working = [
			`Retirement target: ${formatMoney(profile.retirementTarget!)}`,
			`Assumes net worth grows ${formatPercent(profile.realReturn)} a year above inflation, plus ${formatMoney(profile.annualSavings!)} saved a year`
		];
		if (ctx.recurring) {
			working.push(
				`With this cost the target starts at ${formatMoney(withPurchase.target[0])}: the capital to fund it after the target date, at a ${formatPercent(profile.swr)} withdrawal rate, is added`
			);
		}

		if (baseline.fiMonth === 0) {
			return {
				value: NaN,
				headline: 'N/A',
				caption: 'net worth already meets the retirement target',
				sentence: 'On these figures, there is no retirement date to delay.',
				working
			};
		}
		if (baseline.fiMonth === null) {
			return {
				value: NaN,
				headline: 'Not reached',
				caption: 'within 80 years on these figures',
				sentence:
					"On these figures, net worth doesn't reach the retirement target within 80 years, so there are no dates to compare.",
				working
			};
		}
		if (withPurchase.fiMonth === null || delayMonths === null) {
			return {
				value: Infinity,
				headline: 'Not reached',
				caption: 'retirement target within 80 years with this cost',
				summary: 'would mean net worth doesn’t reach the retirement target within 80 years',
				sentence: `Without it, net worth reaches the retirement target in ${yearsText(baseline.fiMonth)} on these figures.`,
				working
			};
		}
		const days = delayMonths * DAYS_PER_MONTH;
		return {
			value: days,
			headline: formatElapsed(days),
			caption: 'later to reach your retirement target',
			summary: `would delay reaching your retirement target by ${formatElapsed(days)}`,
			sentence: retirementSentence(baseline.fiMonth, withPurchase.fiMonth),
			working
		};
	}
};

export const futureValueLens: Lens = {
	id: 'future-value',
	title: 'Invested instead',
	group: 'future',
	requires: RETIREMENT_FIELDS,
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
				caption: `by your retirement target date, in ${yearsText(fiMonth)}`,
				sentence: `If invested at an assumed ${rate} a year above inflation, in today's money.`,
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
			caption: `by your retirement target date, in ${yearsText(fiMonth)}`,
			sentence: `The payments made before that date, if invested at an assumed ${rate} a year above inflation, in today's money.`,
			working: [
				`${formatNumber(months)} monthly payments of ${formatMoney(payment)}, each compounded to the target date`
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
					? `${formatMoney(annualCost(purchase))} a year ÷ ${swr} withdrawal rate. This is what it adds to your retirement target.`
					: `The sum that covers every payment when drawn down at ${swr} a year.`,
			working: [
				duration.kind === 'lifelong'
					? `${formatMoney(annualCost(purchase))} ÷ ${swr}`
					: `Present value of ${duration.months} payments of ${formatMoney(monthlyCost(purchase))}, discounted at ${swr} a year`
			]
		};
	}
};

export const futureLenses = [retirementDelayLens, futureValueLens, capitalNeeded];
