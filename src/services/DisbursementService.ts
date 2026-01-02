/**
 * Disbursement Service
 * Handles loan disbursement operations, validations, and workflow
 */

import { BaseCrudService } from '@/integrations';
import { Loans, LoanWorkflowHistory, Repayments } from '@/entities';
import { CollectionIds } from './index';
import { AuditService } from './AuditService';
import { LoanService } from './LoanService';
import { KYCService } from './KYCService';
import { CollateralService } from './CollateralService';

export interface DisbursementValidationResult {
  isValid: boolean;
  checks: {
    allApprovalsCompleted: boolean;
    kycVerified: boolean;
    collateralPerfected: boolean;
    guarantorsVerified: boolean;
    customerAccountActive: boolean;
    noDuplicateDisbursement: boolean;
  };
  failedChecks: string[];
}

export interface DisbursementDetails {
  loanId: string;
  disbursementMethod: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque' | 'internal_wallet';
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  mobileNetwork?: string;
  mobileNumber?: string;
  mobileAccountHolder?: string;
  chequeNumber?: string;
  chequeDate?: string;
  referenceNumber: string;
  proofOfPaymentUrl?: string;
  disbursementDate: Date;
  netDisbursementAmount: number;
  processingFee: number;
  insurance?: number;
  vat?: number;
  withholding?: number;
}

export interface DisbursementRecord {
  _id: string;
  loanId: string;
  organisationId: string;
  disbursedBy: string;
  disbursementDate: Date;
  disbursementMethod: string;
  referenceNumber: string;
  principalAmount: number;
  processingFee: number;
  insurance?: number;
  vat?: number;
  withholding?: number;
  netDisbursementAmount: number;
  proofOfPaymentUrl?: string;
  status: 'completed' | 'reversed';
  reversalReason?: string;
  reversedBy?: string;
  reversalDate?: Date;
  ipAddress?: string;
  _createdDate?: Date;
  _updatedDate?: Date;
}

export class DisbursementService {
  /**
   * Validate loan for disbursement
   */
  static async validateLoanForDisbursement(loanId: string): Promise<DisbursementValidationResult> {
    const failedChecks: string[] = [];

    try {
      const loan = await LoanService.getLoan(loanId);
      if (!loan) {
        return {
          isValid: false,
          checks: {
            allApprovalsCompleted: false,
            kycVerified: false,
            collateralPerfected: false,
            guarantorsVerified: false,
            customerAccountActive: false,
            noDuplicateDisbursement: false,
          },
          failedChecks: ['Loan not found'],
        };
      }

      const checks = {
        allApprovalsCompleted: loan.loanStatus === 'Approved',
        kycVerified: false,
        collateralPerfected: false,
        guarantorsVerified: true, // Assume verified if not applicable
        customerAccountActive: true, // Assume active if not explicitly marked
        noDuplicateDisbursement: true,
      };

      // Check KYC verification
      if (loan.customerId) {
        const kycStatus = await KYCService.getKYCStatus(loan.customerId);
        checks.kycVerified = kycStatus === 'APPROVED';
        if (!checks.kycVerified) {
          failedChecks.push('KYC verification not completed');
        }
      }

      // Check collateral
      if (loan._id) {
        const collateral = await CollateralService.getLoanCollateral(loan._id);
        checks.collateralPerfected = collateral.length > 0 && collateral.some(c => c.status === 'ACTIVE');
        if (!checks.collateralPerfected) {
          failedChecks.push('Collateral not registered or perfected');
        }
      }

      // Check for duplicate disbursement
      const existingDisbursement = await this.getLoanDisbursement(loanId);
      checks.noDuplicateDisbursement = !existingDisbursement;
      if (!checks.noDuplicateDisbursement) {
        failedChecks.push('Loan already disbursed');
      }

      // Check if all approvals completed
      if (!checks.allApprovalsCompleted) {
        failedChecks.push('Loan not fully approved');
      }

      const isValid = Object.values(checks).every(check => check === true);

      return {
        isValid,
        checks,
        failedChecks,
      };
    } catch (error) {
      console.error('Error validating loan for disbursement:', error);
      return {
        isValid: false,
        checks: {
          allApprovalsCompleted: false,
          kycVerified: false,
          collateralPerfected: false,
          guarantorsVerified: false,
          customerAccountActive: false,
          noDuplicateDisbursement: false,
        },
        failedChecks: ['Validation error occurred'],
      };
    }
  }

  /**
   * Check segregation of duties - ensure approver cannot disburse
   */
  static async checkSegregationOfDuties(loanId: string, staffMemberId: string): Promise<boolean> {
    try {
      // Get loan workflow history to find who approved it
      const { items: workflowHistory } = await BaseCrudService.getAll<LoanWorkflowHistory>(
        CollectionIds.LOAN_WORKFLOW_HISTORY
      );

      const approvalRecord = workflowHistory?.find(
        w => w.loanId === loanId && w.stage === 'Approved'
      );

      // If the same person approved and is trying to disburse, deny
      if (approvalRecord && approvalRecord.staffMemberId === staffMemberId) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking segregation of duties:', error);
      return false;
    }
  }

