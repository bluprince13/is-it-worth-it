import { describe, expect, it } from 'vitest';
import { annualSpend } from './spend';

describe('annualSpend', () => {
	it('is take-home pay minus savings', () => {
		expect(
			annualSpend({ takeHomePerYear: 42_000, annualSavings: 12_000, realReturn: 0, swr: 0 })
		).toBe(30_000);
	});

	it('is unknown without both inputs', () => {
		expect(annualSpend({ takeHomePerYear: 42_000, realReturn: 0, swr: 0 })).toBeUndefined();
	});
});
