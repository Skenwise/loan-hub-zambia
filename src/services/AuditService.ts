/**
 * Audit Service
 * Logs all system actions for compliance and audit trail
 */

import { BaseCrudService } from '@/integrations';
import { AuditTrail } from '@/entities';
import { CollectionIds } from './index';

export interface AuditLogEntry {
  actionType: string;
  actionDetails: string;
  resourceAffected: string;
  resourceId: string;
  performedBy: string;
  staffMemberId?: string;
  organisationId?: string;
}

export class AuditService {
  /**
   * Log an action to the audit trail
   */
  static async logAction(entry: AuditLogEntry): Promise<AuditTrail> {
    try {
      const auditEntry: AuditTrail = {
        _id: crypto.randomUUID(),
        actionType: entry.actionType,
        actionDetails: entry.actionDetails,
        resourceAffected: entry.resourceAffected,
        resourceId: entry.resourceId,
        performedBy: entry.performedBy,
        timestamp: new Date(),
      };

      await BaseCrudService.create(CollectionIds.AUDIT_TRAIL, auditEntry);
      return auditEntry;
    } catch (error) {
      console.error('Error logging audit action:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a resource
   */
  static async getResourceAuditTrail(resourceId: string): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      return items?.filter(a => a.resourceId === resourceId) || [];
    } catch (error) {
      console.error('Error fetching resource audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit trail for a staff member
   */
  static async getStaffAuditTrail(staffMemberId: string): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      return items?.filter(a => a.performedBy === staffMemberId) || [];
    } catch (error) {
      console.error('Error fetching staff audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit trail for a date range
   */
  static async getAuditTrailByDateRange(startDate: Date, endDate: Date): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      return items?.filter(a => {
        const timestamp = a.timestamp ? new Date(a.timestamp) : null;
        return timestamp && timestamp >= startDate && timestamp <= endDate;
      }) || [];
    } catch (error) {
      console.error('Error fetching audit trail by date range:', error);
      return [];
    }
  }

  /**
   * Get all audit trail entries
   */
  static async getAllAuditTrail(): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      return items || [];
    } catch (error) {
      console.error('Error fetching all audit trail:', error);
      return [];
    }
  }

  /**
   * Log customer creation
   */
  static async logCustomerCreation(customerId: string, performedBy: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'CREATE',
      actionDetails: 'Customer profile created',
      resourceAffected: 'CUSTOMER',
      resourceId: customerId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log customer update
   */
  static async logCustomerUpdate(customerId: string, performedBy: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'UPDATE',
      actionDetails: 'Customer profile updated',
      resourceAffected: 'CUSTOMER',
      resourceId: customerId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log loan application
   */
  static async logLoanApplication(loanId: string, performedBy: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'CREATE',
      actionDetails: 'Loan application submitted',
      resourceAffected: 'LOAN',
      resourceId: loanId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log loan approval
   */
  static async logLoanApproval(loanId: string, performedBy: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'APPROVE',
      actionDetails: 'Loan application approved',
      resourceAffected: 'LOAN',
      resourceId: loanId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log loan rejection
   */
  static async logLoanRejection(loanId: string, reason: string, performedBy: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'REJECT',
      actionDetails: `Loan application rejected: ${reason}`,
      resourceAffected: 'LOAN',
      resourceId: loanId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log loan disbursement
   */
  static async logLoanDisbursement(loanId: string, amount: number, performedBy: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'DISBURSE',
      actionDetails: `Loan disbursed: ${amount}`,
      resourceAffected: 'LOAN',
      resourceId: loanId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log repayment
   */
  static async logRepayment(loanId: string, amount: number, performedBy: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'REPAYMENT',
      actionDetails: `Repayment recorded: ${amount}`,
      resourceAffected: 'LOAN',
      resourceId: loanId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log KYC verification
   */
  static async logKYCVerification(customerId: string, status: string, performedBy: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'VERIFY',
      actionDetails: `KYC verification: ${status}`,
      resourceAffected: 'CUSTOMER',
      resourceId: customerId,
      performedBy,
      staffMemberId,
    });
  }
}
