/**
 * Organisation Membership Service
 * Handles persistent database-driven organisation membership checks
 * Unified membership collection for admins and invited staff
 */

import { BaseCrudService } from '@/integrations';
import { Organizations } from '@/entities';
import { OrganisationService } from './OrganisationService';
import { CollectionIds } from './index';

export interface OrganisationMemberships {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  userEmail?: string;
  userId?: string;
  organisationId?: string;
  membershipType?: string;
  role?: string;
  status?: string;
  joinedDate?: Date;
  invitedBy?: string;
  isActive?: boolean;
}

export interface MembershipContext {
  membership: OrganisationMemberships | null;
  organisation: Organizations | null;
  userType: 'super_admin' | 'admin' | 'staff' | 'viewer' | 'new_user';
  redirectPath: string | null;
  canCreateOrganisation: boolean;
  isOrganisationMember: boolean;
  role: string | null;
  isSuperAdmin?: boolean;
}

export class OrganisationMembershipService {
  /**
   * Check user's organisation membership using database lookup
   * This is the primary method for post-login authentication flow
   * 
   * @param userEmail - The authenticated user's email
   * @returns MembershipContext with membership details and routing info
   */
  static async checkUserMembership(userEmail: string): Promise<MembershipContext> {
    try {
      console.log('[OrganisationMembershipService] Checking membership for email:', userEmail);

      // Step 1: Query OrganisationMemberships collection for this user
      const { items: memberships } = await BaseCrudService.getAll<OrganisationMemberships>(
        CollectionIds.ORGANISATION_MEMBERSHIPS
      );

      if (!memberships || memberships.length === 0) {
        console.log('[OrganisationMembershipService] No memberships found in collection');
        return this.createNewUserContext();
      }

      // Step 2: Find membership record for this user
      const userMembership = memberships.find(
        m => m.userEmail && m.userEmail.toLowerCase() === userEmail.toLowerCase() && m.isActive !== false
      );

      if (!userMembership) {
        console.log('[OrganisationMembershipService] No active membership found for user');
        return this.createNewUserContext();
      }

      console.log('[OrganisationMembershipService] Membership found:', {
        membershipId: userMembership._id,
        organisationId: userMembership.organisationId,
        membershipType: userMembership.membershipType,
        role: userMembership.role,
      });

      // Step 3: Retrieve organisation details
      if (!userMembership.organisationId) {
        console.log('[OrganisationMembershipService] Membership has no organisation ID');
        return this.createNewUserContext();
      }

      const organisation = await OrganisationService.getOrganisation(userMembership.organisationId);

      if (!organisation) {
        console.log('[OrganisationMembershipService] Organisation not found');
        return this.createNewUserContext();
      }

      // Step 4: Determine redirect path based on membership type and role
      const redirectPath = this.determineRedirectPath(userMembership.membershipType, userMembership.role);
      const isSuperAdmin = userMembership.membershipType === 'super_admin';

      console.log('[OrganisationMembershipService] User is organisation member:', {
        membershipType: userMembership.membershipType,
        isSuperAdmin,
        redirectPath,
      });

      return {
        membership: userMembership,
        organisation,
        userType: (userMembership.membershipType || 'viewer') as 'super_admin' | 'admin' | 'staff' | 'viewer',
        redirectPath,
        canCreateOrganisation: false, // Existing members cannot create organisations
        isOrganisationMember: true,
        role: userMembership.role || null,
        isSuperAdmin,
      };
    } catch (error) {
      console.error('[OrganisationMembershipService] Error checking membership:', error);
      return this.createNewUserContext();
    }
  }

  /**
   * Determine redirect path based on membership type and role
   */
  private static determineRedirectPath(membershipType?: string, role?: string): string {
    switch (membershipType) {
      case 'super_admin':
        // Super Admin always redirects to admin dashboard with full access
        return '/admin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'staff':
        // Role-specific redirects for staff
        if (role === 'Loan Officer') {
          return '/admin/dashboard/loan-officer';
        } else if (role === 'Branch Manager') {
          return '/admin/settings/branch-manager';
        } else if (role === 'Compliance Officer') {
          return '/admin/reports/comprehensive';
        }
        return '/admin/dashboard';
      case 'viewer':
        return '/customer-portal';
      default:
        return '/admin/dashboard';
    }
  }

  /**
   * Create a new user context (no membership found)
   */
  private static createNewUserContext(): MembershipContext {
    console.log('[OrganisationMembershipService] User is new - no membership');
    return {
      membership: null,
      organisation: null,
      userType: 'new_user',
      redirectPath: null,
      canCreateOrganisation: true, // New users can create organisations
      isOrganisationMember: false,
      role: null,
    };
  }

  /**
   * Create a new membership record for a user
   * Called when user creates an organisation
   */
  static async createMembership(
    userEmail: string,
    userId: string,
    organisationId: string,
    membershipType: 'admin' | 'staff' | 'viewer' = 'admin',
    role: string = 'Admin/Owner'
  ): Promise<OrganisationMemberships> {
    try {
      console.log('[OrganisationMembershipService] Creating membership:', {
        userEmail,
        organisationId,
        membershipType,
        role,
      });

      const membership: OrganisationMemberships = {
        _id: crypto.randomUUID(),
        userEmail: userEmail.toLowerCase(),
        userId,
        organisationId,
        membershipType,
        role,
        status: 'ACTIVE',
        joinedDate: new Date(),
        isActive: true,
      };

      await BaseCrudService.create(CollectionIds.ORGANISATION_MEMBERSHIPS, membership);

      console.log('[OrganisationMembershipService] Membership created successfully:', membership._id);
      return membership;
    } catch (error) {
      console.error('[OrganisationMembershipService] Error creating membership:', error);
      throw error;
    }
  }

