import { BaseCrudService } from './BaseCrudService';
import { Organizations, OrganisationSettings, StaffMembers, StaffRoleAssignments, CustomerProfiles, Loans, Repayments, LoanDocuments, KYCDocumentSubmissions, KYCStatusTracking } from '@/entities';

/**
 * DemoManagementService
 * Handles data cleanup, reset, and demo mode management for organisations
 * Only accessible to Super Admin users
 */
export class DemoManagementService {
  /**
   * Reset all organisation data (except platform-level config)
   * Removes: staff, customers, loans, repayments, KYC docs, collateral, etc.
   * Keeps: subscription plans, audit logs, organisation settings
   */
  static async resetOrganisationData(organisationId: string): Promise<{
    success: boolean;
    message: string;
    deletedCounts: Record<string, number>;
  }> {
    try {
      const deletedCounts: Record<string, number> = {};

      // 1. Delete all staff members and role assignments
      const { items: staffMembers } = await BaseCrudService.getAll<StaffMembers>('staffmembers');
      const orgStaff = staffMembers.filter(s => s.organisationId === organisationId || !s.organisationId);
      for (const staff of orgStaff) {
        await BaseCrudService.delete('staffmembers', staff._id);
      }
      deletedCounts['staffMembers'] = orgStaff.length;

      // 2. Delete all staff role assignments
      const { items: roleAssignments } = await BaseCrudService.getAll<StaffRoleAssignments>('staffroleassignments');
      const orgRoleAssignments = roleAssignments.filter(ra => ra.organizationId === organisationId);
      for (const assignment of orgRoleAssignments) {
        await BaseCrudService.delete('staffroleassignments', assignment._id);
      }
      deletedCounts['roleAssignments'] = orgRoleAssignments.length;

      // 3. Delete all customer profiles
      const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      const orgCustomers = customers.filter(c => c.organisationId === organisationId);
      for (const customer of orgCustomers) {
        await BaseCrudService.delete('customers', customer._id);
      }
      deletedCounts['customers'] = orgCustomers.length;

      // 4. Delete all loans
      const { items: loans } = await BaseCrudService.getAll<Loans>('loans');
      const orgLoans = loans.filter(l => l.organisationId === organisationId);
      for (const loan of orgLoans) {
        await BaseCrudService.delete('loans', loan._id);
      }
      deletedCounts['loans'] = orgLoans.length;

      // 5. Delete all repayments
      const { items: repayments } = await BaseCrudService.getAll<Repayments>('repayments');
      const orgRepayments = repayments.filter(r => r.organisationId === organisationId);
      for (const repayment of orgRepayments) {
        await BaseCrudService.delete('repayments', repayment._id);
      }
      deletedCounts['repayments'] = orgRepayments.length;

      // 6. Delete all loan documents
      const { items: loanDocs } = await BaseCrudService.getAll<LoanDocuments>('loandocuments');
      const orgLoanDocs = loanDocs.filter(d => d.organisationId === organisationId);
      for (const doc of orgLoanDocs) {
        await BaseCrudService.delete('loandocuments', doc._id);
      }
      deletedCounts['loanDocuments'] = orgLoanDocs.length;

      // 7. Delete all KYC document submissions
      const { items: kycDocs } = await BaseCrudService.getAll<KYCDocumentSubmissions>('kycdocumentsubmissions');
      const orgKycDocs = kycDocs.filter(d => {
        // Find the customer for this KYC doc
        const customer = orgCustomers.find(c => c._id === d.customerId);
        return customer !== undefined;
      });
      for (const doc of orgKycDocs) {
        await BaseCrudService.delete('kycdocumentsubmissions', doc._id);
      }
      deletedCounts['kycDocuments'] = orgKycDocs.length;

      // 8. Delete all KYC status tracking
      const { items: kycStatus } = await BaseCrudService.getAll<KYCStatusTracking>('kycstatustracking');
      const orgKycStatus = kycStatus.filter(k => {
        const customer = orgCustomers.find(c => c._id === k.customerId);
        return customer !== undefined;
      });
      for (const status of orgKycStatus) {
        await BaseCrudService.delete('kycstatustracking', status._id);
      }
      deletedCounts['kycStatusRecords'] = orgKycStatus.length;

      // 9. Delete all collateral records (if collection exists)
      try {
        const { items: collateral } = await BaseCrudService.getAll<any>('collateral');
        const orgCollateral = collateral.filter(c => c.organisationId === organisationId);
        for (const item of orgCollateral) {
          await BaseCrudService.delete('collateral', item._id);
        }
        deletedCounts['collateralRecords'] = orgCollateral.length;
      } catch (e) {
        // Collateral collection might not exist
        deletedCounts['collateralRecords'] = 0;
      }

      return {
        success: true,
        message: `Successfully reset all data for organisation ${organisationId}`,
        deletedCounts,
      };
    } catch (error) {
      console.error('Error resetting organisation data:', error);
      throw new Error(`Failed to reset organisation data: ${error}`);
    }
  }

  /**
   * Enable demo mode for an organisation
   */
  static async enableDemoMode(organisationId: string): Promise<void> {
    try {
      const { items: settings } = await BaseCrudService.getAll<OrganisationSettings>('organisationsettings');
      const orgSettings = settings.find(s => s._id === organisationId);

      if (orgSettings) {
        await BaseCrudService.update<OrganisationSettings>('organisationsettings', {
          _id: organisationId,
          isDemoMode: true,
        });
      } else {
        // Create new settings with demo mode enabled
        await BaseCrudService.create('organisationsettings', {
          _id: organisationId,
          isDemoMode: true,
          companyName: '',
          country: '',
          timezone: '',
          currency: '',
        });
      }
    } catch (error) {
      console.error('Error enabling demo mode:', error);
      throw new Error(`Failed to enable demo mode: ${error}`);
    }
  }

  /**
   * Disable demo mode for an organisation
   */
  static async disableDemoMode(organisationId: string): Promise<void> {
    try {
      await BaseCrudService.update<OrganisationSettings>('organisationsettings', {
        _id: organisationId,
        isDemoMode: false,
      });
    } catch (error) {
      console.error('Error disabling demo mode:', error);
      throw new Error(`Failed to disable demo mode: ${error}`);
    }
  }

  /**
   * Check if an organisation is in demo mode
   */
  static async isDemoMode(organisationId: string): Promise<boolean> {
    try {
      const settings = await BaseCrudService.getById<OrganisationSettings>('organisationsettings', organisationId);
      return settings?.isDemoMode ?? false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get demo mode status for all organisations
   */
  static async getAllDemoModeStatuses(): Promise<Array<{ organisationId: string; isDemoMode: boolean }>> {
    try {
      const { items: settings } = await BaseCrudService.getAll<OrganisationSettings>('organisationsettings');
      return settings.map(s => ({
        organisationId: s._id,
        isDemoMode: s.isDemoMode ?? false,
      }));
    } catch (error) {
      console.error('Error fetching demo mode statuses:', error);
      return [];
    }
  }
}
