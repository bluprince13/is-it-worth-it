import { DEFAULT_DRAFT, type PurchaseDraft } from './draft';
import type { Profile, Unit } from './finance/types';

const UNIT_CODES: Record<Unit, string> = { day: 'd', week: 'w', month: 'm', year: 'y' };
const UNITS_BY_CODE = Object.fromEntries(
	Object.entries(UNIT_CODES).map(([unit, code]) => [code, unit])
) as Record<string, Unit>;

const PROFILE_PARAMS: { param: string; key: keyof Profile; percent?: boolean }[] = [
	{ param: 'pay', key: 'takeHomePerYear' },
	{ param: 'hrs', key: 'hoursPerWeek' },
	{ param: 'sav', key: 'annualSavings' },
	{ param: 'nw', key: 'netWorth' },
	{ param: 'tgt', key: 'retirementTarget' },
	{ param: 'ret', key: 'realReturn', percent: true }
];

const PURCHASE_PARAMS = ['amt', 'for', 'every', 'dur', 'inv'];

export interface SharedState {
	draft?: PurchaseDraft;
	profile?: Partial<Profile>;
}

function number(value: string | null): number | undefined {
	if (value === null || value.trim() === '') return undefined;
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
}

export function encodeShare(draft: PurchaseDraft, profile: Profile): string {
	const params = new URLSearchParams();
	if (draft.amount !== undefined) params.set('amt', String(draft.amount));
	if (draft.label.trim()) params.set('for', draft.label.trim());
	if (draft.recurring) {
		params.set('every', `${draft.every}${UNIT_CODES[draft.unit]}`);
		params.set(
			'dur',
			draft.durationKind === 'untilFI'
				? 'fi'
				: `${draft.durationCount}${draft.durationUnit === 'year' ? 'y' : 'm'}`
		);
	}
	if (draft.investHorizon === 'years') params.set('inv', String(draft.investYears));
	for (const { param, key, percent } of PROFILE_PARAMS) {
		const value = profile[key];
		if (value === undefined) continue;
		params.set(param, String(percent ? Number((value * 100).toFixed(4)) : value));
	}
	return params.toString();
}

function decodeDraft(params: URLSearchParams): PurchaseDraft | undefined {
	if (!PURCHASE_PARAMS.some((p) => params.has(p))) return undefined;
	const draft: PurchaseDraft = { ...DEFAULT_DRAFT };
	const amount = number(params.get('amt'));
	if (amount !== undefined && amount >= 0) draft.amount = amount;
	draft.label = params.get('for') ?? '';

	const every = params.get('every')?.match(/^(\d+)([dwmy])$/);
	if (every && Number(every[1]) >= 1) {
		draft.recurring = true;
		draft.every = Number(every[1]);
		draft.unit = UNITS_BY_CODE[every[2]];
	}

	const dur = params.get('dur');
	const fixed = dur?.match(/^(\d+)([ym])$/);
	if (dur === 'fi') draft.durationKind = 'untilFI';
	else if (fixed && Number(fixed[1]) >= 1) {
		draft.durationKind = 'fixed';
		draft.durationCount = Number(fixed[1]);
		draft.durationUnit = fixed[2] === 'y' ? 'year' : 'month';
	}
	const inv = number(params.get('inv'));
	if (inv !== undefined && Number.isInteger(inv) && inv >= 1) {
		draft.investHorizon = 'years';
		draft.investYears = inv;
	}
	return draft;
}

function decodeProfile(params: URLSearchParams): Partial<Profile> | undefined {
	const profile: Partial<Profile> = {};
	for (const { param, key, percent } of PROFILE_PARAMS) {
		const value = number(params.get(param));
		if (value !== undefined) profile[key] = percent ? value / 100 : value;
	}
	return Object.keys(profile).length > 0 ? profile : undefined;
}

export function decodeShare(search: string): SharedState {
	const params = new URLSearchParams(search);
	return { draft: decodeDraft(params), profile: decodeProfile(params) };
}
