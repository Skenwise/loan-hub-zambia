/**
 * KYC Configuration Page
 * Admin interface to configure mandatory KYC documents per loan product and customer type
 */

import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/services';
import { KYCDocumentConfiguration, LoanProducts } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { motion } from 'framer-motion';

// Using KYCDocumentConfiguration entity directly instead of local interface

const DOCUMENT_CATEGORIES = [
  { id: 'CORE_MANDATORY', name: 'Core/Mandatory KYC Documents' },
  { id: 'INCOME_AFFORDABILITY', name: 'Income & Affordability Documents' },
  { id: 'GUARANTOR', name: 'Guarantor Documents' },
  { id: 'COLLATERAL', name: 'Collateral-Related Documents' },
  { id: 'COMPLIANCE', name: 'Compliance & Declarations' },
  { id: 'OPTIONAL_ENHANCED', name: 'Optional/Enhanced Due Diligence' }
];

const DOCUMENT_TYPES = [
  { id: 'IDENTITY_VERIFICATION', name: 'Identity Verification', category: 'CORE_MANDATORY' },
  { id: 'PROOF_OF_RESIDENCE', name: 'Proof of Residence', category: 'CORE_MANDATORY' },
  { id: 'CUSTOMER_PHOTOGRAPH', name: 'Customer Photograph', category: 'CORE_MANDATORY' },
  { id: 'EMPLOYMENT_LETTER', name: 'Employment Letter', category: 'INCOME_AFFORDABILITY' },
  { id: 'PAY_SLIP', name: 'Pay Slip', category: 'INCOME_AFFORDABILITY' },
  { id: 'TAX_RETURN', name: 'Tax Return', category: 'INCOME_AFFORDABILITY' },
  { id: 'BUSINESS_STATEMENT', name: 'Business Statement', category: 'INCOME_AFFORDABILITY' },
  { id: 'BANK_STATEMENT', name: 'Bank Statement', category: 'INCOME_AFFORDABILITY' },
  { id: 'GUARANTOR_ID', name: 'Guarantor Identity', category: 'GUARANTOR' },
  { id: 'GUARANTOR_RESIDENCE', name: 'Guarantor Residence Proof', category: 'GUARANTOR' },
  { id: 'GUARANTOR_INCOME', name: 'Guarantor Income Proof', category: 'GUARANTOR' },
  { id: 'GUARANTOR_CONSENT', name: 'Guarantor Consent', category: 'GUARANTOR' },
  { id: 'PROPERTY_DEED', name: 'Property Deed', category: 'COLLATERAL' },
  { id: 'PROPERTY_VALUATION', name: 'Property Valuation', category: 'COLLATERAL' },
  { id: 'INSURANCE_POLICY', name: 'Insurance Policy', category: 'COLLATERAL' },
  { id: 'COLLATERAL_PHOTOS', name: 'Collateral Photos', category: 'COLLATERAL' },
  { id: 'KYC_DECLARATION', name: 'KYC Declaration', category: 'COMPLIANCE' },
  { id: 'ANTI_MONEY_LAUNDERING', name: 'Anti-Money Laundering Declaration', category: 'COMPLIANCE' },
  { id: 'PEP_DECLARATION', name: 'PEP Declaration', category: 'COMPLIANCE' },
  { id: 'CREDIT_REPORT', name: 'Credit Report', category: 'OPTIONAL_ENHANCED' },
  { id: 'REFERENCE_LETTER', name: 'Reference Letter', category: 'OPTIONAL_ENHANCED' },
  { id: 'ADDITIONAL_DOCS', name: 'Additional Documents', category: 'OPTIONAL_ENHANCED' }
];

const CUSTOMER_TYPES = [
  { id: 'INDIVIDUAL', name: 'Individual' },
  { id: 'EMPLOYED', name: 'Employed Individual' },
  { id: 'SELF_EMPLOYED', name: 'Self-Employed' },
  { id: 'CORPORATE', name: 'Corporate' },
  { id: 'PARTNERSHIP', name: 'Partnership' }
];

