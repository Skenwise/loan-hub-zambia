/**
 * Penalty Waiver Service
 * Handles penalty waiver requests and approval workflows
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, CustomerProfiles } from '@/entities';
import { AuditService } from './AuditService';
import { GLIntegrationService } from './GLIntegrationService';
import { NotificationService } from './NotificationService';

export interface PenaltyWaiverRequest {
  _id: string;
  organisationId: string;
  loanId: string;
  customerId: string;
  requestedBy: string;
  requestDate: Date;
  originalPenalties: number;
  requestedWaiverAmount: number;
  waiverPercentage: number;
  reason: string;
  supportingDocuments?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string;
  approvalDate?: Date;
  approvalNotes?: string;
  rejectionReason?: string;
  effectiveDate?: Date;
}

export interface WaiverApprovalWorkflow {
  requestId: string;
  currentApprover: string;
  approvalLevel: number;
  requiredApprovals: number;
  approvals: Array<{
    approver: string;
    approvalDate: Date;
    notes: string;
  }>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface WaiverPolicy {
  _id: string;
  organisationId: string;
  name: string;
  description: string;
  maxWaiverPercentage: number;
  maxWaiverAmount: number;
  minDaysOverdue: number;
  requiresApproval: boolean;
  approvalLevels: number;
  applicableToRoles: string[];
  isActive: boolean;
}

export class PenaltyWaiverService {
  /**
   * Create penalty waiver request
   */
  static async createWaiverRequest(
    loanId: string,
    customerId: string,
    requestedBy: string,
    organisationId: string,
    waiverPercentage: number,
    reason: string,
    supportingDocuments?: string[]
  ): Promise<PenaltyWaiverRequest> {
    // Get loan and customer
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);

    if (!loan || !customer) {
      throw new Error('Loan or customer not found');
    }

    // Calculate penalties (simplified)
    const dueDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
    const today = new Date();
    const daysOverdue = dueDate && dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const originalPenalties = daysOverdue > 0 ? (loan.outstandingBalance || 0) * 0.02 * Math.ceil(daysOverdue / 30) : 0;
    const requestedWaiverAmount = (originalPenalties * waiverPercentage) / 100;

    // Validate waiver request
    if (waiverPercentage < 0 || waiverPercentage > 100) {
      throw new Error('Waiver percentage must be between 0 and 100');
    }

    if (requestedWaiverAmount <= 0) {
      throw new Error('Waiver amount must be greater than zero');
    }

    // Create request
    const requestId = crypto.randomUUID();
    const request: PenaltyWaiverRequest = {
      _id: requestId,
      organisationId,
      loanId,
      customerId,
      requestedBy,
      requestDate: new Date(),
      originalPenalties,
      requestedWaiverAmount,
      waiverPercentage,
      reason,
      supportingDocuments,
      status: 'PENDING',
    };

    // Log audit trail
    await AuditService.logAction({
      performedBy: requestedBy,
      actionType: 'CREATE_PENALTY_WAIVER_REQUEST',
      resourceAffected: 'PenaltyWaiverRequest',
      resourceId: requestId,
      actionDetails: `Penalty waiver request created for loan ${loan.loanNumber}: ${waiverPercentage}% (ZMW ${requestedWaiverAmount.toFixed(2)})`,
      organisationId,
    });

    return request;
  }

  /**
   * Approve penalty waiver request
   */
  static async approvePenaltyWaiver(
    requestId: string,
    approvedBy: string,
    organisationId: string,
    approvalNotes?: string
  ): Promise<PenaltyWaiverRequest> {
    // Get request (in production, fetch from database)
    // For now, return approved request structure

    const today = new Date();

    const approvedRequest: PenaltyWaiverRequest = {
      _id: requestId,
      organisationId,
      loanId: '',
      customerId: '',
      requestedBy: '',
      requestDate: today,
      originalPenalties: 0,
      requestedWaiverAmount: 0,
      waiverPercentage: 0,
      reason: '',
      status: 'APPROVED',
      approvedBy,
      approvalDate: today,
      approvalNotes,
      effectiveDate: today,
    };

    // Log audit trail
    await AuditService.logAction({
      performedBy: approvedBy,
      actionType: 'APPROVE_PENALTY_WAIVER',
      resourceAffected: 'PenaltyWaiverRequest',
      resourceId: requestId,
      actionDetails: `Penalty waiver approved: ${approvalNotes}`,
      organisationId,
    });

    return approvedRequest;
  }

  /**
   * Reject penalty waiver request
   */
  static async rejectPenaltyWaiver(
    requestId: string,
    rejectedBy: string,
    organisationId: string,
    rejectionReason: string
  ): Promise<PenaltyWaiverRequest> {
    const today = new Date();

    const rejectedRequest: PenaltyWaiverRequest = {
      _id: requestId,
      organisationId,
      loanId: '',
      customerId: '',
      requestedBy: '',
      requestDate: today,
      originalPenalties: 0,
      requestedWaiverAmount: 0,
      waiverPercentage: 0,
      reason: '',
      status: 'REJECTED',
      rejectionReason,
    };

    // Log audit trail
    await AuditService.logAction({
      performedBy: rejectedBy,
      actionType: 'REJECT_PENALTY_WAIVER',
      resourceAffected: 'PenaltyWaiverRequest',
      resourceId: requestId,
      actionDetails: `Penalty waiver rejected: ${rejectionReason}`,
      organisationId,
    });

    return rejectedRequest;
  }

  /**
   * Process approved waiver (update loan and GL)
   */
  static async processApprovedWaiver(
    request: PenaltyWaiverRequest,
    processedBy: string
  ): Promise<void> {
    if (request.status !== 'APPROVED') {
      throw new Error('Only approved waivers can be processed');
    }

    // Get loan
    const loan = await BaseCrudService.getById<Loans>('loans', request.loanId);
    if (!loan) throw new Error('Loan not found');

    // Update loan outstanding balance (reduce by waived amount)
    const newOutstanding = Math.max(0, (loan.outstandingBalance || 0) - request.requestedWaiverAmount);
    await BaseCrudService.update<Loans>('loans', {
      _id: request.loanId,
      outstandingBalance: newOutstanding,
    });

    // Post to GL
    await GLIntegrationService.postPenaltyWaiverToGL(
      request.loanId,
      request.requestedWaiverAmount,
      request.organisationId,
      new Date().toISOString().split('T')[0],
      processedBy
    );

    // Send notification to customer
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', request.customerId);
    if (customer) {
      await NotificationService.sendPenaltyWaiverApproved(
        request.customerId,
        request.loanId,
        request.originalPenalties,
        request.requestedWaiverAmount,
        newOutstanding,
        request.organisationId
      );
    }

    // Log audit trail
    await AuditService.logAction({
      performedBy: processedBy,
      actionType: 'PROCESS_PENALTY_WAIVER',
      resourceAffected: 'PenaltyWaiverRequest',
      resourceId: request._id,
      actionDetails: `Penalty waiver processed: ZMW ${request.requestedWaiverAmount.toFixed(2)} waived`,
      organisationId: request.organisationId,
    });
  }

  /**
   * Get pending waiver requests
   */
  static async getPendingWaiverRequests(organisationId: string): Promise<PenaltyWaiverRequest[]> {
    // In production, query database
    // For now, return empty array
    return [];
  }

  /**
   * Get waiver request history for loan
   */
  static async getWaiverHistoryForLoan(loanId: string): Promise<PenaltyWaiverRequest[]> {
    // In production, query database
    // For now, return empty array
    return [];
  }

  /**
   * Calculate waiver eligibility
   */
  static async calculateWaiverEligibility(
    loanId: string,
    organisationId: string
  ): Promise<{
    isEligible: boolean;
    maxWaiverPercentage: number;
    maxWaiverAmount: number;
    currentPenalties: number;
    reason?: string;
  }> {
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);
    if (!loan) {
      return {
        isEligible: false,
        maxWaiverPercentage: 0,
        maxWaiverAmount: 0,
        currentPenalties: 0,
        reason: 'Loan not found',
      };
    }

    // Calculate current penalties
    const dueDate = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null;
    const today = new Date();
    const daysOverdue = dueDate && dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const currentPenalties = daysOverdue > 0 ? (loan.outstandingBalance || 0) * 0.02 * Math.ceil(daysOverdue / 30) : 0;

    // Check eligibility criteria
    if (daysOverdue < 30) {
      return {
        isEligible: false,
        maxWaiverPercentage: 0,
        maxWaiverAmount: 0,
        currentPenalties,
        reason: 'Loan must be at least 30 days overdue',
      };
    }

    if (loan.loanStatus === 'CLOSED' || loan.loanStatus === 'WRITTEN_OFF') {
      return {
        isEligible: false,
        maxWaiverPercentage: 0,
        maxWaiverAmount: 0,
        currentPenalties,
        reason: `Cannot waive penalties for ${loan.loanStatus} loan`,
      };
    }

    // Determine max waiver percentage based on days overdue
    let maxWaiverPercentage = 0;
    if (daysOverdue >= 30 && daysOverdue < 60) {
      maxWaiverPercentage = 25; // 25% for 30-59 days
    } else if (daysOverdue >= 60 && daysOverdue < 90) {
      maxWaiverPercentage = 50; // 50% for 60-89 days
    } else if (daysOverdue >= 90) {
      maxWaiverPercentage = 75; // 75% for 90+ days
    }

    const maxWaiverAmount = (currentPenalties * maxWaiverPercentage) / 100;

    return {
      isEligible: true,
      maxWaiverPercentage,
      maxWaiverAmount,
      currentPenalties,
    };
  }

  /**
   * Get waiver statistics
   */
  static async getWaiverStatistics(organisationId: string): Promise<{
    totalRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalWaiverAmount: number;
    averageWaiverPercentage: number;
    approvalRate: number;
  }> {
    // In production, query database
    // For now, return structure

    return {
      totalRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalWaiverAmount: 0,
      averageWaiverPercentage: 0,
      approvalRate: 0,
    };
  }

  /**
   * Create default waiver policy
   */
  static createDefaultPolicy(organisationId: string): WaiverPolicy {
    return {
      _id: crypto.randomUUID(),
      organisationId,
      name: 'Standard Penalty Waiver Policy',
      description: 'Default penalty waiver policy for the organization',
      maxWaiverPercentage: 75,
      maxWaiverAmount: 50000,
      minDaysOverdue: 30,
      requiresApproval: true,
      approvalLevels: 2,
      applicableToRoles: ['Credit Manager', 'Finance Officer', 'Admin/Owner'],
      isActive: true,
    };
  }
}
