import { describe, expect, it } from 'vitest';
import { annualCost, monthlyCost, paymentsPerYear, remainingMonths } from './recurrence';

describe('paymentsPerYear', () => {
	it.each([
		[{ every: 1, unit: 'day' as const }, 365.25],
		[{ every: 1, unit: 'week' as const }, 365.25 / 7],
		[{ every: 2, unit: 'week' as const }, 365.25 / 14],
		[{ every: 1, unit: 'month' as const }, 12],
		[{ every: 3, unit: 'month' as const }, 4],
		[{ every: 1, unit: 'year' as const }, 1]
	])('%o → %d', (recurrence, expected) => {
		expect(paymentsPerYear(recurrence)).toBeCloseTo(expected);
	});
});

describe('annualCost / monthlyCost', () => {
	it('annualises a monthly subscription', () => {
		const netflix = { amount: 15, recurrence: { every: 1, unit: 'month' as const } };
		expect(annualCost(netflix)).toBe(180);
		expect(monthlyCost(netflix)).toBe(15);
	});

	it('is zero for a one-off', () => {
		expect(annualCost({ amount: 1200 })).toBe(0);
	});
});

describe('remainingMonths', () => {
	it('counts down a fixed duration and stops at zero', () => {
		expect(remainingMonths({ kind: 'fixed', months: 36 }, 10, 999)).toBe(26);
		expect(remainingMonths({ kind: 'fixed', months: 36 }, 40, 999)).toBe(0);
	});

	it('runs until FI', () => {
		expect(remainingMonths({ kind: 'untilFI' }, 0, 100)).toBe(100);
		expect(remainingMonths({ kind: 'untilFI' }, 120, 100)).toBe(0);
	});
});
