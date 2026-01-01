/**
 * Subscription Enforcement Service
 * Handles subscription-based feature access control
 */

import { BaseCrudService } from './BaseCrudService';
import { Organizations, SubscriptionPlans } from '@/entities';

export type SubscriptionTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface FeatureAccess {
  feature: string;
  requiredTier: SubscriptionTier;
  usageLimit?: number;
  currentUsage?: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: SubscriptionTier;
  expiryDate: Date | null;
  daysRemaining: number;
  isExpired: boolean;
  features: FeatureAccess[];
}

export const FEATURE_TIERS: Record<string, SubscriptionTier> = {
  // Basic features - all tiers
  'view-dashboard': 'STARTER',
  'view-loans': 'STARTER',
  'apply-loan': 'STARTER',
  'view-repayments': 'STARTER',

  // Advanced features - Professional and above
  'advanced-analytics': 'PROFESSIONAL',
  'custom-reports': 'PROFESSIONAL',
  'write-off-management': 'PROFESSIONAL',
  'bulk-operations': 'PROFESSIONAL',

  // Enterprise features - Enterprise only
  'compliance-dashboard': 'ENTERPRISE',
  'api-access': 'ENTERPRISE',
  'white-label': 'ENTERPRISE',
  'dedicated-support': 'ENTERPRISE',
};

export const USAGE_LIMITS: Record<SubscriptionTier, Record<string, number>> = {
  STARTER: {
    'max-loans': 100,
    'max-users': 5,
    'max-reports-per-month': 10,
    'max-api-calls-per-day': 1000,
  },
  PROFESSIONAL: {
    'max-loans': 1000,
    'max-users': 25,
    'max-reports-per-month': 100,
    'max-api-calls-per-day': 10000,
  },
  ENTERPRISE: {
    'max-loans': 999999,
    'max-users': 999999,
    'max-reports-per-month': 999999,
    'max-api-calls-per-day': 999999,
  },
};

export class SubscriptionEnforcementService {
  /**
   * Get subscription status for organization
   */
  static async getSubscriptionStatus(organisationId: string): Promise<SubscriptionStatus> {
    try {
      const org = await BaseCrudService.getById<Organizations>('organisations', organisationId);

      if (!org) {
        return {
          isActive: false,
          tier: 'STARTER',
          expiryDate: null,
          daysRemaining: 0,
          isExpired: true,
          features: [],
        };
      }

      // Get subscription plan
      const planId = org.subscriptionPlanId;
      const plan = planId ? await BaseCrudService.getById<SubscriptionPlans>('subscriptionplans', planId) : null;

      // Determine tier from plan
      const tier = this.getTierFromPlan(plan?.planName || org.subscriptionPlanType || 'STARTER');

      // Calculate days remaining
      const expiryDate = null; // Placeholder - would come from subscription record
      const daysRemaining = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 365;
      const isExpired = daysRemaining < 0;

      // Get available features
      const features = this.getAvailableFeatures(tier);

      return {
        isActive: org.organizationStatus === 'ACTIVE' && !isExpired,
        tier,
        expiryDate,
        daysRemaining: Math.max(daysRemaining, 0),
        isExpired,
        features,
      };
    } catch {
      return {
        isActive: false,
        tier: 'STARTER',
        expiryDate: null,
        daysRemaining: 0,
        isExpired: true,
        features: [],
      };
    }
  }

  /**
   * Check if feature is accessible
   */
  static async canAccessFeature(
    organisationId: string,
    feature: string
  ): Promise<{ canAccess: boolean; reason?: string }> {
    try {
      const status = await this.getSubscriptionStatus(organisationId);

      if (!status.isActive) {
        return { canAccess: false, reason: 'Subscription is not active' };
      }

      if (status.isExpired) {
        return { canAccess: false, reason: 'Subscription has expired' };
      }

      const requiredTier = FEATURE_TIERS[feature];
      if (!requiredTier) {
        return { canAccess: true }; // Feature doesn't require specific tier
      }

      const tierHierarchy = { STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };
      if (tierHierarchy[status.tier] < tierHierarchy[requiredTier]) {
        return { canAccess: false, reason: `Feature requires ${requiredTier} subscription` };
      }

      return { canAccess: true };
    } catch {
      return { canAccess: false, reason: 'Error checking subscription' };
    }
  }

  /**
   * Check usage limit
   */
  static async checkUsageLimit(
    organisationId: string,
    limitType: string
  ): Promise<{ withinLimit: boolean; current: number; limit: number }> {
    try {
      const status = await this.getSubscriptionStatus(organisationId);
      const limit = USAGE_LIMITS[status.tier][limitType] || 0;

      // Get current usage
      let current = 0;

      if (limitType === 'max-loans') {
        const { items } = await BaseCrudService.getAll<any>('loans');
        current = items.filter((l: any) => l.organisationId === organisationId).length;
      } else if (limitType === 'max-users') {
        const { items } = await BaseCrudService.getAll<any>('staffmembers');
        current = items.filter((s: any) => s.organisationId === organisationId).length;
      }

      return {
        withinLimit: current < limit,
        current,
        limit,
      };
    } catch {
      return { withinLimit: false, current: 0, limit: 0 };
    }
  }

