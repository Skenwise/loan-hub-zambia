/**
 * Customer Self-Service Repayment Page
 * Allows customers to initiate repayments from customer portal
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { RepaymentService, CustomerService, LoanService } from '@/services';
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
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
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

interface LoanWithStatus extends Loans {
  repaymentStatus?: any;
}

export default function CustomerSelfServiceRepaymentPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [customer, setCustomer] = useState<CustomerProfiles | null>(null);
  const [loans, setLoans] = useState<LoanWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithStatus | null>(null);
  const [showRepaymentForm, setShowRepaymentForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load customer and loans
  useEffect(() => {
    const loadData = async () => {
      if (!member?.contact?.firstName) {
        setErrorMessage('Unable to identify customer');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get customer profile (in production, link member to customer)
        // For now, search by name
        const customers = await CustomerService.getOrganisationCustomers(currentOrganisation?._id || '');
        const matchedCustomer = customers.find(
          (c) =>
            c.firstName === member.contact?.firstName &&
            c.lastName === member.contact?.lastName
        );

        if (!matchedCustomer) {
          setErrorMessage('Customer profile not found');
          setIsLoading(false);
          return;
        }

        setCustomer(matchedCustomer);

        // Get customer loans
        const allLoans = await LoanService.getOrganisationLoans(currentOrganisation?._id || '');
        const customerLoans = allLoans.filter((l) => l.customerId === matchedCustomer._id);

        // Enrich with repayment status
        const enrichedLoans = await Promise.all(
          customerLoans.map(async (loan) => {
            const status = await RepaymentService.getLoanRepaymentStatus(loan._id || '');
            return { ...loan, repaymentStatus: status };
          })
        );

        setLoans(enrichedLoans);
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage('Failed to load loan information');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [member]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-50 border-red-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Customer Profile Not Found</h3>
                  <p className="text-red-700">
                    We couldn't find your customer profile. Please contact support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Make a Repayment
          </h1>
          <p className="text-primary-foreground/70">
            View your loans and make repayments online
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

        {/* Customer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-slate-50 border-slate-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {customer.firstName} {customer.lastName}
                  </h2>
                  <p className="text-slate-600 mt-1">
                    {customer.emailAddress} • {customer.phoneNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Total Loans</p>
                  <p className="text-3xl font-bold text-slate-900">{loans.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loans List */}
        {loans.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-4">
              {loans.map((loan, idx) => (
                <motion.div
                  key={loan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-slate-50 border-slate-300 hover:border-blue-400 transition-all">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                        {/* Loan ID */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Loan ID</p>
                          <p className="font-semibold text-slate-900 text-sm">{loan.loanNumber}</p>
                        </div>

                        {/* Principal */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Principal</p>
                          <p className="font-semibold text-slate-900">
                            ZMW {(loan.principalAmount || 0).toLocaleString()}
                          </p>
                        </div>

                        {/* Outstanding */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Outstanding</p>
                          <p className="font-semibold text-blue-600">
                            ZMW {(loan.outstandingBalance || 0).toLocaleString()}
                          </p>
                        </div>

                        {/* Interest Rate */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Interest Rate</p>
                          <p className="font-semibold text-slate-900">{loan.interestRate}% p.a.</p>
                        </div>

                        {/* Next Payment */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Next Payment</p>
                          <p className="font-semibold text-slate-900">
                            {loan.nextPaymentDate
                              ? new Date(loan.nextPaymentDate).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>

                        {/* Days Overdue */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Status</p>
                          {(loan.repaymentStatus?.daysOverdue || 0) > 0 ? (
                            <Badge className="bg-red-100 text-red-700 border-red-300 border text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {loan.repaymentStatus.daysOverdue}d Overdue
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-300 border text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>

                        {/* Amount Due */}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Amount Due</p>
                          <p className="font-semibold text-blue-600">
                            ZMW {(loan.repaymentStatus?.nextInstallmentAmount || 0).toLocaleString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => setSelectedLoan(loan)}
                            variant="outline"
                            className="border-slate-300 text-slate-900 hover:bg-slate-100 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          {(loan.loanStatus === 'ACTIVE' || loan.loanStatus === 'OVERDUE') && (
                            <Button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowRepaymentForm(true);
                              }}
                              className="bg-blue-600 text-white hover:bg-blue-700 text-xs"
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <Card className="bg-slate-50 border-slate-300">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Active Loans
              </h3>
              <p className="text-slate-600">
                You don't have any active loans at this time.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loan Details Modal */}
        {selectedLoan && !showRepaymentForm && (
          <LoanDetailsModal
            loan={selectedLoan}
            onClose={() => setSelectedLoan(null)}
            onMakePayment={() => setShowRepaymentForm(true)}
          />
        )}

        {/* Repayment Form Modal */}
        {selectedLoan && showRepaymentForm && (
          <RepaymentFormModal
            loan={selectedLoan}
            customer={customer}
            onClose={() => {
              setShowRepaymentForm(false);
              setSelectedLoan(null);
            }}
            onSuccess={(message) => {
              setSuccessMessage(message);
              setShowRepaymentForm(false);
              setSelectedLoan(null);
              // Reload loans
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Loan Details Modal
function LoanDetailsModal({
  loan,
  onClose,
  onMakePayment,
}: {
  loan: any;
  onClose: () => void;
  onMakePayment: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white border-slate-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-slate-900">Loan Details</CardTitle>
          <CardDescription className="text-slate-600">
            {loan.loanNumber}
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
            {(loan.loanStatus === 'ACTIVE' || loan.loanStatus === 'OVERDUE') && (
              <Button
                onClick={onMakePayment}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Make Payment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Repayment Form Modal
function RepaymentFormModal({
  loan,
  customer,
  onClose,
  onSuccess,
}: {
  loan: any;
  customer: CustomerProfiles;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      // In production, integrate with payment gateway
      // For now, show success message
      onSuccess(`Payment of ZMW ${parseFloat(amount).toLocaleString()} initiated successfully!`);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white border-slate-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-slate-900">Make a Payment</CardTitle>
          <CardDescription className="text-slate-600">
            {loan.loanNumber} - {customer.firstName} {customer.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-100 border border-red-300">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Outstanding Balance */}
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
              <Label className="text-slate-700 text-sm mb-2 block">Amount to Pay *</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-600">ZMW</span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 pl-12"
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Minimum: ZMW {(loan.repaymentStatus?.nextInstallmentAmount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-slate-700 text-sm mb-2 block">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cash">Cash at Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-300">
            <h4 className="font-semibold text-blue-900 mb-2">Payment Instructions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Bank Transfer: Account details will be provided after confirmation</li>
              <li>• Mobile Money: Use code LOANPAY and follow the prompts</li>
              <li>• Cash: Visit any of our branch offices during business hours</li>
            </ul>
          </div>

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
              {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
