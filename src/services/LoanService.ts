/**
 * Loan Service
 * Handles loan operations, calculations, and workflow management
 * Phase 1: Core Data Isolation - Organization-scoped loan access
 * Phase 2A: Performance Optimization - Caching integration
 */

import { BaseCrudService } from '@/integrations';
import { Loans, LoanProducts, Repayments, LoanWorkflowHistory } from '@/entities';
import { CollectionIds } from './index';
import { AuditService } from './AuditService';
import { OrganisationFilteringService } from './OrganisationFilteringService';
import { CacheService } from './CacheService';

export class LoanService {
  /**
   * Get loan by ID (with caching)
   * Phase 2A: Cached for 5 minutes
   */
  static async getLoan(loanId: string): Promise<Loans | null> {
    try {
      // Try to get from cache first
      const cacheKey = `loan:${loanId}`;
      const cached = await CacheService.get<Loans>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const loan = await BaseCrudService.getById<Loans>(
        CollectionIds.LOANS,
        loanId
      );

      // Cache the result
      if (loan) {
        await CacheService.set(cacheKey, loan, CacheService.DEFAULT_TTL);
      }

      return loan || null;
    } catch (error) {
      console.error('Error fetching loan:', error);
      return null;
    }
  }

  /**
   * Get all loans for a customer
   */
  static async getCustomerLoans(customerId: string): Promise<Loans[]> {
    try {
      const { items } = await BaseCrudService.getAll<Loans>(CollectionIds.LOANS);
      return items?.filter(l => l.customerId === customerId) || [];
    } catch (error) {
      console.error('Error fetching customer loans:', error);
      return [];
    }
  }

  /**
   * Get all loans for an organisation (Phase 1: Organization-scoped)
   * Phase 2A: Cached for 5 minutes with organization scope
   */
  static async getOrganisationLoans(organisationId?: string): Promise<Loans[]> {
    try {
      // Use organization-scoped caching
      return await CacheService.getOrSetOrgScoped(
        organisationId || 'default',
        'loans',
        async () => {
          return await OrganisationFilteringService.getAllByOrganisation<Loans>(
            CollectionIds.LOANS,
            { organisationId, logQuery: true }
          );
        },
        CacheService.DEFAULT_TTL
      );
    } catch (error) {
      console.error('Error fetching organisation loans:', error);
      return [];
    }
  }

