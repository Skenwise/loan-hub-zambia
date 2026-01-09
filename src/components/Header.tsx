import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, Globe, Settings } from 'lucide-react';
import RoleSelectionDialog from '@/components/RoleSelectionDialog';
import { useCurrencyStore, CURRENCY_RATES, type Currency } from '@/store/currencyStore';
import { OrganisationService } from '@/services';

export default function Header() {
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const navigate = useNavigate();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'customer' | null>(null);
  const { currency, setCurrency } = useCurrencyStore();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Handle post-login redirect for existing users
  useEffect(() => {
    if (isAuthenticated && !hasRedirected && !isLoading) {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
        setHasRedirected(true);
      }
    }
  }, [isAuthenticated, isLoading, hasRedirected, navigate]);

  useEffect(() => {
    // Determine user role based on current path or stored preference
    const path = window.location.pathname;
    const storedRole = sessionStorage.getItem('selectedRole') || localStorage.getItem('userRole');
    
    if (path.startsWith('/customer-portal')) {
      setUserRole('customer');
    } else if (path.startsWith('/admin')) {
      setUserRole('admin');
    } else if (isAuthenticated && storedRole) {
      // Use stored role if available
      setUserRole(storedRole as 'admin' | 'customer');
    } else if (isAuthenticated && !path.startsWith('/')) {
      // If authenticated but on a public page, default to customer
      setUserRole('customer');
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    // Clear stored role on logout
    sessionStorage.removeItem('selectedRole');
    localStorage.removeItem('userRole');
    await actions.logout();
    navigate('/');
  };

  const handleSignIn = () => {
    setShowRoleDialog(true);
  };

  const handleRoleSelect = (role: 'admin' | 'customer') => {
    setShowRoleDialog(false);
    // Store the selected role in both sessionStorage and localStorage for persistence
    sessionStorage.setItem('selectedRole', role);
    localStorage.setItem('userRole', role);
    // Redirect to appropriate dashboard after login
    if (role === 'customer') {
      sessionStorage.setItem('redirectAfterLogin', '/customer-portal');
    } else {
      sessionStorage.setItem('redirectAfterLogin', '/admin/dashboard');
    }
    actions.login();
  };

  const handleSignInWithExistingOrg = async () => {
    // Check if user has existing organizations
    if (member?.loginEmail) {
      const existingOrgs = await OrganisationService.getOrganisationsByEmail(member.loginEmail);
      
      if (existingOrgs.length > 0) {
        // User has existing organizations - redirect to admin dashboard
        sessionStorage.setItem('selectedRole', 'admin');
        localStorage.setItem('userRole', 'admin');
        sessionStorage.setItem('redirectAfterLogin', '/admin/dashboard');
        navigate('/admin/dashboard');
      } else {
        // No existing organizations - show role selection
        setShowRoleDialog(true);
      }
    } else {
      // No member info - show role selection
      setShowRoleDialog(true);
    }
  };

  return (
    <header className="bg-primary border-b border-deep-blue/20 shadow-sm">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-deep-blue flex items-center justify-center shadow-sm">
              <span className="text-white font-heading font-bold text-lg">L</span>
            </div>
            <span className="font-heading text-xl font-bold text-deep-blue">Lunar</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {!isAuthenticated && (
              <>
                <Link to="/" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Home
                </Link>
                <Link to="/features" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Features
                </Link>
                <Link to="/pricing" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Pricing
                </Link>
                <Link to="/compliance" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Compliance
                </Link>
              </>
            )}
            {isAuthenticated && userRole === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Dashboard
                </Link>
                <Link to="/admin/loans" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Loans
                </Link>
                <Link to="/admin/customers" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Customers
                </Link>
                <Link to="/admin/reports" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Reports
                </Link>
              </>
            )}
            {isAuthenticated && userRole === 'customer' && (
              <>
                <Link to="/customer-portal" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  Dashboard
                </Link>
                <Link to="/customer-portal/loans" className="text-deep-blue font-semibold hover:text-deep-blue-light transition-colors font-paragraph text-sm">
                  My Loans
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-deep-blue font-semibold hover:bg-contentblockbackground">
                  <Globe className="w-4 h-4" />
                  <span className="hidden md:inline font-paragraph text-sm">{currency}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border border-deep-blue/20">
                {Object.entries(CURRENCY_RATES).map(([code, rate]) => (
                  <DropdownMenuItem 
                    key={code}
                    onClick={() => setCurrency(code as Currency)}
                    className="cursor-pointer text-deep-blue font-medium"
                  >
                    {rate.symbol} {code} - {rate.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-deep-blue/10 animate-pulse" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-deep-blue font-semibold hover:bg-contentblockbackground">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline font-paragraph text-sm">
                      {member?.profile?.nickname || member?.contact?.firstName || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-deep-blue/20">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer text-deep-blue font-medium">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {userRole === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')} className="cursor-pointer text-deep-blue font-medium">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {userRole === 'customer' && (
                    <DropdownMenuItem onClick={() => navigate('/customer-portal')} className="cursor-pointer text-deep-blue font-medium">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Dashboard
                    </DropdownMenuItem>
                  )}
                  {userRole === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/settings/currency')} className="cursor-pointer text-deep-blue font-medium">
                      <Settings className="w-4 h-4 mr-2" />
                      Currency Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive font-medium">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={handleSignInWithExistingOrg}
                className="bg-deep-blue text-white hover:bg-deep-blue-light font-paragraph font-semibold rounded-lg h-10 px-6 shadow-sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      <RoleSelectionDialog 
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        onSelectRole={handleRoleSelect}
      />
    </header>
  );
}
