import { capitalToFund, monthlyGrowthRate } from './growth';
import { monthlyCost, remainingMonths } from './recurrence';
import type { Duration, Purchase } from './types';

export const MAX_MONTHS = 80 * 12;

export interface FIInputs {
	netWorth: number;
	annualSavings: number;
	/** Net worth needed to retire, before any recurring cost that continues past it. */
	target: number;
	realReturn: number;
	swr: number;
}

export interface FIResult {
	/**
	 * Fractional month FI is reached (0 = already), or null if not within MAX_MONTHS.
	 * Interpolated within the month so small purchases still show a delay of days.
	 */
	fiMonth: number | null;
	netWorth: number[];
	target: number[];
}

export interface RetirementDelay {
	baseline: FIResult;
	withPurchase: FIResult;
	delayMonths: number | null;
}

const LIFELONG: Duration = { kind: 'lifelong' };

/** Capital that would cover the purchase from `fromMonth` on, if FI is reached that month. */
export function fundingCapital(purchase: Purchase, swr: number, fromMonth = 0): number {
	if (!purchase.recurrence) return purchase.amount;
	const duration = purchase.duration ?? LIFELONG;
	return capitalToFund(monthlyCost(purchase), swr, remainingMonths(duration, fromMonth, fromMonth));
}

export function simulateToFI(inputs: FIInputs, purchase?: Purchase): FIResult {
	const growth = monthlyGrowthRate(inputs.realReturn);
	const monthlySavings = inputs.annualSavings / 12;
	const baseTarget = inputs.target;
	const recurring = purchase?.recurrence !== undefined;
	const payment = purchase && recurring ? monthlyCost(purchase) : 0;
	const duration = purchase?.duration ?? LIFELONG;

	let nw = inputs.netWorth - (purchase && !recurring ? purchase.amount : 0);
	const netWorth: number[] = [];
	const target: number[] = [];

	for (let month = 0; month <= MAX_MONTHS; month++) {
		const monthTarget = baseTarget + (recurring ? fundingCapital(purchase!, inputs.swr, month) : 0);
		netWorth.push(nw);
		target.push(monthTarget);
		if (nw >= monthTarget) {
			return { fiMonth: interpolateCrossing(netWorth, target, month), netWorth, target };
		}

		const paying = recurring && (duration.kind !== 'fixed' || month < duration.months);
		nw = nw * (1 + growth) + monthlySavings - (paying ? payment : 0);
	}
	return { fiMonth: null, netWorth, target };
}

function interpolateCrossing(netWorth: number[], target: number[], month: number): number {
	if (month === 0) return 0;
	const gapBefore = netWorth[month - 1] - target[month - 1];
	const gapAfter = netWorth[month] - target[month];
	return month - 1 + gapBefore / (gapBefore - gapAfter);
}

export function retirementDelay(inputs: FIInputs, purchase: Purchase): RetirementDelay {
	const baseline = simulateToFI(inputs);
	const withPurchase = simulateToFI(inputs, purchase);
	const delayMonths =
		baseline.fiMonth === null || withPurchase.fiMonth === null
			? null
			: withPurchase.fiMonth - baseline.fiMonth;
	return { baseline, withPurchase, delayMonths };
}
