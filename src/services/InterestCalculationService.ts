/**
 * Interest Calculation Service
 * Handles all interest calculations and amortization schedules
 */

export type InterestType = 'SIMPLE' | 'COMPOUND' | 'REDUCING' | 'FLAT' | 'DECLINING';

export interface AmortizationScheduleItem {
  paymentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalPayment: number;
  outstandingBalance: number;
  cumulativeInterest: number;
}

export interface InterestCalculationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationScheduleItem[];
}

export class InterestCalculationService {
  /**
   * Calculate simple interest
   * Formula: I = P × r × t
   */
  static calculateSimpleInterest(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    const years = months / 12;
    return principal * (annualRate / 100) * years;
  }

  /**
   * Calculate compound interest
   * Formula: A = P(1 + r/n)^(nt)
   */
  static calculateCompoundInterest(
    principal: number,
    annualRate: number,
    months: number,
    compoundingPeriodsPerYear: number = 12
  ): number {
    const years = months / 12;
    const rate = annualRate / 100;
    const amount = principal * Math.pow(1 + rate / compoundingPeriodsPerYear, compoundingPeriodsPerYear * years);
    return amount - principal;
  }

  /**
   * Calculate reducing balance interest (monthly)
   * Formula: I = (Outstanding Balance × Annual Rate) / 12 / 100
   */
  static calculateReducingBalanceInterest(
    outstandingBalance: number,
    annualRate: number
  ): number {
    return (outstandingBalance * annualRate) / 12 / 100;
  }

  /**
   * Calculate flat rate interest
   * Formula: I = (P × r × t) / 100
   */
  static calculateFlatRateInterest(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    return (principal * annualRate * months) / 12 / 100;
  }

  /**
   * Calculate declining balance interest
   * Interest decreases over time
   */
  static calculateDecliningBalanceInterest(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    let totalInterest = 0;
    let balance = principal;
    const monthlyRate = annualRate / 12 / 100;

    for (let i = 0; i < months; i++) {
      const interest = balance * monthlyRate;
      totalInterest += interest;
      balance -= principal / months; // Reduce principal equally each month
    }

    return totalInterest;
  }

  /**
   * Calculate monthly payment using amortization formula
   * Formula: M = P × [r(1+r)^n] / [(1+r)^n - 1]
   */
  static calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    if (months === 0 || principal === 0) return 0;

    const monthlyRate = annualRate / 12 / 100;

    if (monthlyRate === 0) {
      return principal / months;
    }

    const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;

