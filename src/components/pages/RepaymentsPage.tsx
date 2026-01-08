/**
 * Repayments Page
 * Loan repayment recording and tracking
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { LoanService, CustomerService, AuthorizationService, Permissions, AuditService, BulkRepaymentService } from '@/services';
import { Loans, CustomerProfiles, Repayments } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, DollarSign, Calendar, TrendingUp, Upload, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaymentFormData {
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
}

interface LoanWithDetails extends Loans {
  customer?: CustomerProfiles;
  monthlyPayment?: number;
  daysOverdue?: number;
  repaymentHistory?: Repayments[];
}

export default function RepaymentsPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [canRecordPayment, setCanRecordPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvContent, setCSVContent] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [csvTab, setCSVTab] = useState('upload');

  const form = useForm<PaymentFormData>({
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
    },
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentStaff?._id || !currentOrganisation?._id) return;

      // First check if user is admin/owner - grant full access
      if (currentStaff?.role === 'System Owner' || currentStaff?.role === 'Admin/Owner') {
        setCanRecordPayment(true);
        return;
      }

      const hasPermission = await AuthorizationService.hasPermission(
        currentStaff._id,
        currentOrganisation._id,
        Permissions.RECORD_REPAYMENT
      );

      setCanRecordPayment(hasPermission);
    };

    checkPermissions();
  }, [currentStaff, currentOrganisation]);

  useEffect(() => {
    const loadLoans = async () => {
      if (!currentOrganisation?._id) return;

      try {
        setIsLoading(true);

        // Get active loans for organisation (Phase 1: Organization-scoped)
        const activeLoans = await LoanService.getOrganisationLoans(currentOrganisation._id);
        const filteredLoans = activeLoans.filter(
          loan => loan.loanStatus === 'ACTIVE' || loan.loanStatus === 'OVERDUE'
        );

        // Enrich with customer data and repayment history
        const enrichedLoans = await Promise.all(
          filteredLoans.map(async (loan) => {
            const customer = loan.customerId ? await CustomerService.getCustomer(loan.customerId) : undefined;
            const monthlyPayment = LoanService.calculateMonthlyPayment(
              loan.principalAmount || 0,
              loan.interestRate || 0,
              loan.loanTermMonths || 0
            );
            const daysOverdue = loan.nextPaymentDate 
              ? Math.floor((new Date().getTime() - new Date(loan.nextPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            return {
              ...loan,
              customer,
              monthlyPayment,
              daysOverdue,
            };
          })
        );

        setLoans(enrichedLoans);
      } catch (error) {
        console.error('Error loading loans:', error);
        setErrorMessage('Failed to load active loans');
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, [currentOrganisation]);

  const handleRecordPayment = async (data: PaymentFormData) => {
    if (!selectedLoan || !currentOrganisation?._id) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Validate payment amount
      if (data.paymentAmount <= 0 || data.paymentAmount > (selectedLoan.outstandingBalance || 0)) {
        setErrorMessage('Invalid payment amount');
        return;
      }

      // Calculate interest and principal
      const interestAmount = LoanService.calculateInterestAmount(
        selectedLoan.outstandingBalance || 0,
        selectedLoan.interestRate || 0
      );

      const principalAmount = Math.min(
        data.paymentAmount - interestAmount,
        selectedLoan.outstandingBalance || 0
      );

      // Create repayment record
      const repayment: Omit<Repayments, '_id' | '_createdDate' | '_updatedDate'> = {
        loanId: selectedLoan._id,
        organisationId: currentOrganisation._id,
        transactionReference: data.referenceNumber || `PAY-${Date.now()}`,
        repaymentDate: new Date(data.paymentDate),
        totalAmountPaid: data.paymentAmount,
        principalAmount,
        interestAmount,
        paymentMethod: data.paymentMethod,
      };

      // Save repayment
      const savedRepayment = await LoanService.createRepayment(repayment);

      // Update loan outstanding balance
      const newBalance = Math.max((selectedLoan.outstandingBalance || 0) - principalAmount, 0);
      
      // Calculate next payment date
      let nextPaymentDate = selectedLoan.nextPaymentDate;
      if (newBalance > 0) {
        const currentDate = new Date(data.paymentDate);
        nextPaymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
      }

      // Update loan
      await LoanService.updateLoanRepayment(
        selectedLoan._id || '',
        newBalance,
        nextPaymentDate ? new Date(nextPaymentDate) : undefined,
        newBalance === 0 ? 'CLOSED' : 'ACTIVE'
      );

      // Log repayment
      await AuditService.logRepayment(
        selectedLoan._id || '',
        member?.loginEmail || 'ADMIN',
        {
          amount: data.paymentAmount,
          principal: principalAmount,
          interest: interestAmount,
          method: data.paymentMethod,
          reference: savedRepayment._id,
        }
      );

      setSuccessMessage(`Payment of ZMW ${data.paymentAmount.toFixed(2)} recorded successfully!`);
      setPaymentDialogOpen(false);
      form.reset();

      // Reload loans
      const activeLoans = await LoanService.getActiveLoansByOrganisation(currentOrganisation._id);
      const updatedLoans = await Promise.all(
        activeLoans.map(async (loan) => {
          const customer = loan.customerId ? await CustomerService.getCustomer(loan.customerId) : undefined;
          const monthlyPayment = LoanService.calculateMonthlyPayment(
            loan.principalAmount || 0,
            loan.interestRate || 0,
            loan.loanTermMonths || 0
          );
          const daysOverdue = LoanService.calculateDaysOverdue(loan.nextPaymentDate);
          const repaymentHistory = await LoanService.getLoanRepayments(loan._id || '');

          return {
            ...loan,
            customer,
            monthlyPayment,
            daysOverdue,
            repaymentHistory,
          };
        })
      );

      setLoans(updatedLoans);
      setSelectedLoan(null);
    } catch (error) {
      console.error('Error recording payment:', error);
      setErrorMessage('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Bulk Repayment Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please select a CSV file');
      return;
    }

    setCSVFile(file);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCSVContent(content);
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    if (!csvContent) {
      setErrorMessage('Please select a CSV file');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const records = BulkRepaymentService.parseCSV(csvContent);
      const result = await BulkRepaymentService.validateBulkRepayments(
        records,
        currentOrganisation?._id || ''
      );

      setValidationResult(result);
      setCSVTab('validation');
    } catch (error: any) {
      setErrorMessage(error.message || 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!validationResult || !validationResult.isValid) {
      setErrorMessage('Please fix validation errors before processing');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const records = BulkRepaymentService.parseCSV(csvContent);
      const result = await BulkRepaymentService.processBulkRepayments(
        records,
        currentOrganisation?._id || '',
        currentStaff?._id || '',
        csvFile?.name || 'bulk-repayment.csv'
      );

      setProcessingResult(result);
      setSuccessMessage(`Bulk repayment processed: ${result.processedRecords}/${result.totalRecords} successful`);
      setCSVTab('results');

      // Reload loans
      const activeLoans = await LoanService.getActiveLoansByOrganisation(currentOrganisation?._id || '');
      const updatedLoans = await Promise.all(
        activeLoans.map(async (loan) => {
          const customer = loan.customerId ? await CustomerService.getCustomer(loan.customerId) : undefined;
          const monthlyPayment = LoanService.calculateMonthlyPayment(
            loan.principalAmount || 0,
            loan.interestRate || 0,
            loan.loanTermMonths || 0
          );
          const daysOverdue = LoanService.calculateDaysOverdue(loan.nextPaymentDate);
          const repaymentHistory = await LoanService.getLoanRepayments(loan._id || '');

          return {
            ...loan,
            customer,
            monthlyPayment,
            daysOverdue,
            repaymentHistory,
          };
        })
      );

      setLoans(updatedLoans);
    } catch (error: any) {
      setErrorMessage(error.message || 'Processing failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = BulkRepaymentService.generateCSVTemplate();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(template));
    element.setAttribute('download', 'repayment-template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadResults = () => {
    if (!processingResult) return;
    const csv = BulkRepaymentService.exportJobResults(processingResult);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `bulk-repayment-results-${processingResult._id}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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
            Loan Repayments
          </h1>
          <p className="text-primary-foreground/70">
            Record and track loan repayments - Single payments or bulk processing
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

        {/* Tabs for Single vs Bulk */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-primary-foreground/10 mb-6">
              <TabsTrigger value="single" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                Single Payment
              </TabsTrigger>
              <TabsTrigger value="bulk" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                Bulk Repayment
              </TabsTrigger>
            </TabsList>

            {/* Single Payment Tab */}
            <TabsContent value="single" className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-screen">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                  >
                    {[
                      { label: 'Active Loans', value: loans.length, icon: TrendingUp, color: 'bg-blue-500/10 text-blue-600' },
                      { label: 'Total Outstanding', value: `ZMW ${loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'bg-red-500/10 text-red-600' },
                      { label: 'Overdue Payments', value: loans.filter(l => (l.daysOverdue || 0) > 0).length, icon: AlertCircle, color: 'bg-yellow-500/10 text-yellow-600' },
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-primary-foreground/70">
                                  {stat.label}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-primary-foreground">{stat.value}</div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Active Loans List */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {loans.length > 0 ? (
                      <div className="space-y-4">
                        {loans.map((loan, idx) => (
                          <motion.div
                            key={loan._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition-all">
                              <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
                                  {/* Loan & Customer Info */}
                                  <div>
                                    <p className="text-sm text-primary-foreground/70 mb-1">Loan Number</p>
                                    <p className="font-semibold text-primary-foreground">{loan.loanNumber}</p>
                                    <p className="text-xs text-primary-foreground/50 mt-2">
                                      {loan.customer?.firstName} {loan.customer?.lastName}
                                    </p>
                                  </div>

                                  {/* Outstanding Balance */}
                                  <div>
                                    <p className="text-sm text-primary-foreground/70 mb-1">Outstanding Balance</p>
                                    <p className="font-semibold text-secondary">
                                      ZMW {(loan.outstandingBalance || 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-primary-foreground/50 mt-2">
                                      {loan.loanTermMonths} months
                                    </p>
                                  </div>

                                  {/* Monthly Payment */}
                                  <div>
                                    <p className="text-sm text-primary-foreground/70 mb-1">Monthly Payment</p>
                                    <p className="font-semibold text-primary-foreground">
                                      ZMW {(loan.monthlyPayment || 0).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-primary-foreground/50 mt-2">
                                      {loan.interestRate}% interest
                                    </p>
                                  </div>

                                  {/* Next Payment */}
                                  <div>
                                    <p className="text-sm text-primary-foreground/70 mb-1">Next Payment Due</p>
                                    <p className="font-semibold text-primary-foreground">
                                      {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                    {loan.daysOverdue && loan.daysOverdue > 0 ? (
                                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {loan.daysOverdue} days overdue
                                      </p>
                                    ) : (
                                      <p className="text-xs text-green-400 mt-2">On track</p>
                                    )}
                                  </div>

                                  {/* Payments Made */}
                                  <div>
                                    <p className="text-sm text-primary-foreground/70 mb-1">Payments Made</p>
                                    <p className="font-semibold text-primary-foreground">
                                      {loan.repaymentHistory?.length || 0}
                                    </p>
                                    <p className="text-xs text-primary-foreground/50 mt-2">
                                      Total: ZMW {(loan.repaymentHistory?.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0) || 0).toLocaleString()}
                                    </p>
                                  </div>

                                  {/* Action */}
                                  <div className="flex justify-end">
                                    {canRecordPayment && (
                                      <Button
                                        onClick={() => {
                                          setSelectedLoan(loan);
                                          setPaymentDialogOpen(true);
                                        }}
                                        className="bg-secondary text-primary hover:bg-secondary/90"
                                      >
                                        Record Payment
                                      </Button>
                                    )}
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
                          <TrendingUp className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-primary-foreground mb-2">No Active Loans</h3>
                          <p className="text-primary-foreground/70">
                            No active loans available for repayment recording.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </>
              )}
            </TabsContent>

            {/* Bulk Repayment Tab */}
            <TabsContent value="bulk" className="space-y-6">
              <Tabs value={csvTab} onValueChange={setCSVTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-primary-foreground/10">
                  <TabsTrigger value="upload" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="validation" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                    Validation
                  </TabsTrigger>
                  <TabsTrigger value="results" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                    Results
                  </TabsTrigger>
                </TabsList>

                {/* Upload Tab */}
                <TabsContent value="upload" className="space-y-6">
                  <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                    <CardHeader>
                      <CardTitle className="text-primary-foreground">Upload CSV File</CardTitle>
                      <CardDescription className="text-primary-foreground/70">
                        Select a CSV file with repayment records to process
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Template Download */}
                      <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-primary-foreground mb-1">CSV Template</h3>
                            <p className="text-sm text-primary-foreground/70">
                              Download the template to see the required format and example data
                            </p>
                          </div>
                          <Button
                            onClick={handleDownloadTemplate}
                            variant="outline"
                            className="border-secondary/20 text-secondary hover:bg-secondary/10"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {/* File Upload */}
                      <div>
                        <Label className="text-primary-foreground text-sm mb-3 block">Select CSV File *</Label>
                        <div className="border-2 border-dashed border-primary-foreground/20 rounded-lg p-8 text-center hover:border-secondary/50 transition-colors">
                          <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="csv-upload"
                          />
                          <label htmlFor="csv-upload" className="cursor-pointer">
                            <Upload className="w-12 h-12 text-primary-foreground/30 mx-auto mb-3" />
                            <p className="text-primary-foreground font-semibold mb-1">
                              {csvFile ? csvFile.name : 'Click to select or drag and drop'}
                            </p>
                            <p className="text-sm text-primary-foreground/70">CSV files only</p>
                          </label>
                        </div>
                      </div>

                      {/* Validate Button */}
                      <div className="flex justify-end gap-3">
                        <Button
                          onClick={handleValidate}
                          disabled={!csvFile || isLoading}
                          className="bg-secondary text-primary hover:bg-secondary/90 disabled:opacity-50"
                        >
                          {isLoading ? 'Validating...' : 'Validate CSV'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Validation Tab */}
                <TabsContent value="validation" className="space-y-6">
                  {validationResult && (
                    <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                      <CardHeader>
                        <CardTitle className="text-primary-foreground">Validation Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-primary-foreground/70">Total Records</p>
                            <p className="text-2xl font-bold text-primary-foreground">{validationResult.totalRecords}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-sm text-primary-foreground/70">Valid Records</p>
                            <p className="text-2xl font-bold text-green-500">{validationResult.validRecords}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-primary-foreground/70">Invalid Records</p>
                            <p className="text-2xl font-bold text-red-500">{validationResult.invalidRecords}</p>
                          </div>
                        </div>

                        {validationResult.errors && validationResult.errors.length > 0 && (
                          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                            <ul className="space-y-1 text-sm text-red-600">
                              {validationResult.errors.slice(0, 10).map((error: any, idx: number) => (
                                <li key={idx}>Row {error.row}: {error.message}</li>
                              ))}
                              {validationResult.errors.length > 10 && (
                                <li>... and {validationResult.errors.length - 10} more errors</li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-end gap-3">
                          <Button
                            onClick={() => setCSVTab('upload')}
                            variant="outline"
                            className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/5"
                          >
                            Back
                          </Button>
                          <Button
                            onClick={handleProcess}
                            disabled={!validationResult.isValid || isLoading}
                            className="bg-secondary text-primary hover:bg-secondary/90 disabled:opacity-50"
                          >
                            {isLoading ? 'Processing...' : 'Process Repayments'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-6">
                  {processingResult && (
                    <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                      <CardHeader>
                        <CardTitle className="text-primary-foreground">Processing Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-primary-foreground/70">Total Records</p>
                            <p className="text-2xl font-bold text-primary-foreground">{processingResult.totalRecords}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-sm text-primary-foreground/70">Processed</p>
                            <p className="text-2xl font-bold text-green-500">{processingResult.processedRecords}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-primary-foreground/70">Failed</p>
                            <p className="text-2xl font-bold text-red-500">{processingResult.failedRecords}</p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button
                            onClick={handleDownloadResults}
                            className="bg-secondary text-primary hover:bg-secondary/90"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Results
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="bg-primary-foreground/95 border-primary-foreground/20 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary">Record Payment</DialogTitle>
              <DialogDescription className="text-primary/70">
                {selectedLoan?.loanNumber} - {selectedLoan?.customer?.firstName} {selectedLoan?.customer?.lastName}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit((data) => handleRecordPayment(data))} className="space-y-6">
              {/* Loan Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-primary/70">Outstanding Balance</p>
                    <p className="font-semibold text-primary text-lg">
                      ZMW {(selectedLoan?.outstandingBalance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-primary/70">Monthly Payment</p>
                    <p className="font-semibold text-primary text-lg">
                      ZMW {(selectedLoan?.monthlyPayment || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-primary mb-2 block">Payment Amount (ZMW) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-primary/50" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter payment amount"
                      className="pl-10 bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                      {...form.register('paymentAmount', {
                        required: 'Payment amount is required',
                        min: { value: 0.01, message: 'Amount must be greater than 0' },
                        max: { value: selectedLoan?.outstandingBalance || 0, message: 'Amount exceeds outstanding balance' },
                      })}
                    />
                  </div>
                  {form.formState.errors.paymentAmount && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.paymentAmount.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-primary mb-2 block">Payment Date *</Label>
                  <Input
                    type="date"
                    className="bg-primary/5 border-primary/20 text-primary"
                    {...form.register('paymentDate', { required: 'Payment date is required' })}
                  />
                  {form.formState.errors.paymentDate && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.paymentDate.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-primary mb-2 block">Payment Method *</Label>
                  <Select {...form.register('paymentMethod', { required: 'Payment method is required' })}>
                    <SelectTrigger className="bg-primary/5 border-primary/20 text-primary">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.paymentMethod && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.paymentMethod.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-primary mb-2 block">Reference Number</Label>
                  <Input
                    placeholder="Enter transaction reference (optional)"
                    className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                    {...form.register('referenceNumber')}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                  className="border-primary/20 text-primary hover:bg-primary/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-secondary text-primary hover:bg-secondary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
