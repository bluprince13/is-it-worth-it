import { describe, expect, it } from 'vitest';
import { hourlyWage, realHourlyWage, WORKING_WEEKS_PER_YEAR } from './wage';

describe('hourlyWage', () => {
	it('divides take-home by hours actually worked', () => {
		expect(hourlyWage(40_000, 40)).toBeCloseTo(40_000 / (40 * WORKING_WEEKS_PER_YEAR));
	});
});

describe('realHourlyWage', () => {
	it('equals hourlyWage with no commute or work costs', () => {
		expect(realHourlyWage(40_000, 40)).toBe(hourlyWage(40_000, 40));
	});

	it('subtracts work costs and adds commute hours', () => {
		expect(realHourlyWage(40_000, 40, 5, 2_000)).toBeCloseTo(
			38_000 / (45 * WORKING_WEEKS_PER_YEAR)
		);
	});
});
