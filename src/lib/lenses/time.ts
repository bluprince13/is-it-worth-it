import { annualCost } from '$lib/finance/recurrence';
import { hourlyWage, WORKING_WEEKS_PER_YEAR } from '$lib/finance/wage';
import { formatMoney, formatWorkTime } from '$lib/format';
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
			summary: `costs ${formatWorkTime(hours, hoursPerWeek)} of work`,
			sentence: perHour,
			working
		};
	}
	const yearlyHours = annualCost(purchase) / wage;
	return {
		value: yearlyHours,
		headline: formatWorkTime(yearlyHours, hoursPerWeek),
		caption: 'of work a year',
		summary: `costs ${formatWorkTime(yearlyHours, hoursPerWeek)} of work a year`,
		sentence: `${formatWorkTime(hours, hoursPerWeek)} of work each payment. ${perHour}`,
		working: [
			...working,
			`${formatMoney(annualCost(purchase))} a year ÷ ${formatMoney(wage)} = ${yearlyHours.toFixed(2)} hours`
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
		return workTime(ctx, wage, [
			`${formatMoney(takeHomePerYear!)} take-home ÷ (${hoursPerWeek} h/week × ${WORKING_WEEKS_PER_YEAR} weeks) = ${formatMoney(wage)}/hour`
		]);
	}
};

export const timeLenses = [workHours];
