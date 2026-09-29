import type { FIResult, RetirementDelay } from '$lib/finance/fi';

export interface Point {
	month: number;
	value: number;
}

export interface RetirementSeries {
	without: Point[];
	with: Point[];
	targetWithout: Point[];
	targetWith: Point[];
	sameTarget: boolean;
	fiWithout: number;
	fiWith: number;
	end: number;
}

const TAIL_MONTHS = 3;

export function valueAt(series: number[], month: number): number {
	const i = Math.min(Math.floor(month), series.length - 1);
	const next = series[Math.min(i + 1, series.length - 1)];
	return series[i] + (next - series[i]) * (month - i);
}

/** Net worth month by month, ending exactly where it meets the target. */
function pathToFI(result: FIResult, fiMonth: number): Point[] {
	const whole = Math.floor(fiMonth);
	const points = result.netWorth.slice(0, whole + 1).map((value, month) => ({ month, value }));
	if (fiMonth > whole) points.push({ month: fiMonth, value: valueAt(result.target, fiMonth) });
	return points;
}

function targetLine(result: FIResult, end: number): Point[] {
	const points = result.target.map((value, month) => ({ month, value }));
	points.push({ month: end, value: result.target.at(-1)! });
	return points;
}

/** Null unless both paths reach FI in the future, which is the only case with a delay to draw. */
export function buildRetirementSeries(retirement: RetirementDelay): RetirementSeries | null {
	const { baseline, withPurchase } = retirement;
	const fiWithout = baseline.fiMonth;
	const fiWith = withPurchase.fiMonth;
	if (!fiWithout || fiWith === null) return null;

	const end = Math.max(fiWith, fiWithout) + TAIL_MONTHS;
	const sameTarget = withPurchase.target.every((t) => Math.abs(t - baseline.target[0]) < 0.5);
	return {
		without: pathToFI(baseline, fiWithout),
		with: pathToFI(withPurchase, fiWith),
		targetWithout: targetLine(baseline, end),
		targetWith: targetLine(withPurchase, end),
		sameTarget,
		fiWithout,
		fiWith,
		end
	};
}
