import { useState, useEffect } from 'react';
import { BaseCrudService, EmailService, CustomerService } from '@/services';
import { CustomerProfiles } from '@/entities';
import { useOrganisationStore } from '@/store/organisationStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, User, Mail, CheckCircle2, AlertCircle, Send, Upload, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import SendCustomerInvitationModal from '@/components/SendCustomerInvitationModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfiles[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerProfiles[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfiles | null>(null);
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [selectedCustomerForInvite, setSelectedCustomerForInvite] = useState<CustomerProfiles | null>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string;
  }>({ type: null, message: '' });
  const [previewData, setPreviewData] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalIdNumber: '',
    phoneNumber: '',
    emailAddress: '',
    residentialAddress: '',
    dateOfBirth: '',
    kycVerificationStatus: 'Pending',
    creditScore: 0
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.nationalIdNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      const organisationStore = useOrganisationStore.getState();
      const organisationId = organisationStore.organisationId;
      
      // Use organization-scoped customer service
      const items = await CustomerService.getOrganisationCustomers(organisationId || undefined);
      setCustomers(items);
      setFilteredCustomers(items);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        // Update existing customer
        await BaseCrudService.update<CustomerProfiles>('customers', {
          _id: editingCustomer._id,
          ...formData
        });
      } else {
        // Create new customer
        const customerId = crypto.randomUUID();
        const temporaryPassword = generateTemporaryPassword();
        
        await BaseCrudService.create<CustomerProfiles>('customers', {
          _id: customerId,
          ...formData,
          kycVerificationStatus: 'PENDING',
          organisationId: 'demo-org-001',
        });

        // Send invitation email
        await EmailService.sendCustomerInvite(
          formData.emailAddress,
          formData.firstName,
          temporaryPassword
        );

        console.log(`✅ Customer created and invitation sent to ${formData.emailAddress}`);
      }
      await loadCustomers();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const generateTemporaryPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      nationalIdNumber: '',
      phoneNumber: '',
      emailAddress: '',
      residentialAddress: '',
      dateOfBirth: '',
      kycVerificationStatus: 'Pending',
      creditScore: 0
    });
    setEditingCustomer(null);
  };

  const handleEdit = (customer: CustomerProfiles) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      nationalIdNumber: customer.nationalIdNumber || '',
      phoneNumber: customer.phoneNumber || '',
      emailAddress: customer.emailAddress || '',
      residentialAddress: customer.residentialAddress || '',
      dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().split('T')[0] : '',
      kycVerificationStatus: customer.kycVerificationStatus || 'Pending',
      creditScore: customer.creditScore || 0
    });
    setIsDialogOpen(true);
  };

  const handleSendInvitation = (customer: CustomerProfiles) => {
    setSelectedCustomerForInvite(customer);
    setInvitationModalOpen(true);
  };

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

  const handleBulkUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvContent = event.target?.result as string;
          const lines = csvContent.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          const dataRows = lines.slice(1);

          let successCount = 0;
          let errorCount = 0;

          for (const line of dataRows) {
            if (!line.trim()) continue;

            try {
              const values = line.split(',').map(v => v.trim());
              const customerData: any = {};
              
              headers.forEach((header, index) => {
                customerData[header] = values[index] || '';
              });

              const customerId = crypto.randomUUID();
              const temporaryPassword = generateTemporaryPassword();

              await BaseCrudService.create<CustomerProfiles>('customers', {
                _id: customerId,
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                nationalIdNumber: customerData.nationalIdNumber,
                phoneNumber: customerData.phoneNumber,
                emailAddress: customerData.emailAddress,
                residentialAddress: customerData.residentialAddress,
                dateOfBirth: customerData.dateOfBirth,
                kycVerificationStatus: customerData.kycVerificationStatus || 'PENDING',
                creditScore: parseInt(customerData.creditScore) || 0,
                organisationId: 'demo-org-001',
              });

              // Send invitation email
              if (customerData.emailAddress) {
                await EmailService.sendCustomerInvite(
                  customerData.emailAddress,
                  customerData.firstName,
                  temporaryPassword
                );
              }

              successCount++;
            } catch (error) {
              console.error('Error creating customer from row:', error);
              errorCount++;
            }
          }

          setUploadStatus({
            type: 'success',
            message: `Bulk upload completed! ${successCount} customers created successfully.`,
            details: errorCount > 0 ? `${errorCount} rows failed to process.` : undefined,
          });

          await loadCustomers();
          setFile(null);
          setPreviewData([]);
        } catch (error) {
          setUploadStatus({
            type: 'error',
            message: 'Failed to process bulk upload',
            details: (error as Error).message,
          });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Failed to read file',
      });
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-paragraph text-primary-foreground/70">Loading customers...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-12">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-heading text-4xl font-bold text-secondary mb-2">
              Customer Management
            </h1>
            <p className="font-paragraph text-base text-primary-foreground">
              Manage customer profiles and KYC information
            </p>
          </div>
          
          {/* Add Customer / Bulk Upload Options */}
          <div className="relative">
            <Button 
              onClick={() => setShowAddOptions(!showAddOptions)}
              className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Button>
            
            {showAddOptions && (
              <div className="absolute right-0 mt-2 w-56 bg-primary border border-primary-foreground/20 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setShowAddOptions(false);
                    setEditingCustomer(null);
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-primary-foreground hover:bg-primary-foreground/10 first:rounded-t-lg flex items-center gap-2"
                >
                  <User size={16} />
                  Create Single Customer
                </button>
                <button
                  onClick={() => {
                    setShowAddOptions(false);
                    setFile(null);
                    setPreviewData([]);
                    setUploadStatus({ type: null, message: '' });
                    document.getElementById('bulk-upload-input')?.click();
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-primary-foreground hover:bg-primary-foreground/10 last:rounded-b-lg flex items-center gap-2"
                >
                  <Upload size={16} />
                  Bulk Upload Customers
                </button>
              </div>
            )}
          </div>

          {/* Hidden file input for bulk upload */}
          <input
            id="bulk-upload-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Bulk Upload Section */}
        {file && (
          <Card className="bg-primary border-primary-foreground/10 mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-secondary">
                Bulk Upload Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadStatus.type && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                  uploadStatus.type === 'success' 
                    ? 'bg-secondary/20 border border-secondary/30' 
                    : 'bg-destructive/20 border border-destructive/30'
                }`}>
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-paragraph text-sm ${
                      uploadStatus.type === 'success' ? 'text-secondary' : 'text-destructive'
                    }`}>
                      {uploadStatus.message}
                    </p>
                    {uploadStatus.details && (
                      <p className="font-paragraph text-xs text-primary-foreground/60 mt-1">
                        {uploadStatus.details}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {previewData.length > 0 && (
                <div>
                  <p className="font-paragraph text-sm text-primary-foreground/70 mb-3">
                    Preview of first {previewData.length} rows:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-primary-foreground/10">
                          <th className="text-left py-2 px-3 font-paragraph text-xs text-primary-foreground/70">First Name</th>
                          <th className="text-left py-2 px-3 font-paragraph text-xs text-primary-foreground/70">Last Name</th>
                          <th className="text-left py-2 px-3 font-paragraph text-xs text-primary-foreground/70">Email</th>
                          <th className="text-left py-2 px-3 font-paragraph text-xs text-primary-foreground/70">Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="border-b border-primary-foreground/5">
                            <td className="py-2 px-3 font-paragraph text-xs text-primary-foreground">{row.firstName}</td>
                            <td className="py-2 px-3 font-paragraph text-xs text-primary-foreground">{row.lastName}</td>
                            <td className="py-2 px-3 font-paragraph text-xs text-primary-foreground">{row.emailAddress}</td>
                            <td className="py-2 px-3 font-paragraph text-xs text-primary-foreground">{row.phoneNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleBulkUpload}
                  disabled={uploading || !file}
                  className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setUploadStatus({ type: null, message: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>

              <div className="pt-4 border-t border-primary-foreground/10">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Single Customer Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="bg-primary border-primary-foreground/20 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-secondary">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-primary-foreground">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-primary border-primary-foreground/20 text-primary-foreground"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-primary-foreground">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-primary border-primary-foreground/20 text-primary-foreground"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="nationalIdNumber" className="text-primary-foreground">National ID Number</Label>
                <Input
                  id="nationalIdNumber"
                  value={formData.nationalIdNumber}
                  onChange={(e) => setFormData({ ...formData, nationalIdNumber: e.target.value })}
                  className="bg-primary border-primary-foreground/20 text-primary-foreground"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber" className="text-primary-foreground">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="bg-primary border-primary-foreground/20 text-primary-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="emailAddress" className="text-primary-foreground">Email Address</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                    className="bg-primary border-primary-foreground/20 text-primary-foreground"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="residentialAddress" className="text-primary-foreground">Residential Address</Label>
                <Input
                  id="residentialAddress"
                  value={formData.residentialAddress}
                  onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                  className="bg-primary border-primary-foreground/20 text-primary-foreground"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth" className="text-primary-foreground">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="bg-primary border-primary-foreground/20 text-primary-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="creditScore" className="text-primary-foreground">Credit Score</Label>
                  <Input
                    id="creditScore"
                    type="number"
                    value={formData.creditScore}
                    onChange={(e) => setFormData({ ...formData, creditScore: parseInt(e.target.value) || 0 })}
                    className="bg-primary border-primary-foreground/20 text-primary-foreground"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="kycStatus" className="text-primary-foreground">KYC Status</Label>
                <select
                  id="kycStatus"
                  value={formData.kycVerificationStatus}
                  onChange={(e) => setFormData({ ...formData, kycVerificationStatus: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-primary border border-primary-foreground/20 text-primary-foreground"
                >
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90">
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="bg-primary border-primary-foreground/10 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-foreground/40" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-primary border-primary-foreground/20 text-primary-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary border-primary-foreground/10">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-secondary">
              All Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                <p className="font-paragraph text-primary-foreground/60">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary-foreground/10">
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Name</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">National ID</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Email</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Phone</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Credit Score</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">KYC Status</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">
                          {customer.firstName} {customer.lastName}
                        </td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{customer.nationalIdNumber}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{customer.emailAddress}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{customer.phoneNumber}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{customer.creditScore}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                            customer.kycVerificationStatus === 'Verified' ? 'bg-secondary/20 text-secondary' :
                            customer.kycVerificationStatus === 'Rejected' ? 'bg-destructive/20 text-destructive' :
                            'bg-primary-foreground/20 text-primary-foreground'
                          }`}>
                            {customer.kycVerificationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(customer)}
                              className="text-secondary hover:text-secondary/80"
                              title="Edit customer"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendInvitation(customer)}
                              className="text-buttonbackground hover:text-buttonbackground/80"
                              title="Send portal invitation"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <SendCustomerInvitationModal
        isOpen={invitationModalOpen}
        onClose={() => {
          setInvitationModalOpen(false);
          setSelectedCustomerForInvite(null);
        }}
        customer={selectedCustomerForInvite}
        onSuccess={() => loadCustomers()}
      />

      <Footer />
    </div>
  );
}
