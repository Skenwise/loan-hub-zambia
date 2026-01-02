/**
 * Bulk Repayment Page
 * CSV upload and batch processing of repayments
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { BulkRepaymentService, AuthorizationService, Permissions } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
  AlertTriangle,
  FileText,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BulkRepaymentPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvContent, setCSVContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canProcessBulk, setCanProcessBulk] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('upload');

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentStaff?._id || !currentOrganisation?._id) {
        setCanProcessBulk(false);
        return;
      }

      if (currentStaff?.role === 'Finance / Accounts Officer' || 
          currentStaff?.role === 'System Owner' || 
          currentStaff?.role === 'Admin/Owner') {
        setCanProcessBulk(true);
        return;
      }

      try {
        const hasPermission = await AuthorizationService.hasPermission(
          currentStaff._id,
          currentOrganisation._id,
          Permissions.POST_REPAYMENT
        );
        setCanProcessBulk(hasPermission);
      } catch (error) {
        console.error('Error checking permission:', error);
        setCanProcessBulk(false);
      }
    };

    checkPermissions();
  }, [currentStaff, currentOrganisation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please select a CSV file');
      return;
    }

    setCSVFile(file);
    setErrorMessage('');

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCSVContent(content);
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    if (!csvContent) {
      setErrorMessage('Please select a CSV file');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const records = BulkRepaymentService.parseCSV(csvContent);
      const result = await BulkRepaymentService.validateBulkRepayments(
        records,
        currentOrganisation?._id || ''
      );

      setValidationResult(result);
      setActiveTab('validation');
    } catch (error: any) {
      setErrorMessage(error.message || 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!validationResult || !validationResult.isValid) {
      setErrorMessage('Please fix validation errors before processing');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const records = BulkRepaymentService.parseCSV(csvContent);
      const result = await BulkRepaymentService.processBulkRepayments(
        records,
        currentOrganisation?._id || '',
        currentStaff?._id || '',
        csvFile?.name || 'bulk-repayment.csv'
      );

      setProcessingResult(result);
      setSuccessMessage(`Bulk repayment processed: ${result.processedRecords}/${result.totalRecords} successful`);
      setActiveTab('results');
    } catch (error: any) {
      setErrorMessage(error.message || 'Processing failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = BulkRepaymentService.generateCSVTemplate();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(template));
    element.setAttribute('download', 'repayment-template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadResults = () => {
    if (!processingResult) return;
    const csv = BulkRepaymentService.exportJobResults(processingResult);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `bulk-repayment-results-${processingResult._id}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!canProcessBulk) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-50 border-red-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Access Denied</h3>
                  <p className="text-red-700">
                    You do not have permission to process bulk repayments. Please contact your administrator.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Bulk Repayment Processing
          </h1>
          <p className="text-primary-foreground/70">
            Upload and process multiple repayments via CSV file with automatic validation
          </p>
        </motion.div>

        {/* Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-600">{successMessage}</p>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600">{errorMessage}</p>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-200">
              <TabsTrigger value="upload" className="text-slate-900">
                Upload
              </TabsTrigger>
              <TabsTrigger value="validation" className="text-slate-900">
                Validation
              </TabsTrigger>
              <TabsTrigger value="results" className="text-slate-900">
                Results
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <Card className="bg-slate-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="text-slate-900">Upload CSV File</CardTitle>
                  <CardDescription className="text-slate-600">
                    Select a CSV file with repayment records to process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Download */}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-1">CSV Template</h3>
                        <p className="text-sm text-blue-700">
                          Download the template to see the required format and example data
                        </p>
                      </div>
                      <Button
                        onClick={handleDownloadTemplate}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="text-slate-700 text-sm mb-3 block">Select CSV File *</Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-900 font-semibold mb-1">
                          {csvFile ? csvFile.name : 'Click to select or drag and drop'}
                        </p>
                        <p className="text-sm text-slate-600">CSV files only</p>
                      </label>
                    </div>
                  </div>

                  {/* File Info */}
                  {csvFile && (
                    <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-slate-600 mt-1" />
                          <div>
                            <p className="font-semibold text-slate-900">{csvFile.name}</p>
                            <p className="text-sm text-slate-600">
                              {(csvFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setCSVFile(null);
                            setCSVContent('');
                          }}
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-300">
                    <Button
                      onClick={handleValidate}
                      disabled={!csvFile || isLoading}
                      className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Validating...' : 'Validate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validation" className="space-y-6">
              {validationResult ? (
                <>
                  {/* Summary */}
                  <Card className="bg-slate-50 border-slate-300">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Validation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-white border border-slate-300">
                          <p className="text-xs text-slate-600 mb-1">Total Records</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {validationResult.totalRecords}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 border border-green-300">
                          <p className="text-xs text-green-700 mb-1">Valid Records</p>
                          <p className="text-2xl font-bold text-green-700">
                            {validationResult.validRecords}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 border border-red-300">
                          <p className="text-xs text-red-700 mb-1">Invalid Records</p>
                          <p className="text-2xl font-bold text-red-700">
                            {validationResult.invalidRecords}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-300">
                          <p className="text-xs text-blue-700 mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-blue-700">
                            ZMW {validationResult.summary.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Errors */}
                  {validationResult.errors.length > 0 && (
                    <Card className="bg-red-50 border-red-300">
                      <CardHeader>
                        <CardTitle className="text-red-900 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Validation Errors ({validationResult.errors.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {validationResult.errors.map((error: any, idx: number) => (
                            <div key={idx} className="p-3 rounded bg-white border border-red-300">
                              <p className="text-sm font-semibold text-red-900">
                                Row {error.rowNumber}: {error.field}
                              </p>
                              <p className="text-sm text-red-700">{error.message}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <Card className="bg-yellow-50 border-yellow-300">
                      <CardHeader>
                        <CardTitle className="text-yellow-900 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Warnings ({validationResult.warnings.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {validationResult.warnings.map((warning: any, idx: number) => (
                            <div key={idx} className="p-3 rounded bg-white border border-yellow-300">
                              <p className="text-sm font-semibold text-yellow-900">
                                Row {warning.rowNumber}: {warning.field}
                              </p>
                              <p className="text-sm text-yellow-700">{warning.message}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <Button
                      onClick={() => setActiveTab('upload')}
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      Back
                    </Button>
                    {validationResult.isValid && (
                      <Button
                        onClick={handleProcess}
                        disabled={isLoading}
                        className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Process Repayments'}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <Card className="bg-slate-50 border-slate-300">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No Validation Results
                    </h3>
                    <p className="text-slate-600">
                      Upload and validate a CSV file to see results here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {processingResult ? (
                <>
                  {/* Status */}
                  <Card className={`border-2 ${processingResult.status === 'COMPLETED' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <CardHeader>
                      <CardTitle className={processingResult.status === 'COMPLETED' ? 'text-green-900' : 'text-red-900'}>
                        Processing {processingResult.status}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Total Records</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {processingResult.totalRecords}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700 mb-1">Processed</p>
                          <p className="text-2xl font-bold text-green-700">
                            {processingResult.processedRecords}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-red-700 mb-1">Failed</p>
                          <p className="text-2xl font-bold text-red-700">
                            {processingResult.failedRecords}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 mb-1">Success Rate</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {((processingResult.processedRecords / processingResult.totalRecords) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Amounts */}
                  <Card className="bg-slate-50 border-slate-300">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Amount Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-white border border-slate-300">
                          <p className="text-xs text-slate-600 mb-1">Total Amount</p>
                          <p className="text-xl font-bold text-slate-900">
                            ZMW {processingResult.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 border border-green-300">
                          <p className="text-xs text-green-700 mb-1">Successful</p>
                          <p className="text-xl font-bold text-green-700">
                            ZMW {processingResult.successfulAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 border border-red-300">
                          <p className="text-xs text-red-700 mb-1">Failed</p>
                          <p className="text-xl font-bold text-red-700">
                            ZMW {processingResult.failedAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Errors */}
                  {processingResult.errors.length > 0 && (
                    <Card className="bg-red-50 border-red-300">
                      <CardHeader>
                        <CardTitle className="text-red-900">Processing Errors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {processingResult.errors.map((error: string, idx: number) => (
                            <div key={idx} className="p-3 rounded bg-white border border-red-300">
                              <p className="text-sm text-red-700">{error}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <Button
                      onClick={handleDownloadResults}
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Results
                    </Button>
                    <Button
                      onClick={() => {
                        setCSVFile(null);
                        setCSVContent('');
                        setValidationResult(null);
                        setProcessingResult(null);
                        setActiveTab('upload');
                      }}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Process Another File
                    </Button>
                  </div>
                </>
              ) : (
                <Card className="bg-slate-50 border-slate-300">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No Processing Results
                    </h3>
                    <p className="text-slate-600">
                      Process a validated CSV file to see results here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
