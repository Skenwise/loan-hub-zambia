/**
 * Organisation Service
 * Handles multi-tenant organisation operations and data isolation
 */

import { BaseCrudService } from '@/integrations';
import { Organizations, OrganisationSetup } from '@/entities';
import { CollectionIds } from './index';

export class OrganisationService {
  /**
   * Get organisation by ID
   */
  static async getOrganisation(organisationId: string): Promise<Organizations | null> {
    try {
      const org = await BaseCrudService.getById<Organizations>(
        CollectionIds.ORGANISATIONS,
        organisationId
      );
      return org || null;
    } catch (error) {
      console.error('Error fetching organisation:', error);
      return null;
    }
  }

  /**
   * Get all organisations
   */
  static async getAllOrganisations(): Promise<Organizations[]> {
    try {
      const { items } = await BaseCrudService.getAll<Organizations>(
        CollectionIds.ORGANISATIONS
      );
      return items || [];
    } catch (error) {
      console.error('Error fetching organisations:', error);
      return [];
    }
  }

  /**
   * Create new organisation
   */
  static async createOrganisation(data: Omit<Organizations, '_id' | '_createdDate' | '_updatedDate'>): Promise<Organizations> {
    try {
      const newOrg: Organizations = {
        ...data,
        _id: crypto.randomUUID(),
      };
      await BaseCrudService.create(CollectionIds.ORGANISATIONS, newOrg);
      return newOrg;
    } catch (error) {
      console.error('Error creating organisation:', error);
      throw error;
    }
  }

  /**
   * Update organisation
   */
  static async updateOrganisation(organisationId: string, data: Partial<Organizations>): Promise<void> {
    try {
      await BaseCrudService.update(CollectionIds.ORGANISATIONS, {
        _id: organisationId,
        ...data,
      });
    } catch (error) {
      console.error('Error updating organisation:', error);
      throw error;
    }
  }

  /**
   * Get organisation setup status
   */
  static async getOrganisationSetup(organisationId: string): Promise<OrganisationSetup | null> {
    try {
      const { items } = await BaseCrudService.getAll<OrganisationSetup>(
        CollectionIds.ORGANISATION_SETUP
      );
      const setup = items?.find(s => s.organisationName === organisationId);
      return setup || null;
    } catch (error) {
      console.error('Error fetching organisation setup:', error);
      return null;
    }
  }

  /**
   * Update organisation setup status
   */
  static async updateOrganisationSetup(setupId: string, data: Partial<OrganisationSetup>): Promise<void> {
    try {
      await BaseCrudService.update(CollectionIds.ORGANISATION_SETUP, {
        _id: setupId,
        ...data,
      });
    } catch (error) {
      console.error('Error updating organisation setup:', error);
      throw error;
    }
  }

  /**
   * Verify organisation has active subscription
   */
  static async hasActiveSubscription(organisationId: string): Promise<boolean> {
    try {
      const org = await this.getOrganisation(organisationId);
      if (!org) return false;
      
      // Check if organisation has subscription plan and is active
      return org.subscriptionPlanType !== undefined && org.organizationStatus === 'ACTIVE';
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Get organisation's subscription plan
   */
  static async getSubscriptionPlan(organisationId: string) {
    try {
      const org = await this.getOrganisation(organisationId);
      if (!org || !org.subscriptionPlanType) return null;

      // subscriptionPlanType is a string, not an ID reference
      // Return the plan type information
      return {
        planType: org.subscriptionPlanType,
      };
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }
  }
}
