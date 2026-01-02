/**
 * Customer Loan Application Page
 * Customers can apply for loans with basic details
 */

import { useState, useEffect } from 'react';
import { useMember } from '@/integrations';
import { useForm } from 'react-hook-form';
import { BaseCrudService, LoanService, AuditService } from '@/services';
import { Loans, LoanProducts, CustomerProfiles } from '@/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle2, DollarSign, Calendar, Percent, User, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface LoanApplicationForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailAddress: string;
  loanProductId: string;
  principalAmount: number;
  loanTermMonths: number;
}

export default function CustomerLoanApplicationPage() {
  const { member } = useMember();
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<LoanApplicationForm>({
    defaultValues: {
      firstName: member?.contact?.firstName || '',
      lastName: member?.contact?.lastName || '',
      emailAddress: member?.loginEmail || '',
      phoneNumber: member?.contact?.phones?.[0] || '',
    }
  });
  
  const [loanProducts, setLoanProducts] = useState<LoanProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  const selectedProductId = watch('loanProductId');
  const principalAmount = watch('principalAmount');
  const loanTermMonths = watch('loanTermMonths');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Get loan products
        const { items } = await BaseCrudService.getAll<LoanProducts>('loanproducts');
        setLoanProducts(items.filter(p => p.isActive) || []);
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

  const onSubmit = async (data: LoanApplicationForm) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const product = loanProducts.find(p => p._id === data.loanProductId);
      if (!product) {
        setErrorMessage('Invalid loan product selected');
        return;
      }

      // Validate amount
      if (data.principalAmount < (product.minLoanAmount || 0) || data.principalAmount > (product.maxLoanAmount || 999999999)) {
        setErrorMessage(`Loan amount must be between ${product.minLoanAmount} and ${product.maxLoanAmount}`);
        return;
      }

      // First, create or update customer profile
      let customerId = '';
      const { items: existingCustomers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      const existingCustomer = existingCustomers.find(c => c.emailAddress === data.emailAddress);

      if (existingCustomer) {
        customerId = existingCustomer._id;
        // Update customer with latest info
        await BaseCrudService.update<CustomerProfiles>('customers', {
          _id: customerId,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          emailAddress: data.emailAddress,
        });
      } else {
        // Create new customer
        const newCustomer: CustomerProfiles = {
          _id: crypto.randomUUID(),
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          emailAddress: data.emailAddress,
          nationalIdNumber: '',
          residentialAddress: '',
          dateOfBirth: undefined,
          kycVerificationStatus: 'PENDING',
          creditScore: 0,
          idDocumentImage: '',
          organisationId: 'demo-org-001',
        };
        await BaseCrudService.create<CustomerProfiles>('customers', newCustomer);
        customerId = newCustomer._id;
      }

      // Create loan
      const loan: Loans = {
        _id: crypto.randomUUID(),
        loanNumber: `LOAN-${Date.now()}`,
        customerId: customerId,
        loanProductId: data.loanProductId,
        disbursementDate: undefined,
        principalAmount: data.principalAmount,
        outstandingBalance: data.principalAmount,
        loanStatus: 'pending-approval',
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        interestRate: product.interestRate,
        loanTermMonths: data.loanTermMonths,
        organisationId: 'demo-org-001',
      };

      await BaseCrudService.create<Loans>('loans', loan);

      // Log audit trail
      await AuditService.logLoanApplication(
        loan._id,
        member?.loginEmail || 'CUSTOMER',
        customerId
      );

      setSuccessMessage(`Loan application submitted successfully! Application ID: ${loan.loanNumber}`);
      reset();
      setMonthlyPayment(0);
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrorMessage('Failed to submit loan application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground font-paragraph">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary-foreground font-paragraph">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Apply for a Loan
          </h1>
          <p className="text-primary-foreground/70">
            Fill in your details and loan requirements to submit your application.
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
                You can track your application in the My Loans section.
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
              <CardTitle className="text-primary-foreground">Your Information</CardTitle>
              <CardDescription className="text-primary-foreground/50">
                Please provide your basic details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <Label className="text-primary-foreground mb-2 block">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/50" />
                      <Input
                        type="text"
                        placeholder="Enter your first name"
                        className="pl-10 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('firstName', { required: 'First name is required' })}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <Label className="text-primary-foreground mb-2 block">Last Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/50" />
                      <Input
                        type="text"
                        placeholder="Enter your last name"
                        className="pl-10 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('lastName', { required: 'Last name is required' })}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label className="text-primary-foreground mb-2 block">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/50" />
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        className="pl-10 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('phoneNumber', { required: 'Phone number is required' })}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <Label className="text-primary-foreground mb-2 block">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/50" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                        {...register('emailAddress', { required: 'Email is required' })}
                      />
                    </div>
                    {errors.emailAddress && (
                      <p className="text-red-500 text-sm mt-1">{errors.emailAddress.message}</p>
                    )}
                  </div>
                </div>

                {/* Loan Details Section */}
                <div className="border-t border-primary-foreground/10 pt-6">
                  <h3 className="font-heading text-lg font-bold text-primary-foreground mb-6">Loan Details</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
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
                      <Label className="text-primary-foreground mb-2 block">Loan Tenure (Months) *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/50" />
                        <Input
                          type="number"
                          placeholder="Enter loan tenure in months"
                          className="pl-10 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                          {...register('loanTermMonths', {
                            required: 'Loan tenure is required',
                            min: { value: 1, message: 'Minimum tenure is 1 month' },
                            max: { value: 360, message: 'Maximum tenure is 360 months' },
                          })}
                        />
                      </div>
                      {errors.loanTermMonths && (
                        <p className="text-red-500 text-sm mt-1">{errors.loanTermMonths.message}</p>
                      )}
                    </div>
                  </div>
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
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
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
      </main>

      <Footer />
    </div>
  );
}
