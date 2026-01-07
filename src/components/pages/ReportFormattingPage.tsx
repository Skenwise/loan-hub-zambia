import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw } from 'lucide-react';

interface ReportFormatting {
  borrowerStatementColumns: string[];
  loanStatementColumns: string[];
  scheduleColumns: string[];
  includeSummarySection: boolean;
  includeContactInfo: boolean;
  includePaymentHistory: boolean;
  dateFormat: string;
  numberFormat: string;
}

const DEFAULT_BORROWER_COLUMNS = [
  'Borrower ID',
  'Full Name',
  'Email',
  'Phone',
  'National ID',
  'Address',
  'KYC Status',
  'Credit Score',
  'Date of Birth',
];

const DEFAULT_LOAN_COLUMNS = [
  'Loan Number',
  'Principal Amount',
  'Outstanding Balance',
  'Interest Rate',
  'Loan Term',
  'Status',
  'Disbursement Date',
  'Next Payment Date',
];

const DEFAULT_SCHEDULE_COLUMNS = [
  'Payment #',
  'Due Date',
  'Principal',
  'Interest',
  'Total Payment',
  'Balance',
];

export default function ReportFormattingPage() {
  const { member } = useMember();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formatting, setFormatting] = useState<ReportFormatting>({
    borrowerStatementColumns: DEFAULT_BORROWER_COLUMNS,
    loanStatementColumns: DEFAULT_LOAN_COLUMNS,
    scheduleColumns: DEFAULT_SCHEDULE_COLUMNS,
    includeSummarySection: true,
    includeContactInfo: true,
    includePaymentHistory: true,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: '#,##0.00',
  });

  const [saving, setSaving] = useState(false);

  // Load formatting from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reportFormatting');
    if (saved) {
      try {
        setFormatting(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading formatting:', error);
      }
    }
  }, []);

  const handleColumnToggle = (
    columnType: 'borrowerStatementColumns' | 'loanStatementColumns' | 'scheduleColumns',
    column: string
  ) => {
    setFormatting((prev) => {
      const columns = prev[columnType];
      const newColumns = columns.includes(column)
        ? columns.filter((c) => c !== column)
        : [...columns, column];
      return {
        ...prev,
        [columnType]: newColumns,
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      localStorage.setItem('reportFormatting', JSON.stringify(formatting));
      toast({
        title: 'Success',
        description: 'Report formatting saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save formatting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormatting({
      borrowerStatementColumns: DEFAULT_BORROWER_COLUMNS,
      loanStatementColumns: DEFAULT_LOAN_COLUMNS,
      scheduleColumns: DEFAULT_SCHEDULE_COLUMNS,
      includeSummarySection: true,
      includeContactInfo: true,
      includePaymentHistory: true,
      dateFormat: 'MM/DD/YYYY',
      numberFormat: '#,##0.00',
    });
    toast({
      title: 'Reset',
      description: 'Formatting reset to defaults',
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Report Formatting</h1>
          <p className="text-secondary-foreground">
            Customize the format and visible columns for your statements and schedules
          </p>
        </div>

        <Tabs defaultValue="columns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="columns">Columns</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="formats">Formats</TabsTrigger>
          </TabsList>

          {/* Columns Tab */}
          <TabsContent value="columns" className="space-y-6">
            {/* Borrower Statement Columns */}
            <Card>
              <CardHeader>
                <CardTitle>Borrower Statement Columns</CardTitle>
                <CardDescription>
                  Select which columns to display in borrower statements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_BORROWER_COLUMNS.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={`borrower-${column}`}
                        checked={formatting.borrowerStatementColumns.includes(column)}
                        onCheckedChange={() =>
                          handleColumnToggle('borrowerStatementColumns', column)
                        }
                      />
                      <Label htmlFor={`borrower-${column}`} className="cursor-pointer">
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Loan Statement Columns */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Statement Columns</CardTitle>
                <CardDescription>
                  Select which columns to display in loan statements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_LOAN_COLUMNS.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={`loan-${column}`}
                        checked={formatting.loanStatementColumns.includes(column)}
                        onCheckedChange={() =>
                          handleColumnToggle('loanStatementColumns', column)
                        }
                      />
                      <Label htmlFor={`loan-${column}`} className="cursor-pointer">
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Columns */}
            <Card>
              <CardHeader>
                <CardTitle>Loan Schedule Columns</CardTitle>
                <CardDescription>
                  Select which columns to display in loan schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_SCHEDULE_COLUMNS.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={`schedule-${column}`}
                        checked={formatting.scheduleColumns.includes(column)}
                        onCheckedChange={() => handleColumnToggle('scheduleColumns', column)}
                      />
                      <Label htmlFor={`schedule-${column}`} className="cursor-pointer">
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Sections</CardTitle>
                <CardDescription>
                  Choose which sections to include in your reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Checkbox
                    id="summary-section"
                    checked={formatting.includeSummarySection}
                    onCheckedChange={(checked) =>
                      setFormatting({
                        ...formatting,
                        includeSummarySection: checked as boolean,
                      })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="summary-section" className="font-semibold cursor-pointer">
                      Summary Section
                    </Label>
                    <p className="text-sm text-secondary-foreground">
                      Include a summary section at the beginning of each statement
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Checkbox
                    id="contact-info"
                    checked={formatting.includeContactInfo}
                    onCheckedChange={(checked) =>
                      setFormatting({
                        ...formatting,
                        includeContactInfo: checked as boolean,
                      })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="contact-info" className="font-semibold cursor-pointer">
                      Contact Information
                    </Label>
                    <p className="text-sm text-secondary-foreground">
                      Include borrower contact details in statements
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Checkbox
                    id="payment-history"
                    checked={formatting.includePaymentHistory}
                    onCheckedChange={(checked) =>
                      setFormatting({
                        ...formatting,
                        includePaymentHistory: checked as boolean,
                      })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="payment-history" className="font-semibold cursor-pointer">
                      Payment History
                    </Label>
                    <p className="text-sm text-secondary-foreground">
                      Include recent payment history in loan statements
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formats Tab */}
          <TabsContent value="formats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Number and Date Formats</CardTitle>
                <CardDescription>
                  Configure how numbers and dates are displayed in reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="font-semibold mb-3 block">Date Format</Label>
                  <div className="space-y-2">
                    {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((format) => (
                      <div key={format} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`date-${format}`}
                          name="dateFormat"
                          value={format}
                          checked={formatting.dateFormat === format}
                          onChange={(e) =>
                            setFormatting({
                              ...formatting,
                              dateFormat: e.target.value,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`date-${format}`} className="cursor-pointer">
                          {format}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold mb-3 block">Number Format</Label>
                  <div className="space-y-2">
                    {['#,##0.00', '#,##0', '0.00', '0'].map((format) => (
                      <div key={format} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`number-${format}`}
                          name="numberFormat"
                          value={format}
                          checked={formatting.numberFormat === format}
                          onChange={(e) =>
                            setFormatting({
                              ...formatting,
                              numberFormat: e.target.value,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`number-${format}`} className="cursor-pointer">
                          {format}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 flex-1"
            size="lg"
          >
            <Save className="w-4 h-4" />
            Save Formatting
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
            size="lg"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/settings/download-statements')}
            size="lg"
          >
            Back to Download Statements
          </Button>
        </div>
      </div>
    </div>
  );
}
