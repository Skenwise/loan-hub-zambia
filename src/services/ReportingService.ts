/**
 * Reporting Service
 * Comprehensive reporting for all loan management operations
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, Repayments, CustomerProfiles, Organizations, StaffMembers } from '@/entities';

export interface LoanPortfolioReport {
  reportDate: Date;
  active: { count: number; amount: number };
  approvedNotDisbursed: { count: number; amount: number };
  disbursed: { count: number; amount: number };
  closed: { count: number; amount: number };
  writtenOff: { count: number; amount: number };
  restructured: { count: number; amount: number };
  refinanced: { count: number; amount: number };
  totalLoans: number;
  totalAmount: number;
}

export interface RepaymentCollectionsReport {
  period: string;
  totalScheduled: number;
  totalCollected: number;
  collectionRate: number;
  byChannel: Record<string, number>;
  partialPayments: number;
  prepayments: number;
  penaltiesCharged: number;
  penaltiesCollected: number;
  penaltiesWaived: number;
}

export interface ArrearsNPLReport {
  reportDate: Date;
  loansInArrears: number;
  amountInArrears: number;
  par1to30: { count: number; amount: number };
  par31to60: { count: number; amount: number };
  par61to90: { count: number; amount: number };
  par90plus: { count: number; amount: number };
  portfolioAtRisk: number;
  nplRatio: number;
  recoveryPerformance: {
    recovered: number;
    written: number;
    pending: number;
  };
}

export interface CustomerLoanReport {
  customerId: string;
  customerName: string;
  totalLoans: number;
  totalBorrowed: number;
  totalRepaid: number;
  totalOutstanding: number;
  loans: Array<{
    loanNumber: string;
    principal: number;
    outstanding: number;
    status: string;
    nextPaymentDate: string;
  }>;
}

export interface CreditRiskReport {
  creditScoreDistribution: Record<string, number>;
  approvalRate: number;
  rejectionRate: number;
  exposureByBranch: Record<string, number>;
  exposureByProduct: Record<string, number>;
  largeExposures: Array<{
    customerId: string;
    customerName: string;
    exposure: number;
    percentage: number;
  }>;
  collateralCoverage: {
    avgLTV: number;
    loansWithCollateral: number;
    loansWithoutCollateral: number;
  };
}

export interface ECLReport {
  reportDate: Date;
  financialYear: string;
  stage1: {
    count: number;
    amount: number;
    ecl: number;
  };
  stage2: {
    count: number;
    amount: number;
    ecl: number;
  };
  stage3: {
    count: number;
    amount: number;
    ecl: number;
  };
  totalECL: number;
  impairmentCharge: number;
  writeOffImpact: number;
}

export interface FinancialStatementReport {
  reportDate: Date;
  trialBalance: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
  incomeStatement: {
    interestIncome: number;
    feeIncome: number;
    totalIncome: number;
    operatingExpenses: number;
    loanLossExpense: number;
    netIncome: number;
  };
  balanceSheet: {
    assets: number;
    liabilities: number;
    equity: number;
  };
  cashFlow: {
    operatingActivities: number;
    investingActivities: number;
    financingActivities: number;
    netCashFlow: number;
  };
}

export class ReportingService {
  /**
   * Generate loan portfolio report
   */
  static async generateLoanPortfolioReport(
    organisationId: string,
    filters?: {
      branch?: string;
      loanProduct?: string;
      loanOfficer?: string;
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<LoanPortfolioReport> {
    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');

    let filtered = loans.filter((l) => l.organisationId === organisationId);

    if (filters?.branch) {
      // Filter by branch through customer
      const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      const branchCustomers = customers.filter((c) => c.residentialAddress === filters.branch);
      const branchCustomerIds = branchCustomers.map((c) => c._id);
      filtered = filtered.filter((l) => branchCustomerIds.includes(l.customerId || ''));
    }

    if (filters?.loanProduct) {
      filtered = filtered.filter((l) => l.loanProductId === filters.loanProduct);
    }

    const report: LoanPortfolioReport = {
      reportDate: new Date(),
      active: this.countByStatus(filtered, 'ACTIVE'),
      approvedNotDisbursed: this.countByStatus(filtered, 'APPROVED'),
      disbursed: this.countByStatus(filtered, 'DISBURSED'),
      closed: this.countByStatus(filtered, 'CLOSED'),
      writtenOff: this.countByStatus(filtered, 'WRITTEN_OFF'),
      restructured: this.countByStatus(filtered, 'RESTRUCTURED'),
      refinanced: this.countByStatus(filtered, 'REFINANCED'),
      totalLoans: filtered.length,
      totalAmount: filtered.reduce((sum, l) => sum + (l.principalAmount || 0), 0),
    };

    return report;
  }

  /**
   * Generate repayment and collections report
   */
  static async generateRepaymentCollectionsReport(
    organisationId: string,
    period: string
  ): Promise<RepaymentCollectionsReport> {
    const { items: repayments } = await BaseCrudService.getAll<Repayments>('repayments');
    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');

    const orgRepayments = repayments.filter((r) => r.organisationId === organisationId);
    const orgLoans = loans.filter((l) => l.organisationId === organisationId);

    // Calculate scheduled repayments
    const totalScheduled = orgLoans.reduce((sum, l) => {
      const monthlyPayment = ((l.principalAmount || 0) / (l.loanTermMonths || 1)) * (1 + ((l.interestRate || 0) / 100) / 12);
      return sum + monthlyPayment;
    }, 0);

    const totalCollected = orgRepayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);

    const byChannel: Record<string, number> = {};
    for (const repayment of orgRepayments) {
      const method = repayment.paymentMethod || 'unknown';
      byChannel[method] = (byChannel[method] || 0) + (repayment.totalAmountPaid || 0);
    }

    return {
      period,
      totalScheduled,
      totalCollected,
      collectionRate: totalScheduled > 0 ? (totalCollected / totalScheduled) * 100 : 0,
      byChannel,
      partialPayments: orgRepayments.filter((r) => (r.totalAmountPaid || 0) < (r.principalAmount || 0) + (r.interestAmount || 0)).length,
      prepayments: orgRepayments.filter((r) => (r.totalAmountPaid || 0) > (r.principalAmount || 0) + (r.interestAmount || 0)).length,
      penaltiesCharged: 0, // Would need penalty tracking
      penaltiesCollected: 0,
      penaltiesWaived: 0,
    };
  }

  /**
   * Generate arrears and NPL report
   */
  static async generateArrearsNPLReport(organisationId: string): Promise<ArrearsNPLReport> {
    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');

    const orgLoans = loans.filter((l) => l.organisationId === organisationId);
    const today = new Date();

    let loansInArrears = 0;
    let amountInArrears = 0;
    const par1to30 = { count: 0, amount: 0 };
    const par31to60 = { count: 0, amount: 0 };
    const par61to90 = { count: 0, amount: 0 };
    const par90plus = { count: 0, amount: 0 };

    for (const loan of orgLoans) {
      if (loan.loanStatus === 'CLOSED' || loan.loanStatus === 'WRITTEN_OFF') continue;

      const dueDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
      if (!dueDate || dueDate >= today) continue;

      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const outstanding = loan.outstandingBalance || 0;

      loansInArrears++;
      amountInArrears += outstanding;

      if (daysOverdue <= 30) {
        par1to30.count++;
        par1to30.amount += outstanding;
      } else if (daysOverdue <= 60) {
        par31to60.count++;
        par31to60.amount += outstanding;
      } else if (daysOverdue <= 90) {
        par61to90.count++;
        par61to90.amount += outstanding;
      } else {
        par90plus.count++;
        par90plus.amount += outstanding;
      }
    }

    const totalPortfolio = orgLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
    const portfolioAtRisk = totalPortfolio > 0 ? (amountInArrears / totalPortfolio) * 100 : 0;
    const nplRatio = orgLoans.length > 0 ? (loansInArrears / orgLoans.length) * 100 : 0;

    return {
      reportDate: today,
      loansInArrears,
      amountInArrears,
      par1to30,
      par31to60,
      par61to90,
      par90plus,
      portfolioAtRisk,
      nplRatio,
      recoveryPerformance: {
        recovered: 0,
        written: 0,
        pending: loansInArrears,
      },
    };
  }

  /**
   * Generate customer loan report
   */
  static async generateCustomerLoanReport(customerId: string): Promise<CustomerLoanReport> {
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    if (!customer) throw new Error('Customer not found');

    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
    const { items: repayments } = await BaseCrudService.getAll<Repayments>('repayments');

    const customerLoans = loans.filter((l) => l.customerId === customerId);
    const customerRepayments = repayments.filter((r) =>
      customerLoans.some((l) => l._id === r.loanId)
    );

    let totalBorrowed = 0;
    let totalRepaid = 0;
    let totalOutstanding = 0;

    const loanDetails = customerLoans.map((loan) => {
      const loanRepayments = customerRepayments.filter((r) => r.loanId === loan._id);
      const repaid = loanRepayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);

      totalBorrowed += loan.principalAmount || 0;
      totalRepaid += repaid;
      totalOutstanding += loan.outstandingBalance || 0;

      return {
        loanNumber: loan.loanNumber || '',
        principal: loan.principalAmount || 0,
        outstanding: loan.outstandingBalance || 0,
        status: loan.loanStatus || 'UNKNOWN',
        nextPaymentDate: loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toISOString().split('T')[0] : 'N/A',
      };
    });

    return {
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      totalLoans: customerLoans.length,
      totalBorrowed,
      totalRepaid,
      totalOutstanding,
      loans: loanDetails,
    };
  }

  /**
   * Generate credit and risk report
   */
  static async generateCreditRiskReport(organisationId: string): Promise<CreditRiskReport> {
    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
    const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');

    const orgLoans = loans.filter((l) => l.organisationId === organisationId);
    const customerMap = new Map(customers.map((c) => [c._id, c]));

    // Credit score distribution
    const creditScoreDistribution: Record<string, number> = {
      '0-300': 0,
      '301-500': 0,
      '501-700': 0,
      '701-900': 0,
      '901+': 0,
    };

    for (const loan of orgLoans) {
      const customer = customerMap.get(loan.customerId || '');
      if (!customer) continue;

      const score = customer.creditScore || 0;
      if (score <= 300) creditScoreDistribution['0-300']++;
      else if (score <= 500) creditScoreDistribution['301-500']++;
      else if (score <= 700) creditScoreDistribution['501-700']++;
      else if (score <= 900) creditScoreDistribution['701-900']++;
      else creditScoreDistribution['901+']++;
    }

    // Exposure by branch
    const exposureByBranch: Record<string, number> = {};
    for (const loan of orgLoans) {
      const customer = customerMap.get(loan.customerId || '');
      if (!customer) continue;

      const branch = customer.residentialAddress || 'Unknown';
      exposureByBranch[branch] = (exposureByBranch[branch] || 0) + (loan.principalAmount || 0);
    }

    // Large exposures
    const largeExposures = orgLoans
      .map((loan) => {
        const customer = customerMap.get(loan.customerId || '');
        const totalExposure = orgLoans
          .filter((l) => l.customerId === loan.customerId)
          .reduce((sum, l) => sum + (l.principalAmount || 0), 0);

        return {
          customerId: loan.customerId || '',
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
          exposure: totalExposure,
          percentage: (totalExposure / (orgLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0) || 1)) * 100,
        };
      })
      .filter((e) => e.percentage > 5)
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 10);

    return {
      creditScoreDistribution,
      approvalRate: 75, // Placeholder
      rejectionRate: 25,
      exposureByBranch,
      exposureByProduct: {},
      largeExposures,
      collateralCoverage: {
        avgLTV: 65,
        loansWithCollateral: Math.floor(orgLoans.length * 0.7),
        loansWithoutCollateral: Math.floor(orgLoans.length * 0.3),
      },
    };
  }

  /**
   * Generate ECL report
   */
  static async generateECLReport(
    organisationId: string,
    financialYear: string
  ): Promise<ECLReport> {
    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');

    const orgLoans = loans.filter((l) => l.organisationId === organisationId);
    const today = new Date();

    // Simplified ECL calculation
    const stage1 = { count: 0, amount: 0, ecl: 0 };
    const stage2 = { count: 0, amount: 0, ecl: 0 };
    const stage3 = { count: 0, amount: 0, ecl: 0 };

    for (const loan of orgLoans) {
      if (loan.loanStatus === 'CLOSED' || loan.loanStatus === 'WRITTEN_OFF') continue;

      const outstanding = loan.outstandingBalance || 0;
      const dueDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
      const daysOverdue = dueDate && dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      if (daysOverdue === 0) {
        stage1.count++;
        stage1.amount += outstanding;
        stage1.ecl += outstanding * 0.01; // 1% ECL for stage 1
      } else if (daysOverdue <= 30) {
        stage2.count++;
        stage2.amount += outstanding;
        stage2.ecl += outstanding * 0.05; // 5% ECL for stage 2
      } else {
        stage3.count++;
        stage3.amount += outstanding;
        stage3.ecl += outstanding * 0.25; // 25% ECL for stage 3
      }
    }

    const totalECL = stage1.ecl + stage2.ecl + stage3.ecl;

    return {
      reportDate: today,
      financialYear,
      stage1,
      stage2,
      stage3,
      totalECL,
      impairmentCharge: totalECL * 0.1,
      writeOffImpact: 0,
    };
  }

  /**
   * Export report to CSV
   */
  static exportToCSV(data: any[], headers: string[]): string {
    let csv = headers.join(',') + '\n';

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    }

    return csv;
  }

  /**
   * Export report to PDF (placeholder)
   */
  static exportToPDF(reportName: string, data: any): string {
    // In production, use a library like jsPDF or pdfkit
    return `PDF Export: ${reportName}`;
  }

  private static countByStatus(
    loans: Loans[],
    status: string
  ): { count: number; amount: number } {
    const filtered = loans.filter((l) => l.loanStatus === status);
    return {
      count: filtered.length,
      amount: filtered.reduce((sum, l) => sum + (l.principalAmount || 0), 0),
    };
  }
}
