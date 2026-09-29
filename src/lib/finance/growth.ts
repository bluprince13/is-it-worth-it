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
