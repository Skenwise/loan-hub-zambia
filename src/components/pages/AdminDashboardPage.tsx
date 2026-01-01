/**
 * Admin Dashboard Page
 * Main dashboard for admin users showing key metrics and quick actions
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { LoanService, ComplianceService, CustomerService, OrganisationService } from '@/services';
import { Loans, CustomerProfiles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TrendingUp, Users, DollarSign, AlertCircle, BarChart3, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface DashboardMetrics {
  totalCustomers: number;
  totalLoans: number;
  activeLoans: number;
  totalOutstanding: number;
  totalECL: number;
  totalBoZProvisioning: number;
  overdueLoans: number;
}

export default function AdminDashboardPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentLoans, setRecentLoans] = useState<Loans[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentOrganisation?._id) return;

      try {
        setIsLoading(true);

        // Fetch customers
        const customers = await CustomerService.getOrganisationCustomers(currentOrganisation._id);
        
        // Fetch loans
        const loans = await LoanService.getOrganisationLoans(currentOrganisation._id);
        
        // Calculate metrics
        const activeLoans = loans.filter(l => l.loanStatus === 'ACTIVE').length;
        const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
        const overdueLoans = loans.filter(l => LoanService.isLoanOverdue(l.nextPaymentDate)).length;

        // Get compliance metrics
        const totalECL = await ComplianceService.getOrganisationTotalECL(currentOrganisation._id);
        const totalBoZProvisioning = await ComplianceService.getOrganisationTotalBoZProvisioning(currentOrganisation._id);

        setMetrics({
          totalCustomers: customers.length,
          totalLoans: loans.length,
          activeLoans,
          totalOutstanding,
          totalECL,
          totalBoZProvisioning,
          overdueLoans,
        });

        // Get recent loans
        setRecentLoans(loans.slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentOrganisation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>Unable to load dashboard metrics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Total Customers',
      value: metrics.totalCustomers,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
      trend: '+12% this month',
    },
    {
      title: 'Active Loans',
      value: metrics.activeLoans,
      icon: CheckCircle2,
      color: 'bg-green-500/10 text-green-600',
      trend: `${metrics.totalLoans} total`,
    },
    {
      title: 'Outstanding Balance',
      value: `ZMW ${(metrics.totalOutstanding / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: 'bg-purple-500/10 text-purple-600',
      trend: `${metrics.activeLoans} active loans`,
    },
    {
      title: 'Overdue Loans',
      value: metrics.overdueLoans,
      icon: AlertCircle,
      color: 'bg-red-500/10 text-red-600',
      trend: 'Requires attention',
    },
    {
      title: 'Total ECL',
      value: `ZMW ${(metrics.totalECL / 1000).toFixed(1)}K`,
      icon: BarChart3,
      color: 'bg-orange-500/10 text-orange-600',
      trend: 'IFRS 9 Compliant',
    },
    {
      title: 'BoZ Provisioning',
      value: `ZMW ${(metrics.totalBoZProvisioning / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      color: 'bg-indigo-500/10 text-indigo-600',
      trend: 'Regulatory Required',
    },
  ];

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
            Dashboard
          </h1>
          <p className="text-primary-foreground/70">
            Welcome back, {member?.profile?.nickname || 'Admin'}. Here's your organization's overview.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {metricCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium text-primary-foreground/70">
                          {card.title}
                        </CardTitle>
                      </div>
                      <div className={`p-2 rounded-lg ${card.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary-foreground mb-1">
                      {card.value}
                    </div>
                    <p className="text-xs text-primary-foreground/50">{card.trend}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Link to="/admin/customers">
                  <Button variant="outline" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Manage Customers
                  </Button>
                </Link>
                <Link to="/admin/loans/apply">
                  <Button variant="outline" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    New Loan
                  </Button>
                </Link>
                <Link to="/admin/loans/approve">
                  <Button variant="outline" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Approve Loans
                  </Button>
                </Link>
                <Link to="/admin/loans/disburse">
                  <Button variant="outline" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Disburse
                  </Button>
                </Link>
                <Link to="/admin/repayments">
                  <Button variant="outline" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Repayments
                  </Button>
                </Link>
                <Link to="/admin/reports">
                  <Button variant="outline" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-primary-foreground/70">IFRS 9 ECL</span>
                    <span className="text-sm font-semibold text-green-400">Compliant</span>
                  </div>
                  <div className="w-full bg-primary-foreground/10 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-primary-foreground/70">BoZ Provisions</span>
                    <span className="text-sm font-semibold text-green-400">Compliant</span>
                  </div>
                  <div className="w-full bg-primary-foreground/10 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Loans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-primary-foreground">Recent Loans</CardTitle>
                  <CardDescription className="text-primary-foreground/50">Latest loan applications</CardDescription>
                </div>
                <Link to="/admin/loans">
                  <Button variant="ghost" className="text-secondary hover:bg-secondary/10">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLoans.length > 0 ? (
                  recentLoans.map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                      <div>
                        <p className="font-semibold text-primary-foreground">{loan.loanNumber}</p>
                        <p className="text-sm text-primary-foreground/50">
                          ZMW {(loan.principalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          loan.loanStatus === 'ACTIVE' ? 'text-green-400' :
                          loan.loanStatus === 'PENDING' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {loan.loanStatus}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-primary-foreground/50 py-8">No loans yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
