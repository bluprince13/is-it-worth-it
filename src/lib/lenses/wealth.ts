import { annualCost } from '$lib/finance/recurrence';
import { formatElapsed, formatMoney, formatPercent } from '$lib/format';
import { severity, THRESHOLDS } from './thresholds';
import type { Lens } from './types';

function netWorthBand(share: number): string {
	if (share < 0.0001) return 'Under the 0.01% rule: daily noise for your wealth.';
	if (share < 0.001) return 'Under 0.1%: small enough not to need a second thought.';
	if (share < 0.01) return 'Between 0.1% and 1% of everything you own.';
	if (share < 0.05) return 'Over 1% of everything you own.';
	return 'Over 5%: the level rules of thumb reserve for buying a car.';
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
				summary: `is ${formatPercent(share)} of your net worth`,
				sentence: netWorthBand(share),
				severity: severity(share, THRESHOLDS.netWorthShare),
				working: [`${formatMoney(purchase.amount)} ÷ ${formatMoney(netWorth)}`]
			};
		}
		const yearly = annualCost(purchase);
		const share = yearly / netWorth;
		return {
			value: share,
			headline: formatPercent(share),
			caption: 'of your net worth every year',
			sentence:
				'The 0.01% rule is for occasional treats, not recurring costs, so this is judged per year.',
			severity: severity(share, THRESHOLDS.netWorthShare),
			working: [`${formatMoney(yearly)} a year ÷ ${formatMoney(netWorth)}`]
		};
	}
};

export const wealthEarnBack: Lens = {
	id: 'wealth-earn-back',
	title: 'Wealth earn-back',
	group: 'wealth',
	requires: ['netWorth', 'annualSavings'],
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
			`${formatMoney(annualSavings!)} saved + ${formatMoney(returns)} investment returns = ${formatMoney(growth)} a year`,
			`${formatMoney(cost)}${recurring ? ' a year' : ''} ÷ ${formatMoney(growth)} × 365 days`
		];
		if (!recurring) {
			return {
				value: days,
				headline: formatElapsed(days),
				caption: 'for your savings and investments to earn it back',
				sentence: `Your savings and investments add about ${formatMoney(growth)} a year.`,
				severity: severity(days, THRESHOLDS.days),
				working
			};
		}
		return {
			value: days,
			headline: formatElapsed(days),
			caption: 'each year for your savings and investments to earn it back',
			sentence: `${formatPercent(share)} of the ${formatMoney(growth)} they add each year.`,
			severity: severity(share, THRESHOLDS.incomeShare),
			working
		};
	}
};

export const wealthLenses = [netWorthShare, wealthEarnBack];
