import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { ReportExportService } from '@/services/ReportExportService';
import { BaseCrudService } from '@/integrations';
import { Loans, CustomerProfiles } from '@/entities';

interface ComplianceData {
  loanNumber: string;
  customerName: string;
  kycStatus: string;
  loanStatus: string;
  complianceScore: number;
  lastReviewDate: string;
  riskRating: string;
}

export default function ComplianceSummaryReport() {
  const [data, setData] = useState<ComplianceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const loans = await BaseCrudService.getAll<Loans>('loans');
      const customers = await BaseCrudService.getAll<CustomerProfiles>('customers');

      // Create a map of customers
      const customerMap = new Map();
      customers.items.forEach(cust => {
        customerMap.set(cust._id, cust);
      });

      // Map loans to compliance data
      const complianceData = loans.items.map(loan => {
        const customer = customerMap.get(loan.customerId);
        const complianceScore = calculateComplianceScore(loan, customer);
        
        return {
          loanNumber: loan.loanNumber || '',
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'N/A',
          kycStatus: customer?.kycVerificationStatus || 'Pending',
          loanStatus: loan.loanStatus || 'Unknown',
          complianceScore,
          lastReviewDate: loan._updatedDate ? new Date(loan._updatedDate).toLocaleDateString() : 'N/A',
          riskRating: complianceScore >= 80 ? 'Low' : complianceScore >= 60 ? 'Medium' : 'High',
        };
      });

      setData(complianceData);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateComplianceScore = (loan: any, customer: any): number => {
    let score = 100;

    // Deduct for KYC status
    if (!customer?.kycVerificationStatus || customer.kycVerificationStatus !== 'Verified') {
      score -= 20;
    }

    // Deduct for loan status
    if (loan.loanStatus === 'overdue' || loan.loanStatus === 'delinquent') {
      score -= 30;
    } else if (loan.loanStatus === 'default' || loan.loanStatus === 'written-off') {
      score -= 50;
    }

    // Deduct for missing documents
    if (!customer?.idDocumentImage) {
      score -= 10;
    }

    return Math.max(0, score);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = [
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'kycStatus', label: 'KYC Status' },
      { key: 'loanStatus', label: 'Loan Status' },
      { key: 'complianceScore', label: 'Compliance Score' },
      { key: 'lastReviewDate', label: 'Last Review Date' },
      { key: 'riskRating', label: 'Risk Rating' },
    ];

    const options = {
      filename: 'compliance_summary_report',
      title: 'Compliance Summary Report',
      data,
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
    return <div className="text-center py-8">Loading compliance data...</div>;
  }

  const avgComplianceScore = data.length > 0 
    ? (data.reduce((sum, item) => sum + item.complianceScore, 0) / data.length).toFixed(2)
    : '0.00';

  const riskBreakdown = {
    low: data.filter(d => d.riskRating === 'Low').length,
    medium: data.filter(d => d.riskRating === 'Medium').length,
    high: data.filter(d => d.riskRating === 'High').length,
  };

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{avgComplianceScore}</div>
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
            <div className="text-2xl font-bold text-red-600">{riskBreakdown.high}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Loan Number</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Loan Status</TableHead>
                  <TableHead className="text-right">Compliance Score</TableHead>
                  <TableHead>Last Review Date</TableHead>
                  <TableHead>Risk Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="font-medium">{item.loanNumber}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.kycStatus === 'Verified' ? 'bg-green-100 text-green-800' :
                        item.kycStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.kycStatus}
                      </span>
                    </TableCell>
                    <TableCell>{item.loanStatus}</TableCell>
                    <TableCell className="text-right font-medium">{item.complianceScore}</TableCell>
                    <TableCell>{item.lastReviewDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.riskRating === 'Low' ? 'bg-green-100 text-green-800' :
                        item.riskRating === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.riskRating}
                      </span>
                    </TableCell>
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
