/**
 * Financial calculation utilities based on time-value-of-money principles
 */

/**
 * Calculate the future value of an investment
 * FV = PV * (1 + r)^n
 *
 * @param presentValue Initial investment amount (present value)
 * @param rate Annual interest/return rate (decimal)
 * @param periods Number of compounding periods
 * @param compoundingPerYear Number of times compounding occurs per year (default: 1)
 * @returns Future value of the investment
 */
export function calculateFutureValue(
  presentValue: number,
  rate: number,
  periods: number,
  compoundingPerYear = 1,
): number {
  // Convert annual rate to periodic rate
  const periodicRate = rate / compoundingPerYear
  // Calculate total number of compounding periods
  const totalPeriods = periods * compoundingPerYear

  return presentValue * Math.pow(1 + periodicRate, totalPeriods)
}

/**
 * Calculate the present value of a future amount
 * PV = FV / (1 + r)^n
 *
 * @param futureValue Future value amount
 * @param rate Annual interest/return rate (decimal)
 * @param periods Number of compounding periods
 * @param compoundingPerYear Number of times compounding occurs per year (default: 1)
 * @returns Present value of the future amount
 */
export function calculatePresentValue(
  futureValue: number,
  rate: number,
  periods: number,
  compoundingPerYear = 1,
): number {
  // Convert annual rate to periodic rate
  const periodicRate = rate / compoundingPerYear
  // Calculate total number of compounding periods
  const totalPeriods = periods * compoundingPerYear

  return futureValue / Math.pow(1 + periodicRate, totalPeriods)
}

/**
 * Calculate the future value of regular periodic payments (annuity)
 *
 * @param payment Regular payment amount
 * @param rate Annual interest rate (decimal)
 * @param periods Total number of periods
 * @param compoundingPerYear Number of times compounding occurs per year (default: 12)
 * @returns Future value of the annuity
 */
export function calculateAnnuityFutureValue(
  payment: number,
  rate: number,
  periods: number,
  compoundingPerYear = 12,
): number {
  // Convert annual rate to periodic rate
  const periodicRate = rate / compoundingPerYear
  // Calculate total number of payments
  const totalPeriods = periods * compoundingPerYear

  // Formula: PMT * ((1 + r)^n - 1) / r
  return payment * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate)
}

/**
 * Calculate the future value of an investment with one-time additional contributions
 *
 * @param monthlyPayment Regular monthly payment
 * @param rate Annual interest rate (decimal)
 * @param years Total investment period in years
 * @param oneTimePayments Array of one-time payments with timing
 * @returns Future value including one-time contributions
 */
export function calculateInvestmentWithOneTimePayments(
  monthlyPayment: number,
  rate: number,
  years: number,
  oneTimePayments: Array<{ amount: number; year: number }> = [],
): {
  futureValue: number
  breakdown: Array<{ year: number; regularContributions: number; oneTimeContributions: number; totalValue: number }>
} {
  const monthlyRate = rate / 12
  const totalMonths = years * 12
  const breakdown = []

  let totalValue = 0
  let regularContributions = 0
  let oneTimeContributions = 0

  // Calculate year by year to track one-time payments
  for (let year = 0; year <= years; year++) {
    // Add regular monthly contributions for this year
    if (year > 0) {
      const monthsThisYear = year === years ? totalMonths % 12 || 12 : 12
      for (let month = 1; month <= monthsThisYear; month++) {
        totalValue = totalValue * (1 + monthlyRate) + monthlyPayment
        regularContributions += monthlyPayment
      }
    }

    // Add any one-time payments for this year
    const oneTimePayment = oneTimePayments.find((p) => p.year === year)
    if (oneTimePayment) {
      totalValue += oneTimePayment.amount
      oneTimeContributions += oneTimePayment.amount
    }

    breakdown.push({
      year,
      regularContributions,
      oneTimeContributions,
      totalValue,
    })
  }

  return {
    futureValue: totalValue,
    breakdown,
  }
}

/**
 * Calculate loan payoff with one-time additional payments
 *
 * @param principal Initial loan balance
 * @param rate Annual interest rate (decimal)
 * @param monthlyPayment Regular monthly payment
 * @param oneTimePayments Array of one-time payments with timing
 * @returns Loan payoff details with one-time payments
 */
export function calculateLoanWithOneTimePayments(
  principal: number,
  rate: number,
  monthlyPayment: number,
  oneTimePayments: Array<{ amount: number; month: number }> = [],
): {
  totalMonths: number
  totalInterest: number
  totalPayments: number
  breakdown: Array<{
    month: number
    payment: number
    principal: number
    interest: number
    oneTimePayment: number
    remainingBalance: number
  }>
} {
  const monthlyRate = rate / 12
  let remainingBalance = principal
  let totalInterest = 0
  let totalPayments = 0
  let month = 0
  const breakdown = []

  while (remainingBalance > 0.01 && month < 1000) {
    // Safety check
    month++

    // Calculate regular payment
    const interestPayment = remainingBalance * monthlyRate
    const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance)

    remainingBalance -= principalPayment
    totalInterest += interestPayment
    totalPayments += monthlyPayment

    // Check for one-time payment this month
    const oneTimePayment = oneTimePayments.find((p) => p.month === month)
    const oneTimeAmount = oneTimePayment ? Math.min(oneTimePayment.amount, remainingBalance) : 0

    if (oneTimeAmount > 0) {
      remainingBalance -= oneTimeAmount
      totalPayments += oneTimeAmount
    }

    breakdown.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      oneTimePayment: oneTimeAmount,
      remainingBalance: Math.max(0, remainingBalance),
    })

    if (remainingBalance <= 0) break
  }

  return {
    totalMonths: month,
    totalInterest,
    totalPayments,
    breakdown,
  }
}

