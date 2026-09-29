import { annualCost, monthlyCost, totalCost } from '$lib/finance/recurrence';
import {
	formatDuration,
	formatElapsed,
	formatMoney,
	formatNumber,
	formatPercent
} from '$lib/format';
import { severity, THRESHOLDS } from './thresholds';
import type { Lens } from './types';

export const livingCosts: Lens = {
	id: 'living-costs',
	title: 'Living costs',
	group: 'budget',
	requires: ['annualSpend'],
	appliesTo: 'both',
	compute({ profile, purchase, recurring }) {
		const spend = profile.annualSpend!;
		if (!(spend > 0)) return null;
		if (!recurring) {
			const days = (purchase.amount / spend) * 365.25;
			return {
				value: days,
				headline: formatElapsed(days),
				caption: 'of all your living costs',
				sentence: `You spend about ${formatMoney(spend / 365.25)} a day on everything.`,
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

export const funBudget: Lens = {
	id: 'fun-budget',
	title: 'Fun money',
	group: 'budget',
	requires: ['monthlyFunBudget'],
	appliesTo: 'both',
	compute({ profile, purchase, recurring }) {
		const budget = profile.monthlyFunBudget!;
		if (!(budget > 0)) return null;
		const monthly = recurring ? monthlyCost(purchase) : purchase.amount;
		const share = monthly / budget;
		const months = !recurring && share >= 1;
		return {
			value: share,
			headline: months ? `${formatNumber(share)} months` : formatPercent(share),
			caption: recurring
				? 'of your fun money, every month'
				: months
					? 'of your fun money'
					: 'of your monthly fun money',
			sentence: `Your guilt-free budget is ${formatMoney(budget)} a month.`,
			severity: severity(share, THRESHOLDS.funBudgetShare),
			working: [`${formatMoney(monthly)} ÷ ${formatMoney(budget)}`]
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

export const budgetLenses = [livingCosts, funBudget, reframedTotals];
