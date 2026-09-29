import { describe, expect, it } from 'vitest';
import { retirementDelay, simulateToFI, type FIInputs } from './fi';
import type { Purchase } from './types';

// No growth keeps the arithmetic checkable by hand: target £100k, saving £1k/month.
const flat: FIInputs = {
	netWorth: 0,
	annualSavings: 12_000,
	target: 100_000,
	realReturn: 0
};

const monthly = { every: 1, unit: 'month' as const };

describe('simulateToFI', () => {
	it('reaches the target', () => {
		expect(simulateToFI(flat).fiMonth).toBeCloseTo(100);
	});

	it('is 0 when the target is already met', () => {
		expect(simulateToFI({ ...flat, netWorth: 150_000 }).fiMonth).toBe(0);
	});

	it('is null when the target is unreachable', () => {
		expect(simulateToFI({ ...flat, annualSavings: 0 }).fiMonth).toBeNull();
	});

	it('records the path up to the target', () => {
		expect(simulateToFI(flat).netWorth[50]).toBe(50_000);
	});
});

describe('retirementDelay', () => {
	it('delays by the months of savings a one-off costs', () => {
		expect(retirementDelay(flat, { amount: 1_000 }).delayMonths).toBeCloseTo(1);
	});

	it('takes a recurring cost out of savings until the target', () => {
		const purchase: Purchase = { amount: 100, recurrence: monthly, duration: { kind: 'untilFI' } };
		expect(retirementDelay(flat, purchase).withPurchase.fiMonth).toBeCloseTo(100_000 / 900);
	});

	it('stops charging after a fixed duration that ends before the target', () => {
		const purchase: Purchase = {
			amount: 100,
			recurrence: monthly,
			duration: { kind: 'fixed', months: 24 }
		};
		expect(retirementDelay(flat, purchase).withPurchase.fiMonth).toBeCloseTo(102.4);
	});

	it('shows a sub-month delay for a small one-off with growth', () => {
		const inputs = { ...flat, netWorth: 50_000, realReturn: 0.05, target: 750_000 };
		const delay = retirementDelay(inputs, { amount: 4 }).delayMonths!;
		expect(delay).toBeGreaterThan(0);
		expect(delay).toBeLessThan(0.1);
	});

	it('is null when the target is unreachable', () => {
		expect(retirementDelay({ ...flat, annualSavings: 0 }, { amount: 10 }).delayMonths).toBeNull();
	});
});
