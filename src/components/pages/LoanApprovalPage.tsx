import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, CustomerProfiles, LoanProducts } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

type ApprovalStatus = 'pending-approval' | 'approved' | 'rejected' | 'disbursed';

interface LoanWithDetails extends Loans {
  customer?: CustomerProfiles;
  product?: LoanProducts;
}

export default function LoanApprovalPage() {
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const { items } = await BaseCrudService.getAll<Loans>('loans', ['customerId', 'loanProductId']);
      setLoans(items as LoanWithDetails[]);
    } catch (error) {
      console.error('Failed to load loans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedLoan) return;

    setIsProcessing(true);
    try {
      await BaseCrudService.update('loans', {
        _id: selectedLoan._id,
        loanStatus: 'approved',
      });

      setLoans(loans.map(l =>
        l._id === selectedLoan._id ? { ...l, loanStatus: 'approved' } : l
      ));
      setSelectedLoan(null);
      setApprovalNotes('');
    } catch (error) {
      console.error('Failed to approve loan:', error);
      alert('Failed to approve loan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLoan || !approvalNotes) {
      alert('Please provide rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await BaseCrudService.update('loans', {
        _id: selectedLoan._id,
        loanStatus: 'rejected',
      });

      setLoans(loans.map(l =>
        l._id === selectedLoan._id ? { ...l, loanStatus: 'rejected' } : l
      ));
      setSelectedLoan(null);
      setApprovalNotes('');
    } catch (error) {
      console.error('Failed to reject loan:', error);
      alert('Failed to reject loan');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending-approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'disbursed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending-approval':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const pendingLoans = loans.filter(l => l.loanStatus === 'pending-approval');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Loan Approval Workflow</h1>
        <p className="text-gray-600 mt-2">Review and approve pending loan applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Loans List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Pending Applications ({pendingLoans.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="text-gray-600 text-sm">Loading...</p>
              ) : pendingLoans.length === 0 ? (
                <p className="text-gray-600 text-sm">No pending applications</p>
              ) : (
                pendingLoans.map(loan => (
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
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Loan Details & Approval Form */}
        <div className="lg:col-span-2">
          {selectedLoan ? (
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedLoan.loanNumber}</h2>
                  <Badge className={getStatusColor(selectedLoan.loanStatus as ApprovalStatus)}>
                    {getStatusIcon(selectedLoan.loanStatus as ApprovalStatus)}
                    <span className="ml-2 capitalize">{selectedLoan.loanStatus?.replace('-', ' ')}</span>
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
                    <p className="text-sm text-gray-600">Credit Score</p>
                    <p className="font-medium text-gray-900">{selectedLoan.customer?.creditScore || 'N/A'}</p>
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
                    <p className="font-medium text-gray-900">${selectedLoan.principalAmount?.toLocaleString()}</p>
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

              {/* Approval Form */}
              {selectedLoan.loanStatus === 'pending-approval' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Notes
                    </label>
                    <Textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Enter approval or rejection notes..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isProcessing ? 'Processing...' : 'Approve Loan'}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={isProcessing || !approvalNotes}
                      variant="destructive"
                      className="flex-1"
                    >
                      {isProcessing ? 'Processing...' : 'Reject Loan'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedLoan.loanStatus !== 'pending-approval' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-blue-900 font-medium">
                    This loan has already been {selectedLoan.loanStatus}
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a pending application to review</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
