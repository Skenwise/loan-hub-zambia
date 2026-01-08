/**
 * Data Isolation Validation Service
 * Validates organization-scoped data access and detects data leakage
 * Part of Phase 1: Core Data Isolation
 */

import { BaseCrudService } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { CollectionIds } from './index';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

interface DataIsolationReport {
  organisationId: string;
  totalItems: number;
  itemsByCollection: Record<string, number>;
  crossOrgReferences: Array<{
    collection: string;
    itemId: string;
    referencedOrg: string;
  }>;
  orphanedItems: Array<{
    collection: string;
    itemId: string;
  }>;
}

export class DataIsolationValidationService {
  /**
   * Validate that a user can only access their organisation's data
   */
  static async validateUserAccess(userId: string, organisationId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if user's organisation context matches
      const store = useOrganisationStore.getState();
      
      if (store.organisationId !== organisationId) {
        errors.push(`User organisation context (${store.organisationId}) does not match requested organisation (${organisationId})`);
      }

      // Verify user is in allowed organisations
      if (!store.allowedOrganisations.includes(organisationId)) {
        errors.push(`User is not allowed to access organisation ${organisationId}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error}`],
        warnings,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check for data leakage across organisations
   */
  static async checkForDataLeakage(organisationId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Collections that should be organisation-scoped
      const scopedCollections = [
        CollectionIds.CUSTOMERS,
        CollectionIds.LOANS,
        CollectionIds.REPAYMENTS,
        CollectionIds.LOAN_PRODUCTS,
        CollectionIds.BRANCHES,
        CollectionIds.STAFF_MEMBERS,
        CollectionIds.ROLES,
        CollectionIds.LOAN_FEES,
        CollectionIds.LOAN_PENALTY_SETTINGS,
        CollectionIds.KYC_DOCUMENT_SUBMISSIONS,
        CollectionIds.KYC_STATUS_TRACKING,
        CollectionIds.LOAN_DOCUMENTS,
      ];

      for (const collectionId of scopedCollections) {
        try {
          const { items } = await BaseCrudService.getAll<any>(collectionId);
          
          // Check for items without organisationId
          const itemsWithoutOrg = items.filter(item => !item.organisationId);
          if (itemsWithoutOrg.length > 0) {
            warnings.push(
              `Collection ${collectionId} has ${itemsWithoutOrg.length} items without organisationId`
            );
          }

          // Check for items from other organisations
          const itemsFromOtherOrgs = items.filter(
            item => item.organisationId && item.organisationId !== organisationId
          );
          if (itemsFromOtherOrgs.length > 0) {
            errors.push(
              `Collection ${collectionId} has ${itemsFromOtherOrgs.length} items from other organisations`
            );
          }
        } catch (error) {
          warnings.push(`Could not validate collection ${collectionId}: ${error}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Data leakage check failed: ${error}`],
        warnings,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Generate a comprehensive data isolation report
   */
  static async generateIsolationReport(organisationId: string): Promise<DataIsolationReport> {
    const itemsByCollection: Record<string, number> = {};
    const crossOrgReferences: Array<{
      collection: string;
      itemId: string;
      referencedOrg: string;
    }> = [];
    const orphanedItems: Array<{
      collection: string;
      itemId: string;
    }> = [];

    const scopedCollections = [
      CollectionIds.CUSTOMERS,
      CollectionIds.LOANS,
      CollectionIds.REPAYMENTS,
      CollectionIds.LOAN_PRODUCTS,
      CollectionIds.BRANCHES,
      CollectionIds.STAFF_MEMBERS,
      CollectionIds.ROLES,
      CollectionIds.LOAN_FEES,
      CollectionIds.LOAN_PENALTY_SETTINGS,
      CollectionIds.KYC_DOCUMENT_SUBMISSIONS,
      CollectionIds.KYC_STATUS_TRACKING,
      CollectionIds.LOAN_DOCUMENTS,
    ];

    let totalItems = 0;

    for (const collectionId of scopedCollections) {
      try {
        const { items } = await BaseCrudService.getAll<any>(collectionId);
        
        const orgItems = items.filter(item => item.organisationId === organisationId);
        itemsByCollection[collectionId] = orgItems.length;
        totalItems += orgItems.length;

        // Check for cross-org references
        items.forEach(item => {
          if (item.organisationId && item.organisationId !== organisationId) {
            crossOrgReferences.push({
              collection: collectionId,
              itemId: item._id,
              referencedOrg: item.organisationId,
            });
          }
        });

        // Check for orphaned items (no organisationId)
        items.forEach(item => {
          if (!item.organisationId) {
            orphanedItems.push({
              collection: collectionId,
              itemId: item._id,
            });
          }
        });
      } catch (error) {
        console.error(`Error generating report for ${collectionId}:`, error);
      }
    }

    return {
      organisationId,
      totalItems,
      itemsByCollection,
      crossOrgReferences,
      orphanedItems,
    };
  }

  /**
   * Verify audit trail includes organisation context
   */
  static async validateAuditTrail(organisationId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const { items } = await BaseCrudService.getAll<any>(CollectionIds.AUDIT_TRAIL);
      
      const orgAuditItems = items.filter(item => item.organisationId === organisationId);
      
      if (orgAuditItems.length === 0) {
        warnings.push(`No audit trail entries found for organisation ${organisationId}`);
      }

      // Check for audit entries without organisationId
      const itemsWithoutOrg = items.filter(item => !item.organisationId);
      if (itemsWithoutOrg.length > 0) {
        warnings.push(
          `Audit trail has ${itemsWithoutOrg.length} entries without organisationId`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Audit trail validation failed: ${error}`],
        warnings,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Run comprehensive validation suite
   */
  static async runFullValidation(organisationId: string): Promise<{
    userAccess: ValidationResult;
    dataLeakage: ValidationResult;
    auditTrail: ValidationResult;
    report: DataIsolationReport;
    overallValid: boolean;
  }> {
    const userId = useOrganisationStore.getState().currentStaff?._id || 'unknown';
    
    const userAccess = await this.validateUserAccess(userId, organisationId);
    const dataLeakage = await this.checkForDataLeakage(organisationId);
    const auditTrail = await this.validateAuditTrail(organisationId);
    const report = await this.generateIsolationReport(organisationId);

    const overallValid = userAccess.isValid && dataLeakage.isValid && auditTrail.isValid;

    console.log('[DataIsolation] Validation Results:', {
      userAccess: userAccess.isValid,
      dataLeakage: dataLeakage.isValid,
      auditTrail: auditTrail.isValid,
      overallValid,
    });

    return {
      userAccess,
      dataLeakage,
      auditTrail,
      report,
      overallValid,
    };
  }

  /**
   * Log data isolation compliance status
   */
  static logComplianceStatus(organisationId: string): void {
    const store = useOrganisationStore.getState();
    
    console.log('[DataIsolation] Compliance Status:', {
      organisationId,
      currentOrg: store.organisationId,
      allowedOrgs: store.allowedOrganisations,
      isSuperAdminViewAll: store.isSuperAdminViewAll,
      timestamp: new Date().toISOString(),
    });
  }
}
