import { useEffect, useState } from 'react';
import { useOrganisationStore } from '@/store/organisationStore';
import { BaseCrudService } from '@/integrations';
import { Organizations, SubscriptionPlans } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { currentOrganisation, subscriptionPlan, setOrganisation, setSubscriptionPlan } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  useEffect(() => {
    loadOrganisationData();
  }, []);

  const loadOrganisationData = async () => {
    try {
      // In a real app, you'd get the organisation ID from the authenticated user
      // For now, we'll check if there's a current organisation in the store
      if (!currentOrganisation) {
        // Redirect to setup if no organisation is selected
        navigate('/setup');
        return;
      }

      // Fetch the subscription plan
      if (currentOrganisation.subscriptionPlanType) {
        const plan = await BaseCrudService.getById<SubscriptionPlans>(
          'subscriptionplans',
          currentOrganisation.subscriptionPlanType
        );

        if (plan) {
          setSubscriptionPlan(plan);

          // Check if subscription is active
          if (!plan.isActive) {
            setSubscriptionExpired(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load organisation data:', error);
      navigate('/setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (subscriptionExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Expired</h1>
            <p className="text-gray-600 mb-6">
              Your subscription has expired. Please renew your subscription to continue using the platform.
            </p>
            <Button
              onClick={() => navigate('/setup')}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              Renew Subscription
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
