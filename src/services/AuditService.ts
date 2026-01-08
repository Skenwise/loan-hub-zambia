/**
 * Audit Service
 * Logs all system actions for compliance and audit trail
 * Phase 1: Core Data Isolation - Organization-scoped audit logging
 */

import { BaseCrudService } from '@/integrations';
import { AuditTrail } from '@/entities';
import { CollectionIds } from './index';
import { useOrganisationStore } from '@/store/organisationStore';

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
   * Log an action to the audit trail (Phase 1: Include organisationId)
   */
  static async logAction(entry: AuditLogEntry): Promise<AuditTrail> {
    try {
      // Get organisation context from store if not provided
      const organisationId = entry.organisationId || useOrganisationStore.getState().organisationId;

      const auditEntry: Partial<AuditTrail> = {
        _id: crypto.randomUUID(),
        actionType: entry.actionType,
        actionDetails: entry.actionDetails,
        resourceAffected: entry.resourceAffected,
        resourceId: entry.resourceId,
        performedBy: entry.performedBy,
        staffMemberId: entry.staffMemberId,
        organisationId,
        timestamp: new Date(),
      };

      await BaseCrudService.create(CollectionIds.AUDIT_TRAIL, auditEntry as AuditTrail);
      
      console.log(`[Audit] ${entry.actionType} on ${entry.resourceAffected} by ${entry.performedBy} (Org: ${organisationId})`);
      
      return auditEntry as AuditTrail;
    } catch (error) {
      console.error('Error logging audit action:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a resource (Phase 1: Filter by organisation)
   */
  static async getResourceAuditTrail(resourceId: string, organisationId?: string): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      let filtered = items?.filter(a => a.resourceId === resourceId) || [];
      
      // Filter by organisation if provided
      const activeOrgId = organisationId || useOrganisationStore.getState().getActiveOrganisationFilter();
      if (activeOrgId) {
        filtered = filtered.filter(a => a.organisationId === activeOrgId);
      }
      
      return filtered;
    } catch (error) {
      console.error('Error fetching resource audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit trail for a staff member (Phase 1: Filter by organisation)
   */
  static async getStaffAuditTrail(staffMemberId: string, organisationId?: string): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      let filtered = items?.filter(a => a.performedBy === staffMemberId) || [];
      
      // Filter by organisation if provided
      const activeOrgId = organisationId || useOrganisationStore.getState().getActiveOrganisationFilter();
      if (activeOrgId) {
        filtered = filtered.filter(a => a.organisationId === activeOrgId);
      }
      
      return filtered;
    } catch (error) {
      console.error('Error fetching staff audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit trail for a date range (Phase 1: Filter by organisation)
   */
  static async getAuditTrailByDateRange(startDate: Date, endDate: Date, organisationId?: string): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      let filtered = items?.filter(a => {
        const timestamp = a.timestamp ? new Date(a.timestamp) : null;
        return timestamp && timestamp >= startDate && timestamp <= endDate;
      }) || [];

      // Filter by organisation if provided
      const activeOrgId = organisationId || useOrganisationStore.getState().getActiveOrganisationFilter();
      if (activeOrgId) {
        filtered = filtered.filter(a => a.organisationId === activeOrgId);
      }

      return filtered;
    } catch (error) {
      console.error('Error fetching audit trail by date range:', error);
      return [];
    }
  }

  /**
   * Get all audit trail entries (Phase 1: Filter by organisation)
   */
  static async getAllAuditTrail(organisationId?: string): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      let filtered = items || [];

      // Filter by organisation if provided
      const activeOrgId = organisationId || useOrganisationStore.getState().getActiveOrganisationFilter();
      if (activeOrgId) {
        filtered = filtered.filter(a => a.organisationId === activeOrgId);
      }

      return filtered;
    } catch (error) {
      console.error('Error fetching all audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit logs for an organization (Phase 1: Enhanced)
   */
  static async getAuditLogs(organisationId?: string): Promise<AuditTrail[]> {
    try {
      const { items } = await BaseCrudService.getAll<AuditTrail>(
        CollectionIds.AUDIT_TRAIL
      );

      const activeOrgId = organisationId || useOrganisationStore.getState().organisationId;
      
      if (!activeOrgId) {
        console.warn('[Audit] No organisation context for filtering audit logs');
        return items || [];
      }

      return items?.filter(a => a.organisationId === activeOrgId) || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
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
  static async logLoanApproval(loanId: string, performedBy: string, notes?: string, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'APPROVE',
      actionDetails: notes ? `Loan application approved: ${notes}` : 'Loan application approved',
      resourceAffected: 'LOAN',
      resourceId: loanId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log loan rejection
   */
  static async logLoanRejection(loanId: string, performedBy: string, reason: string, staffMemberId?: string): Promise<void> {
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
  static async logLoanDisbursement(loanId: string, performedBy: string, details: any, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'DISBURSE',
      actionDetails: `Loan disbursed: ${JSON.stringify(details)}`,
      resourceAffected: 'LOAN',
      resourceId: loanId,
      performedBy,
      staffMemberId,
    });
  }

  /**
   * Log repayment
   */
  static async logRepayment(loanId: string, performedBy: string, details: any, staffMemberId?: string): Promise<void> {
    await this.logAction({
      actionType: 'REPAYMENT',
      actionDetails: `Repayment recorded: ${JSON.stringify(details)}`,
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
