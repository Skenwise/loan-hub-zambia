import React from 'react';
import { useSubscriptionFeatures, FeatureKey } from '@/hooks/useSubscriptionFeatures';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

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
  const { hasFeature, hasAllFeatures, hasAnyFeature, getPlanType } = useSubscriptionFeatures();
  const navigate = useNavigate();

  const features = Array.isArray(feature) ? feature : [feature];
  const hasAccess = requireAll ? hasAllFeatures(features) : hasAnyFeature(features);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show restricted access message
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <Lock className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Feature Not Available</h1>
        <p className="text-gray-600 mb-4">
          This feature is not included in your current <strong>{getPlanType()}</strong> plan.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Required feature{features.length > 1 ? 's' : ''}: <br />
          <strong>{features.join(', ')}</strong>
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate(fallbackPath)}
            variant="outline"
            className="flex-1"
          >
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/setup')}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
          >
            Upgrade Plan
          </Button>
        </div>
      </Card>
    </div>
  );
}
