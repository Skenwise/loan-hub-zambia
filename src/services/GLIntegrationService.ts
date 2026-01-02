/**
 * GL Integration Service
 * Handles automatic posting of accounting entries to General Ledger
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, Repayments } from '@/entities';

export interface GLEntry {
  _id: string;
  organisationId: string;
  transactionDate: Date;
  referenceNumber: string;
  description: string;
  entries: GLLineItem[];
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  postedDate?: Date;
  reversedDate?: Date;
  reversalReason?: string;
  approvedBy?: string;
  approvalDate?: Date;
}

export interface GLLineItem {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  loanId?: string;
  repaymentId?: string;
}

export interface ChartOfAccounts {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  subType: string;
  isActive: boolean;
}

export class GLIntegrationService {
  /**
   * Standard Chart of Accounts for Loan Management
   */
  static readonly CHART_OF_ACCOUNTS: Record<string, ChartOfAccounts> = {
    // Assets
    LOANS_RECEIVABLE: {
      code: '1010',
      name: 'Loans Receivable',
      type: 'ASSET',
      subType: 'Current Asset',
      isActive: true,
    },
    INTEREST_RECEIVABLE: {
      code: '1020',
      name: 'Interest Receivable',
      type: 'ASSET',
      subType: 'Current Asset',
      isActive: true,
    },
    CASH_AND_BANK: {
      code: '1030',
      name: 'Cash and Bank Accounts',
      type: 'ASSET',
      subType: 'Current Asset',
      isActive: true,
    },

    // Liabilities
    LOAN_LOSS_PROVISION: {
      code: '2010',
      name: 'Loan Loss Provision',
      type: 'LIABILITY',
      subType: 'Current Liability',
      isActive: true,
    },

    // Revenue
    INTEREST_INCOME: {
      code: '4010',
      name: 'Interest Income',
      type: 'REVENUE',
      subType: 'Operating Revenue',
      isActive: true,
    },
    PENALTY_INCOME: {
      code: '4020',
      name: 'Penalty Income',
      type: 'REVENUE',
      subType: 'Operating Revenue',
      isActive: true,
    },
    PROCESSING_FEE_INCOME: {
      code: '4030',
      name: 'Processing Fee Income',
      type: 'REVENUE',
      subType: 'Operating Revenue',
      isActive: true,
    },

    // Expenses
    LOAN_LOSS_EXPENSE: {
      code: '5010',
      name: 'Loan Loss Expense',
      type: 'EXPENSE',
      subType: 'Operating Expense',
      isActive: true,
    },
    PENALTY_WAIVER_EXPENSE: {
      code: '5020',
      name: 'Penalty Waiver Expense',
      type: 'EXPENSE',
      subType: 'Operating Expense',
      isActive: true,
    },
  };

  /**
   * Post repayment to GL
   */
  static async postRepaymentToGL(
    repaymentId: string,
    loanId: string,
    amount: number,
    principalAmount: number,
    interestAmount: number,
    organisationId: string,
    paymentMethod: string,
    referenceNumber: string
  ): Promise<GLEntry> {
    const glEntryId = crypto.randomUUID();
    const today = new Date();

    const entries: GLLineItem[] = [];

    // Debit: Cash and Bank (increase asset)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.CASH_AND_BANK.code,
      accountName: this.CHART_OF_ACCOUNTS.CASH_AND_BANK.name,
      debit: amount,
      credit: 0,
      description: `Repayment received via ${paymentMethod}`,
      repaymentId,
      loanId,
    });

    // Credit: Loans Receivable (decrease asset)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.LOANS_RECEIVABLE.code,
      accountName: this.CHART_OF_ACCOUNTS.LOANS_RECEIVABLE.name,
      debit: 0,
      credit: principalAmount,
      description: 'Principal repayment',
      repaymentId,
      loanId,
    });

    // Credit: Interest Receivable (decrease asset) - if interest was paid
    if (interestAmount > 0) {
      entries.push({
        accountCode: this.CHART_OF_ACCOUNTS.INTEREST_RECEIVABLE.code,
        accountName: this.CHART_OF_ACCOUNTS.INTEREST_RECEIVABLE.name,
        debit: 0,
        credit: interestAmount,
        description: 'Interest repayment',
        repaymentId,
        loanId,
      });
    }

    const glEntry: GLEntry = {
      _id: glEntryId,
      organisationId,
      transactionDate: today,
      referenceNumber,
      description: `Loan repayment - ${referenceNumber}`,
      entries,
      totalDebit: amount,
      totalCredit: principalAmount + interestAmount,
      status: 'POSTED',
      postedDate: today,
    };

    // Validate GL entry
    if (Math.abs(glEntry.totalDebit - glEntry.totalCredit) > 0.01) {
      throw new Error('GL entry is not balanced');
    }

    return glEntry;
  }

  /**
   * Post interest accrual to GL
   */
  static async postInterestAccrualToGL(
    loanId: string,
    interestAmount: number,
    organisationId: string,
    accrualDate: string
  ): Promise<GLEntry> {
    const glEntryId = crypto.randomUUID();
    const today = new Date();

    const entries: GLLineItem[] = [];

    // Debit: Interest Receivable (increase asset)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.INTEREST_RECEIVABLE.code,
      accountName: this.CHART_OF_ACCOUNTS.INTEREST_RECEIVABLE.name,
      debit: interestAmount,
      credit: 0,
      description: 'Interest accrual',
      loanId,
    });

    // Credit: Interest Income (increase revenue)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.INTEREST_INCOME.code,
      accountName: this.CHART_OF_ACCOUNTS.INTEREST_INCOME.name,
      debit: 0,
      credit: interestAmount,
      description: 'Interest income accrual',
      loanId,
    });

    const glEntry: GLEntry = {
      _id: glEntryId,
      organisationId,
      transactionDate: new Date(accrualDate),
      referenceNumber: `INT-ACCRUAL-${loanId}-${accrualDate}`,
      description: `Interest accrual for loan ${loanId}`,
      entries,
      totalDebit: interestAmount,
      totalCredit: interestAmount,
      status: 'POSTED',
      postedDate: today,
    };

    return glEntry;
  }

  /**
   * Post penalty to GL
   */
  static async postPenaltyToGL(
    loanId: string,
    penaltyAmount: number,
    organisationId: string,
    penaltyDate: string
  ): Promise<GLEntry> {
    const glEntryId = crypto.randomUUID();
    const today = new Date();

    const entries: GLLineItem[] = [];

    // Debit: Penalty Receivable (increase asset) - using Interest Receivable as proxy
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.INTEREST_RECEIVABLE.code,
      accountName: 'Penalty Receivable',
      debit: penaltyAmount,
      credit: 0,
      description: 'Penalty accrual',
      loanId,
    });

    // Credit: Penalty Income (increase revenue)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.PENALTY_INCOME.code,
      accountName: this.CHART_OF_ACCOUNTS.PENALTY_INCOME.name,
      debit: 0,
      credit: penaltyAmount,
      description: 'Penalty income accrual',
      loanId,
    });

    const glEntry: GLEntry = {
      _id: glEntryId,
      organisationId,
      transactionDate: new Date(penaltyDate),
      referenceNumber: `PEN-${loanId}-${penaltyDate}`,
      description: `Penalty accrual for loan ${loanId}`,
      entries,
      totalDebit: penaltyAmount,
      totalCredit: penaltyAmount,
      status: 'POSTED',
      postedDate: today,
    };

    return glEntry;
  }

  /**
   * Post penalty waiver to GL
   */
  static async postPenaltyWaiverToGL(
    loanId: string,
    waiverAmount: number,
    organisationId: string,
    waiverDate: string,
    approvedBy: string
  ): Promise<GLEntry> {
    const glEntryId = crypto.randomUUID();
    const today = new Date();

    const entries: GLLineItem[] = [];

    // Debit: Penalty Waiver Expense (increase expense)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.PENALTY_WAIVER_EXPENSE.code,
      accountName: this.CHART_OF_ACCOUNTS.PENALTY_WAIVER_EXPENSE.name,
      debit: waiverAmount,
      credit: 0,
      description: 'Penalty waiver',
      loanId,
    });

    // Credit: Penalty Receivable (decrease asset)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.INTEREST_RECEIVABLE.code,
      accountName: 'Penalty Receivable',
      debit: 0,
      credit: waiverAmount,
      description: 'Penalty waiver reversal',
      loanId,
    });

    const glEntry: GLEntry = {
      _id: glEntryId,
      organisationId,
      transactionDate: new Date(waiverDate),
      referenceNumber: `WAIVER-${loanId}-${waiverDate}`,
      description: `Penalty waiver for loan ${loanId}`,
      entries,
      totalDebit: waiverAmount,
      totalCredit: waiverAmount,
      status: 'POSTED',
      postedDate: today,
      approvedBy,
      approvalDate: today,
    };

    return glEntry;
  }

  /**
   * Post loan loss provision to GL
   */
  static async postLoanLossProvisionToGL(
    loanId: string,
    provisionAmount: number,
    organisationId: string,
    provisionDate: string
  ): Promise<GLEntry> {
    const glEntryId = crypto.randomUUID();
    const today = new Date();

    const entries: GLLineItem[] = [];

    // Debit: Loan Loss Expense (increase expense)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.LOAN_LOSS_EXPENSE.code,
      accountName: this.CHART_OF_ACCOUNTS.LOAN_LOSS_EXPENSE.name,
      debit: provisionAmount,
      credit: 0,
      description: 'Loan loss provision',
      loanId,
    });

    // Credit: Loan Loss Provision (increase liability)
    entries.push({
      accountCode: this.CHART_OF_ACCOUNTS.LOAN_LOSS_PROVISION.code,
      accountName: this.CHART_OF_ACCOUNTS.LOAN_LOSS_PROVISION.name,
      debit: 0,
      credit: provisionAmount,
      description: 'Loan loss provision',
      loanId,
    });

    const glEntry: GLEntry = {
      _id: glEntryId,
      organisationId,
      transactionDate: new Date(provisionDate),
      referenceNumber: `PROV-${loanId}-${provisionDate}`,
      description: `Loan loss provision for loan ${loanId}`,
      entries,
      totalDebit: provisionAmount,
      totalCredit: provisionAmount,
      status: 'POSTED',
      postedDate: today,
    };

    return glEntry;
  }

  /**
   * Reverse GL entry
   */
  static async reverseGLEntry(
    glEntryId: string,
    reversalReason: string,
    approvedBy: string
  ): Promise<GLEntry> {
    // In production, fetch from GL database
    // For now, return a reversal entry structure

    const today = new Date();

    const reversalEntry: GLEntry = {
      _id: crypto.randomUUID(),
      organisationId: '',
      transactionDate: today,
      referenceNumber: `REV-${glEntryId}`,
      description: `Reversal of ${glEntryId}: ${reversalReason}`,
      entries: [],
      totalDebit: 0,
      totalCredit: 0,
      status: 'POSTED',
      postedDate: today,
      approvedBy,
      approvalDate: today,
    };

    return reversalEntry;
  }

  /**
   * Generate trial balance
   */
  static async generateTrialBalance(organisationId: string): Promise<any> {
    // In production, query GL database
    // For now, return structure

    return {
      organisationId,
      generatedDate: new Date(),
      accounts: Object.values(this.CHART_OF_ACCOUNTS).map((account) => ({
        code: account.code,
        name: account.name,
        type: account.type,
        debit: 0,
        credit: 0,
      })),
      totalDebit: 0,
      totalCredit: 0,
      isBalanced: true,
    };
  }

  /**
   * Export GL entries to format suitable for external GL systems
   */
  static exportGLEntries(entries: GLEntry[]): string {
    let csv = 'TransactionDate,ReferenceNumber,AccountCode,AccountName,Debit,Credit,Description\n';

    for (const entry of entries) {
      for (const lineItem of entry.entries) {
        const row = [
          entry.transactionDate.toISOString().split('T')[0],
          entry.referenceNumber,
          lineItem.accountCode,
          lineItem.accountName,
          lineItem.debit,
          lineItem.credit,
          lineItem.description,
        ];
        csv += row.map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(',') + '\n';
      }
    }

    return csv;
  }
}
