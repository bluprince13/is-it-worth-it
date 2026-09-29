import { annualCost } from '$lib/finance/recurrence';
import { formatElapsed, formatMoney, formatPercent } from '$lib/format';
import type { Lens, LensResult } from './types';

/** Attributed reference point only: states the rule and the user's figure, not a verdict. */
function ruleInfo(netWorth: number): LensResult['info'] {
	return {
		text: `Nick Maggiulli's "0.01% rule" describes spending of up to 0.01% of net worth a day (${formatMoney(netWorth * 0.0001)} for you) as not noticeably affecting wealth.`,
		href: 'https://ofdollarsanddata.com/climbing-the-wealth-ladder/',
		linkText: 'Read about the rule'
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
				working: [`${formatMoney(purchase.amount)} ÷ ${formatMoney(netWorth)}`]
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
			working: [`${formatMoney(yearly)} a year ÷ ${formatMoney(netWorth)}`]
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
		const returnsLine = `Investment returns a year: ${formatMoney(netWorth!)} × ${formatPercent(realReturn)} = ${formatMoney(returns)}`;
		if (!(returns > 0)) {
			return {
				value: NaN,
				headline: 'N/A',
				caption: `investment returns are ${formatMoney(0)} on these figures`,
				sentence: '',
				working: [returnsLine]
			};
		}

		const cost = recurring ? annualCost(purchase) : purchase.amount;
		const share = cost / returns;
		const days = share * 365.25;
		const working = [
			returnsLine,
			`${formatMoney(cost)}${recurring ? ' a year' : ''} ÷ ${formatMoney(returns)} × 365.25 = ${formatElapsed(days)}`
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
			sentence: `${formatPercent(share)} of the ${formatMoney(returns)} investment returns add each year.`,
			working
		};
	}
};

export const wealthLenses = [netWorthShare, wealthEarnBack];
