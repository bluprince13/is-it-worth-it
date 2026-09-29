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
	investHorizon: 'target' | 'years';
	investYears: number;
}

export const DEFAULT_DRAFT: PurchaseDraft = {
	amount: undefined,
	label: '',
	recurring: false,
	every: 1,
	unit: 'month',
	durationKind: 'untilFI',
	durationCount: 3,
	durationUnit: 'year',
	investHorizon: 'target',
	investYears: 10
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

function example(label: string, amount: number, recurring?: Partial<PurchaseDraft>): PurchaseDraft {
	return { ...DEFAULT_DRAFT, label, amount, recurring: recurring !== undefined, ...recurring };
}

export const EXAMPLES: PurchaseDraft[] = [
	example('Daily coffee', 3.5, { every: 1, unit: 'day', durationKind: 'untilFI' }),
	example('Netflix', 15, { every: 1, unit: 'month', durationKind: 'untilFI' }),
	example('Gym', 40, { every: 1, unit: 'month', durationKind: 'untilFI' }),
	example('New phone every 2 years', 1_000, { every: 2, unit: 'year', durationKind: 'untilFI' }),
	example('Holiday', 3_000),
	example('New car', 25_000)
];

/** Shown on first load so the app's purpose lands before anything is entered. */
export const INITIAL_DRAFT: PurchaseDraft = { ...EXAMPLES[0] };

export type DraftErrors = Partial<
	Record<'amount' | 'every' | 'durationCount' | 'investYears', string>
>;

const WHOLE_NUMBER = 'Must be a whole number, 1 or more';

function isPositiveInt(value: number | null | undefined): boolean {
	return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

export function validateDraft(draft: PurchaseDraft): DraftErrors {
	const errors: DraftErrors = {};
	if (draft.amount !== undefined && !(draft.amount > 0)) errors.amount = 'Must be more than £0';
	if (draft.recurring && !isPositiveInt(draft.every)) errors.every = WHOLE_NUMBER;
	if (draft.recurring && draft.durationKind === 'fixed' && !isPositiveInt(draft.durationCount)) {
		errors.durationCount = WHOLE_NUMBER;
	}
	if (draft.investHorizon === 'years' && !isPositiveInt(draft.investYears)) {
		errors.investYears = WHOLE_NUMBER;
	}
	return errors;
}

/** The horizon for "Invested instead", or undefined if the entered years aren't valid. */
export function investYearsOption(draft: PurchaseDraft): number | null | undefined {
	if (draft.investHorizon === 'target') return null;
	return isPositiveInt(draft.investYears) ? draft.investYears : undefined;
}
