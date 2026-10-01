import { annualCost } from '$lib/finance/recurrence';
import { formatElapsed, formatMoney, formatPercent } from '$lib/format';
import { annualCostStep } from './cost';
import type { Lens, LensResult } from './types';

/** Attributed reference point only: states the rule and the user's figure, not a verdict. */
function ruleInfo(netWorth: number, recurring: boolean): LensResult['info'] {
	const scope = recurring ? ' The rule is stated for single purchases, not recurring costs.' : '';
	return {
		linkText: `Nick Maggiulli's "0.01% rule"`,
		href: 'https://ofdollarsanddata.com/climbing-the-wealth-ladder/',
		text: `describes a single purchase of up to 0.01% of net worth (${formatMoney(netWorth * 0.0001)} for you) as not noticeably affecting wealth.${scope}`
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
				info: ruleInfo(netWorth, false),
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
			caption: 'of your current net worth a year',
			sentence: `The yearly cost of ${formatMoney(yearly)} is ${formatPercent(share)} of your current net worth of ${formatMoney(netWorth)}.`,
			info: ruleInfo(netWorth, true),
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
			caption: 'for your investments to earn back one year of the cost',
			sentence: `The yearly cost of ${formatMoney(cost)} is ${formatPercent(share)} of the ${formatMoney(returns)} a year that investment returns add on your figures.`,
			working
		};
	}
};

export const wealthLenses = [netWorthShare, wealthEarnBack];
