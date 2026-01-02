/**
 * Loan Approval Page
 * Comprehensive loan approval workflow for credit managers
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
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, DollarSign, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ApprovalFormData {
  approvalNotes: string;
}

interface RejectionFormData {
  rejectionReason: string;
}

interface LoanWithCustomer extends Loans {
  customer?: CustomerProfiles;
  monthlyPayment?: number;
}

export default function LoanApprovalPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [loans, setLoans] = useState<LoanWithCustomer[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [canApprove, setCanApprove] = useState(false);

  const approvalForm = useForm<ApprovalFormData>();
  const rejectionForm = useForm<RejectionFormData>();

  useEffect(() => {
    const checkPermissions = async () => {
      // Check if staff member has permission to approve loans
      if (!currentStaff?._id || !currentOrganisation?._id) {
        // If no staff info, deny access
        setCanApprove(false);
        return;
      }

      try {
        const hasPermission = await AuthorizationService.hasPermission(
          currentStaff._id,
          currentOrganisation._id,
          Permissions.APPROVE_LOAN
        );

        setCanApprove(hasPermission);
      } catch (error) {
        console.error('Error checking approval permission:', error);
        setCanApprove(false);
      }
    };

    checkPermissions();
  }, [currentStaff, currentOrganisation]);

  useEffect(() => {
    const loadLoans = async () => {
      if (!currentOrganisation?._id) return;

      try {
        setIsLoading(true);

        // Get pending loans
        const pendingLoans = await LoanService.getPendingLoans(currentOrganisation._id);

        // Enrich with customer data
        const enrichedLoans = await Promise.all(
          pendingLoans.map(async (loan) => {
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
        setErrorMessage('Failed to load pending loans');
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, [currentOrganisation]);

  const handleApprove = async (data: ApprovalFormData) => {
    if (!selectedLoan || !currentOrganisation?._id) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Update loan status
      await LoanService.updateLoanStatus(
        selectedLoan._id || '',
        'APPROVED',
        member?.loginEmail || 'ADMIN',
        currentStaff?._id
      );

      // Log approval
      await AuditService.logLoanApproval(
        selectedLoan._id || '',
        member?.loginEmail || 'ADMIN',
        data.approvalNotes
      );

      setSuccessMessage(`Loan ${selectedLoan.loanNumber} approved successfully!`);
      setApprovalDialogOpen(false);
      approvalForm.reset();

      // Reload loans
      const pendingLoans = await LoanService.getPendingLoans(currentOrganisation._id);
      const enrichedLoans = await Promise.all(
        pendingLoans.map(async (loan) => {
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
      console.error('Error approving loan:', error);
      setErrorMessage('Failed to approve loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (data: RejectionFormData) => {
    if (!selectedLoan || !currentOrganisation?._id) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Update loan status
      await LoanService.updateLoanStatus(
        selectedLoan._id || '',
        'REJECTED',
        member?.loginEmail || 'ADMIN',
        currentStaff?._id
      );

      // Log rejection
      await AuditService.logLoanRejection(
        selectedLoan._id || '',
        member?.loginEmail || 'ADMIN',
        data.rejectionReason
      );

      setSuccessMessage(`Loan ${selectedLoan.loanNumber} rejected successfully!`);
      setRejectionDialogOpen(false);
      rejectionForm.reset();

      // Reload loans
      const pendingLoans = await LoanService.getPendingLoans(currentOrganisation._id);
      const enrichedLoans = await Promise.all(
        pendingLoans.map(async (loan) => {
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
      console.error('Error rejecting loan:', error);
      setErrorMessage('Failed to reject loan');
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

  if (!canApprove) {
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
                You do not have permission to approve loans. Please contact your administrator.
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
            Loan Approval
          </h1>
          <p className="text-primary-foreground/70">
            Review and approve pending loan applications
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

        {/* Pending Loans List */}
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
                  <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {/* Loan & Customer Info */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Loan Number</p>
                          <p className="font-semibold text-primary-foreground">{loan.loanNumber}</p>
                          <p className="text-xs text-primary-foreground/50 mt-2 flex items-center gap-1">
                            <User className="w-3 h-3" />
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
                            Term: {loan.loanTermMonths} months
                          </p>
                        </div>

                        {/* Monthly Payment */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Monthly Payment</p>
                          <p className="font-semibold text-secondary">
                            ZMW {(loan.monthlyPayment || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-primary-foreground/50 mt-2">
                            Rate: {loan.interestRate}%
                          </p>
                        </div>

                        {/* Customer Info */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Credit Score</p>
                          <p className="font-semibold text-primary-foreground">
                            {loan.customer?.creditScore || 'N/A'}
                          </p>
                          <p className="text-xs text-primary-foreground/50 mt-2">
                            KYC: {loan.customer?.kycVerificationStatus}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setApprovalDialogOpen(true);
                            }}
                            className="bg-green-500 text-white hover:bg-green-600 text-sm"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setRejectionDialogOpen(true);
                            }}
                            variant="outline"
                            className="border-red-500/20 text-red-600 hover:bg-red-500/10 text-sm"
                          >
                            Reject
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
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">No Pending Loans</h3>
                <p className="text-primary-foreground/70">
                  All loan applications have been reviewed. Check back later for new applications.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Approval Dialog */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent className="bg-primary-foreground/95 border-primary-foreground/20">
            <DialogHeader>
              <DialogTitle className="text-primary">Approve Loan</DialogTitle>
              <DialogDescription className="text-primary/70">
                {selectedLoan?.loanNumber} - {selectedLoan?.customer?.firstName} {selectedLoan?.customer?.lastName}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={approvalForm.handleSubmit((data) => handleApprove(data))} className="space-y-4">
              {/* Loan Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-primary/70">Principal Amount</p>
                    <p className="font-semibold text-primary">
                      ZMW {(selectedLoan?.principalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-primary/70">Monthly Payment</p>
                    <p className="font-semibold text-primary">
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

              {/* Approval Notes */}
              <div>
                <Label className="text-primary mb-2 block">Approval Notes</Label>
                <Textarea
                  placeholder="Enter any approval notes or conditions..."
                  className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                  {...approvalForm.register('approvalNotes')}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApprovalDialogOpen(false)}
                  className="border-primary/20 text-primary hover:bg-primary/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Approving...' : 'Approve Loan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
          <DialogContent className="bg-primary-foreground/95 border-primary-foreground/20">
            <DialogHeader>
              <DialogTitle className="text-primary">Reject Loan</DialogTitle>
              <DialogDescription className="text-primary/70">
                {selectedLoan?.loanNumber} - {selectedLoan?.customer?.firstName} {selectedLoan?.customer?.lastName}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={rejectionForm.handleSubmit((data) => handleReject(data))} className="space-y-4">
              {/* Loan Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-primary/70">Principal Amount</p>
                    <p className="font-semibold text-primary">
                      ZMW {(selectedLoan?.principalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-primary/70">Monthly Payment</p>
                    <p className="font-semibold text-primary">
                      ZMW {(selectedLoan?.monthlyPayment || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div>
                <Label className="text-primary mb-2 block">Rejection Reason *</Label>
                <Textarea
                  placeholder="Enter the reason for rejection..."
                  className="bg-primary/5 border-primary/20 text-primary placeholder:text-primary/50"
                  {...rejectionForm.register('rejectionReason', { required: 'Rejection reason is required' })}
                />
                {rejectionForm.formState.errors.rejectionReason && (
                  <p className="text-red-500 text-sm mt-1">
                    {rejectionForm.formState.errors.rejectionReason.message}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectionDialogOpen(false)}
                  className="border-primary/20 text-primary hover:bg-primary/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject Loan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
