/**
 * System Owner Settings Page
 * Global platform settings and organization management
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { useRoleStore } from '@/store/roleStore';
import { OrganisationService, SubscriptionService } from '@/services';
import { Organizations, SubscriptionPlans } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Building2, Settings, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SystemOwnerSettingsPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const { isSystemOwner } = useRoleStore();
  
  const [organisations, setOrganisations] = useState<Organizations[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlans[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organisations');

  useEffect(() => {
    const loadData = async () => {
      if (!isSystemOwner()) {
        return;
      }

      try {
        setIsLoading(true);
        // Load all organisations
        const orgs = await OrganisationService.getAllOrganisations();
        setOrganisations(orgs);

        // Load subscription plans
        const plans = await SubscriptionService.getAllPlans();
        setSubscriptionPlans(plans);
      } catch (error) {
        console.error('Error loading system settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isSystemOwner]);

  if (!isSystemOwner()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/70">
                You do not have permission to access system owner settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            System Owner Settings
          </h1>
          <p className="text-primary-foreground/70">
            Manage global platform settings, organizations, and subscription plans
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-primary-foreground/10 border border-primary-foreground/20">
              <TabsTrigger value="organisations" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organizations
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Subscriptions
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Organizations Tab */}
            <TabsContent value="organisations" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {organisations.map((org) => (
                  <motion.div
                    key={org._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-primary-foreground/20 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg text-primary-foreground flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-secondary" />
                          {org.organizationName}
                        </CardTitle>
                        <CardDescription className="text-primary-foreground/50">
                          Status: {org.organizationStatus}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-primary-foreground/70">Contact Email</p>
                          <p className="text-primary-foreground">{org.contactEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-primary-foreground/70">Subscription Plan</p>
                          <p className="text-primary-foreground">{org.subscriptionPlanType}</p>
                        </div>
                        <div className="pt-4 flex gap-2">
                          <Button size="sm" className="flex-1 bg-secondary text-primary hover:bg-secondary/90">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Manage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subscriptionPlans.map((plan) => (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                      <CardHeader>
                        <CardTitle className="text-lg text-primary-foreground">{plan.planName}</CardTitle>
                        <CardDescription className="text-primary-foreground/50">
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-primary-foreground/70">Price Per Month</p>
                          <p className="text-2xl font-bold text-secondary">ZMW {plan.pricePerMonth?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-primary-foreground/70">Description</p>
                          <p className="text-primary-foreground text-sm">{plan.planDescription}</p>
                        </div>
                        <Button size="sm" className="w-full bg-secondary text-primary hover:bg-secondary/90">
                          Edit Plan
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Platform Settings</CardTitle>
                  <CardDescription className="text-primary-foreground/50">
                    Configure global platform settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Platform Name</Label>
                    <Input 
                      defaultValue="LoanFlow Platform"
                      className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Support Email</Label>
                    <Input 
                      type="email"
                      defaultValue="support@loanflow.com"
                      className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Default Currency</Label>
                    <Input 
                      defaultValue="ZMW"
                      className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                  <Button className="w-full bg-secondary text-primary hover:bg-secondary/90">
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
