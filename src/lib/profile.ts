import type { Profile } from './finance/types';
import { formatMoney } from './format';

const STORAGE_KEY = 'is-it-worth-it:profile';

export const DEFAULT_PROFILE: Profile = { realReturn: 0.05, swr: 0.04 };

/**
 * Typical UK full-time employee, used for any field left empty. Take-home is the
 * ONS April 2025 median full-time salary (£39,039) after tax, NI and 5% pension.
 * The target is 25× the £27,000 left after saving, the conventional 4% rule.
 */
export const TYPICAL_PROFILE: Required<Profile> = {
	takeHomePerYear: 30_000,
	hoursPerWeek: 37.5,
	annualSavings: 3_000,
	netWorth: 20_000,
	retirementTarget: 675_000,
	...DEFAULT_PROFILE
};

export type ProfileErrors = Partial<Record<keyof Profile, string>>;

const isNumber = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

export function validateProfile(profile: Profile): ProfileErrors {
	const errors: ProfileErrors = {};
	const { takeHomePerYear: pay, hoursPerWeek, annualSavings, netWorth, realReturn, swr } = profile;

	if (isNumber(pay) && pay <= 0) errors.takeHomePerYear = 'Must be more than £0';
	if (isNumber(hoursPerWeek) && (hoursPerWeek <= 0 || hoursPerWeek > 100)) {
		errors.hoursPerWeek = 'Must be more than 0 and at most 100';
	}
	if (isNumber(netWorth) && netWorth < 0) errors.netWorth = 'Must be £0 or more';
	if (isNumber(profile.retirementTarget) && profile.retirementTarget <= 0) {
		errors.retirementTarget = 'Must be more than £0';
	}
	if (isNumber(annualSavings)) {
		const effectivePay =
			isNumber(pay) && !errors.takeHomePerYear ? pay : TYPICAL_PROFILE.takeHomePerYear;
		if (annualSavings < 0) errors.annualSavings = 'Must be £0 or more';
		else if (annualSavings >= effectivePay) {
			errors.annualSavings = `Must be less than take-home pay (${formatMoney(effectivePay)})`;
		}
	}
	if (isNumber(realReturn) && (realReturn < 0 || realReturn > 1)) {
		errors.realReturn = 'Must be between 0% and 100%';
	}
	if (isNumber(swr) && (swr <= 0 || swr > 0.1)) {
		errors.swr = 'Must be more than 0% and at most 10%';
	}
	return errors;
}

/** Fills empty or invalid fields from TYPICAL_PROFILE and reports which ones. */
export function withDefaults(profile: Profile): {
	profile: Required<Profile>;
	defaulted: (keyof Profile)[];
	errors: ProfileErrors;
} {
	const errors = validateProfile(profile);
	const merged = { ...TYPICAL_PROFILE };
	const defaulted: (keyof Profile)[] = [];
	for (const key of Object.keys(TYPICAL_PROFILE) as (keyof Profile)[]) {
		const value = profile[key];
		if (isNumber(value) && !errors[key]) merged[key] = value;
		else defaulted.push(key);
	}
	return { profile: merged, defaulted, errors };
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
				kind: 'money'
			}
		]
	},
	{
		title: 'Wealth',
		fields: [
			{ key: 'netWorth', label: 'Net worth', hint: 'Invested or investable', kind: 'money' },
			{
				key: 'retirementTarget',
				label: 'Retirement target',
				hint: 'Net worth you plan to retire on, in today’s money',
				kind: 'money'
			}
		]
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
				hint: 'Assumed share of investments withdrawn each year in retirement. Used to price recurring costs that continue past your retirement target',
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
