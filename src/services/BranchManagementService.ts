import { BaseCrudService } from './BaseCrudService';
import { AuditService } from './AuditService';
import { SubscriptionService } from './SubscriptionService';
import { Branches, BranchHolidays } from '@/entities';
import { CollectionIds } from '@/services';

export class BranchManagementService {
  /**
   * Create a new branch with subscription limit enforcement
   */
  static async createBranch(
    branchData: Omit<Branches, '_id' | '_createdDate' | '_updatedDate'>,
    staffMemberId: string
  ): Promise<Branches> {
    const organisationId = branchData.organisationId;

    // Check subscription limits
    const canCreateBranch = await SubscriptionService.canCreateBranch(organisationId);
    if (!canCreateBranch) {
      throw new Error(
        'Branch creation limit reached. Please upgrade your subscription to add more branches.'
      );
    }

    // Create branch
    const branchId = crypto.randomUUID();
    const newBranch: Branches = {
      _id: branchId,
      ...branchData,
    };

    await BaseCrudService.create('branches', newBranch);

    // Log to audit trail
    await AuditService.logAction({
      staffMemberId,
      performedBy: staffMemberId,
      actionType: 'BRANCH_CREATED',
      actionDetails: `Created branch: ${branchData.branchName} (${branchData.branchCode})`,
      resourceAffected: 'Branch',
      resourceId: branchId,
    });

    return newBranch;
  }

  /**
   * Update an existing branch
   */
  static async updateBranch(
    branchId: string,
    updates: Partial<Branches>,
    staffMemberId: string
  ): Promise<Branches> {
    const updatedBranch = await BaseCrudService.update('branches', {
      _id: branchId,
      ...updates,
    });

    // Log to audit trail
    await AuditService.logAction({
      staffMemberId,
      performedBy: staffMemberId,
      actionType: 'BRANCH_UPDATED',
      actionDetails: `Updated branch: ${updates.branchName || 'N/A'}`,
      resourceAffected: 'Branch',
      resourceId: branchId,
    });

    return updatedBranch;
  }

  /**
   * Get all branches for an organization
   */
  static async getBranchesByOrganisation(organisationId: string): Promise<Branches[]> {
    const { items } = await BaseCrudService.getAll<Branches>('branches');
    return items.filter((branch) => branch.organisationId === organisationId);
  }

  /**
   * Get a single branch by ID
   */
  static async getBranchById(branchId: string): Promise<Branches> {
    return await BaseCrudService.getById<Branches>('branches', branchId);
  }

  /**
   * Delete a branch
   */
  static async deleteBranch(branchId: string, staffMemberId: string): Promise<void> {
    const branch = await this.getBranchById(branchId);

    // Delete associated holidays
    const holidays = await this.getHolidaysByBranch(branchId);
    for (const holiday of holidays) {
      await BaseCrudService.delete('branchholidays', holiday._id);
    }

    // Delete branch
    await BaseCrudService.delete('branches', branchId);

    // Log to audit trail
    await AuditService.logAction({
      staffMemberId,
      performedBy: staffMemberId,
      actionType: 'BRANCH_DELETED',
      actionDetails: `Deleted branch: ${branch.branchName} (${branch.branchCode})`,
      resourceAffected: 'Branch',
      resourceId: branchId,
    });
  }

  /**
   * Add a holiday to a branch
   */
  static async addHoliday(
    holidayData: Omit<BranchHolidays, '_id' | '_createdDate' | '_updatedDate'>,
    staffMemberId: string
  ): Promise<BranchHolidays> {
    const holidayId = crypto.randomUUID();
    const newHoliday: BranchHolidays = {
      _id: holidayId,
      ...holidayData,
    };

    await BaseCrudService.create('branchholidays', newHoliday);

    // Log to audit trail
    await AuditService.logAction({
      staffMemberId,
      performedBy: staffMemberId,
      actionType: 'HOLIDAY_ADDED',
      actionDetails: `Added holiday: ${holidayData.holidayName} on ${holidayData.holidayDate}`,
      resourceAffected: 'BranchHoliday',
      resourceId: holidayId,
    });

    return newHoliday;
  }