/**
 * Calculate the present value of an annuity (series of equal payments)
 *
 * @param payment Regular payment amount
 * @param rate Annual interest rate (decimal)
 * @param periods Total number of periods
 * @param compoundingPerYear Number of times compounding occurs per year (default: 12)
 * @returns Present value of the annuity
 */
export function calculateAnnuityPresentValue(
  payment: number,
  rate: number,
  periods: number,
  compoundingPerYear = 12,
): number {
  // Convert annual rate to periodic rate
  const periodicRate = rate / compoundingPerYear
  // Calculate total number of payments
  const totalPeriods = periods * compoundingPerYear

  // Formula: PMT * [1 - (1 + r)^-n] / r
  return (payment * (1 - Math.pow(1 + periodicRate, -totalPeriods))) / periodicRate
}

/**
 * Calculate the number of periods required to pay off a loan
 *
 * @param principal Loan principal amount
 * @param rate Annual interest rate (decimal)
 * @param payment Regular payment amount
 * @param compoundingPerYear Number of times compounding occurs per year (default: 12)
 * @returns Number of periods required to pay off the loan
 */
export function calculateLoanPayoffPeriods(
  principal: number,
  rate: number,
  payment: number,
  compoundingPerYear = 12,
): number {
  // Convert annual rate to periodic rate
  const periodicRate = rate / compoundingPerYear

  // Formula: ln(payment / (payment - r*principal)) / ln(1 + r)
  return Math.log(payment / (payment - periodicRate * principal)) / Math.log(1 + periodicRate)
}

/**
 * Calculate the effective annual rate (EAR) from a nominal rate
 *
 * @param nominalRate Nominal annual rate (decimal)
 * @param compoundingPerYear Number of times compounding occurs per year
 * @returns Effective annual rate
 */
export function calculateEffectiveAnnualRate(nominalRate: number, compoundingPerYear: number): number {
  // Formula: (1 + r/m)^m - 1
  return Math.pow(1 + nominalRate / compoundingPerYear, compoundingPerYear) - 1
}

/**
 * Calculate the real rate of return adjusted for inflation
 *
 * @param nominalRate Nominal rate of return (decimal)
 * @param inflationRate Inflation rate (decimal)
 * @returns Real rate of return
 */
export function calculateRealRate(nominalRate: number, inflationRate: number): number {
  // Formula: (1 + nominal) / (1 + inflation) - 1
  return (1 + nominalRate) / (1 + inflationRate) - 1
}

/**
 * Generate amortization schedule for a loan
 *
 * @param principal Loan principal amount
 * @param annualRate Annual interest rate (decimal)
 * @param paymentAmount Regular payment amount
 * @param paymentsPerYear Number of payments per year (default: 12)
 * @returns Array of payment periods with details
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  paymentAmount: number,
  paymentsPerYear = 12,
): Array<{
  period: number
  payment: number
  principal: number
  interest: number
  remainingBalance: number
}> {
  const periodicRate = annualRate / paymentsPerYear
  let remainingBalance = principal
  const schedule = []
  let period = 0

  while (remainingBalance > 0) {
    period++

    // Calculate interest for this period
    const interestPayment = remainingBalance * periodicRate

    // Calculate principal for this period (ensure we don't overpay)
    const principalPayment = Math.min(paymentAmount - interestPayment, remainingBalance)

    // Adjust payment for final period if needed
    const actualPayment = principalPayment + interestPayment

    // Update remaining balance
    remainingBalance -= principalPayment

    // Add to schedule
    schedule.push({
      period,
      payment: actualPayment,
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance,
    })

    // Break if we've reached a very small balance (floating point issues)
    if (remainingBalance < 0.01) break

    // Safety check to prevent infinite loops
    if (period > 1000) break
  }

  return schedule
}

/**
 * Calculate the internal rate of return (IRR) for a series of cash flows
 *
 * @param cashFlows Array of cash flows (negative for outflows, positive for inflows)
 * @param guess Initial guess for IRR (default: 0.1)
 * @param maxIterations Maximum number of iterations (default: 1000)
 * @param tolerance Error tolerance (default: 0.0000001)
 * @returns Estimated IRR or null if no solution found
 */
export function calculateIRR(
  cashFlows: number[],
  guess = 0.1,
  maxIterations = 1000,
  tolerance = 0.0000001,
): number | null {
  let rate = guess

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let derivativeNpv = 0

    // Calculate NPV and its derivative at current rate
    for (let j = 0; j < cashFlows.length; j++) {
      const factor = Math.pow(1 + rate, j)
      npv += cashFlows[j] / factor
      derivativeNpv -= (j * cashFlows[j]) / Math.pow(1 + rate, j + 1)
    }

    // Newton-Raphson method: new_rate = rate - f(rate)/f'(rate)
    const newRate = rate - npv / derivativeNpv

    // Check for convergence
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate
    }

    rate = newRate
  }

  // If we didn't converge, return null
  return null
}

/**
 * Calculate the net present value (NPV) of a series of cash flows
 *
 * @param rate Discount rate (decimal)
 * @param cashFlows Array of cash flows (negative for outflows, positive for inflows)
 * @returns Net present value
 */
export function calculateNPV(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((npv, cashFlow, index) => {
    return npv + cashFlow / Math.pow(1 + rate, index)
  }, 0)
}
