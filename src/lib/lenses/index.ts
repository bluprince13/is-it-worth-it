import { retirementDelay, type RetirementDelay } from '$lib/finance/fi';
import type { Profile, Purchase } from '$lib/finance/types';
import { futureLenses } from './future';
import { incomeLenses } from './income';
import type { Group, Lens, LensContext, LensOptions, LensResult } from './types';
import { wealthLenses } from './wealth';

export type { Group, Lens, LensOptions, LensResult } from './types';

export const LENSES: Lens[] = [...futureLenses, ...incomeLenses, ...wealthLenses];

export const GROUP_TITLES: Record<Group, string> = {
	retirement: 'Retirement',
	income: 'Income',
	wealth: 'Wealth'
};

export interface Evaluated {
	lens: Lens;
	result: LensResult;
}

export interface Blocked {
	lens: Lens;
	/** Profile fields the lens needs that are missing or invalid. */
	invalid: (keyof Profile)[];
}

function isSet(value: unknown): boolean {
	return typeof value === 'number' && Number.isFinite(value);
}

const DEFAULT_OPTIONS: LensOptions = { investYears: null };

export function buildContext(
	profile: Profile,
	purchase: Purchase,
	options: LensOptions = DEFAULT_OPTIONS
): LensContext {
	const { netWorth, annualSavings, retirementTarget, realReturn } = profile;
	const canSimulate =
		[netWorth, annualSavings, retirementTarget, realReturn].every(isSet) && retirementTarget! > 0;
	return {
		profile,
		purchase,
		options,
		recurring: purchase.recurrence !== undefined,
		retirement: canSimulate
			? retirementDelay(
					{
						netWorth: netWorth!,
						annualSavings: annualSavings!,
						target: retirementTarget!,
						realReturn
					},
					purchase
				)
			: undefined
	};
}

export interface Evaluation {
	results: Evaluated[];
	blocked: Blocked[];
	retirement?: RetirementDelay;
}

export function evaluate(
	profile: Profile,
	purchase: Purchase,
	options: LensOptions = DEFAULT_OPTIONS
): Evaluation {
	const results: Evaluated[] = [];
	const blocked: Blocked[] = [];
	if (!(purchase.amount > 0)) return { results, blocked };

	const ctx = buildContext(profile, purchase, options);
	for (const lens of LENSES) {
		if (lens.appliesTo === 'once' && ctx.recurring) continue;
		if (lens.appliesTo === 'recurring' && !ctx.recurring) continue;
		const requires = typeof lens.requires === 'function' ? lens.requires(options) : lens.requires;
		const invalid = requires.filter((key) => !isSet(profile[key]));
		if (invalid.length > 0) {
			blocked.push({ lens, invalid });
			continue;
		}
		const result = lens.compute(ctx);
		if (result) results.push({ lens, result });
	}
	return { results, blocked, retirement: ctx.retirement };
}
