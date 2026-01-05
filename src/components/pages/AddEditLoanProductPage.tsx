import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BaseCrudService } from '@/services';
import { LoanProducts } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft } from 'lucide-react';

export default function AddEditLoanProductPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');

  const [formData, setFormData] = useState<LoanProducts>({
    _id: crypto.randomUUID(),
    productName: '',
    productType: '',
    description: '',
    interestRate: 0,
    minLoanAmount: 0,
    maxLoanAmount: 0,
    loanTermMonths: 0,
    processingFee: 0,
    eligibilityCriteria: '',
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(!!productId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const product = await BaseCrudService.getById<LoanProducts>('loanproducts', productId!);
      if (product) {
        setFormData(product);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load product');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName || !formData.productType) {
      setError('Product name and type are required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (productId) {
        await BaseCrudService.update('loanproducts', formData);
      } else {
        await BaseCrudService.create('loanproducts', formData);
      }

      navigate('/admin/loans/loan-products');
    } catch (err) {
      setError('Failed to save product');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-4xl font-bold text-foreground">
              {productId ? 'Edit Loan Product' : 'Create Loan Product'}
            </h1>
            <p className="text-secondary-foreground mt-1">
              {productId ? 'Update product details' : 'Add a new loan product'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Basic Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="e.g., Personal Loan"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="productType">Product Type *</Label>
                  <Input
                    id="productType"
                    name="productType"
                    value={formData.productType}
                    onChange={handleChange}
                    placeholder="e.g., Unsecured"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description"
                  rows={3}
                />
              </div>
            </div>

            {/* Financial Terms */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Financial Terms</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                  <Input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="processingFee">Processing Fee</Label>
                  <Input
                    id="processingFee"
                    name="processingFee"
                    type="number"
                    step="0.01"
                    value={formData.processingFee}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minLoanAmount">Minimum Loan Amount *</Label>
                  <Input
                    id="minLoanAmount"
                    name="minLoanAmount"
                    type="number"
                    step="0.01"
                    value={formData.minLoanAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxLoanAmount">Maximum Loan Amount *</Label>
                  <Input
                    id="maxLoanAmount"
                    name="maxLoanAmount"
                    type="number"
                    step="0.01"
                    value={formData.maxLoanAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="loanTermMonths">Loan Term (Months) *</Label>
                <Input
                  id="loanTermMonths"
                  name="loanTermMonths"
                  type="number"
                  value={formData.loanTermMonths}
                  onChange={handleChange}
                  placeholder="12"
                  required
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Eligibility</h2>
              
              <div>
                <Label htmlFor="eligibilityCriteria">Eligibility Criteria</Label>
                <Textarea
                  id="eligibilityCriteria"
                  name="eligibilityCriteria"
                  value={formData.eligibilityCriteria}
                  onChange={handleChange}
                  placeholder="Describe eligibility requirements"
                  rows={3}
                />
              </div>
            </div>

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
                {isSaving ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
