import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Organizations, SubscriptionPlans, OrganisationSetup } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useOrganisationStore } from '@/store/organisationStore';
import { useCurrencyStore, CURRENCY_RATES } from '@/store/currencyStore';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SetupStep = 'organisation-info' | 'subscription-plan' | 'confirmation';

export default function OrganisationSetupPage() {
  const navigate = useNavigate();
  const { setOrganisation, setSubscriptionPlan } = useOrganisationStore();
  const { currency, setCurrency, formatPrice } = useCurrencyStore();

  const [currentStep, setCurrentStep] = useState<SetupStep>('organisation-info');
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlans[]>([]);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currency);

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      const { items } = await BaseCrudService.getAll<SubscriptionPlans>('subscriptionplans');
      const activePlans = items.filter(plan => plan.isActive === true);
      setSubscriptionPlans(activePlans);
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
    }
  };

  const handleCreateOrganisation = async () => {
    if (!orgName || !contactEmail || !selectedPlanId) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Create organisation
      const organisationId = crypto.randomUUID();
      const newOrganisation: Organizations = {
        _id: organisationId,
        organizationName: orgName,
        contactEmail: contactEmail,
        websiteUrl: websiteUrl || undefined,
        subscriptionPlanType: selectedPlanId,
        organizationStatus: 'active',
        creationDate: new Date(),
        lastActivityDate: new Date(),
      };

      await BaseCrudService.create('organisations', newOrganisation);

      // Get selected plan
      const selectedPlan = subscriptionPlans.find(p => p._id === selectedPlanId);
      if (selectedPlan) {
        setSubscriptionPlan(selectedPlan);
      }

      // Create setup record
      const setupId = crypto.randomUUID();
      const setupRecord: OrganisationSetup = {
        _id: setupId,
        organisationName: orgName,
        currentSetupStep: 'subscription-plan',
        setupStatus: 'in-progress',
        lastUpdated: new Date(),
        isSetupComplete: false,
      };

      await BaseCrudService.create('organisationsetup', setupRecord);

      // Store organisation in state
      setOrganisation(newOrganisation);

      // Move to next step
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Failed to create organisation:', error);
      alert('Failed to create organisation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    navigate('/admin/dashboard');
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    setCurrency(newCurrency as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl bg-white">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Welcome to Lendly</h1>
            <p className="text-gray-600">Set up your organization to get started</p>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full ${currentStep === 'organisation-info' ? 'bg-secondary' : 'bg-gray-300'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep === 'subscription-plan' ? 'bg-secondary' : 'bg-gray-300'}`} />
            <div className={`flex-1 h-2 rounded-full ${currentStep === 'confirmation' ? 'bg-secondary' : 'bg-gray-300'}`} />
          </div>

          {/* Step 1: Organisation Info */}
          {currentStep === 'organisation-info' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Organization Name *
                </label>
                <Input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter your organization name"
                  className="w-full border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Contact Email *
                </label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Enter contact email"
                  className="w-full border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Website URL
                </label>
                <Input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full border-gray-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Currency *
                </label>
                <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-full border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_RATES).map(([code, rate]) => (
                      <SelectItem key={code} value={code}>
                        {rate.name} ({rate.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => {
                  if (orgName && contactEmail && selectedCurrency) {
                    setCurrentStep('subscription-plan');
                  } else {
                    alert('Please fill in all required fields');
                  }
                }}
                className="w-full bg-secondary hover:bg-secondary/90 text-white"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Subscription Plan */}
          {currentStep === 'subscription-plan' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Choose Your Plan</h2>

              <div className="grid gap-4">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan._id}
                    onClick={() => setSelectedPlanId(plan._id || '')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedPlanId === plan._id
                        ? 'border-secondary bg-secondary/5'
                        : 'border-gray-200 hover:border-secondary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{plan.planName}</h3>
                        <p className="text-gray-600 text-sm mt-1">{plan.planDescription}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-secondary">{formatPrice(plan.pricePerMonth || 0)}</p>
                        <p className="text-gray-600 text-sm">/month</p>
                      </div>
                    </div>
                    {plan.features && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-700">{plan.features}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep('organisation-info')}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPlanId) {
                      handleCreateOrganisation();
                    } else {
                      alert('Please select a plan');
                    }
                  }}
                  disabled={isLoading || !selectedPlanId}
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
                >
                  {isLoading ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="space-y-6 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-semibold text-gray-900">Setup Complete!</h2>
              <p className="text-gray-600">
                Your organization has been successfully created. You're ready to start managing loans.
              </p>

              <div className="bg-secondary/5 p-4 rounded-lg border border-secondary/20">
                <p className="text-sm text-gray-600 mb-2">Organization Name:</p>
                <p className="font-semibold text-gray-900">{orgName}</p>
              </div>

              <Button
                onClick={handleCompleteSetup}
                className="w-full bg-secondary hover:bg-secondary/90 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
