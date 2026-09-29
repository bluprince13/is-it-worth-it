import { annualCost, monthlyCost, paymentsPerYear } from '$lib/finance/recurrence';
import type { Purchase, Recurrence, Unit } from '$lib/finance/types';
import { formatMoney } from '$lib/format';
import type { Step } from './types';

const upToTwoDecimals = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

/** Keeps a decimal or two so an equation reproduces its result. */
export function decimals(n: number): string {
	return upToTwoDecimals.format(n);
}

const UNITS_PER_YEAR: Record<Unit, string> = {
	day: '365.25',
	week: '365.25 ÷ 7',
	month: '12',
	year: '1'
};

function every({ every, unit }: Recurrence): string {
	return every === 1 ? `a ${unit}` : `every ${every} ${unit}s`;
}

/** Payments a year, written from the calendar so no figure appears unexplained. */
function paymentsPerYearExpr({ every, unit }: Recurrence): string {
	const perYear = every === 1 ? UNITS_PER_YEAR[unit] : `${UNITS_PER_YEAR[unit]} ÷ ${every}`;
	return perYear.includes('÷') ? `(${perYear})` : perYear;
}

export function annualCostStep(purchase: Purchase): Step {
	const recurrence = purchase.recurrence!;
	const result = `${formatMoney(annualCost(purchase))} a year`;
	if (recurrence.unit === 'year' && recurrence.every === 1) {
		return { label: 'Yearly cost', result };
	}
	const payments = paymentsPerYear(recurrence) === 1 ? 'payment' : 'payments';
	return {
		label: 'Yearly cost',
		expr: `${formatMoney(purchase.amount)} ${every(recurrence)} × ${paymentsPerYearExpr(recurrence)} ${payments} a year`,
		result
	};
}

export function monthlyCostStep(purchase: Purchase): Step {
	return {
		label: 'Monthly cost',
		expr: `${formatMoney(annualCost(purchase))} a year ÷ 12`,
		result: `${formatMoney(monthlyCost(purchase))} a month`
	};
}
