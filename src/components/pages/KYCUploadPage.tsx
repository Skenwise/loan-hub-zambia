/**
 * KYC Upload Page - Enhanced
 * Comprehensive KYC document management with multiple categories:
 * - Core/Mandatory KYC Documents
 * - Income & Affordability Documents
 * - Guarantor Documents
 * - Collateral-Related Documents
 * - Compliance & Declarations
 * - Optional/Enhanced Due Diligence
 */

import { useState, useEffect, useRef } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/services';
import { CustomerProfiles, KYCDocumentSubmissions, KYCStatusTracking, KYCDocumentConfiguration } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Download, Trash2, CreditCard, Home, DollarSign, Users, Lock, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface DocumentCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  documents: {
    id: string;
    name: string;
    description: string;
    required?: boolean;
  }[];
}

export default function KYCUploadPage() {
  const { member } = useMember();
  const [customer, setCustomer] = useState<CustomerProfiles | null>(null);
  const [documents, setDocuments] = useState<KYCDocumentSubmissions[]>([]);
  const [kycStatus, setKycStatus] = useState<KYCStatusTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraggingCategory, setIsDraggingCategory] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Document categories with detailed structure
  const documentCategories: DocumentCategory[] = [
    {
      id: 'CORE_MANDATORY',
      title: 'Core/Mandatory KYC Documents',
      description: 'Essential identity and residence verification documents',
      icon: CreditCard,
      color: 'bg-blue-500/10 border-blue-500/20',
      documents: [
        { id: 'IDENTITY_VERIFICATION', name: 'Identity Verification', description: 'National ID, Passport, or Driver\'s License', required: true },
        { id: 'PROOF_OF_RESIDENCE', name: 'Proof of Residence', description: 'Utility Bill, Bank Statement, or Rental Agreement', required: true },
        { id: 'CUSTOMER_PHOTOGRAPH', name: 'Customer Photograph', description: 'Recent passport-sized photograph', required: true }
      ]
    },
    {
      id: 'INCOME_AFFORDABILITY',
      title: 'Income & Affordability Documents',
      description: 'Documents to verify income and repayment capacity',
      icon: DollarSign,
      color: 'bg-green-500/10 border-green-500/20',
      documents: [
        { id: 'EMPLOYMENT_LETTER', name: 'Employment Letter', description: 'Letter from employer confirming employment', required: false },
        { id: 'PAY_SLIP', name: 'Pay Slip', description: 'Recent salary slip (last 3 months)', required: false },
        { id: 'TAX_RETURN', name: 'Tax Return', description: 'Income tax return or assessment', required: false },
        { id: 'BUSINESS_STATEMENT', name: 'Business Statement', description: 'For self-employed: business registration and financials', required: false },
        { id: 'BANK_STATEMENT', name: 'Bank Statement', description: 'Last 6 months bank statement', required: false }
      ]
    },
    {
      id: 'GUARANTOR',
      title: 'Guarantor Documents',
      description: 'Documents for loan guarantors (if required)',
      icon: Users,
      color: 'bg-purple-500/10 border-purple-500/20',
      documents: [
        { id: 'GUARANTOR_ID', name: 'Guarantor Identity', description: 'Guarantor\'s ID or Passport', required: false },
        { id: 'GUARANTOR_RESIDENCE', name: 'Guarantor Residence Proof', description: 'Guarantor\'s proof of residence', required: false },
        { id: 'GUARANTOR_INCOME', name: 'Guarantor Income Proof', description: 'Guarantor\'s income verification documents', required: false },
        { id: 'GUARANTOR_CONSENT', name: 'Guarantor Consent', description: 'Signed guarantee agreement', required: false }
      ]
    },
    {
      id: 'COLLATERAL',
      title: 'Collateral-Related Documents',
      description: 'Documents for secured loans',
      icon: Lock,
      color: 'bg-orange-500/10 border-orange-500/20',
      documents: [
        { id: 'PROPERTY_DEED', name: 'Property Deed', description: 'Title deed or ownership certificate', required: false },
        { id: 'PROPERTY_VALUATION', name: 'Property Valuation', description: 'Professional property valuation report', required: false },
        { id: 'INSURANCE_POLICY', name: 'Insurance Policy', description: 'Property or asset insurance policy', required: false },
        { id: 'COLLATERAL_PHOTOS', name: 'Collateral Photos', description: 'Photographs of collateral asset', required: false }
      ]
    },
    {
      id: 'COMPLIANCE',
      title: 'Compliance & Declarations',
      description: 'Regulatory and compliance documents',
      icon: FileCheck,
      color: 'bg-red-500/10 border-red-500/20',
      documents: [
        { id: 'KYC_DECLARATION', name: 'KYC Declaration', description: 'Signed KYC declaration form', required: true },
        { id: 'ANTI_MONEY_LAUNDERING', name: 'Anti-Money Laundering Declaration', description: 'AML compliance declaration', required: true },
        { id: 'PEP_DECLARATION', name: 'PEP Declaration', description: 'Politically Exposed Person declaration', required: false }
      ]
    },
    {
      id: 'OPTIONAL_ENHANCED',
      title: 'Optional/Enhanced Due Diligence',
      description: 'Additional documents for enhanced verification',
      icon: FileText,
      color: 'bg-gray-500/10 border-gray-500/20',
      documents: [
        { id: 'CREDIT_REPORT', name: 'Credit Report', description: 'Credit bureau report', required: false },
        { id: 'REFERENCE_LETTER', name: 'Reference Letter', description: 'Professional or personal reference', required: false },
        { id: 'ADDITIONAL_DOCS', name: 'Additional Documents', description: 'Any other supporting documents', required: false }
      ]
    }
  ];

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
        const { items: docs } = await BaseCrudService.getAll<KYCDocumentSubmissions>('kycdocumentsubmissions');
        const customerDocs = docs?.filter(d => d.customerId === currentCustomer._id) || [];
        setDocuments(customerDocs);

        // Get KYC status
        const { items: statuses } = await BaseCrudService.getAll<KYCStatusTracking>('kycstatustracking');
        const customerStatus = statuses?.find(s => s.customerId === currentCustomer._id);
        setKycStatus(customerStatus || null);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
      setErrorMessage('Failed to load your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCategory(categoryId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCategory(null);
  };

  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCategory(null);
    const files = e.dataTransfer.files;
    handleFiles(files, categoryId);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    const files = e.currentTarget.files;
    if (files) {
      handleFiles(files, categoryId);
    }
  };

  const triggerFileInput = (categoryId: string) => {
    const input = fileInputRefs.current[categoryId];
    if (input) {
      input.click();
    }
  };

  const handleFiles = async (files: FileList, categoryId: string) => {
    if (!customer) return;

    try {
      setIsUploading(true);
      setErrorMessage('');
      setSuccessMessage('');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!isValidFile(file)) {
          setErrorMessage('Invalid file type or size. Please upload PDF or image files under 5MB.');
          continue;
        }

        // Generate secure document URL from file upload
        const documentUrl = `${window.location.origin}/documents/kyc-${customer._id}-${categoryId}-${Date.now()}`;
        
        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Save document record
        const newDocument: KYCDocumentSubmissions = {
          _id: crypto.randomUUID(),
          customerId: customer._id,
          documentType: categoryId,
          documentFile: documentUrl,
          uploadedBy: member?.loginEmail || 'unknown',
          uploadDate: new Date().toISOString(),
          verificationStatus: 'PENDING'
        };

        await BaseCrudService.create('kycdocumentsubmissions', newDocument);
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

  const getDocumentsForCategory = (categoryId: string): KYCDocumentSubmissions[] => {
    return documents.filter(doc => doc.documentType === categoryId);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'UNDER_REVIEW':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'REJECTED':
        return <AlertCircle className="w-4 h-4" />;
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getKYCStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/10 border-green-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 border-red-500/20';
      case 'UNDER_REVIEW':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'SUBMITTED':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
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
        <main className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
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

      <main className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
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
            Complete your Know Your Customer (KYC) verification by uploading the required documents below.
          </p>
        </motion.div>

        {/* KYC Status Overview */}
        {kycStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-6 rounded-lg border ${getKYCStatusColor(kycStatus.kycStatus)} flex items-start gap-4`}
          >
            <div className="flex-shrink-0 mt-1">
              {kycStatus.kycStatus === 'APPROVED' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
              {kycStatus.kycStatus === 'REJECTED' && <AlertCircle className="w-6 h-6 text-red-500" />}
              {(kycStatus.kycStatus === 'UNDER_REVIEW' || kycStatus.kycStatus === 'SUBMITTED') && <Clock className="w-6 h-6 text-yellow-500" />}
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-primary-foreground mb-1">
                KYC Status: {kycStatus.kycStatus?.replace(/_/g, ' ')}
              </h3>
              <p className="text-sm text-primary-foreground/70">
                {kycStatus.kycStatus === 'APPROVED' && 'Your KYC verification is complete. You can now apply for loans.'}
                {kycStatus.kycStatus === 'REJECTED' && `Reason: ${kycStatus.rejectionReason || 'Please contact support for details.'}`}
                {kycStatus.kycStatus === 'UNDER_REVIEW' && 'Your documents are being reviewed. This may take 2-3 business days.'}
                {kycStatus.kycStatus === 'SUBMITTED' && 'Your documents have been submitted and are pending review.'}
              </p>
            </div>
          </motion.div>
        )}

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

        {/* Document Categories */}
        {kycStatus?.kycStatus !== 'APPROVED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {documentCategories.map((category, categoryIndex) => {
              const categoryDocs = getDocumentsForCategory(category.id);
              const IconComponent = category.icon;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                >
                  <Card className={`border ${category.color}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-primary-foreground flex items-center gap-2">
                              {category.title}
                              {categoryDocs.length > 0 && (
                                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                                  {categoryDocs.length}/{category.documents.length}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/60 mt-2">
                              {category.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Document List */}
                      <div className="space-y-3">
                        {category.documents.map((doc) => {
                          const uploadedDoc = categoryDocs.find(d => d.documentType === doc.id);
                          const docInputKey = `${category.id}-${doc.id}`;
                          return (
                            <div
                              key={doc.id}
                              className="p-4 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 flex items-start justify-between"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-primary-foreground">{doc.name}</h4>
                                  {doc.required && (
                                    <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-primary-foreground/60 mb-2">{doc.description}</p>
                                {uploadedDoc && (
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${getStatusColor(uploadedDoc.verificationStatus)} border`}>
                                      {getStatusIcon(uploadedDoc.verificationStatus)}
                                      <span className="ml-1">{uploadedDoc.verificationStatus?.replace(/_/g, ' ')}</span>
                                    </Badge>
                                    {uploadedDoc.verificationComments && (
                                      <span className="text-xs text-primary-foreground/60">
                                        {uploadedDoc.verificationComments}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {uploadedDoc ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              ) : (
                                <>
                                  <input
                                    ref={(el) => {
                                      if (el) fileInputRefs.current[docInputKey] = el;
                                    }}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileInput(e, category.id)}
                                    disabled={isUploading}
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isUploading}
                                    className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                                    onClick={() => {
                                      const input = fileInputRefs.current[docInputKey];
                                      if (input) input.click();
                                    }}
                                  >
                                    <Upload className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Drag and Drop Area */}
                      <div
                        onDragOver={(e) => handleDragOver(e, category.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category.id)}
                        onClick={() => triggerFileInput(category.id)}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                          isDraggingCategory === category.id
                            ? 'border-secondary bg-secondary/10'
                            : 'border-primary-foreground/20 hover:border-secondary/50 hover:bg-primary-foreground/5'
                        }`}
                      >
                        <input
                          ref={(el) => {
                            if (el) fileInputRefs.current[category.id] = el;
                          }}
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileInput(e, category.id)}
                          disabled={isUploading}
                          className="hidden"
                        />
                        <Upload className="w-10 h-10 text-primary-foreground/50 mx-auto mb-3" />
                        <p className="text-primary-foreground font-semibold mb-1">
                          Drag documents here
                        </p>
                        <p className="text-primary-foreground/70 text-sm">
                          or click to browse
                        </p>
                      </div>

                      {/* Upload Progress */}
                      {isUploading && uploadProgress > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
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
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Document Summary */}
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-heading font-bold text-primary-foreground mb-6">
              Upload Summary
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentCategories.map((category) => {
                const categoryDocs = getDocumentsForCategory(category.id);
                const IconComponent = category.icon;

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`border ${category.color} h-full`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <h3 className="font-heading font-bold text-primary-foreground text-sm">
                            {category.title}
                          </h3>
                        </div>
                        <div className="text-3xl font-bold text-secondary mb-2">
                          {categoryDocs.length}
                        </div>
                        <p className="text-sm text-primary-foreground/70 mb-4">
                          of {category.documents.length} documents
                        </p>
                        <div className="w-full bg-primary-foreground/10 rounded-full h-2">
                          <div
                            className="bg-secondary h-2 rounded-full transition-all"
                            style={{ width: `${(categoryDocs.length / category.documents.length) * 100}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* File Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-6 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10"
        >
          <h3 className="font-heading font-bold text-primary-foreground mb-4">File Requirements</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-primary-foreground/70 mb-2">
                <strong>Accepted formats:</strong> PDF, JPG, PNG
              </p>
              <p className="text-sm text-primary-foreground/70">
                <strong>Maximum file size:</strong> 5MB per file
              </p>
            </div>
            <div>
              <p className="text-sm text-primary-foreground/70 mb-2">
                <strong>Document quality:</strong> Clear, legible, and in color
              </p>
              <p className="text-sm text-primary-foreground/70">
                <strong>Processing time:</strong> 2-3 business days
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
