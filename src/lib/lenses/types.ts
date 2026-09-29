import type { RetirementDelay } from '$lib/finance/fi';
import type { Profile, Purchase } from '$lib/finance/types';

export type Group = 'time' | 'wealth' | 'future' | 'budget';

/** 0 trivial, 1 noticeable, 2 significant, 3 major */
export type Severity = 0 | 1 | 2 | 3;

export interface LensContext {
	profile: Profile;
	purchase: Purchase;
	recurring: boolean;
	/** Present when the profile has enough to simulate retirement. */
	retirement?: RetirementDelay;
}

export interface LensResult {
	value: number;
	headline: string;
	caption: string;
	sentence: string;
	severity?: Severity;
	working: string[];
}

export interface Lens {
	id: string;
	title: string;
	group: Group;
	requires: (keyof Profile)[];
	appliesTo: 'once' | 'recurring' | 'both';
	compute(ctx: LensContext): LensResult | null;
}
