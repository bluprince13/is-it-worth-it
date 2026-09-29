// 52 weeks minus UK statutory leave (5.6 weeks, including bank holidays).
export const WORKING_WEEKS_PER_YEAR = 52 - 5.6;

export function hourlyWage(takeHomePerYear: number, hoursPerWeek: number): number {
	return takeHomePerYear / (hoursPerWeek * WORKING_WEEKS_PER_YEAR);
}
