import { describe, expect, it } from 'vitest';
import { retirementDelay, type FIInputs } from '$lib/finance/fi';
import { buildRetirementSeries, valueAt } from './retirementSeries';

const flat: FIInputs = {
	netWorth: 0,
	annualSavings: 12_000,
	target: 100_000,
	realReturn: 0,
	swr: 0.04
};

describe('valueAt', () => {
	it('interpolates between months', () => {
		expect(valueAt([0, 10, 20], 1.5)).toBe(15);
	});

	it('holds the last value past the end', () => {
		expect(valueAt([0, 10], 5)).toBe(10);
	});
});

describe('buildRetirementSeries', () => {
	it('ends each path on the target at its FI month', () => {
		const series = buildRetirementSeries(retirementDelay(flat, { amount: 1_500 }))!;
		expect(series.fiWithout).toBeCloseTo(100);
		expect(series.fiWith).toBeCloseTo(101.5);
		expect(series.with.at(-1)).toEqual({ month: series.fiWith, value: 100_000 });
		expect(series.sameTarget).toBe(true);
	});

	it('flags a raised target for a lifelong cost', () => {
		const lifelong = retirementDelay(flat, {
			amount: 100,
			recurrence: { every: 1, unit: 'month' },
			duration: { kind: 'lifelong' }
		});
		const series = buildRetirementSeries(lifelong)!;
		expect(series.sameTarget).toBe(false);
		expect(series.targetWith[0].value).toBeCloseTo(130_000);
	});

	it('is null when already FI or out of reach', () => {
		expect(
			buildRetirementSeries(retirementDelay({ ...flat, netWorth: 200_000 }, { amount: 1 }))
		).toBeNull();
		expect(
			buildRetirementSeries(retirementDelay({ ...flat, annualSavings: 0 }, { amount: 1 }))
		).toBeNull();
	});
});
