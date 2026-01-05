/**
 * Loan Settings Page
 * Comprehensive loan product configuration with advanced settings
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { BaseCrudService, AuditService } from '@/services';
import { LoanProducts } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Settings,
  Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REPAYMENT_CYCLES = [
  'Daily',
  'Weekly',
  'Biweekly',
  'Monthly',
  'Bimonthly',
  'Quarterly',
  'Every 4 Months',
  'Semi-Annual',
  'Every 9 Months',
  'Yearly',
  'Lump-Sum',
];

const DISBURSEMENT_METHODS = ['Cash', 'Cheque', 'Wire Transfer', 'Online Transfer'];
const INTEREST_TYPES = ['Percentage', 'Fixed Amount'];
const LOAN_STATUSES = ['Open', 'Processing', 'Approved', 'Closed', 'Past Maturity'];

interface LoanProductFormData extends LoanProducts {
  // Advanced settings
  enableAdvancedParameters?: boolean;
  setLoanReleaseDateToday?: boolean;
  
  // Principal Amount Settings
  disbursedBy?: string[];
  minPrincipalAmount?: number;
  defaultPrincipalAmount?: number;
  maxPrincipalAmount?: number;
  
  // Interest Configuration
  interestType?: string;
  loanInterestPeriod?: string;
  minLoanInterest?: number;
  defaultLoanInterest?: number;
  maxLoanInterest?: number;
  
  // Loan Duration
  loanDurationPeriod?: string;
  minLoanDuration?: number;
  defaultLoanDuration?: number;
  maxLoanDuration?: number;
  
  // Repayment Settings
  repaymentCycle?: string;
  minRepayments?: number;
  defaultRepayments?: number;
  maxRepayments?: number;
  
  // Loan Due & Schedule
  decimalPlaces?: number;
  roundUpInterest?: boolean;
  
  // Repayment Order
  repaymentOrder?: string; // "Penalty,Fees,Interest,Principal"
  
  // Automated Payments
  enableAutomatedPayments?: boolean;
  automatedPaymentTimeRange?: string;
  automatedPaymentMethod?: string; // "Cash" or "Bank Account"
  
  // Extend Loan After Maturity
  enableExtendLoanAfterMaturity?: boolean;
  interestTypeAfterMaturity?: string;
  interestRateAfterMaturity?: number;
  recurringPeriodAfterMaturity?: string;
  repaymentCountAfterMaturity?: number;
  includeFeesAfterMaturity?: boolean;
  keepLoanStatusPastMaturity?: boolean;
  
  // Advanced Loan Schedule
  firstRepaymentAmount?: number;
  lastRepaymentAmount?: number;
  overrideEachRepaymentAmount?: boolean;
  calculateInterestProRata?: boolean;
  interestChargingMethod?: string;
  principalChargingMethod?: string;
  balloonRepaymentAmount?: number;
  moveFirstRepaymentDays?: number;
  loanScheduleDescription?: string;
  
  // Loan Status Defaults
  defaultLoanStatus?: string;
  
  // Accounting Integration
  sourceOfFunds?: string; // "Cash" or "Bank Account"
  
  // Duplicate Repayment Control
  stopDuplicateRepayments?: boolean;
}

export default function LoanSettingsPage() {
  const navigate = useNavigate();
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [productsList, setProductsList] = useState<LoanProductFormData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoanProductFormData>({
    _id: '',
    organisationId: '',
    productName: '',
    productType: '',
    description: '',
    interestRate: 0,
    minLoanAmount: 0,
    maxLoanAmount: 0,
    loanTermMonths: 0,
    processingFee: 0,
    eligibilityCriteria: '',
    isActive: true,
    // Advanced settings
    enableAdvancedParameters: true,
    setLoanReleaseDateToday: true,
    disbursedBy: [],
    minPrincipalAmount: 0,
    defaultPrincipalAmount: 0,
    maxPrincipalAmount: 0,
    interestType: 'Percentage',
    loanInterestPeriod: 'Monthly',
    minLoanInterest: 0,
    defaultLoanInterest: 0,
    maxLoanInterest: 0,
    loanDurationPeriod: 'Months',
    minLoanDuration: 0,
    defaultLoanDuration: 0,
    maxLoanDuration: 0,
    repaymentCycle: 'Monthly',
    minRepayments: 0,
    defaultRepayments: 0,
    maxRepayments: 0,
    decimalPlaces: 2,
    roundUpInterest: false,
    repaymentOrder: 'Penalty,Fees,Interest,Principal',
    enableAutomatedPayments: false,
    automatedPaymentTimeRange: '09:00-17:00',
    automatedPaymentMethod: 'Cash',
    enableExtendLoanAfterMaturity: false,
    interestTypeAfterMaturity: 'Percentage',
    interestRateAfterMaturity: 0,
    recurringPeriodAfterMaturity: 'Monthly',
    repaymentCountAfterMaturity: 0,
    includeFeesAfterMaturity: false,
    keepLoanStatusPastMaturity: false,
    firstRepaymentAmount: 0,
    lastRepaymentAmount: 0,
    overrideEachRepaymentAmount: false,
    calculateInterestProRata: false,
    interestChargingMethod: 'Flat Rate',
    principalChargingMethod: 'Equal Installments',
    balloonRepaymentAmount: 0,
    moveFirstRepaymentDays: 0,
    loanScheduleDescription: '',
    defaultLoanStatus: 'Open',
    sourceOfFunds: 'Cash',
    stopDuplicateRepayments: false,
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        if (currentOrganisation?._id) {
          const result = await BaseCrudService.getAll<LoanProductFormData>(
            'loanproducts',
            {},
            { limit: 100 }
          );
          setProductsList(result.items || []);
        }
      } catch (error) {
        console.error('Error loading loan products:', error);
        setErrorMessage('Failed to load loan products');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [currentOrganisation]);

  const validateForm = (): boolean => {
    if (!formData.productName?.trim()) {
      setErrorMessage('Product name is required');
      return false;
    }
    if (formData.enableAdvancedParameters && formData.disbursedBy?.length === 0) {
      setErrorMessage('Please select at least one disbursement method');
      return false;
    }
    return true;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const productData = {
        ...formData,
        _id: formData._id || crypto.randomUUID(),
        organisationId: currentOrganisation?._id || '',
      };

      if (editingId) {
        await BaseCrudService.update('loanproducts', productData);
        setProductsList(productsList.map(p => p._id === editingId ? productData : p));
      } else {
        await BaseCrudService.create('loanproducts', productData);
        setProductsList([...productsList, productData]);
      }

      // Log audit trail
      if (currentOrganisation?._id && member?.loginEmail) {
        await AuditService.logAction({
          _id: crypto.randomUUID(),
          staffMemberId: '',
          performedBy: member.loginEmail,
          timestamp: new Date(),
          actionType: editingId ? 'UPDATE' : 'CREATE',
          actionDetails: `Loan Product ${formData.productName}`,
          resourceAffected: 'Loan Product',
          resourceId: productData._id,
        });
      }

      setSuccessMessage(`Loan product ${editingId ? 'updated' : 'created'} successfully`);
      resetForm();
      setActiveTab('products');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save loan product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = (product: LoanProductFormData) => {
    setFormData(product);
    setEditingId(product._id);
    setActiveTab('form');
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan product?')) return;

    try {
      await BaseCrudService.delete('loanproducts', id);
      setProductsList(productsList.filter(p => p._id !== id));
      setSuccessMessage('Loan product deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete loan product');
    }
  };

  const resetForm = () => {
    setFormData({
      _id: '',
      organisationId: '',
      productName: '',
      productType: '',
      description: '',
      interestRate: 0,
      minLoanAmount: 0,
      maxLoanAmount: 0,
      loanTermMonths: 0,
      processingFee: 0,
      eligibilityCriteria: '',
      isActive: true,
      enableAdvancedParameters: true,
      setLoanReleaseDateToday: true,
      disbursedBy: [],
      minPrincipalAmount: 0,
      defaultPrincipalAmount: 0,
      maxPrincipalAmount: 0,
      interestType: 'Percentage',
      loanInterestPeriod: 'Monthly',
      minLoanInterest: 0,
      defaultLoanInterest: 0,
      maxLoanInterest: 0,
      loanDurationPeriod: 'Months',
      minLoanDuration: 0,
      defaultLoanDuration: 0,
      maxLoanDuration: 0,
      repaymentCycle: 'Monthly',
      minRepayments: 0,
      defaultRepayments: 0,
      maxRepayments: 0,
      decimalPlaces: 2,
      roundUpInterest: false,
      repaymentOrder: 'Penalty,Fees,Interest,Principal',
      enableAutomatedPayments: false,
      automatedPaymentTimeRange: '09:00-17:00',
      automatedPaymentMethod: 'Cash',
      enableExtendLoanAfterMaturity: false,
      interestTypeAfterMaturity: 'Percentage',
      interestRateAfterMaturity: 0,
      recurringPeriodAfterMaturity: 'Monthly',
      repaymentCountAfterMaturity: 0,
      includeFeesAfterMaturity: false,
      keepLoanStatusPastMaturity: false,
      firstRepaymentAmount: 0,
      lastRepaymentAmount: 0,
      overrideEachRepaymentAmount: false,
      calculateInterestProRata: false,
      interestChargingMethod: 'Flat Rate',
      principalChargingMethod: 'Equal Installments',
      balloonRepaymentAmount: 0,
      moveFirstRepaymentDays: 0,
      loanScheduleDescription: '',
      defaultLoanStatus: 'Open',
      sourceOfFunds: 'Cash',
      stopDuplicateRepayments: false,
    });
    setEditingId(null);
  };

  const toggleDisbursementMethod = (method: string) => {
    const current = formData.disbursedBy || [];
    if (current.includes(method)) {
      setFormData({
        ...formData,
        disbursedBy: current.filter(m => m !== method),
      });
    } else {
      setFormData({
        ...formData,
        disbursedBy: [...current, method],
      });
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
            Loan Settings
          </h1>
          <p className="text-primary-foreground/70">
            Configure loan products and advanced lending parameters
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
            <TabsList className="grid w-full grid-cols-4 bg-slate-200 mb-8">
              <TabsTrigger value="products" className="text-slate-900">
                <Settings className="w-4 h-4 mr-2" />
                Loan Products
              </TabsTrigger>
              <TabsTrigger value="form" className="text-slate-900">
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? 'Edit Product' : 'New Product'}
              </TabsTrigger>
              <TabsTrigger value="penalties" className="text-slate-900">
                <AlertCircle className="w-4 h-4 mr-2" />
                Penalties
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-slate-900">
                <Settings className="w-4 h-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Products List Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Loan Products</CardTitle>
                    <CardDescription className="text-slate-600">
                      Total: {productsList.length} products
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
                    New Product
                  </Button>
                </CardHeader>
                <CardContent>
                  {productsList.length > 0 ? (
                    <div className="space-y-3">
                      {productsList.map((product) => (
                        <div
                          key={product._id}
                          className="p-4 bg-white border border-slate-200 rounded-lg flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{product.productName}</p>
                            <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                            <div className="flex gap-2 mt-2">
                              {product.isActive ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300 border">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 border-gray-300 border">
                                  Inactive
                                </Badge>
                              )}
                              {product.interestRate && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-300 border">
                                  {product.interestRate}% Interest
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-slate-700 border-slate-300"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-slate-300"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      No loan products found. Click "New Product" to create one.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Penalties Tab */}
            <TabsContent value="penalties" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Loan Penalty Settings</CardTitle>
                  <CardDescription className="text-slate-600">
                    Configure late payment, early settlement, and prepayment penalties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-slate-600 mb-4">
                      Select a loan product to configure its penalty settings
                    </p>
                    <Button
                      onClick={() => setActiveTab('products')}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      View Loan Products
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Advanced Loan Configuration</CardTitle>
                  <CardDescription className="text-slate-600">
                    Access additional loan management tools and configurations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => navigate('/admin/loans/loan-products')}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start justify-start border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      <div className="font-semibold mb-1">Loan Products List</div>
                      <div className="text-xs text-slate-600">View and manage all loan products</div>
                    </Button>
                    <Button
                      onClick={() => navigate('/admin/loans/loan-products/add-edit')}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start justify-start border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      <div className="font-semibold mb-1">Add/Edit Loan Product</div>
                      <div className="text-xs text-slate-600">Create or modify loan products</div>
                    </Button>
                    <Button
                      onClick={() => navigate('/admin/loans/loan-products/penalty-settings')}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start justify-start border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      <div className="font-semibold mb-1">Penalty Settings</div>
                      <div className="text-xs text-slate-600">Configure penalty parameters</div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Product Form Tab */}
            <TabsContent value="form" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">
                    {editingId ? 'Edit Loan Product' : 'Create New Loan Product'}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Configure loan product details and advanced settings
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
                          Loan Product Name *
                        </Label>
                        <Input
                          value={formData.productName || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, productName: e.target.value })
                          }
                          placeholder="e.g., Personal Loan, Business Loan"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Product Type
                        </Label>
                        <Input
                          value={formData.productType || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, productType: e.target.value })
                          }
                          placeholder="e.g., Secured, Unsecured"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Description
                        </Label>
                        <Input
                          value={formData.description || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Brief description of this loan product"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Eligibility Criteria
                        </Label>
                        <Input
                          value={formData.eligibilityCriteria || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, eligibilityCriteria: e.target.value })
                          }
                          placeholder="e.g., Minimum age 18, Valid ID"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">
                          Is Active
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox
                            checked={formData.isActive || false}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, isActive: checked as boolean })
                            }
                            className="border-2 border-blue-500"
                          />
                          <span className="text-sm text-slate-700">
                            {formData.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enable Advanced Parameters */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Checkbox
                        checked={formData.enableAdvancedParameters || false}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            enableAdvancedParameters: checked as boolean,
                          })
                        }
                        className="border-2 border-blue-500"
                      />
                      <Label className="text-slate-700 font-semibold cursor-pointer">
                        Enable Advanced Parameters
                      </Label>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Enable this to configure detailed loan settings. If disabled, all subsequent fields are optional.
                    </p>
                  </div>

                  {formData.enableAdvancedParameters && (
                    <>
                      {/* Loan Release Date */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Loan Release Date
                        </h3>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={formData.setLoanReleaseDateToday || false}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                setLoanReleaseDateToday: checked as boolean,
                              })
                            }
                            className="border-2 border-blue-500"
                          />
                          <Label className="text-slate-700 cursor-pointer">
                            Set Loan Released Date to Today's Date
                          </Label>
                        </div>
                      </div>

                      {/* Principal Amount Settings */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Principal Amount Settings
                        </h3>
                        <div className="mb-4">
                          <Label className="text-slate-700 text-sm mb-2 block">
                            Disbursed By (Multi-select) *
                          </Label>
                          <div className="space-y-2 p-3 bg-white border border-slate-300 rounded-lg">
                            {DISBURSEMENT_METHODS.map((method) => (
                              <div key={method} className="flex items-center gap-2">
                                <Checkbox
                                  checked={(formData.disbursedBy || []).includes(method)}
                                  onCheckedChange={() => toggleDisbursementMethod(method)}
                                  className="border-2 border-blue-500"
                                />
                                <label className="text-sm text-slate-700 cursor-pointer">
                                  {method}
                                </label>
                              </div>
                            ))}
                          </div>
                          {(formData.disbursedBy || []).length === 0 && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Please select at least one disbursement method
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Minimum Principal Amount
                            </Label>
                            <Input
                              type="number"
                              value={formData.minPrincipalAmount || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  minPrincipalAmount: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Default Principal Amount
                            </Label>
                            <Input
                              type="number"
                              value={formData.defaultPrincipalAmount || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  defaultPrincipalAmount: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Maximum Principal Amount
                            </Label>
                            <Input
                              type="number"
                              value={formData.maxPrincipalAmount || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maxPrincipalAmount: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Interest Configuration */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Interest Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Interest Type
                            </Label>
                            <Select
                              value={formData.interestType || 'Percentage'}
                              onValueChange={(value) =>
                                setFormData({ ...formData, interestType: value })
                              }
                            >
                              <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {INTEREST_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Loan Interest Period
                            </Label>
                            <Input
                              value={formData.loanInterestPeriod || 'Monthly'}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  loanInterestPeriod: e.target.value,
                                })
                              }
                              placeholder="e.g., Monthly, Quarterly"
                              className="bg-white border-slate-300 text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Minimum Loan Interest
                            </Label>
                            <Input
                              type="number"
                              value={formData.minLoanInterest || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  minLoanInterest: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Default Loan Interest
                            </Label>
                            <Input
                              type="number"
                              value={formData.defaultLoanInterest || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  defaultLoanInterest: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Maximum Loan Interest
                            </Label>
                            <Input
                              type="number"
                              value={formData.maxLoanInterest || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maxLoanInterest: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Loan Duration */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Loan Duration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Loan Duration Period
                            </Label>
                            <Input
                              value={formData.loanDurationPeriod || 'Months'}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  loanDurationPeriod: e.target.value,
                                })
                              }
                              placeholder="e.g., Months, Years"
                              className="bg-white border-slate-300 text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Minimum Loan Duration
                            </Label>
                            <Input
                              type="number"
                              value={formData.minLoanDuration || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  minLoanDuration: parseInt(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Default Loan Duration
                            </Label>
                            <Input
                              type="number"
                              value={formData.defaultLoanDuration || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  defaultLoanDuration: parseInt(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Maximum Loan Duration
                            </Label>
                            <Input
                              type="number"
                              value={formData.maxLoanDuration || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maxLoanDuration: parseInt(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Repayment Settings */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Repayment Settings
                        </h3>
                        <div className="mb-6">
                          <Label className="text-slate-700 text-sm mb-2 block">
                            Repayment Cycle
                          </Label>
                          <Select
                            value={formData.repaymentCycle || 'Monthly'}
                            onValueChange={(value) =>
                              setFormData({ ...formData, repaymentCycle: value })
                            }
                          >
                            <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                              <SelectValue />
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Minimum Number of Repayments
                            </Label>
                            <Input
                              type="number"
                              value={formData.minRepayments || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  minRepayments: parseInt(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Default Number of Repayments
                            </Label>
                            <Input
                              type="number"
                              value={formData.defaultRepayments || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  defaultRepayments: parseInt(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Maximum Number of Repayments
                            </Label>
                            <Input
                              type="number"
                              value={formData.maxRepayments || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maxRepayments: parseInt(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Loan Due & Schedule Amounts */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Loan Due & Schedule Amounts
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Decimal Places (Rounding Rule)
                            </Label>
                            <Input
                              type="number"
                              value={formData.decimalPlaces || 2}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  decimalPlaces: parseInt(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                              max="10"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Round Interest
                            </Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Checkbox
                                checked={formData.roundUpInterest || false}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    roundUpInterest: checked as boolean,
                                  })
                                }
                                className="border-2 border-blue-500"
                              />
                              <span className="text-sm text-slate-700">
                                {formData.roundUpInterest ? 'Round Up' : 'Round Off'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Repayment Order */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Repayment Order
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                          Define the allocation order for repayments. Current order: Penalty → Fees → Interest → Principal
                        </p>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800">
                            Changing the repayment order will affect all open loans using this product.
                          </p>
                        </div>
                      </div>

                      {/* Automated Payments */}
                      <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Checkbox
                            checked={formData.enableAutomatedPayments || false}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                enableAutomatedPayments: checked as boolean,
                              })
                            }
                            className="border-2 border-blue-500"
                          />
                          <Label className="text-slate-700 font-semibold cursor-pointer">
                            Enable Automated Payments
                          </Label>
                        </div>

                        {formData.enableAutomatedPayments && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-slate-700 text-sm mb-2 block">
                                Time Range
                              </Label>
                              <Input
                                value={formData.automatedPaymentTimeRange || '09:00-17:00'}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    automatedPaymentTimeRange: e.target.value,
                                  })
                                }
                                placeholder="e.g., 09:00-17:00"
                                className="bg-white border-slate-300 text-slate-900"
                              />
                            </div>

                            <div>
                              <Label className="text-slate-700 text-sm mb-2 block">
                                Payment Method
                              </Label>
                              <Select
                                value={formData.automatedPaymentMethod || 'Cash'}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    automatedPaymentMethod: value,
                                  })
                                }
                              >
                                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Cash">Cash</SelectItem>
                                  <SelectItem value="Bank Account">Bank Account</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Extend Loan After Maturity */}
                      <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Checkbox
                            checked={formData.enableExtendLoanAfterMaturity || false}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                enableExtendLoanAfterMaturity: checked as boolean,
                              })
                            }
                            className="border-2 border-blue-500"
                          />
                          <Label className="text-slate-700 font-semibold cursor-pointer">
                            Extend Loan After Maturity
                          </Label>
                        </div>

                        {formData.enableExtendLoanAfterMaturity && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-slate-700 text-sm mb-2 block">
                                Interest Type After Maturity
                              </Label>
                              <Select
                                value={formData.interestTypeAfterMaturity || 'Percentage'}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    interestTypeAfterMaturity: value,
                                  })
                                }
                              >
                                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {INTEREST_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-slate-700 text-sm mb-2 block">
                                Interest Rate After Maturity (%)
                              </Label>
                              <Input
                                type="number"
                                value={formData.interestRateAfterMaturity || 0}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    interestRateAfterMaturity: parseFloat(e.target.value),
                                  })
                                }
                                className="bg-white border-slate-300 text-slate-900"
                                min="0"
                                step="0.01"
                              />
                            </div>

                            <div>
                              <Label className="text-slate-700 text-sm mb-2 block">
                                Recurring Period After Maturity
                              </Label>
                              <Input
                                value={formData.recurringPeriodAfterMaturity || 'Monthly'}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    recurringPeriodAfterMaturity: e.target.value,
                                  })
                                }
                                placeholder="e.g., Monthly, Quarterly"
                                className="bg-white border-slate-300 text-slate-900"
                              />
                            </div>

                            <div>
                              <Label className="text-slate-700 text-sm mb-2 block">
                                Number of Repayments After Maturity (0 = Unlimited)
                              </Label>
                              <Input
                                type="number"
                                value={formData.repaymentCountAfterMaturity || 0}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    repaymentCountAfterMaturity: parseInt(e.target.value),
                                  })
                                }
                                className="bg-white border-slate-300 text-slate-900"
                                min="0"
                              />
                            </div>

                            <div>
                              <Label className="text-slate-700 text-sm mb-2 block">
                                Include Fees After Maturity
                              </Label>
                              <div className="flex items-center gap-2 mt-2">
                                <Checkbox
                                  checked={formData.includeFeesAfterMaturity || false}
                                  onCheckedChange={(checked) =>
                                    setFormData({
                                      ...formData,
                                      includeFeesAfterMaturity: checked as boolean,
                                    })
                                  }
                                  className="border-2 border-blue-500"
                                />
                                <span className="text-sm text-slate-700">Yes</span>
                              </div>
                            </div>

                            <div>
                              <Label className="text-slate-700 text-sm mb-2 block">
                                Keep Loan Status as Past Maturity
                              </Label>
                              <div className="flex items-center gap-2 mt-2">
                                <Checkbox
                                  checked={formData.keepLoanStatusPastMaturity || false}
                                  onCheckedChange={(checked) =>
                                    setFormData({
                                      ...formData,
                                      keepLoanStatusPastMaturity: checked as boolean,
                                    })
                                  }
                                  className="border-2 border-blue-500"
                                />
                                <span className="text-sm text-slate-700">Yes</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Advanced Loan Schedule Settings */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Advanced Loan Schedule Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              First Repayment Amount (Flat-Rate only)
                            </Label>
                            <Input
                              type="number"
                              value={formData.firstRepaymentAmount || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  firstRepaymentAmount: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Last Repayment Amount (Flat-Rate only)
                            </Label>
                            <Input
                              type="number"
                              value={formData.lastRepaymentAmount || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  lastRepaymentAmount: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Override Each Repayment Amount
                            </Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Checkbox
                                checked={formData.overrideEachRepaymentAmount || false}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    overrideEachRepaymentAmount: checked as boolean,
                                  })
                                }
                                className="border-2 border-blue-500"
                              />
                              <span className="text-sm text-slate-700">Enable</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Calculate Interest on Pro-Rata Basis
                            </Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Checkbox
                                checked={formData.calculateInterestProRata || false}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    calculateInterestProRata: checked as boolean,
                                  })
                                }
                                className="border-2 border-blue-500"
                              />
                              <span className="text-sm text-slate-700">Yes</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Interest Charging Method
                            </Label>
                            <Input
                              value={formData.interestChargingMethod || 'Flat Rate'}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  interestChargingMethod: e.target.value,
                                })
                              }
                              placeholder="e.g., Flat Rate, Reducing Balance"
                              className="bg-white border-slate-300 text-slate-900"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Principal Charging Method
                            </Label>
                            <Input
                              value={formData.principalChargingMethod || 'Equal Installments'}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  principalChargingMethod: e.target.value,
                                })
                              }
                              placeholder="e.g., Equal Installments, Reducing Balance"
                              className="bg-white border-slate-300 text-slate-900"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Balloon Repayment Amount (Reducing Balance – Equal Installments only)
                            </Label>
                            <Input
                              type="number"
                              value={formData.balloonRepaymentAmount || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  balloonRepaymentAmount: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Move First Repayment Date if Days from Release Date are Less Than
                            </Label>
                            <Input
                              type="number"
                              value={formData.moveFirstRepaymentDays || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  moveFirstRepaymentDays: parseInt(e.target.value),
                                })
                              }
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Loan Schedule Description
                            </Label>
                            <Input
                              value={formData.loanScheduleDescription || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  loanScheduleDescription: e.target.value,
                                })
                              }
                              placeholder="Additional notes about the loan schedule"
                              className="bg-white border-slate-300 text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Loan Status Defaults */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Loan Status Defaults
                        </h3>
                        <div>
                          <Label className="text-slate-700 text-sm mb-2 block">
                            Auto-select Loan Status on Add Loan Page
                          </Label>
                          <Select
                            value={formData.defaultLoanStatus || 'Open'}
                            onValueChange={(value) =>
                              setFormData({ ...formData, defaultLoanStatus: value })
                            }
                          >
                            <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LOAN_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Accounting Integration */}
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Accounting Integration
                        </h3>
                        <div>
                          <Label className="text-slate-700 text-sm mb-2 block">
                            Source of Funds for Principal Amount
                          </Label>
                          <Select
                            value={formData.sourceOfFunds || 'Cash'}
                            onValueChange={(value) =>
                              setFormData({ ...formData, sourceOfFunds: value })
                            }
                          >
                            <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Bank Account">Bank Account</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Duplicate Repayment Control */}
                      <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Checkbox
                            checked={formData.stopDuplicateRepayments || false}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                stopDuplicateRepayments: checked as boolean,
                              })
                            }
                            className="border-2 border-blue-500"
                          />
                          <Label className="text-slate-700 font-semibold cursor-pointer">
                            Stop Duplicate Repayments with Same Date & Amount
                          </Label>
                        </div>
                        {formData.stopDuplicateRepayments && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800">
                              The system will block duplicate repayments with the same date and amount, and display an error message.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t border-slate-200 pt-6 flex gap-3 justify-end">
                    <Button
                      onClick={() => {
                        resetForm();
                        setActiveTab('products');
                      }}
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProduct}
                      disabled={isSaving}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Product'}
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
