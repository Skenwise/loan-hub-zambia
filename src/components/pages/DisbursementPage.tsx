import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, CustomerProfiles, LoanProducts } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, DollarSign } from 'lucide-react';

interface LoanWithDetails extends Loans {
  customer?: CustomerProfiles;
  product?: LoanProducts;
}

export default function DisbursementPage() {
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Loans>('loans', ['customerId', 'loanProductId']);
      const approvedLoans = items.filter(l => l.loanStatus === 'approved') as LoanWithDetails[];
      setLoans(approvedLoans);
    } catch (error) {
      console.error('Failed to load loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisburse = async () => {
    if (!selectedLoan) return;

    setIsProcessing(true);
    try {
      await BaseCrudService.update('loans', {
        _id: selectedLoan._id,
        loanStatus: 'disbursed',
        disbursementDate: new Date(disbursementDate),
      });

      setLoans(loans.map(l =>
        l._id === selectedLoan._id ? { ...l, loanStatus: 'disbursed', disbursementDate: new Date(disbursementDate) } : l
      ));
      setSelectedLoan(null);
    } catch (error) {
      console.error('Failed to disburse loan:', error);
      alert('Failed to disburse loan');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateNextPaymentDate = (disbursementDate: Date | string, termMonths: number) => {
    const date = new Date(disbursementDate);
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Loan Disbursement</h1>
        <p className="text-gray-600 mt-2">Process approved loans for disbursement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approved Loans List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Ready for Disbursement ({loans.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="text-gray-600 text-sm">Loading...</p>
              ) : loans.length === 0 ? (
                <p className="text-gray-600 text-sm">No approved loans pending disbursement</p>
              ) : (
                loans.map(loan => (
                  <button
                    key={loan._id}
                    onClick={() => setSelectedLoan(loan)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedLoan?._id === loan._id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{loan.loanNumber}</p>
                    <p className="text-sm text-gray-600">${loan.principalAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {loan.customer?.firstName} {loan.customer?.lastName}
                    </p>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Disbursement Form */}
        <div className="lg:col-span-2">
          {selectedLoan ? (
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedLoan.loanNumber}</h2>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approved
                  </Badge>
                </div>
              </div>

              {/* Customer Information */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedLoan.customer?.firstName} {selectedLoan.customer?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">National ID</p>
                    <p className="font-medium text-gray-900">{selectedLoan.customer?.nationalIdNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedLoan.customer?.emailAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedLoan.customer?.phoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Loan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Product</p>
                    <p className="font-medium text-gray-900">{selectedLoan.product?.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Principal Amount</p>
                    <p className="font-medium text-lg text-primary">${selectedLoan.principalAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium text-gray-900">{selectedLoan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loan Term</p>
                    <p className="font-medium text-gray-900">{selectedLoan.loanTermMonths} months</p>
                  </div>
                </div>
              </div>

              {/* Disbursement Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disbursement Date
                  </label>
                  <Input
                    type="date"
                    value={disbursementDate}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Disbursement Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principal Amount</span>
                      <span className="font-medium">${selectedLoan.principalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Fee</span>
                      <span className="font-medium">
                        ${((selectedLoan.principalAmount || 0) * (selectedLoan.product?.processingFee || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Net Disbursement</span>
                      <span className="font-semibold text-primary">
                        ${(
                          (selectedLoan.principalAmount || 0) -
                          ((selectedLoan.principalAmount || 0) * (selectedLoan.product?.processingFee || 0) / 100)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>Note:</strong> First payment is due on{' '}
                    {calculateNextPaymentDate(disbursementDate, selectedLoan.loanTermMonths || 12)}
                  </p>
                </div>

                <Button
                  onClick={handleDisburse}
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Disburse Loan'}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select an approved loan to process disbursement</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
