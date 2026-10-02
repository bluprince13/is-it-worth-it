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
		expect(work.working).toEqual([
			{
				label: 'Working weeks',
				expr: '52 weeks − 5.6 weeks statutory leave',
				result: '46.4 weeks'
			},
			{
				label: 'Hourly rate',
				expr: '£42,000 take-home ÷ (40 h/week × 46.4 weeks)',
				result: '£22.63/hour'
			},
			{ label: 'Hours of work', expr: '£1,200 ÷ £22.63/hour', result: '53.03 hours' },
			{ label: 'In working weeks', expr: '53.03 hours ÷ 40 h/week', result: '1.3 working weeks' }
		]);
	});

	it('converts a small purchase to minutes', () => {
		const work = result(profile, { amount: 5 }, 'work-hours')!;
		expect(work.working.at(-1)).toEqual({
			label: 'In minutes',
			expr: '0.22 hours × 60',
			result: work.headline
		});
	});

	it("puts the 0.01% rule behind an info link with the user's figure", () => {
		const share = result(profile, bike, 'net-worth-share')!;
		expect(share.sentence).toBe('£1,200 out of £100,000.');
		expect(share.info?.text).toContain(
			'a single purchase of up to 0.01% of net worth (£10 for you)'
		);
		expect(share.info?.text).not.toContain('recurring');
		expect(share.info?.linkText).toBe('Nick Maggiulli\'s "0.01% rule"');
		expect(share.info?.href).toBe('https://ofdollarsanddata.com/climbing-the-wealth-ladder/');
	});

	it('compares with net worth', () => {
		const share = result(profile, bike, 'net-worth-share')!;
		expect(share.headline).toBe('1.2%');
		expect(share.working).toEqual([
			{ label: 'Share', expr: '£1,200 ÷ £100,000 net worth', result: '1.2%' }
		]);
	});

	it('times how long investment returns take to earn it back', () => {
		const earnBack = result(profile, bike, 'wealth-earn-back')!;
		expect(earnBack.value).toBeCloseTo((1_200 / 5_000) * 365.25);
		expect(earnBack.headline).toBe('2.9 months');
	});

	it('shows N/A for earn-back when investment returns are zero', () => {
		const earnBack = result({ ...profile, netWorth: 0 }, bike, 'wealth-earn-back')!;
		expect(earnBack.headline).toBe('N/A');
		expect(earnBack.caption).toBe('investment returns are £0 on these figures');
		expect(earnBack.working).toEqual([
			{ label: 'Investment returns a year', expr: '£0 net worth × 5% return', result: '£0' }
		]);
	});

	it('hides the retirement cards when the target is already met', () => {
		const rich = { ...profile, netWorth: 1_000_000 };
		expect(result(rich, bike, 'retirement-delay')).toBeUndefined();
		expect(result(rich, bike, 'future-value')).toBeUndefined();
		expect(result(rich, bike, 'work-hours')).toBeDefined();
	});

	it('shows a return with up to two decimal places in the working', () => {
		const fv = result({ ...profile, realReturn: 0.125 }, bike, 'future-value')!;
		expect(fv.working.at(-1)?.expr).toMatch(/^£1,200 × \(1 \+ 12\.5%\)\^/);
	});

	it('takes a one-off from net worth today', () => {
		const delay = result(profile, bike, 'retirement-delay')!;
		expect(delay.working).toContainEqual({
			label: 'Net worth today',
			expr: '£100,000 − £1,200',
			result: '£98,800'
		});
	});

	it('ends the retirement delay working in the headline', () => {
		const { retirement, results } = evaluate(profile, bike);
		const delay = results.find((r) => r.lens.id === 'retirement-delay')!.result;
		const [without, withIt] = [retirement!.baseline.fiMonth!, retirement!.withPurchase.fiMonth!];
		expect(delay.working.at(-1)).toEqual({
			label: 'Delay',
			expr: `(${Number(withIt.toFixed(2))} − ${Number(without.toFixed(2))}) months × 30.44 days a month`,
			result: delay.headline
		});
	});

	it('reports when the target is not reached', () => {
		const delay = result({ ...profile, annualSavings: 0, netWorth: 0 }, bike, 'retirement-delay')!;
		expect(delay.headline).toBe('Not reached');
	});
});

