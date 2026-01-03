import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { ReportExportService } from '@/services/ReportExportService';
import { BaseCrudService } from '@/integrations';
import { Loans, Repayments } from '@/entities';

interface InterestIncomeData {
  month: string;
  projectedIncome: number;
  actualIncome: number;
  variance: number;
  variancePercentage: number;
}

export default function InterestIncomeReport() {
  const [data, setData] = useState<InterestIncomeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterestIncomeData();
  }, []);

  const fetchInterestIncomeData = async () => {
    try {
      const loans = await BaseCrudService.getAll<Loans>('loans');
      const repayments = await BaseCrudService.getAll<Repayments>('repayments');

      // Group by month
      const monthlyData: Record<string, InterestIncomeData> = {};

      // Calculate projected interest income
      loans.items.forEach(loan => {
        if (loan.disbursementDate) {
          const date = new Date(loan.disbursementDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              projectedIncome: 0,
              actualIncome: 0,
              variance: 0,
              variancePercentage: 0,
            };
          }

          // Calculate monthly projected interest
          const monthlyRate = (loan.interestRate || 0) / 12 / 100;
          const monthlyInterest = (loan.principalAmount || 0) * monthlyRate;
          monthlyData[monthKey].projectedIncome += monthlyInterest;
        }
      });

      // Calculate actual interest income from repayments
      repayments.items.forEach(rep => {
        if (rep.repaymentDate) {
          const date = new Date(rep.repaymentDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              projectedIncome: 0,
              actualIncome: 0,
              variance: 0,
              variancePercentage: 0,
            };
          }

          monthlyData[monthKey].actualIncome += rep.interestAmount || 0;
        }
      });

      // Calculate variance
      Object.keys(monthlyData).forEach(key => {
        const item = monthlyData[key];
        item.variance = item.actualIncome - item.projectedIncome;
        item.variancePercentage = item.projectedIncome > 0 
          ? (item.variance / item.projectedIncome) * 100 
          : 0;
      });

      setData(Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)));
    } catch (error) {
      console.error('Error fetching interest income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = [
      { key: 'month', label: 'Month' },
      { key: 'projectedIncome', label: 'Projected Income' },
      { key: 'actualIncome', label: 'Actual Income' },
      { key: 'variance', label: 'Variance' },
      { key: 'variancePercentage', label: 'Variance (%)' },
    ];

    const options = {
      filename: 'interest_income_report',
      title: 'Interest Income Report',
      data: data.map(item => ({
        ...item,
        projectedIncome: item.projectedIncome.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        actualIncome: item.actualIncome.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        variance: item.variance.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        variancePercentage: item.variancePercentage.toFixed(2),
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
    return <div className="text-center py-8">Loading interest income data...</div>;
  }

  const totalProjected = data.reduce((sum, item) => sum + item.projectedIncome, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actualIncome, 0);
  const totalVariance = totalActual - totalProjected;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Projected Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalProjected.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Actual Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalActual.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalVariance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Interest Income Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Projected Income</TableHead>
                  <TableHead className="text-right">Actual Income</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Variance (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="font-medium">{item.month}</TableCell>
                    <TableCell className="text-right">
                      {item.projectedIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.actualIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right ${item.variancePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.variancePercentage.toFixed(2)}%
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
