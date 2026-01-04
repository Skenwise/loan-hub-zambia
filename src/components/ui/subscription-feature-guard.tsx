import React from 'react';
import { FeatureKey } from '@/hooks/useSubscriptionFeatures';

interface SubscriptionFeatureGuardProps {
  feature: FeatureKey | FeatureKey[];
  children: React.ReactNode;
  requireAll?: boolean;
  fallbackPath?: string;
}

/**
 * Component to guard entire pages based on subscription features
 * Redirects or shows message if feature is not available
 */
export function SubscriptionFeatureGuard({
  feature,
  children,
  requireAll = false,
  fallbackPath = '/admin/dashboard',
}: SubscriptionFeatureGuardProps) {
  // All features are now accessible regardless of subscription plan
  // This ensures all functionality is available to all users
  return <>{children}</>;
}
