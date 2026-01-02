/**
 * Subscription Enforcement Service
 * Manages subscription plan limits and feature enforcement
 */

import { BaseCrudService } from '@/integrations';
import { Organizations, SubscriptionPlans, StaffMembers } from '@/entities';
import { CollectionIds } from './index';

export interface SubscriptionPlanFeatures {
  maxUsers: number;
  maxBranches: number;
  enabledRoles: string[];
  creditCommitteeFeature: boolean;
  ifrs9Module: boolean;
  bulkDisbursement: boolean;
  advancedReporting: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  dedicatedSupport: boolean;
}

export interface SubscriptionEnforcementResult {
  isCompliant: boolean;
  violations: SubscriptionViolation[];
  warnings: SubscriptionWarning[];
}

export interface SubscriptionViolation {
  type: 'users' | 'branches' | 'roles' | 'features';
  message: string;
  current: number;
  limit: number;
  action: 'block' | 'warn';
}

export interface SubscriptionWarning {
  type: string;
  message: string;
  percentageUsed: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanFeatures> = {
  'starter': {
    maxUsers: 5,
    maxBranches: 1,
    enabledRoles: ['loan-officer', 'branch-manager'],
    creditCommitteeFeature: false,
    ifrs9Module: false,
    bulkDisbursement: false,
    advancedReporting: false,
    apiAccess: false,
    customBranding: false,
    dedicatedSupport: false,
  },
  
  'professional': {
    maxUsers: 25,
    maxBranches: 3,
    enabledRoles: [
      'loan-officer',
      'branch-manager',
      'credit-officer',
      'kyc-officer',
      'finance-officer',
    ],
    creditCommitteeFeature: false,
    ifrs9Module: false,
    bulkDisbursement: true,
    advancedReporting: true,
    apiAccess: false,
    customBranding: false,
    dedicatedSupport: false,
  },
  
  'enterprise': {
    maxUsers: 100,
    maxBranches: 10,
    enabledRoles: [
      'loan-officer',
      'branch-manager',
      'credit-officer',
      'kyc-officer',
      'finance-officer',
      'credit-manager',
      'ceo',
      'internal-auditor',
    ],
    creditCommitteeFeature: true,
    ifrs9Module: true,
    bulkDisbursement: true,
    advancedReporting: true,
    apiAccess: true,
    customBranding: true,
    dedicatedSupport: true,
  },
  
  'custom': {
    maxUsers: Number.MAX_SAFE_INTEGER,
    maxBranches: Number.MAX_SAFE_INTEGER,
    enabledRoles: [
      'loan-officer',
      'branch-manager',
      'credit-officer',
      'kyc-officer',
      'finance-officer',
      'credit-manager',
      'ceo',
      'internal-auditor',
    ],
    creditCommitteeFeature: true,
    ifrs9Module: true,
    bulkDisbursement: true,
    advancedReporting: true,
    apiAccess: true,
    customBranding: true,
    dedicatedSupport: true,
  },
};

export class SubscriptionEnforcementService {
  /**
   * Get subscription plan features
   */
  static getPlanFeatures(planType: string): SubscriptionPlanFeatures {
    return SUBSCRIPTION_PLANS[planType.toLowerCase()] || SUBSCRIPTION_PLANS['starter'];
  }

