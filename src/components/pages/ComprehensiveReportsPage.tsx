/**
 * Comprehensive Reports Page
 * Central hub for all operational, financial, and regulatory reports
 */

import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { ReportingService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  reports: Report[];
}

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'OPERATIONAL' | 'FINANCIAL' | 'RISK' | 'REGULATORY';
  lastGenerated?: Date;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

export default function ComprehensiveReportsPage() {
  const { member } = useMember();
  const { currentOrganisation } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('operational');

  const reportCategories: ReportCategory[] = [
    {
      id: 'operational',
      name: 'Operational Reports',
      description: 'Loan portfolio, repayments, and collections',
      icon: <BarChart3 className="w-6 h-6" />,
      reports: [
        {
          id: 'loan-portfolio',
          name: 'Loan Portfolio Report',
          description: 'Active, approved, disbursed, closed, and written-off loans',
          type: 'OPERATIONAL',
          frequency: 'DAILY',
        },
        {
          id: 'repayment-collections',
          name: 'Repayment & Collections Report',
          description: 'Scheduled vs actual repayments, collections by channel',
          type: 'OPERATIONAL',
          frequency: 'DAILY',
        },
        {
          id: 'arrears-npl',
          name: 'Arrears & NPL Report',
          description: 'Aging analysis, portfolio at risk, NPL summary',
          type: 'OPERATIONAL',
          frequency: 'DAILY',
        },
      ],
    },
    {
      id: 'customer',
      name: 'Customer Reports',
      description: 'Customer-centric loan and compliance data',
      icon: <Users className="w-6 h-6" />,
      reports: [
        {
          id: 'customer-loans',
          name: 'Customer Loan Report',
          description: 'Customer loan history, outstanding balances, repayment history',
          type: 'OPERATIONAL',
          frequency: 'MONTHLY',
        },
        {
          id: 'customer-compliance',
          name: 'Customer Compliance Report',
          description: 'KYC completion status, expiring IDs, missing documents',
          type: 'REGULATORY',
          frequency: 'MONTHLY',
        },
      ],
    },
    {
      id: 'risk',
      name: 'Risk & Credit Reports',
      description: 'Credit analysis, exposure, and collateral coverage',
      icon: <AlertTriangle className="w-6 h-6" />,
      reports: [
        {
          id: 'credit-risk',
          name: 'Credit & Risk Report',
          description: 'Credit score distribution, approval rates, exposure analysis',
          type: 'RISK',
          frequency: 'MONTHLY',
        },
        {
          id: 'large-exposures',
          name: 'Large Exposures Report',
          description: 'Customers with exposure >5% of portfolio',
          type: 'RISK',
          frequency: 'MONTHLY',
        },
      ],
    },
    {
      id: 'financial',
      name: 'Financial Reports',
      description: 'Accounting and financial statements',
      icon: <TrendingUp className="w-6 h-6" />,
      reports: [
        {
          id: 'trial-balance',
          name: 'Trial Balance',
          description: 'General ledger account balances',
          type: 'FINANCIAL',
          frequency: 'MONTHLY',
        },
        {
          id: 'income-statement',
          name: 'Income Statement',
          description: 'Revenue, expenses, and net income',
          type: 'FINANCIAL',
          frequency: 'MONTHLY',
        },
        {
          id: 'balance-sheet',
          name: 'Balance Sheet',
          description: 'Assets, liabilities, and equity',
          type: 'FINANCIAL',
          frequency: 'MONTHLY',
        },
      ],
    },
    {
      id: 'ecl',
      name: 'ECL & Compliance',
      description: 'IFRS 9 Expected Credit Loss calculations',
      icon: <PieChart className="w-6 h-6" />,
      reports: [
        {
          id: 'ecl-summary',
          name: 'ECL Summary Report',
          description: 'Stage 1, 2, 3 ECL calculations and impairment charges',
          type: 'REGULATORY',
          frequency: 'MONTHLY',
        },
        {
          id: 'ecl-movement',
          name: 'ECL Movement Report',
          description: 'Month-on-month ECL changes and drivers',
          type: 'REGULATORY',
          frequency: 'MONTHLY',
        },
      ],
    },
  ];

  const handleGenerateReport = async (report: Report) => {
    try {
      setIsLoading(true);
      setSelectedReport(report);

      // Generate appropriate report
      let data;
      switch (report.id) {
        case 'loan-portfolio':
          data = await ReportingService.generateLoanPortfolioReport(
            currentOrganisation?._id || ''
          );
          break;
        case 'repayment-collections':
          data = await ReportingService.generateRepaymentCollectionsReport(
            currentOrganisation?._id || '',
            new Date().toISOString().split('T')[0]
          );
          break;
        case 'arrears-npl':
          data = await ReportingService.generateArrearsNPLReport(
            currentOrganisation?._id || ''
          );
          break;
        case 'credit-risk':
          data = await ReportingService.generateCreditRiskReport(
            currentOrganisation?._id || ''
          );
          break;
        case 'ecl-summary':
          data = await ReportingService.generateECLReport(
            currentOrganisation?._id || '',
            new Date().getFullYear().toString()
          );
          break;
        default:
          data = {};
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !selectedReport) return;

    try {
      const csv = ReportingService.exportToCSV([reportData], Object.keys(reportData));
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      element.setAttribute('download', `${selectedReport.id}-${Date.now()}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleExportPDF = () => {
    if (!selectedReport) return;
    alert('PDF export feature coming soon. Please use CSV export for now.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-2">
            Comprehensive Reports
          </h1>
          <p className="text-primary-foreground/70">
            Generate operational, financial, and regulatory reports
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-200 mb-8">
              {reportCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-slate-900 text-xs md:text-sm"
                >
                  {category.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {reportCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6">
                {/* Category Header */}
                <div className="flex items-start gap-4 p-6 rounded-lg bg-slate-50 border border-slate-300">
                  <div className="text-blue-600">{category.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{category.name}</h2>
                    <p className="text-slate-600 mt-1">{category.description}</p>
                  </div>
                </div>

                {/* Reports Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.reports.map((report, idx) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="bg-slate-50 border-slate-300 hover:border-blue-400 transition-all h-full flex flex-col">
                        <CardHeader>
                          <CardTitle className="text-slate-900 text-lg">
                            {report.name}
                          </CardTitle>
                          <CardDescription className="text-slate-600">
                            {report.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between">
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300 border text-xs">
                                {report.type}
                              </Badge>
                              <Badge className="bg-green-100 text-green-700 border-green-300 border text-xs">
                                {report.frequency}
                              </Badge>
                            </div>
                            {report.lastGenerated && (
                              <p className="text-xs text-slate-600">
                                Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleGenerateReport(report)}
                            disabled={isLoading && selectedReport?.id === report.id}
                            className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isLoading && selectedReport?.id === report.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Report Preview */}
        {selectedReport && reportData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="bg-slate-50 border-slate-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900">{selectedReport.name}</CardTitle>
                    <CardDescription className="text-slate-600">
                      Generated on {new Date().toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExportCSV}
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      variant="outline"
                      className="border-slate-300 text-slate-900 hover:bg-slate-100"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ReportPreview report={selectedReport} data={reportData} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Report Preview Component
function ReportPreview({ report, data }: { report: Report; data: any }) {
  switch (report.id) {
    case 'loan-portfolio':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Active Loans</p>
              <p className="text-2xl font-bold text-slate-900">{data.active?.count || 0}</p>
              <p className="text-xs text-slate-600 mt-1">
                ZMW {(data.active?.amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Closed Loans</p>
              <p className="text-2xl font-bold text-slate-900">{data.closed?.count || 0}</p>
              <p className="text-xs text-slate-600 mt-1">
                ZMW {(data.closed?.amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Written Off</p>
              <p className="text-2xl font-bold text-red-600">{data.writtenOff?.count || 0}</p>
              <p className="text-xs text-slate-600 mt-1">
                ZMW {(data.writtenOff?.amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Total Portfolio</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalLoans || 0}</p>
              <p className="text-xs text-slate-600 mt-1">
                ZMW {(data.totalAmount || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );

    case 'arrears-npl':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-300">
              <p className="text-xs text-blue-700 mb-1">1-30 Days</p>
              <p className="text-2xl font-bold text-blue-900">{data.par1to30?.count || 0}</p>
              <p className="text-xs text-blue-700 mt-1">
                ZMW {(data.par1to30?.amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-300">
              <p className="text-xs text-yellow-700 mb-1">31-60 Days</p>
              <p className="text-2xl font-bold text-yellow-900">{data.par31to60?.count || 0}</p>
              <p className="text-xs text-yellow-700 mt-1">
                ZMW {(data.par31to60?.amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-300">
              <p className="text-xs text-orange-700 mb-1">61-90 Days</p>
              <p className="text-2xl font-bold text-orange-900">{data.par61to90?.count || 0}</p>
              <p className="text-xs text-orange-700 mt-1">
                ZMW {(data.par61to90?.amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-300">
              <p className="text-xs text-red-700 mb-1">90+ Days</p>
              <p className="text-2xl font-bold text-red-900">{data.par90plus?.count || 0}</p>
              <p className="text-xs text-red-700 mt-1">
                ZMW {(data.par90plus?.amount || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Portfolio at Risk (PAR)</p>
              <p className="text-3xl font-bold text-slate-900">{data.portfolioAtRisk?.toFixed(2) || 0}%</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">NPL Ratio</p>
              <p className="text-3xl font-bold text-slate-900">{data.nplRatio?.toFixed(2) || 0}%</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Total in Arrears</p>
              <p className="text-2xl font-bold text-red-600">
                ZMW {(data.amountInArrears || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );

    case 'ecl-summary':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-300">
              <p className="text-xs text-blue-700 mb-1">Stage 1 (Low Risk)</p>
              <p className="text-2xl font-bold text-blue-900">{data.stage1?.count || 0}</p>
              <p className="text-xs text-blue-700 mt-1">
                ECL: ZMW {(data.stage1?.ecl || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-300">
              <p className="text-xs text-yellow-700 mb-1">Stage 2 (Medium Risk)</p>
              <p className="text-2xl font-bold text-yellow-900">{data.stage2?.count || 0}</p>
              <p className="text-xs text-yellow-700 mt-1">
                ECL: ZMW {(data.stage2?.ecl || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-300">
              <p className="text-xs text-red-700 mb-1">Stage 3 (High Risk)</p>
              <p className="text-2xl font-bold text-red-900">{data.stage3?.count || 0}</p>
              <p className="text-xs text-red-700 mt-1">
                ECL: ZMW {(data.stage3?.ecl || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Total ECL</p>
              <p className="text-3xl font-bold text-slate-900">
                ZMW {(data.totalECL || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
              <p className="text-xs text-slate-600 mb-1">Impairment Charge</p>
              <p className="text-3xl font-bold text-slate-900">
                ZMW {(data.impairmentCharge || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
          <pre className="text-xs text-slate-900 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
  }
}
