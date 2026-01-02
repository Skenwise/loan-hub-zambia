/**
 * Branch Manager Settings Page
 * Branch-level management and operations
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { useRoleStore } from '@/store/roleStore';
import { StaffService, CustomerService } from '@/services';
import { StaffMembers, CustomerProfiles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Users, Settings, UserCheck, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BranchManagerSettingsPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
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
        setStaff(staffMembers);

        // Load branch customers
        const customerList = await CustomerService.getOrganisationCustomers(demoOrgId);
        setCustomers(customerList);
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
                className="w-full bg-secondary text-primary hover:bg-secondary/90 h-12"
              >
                Branch Manager
              </Button>
              <p className="text-sm text-primary-foreground/70 text-center">
                This page is for Branch Managers only
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole !== 'BRANCH_MANAGER') {
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
                You do not have permission to access branch manager settings.
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
            Branch Management
          </h1>
          <p className="text-primary-foreground/70">
            Manage branch operations and staff
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
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance
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
                            <p className="text-sm text-primary-foreground/70">Phone</p>
                            <p className="text-primary-foreground text-sm">{member.phoneNumber}</p>
                          </div>
                          <div className="pt-4 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              View Performance
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button className="bg-secondary text-primary hover:bg-secondary/90">
                    Register Customer
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customers.map((customer) => (
                    <motion.div
                      key={customer._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                        <CardHeader>
                          <CardTitle className="text-lg text-primary-foreground">
                            {customer.firstName} {customer.lastName}
                          </CardTitle>
                          <CardDescription className="text-primary-foreground/50">
                            KYC: {customer.kycVerificationStatus}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-primary-foreground/70">Email</p>
                            <p className="text-primary-foreground text-sm">{customer.emailAddress}</p>
                          </div>
                          <div>
                            <p className="text-sm text-primary-foreground/70">Credit Score</p>
                            <p className="text-primary-foreground text-sm">{customer.creditScore || 'N/A'}</p>
                          </div>
                          <div className="pt-4 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              View Profile
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              View Loans
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardHeader>
                    <CardTitle className="text-primary-foreground">Branch Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-primary-foreground/70">Total Loans Disbursed</p>
                      <p className="text-3xl font-bold text-secondary">0</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Total Portfolio Value</p>
                      <p className="text-3xl font-bold text-secondary">ZMW 0</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Default Rate</p>
                      <p className="text-3xl font-bold text-secondary">0%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardHeader>
                    <CardTitle className="text-primary-foreground">Staff Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-primary-foreground/70">Active Staff Members</p>
                      <p className="text-3xl font-bold text-secondary">{staff.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Registered Customers</p>
                      <p className="text-3xl font-bold text-secondary">{customers.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Avg. Loans per Staff</p>
                      <p className="text-3xl font-bold text-secondary">0</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Branch Settings</CardTitle>
                  <CardDescription className="text-primary-foreground/50">
                    Configure branch-level settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Branch Name</Label>
                    <Input 
                      defaultValue="Main Branch"
                      className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Branch Manager</Label>
                    <Input 
                      defaultValue={member?.profile?.nickname || 'Branch Manager'}
                      className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary-foreground">Contact Email</Label>
                    <Input 
                      type="email"
                      defaultValue={member?.loginEmail}
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
