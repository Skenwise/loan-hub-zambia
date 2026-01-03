import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { CustomerProfiles } from '@/entities';

export default function BulkCustomerUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string;
  }>({ type: null, message: '' });
  const [previewData, setPreviewData] = useState<any[]>([]);

  const downloadTemplate = () => {
    const headers = [
      'firstName',
      'lastName',
      'nationalIdNumber',
      'phoneNumber',
      'emailAddress',
      'residentialAddress',
      'dateOfBirth',
      'kycVerificationStatus',
      'creditScore',
    ];
    
    const sampleData = [
      'John',
      'Doe',
      '123456789',
      '+260123456789',
      'john@example.com',
      '123 Main St',
      '1990-01-15',
      'PENDING',
      '750',
    ];

    const csv = headers.join(',') + '\n' + sampleData.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_template.csv';
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus({ type: null, message: '' });

      // Parse and preview the file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvContent = event.target?.result as string;
          const lines = csvContent.trim().split('\n');
          
          if (lines.length < 2) {
            setUploadStatus({
              type: 'error',
              message: 'CSV file is empty or invalid',
            });
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim());
          const dataRows = lines.slice(1, 6); // First 5 data rows
          
          const parsedData = dataRows.map(line => {
            const values = line.split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });

          setPreviewData(parsedData);
        } catch (error) {
          setUploadStatus({
            type: 'error',
            message: 'Failed to parse CSV file',
            details: (error as Error).message,
          });
        }
      };
      reader.onerror = () => {
        setUploadStatus({
          type: 'error',
          message: 'Failed to read file',
        });
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file to upload',
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvContent = event.target?.result as string;
          const lines = csvContent.trim().split('\n');
          
          if (lines.length < 2) {
            setUploading(false);
            setUploadStatus({
              type: 'error',
              message: 'CSV file is empty or invalid',
            });
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim());
          const dataRows = lines.slice(1);
          
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          for (const line of dataRows) {
            if (!line.trim()) continue; // Skip empty lines
            
            try {
              const values = line.split(',').map(v => v.trim());
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });

              // Validate required fields
              if (!row.firstName || !row.lastName || !row.emailAddress) {
                errorCount++;
                errors.push(`Row skipped: Missing required fields (firstName, lastName, emailAddress)`);
                continue;
              }

              const customerData: CustomerProfiles = {
                _id: crypto.randomUUID(),
                firstName: row.firstName?.trim() || '',
                lastName: row.lastName?.trim() || '',
                nationalIdNumber: row.nationalIdNumber?.trim() || '',
                phoneNumber: row.phoneNumber?.trim() || '',
                emailAddress: row.emailAddress?.trim() || '',
                residentialAddress: row.residentialAddress?.trim() || '',
                dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
                kycVerificationStatus: row.kycVerificationStatus?.trim() || 'PENDING',
                creditScore: row.creditScore ? parseInt(row.creditScore) : undefined,
              };

              await BaseCrudService.create('customers', customerData);
              successCount++;
            } catch (error) {
              errorCount++;
              errors.push(`Row error: ${(error as Error).message}`);
            }
          }

          setUploading(false);
          setUploadStatus({
            type: errorCount === 0 ? 'success' : 'error',
            message: `Upload completed: ${successCount} customers created, ${errorCount} errors`,
            details: errors.length > 0 ? errors.slice(0, 5).join('\n') : undefined,
          });

          if (successCount > 0) {
            setFile(null);
            setPreviewData([]);
          }
        } catch (error) {
          setUploading(false);
          setUploadStatus({
            type: 'error',
            message: 'Failed to upload customers',
            details: (error as Error).message,
          });
        }
      };
      reader.onerror = () => {
        setUploading(false);
        setUploadStatus({
          type: 'error',
          message: 'Failed to read file',
        });
      };
      reader.readAsText(file);
    } catch (error) {
      setUploading(false);
      setUploadStatus({
        type: 'error',
        message: 'Upload failed',
        details: (error as Error).message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Upload Customers</h1>
        <p className="text-gray-600 mt-2">Upload multiple customers at once using a CSV file</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>

            {/* File Input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <label className="cursor-pointer">
                <span className="text-blue-600 font-medium hover:text-blue-700">Click to upload</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <p className="text-gray-600 text-sm mt-2">or drag and drop</p>
              <p className="text-gray-500 text-xs mt-1">CSV files only</p>
            </div>

            {file && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Selected file: {file.name}</p>
                <p className="text-xs text-gray-600 mt-1">Size: {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left text-gray-700 font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                          {Object.values(row).map((value: any, colIdx) => (
                            <td key={colIdx} className="px-3 py-2 text-gray-600">
                              {String(value).substring(0, 30)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus.type && (
              <div
                className={`mt-6 p-4 rounded-lg flex gap-3 ${
                  uploadStatus.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{uploadStatus.message}</p>
                  {uploadStatus.details && (
                    <p className="text-sm mt-1 whitespace-pre-wrap">{uploadStatus.details}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploading ? 'Uploading...' : 'Upload Customers'}
              </Button>
              <Button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setUploadStatus({ type: null, message: '' });
                }}
                variant="outline"
                disabled={uploading}
              >
                Clear
              </Button>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Required Fields:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>First Name</li>
                  <li>Last Name</li>
                  <li>Email Address</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Optional Fields:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>National ID Number</li>
                  <li>Phone Number</li>
                  <li>Residential Address</li>
                  <li>Date of Birth (YYYY-MM-DD)</li>
                  <li>KYC Verification Status</li>
                  <li>Credit Score</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tips:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use the template to ensure correct format</li>
                  <li>Maximum 1000 customers per upload</li>
                  <li>Duplicate emails will be skipped</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full mt-6"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
