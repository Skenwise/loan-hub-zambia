/**
 * Disbursement Page
 * Loan disbursement processing for finance officers
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { LoanService, CustomerService, AuthorizationService, Permissions, AuditService } from '@/services';
import { Loans, CustomerProfiles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DisbursementFormData {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  disbursementDate: string;
}

interface LoanWithCustomer extends Loans {
  customer?: CustomerProfiles;
  monthlyPayment?: number;
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

  const form = useForm<DisbursementFormData>({
    defaultValues: {
      disbursementDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const checkPermissions = async () => {
      // Check if staff member has permission to disburse loans
      if (!currentStaff?._id || !currentOrganisation?._id) {
        // If no staff info, deny access
        setCanDisburse(false);
        return;
      }

      try {
        const hasPermission = await AuthorizationService.hasPermission(
          currentStaff._id,
          currentOrganisation._id,
          Permissions.DISBURSE_LOAN
        );

        setCanDisburse(hasPermission);
      } catch (error) {
        console.error('Error checking disbursement permission:', error);
        setCanDisburse(false);
      }
    };

    checkPermissions();
  }, [currentStaff, currentOrganisation]);

  useEffect(() => {
    const loadLoans = async () => {
      if (!currentOrganisation?._id) return;

      try {
        setIsLoading(true);

        // Get approved loans
        const approvedLoans = await LoanService.getApprovedLoans(currentOrganisation._id);

        // Enrich with customer data
        const enrichedLoans = await Promise.all(
          approvedLoans.map(async (loan) => {
            const customer = loan.customerId ? await CustomerService.getCustomer(loan.customerId) : undefined;
            const monthlyPayment = LoanService.calculateMonthlyPayment(
              loan.principalAmount || 0,
              loan.interestRate || 0,
              loan.loanTermMonths || 0
            );

            return {
              ...loan,
              customer,
              monthlyPayment,
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

  const handleDisburse = async (data: DisbursementFormData) => {
    if (!selectedLoan || !currentOrganisation?._id) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Generate disbursement reference
      const disbursementRef = `DISB-${Date.now()}`;

      // Update loan status and disbursement date
      await LoanService.updateLoanDisbursement(
        selectedLoan._id || '',
        new Date(data.disbursementDate),
        disbursementRef
      );

      // Generate payment schedule
      await LoanService.generatePaymentSchedule(
        selectedLoan._id || '',
        selectedLoan.principalAmount || 0,
        selectedLoan.interestRate || 0,
        selectedLoan.loanTermMonths || 0,
        new Date(data.disbursementDate)
      );

      // Log disbursement
      await AuditService.logLoanDisbursement(
        selectedLoan._id || '',
        member?.loginEmail || 'ADMIN',
        {
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountHolderName: data.accountHolderName,
          disbursementDate: data.disbursementDate,
          disbursementReference: disbursementRef,
        }
      );

      setSuccessMessage(`Loan ${selectedLoan.loanNumber} disbursed successfully! Reference: ${disbursementRef}`);
      setDisbursementDialogOpen(false);
      form.reset();

      // Reload loans
      const approvedLoans = await LoanService.getApprovedLoans(currentOrganisation._id);
      const enrichedLoans = await Promise.all(
        approvedLoans.map(async (loan) => {
          const customer = loan.customerId ? await CustomerService.getCustomer(loan.customerId) : undefined;
          const monthlyPayment = LoanService.calculateMonthlyPayment(
            loan.principalAmount || 0,
            loan.interestRate || 0,
            loan.loanTermMonths || 0
          );

          return {
            ...loan,
            customer,
            monthlyPayment,
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
                You do not have permission to disburse loans. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
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
            Loan Disbursement
          </h1>
          <p className="text-primary-foreground/70">
            Process disbursement for approved loans
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

        {/* Approved Loans List */}
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
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                        {/* Loan & Customer Info */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Loan Number</p>
                          <p className="font-semibold text-primary-foreground">{loan.loanNumber}</p>
                          <p className="text-xs text-primary-foreground/50 mt-2">
                            {loan.customer?.firstName} {loan.customer?.lastName}
                          </p>
                        </div>

                        {/* Amount Info */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Principal Amount</p>
                          <p className="font-semibold text-primary-foreground">
                            ZMW {(loan.principalAmount || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-primary-foreground/50 mt-2">
                            {loan.loanTermMonths} months
                          </p>
                        </div>

                        {/* Monthly Payment */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Monthly Payment</p>
                          <p className="font-semibold text-secondary">
                            ZMW {(loan.monthlyPayment || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-primary-foreground/50 mt-2">
                            {loan.interestRate}% interest
                          </p>
                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Status</p>
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 border">
                            APPROVED
                          </Badge>
                        </div>

                        {/* Action */}
                        <div className="flex justify-end">
                          <Button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setDisbursementDialogOpen(true);
                            }}
                            className="bg-secondary text-primary hover:bg-secondary/90"
                          >
                            Disburse
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
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">No Approved Loans</h3>
                <p className="text-primary-foreground/70">
                  No approved loans are ready for disbursement. Check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Disbursement Dialog */}
        <Dialog open={disbursementDialogOpen} onOpenChange={setDisbursementDialogOpen}>
          <DialogContent className="bg-primary-foreground/95 border-primary-foreground/20 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary">Disburse Loan</DialogTitle>
              <DialogDescription className="text-primary/70">
                {selectedLoan?.loanNumber} - {selectedLoan?.customer?.firstName} {selectedLoan?.customer?.lastName}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit((data) => handleDisburse(data))} className="space-y-6">
              {/* Loan Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-primary/70">Principal Amount</p>
                    <p className="font-semibold text-primary text-lg">
                      ZMW {(selectedLoan?.principalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-primary/70">Monthly Payment</p>
                    <p className="font-semibold text-primary text-lg">
                      ZMW {(selectedLoan?.monthlyPayment || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-primary/70">Loan Term</p>
                    <p className="font-semibold text-primary">{selectedLoan?.loanTermMonths} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary/70">Interest Rate</p>
                    <p className="font-semibold text-primary">{selectedLoan?.interestRate}%</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Bank Account Details
                </h3>

                <div>
                  <Label className="text-primary mb-2 block">Bank Name *</Label>
                  <Input
                    placeholder="Enter bank name"
                    className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                    {...form.register('bankName', { required: 'Bank name is required' })}
                  />
                  {form.formState.errors.bankName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.bankName.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-primary mb-2 block">Account Number *</Label>
                  <Input
                    placeholder="Enter account number"
                    className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                    {...form.register('accountNumber', { required: 'Account number is required' })}
                  />
                  {form.formState.errors.accountNumber && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.accountNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-primary mb-2 block">Account Holder Name *</Label>
                  <Input
                    placeholder="Enter account holder name"
                    className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                    {...form.register('accountHolderName', { required: 'Account holder name is required' })}
                  />
                  {form.formState.errors.accountHolderName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.accountHolderName.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-primary mb-2 block">Disbursement Date *</Label>
                  <Input
                    type="date"
                    className="bg-primary/5 border-primary/20 text-primary"
                    {...form.register('disbursementDate', { required: 'Disbursement date is required' })}
                  />
                  {form.formState.errors.disbursementDate && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.disbursementDate.message}</p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDisbursementDialogOpen(false)}
                  className="border-primary/20 text-primary hover:bg-primary/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-secondary text-primary hover:bg-secondary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Disbursement'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