  /**
   * Update a holiday
   */
  static async updateHoliday(
    holidayId: string,
    updates: Partial<BranchHolidays>,
    staffMemberId: string
  ): Promise<BranchHolidays> {
    const updatedHoliday = await BaseCrudService.update('branchholidays', {
      _id: holidayId,
      ...updates,
    });

    // Log to audit trail
    await AuditService.logAction({
      staffMemberId,
      performedBy: staffMemberId,
      actionType: 'HOLIDAY_UPDATED',
      actionDetails: `Updated holiday: ${updates.holidayName || 'N/A'}`,
      resourceAffected: 'BranchHoliday',
      resourceId: holidayId,
    });

    return updatedHoliday;
  }

  /**
   * Delete a holiday
   */
  static async deleteHoliday(holidayId: string, staffMemberId: string): Promise<void> {
    const holiday = await BaseCrudService.getById<BranchHolidays>('branchholidays', holidayId);

    await BaseCrudService.delete('branchholidays', holidayId);

    // Log to audit trail
    await AuditService.logAction({
      staffMemberId,
      performedBy: staffMemberId,
      actionType: 'HOLIDAY_DELETED',
      actionDetails: `Deleted holiday: ${holiday.holidayName}`,
      resourceAffected: 'BranchHoliday',
      resourceId: holidayId,
    });
  }

  /**
   * Get all holidays for a branch
   */
  static async getHolidaysByBranch(branchId: string): Promise<BranchHolidays[]> {
    const { items } = await BaseCrudService.getAll<BranchHolidays>('branchholidays');
    return items.filter((holiday) => holiday.branchId === branchId);
  }

  /**
   * Get holidays that apply to new loans by default
   */
  static async getApplicableHolidaysForNewLoans(branchId: string): Promise<BranchHolidays[]> {
    const holidays = await this.getHolidaysByBranch(branchId);
    return holidays.filter((h) => h.applyToNewLoansByDefault);
  }

  /**
   * Copy holidays from one branch to another (with overwriting)
   */
  static async copyHolidaysBetweenBranches(
    sourceBranchId: string,
    targetBranchIds: string[],
    overwrite: boolean,
    staffMemberId: string
  ): Promise<void> {
    const sourceHolidays = await this.getHolidaysByBranch(sourceBranchId);

    for (const targetBranchId of targetBranchIds) {
      if (overwrite) {
        // Delete existing holidays in target branch
        const existingHolidays = await this.getHolidaysByBranch(targetBranchId);
        for (const holiday of existingHolidays) {
          await BaseCrudService.delete('branchholidays', holiday._id);
        }
      }

      // Copy holidays from source to target
      for (const sourceHoliday of sourceHolidays) {
        const newHolidayId = crypto.randomUUID();
        const newHoliday: Partial<BranchHolidays> = {
          _id: newHolidayId,
          branchId: targetBranchId,
          organisationId: sourceHoliday.organisationId,
          holidayName: sourceHoliday.holidayName,
          holidayDate: sourceHoliday.holidayDate,
          isPublicHoliday: sourceHoliday.isPublicHoliday,
          applyToNewLoansByDefault: sourceHoliday.applyToNewLoansByDefault,
          description: sourceHoliday.description,
        };

        await BaseCrudService.create('branchholidays', newHoliday as BranchHolidays);
      }
    }

    // Log to audit trail
    await AuditService.logAction({
      staffMemberId,
      performedBy: staffMemberId,
      actionType: 'HOLIDAYS_BULK_COPIED',
      actionDetails: `Copied ${sourceHolidays.length} holidays from branch ${sourceBranchId} to ${targetBranchIds.length} branches (overwrite: ${overwrite})`,
      resourceAffected: 'BranchHoliday',
      resourceId: sourceBranchId,
    });
  }

  /**
   * Get branch statistics
   */
  static async getBranchStatistics(organisationId: string) {
    const branches = await this.getBranchesByOrganisation(organisationId);
    const activeBranches = branches.filter((b) => b.isActive).length;

    return {
      totalBranches: branches.length,
      activeBranches,
      inactiveBranches: branches.length - activeBranches,
    };
  }
}
