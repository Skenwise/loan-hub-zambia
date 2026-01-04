import { useOrganisationStore } from '@/store/organisationStore';
import { SubscriptionEnforcementService } from '@/services/SubscriptionEnforcementService';

export type FeatureKey = 
  | 'basic_reporting'
  | 'advanced_reporting'
  | 'customer_management'
  | 'loan_management'
  | 'ifrs9_compliance'
  | 'boz_provisions'
  | 'api_access'
  | 'custom_integrations'
  | 'bulk_disbursement'
  | 'credit_committee';

/**
 * Hook to check if a feature is available in the current subscription plan
 */
export function useSubscriptionFeatures() {
  const { subscriptionPlan, currentOrganisation } = useOrganisationStore();

  const hasFeature = (feature: FeatureKey): boolean => {
    if (!subscriptionPlan?.features) return false;
    const features = subscriptionPlan.features.split(',').map(f => f.trim());
    return features.includes(feature);
  };

  const hasAnyFeature = (features: FeatureKey[]): boolean => {
    return features.some(feature => hasFeature(feature));
  };

  const hasAllFeatures = (features: FeatureKey[]): boolean => {
    return features.every(feature => hasFeature(feature));
  };

  const getAvailableFeatures = (): FeatureKey[] => {
    if (!subscriptionPlan?.features) return [];
    return subscriptionPlan.features.split(',').map(f => f.trim()) as FeatureKey[];
  };

  const getPlanType = (): string => {
    return subscriptionPlan?.planName || 'Starter';
  };

  const canAccessFeature = async (feature: FeatureKey): Promise<boolean> => {
    if (!currentOrganisation) return false;
    
    // Check if feature is in the subscription plan
    if (!hasFeature(feature)) return false;

    // Additional checks can be added here (e.g., usage limits)
    return true;
  };

  return {
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    getAvailableFeatures,
    getPlanType,
    canAccessFeature,
    subscriptionPlan,
    currentOrganisation,
  };
}
