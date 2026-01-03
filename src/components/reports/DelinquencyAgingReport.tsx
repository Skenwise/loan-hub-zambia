import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { ReportExportService } from '@/services/ReportExportService';
import { BaseCrudService } from '@/integrations';
import { Loans } from '@/entities';

interface DelinquencyBucket {
  bucket: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export default function DelinquencyAgingReport() {
  const [data, setData] = useState<DelinquencyBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDelinquencyData();
  }, []);

  const fetchDelinquencyData = async () => {
    try {
      const loans = await BaseCrudService.getAll<Loans>('loans');
      
      // Calculate delinquency buckets
      const today = new Date();
      const buckets: Record<string, DelinquencyBucket> = {
        '0-30': { bucket: '0-30 Days', count: 0, totalAmount: 0, percentage: 0 },
        '31-60': { bucket: '31-60 Days', count: 0, totalAmount: 0, percentage: 0 },
        '61-90': { bucket: '61-90 Days', count: 0, totalAmount: 0, percentage: 0 },
        '91-180': { bucket: '91-180 Days', count: 0, totalAmount: 0, percentage: 0 },
        '180+': { bucket: '180+ Days', count: 0, totalAmount: 0, percentage: 0 },
      };

      let totalDelinquent = 0;

      loans.items.forEach(loan => {
        if (loan.loanStatus === 'overdue' || loan.loanStatus === 'delinquent') {
          const nextPaymentDate = new Date(loan.nextPaymentDate || '');
          const daysOverdue = Math.floor((today.getTime() - nextPaymentDate.getTime()) / (1000 * 60 * 60 * 24));

          let bucket = '0-30';
          if (daysOverdue > 180) bucket = '180+';
          else if (daysOverdue > 90) bucket = '91-180';
          else if (daysOverdue > 60) bucket = '61-90';
          else if (daysOverdue > 30) bucket = '31-60';

          buckets[bucket].count += 1;
          buckets[bucket].totalAmount += loan.outstandingBalance || 0;
          totalDelinquent += loan.outstandingBalance || 0;
        }
      });

      // Calculate percentages
      Object.keys(buckets).forEach(key => {
        if (totalDelinquent > 0) {
          buckets[key].percentage = (buckets[key].totalAmount / totalDelinquent) * 100;
        }
      });

      setData(Object.values(buckets));
    } catch (error) {
      console.error('Error fetching delinquency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = [
      { key: 'bucket', label: 'Aging Bucket' },
      { key: 'count', label: 'Number of Loans' },
      { key: 'totalAmount', label: 'Total Outstanding Amount' },
      { key: 'percentage', label: 'Percentage (%)' },
    ];

    const options = {
      filename: 'delinquency_aging_report',
      title: 'Delinquency Aging Report',
      data: data.map(item => ({
        ...item,
        totalAmount: item.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        percentage: item.percentage.toFixed(2),
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
    return <div className="text-center py-8">Loading delinquency data...</div>;
  }

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

      <Card>
        <CardHeader>
          <CardTitle>Delinquency Aging Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Aging Bucket</TableHead>
                  <TableHead className="text-right">Number of Loans</TableHead>
                  <TableHead className="text-right">Total Outstanding Amount</TableHead>
                  <TableHead className="text-right">Percentage (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="font-medium">{item.bucket}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">
                      {item.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
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
