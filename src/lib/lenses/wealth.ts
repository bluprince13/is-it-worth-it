import { annualCost } from '$lib/finance/recurrence';
import { formatElapsed, formatMoney, formatPercent } from '$lib/format';
import { annualCostStep } from './cost';
import type { Lens, LensResult } from './types';

/** Attributed reference point only: states the rule and the user's figure, not a verdict. */
function ruleInfo(netWorth: number): LensResult['info'] {
	return {
		linkText: `Nick Maggiulli's "0.01% rule"`,
		href: 'https://ofdollarsanddata.com/climbing-the-wealth-ladder/',
		text: `describes spending of up to 0.01% of net worth a day (${formatMoney(netWorth * 0.0001)} for you) as not noticeably affecting wealth.`
	};
}

export const netWorthShare: Lens = {
	id: 'net-worth-share',
	title: 'Share of net worth',
	group: 'wealth',
	requires: ['netWorth'],
	appliesTo: 'both',
	compute({ profile, purchase, recurring }) {
		const netWorth = profile.netWorth!;
		if (!(netWorth > 0)) return null;
		if (!recurring) {
			const share = purchase.amount / netWorth;
			return {
				value: share,
				headline: formatPercent(share),
				caption: 'of your net worth',
				sentence: `${formatMoney(purchase.amount)} out of ${formatMoney(netWorth)}.`,
				info: ruleInfo(netWorth),
				working: [
					{
						label: 'Share',
						expr: `${formatMoney(purchase.amount)} ÷ ${formatMoney(netWorth)} net worth`,
						result: formatPercent(share)
					}
				]
			};
		}
		const yearly = annualCost(purchase);
		const share = yearly / netWorth;
		return {
			value: share,
			headline: formatPercent(share),
			caption: 'of your net worth every year',
			sentence: `${formatMoney(yearly)} a year out of ${formatMoney(netWorth)}, or ${formatMoney(yearly / 365.25)} a day.`,
			info: ruleInfo(netWorth),
			working: [
				annualCostStep(purchase),
				{
					label: 'Share a year',
					expr: `${formatMoney(yearly)} a year ÷ ${formatMoney(netWorth)} net worth`,
					result: formatPercent(share)
				}
			]
		};
	}
};

export const wealthEarnBack: Lens = {
	id: 'wealth-earn-back',
	title: 'Wealth earn-back',
	group: 'wealth',
	requires: ['netWorth', 'realReturn'],
	appliesTo: 'both',
	compute({ profile, purchase, recurring }) {
		const { netWorth, realReturn } = profile;
		const returns = netWorth! * realReturn;
		const returnsStep = {
			label: 'Investment returns a year',
			expr: `${formatMoney(netWorth!)} net worth × ${formatPercent(realReturn)} return`,
			result: formatMoney(returns)
		};
		if (!(returns > 0)) {
			return {
				value: NaN,
				headline: 'N/A',
				caption: `investment returns are ${formatMoney(0)} on these figures`,
				sentence: '',
				working: [returnsStep]
			};
		}

		const cost = recurring ? annualCost(purchase) : purchase.amount;
		const share = cost / returns;
		const days = share * 365.25;
		const working = [
			...(recurring ? [annualCostStep(purchase)] : []),
			returnsStep,
			{
				label: recurring ? 'Earn-back a year' : 'Earn-back',
				expr: `${formatMoney(cost)}${recurring ? ' a year' : ''} ÷ ${formatMoney(returns)} × 365.25 days`,
				result: formatElapsed(days)
			}
		];
		if (!recurring) {
			return {
				value: days,
				headline: formatElapsed(days),
				caption: 'for your investments to earn it back',
				sentence: `On your figures, investment returns add about ${formatMoney(returns)} a year.`,
				working
			};
		}
		return {
			value: days,
			headline: formatElapsed(days),
			caption: 'each year for your investments to earn it back',
			sentence: `The yearly cost is ${formatPercent(share)} of the ${formatMoney(returns)} a year that investment returns add on your figures.`,
			working
		};
	}
};

export const wealthLenses = [netWorthShare, wealthEarnBack];
