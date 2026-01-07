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
import { ECLResults, Loans } from '@/entities';

interface ECLData {
  loanReference: string;
  loanNumber: string;
  principalAmount: number;
  eclValue: number;
  ifrs9Stage: string;
  effectiveDate: string;
  calculationTimestamp: string;
}

export default function ECLAnalysisReport() {
  const [data, setData] = useState<ECLData[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganisation } = useOrganisationStore();
  const { isDemoMode } = useDemoMode(currentOrganisation?._id);

  useEffect(() => {
    fetchECLData();
  }, []);

  const fetchECLData = async () => {
    try {
      const eclResults = await BaseCrudService.getAll<ECLResults>('eclresults');
      const loans = await BaseCrudService.getAll<Loans>('loans');

      // Create a map of loans
      const loanMap = new Map();
      loans.items.forEach(loan => {
        loanMap.set(loan._id, loan);
      });

      // Map ECL results with loan data
      const eclData = eclResults.items.map(ecl => {
        const loan = loanMap.get(ecl.loanReference);
        return {
          loanReference: ecl.loanReference || '',
          loanNumber: loan?.loanNumber || 'N/A',
          principalAmount: loan?.principalAmount || 0,
          eclValue: ecl.eclValue || 0,
          ifrs9Stage: ecl.ifrs9Stage || 'Stage 1',
          effectiveDate: ecl.effectiveDate ? new Date(ecl.effectiveDate).toLocaleDateString() : 'N/A',
          calculationTimestamp: ecl.calculationTimestamp ? new Date(ecl.calculationTimestamp).toLocaleString() : 'N/A',
        };
      });

      setData(eclData);
    } catch (error) {
      console.error('Error fetching ECL data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = [
      { key: 'loanReference', label: 'Loan Reference' },
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'principalAmount', label: 'Principal Amount' },
      { key: 'eclValue', label: 'ECL Value' },
      { key: 'ifrs9Stage', label: 'IFRS 9 Stage' },
      { key: 'effectiveDate', label: 'Effective Date' },
      { key: 'calculationTimestamp', label: 'Calculation Timestamp' },
    ];

    const options = {
      filename: 'ecl_analysis_report',
      title: 'ECL Analysis Report',
      data: data.map(item => ({
        ...item,
        principalAmount: item.principalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        eclValue: item.eclValue.toLocaleString('en-US', { maximumFractionDigits: 2 }),
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
    return <div className="text-center py-8">Loading ECL data...</div>;
  }

  const totalECL = data.reduce((sum, item) => sum + item.eclValue, 0);
  const totalPrincipal = data.reduce((sum, item) => sum + item.principalAmount, 0);
  const eclPercentage = totalPrincipal > 0 ? (totalECL / totalPrincipal) * 100 : 0;

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalPrincipal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total ECL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalECL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">ECL as % of Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{eclPercentage.toFixed(2)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Number of Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ECL Calculation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Loan Reference</TableHead>
                  <TableHead>Loan Number</TableHead>
                  <TableHead className="text-right">Principal Amount</TableHead>
                  <TableHead className="text-right">ECL Value</TableHead>
                  <TableHead>IFRS 9 Stage</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Calculation Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="font-medium">{item.loanReference}</TableCell>
                    <TableCell>{item.loanNumber}</TableCell>
                    <TableCell className="text-right">
                      {item.principalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.eclValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.ifrs9Stage === 'Stage 1' ? 'bg-green-100 text-green-800' :
                        item.ifrs9Stage === 'Stage 2' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.ifrs9Stage}
                      </span>
                    </TableCell>
                    <TableCell>{item.effectiveDate}</TableCell>
                    <TableCell className="text-sm">{item.calculationTimestamp}</TableCell>
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
