import { describe, expect, it } from 'vitest';
import { hourlyWage, WORKING_WEEKS_PER_YEAR } from './wage';

describe('hourlyWage', () => {
	it('divides salary by hours actually worked', () => {
		expect(hourlyWage(40_000, 40)).toBeCloseTo(40_000 / (40 * WORKING_WEEKS_PER_YEAR));
	});
});
