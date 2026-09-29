import type { FIResult, RetirementDelay } from '$lib/finance/fi';

export interface Point {
	month: number;
	value: number;
}

export interface RetirementSeries {
	without: Point[];
	with: Point[];
	target: number;
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
function pathToTarget(result: FIResult, fiMonth: number, target: number): Point[] {
	const whole = Math.floor(fiMonth);
	const points = result.netWorth.slice(0, whole + 1).map((value, month) => ({ month, value }));
	if (fiMonth > whole) points.push({ month: fiMonth, value: target });
	return points;
}

/** Null unless both paths reach the target in the future, which is the only case with a delay to draw. */
export function buildRetirementSeries(retirement: RetirementDelay): RetirementSeries | null {
	const { baseline, withPurchase, target } = retirement;
	const fiWithout = baseline.fiMonth;
	const fiWith = withPurchase.fiMonth;
	if (!fiWithout || fiWith === null) return null;

	return {
		without: pathToTarget(baseline, fiWithout, target),
		with: pathToTarget(withPurchase, fiWith, target),
		target,
		fiWithout,
		fiWith,
		end: Math.max(fiWith, fiWithout) + TAIL_MONTHS
	};
}
