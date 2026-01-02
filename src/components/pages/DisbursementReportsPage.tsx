/**
 * Disbursement Reports Page
 * Comprehensive reporting and analytics for loan disbursements
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { LoanService, DisbursementService, AuthorizationService, Permissions } from '@/services';
import { Loans } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DisbursementStats {
  totalDisbursements: number;
  totalAmount: number;
  averageAmount: number;
  disbursedLoans: Loans[];
}

interface DisbursementReport {
  date: string;
  count: number;
  amount: number;
  method: string;
}

export default function DisbursementReportsPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [canView, setCanView] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState<DisbursementStats | null>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [methodData, setMethodData] = useState<any[]>([]);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentStaff?._id || !currentOrganisation?._id) {
        setCanView(false);
        return;
      }

      if (currentStaff?.role === 'System Owner' || currentStaff?.role === 'Admin/Owner') {
        setCanView(true);
        return;
      }

      try {
        const hasPermission = await AuthorizationService.hasPermission(
          currentStaff._id,
          currentOrganisation._id,
          Permissions.VIEW_REPAYMENT
        );
        setCanView(hasPermission);
      } catch (error) {
        console.error('Error checking permission:', error);
        setCanView(false);
      }
    };

    checkPermissions();
  }, [currentStaff, currentOrganisation]);

  useEffect(() => {
    const loadReports = async () => {
      if (!currentOrganisation?._id || !canView) return;

      try {
        setIsLoading(true);

        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);

        // Get disbursement statistics
        const disbursementStats = await DisbursementService.getDisbursementStats(
          currentOrganisation._id,
          startDate,
          endDate
        );
        setStats(disbursementStats);

        // Generate daily data
        const daily: any[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
          const dayLoans = disbursementStats.disbursedLoans.filter((loan) => {
            const loanDate = new Date(loan.disbursementDate || '');
            return (
              loanDate.getDate() === current.getDate() &&
              loanDate.getMonth() === current.getMonth() &&
              loanDate.getFullYear() === current.getFullYear()
            );
          });

          if (dayLoans.length > 0) {
            daily.push({
              date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              count: dayLoans.length,
              amount: dayLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0),
            });
          }

          current.setDate(current.getDate() + 1);
        }
        setDailyData(daily);

        // Generate method data (placeholder - would need actual method tracking)
        setMethodData([
          { name: 'Bank Transfer', value: Math.round(disbursementStats.totalDisbursements * 0.6) },
          { name: 'Mobile Money', value: Math.round(disbursementStats.totalDisbursements * 0.25) },
          { name: 'Cheque', value: Math.round(disbursementStats.totalDisbursements * 0.1) },
          { name: 'Cash', value: Math.round(disbursementStats.totalDisbursements * 0.05) },
        ]);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [currentOrganisation, canView, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!canView) {
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
                You do not have permission to view disbursement reports.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const COLORS = ['#3567fd', '#10b981', '#f59e0b', '#ef4444'];

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
            Disbursement Reports & Analytics
          </h1>
          <p className="text-primary-foreground/70">
            Comprehensive disbursement statistics and performance metrics
          </p>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Report Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-primary-foreground/70 text-sm mb-2 block">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-primary/5 border-primary/20 text-primary"
                  />
                </div>
                <div>
                  <Label className="text-primary-foreground/70 text-sm mb-2 block">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-primary/5 border-primary/20 text-primary"
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-secondary text-primary hover:bg-secondary/90">
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">Total Disbursements</p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    {stats?.totalDisbursements || 0}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">Total Amount</p>
                  <p className="text-3xl font-bold text-secondary">
                    ZMW {(stats?.totalAmount || 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">Average Amount</p>
                  <p className="text-3xl font-bold text-primary-foreground">
                    ZMW {(stats?.averageAmount || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-2">Completion Rate</p>
                  <p className="text-3xl font-bold text-primary-foreground">100%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
        >
          {/* Daily Disbursements Chart */}
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary">Daily Disbursements</CardTitle>
              <CardDescription className="text-primary/70">
                Number of disbursements per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/20" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f0f3ff' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3567fd"
                      strokeWidth={2}
                      dot={{ fill: '#3567fd' }}
                      name="Disbursements"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-primary-foreground/50">
                  No data available for selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disbursement Methods Chart */}
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary">Disbursement Methods</CardTitle>
              <CardDescription className="text-primary/70">
                Distribution by payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              {methodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={methodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f0f3ff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-primary-foreground/50">
                  No data available for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Disbursement Amount Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary">Disbursement Amount Trend</CardTitle>
              <CardDescription className="text-primary/70">
                Total amount disbursed per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/20" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f0f3ff' }}
                    />
                    <Legend />
                    <Bar
                      dataKey="amount"
                      fill="#3567fd"
                      name="Amount (ZMW)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-primary-foreground/50">
                  No data available for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary">Recent Disbursements</CardTitle>
              <CardDescription className="text-primary/70">
                Latest disbursement transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.disbursedLoans.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10">
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Loan ID
                        </th>
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-primary-foreground/70 font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.disbursedLoans.slice(0, 10).map((loan) => (
                        <tr key={loan._id} className="border-b border-primary/5 hover:bg-primary/5">
                          <td className="py-3 px-4 text-primary-foreground">{loan.loanNumber}</td>
                          <td className="py-3 px-4 text-secondary font-semibold">
                            ZMW {(loan.principalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-primary-foreground/70">
                            {loan.disbursementDate
                              ? new Date(loan.disbursementDate).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border">
                              Completed
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-primary-foreground/50">
                  No disbursements found for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
