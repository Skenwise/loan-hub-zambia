/**
 * Organisation Admin Settings Page
 * Organization-level settings and management
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { useRoleStore } from '@/store/roleStore';
import { StaffService, LoanService } from '@/services';
import { StaffMembers, LoanProducts } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Users, Settings, Package, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrganisationAdminSettingsPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const { userRole, setUserRole } = useRoleStore();
  
  const [staff, setStaff] = useState<StaffMembers[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('staff');
  const [showRoleSelector, setShowRoleSelector] = useState(!userRole);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load staff members - use a default org for demo
        const demoOrgId = 'demo-org-001';
        const staffMembers = await StaffService.getOrganisationStaff(demoOrgId);
        setStaff(staffMembers);

        // Load loan products
        const products = await LoanService.getOrganisationLoanProducts(demoOrgId);
        setLoanProducts(products);
      } catch (error) {
        console.error('Error loading organisation settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSetRole = (role: 'ORGANISATION_ADMIN') => {
    setUserRole(role);
    setShowRoleSelector(false);
  };

  if (showRoleSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Select Your Role</CardTitle>
              <CardDescription className="text-primary-foreground/50">
                Choose a role to access this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleSetRole('ORGANISATION_ADMIN')}
                className="w-full bg-secondary text-primary hover:bg-secondary/90 h-12"
              >
                Organization Admin
              </Button>
              <p className="text-sm text-primary-foreground/70 text-center">
                This page is for Organization Admins only
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole !== 'ORGANISATION_ADMIN') {
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
              <p className="text-primary-foreground/70 mb-4">
                You do not have permission to access organization admin settings.
              </p>
              <Button
                onClick={() => setShowRoleSelector(true)}
                variant="outline"
              >
                Change Role
              </Button>
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
            Organization Settings
          </h1>
          <p className="text-primary-foreground/70">
            Manage {currentOrganisation?.organizationName} organization settings
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-primary-foreground/10 border border-primary-foreground/20">
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Loan Products
              </TabsTrigger>
              <TabsTrigger value="kyc" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                KYC Settings
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Staff Tab */}
            <TabsContent value="staff" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button className="bg-secondary text-primary hover:bg-secondary/90">
                    Add Staff Member
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {staff.map((member) => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                        <CardHeader>
                          <CardTitle className="text-lg text-primary-foreground">{member.fullName}</CardTitle>
                          <CardDescription className="text-primary-foreground/50">
                            {member.role} • {member.department}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-primary-foreground/70">Email</p>
                            <p className="text-primary-foreground text-sm">{member.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-primary-foreground/70">Status</p>
                            <p className="text-primary-foreground text-sm">{member.status}</p>
                          </div>
                          <div className="pt-4 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              Deactivate
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Loan Products Tab */}
            <TabsContent value="products" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button className="bg-secondary text-primary hover:bg-secondary/90">
                    Add Loan Product
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loanProducts.map((product) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                        <CardHeader>
                          <CardTitle className="text-lg text-primary-foreground">{product.productName}</CardTitle>
                          <CardDescription className="text-primary-foreground/50">
                            {product.productType}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-primary-foreground/70">Interest Rate</p>
                              <p className="text-lg font-semibold text-secondary">{product.interestRate}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-primary-foreground/70">Term (Months)</p>
                              <p className="text-lg font-semibold text-primary-foreground">{product.loanTermMonths}</p>
                            </div>
                          </div>
                          <div className="pt-4 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              {product.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* KYC Settings Tab */}
            <TabsContent value="kyc" className="mt-6">
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">KYC Verification Settings</CardTitle>
                  <CardDescription className="text-primary-foreground/50">
                    Configure KYC requirements for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Required Documents</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-primary-foreground">National ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-primary-foreground">Proof of Address</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-primary-foreground">Bank Statement</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Minimum Credit Score</Label>
                    <Input 
                      type="number"
                      defaultValue="300"
                      className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                  <Button className="w-full bg-secondary text-primary hover:bg-secondary/90">
                    Save KYC Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Organization Settings</CardTitle>
                  <CardDescription className="text-primary-foreground/50">
                    Configure organization-level settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Organization Name</Label>
                    <Input 
                      defaultValue={currentOrganisation?.organizationName}
                      className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Contact Email</Label>
                    <Input 
                      type="email"
                      defaultValue={currentOrganisation?.contactEmail}
                      className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Website URL</Label>
                    <Input 
                      type="url"
                      defaultValue={currentOrganisation?.websiteUrl}
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
