/**
 * Organization Admin Settings Page
 * Organization-level management and configuration
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useRoleStore } from '@/store/roleStore';
import { StaffService, LoanService } from '@/services';
import { StaffMembers, LoanProducts } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Users, Package, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrganisationAdminSettingsPage() {
  const { member } = useMember();
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
        setStaff(staffMembers || []);

        // Load loan products
        const products = await LoanService.getOrganisationLoanProducts(demoOrgId);
        setLoanProducts(products || []);
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
                  onClick={() => handleSetRole('ORGANISATION_ADMIN')}
                  className="w-full bg-secondary text-primary hover:bg-secondary/90 h-12 font-semibold"
                >
                  Organization Admin
                </Button>
                <p className="text-sm text-primary-foreground/70 text-center">
                  This page is for Organization Admins only. Manage staff and loan products.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (userRole !== 'ORGANISATION_ADMIN') {
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
                  You do not have permission to access organization admin settings.
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
            Organization Admin Settings
          </h1>
          <p className="text-primary-foreground/70">
            Manage staff members, loan products, and organization settings
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-primary-foreground/10 border-primary-foreground/20">
              <TabsTrigger value="staff" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Users className="w-4 h-4 mr-2" />
                Staff Members
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Package className="w-4 h-4 mr-2" />
                Loan Products
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : staff.length === 0 ? (
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardContent className="pt-6">
                    <p className="text-center text-primary-foreground/70">
                      No staff members found. Add staff to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {staff.map((member) => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-primary-foreground">{member.fullName}</h3>
                              <p className="text-sm text-primary-foreground/70 mt-1">{member.email}</p>
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-primary-foreground/70">Role</p>
                                  <p className="text-primary-foreground font-medium">{member.role}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-primary-foreground/70">Department</p>
                                  <p className="text-primary-foreground font-medium">{member.department}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-primary-foreground/70">Status</p>
                                  <p className="text-primary-foreground font-medium">{member.status}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-primary-foreground/70">Phone</p>
                                  <p className="text-primary-foreground font-medium">{member.phoneNumber}</p>
                                </div>
                              </div>
                            </div>
                            <Button className="bg-secondary text-primary hover:bg-secondary/90">
                              Edit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Loan Products Tab */}
            <TabsContent value="products" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : loanProducts.length === 0 ? (
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardContent className="pt-6">
                    <p className="text-center text-primary-foreground/70">
                      No loan products found. Create one to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loanProducts.map((product) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition">
                        <CardHeader>
                          <CardTitle className="text-lg text-primary-foreground">
                            {product.productName}
                          </CardTitle>
                          <CardDescription className="text-primary-foreground/50">
                            {product.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-primary-foreground/70">Interest Rate</p>
                              <p className="text-lg font-semibold text-secondary">{product.interestRate}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-primary-foreground/70">Processing Fee</p>
                              <p className="text-lg font-semibold text-secondary">{product.processingFee}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-primary-foreground/70">Min Amount</p>
                              <p className="text-primary-foreground font-medium">ZMW {product.minLoanAmount?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-primary-foreground/70">Max Amount</p>
                              <p className="text-primary-foreground font-medium">ZMW {product.maxLoanAmount?.toLocaleString()}</p>
                            </div>
                          </div>
                          <Button className="w-full bg-secondary text-primary hover:bg-secondary/90 mt-4">
                            Edit Product
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Organization Settings</CardTitle>
                  <CardDescription className="text-primary-foreground/50">
                    Configure organization-wide settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-foreground mb-4">KYC Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                        <span className="text-primary-foreground">Require ID Document</span>
                        <Button variant="outline" className="border-primary-foreground/20">Enable</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                        <span className="text-primary-foreground">Require Address Verification</span>
                        <Button variant="outline" className="border-primary-foreground/20">Enable</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                        <span className="text-primary-foreground">Require Credit Score</span>
                        <Button variant="outline" className="border-primary-foreground/20">Enable</Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-primary-foreground mb-4">Loan Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                        <span className="text-primary-foreground">Enable Collateral Requirement</span>
                        <Button variant="outline" className="border-primary-foreground/20">Enable</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                        <span className="text-primary-foreground">Enable Guarantor Requirement</span>
                        <Button variant="outline" className="border-primary-foreground/20">Enable</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
