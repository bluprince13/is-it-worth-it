import { describe, expect, it } from 'vitest';
import type { Profile, Purchase } from '$lib/finance/types';
import { futureValue, futureValueOfMonthlySeries } from '$lib/finance/growth';
import { evaluate } from './index';

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
		expect(blocked.map((b) => b.lens.id).sort()).toEqual(['future-value', 'retirement-delay']);
		expect(results.map((r) => r.lens.id)).toEqual([
			'work-hours',
			'net-worth-share',
			'wealth-earn-back'
		]);
	});
});

describe('one-off purchase', () => {
	it('converts to hours of work', () => {
		const work = result(profile, bike, 'work-hours')!;
		expect(work.value).toBeCloseTo(1_200 / (42_000 / (40 * 46.4)));
		expect(work.headline).toBe('1.3 working weeks');
	});

	it("puts the 0.01% rule behind an info link with the user's figure", () => {
		const share = result(profile, bike, 'net-worth-share')!;
		expect(share.sentence).toBe('£1,200 out of £100,000.');
		expect(share.info?.text).toContain('(£10 for you)');
		expect(share.info?.href).toBe('https://ofdollarsanddata.com/climbing-the-wealth-ladder/');
	});

	it('compares with net worth', () => {
		const share = result(profile, bike, 'net-worth-share')!;
		expect(share.headline).toBe('1.2%');
	});

	it('times how long investment returns take to earn it back', () => {
		const earnBack = result(profile, bike, 'wealth-earn-back')!;
		expect(earnBack.value).toBeCloseTo((1_200 / 5_000) * 365.25);
		expect(earnBack.headline).toBe('2.9 months');
	});

	it('shows N/A when the target is already met', () => {
		const rich = { ...profile, netWorth: 1_000_000 };
		const delay = result(rich, bike, 'retirement-delay')!;
		expect(delay.headline).toBe('N/A');
		expect(delay.caption).toBe('net worth already meets the retirement target');
	});

	it('reports when the target is not reached', () => {
		const delay = result({ ...profile, annualSavings: 0, netWorth: 0 }, bike, 'retirement-delay')!;
		expect(delay.headline).toBe('Not reached');
	});
});

describe('recurring purchase', () => {
	it('shows hours of work per year', () => {
		const work = result(profile, netflix({ kind: 'untilFI' }), 'work-hours')!;
		expect(work.value).toBeCloseTo(180 / (42_000 / (40 * 46.4)));
		expect(work.caption).toBe('a year');
	});

	it('shows earn-back as time each year', () => {
		const earnBack = result(profile, netflix({ kind: 'untilFI' }), 'wealth-earn-back')!;
		expect(earnBack.value).toBeCloseTo((180 / 5_000) * 365.25);
		expect(earnBack.headline).toBe('13 days');
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

	it('shows equations that end in the headline figure', () => {
		const threeYears = netflix({ kind: 'fixed', months: 36 });
		const fv = evaluate(profile, threeYears, years).results.find(
			(r) => r.lens.id === 'future-value'
		)!.result;
		expect(fv.working[0]).toMatch(/^Monthly return: \(1 \+ 5%\)\^\(1\/12\) − 1 = 0\.407%$/);
		expect(fv.working[1]).toMatch(/^£15 × \(\(1 \+ 0\.407%\)\^36 − 1\) ÷ 0\.407% = £/);
		expect(fv.working.at(-1)).toMatch(new RegExp(`\\^7 = ${fv.headline.replace('£', '£')}$`));
	});
});
