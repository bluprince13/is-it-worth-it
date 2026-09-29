import type { Duration, Purchase, Recurrence, Unit } from './finance/types';

/** Form state for the purchase inputs; kept flat so it binds and serialises easily. */
export interface PurchaseDraft {
	amount?: number;
	label: string;
	recurring: boolean;
	every: number;
	unit: Unit;
	durationKind: Duration['kind'];
	durationCount: number;
	durationUnit: 'year' | 'month';
}

export const DEFAULT_DRAFT: PurchaseDraft = {
	amount: undefined,
	label: '',
	recurring: false,
	every: 1,
	unit: 'month',
	durationKind: 'lifelong',
	durationCount: 3,
	durationUnit: 'year'
};

export const FREQUENCY_PRESETS: { label: string; recurrence: Recurrence }[] = [
	{ label: 'Daily', recurrence: { every: 1, unit: 'day' } },
	{ label: 'Weekly', recurrence: { every: 1, unit: 'week' } },
	{ label: 'Monthly', recurrence: { every: 1, unit: 'month' } },
	{ label: 'Quarterly', recurrence: { every: 3, unit: 'month' } },
	{ label: 'Yearly', recurrence: { every: 1, unit: 'year' } }
];

function positiveInt(value: number | undefined, fallback: number): number {
	return value !== undefined && Number.isFinite(value) && value >= 1 ? Math.round(value) : fallback;
}

function toDuration(draft: PurchaseDraft): Duration {
	if (draft.durationKind !== 'fixed') return { kind: draft.durationKind };
	const count = positiveInt(draft.durationCount, 1);
	return { kind: 'fixed', months: draft.durationUnit === 'year' ? count * 12 : count };
}

export function toPurchase(draft: PurchaseDraft): Purchase {
	const purchase: Purchase = { amount: draft.amount ?? 0, label: draft.label.trim() || undefined };
	if (!draft.recurring) return purchase;
	return {
		...purchase,
		recurrence: { every: positiveInt(draft.every, 1), unit: draft.unit },
		duration: toDuration(draft)
	};
}
