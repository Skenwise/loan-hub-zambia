import { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { Loans, ECLResults, BoZProvisions } from '@/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCurrencyStore } from '@/store/currencyStore';
import { AlertCircle, TrendingDown, TrendingUp, Calendar } from 'lucide-react';

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
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filteredECLResults, setFilteredECLResults] = useState<ECLResults[]>([]);
  const { getCurrencyCode, getCurrencySymbol } = useCurrencyStore();

  useEffect(() => {
    loadComplianceData();
  }, []);

  useEffect(() => {
    applyDateRangeFilter();
  }, [dateRange, eclResults]);

  const loadComplianceData = async () => {
    try {
      const [loansRes, eclRes, bozRes] = await Promise.all([
        BaseCrudService.getAll<Loans>('loans'),
        BaseCrudService.getAll<ECLResults>('eclresults'),
        BaseCrudService.getAll<BoZProvisions>('bozprovisions'),
      ]);

      setLoans(loansRes.items);
      setEclResults(eclRes.items);
      setFilteredECLResults(eclRes.items);
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

  const applyDateRangeFilter = () => {
    if (!dateRange.start && !dateRange.end) {
      setFilteredECLResults(eclResults);
      return;
    }

    const filtered = eclResults.filter(ecl => {
      const calcDate = new Date(ecl.calculationTimestamp || '');
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date('2100-12-31');
      
      return calcDate >= startDate && calcDate <= endDate;
    });

    setFilteredECLResults(filtered);
  };

  const calculateECLAtPointInTime = () => {
    if (!dateRange.start && !dateRange.end) {
      return metrics?.totalECL || 0;
    }

    return filteredECLResults.reduce((sum, e) => sum + (e.eclValue || 0), 0);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Stage 1':
        return 'bg-secondary/20 text-secondary';
      case 'Stage 2':
        return 'bg-brandaccent/20 text-brandaccent';
      case 'Stage 3':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-primary-foreground/10 text-primary-foreground';
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
      <div className="min-h-screen bg-primary flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-paragraph text-primary-foreground/70">Loading compliance data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currencyCode = getCurrencyCode();
  const currencySymbol = getCurrencySymbol();

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-[120rem] mx-auto px-6 lg:px-12 py-12">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-secondary mb-2">IFRS 9 Compliance</h1>
          <p className="font-paragraph text-base text-primary-foreground">
            Expected Credit Loss (ECL) and Risk Classification
          </p>
        </div>

        {/* Date Range Filter for ECL Calculation */}
        <Card className="bg-primary border-primary-foreground/10 p-6 mb-8">
          <h2 className="font-heading text-xl font-bold text-secondary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            ECL Calculation at Point in Time
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-primary border-primary-foreground/20 text-primary-foreground"
              />
            </div>
            <div>
              <Label className="font-paragraph text-sm text-primary-foreground mb-2 block">End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-primary border-primary-foreground/20 text-primary-foreground"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setDateRange({ start: '', end: '' })}
                className="bg-primary border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 w-full"
              >
                Clear Filters
              </Button>
            </div>
            <div className="flex items-end">
              <div className="w-full p-3 bg-primary-foreground/5 rounded-lg border border-primary-foreground/10">
                <p className="font-paragraph text-xs text-primary-foreground/60 mb-1">ECL at Point in Time</p>
                <p className="font-heading text-lg font-bold text-secondary">
                  {currencySymbol}{calculateECLAtPointInTime().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <p className="font-paragraph text-xs text-primary-foreground/60 mt-4">
            Filter ECL results by calculation date to analyze Expected Credit Loss at a specific point in time
          </p>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-primary border-primary-foreground/10 p-6">
            <p className="font-paragraph text-sm text-primary-foreground/70 mb-2">Total Loans</p>
            <p className="font-heading text-3xl font-bold text-primary-foreground">{metrics?.totalLoans || 0}</p>
          </Card>
          <Card className="bg-primary border-primary-foreground/10 p-6">
            <p className="font-paragraph text-sm text-primary-foreground/70 mb-2">Total ECL</p>
            <p className="font-heading text-3xl font-bold text-secondary">{currencySymbol} {(metrics?.totalECL || 0).toLocaleString()}</p>
          </Card>
          <Card className="bg-primary border-primary-foreground/10 p-6">
            <p className="font-paragraph text-sm text-primary-foreground/70 mb-2">Total Provisions</p>
            <p className="font-heading text-3xl font-bold text-secondary">{currencySymbol} {(metrics?.totalProvisions || 0).toLocaleString()}</p>
          </Card>
          <Card className="bg-primary border-primary-foreground/10 p-6">
            <p className="font-paragraph text-sm text-primary-foreground/70 mb-2">Average ECL per Loan</p>
            <p className="font-heading text-3xl font-bold text-primary-foreground">{currencySymbol} {(metrics?.averageECL || 0).toFixed(2)}</p>
          </Card>
        </div>

        {/* Stage Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary border-primary-foreground/10 p-6">
            <h3 className="font-heading font-semibold text-secondary mb-4">Stage 1 (Low Risk)</h3>
            <div className="text-center">
              <p className="font-heading text-4xl font-bold text-secondary">{metrics?.stage1Loans || 0}</p>
              <p className="font-paragraph text-sm text-primary-foreground/70 mt-2">
                {metrics?.totalLoans ? ((metrics.stage1Loans / metrics.totalLoans) * 100).toFixed(1) : 0}% of portfolio
              </p>
            </div>
            <p className="font-paragraph text-xs text-primary-foreground/60 mt-4">12-month ECL provision</p>
          </Card>

          <Card className="bg-primary border-primary-foreground/10 p-6">
            <h3 className="font-heading font-semibold text-secondary mb-4">Stage 2 (Medium Risk)</h3>
            <div className="text-center">
              <p className="font-heading text-4xl font-bold text-brandaccent">{metrics?.stage2Loans || 0}</p>
              <p className="font-paragraph text-sm text-primary-foreground/70 mt-2">
                {metrics?.totalLoans ? ((metrics.stage2Loans / metrics.totalLoans) * 100).toFixed(1) : 0}% of portfolio
              </p>
            </div>
            <p className="font-paragraph text-xs text-primary-foreground/60 mt-4">Lifetime ECL provision</p>
          </Card>

          <Card className="bg-primary border-primary-foreground/10 p-6">
            <h3 className="font-heading font-semibold text-secondary mb-4">Stage 3 (High Risk)</h3>
            <div className="text-center">
              <p className="font-heading text-4xl font-bold text-destructive">{metrics?.stage3Loans || 0}</p>
              <p className="font-paragraph text-sm text-primary-foreground/70 mt-2">
                {metrics?.totalLoans ? ((metrics.stage3Loans / metrics.totalLoans) * 100).toFixed(1) : 0}% of portfolio
              </p>
            </div>
            <p className="font-paragraph text-xs text-primary-foreground/60 mt-4">Credit-impaired loans</p>
          </Card>
        </div>

        {/* ECL Results Table */}
        <Card className="bg-primary border-primary-foreground/10 p-6 mb-8">
          <h2 className="font-heading text-xl font-semibold text-secondary mb-4">ECL Calculation Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-foreground/10">
                  <th className="text-left py-3 px-4 font-paragraph font-semibold text-primary-foreground">Loan Reference</th>
                  <th className="text-left py-3 px-4 font-paragraph font-semibold text-primary-foreground">IFRS 9 Stage</th>
                  <th className="text-right py-3 px-4 font-paragraph font-semibold text-primary-foreground">ECL Value</th>
                  <th className="text-left py-3 px-4 font-paragraph font-semibold text-primary-foreground">Calculation Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredECLResults.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center font-paragraph text-primary-foreground/60">
                      No ECL results available
                    </td>
                  </tr>
                ) : (
                  filteredECLResults.slice(0, 10).map(ecl => (
                    <tr key={ecl._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                      <td className="py-3 px-4 font-paragraph text-primary-foreground">{ecl.loanReference}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStageColor(ecl.ifrs9Stage || '')}>
                          {ecl.ifrs9Stage}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-paragraph font-medium text-primary-foreground">
                        {currencySymbol} {(ecl.eclValue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-paragraph text-primary-foreground/70">
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
        <Card className="bg-primary border-primary-foreground/10 p-6 mb-8">
          <h2 className="font-heading text-xl font-semibold text-secondary mb-4">Bank of Zimbabwe Provisions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-foreground/10">
                  <th className="text-left py-3 px-4 font-paragraph font-semibold text-primary-foreground">Loan ID</th>
                  <th className="text-left py-3 px-4 font-paragraph font-semibold text-primary-foreground">BoZ Classification</th>
                  <th className="text-right py-3 px-4 font-paragraph font-semibold text-primary-foreground">Provision Amount</th>
                  <th className="text-right py-3 px-4 font-paragraph font-semibold text-primary-foreground">Provision %</th>
                  <th className="text-left py-3 px-4 font-paragraph font-semibold text-primary-foreground">Effective Date</th>
                </tr>
              </thead>
              <tbody>
                {bozProvisions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center font-paragraph text-primary-foreground/60">
                      No BoZ provisions available
                    </td>
                  </tr>
                ) : (
                  bozProvisions.slice(0, 10).map(prov => (
                    <tr key={prov._id} className="border-b border-primary-foreground/5 hover:bg-primary-foreground/5">
                      <td className="py-3 px-4 font-paragraph text-primary-foreground">{prov.loanId}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-secondary/20 text-secondary">
                          {prov.bozClassification}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-paragraph font-medium text-primary-foreground">
                        {currencySymbol} {(prov.provisionAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-paragraph text-primary-foreground/70">
                        {prov.provisionPercentage}%
                      </td>
                      <td className="py-3 px-4 font-paragraph text-primary-foreground/70">
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
        <Card className="bg-secondary/10 border border-secondary/20 p-6 mb-8">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-heading font-semibold text-secondary mb-2">IFRS 9 Compliance Information</h3>
              <ul className="font-paragraph text-sm text-primary-foreground/80 space-y-1">
                <li>• Stage 1: Loans with no significant increase in credit risk since origination</li>
                <li>• Stage 2: Loans with significant increase in credit risk but not credit-impaired</li>
                <li>• Stage 3: Credit-impaired loans (30+ days past due)</li>
                <li>• ECL is calculated based on probability of default, loss given default, and exposure at default</li>
                <li>• BoZ provisions follow Bank of Zimbabwe regulatory requirements</li>
                <li>• Currency: {currencyCode} - All amounts displayed in {currencyCode}</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