export default function KYCConfigurationPage() {
  const [configurations, setConfigurations] = useState<KYCDocumentConfiguration[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    loanProductId: '',
    customerType: '',
    documentCategory: '',
    documentType: '',
    isMandatory: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load configurations
      const { items: configs } = await BaseCrudService.getAll<KYCDocumentConfiguration>('kycdocumentconfiguration');
      setConfigurations(configs || []);

      // Load loan products
      const { items: products } = await BaseCrudService.getAll<LoanProducts>('loanproducts');
      setLoanProducts(products || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setErrorMessage('Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddConfiguration = async () => {
    if (!formData.loanProductId || !formData.customerType || !formData.documentType) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      const newConfig: KYCDocumentConfiguration = {
        _id: crypto.randomUUID(),
        loanProductId: formData.loanProductId,
        customerType: formData.customerType,
        documentCategory: formData.documentCategory,
        documentType: formData.documentType,
        isMandatory: formData.isMandatory
      };

      await BaseCrudService.create('kycdocumentconfiguration', newConfig);
      setSuccessMessage('Configuration added successfully');
      setFormData({
        loanProductId: '',
        customerType: '',
        documentCategory: '',
        documentType: '',
        isMandatory: false
      });
      setIsAdding(false);
      await loadData();
    } catch (error) {
      console.error('Error adding configuration:', error);
      setErrorMessage('Failed to add configuration');
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    try {
      await BaseCrudService.delete('kycdocumentconfiguration', id);
      setSuccessMessage('Configuration deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setErrorMessage('Failed to delete configuration');
    }
  };

  const handleDocumentTypeChange = (value: string) => {
    const docType = DOCUMENT_TYPES.find(dt => dt.id === value);
    setFormData({
      ...formData,
      documentType: value,
      documentCategory: docType?.category || ''
    });
  };

  const getProductName = (productId: string) => {
    return loanProducts.find(p => p._id === productId)?.productName || productId;
  };

  const getDocumentTypeName = (typeId: string) => {
    return DOCUMENT_TYPES.find(dt => dt.id === typeId)?.name || typeId;
  };

  const getCustomerTypeName = (typeId: string) => {
    return CUSTOMER_TYPES.find(ct => ct.id === typeId)?.name || typeId;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground font-paragraph">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/10 animate-spin mx-auto mb-4" />
            <p className="text-primary-foreground/70">Loading configurations...</p>
          </div>
        </div>
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
            KYC Configuration
          </h1>
          <p className="text-primary-foreground/70">
            Configure mandatory KYC documents for each loan product and customer type.
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

        {/* Add Configuration Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-primary-foreground/5 border-primary-foreground/10">
              <CardHeader>
                <CardTitle className="text-primary-foreground">Add New Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-primary-foreground mb-2">
                      Loan Product *
                    </label>
                    <select
                      value={formData.loanProductId}
                      onChange={(e) => setFormData({ ...formData, loanProductId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground"
                    >
                      <option value="">Select a loan product</option>
                      {loanProducts.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-primary-foreground mb-2">
                      Customer Type *
                    </label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground"
                    >
                      <option value="">Select customer type</option>
                      {CUSTOMER_TYPES.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-primary-foreground mb-2">
                      Document Type *
                    </label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => handleDocumentTypeChange(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground"
                    >
                      <option value="">Select document type</option>
                      {DOCUMENT_TYPES.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isMandatory"
                      checked={formData.isMandatory}
                      onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isMandatory" className="text-sm font-semibold text-primary-foreground">
                      Mark as Mandatory
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddConfiguration}
                    className="bg-secondary text-primary hover:bg-secondary/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </Button>
                  <Button
                    onClick={() => setIsAdding(false)}
                    variant="outline"
                    className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Add Button */}
        {!isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-secondary text-primary hover:bg-secondary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Configuration
            </Button>
          </motion.div>
        )}

        {/* Configurations List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-heading font-bold text-primary-foreground mb-6">
            Current Configurations
          </h2>

          {configurations.length === 0 ? (
            <Card className="bg-primary-foreground/5 border-primary-foreground/10">
              <CardContent className="p-12 text-center">
                <p className="text-primary-foreground/70">No configurations yet. Add one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {configurations.map((config, index) => (
                <motion.div
                  key={config._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-heading font-bold text-primary-foreground">
                              {getProductName(config.loanProductId)}
                            </h3>
                            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                              {getCustomerTypeName(config.customerType)}
                            </Badge>
                            {config.isMandatory && (
                              <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
                                Mandatory
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-primary-foreground/70 mb-2">
                            Document: <strong>{getDocumentTypeName(config.documentType)}</strong>
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDeleteConfiguration(config._id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
