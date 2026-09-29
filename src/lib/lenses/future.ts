import { futureValue, futureValueOfMonthlySeries, monthlyGrowthRate } from '$lib/finance/growth';
import { monthlyCost, remainingMonths } from '$lib/finance/recurrence';
import { formatElapsed, formatMoney, formatNumber, formatPercent } from '$lib/format';
import type { Profile } from '$lib/finance/types';
import type { Lens } from './types';

const DAYS_PER_MONTH = 365.25 / 12;

const RETIREMENT_FIELDS: (keyof Profile)[] = [
	'netWorth',
	'annualSavings',
	'retirementTarget',
	'realReturn'
];

/** Exponents keep a decimal or two so the equation reproduces the result. */
function exponent(n: number): string {
	return String(Number(n.toFixed(2)));
}

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
				sentence: `Without it, net worth reaches the retirement target in ${yearsText(baseline.fiMonth)} on these figures.`,
				working
			};
		}
		const days = delayMonths * DAYS_PER_MONTH;
		return {
			value: days,
			headline: formatElapsed(days),
			caption: 'later to reach your retirement target',
			sentence: retirementSentence(baseline.fiMonth, withPurchase.fiMonth),
			working
		};
	}
};

export const futureValueLens: Lens = {
	id: 'future-value',
	title: 'Invested instead',
	group: 'future',
	requires: ({ investYears }) => (investYears === null ? RETIREMENT_FIELDS : ['realReturn']),
	appliesTo: 'both',
	compute({ retirement, purchase, profile, recurring, options }) {
		if (options.investYears !== null && !(options.investYears >= 1)) {
			return {
				value: NaN,
				headline: '–',
				caption: 'enter a whole number of years below',
				sentence: '',
				working: []
			};
		}
		const fiMonth = retirement?.baseline.fiMonth ?? null;
		const horizon = options.investYears === null ? fiMonth : options.investYears * 12;
		if (!horizon) return null;

		const rate = formatPercent(profile.realReturn);
		const caption =
			options.investYears === null
				? `by your retirement target date, in ${yearsText(horizon)}`
				: `after ${formatNumber(options.investYears)} ${options.investYears === 1 ? 'year' : 'years'}`;
		if (!recurring) {
			const value = futureValue(purchase.amount, profile.realReturn, horizon / 12);
			return {
				value,
				headline: formatMoney(value),
				caption,
				sentence: `Assuming a ${rate} return a year above inflation.`,
				working: [
					`${formatMoney(purchase.amount)} × (1 + ${rate})^${exponent(horizon / 12)} = ${formatMoney(value)}`
				]
			};
		}

		// Payments stop at the end of their duration but keep compounding to the horizon.
		const duration = purchase.duration ?? { kind: 'untilFI' };
		const paying = Math.min(horizon, remainingMonths(duration, 0, fiMonth ?? horizon));
		const payment = monthlyCost(purchase);
		const i = monthlyGrowthRate(profile.realReturn);
		const monthlyRate = `${(i * 100).toFixed(3)}%`;
		const atLastPayment = futureValueOfMonthlySeries(payment, profile.realReturn, paying);
		const value = futureValue(atLastPayment, profile.realReturn, (horizon - paying) / 12);
		const working =
			i === 0
				? [`${formatMoney(payment)} × ${exponent(paying)} months = ${formatMoney(atLastPayment)}`]
				: [
						`Monthly return: (1 + ${rate})^(1/12) − 1 = ${monthlyRate}`,
						`${formatMoney(payment)} × ((1 + ${monthlyRate})^${exponent(paying)} − 1) ÷ ${monthlyRate} = ${formatMoney(atLastPayment)}`
					];
		if (horizon > paying) {
			working.push(
				`${formatMoney(atLastPayment)} × (1 + ${rate})^${exponent((horizon - paying) / 12)} = ${formatMoney(value)}`
			);
		}
		return {
			value,
			headline: formatMoney(value),
			caption,
			sentence: `Assuming a ${rate} return a year above inflation.`,
			working
		};
	}
};

export const futureLenses = [retirementDelayLens, futureValueLens];
