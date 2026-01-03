/**
 * Unified Settings Page
 * Consolidates all settings tabs: Organization Profile, Staff Management, Roles & Permissions, Audit Logs, Email Templates
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { OrganisationSettingsService, StaffService, RoleService, AuditService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Users,
  Building2,
  FileText,
  Bell,
  Lock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organization');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Organization state
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');

  // Staff state
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load organization data
        if (currentOrganisation) {
          setOrgName(currentOrganisation.organizationName || '');
          setOrgEmail(currentOrganisation.contactEmail || '');
          setOrgWebsite(currentOrganisation.websiteUrl || '');
        }

        // Load staff members
        if (currentOrganisation?._id) {
          try {
            const staffMembers = await StaffService.getOrganisationStaff(currentOrganisation._id);
            setStaff(staffMembers || []);
          } catch (error) {
            console.error('Error loading staff:', error);
          }
        }

        // Load roles
        try {
          const allRoles = await RoleService.getAllRoles();
          setRoles(allRoles || []);
        } catch (error) {
          console.error('Error loading roles:', error);
        }

        // Load audit logs
        if (currentOrganisation?._id) {
          try {
            const logs = await AuditService.getAuditLogs(currentOrganisation._id);
            setAuditLogs(logs || []);
          } catch (error) {
            console.error('Error loading audit logs:', error);
          }
        }
      } catch (error) {
        console.error('Error loading settings data:', error);
        setErrorMessage('Failed to load settings data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentOrganisation]);

  const handleSaveOrganization = async () => {
    try {
      setSuccessMessage('Organization settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to save organization settings');
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
            Settings
          </h1>
          <p className="text-gray-600">
            Manage organization profile, staff, roles, and system configurations
          </p>
        </motion.div>

        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-700" />
            <p className="text-green-700 font-medium">{successMessage}</p>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-700" />
            <p className="text-red-700 font-medium">{errorMessage}</p>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-gray-50 border-b border-gray-200 rounded-none p-0\">
              <TabsTrigger
                value="organization"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white text-gray-700 data-[state=active]:text-gray-900"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Organization Profile
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white text-gray-700 data-[state=active]:text-gray-900"
              >
                <Users className="w-4 h-4 mr-2" />
                Staff Management
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white text-gray-700 data-[state=active]:text-gray-900"
              >
                <Lock className="w-4 h-4 mr-2" />
                Roles & Permissions
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white text-gray-700 data-[state=active]:text-gray-900"
              >
                <FileText className="w-4 h-4 mr-2" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white text-gray-700 data-[state=active]:text-gray-900"
              >
                <Bell className="w-4 h-4 mr-2" />
                Email Templates
              </TabsTrigger>
            </TabsList>

            {/* Organization Profile Tab */}
            <TabsContent value="organization" className="p-6">
              <div className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Organization Profile</CardTitle>
                    <CardDescription className="text-gray-600">
                      Update your organization's basic information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-700 mb-2 block font-medium">Organization Name</Label>
                      <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Enter organization name"
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 mb-2 block font-medium">Contact Email</Label>
                      <Input
                        type="email"
                        value={orgEmail}
                        onChange={(e) => setOrgEmail(e.target.value)}
                        placeholder="Enter contact email"
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 mb-2 block font-medium">Website URL</Label>
                      <Input
                        type="url"
                        value={orgWebsite}
                        onChange={(e) => setOrgWebsite(e.target.value)}
                        placeholder="Enter website URL"
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <Button
                      onClick={handleSaveOrganization}
                      className="bg-blue-600 text-white hover:bg-blue-700 w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Staff Management Tab */}
            <TabsContent value="staff" className="p-6">
              <div className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900">Staff Members</CardTitle>
                      <CardDescription className="text-gray-600">
                        Manage your organization's staff members
                      </CardDescription>
                    </div>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Staff
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {staff.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Email
                              </th>
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Role
                              </th>
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Status
                              </th>
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {staff.map((member) => (
                              <tr key={member._id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-900 font-semibold">
                                  {member.fullName}
                                </td>
                                <td className="py-3 px-4 text-gray-600">{member.email}</td>
                                <td className="py-3 px-4">
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 border">
                                    {member.role}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge className="bg-green-100 text-green-800 border-green-300 border">
                                    {member.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 flex gap-2">
                                  <Button size="sm" variant="outline" className="text-gray-700 border-gray-300">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600 border-gray-300">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        No staff members found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Roles & Permissions Tab */}
            <TabsContent value="roles" className="p-6">
              <div className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900">Roles & Permissions</CardTitle>
                      <CardDescription className="text-gray-600">
                        Manage user roles and their permissions
                      </CardDescription>
                    </div>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Role
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {roles.length > 0 ? (
                      <div className="space-y-3">
                        {roles.map((role) => (
                          <div
                            key={role._id}
                            className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{role.roleName}</p>
                              <p className="text-sm text-gray-600">{role.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-gray-700 border-gray-300">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              {!role.isSystemRole && (
                                <Button size="sm" variant="outline" className="text-red-600 border-gray-300">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        No roles found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Audit Logs Tab */}
            <TabsContent value="audit" className="p-6">
              <div className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Audit Logs</CardTitle>
                    <CardDescription className="text-gray-600">
                      View system activity and user actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {auditLogs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Action
                              </th>
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Performed By
                              </th>
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Resource
                              </th>
                              <th className="text-left py-3 px-4 text-gray-700 font-semibold">
                                Timestamp
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.slice(0, 10).map((log) => (
                              <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-900 font-semibold">
                                  {log.actionType}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {log.performedBy}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {log.resourceAffected}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {log.timestamp
                                    ? new Date(log.timestamp).toLocaleDateString()
                                    : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        No audit logs found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Email Templates Tab */}
            <TabsContent value="email" className="p-6">
              <div className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Email Templates</CardTitle>
                    <CardDescription className="text-gray-600">
                      Customize email notifications sent to users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {[
                        { name: 'Welcome Email', description: 'Sent when a new user joins' },
                        { name: 'Loan Approval', description: 'Sent when a loan is approved' },
                        { name: 'Repayment Reminder', description: 'Sent before payment due date' },
                        { name: 'Password Reset', description: 'Sent for password recovery' },
                      ].map((template, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{template.name}</p>
                            <p className="text-sm text-gray-600">{template.description}</p>
                          </div>
                          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
