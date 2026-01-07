import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useNavigate } from 'react-router-dom';
import { StatementGenerationService } from '@/services/StatementGenerationService';
import { BranchManagementService } from '@/services/BranchManagementService';
import { Branches, CustomerProfiles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Download, Settings } from 'lucide-react';

interface StatementCounts {
  borrowerStatements: number;
  loanStatements: number;
  originalSchedules: number;
  adjustedSchedules: number;
}

export default function DownloadStatementsPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [branches, setBranches] = useState<Branches[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branches | null>(null);
  const [borrowers, setBorrowers] = useState<CustomerProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [borrowerSelection, setBorrowerSelection] = useState('all');
  const [selectedBorrowers, setSelectedBorrowers] = useState<Set<string>>(new Set());
  const [statementCounts, setStatementCounts] = useState<StatementCounts>({
    borrowerStatements: 0,
    loanStatements: 0,
    originalSchedules: 0,
    adjustedSchedules: 0,
  });

  const [statementTypes, setStatementTypes] = useState({
    borrowerStatements: false,
    loanStatements: false,
    originalSchedules: false,
    adjustedSchedules: false,
  });

  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Load borrowers when branch changes
  useEffect(() => {
    if (selectedBranch) {
      loadBorrowers();
      updateStatementCounts();
    }
  }, [selectedBranch]);

  // Update counts when statement types change
  useEffect(() => {
    updateStatementCounts();
  }, [statementTypes, borrowerSelection, selectedBorrowers]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const organisationId = member?.profile?.nickname || 'default-org';
      const branchesData = await BranchManagementService.getBranchesByOrganisation(organisationId);
      setBranches(branchesData);

      if (branchesData.length > 0) {
        setSelectedBranch(branchesData[0]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load branches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBorrowers = async () => {
    try {
      if (!selectedBranch) return;

      const borrowersData = await StatementGenerationService.getBorrowersByBranch(
        selectedBranch._id,
        5000
      );
      setBorrowers(borrowersData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load borrowers',
        variant: 'destructive',
      });
    }
  };

  const updateStatementCounts = () => {
    const borrowerCount =
      borrowerSelection === 'all' ? borrowers.length : selectedBorrowers.size;

    setStatementCounts({
      borrowerStatements: statementTypes.borrowerStatements ? borrowerCount : 0,
      loanStatements: statementTypes.loanStatements ? borrowerCount : 0,
      originalSchedules: statementTypes.originalSchedules ? borrowerCount : 0,
      adjustedSchedules: statementTypes.adjustedSchedules ? borrowerCount : 0,
    });
  };

  const handleBorrowerToggle = (borrowerId: string) => {
    const newSelected = new Set(selectedBorrowers);
    if (newSelected.has(borrowerId)) {
      newSelected.delete(borrowerId);
    } else {
      newSelected.add(borrowerId);
    }
    setSelectedBorrowers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBorrowers.size === borrowers.length) {
      setSelectedBorrowers(new Set());
    } else {
      setSelectedBorrowers(new Set(borrowers.map((b) => b._id)));
    }
  };

  const handleGenerateDownload = async () => {
    try {
      if (!selectedBranch) {
        toast({
          title: 'Error',
          description: 'Please select a branch',
          variant: 'destructive',
        });
        return;
      }

      if (!Object.values(statementTypes).some((v) => v)) {
        toast({
          title: 'Error',
          description: 'Please select at least one statement type',
          variant: 'destructive',
        });
        return;
      }

      if (borrowerSelection === 'select' && selectedBorrowers.size === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one borrower',
          variant: 'destructive',
        });
        return;
      }

      setGenerating(true);

      const options = {
        branchId: selectedBranch._id,
        statementTypes,
        borrowerIds:
          borrowerSelection === 'select' ? Array.from(selectedBorrowers) : undefined,
        allBorrowers: borrowerSelection === 'all',
      };

      const zipBlob = await StatementGenerationService.generateStatementZip(
        options,
        selectedBranch.branchName || 'Branch'
      );

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${selectedBranch.branchName?.replace(/\s+/g, '_')}_Reports_${timestamp}.zip`;

      StatementGenerationService.downloadZip(zipBlob, filename);

      toast({
        title: 'Success',
        description: `ZIP file "${filename}" downloaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate statements',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const totalFilesToGenerate =
    Object.values(statementCounts).reduce((a, b) => a + b, 0);

  const isGenerateDisabled =
    !selectedBranch ||
    !Object.values(statementTypes).some((v) => v) ||
    (borrowerSelection === 'select' && selectedBorrowers.size === 0) ||
    generating;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Download Statements & Schedules
          </h1>
          <p className="text-secondary-foreground">
            Use this page to download multiple Borrower Statements, Loan Statements, Original Loan
            Schedules, and Adjusted Loan Schedules for this branch. All selected files will be
            generated in Excel format and packaged into a ZIP file for download.
          </p>
        </div>

        {/* Branch Selection */}
        {branches.length === 0 ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No branches found. Please create a branch first.
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Branch</CardTitle>
              <CardDescription>Choose the branch for which to download statements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((branch) => (
                  <Button
                    key={branch._id}
                    variant={selectedBranch?._id === branch._id ? 'default' : 'outline'}
                    className="justify-start h-auto p-4 flex flex-col items-start"
                    onClick={() => setSelectedBranch(branch)}
                  >
                    <div className="font-semibold">{branch.branchName}</div>
                    <div className="text-sm opacity-75">{branch.city}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedBranch && (
          <>
            {/* Statement Type Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Statement Type Selection</CardTitle>
                <CardDescription>
                  Select which statement types to include in the download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Borrower Statements */}
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="borrower-statements"
                      checked={statementTypes.borrowerStatements}
                      onCheckedChange={(checked) =>
                        setStatementTypes({
                          ...statementTypes,
                          borrowerStatements: checked as boolean,
                        })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="borrower-statements" className="font-semibold cursor-pointer">
                        Borrower Statements
                      </Label>
                      <p className="text-sm text-secondary-foreground mt-1">
                        {borrowers.length} borrowers available
                      </p>
                      {statementTypes.borrowerStatements && (
                        <Badge variant="secondary" className="mt-2">
                          {statementCounts.borrowerStatements} files
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Loan Statements */}
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="loan-statements"
                      checked={statementTypes.loanStatements}
                      onCheckedChange={(checked) =>
                        setStatementTypes({
                          ...statementTypes,
                          loanStatements: checked as boolean,
                        })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="loan-statements" className="font-semibold cursor-pointer">
                        Loan Statements
                      </Label>
                      <p className="text-sm text-secondary-foreground mt-1">
                        {borrowers.length} loans available
                      </p>
                      {statementTypes.loanStatements && (
                        <Badge variant="secondary" className="mt-2">
                          {statementCounts.loanStatements} files
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Original Loan Schedules */}
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="original-schedules"
                      checked={statementTypes.originalSchedules}
                      onCheckedChange={(checked) =>
                        setStatementTypes({
                          ...statementTypes,
                          originalSchedules: checked as boolean,
                        })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="original-schedules" className="font-semibold cursor-pointer">
                        Original Loan Schedules
                      </Label>
                      <p className="text-sm text-secondary-foreground mt-1">
                        Payment schedules at loan origination
                      </p>
                      {statementTypes.originalSchedules && (
                        <Badge variant="secondary" className="mt-2">
                          {statementCounts.originalSchedules} files
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Adjusted Loan Schedules */}
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="adjusted-schedules"
                      checked={statementTypes.adjustedSchedules}
                      onCheckedChange={(checked) =>
                        setStatementTypes({
                          ...statementTypes,
                          adjustedSchedules: checked as boolean,
                        })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="adjusted-schedules" className="font-semibold cursor-pointer">
                        Adjusted Loan Schedules
                      </Label>
                      <p className="text-sm text-secondary-foreground mt-1">
                        Schedules with actual repayments
                      </p>
                      {statementTypes.adjustedSchedules && (
                        <Badge variant="secondary" className="mt-2">
                          {statementCounts.adjustedSchedules} files
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Borrower Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Borrower Selection</CardTitle>
                <CardDescription>
                  Choose which borrowers to include in the statements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={borrowerSelection} onValueChange={setBorrowerSelection}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="all" id="all-borrowers" />
                    <Label htmlFor="all-borrowers" className="font-semibold cursor-pointer flex-1">
                      All Borrowers ({borrowers.length})
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="select" id="select-borrowers" />
                    <Label htmlFor="select-borrowers" className="font-semibold cursor-pointer flex-1">
                      Select Borrowers Below ({selectedBorrowers.size} selected)
                    </Label>
                  </div>
                </RadioGroup>

                {borrowerSelection === 'select' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold">
                        Select up to {Math.min(5000, borrowers.length)} borrowers
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedBorrowers.size === borrowers.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                    </div>

                    <ScrollArea className="h-96 border rounded-lg p-4">
                      <div className="space-y-2">
                        {borrowers.map((borrower) => (
                          <div
                            key={borrower._id}
                            className="flex items-center space-x-2 p-2 hover:bg-secondary/10 rounded"
                          >
                            <Checkbox
                              id={`borrower-${borrower._id}`}
                              checked={selectedBorrowers.has(borrower._id)}
                              onCheckedChange={() => handleBorrowerToggle(borrower._id)}
                            />
                            <Label
                              htmlFor={`borrower-${borrower._id}`}
                              className="cursor-pointer flex-1"
                            >
                              <div className="font-medium">
                                {borrower.firstName} {borrower.lastName}
                              </div>
                              <div className="text-xs text-secondary-foreground">
                                {borrower.emailAddress}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Customization */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Report Customization</CardTitle>
                <CardDescription>
                  Customize the format and columns of your reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('/admin/settings/report-formatting')}
                >
                  <Settings className="w-4 h-4" />
                  Customize Report Format
                </Button>
                <p className="text-sm text-secondary-foreground mt-4">
                  Configure visible columns, report sections, and formatting options for your
                  statements.
                </p>
              </CardContent>
            </Card>

            {/* Summary */}
            {Object.values(statementTypes).some((v) => v) && (
              <Card className="mb-6 bg-secondary/5 border-secondary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Generation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-secondary-foreground">Total Files</p>
                      <p className="text-2xl font-bold">{totalFilesToGenerate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-foreground">Borrowers</p>
                      <p className="text-2xl font-bold">
                        {borrowerSelection === 'all' ? borrowers.length : selectedBorrowers.size}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-foreground">Branch</p>
                      <p className="text-lg font-semibold">{selectedBranch.branchName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-foreground">Format</p>
                      <p className="text-lg font-semibold">Excel + ZIP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleGenerateDownload}
                disabled={isGenerateDisabled}
                className="gap-2 flex-1"
                size="lg"
              >
                {generating ? (
                  <>
                    <LoadingSpinner />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate & Download ZIP
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/settings')}
                size="lg"
              >
                Back to Admin Settings
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
