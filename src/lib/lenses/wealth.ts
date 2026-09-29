import { annualCost } from '$lib/finance/recurrence';
import { formatElapsed, formatMoney, formatPercent } from '$lib/format';
import { severity, THRESHOLDS } from './thresholds';
import type { Lens, LensContext, LensResult } from './types';

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

function earnBack(
	{ purchase, recurring }: LensContext,
	yearlyGrowth: number,
	source: string,
	working: string
): LensResult | null {
	if (!(yearlyGrowth > 0)) return null;
	if (!recurring) {
		const days = (purchase.amount / yearlyGrowth) * 365.25;
		return {
			value: days,
			headline: formatElapsed(days),
			caption: `for ${source} to earn it back`,
			sentence: `${source[0].toUpperCase()}${source.slice(1)} add about ${formatMoney(yearlyGrowth)} a year.`,
			severity: severity(days, THRESHOLDS.days),
			working: [
				working,
				`${formatMoney(purchase.amount)} ÷ ${formatMoney(yearlyGrowth)} × 365 days`
			]
		};
	}
	const yearly = annualCost(purchase);
	const share = yearly / yearlyGrowth;
	return {
		value: share,
		headline: formatPercent(share),
		caption: `of what ${source} add each year`,
		sentence: `${formatMoney(yearly)} a year out of about ${formatMoney(yearlyGrowth)}.`,
		severity: severity(share, THRESHOLDS.incomeShare),
		working: [working, `${formatMoney(yearly)} ÷ ${formatMoney(yearlyGrowth)}`]
	};
}

export const portfolioEarnBack: Lens = {
	id: 'portfolio-earn-back',
	title: 'Investment earn-back',
	group: 'wealth',
	requires: ['netWorth'],
	appliesTo: 'both',
	compute(ctx) {
		const { netWorth, realReturn } = ctx.profile;
		const growth = netWorth! * realReturn;
		return earnBack(
			ctx,
			growth,
			'your investments',
			`${formatMoney(netWorth!)} × ${formatPercent(realReturn)} real return = ${formatMoney(growth)} a year`
		);
	}
};

export const totalEarnBack: Lens = {
	id: 'total-earn-back',
	title: 'Wealth earn-back',
	group: 'wealth',
	requires: ['netWorth', 'annualSavings'],
	appliesTo: 'both',
	compute(ctx) {
		const { netWorth, annualSavings, realReturn } = ctx.profile;
		const returns = netWorth! * realReturn;
		const growth = annualSavings! + returns;
		return earnBack(
			ctx,
			growth,
			'your savings and investments',
			`${formatMoney(annualSavings!)} saved + ${formatMoney(returns)} returns = ${formatMoney(growth)} a year`
		);
	}
};

export const wealthLenses = [netWorthShare, portfolioEarnBack, totalEarnBack];
