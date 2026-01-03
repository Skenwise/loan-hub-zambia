import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { useOrganisationStore } from '@/store/organisationStore';
import { useRoleStore } from '@/store/roleStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

export default function AdminPortalLayout() {
  const location = useLocation();
  const { member, actions } = useMember();
  const { currentOrganisation, currentStaff } = useOrganisationStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const mainNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/loans', label: 'Loans', icon: FileText },
    { path: '/admin/loans/apply', label: 'New Application', icon: FileText },
    { path: '/admin/loans/approve', label: 'Approvals', icon: FileText },
    { path: '/admin/loans/disburse', label: 'Disbursement', icon: FileText },
    { path: '/admin/repayments', label: 'Repayments', icon: FileText },
    { path: '/admin/compliance/ifrs9', label: 'IFRS 9 Compliance', icon: BarChart3 },
    // Loan Officer Dashboard - only visible to Loan Officers
    ...(currentStaff?.role === 'Loan Officer' ? [{ path: '/admin/dashboard/loan-officer', label: 'Loan Officer Dashboard', icon: LayoutDashboard }] : []),
  ];

  const customersItems = [
    { path: '/admin/customers', label: 'View Customers', icon: Users },
  ];

  const repaymentsItems = [
    { path: '/admin/repayments', label: 'View Repayments', icon: FileText },
    { path: '/admin/repayments/bulk', label: 'Bulk Repayment', icon: FileText },
  ];

  const reportItems = [
    { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { path: '/admin/reports/advanced', label: 'Advanced Reports', icon: BarChart3 },
    { path: '/admin/reports/comprehensive', label: 'Comprehensive Reports', icon: BarChart3 },
    { path: '/admin/reports/disbursements', label: 'Disbursement Reports', icon: BarChart3 },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isCustomersActive = customersItems.some(item => isActive(item.path));
  const isRepaymentsActive = repaymentsItems.some(item => isActive(item.path));
  const isReportsActive = reportItems.some(item => isActive(item.path));
  const isSettingsActive = isActive('/admin/settings');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary text-white transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-primary/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-white">
              LD
            </div>
            {sidebarOpen && <span className="font-bold text-lg text-white">LendZm</span>}
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {mainNavItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-secondary text-white'
                      : 'text-white hover:bg-primary/80'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
                
                {/* Customers Folder - appears after Dashboard */}
                {index === 0 && (
                  <div className="pt-2">
                    <Link
                      to="/admin/customers"
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive('/admin/customers')
                          ? 'bg-secondary text-white'
                          : 'text-white hover:bg-primary/80'
                      }`}
                    >
                      <Users size={20} />
                      {sidebarOpen && <span>Customers</span>}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}

          {/* Collateral Register */}
          <div className="pt-2">
            <Link
              to="/admin/collateral-register"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive('/admin/collateral-register')
                  ? 'bg-secondary text-white'
                  : 'text-white hover:bg-primary/80'
              }`}
            >
              <FileText size={20} />
              {sidebarOpen && <span>Collateral Register</span>}
            </Link>
          </div>

          {/* Reports Folder */}
          <div className="pt-2">
            <Link
              to="/admin/reports"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive('/admin/reports')
                  ? 'bg-secondary text-white'
                  : 'text-white hover:bg-primary/80'
              }`}
            >
              <BarChart3 size={20} />
              {sidebarOpen && <span>Reports</span>}
            </Link>
          </div>

          {/* Settings Folder */}
          <div className="pt-2">
            <Link
              to="/admin/settings"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isSettingsActive
                  ? 'bg-secondary text-white'
                  : 'text-white hover:bg-primary/80'
              }`}
            >
              <Settings size={20} />
              {sidebarOpen && <span>Settings</span>}
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary/20 space-y-2 flex-shrink-0">
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isActive('/profile')
                ? 'bg-secondary text-white'
                : 'text-white hover:bg-primary/80'
            }`}
          >
            <Settings size={20} />
            {sidebarOpen && <span>Profile</span>}
          </Link>
          <button
            onClick={() => actions.logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-primary/80 transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentOrganisation?.organizationName || 'Organization'}
              </h1>
              <p className="text-sm text-gray-600">Admin Portal</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                {member?.profile?.nickname?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {member?.profile?.nickname || 'User'}
              </span>
              <ChevronDown size={16} className="text-gray-600" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    actions.logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