describe('recurring purchase', () => {
	const wage = 42_000 / (40 * 46.4);

	it('bases hours of work, net worth share and earn-back on the yearly cost', () => {
		for (const duration of [
			{ kind: 'fixed', months: 36 },
			{ kind: 'untilFI' }
		] as Purchase['duration'][]) {
			const purchase = netflix(duration);
			const work = result(profile, purchase, 'work-hours')!;
			expect(work.value).toBeCloseTo(180 / wage);
			expect(work.caption).toBe('a year');
			expect(work.working).toContainEqual({
				label: 'Yearly cost',
				expr: '£15 a month × 12 payments a year',
				result: '£180 a year'
			});
			const share = result(profile, purchase, 'net-worth-share')!;
			expect(share.caption).toBe('of your current net worth a year');
			expect(share.sentence).toBe(
				'The yearly cost of £180 is 0.18% of your current net worth of £100,000.'
			);
			expect(share.info?.text).toMatch(
				/The rule is stated for single purchases, not recurring costs\.$/
			);
			const earnBack = result(profile, purchase, 'wealth-earn-back')!;
			expect(earnBack.caption).toBe('for your investments to earn back one year of the cost');
			expect(earnBack.sentence).toMatch(/^The yearly cost of £180 is /);
		}
	});

	it('hides the until-retirement cards when the target is already met', () => {
		const rich = { ...profile, netWorth: 1_000_000 };
		const purchase = netflix({ kind: 'untilFI' });
		for (const id of ['retirement-delay', 'future-value']) {
			expect(result(rich, purchase, id)).toBeUndefined();
		}
		expect(result(rich, purchase, 'work-hours')).toBeDefined();
		const tenYears = evaluate(rich, purchase, { investYears: 10 }).results;
		expect(tenYears.find((r) => r.lens.id === 'future-value')).toBeUndefined();
	});

	it('keeps fixed-duration cards when the target is already met', () => {
		const rich = { ...profile, netWorth: 1_000_000 };
		const purchase = netflix({ kind: 'fixed', months: 36 });
		expect(result(rich, purchase, 'work-hours')).toBeDefined();
		const tenYears = evaluate(rich, purchase, { investYears: 10 }).results;
		expect(tenYears.find((r) => r.lens.id === 'future-value')).toBeDefined();
	});

	it('shows how an infrequent payment becomes a yearly and monthly cost', () => {
		const insurance: Purchase = {
			amount: 1_000,
			recurrence: { every: 2, unit: 'year' },
			duration: { kind: 'untilFI' }
		};
		const fv = result(profile, insurance, 'future-value')!;
		const yearly = {
			label: 'Yearly cost',
			expr: '£1,000 every 2 years × (1 ÷ 2) payments a year',
			result: '£500 a year'
		};
		expect(fv.working.slice(0, 4)).toEqual([
			{ label: 'Return', result: '5% a year above inflation' },
			yearly,
			{ label: 'Monthly cost', expr: '£500 a year ÷ 12', result: '£41.67 a month' },
			{
				label: 'Months invested',
				expr: 'months to retirement target, simulated',
				result: expect.stringMatching(/^[\d.]+ months$/)
			}
		]);
		const delay = result(profile, insurance, 'retirement-delay')!;
		expect(delay.working).toContainEqual({
			label: 'Saved a month',
			expr: '£12,000 a year ÷ 12 − £41.67 a month',
			result: '£958, until net worth reaches the retirement target'
		});
		expect(result(profile, insurance, 'net-worth-share')!.working).toEqual([
			yearly,
			{ label: 'Share a year', expr: '£500 a year ÷ £100,000 net worth', result: '0.5%' }
		]);
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
		expect(fv.working.slice(3)).toEqual([
			{ label: 'Months invested', expr: '10 years × 12', result: '120 months' },
			{ label: 'Months paid', expr: '3 years × 12', result: '36 months' },
			{ label: 'Monthly return', expr: '(1 + 5%)^(1/12) − 1', result: '0.41%' },
			{
				label: 'Value at last payment',
				expr: '£15 × ((1 + 0.41%)^36 − 1) ÷ 0.41%',
				result: expect.stringMatching(/^£/)
			},
			{
				label: 'Value at end',
				expr: expect.stringMatching(/^£[\d,]+ × \(1 \+ 5%\)\^\(\(120 − 36\) ÷ 12\)$/),
				result: fv.headline
			}
		]);
	});
});

describe('how it is calculated', () => {
	const CONSTANTS = [1, 5, 7, 12, 52, 5.6, 60, 30.44, 365.25];
	const numbers = (text: string) =>
		[...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, '')));
	const purchases: Purchase[] = [
		bike,
		{ amount: 5 },
		netflix({ kind: 'fixed', months: 36 }),
		netflix({ kind: 'fixed', months: 18 }),
		netflix({ kind: 'untilFI' }),
		{ amount: 1_000, recurrence: { every: 2, unit: 'year' }, duration: { kind: 'untilFI' } },
		{ amount: 50, recurrence: { every: 1, unit: 'day' }, duration: { kind: 'fixed', months: 240 } },
		{ amount: 20, recurrence: { every: 2, unit: 'week' }, duration: { kind: 'untilFI' } },
		{ amount: 900, recurrence: { every: 1, unit: 'year' }, duration: { kind: 'fixed', months: 60 } }
	];

	it('uses only entered figures, named constants and earlier results in expressions', () => {
		for (const purchase of purchases) {
			for (const investYears of [null, 10]) {
				for (const { lens, result } of evaluate(profile, purchase, { investYears }).results) {
					const known = new Set([
						...CONSTANTS,
						purchase.amount,
						investYears ?? 1,
						purchase.recurrence?.every ?? 1,
						...(purchase.duration?.kind === 'fixed'
							? [purchase.duration.months, purchase.duration.months / 12]
							: []),
						...Object.values(profile).map((v) => (v! < 1 ? v! * 100 : v!))
					]);
					for (const step of result.working) {
						for (const n of numbers(step.expr ?? '')) {
							expect(known, `${lens.id}: ${n} in "${step.expr}"`).toContain(n);
						}
						numbers(step.result).forEach((n) => known.add(n));
					}
				}
			}
		}
	});
});
