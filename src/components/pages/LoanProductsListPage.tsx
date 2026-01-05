import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/services';
import { LoanProducts } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, Edit2, Settings } from 'lucide-react';

export default function LoanProductsListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<LoanProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<LoanProducts>('loanproducts');
      setProducts(result.items);
      setError(null);
    } catch (err) {
      setError('Failed to load loan products');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Loan Products</h1>
            <p className="text-secondary-foreground">Manage loan products and their penalty settings</p>
          </div>
          <Button 
            onClick={() => navigate('/admin/loans/loan-products/add-edit')}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Add Product
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-secondary-foreground mb-4">No loan products found</p>
            <Button onClick={() => navigate('/admin/loans/loan-products/add-edit')}>
              Create First Product
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground mb-2">{product.productName}</h3>
                  <p className="text-sm text-secondary-foreground mb-3">{product.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-foreground">Interest Rate:</span>
                      <span className="text-foreground font-semibold">{product.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-foreground">Loan Term:</span>
                      <span className="text-foreground font-semibold">{product.loanTermMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-foreground">Amount Range:</span>
                      <span className="text-foreground font-semibold">
                        {product.minLoanAmount} - {product.maxLoanAmount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-contentblockbackground pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/loans/loan-products/add-edit?id=${product._id}`)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/loans/loan-products/penalty-settings?productId=${product._id}`)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Settings size={16} />
                    Penalties
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
