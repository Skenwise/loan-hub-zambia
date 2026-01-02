/**
 * System Owner Settings Page
 * Global platform settings and organization management
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useRoleStore } from '@/store/roleStore';
import { OrganisationService, SubscriptionService } from '@/services';
import { Organizations, SubscriptionPlans } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Building2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SystemOwnerSettingsPage() {
  const { member } = useMember();
  const { userRole, setUserRole } = useRoleStore();
  
  const [organisations, setOrganisations] = useState<Organizations[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlans[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organisations');
  const [showRoleSelector, setShowRoleSelector] = useState(!userRole);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load all organisations
        const orgs = await OrganisationService.getAllOrganisations();
        setOrganisations(orgs || []);

        // Load subscription plans
        const plans = await SubscriptionService.getAllPlans();
        setSubscriptionPlans(plans || []);
      } catch (error) {
        console.error('Error loading system settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSetRole = (role: 'SYSTEM_OWNER') => {
    setUserRole(role);
    setShowRoleSelector(false);
  };

  if (showRoleSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-primary-foreground/5 border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="text-primary-foreground">Select Your Role</CardTitle>
                <CardDescription className="text-primary-foreground/50">
                  Choose a role to access this page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleSetRole('SYSTEM_OWNER')}
                  className="w-full bg-secondary text-primary hover:bg-secondary/90 h-12 font-semibold"
                >
                  System Owner
                </Button>
                <p className="text-sm text-primary-foreground/70 text-center">
                  This page is for System Owners only. You have full access to all organizations and settings.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (userRole !== 'SYSTEM_OWNER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-red-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Access Denied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/70 mb-4">
                  You do not have permission to access system owner settings. Only System Owners can view this page.
                </p>
                <Button
                  onClick={() => setShowRoleSelector(true)}
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Change Role
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
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
            <TabsList className="bg-primary-foreground/10 border-primary-foreground/20">
              <TabsTrigger value="organisations" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Building2 className="w-4 h-4 mr-2" />
                Organizations
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <TrendingUp className="w-4 h-4 mr-2" />
                Subscriptions
              </TabsTrigger>
            </TabsList>

            {/* Organizations Tab */}
            <TabsContent value="organisations" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : organisations.length === 0 ? (
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardContent className="pt-6">
                    <p className="text-center text-primary-foreground/70">
                      No organizations found. Create one to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organisations.map((org) => (
                    <motion.div
                      key={org._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition">
                        <CardHeader>
                          <CardTitle className="text-lg text-primary-foreground flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-secondary" />
                            {org.organizationName}
                          </CardTitle>
                          <CardDescription className="text-primary-foreground/50">
                            {org.organizationStatus}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-primary-foreground/70">Contact Email</p>
                            <p className="text-primary-foreground font-medium">{org.contactEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm text-primary-foreground/70">Subscription Plan</p>
                            <p className="text-primary-foreground font-medium">{org.subscriptionPlanType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-primary-foreground/70">Created</p>
                            <p className="text-primary-foreground font-medium">
                              {org.creationDate ? new Date(org.creationDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <Button className="w-full bg-secondary text-primary hover:bg-secondary/90 mt-4">
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : subscriptionPlans.length === 0 ? (
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardContent className="pt-6">
                    <p className="text-center text-primary-foreground/70">
                      No subscription plans found.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscriptionPlans.map((plan) => (
                    <motion.div
                      key={plan._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition relative">
                        {plan.isActive && (
                          <div className="absolute top-4 right-4">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg text-primary-foreground">
                            {plan.planName}
                          </CardTitle>
                          <CardDescription className="text-primary-foreground/50">
                            {plan.planDescription}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-3xl font-bold text-secondary">
                              ZMW {plan.pricePerMonth?.toLocaleString()}
                            </p>
                            <p className="text-sm text-primary-foreground/70">per month</p>
                          </div>
                          <div>
                            <p className="text-sm text-primary-foreground/70 mb-2">Features</p>
                            <p className="text-primary-foreground text-sm">{plan.features}</p>
                          </div>
                          <div>
                            <p className="text-sm text-primary-foreground/70 mb-2">Usage Limits</p>
                            <p className="text-primary-foreground text-sm">{plan.usageLimits}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
