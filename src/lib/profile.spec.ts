import { describe, expect, it } from 'vitest';
import { TYPICAL_PROFILE, withDefaults } from './profile';

describe('withDefaults', () => {
	it('fills every empty field with the typical value and reports it', () => {
		const { profile, defaulted } = withDefaults({ realReturn: 0.05, swr: 0.04 });
		expect(profile).toEqual(TYPICAL_PROFILE);
		expect(defaulted).toEqual(['takeHomePerYear', 'hoursPerWeek', 'annualSavings', 'netWorth']);
	});

	it('keeps entered values, including zero', () => {
		const { profile, defaulted } = withDefaults({
			netWorth: 0,
			takeHomePerYear: 50_000,
			realReturn: 0.03,
			swr: 0.035
		});
		expect(profile.netWorth).toBe(0);
		expect(profile.takeHomePerYear).toBe(50_000);
		expect(profile.realReturn).toBe(0.03);
		expect(defaulted).toEqual(['hoursPerWeek', 'annualSavings']);
	});

	it('treats a cleared field as empty', () => {
		const cleared = { realReturn: undefined, swr: 0.04 } as unknown as Parameters<
			typeof withDefaults
		>[0];
		expect(withDefaults(cleared).defaulted).toContain('realReturn');
	});
});
