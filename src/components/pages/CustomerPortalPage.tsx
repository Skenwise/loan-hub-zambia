import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { BaseCrudService } from '@/services';
import { Loans, Repayments, CustomerProfiles, Organizations } from '@/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PaymentModal from '@/components/PaymentModal';
import { useCurrencyStore } from '@/store/currencyStore';
import { useOrganisationStore } from '@/store/organisationStore';
import { TrendingUp, Banknote, Calendar, FileText, Download, ArrowRight, CheckCircle2, AlertCircle, Clock, Shield, Bell, Mail, Phone, MessageSquare, Send, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LoanWithDetails extends Loans {
  repayments?: Repayments[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: Date;
  read: boolean;
}

export default function CustomerPortalPage() {
  const { member } = useMember();
  const { formatPrice, getCurrencySymbol } = useCurrencyStore();
  const { currentOrganisation, setOrganisation } = useOrganisationStore();
  
  const [customer, setCustomer] = useState<CustomerProfiles | null>(null);
  const [loans, setLoans] = useState<Loans[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('PENDING');
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loans | null>(null);

  useEffect(() => {
    loadCustomerData();
    loadNotifications();
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

        // Load organization data to get currency settings
        if (currentCustomer.organisationId) {
          const org = await BaseCrudService.getById<Organizations>('organisations', currentCustomer.organisationId);
          if (org) {
            setOrganisation(org);
            // TODO: Set currency based on organization settings when available
          }
        }
      }
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = () => {
    // Mock notifications - in a real app, these would come from a database
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Payment Due',
        message: 'Your loan payment of $500 is due on December 15, 2024.',
        type: 'alert',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: false,
      },
      {
        id: '2',
        title: 'KYC Verification Approved',
        message: 'Your KYC verification has been successfully approved.',
        type: 'success',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: '3',
        title: 'Loan Application Update',
        message: 'Your loan application #LOAN-2024-001 is now under review.',
        type: 'info',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: '4',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on December 10, 2024 from 2:00 AM to 4:00 AM UTC.',
        type: 'warning',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        read: true,
      },
    ];
    setNotifications(mockNotifications);
  };

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to a backend
    console.log('Contact form submitted:', contactForm);
    setContactSubmitted(true);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setContactSubmitted(false), 3000);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
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

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                Overview
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                Support
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 mt-8">
              {/* Key Metrics - Redesigned */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30 hover:border-secondary/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-primary-foreground/60 text-sm font-medium mb-2">Total Loans</p>
                        <p className="text-3xl font-bold text-primary-foreground">{loans.length}</p>
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
                        <p className="text-3xl font-bold text-primary-foreground">{loans.filter(l => l.loanStatus === 'disbursed').length}</p>
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
                        <p className="text-3xl font-bold text-primary-foreground">{formatPrice(loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0))}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-secondary/30 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-secondary" />
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
                      You don't have any loans yet. Contact your administrator to apply for a loan.
                    </p>
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
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div className="bg-primary/40 rounded-lg p-3">
                                  <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Principal</p>
                                  <p className="font-semibold text-primary-foreground">{formatPrice(loan.principalAmount || 0)}</p>
                                </div>
                                <div className="bg-primary/40 rounded-lg p-3">
                                  <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Outstanding</p>
                                  <p className="font-semibold text-primary-foreground">{formatPrice(loan.outstandingBalance || 0)}</p>
                                </div>
                                <div className="bg-primary/40 rounded-lg p-3">
                                  <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Start Date</p>
                                  <p className="font-semibold text-primary-foreground">
                                    {loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div className="bg-primary/40 rounded-lg p-3">
                                  <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Completion Date</p>
                                  <p className="font-semibold text-primary-foreground">
                                    {loan.closureDate ? new Date(loan.closureDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div className="bg-primary/40 rounded-lg p-3">
                                  <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Next Payment</p>
                                  <p className="font-semibold text-primary-foreground">
                                    {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div className="bg-primary/40 rounded-lg p-3">
                                  <p className="text-primary-foreground/50 text-xs uppercase tracking-wider mb-1">Term</p>
                                  <p className="font-semibold text-primary-foreground">{loan.loanTermMonths} months</p>
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
                                <Button 
                                  className="w-full bg-secondary text-primary hover:bg-secondary/90 font-semibold"
                                  onClick={() => {
                                    setSelectedLoanForPayment(loan);
                                    setPaymentModalOpen(true);
                                  }}
                                >
                                  <Banknote className="w-4 h-4 mr-2" />
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
                className="grid md:grid-cols-3 gap-6"
              >
                {/* Make a Payment Card - Prominent */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="md:col-span-1"
                >
                  <Card className="p-8 bg-gradient-to-br from-secondary/30 to-secondary/10 border-secondary/50 hover:border-secondary/70 transition-all shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary/40 flex items-center justify-center">
                        <Banknote className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                    <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">Make a Payment</h3>
                    <p className="text-primary-foreground/70 text-sm mb-4">
                      Pay your loan using mobile money, bank transfer, or card. Quick and secure.
                    </p>
                    <Button 
                      className="bg-secondary text-primary hover:bg-secondary/90 w-full font-semibold"
                      onClick={() => {
                        const activeLoan = loans.find(l => l.loanStatus === 'disbursed');
                        if (activeLoan) {
                          setSelectedLoanForPayment(activeLoan);
                          setPaymentModalOpen(true);
                        }
                      }}
                      disabled={!loans.some(l => l.loanStatus === 'disbursed')}
                    >
                      <Banknote className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                  </Card>
                </motion.div>

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
                      ? 'Your identity has been verified.'
                      : 'Upload your documents to complete KYC verification.'}
                  </p>
                  <Link to="/customer-portal/kyc">
                    <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 w-full">
                      {kycStatus === 'APPROVED' ? 'View Documents' : 'Upload Documents'}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-8">
                  <h2 className="font-heading text-3xl font-bold text-primary-foreground mb-2">Notifications</h2>
                  <p className="text-primary-foreground/70">Stay updated with important alerts and messages</p>
                </div>

                {notifications.length === 0 ? (
                  <Card className="p-12 text-center bg-primary-foreground/5 border-primary-foreground/10">
                    <Bell className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
                    <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-2">No Notifications</h3>
                    <p className="text-primary-foreground/70">You're all caught up!</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card
                          className={`p-6 border-l-4 cursor-pointer transition-all hover:shadow-lg ${
                            notification.type === 'alert'
                              ? 'bg-red-500/10 border-l-red-500 border-primary-foreground/10'
                              : notification.type === 'warning'
                              ? 'bg-yellow-500/10 border-l-yellow-500 border-primary-foreground/10'
                              : notification.type === 'success'
                              ? 'bg-green-500/10 border-l-green-500 border-primary-foreground/10'
                              : 'bg-blue-500/10 border-l-blue-500 border-primary-foreground/10'
                          } ${!notification.read ? 'bg-opacity-20' : 'bg-opacity-10'}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-heading font-bold text-primary-foreground">{notification.title}</h3>
                                {!notification.read && (
                                  <Badge className="bg-secondary text-primary">New</Badge>
                                )}
                              </div>
                              <p className="text-primary-foreground/70 text-sm mb-2">{notification.message}</p>
                              <p className="text-primary-foreground/50 text-xs">
                                {notification.timestamp.toLocaleDateString()} at {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {notification.type === 'alert' && <AlertCircle className="w-5 h-5 text-red-500" />}
                              {notification.type === 'warning' && <Clock className="w-5 h-5 text-yellow-500" />}
                              {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                              {notification.type === 'info' && <Bell className="w-5 h-5 text-blue-500" />}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-8">
                  <h2 className="font-heading text-3xl font-bold text-primary-foreground mb-2">Contact Support</h2>
                  <p className="text-primary-foreground/70">Get help from our support team</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Contact Form */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Card className="p-8 bg-primary-foreground/5 border-primary-foreground/10">
                      <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-6">Send us a Message</h3>

                      {contactSubmitted && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/30 flex items-start gap-3"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-green-600">Message Sent!</p>
                            <p className="text-sm text-green-600/80">We'll get back to you as soon as possible.</p>
                          </div>
                        </motion.div>
                      )}

                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-primary-foreground mb-2 block">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={contactForm.name}
                            onChange={handleContactFormChange}
                            placeholder="Your name"
                            required
                            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                          />
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-primary-foreground mb-2 block">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={contactForm.email}
                            onChange={handleContactFormChange}
                            placeholder="your@email.com"
                            required
                            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                          />
                        </div>

                        <div>
                          <Label htmlFor="subject" className="text-primary-foreground mb-2 block">Subject</Label>
                          <Input
                            id="subject"
                            name="subject"
                            value={contactForm.subject}
                            onChange={handleContactFormChange}
                            placeholder="What is this about?"
                            required
                            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                          />
                        </div>

                        <div>
                          <Label htmlFor="message" className="text-primary-foreground mb-2 block">Message</Label>
                          <Textarea
                            id="message"
                            name="message"
                            value={contactForm.message}
                            onChange={handleContactFormChange}
                            placeholder="Tell us how we can help..."
                            required
                            rows={5}
                            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-secondary text-primary hover:bg-secondary/90">
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </form>
                    </Card>
                  </motion.div>

                  {/* Support Channels */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-4"
                  >
                    <Card className="p-6 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/30 hover:border-secondary/50 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary/30 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-6 h-6 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading font-bold text-primary-foreground mb-1">Email Support</h4>
                          <p className="text-primary-foreground/70 text-sm mb-3">
                            Send us an email and we'll respond within 24 hours.
                          </p>
                          <a href="mailto:support@loanmanagement.com" className="text-secondary hover:text-secondary/80 font-semibold text-sm">
                            support@loanmanagement.com
                          </a>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-brandaccent/20 to-transparent border-brandaccent/30 hover:border-brandaccent/50 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-brandaccent/30 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-6 h-6 text-brandaccent" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading font-bold text-primary-foreground mb-1">Phone Support</h4>
                          <p className="text-primary-foreground/70 text-sm mb-3">
                            Call us during business hours (Mon-Fri, 9 AM - 5 PM).
                          </p>
                          <a href="tel:+1234567890" className="text-brandaccent hover:text-brandaccent/80 font-semibold text-sm">
                            +1 (234) 567-890
                          </a>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-green-500/20 to-transparent border-green-500/30 hover:border-green-500/50 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-500/30 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading font-bold text-primary-foreground mb-1">Live Chat</h4>
                          <p className="text-primary-foreground/70 text-sm mb-3">
                            Chat with our support team in real-time.
                          </p>
                          <Button variant="outline" size="sm" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                            Start Chat
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-500/20 to-transparent border-blue-500/30 hover:border-blue-500/50 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading font-bold text-primary-foreground mb-1">Visit Us</h4>
                          <p className="text-primary-foreground/70 text-sm">
                            123 Financial Street<br />
                            New York, NY 10001<br />
                            United States
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-primary-foreground/5 border-primary-foreground/10">
                      <h4 className="font-heading font-bold text-primary-foreground mb-3">FAQ</h4>
                      <p className="text-primary-foreground/70 text-sm mb-4">
                        Find answers to common questions about loans, payments, and account management.
                      </p>
                      <Button variant="outline" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                        View FAQ
                      </Button>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />

      {/* Payment Modal */}
      {selectedLoanForPayment && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedLoanForPayment(null);
          }}
          loanId={selectedLoanForPayment._id}
          loanNumber={selectedLoanForPayment.loanNumber || 'Unknown'}
          outstandingBalance={selectedLoanForPayment.outstandingBalance || 0}
        />
      )}
    </div>
  );
}
