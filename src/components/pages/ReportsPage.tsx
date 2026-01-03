import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, Repayments, ECLResults, BoZProvisions, CustomerProfiles, StaffMembers, LoanProducts } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign,
  Calculator,
  Shield,
  BarChart3,
  Users,
  Briefcase,
  Clock,
  TrendingDown,
  PieChart,
  Activity,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { ReportExportService } from '@/services/ReportExportService';

export default function ReportsPage() {
  const [loans, setLoans] = useState<Loans[]>([]);
  const [repayments, setRepayments] = useState<Repayments[]>([]);
  const [eclResults, setECLResults] = useState<ECLResults[]>([]);
  const [provisions, setProvisions] = useState<BoZProvisions[]>([]);
  const [customers, setCustomers] = useState<CustomerProfiles[]>([]);
  const [staff, setStaff] = useState<StaffMembers[]>([]);
  const [products, setProducts] = useState<LoanProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loansData, repaymentsData, eclData, provisionsData, customersData, staffData, productsData] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<Repayments>('repayments'),
        BaseCrudService.getAll<ECLResults>('eclresults'),
        BaseCrudService.getAll<BoZProvisions>('bozprovisions'),
        BaseCrudService.getAll<CustomerProfiles>('customers'),
        BaseCrudService.getAll<StaffMembers>('staffmembers'),
        BaseCrudService.getAll<LoanProducts>('loanproducts')
      ]);

      setLoans(loansData.items);
      setRepayments(repaymentsData.items);
      setECLResults(eclData.items);
      setProvisions(provisionsData.items);
      setCustomers(customersData.items);
      setStaff(staffData.items);
      setProducts(productsData.items);
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
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const exportToExcel = (data: any[], filename: string) => {
    const columns = Object.keys(data[0] || {});
    const options = {
      filename: filename.replace(/\s+/g, '_').toLowerCase(),
      title: filename,
      data,
      columns: columns.map(col => ({ key: col, label: col }))
    };
    ReportExportService.exportToExcel(options);
  };

  const exportToPDF = (data: any[], filename: string) => {
    const columns = Object.keys(data[0] || {});
    const options = {
      filename: filename.replace(/\s+/g, '_').toLowerCase(),
      title: filename,
      data,
      columns: columns.map(col => ({ key: col, label: col }))
    };
    const pdfContent = ReportExportService.generatePDFContent(options);
    ReportExportService.printReport(pdfContent);
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
          <TabsList className="bg-primary border border-primary-foreground/10 flex flex-wrap gap-2 h-auto p-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Overview
            </TabsTrigger>
            <TabsTrigger value="borrowers" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Borrowers
            </TabsTrigger>
            <TabsTrigger value="loans" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Loans
            </TabsTrigger>
            <TabsTrigger value="arrears" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Loan Arrears Aging
            </TabsTrigger>
            <TabsTrigger value="collections" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Collections
            </TabsTrigger>
            <TabsTrigger value="collectors" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Collectors (Staff)
            </TabsTrigger>
            <TabsTrigger value="deferred-income" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Deferred Income
            </TabsTrigger>
            <TabsTrigger value="deferred-monthly" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Deferred Monthly
            </TabsTrigger>
            <TabsTrigger value="disbursements" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Disbursements
            </TabsTrigger>
            <TabsTrigger value="fees" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Fees
            </TabsTrigger>
            <TabsTrigger value="loan-officers" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Loan Officers
            </TabsTrigger>
            <TabsTrigger value="loan-products" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Loan Products
            </TabsTrigger>
            <TabsTrigger value="outstanding-balance" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Outstanding Balance
            </TabsTrigger>
            <TabsTrigger value="interest-income" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              Interest Income
            </TabsTrigger>
            <TabsTrigger value="ifrs9" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              IFRS 9 ECL
            </TabsTrigger>
            <TabsTrigger value="boz" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              BoZ Classification
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

          <TabsContent value="borrowers" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Borrowers Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Comprehensive borrower information and portfolio analysis
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => downloadCSV(customers, 'borrowers_report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => exportToExcel(customers, 'Borrowers Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => exportToPDF(customers, 'Borrowers Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary-foreground/10">
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Name</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Email</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Phone</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">KYC Status</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Credit Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.slice(0, 10).map((customer) => (
                        <tr key={customer._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{customer.firstName} {customer.lastName}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{customer.emailAddress}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{customer.phoneNumber}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                              customer.kycVerificationStatus === 'Verified' ? 'bg-secondary/20 text-secondary' : 'bg-brandaccent/20 text-brandaccent'
                            }`}>
                              {customer.kycVerificationStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{customer.creditScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {customers.length > 10 && (
                  <p className="text-center text-primary-foreground/60 text-sm mt-4">
                    Showing 10 of {customers.length} borrowers
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <Briefcase className="w-6 h-6" />
                  Loans Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Detailed loan portfolio and status information
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => downloadCSV(loans, 'loans_report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => exportToExcel(loans, 'Loans Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => exportToPDF(loans, 'Loans Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary-foreground/10">
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Loan Number</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Principal</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Outstanding</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Interest Rate</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.slice(0, 10).map((loan) => (
                        <tr key={loan._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{loan.loanNumber}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">ZMW {loan.principalAmount?.toLocaleString()}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">ZMW {loan.outstandingBalance?.toLocaleString()}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{loan.interestRate}%</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                              loan.loanStatus === 'Active' ? 'bg-secondary/20 text-secondary' : 'bg-brandaccent/20 text-brandaccent'
                            }`}>
                              {loan.loanStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {loans.length > 10 && (
                  <p className="text-center text-primary-foreground/60 text-sm mt-4">
                    Showing 10 of {loans.length} loans
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arrears" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Loan Arrears Aging Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Aging analysis of overdue loan payments
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => {
                      const arrearsData = loans
                        .filter(l => l.loanStatus === 'Overdue' || l.loanStatus === 'Delinquent')
                        .map(l => ({
                          loanNumber: l.loanNumber,
                          customerId: l.customerId,
                          outstandingBalance: l.outstandingBalance,
                          daysOverdue: Math.floor((new Date().getTime() - new Date(l.nextPaymentDate || '').getTime()) / (1000 * 60 * 60 * 24))
                        }));
                      downloadCSV(arrearsData, 'loan_arrears_aging');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const arrearsData = loans
                        .filter(l => l.loanStatus === 'Overdue' || l.loanStatus === 'Delinquent')
                        .map(l => ({
                          loanNumber: l.loanNumber,
                          customerId: l.customerId,
                          outstandingBalance: l.outstandingBalance,
                          daysOverdue: Math.floor((new Date().getTime() - new Date(l.nextPaymentDate || '').getTime()) / (1000 * 60 * 60 * 24))
                        }));
                      exportToExcel(arrearsData, 'Loan Arrears Aging Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const arrearsData = loans
                        .filter(l => l.loanStatus === 'Overdue' || l.loanStatus === 'Delinquent')
                        .map(l => ({
                          loanNumber: l.loanNumber,
                          customerId: l.customerId,
                          outstandingBalance: l.outstandingBalance,
                          daysOverdue: Math.floor((new Date().getTime() - new Date(l.nextPaymentDate || '').getTime()) / (1000 * 60 * 60 * 24))
                        }));
                      exportToPDF(arrearsData, 'Loan Arrears Aging Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="mt-6 p-4 bg-primary-foreground/5 rounded-lg">
                  <h4 className="font-heading text-secondary mb-3">Arrears Summary</h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-primary-foreground/60 text-sm">0-30 Days</p>
                      <p className="text-2xl font-bold text-primary-foreground">{loans.filter(l => {
                        const days = Math.floor((new Date().getTime() - new Date(l.nextPaymentDate || '').getTime()) / (1000 * 60 * 60 * 24));
                        return days >= 0 && days <= 30;
                      }).length}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">31-60 Days</p>
                      <p className="text-2xl font-bold text-primary-foreground">{loans.filter(l => {
                        const days = Math.floor((new Date().getTime() - new Date(l.nextPaymentDate || '').getTime()) / (1000 * 60 * 60 * 24));
                        return days > 30 && days <= 60;
                      }).length}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">60+ Days</p>
                      <p className="text-2xl font-bold text-destructive">{loans.filter(l => {
                        const days = Math.floor((new Date().getTime() - new Date(l.nextPaymentDate || '').getTime()) / (1000 * 60 * 60 * 24));
                        return days > 60;
                      }).length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Collections Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Collections performance and payment tracking
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => downloadCSV(repayments, 'collections_report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => exportToExcel(repayments, 'Collections Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => exportToPDF(repayments, 'Collections Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="mt-6 p-4 bg-primary-foreground/5 rounded-lg">
                  <h4 className="font-heading text-secondary mb-3">Collections Summary</h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Total Collected</p>
                      <p className="text-2xl font-bold text-secondary">ZMW {repayments.reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Principal Collected</p>
                      <p className="text-2xl font-bold text-primary-foreground">ZMW {repayments.reduce((sum, r) => sum + (r.principalAmount || 0), 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Interest Collected</p>
                      <p className="text-2xl font-bold text-primary-foreground">ZMW {repayments.reduce((sum, r) => sum + (r.interestAmount || 0), 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collectors" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Collectors Report (Staff)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Staff collector performance and collection metrics
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => downloadCSV(staff.filter(s => s.role === 'Collector' || s.department === 'Collections'), 'collectors_report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => exportToExcel(staff.filter(s => s.role === 'Collector' || s.department === 'Collections'), 'Collectors Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => exportToPDF(staff.filter(s => s.role === 'Collector' || s.department === 'Collections'), 'Collectors Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary-foreground/10">
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Name</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Employee ID</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Department</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.filter(s => s.role === 'Collector' || s.department === 'Collections').slice(0, 10).map((member) => (
                        <tr key={member._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{member.fullName}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{member.employeeId}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{member.department}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                              member.status === 'Active' ? 'bg-secondary/20 text-secondary' : 'bg-brandaccent/20 text-brandaccent'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deferred-income" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Deferred Income Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Deferred income tracking and recognition schedule
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => {
                      const deferredData = loans.map(l => ({
                        loanNumber: l.loanNumber,
                        principalAmount: l.principalAmount,
                        interestRate: l.interestRate,
                        deferredIncome: (l.principalAmount || 0) * ((l.interestRate || 0) / 100)
                      }));
                      downloadCSV(deferredData, 'deferred_income_report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const deferredData = loans.map(l => ({
                        loanNumber: l.loanNumber,
                        principalAmount: l.principalAmount,
                        interestRate: l.interestRate,
                        deferredIncome: (l.principalAmount || 0) * ((l.interestRate || 0) / 100)
                      }));
                      exportToExcel(deferredData, 'Deferred Income Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const deferredData = loans.map(l => ({
                        loanNumber: l.loanNumber,
                        principalAmount: l.principalAmount,
                        interestRate: l.interestRate,
                        deferredIncome: (l.principalAmount || 0) * ((l.interestRate || 0) / 100)
                      }));
                      exportToPDF(deferredData, 'Deferred Income Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="mt-6 p-4 bg-primary-foreground/5 rounded-lg">
                  <h4 className="font-heading text-secondary mb-3">Deferred Income Summary</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Total Deferred Income</p>
                      <p className="text-2xl font-bold text-secondary">ZMW {loans.reduce((sum, l) => sum + ((l.principalAmount || 0) * ((l.interestRate || 0) / 100)), 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Recognized Income</p>
                      <p className="text-2xl font-bold text-primary-foreground">ZMW {repayments.reduce((sum, r) => sum + (r.interestAmount || 0), 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deferred-monthly" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  Deferred Income Monthly Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Monthly deferred income analysis and trends
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => {
                      const monthlyData = Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(new Date().getFullYear(), i, 1);
                        return {
                          month: format(month, 'MMMM yyyy'),
                          deferredIncome: loans.reduce((sum, l) => sum + ((l.principalAmount || 0) * ((l.interestRate || 0) / 100)), 0) / 12,
                          recognizedIncome: repayments.filter(r => {
                            const rDate = new Date(r.repaymentDate || '');
                            return rDate.getMonth() === i;
                          }).reduce((sum, r) => sum + (r.interestAmount || 0), 0)
                        };
                      });
                      downloadCSV(monthlyData, 'deferred_income_monthly');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const monthlyData = Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(new Date().getFullYear(), i, 1);
                        return {
                          month: format(month, 'MMMM yyyy'),
                          deferredIncome: loans.reduce((sum, l) => sum + ((l.principalAmount || 0) * ((l.interestRate || 0) / 100)), 0) / 12,
                          recognizedIncome: repayments.filter(r => {
                            const rDate = new Date(r.repaymentDate || '');
                            return rDate.getMonth() === i;
                          }).reduce((sum, r) => sum + (r.interestAmount || 0), 0)
                        };
                      });
                      exportToExcel(monthlyData, 'Deferred Income Monthly Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const monthlyData = Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(new Date().getFullYear(), i, 1);
                        return {
                          month: format(month, 'MMMM yyyy'),
                          deferredIncome: loans.reduce((sum, l) => sum + ((l.principalAmount || 0) * ((l.interestRate || 0) / 100)), 0) / 12,
                          recognizedIncome: repayments.filter(r => {
                            const rDate = new Date(r.repaymentDate || '');
                            return rDate.getMonth() === i;
                          }).reduce((sum, r) => sum + (r.interestAmount || 0), 0)
                        };
                      });
                      exportToPDF(monthlyData, 'Deferred Income Monthly Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disbursements" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Disbursement Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Loan disbursement tracking and analysis
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => downloadCSV(loans, 'disbursement_report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => exportToExcel(loans, 'Disbursement Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => exportToPDF(loans, 'Disbursement Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="mt-6 p-4 bg-primary-foreground/5 rounded-lg">
                  <h4 className="font-heading text-secondary mb-3">Disbursement Summary</h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Total Disbursed</p>
                      <p className="text-2xl font-bold text-secondary">ZMW {totalDisbursed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Number of Loans</p>
                      <p className="text-2xl font-bold text-primary-foreground">{loans.length}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Average Loan Size</p>
                      <p className="text-2xl font-bold text-primary-foreground">ZMW {(totalDisbursed / loans.length).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Fees Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Loan fees and charges analysis
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => {
                      const feesData = loans.map(l => ({
                        loanNumber: l.loanNumber,
                        principalAmount: l.principalAmount,
                        processingFee: (l.principalAmount || 0) * 0.02,
                        totalFees: (l.principalAmount || 0) * 0.02
                      }));
                      downloadCSV(feesData, 'fees_report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const feesData = loans.map(l => ({
                        loanNumber: l.loanNumber,
                        principalAmount: l.principalAmount,
                        processingFee: (l.principalAmount || 0) * 0.02,
                        totalFees: (l.principalAmount || 0) * 0.02
                      }));
                      exportToExcel(feesData, 'Fees Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const feesData = loans.map(l => ({
                        loanNumber: l.loanNumber,
                        principalAmount: l.principalAmount,
                        processingFee: (l.principalAmount || 0) * 0.02,
                        totalFees: (l.principalAmount || 0) * 0.02
                      }));
                      exportToPDF(feesData, 'Fees Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="mt-6 p-4 bg-primary-foreground/5 rounded-lg">
                  <h4 className="font-heading text-secondary mb-3">Fees Summary</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Total Fees Collected</p>
                      <p className="text-2xl font-bold text-secondary">ZMW {(loans.reduce((sum, l) => sum + ((l.principalAmount || 0) * 0.02), 0)).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Average Fee per Loan</p>
                      <p className="text-2xl font-bold text-primary-foreground">ZMW {((loans.reduce((sum, l) => sum + ((l.principalAmount || 0) * 0.02), 0)) / loans.length).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loan-officers" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Loan Officer Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Loan officer performance and portfolio metrics
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => downloadCSV(staff.filter(s => s.role === 'Loan Officer' || s.department === 'Lending'), 'loan_officers_report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => exportToExcel(staff.filter(s => s.role === 'Loan Officer' || s.department === 'Lending'), 'Loan Officer Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => exportToPDF(staff.filter(s => s.role === 'Loan Officer' || s.department === 'Lending'), 'Loan Officer Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary-foreground/10">
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Name</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Employee ID</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Department</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Date Hired</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.filter(s => s.role === 'Loan Officer' || s.department === 'Lending').slice(0, 10).map((member) => (
                        <tr key={member._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{member.fullName}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{member.employeeId}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{member.department}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{member.dateHired ? format(new Date(member.dateHired), 'MMM d, yyyy') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loan-products" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <Briefcase className="w-6 h-6" />
                  Loan Product Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Loan product performance and portfolio analysis
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => downloadCSV(products, 'loan_products_report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => exportToExcel(products, 'Loan Product Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => exportToPDF(products, 'Loan Product Report')}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary-foreground/10">
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Product Name</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Interest Rate</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Min Amount</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Max Amount</th>
                        <th className="text-left py-3 px-4 font-paragraph text-primary-foreground/70">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 10).map((product) => (
                        <tr key={product._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{product.productName}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">{product.interestRate}%</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">ZMW {product.minLoanAmount?.toLocaleString()}</td>
                          <td className="py-3 px-4 font-paragraph text-primary-foreground">ZMW {product.maxLoanAmount?.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                              product.isActive ? 'bg-secondary/20 text-secondary' : 'bg-brandaccent/20 text-brandaccent'
                            }`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outstanding-balance" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <TrendingDown className="w-6 h-6" />
                  Month on Month Outstanding Balance Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Outstanding balance trends and month-on-month comparison
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => {
                      const monthlyBalance = Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(new Date().getFullYear(), i, 1);
                        return {
                          month: format(month, 'MMMM yyyy'),
                          outstandingBalance: totalOutstanding,
                          principalAmount: totalDisbursed,
                          percentageOutstanding: ((totalOutstanding / totalDisbursed) * 100).toFixed(2)
                        };
                      });
                      downloadCSV(monthlyBalance, 'outstanding_balance_monthly');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const monthlyBalance = Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(new Date().getFullYear(), i, 1);
                        return {
                          month: format(month, 'MMMM yyyy'),
                          outstandingBalance: totalOutstanding,
                          principalAmount: totalDisbursed,
                          percentageOutstanding: ((totalOutstanding / totalDisbursed) * 100).toFixed(2)
                        };
                      });
                      exportToExcel(monthlyBalance, 'Month on Month Outstanding Balance Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const monthlyBalance = Array.from({ length: 12 }, (_, i) => {
                        const month = new Date(new Date().getFullYear(), i, 1);
                        return {
                          month: format(month, 'MMMM yyyy'),
                          outstandingBalance: totalOutstanding,
                          principalAmount: totalDisbursed,
                          percentageOutstanding: ((totalOutstanding / totalDisbursed) * 100).toFixed(2)
                        };
                      });
                      exportToPDF(monthlyBalance, 'Month on Month Outstanding Balance Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interest-income" className="space-y-6">
            <Card className="bg-primary border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-secondary flex items-center gap-2">
                  <PieChart className="w-6 h-6" />
                  Month on Month Interest Income Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-paragraph text-primary-foreground/70">
                  Interest income trends and month-on-month comparison
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => {
                      const monthlyIncome = Array.from({ length: 12 }, (_, i) => {
                        return {
                          month: format(new Date(new Date().getFullYear(), i, 1), 'MMMM yyyy'),
                          interestIncome: repayments.filter(r => {
                            const rDate = new Date(r.repaymentDate || '');
                            return rDate.getMonth() === i;
                          }).reduce((sum, r) => sum + (r.interestAmount || 0), 0)
                        };
                      });
                      downloadCSV(monthlyIncome, 'interest_income_monthly');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const monthlyIncome = Array.from({ length: 12 }, (_, i) => {
                        return {
                          month: format(new Date(new Date().getFullYear(), i, 1), 'MMMM yyyy'),
                          interestIncome: repayments.filter(r => {
                            const rDate = new Date(r.repaymentDate || '');
                            return rDate.getMonth() === i;
                          }).reduce((sum, r) => sum + (r.interestAmount || 0), 0)
                        };
                      });
                      exportToExcel(monthlyIncome, 'Month on Month Interest Income Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Export Excel</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const monthlyIncome = Array.from({ length: 12 }, (_, i) => {
                        return {
                          month: format(new Date(new Date().getFullYear(), i, 1), 'MMMM yyyy'),
                          interestIncome: repayments.filter(r => {
                            const rDate = new Date(r.repaymentDate || '');
                            return rDate.getMonth() === i;
                          }).reduce((sum, r) => sum + (r.interestAmount || 0), 0)
                        };
                      });
                      exportToPDF(monthlyIncome, 'Month on Month Interest Income Report');
                    }}
                    className="bg-secondary text-primary hover:bg-secondary/90 h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    <span className="font-paragraph text-sm">Print/PDF</span>
                  </Button>
                </div>
                <div className="mt-6 p-4 bg-primary-foreground/5 rounded-lg">
                  <h4 className="font-heading text-secondary mb-3">Interest Income Summary</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Total Interest Income</p>
                      <p className="text-2xl font-bold text-secondary">ZMW {repayments.reduce((sum, r) => sum + (r.interestAmount || 0), 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/60 text-sm">Average Monthly Income</p>
                      <p className="text-2xl font-bold text-primary-foreground">ZMW {(repayments.reduce((sum, r) => sum + (r.interestAmount || 0), 0) / 12).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
