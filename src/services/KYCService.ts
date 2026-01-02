/**
 * KYC Service
 * Handles KYC verification, document management, and verification workflows
 */

import { BaseCrudService } from '@/integrations';
import { KYCVerificationHistory, LoanDocuments, CustomerProfiles } from '@/entities';
import { CollectionIds } from './index';
import { AuditService } from './AuditService';

export class KYCService {
  /**
   * Upload KYC document
   */
  static async uploadKYCDocument(
    customerId: string,
    documentName: string,
    documentUrl: string,
    documentType: string = 'ID_DOCUMENT'
  ): Promise<LoanDocuments> {
    try {
      const document: LoanDocuments = {
        _id: crypto.randomUUID(),
        loanId: '', // KYC documents are not tied to specific loans
        organisationId: 'demo-org-001',
        documentName,
        documentType,
        documentUrl,
        uploadDate: new Date(),
        uploadedBy: customerId,
        fileSize: 0, // Would be set from actual file
      };

      await BaseCrudService.create<LoanDocuments>(CollectionIds.LOAN_DOCUMENTS, document);

      // Log audit trail
      await AuditService.logAction({
        actionType: 'UPLOAD',
        actionDetails: `KYC document uploaded: ${documentName}`,
        resourceAffected: 'CUSTOMER',
        resourceId: customerId,
        performedBy: customerId,
      });

      return document;
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      throw error;
    }
  }

  /**
   * Get KYC documents for customer
   */
  static async getKYCDocuments(customerId: string): Promise<LoanDocuments[]> {
    try {
      const { items } = await BaseCrudService.getAll<LoanDocuments>(
        CollectionIds.LOAN_DOCUMENTS
      );

      return items?.filter(d => d.uploadedBy === customerId) || [];
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
      return [];
    }
  }

  /**
   * Get KYC verification status
   */
  static async getKYCStatus(customerId: string): Promise<string> {
    try {
      const customer = await BaseCrudService.getById<CustomerProfiles>(
        CollectionIds.CUSTOMERS,
        customerId
      );
      return customer?.kycVerificationStatus || 'PENDING';
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      return 'PENDING';
    }
  }

  /**
   * Verify KYC (Admin action)
   */
  static async verifyKYC(
    customerId: string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING',
    verifierId: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update customer KYC status
      await BaseCrudService.update<CustomerProfiles>(CollectionIds.CUSTOMERS, {
        _id: customerId,
        kycVerificationStatus: status,
      });

      // Create KYC verification record
      const kycRecord: KYCVerificationHistory = {
        _id: crypto.randomUUID(),
        customerId,
        organisationId: 'demo-org-001',
        verificationStatus: status,
        verificationTimestamp: new Date(),
        verifierId,
        verifierNotes: notes,
        attemptNumber: 1,
      };

      await BaseCrudService.create<KYCVerificationHistory>(
        CollectionIds.KYC_VERIFICATION_HISTORY,
        kycRecord
      );

      // Log audit trail
      await AuditService.logKYCVerification(customerId, status, verifierId, verifierId);
    } catch (error) {
      console.error('Error verifying KYC:', error);
      throw error;
    }
  }

  /**
   * Get KYC verification history
   */
  static async getKYCHistory(customerId: string): Promise<KYCVerificationHistory[]> {
    try {
      const { items } = await BaseCrudService.getAll<KYCVerificationHistory>(
        CollectionIds.KYC_VERIFICATION_HISTORY
      );

      return items?.filter(k => k.customerId === customerId) || [];
    } catch (error) {
      console.error('Error fetching KYC history:', error);
      return [];
    }
  }

  /**
   * Check if customer has completed KYC
   */
  static async isKYCComplete(customerId: string): Promise<boolean> {
    try {
      const status = await this.getKYCStatus(customerId);
      return status === 'APPROVED';
    } catch (error) {
      console.error('Error checking KYC completion:', error);
      return false;
    }
  }

  /**
   * Get pending KYC customers
   */
  static async getPendingKYCCustomers(): Promise<CustomerProfiles[]> {
    try {
      const { items } = await BaseCrudService.getAll<CustomerProfiles>(
        CollectionIds.CUSTOMERS
      );

      return items?.filter(c => c.kycVerificationStatus === 'PENDING') || [];
    } catch (error) {
      console.error('Error fetching pending KYC customers:', error);
      return [];
    }
  }

  /**
   * Get KYC approval rate
   */
  static async getKYCApprovalRate(): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    approvalRate: number;
  }> {
    try {
      const { items } = await BaseCrudService.getAll<CustomerProfiles>(
        CollectionIds.CUSTOMERS
      );

      const total = items?.length || 0;
      const approved = items?.filter(c => c.kycVerificationStatus === 'APPROVED').length || 0;
      const pending = items?.filter(c => c.kycVerificationStatus === 'PENDING').length || 0;
      const rejected = items?.filter(c => c.kycVerificationStatus === 'REJECTED').length || 0;

      return {
        total,
        approved,
        pending,
        rejected,
        approvalRate: total > 0 ? (approved / total) * 100 : 0,
      };
    } catch (error) {
      console.error('Error calculating KYC approval rate:', error);
      return { total: 0, approved: 0, pending: 0, rejected: 0, approvalRate: 0 };
    }
  }
}
