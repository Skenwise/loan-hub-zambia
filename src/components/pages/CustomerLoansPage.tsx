/**
 * Customer Loans Page
 * Displays customer's loans and allows tracking
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { LoanService, CustomerService, ComplianceService } from '@/services';
import { Loans, Repayments } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LoanWithDetails extends Loans {
  monthlyPayment?: number;
  daysOverdue?: number;
  totalRepaid?: number;
  nextPaymentAmount?: number;
}

export default function CustomerLoansPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const loadLoans = async () => {
      if (!currentOrganisation?._id || !member?.loginEmail) return;

      try {
        setIsLoading(true);

        // Get customer
        const cust = await CustomerService.getCustomerByEmail(member.loginEmail);
        if (!cust) return;

        setCustomer(cust);

        // Get customer's loans
        const customerLoans = await LoanService.getCustomerLoans(cust._id);

        // Enrich loans with additional data
        const enrichedLoans = await Promise.all(
          customerLoans.map(async (loan) => {
            const monthlyPayment = LoanService.calculateMonthlyPayment(
              loan.principalAmount || 0,
              loan.interestRate || 0,
              loan.loanTermMonths || 0
            );

            const daysOverdue = LoanService.calculateDaysOverdue(loan.nextPaymentDate);
            const totalRepaid = await LoanService.getTotalRepaid(loan._id || '');

            return {
              ...loan,
              monthlyPayment,
              daysOverdue,
              totalRepaid,
              nextPaymentAmount: monthlyPayment,
            };
          })
        );

        setLoans(enrichedLoans);
      } catch (error) {
        console.error('Error loading loans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, [currentOrganisation, member]);

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'APPROVED':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'CLOSED':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'CLOSED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'PENDING':
        return <Calendar className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
                My Loans
              </h1>
              <p className="text-primary-foreground/70">
                Track your loan applications and repayments
              </p>
            </div>
            <Link to="/customer-portal/apply">
              <Button className="bg-secondary text-primary hover:bg-secondary/90">
                Apply for Loan
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Summary Cards */}
        {loans.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Active Loans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary-foreground/70">
                    Active Loans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary-foreground">
                    {loans.filter(l => l.loanStatus === 'ACTIVE').length}
                  </div>
                  <p className="text-xs text-primary-foreground/50 mt-1">
                    Currently active
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Outstanding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary-foreground/70">
                    Outstanding Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">
                    ZMW {loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-primary-foreground/50 mt-1">
                    Total to repay
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Repaid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary-foreground/70">
                    Total Repaid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    ZMW {loans.reduce((sum, l) => sum + (l.totalRepaid || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-primary-foreground/50 mt-1">
                    Payments made
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Loans List */}
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
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Loan Info */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Loan Number</p>
                          <p className="font-semibold text-primary-foreground">{loan.loanNumber}</p>
                          <div className="mt-3">
                            <Badge className={`${getStatusColor(loan.loanStatus)} border`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(loan.loanStatus)}
                                {loan.loanStatus}
                              </span>
                            </Badge>
                          </div>
                        </div>

                        {/* Amount Info */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Principal Amount</p>
                          <p className="font-semibold text-primary-foreground">
                            ZMW {(loan.principalAmount || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-primary-foreground/50 mt-2">
                            Interest: {loan.interestRate}%
                          </p>
                        </div>

                        {/* Outstanding Balance */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Outstanding Balance</p>
                          <p className="font-semibold text-secondary">
                            ZMW {(loan.outstandingBalance || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-primary-foreground/50 mt-2">
                            Monthly: ZMW {(loan.monthlyPayment || 0).toFixed(2)}
                          </p>
                        </div>

                        {/* Next Payment */}
                        <div>
                          <p className="text-sm text-primary-foreground/70 mb-1">Next Payment</p>
                          {loan.nextPaymentDate ? (
                            <>
                              <p className="font-semibold text-primary-foreground">
                                {new Date(loan.nextPaymentDate).toLocaleDateString()}
                              </p>
                              {loan.daysOverdue && loan.daysOverdue > 0 ? (
                                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {loan.daysOverdue} days overdue
                                </p>
                              ) : (
                                <p className="text-xs text-green-400 mt-2">On track</p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-primary-foreground/50">N/A</p>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4 pt-4 border-t border-primary-foreground/10">
                        <Link to={`/customer-portal/loans/${loan._id}`}>
                          <Button variant="ghost" className="text-secondary hover:bg-secondary/10">
                            View Details →
                          </Button>
                        </Link>
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
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">No Loans Yet</h3>
                <p className="text-primary-foreground/70 mb-6">
                  You haven't applied for any loans yet. Start by applying for a loan.
                </p>
                <Link to="/customer-portal/apply">
                  <Button className="bg-secondary text-primary hover:bg-secondary/90">
                    Apply for Your First Loan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
