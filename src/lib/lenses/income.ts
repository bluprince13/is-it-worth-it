import { annualCost } from '$lib/finance/recurrence';
import { hourlyWage, STATUTORY_LEAVE_WEEKS, WORKING_WEEKS_PER_YEAR } from '$lib/finance/wage';
import { formatMoney, formatWorkTime } from '$lib/format';
import { annualCostStep, decimals } from './cost';
import type { Lens, LensContext, LensResult, Step } from './types';

function hoursText(hours: number): string {
	return `${hours < 1 ? String(Number(hours.toPrecision(2))) : decimals(hours)} hours`;
}

/** Hours of work, then the conversion into the unit the headline uses. */
function hoursSteps(
	label: string,
	cost: string,
	wage: number,
	hours: number,
	hoursPerWeek: number
): Step[] {
	const steps: Step[] = [
		{ label, expr: `${cost} ÷ ${formatMoney(wage)}/hour`, result: hoursText(hours) }
	];
	const hoursPerDay = hoursPerWeek / 5;
	const headline = formatWorkTime(hours, hoursPerWeek);
	if (hours < 1) {
		steps.push({ label: 'In minutes', expr: `${hoursText(hours)} × 60`, result: headline });
	} else if (hours >= hoursPerWeek) {
		steps.push({
			label: 'In working weeks',
			expr: `${hoursText(hours)} ÷ ${decimals(hoursPerWeek)} h/week`,
			result: headline
		});
	} else if (hours >= hoursPerDay) {
		steps.push({
			label: 'In working days',
			expr: `${hoursText(hours)} ÷ (${decimals(hoursPerWeek)} h/week ÷ 5 days)`,
			result: headline
		});
	}
	return steps;
}

function workTime(ctx: LensContext, wage: number, wageSteps: Step[]): LensResult | null {
	if (!(wage > 0)) return null;
	const { purchase, profile, recurring } = ctx;
	const hoursPerWeek = profile.hoursPerWeek!;
	const perHour = `At ${formatMoney(wage)} an hour before tax.`;

	if (!recurring) {
		const hours = purchase.amount / wage;
		return {
			value: hours,
			headline: formatWorkTime(hours, hoursPerWeek),
			caption: '',
			sentence: perHour,
			working: [
				...wageSteps,
				...hoursSteps('Hours of work', formatMoney(purchase.amount), wage, hours, hoursPerWeek)
			]
		};
	}

	const yearly = annualCost(purchase);
	const yearlyHours = yearly / wage;
	return {
		value: yearlyHours,
		headline: formatWorkTime(yearlyHours, hoursPerWeek),
		caption: 'a year',
		sentence: `The yearly cost of ${formatMoney(yearly)}, at ${formatMoney(wage)} an hour before tax.`,
		working: [
			...wageSteps,
			annualCostStep(purchase),
			...hoursSteps(
				'Hours of work a year',
				`${formatMoney(yearly)} a year`,
				wage,
				yearlyHours,
				hoursPerWeek
			)
		]
	};
}

export const workHours: Lens = {
	id: 'work-hours',
	title: 'Hours of work',
	group: 'income',
	requires: ['salaryPerYear', 'hoursPerWeek'],
	appliesTo: 'both',
	compute(ctx) {
		const { salaryPerYear, hoursPerWeek } = ctx.profile;
		const wage = hourlyWage(salaryPerYear!, hoursPerWeek!);
		return workTime(ctx, wage, [
			{
				label: 'Working weeks',
				expr: `52 weeks − ${decimals(STATUTORY_LEAVE_WEEKS)} weeks statutory leave`,
				result: `${decimals(WORKING_WEEKS_PER_YEAR)} weeks`
			},
			{
				label: 'Hourly rate',
				expr: `${formatMoney(salaryPerYear!)} salary ÷ (${decimals(hoursPerWeek!)} h/week × ${decimals(WORKING_WEEKS_PER_YEAR)} weeks)`,
				result: `${formatMoney(wage)}/hour`
			}
		]);
	}
};

export const incomeLenses = [workHours];
