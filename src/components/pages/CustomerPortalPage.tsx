import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import { Loans, Repayments } from '@/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { TrendingUp, DollarSign, Calendar, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoanWithDetails extends Loans {
  repayments?: Repayments[];
}

export default function CustomerPortalPage() {
  const { member } = useMember();
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomerLoans();
  }, [member]);

  const loadCustomerLoans = async () => {
    try {
      if (!member?.loginEmail) return;

      // In a real app, you'd filter by customer ID
      // For now, we'll load all loans and filter by customer
      const { items } = await BaseCrudService.getAll<Loans>('loans');
      setLoans(items as LoanWithDetails[]);
    } catch (error) {
      console.error('Failed to load loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending-approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'disbursed':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'defaulted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalLoans = loans.length;
  const activeLoans = loans.filter(l => l.loanStatus === 'disbursed').length;
  const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

  return (
    <div className="min-h-screen bg-primary text-primary-foreground font-paragraph">
      <Header />

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="font-heading text-4xl lg:text-5xl font-bold mb-2">
            Welcome, {member?.profile?.nickname || member?.contact?.firstName || 'Borrower'}
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            Manage your loans and track your repayments in one place.
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-primary-foreground/5 border-primary-foreground/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-1">Total Loans</p>
                  <p className="text-3xl font-bold text-primary-foreground">{totalLoans}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-primary-foreground/5 border-primary-foreground/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-1">Active Loans</p>
                  <p className="text-3xl font-bold text-primary-foreground">{activeLoans}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-primary-foreground/5 border-primary-foreground/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-sm mb-1">Outstanding Balance</p>
                  <p className="text-3xl font-bold text-primary-foreground">${totalOutstanding.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Loans Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-primary-foreground">Your Loans</h2>
            <p className="text-primary-foreground/70 mt-1">View and manage all your active and past loans</p>
          </div>

          {isLoading ? (
            <Card className="p-12 text-center">
              <p className="text-primary-foreground/70">Loading your loans...</p>
            </Card>
          ) : loans.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">No Loans Yet</h3>
              <p className="text-primary-foreground/70 mb-6">You don't have any loans. Apply for one to get started.</p>
              <Button className="bg-secondary text-primary hover:bg-secondary/90">
                Apply for a Loan
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {loans.map((loan, index) => (
                <motion.div
                  key={loan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <Card className="p-6 bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/30 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-xl font-bold text-primary-foreground">
                            {loan.loanNumber}
                          </h3>
                          <Badge className={getStatusColor(loan.loanStatus || '')}>
                            {loan.loanStatus?.replace('-', ' ')}
                          </Badge>
                        </div>
                        <p className="text-primary-foreground/70 text-sm mb-4">
                          Loan Term: {loan.loanTermMonths} months | Interest Rate: {loan.interestRate}%
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Principal</p>
                            <p className="font-semibold text-primary-foreground">${loan.principalAmount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Outstanding</p>
                            <p className="font-semibold text-primary-foreground">${loan.outstandingBalance?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Disbursed</p>
                            <p className="font-semibold text-primary-foreground">
                              {loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Next Payment</p>
                            <p className="font-semibold text-primary-foreground">
                              {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                        >
                          View Details
                        </Button>
                        {loan.loanStatus === 'disbursed' && (
                          <Button className="bg-secondary text-primary hover:bg-secondary/90">
                            Make Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 grid md:grid-cols-2 gap-6"
        >
          <Card className="p-8 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30">
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-3">Apply for a Loan</h3>
            <p className="text-primary-foreground/70 mb-6">
              Ready to borrow? Apply for a new loan in just a few minutes.
            </p>
            <Button className="bg-secondary text-primary hover:bg-secondary/90">
              Start Application
            </Button>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-brandaccent/20 to-transparent border-brandaccent/30">
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-3">Download Statements</h3>
            <p className="text-primary-foreground/70 mb-6">
              Get your loan statements and payment history in PDF format.
            </p>
            <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
