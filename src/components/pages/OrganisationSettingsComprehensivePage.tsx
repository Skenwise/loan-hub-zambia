/**
 * Organisation Settings - Comprehensive Page
 * Manages all organisation-level configurations
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { OrganisationSettingsService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Users,
  Building2,
  FileText,
  Bell,
  Lock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function OrganisationSettingsComprehensivePage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  // Staff state
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    role: '',
    branch: '',
    approvalLimit: 100000,
  });

  // Branches state
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({
    branchName: '',
    branchCode: '',
    branchManager: '',
    location: '',
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!currentOrganisation?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load profile
        const profileData = await OrganisationSettingsService.getOrganisationProfile(
          currentOrganisation._id
        );
        setProfile(profileData);

        // Load staff
        const staffData = await OrganisationSettingsService.getStaffMembers(
          currentOrganisation._id
        );
        setStaff(staffData);

        // Load branches
        const branchesData = await OrganisationSettingsService.getBranches(
          currentOrganisation._id
        );
        setBranches(branchesData);
      } catch (error) {
        console.error('Error loading settings:', error);
        setErrorMessage('Failed to load organisation settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentOrganisation]);

  const handleAddStaff = async () => {
    try {
      if (!newStaff.fullName || !newStaff.email || !newStaff.role) {
        setErrorMessage('Please fill in all required fields');
        return;
      }

      const staffMember = await OrganisationSettingsService.addStaffMember(
        currentOrganisation?._id || '',
        {
          ...newStaff,
          status: 'ACTIVE',
          dateHired: new Date(),
          accessLevel: 'STANDARD',
        }
      );

      setStaff([...staff, staffMember]);
      setNewStaff({
        fullName: '',
        email: '',
        role: '',
        branch: '',
        approvalLimit: 100000,
      });
      setShowAddStaff(false);
      setSuccessMessage('Staff member added successfully');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to add staff member');
    }
  };

  const handleAddBranch = async () => {
    try {
      if (!newBranch.branchName || !newBranch.branchCode) {
        setErrorMessage('Please fill in all required fields');
        return;
      }

      const branch = await OrganisationSettingsService.createBranch(
        currentOrganisation?._id || '',
        {
          ...newBranch,
          isActive: true,
        }
      );

      setBranches([...branches, branch]);
      setNewBranch({
        branchName: '',
        branchCode: '',
        branchManager: '',
        location: '',
      });
      setShowAddBranch(false);
      setSuccessMessage('Branch created successfully');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create branch');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Organisation Settings
          </h1>
          <p className="text-primary-foreground/70">
            Manage your organisation profile, staff, branches, and configurations
          </p>
        </motion.div>

        {/* Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-600">{successMessage}</p>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600">{errorMessage}</p>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-200 mb-8">
              <TabsTrigger value="profile" className="text-slate-900 text-xs md:text-sm">
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="staff" className="text-slate-900 text-xs md:text-sm">
                <Users className="w-4 h-4 mr-2" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="branches" className="text-slate-900 text-xs md:text-sm">
                <Building2 className="w-4 h-4 mr-2" />
                Branches
              </TabsTrigger>
              <TabsTrigger value="products" className="text-slate-900 text-xs md:text-sm">
                <FileText className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="subscription" className="text-slate-900 text-xs md:text-sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Subscription
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {profile && (
                <Card className="bg-slate-50 border-slate-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900">Organisation Profile</CardTitle>
                      <Button
                        onClick={() => setEditingProfile(!editingProfile)}
                        variant="outline"
                        className="border-slate-300 text-slate-900 hover:bg-slate-100"
                      >
                        {editingProfile ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Organisation Name
                        </Label>
                        <Input
                          value={profile.organizationName}
                          onChange={(e) =>
                            setProfile({ ...profile, organizationName: e.target.value })
                          }
                          disabled={!editingProfile}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Contact Email
                        </Label>
                        <Input
                          value={profile.contactEmail}
                          onChange={(e) =>
                            setProfile({ ...profile, contactEmail: e.target.value })
                          }
                          disabled={!editingProfile}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Financial Year Start
                        </Label>
                        <Input
                          value={profile.financialYearStart}
                          onChange={(e) =>
                            setProfile({ ...profile, financialYearStart: e.target.value })
                          }
                          disabled={!editingProfile}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          placeholder="MM-DD"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Financial Year End
                        </Label>
                        <Input
                          value={profile.financialYearEnd}
                          onChange={(e) =>
                            setProfile({ ...profile, financialYearEnd: e.target.value })
                          }
                          disabled={!editingProfile}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          placeholder="MM-DD"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Default Currency
                        </Label>
                        <Input
                          value={profile.defaultCurrency}
                          onChange={(e) =>
                            setProfile({ ...profile, defaultCurrency: e.target.value })
                          }
                          disabled={!editingProfile}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Time Zone</Label>
                        <Input
                          value={profile.timeZone}
                          onChange={(e) =>
                            setProfile({ ...profile, timeZone: e.target.value })
                          }
                          disabled={!editingProfile}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                        />
                      </div>
                    </div>

                    {editingProfile && (
                      <div className="flex gap-3 justify-end pt-4 border-t border-slate-300">
                        <Button
                          onClick={() => setEditingProfile(false)}
                          variant="outline"
                          className="border-slate-300 text-slate-900 hover:bg-slate-100"
                        >
                          Cancel
                        </Button>
                        <Button className="bg-blue-600 text-white hover:bg-blue-700">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Staff Members</h2>
                <Button
                  onClick={() => setShowAddStaff(!showAddStaff)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              </div>

              {showAddStaff && (
                <Card className="bg-slate-50 border-slate-300">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Add New Staff Member</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Full Name *</Label>
                        <Input
                          value={newStaff.fullName}
                          onChange={(e) =>
                            setNewStaff({ ...newStaff, fullName: e.target.value })
                          }
                          className="bg-white border-slate-300 text-slate-900"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Email *</Label>
                        <Input
                          type="email"
                          value={newStaff.email}
                          onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                          className="bg-white border-slate-300 text-slate-900"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Role *</Label>
                        <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}>
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Loan Officer">Loan Officer</SelectItem>
                            <SelectItem value="Credit Manager">Credit Manager</SelectItem>
                            <SelectItem value="Finance Officer">Finance Officer</SelectItem>
                            <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Branch</Label>
                        <Input
                          value={newStaff.branch}
                          onChange={(e) =>
                            setNewStaff({ ...newStaff, branch: e.target.value })
                          }
                          className="bg-white border-slate-300 text-slate-900"
                          placeholder="Head Office"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Approval Limit (ZMW)
                        </Label>
                        <Input
                          type="number"
                          value={newStaff.approvalLimit}
                          onChange={(e) =>
                            setNewStaff({ ...newStaff, approvalLimit: parseInt(e.target.value) })
                          }
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-300">
                      <Button
                        onClick={() => setShowAddStaff(false)}
                        variant="outline"
                        className="border-slate-300 text-slate-900 hover:bg-slate-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddStaff}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Staff Member
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Staff List */}
              <div className="space-y-4">
                {staff.map((member, idx) => (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-slate-50 border-slate-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900">
                              {member.fullName}
                            </h3>
                            <p className="text-slate-600 text-sm mt-1">{member.email}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300 border text-xs">
                                {member.role}
                              </Badge>
                              <Badge className="bg-green-100 text-green-700 border-green-300 border text-xs">
                                {member.status}
                              </Badge>
                              {member.branch && (
                                <Badge className="bg-slate-200 text-slate-700 border-slate-300 border text-xs">
                                  {member.branch}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-2">
                              Approval Limit: ZMW {member.approvalLimit?.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="border-slate-300 text-slate-900 hover:bg-slate-100"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Branches Tab */}
            <TabsContent value="branches" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Branches</h2>
                <Button
                  onClick={() => setShowAddBranch(!showAddBranch)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Branch
                </Button>
              </div>

              {showAddBranch && (
                <Card className="bg-slate-50 border-slate-300">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Create New Branch</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Branch Name *
                        </Label>
                        <Input
                          value={newBranch.branchName}
                          onChange={(e) =>
                            setNewBranch({ ...newBranch, branchName: e.target.value })
                          }
                          className="bg-white border-slate-300 text-slate-900"
                          placeholder="Head Office"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Branch Code *
                        </Label>
                        <Input
                          value={newBranch.branchCode}
                          onChange={(e) =>
                            setNewBranch({ ...newBranch, branchCode: e.target.value })
                          }
                          className="bg-white border-slate-300 text-slate-900"
                          placeholder="HO-001"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Branch Manager
                        </Label>
                        <Input
                          value={newBranch.branchManager}
                          onChange={(e) =>
                            setNewBranch({ ...newBranch, branchManager: e.target.value })
                          }
                          className="bg-white border-slate-300 text-slate-900"
                          placeholder="Manager name"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Location</Label>
                        <Input
                          value={newBranch.location}
                          onChange={(e) =>
                            setNewBranch({ ...newBranch, location: e.target.value })
                          }
                          className="bg-white border-slate-300 text-slate-900"
                          placeholder="Lusaka"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-300">
                      <Button
                        onClick={() => setShowAddBranch(false)}
                        variant="outline"
                        className="border-slate-300 text-slate-900 hover:bg-slate-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddBranch}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Branch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Branches List */}
              {branches.length > 0 ? (
                <div className="space-y-4">
                  {branches.map((branch, idx) => (
                    <motion.div
                      key={branch._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="bg-slate-50 border-slate-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                {branch.branchName}
                              </h3>
                              <p className="text-slate-600 text-sm mt-1">{branch.location}</p>
                              <div className="flex items-center gap-2 mt-3">
                                <Badge className="bg-slate-200 text-slate-700 border-slate-300 border text-xs">
                                  {branch.branchCode}
                                </Badge>
                                {branch.branchManager && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-300 border text-xs">
                                    Manager: {branch.branchManager}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="border-slate-300 text-slate-900 hover:bg-slate-100"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-50 border-slate-300">
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No Branches Yet
                    </h3>
                    <p className="text-slate-600">
                      Create your first branch to get started
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Loan Products</CardTitle>
                  <CardDescription className="text-slate-600">
                    Manage loan products and their settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Loan product management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Subscription & Billing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white border border-slate-300">
                      <p className="text-xs text-slate-600 mb-1">Current Plan</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {profile?.subscriptionPlanType || 'BASIC'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white border border-slate-300">
                      <p className="text-xs text-slate-600 mb-1">Active Users</p>
                      <p className="text-2xl font-bold text-slate-900">5 / 10</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white border border-slate-300">
                      <p className="text-xs text-slate-600 mb-1">Next Billing</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-300">
                    <h3 className="font-semibold text-blue-900 mb-2">Modules Enabled</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Loans', 'Repayments', 'Reports', 'KYC', 'Compliance'].map((module) => (
                        <Badge
                          key={module}
                          className="bg-blue-100 text-blue-700 border-blue-300 border"
                        >
                          {module}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-300">
                    <Button
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      View Payment History
                    </Button>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      Upgrade Plan
                    </Button>
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