  /**
   * Create new loan
   * Phase 2A: Invalidate cache on create
   */
  static async createLoan(data: Omit<Loans, '_id' | '_createdDate' | '_updatedDate'>): Promise<Loans> {
    try {
      const newLoan: Loans = {
        ...data,
        _id: crypto.randomUUID(),
      };
      await BaseCrudService.create(CollectionIds.LOANS, newLoan);

      // Invalidate organization-scoped cache
      if (data.organisationId) {
        await CacheService.invalidateOrgCache(data.organisationId);
      }

      return newLoan;
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  }

  /**
   * Update loan
   * Phase 2A: Invalidate cache on update
   */
  static async updateLoan(loanId: string, data: Partial<Loans>): Promise<void> {
    try {
      await BaseCrudService.update(CollectionIds.LOANS, {
        _id: loanId,
        ...data,
      });

      // Invalidate loan cache
      await CacheService.delete(`loan:${loanId}`);

      // Invalidate organization-scoped cache if organisationId is provided
      if (data.organisationId) {
        await CacheService.invalidateOrgCache(data.organisationId);
      }
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  }

  /**
   * Get loan product (with caching)
   * Phase 2A: Cached for 1 hour (reference data)
   */
  static async getLoanProduct(productId: string): Promise<LoanProducts | null> {
    try {
      // Try to get from cache first
      const cacheKey = `loanproduct:${productId}`;
      const cached = await CacheService.get<LoanProducts>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const product = await BaseCrudService.getById<LoanProducts>(
        CollectionIds.LOAN_PRODUCTS,
        productId
      );

      // Cache the result with longer TTL for reference data
      if (product) {
        await CacheService.set(cacheKey, product, CacheService.REFERENCE_DATA_TTL);
      }

      return product || null;
    } catch (error) {
      console.error('Error fetching loan product:', error);
      return null;
    }
  }

  /**
   * Get all loan products for an organisation (Phase 1: Organization-scoped)
   * Phase 2A: Cached for 1 hour with organization scope
   */
  static async getOrganisationLoanProducts(organisationId?: string): Promise<LoanProducts[]> {
    try {
      // Use organization-scoped caching with longer TTL for reference data
      return await CacheService.getOrSetOrgScoped(
        organisationId || 'default',
        'loanproducts',
        async () => {
          const products = await OrganisationFilteringService.getAllByOrganisation<LoanProducts>(
            CollectionIds.LOAN_PRODUCTS,
            { organisationId, logQuery: true }
          );
          return products.filter(p => p.isActive) || [];
        },
        CacheService.REFERENCE_DATA_TTL
      );
    } catch (error) {
      console.error('Error fetching loan products:', error);
      return [];
    }
  }

  /**
   * Calculate monthly payment using reducing balance method
   */
  static calculateMonthlyPayment(
    principalAmount: number,
    annualInterestRate: number,
    loanTermMonths: number
  ): number {
    const monthlyRate = annualInterestRate / 100 / 12;
    
    if (monthlyRate === 0) {
      return principalAmount / loanTermMonths;
    }

    const numerator = monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths);
    const denominator = Math.pow(1 + monthlyRate, loanTermMonths) - 1;
    
    return (principalAmount * numerator) / denominator;
  }

  /**
   * Calculate interest for a payment
   */
  static calculateInterestAmount(
    outstandingBalance: number,
    annualInterestRate: number
  ): number {
    const monthlyRate = annualInterestRate / 100 / 12;
    return outstandingBalance * monthlyRate;
  }

  /**
   * Calculate principal amount for a payment
   */
  static calculatePrincipalAmount(
    monthlyPayment: number,
    interestAmount: number
  ): number {
    return Math.max(0, monthlyPayment - interestAmount);
  }

  /**
   * Update loan status (Phase 1: Include organisation context)
   */
  static async updateLoanStatus(
    loanId: string,
    status: string,
    performedBy: string,
    organisationId?: string,
    staffMemberId?: string
  ): Promise<void> {
    try {
      await this.updateLoan(loanId, { loanStatus: status });
      
      // Log workflow change with organisation context
      await this.logWorkflowChange(loanId, status, performedBy, organisationId, staffMemberId);
      
      // Audit log with organisation context
      await AuditService.logAction({
        actionType: 'UPDATE',
        actionDetails: `Loan status updated to ${status}`,
        resourceAffected: 'LOAN',
        resourceId: loanId,
        performedBy,
        staffMemberId,
        organisationId,
      });
    } catch (error) {
      console.error('Error updating loan status:', error);
      throw error;
    }
  }

  /**
   * Log workflow change (Phase 1: Include organisation context)
   */
  static async logWorkflowChange(
    loanId: string,
    stage: string,
    changedBy: string,
    organisationId?: string,
    staffMemberId?: string
  ): Promise<void> {
    try {
      const workflowEntry: LoanWorkflowHistory = {
        _id: crypto.randomUUID(),
        loanId,
        organisationId,
        stage,
        timestamp: new Date(),
        changedBy,
        staffMemberId,
      };

      await BaseCrudService.create(CollectionIds.LOAN_WORKFLOW_HISTORY, workflowEntry);
    } catch (error) {
      console.error('Error logging workflow change:', error);
      throw error;
    }
  }

  /**
   * Get loan workflow history (with caching)
   * Phase 2A: Cached for 5 minutes
   */
  static async getLoanWorkflowHistory(loanId: string): Promise<LoanWorkflowHistory[]> {
    try {
      // Try to get from cache first
      const cacheKey = `loanworkflow:${loanId}`;
      const cached = await CacheService.get<LoanWorkflowHistory[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const { items } = await BaseCrudService.getAll<LoanWorkflowHistory>(
        CollectionIds.LOAN_WORKFLOW_HISTORY
      );
      const history = items?.filter(h => h.loanId === loanId) || [];

      // Cache the result
      await CacheService.set(cacheKey, history, CacheService.DEFAULT_TTL);

      return history;
    } catch (error) {
      console.error('Error fetching loan workflow history:', error);
      return [];
    }
  }

  /**
   * Record repayment
   * Phase 2A: Invalidate cache on repayment
   */
  static async recordRepayment(data: Omit<Repayments, '_id' | '_createdDate' | '_updatedDate'>): Promise<Repayments> {
    try {
      const repayment: Repayments = {
        ...data,
        _id: crypto.randomUUID(),
      };

      await BaseCrudService.create(CollectionIds.REPAYMENTS, repayment);
      
      // Update loan outstanding balance
      const loan = await this.getLoan(data.loanId || '');
      if (loan) {
        const newBalance = Math.max(0, (loan.outstandingBalance || 0) - (data.totalAmountPaid || 0));
        await this.updateLoan(data.loanId || '', {
          outstandingBalance: newBalance,
          loanStatus: newBalance === 0 ? 'CLOSED' : 'ACTIVE',
        });

        // Invalidate loan workflow cache
        await CacheService.delete(`loanworkflow:${data.loanId}`);
      }

      return repayment;
    } catch (error) {
      console.error('Error recording repayment:', error);
      throw error;
    }
  }

  /**
   * Get loan repayments (with caching)
   * Phase 2A: Cached for 5 minutes
   */
  static async getLoanRepayments(loanId: string): Promise<Repayments[]> {
    try {
      // Try to get from cache first
      const cacheKey = `loanrepayments:${loanId}`;
      const cached = await CacheService.get<Repayments[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const { items } = await BaseCrudService.getAll<Repayments>(
        CollectionIds.REPAYMENTS
      );
      const repayments = items?.filter(r => r.loanId === loanId) || [];

      // Cache the result
      await CacheService.set(cacheKey, repayments, CacheService.DEFAULT_TTL);

      return repayments;
    } catch (error) {
      console.error('Error fetching loan repayments:', error);
      return [];
    }
  }

  /**
   * Calculate total repaid amount
   */
  static async getTotalRepaid(loanId: string): Promise<number> {
    try {
      const repayments = await this.getLoanRepayments(loanId);
      return repayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);
    } catch (error) {
      console.error('Error calculating total repaid:', error);
      return 0;
    }
  }

  /**
   * Check if loan is overdue
   */
  static isLoanOverdue(nextPaymentDate: Date | string | undefined): boolean {
    if (!nextPaymentDate) return false;
    const paymentDate = new Date(nextPaymentDate);
    return paymentDate < new Date();
  }

  /**
   * Calculate days overdue
   */
  static calculateDaysOverdue(nextPaymentDate: Date | string | undefined): number {
    if (!nextPaymentDate) return 0;
    const paymentDate = new Date(nextPaymentDate);
    const today = new Date();
    
    if (paymentDate >= today) return 0;
    
    const diffTime = today.getTime() - paymentDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get pending loans for an organisation (with caching)
   * Phase 2A: Cached for 5 minutes with organization scope
   */
  static async getPendingLoans(organisationId: string): Promise<Loans[]> {
    try {
      // Use organization-scoped caching
      return await CacheService.getOrSetOrgScoped(
        organisationId,
        'loans:pending',
        async () => {
          const { items } = await BaseCrudService.getAll<Loans>(CollectionIds.LOANS);
          return items?.filter(l => l.organisationId === organisationId && l.loanStatus === 'PENDING') || [];
        },
        CacheService.DEFAULT_TTL
      );
    } catch (error) {
      console.error('Error fetching pending loans:', error);
      return [];
    }
  }

  /**
   * Get approved loans for an organisation (with caching)
   * Phase 2A: Cached for 5 minutes with organization scope
   */
  static async getApprovedLoans(organisationId: string): Promise<Loans[]> {
    try {
      // Use organization-scoped caching
      return await CacheService.getOrSetOrgScoped(
        organisationId,
        'loans:approved',
        async () => {
          const { items } = await BaseCrudService.getAll<Loans>(CollectionIds.LOANS);
          return items?.filter(l => l.organisationId === organisationId && l.loanStatus === 'APPROVED') || [];
        },
        CacheService.DEFAULT_TTL
      );
    } catch (error) {
      console.error('Error fetching approved loans:', error);
      return [];
    }
  }

  /**
   * Get active loans for an organisation (with caching)
   * Phase 2A: Cached for 5 minutes with organization scope
   */
  static async getActiveLoansByOrganisation(organisationId: string): Promise<Loans[]> {
    try {
      // Use organization-scoped caching
      return await CacheService.getOrSetOrgScoped(
        organisationId,
        'loans:active',
        async () => {
          const { items } = await BaseCrudService.getAll<Loans>(CollectionIds.LOANS);
          return items?.filter(l => l.organisationId === organisationId && l.loanStatus === 'ACTIVE') || [];
        },
        CacheService.DEFAULT_TTL
      );
    } catch (error) {
      console.error('Error fetching active loans:', error);
      return [];
    }
  }

  /**
   * Update loan disbursement
   */
  static async updateLoanDisbursement(
    loanId: string,
    disbursementDate: Date,
    disbursementReference: string
  ): Promise<void> {
    try {
      await this.updateLoan(loanId, {
        loanStatus: 'ACTIVE',
        disbursementDate,
        outstandingBalance: (await this.getLoan(loanId))?.principalAmount || 0,
      });
      
      // Log disbursement reference in audit trail
      await AuditService.logAction({
        actionType: 'UPDATE',
        actionDetails: `Loan disbursed with reference: ${disbursementReference}`,
        resourceAffected: 'LOAN',
        resourceId: loanId,
        performedBy: 'SYSTEM',
      });
    } catch (error) {
      console.error('Error updating loan disbursement:', error);
      throw error;
    }
  }

  /**
   * Generate payment schedule
   */
  static async generatePaymentSchedule(
    loanId: string,
    principalAmount: number,
    annualInterestRate: number,
    loanTermMonths: number,
    startDate: Date
  ): Promise<void> {
    try {
      const monthlyPayment = this.calculateMonthlyPayment(principalAmount, annualInterestRate, loanTermMonths);
      
      // Calculate next payment date (1 month from start)
      const nextPaymentDate = new Date(startDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      
      await this.updateLoan(loanId, {
        nextPaymentDate,
      });
    } catch (error) {
      console.error('Error generating payment schedule:', error);
      throw error;
    }
  }

  /**
   * Create repayment
   */
  static async createRepayment(data: Omit<Repayments, '_id' | '_createdDate' | '_updatedDate'>): Promise<Repayments> {
    return this.recordRepayment(data);
  }

  /**
   * Update loan repayment
   */
  static async updateLoanRepayment(
    loanId: string,
    newBalance: number,
    nextPaymentDate: Date | undefined,
    status: string
  ): Promise<void> {
    try {
      await this.updateLoan(loanId, {
        outstandingBalance: newBalance,
        nextPaymentDate,
        loanStatus: status,
      });
    } catch (error) {
      console.error('Error updating loan repayment:', error);
      throw error;
    }
  }
}
