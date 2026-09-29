import { annualCost, monthlyCost, totalCost } from '$lib/finance/recurrence';
import { formatDuration, formatElapsed, formatMoney, formatPercent } from '$lib/format';
import { annualSpend } from '$lib/finance/spend';
import { severity, THRESHOLDS } from './thresholds';
import type { Lens } from './types';

export const livingCosts: Lens = {
	id: 'living-costs',
	title: 'Living costs',
	group: 'budget',
	requires: ['takeHomePerYear', 'annualSavings'],
	appliesTo: 'both',
	compute({ profile, purchase, recurring }) {
		const spend = annualSpend(profile)!;
		if (!(spend > 0)) return null;
		if (!recurring) {
			const days = (purchase.amount / spend) * 365.25;
			return {
				value: days,
				headline: formatElapsed(days),
				caption: 'of all your living costs',
				sentence: `You spend about ${formatMoney(spend / 365.25)} a day: take-home pay minus savings.`,
				severity: severity(days, THRESHOLDS.days),
				working: [`${formatMoney(purchase.amount)} ÷ (${formatMoney(spend)} ÷ 365 days)`]
			};
		}
		const yearly = annualCost(purchase);
		const share = yearly / spend;
		return {
			value: share,
			headline: formatPercent(share),
			caption: 'added to your yearly spending',
			sentence: `${formatMoney(yearly)} a year on top of ${formatMoney(spend)}.`,
			severity: severity(share, THRESHOLDS.spendShare),
			working: [`${formatMoney(yearly)} ÷ ${formatMoney(spend)}`]
		};
	}
};

export const reframedTotals: Lens = {
	id: 'reframed-totals',
	title: 'Adds up to',
	group: 'budget',
	requires: [],
	appliesTo: 'recurring',
	compute({ purchase, retirement }) {
		const yearly = annualCost(purchase);
		const duration = purchase.duration ?? { kind: 'lifelong' };
		const fiMonth = retirement?.withPurchase.fiMonth;
		const parts = [`${formatMoney(yearly / 365.25)} a day`, `${formatMoney(yearly * 10)} a decade`];
		if (duration.kind === 'fixed' || (duration.kind === 'untilFI' && fiMonth)) {
			parts.push(`${formatMoney(totalCost(purchase, fiMonth ?? 0))} ${formatDuration(duration)}`);
		}
		return {
			value: yearly,
			headline: formatMoney(yearly),
			caption: 'a year',
			sentence: `${parts.join(', ')}.`,
			working: [`${formatMoney(monthlyCost(purchase))} a month × 12`]
		};
	}
};

export const budgetLenses = [livingCosts, reframedTotals];
