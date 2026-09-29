import type { Profile } from './finance/types';

const STORAGE_KEY = 'is-it-worth-it:profile';

export const DEFAULT_PROFILE: Profile = { realReturn: 0.05, swr: 0.04 };

export type FieldKind = 'money' | 'hours' | 'percent' | 'years';

export interface FieldSpec {
	key: keyof Profile;
	label: string;
	hint?: string;
	kind: FieldKind;
}

export const PROFILE_SECTIONS: { title: string; fields: FieldSpec[] }[] = [
	{
		title: 'Work',
		fields: [
			{
				key: 'takeHomePerYear',
				label: 'Take-home pay per year',
				hint: 'After tax, NI and pension',
				kind: 'money'
			},
			{ key: 'hoursPerWeek', label: 'Hours worked per week', kind: 'hours' },
			{
				key: 'commuteHoursPerWeek',
				label: 'Commute hours per week',
				hint: 'Optional, for your real hourly wage',
				kind: 'hours'
			},
			{
				key: 'workCostsPerYear',
				label: 'Cost of going to work per year',
				hint: 'Travel, lunches, work clothes',
				kind: 'money'
			}
		]
	},
	{
		title: 'Money',
		fields: [
			{ key: 'netWorth', label: 'Net worth', hint: 'Invested or investable', kind: 'money' },
			{ key: 'annualSavings', label: 'Savings per year', kind: 'money' },
			{ key: 'annualSpend', label: 'Spending per year', hint: 'Everything, all in', kind: 'money' },
			{
				key: 'monthlyFunBudget',
				label: 'Fun money per month',
				hint: 'Your guilt-free budget',
				kind: 'money'
			},
			{
				key: 'age',
				label: 'Age',
				hint: 'Optional, to show the age you could retire',
				kind: 'years'
			}
		]
	},
	{
		title: 'Assumptions',
		fields: [
			{
				key: 'realReturn',
				label: 'Investment return',
				hint: 'Per year, above inflation',
				kind: 'percent'
			},
			{
				key: 'swr',
				label: 'Safe withdrawal rate',
				hint: 'Share of your pot you can spend each year in retirement',
				kind: 'percent'
			}
		]
	}
];

export const FIELD_LABELS = Object.fromEntries(
	PROFILE_SECTIONS.flatMap((s) => s.fields.map((f) => [f.key, f.label]))
) as Record<keyof Profile, string>;

export function loadProfile(): Profile {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
	} catch {
		// Storage can be unavailable (private mode, blocked site data); fall back to defaults.
	}
	return { ...DEFAULT_PROFILE };
}

export function saveProfile(profile: Profile): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
	} catch {
		// See loadProfile.
	}
}
