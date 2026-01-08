/**
 * Organisation Filtering Service
 * Provides organization-scoped data access patterns for Phase 1: Core Data Isolation
 * 
 * This service wraps BaseCrudService to enforce organization filtering across all queries
 */

import { BaseCrudService } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';

interface WixDataItem {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
}

interface FilterOptions {
  organisationId?: string;
  includeReferences?: string[];
  logQuery?: boolean;
}

export class OrganisationFilteringService {
  /**
   * Get all items from a collection filtered by organisation
   * If no organisationId provided, uses current organisation from store
   */
  static async getAllByOrganisation<T extends WixDataItem & { organisationId?: string }>(
    collectionId: string,
    options: FilterOptions = {}
  ): Promise<T[]> {
    const { organisationId, includeReferences = [], logQuery = true } = options;
    
    // Get organisation context
    const store = useOrganisationStore.getState();
    const activeOrgId = organisationId || store.getActiveOrganisationFilter();

    if (logQuery && activeOrgId) {
      console.log(`[DataIsolation] Querying ${collectionId} for organisation: ${activeOrgId}`);
    }

    try {
      const { items } = await BaseCrudService.getAll<T>(collectionId, includeReferences);
      
      // Filter by organisation if context exists
      if (activeOrgId) {
        return items.filter(item => item.organisationId === activeOrgId);
      }
      
      return items;
    } catch (error) {
      console.error(`Error fetching ${collectionId} for organisation:`, error);
      return [];
    }
  }

  /**
   * Get a single item by ID, verifying it belongs to the organisation
   */
  static async getByOrganisationAndId<T extends WixDataItem & { organisationId?: string }>(
    collectionId: string,
    itemId: string,
    options: FilterOptions = {}
  ): Promise<T | null> {
    const { organisationId, includeReferences = [], logQuery = true } = options;
    
    const store = useOrganisationStore.getState();
    const activeOrgId = organisationId || store.getActiveOrganisationFilter();

    if (logQuery && activeOrgId) {
      console.log(`[DataIsolation] Fetching ${collectionId}/${itemId} for organisation: ${activeOrgId}`);
    }

    try {
      const item = await BaseCrudService.getById<T>(collectionId, itemId, includeReferences);
      
      // Verify item belongs to organisation
      if (item && activeOrgId && item.organisationId !== activeOrgId) {
        console.warn(
          `[DataIsolation] Access denied: Item ${itemId} does not belong to organisation ${activeOrgId}`
        );
        return null;
      }
      
      return item || null;
    } catch (error) {
      console.error(`Error fetching ${collectionId}/${itemId}:`, error);
      return null;
    }
  }

  /**
   * Create an item with automatic organisation assignment
   */
  static async createWithOrganisation<T extends WixDataItem & { organisationId?: string }>(
    collectionId: string,
    data: Omit<T, '_id' | '_createdDate' | '_updatedDate'>,
    options: FilterOptions = {}
  ): Promise<T | null> {
    const { organisationId } = options;
    
    const store = useOrganisationStore.getState();
    const activeOrgId = organisationId || store.organisationId;

    if (!activeOrgId) {
      console.error('[DataIsolation] Cannot create item without organisation context');
      return null;
    }

    console.log(`[DataIsolation] Creating ${collectionId} for organisation: ${activeOrgId}`);

    try {
      const itemWithOrg = {
        ...data,
        organisationId: activeOrgId,
        _id: crypto.randomUUID(),
      } as unknown as T;

      const result = await BaseCrudService.create(collectionId, itemWithOrg);
      return result as unknown as T;
    } catch (error) {
      console.error(`Error creating ${collectionId}:`, error);
      return null;
    }
  }

  /**
   * Update an item, verifying it belongs to the organisation
   */
  static async updateWithOrganisation<T extends WixDataItem & { organisationId?: string }>(
    collectionId: string,
    data: Partial<T> & { _id: string },
    options: FilterOptions = {}
  ): Promise<T | null> {
    const { organisationId, logQuery = true } = options;
    
    const store = useOrganisationStore.getState();
    const activeOrgId = organisationId || store.getActiveOrganisationFilter();

    if (logQuery && activeOrgId) {
      console.log(`[DataIsolation] Updating ${collectionId}/${data._id} for organisation: ${activeOrgId}`);
    }

    try {
      // Verify item belongs to organisation before updating
      const existingItem = await BaseCrudService.getById<T & WixDataItem>(collectionId, data._id);
      
      if (existingItem && activeOrgId && existingItem.organisationId !== activeOrgId) {
        console.warn(
          `[DataIsolation] Update denied: Item ${data._id} does not belong to organisation ${activeOrgId}`
        );
        return null;
      }

      const result = await BaseCrudService.update(collectionId, data);
      return result as unknown as T;
    } catch (error) {
      console.error(`Error updating ${collectionId}/${data._id}:`, error);
      return null;
    }
  }

  /**
   * Delete an item, verifying it belongs to the organisation
   */
  static async deleteByOrganisation(
    collectionId: string,
    itemId: string,
    options: FilterOptions = {}
  ): Promise<boolean> {
    const { organisationId, logQuery = true } = options;
    
    const store = useOrganisationStore.getState();
    const activeOrgId = organisationId || store.getActiveOrganisationFilter();

    if (logQuery && activeOrgId) {
      console.log(`[DataIsolation] Deleting ${collectionId}/${itemId} for organisation: ${activeOrgId}`);
    }

    try {
      // Verify item belongs to organisation before deleting
      const existingItem = await BaseCrudService.getById<WixDataItem & { organisationId?: string }>(
        collectionId,
        itemId
      );
      
      if (existingItem && activeOrgId && existingItem.organisationId !== activeOrgId) {
        console.warn(
          `[DataIsolation] Delete denied: Item ${itemId} does not belong to organisation ${activeOrgId}`
        );
        return false;
      }

      await BaseCrudService.delete(collectionId, itemId);
      return true;
    } catch (error) {
      console.error(`Error deleting ${collectionId}/${itemId}:`, error);
      return false;
    }
  }

  /**
   * Get current organisation context
   */
  static getCurrentOrganisationId(): string | null {
    const store = useOrganisationStore.getState();
    return store.organisationId;
  }

  /**
   * Check if user is in Super Admin view-all mode
   */
  static isSuperAdminViewAll(): boolean {
    const store = useOrganisationStore.getState();
    return store.isSuperAdminViewAll;
  }

  /**
   * Get active organisation filter (null if viewing all)
   */
  static getActiveOrganisationFilter(): string | null {
    const store = useOrganisationStore.getState();
    return store.getActiveOrganisationFilter();
  }

  /**
   * Validate that an item belongs to the current organisation
   */
  static validateOrganisationAccess<T extends { organisationId?: string }>(
    item: T,
    organisationId?: string
  ): boolean {
    const store = useOrganisationStore.getState();
    const activeOrgId = organisationId || store.getActiveOrganisationFilter();

    // If viewing all, allow access
    if (!activeOrgId) {
      return true;
    }

    // Otherwise verify organisation match
    return item.organisationId === activeOrgId;
  }
}
