import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer, FileText } from 'lucide-react';
import { ReportExportService } from '@/services/ReportExportService';
import { BaseCrudService } from '@/integrations';
import { Loans, Repayments, CustomerProfiles, LoanProducts, Organizations } from '@/entities';
import DelinquencyAgingReport from '@/components/reports/DelinquencyAgingReport';
import InterestIncomeReport from '@/components/reports/InterestIncomeReport';
import WriteOffSummaryReport from '@/components/reports/WriteOffSummaryReport';
import IFRS9StagingReport from '@/components/reports/IFRS9StagingReport';
import ECLAnalysisReport from '@/components/reports/ECLAnalysisReport';
import ComplianceSummaryReport from '@/components/reports/ComplianceSummaryReport';
import AuditTrailReport from '@/components/reports/AuditTrailReport';
import RiskAssessmentReport from '@/components/reports/RiskAssessmentReport';

interface ReportFilters {
  startDate: string;
  endDate: string;
  branch: string;
  product: string;
  status: string;
}

interface ReportData {
  id: string;
  [key: string]: any;
}

export default function ComprehensiveReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    branch: '',
    product: '',
    status: '',
  });

  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState('portfolio-summary');

  // Fetch data for reports
  const fetchReportData = async (reportType: string) => {
    setLoading(true);
    try {
      let data: ReportData[] = [];

      switch (reportType) {
        case 'portfolio-summary':
          const loans = await BaseCrudService.getAll<Loans>('loans');
          data = loans.items.map(loan => ({
            id: loan._id,
            loanNumber: loan.loanNumber,
            principalAmount: loan.principalAmount,
            outstandingBalance: loan.outstandingBalance,
            interestRate: loan.interestRate,
            loanStatus: loan.loanStatus,
            disbursementDate: loan.disbursementDate,
          }));
          break;

        case 'repayment-analysis':
          const repayments = await BaseCrudService.getAll<Repayments>('repayments');
          data = repayments.items.map(rep => ({
            id: rep._id,
            transactionReference: rep.transactionReference,
            loanId: rep.loanId,
            repaymentDate: rep.repaymentDate,
            totalAmountPaid: rep.totalAmountPaid,
            principalAmount: rep.principalAmount,
            interestAmount: rep.interestAmount,
            paymentMethod: rep.paymentMethod,
          }));
          break;

        case 'customer-performance':
          const customers = await BaseCrudService.getAll<CustomerProfiles>('customers');
          data = customers.items.map(cust => ({
            id: cust._id,
            firstName: cust.firstName,
            lastName: cust.lastName,
            emailAddress: cust.emailAddress,
            phoneNumber: cust.phoneNumber,
            kycVerificationStatus: cust.kycVerificationStatus,
            creditScore: cust.creditScore,
          }));
          break;

        case 'product-performance':
          const products = await BaseCrudService.getAll<LoanProducts>('loanproducts');
          data = products.items.map(prod => ({
            id: prod._id,
            productName: prod.productName,
            productType: prod.productType,
            interestRate: prod.interestRate,
            minLoanAmount: prod.minLoanAmount,
            maxLoanAmount: prod.maxLoanAmount,
            loanTermMonths: prod.loanTermMonths,
            processingFee: prod.processingFee,
            isActive: prod.isActive,
          }));
          break;

        case 'branch-performance':
          const orgs = await BaseCrudService.getAll<Organizations>('organisations');
          data = orgs.items.map(org => ({
            id: org._id,
            organizationName: org.organizationName,
            organizationStatus: org.organizationStatus,
            subscriptionPlanType: org.subscriptionPlanType,
            creationDate: org.creationDate,
            contactEmail: org.contactEmail,
          }));
          break;

        default:
          data = [];
      }

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    let filtered = [...reportData];

    if (filters.startDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.disbursementDate || item.repaymentDate || item.creationDate || '');
        return itemDate >= new Date(filters.startDate);
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.disbursementDate || item.repaymentDate || item.creationDate || '');
        return itemDate <= new Date(filters.endDate);
      });
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.loanStatus === filters.status);
    }

    return filtered;
  }, [reportData, filters]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const reportTitles: Record<string, string> = {
      'portfolio-summary': 'Loan Portfolio Summary Report',
      'repayment-analysis': 'Repayment Analysis Report',
      'customer-performance': 'Customer Performance Report',
      'product-performance': 'Product Performance Report',
      'branch-performance': 'Branch Performance Report',
    };

    const columns = getColumnsForReport(activeReport);
    const title = reportTitles[activeReport] || 'Report';

    const options = {
      filename: title.replace(/\s+/g, '_').toLowerCase(),
      title,
      data: filteredData,
      columns,
    };

    if (format === 'csv') {
      ReportExportService.exportToCSV(options);
    } else if (format === 'excel') {
      ReportExportService.exportToExcel(options);
    } else if (format === 'pdf') {
      const pdfContent = ReportExportService.generatePDFContent(options);
      ReportExportService.printReport(pdfContent);
    }
  };

  const getColumnsForReport = (reportType: string) => {
    const columnMap: Record<string, Array<{ key: string; label: string }>> = {
      'portfolio-summary': [
        { key: 'loanNumber', label: 'Loan Number' },
        { key: 'principalAmount', label: 'Principal Amount' },
        { key: 'outstandingBalance', label: 'Outstanding Balance' },
        { key: 'interestRate', label: 'Interest Rate (%)' },
        { key: 'loanStatus', label: 'Status' },
        { key: 'disbursementDate', label: 'Disbursement Date' },
      ],
      'repayment-analysis': [
        { key: 'transactionReference', label: 'Transaction Reference' },
        { key: 'loanId', label: 'Loan ID' },
        { key: 'repaymentDate', label: 'Repayment Date' },
        { key: 'totalAmountPaid', label: 'Total Amount Paid' },
        { key: 'principalAmount', label: 'Principal Amount' },
        { key: 'interestAmount', label: 'Interest Amount' },
        { key: 'paymentMethod', label: 'Payment Method' },
      ],
      'customer-performance': [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'emailAddress', label: 'Email' },
        { key: 'phoneNumber', label: 'Phone' },
        { key: 'kycVerificationStatus', label: 'KYC Status' },
        { key: 'creditScore', label: 'Credit Score' },
      ],
      'product-performance': [
        { key: 'productName', label: 'Product Name' },
        { key: 'productType', label: 'Type' },
        { key: 'interestRate', label: 'Interest Rate (%)' },
        { key: 'minLoanAmount', label: 'Min Amount' },
        { key: 'maxLoanAmount', label: 'Max Amount' },
        { key: 'loanTermMonths', label: 'Term (Months)' },
        { key: 'processingFee', label: 'Processing Fee' },
      ],
      'branch-performance': [
        { key: 'organizationName', label: 'Organization' },
        { key: 'organizationStatus', label: 'Status' },
        { key: 'subscriptionPlanType', label: 'Plan Type' },
        { key: 'creationDate', label: 'Creation Date' },
        { key: 'contactEmail', label: 'Contact Email' },
      ],
    };

    return columnMap[reportType] || [];
  };

  const renderReportContent = () => {
    if (loading) {
      return <div className="text-center py-8">Loading report data...</div>;
    }

    if (filteredData.length === 0) {
      return <div className="text-center py-8 text-gray-500">No data available for this report</div>;
    }

    const columns = getColumnsForReport(activeReport);

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              {columns.map(col => (
                <TableHead key={col.key} className="font-semibold">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, idx) => (
              <TableRow key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {columns.map(col => (
                  <TableCell key={`${item.id}-${col.key}`} className="text-sm">
                    {formatCellValue(item[col.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Comprehensive Reports</h1>
          <p className="text-slate-600">Access detailed financial and operational reports with advanced filtering and export options</p>
        </div>

        {/* Filters Card */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="branch" className="text-sm font-medium mb-2 block">Branch</Label>
                <Select value={filters.branch} onValueChange={(value) => setFilters({ ...filters, branch: value })}>
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    <SelectItem value="branch1">Branch 1</SelectItem>
                    <SelectItem value="branch2">Branch 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="product" className="text-sm font-medium mb-2 block">Product</Label>
                <Select value={filters.product} onValueChange={(value) => setFilters({ ...filters, product: value })}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="product1">Product 1</SelectItem>
                    <SelectItem value="product2">Product 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status" className="text-sm font-medium mb-2 block">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Card className="border-slate-200">
          <Tabs value={activeReport} onValueChange={(value) => {
            setActiveReport(value);
            if (['portfolio-summary', 'repayment-analysis', 'customer-performance', 'product-performance', 'branch-performance'].includes(value)) {
              fetchReportData(value);
            }
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 gap-1 p-4 bg-slate-100 rounded-lg">
              <TabsTrigger value="portfolio-summary" className="text-xs lg:text-sm">Portfolio</TabsTrigger>
              <TabsTrigger value="repayment-analysis" className="text-xs lg:text-sm">Repayment</TabsTrigger>
              <TabsTrigger value="customer-performance" className="text-xs lg:text-sm">Customers</TabsTrigger>
              <TabsTrigger value="product-performance" className="text-xs lg:text-sm">Products</TabsTrigger>
              <TabsTrigger value="branch-performance" className="text-xs lg:text-sm">Branch</TabsTrigger>
            </TabsList>

            {/* Basic Reports with Export */}
            <div className="p-6">
              {['portfolio-summary', 'repayment-analysis', 'customer-performance', 'product-performance', 'branch-performance'].includes(activeReport) && (
                <div className="mb-6">
                  <div className="flex gap-3 mb-6">
                    <Button
                      onClick={() => handleExport('csv')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => handleExport('excel')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export Excel
                    </Button>
                    <Button
                      onClick={() => handleExport('pdf')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print / PDF
                    </Button>
                  </div>
                  {renderReportContent()}
                </div>
              )}
            </div>

            <TabsContent value="portfolio-summary" className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Loan Portfolio Summary Report</h3>
                <p className="text-sm text-slate-600">Overview of all loans in the portfolio with key metrics</p>
              </div>
            </TabsContent>

            <TabsContent value="repayment-analysis" className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Repayment Analysis Report</h3>
                <p className="text-sm text-slate-600">Detailed analysis of repayment transactions and patterns</p>
              </div>
            </TabsContent>

            <TabsContent value="customer-performance" className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Customer Performance Report</h3>
                <p className="text-sm text-slate-600">Customer profiles and performance metrics</p>
              </div>
            </TabsContent>

            <TabsContent value="product-performance" className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Product Performance Report</h3>
                <p className="text-sm text-slate-600">Analysis of loan products and their performance</p>
              </div>
            </TabsContent>

            <TabsContent value="branch-performance" className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Branch Performance Report</h3>
                <p className="text-sm text-slate-600">Performance metrics for each branch/organization</p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Specialized Reports */}
          <div className="border-t border-slate-200">
            <Tabs defaultValue="delinquency" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 gap-1 p-4 bg-slate-100 rounded-lg">
                <TabsTrigger value="delinquency" className="text-xs lg:text-sm">Delinquency</TabsTrigger>
                <TabsTrigger value="interest" className="text-xs lg:text-sm">Interest</TabsTrigger>
                <TabsTrigger value="writeoff" className="text-xs lg:text-sm">Write-Off</TabsTrigger>
                <TabsTrigger value="ifrs9" className="text-xs lg:text-sm">IFRS9</TabsTrigger>
                <TabsTrigger value="ecl" className="text-xs lg:text-sm">ECL</TabsTrigger>
              </TabsList>

              <TabsContent value="delinquency" className="p-6">
                <DelinquencyAgingReport />
              </TabsContent>

              <TabsContent value="interest" className="p-6">
                <InterestIncomeReport />
              </TabsContent>

              <TabsContent value="writeoff" className="p-6">
                <WriteOffSummaryReport />
              </TabsContent>

              <TabsContent value="ifrs9" className="p-6">
                <IFRS9StagingReport />
              </TabsContent>

              <TabsContent value="ecl" className="p-6">
                <ECLAnalysisReport />
              </TabsContent>
            </Tabs>

            <Tabs defaultValue="compliance" className="w-full">
              <TabsList className="grid w-full grid-cols-3 gap-1 p-4 bg-slate-100 rounded-lg">
                <TabsTrigger value="compliance" className="text-xs lg:text-sm">Compliance</TabsTrigger>
                <TabsTrigger value="audit" className="text-xs lg:text-sm">Audit Trail</TabsTrigger>
                <TabsTrigger value="risk" className="text-xs lg:text-sm">Risk Assessment</TabsTrigger>
              </TabsList>

              <TabsContent value="compliance" className="p-6">
                <ComplianceSummaryReport />
              </TabsContent>

              <TabsContent value="audit" className="p-6">
                <AuditTrailReport />
              </TabsContent>

              <TabsContent value="risk" className="p-6">
                <RiskAssessmentReport />
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{filteredData.length}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Report Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-900">{new Date().toLocaleDateString()}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Data Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-900">CMS Database</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Export Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-900">CSV, Excel, PDF</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
