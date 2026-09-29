import { describe, expect, it } from 'vitest';
import type { Profile, Purchase } from '$lib/finance/types';
import { futureValue, futureValueOfMonthlySeries } from '$lib/finance/growth';
import { evaluate } from './index';
import { summarise } from './summary';

const profile: Profile = {
	takeHomePerYear: 42_000,
	hoursPerWeek: 40,
	netWorth: 100_000,
	annualSavings: 12_000,
	retirementTarget: 750_000,
	realReturn: 0.05
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
		expect(evaluate(profile, { amount: 0 })).toEqual({ results: [], blocked: [] });
	});

	it('blocks lenses whose profile fields are missing', () => {
		const { results, blocked } = evaluate({ realReturn: 0.05 }, bike);
		expect(results).toEqual([]);
		expect(blocked.find((b) => b.lens.id === 'work-hours')?.invalid).toEqual([
			'takeHomePerYear',
			'hoursPerWeek'
		]);
	});

	it('blocks only the lenses that use an invalid field', () => {
		const { results, blocked } = evaluate({ ...profile, annualSavings: NaN }, bike);
		expect(blocked.map((b) => b.lens.id).sort()).toEqual([
			'future-value',
			'retirement-delay',
			'wealth-earn-back'
		]);
		expect(results.map((r) => r.lens.id)).toEqual(['work-hours', 'net-worth-share']);
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

	it('shows N/A when the target is already met', () => {
		const rich = { ...profile, netWorth: 1_000_000 };
		const delay = result(rich, bike, 'retirement-delay')!;
		expect(delay.headline).toBe('N/A');
		expect(delay.caption).toBe('net worth already meets the retirement target');
		expect(summarise(evaluate(rich, bike).results, bike)).not.toContain('retirement');
	});

	it('reports when the target is not reached', () => {
		const delay = result({ ...profile, annualSavings: 0, netWorth: 0 }, bike, 'retirement-delay')!;
		expect(delay.headline).toBe('Not reached');
	});
});

describe('recurring purchase', () => {
	it('delays retirement the same whether lifelong or until the target', () => {
		const lifelong = result(profile, netflix({ kind: 'lifelong' }), 'retirement-delay')!;
		const untilFI = result(profile, netflix({ kind: 'untilFI' }), 'retirement-delay')!;
		expect(untilFI.value).toBeGreaterThan(0);
		expect(lifelong.value).toBeCloseTo(untilFI.value);
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
			/^Netflix costs .+ of work a year and would delay reaching your retirement target by .+\.$/
		);
	});

	it('falls back to "This" and to what is available', () => {
		const partial: Profile = { netWorth: 100_000, realReturn: 0.05 };
		expect(summarise(evaluate(partial, bike).results, bike)).toBe(
			'This is 1.2% of your net worth.'
		);
	});

	it('is null when nothing can be said', () => {
		expect(summarise(evaluate({ realReturn: 0.05 }, bike).results, bike)).toBeNull();
	});
});

describe('invested instead', () => {
	const years = { investYears: 10 };

	it('compounds a one-off over a chosen number of years', () => {
		const fv = evaluate(profile, bike, years).results.find((r) => r.lens.id === 'future-value')!;
		expect(fv.result.value).toBeCloseTo(futureValue(1_200, 0.05, 10));
		expect(fv.result.caption).toBe('after 10 years');
	});

	it('needs only the return when a number of years is chosen', () => {
		const partial: Profile = { realReturn: 0.05 };
		const ids = evaluate(partial, bike, years).results.map((r) => r.lens.id);
		expect(ids).toEqual(['future-value']);
	});

	it('keeps compounding after a fixed duration ends', () => {
		const threeYears = netflix({ kind: 'fixed', months: 36 });
		const fv = evaluate(profile, threeYears, years).results.find(
			(r) => r.lens.id === 'future-value'
		)!;
		const expected = futureValueOfMonthlySeries(15, 0.05, 36) * futureValue(1, 0.05, 7);
		expect(fv.result.value).toBeCloseTo(expected);
	});

	it('stops until-retirement payments at the target date but not lifelong ones', () => {
		const long = { investYears: 60 };
		const value = (duration: Purchase['duration']) =>
			evaluate(profile, netflix(duration), long).results.find((r) => r.lens.id === 'future-value')!
				.result.value;
		expect(value({ kind: 'lifelong' })).toBeGreaterThan(value({ kind: 'untilFI' }));
	});
});
