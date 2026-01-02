/**
 * Loan Officer Dashboard
 * Displays customer portfolio, loans in progress, repayment reminders, and arrears follow-ups
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { LoanService, CustomerService, AuthorizationService, Permissions, BaseCrudService } from '@/services';
import { Loans, CustomerProfiles } from '@/entities';
import { CollectionIds } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Users,
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LoanWithCustomer extends Loans {
  customer?: CustomerProfiles;
  daysOverdue?: number;
  monthlyPayment?: number;
}

export default function LoanOfficerDashboardPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [myCustomers, setMyCustomers] = useState<CustomerProfiles[]>([]);
  const [myLoans, setMyLoans] = useState<LoanWithCustomer[]>([]);
  const [loansInProgress, setLoansInProgress] = useState<LoanWithCustomer[]>([]);
  const [arrears, setArrears] = useState<LoanWithCustomer[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalLoans: 0,
    loansInProgress: 0,
    arrearsCount: 0,
    totalPortfolioValue: 0,
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentStaff?._id || !currentOrganisation?._id) {
        setCanAccess(false);
        return;
      }

      // Loan officers can access their own dashboard
      if (currentStaff?.role === 'Loan Officer' || currentStaff?.role === 'System Owner' || currentStaff?.role === 'Admin/Owner') {
        setCanAccess(true);
        return;
      }

      try {
        const hasPermission = await AuthorizationService.hasPermission(
          currentStaff._id,
          currentOrganisation._id,
          Permissions.VIEW_CUSTOMER
        );
        setCanAccess(hasPermission);
      } catch (error) {
        console.error('Error checking access:', error);
        setCanAccess(false);
      }
    };

    checkAccess();
  }, [currentStaff, currentOrganisation]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentOrganisation?._id || !currentStaff?._id || !canAccess) return;

      try {
        setIsLoading(true);

        // Get all customers (in real app, would be filtered by assigned officer)
        const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>(
          CollectionIds.CUSTOMERS
        );
        const filteredCustomers = customers?.filter(
          c => c.organisationId === currentOrganisation._id
        ) || [];
        setMyCustomers(filteredCustomers);

        // Get all loans for organization
        const allLoans = await LoanService.getOrganisationLoans(currentOrganisation._id);

        // Enrich loans with customer data
        const enrichedLoans = await Promise.all(
          allLoans.map(async (loan) => {
            const customer = loan.customerId
              ? await CustomerService.getCustomer(loan.customerId)
              : undefined;
            const monthlyPayment = LoanService.calculateMonthlyPayment(
              loan.principalAmount || 0,
              loan.interestRate || 0,
              loan.loanTermMonths || 0
            );
            const daysOverdue = LoanService.calculateDaysOverdue(loan.nextPaymentDate);

            return {
              ...loan,
              customer,
              monthlyPayment,
              daysOverdue,
            };
          })
        );

        setMyLoans(enrichedLoans);

        // Filter loans in progress
        const inProgress = enrichedLoans.filter(l => l.loanStatus === 'PENDING' || l.loanStatus === 'Approved');
        setLoansInProgress(inProgress);

        // Filter arrears
        const arrearsLoans = enrichedLoans.filter(
          l => l.loanStatus === 'ACTIVE' && LoanService.isLoanOverdue(l.nextPaymentDate)
        );
        setArrears(arrearsLoans);

        // Calculate stats
        setStats({
          totalCustomers: filteredCustomers.length,
          totalLoans: enrichedLoans.length,
          loansInProgress: inProgress.length,
          arrearsCount: arrearsLoans.length,
          totalPortfolioValue: enrichedLoans.reduce(
            (sum, l) => sum + (l.principalAmount || 0),
            0
          ),
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentOrganisation, currentStaff, canAccess]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!canAccess) {
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
                You do not have permission to access this dashboard.
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
            My Loan Portfolio
          </h1>
          <p className="text-primary-foreground/70">
            Customer portfolio, loans in progress, and repayment tracking
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">My Customers</p>
                  <p className="text-3xl font-bold text-primary-foreground">{stats.totalCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">Total Loans</p>
                  <p className="text-3xl font-bold text-primary-foreground">{stats.totalLoans}</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">In Progress</p>
                  <p className="text-3xl font-bold text-secondary">{stats.loansInProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">In Arrears</p>
                  <p className="text-3xl font-bold text-red-500">{stats.arrearsCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">Portfolio Value</p>
                  <p className="text-2xl font-bold text-secondary">
                    ZMW {(stats.totalPortfolioValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loans in Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Loans in Progress
              </CardTitle>
              <CardDescription className="text-primary/70">
                Pending and approved loans awaiting next action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loansInProgress.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10">
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Loan ID
                        </th>
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loansInProgress.map((loan) => (
                        <tr key={loan._id} className="border-b border-primary/5 hover:bg-primary/5">
                          <td className="py-3 px-4 text-primary-foreground font-semibold">
                            {loan.loanNumber}
                          </td>
                          <td className="py-3 px-4 text-primary-foreground/70">
                            {loan.customer?.firstName} {loan.customer?.lastName}
                          </td>
                          <td className="py-3 px-4 text-secondary font-semibold">
                            ZMW {(loan.principalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                loan.loanStatus === 'PENDING'
                                  ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 border'
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20 border'
                              }
                            >
                              {loan.loanStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" className="bg-secondary text-primary hover:bg-secondary/90">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-primary-foreground/50">
                  No loans in progress
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Repayment Reminders & Arrears */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Repayment Reminders */}
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary">Upcoming Repayments</CardTitle>
              <CardDescription className="text-primary/70">
                Loans with payments due in next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myLoans
                .filter(l => {
                  const daysUntilPayment = l.nextPaymentDate
                    ? Math.ceil(
                        (new Date(l.nextPaymentDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 999;
                  return daysUntilPayment >= 0 && daysUntilPayment <= 7;
                })
                .slice(0, 5)
                .map((loan) => (
                  <div
                    key={loan._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10 mb-3"
                  >
                    <div>
                      <p className="font-semibold text-primary-foreground">{loan.loanNumber}</p>
                      <p className="text-xs text-primary-foreground/70">
                        {loan.customer?.firstName} {loan.customer?.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-secondary">
                        ZMW {(loan.monthlyPayment || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-primary-foreground/70">
                        Due: {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Arrears Follow-up */}
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Arrears Follow-up
              </CardTitle>
              <CardDescription className="text-primary/70">
                Loans with overdue payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {arrears.length > 0 ? (
                arrears.slice(0, 5).map((loan) => (
                  <div
                    key={loan._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3"
                  >
                    <div>
                      <p className="font-semibold text-primary-foreground">{loan.loanNumber}</p>
                      <p className="text-xs text-red-600">
                        {loan.daysOverdue} days overdue
                      </p>
                    </div>
                    <Button size="sm" className="bg-red-500 text-white hover:bg-red-600">
                      Follow Up
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-primary-foreground/50">
                  No loans in arrears
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
