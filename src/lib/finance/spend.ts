import type { Profile } from './types';

/** Everything you take home and don't save, you spend. */
export function annualSpend({ takeHomePerYear, annualSavings }: Profile): number | undefined {
	if (takeHomePerYear === undefined || annualSavings === undefined) return undefined;
	return takeHomePerYear - annualSavings;
}
