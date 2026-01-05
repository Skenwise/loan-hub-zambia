/**
 * Unified Settings Page
 * Consolidates all settings tabs: Organization Profile, Staff Management, Roles & Permissions, Audit Logs, Email Templates
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { BaseCrudService, StaffService, RoleService, AuditService } from '@/services';
import { OrganisationSettings } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Globe,
  Clock,
  DollarSign,
  MapPin,
  Upload,
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

// Constants for dropdowns
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
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00',
  'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00',
  'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
];

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'MXN',
  'ZAR', 'ZMW', 'KES', 'NGN', 'GHS', 'UGX', 'TZS', 'RWF', 'BWP', 'MUR'
];

const DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'MM-DD-YYYY',
];

const DECIMAL_SEPARATORS = ['.', ','];
const THOUSAND_SEPARATORS = [',', '.', ' '];
const REPAYMENT_CYCLES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('organization');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Organization settings state
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [contactEmail, setContactEmail] = useState('');

  // Staff state
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load organisation settings
        const result = await BaseCrudService.getAll<OrganisationSettings>('organisationsettings', {}, { limit: 1 });
        if (result.items && result.items.length > 0) {
          const existingSettings = result.items[0];
          // Sync company name from organisation if it differs
          if (currentOrganisation?.organizationName && existingSettings.companyName !== currentOrganisation.organizationName) {
            existingSettings.companyName = currentOrganisation.organizationName;
          }
          setSettings(existingSettings);
          if (existingSettings.companyLogo) {
            setLogoPreview(existingSettings.companyLogo);
          }
        } else {
          // Create default settings if none exist
          const defaultSettings: OrganisationSettings = {
            _id: crypto.randomUUID(),
            companyName: currentOrganisation?.organizationName || '',
            country: '',
            timezone: 'UTC+00:00',
            currency: 'USD',
            dateFormat: 'DD/MM/YYYY',
            decimalSeparator: '.',
            thousandSeparator: ',',
            loanRepaymentCycle: 'Monthly',
            daysInMonthForInterestCalculation: 30,
            daysInYearForInterestCalculation: 365,
            businessRegistrationNumber: '',
            address: '',
            city: '',
            provinceState: '',
            zipPostalCode: '',
          };
          await BaseCrudService.create('organisationsettings', defaultSettings);
          setSettings(defaultSettings);
        }

        // Set contact email from organisation
        if (currentOrganisation?.contactEmail) {
          setContactEmail(currentOrganisation.contactEmail);
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

  const handleSaveSettings = async () => {
    try {
      if (!settings) return;

      setIsSaving(true);
      
      // Handle logo upload if new file selected
      let logoUrl = settings.companyLogo;
      if (logoFile) {
        // In a real app, you'd upload to a file service
        // For now, we'll use a data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          logoUrl = e.target?.result as string;
        };
        reader.readAsDataURL(logoFile);
      }

      const updatedSettings = {
        ...settings,
        companyLogo: logoUrl,
      };

      if (settings._id) {
        await BaseCrudService.update('organisationsettings', updatedSettings);
      } else {
        await BaseCrudService.create('organisationsettings', updatedSettings);
      }

      // Update organisation with company name and contact email if changed
      if (currentOrganisation) {
        const orgUpdates: any = { _id: currentOrganisation._id };
        let hasChanges = false;

        if (settings.companyName !== currentOrganisation.organizationName) {
          orgUpdates.organizationName = settings.companyName;
          hasChanges = true;
        }

        if (contactEmail !== currentOrganisation.contactEmail) {
          orgUpdates.contactEmail = contactEmail;
          hasChanges = true;
        }

        if (hasChanges) {
          await BaseCrudService.update('organisations', orgUpdates);
        }
      }

      setSettings(updatedSettings);
      setEditingSettings(false);
      setLogoFile(null);
      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
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
            Settings
          </h1>
          <p className="text-primary-foreground/70">
            Manage organization profile, staff, roles, and system configurations
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
            <TabsList className="grid w-full grid-cols-5 bg-slate-200 mb-8">
              <TabsTrigger value="organization" className="text-slate-900 text-xs md:text-sm">
                <Building2 className="w-4 h-4 mr-2" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="staff" className="text-slate-900 text-xs md:text-sm">
                <Users className="w-4 h-4 mr-2" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="roles" className="text-slate-900 text-xs md:text-sm">
                <Lock className="w-4 h-4 mr-2" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-slate-900 text-xs md:text-sm">
                <FileText className="w-4 h-4 mr-2" />
                Audit
              </TabsTrigger>
              <TabsTrigger value="email" className="text-slate-900 text-xs md:text-sm">
                <Bell className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
            </TabsList>

            {/* Organization Profile Tab */}
            <TabsContent value="organization" className="space-y-6">
              {settings && (
                <Card className="bg-slate-50 border-slate-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900">Organization Profile</CardTitle>
                      <Button
                        onClick={() => setEditingSettings(!editingSettings)}
                        variant="outline"
                        className="border-slate-300 text-slate-900 hover:bg-slate-100"
                      >
                        {editingSettings ? (
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
                    {/* Company Logo */}
                    {editingSettings && (
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Company Logo</Label>
                        <div className="flex items-center gap-4">
                          {logoPreview && (
                            <Image
                              src={logoPreview}
                              alt="Company Logo"
                              width={100}
                              height={100}
                              className="rounded-lg border border-slate-300"
                            />
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="bg-white border-slate-300 text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Company Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Company Name</Label>
                        <Input
                          value={settings.companyName || ''}
                          onChange={(e) =>
                            setSettings({ ...settings, companyName: e.target.value })
                          }
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Contact Email</Label>
                        <Input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Country</Label>
                        <Select
                          value={settings.country || ''}
                          onValueChange={(value) =>
                            setSettings({ ...settings, country: value })
                          }
                          disabled={!editingSettings}
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Timezone</Label>
                        <Select
                          value={settings.timezone || 'UTC+00:00'}
                          onValueChange={(value) =>
                            setSettings({ ...settings, timezone: value })
                          }
                          disabled={!editingSettings}
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100">
                            <SelectValue placeholder="Select timezone" />
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
                        <Label className="text-slate-700 text-sm mb-2 block">Currency</Label>
                        <Select
                          value={settings.currency || 'USD'}
                          onValueChange={(value) =>
                            setSettings({ ...settings, currency: value })
                          }
                          disabled={!editingSettings}
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((curr) => (
                              <SelectItem key={curr} value={curr}>
                                {curr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Date Format</Label>
                        <Select
                          value={settings.dateFormat || 'DD/MM/YYYY'}
                          onValueChange={(value) =>
                            setSettings({ ...settings, dateFormat: value })
                          }
                          disabled={!editingSettings}
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100">
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                          <SelectContent>
                            {DATE_FORMATS.map((fmt) => (
                              <SelectItem key={fmt} value={fmt}>
                                {fmt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Decimal Separator</Label>
                        <Select
                          value={settings.decimalSeparator || '.'}
                          onValueChange={(value) =>
                            setSettings({ ...settings, decimalSeparator: value })
                          }
                          disabled={!editingSettings}
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100">
                            <SelectValue placeholder="Select separator" />
                          </SelectTrigger>
                          <SelectContent>
                            {DECIMAL_SEPARATORS.map((sep) => (
                              <SelectItem key={sep} value={sep}>
                                {sep === '.' ? 'Period (.)' : 'Comma (,)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Thousand Separator</Label>
                        <Select
                          value={settings.thousandSeparator || ','}
                          onValueChange={(value) =>
                            setSettings({ ...settings, thousandSeparator: value })
                          }
                          disabled={!editingSettings}
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100">
                            <SelectValue placeholder="Select separator" />
                          </SelectTrigger>
                          <SelectContent>
                            {THOUSAND_SEPARATORS.map((sep) => (
                              <SelectItem key={sep} value={sep}>
                                {sep === ',' ? 'Comma (,)' : sep === '.' ? 'Period (.)' : 'Space ( )'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Loan Repayment Cycle</Label>
                        <Select
                          value={settings.loanRepaymentCycle || 'Monthly'}
                          onValueChange={(value) =>
                            setSettings({ ...settings, loanRepaymentCycle: value })
                          }
                          disabled={!editingSettings}
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100">
                            <SelectValue placeholder="Select cycle" />
                          </SelectTrigger>
                          <SelectContent>
                            {REPAYMENT_CYCLES.map((cycle) => (
                              <SelectItem key={cycle} value={cycle}>
                                {cycle}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Days in Month for Interest Calculation</Label>
                        <Input
                          type="number"
                          value={settings.daysInMonthForInterestCalculation || 30}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              daysInMonthForInterestCalculation: parseInt(e.target.value),
                            })
                          }
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          min="28"
                          max="31"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Days in Year for Interest Calculation</Label>
                        <Input
                          type="number"
                          value={settings.daysInYearForInterestCalculation || 365}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              daysInYearForInterestCalculation: parseInt(e.target.value),
                            })
                          }
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          min="360"
                          max="366"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Business Registration Number</Label>
                        <Input
                          value={settings.businessRegistrationNumber || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              businessRegistrationNumber: e.target.value,
                            })
                          }
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          placeholder="e.g., REG-2024-001"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Address</Label>
                        <Input
                          value={settings.address || ''}
                          onChange={(e) =>
                            setSettings({ ...settings, address: e.target.value })
                          }
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          placeholder="Street address"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">City</Label>
                        <Input
                          value={settings.city || ''}
                          onChange={(e) =>
                            setSettings({ ...settings, city: e.target.value })
                          }
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          placeholder="City"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Province/State</Label>
                        <Input
                          value={settings.provinceState || ''}
                          onChange={(e) =>
                            setSettings({ ...settings, provinceState: e.target.value })
                          }
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          placeholder="Province or State"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Zip/Postal Code</Label>
                        <Input
                          value={settings.zipPostalCode || ''}
                          onChange={(e) =>
                            setSettings({ ...settings, zipPostalCode: e.target.value })
                          }
                          disabled={!editingSettings}
                          className="bg-white border-slate-300 text-slate-900 disabled:bg-slate-100"
                          placeholder="Postal code"
                        />
                      </div>
                    </div>

                    {editingSettings && (
                      <div className="flex gap-3 justify-end pt-4 border-t border-slate-300">
                        <Button
                          onClick={() => setEditingSettings(false)}
                          variant="outline"
                          className="border-slate-300 text-slate-900 hover:bg-slate-100"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveSettings}
                          disabled={isSaving}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Staff Management Tab */}
            <TabsContent value="staff" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Staff Members</CardTitle>
                    <CardDescription className="text-slate-600">
                      Manage your organization's staff members
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => navigate('/admin/settings/staff')}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                </CardHeader>
                <CardContent>
                  {staff.length > 0 ? (
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
                              Status
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.map((member) => (
                            <tr key={member._id} className="border-b border-slate-100 hover:bg-slate-100">
                              <td className="py-3 px-4 text-slate-900 font-semibold">
                                {member.fullName}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{member.email}</td>
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
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer"
                                  onClick={() => navigate(`/admin/settings/staff?edit=${member._id}`)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 border-slate-300 hover:bg-red-50 cursor-pointer"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this staff member?')) {
                                      // Delete logic will be implemented
                                    }
                                  }}
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
                      No staff members found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Roles & Permissions Tab */}
            <TabsContent value="roles" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Roles & Permissions</CardTitle>
                    <CardDescription className="text-slate-600">
                      Manage user roles and their permissions
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => navigate('/admin/settings/roles-permissions')}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Manage Roles
                  </Button>
                </CardHeader>
                <CardContent>
                  {roles.length > 0 ? (
                    <div className="space-y-3">
                      {roles.map((role) => (
                        <div
                          key={role._id}
                          className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{role.roleName}</p>
                            <p className="text-sm text-slate-600">{role.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer"
                              onClick={() => navigate(`/admin/settings/roles-permissions?edit=${role._id}`)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {!role.isSystemRole && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-slate-300 hover:bg-red-50 cursor-pointer"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this role?')) {
                                    // Delete logic will be implemented
                                  }
                                }}
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
                      No roles found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Logs Tab */}
            <TabsContent value="audit" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Audit Logs</CardTitle>
                  <CardDescription className="text-slate-600">
                    View system activity and user actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {auditLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Action
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Performed By
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Resource
                            </th>
                            <th className="text-left py-3 px-4 text-slate-700 font-semibold">
                              Timestamp
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.slice(0, 10).map((log) => (
                            <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-100">
                              <td className="py-3 px-4 text-slate-900 font-semibold">
                                {log.actionType}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {log.performedBy}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {log.resourceAffected}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
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
                    <div className="py-8 text-center text-slate-500">
                      No audit logs found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Templates Tab */}
            <TabsContent value="email" className="space-y-6">
              {/* Staff Email Reminders Section */}
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Staff Email Reminders</CardTitle>
                  <CardDescription className="text-slate-600">
                    Configure automated email notifications for staff members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Guidance Text */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <strong>Note:</strong> Configure loan reminder notifications and approval settings in the dedicated sections. 
                      <a href="/admin/settings/loan-reminders" className="text-blue-600 hover:underline ml-1">
                        View Loan Reminder Notifications →
                      </a>
                      <a href="/admin/settings/loan-approvals" className="text-blue-600 hover:underline ml-1">
                        View Loan Approvals Settings →
                      </a>
                    </p>
                  </div>

                  {/* Daily Reports */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Daily Reports</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">Loans Due Today</p>
                            <p className="text-sm text-slate-600">Daily report of loans due for repayment</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">Loans Expiring Today</p>
                            <p className="text-sm text-slate-600">Daily report of loans expiring today</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">Loans Past Maturity Date</p>
                            <p className="text-sm text-slate-600">Daily report of overdue loans</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">New Loans Added</p>
                            <p className="text-sm text-slate-600">Daily report of newly created loans</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">New Repayments Added</p>
                            <p className="text-sm text-slate-600">Daily report of new repayment records</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="space-y-3">
                          <p className="font-medium text-slate-900">Assign Staff Members</p>
                          <div className="space-y-2">
                            {staff.length > 0 ? (
                              staff.slice(0, 5).map((member) => (
                                <div key={member._id} className="flex items-center gap-2">
                                  <Checkbox />
                                  <label className="text-sm text-slate-700">{member.fullName}</label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No staff members available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Reports */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Weekly Reports</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">Weekly Summary Report</p>
                            <p className="text-sm text-slate-600">Comprehensive weekly summary of all loan activities</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="space-y-3">
                          <p className="font-medium text-slate-900">Assign Staff Members</p>
                          <div className="space-y-2">
                            {staff.length > 0 ? (
                              staff.slice(0, 5).map((member) => (
                                <div key={member._id} className="flex items-center gap-2">
                                  <Checkbox />
                                  <label className="text-sm text-slate-700">{member.fullName}</label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No staff members available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approve Repayments */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Approve Repayments</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">Send Approval Notifications</p>
                            <p className="text-sm text-slate-600">Notify staff when repayments require approval</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="space-y-3">
                          <p className="font-medium text-slate-900">Assign Staff Members</p>
                          <div className="space-y-2">
                            {staff.length > 0 ? (
                              staff.slice(0, 5).map((member) => (
                                <div key={member._id} className="flex items-center gap-2">
                                  <Checkbox />
                                  <label className="text-sm text-slate-700">{member.fullName}</label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No staff members available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approve Savings Transactions */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Approve Savings Transactions</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">Send Approval Notifications</p>
                            <p className="text-sm text-slate-600">Notify staff when savings transactions require approval</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="space-y-3">
                          <p className="font-medium text-slate-900">Assign Staff Members</p>
                          <div className="space-y-2">
                            {staff.length > 0 ? (
                              staff.slice(0, 5).map((member) => (
                                <div key={member._id} className="flex items-center gap-2">
                                  <Checkbox />
                                  <label className="text-sm text-slate-700">{member.fullName}</label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No staff members available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approve Manual Journal */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Approve Manual Journal</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Checkbox className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">Send Approval Notifications</p>
                            <p className="text-sm text-slate-600">Notify staff when manual journal entries require approval</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="space-y-3">
                          <p className="font-medium text-slate-900">Assign Staff Members</p>
                          <div className="space-y-2">
                            {staff.length > 0 ? (
                              staff.slice(0, 5).map((member) => (
                                <div key={member._id} className="flex items-center gap-2">
                                  <Checkbox />
                                  <label className="text-sm text-slate-700">{member.fullName}</label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No staff members available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="border-t border-slate-200 pt-6 flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      Cancel
                    </Button>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Email Reminders
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Email Templates Section */}
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Email Templates</CardTitle>
                  <CardDescription className="text-slate-600">
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
                        className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{template.name}</p>
                          <p className="text-sm text-slate-600">{template.description}</p>
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
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
