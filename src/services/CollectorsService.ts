import { BaseCrudService } from './BaseCrudService';

export interface Collector {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  collectorName?: string;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  uniqueId?: string;
  /** @wixFieldType text */
  branchIds?: string;
  /** @wixFieldType text */
  status?: 'Active' | 'Inactive';
  /** @wixFieldType text */
  createdBy?: string;
  /** @wixFieldType text */
  lastModifiedBy?: string;
  /** @wixFieldType datetime */
  dateCreated?: Date | string;
  /** @wixFieldType datetime */
  dateModified?: Date | string;
  /** @wixFieldType boolean */
  hasLinkedRepayments?: boolean;
}

export class CollectorsService {
  /**
   * Get all collectors for an organization
   */
  static async getCollectorsByOrganisation(organisationId: string): Promise<Collector[]> {
    try {
      const { items } = await BaseCrudService.getAll<Collector>('collectors');
      return items?.filter((c) => c.organisationId === organisationId) || [];
    } catch (error) {
      console.error('Error fetching collectors:', error);
      return [];
    }
  }

  /**
   * Get active collectors for an organization
   */
  static async getActiveCollectorsByOrganisation(organisationId: string): Promise<Collector[]> {
    try {
      const collectors = await this.getCollectorsByOrganisation(organisationId);
      return collectors.filter((c) => c.status === 'Active');
    } catch (error) {
      console.error('Error fetching active collectors:', error);
      return [];
    }
  }

  /**
   * Get collector by ID
   */
  static async getCollectorById(collectorId: string): Promise<Collector | null> {
    try {
      return await BaseCrudService.getById<Collector>('collectors', collectorId);
    } catch (error) {
      console.error('Error fetching collector:', error);
      return null;
    }
  }

  /**
   * Generate unique ID for collector
   */
  static generateUniqueId(): string {
    return `COL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Add a new collector
   */
  static async addCollector(
    organisationId: string,
    collectorName: string,
    fullName: string,
    branchIds: string[],
    createdBy: string,
    uniqueId?: string
  ): Promise<Collector> {
    try {
      const finalUniqueId = uniqueId || this.generateUniqueId();

      const newCollector: Collector = {
        _id: crypto.randomUUID(),
        organisationId,
        collectorName,
        fullName,
        uniqueId: finalUniqueId,
        branchIds: branchIds.join(','),
        status: 'Active',
        createdBy,
        lastModifiedBy: createdBy,
        dateCreated: new Date(),
        dateModified: new Date(),
        hasLinkedRepayments: false,
      };

      await BaseCrudService.create('collectors', newCollector);
      return newCollector;
    } catch (error) {
      console.error('Error adding collector:', error);
      throw error;
    }
  }

  /**
   * Update collector
   */
  static async updateCollector(
    collectorId: string,
    updates: Partial<Collector>,
    modifiedBy: string
  ): Promise<void> {
    try {
      const collector = await this.getCollectorById(collectorId);
      if (!collector) throw new Error('Collector not found');

      await BaseCrudService.update<Collector>('collectors', {
        _id: collectorId,
        ...updates,
        lastModifiedBy: modifiedBy,
        dateModified: new Date(),
      });
    } catch (error) {
      console.error('Error updating collector:', error);
      throw error;
    }
  }

  /**
   * Update collector status
   */
  static async updateCollectorStatus(
    collectorId: string,
    status: 'Active' | 'Inactive',
    modifiedBy: string
  ): Promise<void> {
    try {
      await this.updateCollector(collectorId, { status }, modifiedBy);
    } catch (error) {
      console.error('Error updating collector status:', error);
      throw error;
    }
  }

  /**
   * Check if collector has linked repayments
   */
  static async checkLinkedRepayments(collectorId: string): Promise<boolean> {
    try {
      const { items: repayments } = await BaseCrudService.getAll<any>('repayments');
      const hasLinked = repayments?.some((r) => r.collectorId === collectorId) || false;
      
      if (hasLinked) {
        await BaseCrudService.update<Collector>('collectors', {
          _id: collectorId,
          hasLinkedRepayments: true,
        });
      }

      return hasLinked;
    } catch (error) {
      console.error('Error checking linked repayments:', error);
      return false;
    }
  }

  /**
   * Soft delete collector (disable instead of delete if has repayments)
   */
  static async deleteOrDisableCollector(
    collectorId: string,
    modifiedBy: string
  ): Promise<{ deleted: boolean; message: string }> {
    try {
      const hasLinked = await this.checkLinkedRepayments(collectorId);

      if (hasLinked) {
        // Soft delete - disable instead
        await this.updateCollectorStatus(collectorId, 'Inactive', modifiedBy);
        return {
          deleted: false,
          message: 'Collector has linked repayments. Status changed to Inactive instead of deletion.',
        };
      } else {
        // Hard delete
        await BaseCrudService.delete('collectors', collectorId);
        return {
          deleted: true,
          message: 'Collector deleted successfully.',
        };
      }
    } catch (error) {
      console.error('Error deleting/disabling collector:', error);
      throw error;
    }
  }

  /**
   * Get collectors by branch
   */
  static async getCollectorsByBranch(
    organisationId: string,
    branchId: string
  ): Promise<Collector[]> {
    try {
      const collectors = await this.getCollectorsByOrganisation(organisationId);
      return collectors.filter((c) => c.branchIds?.includes(branchId));
    } catch (error) {
      console.error('Error fetching collectors by branch:', error);
      return [];
    }
  }

  /**
   * Search collectors
   */
  static async searchCollectors(
    organisationId: string,
    searchTerm: string
  ): Promise<Collector[]> {
    try {
      const collectors = await this.getCollectorsByOrganisation(organisationId);
      const term = searchTerm.toLowerCase();

      return collectors.filter(
        (c) =>
          c.collectorName?.toLowerCase().includes(term) ||
          c.fullName?.toLowerCase().includes(term) ||
          c.uniqueId?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching collectors:', error);
      return [];
    }
  }
}
