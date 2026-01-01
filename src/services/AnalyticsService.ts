/**
 * Analytics Service
 * Handles portfolio analytics and reporting
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, Repayments, CustomerProfiles } from '@/entities';

export interface PortfolioMetrics {
  totalLoans: number;
  totalOutstandingBalance: number;
  totalDisbursedAmount: number;
  averageLoanSize: number;
  activeLoans: number;
  closedLoans: number;
  defaultedLoans: number;
  overdueLoanCount: number;
  overdueAmount: number;
}

export interface PerformanceMetrics {
  collectionRate: number;
  repaymentRate: number;
  defaultRate: number;
  overdueRate: number;
  averageMonthlyCollection: number;
  portfolioYield: number;
  costOfFunds: number;
  netInterestMargin: number;
}

export interface RiskMetrics {
  defaultRisk: number;
  concentrationRisk: number;
  creditQuality: number;
  portfolioAtRisk: number;
  expectedCreditLoss: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  defaultingCustomers: number;
  averageCreditScore: number;
  kycComplianceRate: number;
}

export class AnalyticsService {
  /**
   * Get portfolio metrics
   */
  static async getPortfolioMetrics(organisationId: string): Promise<PortfolioMetrics> {
    try {
      const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
      const orgLoans = loans.filter(l => l.organisationId === organisationId);

      const totalLoans = orgLoans.length;
      const totalOutstandingBalance = orgLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
      const totalDisbursedAmount = orgLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
      const averageLoanSize = totalLoans > 0 ? totalDisbursedAmount / totalLoans : 0;
      const activeLoans = orgLoans.filter(l => l.loanStatus === 'ACTIVE').length;
      const closedLoans = orgLoans.filter(l => l.loanStatus === 'CLOSED').length;
      const defaultedLoans = orgLoans.filter(l => l.loanStatus === 'DEFAULTED').length;

      // Calculate overdue loans
      const today = new Date();
      const overdueLoanCount = orgLoans.filter(l => {
        if (!l.nextPaymentDate || l.loanStatus !== 'ACTIVE') return false;
        return new Date(l.nextPaymentDate) < today;
      }).length;

      const overdueAmount = orgLoans
        .filter(l => {
          if (!l.nextPaymentDate || l.loanStatus !== 'ACTIVE') return false;
          return new Date(l.nextPaymentDate) < today;
        })
        .reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

      return {
        totalLoans,
        totalOutstandingBalance,
        totalDisbursedAmount,
        averageLoanSize,
        activeLoans,
        closedLoans,
        defaultedLoans,
        overdueLoanCount,
        overdueAmount,
      };
    } catch {
      return {
        totalLoans: 0,
        totalOutstandingBalance: 0,
        totalDisbursedAmount: 0,
        averageLoanSize: 0,
        activeLoans: 0,
        closedLoans: 0,
        defaultedLoans: 0,
        overdueLoanCount: 0,
        overdueAmount: 0,
      };
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(organisationId: string): Promise<PerformanceMetrics> {
    try {
      const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
      const { items: repayments } = await BaseCrudService.getAll<Repayments>('repayments');

      const orgLoans = loans.filter(l => l.organisationId === organisationId);
      const orgRepayments = repayments.filter(r => r.organisationId === organisationId);

      // Calculate metrics
      const totalDisbursed = orgLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
      const totalCollected = orgRepayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);
      const collectionRate = totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0;

      const activeLoans = orgLoans.filter(l => l.loanStatus === 'ACTIVE').length;
      const totalActiveLoans = orgLoans.length;
      const repaymentRate = totalActiveLoans > 0 ? (activeLoans / totalActiveLoans) * 100 : 0;

      const defaultedLoans = orgLoans.filter(l => l.loanStatus === 'DEFAULTED').length;
      const defaultRate = totalActiveLoans > 0 ? (defaultedLoans / totalActiveLoans) * 100 : 0;

      const today = new Date();
      const overdueLoans = orgLoans.filter(l => {
        if (!l.nextPaymentDate || l.loanStatus !== 'ACTIVE') return false;
        return new Date(l.nextPaymentDate) < today;
      }).length;
      const overdueRate = totalActiveLoans > 0 ? (overdueLoans / totalActiveLoans) * 100 : 0;

      // Calculate average monthly collection
      const monthsActive = 12; // Assume 12 months
      const averageMonthlyCollection = totalCollected / monthsActive;

      // Calculate portfolio yield
      const totalInterest = orgRepayments.reduce((sum, r) => sum + (r.interestAmount || 0), 0);
      const portfolioYield = totalDisbursed > 0 ? (totalInterest / totalDisbursed) * 100 : 0;

      // Placeholder values for cost of funds and NIM
      const costOfFunds = 5; // Assume 5%
      const netInterestMargin = portfolioYield - costOfFunds;

      return {
        collectionRate: Math.round(collectionRate * 100) / 100,
        repaymentRate: Math.round(repaymentRate * 100) / 100,
        defaultRate: Math.round(defaultRate * 100) / 100,
        overdueRate: Math.round(overdueRate * 100) / 100,
        averageMonthlyCollection: Math.round(averageMonthlyCollection * 100) / 100,
        portfolioYield: Math.round(portfolioYield * 100) / 100,
        costOfFunds,
        netInterestMargin: Math.round(netInterestMargin * 100) / 100,
      };
    } catch {
      return {
        collectionRate: 0,
        repaymentRate: 0,
        defaultRate: 0,
        overdueRate: 0,
        averageMonthlyCollection: 0,
        portfolioYield: 0,
        costOfFunds: 0,
        netInterestMargin: 0,
      };
    }
  }

  /**
   * Get risk metrics
   */
  static async getRiskMetrics(organisationId: string): Promise<RiskMetrics> {
    try {
      const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
      const orgLoans = loans.filter(l => l.organisationId === organisationId);

      const totalLoans = orgLoans.length;
      const totalAmount = orgLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);

      // Default risk
      const defaultedLoans = orgLoans.filter(l => l.loanStatus === 'DEFAULTED').length;
      const defaultRisk = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;

      // Concentration risk (top 10% of loans)
      const sortedByAmount = [...orgLoans].sort((a, b) => (b.principalAmount || 0) - (a.principalAmount || 0));
      const topLoans = sortedByAmount.slice(0, Math.ceil(totalLoans * 0.1));
      const topAmount = topLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
      const concentrationRisk = totalAmount > 0 ? (topAmount / totalAmount) * 100 : 0;

      // Credit quality (based on credit scores)
      const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      const avgCreditScore = customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.creditScore || 0), 0) / customers.length
        : 0;
      const creditQuality = Math.min((avgCreditScore / 850) * 100, 100); // Assuming max score is 850

      // Portfolio at risk (overdue + defaulted)
      const today = new Date();
      const atRiskLoans = orgLoans.filter(l => {
        if (l.loanStatus === 'DEFAULTED') return true;
        if (l.loanStatus !== 'ACTIVE') return false;
        if (!l.nextPaymentDate) return false;
        return new Date(l.nextPaymentDate) < today;
      });
      const atRiskAmount = atRiskLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
      const portfolioAtRisk = totalAmount > 0 ? (atRiskAmount / totalAmount) * 100 : 0;

      // Expected credit loss (simplified)
      const expectedCreditLoss = (defaultRisk / 100) * totalAmount;

      return {
        defaultRisk: Math.round(defaultRisk * 100) / 100,
        concentrationRisk: Math.round(concentrationRisk * 100) / 100,
        creditQuality: Math.round(creditQuality * 100) / 100,
        portfolioAtRisk: Math.round(portfolioAtRisk * 100) / 100,
        expectedCreditLoss: Math.round(expectedCreditLoss * 100) / 100,
      };
    } catch {
      return {
        defaultRisk: 0,
        concentrationRisk: 0,
        creditQuality: 0,
        portfolioAtRisk: 0,
        expectedCreditLoss: 0,
      };
    }
  }

  /**
   * Get customer metrics
   */
  static async getCustomerMetrics(organisationId: string): Promise<CustomerMetrics> {
    try {
      const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      const { items: loans } = await BaseCrudService.getAll<Loans>('loans');

      const orgCustomers = customers.filter(c => c.organisationId === organisationId);
      const orgLoans = loans.filter(l => l.organisationId === organisationId);

      const totalCustomers = orgCustomers.length;
      const activeCustomers = orgLoans.filter(l => l.loanStatus === 'ACTIVE').length;
      const defaultingCustomers = orgLoans.filter(l => l.loanStatus === 'DEFAULTED').length;

      const avgCreditScore = totalCustomers > 0
        ? orgCustomers.reduce((sum, c) => sum + (c.creditScore || 0), 0) / totalCustomers
        : 0;

      const kycCompliant = orgCustomers.filter(c => c.kycVerificationStatus === 'VERIFIED').length;
      const kycComplianceRate = totalCustomers > 0 ? (kycCompliant / totalCustomers) * 100 : 0;

      return {
        totalCustomers,
        activeCustomers,
        defaultingCustomers,
        averageCreditScore: Math.round(avgCreditScore * 100) / 100,
        kycComplianceRate: Math.round(kycComplianceRate * 100) / 100,
      };
    } catch {
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        defaultingCustomers: 0,
        averageCreditScore: 0,
        kycComplianceRate: 0,
      };
    }
  }

  /**
   * Get monthly trend data
   */
  static async getMonthlyTrend(
    organisationId: string,
    months: number = 12
  ): Promise<Array<{
    month: string;
    disbursed: number;
    collected: number;
    defaulted: number;
    activeLoans: number;
  }>> {
    try {
      const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
      const { items: repayments } = await BaseCrudService.getAll<Repayments>('repayments');

      const orgLoans = loans.filter(l => l.organisationId === organisationId);
      const orgRepayments = repayments.filter(r => r.organisationId === organisationId);

      const trend: Record<string, {
        disbursed: number;
        collected: number;
        defaulted: number;
        activeLoans: number;
      }> = {};

      // Initialize months
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        trend[monthKey] = { disbursed: 0, collected: 0, defaulted: 0, activeLoans: 0 };
      }

      // Aggregate loan data
      orgLoans.forEach(l => {
        if (l.disbursementDate) {
          const date = new Date(l.disbursementDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (trend[monthKey]) {
            trend[monthKey].disbursed += l.principalAmount || 0;
          }
        }

        if (l.loanStatus === 'DEFAULTED' && l._updatedDate) {
          const date = new Date(l._updatedDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (trend[monthKey]) {
            trend[monthKey].defaulted += l.principalAmount || 0;
          }
        }

        if (l.loanStatus === 'ACTIVE') {
          const monthKey = new Date().toISOString().substring(0, 7);
          if (trend[monthKey]) {
            trend[monthKey].activeLoans += 1;
          }
        }
      });

      // Aggregate repayment data
      orgRepayments.forEach(r => {
        const date = new Date(r.repaymentDate || new Date());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (trend[monthKey]) {
          trend[monthKey].collected += r.totalAmountPaid || 0;
        }
      });

      return Object.entries(trend).map(([month, data]) => ({
        month,
        ...data,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get loan status distribution
   */
  static async getLoanStatusDistribution(organisationId: string): Promise<Record<string, number>> {
    try {
      const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
      const orgLoans = loans.filter(l => l.organisationId === organisationId);

      const distribution: Record<string, number> = {
        PENDING: 0,
        APPROVED: 0,
        DISBURSED: 0,
        ACTIVE: 0,
        CLOSED: 0,
        DEFAULTED: 0,
      };

      orgLoans.forEach(l => {
        const status = l.loanStatus || 'PENDING';
        distribution[status] = (distribution[status] || 0) + 1;
      });

      return distribution;
    } catch {
      return {};
    }
  }

  /**
   * Get loan amount distribution
   */
  static async getLoanAmountDistribution(organisationId: string): Promise<Record<string, number>> {
    try {
      const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
      const orgLoans = loans.filter(l => l.organisationId === organisationId);

      const distribution: Record<string, number> = {
        '0-10000': 0,
        '10000-50000': 0,
        '50000-100000': 0,
        '100000-500000': 0,
        '500000+': 0,
      };

      orgLoans.forEach(l => {
        const amount = l.principalAmount || 0;
        if (amount <= 10000) distribution['0-10000']++;
        else if (amount <= 50000) distribution['10000-50000']++;
        else if (amount <= 100000) distribution['50000-100000']++;
        else if (amount <= 500000) distribution['100000-500000']++;
        else distribution['500000+']++;
      });

      return distribution;
    } catch {
      return {};
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  static async getDashboardData(organisationId: string) {
    const [portfolio, performance, risk, customer, trend, statusDist, amountDist] = await Promise.all([
      this.getPortfolioMetrics(organisationId),
      this.getPerformanceMetrics(organisationId),
      this.getRiskMetrics(organisationId),
      this.getCustomerMetrics(organisationId),
      this.getMonthlyTrend(organisationId),
      this.getLoanStatusDistribution(organisationId),
      this.getLoanAmountDistribution(organisationId),
    ]);

    return {
      portfolio,
      performance,
      risk,
      customer,
      trend,
      statusDistribution: statusDist,
      amountDistribution: amountDist,
    };
  }
}
