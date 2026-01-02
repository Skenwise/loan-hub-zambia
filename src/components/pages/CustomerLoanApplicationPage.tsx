/**
 * Customer Loan Application Page
 * Admin-only loan application creation
 * Customers can only view and manage their existing loans
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { useRoleStore } from '@/store/roleStore';
import { LoanService, CustomerService, AuthorizationService, Permissions, AuditService } from '@/services';
import { LoanProducts, Loans } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle2, DollarSign, Calendar, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';

interface LoanApplicationForm {
  customerId: string;
  loanProductId: string;
  principalAmount: number;
  loanTermMonths: number;
}

export default function CustomerLoanApplicationPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const { userRole, setUserRole } = useRoleStore();
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<LoanApplicationForm>();
  
  const [loanProducts, setLoanProducts] = useState<LoanProducts[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [showRoleSelector, setShowRoleSelector] = useState(!userRole);

  const selectedProductId = watch('loanProductId');
  const principalAmount = watch('principalAmount');
  const loanTermMonths = watch('loanTermMonths');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Use a default org for demo
        const demoOrgId = 'demo-org-001';

        // Get loan products
        const products = await LoanService.getOrganisationLoanProducts(demoOrgId);
        setLoanProducts(products);

        // Get customers for selection
        const customerList = await CustomerService.getOrganisationCustomers(demoOrgId);
        setCustomers(customerList);
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage('Failed to load loan products');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate monthly payment when inputs change
  useEffect(() => {
    if (principalAmount && loanTermMonths && selectedProductId) {
      const product = loanProducts.find(p => p._id === selectedProductId);
      if (product?.interestRate) {
        const payment = LoanService.calculateMonthlyPayment(
          principalAmount,
          product.interestRate,
          loanTermMonths
        );
        setMonthlyPayment(payment);
      }
    }
  }, [principalAmount, loanTermMonths, selectedProductId, loanProducts]);

  const handleSetRole = (role: 'STAFF') => {
    setUserRole(role);
    setShowRoleSelector(false);
  };

  const onSubmit = async (data: LoanApplicationForm) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const demoOrgId = 'demo-org-001';

      const product = loanProducts.find(p => p._id === data.loanProductId);
      if (!product) {
        setErrorMessage('Invalid loan product selected');
        return;
      }

      // Validate amount
      if (data.principalAmount < product.minLoanAmount || data.principalAmount > product.maxLoanAmount) {
        setErrorMessage(`Loan amount must be between ${product.minLoanAmount} and ${product.maxLoanAmount}`);
        return;
      }

      // Create loan
      const loan: Omit<Loans, '_id' | '_createdDate' | '_updatedDate'> = {
        loanNumber: `LOAN-${Date.now()}`,
        customerId: data.customerId,
        loanProductId: data.loanProductId,
        disbursementDate: undefined,
        principalAmount: data.principalAmount,
        outstandingBalance: data.principalAmount,
        loanStatus: 'PENDING',
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        interestRate: product.interestRate,
        loanTermMonths: data.loanTermMonths,
        organisationId: demoOrgId,
      };

      const createdLoan = await LoanService.createLoan(loan);

      // Log audit trail
      await AuditService.logLoanApplication(
        createdLoan._id,
        member?.loginEmail || 'ADMIN',
        data.customerId
      );

      setSuccessMessage(`Loan application created successfully! Application ID: ${createdLoan.loanNumber}`);
      reset();
      setMonthlyPayment(0);
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrorMessage('Failed to create loan application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-primary-foreground/5 border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Select Your Role</CardTitle>
              <CardDescription className="text-primary-foreground/50">
                Choose a role to access this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleSetRole('STAFF')}
                className="w-full bg-secondary text-primary hover:bg-secondary/90 h-12"
              >
                Admin Staff
              </Button>
              <p className="text-sm text-primary-foreground/70 text-center">
                Only admin staff can create loan applications
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole !== 'STAFF') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/70 mb-4">
                Only admin staff can create loan applications. Customers can view and manage their loans in the customer portal.
              </p>
              <Button
                onClick={() => setShowRoleSelector(true)}
                variant="outline"
              >
                Change Role
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Create Loan Application
          </h1>
          <p className="text-primary-foreground/70">
            Create a new loan application for a customer. Only admin staff can perform this action.
          </p>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-600">{successMessage}</p>
              <p className="text-sm text-primary-foreground/70 mt-1">
                You can track this application in the loans management section.
              </p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
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

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-primary-foreground/5 border-primary-foreground/10 mb-6">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Loan Application Details</CardTitle>
              <CardDescription className="text-primary-foreground/50">
                Select a customer and loan product to create an application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Selection */}
                <div>
                  <Label className="text-primary-foreground mb-2 block">Customer *</Label>
                  <Select {...register('customerId', { required: 'Please select a customer' })}>
                    <SelectTrigger className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id || ''}>
                          {customer.firstName} {customer.lastName} - {customer.emailAddress}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customerId && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
                  )}
                </div>

                {/* Loan Product Selection */}
                <div>
                  <Label className="text-primary-foreground mb-2 block">Loan Product *</Label>
                  <Select {...register('loanProductId', { required: 'Please select a loan product' })}>
                    <SelectTrigger className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground">
                      <SelectValue placeholder="Select a loan product" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanProducts.map((product) => (
                        <SelectItem key={product._id} value={product._id || ''}>
                          {product.productName} - {product.interestRate}% interest
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.loanProductId && (
                    <p className="text-red-500 text-sm mt-1">{errors.loanProductId.message}</p>
                  )}
                </div>

                {/* Loan Amount */}
                <div>
                  <Label className="text-primary-foreground mb-2 block">Loan Amount (ZMW) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/50" />
                    <Input
                      type="number"
                      placeholder="Enter loan amount"
                      className="pl-10 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                      {...register('principalAmount', {
                        required: 'Loan amount is required',
                        min: { value: 1000, message: 'Minimum loan amount is 1000' },
                      })}
                    />
                  </div>
                  {errors.principalAmount && (
                    <p className="text-red-500 text-sm mt-1">{errors.principalAmount.message}</p>
                  )}
                </div>

                {/* Loan Term */}
                <div>
                  <Label className="text-primary-foreground mb-2 block">Loan Term (Months) *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/50" />
                    <Input
                      type="number"
                      placeholder="Enter loan term in months"
                      className="pl-10 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                      {...register('loanTermMonths', {
                        required: 'Loan term is required',
                        min: { value: 1, message: 'Minimum term is 1 month' },
                        max: { value: 360, message: 'Maximum term is 360 months' },
                      })}
                    />
                  </div>
                  {errors.loanTermMonths && (
                    <p className="text-red-500 text-sm mt-1">{errors.loanTermMonths.message}</p>
                  )}
                </div>

                {/* Monthly Payment Preview */}
                {monthlyPayment > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-secondary/10 border border-secondary/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-primary-foreground/70">Estimated Monthly Payment</p>
                        <p className="text-2xl font-bold text-secondary">
                          ZMW {monthlyPayment.toFixed(2)}
                        </p>
                      </div>
                      <Percent className="w-8 h-8 text-secondary/50" />
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-secondary text-primary hover:bg-secondary/90 h-12 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Application...' : 'Create Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loan Products Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-heading font-bold text-primary-foreground mb-4">Available Loan Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loanProducts.map((product) => (
              <Card key={product._id} className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardHeader>
                  <CardTitle className="text-lg text-primary-foreground">{product.productName}</CardTitle>
                  <CardDescription className="text-primary-foreground/50">{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-primary-foreground/70">Interest Rate</p>
                      <p className="text-lg font-semibold text-secondary">{product.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Processing Fee</p>
                      <p className="text-lg font-semibold text-secondary">{product.processingFee}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Min Amount</p>
                      <p className="text-lg font-semibold text-primary-foreground">ZMW {product.minLoanAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70">Max Amount</p>
                      <p className="text-lg font-semibold text-primary-foreground">ZMW {product.maxLoanAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
