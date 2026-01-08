/**
 * Roles & Permissions Management Page
 * Comprehensive role-based permissions with checkboxes for system access control
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { BaseCrudService, AuditService, RoleService } from '@/services';
import { Roles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Permission categories and their permissions
const PERMISSION_CATEGORIES = [
  {
    category: 'Core Access',
    permissions: [
      { id: 'dashboard_access', label: 'Dashboard Access' },
      { id: 'login_access', label: 'Login Access' },
      { id: 'profile_access', label: 'Profile Access' },
    ],
  },
  {
    category: 'SMS Management',
    permissions: [
      { id: 'sms_send', label: 'Send SMS' },
      { id: 'sms_templates', label: 'Manage SMS Templates' },
      { id: 'sms_logs', label: 'View SMS Logs' },
    ],
  },
  {
    category: 'Email Management',
    permissions: [
      { id: 'email_send', label: 'Send Email' },
      { id: 'email_templates', label: 'Manage Email Templates' },
      { id: 'email_logs', label: 'View Email Logs' },
    ],
  },
  {
    category: 'System & Admin Settings',
    permissions: [
      { id: 'system_settings', label: 'System Settings' },
      { id: 'admin_settings', label: 'Admin Settings' },
      { id: 'user_management', label: 'User Management' },
      { id: 'audit_logs', label: 'View Audit Logs' },
    ],
  },
  {
    category: 'Master Data & Configuration',
    permissions: [
      { id: 'branches_manage', label: 'Manage Branches' },
      { id: 'departments_manage', label: 'Manage Departments' },
      { id: 'loan_products', label: 'Manage Loan Products' },
      { id: 'savings_products', label: 'Manage Savings Products' },
    ],
  },
  {
    category: 'Staff & Security',
    permissions: [
      { id: 'staff_manage', label: 'Manage Staff' },
      { id: 'roles_permissions', label: 'Manage Roles & Permissions' },
      { id: 'staff_approval_limits', label: 'Set Approval Limits' },
      { id: 'password_reset', label: 'Reset User Passwords' },
    ],
  },
  {
    category: 'Borrowers Management',
    permissions: [
      { id: 'customers_view', label: 'View Customers' },
      { id: 'customers_create', label: 'Create Customers' },
      { id: 'customers_edit', label: 'Edit Customers' },
      { id: 'customers_delete', label: 'Delete Customers' },
      { id: 'kyc_manage', label: 'Manage KYC' },
    ],
  },
  {
    category: 'Loans Management',
    permissions: [
      { id: 'loans_view', label: 'View Loans' },
      { id: 'loans_create', label: 'Create Loans' },
      { id: 'loans_approve', label: 'Approve Loans' },
      { id: 'loans_disburse', label: 'Disburse Loans' },
      { id: 'loans_edit', label: 'Edit Loans' },
    ],
  },
  {
    category: 'Loan Schedules',
    permissions: [
      { id: 'schedules_view', label: 'View Loan Schedules' },
      { id: 'schedules_generate', label: 'Generate Schedules' },
      { id: 'schedules_edit', label: 'Edit Schedules' },
    ],
  },
  {
    category: 'Repayments',
    permissions: [
      { id: 'repayments_view', label: 'View Repayments' },
      { id: 'repayments_record', label: 'Record Repayments' },
      { id: 'repayments_approve', label: 'Approve Repayments' },
      { id: 'repayments_reverse', label: 'Reverse Repayments' },
    ],
  },
  {
    category: 'Collections & Monitoring',
    permissions: [
      { id: 'collections_view', label: 'View Collections' },
      { id: 'collections_manage', label: 'Manage Collections' },
      { id: 'arrears_view', label: 'View Arrears' },
      { id: 'write_off_manage', label: 'Manage Write-offs' },
    ],
  },
  {
    category: 'Savings',
    permissions: [
      { id: 'savings_view', label: 'View Savings' },
      { id: 'savings_create', label: 'Create Savings' },
      { id: 'savings_transactions', label: 'Record Transactions' },
      { id: 'savings_approve', label: 'Approve Transactions' },
    ],
  },
  {
    category: 'Investors',
    permissions: [
      { id: 'investors_view', label: 'View Investors' },
      { id: 'investors_manage', label: 'Manage Investors' },
      { id: 'investor_transactions', label: 'Manage Transactions' },
    ],
  },
  {
    category: 'Accounting',
    permissions: [
      { id: 'journals_view', label: 'View Journals' },
      { id: 'journals_create', label: 'Create Journals' },
      { id: 'journals_approve', label: 'Approve Journals' },
      { id: 'gl_accounts', label: 'Manage GL Accounts' },
    ],
  },
  {
    category: 'Reports',
    permissions: [
      { id: 'reports_view', label: 'View Reports' },
      { id: 'reports_export', label: 'Export Reports' },
      { id: 'reports_advanced', label: 'Advanced Reports' },
      { id: 'reports_compliance', label: 'Compliance Reports' },
    ],
  },
  {
    category: 'Other Modules',
    permissions: [
      { id: 'collateral_manage', label: 'Manage Collateral' },
      { id: 'guarantors_manage', label: 'Manage Guarantors' },
      { id: 'documents_manage', label: 'Manage Documents' },
      { id: 'notifications_manage', label: 'Manage Notifications' },
    ],
  },
];

interface RoleFormData {
  _id: string;
  roleName?: string;
  description?: string;
  permissions?: string[];
  isSystemRole?: boolean;
  hierarchyLevel?: number;
  organisationId?: string;
  _createdDate?: Date;
  _updatedDate?: Date;
}

export default function RolesPermissionsPage() {
  const navigate = useNavigate();
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [rolesList, setRolesList] = useState<RoleFormData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    _id: '',
    roleName: '',
    description: '',
    permissions: [],
    isSystemRole: false,
    hierarchyLevel: 0,
  });

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setIsLoading(true);
        if (currentOrganisation?._id) {
          // Use organization-scoped role service (Phase 1)
          const result = await BaseCrudService.getAll<RoleFormData>('roles');
          // Filter by organisation
          const orgRoles = result.items?.filter(r => r.organisationId === currentOrganisation._id) || [];
          setRolesList(orgRoles);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
        setErrorMessage('Failed to load roles');
      } finally {
        setIsLoading(false);
      }
    };

    loadRoles();
  }, [currentOrganisation]);

  const validateForm = (): boolean => {
    if (!formData.roleName?.trim()) {
      setErrorMessage('Role name is required');
      return false;
    }
    if (!formData.description?.trim()) {
      setErrorMessage('Description is required');
      return false;
    }
    if (!formData.permissions || formData.permissions.length === 0) {
      setErrorMessage('At least one permission must be selected');
      return false;
    }
    return true;
  };

  const handleSaveRole = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const roleData: RoleFormData = {
        ...formData,
        _id: formData._id || crypto.randomUUID(),
        permissions: formData.permissions || [],
      };

      if (editingId) {
        await BaseCrudService.update('roles', roleData);
        setRolesList(rolesList.map(r => r._id === editingId ? roleData : r));
      } else {
        await BaseCrudService.create('roles', roleData);
        setRolesList([...rolesList, roleData]);
      }

      // Log audit trail
      if (currentOrganisation?._id && member?.loginEmail) {
        await AuditService.logAction({
          staffMemberId: '',
          performedBy: member.loginEmail,
          actionType: editingId ? 'UPDATE' : 'CREATE',
          actionDetails: `Role ${formData.roleName}`,
          resourceAffected: 'Role',
          resourceId: roleData._id,
        });
      }

      setSuccessMessage(`Role ${editingId ? 'updated' : 'created'} successfully`);
      resetForm();
      setActiveTab('list');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRole = (role: RoleFormData) => {
    const permissions = role.permissions
      ? (typeof role.permissions === 'string' ? (role.permissions as any).split(',') : role.permissions)
      : [];
    setFormData({ ...role, permissions });
    setEditingId(role._id);
    setActiveTab('form');
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await BaseCrudService.delete('roles', id);
      setRolesList(rolesList.filter(r => r._id !== id));
      setSuccessMessage('Role deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete role');
    }
  };

  const resetForm = () => {
    setFormData({
      _id: '',
      roleName: '',
      description: '',
      permissions: [],
      isSystemRole: false,
      hierarchyLevel: 0,
    });
    setEditingId(null);
  };

  const togglePermission = (permissionId: string) => {
    const current = formData.permissions || [];
    if (current.includes(permissionId)) {
      setFormData({
        ...formData,
        permissions: current.filter(p => p !== permissionId),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...current, permissionId],
      });
    }
  };

  const selectAllPermissions = () => {
    const allPermissions = PERMISSION_CATEGORIES.flatMap(cat =>
      cat.permissions.map(p => p.id)
    );
    setFormData({
      ...formData,
      permissions: allPermissions,
    });
  };

  const deselectAllPermissions = () => {
    setFormData({
      ...formData,
      permissions: [],
    });
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
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate('/admin/settings')}
              variant="outline"
              className="border-slate-300 text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </div>
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Roles & Permissions
          </h1>
          <p className="text-primary-foreground/70">
            Manage user roles and their system permissions
          </p>
        </motion.div>

        {/* Success/Error Messages */}
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
            <TabsList className="grid w-full grid-cols-2 bg-slate-200 mb-8">
              <TabsTrigger value="list" className="text-slate-900">
                <Lock className="w-4 h-4 mr-2" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="form" className="text-slate-900">
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? 'Edit Role' : 'New Role'}
              </TabsTrigger>
            </TabsList>

            {/* Roles List Tab */}
            <TabsContent value="list" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Roles</CardTitle>
                    <CardDescription className="text-slate-600">
                      Total: {rolesList.length} roles
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      resetForm();
                      setActiveTab('form');
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Role
                  </Button>
                </CardHeader>
                <CardContent>
                  {rolesList.length > 0 ? (
                    <div className="space-y-3">
                      {rolesList.map((role) => (
                        <div
                          key={role._id}
                          className="p-4 bg-white border border-slate-200 rounded-lg flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{role.roleName}</p>
                            <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                            <div className="flex gap-2 mt-2">
                              {role.isSystemRole && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-300 border">
                                  System Role
                                </Badge>
                              )}
                              <Badge className="bg-slate-100 text-slate-800 border-slate-300 border">
                                {role.permissions
                                  ? (typeof role.permissions === 'string'
                                    ? (role.permissions as any).split(',').length
                                    : role.permissions.length)
                                  : 0} permissions
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-slate-700 border-slate-300"
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {!role.isSystemRole && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-slate-300"
                                onClick={() => handleDeleteRole(role._id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      No roles found. Click "New Role" to create one.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Role Form Tab */}
            <TabsContent value="form" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">
                    {editingId ? 'Edit Role' : 'Create New Role'}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Define role name, description, and assign permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Role Name *
                        </Label>
                        <Input
                          value={formData.roleName || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, roleName: e.target.value })
                          }
                          placeholder="e.g., Loan Officer, Manager"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Hierarchy Level
                        </Label>
                        <Input
                          type="number"
                          value={formData.hierarchyLevel || 0}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hierarchyLevel: parseInt(e.target.value),
                            })
                          }
                          placeholder="0"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Description *
                        </Label>
                        <Input
                          value={formData.description || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Brief description of this role"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Permissions
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={selectAllPermissions}
                          className="text-slate-700 border-slate-300"
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={deselectAllPermissions}
                          className="text-slate-700 border-slate-300"
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {PERMISSION_CATEGORIES.map((category) => (
                        <div key={category.category} className="p-4 bg-white border border-slate-200 rounded-lg">
                          <h4 className="font-semibold text-slate-900 mb-3">
                            {category.category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {category.permissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 transition-colors"
                              >
                                <Checkbox
                                  checked={
                                    formData.permissions?.includes(permission.id) || false
                                  }
                                  onCheckedChange={() =>
                                    togglePermission(permission.id)
                                  }
                                  className="border-2 border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label className="text-sm text-slate-700 cursor-pointer font-medium">
                                  {permission.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-slate-200 pt-6 flex gap-3 justify-end">
                    <Button
                      onClick={() => {
                        resetForm();
                        setActiveTab('list');
                      }}
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveRole}
                      disabled={isSaving}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Role'}
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
