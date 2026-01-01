import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, CustomerProfiles, LoanProducts } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loans[]>([]);
  const [customers, setCustomers] = useState<CustomerProfiles[]>([]);
  const [products, setProducts] = useState<LoanProducts[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loans[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loans | null>(null);

  const [formData, setFormData] = useState({
    loanNumber: '',
    customerId: '',
    loanProductId: '',
    disbursementDate: '',
    principalAmount: 0,
    outstandingBalance: 0,
    loanStatus: 'Pending',
    nextPaymentDate: '',
    interestRate: 0,
    loanTermMonths: 12,
    closureDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = loans.filter(loan =>
      loan.loanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.loanStatus?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLoans(filtered);
  }, [searchTerm, loans]);

  const loadData = async () => {
    try {
      const [loansData, customersData, productsData] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<CustomerProfiles>('customers'),
        BaseCrudService.getAll<LoanProducts>('loanproducts')
      ]);
      setLoans(loansData.items);
      setCustomers(customersData.items);
      setProducts(productsData.items);
      setFilteredLoans(loansData.items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLoan) {
        await BaseCrudService.update<Loans>('loans', {
          _id: editingLoan._id,
          ...formData
        });
      } else {
        await BaseCrudService.create('loans', {
          _id: crypto.randomUUID(),
          ...formData,
          outstandingBalance: formData.principalAmount
        });
      }
      await loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      loanNumber: '',
      customerId: '',
      loanProductId: '',
      disbursementDate: '',
      principalAmount: 0,
      outstandingBalance: 0,
      loanStatus: 'Pending',
      nextPaymentDate: '',
      interestRate: 0,
      loanTermMonths: 12,
      closureDate: ''
    });
    setEditingLoan(null);
  };

  const handleEdit = (loan: Loans) => {
    setEditingLoan(loan);
    setFormData({
      loanNumber: loan.loanNumber || '',
      customerId: loan.customerId || '',
      loanProductId: loan.loanProductId || '',
      disbursementDate: loan.disbursementDate ? new Date(loan.disbursementDate).toISOString().split('T')[0] : '',
      principalAmount: loan.principalAmount || 0,
      outstandingBalance: loan.outstandingBalance || 0,
      loanStatus: loan.loanStatus || 'Pending',
      nextPaymentDate: loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toISOString().split('T')[0] : '',
      interestRate: loan.interestRate || 0,
      loanTermMonths: loan.loanTermMonths || 12,
      closureDate: loan.closureDate ? new Date(loan.closureDate).toISOString().split('T')[0] : ''
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-paragraph text-primary-foreground/70">Loading loans...</p>
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
              Loan Management
            </h1>
            <p className="font-paragraph text-base text-primary-foreground/70">
              Track and manage loan lifecycle from origination to closure
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-primary border-primary-foreground/20 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-secondary">
                  {editingLoan ? 'Edit Loan' : 'Create New Loan'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="loanNumber" className="text-primary-foreground">Loan Number</Label>
                  <Input
                    id="loanNumber"
                    value={formData.loanNumber}
                    onChange={(e) => setFormData({ ...formData, loanNumber: e.target.value })}
                    className="bg-primary border-primary-foreground/20 text-primary-foreground"
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerId" className="text-primary-foreground">Customer</Label>
                    <select
                      id="customerId"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-primary border border-primary-foreground/20 text-primary-foreground"
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                          {customer.firstName} {customer.lastName} - {customer.nationalIdNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="loanProductId" className="text-primary-foreground">Loan Product</Label>
                    <select
                      id="loanProductId"
                      value={formData.loanProductId}
                      onChange={(e) => setFormData({ ...formData, loanProductId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-primary border border-primary-foreground/20 text-primary-foreground"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="principalAmount" className="text-primary-foreground">Principal Amount (ZMW)</Label>
                    <Input
                      id="principalAmount"
                      type="number"
                      value={formData.principalAmount}
                      onChange={(e) => setFormData({ ...formData, principalAmount: parseFloat(e.target.value) || 0 })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="interestRate" className="text-primary-foreground">Interest Rate (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loanTermMonths" className="text-primary-foreground">Loan Term (Months)</Label>
                    <Input
                      id="loanTermMonths"
                      type="number"
                      value={formData.loanTermMonths}
                      onChange={(e) => setFormData({ ...formData, loanTermMonths: parseInt(e.target.value) || 12 })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="loanStatus" className="text-primary-foreground">Loan Status</Label>
                    <select
                      id="loanStatus"
                      value={formData.loanStatus}
                      onChange={(e) => setFormData({ ...formData, loanStatus: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-primary border border-primary-foreground/20 text-primary-foreground"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Active">Active</option>
                      <option value="Closed">Closed</option>
                      <option value="Defaulted">Defaulted</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="disbursementDate" className="text-primary-foreground">Disbursement Date</Label>
                    <Input
                      id="disbursementDate"
                      type="date"
                      value={formData.disbursementDate}
                      onChange={(e) => setFormData({ ...formData, disbursementDate: e.target.value })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextPaymentDate" className="text-primary-foreground">Next Payment Date</Label>
                    <Input
                      id="nextPaymentDate"
                      type="date"
                      value={formData.nextPaymentDate}
                      onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                </div>
                {editingLoan && (
                  <div>
                    <Label htmlFor="outstandingBalance" className="text-primary-foreground">Outstanding Balance (ZMW)</Label>
                    <Input
                      id="outstandingBalance"
                      type="number"
                      value={formData.outstandingBalance}
                      onChange={(e) => setFormData({ ...formData, outstandingBalance: parseFloat(e.target.value) || 0 })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90">
                    {editingLoan ? 'Update Loan' : 'Create Loan'}
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
                placeholder="Search by loan number, customer ID, or status..."
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
              All Loans ({filteredLoans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLoans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                <p className="font-paragraph text-primary-foreground/60">No loans found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary-foreground/10">
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Loan Number</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Customer ID</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Principal</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Outstanding</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Interest Rate</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Status</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Disbursement</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan) => (
                      <tr key={loan._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{loan.loanNumber}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{loan.customerId}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">ZMW {loan.principalAmount?.toLocaleString()}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">ZMW {loan.outstandingBalance?.toLocaleString()}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{loan.interestRate}%</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-paragraph ${
                            loan.loanStatus === 'Active' ? 'bg-secondary/20 text-secondary' :
                            loan.loanStatus === 'Closed' ? 'bg-primary-foreground/20 text-primary-foreground' :
                            loan.loanStatus === 'Defaulted' ? 'bg-destructive/20 text-destructive' :
                            'bg-brandaccent/20 text-brandaccent'
                          }`}>
                            {loan.loanStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">
                          {loan.disbursementDate ? format(new Date(loan.disbursementDate), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(loan)}
                            className="text-secondary hover:text-secondary/80"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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

      <Footer />
    </div>
  );
}
