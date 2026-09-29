import { monthlyGrowthRate } from './growth';
import { monthlyCost } from './recurrence';
import type { Purchase } from './types';

export const MAX_MONTHS = 80 * 12;

export interface FIInputs {
	netWorth: number;
	annualSavings: number;
	/** Net worth needed to retire, in today's money. */
	target: number;
	realReturn: number;
}

export interface FIResult {
	/**
	 * Fractional month FI is reached (0 = already), or null if not within MAX_MONTHS.
	 * Interpolated within the month so small purchases still show a delay of days.
	 */
	fiMonth: number | null;
	netWorth: number[];
}

export interface RetirementDelay {
	target: number;
	baseline: FIResult;
	withPurchase: FIResult;
	delayMonths: number | null;
}

export function simulateToFI(inputs: FIInputs, purchase?: Purchase): FIResult {
	const growth = monthlyGrowthRate(inputs.realReturn);
	const monthlySavings = inputs.annualSavings / 12;
	const recurring = purchase?.recurrence !== undefined;
	const payment = recurring ? monthlyCost(purchase!) : 0;
	const payingMonths = purchase?.duration?.kind === 'fixed' ? purchase.duration.months : Infinity;

	let nw = inputs.netWorth - (purchase && !recurring ? purchase.amount : 0);
	const netWorth: number[] = [];

	for (let month = 0; month <= MAX_MONTHS; month++) {
		netWorth.push(nw);
		if (nw >= inputs.target) {
			return { fiMonth: interpolateCrossing(netWorth, inputs.target, month), netWorth };
		}
		nw = nw * (1 + growth) + monthlySavings - (month < payingMonths ? payment : 0);
	}
	return { fiMonth: null, netWorth };
}

function interpolateCrossing(netWorth: number[], target: number, month: number): number {
	if (month === 0) return 0;
	const gapBefore = netWorth[month - 1] - target;
	const gapAfter = netWorth[month] - target;
	return month - 1 + gapBefore / (gapBefore - gapAfter);
}

export function retirementDelay(inputs: FIInputs, purchase: Purchase): RetirementDelay {
	const baseline = simulateToFI(inputs);
	const withPurchase = simulateToFI(inputs, purchase);
	const delayMonths =
		baseline.fiMonth === null || withPurchase.fiMonth === null
			? null
			: withPurchase.fiMonth - baseline.fiMonth;
	return { target: inputs.target, baseline, withPurchase, delayMonths };
}