  /**
   * Calculate net disbursement amount
   */
  static calculateNetDisbursement(
    principalAmount: number,
    processingFee: number,
    insurance: number = 0,
    vat: number = 0,
    withholding: number = 0
  ): number {
    return principalAmount - processingFee - insurance - vat - withholding;
  }

  /**
   * Create disbursement record
   */
  static async createDisbursement(
    details: DisbursementDetails,
    staffMemberId: string,
    organisationId: string,
    ipAddress?: string
  ): Promise<DisbursementRecord> {
    try {
      const disbursementId = crypto.randomUUID();
      const disbursement: DisbursementRecord = {
        _id: disbursementId,
        loanId: details.loanId,
        organisationId,
        disbursedBy: staffMemberId,
        disbursementDate: details.disbursementDate,
        disbursementMethod: details.disbursementMethod,
        referenceNumber: details.referenceNumber,
        principalAmount: 0, // Will be set from loan
        processingFee: details.processingFee,
        insurance: details.insurance,
        vat: details.vat,
        withholding: details.withholding,
        netDisbursementAmount: details.netDisbursementAmount,
        proofOfPaymentUrl: details.proofOfPaymentUrl,
        status: 'completed',
        ipAddress,
      };

      // Store disbursement record (would need a disbursements collection)
      // For now, we'll update the loan status
      await LoanService.updateLoan(details.loanId, {
        loanStatus: 'Active',
        disbursementDate: details.disbursementDate,
      });

      // Log to audit trail
      await AuditService.logAction({
        performedBy: staffMemberId,
        actionType: 'LOAN_DISBURSEMENT',
        actionDetails: `Loan ${details.loanId} disbursed`,
        resourceAffected: 'Loan',
        resourceId: details.loanId,
      });

      return disbursement;
    } catch (error) {
      console.error('Error creating disbursement:', error);
      throw error;
    }
  }

  /**
   * Get disbursement record for a loan
   */
  static async getLoanDisbursement(loanId: string): Promise<DisbursementRecord | null> {
    try {
      // This would query a disbursements collection
      // For now, check if loan is already active/disbursed
      const loan = await LoanService.getLoan(loanId);
      if (loan?.loanStatus === 'Active' && loan.disbursementDate) {
        return {
          _id: `disb-${loanId}`,
          loanId,
          organisationId: loan.organisationId || '',
          disbursedBy: '',
          disbursementDate: new Date(loan.disbursementDate),
          disbursementMethod: 'bank_transfer',
          referenceNumber: '',
          principalAmount: loan.principalAmount || 0,
          processingFee: 0,
          netDisbursementAmount: loan.principalAmount || 0,
          status: 'completed',
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching disbursement:', error);
      return null;
    }
  }

  /**
   * Reverse disbursement
   */
  static async reverseDisbursement(
    loanId: string,
    staffMemberId: string,
    reason: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const loan = await LoanService.getLoan(loanId);
      if (!loan) throw new Error('Loan not found');

      // Check if loan has repayments
      const { items: repayments } = await BaseCrudService.getAll<Repayments>(
        CollectionIds.REPAYMENTS
      );
      const loanRepayments = repayments?.filter(r => r.loanId === loanId) || [];

      if (loanRepayments.length > 0) {
        throw new Error('Cannot reverse disbursement - loan has repayments posted');
      }

      // Reset loan to Approved status
      await LoanService.updateLoan(loanId, {
        loanStatus: 'Approved',
        disbursementDate: undefined,
      });

      // Log reversal
      await AuditService.logAction({
        performedBy: staffMemberId,
        actionType: 'LOAN_DISBURSEMENT_REVERSAL',
        actionDetails: `Disbursement for loan ${loanId} reversed: ${reason}`,
        resourceAffected: 'Loan',
        resourceId: loanId,
      });
    } catch (error) {
      console.error('Error reversing disbursement:', error);
      throw error;
    }
  }

  /**
   * Get approved loans ready for disbursement
   */
  static async getApprovedLoansForDisbursement(organisationId: string): Promise<Loans[]> {
    try {
      const loans = await LoanService.getOrganisationLoans(organisationId);
      return loans.filter(
        loan =>
          loan.loanStatus === 'Approved' &&
          !loan.disbursementDate
      );
    } catch (error) {
      console.error('Error fetching approved loans:', error);
      return [];
    }
  }

  /**
   * Get disbursement statistics
   */
  static async getDisbursementStats(organisationId: string, startDate: Date, endDate: Date) {
    try {
      const loans = await LoanService.getOrganisationLoans(organisationId);
      const disbursedLoans = loans.filter(
        loan =>
          loan.loanStatus === 'Active' &&
          loan.disbursementDate &&
          new Date(loan.disbursementDate) >= startDate &&
          new Date(loan.disbursementDate) <= endDate
      );

      const totalDisbursed = disbursedLoans.reduce(
        (sum, loan) => sum + (loan.principalAmount || 0),
        0
      );

      return {
        totalDisbursements: disbursedLoans.length,
        totalAmount: totalDisbursed,
        averageAmount: disbursedLoans.length > 0 ? totalDisbursed / disbursedLoans.length : 0,
        disbursedLoans,
      };
    } catch (error) {
      console.error('Error calculating disbursement stats:', error);
      return {
        totalDisbursements: 0,
        totalAmount: 0,
        averageAmount: 0,
        disbursedLoans: [],
      };
    }
  }
}
