import { annualCost } from '$lib/finance/recurrence';
import { hourlyWage, WORKING_WEEKS_PER_YEAR } from '$lib/finance/wage';
import { formatDuration, formatMoney, formatWorkTime } from '$lib/format';
import { annualCostLine, decimals } from './cost';
import type { Lens, LensContext, LensResult } from './types';

function hoursLine(cost: string, wage: number, hours: number): string {
	return `${cost} ÷ ${formatMoney(wage)} = ${decimals(hours)} hours`;
}

/** Months of payments, or null when they run to a retirement date the profile can't give. */
function payingMonths({ purchase, retirement }: LensContext): number | null {
	const duration = purchase.duration ?? { kind: 'untilFI' };
	if (duration.kind === 'fixed') return duration.months;
	const fiMonth = retirement?.baseline.fiMonth;
	return fiMonth ? fiMonth : null;
}

function workTime(ctx: LensContext, wage: number, wageLine: string): LensResult | null {
	if (!(wage > 0)) return null;
	const { purchase, profile, recurring } = ctx;
	const hoursPerWeek = profile.hoursPerWeek!;
	const perHour = `At ${formatMoney(wage)} an hour.`;

	if (!recurring) {
		const hours = purchase.amount / wage;
		return {
			value: hours,
			headline: formatWorkTime(hours, hoursPerWeek),
			caption: '',
			sentence: perHour,
			working: [wageLine, hoursLine(formatMoney(purchase.amount), wage, hours)]
		};
	}

	const yearly = annualCost(purchase);
	const yearlyHours = yearly / wage;
	const months = payingMonths(ctx);
	if (months === null) {
		return {
			value: yearlyHours,
			headline: formatWorkTime(yearlyHours, hoursPerWeek),
			caption: 'a year',
			sentence: perHour,
			working: [
				wageLine,
				annualCostLine(purchase),
				hoursLine(`${formatMoney(yearly)} a year`, wage, yearlyHours)
			]
		};
	}

	const years = months / 12;
	const total = yearly * years;
	const hours = total / wage;
	const period =
		purchase.duration?.kind === 'fixed'
			? formatDuration(purchase.duration)
			: `for ${years.toFixed(1)} years, to your retirement target date`;
	return {
		value: hours,
		headline: formatWorkTime(hours, hoursPerWeek),
		caption: `in total, paid ${period}`,
		sentence: `${formatWorkTime(yearlyHours, hoursPerWeek)} a year. ${perHour}`,
		working: [
			wageLine,
			annualCostLine(purchase),
			`${formatMoney(yearly)} a year × ${decimals(years)} years = ${formatMoney(total)}`,
			hoursLine(formatMoney(total), wage, hours)
		]
	};
}

export const workHours: Lens = {
	id: 'work-hours',
	title: 'Hours of work',
	group: 'time',
	requires: ['takeHomePerYear', 'hoursPerWeek'],
	appliesTo: 'both',
	compute(ctx) {
		const { takeHomePerYear, hoursPerWeek } = ctx.profile;
		const wage = hourlyWage(takeHomePerYear!, hoursPerWeek!);
		return workTime(
			ctx,
			wage,
			`${formatMoney(takeHomePerYear!)} take-home ÷ (${hoursPerWeek} h/week × ${WORKING_WEEKS_PER_YEAR} weeks) = ${formatMoney(wage)}/hour`
		);
	}
};

export const timeLenses = [workHours];
