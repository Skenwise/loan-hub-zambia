import { BaseCrudService } from '@/integrations';
import { CollectionIds } from '@/services';

/**
 * Service for cleaning up customer-related data from the system
 * Used for resetting the system to a clean state for fresh launches
 */
export class DataCleanupService {
  /**
   * Get all items from a collection
   */
  private static async getAllItems(collectionId: string) {
    try {
      const { items } = await BaseCrudService.getAll(collectionId);
      return items || [];
    } catch (error) {
      console.error(`Error fetching items from ${collectionId}:`, error);
      return [];
    }
  }

  /**
   * Delete an item from a collection
   */
  private static async deleteItem(collectionId: string, itemId: string) {
    try {
      await BaseCrudService.delete(collectionId, itemId);
      return true;
    } catch (error) {
      console.error(`Error deleting item ${itemId} from ${collectionId}:`, error);
      return false;
    }
  }

  /**
   * Clean up all customer-related data
   * Returns a report of what was deleted
   */
  static async cleanupAllCustomerData() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      deletedCounts: {
        customers: 0,
        loans: 0,
        repayments: 0,
        kycDocumentSubmissions: 0,
        kycStatusTracking: 0,
        kycVerificationHistory: 0,
        loanDocuments: 0,
        loanWorkflowHistory: 0,
        eclResults: 0,
        bozProvisions: 0,
        auditTrail: 0,
        customerAccounts: 0,
      },
      errors: [] as string[],
    };

    try {
      // 1. Delete Customer Profiles
      const customers = await this.getAllItems('customers');
      for (const customer of customers) {
        const deleted = await this.deleteItem('customers', customer._id);
        if (deleted) report.deletedCounts.customers++;
      }

      // 2. Delete Loans (must be before repayments and related records)
      const loans = await this.getAllItems('loans');
      for (const loan of loans) {
        const deleted = await this.deleteItem('loans', loan._id);
        if (deleted) report.deletedCounts.loans++;
      }

      // 3. Delete Repayments
      const repayments = await this.getAllItems('repayments');
      for (const repayment of repayments) {
        const deleted = await this.deleteItem('repayments', repayment._id);
        if (deleted) report.deletedCounts.repayments++;
      }

      // 4. Delete KYC Document Submissions
      const kycSubmissions = await this.getAllItems('kycdocumentsubmissions');
      for (const submission of kycSubmissions) {
        const deleted = await this.deleteItem('kycdocumentsubmissions', submission._id);
        if (deleted) report.deletedCounts.kycDocumentSubmissions++;
      }

      // 5. Delete KYC Status Tracking
      const kycStatus = await this.getAllItems('kycstatustracking');
      for (const status of kycStatus) {
        const deleted = await this.deleteItem('kycstatustracking', status._id);
        if (deleted) report.deletedCounts.kycStatusTracking++;
      }

      // 6. Delete KYC Verification History
      const kycHistory = await this.getAllItems('kycverificationhistory');
      for (const history of kycHistory) {
        const deleted = await this.deleteItem('kycverificationhistory', history._id);
        if (deleted) report.deletedCounts.kycVerificationHistory++;
      }

      // 7. Delete Loan Documents
      const loanDocs = await this.getAllItems('loandocuments');
      for (const doc of loanDocs) {
        const deleted = await this.deleteItem('loandocuments', doc._id);
        if (deleted) report.deletedCounts.loanDocuments++;
      }

      // 8. Delete Loan Workflow History
      const workflowHistory = await this.getAllItems('loanworkflowhistory');
      for (const history of workflowHistory) {
        const deleted = await this.deleteItem('loanworkflowhistory', history._id);
        if (deleted) report.deletedCounts.loanWorkflowHistory++;
      }

      // 9. Delete ECL Results
      const eclResults = await this.getAllItems('eclresults');
      for (const result of eclResults) {
        const deleted = await this.deleteItem('eclresults', result._id);
        if (deleted) report.deletedCounts.eclResults++;
      }

      // 10. Delete BoZ Provisions
      const bozProvisions = await this.getAllItems('bozprovisions');
      for (const provision of bozProvisions) {
        const deleted = await this.deleteItem('bozprovisions', provision._id);
        if (deleted) report.deletedCounts.bozProvisions++;
      }

      // 11. Delete Audit Trail
      const auditTrail = await this.getAllItems('audittrail');
      for (const audit of auditTrail) {
        const deleted = await this.deleteItem('audittrail', audit._id);
        if (deleted) report.deletedCounts.auditTrail++;
      }

      // 12. Delete Customer Accounts
      const customerAccounts = await this.getAllItems('customeraccounts');
      for (const account of customerAccounts) {
        const deleted = await this.deleteItem('customeraccounts', account._id);
        if (deleted) report.deletedCounts.customerAccounts++;
      }

      report.status = 'completed';
    } catch (error) {
      report.status = 'failed';
      report.errors.push(`Unexpected error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
    }

    return report;
  }

  /**
   * Reset demo data by clearing demo-specific records
   */
  static async resetDemoData() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      message: 'Resetting demo data...',
      errors: [] as string[],
    };

    try {
      // Clear all customer-related data (same as cleanup)
      const cleanupReport = await this.cleanupAllCustomerData();
      report.status = cleanupReport.status;
      if (cleanupReport.errors.length > 0) {
        report.errors = cleanupReport.errors;
      }
    } catch (error) {
      report.status = 'failed';
      report.errors.push(`Error resetting demo data: ${error instanceof Error ? error.message : String(error)}`);
    }

    return report;
  }

  /**
   * Get a summary of current data in the system
   */
  static async getDataSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      counts: {
        customers: 0,
        loans: 0,
        repayments: 0,
        kycDocumentSubmissions: 0,
        kycStatusTracking: 0,
        kycVerificationHistory: 0,
        loanDocuments: 0,
        loanWorkflowHistory: 0,
        eclResults: 0,
        bozProvisions: 0,
        auditTrail: 0,
        customerAccounts: 0,
      },
      errors: [] as string[],
    };

    try {
      const collections = [
        { key: 'customers', id: 'customers' },
        { key: 'loans', id: 'loans' },
        { key: 'repayments', id: 'repayments' },
        { key: 'kycDocumentSubmissions', id: 'kycdocumentsubmissions' },
        { key: 'kycStatusTracking', id: 'kycstatustracking' },
        { key: 'kycVerificationHistory', id: 'kycverificationhistory' },
        { key: 'loanDocuments', id: 'loandocuments' },
        { key: 'loanWorkflowHistory', id: 'loanworkflowhistory' },
        { key: 'eclResults', id: 'eclresults' },
        { key: 'bozProvisions', id: 'bozprovisions' },
        { key: 'auditTrail', id: 'audittrail' },
        { key: 'customerAccounts', id: 'customeraccounts' },
      ];

      for (const collection of collections) {
        try {
          const items = await this.getAllItems(collection.id);
          summary.counts[collection.key as keyof typeof summary.counts] = items.length;
        } catch (error) {
          summary.errors.push(`Error counting ${collection.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      summary.errors.push(`Error getting data summary: ${error instanceof Error ? error.message : String(error)}`);
    }

    return summary;
  }
}
