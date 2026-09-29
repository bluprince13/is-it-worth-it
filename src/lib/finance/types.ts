export type Unit = 'day' | 'week' | 'month' | 'year';

export interface Recurrence {
	every: number;
	unit: Unit;
}

export type Duration =
	{ kind: 'fixed'; months: number } | { kind: 'untilFI' } | { kind: 'lifelong' };

export interface Purchase {
	amount: number;
	recurrence?: Recurrence;
	duration?: Duration;
	label?: string;
	uses?: number;
	hoursSaved?: number;
}

export interface Profile {
	takeHomePerYear?: number;
	hoursPerWeek?: number;
	commuteHoursPerWeek?: number;
	workCostsPerYear?: number;
	netWorth?: number;
	annualSavings?: number;
	annualSpend?: number;
	age?: number;
	realReturn: number;
	swr: number;
}
