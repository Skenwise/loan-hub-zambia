/**
 * Branch Manager Settings Page
 * Branch-level management and operations
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useRoleStore } from '@/store/roleStore';
import { StaffService, CustomerService } from '@/services';
import { StaffMembers, CustomerProfiles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Users, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BranchManagerSettingsPage() {
  const { member } = useMember();
  const { userRole, setUserRole } = useRoleStore();
  
  const [staff, setStaff] = useState<StaffMembers[]>([]);
  const [customers, setCustomers] = useState<CustomerProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('staff');
  const [showRoleSelector, setShowRoleSelector] = useState(!userRole);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load branch staff - use a default org for demo
        const demoOrgId = 'demo-org-001';
        const staffMembers = await StaffService.getOrganisationStaff(demoOrgId);
        setStaff(staffMembers || []);

        // Load branch customers
        const customerList = await CustomerService.getOrganisationCustomers(demoOrgId);
        setCustomers(customerList || []);
      } catch (error) {
        console.error('Error loading branch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSetRole = (role: 'BRANCH_MANAGER') => {
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
                  onClick={() => handleSetRole('BRANCH_MANAGER')}
                  className="w-full bg-secondary text-primary hover:bg-secondary/90 h-12 font-semibold"
                >
                  Branch Manager
                </Button>
                <p className="text-sm text-primary-foreground/70 text-center">
                  This page is for Branch Managers only. Manage branch operations and staff.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (userRole !== 'BRANCH_MANAGER') {
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
                  You do not have permission to access branch manager settings.
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
            Branch Manager Settings
          </h1>
          <p className="text-primary-foreground/70">
            Manage branch staff, customers, and performance metrics
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
                Staff
              </TabsTrigger>
              <TabsTrigger value="customers" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Users className="w-4 h-4 mr-2" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="metrics" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <BarChart3 className="w-4 h-4 mr-2" />
                Metrics
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
                      No staff members found in this branch.
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
                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-primary-foreground/70">Role</p>
                                  <p className="text-primary-foreground font-medium">{member.role}</p>
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
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : customers.length === 0 ? (
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardContent className="pt-6">
                    <p className="text-center text-primary-foreground/70">
                      No customers found in this branch.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customers.map((customer) => (
                    <motion.div
                      key={customer._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition">
                        <CardHeader>
                          <CardTitle className="text-lg text-primary-foreground">
                            {customer.firstName} {customer.lastName}
                          </CardTitle>
                          <CardDescription className="text-primary-foreground/50">
                            {customer.emailAddress}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-primary-foreground/70">KYC Status</p>
                              <p className="text-primary-foreground font-medium">{customer.kycVerificationStatus}</p>
                            </div>
                            <div>
                              <p className="text-xs text-primary-foreground/70">Credit Score</p>
                              <p className="text-primary-foreground font-medium">{customer.creditScore || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-primary-foreground/70">Phone</p>
                            <p className="text-primary-foreground font-medium">{customer.phoneNumber}</p>
                          </div>
                          <Button className="w-full bg-secondary text-primary hover:bg-secondary/90 mt-4">
                            View Profile
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                    <CardHeader>
                      <CardTitle className="text-sm text-primary-foreground/70">Total Staff</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-secondary">{staff.length}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                    <CardHeader>
                      <CardTitle className="text-sm text-primary-foreground/70">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-secondary">{customers.length}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                    <CardHeader>
                      <CardTitle className="text-sm text-primary-foreground/70">KYC Verified</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-secondary">
                        {customers.filter(c => c.kycVerificationStatus === 'APPROVED').length}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Branch Performance</CardTitle>
                  <CardDescription className="text-primary-foreground/50">
                    Key performance indicators for this branch
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                      <span className="text-primary-foreground">Active Loans</span>
                      <span className="text-lg font-semibold text-secondary">0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                      <span className="text-primary-foreground">Total Loan Portfolio</span>
                      <span className="text-lg font-semibold text-secondary">ZMW 0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                      <span className="text-primary-foreground">Repayment Rate</span>
                      <span className="text-lg font-semibold text-secondary">0%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                      <span className="text-primary-foreground">Default Rate</span>
                      <span className="text-lg font-semibold text-secondary">0%</span>
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
