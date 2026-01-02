/**
 * Interest Calculation Service
 * Handles all interest calculations and amortization schedules
 * 
 * Implements industry-standard practices used by banks and microfinance institutions:
 * - SIMPLE: Fixed interest on principal for entire loan period
 * - COMPOUND: Interest compounded monthly (most common for savings/investments)
 * - DECLINING_BALANCE (Reducing Balance): Interest on outstanding balance (most common for loans)
 * - FLAT_RATE: Fixed interest amount divided equally across all payments
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
   * Calculate simple interest (Industry Standard: Fixed Interest Method)
   * 
   * Used by: Some microfinance institutions, short-term loans
   * Formula: I = P × r × t
   * 
   * Example: $10,000 loan at 12% p.a. for 2 years
   * Interest = 10,000 × 0.12 × 2 = $2,400
   * Monthly Payment = ($10,000 + $2,400) / 24 = $516.67
   */
  static calculateSimpleInterest(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    if (principal <= 0 || annualRate < 0 || months <= 0) return 0;
    
    const years = months / 12;
    return principal * (annualRate / 100) * years;
  }

  /**
   * Calculate compound interest (Industry Standard: Compounding Method)
   * 
   * Used by: Banks (savings accounts, investment products)
   * Formula: A = P(1 + r/n)^(nt)
   * Where: n = compounding periods per year (12 for monthly)
   * 
   * Example: $10,000 at 12% p.a. compounded monthly for 2 years
   * A = 10,000 × (1 + 0.12/12)^(12×2) = $12,697.35
   * Interest = $2,697.35
   */
  static calculateCompoundInterest(
    principal: number,
    annualRate: number,
    months: number,
    compoundingPeriodsPerYear: number = 12
  ): number {
    if (principal <= 0 || annualRate < 0 || months <= 0) return 0;
    
    const years = months / 12;
    const rate = annualRate / 100;
    const amount = principal * Math.pow(1 + rate / compoundingPeriodsPerYear, compoundingPeriodsPerYear * years);
    return amount - principal;
  }

  /**
   * Calculate reducing balance interest (Industry Standard: Most Common for Loans)
   * 
   * Used by: Banks, microfinance institutions, consumer loans
   * Formula: Monthly Interest = (Outstanding Balance × Annual Rate) / 12 / 100
   * 
   * This is calculated as part of the amortization schedule where:
   * - Interest is charged on the remaining balance each month
   * - As principal is paid down, interest decreases
   * - Monthly payment remains constant
   * 
   * Example: $10,000 loan at 12% p.a. for 2 years
   * Monthly Payment = $466.08 (calculated using amortization formula)
   * Month 1: Interest = $100, Principal = $366.08
   * Month 2: Interest = $96.61, Principal = $369.47
   * ... and so on
   */
  static calculateReducingBalanceInterest(
    outstandingBalance: number,
    annualRate: number
  ): number {
    if (outstandingBalance <= 0 || annualRate < 0) return 0;
    
    return (outstandingBalance * annualRate) / 12 / 100;
  }

  /**
   * Calculate flat rate interest (Industry Standard: Flat Rate Method)
   * 
   * Used by: Some microfinance institutions, vehicle loans, consumer loans
   * Formula: I = (P × r × t) / 100
   * 
   * Characteristics:
   * - Total interest is fixed upfront
   * - Interest is divided equally across all payments
   * - Effective interest rate is higher than stated rate
   * - Simpler to understand for borrowers
   * 
   * Example: $10,000 loan at 12% flat rate for 2 years
   * Total Interest = (10,000 × 12 × 2) / 100 = $2,400
   * Monthly Payment = ($10,000 + $2,400) / 24 = $516.67
   * 
   * Note: Effective APR ≈ 21.6% (higher than 12% stated rate)
   */
  static calculateFlatRateInterest(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    if (principal <= 0 || annualRate < 0 || months <= 0) return 0;
    
    return (principal * annualRate * months) / 12 / 100;
  }

  /**
   * Calculate declining balance interest (Industry Standard: Amortization Method)
   * 
   * Used by: Banks, microfinance institutions (most common for loans)
   * 
   * Characteristics:
   * - Interest calculated on outstanding balance each month
   * - Fixed monthly payment (using amortization formula)
   * - Interest decreases over time as balance decreases
   * - Principal payment increases over time
   * - Most transparent and fair method
   * 
   * This method generates a full amortization schedule where:
   * - Each month's interest = Outstanding Balance × Monthly Rate
   * - Each month's principal = Monthly Payment - Interest
   * - Outstanding Balance decreases each month
   * 
   * Example: $10,000 loan at 12% p.a. for 2 years
   * Monthly Payment = $466.08
   * Month 1: Interest = $100, Principal = $366.08, Balance = $9,633.92
   * Month 24: Interest = $1.81, Principal = $464.27, Balance = $0
   */
  static calculateDecliningBalanceInterest(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    if (principal <= 0 || annualRate < 0 || months <= 0) return 0;
    
    let totalInterest = 0;
    let balance = principal;
    const monthlyRate = annualRate / 12 / 100;

    // Calculate monthly payment using amortization formula
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, months);

    for (let i = 0; i < months; i++) {
      const interest = balance * monthlyRate;
      totalInterest += interest;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;
      
      // Prevent negative balance due to rounding
      if (balance < 0) balance = 0;
    }

    return totalInterest;
  }

  /**
   * Calculate monthly payment using amortization formula (Industry Standard)
   * 
   * Used by: Banks, microfinance institutions for declining balance loans
   * Formula: M = P × [r(1+r)^n] / [(1+r)^n - 1]
   * 
   * Where:
   * - M = Monthly payment
   * - P = Principal amount
   * - r = Monthly interest rate (annual rate / 12 / 100)
   * - n = Number of months
   * 
   * This formula ensures:
   * - Equal monthly payments throughout the loan term
   * - Interest decreases each month as balance decreases
   * - Principal payment increases each month
   * - Loan is fully paid off at the end of the term
   * 
   * Example: $10,000 loan at 12% p.a. for 24 months
   * r = 0.12 / 12 / 100 = 0.01
   * M = 10,000 × [0.01(1.01)^24] / [(1.01)^24 - 1]
   * M = $466.08
   */
  static calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    if (months === 0 || principal <= 0) return 0;

    const monthlyRate = annualRate / 12 / 100;

    // If no interest, divide principal equally
    if (monthlyRate === 0) {
      return principal / months;
    }

    // Standard amortization formula
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;

    return principal * (numerator / denominator);
  }

  /**
   * Generate amortization schedule (Industry Standard for Declining Balance Loans)
   * 
   * This is the most common method used by banks and microfinance institutions.
   * 
   * The schedule shows:
   * - Payment Number: Sequential payment number
   * - Due Date: When payment is due
   * - Principal Amount: Portion of payment reducing the loan balance
   * - Interest Amount: Portion of payment for interest
   * - Total Payment: Principal + Interest (constant for declining balance)
   * - Outstanding Balance: Remaining loan balance after payment
   * - Cumulative Interest: Total interest paid to date
   * 
   * Key Characteristics:
   * - Equal monthly payments (for declining balance method)
   * - Interest decreases each month
   * - Principal payment increases each month
   * - Transparent and easy to verify
   * 
   * Supported Interest Types:
   * - REDUCING (Declining Balance): Most common, interest on outstanding balance
   * - FLAT: Fixed interest divided equally across payments
   * - DECLINING: Same as REDUCING
   * - SIMPLE: Fixed interest divided equally across payments
   * - COMPOUND: Not typically used for loan schedules
   */
  static generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    months: number,
    startDate: Date = new Date(),
    interestType: InterestType = 'REDUCING'
  ): InterestCalculationResult {
    if (principal <= 0 || months <= 0) {
      return {
        monthlyPayment: 0,
        totalInterest: 0,
        totalPayment: principal,
        schedule: []
      };
    }

    const schedule: AmortizationScheduleItem[] = [];
    let outstandingBalance = principal;
    let cumulativeInterest = 0;

    // Calculate monthly payment based on interest type
    let monthlyPayment = 0;
    let totalFlatInterest = 0;

    if (interestType === 'FLAT') {
      // For flat rate: calculate total interest first, then divide by months
      totalFlatInterest = this.calculateFlatRateInterest(principal, annualRate, months);
      monthlyPayment = (principal + totalFlatInterest) / months;
    } else {
      // For reducing/declining balance: use amortization formula
      monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, months);
    }

    // Generate schedule items
    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      let interestAmount = 0;
      let principalAmount = 0;

      if (interestType === 'FLAT') {
        // Flat rate: equal interest each month
        interestAmount = totalFlatInterest / months;
        principalAmount = principal / months;
      } else if (interestType === 'REDUCING' || interestType === 'DECLINING') {
        // Declining balance: interest on outstanding balance
        const monthlyRate = annualRate / 12 / 100;
        interestAmount = outstandingBalance * monthlyRate;
        principalAmount = monthlyPayment - interestAmount;
      } else {
        // Default to reducing balance
        const monthlyRate = annualRate / 12 / 100;
        interestAmount = outstandingBalance * monthlyRate;
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
   * Calculate early repayment amount (Industry Standard Practice)
   * 
   * Used by: Banks and microfinance institutions
   * 
   * Calculates the amount needed to fully repay a loan before maturity:
   * - Remaining principal balance
   * - Remaining interest (calculated on declining balance)
   * - Early repayment penalty (if applicable)
   * 
   * This is transparent and allows borrowers to know exact payoff amount.
   */
  static calculateEarlyRepaymentAmount(
    outstandingBalance: number,
    remainingMonths: number,
    annualRate: number,
    earlyRepaymentPenalty: number = 0 // Percentage
  ): number {
    if (outstandingBalance <= 0 || remainingMonths <= 0) {
      return outstandingBalance;
    }

    // Calculate remaining interest using declining balance method
    let remainingInterest = 0;
    let balance = outstandingBalance;
    const monthlyRate = annualRate / 12 / 100;
    const monthlyPayment = this.calculateMonthlyPayment(outstandingBalance, annualRate, remainingMonths);

    for (let i = 0; i < remainingMonths; i++) {
      const interest = balance * monthlyRate;
      remainingInterest += interest;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;
      
      if (balance < 0) balance = 0;
    }

    // Apply penalty if applicable
    const penalty = (outstandingBalance * earlyRepaymentPenalty) / 100;

    return outstandingBalance + remainingInterest + penalty;
  }

  /**
   * Calculate interest for a specific period (Industry Standard: Daily Interest)
   * 
   * Used by: Banks for partial period calculations, late payment interest
   * Formula: Interest = Outstanding Balance × (Annual Rate / 365) × Number of Days
   * 
   * This method is used for:
   * - Calculating interest for partial months
   * - Late payment charges
   * - Interest accrual between payment dates
   */
  static calculateInterestForPeriod(
    outstandingBalance: number,
    annualRate: number,
    days: number
  ): number {
    if (outstandingBalance <= 0 || annualRate < 0 || days <= 0) return 0;
    
    const dailyRate = annualRate / 365 / 100;
    return outstandingBalance * dailyRate * days;
  }

  /**
   * Calculate effective annual rate (EAR) - Industry Standard Disclosure
   * 
   * Used by: Banks and regulators for transparent rate comparison
   * Formula: EAR = (1 + r/n)^n - 1
   * 
   * Where:
   * - r = Nominal annual rate
   * - n = Compounding periods per year
   * 
   * This shows the true annual cost of borrowing when interest is compounded.
   * 
   * Example: 12% nominal rate compounded monthly
   * EAR = (1 + 0.12/12)^12 - 1 = 12.68%
   * 
   * Important for comparing different interest calculation methods:
   * - Simple/Flat rate: EAR is higher than stated rate
   * - Declining balance: EAR is close to stated rate
   */
  static calculateEffectiveAnnualRate(
    nominalRate: number,
    compoundingPeriodsPerYear: number = 12
  ): number {
    if (nominalRate < 0 || compoundingPeriodsPerYear <= 0) return 0;
    
    const rate = nominalRate / 100;
    const ear = Math.pow(1 + rate / compoundingPeriodsPerYear, compoundingPeriodsPerYear) - 1;
    return ear * 100;
  }

  /**
   * Calculate APR (Annual Percentage Rate) - Industry Standard Disclosure
   * 
   * Used by: Banks and regulators (required by law in many jurisdictions)
   * 
   * APR includes:
   * - Interest charges
   * - Fees and other costs
   * - Expressed as annual percentage
   * 
   * Calculation Method: Newton-Raphson iterative method
   * This finds the interest rate that makes the present value of all payments
   * equal to the loan principal.
   * 
   * Important: APR is often higher than the stated interest rate because it
   * includes all costs of borrowing.
   */
  static calculateAPR(
    monthlyPayment: number,
    principal: number,
    months: number
  ): number {
    if (monthlyPayment <= 0 || principal <= 0 || months <= 0) return 0;
    
    // Using Newton-Raphson method to find APR
    let apr = 0.1; // Initial guess (10%)
    const precision = 0.0001;
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      const monthlyRate = apr / 12;
      
      // Present value of annuity formula
      const pv = monthlyPayment * (Math.pow(1 + monthlyRate, months) - 1) / 
                 (monthlyRate * Math.pow(1 + monthlyRate, months));
      
      // Derivative for Newton-Raphson
      const derivative = (monthlyPayment * months * Math.pow(1 + monthlyRate, months - 1)) / 
                        (12 * Math.pow(1 + monthlyRate, months)) - 
                        (monthlyPayment * (Math.pow(1 + monthlyRate, months) - 1)) / 
                        (12 * monthlyRate * Math.pow(1 + monthlyRate, months));

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
