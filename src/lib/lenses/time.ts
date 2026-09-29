import { annualCost } from '$lib/finance/recurrence';
import { hourlyWage, realHourlyWage, WORKING_WEEKS_PER_YEAR } from '$lib/finance/wage';
import { formatMoney, formatRecurrence, formatWorkTime } from '$lib/format';
import { severity, THRESHOLDS } from './thresholds';
import type { Lens, LensContext, LensResult } from './types';

function workTime(
	{ purchase, profile, recurring }: LensContext,
	wage: number,
	working: string[]
): LensResult | null {
	if (!(wage > 0)) return null;
	const hoursPerWeek = profile.hoursPerWeek!;
	const hours = purchase.amount / wage;
	const perHour = `At ${formatMoney(wage)} an hour.`;
	working = [
		...working,
		`${formatMoney(purchase.amount)} ÷ ${formatMoney(wage)} = ${hours.toFixed(2)} hours`
	];

	if (!recurring) {
		return {
			value: hours,
			headline: formatWorkTime(hours, hoursPerWeek),
			caption: 'of work',
			sentence: perHour,
			severity: severity(hours, THRESHOLDS.workHours),
			working
		};
	}
	const yearlyHours = annualCost(purchase) / wage;
	return {
		value: hours,
		headline: formatWorkTime(hours, hoursPerWeek),
		caption: `of work ${formatRecurrence(purchase.recurrence!)}`,
		sentence: `${formatWorkTime(yearlyHours, hoursPerWeek)} of work a year. ${perHour}`,
		severity: severity(yearlyHours, THRESHOLDS.workHours),
		working
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
		return workTime(ctx, wage, [
			`${formatMoney(takeHomePerYear!)} take-home ÷ (${hoursPerWeek} h/week × ${WORKING_WEEKS_PER_YEAR} weeks) = ${formatMoney(wage)}/hour`
		]);
	}
};

export const realWorkHours: Lens = {
	id: 'real-work-hours',
	title: 'Real hours of work',
	group: 'time',
	requires: ['takeHomePerYear', 'hoursPerWeek', 'commuteHoursPerWeek'],
	appliesTo: 'both',
	compute(ctx) {
		const {
			takeHomePerYear,
			hoursPerWeek,
			commuteHoursPerWeek,
			workCostsPerYear = 0
		} = ctx.profile;
		const wage = realHourlyWage(
			takeHomePerYear!,
			hoursPerWeek!,
			commuteHoursPerWeek,
			workCostsPerYear
		);
		const result = workTime(ctx, wage, [
			`(${formatMoney(takeHomePerYear!)} − ${formatMoney(workCostsPerYear)} work costs) ÷ ((${hoursPerWeek} + ${commuteHoursPerWeek} commute) h/week × ${WORKING_WEEKS_PER_YEAR} weeks) = ${formatMoney(wage)}/hour`
		]);
		if (!result) return null;
		return {
			...result,
			sentence: `${result.sentence} Counts commuting and the cost of going to work.`
		};
	}
};

export const timeLenses = [workHours, realWorkHours];
