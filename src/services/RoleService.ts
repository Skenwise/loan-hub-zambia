/**
 * Role Service
 * Manages roles and permissions for role-based access control (RBAC)
 */

import { BaseCrudService } from '@/integrations';
import { Roles } from '@/entities';
import { CollectionIds, RoleDefinitions, Permissions } from './index';

export class RoleService {
  /**
   * Get role by ID
   */
  static async getRole(roleId: string): Promise<Roles | null> {
    try {
      const role = await BaseCrudService.getById<Roles>(
        CollectionIds.ROLES,
        roleId
      );
      return role || null;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  }

  /**
   * Get role by name
   */
  static async getRoleByName(roleName: string): Promise<Roles | null> {
    try {
      const { items } = await BaseCrudService.getAll<Roles>(CollectionIds.ROLES);
      const role = items?.find(r => r.roleName === roleName);
      return role || null;
    } catch (error) {
      console.error('Error fetching role by name:', error);
      return null;
    }
  }

  /**
   * Get all roles
   */
  static async getAllRoles(): Promise<Roles[]> {
    try {
      const { items } = await BaseCrudService.getAll<Roles>(CollectionIds.ROLES);
      return items || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  /**
   * Create new role
   */
  static async createRole(data: Omit<Roles, '_id' | '_createdDate' | '_updatedDate'>): Promise<Roles> {
    try {
      const newRole: Roles = {
        ...data,
        _id: crypto.randomUUID(),
      };
      await BaseCrudService.create(CollectionIds.ROLES, newRole);
      return newRole;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  static async updateRole(roleId: string, data: Partial<Roles>): Promise<void> {
    try {
      await BaseCrudService.update(CollectionIds.ROLES, {
        _id: roleId,
        ...data,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Initialize default system roles
   */
  static async initializeDefaultRoles(): Promise<void> {
    try {
      const existingRoles = await this.getAllRoles();
      
      // Check if roles already exist
      if (existingRoles.length > 0) {
        console.log('Roles already initialized');
        return;
      }

      // Create default roles
      for (const [key, roleDef] of Object.entries(RoleDefinitions)) {
        await this.createRole({
          roleName: roleDef.name,
          description: roleDef.description,
          permissions: roleDef.permissions.join(','),
          isSystemRole: true,
          hierarchyLevel: roleDef.hierarchyLevel,
        });
      }

      console.log('Default roles initialized successfully');
    } catch (error) {
      console.error('Error initializing default roles:', error);
      throw error;
    }
  }

  /**
   * Get permissions for a role
   */
  static async getRolePermissions(roleId: string): Promise<string[]> {
    try {
      const role = await this.getRole(roleId);
      if (!role || !role.permissions) return [];
      
      return role.permissions.split(',').map(p => p.trim());
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  }

  /**
   * Check if role has permission
   */
  static async roleHasPermission(roleId: string, permission: string): Promise<boolean> {
    try {
      const permissions = await this.getRolePermissions(roleId);
      return permissions.includes(permission);
    } catch (error) {
      console.error('Error checking role permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions available in the system
   */
  static getAllPermissions(): string[] {
    return Object.values(Permissions);
  }

  /**
   * Get role definition by name
   */
  static getRoleDefinition(roleName: string) {
    return Object.values(RoleDefinitions).find(def => def.name === roleName);
  }
}
