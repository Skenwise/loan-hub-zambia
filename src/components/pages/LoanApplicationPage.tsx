import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, LoanProducts, CustomerProfiles } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';

type ApplicationStep = 'customer-selection' | 'loan-details' | 'review' | 'confirmation';

export default function LoanApplicationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('customer-selection');
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [customers, setCustomers] = useState<CustomerProfiles[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProducts[]>([]);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [loanTermMonths, setLoanTermMonths] = useState('');
  const [purpose, setPurpose] = useState('');

  // Calculated values
  const selectedProduct = loanProducts.find(p => p._id === selectedProductId);
  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);
  const monthlyPayment = selectedProduct && principalAmount
    ? (parseFloat(principalAmount) * (1 + (selectedProduct.interestRate || 0) / 100)) / (parseInt(loanTermMonths) || 1)
    : 0;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        BaseCrudService.getAll<CustomerProfiles>('customers'),
        BaseCrudService.getAll<LoanProducts>('loanproducts'),
      ]);
      setCustomers(customersRes.items);
      setLoanProducts(productsRes.items.filter(p => p.isActive === true));
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
        principalAmount: parseFloat(principalAmount),
        outstandingBalance: parseFloat(principalAmount),
        loanStatus: 'pending-approval',
        interestRate: selectedProduct?.interestRate || 0,
        loanTermMonths: parseInt(loanTermMonths),
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Loan Application</h1>
        <p className="text-gray-600 mt-2">Create and manage loan applications</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        <div className={`flex-1 h-2 rounded-full ${['customer-selection', 'loan-details', 'review', 'confirmation'].indexOf(currentStep) >= 0 ? 'bg-primary' : 'bg-gray-300'}`} />
        <div className={`flex-1 h-2 rounded-full ${['loan-details', 'review', 'confirmation'].indexOf(currentStep) >= 0 ? 'bg-primary' : 'bg-gray-300'}`} />
        <div className={`flex-1 h-2 rounded-full ${['review', 'confirmation'].indexOf(currentStep) >= 0 ? 'bg-primary' : 'bg-gray-300'}`} />
        <div className={`flex-1 h-2 rounded-full ${currentStep === 'confirmation' ? 'bg-primary' : 'bg-gray-300'}`} />
      </div>

      {/* Step 1: Customer Selection */}
      {currentStep === 'customer-selection' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Select Customer</h2>
          <div className="space-y-4">
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No customers found</p>
                <p className="text-sm text-gray-500">Please add customers first in the Customer Management section</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {customers.map(customer => (
                      <button
                        key={customer._id}
                        onClick={() => setSelectedCustomerId(customer._id || '')}
                        className={`w-full text-left p-4 border-b last:border-b-0 transition-colors ${
                          selectedCustomerId === customer._id
                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{customer.nationalIdNumber}</p>
                          </div>
                          {selectedCustomerId === customer._id && (
                            <ChevronRight className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Customer Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{selectedCustomer.emailAddress}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium">{selectedCustomer.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Credit Score</p>
                        <p className="font-medium">{selectedCustomer.creditScore || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">KYC Status</p>
                        <p className="font-medium">{selectedCustomer.kycVerificationStatus}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => selectedCustomerId && setCurrentStep('loan-details')}
                  disabled={!selectedCustomerId}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  Continue
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Loan Details */}
      {currentStep === 'loan-details' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Loan Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loan Product *</label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <option value="">Choose a product...</option>
                {loanProducts.map(product => (
                  <option key={product._id} value={product._id || ''}>
                    {product.productName} - {product.interestRate}% interest
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal Amount *</label>
              <Input
                type="number"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="Enter amount"
                min={selectedProduct?.minLoanAmount}
                max={selectedProduct?.maxLoanAmount}
              />
              {selectedProduct && (
                <p className="text-xs text-gray-600 mt-1">
                  Range: {selectedProduct.minLoanAmount} - {selectedProduct.maxLoanAmount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term (Months) *</label>
              <Input
                type="number"
                value={loanTermMonths}
                onChange={(e) => setLoanTermMonths(e.target.value)}
                placeholder="Enter term in months"
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter loan purpose"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep('customer-selection')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep('review')}
                disabled={!selectedProductId || !principalAmount || !loanTermMonths}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                Review
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Review */}
      {currentStep === 'review' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Review Application</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold text-gray-900">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Product</p>
                <p className="font-semibold text-gray-900">{selectedProduct?.productName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Principal Amount</p>
                <p className="font-semibold text-gray-900">${parseFloat(principalAmount || '0').toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Interest Rate</p>
                <p className="font-semibold text-gray-900">{selectedProduct?.interestRate}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Loan Term</p>
                <p className="font-semibold text-gray-900">{loanTermMonths} months</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Payment</p>
                <p className="font-semibold text-gray-900">${monthlyPayment.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep('loan-details')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateApplication}
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                {isLoading ? 'Creating...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 'confirmation' && (
        <Card className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Application Submitted</h2>
          <p className="text-gray-600 mb-6">
            The loan application has been successfully created and is pending approval.
          </p>
          <Button
            onClick={() => navigate('/admin/loans')}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            View All Loans
          </Button>
        </Card>
      )}
    </div>
  );
}
