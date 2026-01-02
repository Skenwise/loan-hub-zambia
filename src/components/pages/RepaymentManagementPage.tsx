/**
 * Repayment Management Page
 * Main screen for Finance Officers to manage loan repayments
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import {
  RepaymentService,
  AuthorizationService,
  Permissions,
  CustomerService,
  LoanService,
} from '@/services';
import { Loans, CustomerProfiles } from '@/entities';
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
  AlertTriangle,
  Eye,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LoanWithRepaymentStatus extends Loans {
  customer?: CustomerProfiles;
  repaymentStatus?: any;
}

export default function RepaymentManagementPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [loans, setLoans] = useState<LoanWithRepaymentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canPostRepayments, setCanPostRepayments] = useState(false);
  const [filters, setFilters] = useState({
    branch: '',
    dueStatus: 'all', // all, due, overdue
    dateFrom: '',
    dateTo: '',
    paymentChannel: '',
  });
  const [selectedLoan, setSelectedLoan] = useState<LoanWithRepaymentStatus | null>(null);
  const [showPostRepaymentDialog, setShowPostRepaymentDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentStaff?._id || !currentOrganisation?._id) {
        setCanPostRepayments(false);
        return;
      }

      // Finance Officer can post repayments
      if (currentStaff?.role === 'Finance / Accounts Officer' || 
          currentStaff?.role === 'System Owner' || 
          currentStaff?.role === 'Admin/Owner') {
        setCanPostRepayments(true);
        return;
      }

      try {
        const hasPermission = await AuthorizationService.hasPermission(
          currentStaff._id,
          currentOrganisation._id,
          Permissions.POST_REPAYMENT
        );
        setCanPostRepayments(hasPermission);
      } catch (error) {
        console.error('Error checking repayment permission:', error);
        setCanPostRepayments(false);
      }
    };

    checkPermissions();
  }, [currentStaff, currentOrganisation]);

  // Load loans
  useEffect(() => {
    const loadLoans = async () => {
      if (!currentOrganisation?._id) return;

      try {
        setIsLoading(true);
        const activeLoans = await RepaymentService.getActiveLoansForRepayment(
          currentOrganisation._id
        );

        const enrichedLoans = await Promise.all(
          activeLoans.map(async (loan) => {
            const customer = loan.customerId
              ? await CustomerService.getCustomer(loan.customerId)
              : undefined;
            const repaymentStatus = await RepaymentService.getLoanRepaymentStatus(loan._id || '');

            return {
              ...loan,
              customer,
              repaymentStatus,
            };
          })
        );

        setLoans(enrichedLoans);
      } catch (error) {
        console.error('Error loading loans:', error);
        setErrorMessage('Failed to load loans');
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, [currentOrganisation]);

  const filteredLoans = loans.filter((loan) => {
    if (filters.branch && loan.customer?.residentialAddress !== filters.branch) return false;
    if (filters.dueStatus === 'due' && (loan.repaymentStatus?.daysOverdue || 0) <= 0) return false;
    if (filters.dueStatus === 'overdue' && (loan.repaymentStatus?.daysOverdue || 0) <= 0) return false;
    return true;
  });

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
            Repayment Management
          </h1>
          <p className="text-primary-foreground/70">
            Track and process loan repayments with automatic allocation and IFRS 9 compliance
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

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-slate-50 border-slate-300">
            <CardHeader>
              <CardTitle className="text-slate-900">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-slate-700 text-sm mb-2 block">Branch</Label>
                  <Input
                    placeholder="Filter by branch"
                    value={filters.branch}
                    onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 text-sm mb-2 block">Due Status</Label>
                  <Select
                    value={filters.dueStatus}
                    onValueChange={(value) => setFilters({ ...filters, dueStatus: value })}
                  >
                    <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="due">Due</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-700 text-sm mb-2 block">Date From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 text-sm mb-2 block">Date To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="bg-white border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 text-sm mb-2 block">Payment Channel</Label>
                  <Select
                    value={filters.paymentChannel}
                    onValueChange={(value) => setFilters({ ...filters, paymentChannel: value })}
                  >
                    <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loans Queue */}
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
                  <Card className="bg-slate-50 border-slate-300 hover:border-blue-400 transition-all">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
                        {/* Loan ID */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Loan ID</p>
                          <p className="font-semibold text-slate-900 text-sm">{loan.loanNumber}</p>
                        </div>

                        {/* Customer */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Customer</p>
                          <p className="font-semibold text-slate-900 text-sm">
                            {loan.customer?.firstName} {loan.customer?.lastName}
                          </p>
                        </div>

                        {/* Branch */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Branch</p>
                          <p className="font-semibold text-slate-900 text-sm">
                            {loan.customer?.residentialAddress || 'N/A'}
                          </p>
                        </div>

                        {/* Amount Due */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Amount Due</p>
                          <p className="font-semibold text-blue-600">
                            ZMW {(loan.repaymentStatus?.nextInstallmentAmount || 0).toLocaleString()}
                          </p>
                        </div>

                        {/* Amount Paid */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Amount Paid</p>
                          <p className="font-semibold text-green-600">
                            ZMW {((loan.principalAmount || 0) - (loan.outstandingBalance || 0)).toLocaleString()}
                          </p>
                        </div>

                        {/* Arrears Days */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Arrears Days</p>
                          <p className={`font-semibold ${(loan.repaymentStatus?.daysOverdue || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {loan.repaymentStatus?.daysOverdue || 0} days
                          </p>
                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Status</p>
                          {(loan.repaymentStatus?.daysOverdue || 0) > 0 ? (
                            <Badge className="bg-red-100 text-red-700 border-red-300 border text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-300 border text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => setSelectedLoan(loan)}
                            variant="outline"
                            className="border-slate-300 text-slate-900 hover:bg-slate-100 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {canPostRepayments && (
                            <Button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowPostRepaymentDialog(true);
                              }}
                              className="bg-blue-600 text-white hover:bg-blue-700 text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Post
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
            <Card className="bg-slate-50 border-slate-300">
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Active Loans
                </h3>
                <p className="text-slate-600">
                  No loans are currently active or ready for repayment.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Loan Details Modal */}
        {selectedLoan && !showPostRepaymentDialog && (
          <LoanDetailsModal
            loan={selectedLoan}
            onClose={() => setSelectedLoan(null)}
            onPostRepayment={() => setShowPostRepaymentDialog(true)}
            canPostRepayments={canPostRepayments}
          />
        )}

        {/* Post Repayment Modal */}
        {selectedLoan && showPostRepaymentDialog && (
          <PostRepaymentModal
            loan={selectedLoan}
            onClose={() => {
              setShowPostRepaymentDialog(false);
              setSelectedLoan(null);
            }}
            onSuccess={(message) => {
              setSuccessMessage(message);
              setShowPostRepaymentDialog(false);
              setSelectedLoan(null);
              // Reload loans
              window.location.reload();
            }}
            staffId={currentStaff?._id || ''}
            organisationId={currentOrganisation?._id || ''}
          />
        )}
      </div>
    </div>
  );
}

// Loan Details Modal Component
function LoanDetailsModal({
  loan,
  onClose,
  onPostRepayment,
  canPostRepayments,
}: {
  loan: any;
  onClose: () => void;
  onPostRepayment: () => void;
  canPostRepayments: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white border-slate-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-slate-900">Loan Details</CardTitle>
          <CardDescription className="text-slate-600">
            {loan.loanNumber} - {loan.customer?.firstName} {loan.customer?.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loan Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Loan Information</h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-100 border border-slate-300">
              <div>
                <p className="text-xs text-slate-600">Principal Amount</p>
                <p className="font-semibold text-slate-900">
                  ZMW {(loan.principalAmount || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Outstanding Balance</p>
                <p className="font-semibold text-blue-600">
                  ZMW {(loan.outstandingBalance || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Interest Rate</p>
                <p className="font-semibold text-slate-900">{loan.interestRate}% p.a.</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Loan Term</p>
                <p className="font-semibold text-slate-900">{loan.loanTermMonths} months</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Next Payment Date</p>
                <p className="font-semibold text-slate-900">
                  {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Loan Status</p>
                <p className="font-semibold text-slate-900">{loan.loanStatus}</p>
              </div>
            </div>
          </div>

          {/* Repayment Status */}
          {loan.repaymentStatus && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Repayment Status</h3>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-100 border border-slate-300">
                <div>
                  <p className="text-xs text-slate-600">Outstanding Principal</p>
                  <p className="font-semibold text-slate-900">
                    ZMW {loan.repaymentStatus.outstandingPrincipal.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Outstanding Interest</p>
                  <p className="font-semibold text-slate-900">
                    ZMW {loan.repaymentStatus.outstandingInterest.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Penalties</p>
                  <p className="font-semibold text-red-600">
                    ZMW {loan.repaymentStatus.penalties.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Total Outstanding</p>
                  <p className="font-semibold text-blue-600">
                    ZMW {loan.repaymentStatus.totalOutstanding.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Days Overdue</p>
                  <p className={`font-semibold ${loan.repaymentStatus.daysOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {loan.repaymentStatus.daysOverdue} days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-300">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-300 text-slate-900 hover:bg-slate-100"
            >
              Close
            </Button>
            {canPostRepayments && (
              <Button
                onClick={onPostRepayment}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Post Repayment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Post Repayment Modal Component
function PostRepaymentModal({
  loan,
  onClose,
  onSuccess,
  staffId,
  organisationId,
}: {
  loan: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
  staffId: string;
  organisationId: string;
}) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocation, setAllocation] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && loan.repaymentStatus) {
      const amountNum = parseFloat(value);
      const alloc = RepaymentService.allocatePayment(
        amountNum,
        loan.repaymentStatus.penalties,
        0,
        loan.repaymentStatus.outstandingInterest,
        loan.repaymentStatus.outstandingPrincipal
      );
      setAllocation(alloc);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const repaymentId = await RepaymentService.postRepayment(
        loan._id || '',
        parseFloat(amount),
        paymentDate,
        paymentMethod,
        referenceNumber || `REP-${Date.now()}`,
        staffId,
        organisationId
      );

      onSuccess(`Repayment posted successfully! Reference: ${repaymentId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to post repayment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white border-slate-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-slate-900">Post Repayment</CardTitle>
          <CardDescription className="text-slate-600">
            {loan.loanNumber} - {loan.customer?.firstName} {loan.customer?.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-100 border border-red-300">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Loan Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Outstanding Balance</h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-100 border border-slate-300">
              <div>
                <p className="text-xs text-slate-600">Principal</p>
                <p className="font-semibold text-slate-900">
                  ZMW {(loan.repaymentStatus?.outstandingPrincipal || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Interest</p>
                <p className="font-semibold text-slate-900">
                  ZMW {(loan.repaymentStatus?.outstandingInterest || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Penalties</p>
                <p className="font-semibold text-red-600">
                  ZMW {(loan.repaymentStatus?.penalties || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Total</p>
                <p className="font-semibold text-blue-600">
                  ZMW {(loan.repaymentStatus?.totalOutstanding || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Payment Details</h3>
            <div>
              <Label className="text-slate-700 text-sm mb-2 block">Payment Date *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <Label className="text-slate-700 text-sm mb-2 block">Amount Received *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-700 text-sm mb-2 block">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="standing_order">Standing Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700 text-sm mb-2 block">Reference Number</Label>
              <Input
                placeholder="Auto-generated if left blank"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Payment Allocation */}
          {allocation && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Payment Allocation</h3>
              <div className="space-y-2 p-4 rounded-lg bg-slate-100 border border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-700">Penalties:</span>
                  <span className="font-semibold text-slate-900">ZMW {allocation.penalties.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Interest:</span>
                  <span className="font-semibold text-slate-900">ZMW {allocation.interest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Principal:</span>
                  <span className="font-semibold text-blue-600">ZMW {allocation.principal.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between">
                  <span className="font-semibold text-slate-900">Total:</span>
                  <span className="font-semibold text-blue-600">ZMW {allocation.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-300">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-300 text-slate-900 hover:bg-slate-100"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting || !amount}
            >
              {isSubmitting ? 'Processing...' : 'Post Repayment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
