/**
 * Disbursement Page
 * Comprehensive loan disbursement processing with validation, fees, and audit trail
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import {
  LoanService,
  CustomerService,
  AuthorizationService,
  Permissions,
  AuditService,
  DisbursementService,
  KYCService,
  CollateralService,
} from '@/services';
import { Loans, CustomerProfiles, LoanProducts } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Lock,
  FileText,
  Smartphone,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

interface DisbursementFormData {
  disbursementMethod: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque' | 'internal_wallet';
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  mobileNetwork?: string;
  mobileNumber?: string;
  mobileAccountHolder?: string;
  chequeNumber?: string;
  chequeDate?: string;
  referenceNumber: string;
  proofOfPaymentUrl?: string;
  disbursementDate: string;
  confirmPaymentDetails: boolean;
  confirmNetAmount: boolean;
}

interface LoanWithCustomer extends Loans {
  customer?: CustomerProfiles;
  product?: LoanProducts;
  monthlyPayment?: number;
  validationResult?: any;
}

interface DisbursementValidation {
  isValid: boolean;
  checks: {
    allApprovalsCompleted: boolean;
    kycVerified: boolean;
    collateralPerfected: boolean;
    guarantorsVerified: boolean;
    customerAccountActive: boolean;
    noDuplicateDisbursement: boolean;
  };
  failedChecks: string[];
}

export default function DisbursementPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [loans, setLoans] = useState<LoanWithCustomer[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [canDisburse, setCanDisburse] = useState(false);
  const [currentStep, setCurrentStep] = useState<'queue' | 'validation' | 'setup' | 'confirmation'>(
    'queue'
  );
  const [validationResult, setValidationResult] = useState<DisbursementValidation | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('bank_transfer');
  const [filters, setFilters] = useState({
    branch: '',
    dateFrom: '',
    dateTo: '',
    product: '',
    amountMin: '',
    amountMax: '',
  });

  const form = useForm<DisbursementFormData>({
    defaultValues: {
      disbursementDate: new Date().toISOString().split('T')[0],
      disbursementMethod: 'bank_transfer',
      confirmPaymentDetails: false,
      confirmNetAmount: false,
    },
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentStaff?._id || !currentOrganisation?._id) {
        setCanDisburse(false);
        return;
      }

      if (currentStaff?.role === 'System Owner' || currentStaff?.role === 'Admin/Owner') {
        setCanDisburse(true);
        return;
      }

      try {
        const hasPermission = await AuthorizationService.hasPermission(
          currentStaff._id,
          currentOrganisation._id,
          Permissions.DISBURSE_LOAN
        );

        setCanDisburse(hasPermission);

        if (!hasPermission) {
          console.warn('User does not have DISBURSE_LOAN permission', {
            staffId: currentStaff._id,
            organisationId: currentOrganisation._id,
            staffRole: currentStaff.role,
          });
        }
      } catch (error) {
        console.error('Error checking disbursement permission:', error);
        if (currentStaff?.role === 'System Owner' || currentStaff?.role === 'Admin/Owner') {
          setCanDisburse(true);
        } else {
          setCanDisburse(false);
        }
      }
    };

    checkPermissions();
  }, [currentStaff, currentOrganisation]);

  useEffect(() => {
    const loadLoans = async () => {
      if (!currentOrganisation?._id) return;

      try {
        setIsLoading(true);

        // Get approved loans ready for disbursement
        const approvedLoans = await DisbursementService.getApprovedLoansForDisbursement(
          currentOrganisation._id
        );

        // Enrich with customer and product data
        const enrichedLoans = await Promise.all(
          approvedLoans.map(async (loan) => {
            const customer = loan.customerId
              ? await CustomerService.getCustomer(loan.customerId)
              : undefined;
            const product = loan.loanProductId
              ? await LoanService.getLoanProduct(loan.loanProductId)
              : undefined;
            const monthlyPayment = LoanService.calculateMonthlyPayment(
              loan.principalAmount || 0,
              loan.interestRate || 0,
              loan.loanTermMonths || 0
            );

            // Validate each loan
            const validation = await DisbursementService.validateLoanForDisbursement(
              loan._id || ''
            );

            return {
              ...loan,
              customer,
              product,
              monthlyPayment,
              validationResult: validation,
            };
          })
        );

        setLoans(enrichedLoans);
      } catch (error) {
        console.error('Error loading loans:', error);
        setErrorMessage('Failed to load approved loans');
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, [currentOrganisation]);

  const handleSelectLoan = async (loan: LoanWithCustomer) => {
    setSelectedLoan(loan);
    setCurrentStep('validation');

    // Validate loan
    const validation = await DisbursementService.validateLoanForDisbursement(loan._id || '');
    setValidationResult(validation);

    // Check segregation of duties
    if (currentStaff?._id) {
      const canProceed = await DisbursementService.checkSegregationOfDuties(
        loan._id || '',
        currentStaff._id
      );
      if (!canProceed) {
        setErrorMessage(
          'You cannot disburse this loan as you were the one who approved it. Segregation of duties required.'
        );
        setCurrentStep('queue');
        return;
      }
    }

    setDisbursementDialogOpen(true);
  };

  const handleDisburse = async (data: DisbursementFormData) => {
    if (!selectedLoan || !currentOrganisation?._id || !currentStaff?._id) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Final validation
      if (!data.confirmPaymentDetails || !data.confirmNetAmount) {
        setErrorMessage('Please confirm all required details');
        return;
      }

      // Generate disbursement reference
      const disbursementRef = `DISB-${Date.now()}`;

      // Calculate net disbursement
      const processingFee = selectedLoan.product?.processingFee || 0;
      const netAmount = DisbursementService.calculateNetDisbursement(
        selectedLoan.principalAmount || 0,
        processingFee
      );

      // Create disbursement
      await DisbursementService.createDisbursement(
        {
          loanId: selectedLoan._id || '',
          disbursementMethod: data.disbursementMethod,
          bankName: data.bankName,
          bankBranch: data.bankBranch,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          mobileNetwork: data.mobileNetwork,
          mobileNumber: data.mobileNumber,
          mobileAccountHolder: data.mobileAccountHolder,
          chequeNumber: data.chequeNumber,
          chequeDate: data.chequeDate,
          referenceNumber: disbursementRef,
          proofOfPaymentUrl: data.proofOfPaymentUrl,
          disbursementDate: new Date(data.disbursementDate),
          netDisbursementAmount: netAmount,
          processingFee,
        },
        currentStaff._id,
        currentOrganisation._id
      );

      // Generate payment schedule
      await LoanService.generatePaymentSchedule(
        selectedLoan._id || '',
        selectedLoan.principalAmount || 0,
        selectedLoan.interestRate || 0,
        selectedLoan.loanTermMonths || 0,
        new Date(data.disbursementDate)
      );

      setSuccessMessage(
        `Loan ${selectedLoan.loanNumber} disbursed successfully! Reference: ${disbursementRef}`
      );
      setDisbursementDialogOpen(false);
      setCurrentStep('queue');
      form.reset();

      // Reload loans
      const approvedLoans = await DisbursementService.getApprovedLoansForDisbursement(
        currentOrganisation._id
      );
      const enrichedLoans = await Promise.all(
        approvedLoans.map(async (loan) => {
          const customer = loan.customerId
            ? await CustomerService.getCustomer(loan.customerId)
            : undefined;
          const product = loan.loanProductId
            ? await LoanService.getLoanProduct(loan.loanProductId)
            : undefined;
          const monthlyPayment = LoanService.calculateMonthlyPayment(
            loan.principalAmount || 0,
            loan.interestRate || 0,
            loan.loanTermMonths || 0
          );

          const validation = await DisbursementService.validateLoanForDisbursement(
            loan._id || ''
          );

          return {
            ...loan,
            customer,
            product,
            monthlyPayment,
            validationResult: validation,
          };
        })
      );

      setLoans(enrichedLoans);
      setSelectedLoan(null);
    } catch (error) {
      console.error('Error disbursing loan:', error);
      setErrorMessage('Failed to disburse loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
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

  if (!canDisburse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/70">
                You do not have permission to disburse loans. Only Finance Officers and above can
                access this module.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredLoans = loans.filter((loan) => {
    if (filters.branch && loan.customer?.residentialAddress !== filters.branch) return false;
    if (filters.dateFrom && new Date(loan._createdDate || '') < new Date(filters.dateFrom))
      return false;
    if (filters.dateTo && new Date(loan._createdDate || '') > new Date(filters.dateTo))
      return false;
    if (filters.product && loan.loanProductId !== filters.product) return false;
    if (filters.amountMin && (loan.principalAmount || 0) < parseFloat(filters.amountMin))
      return false;
    if (filters.amountMax && (loan.principalAmount || 0) > parseFloat(filters.amountMax))
      return false;
    return true;
  });

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
            Loan Disbursement Module
          </h1>
          <p className="text-primary-foreground/70">
            Process and manage loan disbursements with full compliance and audit trail
          </p>
        </motion.div>

        {/* Success Message */}
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

        {/* Error Message */}
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

        {/* Filters */}
        {currentStep === 'queue' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-primary-foreground/5 border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="text-primary">Disbursement Queue Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-primary-foreground/70 text-sm mb-2 block">
                      Date From
                    </Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="bg-primary/5 border-primary/20 text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-primary-foreground/70 text-sm mb-2 block">
                      Date To
                    </Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="bg-primary/5 border-primary/20 text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-primary-foreground/70 text-sm mb-2 block">
                      Amount Range
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.amountMin}
                        onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                        className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.amountMax}
                        onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                        className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Disbursement Queue */}
        {currentStep === 'queue' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {filteredLoans.length > 0 ? (
              <div className="space-y-4">
                {filteredLoans.map((loan, idx) => (
                  <motion.div
                    key={loan._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition-all">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                          {/* Loan ID */}
                          <div>
                            <p className="text-xs text-primary-foreground/70 mb-1">Loan ID</p>
                            <p className="font-semibold text-primary-foreground text-sm">
                              {loan.loanNumber}
                            </p>
                          </div>

                          {/* Customer */}
                          <div>
                            <p className="text-xs text-primary-foreground/70 mb-1">Customer</p>
                            <p className="font-semibold text-primary-foreground text-sm">
                              {loan.customer?.firstName} {loan.customer?.lastName}
                            </p>
                          </div>

                          {/* Amount */}
                          <div>
                            <p className="text-xs text-primary-foreground/70 mb-1">Amount</p>
                            <p className="font-semibold text-secondary">
                              ZMW {(loan.principalAmount || 0).toLocaleString()}
                            </p>
                          </div>

                          {/* Status */}
                          <div>
                            <p className="text-xs text-primary-foreground/70 mb-1">Status</p>
                            {loan.validationResult?.isValid ? (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Ready
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-600 border-red-500/20 border text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                Blocked
                              </Badge>
                            )}
                          </div>

                          {/* Validation Issues */}
                          {!loan.validationResult?.isValid && (
                            <div className="md:col-span-2">
                              <p className="text-xs text-primary-foreground/70 mb-1">Issues</p>
                              <div className="text-xs text-red-500 space-y-1">
                                {loan.validationResult?.failedChecks.slice(0, 2).map((check, i) => (
                                  <p key={i}>• {check}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleSelectLoan(loan)}
                              disabled={!loan.validationResult?.isValid}
                              className="bg-secondary text-primary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                              Initiate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                    No Loans Ready for Disbursement
                  </h3>
                  <p className="text-primary-foreground/70">
                    All approved loans have been disbursed or are pending compliance checks.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Disbursement Dialog */}
        <Dialog open={disbursementDialogOpen} onOpenChange={setDisbursementDialogOpen}>
          <DialogContent className="bg-primary-foreground/95 border-primary-foreground/20 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-primary">Disbursement Processing</DialogTitle>
              <DialogDescription className="text-primary/70">
                {selectedLoan?.loanNumber} - {selectedLoan?.customer?.firstName}{' '}
                {selectedLoan?.customer?.lastName}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as any)}>
              <TabsList className="grid w-full grid-cols-4 bg-primary/10">
                <TabsTrigger value="validation" className="text-xs">
                  Validation
                </TabsTrigger>
                <TabsTrigger value="setup" className="text-xs">
                  Setup
                </TabsTrigger>
                <TabsTrigger value="confirmation" className="text-xs">
                  Confirm
                </TabsTrigger>
              </TabsList>

              {/* Validation Step */}
              <TabsContent value="validation" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-primary flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Pre-Disbursement Validation
                  </h3>

                  {validationResult && (
                    <div className="space-y-3">
                      {Object.entries(validationResult.checks).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                        >
                          {value ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )}
                          <span className="text-sm text-primary capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {validationResult?.failedChecks.length === 0 ? (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-green-600 text-sm font-semibold">
                        ✓ All validation checks passed. Ready to proceed.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-600 text-sm font-semibold mb-2">
                        ✗ Disbursement is blocked due to:
                      </p>
                      <ul className="text-red-600 text-sm space-y-1">
                        {validationResult?.failedChecks.map((check, i) => (
                          <li key={i}>• {check}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    onClick={() => setCurrentStep('setup')}
                    disabled={!validationResult?.isValid}
                    className="w-full bg-secondary text-primary hover:bg-secondary/90 disabled:opacity-50"
                  >
                    Proceed to Disbursement Setup
                  </Button>
                </div>
              </TabsContent>

              {/* Setup Step */}
              <TabsContent value="setup" className="space-y-6">
                <form onSubmit={form.handleSubmit((data) => setCurrentStep('confirmation'))}>
                  {/* Loan Summary */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-primary">Loan Summary (Read-Only)</h3>
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div>
                        <p className="text-xs text-primary/70">Customer Name</p>
                        <p className="font-semibold text-primary">
                          {selectedLoan?.customer?.firstName} {selectedLoan?.customer?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-primary/70">Loan Product</p>
                        <p className="font-semibold text-primary">{selectedLoan?.product?.productName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-primary/70">Approved Amount</p>
                        <p className="font-semibold text-primary">
                          ZMW {(selectedLoan?.principalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-primary/70">Processing Fee</p>
                        <p className="font-semibold text-primary">
                          ZMW {(selectedLoan?.product?.processingFee || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-primary/70">Net Disbursement</p>
                        <p className="font-semibold text-secondary">
                          ZMW{' '}
                          {(
                            (selectedLoan?.principalAmount || 0) -
                            (selectedLoan?.product?.processingFee || 0)
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-primary/70">Repayment Start Date</p>
                        <p className="font-semibold text-primary">
                          {selectedLoan?.nextPaymentDate
                            ? new Date(selectedLoan.nextPaymentDate).toLocaleDateString()
                            : 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Disbursement Method */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-primary">Disbursement Method</h3>
                    <Select
                      value={selectedMethod}
                      onValueChange={(value) => {
                        setSelectedMethod(value);
                        form.setValue('disbursementMethod', value as any);
                      }}
                    >
                      <SelectTrigger className="bg-primary/5 border-primary/20 text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Bank Transfer
                          </div>
                        </SelectItem>
                        <SelectItem value="mobile_money">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Mobile Money
                          </div>
                        </SelectItem>
                        <SelectItem value="cheque">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Cheque
                          </div>
                        </SelectItem>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Cash
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Details - Bank Transfer */}
                  {selectedMethod === 'bank_transfer' && (
                    <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Bank Account Details
                      </h4>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Bank Name *</Label>
                        <Input
                          placeholder="Enter bank name"
                          className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                          {...form.register('bankName', { required: 'Bank name is required' })}
                        />
                        {form.formState.errors.bankName && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.bankName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Bank Branch</Label>
                        <Input
                          placeholder="Enter branch name"
                          className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                          {...form.register('bankBranch')}
                        />
                      </div>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Account Name *</Label>
                        <Input
                          placeholder="Enter account holder name"
                          className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                          {...form.register('accountName', { required: 'Account name is required' })}
                        />
                        {form.formState.errors.accountName && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.accountName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Account Number *</Label>
                        <Input
                          placeholder="Enter account number"
                          className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                          {...form.register('accountNumber', { required: 'Account number is required' })}
                        />
                        {form.formState.errors.accountNumber && (
                          <p className="text-red-500 text-xs mt-1">
                            {form.formState.errors.accountNumber.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Details - Mobile Money */}
                  {selectedMethod === 'mobile_money' && (
                    <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Mobile Money Details
                      </h4>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Network *</Label>
                        <Input
                          placeholder="e.g., MTN, Airtel, Zamtel"
                          className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                          {...form.register('mobileNetwork', { required: 'Network is required' })}
                        />
                      </div>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Mobile Number *</Label>
                        <Input
                          placeholder="Enter mobile number"
                          className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                          {...form.register('mobileNumber', { required: 'Mobile number is required' })}
                        />
                      </div>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Account Holder *</Label>
                        <Input
                          placeholder="Enter account holder name"
                          className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                          {...form.register('mobileAccountHolder', {
                            required: 'Account holder is required',
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Details - Cheque */}
                  {selectedMethod === 'cheque' && (
                    <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Cheque Details
                      </h4>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Cheque Number *</Label>
                        <Input
                          placeholder="Enter cheque number"
                          className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                          {...form.register('chequeNumber', { required: 'Cheque number is required' })}
                        />
                      </div>
                      <div>
                        <Label className="text-primary text-sm mb-2 block">Cheque Date *</Label>
                        <Input
                          type="date"
                          className="bg-primary/5 border-primary/20 text-primary"
                          {...form.register('chequeDate', { required: 'Cheque date is required' })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Common Fields */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-primary text-sm mb-2 block">Disbursement Date *</Label>
                      <Input
                        type="date"
                        className="bg-primary/5 border-primary/20 text-primary"
                        {...form.register('disbursementDate', {
                          required: 'Disbursement date is required',
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-primary text-sm mb-2 block">Reference Number *</Label>
                      <Input
                        placeholder="e.g., DISB-2024-001"
                        className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                        {...form.register('referenceNumber', {
                          required: 'Reference number is required',
                        })}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-secondary text-primary hover:bg-secondary/90"
                  >
                    Review & Confirm
                  </Button>
                </form>
              </TabsContent>

              {/* Confirmation Step */}
              <TabsContent value="confirmation" className="space-y-6">
                <form onSubmit={form.handleSubmit((data) => handleDisburse(data))}>
                  {/* Summary */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-primary">Disbursement Summary</h3>
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div>
                        <p className="text-xs text-primary/70">Principal Amount</p>
                        <p className="font-semibold text-primary text-lg">
                          ZMW {(selectedLoan?.principalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-primary/70">Processing Fee</p>
                        <p className="font-semibold text-primary">
                          ZMW {(selectedLoan?.product?.processingFee || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2 border-t border-primary/20 pt-4">
                        <p className="text-xs text-primary/70">Net Disbursement Amount</p>
                        <p className="font-semibold text-secondary text-xl">
                          ZMW{' '}
                          {(
                            (selectedLoan?.principalAmount || 0) -
                            (selectedLoan?.product?.processingFee || 0)
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confirmations */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-primary text-sm">Confirmations Required</h3>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <Checkbox
                        id="confirm-details"
                        checked={form.watch('confirmPaymentDetails')}
                        onCheckedChange={(checked) =>
                          form.setValue('confirmPaymentDetails', checked as boolean)
                        }
                        className="mt-1"
                      />
                      <label htmlFor="confirm-details" className="text-sm text-primary cursor-pointer">
                        I confirm that all payment details are correct and match customer profile
                      </label>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <Checkbox
                        id="confirm-amount"
                        checked={form.watch('confirmNetAmount')}
                        onCheckedChange={(checked) =>
                          form.setValue('confirmNetAmount', checked as boolean)
                        }
                        className="mt-1"
                      />
                      <label htmlFor="confirm-amount" className="text-sm text-primary cursor-pointer">
                        I confirm the net disbursement amount and authorize this irreversible transaction
                      </label>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('setup')}
                      className="border-primary/20 text-primary hover:bg-primary/5"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !form.watch('confirmPaymentDetails') ||
                        !form.watch('confirmNetAmount')
                      }
                      className="bg-secondary text-primary hover:bg-secondary/90 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm & Disburse'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
