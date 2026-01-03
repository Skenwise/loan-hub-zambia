import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { ReportExportService } from '@/services/ReportExportService';
import { BaseCrudService } from '@/integrations';
import { AuditTrail } from '@/entities';

interface AuditData {
  timestamp: string;
  performedBy: string;
  actionType: string;
  resourceAffected: string;
  resourceId: string;
  actionDetails: string;
}

export default function AuditTrailReport() {
  const [data, setData] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      const auditTrail = await BaseCrudService.getAll<AuditTrail>('audittrail');
      
      const auditData = auditTrail.items
        .map(audit => ({
          timestamp: audit.timestamp ? new Date(audit.timestamp).toLocaleString() : 'N/A',
          performedBy: audit.performedBy || 'System',
          actionType: audit.actionType || 'Unknown',
          resourceAffected: audit.resourceAffected || 'N/A',
          resourceId: audit.resourceId || 'N/A',
          actionDetails: audit.actionDetails || 'No details',
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setData(auditData);
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'performedBy', label: 'Performed By' },
      { key: 'actionType', label: 'Action Type' },
      { key: 'resourceAffected', label: 'Resource Affected' },
      { key: 'resourceId', label: 'Resource ID' },
      { key: 'actionDetails', label: 'Action Details' },
    ];

    const options = {
      filename: 'audit_trail_report',
      title: 'Audit Trail Report',
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
    return <div className="text-center py-8">Loading audit trail data...</div>;
  }

  const actionTypeBreakdown = data.reduce((acc, item) => {
    acc[item.actionType] = (acc[item.actionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
            <CardTitle className="text-sm font-medium text-slate-600">Total Audit Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Set(data.map(d => d.performedBy)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Action Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{Object.keys(actionTypeBreakdown).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Resource Affected</TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead>Action Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <TableCell className="text-sm">{item.timestamp}</TableCell>
                    <TableCell className="font-medium">{item.performedBy}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {item.actionType}
                      </span>
                    </TableCell>
                    <TableCell>{item.resourceAffected}</TableCell>
                    <TableCell className="text-sm">{item.resourceId}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{item.actionDetails}</TableCell>
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
