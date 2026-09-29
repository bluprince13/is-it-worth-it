// 52 weeks minus UK statutory leave (5.6 weeks, including bank holidays).
export const WORKING_WEEKS_PER_YEAR = 52 - 5.6;

export function hourlyWage(takeHomePerYear: number, hoursPerWeek: number): number {
	return takeHomePerYear / (hoursPerWeek * WORKING_WEEKS_PER_YEAR);
}

/** "Your Money or Your Life" real wage: counts commute time and the cost of going to work. */
export function realHourlyWage(
	takeHomePerYear: number,
	hoursPerWeek: number,
	commuteHoursPerWeek = 0,
	workCostsPerYear = 0
): number {
	return (
		(takeHomePerYear - workCostsPerYear) /
		((hoursPerWeek + commuteHoursPerWeek) * WORKING_WEEKS_PER_YEAR)
	);
}
