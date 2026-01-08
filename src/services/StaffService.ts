/**
 * Staff Service
 * Manages staff members and their role assignments
 * Phase 1: Core Data Isolation - Organization-scoped staff access
 */

import { BaseCrudService } from '@/integrations';
import { StaffMembers, StaffRoleAssignments } from '@/entities';
import { CollectionIds } from './index';
import { OrganisationFilteringService } from './OrganisationFilteringService';

export class StaffService {
  /**
   * Get staff member by ID
   */
  static async getStaffMember(staffId: string): Promise<StaffMembers | null> {
    try {
      const staff = await BaseCrudService.getById<StaffMembers>(
        CollectionIds.STAFF_MEMBERS,
        staffId
      );
      return staff || null;
    } catch (error) {
      console.error('Error fetching staff member:', error);
      return null;
    }
  }

  /**
   * Get all staff members for an organisation (Phase 1: Organization-scoped)
   */
  static async getOrganisationStaff(organisationId?: string): Promise<StaffMembers[]> {
    try {
      return await OrganisationFilteringService.getAllByOrganisation<StaffMembers>(
        CollectionIds.STAFF_MEMBERS,
        { organisationId, logQuery: true }
      );
    } catch (error) {
      console.error('Error fetching organisation staff:', error);
      return [];
    }
  }

  /**
   * Create new staff member
   */
  static async createStaffMember(data: Omit<StaffMembers, '_id' | '_createdDate' | '_updatedDate'>): Promise<StaffMembers> {
    try {
      const newStaff: StaffMembers = {
        ...data,
        _id: crypto.randomUUID(),
      };
      await BaseCrudService.create(CollectionIds.STAFF_MEMBERS, newStaff);
      return newStaff;
    } catch (error) {
      console.error('Error creating staff member:', error);
      throw error;
    }
  }

  /**
   * Update staff member
   */
  static async updateStaffMember(staffId: string, data: Partial<StaffMembers>): Promise<void> {
    try {
      await BaseCrudService.update(CollectionIds.STAFF_MEMBERS, {
        _id: staffId,
        ...data,
      });
    } catch (error) {
      console.error('Error updating staff member:', error);
      throw error;
    }
  }

  /**
   * Assign role to staff member
   */
  static async assignRole(
    staffMemberId: string,
    roleId: string,
    organisationId: string,
    assignedBy: string
  ): Promise<StaffRoleAssignments> {
    try {
      const assignment: StaffRoleAssignments = {
        _id: crypto.randomUUID(),
        staffMemberId,
        roleId,
        organizationId: organisationId,
        assignmentDate: new Date(),
        status: 'ACTIVE',
        assignedBy,
      };
      
      await BaseCrudService.create(CollectionIds.STAFF_ROLE_ASSIGNMENTS, assignment);
      return assignment;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Get staff member's role assignment
   */
  static async getStaffRole(staffId: string, organisationId: string): Promise<StaffRoleAssignments | null> {
    try {
      const { items } = await BaseCrudService.getAll<StaffRoleAssignments>(
        CollectionIds.STAFF_ROLE_ASSIGNMENTS
      );
      
      const assignment = items?.find(
        a => a.staffMemberId === staffId && 
             a.organizationId === organisationId && 
             a.status === 'ACTIVE'
      );
      
      return assignment || null;
    } catch (error) {
      console.error('Error fetching staff role:', error);
      return null;
    }
  }

  /**
   * Update staff member status
   */
  static async updateStaffStatus(staffId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    try {
      await this.updateStaffMember(staffId, {
        role: status.toUpperCase(),
      });
    } catch (error) {
      console.error('Error updating staff status:', error);
      throw error;
    }
  }

  /**
   * Update staff last login date
   */
  static async updateLastLogin(staffId: string): Promise<void> {
    try {
      await this.updateStaffMember(staffId, {
        dateHired: new Date(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Get staff member by email
   */
  static async getStaffByEmail(email: string): Promise<StaffMembers | null> {
    try {
      const { items } = await BaseCrudService.getAll<StaffMembers>(
        CollectionIds.STAFF_MEMBERS
      );
      
      const staff = items?.find(s => s.email === email);
      return staff || null;
    } catch (error) {
      console.error('Error fetching staff by email:', error);
      return null;
    }
  }
}
