import type { InfoNote } from '$lib/info';
import type { RetirementDelay } from '$lib/finance/fi';
import type { Profile, Purchase } from '$lib/finance/types';

export type Group = 'income' | 'wealth' | 'future';

export interface LensOptions {
	/** Years to compound "Invested instead" over; null means until the retirement target date. */
	investYears: number | null;
}

export interface LensContext {
	profile: Profile;
	purchase: Purchase;
	options: LensOptions;
	recurring: boolean;
	/** Present when the profile has enough to simulate retirement. */
	retirement?: RetirementDelay;
}

/** One line of "How it's calculated": label = expr = result, or label = result for an input. */
export interface Step {
	label: string;
	expr?: string;
	result: string;
}

export interface LensResult {
	value: number;
	headline: string;
	caption: string;
	sentence: string;
	info?: InfoNote;
	working: Step[];
}

export interface Lens {
	id: string;
	title: string;
	group: Group;
	requires: (keyof Profile)[] | ((options: LensOptions) => (keyof Profile)[]);
	appliesTo: 'once' | 'recurring' | 'both';
	compute(ctx: LensContext): LensResult | null;
}
