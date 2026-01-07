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
import { Loans, BoZProvisions } from '@/entities';

interface IFRS9Data {
  loanNumber: string;
  customerId: string;
  principalAmount: number;
  stage: string;
  classification: string;
  riskLevel: string;
  provisionAmount: number;
  provisionPercentage: number;
}

export default function IFRS9StagingReport() {
  const [data, setData] = useState<IFRS9Data[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganisation } = useOrganisationStore();
  const { isDemoMode } = useDemoMode(currentOrganisation?._id);

  useEffect(() => {
    fetchIFRS9Data();
  }, []);

  const fetchIFRS9Data = async () => {
    try {
      const loans = await BaseCrudService.getAll<Loans>('loans');
      const provisions = await BaseCrudService.getAll<BoZProvisions>('bozprovisions');

      // Create a map of loan provisions
      const provisionMap = new Map();
      provisions.items.forEach(prov => {
        provisionMap.set(prov.loanId, prov);
      });

      // Map loans to IFRS9 data
      const ifrs9Data = loans.items.map(loan => {
        const provision = provisionMap.get(loan._id);
        const stage = determineStage(loan.loanStatus);
        
        return {
          loanNumber: loan.loanNumber || '',
          customerId: loan.customerId || '',
          principalAmount: loan.principalAmount || 0,
          stage,
          classification: provision?.ifrs9StageClassification || 'Stage 1',
          riskLevel: determineRiskLevel(loan.loanStatus),
          provisionAmount: provision?.provisionAmount || 0,
          provisionPercentage: provision?.provisionPercentage || 0,
        };
      });

      setData(ifrs9Data);
    } catch (error) {
      console.error('Error fetching IFRS9 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineStage = (status?: string): string => {
    if (!status) return 'Stage 1';
    if (status === 'active' || status === 'current') return 'Stage 1';
    if (status === 'overdue' || status === 'delinquent') return 'Stage 2';
    if (status === 'default' || status === 'written-off') return 'Stage 3';
    return 'Stage 1';
  };

  const determineRiskLevel = (status?: string): string => {
    if (!status) return 'Low';
    if (status === 'active' || status === 'current') return 'Low';
    if (status === 'overdue' || status === 'delinquent') return 'Medium';
    if (status === 'default' || status === 'written-off') return 'High';
    return 'Low';
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = [
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'customerId', label: 'Customer ID' },
      { key: 'principalAmount', label: 'Principal Amount' },
      { key: 'stage', label: 'IFRS 9 Stage' },
      { key: 'classification', label: 'Classification' },
      { key: 'riskLevel', label: 'Risk Level' },
      { key: 'provisionAmount', label: 'Provision Amount' },
      { key: 'provisionPercentage', label: 'Provision %' },
    ];

    const options = {
      filename: 'ifrs9_staging_report',
      title: 'IFRS 9 Staging Report',
      data: data.map(item => ({
        ...item,
        principalAmount: item.principalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        provisionAmount: item.provisionAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        provisionPercentage: item.provisionPercentage.toFixed(2),
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
    return <div className="text-center py-8">Loading IFRS 9 data...</div>;
  }

  const stageBreakdown = {
    stage1: data.filter(d => d.stage === 'Stage 1').length,
    stage2: data.filter(d => d.stage === 'Stage 2').length,
    stage3: data.filter(d => d.stage === 'Stage 3').length,
  };

  const totalProvision = data.reduce((sum, item) => sum + item.provisionAmount, 0);

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
            <CardTitle className="text-sm font-medium text-slate-600">Stage 1 Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stageBreakdown.stage1}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Stage 2 Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stageBreakdown.stage2}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Stage 3 Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stageBreakdown.stage3}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Provision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalProvision.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>IFRS 9 Staging Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Loan Number</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead className="text-right">Principal Amount</TableHead>
                  <TableHead>IFRS 9 Stage</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead className="text-right">Provision Amount</TableHead>
                  <TableHead className="text-right">Provision %</TableHead>
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
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.stage === 'Stage 1' ? 'bg-green-100 text-green-800' :
                        item.stage === 'Stage 2' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.stage}
                      </span>
                    </TableCell>
                    <TableCell>{item.classification}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                        item.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.provisionAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{item.provisionPercentage.toFixed(2)}%</TableCell>
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
