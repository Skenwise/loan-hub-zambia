/**
 * Authorization Service
 * Handles role-based access control and permission checking
 */

import { StaffService } from './StaffService';
import { RoleService } from './RoleService';
import { Permissions } from './index';

export class AuthorizationService {
  /**
   * Check if staff member has permission
   */
  static async hasPermission(
    staffId: string,
    organisationId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const roleAssignment = await StaffService.getStaffRole(staffId, organisationId);
      if (!roleAssignment || !roleAssignment.roleId) return false;

      return RoleService.roleHasPermission(roleAssignment.roleId, permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if staff member has any of the given permissions
   */
  static async hasAnyPermission(
    staffId: string,
    organisationId: string,
    permissions: string[]
  ): Promise<boolean> {
    try {
      for (const permission of permissions) {
        if (await this.hasPermission(staffId, organisationId, permission)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking any permission:', error);
      return false;
    }
  }

  /**
   * Check if staff member has all given permissions
   */
  static async hasAllPermissions(
    staffId: string,
    organisationId: string,
    permissions: string[]
  ): Promise<boolean> {
    try {
      for (const permission of permissions) {
        if (!(await this.hasPermission(staffId, organisationId, permission))) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking all permissions:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a staff member
   */
  static async getStaffPermissions(
    staffId: string,
    organisationId: string
  ): Promise<string[]> {
    try {
      const roleAssignment = await StaffService.getStaffRole(staffId, organisationId);
      if (!roleAssignment || !roleAssignment.roleId) return [];

      return RoleService.getRolePermissions(roleAssignment.roleId);
    } catch (error) {
      console.error('Error fetching staff permissions:', error);
      return [];
    }
  }

  /**
   * Check segregation of duties - ensure staff member cannot perform conflicting actions
   */
  static async checkSegregationOfDuties(
    staffId: string,
    organisationId: string,
    action: string
  ): Promise<boolean> {
    try {
      const permissions = await this.getStaffPermissions(staffId, organisationId);

      // Define conflicting permission pairs
      const conflictingPairs = [
        // Credit Officer cannot approve their own applications
        [Permissions.CREATE_LOAN_APPLICATION, Permissions.APPROVE_LOAN],
        // Credit Manager cannot disburse loans they approved
        [Permissions.APPROVE_LOAN, Permissions.DISBURSE_LOAN],
        // Finance Officer cannot approve loans
        [Permissions.DISBURSE_LOAN, Permissions.APPROVE_LOAN],
      ];

      // Check if staff has conflicting permissions for the requested action
      for (const [perm1, perm2] of conflictingPairs) {
        if (action === perm1 && permissions.includes(perm2)) {
          return false; // Conflict detected
        }
        if (action === perm2 && permissions.includes(perm1)) {
          return false; // Conflict detected
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking segregation of duties:', error);
      return false;
    }
  }

  /**
   * Authorize action with full checks
   */
  static async authorizeAction(
    staffId: string,
    organisationId: string,
    action: string
  ): Promise<{ authorized: boolean; reason?: string }> {
    try {
      // Check if staff member has permission
      const hasPermission = await this.hasPermission(staffId, organisationId, action);
      if (!hasPermission) {
        return { authorized: false, reason: 'Insufficient permissions' };
      }

      // Check segregation of duties
      const passedSOD = await this.checkSegregationOfDuties(staffId, organisationId, action);
      if (!passedSOD) {
        return { authorized: false, reason: 'Segregation of duties violation' };
      }

      return { authorized: true };
    } catch (error) {
      console.error('Error authorizing action:', error);
      return { authorized: false, reason: 'Authorization check failed' };
    }
  }
}
