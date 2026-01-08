import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export default function SystemResetPage() {
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [cleanupReport, setCleanupReport] = useState<CleanupReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data summary on mount
  useEffect(() => {
    loadDataSummary();
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

  const handleCleanupData = async () => {
    if (!confirmDelete) return;

    setIsCleaning(true);
    setError(null);
    try {
      const report = await DataCleanupService.cleanupAllCustomerData();
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

  const getTotalRecords = () => {
    if (!dataSummary) return 0;
    return Object.values(dataSummary.counts).reduce((sum, count) => sum + count, 0);
  };

  const getTotalDeleted = () => {
    if (!cleanupReport) return 0;
    return Object.values(cleanupReport.deletedCounts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">System Reset & Data Cleanup</h1>
          <p className="text-slate-300">Manage and clean up customer data for system reset or fresh launches</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Data Summary Section */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
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
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Total Records</p>
                    <p className="text-3xl font-bold text-white">{getTotalRecords()}</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Customers</p>
                    <p className="text-3xl font-bold text-white">{dataSummary.counts.customers}</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Loans</p>
                    <p className="text-3xl font-bold text-white">{dataSummary.counts.loans}</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Repayments</p>
                    <p className="text-3xl font-bold text-white">{dataSummary.counts.repayments}</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">KYC Submissions</p>
                    <p className="text-3xl font-bold text-white">{dataSummary.counts.kycDocumentSubmissions}</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Loan Documents</p>
                    <p className="text-3xl font-bold text-white">{dataSummary.counts.loanDocuments}</p>
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

        {/* Cleanup Section */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2 mb-6">
              <Trash2 className="w-6 h-6 text-destructive" />
              Clean Up Customer Data
            </h2>

            <Alert className="mb-6 border-yellow-600 bg-yellow-600/10">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-600">
                <strong>Warning:</strong> This action will permanently delete all customer-related data including customers, loans, repayments, KYC documents, and audit trails. This cannot be undone.
              </AlertDescription>
            </Alert>

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
                      <div className="flex justify-between text-slate-400">
                        <span>Loan Documents:</span>
                        <span className="text-white">{cleanupReport.deletedCounts.loanDocuments}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Audit Trail:</span>
                        <span className="text-white">{cleanupReport.deletedCounts.auditTrail}</span>
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
                Delete All Customer Data
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert className="border-red-600 bg-red-600/10">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600">
                    <strong>Are you sure?</strong> This will delete {getTotalRecords()} records and cannot be undone.
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
                        Cleaning...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Yes, Delete All Data
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

        {/* Info Section */}
        <Card className="mt-6 bg-slate-800 border-slate-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">What Gets Deleted</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>All Customer Profiles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>All Loans and Loan History</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>All Repayments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>All KYC Documents and Submissions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>All Loan Documents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>All Audit Trails and Workflow History</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>All ECL Results and BoZ Provisions</span>
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6 mb-4">What Is Preserved</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Organization Settings and Configuration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Loan Products and Settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Staff Members and Role Assignments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Branches and Branch Holidays</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>All System Configuration and Permissions</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
