import { annualCost } from '$lib/finance/recurrence';
import { hourlyWage, STATUTORY_LEAVE_WEEKS, WORKING_WEEKS_PER_YEAR } from '$lib/finance/wage';
import { formatDuration, formatMoney, formatWorkTime } from '$lib/format';
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

/** Months of payments, or null when they run to a retirement date the profile can't give. */
function payingMonths({ purchase, retirement }: LensContext): number | null {
	const duration = purchase.duration ?? { kind: 'untilFI' };
	if (duration.kind === 'fixed') return duration.months;
	const fiMonth = retirement?.baseline.fiMonth;
	return fiMonth ? fiMonth : null;
}

function yearsPaidStep({ purchase }: LensContext, years: number): Step {
	const duration = purchase.duration ?? { kind: 'untilFI' };
	const result = `${decimals(years)} years`;
	if (duration.kind === 'untilFI') {
		return { label: 'Years paid', expr: 'years to retirement target, simulated', result };
	}
	return duration.months % 12 === 0
		? { label: 'Years paid', result }
		: { label: 'Years paid', expr: `${duration.months} months ÷ 12`, result };
}

function workTime(ctx: LensContext, wage: number, wageSteps: Step[]): LensResult | null {
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
			working: [
				...wageSteps,
				...hoursSteps('Hours of work', formatMoney(purchase.amount), wage, hours, hoursPerWeek)
			]
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
			...wageSteps,
			annualCostStep(purchase),
			yearsPaidStep(ctx, years),
			{
				label: 'Total cost',
				expr: `${formatMoney(yearly)} a year × ${decimals(years)} years`,
				result: formatMoney(total)
			},
			...hoursSteps('Hours of work', formatMoney(total), wage, hours, hoursPerWeek)
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
			{
				label: 'Working weeks',
				expr: `52 weeks − ${decimals(STATUTORY_LEAVE_WEEKS)} weeks statutory leave`,
				result: `${decimals(WORKING_WEEKS_PER_YEAR)} weeks`
			},
			{
				label: 'Hourly rate',
				expr: `${formatMoney(takeHomePerYear!)} take-home ÷ (${decimals(hoursPerWeek!)} h/week × ${decimals(WORKING_WEEKS_PER_YEAR)} weeks)`,
				result: `${formatMoney(wage)}/hour`
			}
		]);
	}
};

export const timeLenses = [workHours];