  /**
   * Get tier from plan name
   */
  private static getTierFromPlan(planName: string): SubscriptionTier {
    const name = planName.toUpperCase();
    if (name.includes('ENTERPRISE')) return 'ENTERPRISE';
    if (name.includes('PROFESSIONAL')) return 'PROFESSIONAL';
    return 'STARTER';
  }

  /**
   * Get available features for tier
   */
  private static getAvailableFeatures(tier: SubscriptionTier): FeatureAccess[] {
    const tierHierarchy = { STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };
    const tierLevel = tierHierarchy[tier];

    return Object.entries(FEATURE_TIERS)
      .filter(([_, requiredTier]) => tierHierarchy[requiredTier] <= tierLevel)
      .map(([feature, requiredTier]) => ({
        feature,
        requiredTier,
        usageLimit: USAGE_LIMITS[tier][feature],
      }));
  }

  /**
   * Get subscription summary
   */
  static async getSubscriptionSummary(organisationId: string): Promise<{
    tier: SubscriptionTier;
    status: string;
    daysRemaining: number;
    featureCount: number;
    usageLimits: Record<string, { current: number; limit: number; percentage: number }>;
  }> {
    try {
      const status = await this.getSubscriptionStatus(organisationId);

      // Calculate usage percentages
      const usageLimits: Record<string, { current: number; limit: number; percentage: number }> = {};

      for (const [limitType, limit] of Object.entries(USAGE_LIMITS[status.tier])) {
        const usage = await this.checkUsageLimit(organisationId, limitType);
        usageLimits[limitType] = {
          current: usage.current,
          limit: usage.limit,
          percentage: (usage.current / usage.limit) * 100,
        };
      }

      return {
        tier: status.tier,
        status: status.isActive ? 'ACTIVE' : 'INACTIVE',
        daysRemaining: status.daysRemaining,
        featureCount: status.features.length,
        usageLimits,
      };
    } catch {
      return {
        tier: 'STARTER',
        status: 'INACTIVE',
        daysRemaining: 0,
        featureCount: 0,
        usageLimits: {},
      };
    }
  }

  /**
   * Check if upgrade is needed
   */
  static async checkUpgradeNeeded(organisationId: string): Promise<{
    upgradeNeeded: boolean;
    reason?: string;
    recommendedTier?: SubscriptionTier;
  }> {
    try {
      const status = await this.getSubscriptionStatus(organisationId);

      // Check usage limits
      for (const [limitType, limit] of Object.entries(USAGE_LIMITS[status.tier])) {
        const usage = await this.checkUsageLimit(organisationId, limitType);
        const percentage = (usage.current / usage.limit) * 100;

        if (percentage > 80) {
          const nextTier = status.tier === 'STARTER' ? 'PROFESSIONAL' : 'ENTERPRISE';
          return {
            upgradeNeeded: true,
            reason: `${limitType} usage at ${Math.round(percentage)}%`,
            recommendedTier: nextTier,
          };
        }
      }

      return { upgradeNeeded: false };
    } catch {
      return { upgradeNeeded: false };
    }
  }

  /**
   * Get tier comparison
   */
  static getTierComparison(): Record<SubscriptionTier, {
    name: string;
    price: number;
    features: string[];
    limits: Record<string, number>;
  }> {
    return {
      STARTER: {
        name: 'Starter',
        price: 99,
        features: [
          'Basic loan management',
          'Up to 100 loans',
          'Basic reporting',
          'Email support',
        ],
        limits: USAGE_LIMITS.STARTER,
      },
      PROFESSIONAL: {
        name: 'Professional',
        price: 299,
        features: [
          'Advanced analytics',
          'Up to 1000 loans',
          'Custom reports',
          'Write-off management',
          'Priority support',
        ],
        limits: USAGE_LIMITS.PROFESSIONAL,
      },
      ENTERPRISE: {
        name: 'Enterprise',
        price: 999,
        features: [
          'All features',
          'Unlimited loans',
          'Advanced compliance',
          'API access',
          'White-label',
          'Dedicated support',
        ],
        limits: USAGE_LIMITS.ENTERPRISE,
      },
    };
  }

  /**
   * Validate subscription for operation
   */
  static async validateSubscriptionForOperation(
    organisationId: string,
    operation: string,
    requiredTier: SubscriptionTier = 'STARTER'
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const status = await this.getSubscriptionStatus(organisationId);

      if (!status.isActive) {
        return { valid: false, message: 'Subscription is not active' };
      }

      if (status.isExpired) {
        return { valid: false, message: 'Subscription has expired' };
      }

      const tierHierarchy = { STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };
      if (tierHierarchy[status.tier] < tierHierarchy[requiredTier]) {
        return { valid: false, message: `Operation requires ${requiredTier} subscription` };
      }

      return { valid: true };
    } catch {
      return { valid: false, message: 'Error validating subscription' };
    }
  }
}
