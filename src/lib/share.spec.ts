import { describe, expect, it } from 'vitest';
import { DEFAULT_DRAFT, type PurchaseDraft } from './draft';
import type { Profile } from './finance/types';
import { decodeShare, encodeShare } from './share';

const profile: Profile = {
	salaryPerYear: 42_000,
	hoursPerWeek: 37.5,
	annualSavings: 12_000,
	netWorth: 100_000,
	retirementTarget: 600_000,
	realReturn: 0.05
};

const netflix: PurchaseDraft = {
	...DEFAULT_DRAFT,
	amount: 15,
	label: 'Netflix & chill',
	recurring: true,
	every: 1,
	unit: 'month',
	durationKind: 'untilFI'
};

describe('encodeShare', () => {
	it('writes compact params for purchase and profile', () => {
		expect(encodeShare(netflix, profile)).toBe(
			'amt=15&for=Netflix+%26+chill&every=1m&dur=fi&sal=42000&hrs=37.5&sav=12000&nw=100000&tgt=600000&ret=5'
		);
	});

	it('omits recurrence for a one-off and unset profile fields', () => {
		expect(encodeShare({ ...DEFAULT_DRAFT, amount: 1200 }, { realReturn: 0.05 })).toBe(
			'amt=1200&ret=5'
		);
	});
});

describe('decodeShare', () => {
	it('round-trips everything', () => {
		const fixed: PurchaseDraft = {
			...netflix,
			every: 2,
			unit: 'week',
			durationKind: 'fixed',
			durationCount: 18,
			durationUnit: 'month'
		};
		const decoded = decodeShare(encodeShare(fixed, profile));
		expect(decoded.draft).toEqual(fixed);
		expect(decoded.profile).toEqual(profile);
	});

	it('round-trips an investment horizon in years', () => {
		const withYears = { ...netflix, investHorizon: 'years' as const, investYears: 15 };
		expect(encodeShare(withYears, profile)).toContain('inv=15');
		expect(decodeShare(encodeShare(withYears, profile)).draft).toEqual(withYears);
	});

	it('round-trips until-retirement', () => {
		const untilFI = { ...netflix, durationKind: 'untilFI' as const };
		expect(decodeShare(encodeShare(untilFI, profile)).draft).toEqual(untilFI);
	});

	it('returns nothing for an empty query', () => {
		expect(decodeShare('')).toEqual({ draft: undefined, profile: undefined });
	});

	it('ignores malformed values', () => {
		const { draft, profile } = decodeShare('amt=abc&every=0m&dur=forever&nw=lots&hrs=40');
		expect(draft).toEqual(DEFAULT_DRAFT);
		expect(profile).toEqual({ hoursPerWeek: 40 });
	});
});
