export type Unit = 'day' | 'week' | 'month' | 'year';

export interface Recurrence {
	every: number;
	unit: Unit;
}

export type Duration = { kind: 'fixed'; months: number } | { kind: 'untilFI' };

export interface Purchase {
	amount: number;
	recurrence?: Recurrence;
	duration?: Duration;
	label?: string;
}

export interface Profile {
	salaryPerYear?: number;
	hoursPerWeek?: number;
	netWorth?: number;
	annualSavings?: number;
	retirementTarget?: number;
	realReturn: number;
}
