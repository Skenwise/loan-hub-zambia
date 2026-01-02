import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { useOrganisationStore } from '@/store/organisationStore';
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
  const { currentOrganisation } = useOrganisationStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/customers', label: 'Customers', icon: Users },
    { path: '/admin/loans', label: 'Loans', icon: FileText },
    { path: '/admin/loans/apply', label: 'New Application', icon: FileText },
    { path: '/admin/loans/approve', label: 'Approvals', icon: FileText },
    { path: '/admin/loans/disburse', label: 'Disbursement', icon: FileText },
    { path: '/admin/repayments', label: 'Repayments', icon: FileText },
    { path: '/admin/repayments/bulk', label: 'Bulk Repayment', icon: FileText },
    { path: '/admin/collateral-register', label: 'Collateral Register', icon: FileText },
    { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { path: '/admin/reports/advanced', label: 'Advanced Reports', icon: BarChart3 },
    { path: '/admin/reports/comprehensive', label: 'Comprehensive Reports', icon: BarChart3 },
    { path: '/admin/reports/disbursements', label: 'Disbursement Reports', icon: BarChart3 },
    { path: '/admin/compliance/ifrs9', label: 'IFRS 9 Compliance', icon: BarChart3 },
    { path: '/admin/settings/organisation', label: 'Organisation Settings', icon: Settings },
    { path: '/admin/settings/organisation-admin', label: 'Org Admin Settings', icon: Settings },
    { path: '/admin/settings/branch-manager', label: 'Branch Settings', icon: Settings },
    { path: '/admin/settings/kyc-configuration', label: 'KYC Configuration', icon: Settings },
    { path: '/admin/settings/currency', label: 'Currency Settings', icon: Settings },
    { path: '/admin/settings/system-owner', label: 'System Settings', icon: Settings },
    { path: '/admin/dashboard/loan-officer', label: 'Loan Officer Dashboard', icon: LayoutDashboard },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-primary">
              LD
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Lendly</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-secondary text-primary'
                    : 'text-white hover:bg-primary/80'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary/20 space-y-2">
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isActive('/profile')
                ? 'bg-secondary text-primary'
                : 'text-white hover:bg-primary/80'
            }`}
          >
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
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
