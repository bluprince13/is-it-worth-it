import type { Profile } from './finance/types';
import type { InfoNote } from './info';

const STORAGE_KEY = 'is-it-worth-it:profile';

export const DEFAULT_PROFILE: Profile = { realReturn: 0.05 };

/**
 * Typical UK full-time employee, used for any field left empty. Take-home is the
 * ONS April 2025 median full-time salary (£39,039) after tax, NI and 5% pension.
 * Savings are £3,000 from take-home pay plus auto-enrolment pension contributions
 * (5% employee, 3% employer, on qualifying earnings above £6,240). The target is
 * 25× the £27,000 spent, the conventional 4% rule.
 */
export const TYPICAL_PROFILE: Required<Profile> = {
	takeHomePerYear: 30_000,
	hoursPerWeek: 37.5,
	annualSavings: 5_600,
	netWorth: 20_000,
	retirementTarget: 675_000,
	...DEFAULT_PROFILE
};

export type ProfileErrors = Partial<Record<keyof Profile, string>>;

const isNumber = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

export function validateProfile(profile: Profile): ProfileErrors {
	const errors: ProfileErrors = {};
	const { takeHomePerYear: pay, hoursPerWeek, annualSavings, netWorth, realReturn } = profile;

	if (isNumber(pay) && pay <= 0) errors.takeHomePerYear = 'Must be more than £0';
	if (isNumber(hoursPerWeek) && (hoursPerWeek <= 0 || hoursPerWeek > 100)) {
		errors.hoursPerWeek = 'Must be more than 0 and at most 100';
	}
	if (isNumber(netWorth) && netWorth < 0) errors.netWorth = 'Must be £0 or more';
	if (isNumber(profile.retirementTarget) && profile.retirementTarget <= 0) {
		errors.retirementTarget = 'Must be more than £0';
	}
	if (isNumber(annualSavings) && annualSavings < 0) errors.annualSavings = 'Must be £0 or more';
	if (isNumber(realReturn) && (realReturn < 0 || realReturn > 1)) {
		errors.realReturn = 'Must be between 0% and 100%';
	}
	return errors;
}

/**
 * Fills empty fields from TYPICAL_PROFILE. Invalid fields become NaN rather than a
 * placeholder, so lenses that need them report an error instead of a result.
 */
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
		if (errors[key]) merged[key] = NaN;
		else if (isNumber(value)) merged[key] = value;
		else defaulted.push(key);
	}
	return { profile: merged, defaulted, errors };
}

export type FieldKind = 'money' | 'hours' | 'percent';

export interface FieldSpec {
	key: keyof Profile;
	label: string;
	hint?: string;
	info?: InfoNote;
	kind: FieldKind;
}

export const PROFILE_SECTIONS: { title: string; fields: FieldSpec[] }[] = [
	{
		title: 'Income',
		fields: [
			{
				key: 'takeHomePerYear',
				label: 'Take-home pay per year',
				kind: 'money'
			},
			{ key: 'hoursPerWeek', label: 'Hours worked per week', kind: 'hours' },
			{
				key: 'annualSavings',
				label: 'Savings per year',
				hint: 'Invested and added to your net worth, including pension contributions from you and your employer',
				kind: 'money'
			}
		]
	},
	{
		title: 'Wealth',
		fields: [
			{
				key: 'netWorth',
				label: 'Net worth',
				hint: 'Investable, including pensions',
				kind: 'money'
			},
			{
				key: 'retirementTarget',
				label: 'Retirement target',
				hint: 'Net worth you plan to retire on, in today’s money',
				info: {
					linkText: 'Retirement Calculators’ FIRE number calculator',
					href: 'https://retirementcalculators.uk/calculators/fire-number-calculator/',
					text: 'can help you estimate the retirement target.'
				},
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
				info: {
					linkText:
						'Cambridge Judge Business School’s summary of the UBS Global Investment Returns Yearbook 2025',
					href: 'https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/',
					text: `reports annualised returns above inflation from 1900 to 2024 of 5.2% for world equities, 1.7% for bonds and 0.5% for treasury bills. The figure used here is ${DEFAULT_PROFILE.realReturn * 100}% unless another is entered.`
				},
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
