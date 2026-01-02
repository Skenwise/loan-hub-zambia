import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, LoanProducts, CustomerProfiles, KYCDocumentSubmissions, LoanDocuments } from '@/entities';
import { InterestCalculationService, type InterestType } from '@/services/InterestCalculationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  CheckCircle, 
  ChevronRight, 
  FileText,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Shield,
  MessageSquare,
  Save,
  Send,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

type ApplicationStep = 'customer' | 'product' | 'terms' | 'interest-method' | 'calculations' | 'schedule' | 'kyc-docs' | 'collateral' | 'guarantors' | 'risk' | 'approval' | 'notes' | 'review' | 'confirmation';

type InterestCalculationMethod = 'simple' | 'compound' | 'declining-balance' | 'flat-rate';

export default function LoanApplicationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('customer');
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [customers, setCustomers] = useState<CustomerProfiles[]>([])
  const [loanProducts, setLoanProducts] = useState<LoanProducts[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocumentSubmissions[]>([]);
  const [loanDocuments, setLoanDocuments] = useState<LoanDocuments[]>([]);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [loanTermMonths, setLoanTermMonths] = useState('');
  const [purpose, setPurpose] = useState('');
  const [collateralDescription, setCollateralDescription] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorContact, setGuarantorContact] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [comments, setComments] = useState('');
  const [interestCalculationMethod, setInterestCalculationMethod] = useState<InterestCalculationMethod>('simple');

  // Calculated values
  const selectedProduct = loanProducts.find(p => p._id === selectedProductId);
  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);
  
  const principal = parseFloat(principalAmount || '0');
  const interestRate = selectedProduct?.interestRate || 0;
  const months = parseInt(loanTermMonths || '1');
  
  // Calculate interest based on selected method using industry-standard formulas
  const calculateInterest = () => {
    if (principal <= 0 || months <= 0) return { totalInterest: 0, totalAmount: principal, monthlyPayment: 0 };
    
    let totalInterest = 0;
    let monthlyPayment = 0;

    switch (interestCalculationMethod) {
      case 'simple':
        // Simple Interest: I = P × r × t
        // Used by: Some microfinance institutions, short-term loans
        totalInterest = InterestCalculationService.calculateSimpleInterest(principal, interestRate, months);
        monthlyPayment = (principal + totalInterest) / months;
        break;
      
      case 'compound':
        // Compound Interest: A = P(1 + r/n)^(nt)
        // Used by: Banks (savings accounts, investment products)
        totalInterest = InterestCalculationService.calculateCompoundInterest(principal, interestRate, months);
        monthlyPayment = (principal + totalInterest) / months;
        break;
      
      case 'declining-balance':
        // Declining Balance (Reducing Balance): Most common for loans
        // Uses amortization formula: M = P × [r(1+r)^n] / [(1+r)^n - 1]
        // Interest calculated on outstanding balance each month
        monthlyPayment = InterestCalculationService.calculateMonthlyPayment(principal, interestRate, months);
        totalInterest = InterestCalculationService.calculateDecliningBalanceInterest(principal, interestRate, months);
        break;
      
      case 'flat-rate':
        // Flat Rate: I = (P × r × t) / 100
        // Used by: Some microfinance institutions, vehicle loans
        // Total interest is fixed upfront and divided equally across payments
        totalInterest = InterestCalculationService.calculateFlatRateInterest(principal, interestRate, months);
        monthlyPayment = (principal + totalInterest) / months;
        break;
      
      default:
        return { totalInterest: 0, totalAmount: principal, monthlyPayment: 0 };
    }

    return {
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round((principal + totalInterest) * 100) / 100,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100
    };
  };

  const { totalInterest, totalAmount, monthlyPayment } = calculateInterest();

  // Generate repayment schedule based on calculation method using industry-standard practices
  const generateRepaymentSchedule = () => {
    if (principal <= 0 || months <= 0) return [];

    // Map UI method names to service InterestType
    const interestTypeMap: Record<InterestCalculationMethod, InterestType> = {
      'simple': 'SIMPLE',
      'compound': 'COMPOUND',
      'declining-balance': 'REDUCING',
      'flat-rate': 'FLAT'
    };

    const interestType = interestTypeMap[interestCalculationMethod];
    const result = InterestCalculationService.generateAmortizationSchedule(
      principal,
      interestRate,
      months,
      new Date(),
      interestType
    );

    // Format schedule for display
    return result.schedule.map(item => ({
      month: item.paymentNumber,
      dueDate: item.dueDate.toLocaleDateString(),
      payment: item.totalPayment.toFixed(2),
      principal: item.principalAmount.toFixed(2),
      interest: item.interestAmount.toFixed(2),
      balance: item.outstandingBalance.toFixed(2)
    }));
  };

  const repaymentSchedule = generateRepaymentSchedule();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [customersRes, productsRes, kycRes, docsRes] = await Promise.all([
        BaseCrudService.getAll<CustomerProfiles>('customers'),
        BaseCrudService.getAll<LoanProducts>('loanproducts'),
        BaseCrudService.getAll<KYCDocumentSubmissions>('kycdocumentsubmissions'),
        BaseCrudService.getAll<LoanDocuments>('loandocuments'),
      ]);
      setCustomers(customersRes.items);
      setLoanProducts(productsRes.items.filter(p => p.isActive === true));
      setKycDocuments(kycRes.items);
      setLoanDocuments(docsRes.items);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreateApplication = async () => {
    if (!selectedCustomerId || !selectedProductId || !principalAmount || !loanTermMonths) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const loanId = crypto.randomUUID();
      const newLoan: Loans = {
        _id: loanId,
        loanNumber: `LN-${Date.now()}`,
        customerId: selectedCustomerId,
        loanProductId: selectedProductId,
        principalAmount: principal,
        outstandingBalance: principal,
        loanStatus: 'pending-approval',
        interestRate: interestRate,
        loanTermMonths: months,
        disbursementDate: new Date(),
      };

      await BaseCrudService.create('loans', newLoan);
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Failed to create loan application:', error);
      alert('Failed to create loan application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps: ApplicationStep[] = ['customer', 'product', 'terms', 'interest-method', 'calculations', 'schedule', 'kyc-docs', 'collateral', 'guarantors', 'risk', 'approval', 'notes', 'review', 'confirmation'];
  const currentStepIndex = steps.indexOf(currentStep);

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground font-paragraph pb-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-heading text-5xl font-bold mb-2">New Loan Application</h1>
          <p className="text-primary-foreground text-lg">Complete the loan application process step by step</p>
        </div>

        {/* Progress Bar */}
        {currentStep !== 'confirmation' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-primary-foreground">
                Step {currentStepIndex + 1} of {steps.length - 1}
              </span>
              <span className="text-sm text-primary-foreground/70">
                {currentStep.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-primary-foreground/10 rounded-full h-2">
              <div 
                className="bg-secondary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Customer Selection */}
        {currentStep === 'customer' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <Users className="w-5 h-5" />
                Select Customer
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Choose an existing customer or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tabs for Existing Customers and Create New */}
              <Tabs defaultValue="existing" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-primary-foreground/10">
                  <TabsTrigger value="existing" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                    Existing Customers
                  </TabsTrigger>
                  <TabsTrigger value="create" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                    Create New Customer
                  </TabsTrigger>
                </TabsList>

                {/* Existing Customers Tab */}
                <TabsContent value="existing" className="space-y-4">
                  {customers.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-primary-foreground/30 mx-auto mb-4" />
                      <p className="text-primary-foreground mb-2">No customers found</p>
                      <p className="text-sm text-primary-foreground/70">Switch to the "Create New Customer" tab to add a new customer</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-96 overflow-y-auto border border-primary-foreground/10 rounded-lg p-4">
                        {customers.map(customer => (
                          <button
                            key={customer._id}
                            onClick={() => setSelectedCustomerId(customer._id || '')}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              selectedCustomerId === customer._id
                                ? 'bg-secondary/10 border-secondary'
                                : 'bg-primary-foreground/5 border-primary-foreground/10 hover:border-primary-foreground/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-primary-foreground">
                                  {customer.firstName} {customer.lastName}
                                </p>
                                <p className="text-sm text-primary-foreground/70">{customer.nationalIdNumber}</p>
                                <p className="text-sm text-primary-foreground/70">{customer.emailAddress}</p>
                              </div>
                              {selectedCustomerId === customer._id && (
                                <CheckCircle className="w-5 h-5 text-secondary" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {selectedCustomer && (
                        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-6">
                          <h3 className="font-semibold text-primary-foreground mb-4">Customer Details</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-primary-foreground/70">Email</p>
                              <p className="font-medium text-primary-foreground">{selectedCustomer.emailAddress}</p>
                            </div>
                            <div>
                              <p className="text-primary-foreground/70">Phone</p>
                              <p className="font-medium text-primary-foreground">{selectedCustomer.phoneNumber}</p>
                            </div>
                            <div>
                              <p className="text-primary-foreground/70">Credit Score</p>
                              <p className="font-medium text-primary-foreground">{selectedCustomer.creditScore || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-primary-foreground/70">KYC Status</p>
                              <p className="font-medium text-primary-foreground">{selectedCustomer.kycVerificationStatus}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Create New Customer Tab */}
                <TabsContent value="create" className="space-y-4">
                  <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-8 text-center">
                    <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
                    <h3 className="font-semibold text-primary-foreground mb-2 text-lg">Create New Customer</h3>
                    <p className="text-primary-foreground/70 mb-6">
                      Navigate to the Customers section to create a new customer profile. Once created, you can select them here.
                    </p>
                    <Button
                      onClick={() => navigate('/admin/customers')}
                      className="bg-secondary hover:bg-secondary/90 text-primary font-semibold"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Go to Customers Section
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  disabled={currentStepIndex === 0}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  disabled={!selectedCustomerId}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Loan Product Selection */}
        {currentStep === 'product' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <FileText className="w-5 h-5" />
                Select Loan Product
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Choose a loan product that matches the customer's needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {loanProducts.map(product => (
                  <button
                    key={product._id}
                    onClick={() => setSelectedProductId(product._id || '')}
                    className={`text-left p-6 rounded-lg border-2 transition-all ${
                      selectedProductId === product._id
                        ? 'bg-secondary/10 border-secondary'
                        : 'bg-primary-foreground/5 border-primary-foreground/10 hover:border-primary-foreground/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-primary-foreground text-lg">{product.productName}</h3>
                        <p className="text-sm text-primary-foreground/70">{product.productType}</p>
                      </div>
                      {selectedProductId === product._id && (
                        <CheckCircle className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <p className="text-primary-foreground/70 mb-4">{product.description}</p>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-primary-foreground/70">Interest Rate</p>
                        <p className="font-semibold text-primary-foreground">{product.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-primary-foreground/70">Min Amount</p>
                        <p className="font-semibold text-primary-foreground">ZMW {product.minLoanAmount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-primary-foreground/70">Max Amount</p>
                        <p className="font-semibold text-primary-foreground">ZMW {product.maxLoanAmount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-primary-foreground/70">Term</p>
                        <p className="font-semibold text-primary-foreground">{product.loanTermMonths} months</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={goToNextStep}
                  disabled={!selectedProductId}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Loan Terms Configuration */}
        {currentStep === 'terms' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <DollarSign className="w-5 h-5" />
                Configure Loan Terms
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Set the principal amount and loan term
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary-foreground mb-2">Principal Amount (ZMW) *</label>
                  <Input
                    type="number"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={selectedProduct?.minLoanAmount}
                    max={selectedProduct?.maxLoanAmount}
                    className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                  />
                  {selectedProduct && (
                    <p className="text-xs text-primary-foreground/70 mt-2">
                      Range: ZMW {selectedProduct.minLoanAmount?.toLocaleString()} - ZMW {selectedProduct.maxLoanAmount?.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-foreground mb-2">Loan Term (Months) *</label>
                  <Input
                    type="number"
                    value={loanTermMonths}
                    onChange={(e) => setLoanTermMonths(e.target.value)}
                    placeholder="Enter term in months"
                    min={1}
                    className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-foreground mb-2">Loan Purpose</label>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe the purpose of this loan"
                  rows={4}
                  className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={goToNextStep}
                  disabled={!principalAmount || !loanTermMonths}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Interest Calculation Method */}
        {currentStep === 'interest-method' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <TrendingUp className="w-5 h-5" />
                Interest Calculation Method
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Select how interest will be calculated for this loan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {[
                  {
                    id: 'simple',
                    name: 'Simple Interest',
                    description: 'Interest calculated on principal amount only. Formula: I = P × R × T',
                    formula: 'Interest = Principal × Rate × Time'
                  },
                  {
                    id: 'compound',
                    name: 'Compound Interest',
                    description: 'Interest calculated on principal plus accumulated interest. Formula: A = P(1 + r/n)^(nt)',
                    formula: 'Amount = Principal × (1 + Rate)^Time'
                  },
                  {
                    id: 'declining-balance',
                    name: 'Declining Balance (Amortization)',
                    description: 'Interest calculated on remaining balance. Most common for installment loans.',
                    formula: 'PMT = P × [r(1+r)^n] / [(1+r)^n - 1]'
                  },
                  {
                    id: 'flat-rate',
                    name: 'Flat Rate',
                    description: 'Fixed interest amount calculated on principal for the entire loan period.',
                    formula: 'Interest = Principal × Rate × Time'
                  }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setInterestCalculationMethod(method.id as InterestCalculationMethod)}
                    className={`text-left p-6 rounded-lg border-2 transition-all ${
                      interestCalculationMethod === method.id
                        ? 'bg-secondary/10 border-secondary'
                        : 'bg-primary-foreground/5 border-primary-foreground/10 hover:border-primary-foreground/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary-foreground text-lg">{method.name}</h3>
                        <p className="text-sm text-primary-foreground/70 mt-1">{method.description}</p>
                        <p className="text-xs text-primary-foreground/50 mt-2 font-mono bg-primary-foreground/5 p-2 rounded mt-3">
                          {method.formula}
                        </p>
                      </div>
                      {interestCalculationMethod === method.id && (
                        <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 ml-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-6">
                <h3 className="font-semibold text-primary-foreground mb-3">Method Comparison</h3>
                <div className="text-sm space-y-2 text-primary-foreground/70">
                  <p>• <span className="font-medium">Simple:</span> Lower total interest, less common for loans</p>
                  <p>• <span className="font-medium">Compound:</span> Higher total interest, common for savings</p>
                  <p>• <span className="font-medium">Declining Balance:</span> Fair to borrower, most common for mortgages and personal loans</p>
                  <p>• <span className="font-medium">Flat Rate:</span> Easy to calculate, but higher effective rate</p>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Automated Loan Calculations */}
        {currentStep === 'calculations' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <TrendingUp className="w-5 h-5" />
                Loan Calculations
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Automated calculations based on your inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                  <p className="text-sm text-primary-foreground/70 mb-1">Principal Amount</p>
                  <p className="font-semibold text-primary-foreground text-lg">ZMW {principal.toLocaleString()}</p>
                </div>
                <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                  <p className="text-sm text-primary-foreground/70 mb-1">Interest Rate</p>
                  <p className="font-semibold text-primary-foreground text-lg">{interestRate}%</p>
                </div>
                <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                  <p className="text-sm text-primary-foreground/70 mb-1">Loan Term</p>
                  <p className="font-semibold text-primary-foreground text-lg">{months} months</p>
                </div>
                <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                  <p className="text-sm text-primary-foreground/70 mb-1">Calculation Method</p>
                  <p className="font-semibold text-primary-foreground text-lg capitalize">{interestCalculationMethod.replace('-', ' ')}</p>
                </div>
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                  <p className="text-sm text-primary-foreground/70 mb-1">Total Interest</p>
                  <p className="font-semibold text-secondary text-lg">ZMW {totalInterest.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                  <p className="text-sm text-primary-foreground/70 mb-1">Total Amount</p>
                  <p className="font-semibold text-secondary text-lg">ZMW {totalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 md:col-span-3">
                  <p className="text-sm text-primary-foreground/70 mb-1">Monthly Payment</p>
                  <p className="font-semibold text-secondary text-lg">ZMW {monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Repayment Schedule Preview */}
        {currentStep === 'schedule' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <Calendar className="w-5 h-5" />
                Repayment Schedule
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Preview the complete repayment schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-foreground/10">
                      <th className="text-left py-3 px-4 text-primary-foreground font-semibold">Month</th>
                      <th className="text-left py-3 px-4 text-primary-foreground font-semibold">Due Date</th>
                      <th className="text-right py-3 px-4 text-primary-foreground font-semibold">Principal</th>
                      <th className="text-right py-3 px-4 text-primary-foreground font-semibold">Interest</th>
                      <th className="text-right py-3 px-4 text-primary-foreground font-semibold">Payment</th>
                      <th className="text-right py-3 px-4 text-primary-foreground font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repaymentSchedule.slice(0, 12).map((row, idx) => (
                      <tr key={idx} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                        <td className="py-3 px-4 text-primary-foreground">{row.month}</td>
                        <td className="py-3 px-4 text-primary-foreground">{row.dueDate}</td>
                        <td className="py-3 px-4 text-right text-primary-foreground">ZMW {parseFloat(row.principal).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-primary-foreground">ZMW {parseFloat(row.interest).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-secondary font-semibold">ZMW {parseFloat(row.payment).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-primary-foreground">ZMW {parseFloat(row.balance).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {months > 12 && (
                <p className="text-sm text-primary-foreground/70">Showing first 12 months of {months} month schedule</p>
              )}

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: KYC & Document Status */}
        {currentStep === 'kyc-docs' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <FileText className="w-5 h-5" />
                KYC & Document Status
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Review customer KYC verification and submitted documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-6">
                <h3 className="font-semibold text-primary-foreground mb-4">KYC Verification Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-primary-foreground">Verification Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCustomer?.kycVerificationStatus === 'Verified' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {selectedCustomer?.kycVerificationStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-6">
                <h3 className="font-semibold text-primary-foreground mb-4">Submitted Documents</h3>
                {kycDocuments.filter(doc => doc.customerId === selectedCustomerId).length === 0 ? (
                  <p className="text-primary-foreground/70">No documents submitted yet</p>
                ) : (
                  <div className="space-y-2">
                    {kycDocuments.filter(doc => doc.customerId === selectedCustomerId).map(doc => (
                      <div key={doc._id} className="flex items-center justify-between p-3 bg-primary-foreground/5 rounded">
                        <div>
                          <p className="text-primary-foreground font-medium">{doc.documentType}</p>
                          <p className="text-sm text-primary-foreground/70">{doc.verificationStatus}</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-secondary" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 8: Collateral Register */}
        {currentStep === 'collateral' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <Shield className="w-5 h-5" />
                Collateral Register
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Register collateral for this loan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-foreground mb-2">Collateral Description</label>
                <Textarea
                  value={collateralDescription}
                  onChange={(e) => setCollateralDescription(e.target.value)}
                  placeholder="Describe the collateral (e.g., property, vehicle, equipment)"
                  rows={4}
                  className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 9: Guarantors */}
        {currentStep === 'guarantors' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <Users className="w-5 h-5" />
                Guarantors
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Add guarantors for this loan (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary-foreground mb-2">Guarantor Name</label>
                  <Input
                    type="text"
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    placeholder="Enter guarantor name"
                    className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-foreground mb-2">Contact Information</label>
                  <Input
                    type="text"
                    value={guarantorContact}
                    onChange={(e) => setGuarantorContact(e.target.value)}
                    placeholder="Phone or email"
                    className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 10: Credit & Risk Assessment */}
        {currentStep === 'risk' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <TrendingUp className="w-5 h-5" />
                Credit & Risk Assessment
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Evaluate credit and risk factors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                  <p className="text-sm text-primary-foreground/70 mb-1">Credit Score</p>
                  <p className="font-semibold text-primary-foreground text-lg">{selectedCustomer?.creditScore || 'N/A'}</p>
                </div>
                <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                  <p className="text-sm text-primary-foreground/70 mb-1">Debt-to-Income Ratio</p>
                  <p className="font-semibold text-primary-foreground text-lg">Pending</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-foreground mb-2">Risk Assessment Notes</label>
                <Textarea
                  value={riskAssessment}
                  onChange={(e) => setRiskAssessment(e.target.value)}
                  placeholder="Document any risk factors or concerns"
                  rows={4}
                  className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 11: Approval Workflow */}
        {currentStep === 'approval' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <CheckCircle className="w-5 h-5" />
                Approval Workflow
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Set approval requirements and notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-6">
                <h3 className="font-semibold text-primary-foreground mb-4">Approval Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-primary-foreground">Current Status</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400">
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-foreground mb-2">Approval Notes</label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes for the approval process"
                  rows={4}
                  className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 12: Notes & Comments & Audit Trail */}
        {currentStep === 'notes' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <MessageSquare className="w-5 h-5" />
                Notes & Comments
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Add internal notes and comments for the audit trail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-foreground mb-2">Internal Comments</label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any internal comments or notes"
                  rows={6}
                  className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                />
              </div>

              <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-6">
                <h3 className="font-semibold text-primary-foreground mb-4">Audit Trail</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-primary-foreground/70">Application Created</span>
                    <span className="text-primary-foreground">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-foreground/70">Status</span>
                    <span className="text-primary-foreground">Pending Approval</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={goToNextStep}
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-primary"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 13: Review & Submit */}
        {currentStep === 'review' && (
          <Card className="bg-primary border-primary-foreground/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <FileText className="w-5 h-5" />
                Review Application
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Review all details before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="bg-primary border border-primary-foreground/10">
                  <TabsTrigger value="summary" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-secondary data-[state=active]:text-primary">
                    Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                      <p className="text-sm text-primary-foreground/70 mb-1">Customer</p>
                      <p className="font-semibold text-primary-foreground">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
                    </div>
                    <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                      <p className="text-sm text-primary-foreground/70 mb-1">Product</p>
                      <p className="font-semibold text-primary-foreground">{selectedProduct?.productName}</p>
                    </div>
                    <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                      <p className="text-sm text-primary-foreground/70 mb-1">Principal Amount</p>
                      <p className="font-semibold text-primary-foreground">ZMW {principal.toLocaleString()}</p>
                    </div>
                    <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                      <p className="text-sm text-primary-foreground/70 mb-1">Monthly Payment</p>
                      <p className="font-semibold text-secondary">ZMW {monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-6">
                  <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-6 space-y-4">
                    <div>
                      <p className="text-sm text-primary-foreground/70 mb-1">Loan Purpose</p>
                      <p className="text-primary-foreground">{purpose || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70 mb-1">Collateral</p>
                      <p className="text-primary-foreground">{collateralDescription || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-foreground/70 mb-1">Guarantor</p>
                      <p className="text-primary-foreground">{guarantorName || 'Not specified'}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={goToPreviousStep}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </Button>
                <Button
                  onClick={handleCreateApplication}
                  disabled={isLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 14: Confirmation */}
        {currentStep === 'confirmation' && (
          <Card className="bg-primary border-primary-foreground/10 text-center">
            <CardContent className="py-12">
              <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-6" />
              <h2 className="font-heading text-4xl font-bold text-primary-foreground mb-3">Application Submitted</h2>
              <p className="text-primary-foreground/70 mb-8 text-lg">
                The loan application has been successfully created and is pending approval.
              </p>
              <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-6 mb-8">
                <p className="text-sm text-primary-foreground/70 mb-2">Loan Number</p>
                <p className="font-semibold text-primary-foreground text-xl">LN-{Date.now()}</p>
              </div>
              <Button
                onClick={() => navigate('/admin/loans')}
                className="w-full bg-secondary hover:bg-secondary/90 text-primary h-12 text-lg"
              >
                View All Loans
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
