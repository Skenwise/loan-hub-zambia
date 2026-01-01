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
        path: "profile",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access your profile">
            <ProfilePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access your dashboard">
            <DashboardPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage customers">
            <CustomersPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "loans",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to manage loans">
            <LoansPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "repayments",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to process repayments">
            <RepaymentsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to view reports">
            <ReportsPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
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
