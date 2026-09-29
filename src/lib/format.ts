import type { Duration } from './finance/types';

const pounds = (fractionDigits: number) =>
	new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits
	});
const wholePounds = pounds(0);
const pence = pounds(2);
// Two decimal places at most, except that tiny shares keep two significant figures instead of showing 0%.
const percent = new Intl.NumberFormat('en-GB', {
	style: 'percent',
	maximumFractionDigits: 2,
	maximumSignificantDigits: 2,
	roundingPriority: 'morePrecision'
});

export function formatMoney(amount: number): string {
	if (!Number.isFinite(amount)) return '∞';
	return (Number.isInteger(amount) || Math.abs(amount) >= 100 ? wholePounds : pence).format(amount);
}

export function formatPercent(fraction: number): string {
	return percent.format(fraction);
}

export function formatNumber(value: number): string {
	if (Math.abs(value) < 10) return String(Math.round(value * 10) / 10);
	return Math.round(value).toLocaleString('en-GB');
}

function digitsAndFirstPoint(raw: string): string {
	const clean = raw.replace(/[^\d.]/g, '');
	const point = clean.indexOf('.');
	return point === -1
		? clean
		: clean.slice(0, point + 1) + clean.slice(point + 1).replace(/\./g, '');
}

/** Adds thousands separators to a numeric string, keeping any decimal part and a trailing point. */
export function groupNumberString(raw: string): string {
	const clean = digitsAndFirstPoint(raw);
	const [intPart, fracPart] = clean.split('.');
	const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return clean.includes('.') ? `${grouped}.${fracPart}` : grouped;
}

/** Parses a number from an input string, ignoring thousands separators and whitespace. */
export function parseNumberString(raw: string): number | undefined {
	const n = Number(raw.replace(/[,\s]/g, ''));
	return raw.trim() === '' || Number.isNaN(n) ? undefined : n;
}

/**
 * Cleans and groups what was typed into a number input, keeping the caret after the same
 * digit or decimal point it followed.
 */
export function reformatNumberInput(
	raw: string,
	caret: number
): { text: string; caret: number; value: number | undefined } {
	const text = groupNumberString(raw);
	const keptBefore = digitsAndFirstPoint(raw.slice(0, caret)).length;
	let pos = 0;
	for (let kept = 0; pos < text.length && kept < keptBefore; pos++) {
		if (text[pos] !== ',') kept++;
	}
	return { text, caret: pos, value: parseNumberString(text) };
}

function quantity(value: number, unit: string): string {
	const shown = formatNumber(value);
	return `${shown} ${unit}${shown === '1' ? '' : 's'}`;
}

/** Hours of work, expressed in working days/weeks for a given working week. */
export function formatWorkTime(hours: number, hoursPerWeek: number): string {
	const hoursPerDay = hoursPerWeek / 5;
	if (hours < 1) return quantity(Math.max(1, Math.round(hours * 60)), 'minute');
	if (hours < hoursPerDay) return quantity(hours, 'hour');
	if (hours < hoursPerWeek) return quantity(hours / hoursPerDay, 'working day');
	return quantity(hours / hoursPerWeek, 'working week');
}

/** Calendar time, from a number of days. */
export function formatElapsed(days: number): string {
	const hours = days * 24;
	if (hours < 1) return quantity(Math.max(1, Math.round(hours * 60)), 'minute');
	if (days < 1) return quantity(hours, 'hour');
	if (days < 14) return quantity(days, 'day');
	if (days < 60) return quantity(days / 7, 'week');
	if (days < 730) return quantity(days / (365.25 / 12), 'month');
	return quantity(days / 365.25, 'year');
}

export function formatDuration(duration: Duration): string {
	switch (duration.kind) {
		case 'untilFI':
			return 'until you retire';
		case 'fixed':
			return duration.months % 12 === 0
				? `for ${quantity(duration.months / 12, 'year')}`
				: `for ${quantity(duration.months, 'month')}`;
	}
}

const compact = new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency: 'GBP',
	notation: 'compact',
	maximumSignificantDigits: 3
});

export function formatMoneyCompact(amount: number): string {
	return compact.format(amount);
}
