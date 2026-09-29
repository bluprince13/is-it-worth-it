import { describe, expect, it } from 'vitest';
import type { Profile, Purchase } from '$lib/finance/types';
import { evaluate } from './index';
import { summarise } from './summary';

const profile: Profile = {
	takeHomePerYear: 42_000,
	hoursPerWeek: 40,
	netWorth: 100_000,
	annualSavings: 12_000,
	realReturn: 0.05,
	swr: 0.04
};

const bike: Purchase = { amount: 1_200 };
const netflix = (duration: Purchase['duration']): Purchase => ({
	amount: 15,
	recurrence: { every: 1, unit: 'month' },
	duration
});

function result(profile: Profile, purchase: Purchase, id: string) {
	return evaluate(profile, purchase).results.find((r) => r.lens.id === id)?.result;
}

describe('evaluate', () => {
	it('returns nothing for a zero amount', () => {
		expect(evaluate(profile, { amount: 0 })).toEqual({ results: [], locked: [] });
	});

	it('locks lenses whose profile fields are missing', () => {
		const { results, locked } = evaluate({ realReturn: 0.05, swr: 0.04 }, bike);
		expect(results).toEqual([]);
		expect(locked.find((l) => l.lens.id === 'work-hours')?.missing).toEqual([
			'takeHomePerYear',
			'hoursPerWeek'
		]);
	});

	it('skips recurring-only lenses for a one-off', () => {
		const ids = evaluate(profile, bike).results.map((r) => r.lens.id);
		expect(ids).not.toContain('capital-needed');
	});
});

describe('one-off purchase', () => {
	it('converts to hours of work', () => {
		const work = result(profile, bike, 'work-hours')!;
		expect(work.value).toBeCloseTo(1_200 / (42_000 / (40 * 46.4)));
		expect(work.headline).toBe('1.3 working weeks');
	});

	it('compares with net worth', () => {
		const share = result(profile, bike, 'net-worth-share')!;
		expect(share.headline).toBe('1.2%');
	});

	it('times how long savings and investments take to earn it back', () => {
		const earnBack = result(profile, bike, 'wealth-earn-back')!;
		expect(earnBack.value).toBeCloseTo((1_200 / 17_000) * 365.25);
		expect(earnBack.headline).toBe('3.7 weeks');
	});

	it('shows lost safe spending when already FI', () => {
		const rich = { ...profile, netWorth: 1_000_000 };
		const delay = result(rich, bike, 'retirement-delay')!;
		expect(delay.value).toBeCloseTo(48);
		expect(delay.caption).toContain('less to spend');
	});

	it('reports when FI is out of reach', () => {
		const delay = result({ ...profile, annualSavings: 0, netWorth: 0 }, bike, 'retirement-delay')!;
		expect(delay.headline).toBe('Out of reach');
	});
});

describe('recurring purchase', () => {
	it('prices the capital to fund it for life', () => {
		expect(result(profile, netflix({ kind: 'lifelong' }), 'capital-needed')!.value).toBeCloseTo(
			4_500
		);
	});

	it('has no capital figure when it stops at retirement', () => {
		expect(result(profile, netflix({ kind: 'untilFI' }), 'capital-needed')).toBeUndefined();
	});

	it('delays retirement more when lifelong than until FI', () => {
		const lifelong = result(profile, netflix({ kind: 'lifelong' }), 'retirement-delay')!;
		const untilFI = result(profile, netflix({ kind: 'untilFI' }), 'retirement-delay')!;
		expect(untilFI.value).toBeGreaterThan(0);
		expect(lifelong.value).toBeGreaterThan(untilFI.value);
	});

	it('shows hours of work per year', () => {
		const work = result(profile, netflix({ kind: 'lifelong' }), 'work-hours')!;
		expect(work.value).toBeCloseTo(180 / (42_000 / (40 * 46.4)));
		expect(work.caption).toBe('of work a year');
	});

	it('shows earn-back as time each year', () => {
		const earnBack = result(profile, netflix({ kind: 'lifelong' }), 'wealth-earn-back')!;
		expect(earnBack.value).toBeCloseTo((180 / 17_000) * 365.25);
		expect(earnBack.headline).toBe('3.9 days');
	});
});

describe('summarise', () => {
	it('names the purchase and combines work time with retirement delay', () => {
		const purchase = { ...netflix({ kind: 'lifelong' }), label: 'Netflix' };
		const sentence = summarise(evaluate(profile, purchase).results, purchase);
		expect(sentence).toMatch(
			/^Netflix costs .+ of work a year and would delay retirement by .+\.$/
		);
	});

	it('falls back to "This" and to what is available', () => {
		const partial: Profile = { netWorth: 100_000, realReturn: 0.05, swr: 0.04 };
		expect(summarise(evaluate(partial, bike).results, bike)).toBe(
			'This is 1.2% of your net worth.'
		);
	});

	it('is null when nothing can be said', () => {
		expect(summarise(evaluate({ realReturn: 0.05, swr: 0.04 }, bike).results, bike)).toBeNull();
	});
});
