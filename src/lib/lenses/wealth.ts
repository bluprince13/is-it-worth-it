import { annualCost } from '$lib/finance/recurrence';
import { formatElapsed, formatMoney, formatPercent } from '$lib/format';
import type { Lens } from './types';

/** Attributed reference point only: states the rule and the user's figure, not a verdict. */
function ruleReference(netWorth: number): string {
	return `For reference, Nick Maggiulli's "0.01% rule" describes daily spending of up to 0.01% of net worth (${formatMoney(netWorth * 0.0001)} for you) as not noticeably affecting wealth.`;
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
				sentence: `${formatMoney(purchase.amount)} out of ${formatMoney(netWorth)}. ${ruleReference(netWorth)}`,
				working: [`${formatMoney(purchase.amount)} ÷ ${formatMoney(netWorth)}`]
			};
		}
		const yearly = annualCost(purchase);
		const share = yearly / netWorth;
		return {
			value: share,
			headline: formatPercent(share),
			caption: 'of your net worth every year',
			sentence: `${formatMoney(yearly)} a year out of ${formatMoney(netWorth)}, or ${formatMoney(yearly / 365.25)} a day. ${ruleReference(netWorth)}`,
			working: [`${formatMoney(yearly)} a year ÷ ${formatMoney(netWorth)}`]
		};
	}
};

export const wealthEarnBack: Lens = {
	id: 'wealth-earn-back',
	title: 'Wealth earn-back',
	group: 'wealth',
	requires: ['netWorth', 'annualSavings', 'realReturn'],
	appliesTo: 'both',
	compute({ profile, purchase, recurring }) {
		const { netWorth, annualSavings, realReturn } = profile;
		const returns = netWorth! * realReturn;
		const growth = annualSavings! + returns;
		if (!(growth > 0)) return null;

		const cost = recurring ? annualCost(purchase) : purchase.amount;
		const share = cost / growth;
		const days = share * 365.25;
		const working = [
			`${formatMoney(annualSavings!)} saved + ${formatMoney(returns)} assumed investment returns = ${formatMoney(growth)} a year`,
			`${formatMoney(cost)}${recurring ? ' a year' : ''} ÷ ${formatMoney(growth)} × 365 days`
		];
		if (!recurring) {
			return {
				value: days,
				headline: formatElapsed(days),
				caption: 'for your savings and investments to earn it back',
				sentence: `On your figures, savings and investment returns add about ${formatMoney(growth)} a year.`,
				working
			};
		}
		return {
			value: days,
			headline: formatElapsed(days),
			caption: 'each year for your savings and investments to earn it back',
			sentence: `${formatPercent(share)} of the ${formatMoney(growth)} they add each year.`,
			working
		};
	}
};

export const wealthLenses = [netWorthShare, wealthEarnBack];
