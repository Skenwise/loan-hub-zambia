import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { RoleProtectedRoute } from '@/components/ui/role-protected-route';
import { SubscriptionFeatureGuard } from '@/components/ui/subscription-feature-guard';
import HomePage from '@/components/pages/HomePage';
import FeaturesPage from '@/components/pages/FeaturesPage';
import PricingPage from '@/components/pages/PricingPage';
import CompliancePage from '@/components/pages/CompliancePage';
import ProfilePage from '@/components/pages/ProfilePage';
import DashboardPage from '@/components/pages/DashboardPage';
import AdminDashboardPage from '@/components/pages/AdminDashboardPage';
import CustomersPage from '@/components/pages/CustomersPage';
import LoansPage from '@/components/pages/LoansPage';
import RepaymentsPage from '@/components/pages/RepaymentsPage';
import ReportsPage from '@/components/pages/ReportsPage';
import OrganisationSetupPage from '@/components/pages/OrganisationSetupPage';
import AdminPortalLayout from '@/components/AdminPortalLayout';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import LoanApplicationPage from '@/components/pages/LoanApplicationPage';
import LoanApprovalPage from '@/components/pages/LoanApprovalPage';
import DisbursementPage from '@/components/pages/DisbursementPage';
import IFRS9CompliancePage from '@/components/pages/IFRS9CompliancePage';
import AdvancedReportsPage from '@/components/pages/AdvancedReportsPage';
import CustomerPortalPage from '@/components/pages/CustomerPortalPage';
import CustomerLoansPage from '@/components/pages/CustomerLoansPage';
import AdminLoansManagementPage from '@/components/pages/AdminLoansManagementPage';
import CurrencySettingsPage from '@/components/pages/CurrencySettingsPage';
import OrganisationAdminSettingsPage from '@/components/pages/OrganisationAdminSettingsPage';
import BranchManagerSettingsPage from '@/components/pages/BranchManagerSettingsPage';
import CollateralRegisterPage from '@/components/pages/CollateralRegisterPage';
import KYCUploadPage from '@/components/pages/KYCUploadPage';
import KYCConfigurationPage from '@/components/pages/KYCConfigurationPage';
import DisbursementReportsPage from '@/components/pages/DisbursementReportsPage';
import LoanOfficerDashboardPage from '@/components/pages/LoanOfficerDashboardPage';
import RepaymentManagementPage from '@/components/pages/RepaymentManagementPage';
import BulkRepaymentPage from '@/components/pages/BulkRepaymentPage';
import CustomerSelfServiceRepaymentPage from '@/components/pages/CustomerSelfServiceRepaymentPage';
import ComprehensiveReportsPage from '@/components/pages/ComprehensiveReportsPage';
import OrganisationSettingsComprehensivePage from '@/components/pages/OrganisationSettingsComprehensivePage';
import CustomerSignupPage from '@/components/pages/CustomerSignupPage';
import BulkCustomerUploadPage from '@/components/pages/BulkCustomerUploadPage';
import SettingsPage from '@/components/pages/SettingsPage';
import StaffSettingsPage from '@/components/pages/StaffSettingsPage';
import RolesPermissionsPage from '@/components/pages/RolesPermissionsPage';
import LoanSettingsPage from '@/components/pages/LoanSettingsPage';
import LoanProductsListPage from '@/components/pages/LoanProductsListPage';
import AddEditLoanProductPage from '@/components/pages/AddEditLoanProductPage';
import LoanPenaltySettingsPage from '@/components/pages/LoanPenaltySettingsPage';
import LoanFeeConfigurationPage from '@/components/pages/LoanFeeConfigurationPage';
import BranchManagementPage from '@/components/pages/BranchManagementPage';
import DownloadStatementsPage from '@/components/pages/DownloadStatementsPage';
import ReportFormattingPage from '@/components/pages/ReportFormattingPage';
import RepaymentsSettingsPage from '@/components/pages/RepaymentsSettingsPage';
import RepaymentMethodsSettingsPage from '@/components/pages/RepaymentMethodsSettingsPage';
import CollectorsSettingsPage from '@/components/pages/CollectorsSettingsPage';
import CollateralTypesPage from '@/components/pages/CollateralTypesPage';
import AddEditCollateralTypePage from '@/components/pages/AddEditCollateralTypePage';
import DemoManagementPage from '@/components/pages/DemoManagementPage';
import SuperAdminSetupWizardPage from '@/components/pages/SuperAdminSetupWizardPage';

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "features",
        element: <FeaturesPage />,
      },
      {
        path: "pricing",
        element: <PricingPage />,
      },
      {
        path: "compliance",
        element: <CompliancePage />,
      },
      {
        path: "setup",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to set up your organization">
            <OrganisationSetupPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access your profile">
            <ProfilePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "customer-portal",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access your portal">
            <CustomerPortalPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "customer-portal/kyc",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to upload KYC documents">
            <KYCUploadPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "customer-portal/repayment",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to make a repayment">
            <CustomerSelfServiceRepaymentPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "customer-signup",
        element: <CustomerSignupPage />,
      },
      {
        path: "setup-wizard",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access setup wizard">
            <SuperAdminSetupWizardPage />
          </MemberProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <MemberProtectedRoute messageToSignIn="Sign in to access admin portal">
        <SubscriptionGuard>
          <AdminPortalLayout />
        </SubscriptionGuard>
      </MemberProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: "dashboard",
        element: <AdminDashboardPage />,
      },
      {
        path: "customers",
        element: (
          <SubscriptionFeatureGuard feature="customer_management">
            <CustomersPage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "customers/bulk-upload",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to bulk upload customers">
            <SubscriptionFeatureGuard feature="customer_management">
              <BulkCustomerUploadPage />
            </SubscriptionFeatureGuard>
          </MemberProtectedRoute>
        ),
      },
      {
        path: "loans",
        element: (
          <SubscriptionFeatureGuard feature="loan_management">
            <AdminLoansManagementPage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "loans/apply",
        element: (
          <SubscriptionFeatureGuard feature="loan_management">
            <LoanApplicationPage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "loans/approve",
        element: (
          <SubscriptionFeatureGuard feature="loan_management">
            <LoanApprovalPage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "loans/disburse",
        element: (
          <SubscriptionFeatureGuard feature="loan_management">
            <DisbursementPage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "repayments",
        element: (
          <SubscriptionFeatureGuard feature="loan_management">
            <RepaymentsPage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "reports",
        element: (
          <SubscriptionFeatureGuard feature="basic_reporting">
            <ReportsPage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "reports/advanced",
        element: (
          <SubscriptionFeatureGuard feature="advanced_reporting">
            <AdvancedReportsPage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "reports/comprehensive",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access reports">
            <SubscriptionFeatureGuard feature="advanced_reporting">
              <ComprehensiveReportsPage />
            </SubscriptionFeatureGuard>
          </MemberProtectedRoute>
        ),
      },
      {
        path: "compliance/ifrs9",
        element: (
          <SubscriptionFeatureGuard feature="ifrs9_compliance">
            <IFRS9CompliancePage />
          </SubscriptionFeatureGuard>
        ),
      },
      {
        path: "settings",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access settings">
            <SettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/staff",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access staff settings">
            <StaffSettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/roles-permissions",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access roles and permissions">
            <RolesPermissionsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/loans",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access loan settings">
            <LoanSettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/currency",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access currency settings">
            <CurrencySettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "collateral-register",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access collateral register">
            <CollateralRegisterPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/organisation-admin",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access organization settings">
            <OrganisationAdminSettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/organisation",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access organization settings">
            <OrganisationSettingsComprehensivePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/branch-manager",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access branch settings">
            <BranchManagerSettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/kyc-configuration",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access KYC configuration">
            <KYCConfigurationPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "reports/disbursements",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access disbursement reports">
            <DisbursementReportsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "dashboard/loan-officer",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access your dashboard">
            <RoleProtectedRoute 
              requiredRoles={['Loan Officer']}
              messageToSignIn="This dashboard is only accessible to Loan Officers."
            >
              <LoanOfficerDashboardPage />
            </RoleProtectedRoute>
          </MemberProtectedRoute>
        ),
      },
      {
        path: "repayments/bulk",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access bulk repayment processing">
            <BulkRepaymentPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "loans/loan-products",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access loan products">
            <LoanProductsListPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "loans/loan-products/add-edit",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage loan products">
            <AddEditLoanProductPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "loans/loan-products/penalty-settings",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage penalty settings">
            <LoanPenaltySettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/loan-fees",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage loan fees">
            <LoanFeeConfigurationPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/branches",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage branches">
            <BranchManagementPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/download-statements",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to download statements">
            <DownloadStatementsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/report-formatting",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to customize report formatting">
            <ReportFormattingPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/repayments",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access repayments settings">
            <RepaymentsSettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/repayments/methods",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage repayment methods">
            <RepaymentMethodsSettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "settings/repayments/collectors",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage collectors">
            <CollectorsSettingsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "collateral-types",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage collateral types">
            <CollateralTypesPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "collateral-types/add",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to add collateral types">
            <AddEditCollateralTypePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "collateral-types/edit/:id",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to edit collateral types">
            <AddEditCollateralTypePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "demo-management",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access demo management">
            <RoleProtectedRoute 
              requiredRoles={['Super Admin']}
              messageToSignIn="This page is only accessible to Super Admin users."
            >
              <DemoManagementPage />
            </RoleProtectedRoute>
          </MemberProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
