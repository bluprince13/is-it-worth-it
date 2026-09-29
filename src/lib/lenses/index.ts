import { retirementDelay } from '$lib/finance/fi';
import { annualSpend } from '$lib/finance/spend';
import type { Profile, Purchase } from '$lib/finance/types';
import { budgetLenses } from './budget';
import { futureLenses } from './future';
import { timeLenses } from './time';
import type { Group, Lens, LensContext, LensResult } from './types';
import { wealthLenses } from './wealth';

export type { Group, Lens, LensResult, Severity } from './types';

export const LENSES: Lens[] = [...futureLenses, ...timeLenses, ...wealthLenses, ...budgetLenses];

export const GROUP_TITLES: Record<Group, string> = {
	future: 'Future',
	time: 'Time',
	wealth: 'Wealth',
	budget: 'Budget'
};

export interface Evaluated {
	lens: Lens;
	result: LensResult;
}

export interface Locked {
	lens: Lens;
	missing: (keyof Profile)[];
}

function isSet(value: unknown): boolean {
	return typeof value === 'number' && Number.isFinite(value);
}

export function buildContext(profile: Profile, purchase: Purchase): LensContext {
	const { netWorth, annualSavings, realReturn, swr } = profile;
	const spend = annualSpend(profile);
	const canSimulate = isSet(netWorth) && isSet(spend) && spend! > 0 && swr > 0;
	return {
		profile,
		purchase,
		recurring: purchase.recurrence !== undefined,
		retirement: canSimulate
			? retirementDelay(
					{
						netWorth: netWorth!,
						annualSavings: annualSavings!,
						annualSpend: spend!,
						realReturn,
						swr
					},
					purchase
				)
			: undefined
	};
}

export function evaluate(
	profile: Profile,
	purchase: Purchase
): { results: Evaluated[]; locked: Locked[] } {
	const results: Evaluated[] = [];
	const locked: Locked[] = [];
	if (!(purchase.amount > 0)) return { results, locked };

	const ctx = buildContext(profile, purchase);
	for (const lens of LENSES) {
		if (lens.appliesTo === 'once' && ctx.recurring) continue;
		if (lens.appliesTo === 'recurring' && !ctx.recurring) continue;
		const missing = lens.requires.filter((key) => !isSet(profile[key]));
		if (missing.length > 0) {
			locked.push({ lens, missing });
			continue;
		}
		const result = lens.compute(ctx);
		if (result) results.push({ lens, result });
	}
	return { results, locked };
}
