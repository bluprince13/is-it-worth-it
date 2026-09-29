import { describe, expect, it } from 'vitest';
import { PROFILE_SECTIONS, TYPICAL_PROFILE, validateProfile, withDefaults } from './profile';

describe('withDefaults', () => {
	it('fills every empty field with the typical value and reports it', () => {
		const { profile, defaulted } = withDefaults({ realReturn: 0.05 });
		expect(profile).toEqual(TYPICAL_PROFILE);
		expect(defaulted).toEqual([
			'takeHomePerYear',
			'hoursPerWeek',
			'annualSavings',
			'netWorth',
			'retirementTarget'
		]);
	});

	it('keeps entered values, including zero', () => {
		const { profile, defaulted } = withDefaults({
			netWorth: 0,
			takeHomePerYear: 50_000,
			realReturn: 0.03
		});
		expect(profile.netWorth).toBe(0);
		expect(profile.takeHomePerYear).toBe(50_000);
		expect(profile.realReturn).toBe(0.03);
		expect(defaulted).toEqual(['hoursPerWeek', 'annualSavings', 'retirementTarget']);
	});

	it('treats a cleared field as empty', () => {
		const cleared = { realReturn: undefined } as unknown as Parameters<typeof withDefaults>[0];
		expect(withDefaults(cleared).defaulted).toContain('realReturn');
	});
});

describe('validateProfile', () => {
	const valid = { ...TYPICAL_PROFILE };

	it('accepts typical figures', () => {
		expect(validateProfile(valid)).toEqual({});
	});

	it('requires savings below take-home pay', () => {
		expect(validateProfile({ ...valid, annualSavings: 30_000 }).annualSavings).toBe(
			'Must be less than take-home pay (£30,000)'
		);
	});

	it('checks savings against the placeholder pay when pay is empty or invalid', () => {
		const { takeHomePerYear: _, ...noPay } = valid;
		expect(validateProfile({ ...noPay, annualSavings: 31_000 }).annualSavings).toBeDefined();
		expect(
			validateProfile({ ...valid, takeHomePerYear: -1, annualSavings: 31_000 }).annualSavings
		).toBeDefined();
	});

	it.each([
		['takeHomePerYear', 0],
		['hoursPerWeek', 0],
		['hoursPerWeek', 101],
		['annualSavings', -1],
		['netWorth', -1],
		['retirementTarget', 0],
		['realReturn', 1.01],
		['realReturn', -0.01]
	] as const)('rejects %s = %d', (key, value) => {
		expect(validateProfile({ ...valid, [key]: value })[key]).toBeDefined();
	});

	it('accepts the edges of each range', () => {
		expect(validateProfile({ ...valid, hoursPerWeek: 100, realReturn: 0 })).toEqual({});
		expect(validateProfile({ ...valid, realReturn: 1 })).toEqual({});
	});

	it('marks invalid fields unusable instead of using a placeholder', () => {
		const { profile, defaulted, errors } = withDefaults({ ...valid, annualSavings: 40_000 });
		expect(profile.annualSavings).toBeNaN();
		expect(defaulted).toEqual([]);
		expect(errors.annualSavings).toBeDefined();
	});
});

describe('PROFILE_SECTIONS', () => {
	it('cites a source for the default return behind an info note', () => {
		const field = PROFILE_SECTIONS.flatMap((s) => s.fields).find((f) => f.key === 'realReturn');
		expect(field?.info?.href).toMatch(/^https:\/\/www\.jbs\.cam\.ac\.uk\//);
		expect(field?.info?.text).toContain('5.2% for world equities');
		expect(field?.info?.text).toContain('The figure used here is 5%');
	});

	it('links to a pot-sizing calculator behind the retirement target info note', () => {
		const field = PROFILE_SECTIONS.flatMap((s) => s.fields).find(
			(f) => f.key === 'retirementTarget'
		);
		expect(field?.info?.href).toBe(
			'https://retirementcalculators.uk/calculators/fire-number-calculator/'
		);
		expect(field?.info?.text).toBe('can help you estimate the retirement target.');
	});
});
