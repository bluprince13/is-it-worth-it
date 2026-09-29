import type { Severity } from './types';

type Bands = readonly [noticeable: number, significant: number, major: number];

export const THRESHOLDS = {
	workHours: [1, 8, 40],
	netWorthShare: [0.0001, 0.001, 0.01],
	days: [1, 7, 30],
	incomeShare: [0.01, 0.1, 0.5],
	spendShare: [0.01, 0.05, 0.1]
} as const satisfies Record<string, Bands>;

export function severity(value: number, [noticeable, significant, major]: Bands): Severity {
	if (value >= major) return 3;
	if (value >= significant) return 2;
	if (value >= noticeable) return 1;
	return 0;
}

export const SEVERITY_LABELS: Record<Severity, string> = {
	0: 'Trivial',
	1: 'Noticeable',
	2: 'Significant',
	3: 'Major'
};
