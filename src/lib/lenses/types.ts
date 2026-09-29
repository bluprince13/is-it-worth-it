import type { RetirementDelay } from '$lib/finance/fi';
import type { Profile, Purchase } from '$lib/finance/types';

export type Group = 'time' | 'wealth' | 'future';

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

export interface LensResult {
	value: number;
	headline: string;
	caption: string;
	sentence: string;
	/** Extra context behind an info button, e.g. an attributed rule of thumb. */
	info?: { text: string; href: string; linkText: string };
	working: string[];
}

export interface Lens {
	id: string;
	title: string;
	group: Group;
	requires: (keyof Profile)[] | ((options: LensOptions) => (keyof Profile)[]);
	appliesTo: 'once' | 'recurring' | 'both';
	compute(ctx: LensContext): LensResult | null;
}
