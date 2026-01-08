import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Trash2, RefreshCw, Download, Clock, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataCleanupService } from '@/services/DataCleanupService';

interface DataSummary {
  timestamp: string;
  counts: {
    customers: number;
    loans: number;
    repayments: number;
    kycDocumentSubmissions: number;
    kycStatusTracking: number;
    kycVerificationHistory: number;
    loanDocuments: number;
    loanWorkflowHistory: number;
    eclResults: number;
    bozProvisions: number;
    auditTrail: number;
    customerAccounts: number;
  };
  errors: string[];
}

interface CleanupReport {
  timestamp: string;
  status: 'in_progress' | 'completed' | 'failed';
  deletedCounts: {
    customers: number;
    loans: number;
    repayments: number;
    kycDocumentSubmissions: number;
    kycStatusTracking: number;
    kycVerificationHistory: number;
    loanDocuments: number;
    loanWorkflowHistory: number;
    eclResults: number;
    bozProvisions: number;
    auditTrail: number;
    customerAccounts: number;
  };
  errors: string[];
}

interface ScheduledCleanup {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dataType: 'all' | 'customer' | 'transaction' | 'kyc' | 'audit';
  enabled: boolean;
  createdAt: string;
  lastRun: string | null;
  nextRun: string;
}

export default function SystemResetPage() {
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [cleanupReport, setCleanupReport] = useState<CleanupReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataType, setSelectedDataType] = useState<'all' | 'customer' | 'transaction' | 'kyc' | 'audit'>('all');
  const [scheduledCleanups, setScheduledCleanups] = useState<ScheduledCleanup[]>([]);
  const [newScheduleFrequency, setNewScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [newScheduleDataType, setNewScheduleDataType] = useState<'all' | 'customer' | 'transaction' | 'kyc' | 'audit'>('all');

  // Load data summary on mount
  useEffect(() => {
    loadDataSummary();
    loadScheduledCleanups();
  }, []);

  const loadDataSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await DataCleanupService.getDataSummary();
      setDataSummary(summary);
    } catch (err) {
      setError(`Failed to load data summary: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScheduledCleanups = () => {
    try {
      const schedules = DataCleanupService.getScheduledCleanups();
      setScheduledCleanups(schedules);
    } catch (err) {
      console.error('Failed to load scheduled cleanups:', err);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const result = await DataCleanupService.exportDataAsJSON(selectedDataType);
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `system-reset-export-${selectedDataType}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError(`Export failed: ${result.error}`);
      }
    } catch (err) {
      setError(`Export error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCleanupData = async () => {
    if (!confirmDelete) return;

    setIsCleaning(true);
    setError(null);
    try {
      let report;
      if (selectedDataType === 'all') {
        report = await DataCleanupService.cleanupAllCustomerData();
      } else {
        report = await DataCleanupService.cleanupByType(selectedDataType);
      }
      setCleanupReport(report as CleanupReport);
      setConfirmDelete(false);
      // Reload summary after cleanup
      setTimeout(() => loadDataSummary(), 1000);
    } catch (err) {
      setError(`Cleanup failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleAddSchedule = () => {
    const result = DataCleanupService.scheduleCleanup(newScheduleFrequency, newScheduleDataType);
    if (result.success) {
      loadScheduledCleanups();
      setError(null);
    } else {
      setError(`Failed to create schedule: ${result.error}`);
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const result = DataCleanupService.deleteSchedule(scheduleId);
    if (result.success) {
      loadScheduledCleanups();
    } else {
      setError(`Failed to delete schedule: ${result.error}`);
    }
  };

  const handleToggleSchedule = (scheduleId: string, enabled: boolean) => {
    const result = DataCleanupService.updateSchedule(scheduleId, { enabled: !enabled });
    if (result.success) {
      loadScheduledCleanups();
    } else {
      setError(`Failed to update schedule: ${result.error}`);
    }
  };

  const getTotalRecords = () => {
    if (!dataSummary) return 0;
    return Object.values(dataSummary.counts).reduce((sum, count) => sum + count, 0);
  };

  const getTotalDeleted = () => {
    if (!cleanupReport) return 0;
    return Object.values(cleanupReport.deletedCounts).reduce((sum, count) => sum + count, 0);
  };

  const getDataTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      all: 'All Data',
      customer: 'Customer Data',
      transaction: 'Transaction Data',
      kyc: 'KYC Data',
      audit: 'Audit Data',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">System Reset & Data Management</h1>
          <p className="text-slate-300">Manage, export, and clean up system data with scheduled automation</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview" className="text-slate-300">Overview</TabsTrigger>
            <TabsTrigger value="export" className="text-slate-300">Export Data</TabsTrigger>
            <TabsTrigger value="cleanup" className="text-slate-300">Cleanup</TabsTrigger>
            <TabsTrigger value="schedule" className="text-slate-300">Schedule</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <RefreshCw className="w-6 h-6" />
                    Current Data Summary
                  </h2>
                  <Button
                    onClick={loadDataSummary}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : dataSummary ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 rounded-lg p-4 border border-blue-500/30">
                        <p className="text-slate-400 text-sm">Total Records</p>
                        <p className="text-3xl font-bold text-blue-400">{getTotalRecords()}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 rounded-lg p-4 border border-purple-500/30">
                        <p className="text-slate-400 text-sm">Customers</p>
                        <p className="text-3xl font-bold text-purple-400">{dataSummary.counts.customers}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-600/20 to-green-400/10 rounded-lg p-4 border border-green-500/30">
                        <p className="text-slate-400 text-sm">Loans</p>
                        <p className="text-3xl font-bold text-green-400">{dataSummary.counts.loans}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-600/20 to-orange-400/10 rounded-lg p-4 border border-orange-500/30">
                        <p className="text-slate-400 text-sm">Repayments</p>
                        <p className="text-3xl font-bold text-orange-400">{dataSummary.counts.repayments}</p>
                      </div>
                      <div className="bg-gradient-to-br from-pink-600/20 to-pink-400/10 rounded-lg p-4 border border-pink-500/30">
                        <p className="text-slate-400 text-sm">KYC Submissions</p>
                        <p className="text-3xl font-bold text-pink-400">{dataSummary.counts.kycDocumentSubmissions}</p>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-400/10 rounded-lg p-4 border border-cyan-500/30">
                        <p className="text-slate-400 text-sm">Loan Documents</p>
                        <p className="text-3xl font-bold text-cyan-400">{dataSummary.counts.loanDocuments}</p>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-semibold text-slate-300 mb-3">Detailed Breakdown</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between text-slate-400">
                          <span>KYC Status Tracking:</span>
                          <span className="text-white font-medium">{dataSummary.counts.kycStatusTracking}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>KYC Verification History:</span>
                          <span className="text-white font-medium">{dataSummary.counts.kycVerificationHistory}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Loan Workflow History:</span>
                          <span className="text-white font-medium">{dataSummary.counts.loanWorkflowHistory}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>ECL Results:</span>
                          <span className="text-white font-medium">{dataSummary.counts.eclResults}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>BoZ Provisions:</span>
                          <span className="text-white font-medium">{dataSummary.counts.bozProvisions}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Audit Trail:</span>
                          <span className="text-white font-medium">{dataSummary.counts.auditTrail}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Customer Accounts:</span>
                          <span className="text-white font-medium">{dataSummary.counts.customerAccounts}</span>
                        </div>
                      </div>
                    </div>

                    {dataSummary.errors.length > 0 && (
                      <Alert className="border-yellow-600 bg-yellow-600/10">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-600">
                          {dataSummary.errors.join('; ')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : null}
              </div>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-6">
                  <Download className="w-6 h-6 text-blue-400" />
                  Export Data Before Deletion
                </h2>

                <Alert className="mb-6 border-blue-600 bg-blue-600/10">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-600">
                    Export your data as JSON before performing cleanup operations. This creates a backup you can store for compliance or archival purposes.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Data Type to Export</label>
                    <Select value={selectedDataType} onValueChange={(value: any) => setSelectedDataType(value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="all">All Data</SelectItem>
                        <SelectItem value="customer">Customer Data Only</SelectItem>
                        <SelectItem value="transaction">Transaction Data Only</SelectItem>
                        <SelectItem value="kyc">KYC Data Only</SelectItem>
                        <SelectItem value="audit">Audit Data Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleExportData}
                    disabled={isExporting || getTotalRecords() === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export {getDataTypeLabel(selectedDataType)} as JSON
                      </>
                    )}
                  </Button>

                  <div className="bg-slate-700/50 rounded-lg p-4 mt-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Export Includes:</h3>
                    <ul className="space-y-2 text-sm text-slate-400">
                      {selectedDataType === 'all' || selectedDataType === 'customer' ? (
                        <>
                          <li>• Customer Profiles</li>
                          <li>• Customer Accounts</li>
                        </>
                      ) : null}
                      {selectedDataType === 'all' || selectedDataType === 'transaction' ? (
                        <>
                          <li>• Loans & Loan History</li>
                          <li>• Repayments</li>
                          <li>• Loan Documents</li>
                          <li>• Loan Workflow History</li>
                        </>
                      ) : null}
                      {selectedDataType === 'all' || selectedDataType === 'kyc' ? (
                        <>
                          <li>• KYC Document Submissions</li>
                          <li>• KYC Status Tracking</li>
                          <li>• KYC Verification History</li>
                        </>
                      ) : null}
                      {selectedDataType === 'all' || selectedDataType === 'audit' ? (
                        <>
                          <li>• Audit Trail</li>
                          <li>• ECL Results</li>
                          <li>• BoZ Provisions</li>
                        </>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Cleanup Tab */}
          <TabsContent value="cleanup" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-6">
                  <Trash2 className="w-6 h-6 text-destructive" />
                  Clean Up Data
                </h2>

                <Alert className="mb-6 border-yellow-600 bg-yellow-600/10">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-600">
                    <strong>Warning:</strong> This action will permanently delete selected data. We recommend exporting data first. This cannot be undone.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Data Type to Delete</label>
                    <Select value={selectedDataType} onValueChange={(value: any) => setSelectedDataType(value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="all">All Customer Data</SelectItem>
                        <SelectItem value="customer">Customer Data Only</SelectItem>
                        <SelectItem value="transaction">Transaction Data Only</SelectItem>
                        <SelectItem value="kyc">KYC Data Only</SelectItem>
                        <SelectItem value="audit">Audit Data Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {cleanupReport && (
                  <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-start gap-3 mb-4">
                      {cleanupReport.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-semibold text-white mb-2">
                          Cleanup {cleanupReport.status === 'completed' ? 'Completed' : 'Failed'}
                        </h3>
                        <p className="text-slate-300 text-sm mb-3">
                          Total records deleted: <strong>{getTotalDeleted()}</strong>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between text-slate-400">
                            <span>Customers:</span>
                            <span className="text-white">{cleanupReport.deletedCounts.customers}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Loans:</span>
                            <span className="text-white">{cleanupReport.deletedCounts.loans}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Repayments:</span>
                            <span className="text-white">{cleanupReport.deletedCounts.repayments}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>KYC Submissions:</span>
                            <span className="text-white">{cleanupReport.deletedCounts.kycDocumentSubmissions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {cleanupReport.errors.length > 0 && (
                      <Alert className="border-red-600 bg-red-600/10 mt-4">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600 text-sm">
                          {cleanupReport.errors.join('; ')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {!confirmDelete ? (
                  <Button
                    onClick={() => setConfirmDelete(true)}
                    disabled={isCleaning || getTotalRecords() === 0}
                    className="w-full bg-destructive hover:bg-destructive/90 text-white"
                    size="lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete {getDataTypeLabel(selectedDataType)}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Alert className="border-red-600 bg-red-600/10">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-600">
                        <strong>Are you absolutely sure?</strong> This will permanently delete {getTotalRecords()} records.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleCleanupData}
                        disabled={isCleaning}
                        className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                        size="lg"
                      >
                        {isCleaning ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Yes, Delete Data
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setConfirmDelete(false)}
                        disabled={isCleaning}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-6">
                  <Clock className="w-6 h-6 text-cyan-400" />
                  Scheduled Cleanup Tasks
                </h2>

                <Alert className="mb-6 border-cyan-600 bg-cyan-600/10">
                  <AlertCircle className="h-4 w-4 text-cyan-600" />
                  <AlertDescription className="text-cyan-600">
                    Set up automatic cleanup tasks to run on a schedule. Tasks are stored locally and will run based on your frequency preference.
                  </AlertDescription>
                </Alert>

                {/* Add New Schedule */}
                <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Create New Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Frequency</label>
                      <Select value={newScheduleFrequency} onValueChange={(value: any) => setNewScheduleFrequency(value)}>
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Data Type</label>
                      <Select value={newScheduleDataType} onValueChange={(value: any) => setNewScheduleDataType(value)}>
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="all">All Data</SelectItem>
                          <SelectItem value="customer">Customer Data</SelectItem>
                          <SelectItem value="transaction">Transaction Data</SelectItem>
                          <SelectItem value="kyc">KYC Data</SelectItem>
                          <SelectItem value="audit">Audit Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddSchedule}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        size="sm"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Add Schedule
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Scheduled Tasks List */}
                {scheduledCleanups.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300">Active Schedules</h3>
                    {scheduledCleanups.map((schedule) => (
                      <div key={schedule.id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            <span className="font-medium text-white">
                              {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} - {getDataTypeLabel(schedule.dataType)}
                            </span>
                            {!schedule.enabled && <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">Disabled</span>}
                          </div>
                          <p className="text-xs text-slate-400">
                            Next run: {new Date(schedule.nextRun).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleToggleSchedule(schedule.id, schedule.enabled)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            {schedule.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No scheduled cleanup tasks yet</p>
                    <p className="text-slate-500 text-sm">Create one above to get started</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <Card className="mt-6 bg-slate-800 border-slate-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Data Management Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-200 mb-3">What Gets Deleted</h4>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>Customer Profiles & Accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>Loans & Loan History</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>Repayments & Transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>KYC Documents & Submissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>Audit Trails & Compliance Records</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 mb-3">What Is Preserved</h4>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Organization Settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Loan Products & Configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Staff & Role Assignments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Branches & Holidays</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>System Permissions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
