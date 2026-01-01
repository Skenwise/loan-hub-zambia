import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import HomePage from '@/components/pages/HomePage';
import ProfilePage from '@/components/pages/ProfilePage';
import DashboardPage from '@/components/pages/DashboardPage';
import CustomersPage from '@/components/pages/CustomersPage';
import LoansPage from '@/components/pages/LoansPage';
import RepaymentsPage from '@/components/pages/RepaymentsPage';
import ReportsPage from '@/components/pages/ReportsPage';
import OrganisationSetupPage from '@/components/pages/OrganisationSetupPage';
import AdminPortalLayout from '@/components/AdminPortalLayout';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';

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
        element: <DashboardPage />,
      },
      {
        path: "customers",
        element: <CustomersPage />,
      },
      {
        path: "loans",
        element: <LoansPage />,
      },
      {
        path: "repayments",
        element: <RepaymentsPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
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
