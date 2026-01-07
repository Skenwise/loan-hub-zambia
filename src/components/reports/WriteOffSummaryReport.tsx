import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import ReportWatermark from '@/components/ReportWatermark';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useOrganisationStore } from '@/store/organisationStore';
import { ReportExportService } from '@/services/ReportExportService';
import { BaseCrudService } from '@/integrations';
import { Loans } from '@/entities';

interface WriteOffData {
  loanNumber: string;
  customerId: string;
  principalAmount: number;
  outstandingBalance: number;
  writeOffAmount: number;
  writeOffDate: string;
  reason: string;
}

export default function WriteOffSummaryReport() {
  const [data, setData] = useState<WriteOffData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganisation } = useOrganisationStore();
  const { isDemoMode } = useDemoMode(currentOrganisation?._id);

  useEffect(() => {
    fetchWriteOffData();
  }, []);

  const fetchWriteOffData = async () => {
    try {
      const loans = await BaseCrudService.getAll<Loans>('loans');
      
      // Filter write-off loans
      const writeOffLoans = loans.items
        .filter(loan => loan.loanStatus === 'written-off' || loan.loanStatus === 'write-off')
        .map(loan => ({
          loanNumber: loan.loanNumber || '',
          customerId: loan.customerId || '',
          principalAmount: loan.principalAmount || 0,
          outstandingBalance: loan.outstandingBalance || 0,
          writeOffAmount: loan.outstandingBalance || 0,
          writeOffDate: loan.closureDate ? new Date(loan.closureDate).toLocaleDateString() : 'N/A',
          reason: 'Loan Default',
        }));

      setData(writeOffLoans);
    } catch (error) {
      console.error('Error fetching write-off data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = [
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'customerId', label: 'Customer ID' },
      { key: 'principalAmount', label: 'Principal Amount' },
      { key: 'outstandingBalance', label: 'Outstanding Balance' },
      { key: 'writeOffAmount', label: 'Write-Off Amount' },
      { key: 'writeOffDate', label: 'Write-Off Date' },
      { key: 'reason', label: 'Reason' },
    ];

    const options = {
      filename: 'writeoff_summary_report',
      title: 'Write-Off Summary Report',
      data: data.map(item => ({
        ...item,
        principalAmount: item.principalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        outstandingBalance: item.outstandingBalance.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        writeOffAmount: item.writeOffAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }),
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
    return <div className="text-center py-8">Loading write-off data...</div>;
  }

  const totalWriteOff = data.reduce((sum, item) => sum + item.writeOffAmount, 0);

  return (
    <div className="space-y-6 relative">
      <ReportWatermark isDemoMode={isDemoMode} position="diagonal" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Write-Offs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalWriteOff.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Number of Write-Offs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Average Write-Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {data.length > 0 
                ? (totalWriteOff / data.length).toLocaleString('en-US', { maximumFractionDigits: 2 })
                : '0.00'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Write-Off Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Loan Number</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead className="text-right">Principal Amount</TableHead>
                  <TableHead className="text-right">Outstanding Balance</TableHead>
                  <TableHead className="text-right">Write-Off Amount</TableHead>
                  <TableHead>Write-Off Date</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="font-medium">{item.loanNumber}</TableCell>
                    <TableCell>{item.customerId}</TableCell>
                    <TableCell className="text-right">
                      {item.principalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.outstandingBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {item.writeOffAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{item.writeOffDate}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <ReportWatermark isDemoMode={isDemoMode} position="centered" />
    </div>
  );
}