    return principal * (numerator / denominator);
  }

  /**
   * Generate amortization schedule for reducing balance interest
   */
  static generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    months: number,
    startDate: Date = new Date(),
    interestType: InterestType = 'REDUCING'
  ): InterestCalculationResult {
    const schedule: AmortizationScheduleItem[] = [];
    let outstandingBalance = principal;
    let cumulativeInterest = 0;

    // Calculate monthly payment
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, months);

    // Generate schedule items
    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      let interestAmount = 0;
      let principalAmount = 0;

      if (interestType === 'REDUCING') {
        // Reducing balance: interest on outstanding balance
        interestAmount = this.calculateReducingBalanceInterest(outstandingBalance, annualRate);
        principalAmount = monthlyPayment - interestAmount;
      } else if (interestType === 'FLAT') {
        // Flat rate: equal interest each month
        const totalFlatInterest = this.calculateFlatRateInterest(principal, annualRate, months);
        interestAmount = totalFlatInterest / months;
        principalAmount = monthlyPayment - interestAmount;
      } else if (interestType === 'DECLINING') {
        // Declining balance: decreasing interest
        const monthlyRate = annualRate / 12 / 100;
        interestAmount = outstandingBalance * monthlyRate;
        principalAmount = monthlyPayment - interestAmount;
      } else {
        // Default to reducing balance
        interestAmount = this.calculateReducingBalanceInterest(outstandingBalance, annualRate);
        principalAmount = monthlyPayment - interestAmount;
      }

      // Ensure principal doesn't exceed outstanding balance
      if (principalAmount > outstandingBalance) {
        principalAmount = outstandingBalance;
      }

      outstandingBalance -= principalAmount;
      cumulativeInterest += interestAmount;

      // Handle rounding for last payment
      if (i === months) {
        outstandingBalance = 0;
      }

      schedule.push({
        paymentNumber: i,
        dueDate,
        principalAmount: Math.round(principalAmount * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        totalPayment: Math.round((principalAmount + interestAmount) * 100) / 100,
        outstandingBalance: Math.max(0, Math.round(outstandingBalance * 100) / 100),
        cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
      });
    }

    // Calculate totals
    const totalInterest = schedule.reduce((sum, item) => sum + item.interestAmount, 0);
    const totalPayment = principal + totalInterest;

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      schedule,
    };
  }

  /**
   * Calculate early repayment amount
   * Includes remaining principal and interest
   */
  static calculateEarlyRepaymentAmount(
    outstandingBalance: number,
    remainingMonths: number,
    annualRate: number,
    earlyRepaymentPenalty: number = 0 // Percentage
  ): number {
    // Calculate remaining interest
    let remainingInterest = 0;
    let balance = outstandingBalance;
    const monthlyRate = annualRate / 12 / 100;

    for (let i = 0; i < remainingMonths; i++) {
      const interest = balance * monthlyRate;
      remainingInterest += interest;
      balance -= (outstandingBalance / remainingMonths);
    }

    // Apply penalty if applicable
    const penalty = (outstandingBalance * earlyRepaymentPenalty) / 100;

    return outstandingBalance + remainingInterest + penalty;
  }

  /**
   * Calculate interest for a specific period
   */
  static calculateInterestForPeriod(
    outstandingBalance: number,
    annualRate: number,
    days: number
  ): number {
    const dailyRate = annualRate / 365 / 100;
    return outstandingBalance * dailyRate * days;
  }

  /**
   * Calculate effective annual rate (EAR)
   * Formula: EAR = (1 + r/n)^n - 1
   */
  static calculateEffectiveAnnualRate(
    nominalRate: number,
    compoundingPeriodsPerYear: number = 12
  ): number {
    const rate = nominalRate / 100;
    const ear = Math.pow(1 + rate / compoundingPeriodsPerYear, compoundingPeriodsPerYear) - 1;
    return ear * 100;
  }

  /**
   * Calculate APR (Annual Percentage Rate)
   */
  static calculateAPR(
    monthlyPayment: number,
    principal: number,
    months: number
  ): number {
    // Using Newton-Raphson method to find APR
    let apr = 0.1; // Initial guess
    let precision = 0.0001;
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      const monthlyRate = apr / 12;
      const pv = monthlyPayment * (Math.pow(1 + monthlyRate, months) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, months));
      const derivative = (monthlyPayment * months * Math.pow(1 + monthlyRate, months - 1)) / (12 * Math.pow(1 + monthlyRate, months)) - 
                        (monthlyPayment * (Math.pow(1 + monthlyRate, months) - 1)) / (12 * monthlyRate * Math.pow(1 + monthlyRate, months));

      const newApr = apr - (pv - principal) / derivative;

      if (Math.abs(newApr - apr) < precision) {
        return newApr * 100;
      }

      apr = newApr;
      iterations++;
    }

    return apr * 100;
  }

  /**
   * Recalculate schedule after early repayment
   */
  static recalculateScheduleAfterEarlyRepayment(
    newBalance: number,
    remainingMonths: number,
    annualRate: number,
    startDate: Date = new Date()
  ): InterestCalculationResult {
    return this.generateAmortizationSchedule(
      newBalance,
      annualRate,
      remainingMonths,
      startDate,
      'REDUCING'
    );
  }

  /**
   * Calculate total cost of loan
   */
  static calculateTotalCost(
    principal: number,
    annualRate: number,
    months: number,
    interestType: InterestType = 'REDUCING'
  ): number {
    let totalInterest = 0;

    switch (interestType) {
      case 'SIMPLE':
        totalInterest = this.calculateSimpleInterest(principal, annualRate, months);
        break;
      case 'COMPOUND':
        totalInterest = this.calculateCompoundInterest(principal, annualRate, months);
        break;
      case 'FLAT':
        totalInterest = this.calculateFlatRateInterest(principal, annualRate, months);
        break;
      case 'DECLINING':
        totalInterest = this.calculateDecliningBalanceInterest(principal, annualRate, months);
        break;
      case 'REDUCING':
      default:
        const schedule = this.generateAmortizationSchedule(principal, annualRate, months, new Date(), 'REDUCING');
        totalInterest = schedule.totalInterest;
    }

    return principal + totalInterest;
  }

  /**
   * Calculate loan cost comparison
   */
  static compareLoanCosts(
    principal: number,
    annualRate: number,
    months: number
  ): Record<InterestType, { totalInterest: number; totalCost: number; monthlyPayment: number }> {
    return {
      SIMPLE: {
        totalInterest: this.calculateSimpleInterest(principal, annualRate, months),
        totalCost: principal + this.calculateSimpleInterest(principal, annualRate, months),
        monthlyPayment: (principal + this.calculateSimpleInterest(principal, annualRate, months)) / months,
      },
      COMPOUND: {
        totalInterest: this.calculateCompoundInterest(principal, annualRate, months),
        totalCost: principal + this.calculateCompoundInterest(principal, annualRate, months),
        monthlyPayment: (principal + this.calculateCompoundInterest(principal, annualRate, months)) / months,
      },
      REDUCING: {
        totalInterest: this.generateAmortizationSchedule(principal, annualRate, months, new Date(), 'REDUCING').totalInterest,
        totalCost: this.generateAmortizationSchedule(principal, annualRate, months, new Date(), 'REDUCING').totalPayment,
        monthlyPayment: this.calculateMonthlyPayment(principal, annualRate, months),
      },
      FLAT: {
        totalInterest: this.calculateFlatRateInterest(principal, annualRate, months),
        totalCost: principal + this.calculateFlatRateInterest(principal, annualRate, months),
        monthlyPayment: (principal + this.calculateFlatRateInterest(principal, annualRate, months)) / months,
      },
      DECLINING: {
        totalInterest: this.calculateDecliningBalanceInterest(principal, annualRate, months),
        totalCost: principal + this.calculateDecliningBalanceInterest(principal, annualRate, months),
        monthlyPayment: (principal + this.calculateDecliningBalanceInterest(principal, annualRate, months)) / months,
      },
    };
  }
}
