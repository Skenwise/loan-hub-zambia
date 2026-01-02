import { useState, useEffect } from 'react';
import { BaseCrudService, EmailService } from '@/services';
import { CustomerProfiles } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, User, Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';
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
      const { items } = await BaseCrudService.getAll<CustomerProfiles>('customers');
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
            <p className="font-paragraph text-base text-primary-foreground/70">
              Manage customer profiles and KYC information
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
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
        </div>

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
