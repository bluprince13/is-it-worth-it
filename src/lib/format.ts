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
const percent = new Intl.NumberFormat('en-GB', { style: 'percent', maximumSignificantDigits: 2 });

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
		case 'lifelong':
			return 'for life';
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
