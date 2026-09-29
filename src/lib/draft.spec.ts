import { describe, expect, it } from 'vitest';
import { EXAMPLES, investYearsOption, toPurchase, validateDraft } from './draft';

describe('EXAMPLES', () => {
	it('each converts to a valid purchase', () => {
		for (const example of EXAMPLES) {
			const purchase = toPurchase(example);
			expect(purchase.amount).toBeGreaterThan(0);
			expect(purchase.label).toBe(example.label);
			expect(purchase.recurrence === undefined).toBe(!example.recurring);
		}
	});
});

describe('toPurchase', () => {
	it('converts a fixed duration in years to months', () => {
		const purchase = toPurchase({
			...EXAMPLES[1],
			durationKind: 'fixed',
			durationCount: 3,
			durationUnit: 'year'
		});
		expect(purchase.duration).toEqual({ kind: 'fixed', months: 36 });
	});
});

describe('validateDraft', () => {
	const recurring = { ...EXAMPLES[1], durationKind: 'fixed' as const, durationCount: 3 };

	it('accepts valid input and an empty amount', () => {
		expect(validateDraft(recurring)).toEqual({});
		expect(validateDraft({ ...recurring, amount: undefined })).toEqual({});
	});

	it('rejects a zero or negative amount', () => {
		expect(validateDraft({ ...recurring, amount: 0 }).amount).toBeDefined();
		expect(validateDraft({ ...recurring, amount: -5 }).amount).toBeDefined();
	});

	it('requires whole numbers of 1 or more for frequency and duration', () => {
		expect(validateDraft({ ...recurring, every: 0 }).every).toBeDefined();
		expect(validateDraft({ ...recurring, every: 1.5 }).every).toBeDefined();
		expect(validateDraft({ ...recurring, durationCount: 0 }).durationCount).toBeDefined();
	});

	it('ignores recurrence fields for a one-off', () => {
		expect(validateDraft({ ...recurring, recurring: false, every: 0 })).toEqual({});
	});
});

describe('investment horizon', () => {
	it('is the target date by default', () => {
		expect(investYearsOption(EXAMPLES[0])).toBeNull();
	});

	it('uses whole years when chosen, and rejects anything else', () => {
		const years = { ...EXAMPLES[0], investHorizon: 'years' as const, investYears: 15 };
		expect(investYearsOption(years)).toBe(15);
		expect(investYearsOption({ ...years, investYears: 0 })).toBeUndefined();
		expect(validateDraft({ ...years, investYears: 2.5 }).investYears).toBeDefined();
	});
});
