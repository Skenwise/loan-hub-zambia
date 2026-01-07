import { BaseCrudService } from './BaseCrudService';

export interface CollateralType {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  name?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  category?: 'Movable' | 'Immovable' | 'Financial';
  /** @wixFieldType boolean */
  valuationRequired?: boolean;
  /** @wixFieldType boolean */
  insuranceRequired?: boolean;
  /** @wixFieldType text */
  revaluationFrequency?: 'Monthly' | 'Quarterly' | 'Annually' | 'None';
  /** @wixFieldType number */
  maxLTV?: number;
  /** @wixFieldType text */
  documentationRequired?: string; // comma-separated: Ownership proof, Valuation report, Insurance policy, Photos, Other attachments
  /** @wixFieldType text */
  status?: 'Active' | 'Inactive';
  /** @wixFieldType text */
  createdBy?: string;
  /** @wixFieldType datetime */
  createdDate?: Date | string;
  /** @wixFieldType text */
  lastModifiedBy?: string;
  /** @wixFieldType datetime */
  lastModifiedDate?: Date | string;
  /** @wixFieldType boolean */
  isSystemDefault?: boolean;
}

const DEFAULT_COLLATERAL_TYPES = [
  {
    name: 'Automobiles',
    description: 'Motor vehicles including cars, trucks, and motorcycles',
    category: 'Movable' as const,
    valuationRequired: true,
    insuranceRequired: true,
    revaluationFrequency: 'Annually' as const,
    maxLTV: 80,
    documentationRequired: 'Ownership proof,Valuation report,Insurance policy,Photos',
    isSystemDefault: true,
  },
  {
    name: 'Electronic Items',
    description: 'Electronics including computers, machinery, and appliances',
    category: 'Movable' as const,
    valuationRequired: true,
    insuranceRequired: false,
    revaluationFrequency: 'Annually' as const,
    maxLTV: 60,
    documentationRequired: 'Ownership proof,Valuation report,Photos',
    isSystemDefault: true,
  },
  {
    name: 'Insurance Policies',
    description: 'Life insurance and other insurance policies',
    category: 'Financial' as const,
    valuationRequired: true,
    insuranceRequired: false,
    revaluationFrequency: 'None' as const,
    maxLTV: 90,
    documentationRequired: 'Ownership proof,Insurance policy',
    isSystemDefault: true,
  },
  {
    name: 'Investments',
    description: 'Stocks, bonds, mutual funds, and other investment securities',
    category: 'Financial' as const,
    valuationRequired: true,
    insuranceRequired: false,
    revaluationFrequency: 'Monthly' as const,
    maxLTV: 70,
    documentationRequired: 'Ownership proof,Valuation report',
    isSystemDefault: true,
  },
  {
    name: 'Machinery and Equipment',
    description: 'Industrial machinery, equipment, and tools',
    category: 'Movable' as const,
    valuationRequired: true,
    insuranceRequired: true,
    revaluationFrequency: 'Annually' as const,
    maxLTV: 75,
    documentationRequired: 'Ownership proof,Valuation report,Insurance policy,Photos',
    isSystemDefault: true,
  },
  {
    name: 'Real Estate',
    description: 'Land, buildings, and property',
    category: 'Immovable' as const,
    valuationRequired: true,
    insuranceRequired: true,
    revaluationFrequency: 'Annually' as const,
    maxLTV: 85,
    documentationRequired: 'Ownership proof,Valuation report,Insurance policy,Photos',
    isSystemDefault: true,
  },
  {
    name: 'Valuables and Collectibles',
    description: 'Jewelry, art, antiques, and other valuable items',
    category: 'Movable' as const,
    valuationRequired: true,
    insuranceRequired: true,
    revaluationFrequency: 'Annually' as const,
    maxLTV: 70,
    documentationRequired: 'Ownership proof,Valuation report,Insurance policy,Photos',
    isSystemDefault: true,
  },
];