  /**
   * Check subscription compliance for organization
   */
  static async checkSubscriptionCompliance(
    organisationId: string
  ): Promise<SubscriptionEnforcementResult> {
    try {
      // Get organization subscription
      const org = await BaseCrudService.getById<Organizations>(
        CollectionIds.ORGANISATIONS,
        organisationId
      );

      if (!org) {
        return {
          isCompliant: false,
          violations: [
            {
              type: 'features',
              message: 'Organization not found',
              current: 0,
              limit: 0,
              action: 'block',
            },
          ],
          warnings: [],
        };
      }

      const planType = org.subscriptionPlanType || 'starter';
      const features = this.getPlanFeatures(planType);

      const violations: SubscriptionViolation[] = [];
      const warnings: SubscriptionWarning[] = [];

      // Check user count
      const { items: staffMembers } = await BaseCrudService.getAll<StaffMembers>(
        CollectionIds.STAFF_MEMBERS
      );
      const activeUsers = staffMembers?.filter(
        (s: any) => s.organisationId === organisationId && s.status !== 'INACTIVE'
      ).length || 0;

      if (activeUsers > features.maxUsers) {
        violations.push({
          type: 'users',
          message: `User limit exceeded: ${activeUsers} users, limit is ${features.maxUsers}`,
          current: activeUsers,
          limit: features.maxUsers,
          action: 'block',
        });
      } else if (activeUsers > features.maxUsers * 0.8) {
        warnings.push({
          type: 'users',
          message: `Approaching user limit: ${activeUsers}/${features.maxUsers}`,
          percentageUsed: (activeUsers / features.maxUsers) * 100,
        });
      }

      // Check branch count
      // This would require a branches collection
      // For now, we'll skip this check

      return {
        isCompliant: violations.length === 0,
        violations,
        warnings,
      };
    } catch (error) {
      console.error('Error checking subscription compliance:', error);
      return {
        isCompliant: false,
        violations: [
          {
            type: 'features',
            message: 'Error checking subscription compliance',
            current: 0,
            limit: 0,
            action: 'block',
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Check if feature is enabled for organization
   */
  static async isFeatureEnabled(
    organisationId: string,
    feature: keyof SubscriptionPlanFeatures
  ): Promise<boolean> {
    try {
      const org = await BaseCrudService.getById<Organizations>(
        CollectionIds.ORGANISATIONS,
        organisationId
      );

      if (!org) return false;

      const planType = org.subscriptionPlanType || 'starter';
      const features = this.getPlanFeatures(planType);

      return features[feature] as boolean;
    } catch (error) {
      console.error('Error checking feature:', error);
      return false;
    }
  }

  /**
   * Check if role is enabled for organization
   */
  static async isRoleEnabled(
    organisationId: string,
    roleId: string
  ): Promise<boolean> {
    try {
      const org = await BaseCrudService.getById<Organizations>(
        CollectionIds.ORGANISATIONS,
        organisationId
      );

      if (!org) return false;

      const planType = org.subscriptionPlanType || 'starter';
      const features = this.getPlanFeatures(planType);

      return features.enabledRoles.includes(roleId);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * Get available roles for organization
   */
  static async getAvailableRoles(organisationId: string): Promise<string[]> {
    try {
      const org = await BaseCrudService.getById<Organizations>(
        CollectionIds.ORGANISATIONS,
        organisationId
      );

      if (!org) return [];

      const planType = org.subscriptionPlanType || 'starter';
      const features = this.getPlanFeatures(planType);

      return features.enabledRoles;
    } catch (error) {
      console.error('Error getting available roles:', error);
      return [];
    }
  }

  /**
   * Check if user can be added to organization
   */
  static async canAddUser(organisationId: string): Promise<{
    canAdd: boolean;
    reason?: string;
    currentUsers: number;
    limit: number;
  }> {
    try {
      const org = await BaseCrudService.getById<Organizations>(
        CollectionIds.ORGANISATIONS,
        organisationId
      );

      if (!org) {
        return {
          canAdd: false,
          reason: 'Organization not found',
          currentUsers: 0,
          limit: 0,
        };
      }

      const planType = org.subscriptionPlanType || 'starter';
      const features = this.getPlanFeatures(planType);

      const { items: staffMembers } = await BaseCrudService.getAll<StaffMembers>(
        CollectionIds.STAFF_MEMBERS
      );
      const activeUsers = staffMembers?.filter(
        (s: any) => s.organisationId === organisationId && s.status !== 'INACTIVE'
      ).length || 0;

      if (activeUsers >= features.maxUsers) {
        return {
          canAdd: false,
          reason: `User limit reached (${features.maxUsers}). Please upgrade your subscription.`,
          currentUsers: activeUsers,
          limit: features.maxUsers,
        };
      }

      return {
        canAdd: true,
        currentUsers: activeUsers,
        limit: features.maxUsers,
      };
    } catch (error) {
      console.error('Error checking if user can be added:', error);
      return {
        canAdd: false,
        reason: 'Error checking subscription limits',
        currentUsers: 0,
        limit: 0,
      };
    }
  }

  /**
   * Get subscription usage summary
   */
  static async getSubscriptionUsageSummary(organisationId: string): Promise<{
    planType: string;
    users: { current: number; limit: number; percentageUsed: number };
    features: SubscriptionPlanFeatures;
  }> {
    try {
      const org = await BaseCrudService.getById<Organizations>(
        CollectionIds.ORGANISATIONS,
        organisationId
      );

      if (!org) {
        return {
          planType: 'starter',
          users: { current: 0, limit: 0, percentageUsed: 0 },
          features: SUBSCRIPTION_PLANS['starter'],
        };
      }

      const planType = org.subscriptionPlanType || 'starter';
      const features = this.getPlanFeatures(planType);

      const { items: staffMembers } = await BaseCrudService.getAll<StaffMembers>(
        CollectionIds.STAFF_MEMBERS
      );
      const activeUsers = staffMembers?.filter(
        (s: any) => s.organisationId === organisationId && s.status !== 'INACTIVE'
      ).length || 0;

      return {
        planType,
        users: {
          current: activeUsers,
          limit: features.maxUsers,
          percentageUsed: (activeUsers / features.maxUsers) * 100,
        },
        features,
      };
    } catch (error) {
      console.error('Error getting subscription usage:', error);
      return {
        planType: 'starter',
        users: { current: 0, limit: 0, percentageUsed: 0 },
        features: SUBSCRIPTION_PLANS['starter'],
      };
    }
  }

  /**
   * Upgrade subscription plan
   */
  static async upgradeSubscriptionPlan(
    organisationId: string,
    newPlanType: string
  ): Promise<void> {
    try {
      await BaseCrudService.update(CollectionIds.ORGANISATIONS, {
        _id: organisationId,
        subscriptionPlanType: newPlanType,
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Get upgrade recommendations
   */
  static async getUpgradeRecommendations(organisationId: string): Promise<string[]> {
    try {
      const compliance = await this.checkSubscriptionCompliance(organisationId);
      const recommendations: string[] = [];

      for (const violation of compliance.violations) {
        if (violation.type === 'users') {
          recommendations.push('Upgrade to Professional or Enterprise plan to add more users');
        } else if (violation.type === 'features') {
          recommendations.push('Upgrade to Enterprise plan to access advanced features');
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting upgrade recommendations:', error);
      return [];
    }
  }
}
