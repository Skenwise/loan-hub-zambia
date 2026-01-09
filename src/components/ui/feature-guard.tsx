import React from 'react';
import { useSubscriptionFeatures, FeatureKey } from '@/hooks/useSubscriptionFeatures';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface FeatureGuardProps {
  feature: FeatureKey | FeatureKey[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Component to guard features based on subscription plan
 * Shows fallback content if feature is not available
 */
export function FeatureGuard({
  feature,
  children,
  fallback,
  requireAll = false,
}: FeatureGuardProps) {
  const { hasFeature, hasAllFeatures, hasAnyFeature, getPlanType } = useSubscriptionFeatures();
  const navigate = useNavigate();

  const features = Array.isArray(feature) ? feature : [feature];
  const hasAccess = requireAll ? hasAllFeatures(features) : hasAnyFeature(features);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback UI
  return (
    <Card className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300">
      <div className="flex justify-center mb-4">
        <Lock className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Not Available</h3>
      <p className="text-gray-600 mb-4">
        This feature is not included in your current {getPlanType()} plan.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Required feature{features.length > 1 ? 's' : ''}: <strong>{features.join(', ')}</strong>
      </p>
      <Button
        onClick={() => navigate('/pricing')}
        className="bg-secondary hover:bg-secondary/90 text-white"
      >
        Upgrade Plan
      </Button>
    </Card>
  );
}
