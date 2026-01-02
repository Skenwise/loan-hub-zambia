/**
 * Repayment Service
 * Handles all repayment operations including allocation, penalties, IFRS 9 updates
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, Repayments, LoanProducts } from '@/entities';

export interface RepaymentAllocation {
  penalties: number;
  fees: number;
  interest: number;
  principal: number;
  total: number;
}

export interface RepaymentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LoanRepaymentStatus {
  loanId: string;
  outstandingPrincipal: number;
  outstandingInterest: number;
  penalties: number;
  totalOutstanding: number;
  arrearsDays: number;
  nextInstallmentDate: string | null;
  nextInstallmentAmount: number;
  loanStatus: string;
  daysOverdue: number;
}

export class RepaymentService {
  /**
   * Get active loans ready for repayment
   */
  static async getActiveLoansForRepayment(organisationId: string): Promise<Loans[]> {
    const { items } = await BaseCrudService.getAll<Loans>('loans');
    return items.filter(
      (loan) =>
        loan.organisationId === organisationId &&
        (loan.loanStatus === 'ACTIVE' || loan.loanStatus === 'OVERDUE')
    );
  }

  /**
   * Get repayment status for a specific loan
   */
  static async getLoanRepaymentStatus(loanId: string): Promise<LoanRepaymentStatus> {
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);

    if (!loan) {
      throw new Error('Loan not found');
    }

    const outstandingPrincipal = loan.outstandingBalance || 0;
    const nextInstallmentDate = loan.nextPaymentDate;
    const nextInstallmentAmount = this.calculateMonthlyPayment(
      loan.principalAmount || 0,
      loan.interestRate || 0,
      loan.loanTermMonths || 0
    );

    // Calculate arrears days
    const today = new Date();
    const dueDate = nextInstallmentDate ? new Date(nextInstallmentDate) : null;
    const daysOverdue = dueDate && dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Calculate penalties (simplified - 2% per month overdue)
    const penalties = daysOverdue > 0 ? (outstandingPrincipal * 0.02 * Math.ceil(daysOverdue / 30)) : 0;

    // Calculate outstanding interest (simplified)
    const outstandingInterest = (loan.principalAmount || 0) * (loan.interestRate || 0) / 100 / 12;

    return {
      loanId,
      outstandingPrincipal,
      outstandingInterest,
      penalties,
      totalOutstanding: outstandingPrincipal + outstandingInterest + penalties,
      arrearsDays: daysOverdue,
      nextInstallmentDate: nextInstallmentDate ? new Date(nextInstallmentDate).toISOString().split('T')[0] : null,
      nextInstallmentAmount,
      loanStatus: loan.loanStatus || 'UNKNOWN',
      daysOverdue,
    };
  }

  /**
   * Validate repayment before posting
   */
  static async validateRepayment(
    loanId: string,
    amount: number,
    paymentDate: string,
    staffId: string,
    disbursedBy?: string
  ): Promise<RepaymentValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if payment date is in future
    const today = new Date();
    const pDate = new Date(paymentDate);
    if (pDate > today) {
      errors.push('Payment date cannot be in the future');
    }

    // Check segregation of duties
    if (disbursedBy && disbursedBy === staffId) {
      errors.push('You cannot post repayments for loans you disbursed (segregation of duties)');
    }

    // Check loan status
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);
    if (!loan) {
      errors.push('Loan not found');
    } else if (loan.loanStatus === 'CLOSED' || loan.loanStatus === 'WRITTEN_OFF') {
      errors.push(`Cannot post repayment for ${loan.loanStatus} loan`);
    }

    // Check amount
    if (amount <= 0) {
      errors.push('Repayment amount must be greater than zero');
    }

    const status = await this.getLoanRepaymentStatus(loanId);
    if (amount > status.totalOutstanding * 1.1) {
      warnings.push('Repayment amount exceeds outstanding balance by more than 10%');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Allocate payment to penalties, fees, interest, and principal
   */
  static allocatePayment(
    amount: number,
    penalties: number,
    fees: number,
    interest: number,
    principal: number,
    allocationOrder: string[] = ['penalties', 'fees', 'interest', 'principal']
  ): RepaymentAllocation {
    let remaining = amount;
    const allocation: RepaymentAllocation = {
      penalties: 0,
      fees: 0,
      interest: 0,
      principal: 0,
      total: amount,
    };

    for (const item of allocationOrder) {
      if (remaining <= 0) break;

      switch (item) {
        case 'penalties':
          allocation.penalties = Math.min(remaining, penalties);
          remaining -= allocation.penalties;
          break;
        case 'fees':
          allocation.fees = Math.min(remaining, fees);
          remaining -= allocation.fees;
          break;
        case 'interest':
          allocation.interest = Math.min(remaining, interest);
          remaining -= allocation.interest;
          break;
        case 'principal':
          allocation.principal = Math.min(remaining, principal);
          remaining -= allocation.principal;
          break;
      }
    }

    return allocation;
  }

  /**
   * Post a repayment
   */
  static async postRepayment(
    loanId: string,
    amount: number,
    paymentDate: string,
    paymentMethod: string,
    referenceNumber: string,
    staffId: string,
    organisationId: string,
    notes?: string
  ): Promise<string> {
    // Validate
    const validation = await this.validateRepayment(loanId, amount, paymentDate, staffId);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }

    // Get loan and status
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);
    if (!loan) throw new Error('Loan not found');

    const status = await this.getLoanRepaymentStatus(loanId);

    // Allocate payment
    const allocation = this.allocatePayment(
      amount,
      status.penalties,
      0,
      status.outstandingInterest,
      status.outstandingPrincipal
    );

    // Create repayment record
    const repaymentId = crypto.randomUUID();
    await BaseCrudService.create('repayments', {
      _id: repaymentId,
      organisationId,
      loanId,
      transactionReference: referenceNumber,
      repaymentDate: new Date(paymentDate),
      totalAmountPaid: amount,
      principalAmount: allocation.principal,
      interestAmount: allocation.interest,
      paymentMethod,
    });

    // Update loan outstanding balance
    const newOutstanding = Math.max(0, status.outstandingPrincipal - allocation.principal);
    await BaseCrudService.update<Loans>('loans', {
      _id: loanId,
      outstandingBalance: newOutstanding,
      loanStatus: newOutstanding === 0 ? 'CLOSED' : loan.loanStatus,
    });

    // Update IFRS 9 if needed
    if (status.daysOverdue > 0) {
      await this.updateIFRS9Status(loanId, organisationId);
    }

    return repaymentId;
  }

  /**
   * Update IFRS 9 staging based on repayment
   */
  static async updateIFRS9Status(loanId: string, organisationId: string): Promise<void> {
    const status = await this.getLoanRepaymentStatus(loanId);

    // Determine IFRS 9 stage
    let stage = 'Stage 1'; // Normal
    if (status.daysOverdue > 30) {
      stage = 'Stage 2'; // Significant increase in credit risk
    }
    if (status.daysOverdue > 90) {
      stage = 'Stage 3'; // Credit-impaired
    }

    // Update ECL results
    const eclId = crypto.randomUUID();
    await BaseCrudService.create('eclresults', {
      _id: eclId,
      loanReference: loanId,
      organisationId,
      eclValue: this.calculateECL(status.totalOutstanding, status.daysOverdue),
      ifrs9Stage: stage,
      calculationTimestamp: new Date(),
      effectiveDate: new Date(),
    });
  }

  /**
   * Calculate Expected Credit Loss
   */
  static calculateECL(outstandingAmount: number, daysOverdue: number): number {
    let probabilityOfDefault = 0.01; // 1% base

    if (daysOverdue > 30) probabilityOfDefault = 0.05;
    if (daysOverdue > 90) probabilityOfDefault = 0.25;
    if (daysOverdue > 180) probabilityOfDefault = 0.5;

    const lossGivenDefault = 0.4; // 40% recovery rate
    return outstandingAmount * probabilityOfDefault * lossGivenDefault;
  }

  /**
   * Reverse a repayment
   */
  static async reverseRepayment(
    repaymentId: string,
    reason: string,
    approvedBy: string
  ): Promise<void> {
    const repayment = await BaseCrudService.getById<Repayments>('repayments', repaymentId);
    if (!repayment) throw new Error('Repayment not found');

    // Reverse the repayment by updating loan balance
    const loan = await BaseCrudService.getById<Loans>('loans', repayment.loanId || '');
    if (loan) {
      const newOutstanding = (loan.outstandingBalance || 0) + (repayment.totalAmountPaid || 0);
      await BaseCrudService.update<Loans>('loans', {
        _id: repayment.loanId || '',
        outstandingBalance: newOutstanding,
      });
    }

    // Mark repayment as reversed
    await BaseCrudService.update<Repayments>('repayments', {
      _id: repaymentId,
      paymentMethod: `REVERSED - ${repayment.paymentMethod}`,
    });
  }

  /**
   * Calculate monthly payment
   */
  static calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
    if (months === 0 || annualRate === 0) return principal / Math.max(1, months);
    const monthlyRate = annualRate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  /**
   * Get repayment history for a loan
   */
  static async getRepaymentHistory(loanId: string): Promise<Repayments[]> {
    const { items } = await BaseCrudService.getAll<Repayments>('repayments');
    return items.filter((r) => r.loanId === loanId).sort((a, b) => {
      const dateA = new Date(a.repaymentDate || 0).getTime();
      const dateB = new Date(b.repaymentDate || 0).getTime();
      return dateB - dateA;
    });
  }

  /**
   * Generate repayment receipt
   */
  static generateReceipt(
    repaymentId: string,
    loanNumber: string,
    customerName: string,
    amount: number,
    paymentDate: string,
    allocation: RepaymentAllocation
  ): string {
    const receiptNumber = `RCP-${Date.now()}`;
    return `
REPAYMENT RECEIPT
================
Receipt Number: ${receiptNumber}
Loan Number: ${loanNumber}
Customer: ${customerName}
Payment Date: ${paymentDate}

PAYMENT BREAKDOWN
=================
Penalties: ZMW ${allocation.penalties.toFixed(2)}
Fees: ZMW ${allocation.fees.toFixed(2)}
Interest: ZMW ${allocation.interest.toFixed(2)}
Principal: ZMW ${allocation.principal.toFixed(2)}
---
Total: ZMW ${allocation.total.toFixed(2)}

This receipt confirms payment has been received and processed.
    `;
  }
}
