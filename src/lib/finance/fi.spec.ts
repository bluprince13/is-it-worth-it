import { describe, expect, it } from 'vitest';
import { fundingCapital, retirementDelay, simulateToFI, type FIInputs } from './fi';
import type { Purchase } from './types';

// No growth keeps the arithmetic checkable by hand: target £100k, saving £1k/month.
const flat: FIInputs = {
	netWorth: 0,
	annualSavings: 12_000,
	annualSpend: 4_000,
	realReturn: 0,
	swr: 0.04
};

const monthly = { every: 1, unit: 'month' as const };

describe('simulateToFI', () => {
	it('reaches the FI number', () => {
		expect(simulateToFI(flat).fiMonth).toBeCloseTo(100);
	});

	it('is 0 when already FI', () => {
		expect(simulateToFI({ ...flat, netWorth: 150_000 }).fiMonth).toBe(0);
	});

	it('is null when FI is unreachable', () => {
		expect(simulateToFI({ ...flat, annualSavings: 0 }).fiMonth).toBeNull();
	});

	it('records the path up to FI', () => {
		const result = simulateToFI(flat);
		expect(result.netWorth[50]).toBe(50_000);
		expect(result.target[50]).toBe(100_000);
	});
});

describe('retirementDelay', () => {
	it('delays by the months of savings a one-off costs', () => {
		expect(retirementDelay(flat, { amount: 1_000 }).delayMonths).toBeCloseTo(1);
	});

	it('only reduces savings when the cost stops at FI', () => {
		const purchase: Purchase = { amount: 100, recurrence: monthly, duration: { kind: 'untilFI' } };
		expect(retirementDelay(flat, purchase).withPurchase.fiMonth).toBeCloseTo(100_000 / 900);
	});

	it('also raises the FI number when lifelong', () => {
		const purchase: Purchase = { amount: 100, recurrence: monthly, duration: { kind: 'lifelong' } };
		const { withPurchase } = retirementDelay(flat, purchase);
		expect(withPurchase.target[0]).toBeCloseTo(130_000);
		expect(withPurchase.fiMonth).toBeCloseTo(130_000 / 900);
	});

	it('stops charging after a fixed duration that ends before FI', () => {
		const purchase: Purchase = {
			amount: 100,
			recurrence: monthly,
			duration: { kind: 'fixed', months: 24 }
		};
		expect(retirementDelay(flat, purchase).withPurchase.fiMonth).toBeCloseTo(102.4);
	});

	it('sits between until-FI and lifelong for a fixed duration outlasting FI', () => {
		const base = { amount: 100, recurrence: monthly };
		const fixed = retirementDelay(flat, { ...base, duration: { kind: 'fixed', months: 240 } });
		const untilFI = retirementDelay(flat, { ...base, duration: { kind: 'untilFI' } });
		const lifelong = retirementDelay(flat, { ...base, duration: { kind: 'lifelong' } });
		expect(fixed.delayMonths!).toBeGreaterThan(untilFI.delayMonths!);
		expect(fixed.delayMonths!).toBeLessThan(lifelong.delayMonths!);
	});

	it('shows a sub-month delay for a small one-off with growth', () => {
		const inputs = { ...flat, netWorth: 50_000, realReturn: 0.05, annualSpend: 30_000 };
		const delay = retirementDelay(inputs, { amount: 4 }).delayMonths!;
		expect(delay).toBeGreaterThan(0);
		expect(delay).toBeLessThan(0.1);
	});

	it('is null when FI is unreachable', () => {
		expect(retirementDelay({ ...flat, annualSavings: 0 }, { amount: 10 }).delayMonths).toBeNull();
	});
});

describe('fundingCapital', () => {
	it('is the amount for a one-off', () => {
		expect(fundingCapital({ amount: 1_200 }, 0.04)).toBe(1_200);
	});

	it('is annual cost ÷ SWR when lifelong', () => {
		const netflix: Purchase = { amount: 15, recurrence: monthly, duration: { kind: 'lifelong' } };
		expect(fundingCapital(netflix, 0.04)).toBeCloseTo(4_500);
	});

	it('defaults to lifelong when no duration is given', () => {
		expect(fundingCapital({ amount: 15, recurrence: monthly }, 0.04)).toBeCloseTo(4_500);
	});
});