  /**
   * Invite a user to an organisation
   * Creates a membership record for invited staff
   */
  static async inviteUserToOrganisation(
    userEmail: string,
    userId: string,
    organisationId: string,
    role: string,
    invitedBy: string
  ): Promise<OrganisationMemberships> {
    try {
      console.log('[OrganisationMembershipService] Inviting user to organisation:', {
        userEmail,
        organisationId,
        role,
        invitedBy,
      });

      const membership: OrganisationMemberships = {
        _id: crypto.randomUUID(),
        userEmail: userEmail.toLowerCase(),
        userId,
        organisationId,
        membershipType: 'staff',
        role,
        status: 'PENDING',
        joinedDate: new Date(),
        invitedBy,
        isActive: true,
      };

      await BaseCrudService.create(CollectionIds.ORGANISATION_MEMBERSHIPS, membership);

      console.log('[OrganisationMembershipService] User invited successfully:', membership._id);
      return membership;
    } catch (error) {
      console.error('[OrganisationMembershipService] Error inviting user:', error);
      throw error;
    }
  }

  /**
   * Update membership status (e.g., activate pending invitation)
   */
  static async updateMembershipStatus(
    membershipId: string,
    status: string,
    isActive: boolean = true
  ): Promise<void> {
    try {
      console.log('[OrganisationMembershipService] Updating membership status:', {
        membershipId,
        status,
        isActive,
      });

      await BaseCrudService.update(CollectionIds.ORGANISATION_MEMBERSHIPS, {
        _id: membershipId,
        status,
        isActive,
      });

      console.log('[OrganisationMembershipService] Membership status updated');
    } catch (error) {
      console.error('[OrganisationMembershipService] Error updating membership:', error);
      throw error;
    }
  }

  /**
   * Deactivate a membership (remove user from organisation)
   */
  static async deactivateMembership(membershipId: string): Promise<void> {
    try {
      console.log('[OrganisationMembershipService] Deactivating membership:', membershipId);

      await BaseCrudService.update(CollectionIds.ORGANISATION_MEMBERSHIPS, {
        _id: membershipId,
        isActive: false,
        status: 'INACTIVE',
      });

      console.log('[OrganisationMembershipService] Membership deactivated');
    } catch (error) {
      console.error('[OrganisationMembershipService] Error deactivating membership:', error);
      throw error;
    }
  }

  /**
   * Get all memberships for a user
   */
  static async getUserMemberships(userEmail: string): Promise<OrganisationMemberships[]> {
    try {
      console.log('[OrganisationMembershipService] Fetching memberships for user:', userEmail);

      const { items: memberships } = await BaseCrudService.getAll<OrganisationMemberships>(
        CollectionIds.ORGANISATION_MEMBERSHIPS
      );

      if (!memberships) {
        return [];
      }

      const userMemberships = memberships.filter(
        m => m.userEmail && m.userEmail.toLowerCase() === userEmail.toLowerCase() && m.isActive !== false
      );

      console.log('[OrganisationMembershipService] Found memberships:', userMemberships.length);
      return userMemberships;
    } catch (error) {
      console.error('[OrganisationMembershipService] Error fetching user memberships:', error);
      return [];
    }
  }

  /**
   * Get all members of an organisation
   */
  static async getOrganisationMembers(organisationId: string): Promise<OrganisationMemberships[]> {
    try {
      console.log('[OrganisationMembershipService] Fetching members for organisation:', organisationId);

      const { items: memberships } = await BaseCrudService.getAll<OrganisationMemberships>(
        CollectionIds.ORGANISATION_MEMBERSHIPS
      );

      if (!memberships) {
        return [];
      }

      const orgMembers = memberships.filter(
        m => m.organisationId === organisationId && m.isActive !== false
      );

      console.log('[OrganisationMembershipService] Found members:', orgMembers.length);
      return orgMembers;
    } catch (error) {
      console.error('[OrganisationMembershipService] Error fetching organisation members:', error);
      return [];
    }
  }

  /**
   * Check if user can create an organisation
   * Only new users (no active memberships) can create organisations
   */
  static async canUserCreateOrganisation(userEmail: string): Promise<boolean> {
    try {
      const context = await this.checkUserMembership(userEmail);
      return context.canCreateOrganisation;
    } catch (error) {
      console.error('[OrganisationMembershipService] Error checking creation permission:', error);
      return false;
    }
  }

  /**
   * Validate membership and ensure it's active
   */
  static async validateMembership(membershipId: string): Promise<boolean> {
    try {
      const membership = await BaseCrudService.getById<OrganisationMemberships>(
        CollectionIds.ORGANISATION_MEMBERSHIPS,
        membershipId
      );

      return membership ? membership.isActive !== false : false;
    } catch (error) {
      console.error('[OrganisationMembershipService] Error validating membership:', error);
      return false;
    }
  }
}
