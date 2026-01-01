/**
 * Customer Service
 * Handles customer management and KYC verification
 */

import { BaseCrudService } from '@/integrations';
import { CustomerProfiles, KYCVerificationHistory, CustomerAccounts } from '@/entities';
import { CollectionIds } from './index';
import { AuditService } from './AuditService';

export class CustomerService {
  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string): Promise<CustomerProfiles | null> {
    try {
      const customer = await BaseCrudService.getById<CustomerProfiles>(
        CollectionIds.CUSTOMERS,
        customerId
      );
      return customer || null;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  /**
   * Get all customers for an organisation
   */
  static async getOrganisationCustomers(organisationId: string): Promise<CustomerProfiles[]> {
    try {
      const { items } = await BaseCrudService.getAll<CustomerProfiles>(
        CollectionIds.CUSTOMERS
      );
      return items || [];
    } catch (error) {
      console.error('Error fetching organisation customers:', error);
      return [];
    }
  }

  /**
   * Create new customer
   */
  static async createCustomer(data: Omit<CustomerProfiles, '_id' | '_createdDate' | '_updatedDate'>): Promise<CustomerProfiles> {
    try {
      const newCustomer: CustomerProfiles = {
        ...data,
        _id: crypto.randomUUID(),
        kycVerificationStatus: 'PENDING',
      };
      
      await BaseCrudService.create(CollectionIds.CUSTOMERS, newCustomer);
      
      // Log creation
      await AuditService.logCustomerCreation(
        newCustomer._id,
        data.emailAddress || 'SYSTEM',
        undefined
      );

      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(customerId: string, data: Partial<CustomerProfiles>): Promise<void> {
    try {
      await BaseCrudService.update(CollectionIds.CUSTOMERS, {
        _id: customerId,
        ...data,
      });

      // Log update
      await AuditService.logCustomerUpdate(
        customerId,
        data.emailAddress || 'SYSTEM',
        undefined
      );
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Verify KYC for customer
   */
  static async verifyKYC(
    customerId: string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING',
    verifierId: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update customer KYC status
      await this.updateCustomer(customerId, {
        kycVerificationStatus: status,
      });

      // Log KYC verification
      const kycRecord: KYCVerificationHistory = {
        _id: crypto.randomUUID(),
        customerId,
        verificationStatus: status,
        verificationTimestamp: new Date(),
        verifierId,
        verifierNotes: notes,
        attemptNumber: 1,
      };

      await BaseCrudService.create(CollectionIds.KYC_VERIFICATION_HISTORY, kycRecord);

      // Audit log
      await AuditService.logKYCVerification(customerId, status, verifierId, verifierId);
    } catch (error) {
      console.error('Error verifying KYC:', error);
      throw error;
    }
  }

  /**
   * Get KYC verification history for customer
   */
  static async getKYCHistory(customerId: string): Promise<KYCVerificationHistory[]> {
    try {
      const { items } = await BaseCrudService.getAll<KYCVerificationHistory>(
        CollectionIds.KYC_VERIFICATION_HISTORY
      );
      return items?.filter(k => k.customerId === customerId) || [];
    } catch (error) {
      console.error('Error fetching KYC history:', error);
      return [];
    }
  }

  /**
   * Create customer account
   */
  static async createCustomerAccount(data: Omit<CustomerAccounts, '_id' | '_createdDate' | '_updatedDate'>): Promise<CustomerAccounts> {
    try {
      const account: CustomerAccounts = {
        ...data,
        _id: crypto.randomUUID(),
        dateCreated: new Date(),
        lastUpdated: new Date(),
      };

      await BaseCrudService.create(CollectionIds.CUSTOMER_ACCOUNTS, account);
      return account;
    } catch (error) {
      console.error('Error creating customer account:', error);
      throw error;
    }
  }

  /**
   * Get customer accounts
   */
  static async getCustomerAccounts(customerId: string): Promise<CustomerAccounts[]> {
    try {
      const { items } = await BaseCrudService.getAll<CustomerAccounts>(
        CollectionIds.CUSTOMER_ACCOUNTS
      );
      return items?.filter(a => a.customerProfileId === customerId) || [];
    } catch (error) {
      console.error('Error fetching customer accounts:', error);
      return [];
    }
  }

  /**
   * Check if customer is KYC verified
   */
  static async isKYCVerified(customerId: string): Promise<boolean> {
    try {
      const customer = await this.getCustomer(customerId);
      return customer?.kycVerificationStatus === 'APPROVED';
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return false;
    }
  }

  /**
   * Get customer credit score
   */
  static async getCustomerCreditScore(customerId: string): Promise<number> {
    try {
      const customer = await this.getCustomer(customerId);
      return customer?.creditScore || 0;
    } catch (error) {
      console.error('Error fetching credit score:', error);
      return 0;
    }
  }

  /**
   * Update customer credit score
   */
  static async updateCreditScore(customerId: string, score: number): Promise<void> {
    try {
      await this.updateCustomer(customerId, {
        creditScore: Math.min(Math.max(score, 0), 1000), // Clamp between 0-1000
      });
    } catch (error) {
      console.error('Error updating credit score:', error);
      throw error;
    }
  }

  /**
   * Get customer by email
   */
  static async getCustomerByEmail(email: string): Promise<CustomerProfiles | null> {
    try {
      const { items } = await BaseCrudService.getAll<CustomerProfiles>(
        CollectionIds.CUSTOMERS
      );
      
      const customer = items?.find(c => c.emailAddress === email);
      return customer || null;
    } catch (error) {
      console.error('Error fetching customer by email:', error);
      return null;
    }
  }

  /**
   * Get customer by national ID
   */
  static async getCustomerByNationalId(nationalId: string): Promise<CustomerProfiles | null> {
    try {
      const { items } = await BaseCrudService.getAll<CustomerProfiles>(
        CollectionIds.CUSTOMERS
      );
      
      const customer = items?.find(c => c.nationalIdNumber === nationalId);
      return customer || null;
    } catch (error) {
      console.error('Error fetching customer by national ID:', error);
      return null;
    }
  }
}
