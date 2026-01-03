import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { ReportExportService } from '@/services/ReportExportService';
import { BaseCrudService } from '@/integrations';
import { Loans, CustomerProfiles } from '@/entities';

interface RiskData {
  loanNumber: string;
  customerName: string;
  principalAmount: number;
  outstandingBalance: number;
  creditScore: number;
  loanStatus: string;
  riskScore: number;
  riskCategory: string;
  recommendedAction: string;
}

export default function RiskAssessmentReport() {
  const [data, setData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      const loans = await BaseCrudService.getAll<Loans>('loans');
      const customers = await BaseCrudService.getAll<CustomerProfiles>('customers');

      // Create a map of customers
      const customerMap = new Map();
      customers.items.forEach(cust => {
        customerMap.set(cust._id, cust);
      });

      // Map loans to risk data
      const riskData = loans.items.map(loan => {
        const customer = customerMap.get(loan.customerId);
        const riskScore = calculateRiskScore(loan, customer);
        
        return {
          loanNumber: loan.loanNumber || '',
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'N/A',
          principalAmount: loan.principalAmount || 0,
          outstandingBalance: loan.outstandingBalance || 0,
          creditScore: customer?.creditScore || 0,
          loanStatus: loan.loanStatus || 'Unknown',
          riskScore,
          riskCategory: getRiskCategory(riskScore),
          recommendedAction: getRecommendedAction(riskScore),
        };
      });

      setData(riskData);
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskScore = (loan: any, customer: any): number => {
    let score = 0;

    // Credit score impact (0-30 points)
    const creditScore = customer?.creditScore || 0;
    if (creditScore >= 750) score += 5;
    else if (creditScore >= 650) score += 15;
    else if (creditScore >= 550) score += 25;
    else score += 30;

    // Loan status impact (0-40 points)
    if (loan.loanStatus === 'active' || loan.loanStatus === 'current') score += 0;
    else if (loan.loanStatus === 'overdue' || loan.loanStatus === 'delinquent') score += 25;
    else if (loan.loanStatus === 'default') score += 35;
    else if (loan.loanStatus === 'written-off') score += 40;

    // Outstanding balance ratio (0-30 points)
    const balanceRatio = (loan.outstandingBalance || 0) / (loan.principalAmount || 1);
    if (balanceRatio > 0.8) score += 25;
    else if (balanceRatio > 0.5) score += 15;
    else if (balanceRatio > 0.2) score += 5;

    return Math.min(100, score);
  };

  const getRiskCategory = (score: number): string => {
    if (score <= 20) return 'Low';
    if (score <= 50) return 'Medium';
    if (score <= 75) return 'High';
    return 'Critical';
  };

  const getRecommendedAction = (score: number): string => {
    if (score <= 20) return 'Monitor';
    if (score <= 50) return 'Review';
    if (score <= 75) return 'Escalate';
    return 'Immediate Action';
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = [
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'principalAmount', label: 'Principal Amount' },
      { key: 'outstandingBalance', label: 'Outstanding Balance' },
      { key: 'creditScore', label: 'Credit Score' },
      { key: 'loanStatus', label: 'Loan Status' },
      { key: 'riskScore', label: 'Risk Score' },
      { key: 'riskCategory', label: 'Risk Category' },
      { key: 'recommendedAction', label: 'Recommended Action' },
    ];

    const options = {
      filename: 'risk_assessment_report',
      title: 'Risk Assessment Report',
      data: data.map(item => ({
        ...item,
        principalAmount: item.principalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        outstandingBalance: item.outstandingBalance.toLocaleString('en-US', { maximumFractionDigits: 2 }),
      })),
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

  if (loading) {
    return <div className="text-center py-8">Loading risk assessment data...</div>;
  }

  const riskBreakdown = {
    low: data.filter(d => d.riskCategory === 'Low').length,
    medium: data.filter(d => d.riskCategory === 'Medium').length,
    high: data.filter(d => d.riskCategory === 'High').length,
    critical: data.filter(d => d.riskCategory === 'Critical').length,
  };

  const avgRiskScore = data.length > 0 
    ? (data.reduce((sum, item) => sum + item.riskScore, 0) / data.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Button onClick={() => handleExport('csv')} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          CSV
        </Button>
        <Button onClick={() => handleExport('excel')} variant="outline" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Excel
        </Button>
        <Button onClick={() => handleExport('pdf')} variant="outline" className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{avgRiskScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{riskBreakdown.low}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{riskBreakdown.medium}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{riskBreakdown.high}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Critical Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{riskBreakdown.critical}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Loan Number</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Principal Amount</TableHead>
                  <TableHead className="text-right">Outstanding Balance</TableHead>
                  <TableHead className="text-right">Credit Score</TableHead>
                  <TableHead>Loan Status</TableHead>
                  <TableHead className="text-right">Risk Score</TableHead>
                  <TableHead>Risk Category</TableHead>
                  <TableHead>Recommended Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="font-medium">{item.loanNumber}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell className="text-right">
                      {item.principalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.outstandingBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{item.creditScore}</TableCell>
                    <TableCell>{item.loanStatus}</TableCell>
                    <TableCell className="text-right font-medium">{item.riskScore}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.riskCategory === 'Low' ? 'bg-green-100 text-green-800' :
                        item.riskCategory === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        item.riskCategory === 'High' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.riskCategory}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{item.recommendedAction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
