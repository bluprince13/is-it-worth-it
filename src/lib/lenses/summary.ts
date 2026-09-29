import type { Purchase } from '$lib/finance/types';
import type { Evaluated } from './index';

const PREFERENCE = ['work-hours', 'retirement-delay', 'net-worth-share'];

export function summarise(results: Evaluated[], purchase: Purchase): string | null {
	const phrases = PREFERENCE.map((id) => results.find((r) => r.lens.id === id)?.result.summary)
		.filter((phrase): phrase is string => phrase !== undefined)
		.slice(0, 2);
	if (phrases.length === 0) return null;
	return `${purchase.label ?? 'This'} ${phrases.join(' and ')}.`;
}
