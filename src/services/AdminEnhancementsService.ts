/**
 * Admin Enhancements Service (Phase 2C)
 * Provides advanced admin features including bulk operations,
 * system monitoring, and administrative utilities
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, CustomerProfiles, Repayments, StaffMembers } from '@/entities';

export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface SystemHealthMetrics {
  totalLoans: number;
  totalCustomers: number;
  totalRepayments: number;
  activeLoans: number;
  overdueLoans: number;
  totalOutstanding: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
  lastChecked: Date;
}

export interface AdminAuditLog {
  action: string;
  performedBy: string;
  timestamp: Date;
  details: Record<string, any>;
  status: 'success' | 'failure';
}

class AdminEnhancementsService {
  /**
   * Bulk update loans
   */
  static async bulkUpdateLoans(
    loanIds: string[],
    updates: Partial<Loans>,
    performedBy: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const loanId of loanIds) {
      try {
        await BaseCrudService.update('loans', {
          _id: loanId,
          ...updates,
        });
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id: loanId,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Bulk update customers
   */
  static async bulkUpdateCustomers(
    customerIds: string[],
    updates: Partial<CustomerProfiles>,
    performedBy: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const customerId of customerIds) {
      try {
        await BaseCrudService.update('customers', {
          _id: customerId,
          ...updates,
        });
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id: customerId,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Bulk delete operations
   */
  static async bulkDelete(
    collectionId: string,
    ids: string[],
    performedBy: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const id of ids) {
      try {
        await BaseCrudService.delete(collectionId, id);
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealthMetrics(organisationId: string): Promise<SystemHealthMetrics> {
    try {
      const [loansRes, customersRes, repaymentsRes] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<CustomerProfiles>('customers'),
        BaseCrudService.getAll<Repayments>('repayments'),
      ]);

      const loans = loansRes.items.filter(l => l.organisationId === organisationId);
      const customers = customersRes.items.filter(c => c.organisationId === organisationId);
      const repayments = repaymentsRes.items.filter(r => r.organisationId === organisationId);

      const activeLoans = loans.filter(l => l.loanStatus === 'ACTIVE').length;
      const overdueLoans = loans.filter(l => {
        if (!l.nextPaymentDate) return false;
        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(l.nextPaymentDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysOverdue > 0;
      }).length;

      const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

      // Determine system status
      let systemStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      const overdueRatio = activeLoans > 0 ? overdueLoans / activeLoans : 0;
      
      if (overdueRatio > 0.3) {
        systemStatus = 'critical';
      } else if (overdueRatio > 0.15) {
        systemStatus = 'warning';
      }

      return {
        totalLoans: loans.length,
        totalCustomers: customers.length,
        totalRepayments: repayments.length,
        activeLoans,
        overdueLoans,
        totalOutstanding,
        systemStatus,
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('Error getting system health metrics:', error);
      throw error;
    }
  }

  /**
   * Generate admin audit log
   */
  static async logAdminAction(
    action: string,
    performedBy: string,
    details: Record<string, any>,
    status: 'success' | 'failure' = 'success'
  ): Promise<void> {
    try {
      const auditLog: AdminAuditLog = {
        action,
        performedBy,
        timestamp: new Date(),
        details,
        status,
      };

      // Store in audit trail collection if available
      await BaseCrudService.create('audittrail', {
        _id: crypto.randomUUID(),
        actionType: action,
        performedBy,
        timestamp: new Date(),
        actionDetails: JSON.stringify(details),
        resourceAffected: details.resourceType || 'unknown',
        resourceId: details.resourceId || 'unknown',
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Get admin activity report
   */
  static async getAdminActivityReport(
    organisationId: string,
    daysBack: number = 30
  ): Promise<AdminAuditLog[]> {
    try {
      const { items } = await BaseCrudService.getAll('audittrail');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      return items
        .filter((log: any) => {
          const logDate = new Date(log.timestamp);
          return logDate >= cutoffDate;
        })
        .map((log: any) => ({
          action: log.actionType,
          performedBy: log.performedBy,
          timestamp: new Date(log.timestamp),
          details: JSON.parse(log.actionDetails || '{}'),
          status: 'success' as const,
        }));
    } catch (error) {
      console.error('Error getting admin activity report:', error);
      return [];
    }
  }

  /**
   * Validate data integrity
   */
  static async validateDataIntegrity(organisationId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const [loansRes, customersRes] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<CustomerProfiles>('customers'),
      ]);

      const loans = loansRes.items.filter(l => l.organisationId === organisationId);
      const customers = customersRes.items.filter(c => c.organisationId === organisationId);

      // Check for orphaned loans (customer doesn't exist)
      for (const loan of loans) {
        if (loan.customerId && !customers.find(c => c._id === loan.customerId)) {
          issues.push(`Loan ${loan.loanNumber} references non-existent customer ${loan.customerId}`);
        }
      }

      // Check for invalid amounts
      for (const loan of loans) {
        if (loan.principalAmount && loan.outstandingBalance && loan.outstandingBalance > loan.principalAmount) {
          issues.push(`Loan ${loan.loanNumber} has outstanding balance greater than principal`);
        }
      }

      // Check for invalid dates
      for (const loan of loans) {
        if (loan.disbursementDate && loan.nextPaymentDate) {
          if (new Date(loan.nextPaymentDate) < new Date(loan.disbursementDate)) {
            issues.push(`Loan ${loan.loanNumber} has next payment date before disbursement date`);
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('Error validating data integrity:', error);
      return {
        isValid: false,
        issues: ['Error during validation'],
      };
    }
  }

  /**
   * Generate system report
   */
  static async generateSystemReport(organisationId: string): Promise<Record<string, any>> {
    try {
      const [health, integrity] = await Promise.all([
        this.getSystemHealthMetrics(organisationId),
        this.validateDataIntegrity(organisationId),
      ]);

      return {
        generatedAt: new Date(),
        organisationId,
        health,
        dataIntegrity: integrity,
        recommendations: this.generateRecommendations(health, integrity),
      };
    } catch (error) {
      console.error('Error generating system report:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on system state
   */
  private static generateRecommendations(
    health: SystemHealthMetrics,
    integrity: { isValid: boolean; issues: string[] }
  ): string[] {
    const recommendations: string[] = [];

    if (health.systemStatus === 'critical') {
      recommendations.push('URGENT: High number of overdue loans detected. Review collection strategy.');
    }

    if (health.systemStatus === 'warning') {
      recommendations.push('Monitor overdue loans. Consider implementing collection reminders.');
    }

    if (!integrity.isValid) {
      recommendations.push(`Data integrity issues detected: ${integrity.issues.length} issues found. Review and resolve.`);
    }

    if (health.totalOutstanding > 1000000) {
      recommendations.push('Large outstanding balance. Consider risk assessment review.');
    }

    return recommendations;
  }

  /**
   * Export system data for backup
   */
  static async exportSystemData(organisationId: string): Promise<Blob> {
    try {
      const [loans, customers, repayments, staff] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<CustomerProfiles>('customers'),
        BaseCrudService.getAll<Repayments>('repayments'),
        BaseCrudService.getAll<StaffMembers>('staffmembers'),
      ]);

      const data = {
        exportDate: new Date(),
        organisationId,
        loans: loans.items.filter(l => l.organisationId === organisationId),
        customers: customers.items.filter(c => c.organisationId === organisationId),
        repayments: repayments.items.filter(r => r.organisationId === organisationId),
        staff: staff.items.filter(s => s.organisationId === organisationId),
      };

      const json = JSON.stringify(data, null, 2);
      return new Blob([json], { type: 'application/json' });
    } catch (error) {
      console.error('Error exporting system data:', error);
      throw error;
    }
  }
}

export default AdminEnhancementsService;
