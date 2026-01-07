/**
 * Loan Fee Configuration Page
 * Comprehensive module for managing loan fees with accounting integration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { BaseCrudService, AuditService } from '@/services';
import { LoanFees } from '@/entities';
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
  DollarSign,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FEE_CATEGORIES = ['Processing', 'Insurance', 'Legal', 'Tax', 'Documentation', 'Other'];
const FEE_CHARGING_TYPES = [
  { value: 'Non-Deductible', label: 'Non-Deductible Fee', description: 'Appears in repayment schedule, requires payment, does not reduce principal' },
  { value: 'Deductible', label: 'Deductible Fee', description: 'Deducted from principal at disbursement, not in repayment schedule' },
  { value: 'Capitalized', label: 'Capitalized Fee', description: 'Added to loan principal, accrues interest, hidden from Accounting' },
];
const CALCULATION_METHODS = ['Fixed Amount', 'Percentage Based'];
const PERCENTAGE_BASIS = ['Total Loan Due Principal Amount', 'Total Loan Due Interest Amount', 'Total Loan Due Principal + Interest Amount'];
const ACCOUNTING_BASIS = ['Accrual Based Accounting', 'Cash Basis Accounting'];
const ACCOUNTING_FEE_TYPES = ['Fee is Revenue (Profit & Loss)', 'Fee is Payable to Third Party'];

interface LoanFeeFormData extends LoanFees {
  organisationId?: string;
  selectedPercentageBasis?: string[];
}

export default function LoanFeeConfigurationPage() {
  const navigate = useNavigate();
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('fees');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [feesList, setFeesList] = useState<LoanFeeFormData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoanFeeFormData>({
    _id: '',
    feeName: '',
    feeCategory: '',
    feeChargingType: 'Non-Deductible',
    isOptional: false,
    calculationMethod: 'Fixed Amount',
    fixedAmountValue: 0,
    percentageValue: 0,
    percentageBasis: '',
    accountingBasis: 'Accrual Based Accounting',
    accountingFeeType: 'Fee is Revenue (Profit & Loss)',
    organisationId: '',
    selectedPercentageBasis: [],
  });

  useEffect(() => {
    const loadFees = async () => {
      try {
        setIsLoading(true);
        if (currentOrganisation?._id) {
          const result = await BaseCrudService.getAll<LoanFeeFormData>('loanfees');
          setFeesList(result.items || []);
        }
      } catch (error) {
        console.error('Error loading loan fees:', error);
        setErrorMessage('Failed to load loan fees');
      } finally {
        setIsLoading(false);
      }
    };

    loadFees();
  }, [currentOrganisation]);

  const validateForm = (): boolean => {
    if (!formData.feeName?.trim()) {
      setErrorMessage('Fee name is required');
      return false;
    }
    if (!formData.feeCategory) {
      setErrorMessage('Fee category is required');
      return false;
    }
    if (!formData.feeChargingType) {
      setErrorMessage('Fee charging type is required');
      return false;
    }
    if (formData.calculationMethod === 'Fixed Amount' && formData.fixedAmountValue === 0) {
      setErrorMessage('Fixed amount value must be greater than 0');
      return false;
    }
    if (formData.calculationMethod === 'Percentage Based' && formData.percentageValue === 0) {
      setErrorMessage('Percentage value must be greater than 0');
      return false;
    }
    if (formData.calculationMethod === 'Percentage Based' && !formData.percentageBasis) {
      setErrorMessage('Please select at least one percentage basis');
      return false;
    }

    // Check for unique fee name
    const isDuplicate = feesList.some(
      (fee) => fee.feeName?.toLowerCase() === formData.feeName?.toLowerCase() && fee._id !== editingId
    );
    if (isDuplicate) {
      setErrorMessage('Fee name must be unique');
      return false;
    }

    return true;
  };

  const handleSaveFee = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const feeData: LoanFeeFormData = {
        ...formData,
        _id: formData._id || crypto.randomUUID(),
        organisationId: currentOrganisation?._id || '',
      };

      if (editingId) {
        await BaseCrudService.update('loanfees', feeData);
        setFeesList(feesList.map((f) => (f._id === editingId ? feeData : f)));
      } else {
        await BaseCrudService.create('loanfees', feeData);
        setFeesList([...feesList, feeData]);
      }

      // Log audit trail
      if (currentOrganisation?._id && member?.loginEmail) {
        await AuditService.logAction({
          staffMemberId: '',
          performedBy: member.loginEmail,
          actionType: editingId ? 'UPDATE' : 'CREATE',
          actionDetails: `Loan Fee ${formData.feeName}`,
          resourceAffected: 'Loan Fee',
          resourceId: feeData._id,
        });
      }

      setSuccessMessage(`Loan fee ${editingId ? 'updated' : 'created'} successfully`);
      resetForm();
      setActiveTab('fees');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save loan fee');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditFee = (fee: LoanFeeFormData) => {
    setFormData(fee);
    setEditingId(fee._id);
    setActiveTab('form');
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan fee?')) return;

    try {
      await BaseCrudService.delete('loanfees', id);
      setFeesList(feesList.filter((f) => f._id !== id));
      setSuccessMessage('Loan fee deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete loan fee');
    }
  };

  const resetForm = () => {
    setFormData({
      _id: '',
      feeName: '',
      feeCategory: '',
      feeChargingType: 'Non-Deductible',
      isOptional: false,
      calculationMethod: 'Fixed Amount',
      fixedAmountValue: 0,
      percentageValue: 0,
      percentageBasis: '',
      accountingBasis: 'Accrual Based Accounting',
      accountingFeeType: 'Fee is Revenue (Profit & Loss)',
      organisationId: '',
      selectedPercentageBasis: [],
    });
    setEditingId(null);
  };

  const togglePercentageBasis = (basis: string) => {
    const current = formData.selectedPercentageBasis || [];
    if (current.includes(basis)) {
      setFormData({
        ...formData,
        selectedPercentageBasis: current.filter((b) => b !== basis),
        percentageBasis: current.filter((b) => b !== basis).join(', '),
      });
    } else {
      const updated = [...current, basis];
      setFormData({
        ...formData,
        selectedPercentageBasis: updated,
        percentageBasis: updated.join(', '),
      });
    }
  };

  const getChargingTypeDescription = (type: string) => {
    return FEE_CHARGING_TYPES.find((t) => t.value === type)?.description || '';
  };

  const getAccountingPreview = () => {
    const isAccrual = formData.accountingBasis === 'Accrual Based Accounting';
    const isRevenue = formData.accountingFeeType === 'Fee is Revenue (Profit & Loss)';

    if (isAccrual) {
      if (isRevenue) {
        return {
          creation: 'Debit: Receivable – Fee | Credit: Revenue – Fee',
          payment: 'Debit: Cash/Bank | Credit: Receivable – Fee',
        };
      } else {
        return {
          creation: 'Debit: Receivable – Fee | Credit: Payable – Fee',
          payment: 'Debit: Cash/Bank | Credit: Receivable – Fee',
        };
      }
    } else {
      if (isRevenue) {
        return {
          creation: 'No entry on creation',
          payment: 'Debit: Cash/Bank | Credit: Revenue – Fee',
        };
      } else {
        return {
          creation: 'No entry on creation',
          payment: 'Debit: Cash/Bank | Credit: Payable – Fee',
        };
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const accountingPreview = getAccountingPreview();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
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
            Loan Fee Configuration
          </h1>
          <p className="text-primary-foreground/70">
            Manage loan fees with advanced accounting integration and calculation methods
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-200 mb-8">
              <TabsTrigger value="fees" className="text-slate-900">
                <DollarSign className="w-4 h-4 mr-2" />
                Loan Fees
              </TabsTrigger>
              <TabsTrigger value="form" className="text-slate-900">
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? 'Edit Fee' : 'New Fee'}
              </TabsTrigger>
              <TabsTrigger value="guide" className="text-slate-900">
                <BookOpen className="w-4 h-4 mr-2" />
                Guide
              </TabsTrigger>
            </TabsList>

            {/* Fees List Tab */}
            <TabsContent value="fees" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Loan Fees</CardTitle>
                    <CardDescription className="text-slate-600">
                      Total: {feesList.length} fees configured
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
                    New Fee
                  </Button>
                </CardHeader>
                <CardContent>
                  {feesList.length > 0 ? (
                    <div className="space-y-3">
                      {feesList.map((fee) => (
                        <div
                          key={fee._id}
                          className="p-4 bg-white border border-slate-200 rounded-lg flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{fee.feeName}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300 border">
                                {fee.feeCategory}
                              </Badge>
                              <Badge className="bg-purple-100 text-purple-800 border-purple-300 border">
                                {fee.feeChargingType}
                              </Badge>
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 border">
                                {fee.calculationMethod === 'Fixed Amount'
                                  ? `$${fee.fixedAmountValue}`
                                  : `${fee.percentageValue}%`}
                              </Badge>
                              {fee.isOptional && (
                                <Badge className="bg-green-100 text-green-800 border-green-300 border">
                                  Optional
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              {fee.accountingBasis} • {fee.accountingFeeType}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-slate-700 border-slate-300"
                              onClick={() => handleEditFee(fee)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-slate-300"
                              onClick={() => handleDeleteFee(fee._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      No loan fees configured. Click "New Fee" to create one.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fee Form Tab */}
            <TabsContent value="form" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">
                    {editingId ? 'Edit Loan Fee' : 'Create New Loan Fee'}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Configure fee details, calculation method, and accounting rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Basic Fee Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Fee Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Fee Name *</Label>
                        <Input
                          value={formData.feeName || ''}
                          onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                          placeholder="e.g., Processing Fee, Insurance Fee"
                          className="bg-white border-slate-300 text-slate-900"
                        />
                        <p className="text-xs text-slate-500 mt-1">Must be unique across all fees</p>
                      </div>

                      <div>
                        <Label className="text-slate-700 text-sm mb-2 block">Fee Category *</Label>
                        <Select
                          value={formData.feeCategory || ''}
                          onValueChange={(value) =>
                            setFormData({ ...formData, feeCategory: value })
                          }
                        >
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {FEE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Fee Type Selection */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Fee Charging Type *</h3>
                    <div className="space-y-3">
                      {FEE_CHARGING_TYPES.map((type) => (
                        <div key={type.value} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                          onClick={() => setFormData({ ...formData, feeChargingType: type.value })}
                        >
                          <input
                            type="radio"
                            name="feeChargingType"
                            value={type.value}
                            checked={formData.feeChargingType === type.value}
                            onChange={(e) =>
                              setFormData({ ...formData, feeChargingType: e.target.value })
                            }
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-slate-900">{type.label}</p>
                            <p className="text-sm text-slate-600">{type.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fee Calculation Method */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Fee Calculation Method *</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="calculationMethod"
                          value="Fixed Amount"
                          checked={formData.calculationMethod === 'Fixed Amount'}
                          onChange={(e) =>
                            setFormData({ ...formData, calculationMethod: e.target.value })
                          }
                          className="cursor-pointer"
                        />
                        <Label className="text-slate-700 cursor-pointer">Fixed Amount</Label>
                      </div>

                      {formData.calculationMethod === 'Fixed Amount' && (
                        <div className="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <Label className="text-slate-700 text-sm mb-2 block">Amount *</Label>
                          <Input
                            type="number"
                            value={formData.fixedAmountValue || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                fixedAmountValue: parseFloat(e.target.value),
                              })
                            }
                            placeholder="0.00"
                            className="bg-white border-slate-300 text-slate-900"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-4">
                        <input
                          type="radio"
                          name="calculationMethod"
                          value="Percentage Based"
                          checked={formData.calculationMethod === 'Percentage Based'}
                          onChange={(e) =>
                            setFormData({ ...formData, calculationMethod: e.target.value })
                          }
                          className="cursor-pointer"
                        />
                        <Label className="text-slate-700 cursor-pointer">Percentage Based (%)</Label>
                      </div>

                      {formData.calculationMethod === 'Percentage Based' && (
                        <div className="ml-6 space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">Percentage Value *</Label>
                            <Input
                              type="number"
                              value={formData.percentageValue || 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  percentageValue: parseFloat(e.target.value),
                                })
                              }
                              placeholder="0.00"
                              className="bg-white border-slate-300 text-slate-900"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div>
                            <Label className="text-slate-700 text-sm mb-2 block">
                              Calculate Fee Percentage of *
                            </Label>
                            <div className="space-y-2 p-3 bg-white border border-slate-300 rounded-lg">
                              {PERCENTAGE_BASIS.map((basis) => (
                                <div key={basis} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={(formData.selectedPercentageBasis || []).includes(
                                      basis
                                    )}
                                    onCheckedChange={() => togglePercentageBasis(basis)}
                                    className="border-2 border-blue-500"
                                  />
                                  <label className="text-sm text-slate-700 cursor-pointer">
                                    {basis}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fee Selection Behaviour */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={formData.isOptional || false}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isOptional: checked as boolean })
                        }
                        className="border-2 border-blue-500"
                      />
                      <Label className="text-slate-700 font-semibold cursor-pointer">
                        Allow this fee to be optional during loan creation
                      </Label>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      When enabled, loan officers can choose whether to apply this fee when creating a new loan.
                    </p>
                  </div>

                  {/* Accounting Configuration */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Accounting Configuration *</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-700 text-sm mb-3 block">Accounting Basis</Label>
                        <div className="space-y-2">
                          {ACCOUNTING_BASIS.map((basis) => (
                            <div key={basis} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="accountingBasis"
                                value={basis}
                                checked={formData.accountingBasis === basis}
                                onChange={(e) =>
                                  setFormData({ ...formData, accountingBasis: e.target.value })
                                }
                                className="cursor-pointer"
                              />
                              <Label className="text-slate-700 cursor-pointer">{basis}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <Label className="text-slate-700 text-sm mb-3 block">Fee Type</Label>
                        <div className="space-y-2">
                          {ACCOUNTING_FEE_TYPES.map((type) => (
                            <div key={type} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="accountingFeeType"
                                value={type}
                                checked={formData.accountingFeeType === type}
                                onChange={(e) =>
                                  setFormData({ ...formData, accountingFeeType: e.target.value })
                                }
                                className="cursor-pointer"
                              />
                              <Label className="text-slate-700 cursor-pointer">{type}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accounting Journal Preview */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Accounting Journal Preview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-semibold text-amber-900 mb-2">On Fee Creation</p>
                        <p className="text-sm text-amber-800 font-mono">{accountingPreview.creation}</p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-900 mb-2">On Fee Payment</p>
                        <p className="text-sm text-green-800 font-mono">{accountingPreview.payment}</p>
                      </div>
                    </div>
                  </div>

                  {/* System Controls Info */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">System Controls & Validations</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Fee name must be unique across all configured fees</li>
                          <li>Once used in active loans, fee logic is locked</li>
                          <li>Changes require admin permission</li>
                          <li>All transactions appear in Fees Report and Audit Trail</li>
                          <li>Fee behavior respects loan product rules and subscription permissions</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-slate-200 pt-6 flex gap-3 justify-end">
                    <Button
                      onClick={() => {
                        resetForm();
                        setActiveTab('fees');
                      }}
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveFee}
                      disabled={isSaving}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Fee'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guide Tab */}
            <TabsContent value="guide" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Loan Fee Configuration Guide</CardTitle>
                  <CardDescription className="text-slate-600">
                    Understanding fee types, calculation methods, and accounting rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Fee Charging Types</h4>
                    <div className="space-y-3">
                      {FEE_CHARGING_TYPES.map((type) => (
                        <div key={type.value} className="p-3 bg-white border border-slate-200 rounded">
                          <p className="font-medium text-slate-900">{type.label}</p>
                          <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-2">Calculation Methods</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-200 rounded">
                        <p className="font-medium text-slate-900">Fixed Amount</p>
                        <p className="text-sm text-slate-600 mt-1">
                          A specific amount is charged as the fee. Admin enters the exact value.
                        </p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded">
                        <p className="font-medium text-slate-900">Percentage Based</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Fee is calculated as a percentage of the loan amount. Can be based on principal, interest, or both.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-2">Accounting Basis</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-white border border-slate-200 rounded">
                        <p className="font-medium text-slate-900">Accrual Based Accounting</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Revenue is recognized when the fee is created, not when payment is received.
                        </p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded">
                        <p className="font-medium text-slate-900">Cash Basis Accounting</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Revenue is recognized only when the fee payment is received.
                        </p>
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
