import { describe, expect, it } from 'vitest';
import {
	formatDuration,
	formatElapsed,
	formatMoney,
	formatMoneyCompact,
	formatPercent,
	formatWorkTime,
	groupNumberString,
	parseNumberString,
	reformatNumberInput
} from './format';

describe('formatMoney', () => {
	it.each([
		[15, '£15'],
		[3.5, '£3.50'],
		[1234.56, '£1,235'],
		[Infinity, '∞']
	])('%d → %s', (amount, expected) => {
		expect(formatMoney(amount)).toBe(expected);
	});
});

describe('formatPercent', () => {
	it('keeps two decimal places at most', () => {
		expect(formatPercent(0.125)).toBe('12.5%');
		expect(formatPercent(0.052549)).toBe('5.25%');
		expect(formatPercent(0.05)).toBe('5%');
	});

	it('keeps two significant figures for tiny shares', () => {
		expect(formatPercent(0.00018)).toBe('0.018%');
	});
});

describe('formatWorkTime', () => {
	it.each([
		[0.25, '15 minutes'],
		[1, '1 hour'],
		[3.5, '3.5 hours'],
		[16, '2 working days'],
		[60, '1.5 working weeks']
	])('%d hours → %s', (hours, expected) => {
		expect(formatWorkTime(hours, 40)).toBe(expected);
	});
});

describe('formatElapsed', () => {
	it.each([
		[0.5 / 24, '30 minutes'],
		[0.25, '6 hours'],
		[3, '3 days'],
		[21, '3 weeks'],
		[365.25 / 2, '6 months'],
		[365.25 * 12, '12 years']
	])('%d days → %s', (days, expected) => {
		expect(formatElapsed(days)).toBe(expected);
	});
});

describe('formatDuration', () => {
	it('describes duration', () => {
		expect(formatDuration({ kind: 'fixed', months: 36 })).toBe('for 3 years');
		expect(formatDuration({ kind: 'fixed', months: 18 })).toBe('for 18 months');
		expect(formatDuration({ kind: 'untilFI' })).toBe('until you retire');
	});
});

describe('formatMoneyCompact', () => {
	it('abbreviates thousands and millions', () => {
		expect(formatMoneyCompact(750_000)).toBe('£750k');
		expect(formatMoneyCompact(1_250_000)).toBe('£1.25m');
	});
});

describe('groupNumberString', () => {
	it.each([
		['', ''],
		['1000', '1,000'],
		['1000000', '1,000,000'],
		['100000', '100,000'],
		['12.5', '12.5'],
		['12.', '12.'],
		['1234.5', '1,234.5'],
		['1234.56', '1,234.56'],
		['£1,500x', '1,500'],
		['1.2.3', '1.23']
	])('%s → %s', (raw, expected) => {
		expect(groupNumberString(raw)).toBe(expected);
	});
});

describe('parseNumberString', () => {
	it.each([
		['', undefined],
		['1000', 1000],
		['1,000', 1000],
		['1,000,000', 1_000_000],
		['12.5', 12.5],
		['12.', 12],
		[' 1,000 ', 1000]
	])('%s → %s', (raw, expected) => {
		expect(parseNumberString(raw)).toBe(expected);
	});
});

describe('reformatNumberInput', () => {
	it.each([
		['12.', 3, '12.', 3, 12],
		['12.5', 4, '12.5', 4, 12.5],
		['.5', 2, '.5', 2, 0.5],
		['1000', 4, '1,000', 5, 1000],
		['1000', 1, '1,000', 1, 1000],
		['1500x', 5, '1,500', 5, 1500],
		['£1,500', 6, '1,500', 5, 1500],
		['1x500', 2, '1,500', 1, 1500],
		['1.2.3', 5, '1.23', 4, 1.23],
		['x', 1, '', 0, undefined]
	])('%s with caret at %i → %s, caret %i, value %s', (raw, caret, text, newCaret, value) => {
		expect(reformatNumberInput(raw, caret)).toEqual({ text, caret: newCaret, value });
	});
});
