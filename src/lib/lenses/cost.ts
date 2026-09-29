import { annualCost, monthlyCost, paymentsPerYear } from '$lib/finance/recurrence';
import type { Purchase, Recurrence } from '$lib/finance/types';
import { formatMoney } from '$lib/format';

/** Keeps a decimal or two so an equation reproduces its result. */
export function decimals(n: number): string {
	return String(Number(n.toFixed(2)));
}

function every({ every, unit }: Recurrence): string {
	return every === 1 ? `a ${unit}` : `every ${every} ${unit}s`;
}

export function annualCostLine(purchase: Purchase): string {
	const recurrence = purchase.recurrence!;
	const perYear = paymentsPerYear(recurrence);
	const payments = perYear === 1 ? 'payment' : 'payments';
	return `${formatMoney(purchase.amount)} ${every(recurrence)} × ${decimals(perYear)} ${payments} a year = ${formatMoney(annualCost(purchase))} a year`;
}

export function monthlyCostLine(purchase: Purchase): string {
	return `${formatMoney(annualCost(purchase))} a year ÷ 12 = ${formatMoney(monthlyCost(purchase))} a month`;
}
