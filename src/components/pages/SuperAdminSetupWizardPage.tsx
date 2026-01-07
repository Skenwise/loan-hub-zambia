import React, { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/services/BaseCrudService';
import { DemoManagementService } from '@/services/DemoManagementService';
import { Organizations, OrganisationSettings, SubscriptionPlans, StaffMembers } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type WizardStep = 'organisation' | 'subscription' | 'admin' | 'demo' | 'complete';

interface WizardData {
  organisationName: string;
  subscriptionPlanId: string;
  adminEmail: string;
  adminName: string;
  enableDemoMode: boolean;
}

export default function SuperAdminSetupWizardPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('organisation');
  const [loading, setLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlans[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState<WizardData>({
    organisationName: '',
    subscriptionPlanId: '',
    adminEmail: '',
    adminName: '',
    enableDemoMode: false,
  });

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      const { items } = await BaseCrudService.getAll<SubscriptionPlans>('subscriptionplans');
      setSubscriptionPlans(items.filter(p => p.isActive));
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      setError('Failed to load subscription plans');
    }
  };

  const handleNext = async () => {
    setError(null);

    if (step === 'organisation') {
      if (!wizardData.organisationName.trim()) {
        setError('Please enter an organisation name');
        return;
      }
      setStep('subscription');
    } else if (step === 'subscription') {
      if (!wizardData.subscriptionPlanId) {
        setError('Please select a subscription plan');
        return;
      }
      setStep('admin');
    } else if (step === 'admin') {
      if (!wizardData.adminEmail.trim() || !wizardData.adminName.trim()) {
        setError('Please enter admin email and name');
        return;
      }
      setStep('demo');
    } else if (step === 'demo') {
      setStep('complete');
      await completeSetup();
    }
  };

  const completeSetup = async () => {
    try {
      setLoading(true);

      // 1. Create organisation
      const organisationId = crypto.randomUUID();
      await BaseCrudService.create('organisations', {
        _id: organisationId,
        organizationName: wizardData.organisationName,
        subscriptionPlanId: wizardData.subscriptionPlanId,
        subscriptionPlanType: 'active',
        organizationStatus: 'ACTIVE',
        creationDate: new Date(),
        contactEmail: wizardData.adminEmail,
      });

      // 2. Create organisation settings
      await BaseCrudService.create('organisationsettings', {
        _id: organisationId,
        companyName: wizardData.organisationName,
        isDemoMode: wizardData.enableDemoMode,
      });

      // 3. Create admin staff member
      const adminId = crypto.randomUUID();
      await BaseCrudService.create('staffmembers', {
        _id: adminId,
        fullName: wizardData.adminName,
        email: wizardData.adminEmail,
        role: 'Organisation Admin',
        status: 'ACTIVE',
        employeeId: `ADMIN-${organisationId.slice(0, 8)}`,
      });

      // 4. Enable demo mode if selected
      if (wizardData.enableDemoMode) {
        await DemoManagementService.enableDemoMode(organisationId);
      }

      // Wait a moment for data to be written
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to admin dashboard
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error completing setup:', error);
      setError(`Failed to complete setup: ${error}`);
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'subscription') setStep('organisation');
    else if (step === 'admin') setStep('subscription');
    else if (step === 'demo') setStep('admin');
  };

  const stepTitles: Record<WizardStep, string> = {
    organisation: 'Create Organisation',
    subscription: 'Select Subscription Plan',
    admin: 'Create Admin User',
    demo: 'Demo Mode Settings',
    complete: 'Setup Complete',
  };

  const stepDescriptions: Record<WizardStep, string> = {
    organisation: 'Enter your organisation name to get started',
    subscription: 'Choose a subscription plan for your organisation',
    admin: 'Create the primary admin user for your organisation',
    demo: 'Configure demo mode for testing and development',
    complete: 'Your organisation is ready to use',
  };

  if (step === 'complete' && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Setup Complete!</h2>
            <p className="text-secondary-foreground">
              Your organisation has been created successfully. Redirecting to dashboard...
            </p>
          </div>
          <LoadingSpinner />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{stepTitles[step]}</h1>
          <p className="text-secondary-foreground">{stepDescriptions[step]}</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex gap-2">
          {(['organisation', 'subscription', 'admin', 'demo'] as const).map((s, idx) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                ['organisation', 'subscription', 'admin', 'demo'].indexOf(step) >= idx
                  ? 'bg-buttonbackground'
                  : 'bg-contentblockbackground'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {step === 'organisation' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName" className="text-foreground mb-2 block">
                  Organisation Name
                </Label>
                <Input
                  id="orgName"
                  placeholder="e.g., Acme Microfinance"
                  value={wizardData.organisationName}
                  onChange={(e) => setWizardData({ ...wizardData, organisationName: e.target.value })}
                  className="bg-primary border-contentblockbackground text-foreground"
                />
              </div>
            </div>
          )}

          {step === 'subscription' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan" className="text-foreground mb-2 block">
                  Subscription Plan
                </Label>
                <Select value={wizardData.subscriptionPlanId} onValueChange={(value) => setWizardData({ ...wizardData, subscriptionPlanId: value })}>
                  <SelectTrigger className="bg-primary border-contentblockbackground text-foreground">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map((plan) => (
                      <SelectItem key={plan._id} value={plan._id}>
                        {plan.planName} - ${plan.pricePerMonth}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 'admin' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminName" className="text-foreground mb-2 block">
                  Admin Full Name
                </Label>
                <Input
                  id="adminName"
                  placeholder="e.g., John Doe"
                  value={wizardData.adminName}
                  onChange={(e) => setWizardData({ ...wizardData, adminName: e.target.value })}
                  className="bg-primary border-contentblockbackground text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="adminEmail" className="text-foreground mb-2 block">
                  Admin Email
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="e.g., admin@acme.com"
                  value={wizardData.adminEmail}
                  onChange={(e) => setWizardData({ ...wizardData, adminEmail: e.target.value })}
                  className="bg-primary border-contentblockbackground text-foreground"
                />
              </div>
            </div>
          )}

          {step === 'demo' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900 mb-4">
                  Demo mode allows you to test the system with simulated transactions without affecting real data.
                </p>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="demoMode"
                    checked={wizardData.enableDemoMode}
                    onCheckedChange={(checked) => setWizardData({ ...wizardData, enableDemoMode: checked as boolean })}
                  />
                  <Label htmlFor="demoMode" className="text-foreground cursor-pointer">
                    Enable Demo Mode for this organisation
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-end">
          {step !== 'organisation' && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={loading}
            className="bg-buttonbackground hover:bg-blue-600 text-white"
          >
            {step === 'demo' ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
