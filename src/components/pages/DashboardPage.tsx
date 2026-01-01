import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { Loans, Repayments, ECLResults, BoZProvisions } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2,
  FileText,
  Users,
  Calculator,
  Shield
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loans[]>([]);
  const [repayments, setRepayments] = useState<Repayments[]>([]);
  const [eclResults, setECLResults] = useState<ECLResults[]>([]);
  const [provisions, setProvisions] = useState<BoZProvisions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [loansData, repaymentsData, eclData, provisionsData] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<Repayments>('repayments'),
        BaseCrudService.getAll<ECLResults>('eclresults'),
        BaseCrudService.getAll<BoZProvisions>('bozprovisions')
      ]);

      setLoans(loansData.items);
      setRepayments(repaymentsData.items);
      setECLResults(eclData.items);
      setProvisions(provisionsData.items);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLoans = loans.length;
  const activeLoans = loans.filter(l => l.loanStatus === 'Active').length;
  const totalDisbursed = loans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const totalRepayments = repayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);
  const totalECL = eclResults.reduce((sum, e) => sum + (e.eclValue || 0), 0);
  const totalProvisions = provisions.reduce((sum, p) => sum + (p.provisionAmount || 0), 0);

  const stats = [
    {
      title: 'Total Loans',
      value: totalLoans.toString(),
      icon: FileText,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Active Loans',
      value: activeLoans.toString(),
      icon: CheckCircle2,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Total Disbursed',
      value: `ZMW ${totalDisbursed.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-brandaccent',
      bgColor: 'bg-brandaccent/10'
    },
    {
      title: 'Outstanding Balance',
      value: `ZMW ${totalOutstanding.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-brandaccent',
      bgColor: 'bg-brandaccent/10'
    },
    {
      title: 'Total Repayments',
      value: `ZMW ${totalRepayments.toLocaleString()}`,
      icon: CheckCircle2,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'IFRS 9 ECL',
      value: `ZMW ${totalECL.toLocaleString()}`,
      icon: Calculator,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'BoZ Provisions',
      value: `ZMW ${totalProvisions.toLocaleString()}`,
      icon: Shield,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Collection Rate',
      value: totalDisbursed > 0 ? `${((totalRepayments / totalDisbursed) * 100).toFixed(1)}%` : '0%',
      icon: TrendingUp,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    }
  ];

  const recentLoans = loans.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-paragraph text-primary-foreground/70">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-secondary mb-2">
            Dashboard Overview
          </h1>
          <p className="font-paragraph text-base text-primary-foreground/70">
            Real-time portfolio metrics and compliance monitoring
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-primary border-primary-foreground/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="font-heading text-3xl font-bold text-primary-foreground mb-1">
                  {stat.value}
                </div>
                <div className="font-paragraph text-sm text-primary-foreground/60">
                  {stat.title}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-4 gap-6 mb-12">
          <Button
            onClick={() => navigate('/customers')}
            className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
            variant="outline"
          >
            <Users className="w-8 h-8 text-secondary" />
            <span className="font-paragraph text-base">Manage Customers</span>
          </Button>
          <Button
            onClick={() => navigate('/loans')}
            className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
            variant="outline"
          >
            <FileText className="w-8 h-8 text-secondary" />
            <span className="font-paragraph text-base">Manage Loans</span>
          </Button>
          <Button
            onClick={() => navigate('/repayments')}
            className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
            variant="outline"
          >
            <DollarSign className="w-8 h-8 text-secondary" />
            <span className="font-paragraph text-base">Process Repayments</span>
          </Button>
          <Button
            onClick={() => navigate('/reports')}
            className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
            variant="outline"
          >
            <Calculator className="w-8 h-8 text-secondary" />
            <span className="font-paragraph text-base">View Reports</span>
          </Button>
        </div>

        {/* Recent Loans */}
        <Card className="bg-primary border-primary-foreground/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-2xl text-secondary">
              Recent Loans
            </CardTitle>
            <Button
              onClick={() => navigate('/loans')}
              variant="ghost"
              className="text-secondary hover:text-secondary/80"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentLoans.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                <p className="font-paragraph text-primary-foreground/60">No loans found</p>
                <Button
                  onClick={() => navigate('/loans')}
                  className="mt-4 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90"
                >
                  Create First Loan
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary-foreground/10">
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Loan Number</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Customer ID</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Principal</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Outstanding</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLoans.map((loan) => (
                      <tr key={loan._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{loan.loanNumber}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{loan.customerId}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">ZMW {loan.principalAmount?.toLocaleString()}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">ZMW {loan.outstandingBalance?.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                            loan.loanStatus === 'Active' ? 'bg-secondary/20 text-secondary' :
                            loan.loanStatus === 'Closed' ? 'bg-primary-foreground/20 text-primary-foreground' :
                            'bg-destructive/20 text-destructive'
                          }`}>
                            {loan.loanStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
