import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, Repayments, ECLResults, BoZProvisions, CustomerProfiles } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign,
  Calculator,
  Shield,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

export default function ReportsPage() {
  const [loans, setLoans] = useState<Loans[]>([]);
  const [repayments, setRepayments] = useState<Repayments[]>([]);
  const [eclResults, setECLResults] = useState<ECLResults[]>([]);
  const [provisions, setProvisions] = useState<BoZProvisions[]>([]);
  const [customers, setCustomers] = useState<CustomerProfiles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loansData, repaymentsData, eclData, provisionsData, customersData] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<Repayments>('repayments'),
        BaseCrudService.getAll<ECLResults>('eclresults'),
        BaseCrudService.getAll<BoZProvisions>('bozprovisions'),
        BaseCrudService.getAll<CustomerProfiles>('customers')
      ]);

      setLoans(loansData.items);
      setRepayments(repaymentsData.items);
      setECLResults(eclData.items);
      setProvisions(provisionsData.items);
      setCustomers(customersData.items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDisbursed = loans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const totalRepaid = repayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);
  const totalECL = eclResults.reduce((sum, e) => sum + (e.eclValue || 0), 0);
  const totalProvisions = provisions.reduce((sum, p) => sum + (p.provisionAmount || 0), 0);

  const eclByStage = {
    Stage1: eclResults.filter(e => e.ifrs9Stage === 'Stage 1').reduce((sum, e) => sum + (e.eclValue || 0), 0),
    Stage2: eclResults.filter(e => e.ifrs9Stage === 'Stage 2').reduce((sum, e) => sum + (e.eclValue || 0), 0),
    Stage3: eclResults.filter(e => e.ifrs9Stage === 'Stage 3').reduce((sum, e) => sum + (e.eclValue || 0), 0)
  };

  const bozByClass = {
    Current: provisions.filter(p => p.bozClassification === 'Current').reduce((sum, p) => sum + (p.provisionAmount || 0), 0),
    Watch: provisions.filter(p => p.bozClassification === 'Watch').reduce((sum, p) => sum + (p.provisionAmount || 0), 0),
    Substandard: provisions.filter(p => p.bozClassification === 'Substandard').reduce((sum, p) => sum + (p.provisionAmount || 0), 0),
    Doubtful: provisions.filter(p => p.bozClassification === 'Doubtful').reduce((sum, p) => sum + (p.provisionAmount || 0), 0),
    Loss: provisions.filter(p => p.bozClassification === 'Loss').reduce((sum, p) => sum + (p.provisionAmount || 0), 0)
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-paragraph text-primary-foreground/70">Loading reports...</p>
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
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-secondary mb-2">
            Reports & Analytics
          </h1>
          <p className="font-paragraph text-base text-primary-foreground">
            Comprehensive reporting for compliance and decision-making
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-primary border border-primary-foreground/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Overview
            </TabsTrigger>
            <TabsTrigger value="ifrs9" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              IFRS 9 ECL
            </TabsTrigger>
            <TabsTrigger value="boz" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              BoZ Classification
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Advanced Reports
            </TabsTrigger>
            <TabsTrigger value="comprehensive" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Comprehensive
            </TabsTrigger>
            <TabsTrigger value="disbursements" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Disbursements
            </TabsTrigger>
            <TabsTrigger value="exports" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Data Exports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-primary border-primary-foreground/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <DollarSign className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                  <div className="font-heading text-3xl font-bold text-primary-foreground mb-1">
                    ZMW {totalDisbursed.toLocaleString()}
                  </div>
                  <div className="font-paragraph text-sm text-primary-foreground">
                    Total Disbursed
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary border-primary-foreground/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-brandaccent/10">
                      <TrendingUp className="w-6 h-6 text-brandaccent" />
                    </div>
                  </div>
                  <div className="font-heading text-3xl font-bold text-primary-foreground mb-1">
                    ZMW {totalOutstanding.toLocaleString()}
                  </div>
                  <div className="font-paragraph text-sm text-primary-foreground">
                    Outstanding Balance
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary border-primary-foreground/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <DollarSign className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                  <div className="font-heading text-3xl font-bold text-primary-foreground mb-1">
                    ZMW {totalRepaid.toLocaleString()}
                  </div>
                  <div className="font-paragraph text-sm text-primary-foreground">
                    Total Repaid
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary border-primary-foreground/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <BarChart3 className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                  <div className="font-heading text-3xl font-bold text-primary-foreground mb-1">
                    {totalDisbursed > 0 ? ((totalRepaid / totalDisbursed) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="font-paragraph text-sm text-primary-foreground">
                    Collection Rate
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-primary border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-secondary">
                    Portfolio Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-primary-foreground/10">
                    <span className="font-paragraph text-sm text-primary-foreground">Total Customers</span>
                    <span className="font-paragraph text-base text-primary-foreground font-semibold">{customers.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-primary-foreground/10">
                    <span className="font-paragraph text-sm text-primary-foreground">Total Loans</span>
                    <span className="font-paragraph text-base text-primary-foreground font-semibold">{loans.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-primary-foreground/10">
                    <span className="font-paragraph text-sm text-primary-foreground">Active Loans</span>
                    <span className="font-paragraph text-base text-primary-foreground font-semibold">
                      {loans.filter(l => l.loanStatus === 'Active').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-primary-foreground/10">
                    <span className="font-paragraph text-sm text-primary-foreground">Closed Loans</span>
                    <span className="font-paragraph text-base text-primary-foreground font-semibold">
                      {loans.filter(l => l.loanStatus === 'Closed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-paragraph text-sm text-primary-foreground">Defaulted Loans</span>
                    <span className="font-paragraph text-base text-destructive font-semibold">
                      {loans.filter(l => l.loanStatus === 'Defaulted').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl text-secondary">
                    Risk Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-primary-foreground/10">
                    <span className="font-paragraph text-sm text-primary-foreground">Total ECL</span>
                    <span className="font-paragraph text-base text-destructive font-semibold">ZMW {totalECL.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-primary-foreground/10">
                    <span className="font-paragraph text-sm text-primary-foreground">Total Provisions</span>
                    <span className="font-paragraph text-base text-destructive font-semibold">ZMW {totalProvisions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-primary-foreground/10">
                    <span className="font-paragraph text-sm text-primary-foreground">ECL Coverage Ratio</span>
                    <span className="font-paragraph text-base text-primary-foreground font-semibold">
                      {totalOutstanding > 0 ? ((totalECL / totalOutstanding) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-paragraph text-sm text-primary-foreground">Provision Coverage Ratio</span>
                    <span className="font-paragraph text-base text-primary-foreground font-semibold">
                      {totalOutstanding > 0 ? ((totalProvisions / totalOutstanding) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ifrs9" className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="bg-primary border-primary-foreground/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <Calculator className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                  <div className="font-heading text-3xl font-bold text-primary-foreground mb-1">
                    ZMW {eclByStage.Stage1.toLocaleString()}
                  </div>
                  <div className="font-paragraph text-sm text-primary-foreground">
                    Stage 1 ECL
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary border-primary-foreground/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-brandaccent/10">
                      <Calculator className="w-6 h-6 text-brandaccent" />
                    </div>
                  </div>
                  <div className="font-heading text-3xl font-bold text-primary-foreground mb-1">
                    ZMW {eclByStage.Stage2.toLocaleString()}
                  </div>
                  <div className="font-paragraph text-sm text-primary-foreground/60">
                    Stage 2 ECL
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary border-primary-foreground/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-destructive/10">
                      <Calculator className="w-6 h-6 text-destructive" />
                    </div>
                  </div>
                  <div className="font-heading text-3xl font-bold text-primary-foreground mb-1">
                    ZMW {eclByStage.Stage3.toLocaleString()}
                  </div>
                  <div className="font-paragraph text-sm text-primary-foreground/60">
                    Stage 3 ECL
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary">
                  IFRS 9 ECL Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eclResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Calculator className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                    <p className="font-paragraph text-primary-foreground/60">No ECL results available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-primary-foreground/10">
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Loan Reference</th>
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">ECL Value</th>
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">IFRS 9 Stage</th>
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Calculation Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eclResults.map((ecl) => (
                          <tr key={ecl._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                            <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{ecl.loanReference}</td>
                            <td className="py-3 px-4 font-paragraph text-sm text-destructive font-semibold">ZMW {ecl.eclValue?.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                                ecl.ifrs9Stage === 'Stage 1' ? 'bg-secondary/20 text-secondary' :
                                ecl.ifrs9Stage === 'Stage 2' ? 'bg-brandaccent/20 text-brandaccent' :
                                'bg-destructive/20 text-destructive'
                              }`}>
                                {ecl.ifrs9Stage}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">
                              {ecl.calculationTimestamp ? format(new Date(ecl.calculationTimestamp), 'MMM d, yyyy HH:mm') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boz" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(bozByClass).map(([classification, amount]) => (
                <Card key={classification} className="bg-primary border-primary-foreground/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-brandaccent/10">
                        <Shield className="w-6 h-6 text-brandaccent" />
                      </div>
                    </div>
                    <div className="font-heading text-2xl font-bold text-primary-foreground mb-1">
                      ZMW {amount.toLocaleString()}
                    </div>
                    <div className="font-paragraph text-sm text-primary-foreground/60">
                      {classification}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary">
                  BoZ Classification & Provisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {provisions.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                    <p className="font-paragraph text-primary-foreground/60">No provision data available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-primary-foreground/10">
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Loan ID</th>
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">BoZ Classification</th>
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Provision Amount</th>
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Provision %</th>
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">IFRS 9 Stage</th>
                          <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Calculation Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {provisions.map((provision) => (
                          <tr key={provision._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                            <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{provision.loanId}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                                provision.bozClassification === 'Current' ? 'bg-secondary/20 text-secondary' :
                                provision.bozClassification === 'Watch' ? 'bg-brandaccent/20 text-brandaccent' :
                                'bg-destructive/20 text-destructive'
                              }`}>
                                {provision.bozClassification}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-paragraph text-sm text-destructive font-semibold">
                              ZMW {provision.provisionAmount?.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">
                              {provision.provisionPercentage}%
                            </td>
                            <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">
                              {provision.ifrs9StageClassification}
                            </td>
                            <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">
                              {provision.calculationDate ? format(new Date(provision.calculationDate), 'MMM d, yyyy') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary">
                  Advanced Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Advanced reporting features for detailed analysis and custom metrics
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Portfolio Analysis</span>
                  </Button>
                  <Button
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Trend Analysis</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comprehensive" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary">
                  Comprehensive Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Complete portfolio reports combining all metrics and compliance data
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Full Portfolio Report</span>
                  </Button>
                  <Button
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Comprehensive</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disbursements" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary">
                  Disbursement Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Detailed disbursement tracking and analysis
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <DollarSign className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Disbursement Summary</span>
                  </Button>
                  <Button
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Disbursement Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exports" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary">
                  Export Data for Audit & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    onClick={() => downloadCSV(customers, 'customers')}
                    className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
                    variant="outline"
                  >
                    <Download className="w-6 h-6 text-secondary" />
                    <span className="font-paragraph text-sm">Export Customers</span>
                  </Button>

                  <Button
                    onClick={() => downloadCSV(loans, 'loans')}
                    className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
                    variant="outline"
                  >
                    <Download className="w-6 h-6 text-secondary" />
                    <span className="font-paragraph text-sm">Export Loans</span>
                  </Button>

                  <Button
                    onClick={() => downloadCSV(repayments, 'repayments')}
                    className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
                    variant="outline"
                  >
                    <Download className="w-6 h-6 text-secondary" />
                    <span className="font-paragraph text-sm">Export Repayments</span>
                  </Button>

                  <Button
                    onClick={() => downloadCSV(eclResults, 'ecl_results')}
                    className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
                    variant="outline"
                  >
                    <Download className="w-6 h-6 text-secondary" />
                    <span className="font-paragraph text-sm">Export ECL Results</span>
                  </Button>

                  <Button
                    onClick={() => downloadCSV(provisions, 'boz_provisions')}
                    className="bg-primary border border-primary-foreground/10 hover:border-secondary/30 text-primary-foreground h-auto py-6 flex flex-col items-center gap-3"
                    variant="outline"
                  >
                    <Download className="w-6 h-6 text-secondary" />
                    <span className="font-paragraph text-sm">Export BoZ Provisions</span>
                  </Button>

                  <Button
                    onClick={() => {
                      const fullReport = {
                        generatedAt: new Date().toISOString(),
                        summary: {
                          totalCustomers: customers.length,
                          totalLoans: loans.length,
                          totalDisbursed,
                          totalOutstanding,
                          totalRepaid,
                          totalECL,
                          totalProvisions
                        },
                        customers,
                        loans,
                        repayments,
                        eclResults,
                        provisions
                      };
                      const blob = new Blob([JSON.stringify(fullReport, null, 2)], { type: 'application/json' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `full_audit_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
                      a.click();
                    }}
                    className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 h-auto py-6 flex flex-col items-center gap-3"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Full Audit Report (JSON)</span>
                  </Button>
                </div>

                <div className="mt-8 p-6 bg-primary-foreground/5 rounded-lg border border-primary-foreground/10">
                  <h3 className="font-heading text-lg text-secondary mb-3">Export Information</h3>
                  <ul className="space-y-2 font-paragraph text-sm text-primary-foreground/70">
                    <li>• CSV exports are suitable for Excel and data analysis tools</li>
                    <li>• JSON export includes complete audit trail with all relationships</li>
                    <li>• All exports include timestamps for regulatory compliance</li>
                    <li>• Data is exported in current state without modifications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
