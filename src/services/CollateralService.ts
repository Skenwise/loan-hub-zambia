/**
 * Collateral Service
 * Manages collateral registration and tracking for loans
 */

import { BaseCrudService } from '@/integrations';
import { CollectionIds } from './index';

export interface Collateral {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  loanId: string;
  organisationId: string;
  collateralType: string; // e.g., 'VEHICLE', 'PROPERTY', 'EQUIPMENT', 'LIVESTOCK'
  collateralDescription: string;
  collateralValue: number;
  registrationNumber?: string;
  location?: string;
  registrationDate: Date | string;
  expiryDate?: Date | string;
  status: 'ACTIVE' | 'RELEASED' | 'FORFEITED' | 'EXPIRED';
  notes?: string;
}

export class CollateralService {
  /**
   * Create collateral record
   */
  static async createCollateral(data: Omit<Collateral, '_id' | '_createdDate' | '_updatedDate'>): Promise<Collateral> {
    try {
      const collateral: Collateral = {
        ...data,
        _id: crypto.randomUUID(),
      };
      
      // Note: This would need a collateral collection to be created in CMS
      // For now, we'll store in a temporary structure
      console.log('Creating collateral:', collateral);
      return collateral;
    } catch (error) {
      console.error('Error creating collateral:', error);
      throw error;
    }
  }

  /**
   * Get collateral by ID
   */
  static async getCollateral(collateralId: string): Promise<Collateral | null> {
    try {
      // Placeholder for actual implementation
      console.log('Fetching collateral:', collateralId);
      return null;
    } catch (error) {
      console.error('Error fetching collateral:', error);
      return null;
    }
  }

  /**
   * Get all collateral for a loan
   */
  static async getLoanCollateral(loanId: string): Promise<Collateral[]> {
    try {
      // Placeholder for actual implementation
      console.log('Fetching collateral for loan:', loanId);
      return [];
    } catch (error) {
      console.error('Error fetching loan collateral:', error);
      return [];
    }
  }

  /**
   * Get all collateral for an organisation
   */
  static async getOrganisationCollateralRegister(organisationId: string): Promise<Collateral[]> {
    try {
      // Placeholder for actual implementation
      console.log('Fetching collateral register for organisation:', organisationId);
      return [];
    } catch (error) {
      console.error('Error fetching organisation collateral register:', error);
      return [];
    }
  }

  /**
   * Update collateral
   */
  static async updateCollateral(collateralId: string, data: Partial<Collateral>): Promise<void> {
    try {
      console.log('Updating collateral:', collateralId, data);
    } catch (error) {
      console.error('Error updating collateral:', error);
      throw error;
    }
  }

  /**
   * Release collateral
   */
  static async releaseCollateral(collateralId: string, releaseDate: Date): Promise<void> {
    try {
      await this.updateCollateral(collateralId, {
        status: 'RELEASED',
        expiryDate: releaseDate,
      });
    } catch (error) {
      console.error('Error releasing collateral:', error);
      throw error;
    }
  }



  /**
   * Calculate total collateral value for a loan
   */
  static calculateTotalCollateralValue(collaterals: Collateral[]): number {
    return collaterals.reduce((sum, c) => sum + (c.collateralValue || 0), 0);
  }

  /**
   * Get collateral coverage ratio
   */
  static calculateCoverageRatio(loanAmount: number, collateralValue: number): number {
    if (loanAmount === 0) return 0;
    return (collateralValue / loanAmount) * 100;
  }
}
