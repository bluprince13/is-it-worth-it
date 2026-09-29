export function monthlyGrowthRate(annualRate: number): number {
	return Math.pow(1 + annualRate, 1 / 12) - 1;
}

export function futureValue(amount: number, annualRate: number, years: number): number {
	return amount * Math.pow(1 + annualRate, years);
}

export function futureValueOfMonthlySeries(
	payment: number,
	annualRate: number,
	months: number
): number {
	const i = monthlyGrowthRate(annualRate);
	if (i === 0) return payment * months;
	return (payment * (Math.pow(1 + i, months) - 1)) / i;
}

/**
 * Capital needed today to fund `months` of payments, drawing down at `swr`.
 * Discounts at swr/12 per month so that a lifelong series comes out at exactly
 * annual cost ÷ SWR, and long fixed durations converge smoothly to it.
 */
export function capitalToFund(monthlyPayment: number, swr: number, months: number): number {
	if (months <= 0 || monthlyPayment === 0) return 0;
	const i = swr / 12;
	if (!Number.isFinite(months)) return i === 0 ? Infinity : monthlyPayment / i;
	if (i === 0) return monthlyPayment * months;
	return (monthlyPayment * (1 - Math.pow(1 + i, -months))) / i;
}