export class CollateralService {
  /**
   * Initialize default collateral types for an organization
   */
  static async initializeDefaultTypes(organisationId: string): Promise<void> {
    try {
      const { items: existing } = await BaseCrudService.getAll<CollateralType>('collateraltypes');
      const orgTypes = existing?.filter((c) => c.organisationId === organisationId) || [];

      if (orgTypes.length === 0) {
        for (const type of DEFAULT_COLLATERAL_TYPES) {
          await BaseCrudService.create('collateraltypes', {
            _id: crypto.randomUUID(),
            organisationId,
            ...type,
            status: 'Active',
            createdBy: 'System',
            createdDate: new Date(),
            lastModifiedBy: 'System',
            lastModifiedDate: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Error initializing default collateral types:', error);
    }
  }

  /**
   * Get all collateral types for an organization
   */
  static async getTypesByOrganisation(organisationId: string): Promise<CollateralType[]> {
    try {
      const { items } = await BaseCrudService.getAll<CollateralType>('collateraltypes');
      return items?.filter((c) => c.organisationId === organisationId) || [];
    } catch (error) {
      console.error('Error fetching collateral types:', error);
      return [];
    }
  }

  /**
   * Get active collateral types for an organization
   */
  static async getActiveTypesByOrganisation(organisationId: string): Promise<CollateralType[]> {
    try {
      const types = await this.getTypesByOrganisation(organisationId);
      return types.filter((c) => c.status === 'Active');
    } catch (error) {
      console.error('Error fetching active collateral types:', error);
      return [];
    }
  }

  /**
   * Get collateral type by ID
   */
  static async getTypeById(typeId: string): Promise<CollateralType | null> {
    try {
      return await BaseCrudService.getById<CollateralType>('collateraltypes', typeId);
    } catch (error) {
      console.error('Error fetching collateral type:', error);
      return null;
    }
  }

  /**
   * Add a new collateral type
   */
  static async addType(
    organisationId: string,
    data: Omit<CollateralType, '_id' | '_createdDate' | '_updatedDate' | 'organisationId' | 'createdDate' | 'lastModifiedDate'>,
    createdBy: string
  ): Promise<CollateralType> {
    try {
      const newType: CollateralType = {
        _id: crypto.randomUUID(),
        organisationId,
        ...data,
        status: data.status || 'Active',
        createdBy,
        createdDate: new Date(),
        lastModifiedBy: createdBy,
        lastModifiedDate: new Date(),
        isSystemDefault: false,
      };

      await BaseCrudService.create('collateraltypes', newType);
      return newType;
    } catch (error) {
      console.error('Error adding collateral type:', error);
      throw error;
    }
  }

  /**
   * Update collateral type
   */
  static async updateType(
    typeId: string,
    updates: Partial<Omit<CollateralType, '_id' | '_createdDate' | '_updatedDate' | 'organisationId' | 'createdDate' | 'createdBy'>>,
    modifiedBy: string
  ): Promise<void> {
    try {
      const type = await this.getTypeById(typeId);
      if (!type) throw new Error('Collateral type not found');

      // Prevent modification of system defaults
      if (type.isSystemDefault) {
        throw new Error('System default collateral types cannot be modified');
      }

      await BaseCrudService.update<CollateralType>('collateraltypes', {
        _id: typeId,
        ...updates,
        lastModifiedBy: modifiedBy,
        lastModifiedDate: new Date(),
      });
    } catch (error) {
      console.error('Error updating collateral type:', error);
      throw error;
    }
  }

  /**
   * Update collateral type status
   */
  static async updateTypeStatus(
    typeId: string,
    status: 'Active' | 'Inactive',
    modifiedBy: string
  ): Promise<void> {
    try {
      const type = await this.getTypeById(typeId);
      if (!type) throw new Error('Collateral type not found');

      await BaseCrudService.update<CollateralType>('collateraltypes', {
        _id: typeId,
        status,
        lastModifiedBy: modifiedBy,
        lastModifiedDate: new Date(),
      });
    } catch (error) {
      console.error('Error updating collateral type status:', error);
      throw error;
    }
  }

  /**
   * Delete collateral type (only if not system default)
   */
  static async deleteType(typeId: string): Promise<void> {
    try {
      const type = await this.getTypeById(typeId);
      if (!type) throw new Error('Collateral type not found');

      if (type.isSystemDefault) {
        throw new Error('System default collateral types cannot be deleted');
      }

      await BaseCrudService.delete('collateraltypes', typeId);
    } catch (error) {
      console.error('Error deleting collateral type:', error);
      throw error;
    }
  }

  /**
   * Get collateral types by category
   */
  static async getTypesByCategory(
    organisationId: string,
    category: 'Movable' | 'Immovable' | 'Financial'
  ): Promise<CollateralType[]> {
    try {
      const types = await this.getTypesByOrganisation(organisationId);
      return types.filter((c) => c.category === category);
    } catch (error) {
      console.error('Error fetching collateral types by category:', error);
      return [];
    }
  }

  /**
   * Search collateral types
   */
  static async searchTypes(organisationId: string, searchTerm: string): Promise<CollateralType[]> {
    try {
      const types = await this.getTypesByOrganisation(organisationId);
      const term = searchTerm.toLowerCase();

      return types.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching collateral types:', error);
      return [];
    }
  }

  /**
   * Get documentation requirements as array
   */
  static parseDocumentationRequired(docString?: string): string[] {
    if (!docString) return [];
    return docString.split(',').map((d) => d.trim()).filter((d) => d.length > 0);
  }

  /**
   * Format documentation requirements as string
   */
  static formatDocumentationRequired(docs: string[]): string {
    return docs.join(',');
  }

  /**
   * Get collateral type statistics
   */
  static async getTypeStatistics(organisationId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const types = await this.getTypesByOrganisation(organisationId);

      const stats = {
        total: types.length,
        active: types.filter((c) => c.status === 'Active').length,
        inactive: types.filter((c) => c.status === 'Inactive').length,
        byCategory: {
          Movable: types.filter((c) => c.category === 'Movable').length,
          Immovable: types.filter((c) => c.category === 'Immovable').length,
          Financial: types.filter((c) => c.category === 'Financial').length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error getting collateral type statistics:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byCategory: { Movable: 0, Immovable: 0, Financial: 0 },
      };
    }
  }

  /**
   * Get loan collateral items
   */
  static async getLoanCollateral(loanId: string): Promise<any[]> {
    try {
      // This would query a collateral register collection
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching loan collateral:', error);
      return [];
    }
  }

  /**
   * Get organisation collateral register
   */
  static async getOrganisationCollateralRegister(organisationId: string): Promise<any[]> {
    try {
      // This would query a collateral register collection
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching organisation collateral register:', error);
      return [];
    }
  }

  /**
   * Create collateral item
   */
  static async createCollateral(data: any): Promise<any> {
    try {
      // This would create a collateral item in a collateral register collection
      // For now, return the data as placeholder
      return {
        _id: crypto.randomUUID(),
        ...data,
      };
    } catch (error) {
      console.error('Error creating collateral:', error);
      throw error;
    }
  }
}
