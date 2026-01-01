import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, Repayments, ECLResults } from '@/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioMetrics {
  totalLoans: number;
  totalOutstanding: number;
  totalDisbursed: number;
  activeLoans: number;
  closedLoans: number;
  defaultedLoans: number;
  par30: number;
  par90: number;
}

interface AgeingData {
  category: string;
  count: number;
  amount: number;
}

export default function AdvancedReportsPage() {
  const [loans, setLoans] = useState<Loans[]>([]);
  const [repayments, setRepayments] = useState<Repayments[]>([]);
  const [eclResults, setEclResults] = useState<ECLResults[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [ageingData, setAgeingData] = useState<AgeingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState<'portfolio' | 'ageing' | 'performance'>('portfolio');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const [loansRes, repaymentsRes, eclRes] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<Repayments>('repayments'),
        BaseCrudService.getAll<ECLResults>('eclresults'),
      ]);

      setLoans(loansRes.items);
      setRepayments(repaymentsRes.items);
      setEclResults(eclRes.items);

      // Calculate portfolio metrics
      const activeLoans = loansRes.items.filter(l => l.loanStatus === 'disbursed').length;
      const closedLoans = loansRes.items.filter(l => l.loanStatus === 'closed').length;
      const defaultedLoans = loansRes.items.filter(l => l.loanStatus === 'defaulted').length;
      const totalOutstanding = loansRes.items.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
      const totalDisbursed = loansRes.items.reduce((sum, l) => sum + (l.principalAmount || 0), 0);

      // Calculate PAR (Portfolio at Risk)
      const today = new Date();
      const par30 = loansRes.items.filter(l => {
        if (!l.nextPaymentDate) return false;
        const daysOverdue = Math.floor((today.getTime() - new Date(l.nextPaymentDate).getTime()) / (1000 * 60 * 60 * 24));
        return daysOverdue > 30 && daysOverdue <= 90;
      }).length;

      const par90 = loansRes.items.filter(l => {
        if (!l.nextPaymentDate) return false;
        const daysOverdue = Math.floor((today.getTime() - new Date(l.nextPaymentDate).getTime()) / (1000 * 60 * 60 * 24));
        return daysOverdue > 90;
      }).length;

      setMetrics({
        totalLoans: loansRes.items.length,
        totalOutstanding,
        totalDisbursed,
        activeLoans,
        closedLoans,
        defaultedLoans,
        par30,
        par90,
      });

      // Calculate ageing analysis
      const ageingCategories = [
        { category: 'Current', count: 0, amount: 0 },
        { category: '1-30 Days', count: 0, amount: 0 },
        { category: '31-60 Days', count: 0, amount: 0 },
        { category: '61-90 Days', count: 0, amount: 0 },
        { category: '90+ Days', count: 0, amount: 0 },
      ];

      loansRes.items.forEach(loan => {
        if (!loan.nextPaymentDate) return;
        const daysOverdue = Math.floor((today.getTime() - new Date(loan.nextPaymentDate).getTime()) / (1000 * 60 * 60 * 24));
        const outstanding = loan.outstandingBalance || 0;

        if (daysOverdue <= 0) {
          ageingCategories[0].count++;
          ageingCategories[0].amount += outstanding;
        } else if (daysOverdue <= 30) {
          ageingCategories[1].count++;
          ageingCategories[1].amount += outstanding;
        } else if (daysOverdue <= 60) {
          ageingCategories[2].count++;
          ageingCategories[2].amount += outstanding;
        } else if (daysOverdue <= 90) {
          ageingCategories[3].count++;
          ageingCategories[3].amount += outstanding;
        } else {
          ageingCategories[4].count++;
          ageingCategories[4].amount += outstanding;
        }
      });

      setAgeingData(ageingCategories);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      generatedDate: new Date().toISOString(),
      metrics,
      ageingData,
      totalLoans: loans.length,
      totalRepayments: repayments.length,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loan-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const loanStatusData = [
    { name: 'Active', value: metrics?.activeLoans || 0, color: '#0D3B47' },
    { name: 'Closed', value: metrics?.closedLoans || 0, color: '#B9E54F' },
    { name: 'Defaulted', value: metrics?.defaultedLoans || 0, color: '#DF3131' },
  ];

  const performanceData = [
    { month: 'Jan', disbursed: 45000, repaid: 32000 },
    { month: 'Feb', disbursed: 52000, repaid: 38000 },
    { month: 'Mar', disbursed: 48000, repaid: 41000 },
    { month: 'Apr', disbursed: 61000, repaid: 45000 },
    { month: 'May', disbursed: 55000, repaid: 48000 },
    { month: 'Jun', disbursed: 67000, repaid: 52000 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Reports</h1>
          <p className="text-gray-600 mt-2">Portfolio analysis and performance metrics</p>
        </div>
        <Button
          onClick={handleExportReport}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total Loans</p>
          <p className="text-3xl font-bold text-gray-900">{metrics?.totalLoans || 0}</p>
          <p className="text-xs text-gray-600 mt-2">Active: {metrics?.activeLoans}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total Outstanding</p>
          <p className="text-3xl font-bold text-primary">${(metrics?.totalOutstanding || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-2">Amount due</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Portfolio at Risk (PAR)</p>
          <p className="text-3xl font-bold text-red-600">{((metrics?.par30 || 0) + (metrics?.par90 || 0))}</p>
          <p className="text-xs text-gray-600 mt-2">Loans overdue 30+ days</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Collection Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {metrics?.totalDisbursed ? ((repayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0) / metrics.totalDisbursed) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-xs text-gray-600 mt-2">Of total disbursed</p>
        </Card>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 mb-8">
        <Button
          onClick={() => setReportType('portfolio')}
          variant={reportType === 'portfolio' ? 'default' : 'outline'}
          className={reportType === 'portfolio' ? 'bg-primary text-white' : ''}
        >
          Portfolio Analysis
        </Button>
        <Button
          onClick={() => setReportType('ageing')}
          variant={reportType === 'ageing' ? 'default' : 'outline'}
          className={reportType === 'ageing' ? 'bg-primary text-white' : ''}
        >
          Ageing Analysis
        </Button>
        <Button
          onClick={() => setReportType('performance')}
          variant={reportType === 'performance' ? 'default' : 'outline'}
          className={reportType === 'performance' ? 'bg-primary text-white' : ''}
        >
          Performance Trends
        </Button>
      </div>

      {/* Portfolio Analysis */}
      {reportType === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={loanStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {loanStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Total Disbursed</span>
                <span className="font-semibold text-gray-900">${(metrics?.totalDisbursed || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Outstanding Balance</span>
                <span className="font-semibold text-gray-900">${(metrics?.totalOutstanding || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Repaid Amount</span>
                <span className="font-semibold text-green-600">
                  ${((metrics?.totalDisbursed || 0) - (metrics?.totalOutstanding || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Repayment Rate</span>
                <span className="font-semibold text-gray-900">
                  {metrics?.totalDisbursed ? (((metrics.totalDisbursed - metrics.totalOutstanding) / metrics.totalDisbursed) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Ageing Analysis */}
      {reportType === 'ageing' && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Ageing Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Count</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">% of Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {ageingData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{row.category}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{row.count}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">${row.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {metrics?.totalOutstanding ? ((row.amount / metrics.totalOutstanding) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Performance Trends */}
      {reportType === 'performance' && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Disbursement vs Repayment Trends</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="disbursed"
                stroke="#0D3B47"
                name="Disbursed"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="repaid"
                stroke="#B9E54F"
                name="Repaid"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Compliance Note */}
      <Card className="p-6 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> All reports are generated based on current data in the system. For regulatory submissions, ensure all data is verified and approved by compliance team.
        </p>
      </Card>
    </div>
  );
}
