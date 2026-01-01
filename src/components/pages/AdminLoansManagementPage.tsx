/**
 * Admin Loans Management Page
 * Comprehensive loan management for admin users
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { LoanService, CustomerService, AuthorizationService, Permissions, AuditService } from '@/services';
import { Loans, CustomerProfiles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LoanWithCustomer extends Loans {
  customer?: CustomerProfiles;
  daysOverdue?: number;
  monthlyPayment?: number;
}

export default function AdminLoansManagementPage() {
  const { member } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [loans, setLoans] = useState<LoanWithCustomer[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [canApprove, setCanApprove] = useState(false);
  const [canDisburse, setCanDisburse] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentStaff?._id || !currentOrganisation?._id) return;

      const canApproveLoan = await AuthorizationService.hasPermission(
        currentStaff._id,
        currentOrganisation._id,
        Permissions.APPROVE_LOAN
      );

      const canDisburseLoan = await AuthorizationService.hasPermission(
        currentStaff._id,
        currentOrganisation._id,
        Permissions.DISBURSE_LOAN
      );

      setCanApprove(canApproveLoan);
      setCanDisburse(canDisburseLoan);
    };

    checkPermissions();
  }, [currentStaff, currentOrganisation]);

  useEffect(() => {
    const loadLoans = async () => {
      if (!currentOrganisation?._id) return;

      try {
        setIsLoading(true);

        // Get all loans for organisation
        const orgLoans = await LoanService.getOrganisationLoans(currentOrganisation._id);

        // Enrich with customer data
        const enrichedLoans = await Promise.all(
          orgLoans.map(async (loan) => {
            const customer = loan.customerId ? await CustomerService.getCustomer(loan.customerId) : undefined;
            const daysOverdue = LoanService.calculateDaysOverdue(loan.nextPaymentDate);
            const monthlyPayment = LoanService.calculateMonthlyPayment(
              loan.principalAmount || 0,
              loan.interestRate || 0,
              loan.loanTermMonths || 0
            );

            return {
              ...loan,
              customer,
              daysOverdue,
              monthlyPayment,
            };
          })
        );

        setLoans(enrichedLoans);
        setFilteredLoans(enrichedLoans);
      } catch (error) {
        console.error('Error loading loans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, [currentOrganisation]);

  // Filter loans based on search and status
  useEffect(() => {
    let filtered = loans;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(l => l.loanStatus === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.loanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.customer?.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLoans(filtered);
  }, [searchTerm, statusFilter, loans]);

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'APPROVED':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'CLOSED':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'CLOSED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Loan Management
          </h1>
          <p className="text-primary-foreground/70">
            Manage and track all loans in your organization
          </p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { label: 'Total Loans', value: loans.length, icon: DollarSign, color: 'bg-blue-500/10 text-blue-600' },
            { label: 'Pending', value: loans.filter(l => l.loanStatus === 'PENDING').length, icon: Clock, color: 'bg-yellow-500/10 text-yellow-600' },
            { label: 'Active', value: loans.filter(l => l.loanStatus === 'ACTIVE').length, icon: CheckCircle2, color: 'bg-green-500/10 text-green-600' },
            { label: 'Overdue', value: loans.filter(l => (l.daysOverdue || 0) > 0).length, icon: AlertCircle, color: 'bg-red-500/10 text-red-600' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-primary-foreground/5 border-primary-foreground/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-primary-foreground/70">
                        {stat.label}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary-foreground">{stat.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/50" />
            <Input
              placeholder="Search by loan number, customer name, or email..."
              className="pl-10 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Loans Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Loans ({filteredLoans.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLoans.length > 0 ? (
                <div className="space-y-3">
                  {filteredLoans.map((loan, idx) => (
                    <motion.div
                      key={loan._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 hover:border-secondary/50 transition-all"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        {/* Loan Number & Customer */}
                        <div>
                          <p className="text-sm text-primary-foreground/70">Loan Number</p>
                          <p className="font-semibold text-primary-foreground">{loan.loanNumber}</p>
                          <p className="text-xs text-primary-foreground/50 mt-1">
                            {loan.customer?.firstName} {loan.customer?.lastName}
                          </p>
                        </div>

                        {/* Amount */}
                        <div>
                          <p className="text-sm text-primary-foreground/70">Principal</p>
                          <p className="font-semibold text-primary-foreground">
                            ZMW {(loan.principalAmount || 0).toLocaleString()}
                          </p>
                        </div>

                        {/* Outstanding Balance */}
                        <div>
                          <p className="text-sm text-primary-foreground/70">Outstanding</p>
                          <p className="font-semibold text-secondary">
                            ZMW {(loan.outstandingBalance || 0).toLocaleString()}
                          </p>
                        </div>

                        {/* Status */}
                        <div>
                          <Badge className={`${getStatusColor(loan.loanStatus)} border`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(loan.loanStatus)}
                              {loan.loanStatus}
                            </span>
                          </Badge>
                          {loan.daysOverdue && loan.daysOverdue > 0 && (
                            <p className="text-xs text-red-400 mt-2">
                              {loan.daysOverdue} days overdue
                            </p>
                          )}
                        </div>

                        {/* Next Payment */}
                        <div>
                          <p className="text-sm text-primary-foreground/70">Next Payment</p>
                          <p className="font-semibold text-primary-foreground">
                            {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                          </p>
                          <p className="text-xs text-primary-foreground/50 mt-1">
                            ZMW {(loan.monthlyPayment || 0).toFixed(2)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link to={`/admin/loans/${loan._id}`}>
                            <Button variant="ghost" size="sm" className="text-secondary hover:bg-secondary/10">
                              View
                            </Button>
                          </Link>
                          {loan.loanStatus === 'PENDING' && canApprove && (
                            <Link to={`/admin/loans/approve?id=${loan._id}`}>
                              <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                                Approve
                              </Button>
                            </Link>
                          )}
                          {loan.loanStatus === 'APPROVED' && canDisburse && (
                            <Link to={`/admin/loans/disburse?id=${loan._id}`}>
                              <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/10">
                                Disburse
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-primary-foreground/70">No loans found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
