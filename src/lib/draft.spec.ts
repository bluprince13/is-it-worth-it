import { describe, expect, it } from 'vitest';
import { EXAMPLES, toPurchase } from './draft';

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
