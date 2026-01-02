/**
 * KYC Upload Page
 * Customers upload KYC documents (ID, proof of address, etc.)
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService, KYCService, EmailService } from '@/services';
import { CustomerProfiles, LoanDocuments } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function KYCUploadPage() {
  const { member } = useMember();
  const [customer, setCustomer] = useState<CustomerProfiles | null>(null);
  const [documents, setDocuments] = useState<LoanDocuments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCustomerData();
  }, [member]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      if (!member?.loginEmail) return;

      // Get customer profile
      const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      const currentCustomer = customers?.find(c => c.emailAddress === member.loginEmail);

      if (currentCustomer) {
        setCustomer(currentCustomer);
        // Get KYC documents
        const docs = await KYCService.getKYCDocuments(currentCustomer._id);
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      setErrorMessage('Failed to load your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!customer) return;

    try {
      setIsUploading(true);
      setErrorMessage('');
      setSuccessMessage('');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!isValidFile(file)) {
          setErrorMessage('Invalid file type or size. Please upload PDF or image files under 5MB.');
          continue;
        }

        // Simulate file upload (in production, upload to cloud storage)
        const mockUrl = `https://static.wixstatic.com/media/12d367_kyc_${Date.now()}.pdf?id=kyc-${customer._id}-${i}`;
        
        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Save document record
        await KYCService.uploadKYCDocument(
          customer._id,
          file.name,
          mockUrl,
          getDocumentType(file.name)
        );
      }

      setSuccessMessage('Documents uploaded successfully!');
      setUploadProgress(0);
      await loadCustomerData();
    } catch (error) {
      console.error('Error uploading files:', error);
      setErrorMessage('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  };

  const getDocumentType = (fileName: string): string => {
    if (fileName.toLowerCase().includes('id')) return 'ID_DOCUMENT';
    if (fileName.toLowerCase().includes('address')) return 'PROOF_OF_ADDRESS';
    if (fileName.toLowerCase().includes('income')) return 'INCOME_PROOF';
    return 'OTHER_DOCUMENT';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground font-paragraph">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/10 animate-spin mx-auto mb-4" />
            <p className="text-primary-foreground/70">Loading your profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground font-paragraph">
        <Header />
        <main className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              Unable to load your profile. Please try again later.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground font-paragraph">
      <Header />

      <main className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            KYC Verification
          </h1>
          <p className="text-primary-foreground/70">
            Upload your identity documents to complete KYC verification and unlock full access.
          </p>
        </motion.div>

        {/* Status Alert */}
        {customer.kycVerificationStatus === 'APPROVED' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-600">KYC Verification Complete</p>
              <p className="text-sm text-primary-foreground/70 mt-1">
                Your identity has been verified. You can now apply for loans.
              </p>
            </div>
          </motion.div>
        )}

        {customer.kycVerificationStatus === 'REJECTED' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600">KYC Verification Rejected</p>
              <p className="text-sm text-primary-foreground/70 mt-1">
                Your documents were not approved. Please contact support for more information.
              </p>
            </div>
          </motion.div>
        )}

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

        {/* Upload Section */}
        {customer.kycVerificationStatus !== 'APPROVED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-primary-foreground/5 border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="text-primary-foreground">Upload Documents</CardTitle>
                <CardDescription className="text-primary-foreground/50">
                  Upload clear copies of your identity documents (PDF or image, max 5MB each)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    isDragging
                      ? 'border-secondary bg-secondary/10'
                      : 'border-primary-foreground/20 hover:border-secondary/50'
                  }`}
                >
                  <Upload className="w-12 h-12 text-primary-foreground/50 mx-auto mb-4" />
                  <p className="text-primary-foreground font-semibold mb-2">
                    Drag and drop your documents here
                  </p>
                  <p className="text-primary-foreground/70 text-sm mb-4">
                    or click below to select files
                  </p>
                  <label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileInput}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      disabled={isUploading}
                      className="bg-secondary text-primary hover:bg-secondary/90"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input');
                        input?.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </Button>
                  </label>
                </div>

                {/* Upload Progress */}
                {isUploading && uploadProgress > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-primary-foreground/70">Uploading...</span>
                      <span className="text-sm font-semibold text-secondary">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-primary-foreground/10 rounded-full h-2">
                      <div
                        className="bg-secondary h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Accepted File Types */}
                <div className="mt-6 p-4 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10">
                  <p className="text-sm text-primary-foreground/70 mb-2">
                    <strong>Accepted formats:</strong> PDF, JPG, PNG
                  </p>
                  <p className="text-sm text-primary-foreground/70">
                    <strong>Maximum file size:</strong> 5MB per file
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-heading font-bold text-primary-foreground mb-4">
              Your Documents
            </h2>
            <div className="space-y-4">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-heading font-bold text-primary-foreground mb-1">
                              {doc.documentName}
                            </h3>
                            <p className="text-sm text-primary-foreground/70 mb-3">
                              Uploaded on {new Date(doc.uploadDate || '').toLocaleDateString()}
                            </p>
                            <Badge className={getStatusColor(customer.kycVerificationStatus)}>
                              {customer.kycVerificationStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {documents.length === 0 && customer.kycVerificationStatus !== 'APPROVED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold text-primary-foreground mb-2">
              No Documents Uploaded
            </h3>
            <p className="text-primary-foreground/70 mb-6">
              Upload your identity documents to get started with KYC verification.
            </p>
          </motion.div>
        )}

        {/* Next Steps */}
        {customer.kycVerificationStatus === 'APPROVED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="bg-secondary/10 border-secondary/30">
              <CardHeader>
                <CardTitle className="text-primary-foreground">What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/70 mb-4">
                  Your KYC verification is complete. Contact your administrator to apply for loans.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
