import { futureValue, futureValueOfMonthlySeries, monthlyGrowthRate } from '$lib/finance/growth';
import { monthlyCost, remainingMonths } from '$lib/finance/recurrence';
import {
	formatDuration,
	formatElapsed,
	formatMoney,
	formatNumber,
	formatPercent
} from '$lib/format';
import { annualCostStep, decimals, monthlyCostStep } from './cost';
import type { Profile, Purchase } from '$lib/finance/types';
import type { Lens, Step } from './types';

const DAYS_PER_MONTH = 365.25 / 12;

const RETIREMENT_FIELDS: (keyof Profile)[] = [
	'netWorth',
	'annualSavings',
	'retirementTarget',
	'realReturn'
];

function yearsText(months: number): string {
	return `${(months / 12).toFixed(1)} years`;
}

function retirementSentence(before: number, after: number): string {
	const [was, now] = [yearsText(before), yearsText(after)];
	return was === now
		? `On these figures, net worth reaches the retirement target in about ${now} either way; the difference is under 0.1 years.`
		: `On these figures, net worth reaches the retirement target in ${now} instead of ${was}.`;
}

function purchaseSteps(purchase: Purchase, netWorth: number, annualSavings: number): Step[] {
	if (!purchase.recurrence) {
		return [
			{
				label: 'Net worth today',
				expr: `${formatMoney(netWorth)} − ${formatMoney(purchase.amount)}`,
				result: formatMoney(netWorth - purchase.amount)
			}
		];
	}
	const duration = purchase.duration ?? { kind: 'untilFI' };
	const saved = annualSavings / 12;
	const payment = monthlyCost(purchase);
	return [
		{ label: 'Net worth today', result: formatMoney(netWorth) },
		annualCostStep(purchase),
		monthlyCostStep(purchase),
		{
			label: 'Saved a month',
			expr: `${formatMoney(annualSavings)} a year ÷ 12 − ${formatMoney(payment)} a month`,
			result: `${formatMoney(saved - payment)}, ${duration.kind === 'fixed' ? formatDuration(duration) : 'until net worth reaches the retirement target'}`
		}
	];
}

export const retirementDelayLens: Lens = {
	id: 'retirement-delay',
	title: 'Retirement delay',
	group: 'retirement',
	requires: RETIREMENT_FIELDS,
	appliesTo: 'both',
	compute(ctx) {
		const { retirement, profile } = ctx;
		if (!retirement) return null;
		const { baseline, withPurchase, delayMonths } = retirement;
		const working: Step[] = [
			{ label: 'Retirement target', result: formatMoney(profile.retirementTarget!) },
			{
				label: 'Return',
				result: `${formatPercent(profile.realReturn)} a year above inflation`
			},
			{ label: 'Saved a year', result: formatMoney(profile.annualSavings!) },
			...purchaseSteps(ctx.purchase, profile.netWorth!, profile.annualSavings!)
		];

		if (baseline.fiMonth === 0) return null;
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
			working: [
				...working,
				{
					label: 'Without it',
					expr: 'months to retirement target, simulated',
					result: `${decimals(baseline.fiMonth)} months`
				},
				{
					label: 'With it',
					expr: 'months to retirement target, simulated',
					result: `${decimals(withPurchase.fiMonth)} months`
				},
				{
					label: 'Delay',
					expr: `(${decimals(withPurchase.fiMonth)} − ${decimals(baseline.fiMonth)}) months × ${decimals(DAYS_PER_MONTH)} days a month`,
					result: formatElapsed(days)
				}
			]
		};
	}
};

export const futureValueLens: Lens = {
	id: 'future-value',
	title: 'Invested instead',
	group: 'retirement',
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
		const duration = purchase.duration ?? { kind: 'untilFI' };
		if (fiMonth === 0 && recurring && duration.kind === 'untilFI') return null;
		const horizon = options.investYears === null ? fiMonth : options.investYears * 12;
		if (!horizon) return null;

		const rate = formatPercent(profile.realReturn);
		const caption =
			options.investYears === null
				? `by your retirement target date, in ${yearsText(horizon)}`
				: `after ${formatNumber(options.investYears)} ${options.investYears === 1 ? 'year' : 'years'}`;
		const returnStep: Step = {
			label: 'Return',
			result: `${rate} a year above inflation`
		};
		const simulated = options.investYears === null;
		if (!recurring) {
			const years = horizon / 12;
			const value = futureValue(purchase.amount, profile.realReturn, years);
			return {
				value,
				headline: formatMoney(value),
				caption,
				sentence: `Assuming a ${rate} return a year above inflation.`,
				working: [
					returnStep,
					simulated
						? {
								label: 'Years invested',
								expr: 'years to retirement target, simulated',
								result: `${decimals(years)} years`
							}
						: { label: 'Years invested', result: `${decimals(years)} years` },
					{
						label: 'Value',
						expr: `${formatMoney(purchase.amount)} × (1 + ${rate})^${decimals(years)}`,
						result: formatMoney(value)
					}
				]
			};
		}

		// Payments stop at the end of their duration but keep compounding to the horizon.
		const paying = Math.min(horizon, remainingMonths(duration, 0, fiMonth ?? horizon));
		const payment = monthlyCost(purchase);
		const i = monthlyGrowthRate(profile.realReturn);
		const monthlyRate = formatPercent(i);
		const atLastPayment = futureValueOfMonthlySeries(payment, profile.realReturn, paying);
		const value = futureValue(atLastPayment, profile.realReturn, (horizon - paying) / 12);
		const stopsEarly = paying < horizon;
		const [H, P] = [decimals(horizon), decimals(paying)];
		const working: Step[] = [
			returnStep,
			annualCostStep(purchase),
			monthlyCostStep(purchase),
			simulated
				? {
						label: 'Months invested',
						expr: 'months to retirement target, simulated',
						result: `${H} months`
					}
				: {
						label: 'Months invested',
						expr: `${formatNumber(options.investYears!)} years × 12`,
						result: `${H} months`
					}
		];
		if (stopsEarly) {
			working.push(
				duration.kind === 'untilFI'
					? {
							label: 'Months paid',
							expr: 'months to retirement target, simulated',
							result: `${P} months`
						}
					: duration.months % 12 === 0
						? {
								label: 'Months paid',
								expr: `${duration.months / 12} years × 12`,
								result: `${P} months`
							}
						: { label: 'Months paid', result: `${P} months` }
			);
		}
		const paidLabel = stopsEarly ? 'Value at last payment' : 'Value';
		if (i === 0) {
			working.push({
				label: paidLabel,
				expr: `${formatMoney(payment)} × ${P} months`,
				result: formatMoney(atLastPayment)
			});
		} else {
			working.push(
				{ label: 'Monthly return', expr: `(1 + ${rate})^(1/12) − 1`, result: monthlyRate },
				{
					label: paidLabel,
					expr: `${formatMoney(payment)} × ((1 + ${monthlyRate})^${P} − 1) ÷ ${monthlyRate}`,
					result: formatMoney(atLastPayment)
				}
			);
		}
		if (stopsEarly) {
			working.push({
				label: simulated ? 'Value at retirement target' : 'Value at end',
				expr: `${formatMoney(atLastPayment)} × (1 + ${rate})^((${H} − ${P}) ÷ 12)`,
				result: formatMoney(value)
			});
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
