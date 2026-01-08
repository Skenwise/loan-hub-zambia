/**
 * Comprehensive Staff Settings Page
 * Manages staff roles, permissions, access controls, and personal information
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService, StaffService, AuditService, RoleService } from '@/services';
import { StaffMembers, Roles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Users,
  Lock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  ChevronDown,
  Clock,
  Globe,
  Shield,
  Calendar,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image } from '@/components/ui/image';

// Constants
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
  'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic',
  'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa',
  'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const TIMEZONES = [
  'Africa/Lusaka', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Cairo', 'Africa/Nairobi',
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00',
  'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00',
  'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const GENDERS = ['Male', 'Female', 'Other'];
const AUTO_LOGOUT_OPTIONS = [
  { value: '1', label: '1 hour', description: 'Logout after 1 hour of inactivity' },
  { value: '4', label: '4 hours', description: 'Logout after 4 hours of inactivity' },
  { value: '12', label: '12 hours', description: 'Logout after 12 hours of inactivity' },
  { value: '24', label: '24 hours', description: 'Logout after 24 hours of inactivity' },
];
const RESULTS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_LANDING_PAGES = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'customers', label: 'Customers' },
  { value: 'loans', label: 'Loans' },
  { value: 'repayments', label: 'Repayments' },
  { value: 'reports', label: 'Reports' },
];

interface StaffFormData extends StaffMembers {
  // Role & Branch Access
  staffRole?: string;
  accessBranches?: string[];
  payrollBranch?: string;
  
  // Basic Information
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  country?: string;
  
  // Optional Settings
  autoLogoutAfter?: string;
  resultsPerPage?: number;
  defaultLandingPage?: string;
  
  // Contact & Personal Details
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  provinceState?: string;
  zipPostalCode?: string;
  officePhone?: string;
  teams?: string[];
  profileImage?: string;
  
  // Login Restrictions
  timezone?: string;
  restrictByDayOfWeek?: boolean;
  allowedDaysOfWeek?: string[];
  restrictLoginTimings?: boolean;
  loginFromTime?: string;
  loginToTime?: string;
  restrictByIPAddress?: boolean;
  allowedIPAddresses?: string;
  restrictByCountry?: boolean;
  allowedCountries?: string[];
  
  // Backdating & Postdating Controls
  restrictBackdatingLoans?: boolean;
  restrictPostdatingLoans?: boolean;
  restrictBackdatingRepayments?: boolean;
  restrictPostdatingRepayments?: boolean;
  restrictBackdatingSavings?: boolean;
  restrictPostdatingSavings?: boolean;
  restrictBackdatingTransactions?: boolean;
  restrictPostdatingTransactions?: boolean;
  restrictBackdatingExpenses?: boolean;
  restrictPostdatingExpenses?: boolean;
  restrictBackdatingIncome?: boolean;
  restrictPostdatingIncome?: boolean;
  restrictBackdatingJournals?: boolean;
  restrictPostdatingJournals?: boolean;
  restrictBackdatingPayroll?: boolean;
  restrictPostdatingPayroll?: boolean;
  restrictBackdatingTransfers?: boolean;
  restrictPostdatingTransfers?: boolean;
  restrictBackdatingEquity?: boolean;
  restrictPostdatingEquity?: boolean;
  restrictBackdatingCollateral?: boolean;
  restrictPostdatingCollateral?: boolean;
  
  // Approval Controls
  restrictRepaymentApprovals?: boolean;
  restrictSavingsApprovals?: boolean;
  restrictJournalApprovals?: boolean;
  requireAdminNotification?: boolean;
}

export default function StaffSettingsPage() {
  const navigate = useNavigate();
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [staffList, setStaffList] = useState<StaffFormData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Roles[]>([]);
  const [branches, setBranches] = useState<string[]>(['Main Branch', 'Branch A', 'Branch B', 'Branch C']);
  const [formData, setFormData] = useState<StaffFormData>({
    _id: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: 'Male',
    country: 'Zambia',
    timezone: 'Africa/Lusaka',
    autoLogoutAfter: '4',
    resultsPerPage: 20,
    defaultLandingPage: 'dashboard',
    staffRole: '',
    accessBranches: [],
    payrollBranch: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    provinceState: '',
    zipPostalCode: '',
    officePhone: '',
    teams: [],
    profileImage: '',
    restrictByDayOfWeek: false,
    allowedDaysOfWeek: [],
    restrictLoginTimings: false,
    loginFromTime: '',
    loginToTime: '',
    restrictByIPAddress: false,
    allowedIPAddresses: '',
    restrictByCountry: false,
    allowedCountries: [],
    restrictBackdatingLoans: false,
    restrictPostdatingLoans: false,
    restrictBackdatingRepayments: false,
    restrictPostdatingRepayments: false,
    restrictBackdatingSavings: false,
    restrictPostdatingSavings: false,
    restrictBackdatingTransactions: false,
    restrictPostdatingTransactions: false,
    restrictBackdatingExpenses: false,
    restrictPostdatingExpenses: false,
    restrictBackdatingIncome: false,
    restrictPostdatingIncome: false,
    restrictBackdatingJournals: false,
    restrictPostdatingJournals: false,
    restrictBackdatingPayroll: false,
    restrictPostdatingPayroll: false,
    restrictBackdatingTransfers: false,
    restrictPostdatingTransfers: false,
    restrictBackdatingEquity: false,
    restrictPostdatingEquity: false,
    restrictBackdatingCollateral: false,
    restrictPostdatingCollateral: false,
    restrictRepaymentApprovals: false,
    restrictSavingsApprovals: false,
    restrictJournalApprovals: false,
    requireAdminNotification: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (currentOrganisation?._id) {
          // Use organization-scoped staff service (Phase 1)
          const staffResult = await StaffService.getOrganisationStaff(currentOrganisation._id);
          setStaffList(staffResult || []);
        }
        
        // Load roles
        try {
          const rolesResult = await BaseCrudService.getAll<Roles>('roles');
          setRoles(rolesResult.items || []);
        } catch (error) {
          console.error('Error loading roles:', error);
        }
      } catch (error) {
        console.error('Error loading staff:', error);
        setErrorMessage('Failed to load staff members');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentOrganisation]);

  const validateForm = (): boolean => {
    if (!formData.firstName?.trim()) {
      setErrorMessage('First name is required');
      return false;
    }
    if (!formData.lastName?.trim()) {
      setErrorMessage('Last name is required');
      return false;
    }
    if (!formData.email?.trim()) {
      setErrorMessage('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Invalid email format');
      return false;
    }
    if (formData.phoneNumber && !/^\d+$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      setErrorMessage('Phone number must contain only digits');
      return false;
    }
    return true;
  };

  const handleSaveStaff = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const staffData = {
        ...formData,
        _id: formData._id || crypto.randomUUID(),
      };

      if (editingId) {
        await BaseCrudService.update('staffmembers', staffData);
        setStaffList(staffList.map(s => s._id === editingId ? staffData : s));
      } else {
        await BaseCrudService.create('staffmembers', staffData);
        setStaffList([...staffList, staffData]);
      }

      // Log audit trail
      if (currentOrganisation?._id && member?.loginEmail) {
        await AuditService.logAction({
          staffMemberId: staffData._id,
          performedBy: member.loginEmail,
          actionType: editingId ? 'UPDATE' : 'CREATE',
          actionDetails: `Staff member ${staffData.firstName} ${staffData.lastName}`,
          resourceAffected: 'Staff Member',
          resourceId: staffData._id,
        });
      }

      setSuccessMessage(`Staff member ${editingId ? 'updated' : 'created'} successfully`);
      resetForm();
      setActiveTab('list');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save staff member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStaff = (staff: StaffFormData) => {
    setFormData(staff);
    setEditingId(staff._id);
    setActiveTab('form');
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await BaseCrudService.delete('staffmembers', id);
      setStaffList(staffList.filter(s => s._id !== id));
      setSuccessMessage('Staff member deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete staff member');
    }
  };

  const resetForm = () => {
    setFormData({
      _id: '',
      firstName: '',
      lastName: '',
      email: '',
      gender: 'Male',
      country: 'Zambia',
      timezone: 'Africa/Lusaka',
      autoLogoutAfter: '4',
      resultsPerPage: 20,
      defaultLandingPage: 'dashboard',
      staffRole: '',
      accessBranches: [],
      payrollBranch: '',
      phoneNumber: '',
      dateOfBirth: '',
      address: '',
      city: '',
      provinceState: '',
      zipPostalCode: '',
      officePhone: '',
      teams: [],
      profileImage: '',
      restrictByDayOfWeek: false,
      allowedDaysOfWeek: [],
      restrictLoginTimings: false,
      loginFromTime: '',
      loginToTime: '',
      restrictByIPAddress: false,
      allowedIPAddresses: '',
      restrictByCountry: false,
      allowedCountries: [],
      restrictBackdatingLoans: false,
      restrictPostdatingLoans: false,
      restrictBackdatingRepayments: false,
      restrictPostdatingRepayments: false,
      restrictBackdatingSavings: false,
      restrictPostdatingSavings: false,
      restrictBackdatingTransactions: false,
      restrictPostdatingTransactions: false,
      restrictBackdatingExpenses: false,
      restrictPostdatingExpenses: false,
      restrictBackdatingIncome: false,
      restrictPostdatingIncome: false,
      restrictBackdatingJournals: false,
      restrictPostdatingJournals: false,
      restrictBackdatingPayroll: false,
      restrictPostdatingPayroll: false,
      restrictBackdatingTransfers: false,
      restrictPostdatingTransfers: false,
      restrictBackdatingEquity: false,
      restrictPostdatingEquity: false,
      restrictBackdatingCollateral: false,
      restrictPostdatingCollateral: false,
      restrictRepaymentApprovals: false,
      restrictSavingsApprovals: false,
      restrictJournalApprovals: false,
      requireAdminNotification: false,
    });
    setEditingId(null);
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
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
              Staff Management
            </h1>
            <p className="text-primary-foreground/70">
              Manage staff roles, permissions, access controls, and personal information
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/settings')}
            variant="outline"
            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
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
                <Users className="w-4 h-4 mr-2" />
                Staff Members
              </TabsTrigger>
              <TabsTrigger value="form" className="text-slate-900">
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? 'Edit Staff' : 'Add Staff'}
              </TabsTrigger>
            </TabsList>

            {/* Staff List Tab */}
            <TabsContent value="list" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Staff Members</CardTitle>
                    <CardDescription className="text-slate-600">
                      Total: {staffList.length} staff members
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
                    Add Staff
                  </Button>
                </CardHeader>
                <CardContent>
                  {staffList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Name
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Email
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Role
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Department
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Status
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffList.map((staff) => (
                            <tr key={staff._id} className="border-b border-slate-100 hover:bg-slate-100">
                              <td className="py-3 px-4 text-slate-900 font-semibold">
                                {staff.firstName} {staff.lastName}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{staff.email}</td>
                              <td className="py-3 px-4">
                                <Badge className="bg-blue-100 text-blue-800 border-blue-300 border">
                                  {staff.staffRole || staff.role || 'N/A'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {staff.department || 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <Badge className="bg-green-100 text-green-800 border-green-300 border">
                                  {staff.status || 'Active'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-slate-700 border-slate-300"
                                  onClick={() => handleEditStaff(staff)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-slate-300"
                                  onClick={() => handleDeleteStaff(staff._id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      No staff members found. Click "Add Staff" to create one.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff Form Tab */}
            <TabsContent value="form" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">
                    {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Complete all required fields marked with *
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Section 1: Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          First Name *
                        </Label>
                        <Input
                          value={formData.firstName || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          placeholder="John"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Last Name *
                        </Label>
                        <Input
                          value={formData.lastName || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                          placeholder="Doe"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Email *
                        </Label>
                        <Input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="john@example.com"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Gender
                        </Label>
                        <Select
                          value={formData.gender || 'Male'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, gender: value })
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Country
                        </Label>
                        <Select
                          value={formData.country || 'Zambia'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, country: value })
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Date of Birth
                        </Label>
                        <Input
                          type="date"
                          value={formData.dateOfBirth || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, dateOfBirth: e.target.value })
                          }
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Role & Branch Access */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Role & Branch Access
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Staff Role
                        </Label>
                        <Input
                          value={formData.staffRole || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, staffRole: e.target.value })
                          }
                          placeholder="e.g., Loan Officer, Manager"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Payroll Branch
                        </Label>
                        <Input
                          value={formData.payrollBranch || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, payrollBranch: e.target.value })
                          }
                          placeholder="Select branch for payroll"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Access to Branches (Multi-select)
                        </Label>
                        <Input
                          value={formData.accessBranches?.join(', ') || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              accessBranches: e.target.value.split(',').map(b => b.trim()),
                            })
                          }
                          placeholder="Enter branches separated by commas"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Separate multiple branches with commas
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Contact & Personal Details */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Contact & Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Mobile Number
                        </Label>
                        <Input
                          value={formData.phoneNumber || ''}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, phoneNumber: cleaned });
                          }}
                          placeholder="Digits only"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Numbers only, no spaces or special characters
                        </p>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Office Phone
                        </Label>
                        <Input
                          value={formData.officePhone || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, officePhone: e.target.value })
                          }
                          placeholder="Office phone number"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Address
                        </Label>
                        <Input
                          value={formData.address || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          placeholder="Street address"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          City
                        </Label>
                        <Input
                          value={formData.city || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          placeholder="City"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Province / State
                        </Label>
                        <Input
                          value={formData.provinceState || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, provinceState: e.target.value })
                          }
                          placeholder="Province or State"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Zip/Postal Code
                        </Label>
                        <Input
                          value={formData.zipPostalCode || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, zipPostalCode: e.target.value })
                          }
                          placeholder="Postal code"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Teams (comma-separated)
                        </Label>
                        <Input
                          value={formData.teams?.join(', ') || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              teams: e.target.value.split(',').map(t => t.trim()),
                            })
                          }
                          placeholder="e.g., Lending, Operations"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Optional Settings */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Optional Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Auto Logout After Inactivity
                        </Label>
                        <Select
                          value={formData.autoLogoutAfter || '4'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, autoLogoutAfter: value })
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AUTO_LOGOUT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Results Per Page
                        </Label>
                        <Select
                          value={String(formData.resultsPerPage || 20)}
                          onValueChange={(value) =>
                            setFormData({ ...formData, resultsPerPage: parseInt(value) })
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RESULTS_PER_PAGE_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={String(opt)}>
                                {opt} per page
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Default Landing Page After Login
                        </Label>
                        <Select
                          value={formData.defaultLandingPage || 'dashboard'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, defaultLandingPage: value })
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_LANDING_PAGES.map((page) => (
                              <SelectItem key={page.value} value={page.value}>
                                {page.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Login Restrictions */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Login Restrictions
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Timezone
                        </Label>
                        <Select
                          value={formData.timezone || 'Africa/Lusaka'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, timezone: value })
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-slate-700 text-sm font-semibold">
                            Restrict by Day of Week
                          </Label>
                          <Switch
                            checked={formData.restrictByDayOfWeek || false}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                restrictByDayOfWeek: checked,
                                allowedDaysOfWeek: checked ? [] : formData.allowedDaysOfWeek,
                              })
                            }
                          />
                        </div>
                        {formData.restrictByDayOfWeek && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white border border-slate-300 rounded">
                            {DAYS_OF_WEEK.map((day) => (
                              <div key={day} className="flex items-center gap-2">
                                <Checkbox
                                  checked={formData.allowedDaysOfWeek?.includes(day) || false}
                                  onCheckedChange={(checked) => {
                                    const days = formData.allowedDaysOfWeek || [];
                                    if (checked) {
                                      setFormData({
                                        ...formData,
                                        allowedDaysOfWeek: [...days, day],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        allowedDaysOfWeek: days.filter(d => d !== day),
                                      });
                                    }
                                  }}
                                />
                                <label className="text-sm text-slate-700">{day}</label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-slate-700 text-sm font-semibold">
                            Restrict Login Timings
                          </Label>
                          <Switch
                            checked={formData.restrictLoginTimings || false}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, restrictLoginTimings: checked })
                            }
                          />
                        </div>
                        {formData.restrictLoginTimings && (
                          <div className="grid grid-cols-2 gap-4 p-3 bg-white border border-slate-300 rounded">
                            <div>
                              <Label className="text-slate-700 text-xs mb-1 block">
                                From Time
                              </Label>
                              <Input
                                type="time"
                                value={formData.loginFromTime || ''}
                                onChange={(e) =>
                                  setFormData({ ...formData, loginFromTime: e.target.value })
                                }
                                className="bg-white border-slate-300 text-slate-900"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-700 text-xs mb-1 block">
                                To Time
                              </Label>
                              <Input
                                type="time"
                                value={formData.loginToTime || ''}
                                onChange={(e) =>
                                  setFormData({ ...formData, loginToTime: e.target.value })
                                }
                                className="bg-white border-slate-300 text-slate-900"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-slate-700 text-sm font-semibold">
                            Restrict by IP Address
                          </Label>
                          <Switch
                            checked={formData.restrictByIPAddress || false}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, restrictByIPAddress: checked })
                            }
                          />
                        </div>
                        {formData.restrictByIPAddress && (
                          <Input
                            value={formData.allowedIPAddresses || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, allowedIPAddresses: e.target.value })
                            }
                            placeholder="e.g., 192.168.1.1, 10.0.0.0/8"
                            className="bg-white border-slate-300 text-slate-900"
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-slate-700 text-sm font-semibold">
                            Restrict by Country
                          </Label>
                          <Switch
                            checked={formData.restrictByCountry || false}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                restrictByCountry: checked,
                                allowedCountries: checked ? [] : formData.allowedCountries,
                              })
                            }
                          />
                        </div>
                        {formData.restrictByCountry && (
                          <Select
                            value={formData.allowedCountries?.[0] || ''}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                allowedCountries: value ? [value] : [],
                              })
                            }
                          >
                            <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">None</SelectItem>
                              {COUNTRIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Backdating & Postdating Controls */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Backdating & Postdating Controls
                    </h3>
                    <div className="space-y-4">
                      {[
                        { key: 'Loans', backKey: 'restrictBackdatingLoans', postKey: 'restrictPostdatingLoans' },
                        { key: 'Loan Repayments', backKey: 'restrictBackdatingRepayments', postKey: 'restrictPostdatingRepayments' },
                        { key: 'Savings Transactions', backKey: 'restrictBackdatingSavings', postKey: 'restrictPostdatingSavings' },
                        { key: 'Investor Transactions', backKey: 'restrictBackdatingTransactions', postKey: 'restrictPostdatingTransactions' },
                        { key: 'Expenses', backKey: 'restrictBackdatingExpenses', postKey: 'restrictPostdatingExpenses' },
                        { key: 'Other Income', backKey: 'restrictBackdatingIncome', postKey: 'restrictPostdatingIncome' },
                        { key: 'Manual Journals', backKey: 'restrictBackdatingJournals', postKey: 'restrictPostdatingJournals' },
                        { key: 'Payroll', backKey: 'restrictBackdatingPayroll', postKey: 'restrictPostdatingPayroll' },
                        { key: 'Inter-Bank Transfers', backKey: 'restrictBackdatingTransfers', postKey: 'restrictPostdatingTransfers' },
                        { key: 'Branch Equity', backKey: 'restrictBackdatingEquity', postKey: 'restrictPostdatingEquity' },
                        { key: 'Collateral Register', backKey: 'restrictBackdatingCollateral', postKey: 'restrictPostdatingCollateral' },
                      ].map((item) => (
                        <div key={item.key} className="p-4 bg-white border border-slate-200 rounded-lg">
                          <p className="font-semibold text-slate-900 mb-3">{item.key}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-slate-700 text-sm">
                                Restrict Backdating
                              </Label>
                              <Switch
                                checked={formData[item.backKey as keyof StaffFormData] as boolean || false}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    [item.backKey]: checked,
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-slate-700 text-sm">
                                Restrict Postdating
                              </Label>
                              <Switch
                                checked={formData[item.postKey as keyof StaffFormData] as boolean || false}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    [item.postKey]: checked,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 7: Approval Controls */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Approval Controls
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-slate-700 text-sm font-semibold">
                            Restrict Add/Edit Repayments for Approval
                          </Label>
                          <Switch
                            checked={formData.restrictRepaymentApprovals || false}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, restrictRepaymentApprovals: checked })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          Repayments will be saved as Draft and require approval
                        </p>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-slate-700 text-sm font-semibold">
                            Restrict Add/Edit Savings Transactions for Approval
                          </Label>
                          <Switch
                            checked={formData.restrictSavingsApprovals || false}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, restrictSavingsApprovals: checked })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          Savings transactions will be saved as Draft and require approval
                        </p>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-slate-700 text-sm font-semibold">
                            Restrict Add/Edit Manual Journals for Approval
                          </Label>
                          <Switch
                            checked={formData.restrictJournalApprovals || false}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, restrictJournalApprovals: checked })
                            }
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          Manual journals will be saved as Draft and require approval
                        </p>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-700 text-sm font-semibold">
                            Require Admin Notification for Approvals
                          </Label>
                          <Switch
                            checked={formData.requireAdminNotification || false}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, requireAdminNotification: checked })
                            }
                          />
                        </div>
                      </div>
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
                      onClick={handleSaveStaff}
                      disabled={isSaving}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Staff Member'}
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
