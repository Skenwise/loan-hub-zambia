import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Repayments, Loans } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function RepaymentsPage() {
  const [repayments, setRepayments] = useState<Repayments[]>([]);
  const [loans, setLoans] = useState<Loans[]>([]);
  const [filteredRepayments, setFilteredRepayments] = useState<Repayments[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    transactionReference: '',
    loanId: '',
    repaymentDate: new Date().toISOString().split('T')[0],
    totalAmountPaid: 0,
    principalAmount: 0,
    interestAmount: 0,
    paymentMethod: 'Bank Transfer'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = repayments.filter(repayment =>
      repayment.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repayment.loanId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRepayments(filtered);
  }, [searchTerm, repayments]);

  const loadData = async () => {
    try {
      const [repaymentsData, loansData] = await Promise.all([
        BaseCrudService.getAll<Repayments>('repayments'),
        BaseCrudService.getAll<Loans>('loans')
      ]);
      setRepayments(repaymentsData.items);
      setLoans(loansData.items);
      setFilteredRepayments(repaymentsData.items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await BaseCrudService.create('repayments', {
        _id: crypto.randomUUID(),
        ...formData
      });

      const loan = loans.find(l => l._id === formData.loanId);
      if (loan) {
        const newBalance = (loan.outstandingBalance || 0) - formData.principalAmount;
        await BaseCrudService.update<Loans>('loans', {
          _id: loan._id,
          outstandingBalance: Math.max(0, newBalance),
          loanStatus: newBalance <= 0 ? 'Closed' : loan.loanStatus
        });
      }

      await loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving repayment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      transactionReference: '',
      loanId: '',
      repaymentDate: new Date().toISOString().split('T')[0],
      totalAmountPaid: 0,
      principalAmount: 0,
      interestAmount: 0,
      paymentMethod: 'Bank Transfer'
    });
  };

  const handleLoanChange = (loanId: string) => {
    setFormData({ ...formData, loanId });
    const loan = loans.find(l => l._id === loanId);
    if (loan && loan.interestRate) {
      const monthlyInterest = (loan.outstandingBalance || 0) * (loan.interestRate / 100 / 12);
      setFormData(prev => ({
        ...prev,
        loanId,
        interestAmount: parseFloat(monthlyInterest.toFixed(2))
      }));
    }
  };

  useEffect(() => {
    const total = formData.principalAmount + formData.interestAmount;
    setFormData(prev => ({ ...prev, totalAmountPaid: parseFloat(total.toFixed(2)) }));
  }, [formData.principalAmount, formData.interestAmount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-paragraph text-primary-foreground/70">Loading repayments...</p>
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
              Repayment Processing
            </h1>
            <p className="font-paragraph text-base text-primary-foreground/70">
              Record and manage loan repayments with automatic balance updates
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90">
                <Plus className="w-4 h-4 mr-2" />
                Record Repayment
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-primary border-primary-foreground/20 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-secondary">
                  Record New Repayment
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="transactionReference" className="text-primary-foreground">Transaction Reference</Label>
                  <Input
                    id="transactionReference"
                    value={formData.transactionReference}
                    onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                    className="bg-primary border-primary-foreground/20 text-primary-foreground"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="loanId" className="text-primary-foreground">Loan</Label>
                  <select
                    id="loanId"
                    value={formData.loanId}
                    onChange={(e) => handleLoanChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-primary border border-primary-foreground/20 text-primary-foreground"
                    required
                  >
                    <option value="">Select Loan</option>
                    {loans.filter(l => l.loanStatus === 'Active').map(loan => (
                      <option key={loan._id} value={loan._id}>
                        {loan.loanNumber} - Outstanding: ZMW {loan.outstandingBalance?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="repaymentDate" className="text-primary-foreground">Repayment Date</Label>
                    <Input
                      id="repaymentDate"
                      type="date"
                      value={formData.repaymentDate}
                      onChange={(e) => setFormData({ ...formData, repaymentDate: e.target.value })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod" className="text-primary-foreground">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-primary border border-primary-foreground/20 text-primary-foreground"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="principalAmount" className="text-primary-foreground">Principal Amount (ZMW)</Label>
                    <Input
                      id="principalAmount"
                      type="number"
                      step="0.01"
                      value={formData.principalAmount}
                      onChange={(e) => setFormData({ ...formData, principalAmount: parseFloat(e.target.value) || 0 })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="interestAmount" className="text-primary-foreground">Interest Amount (ZMW)</Label>
                    <Input
                      id="interestAmount"
                      type="number"
                      step="0.01"
                      value={formData.interestAmount}
                      onChange={(e) => setFormData({ ...formData, interestAmount: parseFloat(e.target.value) || 0 })}
                      className="bg-primary border-primary-foreground/20 text-primary-foreground"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="totalAmountPaid" className="text-primary-foreground">Total Amount Paid (ZMW)</Label>
                  <Input
                    id="totalAmountPaid"
                    type="number"
                    step="0.01"
                    value={formData.totalAmountPaid}
                    readOnly
                    className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90">
                    Record Repayment
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
                placeholder="Search by transaction reference or loan ID..."
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
              All Repayments ({filteredRepayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRepayments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                <p className="font-paragraph text-primary-foreground/60">No repayments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary-foreground/10">
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Transaction Ref</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Loan ID</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Date</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Principal</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Interest</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Total Paid</th>
                      <th className="text-left py-3 px-4 font-paragraph text-sm text-primary-foreground/70">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRepayments.map((repayment) => (
                      <tr key={repayment._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{repayment.transactionReference}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{repayment.loanId}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">
                          {repayment.repaymentDate ? format(new Date(repayment.repaymentDate), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">ZMW {repayment.principalAmount?.toLocaleString()}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">ZMW {repayment.interestAmount?.toLocaleString()}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-secondary font-semibold">ZMW {repayment.totalAmountPaid?.toLocaleString()}</td>
                        <td className="py-3 px-4 font-paragraph text-sm text-primary-foreground">{repayment.paymentMethod}</td>
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
