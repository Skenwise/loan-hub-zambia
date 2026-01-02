import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/services';
import { Loans, Repayments, CustomerProfiles } from '@/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { TrendingUp, DollarSign, Calendar, FileText, Download, ArrowRight, CheckCircle2, AlertCircle, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LoanWithDetails extends Loans {
  repayments?: Repayments[];
}

export default function CustomerPortalPage() {
  const { member } = useMember();
  const [customer, setCustomer] = useState<CustomerProfiles | null>(null);
  const [loans, setLoans] = useState<Loans[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('PENDING');

  useEffect(() => {
    loadCustomerData();
  }, [member]);

  const loadCustomerData = async () => {
    try {
      if (!member?.loginEmail) return;

      // Get customer profile
      const { items: customers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      const currentCustomer = customers?.find(c => c.emailAddress === member.loginEmail);

      if (currentCustomer) {
        setCustomer(currentCustomer);
        setKycStatus(currentCustomer.kycVerificationStatus || 'PENDING');

        // Get customer's loans
        const { items: allLoans } = await BaseCrudService.getAll<Loans>('loans');
        const customerLoans = allLoans?.filter(l => l.customerId === currentCustomer._id) || [];
        setLoans(customerLoans);
      }
    } catch (error) {
      console.error('Failed to load customer data:', error);
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
        {/* Welcome Section - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl font-bold mb-2">
                Welcome back, {member?.profile?.nickname || member?.contact?.firstName || 'Borrower'}
              </h1>
              <p className="text-primary-foreground/70 text-lg">
                Your personal loan dashboard. Manage loans, track payments, and access documents.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30 hover:border-secondary/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/60 text-sm font-medium mb-2">Total Loans</p>
                  <p className="text-3xl font-bold text-primary-foreground">{totalLoans}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-secondary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-500/20 to-transparent border-green-500/30 hover:border-green-500/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/60 text-sm font-medium mb-2">Active Loans</p>
                  <p className="text-3xl font-bold text-primary-foreground">{activeLoans}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30 hover:border-secondary/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/60 text-sm font-medium mb-2">Outstanding</p>
                  <p className="text-3xl font-bold text-primary-foreground">${(totalOutstanding / 1000).toFixed(1)}K</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-secondary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-brandaccent/20 to-transparent border-brandaccent/30 hover:border-brandaccent/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-primary-foreground/60 text-sm font-medium mb-2">Next Payment</p>
                  <p className="text-sm font-semibold text-primary-foreground">Due Soon</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-brandaccent/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-brandaccent" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Loans Section - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold text-primary-foreground mb-2">Your Loans</h2>
            <p className="text-primary-foreground/70">Track your active and completed loans</p>
          </div>

          {isLoading ? (
            <Card className="p-12 text-center bg-primary-foreground/5 border-primary-foreground/10">
              <p className="text-primary-foreground/70">Loading your loans...</p>
            </Card>
          ) : loans.length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
              <FileText className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-2">No Active Loans</h3>
              <p className="text-primary-foreground/70 mb-6 max-w-md mx-auto">
                You don't have any loans yet. Apply for a loan to get started and access funds quickly.
              </p>
              <Link to="/customer-portal/apply">
                <Button className="bg-secondary text-primary hover:bg-secondary/90">
                  Apply for Your First Loan
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {loans.map((loan, index) => (
                <motion.div
                  key={loan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                >
                  <Card className="p-6 bg-primary-foreground/5 border-primary-foreground/10 hover:border-secondary/50 transition-all group">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Left Section */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-heading text-xl font-bold text-primary-foreground">
                            {loan.loanNumber}
                          </h3>
                          <Badge className={getStatusColor(loan.loanStatus || '')}>
                            {loan.loanStatus?.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-primary-foreground/60 text-sm mb-4">
                          {loan.loanTermMonths} months • {loan.interestRate}% interest rate
                        </p>

                        {/* Loan Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-primary/40 rounded-lg p-3">
                            <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Principal</p>
                            <p className="font-semibold text-primary-foreground">${loan.principalAmount?.toLocaleString()}</p>
                          </div>
                          <div className="bg-primary/40 rounded-lg p-3">
                            <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Outstanding</p>
                            <p className="font-semibold text-primary-foreground">${loan.outstandingBalance?.toLocaleString()}</p>
                          </div>
                          <div className="bg-primary/40 rounded-lg p-3">
                            <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Disbursed</p>
                            <p className="font-semibold text-primary-foreground">
                              {loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-primary/40 rounded-lg p-3">
                            <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Next Payment</p>
                            <p className="font-semibold text-primary-foreground">
                              {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col gap-2 lg:w-auto">
                        <Link to={`/customer-portal/loans/${loan._id}`}>
                          <Button
                            variant="outline"
                            className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                          >
                            View Details
                          </Button>
                        </Link>
                        {loan.loanStatus === 'disbursed' && (
                          <Button className="w-full bg-secondary text-primary hover:bg-secondary/90">
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

        {/* Quick Actions - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <Link to="/customer-portal/apply" className="group">
            <Card className="p-8 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30 hover:border-secondary/50 transition-all h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center group-hover:bg-secondary/40 transition-all">
                  <ArrowRight className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">Apply for Loan</h3>
              <p className="text-primary-foreground/70 text-sm mb-4">
                Need more funds? Apply for a new loan in minutes with our simple process.
              </p>
              <div className="text-secondary font-semibold text-sm flex items-center gap-2">
                Start Now <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          </Link>

          <Card className="p-8 bg-gradient-to-br from-brandaccent/20 to-transparent border-brandaccent/30 hover:border-brandaccent/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-brandaccent/30 flex items-center justify-center">
                <Download className="w-6 h-6 text-brandaccent" />
              </div>
            </div>
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">Download Statements</h3>
            <p className="text-primary-foreground/70 text-sm mb-4">
              Get your loan statements and payment history in PDF format for your records.
            </p>
            <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 w-full">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-brandaccent/20 to-transparent border-brandaccent/30 hover:border-brandaccent/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-brandaccent/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-brandaccent" />
              </div>
            </div>
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">KYC Verification</h3>
            <p className="text-primary-foreground/70 text-sm mb-4">
              {kycStatus === 'APPROVED'
                ? 'Your identity has been verified. You can apply for loans.'
                : 'Upload your documents to complete KYC verification.'}
            </p>
            <Link to="/customer-portal/kyc">
              <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 w-full">
                {kycStatus === 'APPROVED' ? 'View Documents' : 'Upload Documents'}
              </Button>
            </Link>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
