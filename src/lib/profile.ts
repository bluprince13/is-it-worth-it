import type { Profile } from './finance/types';

const STORAGE_KEY = 'is-it-worth-it:profile';

export const DEFAULT_PROFILE: Profile = { realReturn: 0.05, swr: 0.04 };

/**
 * Typical UK full-time employee, used for any field left empty. Take-home is the
 * ONS April 2025 median full-time salary (£39,039) after tax, NI and 5% pension.
 */
export const TYPICAL_PROFILE: Required<Profile> = {
	takeHomePerYear: 30_000,
	hoursPerWeek: 37.5,
	annualSavings: 3_000,
	netWorth: 20_000,
	...DEFAULT_PROFILE
};

export function withDefaults(profile: Profile): {
	profile: Required<Profile>;
	defaulted: (keyof Profile)[];
} {
	const merged = { ...TYPICAL_PROFILE };
	const defaulted: (keyof Profile)[] = [];
	for (const key of Object.keys(TYPICAL_PROFILE) as (keyof Profile)[]) {
		const value = profile[key];
		if (typeof value === 'number' && Number.isFinite(value)) merged[key] = value;
		else defaulted.push(key);
	}
	return { profile: merged, defaulted };
}

export type FieldKind = 'money' | 'hours' | 'percent';

export interface FieldSpec {
	key: keyof Profile;
	label: string;
	hint?: string;
	kind: FieldKind;
}

export const PROFILE_SECTIONS: { title: string; fields: FieldSpec[] }[] = [
	{
		title: 'Income',
		fields: [
			{
				key: 'takeHomePerYear',
				label: 'Take-home pay per year',
				hint: 'After tax, NI and pension',
				kind: 'money'
			},
			{ key: 'hoursPerWeek', label: 'Hours worked per week', kind: 'hours' },
			{
				key: 'annualSavings',
				label: 'Savings per year',
				hint: 'Whatever you take home and don’t save counts as spending',
				kind: 'money'
			}
		]
	},
	{
		title: 'Wealth',
		fields: [{ key: 'netWorth', label: 'Net worth', hint: 'Invested or investable', kind: 'money' }]
	},
	{
		title: 'Assumptions',
		fields: [
			{
				key: 'realReturn',
				label: 'Investment return',
				hint: 'Assumed, per year, above inflation',
				kind: 'percent'
			},
			{
				key: 'swr',
				label: 'Withdrawal rate',
				hint: 'Assumed share of your investments withdrawn each year in retirement',
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
