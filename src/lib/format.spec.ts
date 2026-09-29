import { describe, expect, it } from 'vitest';
import {
	formatDuration,
	formatElapsed,
	formatMoney,
	formatPercent,
	formatRecurrence,
	formatWorkTime
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
	it('keeps two significant figures', () => {
		expect(formatPercent(0.00018)).toBe('0.018%');
		expect(formatPercent(0.123)).toBe('12%');
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

describe('formatRecurrence / formatDuration', () => {
	it('describes frequency', () => {
		expect(formatRecurrence({ every: 1, unit: 'month' })).toBe('a month');
		expect(formatRecurrence({ every: 2, unit: 'week' })).toBe('every 2 weeks');
	});

	it('describes duration', () => {
		expect(formatDuration({ kind: 'fixed', months: 36 })).toBe('for 3 years');
		expect(formatDuration({ kind: 'fixed', months: 18 })).toBe('for 18 months');
		expect(formatDuration({ kind: 'untilFI' })).toBe('until you retire');
		expect(formatDuration({ kind: 'lifelong' })).toBe('for life');
	});
});
