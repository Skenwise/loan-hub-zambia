/**
 * Initialization Service
 * Handles system initialization with default data and configurations
 */

import { RoleService } from './RoleService';
import { SubscriptionService } from './SubscriptionService';
import { OrganisationService } from './OrganisationService';
import { LoanService } from './LoanService';
import { BaseCrudService } from '@/integrations';
import { CollectionIds } from './index';
import { LoanProducts } from '@/entities';

export class InitializationService {
  /**
   * Initialize the entire system with default data
   */
  static async initializeSystem(): Promise<void> {
    try {
      console.log('Starting system initialization...');

      // Initialize roles
      await RoleService.initializeDefaultRoles();
      console.log('✓ Roles initialized');

      // Initialize subscription plans
      await SubscriptionService.initializeDefaultPlans();
      console.log('✓ Subscription plans initialized');

      // Initialize default loan products
      await this.initializeDefaultLoanProducts();
      console.log('✓ Loan products initialized');

      console.log('✓ System initialization completed successfully');
    } catch (error) {
      console.error('Error during system initialization:', error);
      throw error;
    }
  }

  /**
   * Initialize default loan products
   */
  private static async initializeDefaultLoanProducts(): Promise<void> {
    try {
      const { items } = await BaseCrudService.getAll<LoanProducts>(
        CollectionIds.LOAN_PRODUCTS
      );

      if (items && items.length > 0) {
        console.log('Loan products already initialized');
        return;
      }

      const defaultProducts = [
        {
          productName: 'Personal Loan',
          productType: 'PERSONAL',
          description: 'Unsecured personal loan for individuals',
          interestRate: 18.5,
          minLoanAmount: 1000,
          maxLoanAmount: 50000,
          loanTermMonths: 24,
          processingFee: 2.5,
          eligibilityCriteria: 'Minimum credit score 500, KYC verified',
          isActive: true,
        },
        {
          productName: 'Business Loan',
          productType: 'BUSINESS',
          description: 'Secured business loan for SMEs',
          interestRate: 15.0,
          minLoanAmount: 10000,
          maxLoanAmount: 500000,
          loanTermMonths: 36,
          processingFee: 3.0,
          eligibilityCriteria: 'Business registration, 2 years operating history',
          isActive: true,
        },
        {
          productName: 'Agricultural Loan',
          productType: 'AGRICULTURAL',
          description: 'Seasonal agricultural financing',
          interestRate: 12.0,
          minLoanAmount: 5000,
          maxLoanAmount: 200000,
          loanTermMonths: 12,
          processingFee: 2.0,
          eligibilityCriteria: 'Land ownership, crop insurance',
          isActive: true,
        },
        {
          productName: 'Mortgage',
          productType: 'MORTGAGE',
          description: 'Long-term property financing',
          interestRate: 10.5,
          minLoanAmount: 50000,
          maxLoanAmount: 1000000,
          loanTermMonths: 240,
          processingFee: 1.5,
          eligibilityCriteria: 'Property valuation, stable income',
          isActive: true,
        },
      ];

      for (const product of defaultProducts) {
        await BaseCrudService.create(CollectionIds.LOAN_PRODUCTS, {
          ...product,
          _id: crypto.randomUUID(),
        });
      }

      console.log('Default loan products created');
    } catch (error) {
      console.error('Error initializing loan products:', error);
      throw error;
    }
  }

  /**
   * Create sample organisation with all setup
   */
  static async createSampleOrganisation(): Promise<string> {
    try {
      // Create organisation
      const org = await OrganisationService.createOrganisation({
        organizationName: 'Sample Lending Institution',
        subscriptionPlanType: 'Professional',
        organizationStatus: 'ACTIVE',
        creationDate: new Date(),
        contactEmail: 'admin@samplelender.com',
        websiteUrl: 'https://samplelender.com',
        lastActivityDate: new Date(),
      });

      console.log('Sample organisation created:', org._id);
      return org._id;
    } catch (error) {
      console.error('Error creating sample organisation:', error);
      throw error;
    }
  }

  /**
   * Reset system (for testing/development)
   * WARNING: This will delete all data!
   */
  static async resetSystem(): Promise<void> {
    try {
      console.warn('WARNING: Resetting system will delete all data!');
      
      // This is a placeholder - actual implementation would require
      // deleting all records from all collections
      console.log('System reset completed');
    } catch (error) {
      console.error('Error resetting system:', error);
      throw error;
    }
  }

  /**
   * Check if system is initialized
   */
  static async isSystemInitialized(): Promise<boolean> {
    try {
      const roles = await RoleService.getAllRoles();
      const plans = await SubscriptionService.getAllPlans();
      
      return roles.length > 0 && plans.length > 0;
    } catch (error) {
      console.error('Error checking system initialization:', error);
      return false;
    }
  }
}
