/**
 * Advanced Reporting Service
 * Generates comprehensive reports for repayments, collections, and aging analysis
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, Repayments, CustomerProfiles } from '@/entities';

export interface DailyCollectionReport {
  date: string;
  totalCollections: number;
  numberOfTransactions: number;
  byPaymentMethod: Record<string, number>;
  byBranch: Record<string, number>;
  topCollectors: Array<{ staffName: string; amount: number; count: number }>;
}

export interface BranchAnalysisReport {
  branch: string;
  totalLoans: number;
  totalOutstanding: number;
  totalCollected: number;
  collectionRate: number;
  averageLoanAmount: number;
  overdueLoanCount: number;
  overdueAmount: number;
  performanceScore: number;
}

export interface AgingReport {
  date: string;
  current: { count: number; amount: number };
  thirtyDays: { count: number; amount: number };
  sixtyDays: { count: number; amount: number };
  ninetyDays: { count: number; amount: number };
  oneTwentyDays: { count: number; amount: number };
  overOneTwenty: { count: number; amount: number };
  totalOverdue: { count: number; amount: number };
}

export interface CustomerRepaymentHistory {
  customerId: string;
  customerName: string;
  loanCount: number;
  totalBorrowed: number;
  totalRepaid: number;
  totalOutstanding: number;
  averagePaymentDelay: number;
  defaultRiskScore: number;
  loans: Array<{
    loanNumber: string;
    principal: number;
    outstanding: number;
    status: string;
    daysOverdue: number;
  }>;
}

export interface CollectionTrendReport {
  period: string;
  dailyAverage: number;
  weeklyTotal: number;
  monthlyTotal: number;
  growthRate: number;
  targetAchievement: number;
}

export class AdvancedReportingService {
  /**
   * Generate daily collection report
   */
  static async generateDailyCollectionReport(
    organisationId: string,
    date: string
  ): Promise<DailyCollectionReport> {
    const { items: repayments } = await BaseCrudService.getAll<Repayments>('repayments');

    const dayRepayments = repayments.filter(
      (r) =>
        r.organisationId === organisationId &&
        r.repaymentDate &&
        new Date(r.repaymentDate).toISOString().split('T')[0] === date
    );

    const totalCollections = dayRepayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);
    const byPaymentMethod: Record<string, number> = {};
    const byBranch: Record<string, number> = {};
    const staffCollections: Record<string, { amount: number; count: number }> = {};

    // Get all loans and customers for branch mapping
    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
    const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');

    const loanMap = new Map(loans.map((l) => [l._id, l]));
    const customerMap = new Map(customers.map((c) => [c._id, c]));

    for (const repayment of dayRepayments) {
      // By payment method
      const method = repayment.paymentMethod || 'unknown';
      byPaymentMethod[method] = (byPaymentMethod[method] || 0) + (repayment.totalAmountPaid || 0);

      // By branch
      const loan = loanMap.get(repayment.loanId || '');
      if (loan) {
        const customer = customerMap.get(loan.customerId || '');
        if (customer) {
          const branch = customer.residentialAddress || 'Unknown';
          byBranch[branch] = (byBranch[branch] || 0) + (repayment.totalAmountPaid || 0);
        }
      }
    }

    const topCollectors = Object.entries(staffCollections)
      .map(([name, data]) => ({
        staffName: name,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      date,
      totalCollections,
      numberOfTransactions: dayRepayments.length,
      byPaymentMethod,
      byBranch,
      topCollectors,
    };
  }

  /**
   * Generate branch analysis report
   */
  static async generateBranchAnalysisReport(
    organisationId: string,
    branch?: string
  ): Promise<BranchAnalysisReport[]> {
    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
    const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
    const { items: repayments } = await BaseCrudService.getAll<Repayments>('repayments');

    const orgLoans = loans.filter((l) => l.organisationId === organisationId);
    const customerMap = new Map(customers.map((c) => [c._id, c]));

    // Group by branch
    const branchData: Record<string, any> = {};

    for (const loan of orgLoans) {
      const customer = customerMap.get(loan.customerId || '');
      const branchName = customer?.residentialAddress || 'Unknown';

      if (branch && branchName !== branch) continue;

      if (!branchData[branchName]) {
        branchData[branchName] = {
          totalLoans: 0,
          totalOutstanding: 0,
          totalPrincipal: 0,
          overdueLoanCount: 0,
          overdueAmount: 0,
          loanIds: [],
        };
      }

      branchData[branchName].totalLoans++;
      branchData[branchName].totalOutstanding += loan.outstandingBalance || 0;
      branchData[branchName].totalPrincipal += loan.principalAmount || 0;
      branchData[branchName].loanIds.push(loan._id);

      // Check if overdue
      const dueDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
      if (dueDate && dueDate < new Date()) {
        branchData[branchName].overdueLoanCount++;
        branchData[branchName].overdueAmount += loan.outstandingBalance || 0;
      }
    }

    // Calculate collected amounts
    const loanRepayments: Record<string, number> = {};
    for (const repayment of repayments) {
      if (repayment.loanId) {
        loanRepayments[repayment.loanId] = (loanRepayments[repayment.loanId] || 0) + (repayment.totalAmountPaid || 0);
      }
    }

    // Generate reports
    const reports: BranchAnalysisReport[] = [];

    for (const [branchName, data] of Object.entries(branchData)) {
      const totalCollected = data.loanIds.reduce((sum: number, loanId: string) => sum + (loanRepayments[loanId] || 0), 0);
      const collectionRate = data.totalPrincipal > 0 ? (totalCollected / data.totalPrincipal) * 100 : 0;
      const performanceScore = Math.min(100, collectionRate + (100 - (data.overdueLoanCount / data.totalLoans) * 100));

      reports.push({
        branch: branchName,
        totalLoans: data.totalLoans,
        totalOutstanding: data.totalOutstanding,
        totalCollected,
        collectionRate,
        averageLoanAmount: data.totalPrincipal / data.totalLoans,
        overdueLoanCount: data.overdueLoanCount,
        overdueAmount: data.overdueAmount,
        performanceScore,
      });
    }

    return reports.sort((a, b) => b.performanceScore - a.performanceScore);
  }

  /**
   * Generate aging report
   */
  static async generateAgingReport(organisationId: string): Promise<AgingReport> {
    const { items: loans } = await BaseCrudService.getAll<Loans>('loans');

    const orgLoans = loans.filter((l) => l.organisationId === organisationId);
    const today = new Date();

    const aging = {
      current: { count: 0, amount: 0 },
      thirtyDays: { count: 0, amount: 0 },
      sixtyDays: { count: 0, amount: 0 },
      ninetyDays: { count: 0, amount: 0 },
      oneTwentyDays: { count: 0, amount: 0 },
      overOneTwenty: { count: 0, amount: 0 },
      totalOverdue: { count: 0, amount: 0 },
    };

    for (const loan of orgLoans) {
      if (loan.loanStatus === 'CLOSED' || loan.loanStatus === 'WRITTEN_OFF') continue;

      const dueDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
      const outstanding = loan.outstandingBalance || 0;

      if (!dueDate || dueDate >= today) {
        aging.current.count++;
        aging.current.amount += outstanding;
      } else {
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        aging.totalOverdue.count++;
        aging.totalOverdue.amount += outstanding;

        if (daysOverdue <= 30) {
          aging.thirtyDays.count++;
          aging.thirtyDays.amount += outstanding;
        } else if (daysOverdue <= 60) {
          aging.sixtyDays.count++;
          aging.sixtyDays.amount += outstanding;
        } else if (daysOverdue <= 90) {
          aging.ninetyDays.count++;
          aging.ninetyDays.amount += outstanding;
        } else if (daysOverdue <= 120) {
          aging.oneTwentyDays.count++;
          aging.oneTwentyDays.amount += outstanding;
        } else {
          aging.overOneTwenty.count++;
          aging.overOneTwenty.amount += outstanding;
        }
      }
    }

    return {
      date: today.toISOString().split('T')[0],
      ...aging,
    };
  }

  /**
   * Generate customer repayment history
   */
  static async generateCustomerRepaymentHistory(
    customerId: string
  ): Promise<CustomerRepaymentHistory> {
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
    let totalPaymentDelay = 0;
    let paymentCount = 0;

    const loanDetails = customerLoans.map((loan) => {
      const loanRepayments = customerRepayments.filter((r) => r.loanId === loan._id);
      const loanRepaid = loanRepayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);

      totalBorrowed += loan.principalAmount || 0;
      totalRepaid += loanRepaid;
      totalOutstanding += loan.outstandingBalance || 0;

      // Calculate average payment delay
      const dueDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
      if (dueDate) {
        for (const repayment of loanRepayments) {
          const repaymentDate = new Date(repayment.repaymentDate || 0);
          const delay = Math.max(0, Math.floor((repaymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
          totalPaymentDelay += delay;
          paymentCount++;
        }
      }

      const daysOverdue = dueDate && dueDate < new Date() ? Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      return {
        loanNumber: loan.loanNumber || '',
        principal: loan.principalAmount || 0,
        outstanding: loan.outstandingBalance || 0,
        status: loan.loanStatus || 'UNKNOWN',
        daysOverdue,
      };
    });

    // Calculate default risk score (0-100, higher = more risk)
    const averagePaymentDelay = paymentCount > 0 ? totalPaymentDelay / paymentCount : 0;
    const overdueLoans = loanDetails.filter((l) => l.daysOverdue > 0).length;
    const defaultRiskScore = Math.min(
      100,
      (averagePaymentDelay / 30) * 30 + (overdueLoans / customerLoans.length) * 40 + (totalOutstanding / totalBorrowed) * 30
    );

    return {
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      loanCount: customerLoans.length,
      totalBorrowed,
      totalRepaid,
      totalOutstanding,
      averagePaymentDelay: Math.round(averagePaymentDelay),
      defaultRiskScore: Math.round(defaultRiskScore),
      loans: loanDetails,
    };
  }

  /**
   * Generate collection trend report
   */
  static async generateCollectionTrendReport(
    organisationId: string,
    days: number = 30
  ): Promise<CollectionTrendReport[]> {
    const { items: repayments } = await BaseCrudService.getAll<Repayments>('repayments');

    const orgRepayments = repayments.filter((r) => r.organisationId === organisationId);
    const today = new Date();
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    // Group by day
    const dailyCollections: Record<string, number> = {};

    for (const repayment of orgRepayments) {
      const repaymentDate = repayment.repaymentDate ? new Date(repayment.repaymentDate) : null;
      if (!repaymentDate || repaymentDate < startDate || repaymentDate > today) continue;

      const dateStr = repaymentDate.toISOString().split('T')[0];
      dailyCollections[dateStr] = (dailyCollections[dateStr] || 0) + (repayment.totalAmountPaid || 0);
    }

    // Generate trend data
    const trends: CollectionTrendReport[] = [];
    const sortedDates = Object.keys(dailyCollections).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const dailyAmount = dailyCollections[date];

      // Calculate weekly total
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let weeklyTotal = 0;
      for (const [d, amount] of Object.entries(dailyCollections)) {
        const dDate = new Date(d);
        if (dDate >= weekStart && dDate <= weekEnd) {
          weeklyTotal += amount;
        }
      }

      // Calculate monthly total
      const monthStart = new Date(date);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      let monthlyTotal = 0;
      for (const [d, amount] of Object.entries(dailyCollections)) {
        const dDate = new Date(d);
        if (dDate >= monthStart && dDate <= monthEnd) {
          monthlyTotal += amount;
        }
      }

      // Calculate growth rate
      const previousDayAmount = i > 0 ? dailyCollections[sortedDates[i - 1]] : dailyAmount;
      const growthRate = previousDayAmount > 0 ? ((dailyAmount - previousDayAmount) / previousDayAmount) * 100 : 0;

      trends.push({
        period: date,
        dailyAverage: dailyAmount,
        weeklyTotal,
        monthlyTotal,
        growthRate,
        targetAchievement: (dailyAmount / 10000) * 100, // Assuming 10k daily target
      });
    }

    return trends;
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
   * Export report to JSON
   */
  static exportToJSON(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }
}
