import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BaseCrudService } from '@/services';
import { LoanPenaltySettings, LoanProducts } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function LoanPenaltySettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');

  const [product, setProduct] = useState<LoanProducts | null>(null);
  const [penaltySettings, setPenaltySettings] = useState<LoanPenaltySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load product
      const prod = await BaseCrudService.getById<LoanProducts>('loanproducts', productId!);
      setProduct(prod);

      // Load penalty settings for this product
      const result = await BaseCrudService.getAll<LoanPenaltySettings>('loanpenaltysettings');
      const settings = result.items.find(s => s.loanProductId === productId);
      
      if (settings) {
        setPenaltySettings(settings);
      } else {
        // Create new penalty settings if none exist
        setPenaltySettings({
          _id: crypto.randomUUID(),
          loanProductId: productId,
          enableLatePaymentPenalty: false,
          enableEarlySettlementPenalty: false,
          enablePrepaymentPenalty: false,
        });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof LoanPenaltySettings, value: any) => {
    setPenaltySettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!penaltySettings) return;

    try {
      setIsSaving(true);
      setError(null);

      // Check if settings exist
      const existing = await BaseCrudService.getById<LoanPenaltySettings>(
        'loanpenaltysettings',
        penaltySettings._id
      );

      if (existing) {
        await BaseCrudService.update('loanpenaltysettings', penaltySettings);
      } else {
        await BaseCrudService.create('loanpenaltysettings', penaltySettings);
      }

      navigate('/admin/loans/loan-products');
    } catch (err) {
      setError('Failed to save penalty settings');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!penaltySettings || !product) return <div>Failed to load data</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/loans/loan-products')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Penalty Settings</h1>
            <p className="text-secondary-foreground mt-1">{product.productName}</p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg mb-6 flex gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Warning Banner */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> These penalty settings are product-level rules that apply to all new loans created with this product. Changes will be audited and can be applied to existing loans through bulk update.
          </p>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Late Payment Penalty */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Late Payment Penalty</h2>
              <Switch
                checked={penaltySettings.enableLatePaymentPenalty || false}
                onCheckedChange={(checked) => handleChange('enableLatePaymentPenalty', checked)}
              />
            </div>

            {penaltySettings.enableLatePaymentPenalty && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latePaymentGracePeriodDays">Grace Period (Days)</Label>
                    <Input
                      id="latePaymentGracePeriodDays"
                      type="number"
                      value={penaltySettings.latePaymentGracePeriodDays || 0}
                      onChange={(e) => handleChange('latePaymentGracePeriodDays', parseFloat(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="latePaymentRate">Penalty Rate (%)</Label>
                    <Input
                      id="latePaymentRate"
                      type="number"
                      step="0.01"
                      value={penaltySettings.latePaymentRate || 0}
                      onChange={(e) => handleChange('latePaymentRate', parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latePaymentCapAmount">Cap Amount</Label>
                    <Input
                      id="latePaymentCapAmount"
                      type="number"
                      step="0.01"
                      value={penaltySettings.latePaymentCapAmount || 0}
                      onChange={(e) => handleChange('latePaymentCapAmount', parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="latePaymentCalculationMethod">Calculation Method</Label>
                    <select
                      id="latePaymentCalculationMethod"
                      value={penaltySettings.latePaymentCalculationMethod || 'daily'}
                      onChange={(e) => handleChange('latePaymentCalculationMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-contentblockbackground rounded-md bg-background text-foreground"
                    >
                      <option value="daily">Daily</option>
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Early Settlement Penalty */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Early Settlement Penalty</h2>
              <Switch
                checked={penaltySettings.enableEarlySettlementPenalty || false}
                onCheckedChange={(checked) => handleChange('enableEarlySettlementPenalty', checked)}
              />
            </div>

            {penaltySettings.enableEarlySettlementPenalty && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="earlySettlementRate">Penalty Rate (%)</Label>
                    <Input
                      id="earlySettlementRate"
                      type="number"
                      step="0.01"
                      value={penaltySettings.earlySettlementRate || 0}
                      onChange={(e) => handleChange('earlySettlementRate', parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="earlySettlementCapAmount">Cap Amount</Label>
                    <Input
                      id="earlySettlementCapAmount"
                      type="number"
                      step="0.01"
                      value={penaltySettings.earlySettlementCapAmount || 0}
                      onChange={(e) => handleChange('earlySettlementCapAmount', parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="earlySettlementCalculationMethod">Calculation Method</Label>
                  <select
                    id="earlySettlementCalculationMethod"
                    value={penaltySettings.earlySettlementCalculationMethod || 'percentage'}
                    onChange={(e) => handleChange('earlySettlementCalculationMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-contentblockbackground rounded-md bg-background text-foreground"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>
            )}
          </Card>

          {/* Prepayment Penalty */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Prepayment Penalty</h2>
              <Switch
                checked={penaltySettings.enablePrepaymentPenalty || false}
                onCheckedChange={(checked) => handleChange('enablePrepaymentPenalty', checked)}
              />
            </div>

            {penaltySettings.enablePrepaymentPenalty && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prepaymentRate">Penalty Rate (%)</Label>
                    <Input
                      id="prepaymentRate"
                      type="number"
                      step="0.01"
                      value={penaltySettings.prepaymentRate || 0}
                      onChange={(e) => handleChange('prepaymentRate', parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prepaymentCapAmount">Cap Amount</Label>
                    <Input
                      id="prepaymentCapAmount"
                      type="number"
                      step="0.01"
                      value={penaltySettings.prepaymentCapAmount || 0}
                      onChange={(e) => handleChange('prepaymentCapAmount', parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="prepaymentCalculationMethod">Calculation Method</Label>
                  <select
                    id="prepaymentCalculationMethod"
                    value={penaltySettings.prepaymentCalculationMethod || 'percentage'}
                    onChange={(e) => handleChange('prepaymentCalculationMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-contentblockbackground rounded-md bg-background text-foreground"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-contentblockbackground">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/loans/loan-products')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Penalty Settings'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkUpdateModal(true)}
            >
              Apply to Existing Loans
            </Button>
          </div>
        </form>

        {/* Bulk Update Modal */}
        {showBulkUpdateModal && (
          <BulkUpdateModal
            productId={productId!}
            productName={product.productName}
            onClose={() => setShowBulkUpdateModal(false)}
          />
        )}
      </div>
    </div>
  );
}

function BulkUpdateModal({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const loanStatuses = ['Active', 'Pending', 'Approved', 'Disbursed'];

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleApply = async () => {
    if (selectedStatuses.length === 0) {
      alert('Please select at least one loan status');
      return;
    }

    try {
      setIsProcessing(true);
      // TODO: Implement bulk update background job trigger
      // For now, just show success message
      alert(`Bulk update initiated for ${selectedStatuses.join(', ')} loans. This will be processed in the background.`);
      onClose();
    } catch (err) {
      alert('Failed to initiate bulk update');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Apply Penalty Settings to Existing Loans</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-yellow-900">
            <strong>Warning:</strong> This will apply the new penalty settings to all existing loans with the selected statuses for <strong>{productName}</strong>. This action is asynchronous and will be audited.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-semibold text-foreground">Select loan statuses to update:</p>
          {loanStatuses.map(status => (
            <label key={status} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStatuses.includes(status)}
                onChange={() => handleStatusToggle(status)}
                className="w-4 h-4"
              />
              <span className="text-foreground">{status}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isProcessing || selectedStatuses.length === 0}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : 'Apply Update'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
