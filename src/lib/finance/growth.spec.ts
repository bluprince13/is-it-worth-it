import { describe, expect, it } from 'vitest';
import {
	capitalToFund,
	futureValue,
	futureValueOfMonthlySeries,
	monthlyGrowthRate
} from './growth';

describe('monthlyGrowthRate', () => {
	it('compounds back to the annual rate', () => {
		expect(Math.pow(1 + monthlyGrowthRate(0.05), 12)).toBeCloseTo(1.05, 12);
	});
});

describe('futureValue', () => {
	it('compounds a lump sum', () => {
		expect(futureValue(1000, 0.05, 10)).toBeCloseTo(1628.89, 2);
	});
});

describe('futureValueOfMonthlySeries', () => {
	it('is a plain sum at 0%', () => {
		expect(futureValueOfMonthlySeries(100, 0, 12)).toBe(1200);
	});

	it('matches month-by-month compounding', () => {
		const i = monthlyGrowthRate(0.05);
		let balance = 0;
		for (let m = 0; m < 120; m++) balance = balance * (1 + i) + 100;
		expect(futureValueOfMonthlySeries(100, 0.05, 120)).toBeCloseTo(balance, 6);
	});
});

describe('capitalToFund', () => {
	it('is annual cost ÷ SWR when lifelong', () => {
		expect(capitalToFund(15, 0.04, Infinity)).toBeCloseTo(4500, 6);
	});

	it('converges to the lifelong figure for long durations', () => {
		const long = capitalToFund(15, 0.04, 100 * 12);
		expect(long).toBeLessThan(4500);
		expect(long).toBeGreaterThan(4500 * 0.95);
	});

	it('is the plain sum at 0% SWR', () => {
		expect(capitalToFund(15, 0, 12)).toBe(180);
	});

	it('is zero with nothing left to pay', () => {
		expect(capitalToFund(15, 0.04, 0)).toBe(0);
	});
});
