import React, { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { DemoManagementService } from '@/services/DemoManagementService';
import { DemoDataGenerationService } from '@/services/DemoDataGenerationService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Trash2, RefreshCw, Zap } from 'lucide-react';

export default function DemoManagementPage() {
  const { member } = useMember();
  const [demoStatuses, setDemoStatuses] = useState<Array<{ organisationId: string; isDemoMode: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState<string | null>(null);

  useEffect(() => {
    loadDemoStatuses();
  }, []);

  const loadDemoStatuses = async () => {
    try {
      setLoading(true);
      const statuses = await DemoManagementService.getAllDemoModeStatuses();
      setDemoStatuses(statuses);
    } catch (error) {
      console.error('Error loading demo statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetOrganisation = async (organisationId: string) => {
    try {
      setResetting(organisationId);
      const result = await DemoManagementService.resetOrganisationData(organisationId);
      
      if (result.success) {
        alert(`Successfully reset organisation data.\n\nDeleted:\n${Object.entries(result.deletedCounts)
          .map(([key, count]) => `${key}: ${count}`)
          .join('\n')}`);
        setShowResetDialog(null);
        loadDemoStatuses();
      }
    } catch (error) {
      alert(`Error resetting organisation: ${error}`);
    } finally {
      setResetting(null);
    }
  };

  const handleGenerateDemoData = async (organisationId: string) => {
    try {
      setGenerating(organisationId);
      const result = await DemoDataGenerationService.generateDemoData(organisationId);
      
      if (result.success) {
        alert(`Successfully generated demo data.\n\nCreated:\n${Object.entries(result.generatedCounts)
          .map(([key, count]) => `${key}: ${count}`)
          .join('\n')}`);
        setShowGenerateDialog(null);
        loadDemoStatuses();
      }
    } catch (error) {
      alert(`Error generating demo data: ${error}`);
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[100rem] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Demo Management</h1>
          <p className="text-secondary-foreground">
            Manage demo mode and reset organisation data for testing purposes
          </p>
        </div>

        {demoStatuses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-secondary-foreground">No organisations found</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {demoStatuses.map((status) => (
              <Card key={status.organisationId} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Organisation: {status.organisationId}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-secondary-foreground">Demo Mode:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        status.isDemoMode 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {status.isDemoMode ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {status.isDemoMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGenerateDialog(status.organisationId)}
                        disabled={generating === status.organisationId}
                        className="flex items-center gap-2"
                      >
                        {generating === status.organisationId ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Generate Data
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowResetDialog(status.organisationId)}
                      disabled={resetting === status.organisationId}
                      className="flex items-center gap-2"
                    >
                      {resetting === status.organisationId ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Reset Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetDialog !== null} onOpenChange={(open) => !open && setShowResetDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Organisation Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all organisation data including:
                <ul className="mt-3 ml-4 space-y-1 text-sm list-disc">
                  <li>All staff members and role assignments</li>
                  <li>All customers and borrowers</li>
                  <li>All loans and repayments</li>
                  <li>All KYC documents and submissions</li>
                  <li>All loan documents and collateral records</li>
                </ul>
                <p className="mt-3 font-semibold text-red-600">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showResetDialog && handleResetOrganisation(showResetDialog)}
                className="bg-destructive text-destructive-foreground hover:bg-red-700"
              >
                Reset Data
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Generate Demo Data Confirmation Dialog */}
        <AlertDialog open={showGenerateDialog !== null} onOpenChange={(open) => !open && setShowGenerateDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Generate Demo Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create sample data for testing including:
                <ul className="mt-3 ml-4 space-y-1 text-sm list-disc">
                  <li>3 branches with managers</li>
                  <li>6 staff members with different roles</li>
                  <li>5 loan products</li>
                  <li>5 customer profiles</li>
                  <li>5 loans with different statuses (active, arrears, closed)</li>
                  <li>Multiple repayments per loan</li>
                </ul>
                <p className="mt-3 text-sm text-gray-600">All data will be tagged as DEMO and can be removed via Reset Data.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showGenerateDialog && handleGenerateDemoData(showGenerateDialog)}
                className="bg-secondary hover:bg-blue-600"
              >
                Generate Data
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
