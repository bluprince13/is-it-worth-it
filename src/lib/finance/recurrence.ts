import type { Duration, Purchase, Recurrence, Unit } from './types';

const DAYS_PER_YEAR = 365.25;

const UNITS_PER_YEAR: Record<Unit, number> = {
	day: DAYS_PER_YEAR,
	week: DAYS_PER_YEAR / 7,
	month: 12,
	year: 1
};

export function paymentsPerYear(recurrence: Recurrence): number {
	return UNITS_PER_YEAR[recurrence.unit] / recurrence.every;
}

export function isRecurring(purchase: Purchase): boolean {
	return purchase.recurrence !== undefined;
}

export function annualCost(purchase: Purchase): number {
	return purchase.recurrence ? purchase.amount * paymentsPerYear(purchase.recurrence) : 0;
}

export function monthlyCost(purchase: Purchase): number {
	return annualCost(purchase) / 12;
}

/** Months of payments left after `elapsed` months, given the month FI is reached. */
export function remainingMonths(duration: Duration, elapsed: number, fiMonth: number): number {
	switch (duration.kind) {
		case 'fixed':
			return Math.max(0, duration.months - elapsed);
		case 'untilFI':
			return Math.max(0, fiMonth - elapsed);
		case 'lifelong':
			return Infinity;
	}
}
