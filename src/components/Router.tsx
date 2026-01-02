import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
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
import CustomerLoanApplicationPage from '@/components/pages/CustomerLoanApplicationPage';
import CustomerLoansPage from '@/components/pages/CustomerLoansPage';
import AdminLoansManagementPage from '@/components/pages/AdminLoansManagementPage';
import CurrencySettingsPage from '@/components/pages/CurrencySettingsPage';
import SystemOwnerSettingsPage from '@/components/pages/SystemOwnerSettingsPage';
import OrganisationAdminSettingsPage from '@/components/pages/OrganisationAdminSettingsPage';
import BranchManagerSettingsPage from '@/components/pages/BranchManagerSettingsPage';
import CollateralRegisterPage from '@/components/pages/CollateralRegisterPage';
import KYCUploadPage from '@/components/pages/KYCUploadPage';

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
        path: "customer-portal/apply",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to apply for a loan">
            <CustomerLoanApplicationPage />
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
        element: <CustomersPage />,
      },
      {
        path: "loans",
        element: <AdminLoansManagementPage />,
      },
      {
        path: "loans/apply",
        element: <LoanApplicationPage />,
      },
      {
        path: "loans/approve",
        element: <LoanApprovalPage />,
      },
      {
        path: "loans/disburse",
        element: <DisbursementPage />,
      },
      {
        path: "repayments",
        element: <RepaymentsPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "reports/advanced",
        element: <AdvancedReportsPage />,
      },
      {
        path: "compliance/ifrs9",
        element: <IFRS9CompliancePage />,
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
        path: "settings/system-owner",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access system settings">
            <SystemOwnerSettingsPage />
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
        path: "settings/branch-manager",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access branch settings">
            <BranchManagerSettingsPage />
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
