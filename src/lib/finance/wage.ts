/** UK statutory leave, including bank holidays. */
export const STATUTORY_LEAVE_WEEKS = 5.6;
export const WORKING_WEEKS_PER_YEAR = 52 - STATUTORY_LEAVE_WEEKS;

export function hourlyWage(takeHomePerYear: number, hoursPerWeek: number): number {
	return takeHomePerYear / (hoursPerWeek * WORKING_WEEKS_PER_YEAR);
}
