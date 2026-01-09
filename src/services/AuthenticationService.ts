/**
 * Authentication Service
 * Handles persistent user-organisation relationship checks and conditional routing
 * Ensures proper authentication flow based on user's organisation membership and role
 */

import { BaseCrudService } from '@/integrations';
import { Organizations, StaffMembers, Roles } from '@/entities';
import { OrganisationService } from './OrganisationService';
import { StaffService } from './StaffService';
import { RoleService } from './RoleService';
import { CollectionIds } from './index';

export interface UserOrganisationContext {
  organisation: Organizations | null;
  staff: StaffMembers | null;
  role: Roles | null;
  userType: 'admin' | 'customer' | 'invited_user' | 'new_user';
  redirectPath: string | null;
  canCreateOrganisation: boolean;
  isOrganisationMember: boolean;
}

export class AuthenticationService {
  /**
   * Check user's organisation membership and determine routing
   * This is the primary method for post-login authentication flow
   */
  static async checkUserOrganisationContext(
    userEmail: string
  ): Promise<UserOrganisationContext> {
    try {
      console.log('[AuthenticationService] Checking context for email:', userEmail);
      
      // Step 1: Check if user is an admin (has organisation with matching contact email)
      const adminOrganisations = await OrganisationService.getOrganisationsByEmail(userEmail);
      console.log('[AuthenticationService] Admin organisations found:', adminOrganisations.length);
      
      if (adminOrganisations.length > 0) {
        // User is an admin of at least one organisation
        const organisation = adminOrganisations[0]; // Use first organisation if multiple
        console.log('[AuthenticationService] User is admin of organisation:', organisation._id);
        
        const staff = await this.getStaffByEmail(userEmail, organisation._id);
        const role = staff ? await RoleService.getRole(staff.roleId || '') : null;

        return {
          organisation,
          staff,
          role,
          userType: 'admin',
          redirectPath: '/admin/dashboard',
          canCreateOrganisation: false, // Admins cannot create new organisations
          isOrganisationMember: true,
        };
      }

      // Step 2: Check if user is an invited staff member
      const staffMember = await this.getStaffByEmail(userEmail);
      console.log('[AuthenticationService] Staff member found:', !!staffMember);
      
      if (staffMember && staffMember.organisationId) {
        // User is an invited staff member
        console.log('[AuthenticationService] User is invited staff member of organisation:', staffMember.organisationId);
        
        const organisation = await OrganisationService.getOrganisation(staffMember.organisationId);
        const role = await RoleService.getRole(staffMember.roleId || '');

        // Determine redirect based on staff role
        let redirectPath = '/admin/dashboard';
        if (staffMember.role === 'Loan Officer') {
          redirectPath = '/admin/dashboard/loan-officer';
        } else if (staffMember.role === 'Branch Manager') {
          redirectPath = '/admin/settings/branch-manager';
        }

        return {
          organisation,
          staff: staffMember,
          role,
          userType: 'invited_user',
          redirectPath,
          canCreateOrganisation: false, // Invited users cannot create organisations
          isOrganisationMember: true,
        };
      }

      // Step 3: User is new (no organisation membership)
      console.log('[AuthenticationService] User is new - no organisation membership');
      return {
        organisation: null,
        staff: null,
        role: null,
        userType: 'new_user',
        redirectPath: null,
        canCreateOrganisation: true, // New users can create organisations
        isOrganisationMember: false,
      };
    } catch (error) {
      console.error('Error checking user organisation context:', error);
      
      // Return safe default for new user on error
      return {
        organisation: null,
        staff: null,
        role: null,
        userType: 'new_user',
        redirectPath: null,
        canCreateOrganisation: true,
        isOrganisationMember: false,
      };
    }
  }

  /**
   * Get staff member by email
   */
  private static async getStaffByEmail(
    email: string,
    organisationId?: string
  ): Promise<StaffMembers | null> {
    try {
      const { items } = await BaseCrudService.getAll<StaffMembers>(
        CollectionIds.STAFF_MEMBERS
      );

      if (!items || items.length === 0) {
        return null;
      }

      // Filter by email and optionally by organisation
      const staff = items.find(
        s => s.email && s.email.toLowerCase() === email.toLowerCase() &&
             (!organisationId || s.organisationId === organisationId)
      );

      return staff || null;
    } catch (error) {
      console.error('Error fetching staff by email:', error);
      return null;
    }
  }

  /**
   * Validate if user can create a new organisation
   * Only new users without any organisation membership can create
   */
  static async canUserCreateOrganisation(userEmail: string): Promise<boolean> {
    try {
      const context = await this.checkUserOrganisationContext(userEmail);
      return context.canCreateOrganisation;
    } catch (error) {
      console.error('Error validating organisation creation permission:', error);
      return false;
    }
  }

  /**
   * Check if user is already an organisation member
   */
  static async isUserOrganisationMember(userEmail: string): Promise<boolean> {
    try {
      const context = await this.checkUserOrganisationContext(userEmail);
      return context.isOrganisationMember;
    } catch (error) {
      console.error('Error checking organisation membership:', error);
      return false;
    }
  }

  /**
   * Get all organisations where user is a member (admin or invited staff)
   */
  static async getUserOrganisations(userEmail: string): Promise<Organizations[]> {
    try {
      const organisations: Organizations[] = [];

      // Get organisations where user is admin
      const adminOrgs = await OrganisationService.getOrganisationsByEmail(userEmail);
      organisations.push(...adminOrgs);

      // Get organisations where user is invited staff
      const staffMember = await this.getStaffByEmail(userEmail);
      if (staffMember && staffMember.organisationId) {
        const staffOrg = await OrganisationService.getOrganisation(staffMember.organisationId);
        if (staffOrg && !organisations.find(o => o._id === staffOrg._id)) {
          organisations.push(staffOrg);
        }
      }

      return organisations;
    } catch (error) {
      console.error('Error fetching user organisations:', error);
      return [];
    }
  }

  /**
   * Store authentication context in session for quick access
   */
  static storeAuthContext(context: UserOrganisationContext): void {
    try {
      sessionStorage.setItem('authContext', JSON.stringify({
        userType: context.userType,
        organisationId: context.organisation?._id,
        staffId: context.staff?._id,
        roleId: context.role?._id,
        redirectPath: context.redirectPath,
        canCreateOrganisation: context.canCreateOrganisation,
        isOrganisationMember: context.isOrganisationMember,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error storing auth context:', error);
    }
  }

  /**
   * Retrieve stored authentication context
   */
  static getStoredAuthContext(): Partial<UserOrganisationContext> | null {
    try {
      const stored = sessionStorage.getItem('authContext');
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Check if context is still valid (less than 1 hour old)
      if (Date.now() - parsed.timestamp > 3600000) {
        sessionStorage.removeItem('authContext');
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error retrieving auth context:', error);
      return null;
    }
  }

  /**
   * Clear stored authentication context
   */
  static clearAuthContext(): void {
    try {
      sessionStorage.removeItem('authContext');
    } catch (error) {
      console.error('Error clearing auth context:', error);
    }
  }
}
