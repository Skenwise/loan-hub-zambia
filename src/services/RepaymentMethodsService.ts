import { BaseCrudService } from './BaseCrudService';

export interface RepaymentMethod {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  methodName?: string;
  /** @wixFieldType text */
  status?: 'Active' | 'Inactive';
  /** @wixFieldType boolean */
  isSystemMethod?: boolean;
  /** @wixFieldType text */
  changedBy?: string;
  /** @wixFieldType datetime */
  lastChangedDate?: Date | string;
}

const DEFAULT_SYSTEM_METHODS = [
  { methodName: 'ATM', isSystemMethod: true },
  { methodName: 'Cash', isSystemMethod: true },
  { methodName: 'Cheque', isSystemMethod: true },
  { methodName: 'Online Transfer', isSystemMethod: true },
  { methodName: 'PayPal', isSystemMethod: true },
];

export class RepaymentMethodsService {
  /**
   * Initialize default repayment methods for an organization
   */
  static async initializeDefaultMethods(organisationId: string): Promise<void> {
    try {
      const { items: existing } = await BaseCrudService.getAll<RepaymentMethod>('repaymentmethods');
      const orgMethods = existing?.filter((m) => m.organisationId === organisationId) || [];

      if (orgMethods.length === 0) {
        for (const method of DEFAULT_SYSTEM_METHODS) {
          await BaseCrudService.create('repaymentmethods', {
            _id: crypto.randomUUID(),
            organisationId,
            methodName: method.methodName,
            status: 'Active',
            isSystemMethod: method.isSystemMethod,
            changedBy: 'System',
            lastChangedDate: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Error initializing default repayment methods:', error);
    }
  }

  /**
   * Get all repayment methods for an organization
   */
  static async getMethodsByOrganisation(organisationId: string): Promise<RepaymentMethod[]> {
    try {
      const { items } = await BaseCrudService.getAll<RepaymentMethod>('repaymentmethods');
      return items?.filter((m) => m.organisationId === organisationId) || [];
    } catch (error) {
      console.error('Error fetching repayment methods:', error);
      return [];
    }
  }

  /**
   * Get active repayment methods for an organization
   */
  static async getActiveMethodsByOrganisation(organisationId: string): Promise<RepaymentMethod[]> {
    try {
      const methods = await this.getMethodsByOrganisation(organisationId);
      return methods.filter((m) => m.status === 'Active');
    } catch (error) {
      console.error('Error fetching active repayment methods:', error);
      return [];
    }
  }

  /**
   * Add a new repayment method
   */
  static async addMethod(
    organisationId: string,
    methodName: string,
    changedBy: string
  ): Promise<RepaymentMethod> {
    try {
      const newMethod: RepaymentMethod = {
        _id: crypto.randomUUID(),
        organisationId,
        methodName,
        status: 'Active',
        isSystemMethod: false,
        changedBy,
        lastChangedDate: new Date(),
      };

      await BaseCrudService.create('repaymentmethods', newMethod);
      return newMethod;
    } catch (error) {
      console.error('Error adding repayment method:', error);
      throw error;
    }
  }

  /**
   * Update repayment method status
   */
  static async updateMethodStatus(
    methodId: string,
    status: 'Active' | 'Inactive',
    changedBy: string
  ): Promise<void> {
    try {
      const method = await BaseCrudService.getById<RepaymentMethod>('repaymentmethods', methodId);
      if (!method) throw new Error('Method not found');

      await BaseCrudService.update<RepaymentMethod>('repaymentmethods', {
        _id: methodId,
        status,
        changedBy,
        lastChangedDate: new Date(),
      });
    } catch (error) {
      console.error('Error updating repayment method status:', error);
      throw error;
    }
  }

  /**
   * Rename a repayment method
   */
  static async renameMethod(
    methodId: string,
    newName: string,
    changedBy: string
  ): Promise<void> {
    try {
      const method = await BaseCrudService.getById<RepaymentMethod>('repaymentmethods', methodId);
      if (!method) throw new Error('Method not found');

      await BaseCrudService.update<RepaymentMethod>('repaymentmethods', {
        _id: methodId,
        methodName: newName,
        changedBy,
        lastChangedDate: new Date(),
      });
    } catch (error) {
      console.error('Error renaming repayment method:', error);
      throw error;
    }
  }

  /**
   * Check if at least one method is active
   */
  static async hasActiveMethod(organisationId: string): Promise<boolean> {
    try {
      const activeMethods = await this.getActiveMethodsByOrganisation(organisationId);
      return activeMethods.length > 0;
    } catch (error) {
      console.error('Error checking active methods:', error);
      return false;
    }
  }

  /**
   * Get count of active methods
   */
  static async getActiveMethodCount(organisationId: string): Promise<number> {
    try {
      const activeMethods = await this.getActiveMethodsByOrganisation(organisationId);
      return activeMethods.length;
    } catch (error) {
      console.error('Error getting active method count:', error);
      return 0;
    }
  }
}
