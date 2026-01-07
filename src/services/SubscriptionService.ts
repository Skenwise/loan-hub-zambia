/**
 * Subscription Service
 * Manages subscription plans and billing enforcement
 */

import { BaseCrudService } from '@/integrations';
import { SubscriptionPlans } from '@/entities';
import { CollectionIds } from './index';
import { OrganisationService } from './OrganisationService';

export class SubscriptionService {
  /**
   * Get subscription plan by ID
   */
  static async getPlan(planId: string): Promise<SubscriptionPlans | null> {
    try {
      const plan = await BaseCrudService.getById<SubscriptionPlans>(
        CollectionIds.SUBSCRIPTION_PLANS,
        planId
      );
      return plan || null;
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }
  }

  /**
   * Get all subscription plans
   */
  static async getAllPlans(): Promise<SubscriptionPlans[]> {
    try {
      const { items } = await BaseCrudService.getAll<SubscriptionPlans>(
        CollectionIds.SUBSCRIPTION_PLANS
      );
      return items?.filter(p => p.isActive) || [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  /**
   * Create new subscription plan
   */
  static async createPlan(data: Omit<SubscriptionPlans, '_id' | '_createdDate' | '_updatedDate'>): Promise<SubscriptionPlans> {
    try {
      const newPlan: SubscriptionPlans = {
        ...data,
        _id: crypto.randomUUID(),
      };
      await BaseCrudService.create(CollectionIds.SUBSCRIPTION_PLANS, newPlan);
      return newPlan;
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  static async updatePlan(planId: string, data: Partial<SubscriptionPlans>): Promise<void> {
    try {
      await BaseCrudService.update(CollectionIds.SUBSCRIPTION_PLANS, {
        _id: planId,
        ...data,
      });
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  /**
   * Get organisation's current subscription plan
   */
  static async getOrganisationPlan(organisationId: string): Promise<SubscriptionPlans | null> {
    try {
      const org = await OrganisationService.getOrganisation(organisationId);
      if (!org || !org.subscriptionPlanType) return null;

      return this.getPlan(org.subscriptionPlanType);
    } catch (error) {
      console.error('Error fetching organisation plan:', error);
      return null;
    }
  }

  /**
   * Check if organisation has feature access
   */
  static async hasFeatureAccess(organisationId: string, feature: string): Promise<boolean> {
    try {
      const plan = await this.getOrganisationPlan(organisationId);
      if (!plan || !plan.features) return false;

      const features = plan.features.split(',').map(f => f.trim());
      return features.includes(feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get plan usage limits
   */
  static async getPlanLimits(planId: string): Promise<Record<string, number>> {
    try {
      const plan = await this.getPlan(planId);
      if (!plan || !plan.usageLimits) return {};

      const limits: Record<string, number> = {};
      const limitPairs = plan.usageLimits.split(',');
      
      limitPairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        limits[key] = parseInt(value, 10);
      });

      return limits;
    } catch (error) {
      console.error('Error fetching plan limits:', error);
      return {};
    }
  }

  /**
   * Check if organisation can create a new branch
   */
  static async canCreateBranch(organisationId: string): Promise<boolean> {
    try {
      const plan = await this.getOrganisationPlan(organisationId);
      if (!plan) return false;

      const limits = await this.getPlanLimits(plan._id);
      const maxBranches = limits['max_branches'];

      // If no limit is set, allow unlimited branches
      if (!maxBranches || maxBranches === 0) return true;

      // Count existing branches
      const { items: allBranches } = await BaseCrudService.getAll('branches');
      const orgBranches = allBranches.filter(
        (b: any) => b.organisationId === organisationId
      );

      return orgBranches.length < maxBranches;
    } catch (error) {
      console.error('Error checking branch creation limit:', error);
      return false;
    }
  }

  /**
   * Initialize default subscription plans
   */
  static async initializeDefaultPlans(): Promise<void> {
    try {
      const existingPlans = await this.getAllPlans();
      
      if (existingPlans.length > 0) {
        console.log('Plans already initialized');
        return;
      }

      // Create default plans
      const plans = [
        {
          planName: 'Starter',
          pricePerMonth: 59,
          features: 'basic_reporting,customer_management,loan_management,kyc_verification,loan_origination,payment_processing,basic_analytics,email_support',
          usageLimits: 'max_users:2,max_loans:100,max_branches:1',
          planDescription: 'Perfect for small lending operations',
          isActive: true,
        },
        {
          planName: 'Professional',
          pricePerMonth: 129,
          features: 'advanced_reporting,customer_management,loan_management,ifrs9_compliance,boz_provisions,write_off_management,priority_support,portfolio_analytics,risk_management',
          usageLimits: 'max_users:5,max_loans:2000,max_branches:5',
          planDescription: 'For growing lending institutions',
          isActive: true,
        },
        {
          planName: 'Enterprise',
          pricePerMonth: 346,
          features: 'advanced_reporting,customer_management,loan_management,ifrs9_compliance,boz_provisions,api_access,custom_integrations,white_label,dedicated_support,advanced_compliance,sla_guarantee',
          usageLimits: 'max_users:unlimited,max_loans:unlimited,max_branches:unlimited',
          planDescription: 'For large-scale operations',
          isActive: true,
        },
      ];

      for (const plan of plans) {
        await this.createPlan(plan);
      }

      console.log('Default subscription plans initialized successfully');
    } catch (error) {
      console.error('Error initializing default plans:', error);
      throw error;
    }
  }
}
