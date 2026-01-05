/**
 * Organisation Settings - Comprehensive Page
 * Manages all organisation-level configurations including company settings, loan settings, and invoice details
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { BaseCrudService } from '@/services';
import { OrganisationSettings } from '@/entities';
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
  Upload,
  Globe,
  Clock,
  DollarSign,
  Calendar,
  FileCheck,
  MapPin,
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

export default function OrganisationSettingsComprehensivePage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Settings state
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [contactEmail, setContactEmail] = useState('');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!currentOrganisation?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load organisation settings
        const result = await BaseCrudService.getAll<OrganisationSettings>('organisationsettings', {}, { limit: 1 });
        if (result.items && result.items.length > 0) {
          setSettings(result.items[0]);
          if (result.items[0].companyLogo) {
            setLogoPreview(result.items[0].companyLogo);
          }
        } else {
          // Create default settings if none exist
          const defaultSettings: OrganisationSettings = {
            _id: crypto.randomUUID(),
            companyName: currentOrganisation.organizationName || '',
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
      } catch (error) {
        console.error('Error loading settings:', error);
        setErrorMessage('Failed to load organisation settings');
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

      // Update organisation contact email if changed
      if (currentOrganisation && contactEmail !== currentOrganisation.contactEmail) {
        await BaseCrudService.update('organisations', {
          ...currentOrganisation,
          contactEmail: contactEmail,
        });
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
            Organisation Settings
          </h1>
          <p className="text-primary-foreground/70">
            Configure company settings, loan parameters, and invoice details
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
            <TabsList className="grid w-full grid-cols-3 bg-slate-200 mb-8">
              <TabsTrigger value="company" className="text-slate-900 text-xs md:text-sm">
                <Globe className="w-4 h-4 mr-2" />
                Company Settings
              </TabsTrigger>
              <TabsTrigger value="loan" className="text-slate-900 text-xs md:text-sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Loan Settings
              </TabsTrigger>
              <TabsTrigger value="invoice" className="text-slate-900 text-xs md:text-sm">
                <FileCheck className="w-4 h-4 mr-2" />
                Invoice Details
              </TabsTrigger>
            </TabsList>

            {/* Company Settings Tab */}
            <TabsContent value="company" className="space-y-6">
              {settings && (
                <Card className="bg-slate-50 border-slate-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900">Company Settings</CardTitle>
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

            {/* Loan Settings Tab */}
            <TabsContent value="loan" className="space-y-6">
              {settings && (
                <Card className="bg-slate-50 border-slate-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900">Loan Settings</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Loan Repayment Cycle
                        </Label>
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
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Days in Month for Interest Calculation
                        </Label>
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
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Days in Year for Interest Calculation
                        </Label>
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

            {/* Invoice Details Tab */}
            <TabsContent value="invoice" className="space-y-6">
              {settings && (
                <Card className="bg-slate-50 border-slate-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900">Invoice Details</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Business Registration Number
                        </Label>
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
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Province/State
                        </Label>
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
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Zip/Postal Code
                        </Label>
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
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
