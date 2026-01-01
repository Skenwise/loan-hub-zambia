import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, ECLResults, BoZProvisions } from '@/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface ComplianceMetrics {
  totalLoans: number;
  stage1Loans: number;
  stage2Loans: number;
  stage3Loans: number;
  totalECL: number;
  totalProvisions: number;
  averageECL: number;
}

export default function IFRS9CompliancePage() {
  const [loans, setLoans] = useState<Loans[]>([]);
  const [eclResults, setEclResults] = useState<ECLResults[]>([]);
  const [bozProvisions, setBozProvisions] = useState<BoZProvisions[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loans | null>(null);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      const [loansRes, eclRes, bozRes] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<ECLResults>('eclresults'),
        BaseCrudService.getAll<BoZProvisions>('bozprovisions'),
      ]);

      setLoans(loansRes.items);
      setEclResults(eclRes.items);
      setBozProvisions(bozRes.items);

      // Calculate metrics
      const stage1 = eclRes.items.filter(e => e.ifrs9Stage === 'Stage 1').length;
      const stage2 = eclRes.items.filter(e => e.ifrs9Stage === 'Stage 2').length;
      const stage3 = eclRes.items.filter(e => e.ifrs9Stage === 'Stage 3').length;
      const totalECL = eclRes.items.reduce((sum, e) => sum + (e.eclValue || 0), 0);
      const totalProvisions = bozRes.items.reduce((sum, b) => sum + (b.provisionAmount || 0), 0);

      setMetrics({
        totalLoans: loansRes.items.length,
        stage1Loans: stage1,
        stage2Loans: stage2,
        stage3Loans: stage3,
        totalECL,
        totalProvisions,
        averageECL: loansRes.items.length > 0 ? totalECL / loansRes.items.length : 0,
      });
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Stage 1':
        return 'bg-green-100 text-green-800';
      case 'Stage 2':
        return 'bg-yellow-100 text-yellow-800';
      case 'Stage 3':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case 'Stage 1':
        return 'Low credit risk - 12-month ECL';
      case 'Stage 2':
        return 'Significant increase in credit risk - Lifetime ECL';
      case 'Stage 3':
        return 'Credit-impaired - Lifetime ECL with higher provisions';
      default:
        return 'Unknown stage';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading compliance data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">IFRS 9 Compliance</h1>
        <p className="text-gray-600 mt-2">Expected Credit Loss (ECL) and Risk Classification</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total Loans</p>
          <p className="text-3xl font-bold text-gray-900">{metrics?.totalLoans || 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total ECL</p>
          <p className="text-3xl font-bold text-primary">${(metrics?.totalECL || 0).toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total Provisions</p>
          <p className="text-3xl font-bold text-primary">${(metrics?.totalProvisions || 0).toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Average ECL per Loan</p>
          <p className="text-3xl font-bold text-gray-900">${(metrics?.averageECL || 0).toFixed(2)}</p>
        </Card>
      </div>

      {/* Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Stage 1 (Low Risk)</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{metrics?.stage1Loans || 0}</p>
            <p className="text-sm text-gray-600 mt-2">
              {metrics?.totalLoans ? ((metrics.stage1Loans / metrics.totalLoans) * 100).toFixed(1) : 0}% of portfolio
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-4">12-month ECL provision</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Stage 2 (Medium Risk)</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-yellow-600">{metrics?.stage2Loans || 0}</p>
            <p className="text-sm text-gray-600 mt-2">
              {metrics?.totalLoans ? ((metrics.stage2Loans / metrics.totalLoans) * 100).toFixed(1) : 0}% of portfolio
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-4">Lifetime ECL provision</p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Stage 3 (High Risk)</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-red-600">{metrics?.stage3Loans || 0}</p>
            <p className="text-sm text-gray-600 mt-2">
              {metrics?.totalLoans ? ((metrics.stage3Loans / metrics.totalLoans) * 100).toFixed(1) : 0}% of portfolio
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-4">Credit-impaired loans</p>
        </Card>
      </div>

      {/* ECL Results Table */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ECL Calculation Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Loan Reference</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">IFRS 9 Stage</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">ECL Value</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Calculation Date</th>
              </tr>
            </thead>
            <tbody>
              {eclResults.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-600">
                    No ECL results available
                  </td>
                </tr>
              ) : (
                eclResults.slice(0, 10).map(ecl => (
                  <tr key={ecl._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{ecl.loanReference}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStageColor(ecl.ifrs9Stage || '')}>
                        {ecl.ifrs9Stage}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      ${(ecl.eclValue || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {ecl.calculationTimestamp ? new Date(ecl.calculationTimestamp).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* BoZ Provisions Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bank of Zimbabwe Provisions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Loan ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">BoZ Classification</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Provision Amount</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Provision %</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Effective Date</th>
              </tr>
            </thead>
            <tbody>
              {bozProvisions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-600">
                    No BoZ provisions available
                  </td>
                </tr>
              ) : (
                bozProvisions.slice(0, 10).map(prov => (
                  <tr key={prov._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{prov.loanId}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-blue-100 text-blue-800">
                        {prov.bozClassification}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      ${(prov.provisionAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {prov.provisionPercentage}%
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {prov.effectiveDate ? new Date(prov.effectiveDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compliance Notes */}
      <Card className="p-6 mt-8 bg-blue-50 border border-blue-200">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">IFRS 9 Compliance Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stage 1: Loans with no significant increase in credit risk since origination</li>
              <li>• Stage 2: Loans with significant increase in credit risk but not credit-impaired</li>
              <li>• Stage 3: Credit-impaired loans (30+ days past due)</li>
              <li>• ECL is calculated based on probability of default, loss given default, and exposure at default</li>
              <li>• BoZ provisions follow Bank of Zimbabwe regulatory requirements</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
