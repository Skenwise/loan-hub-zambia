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

export default function Header() {
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const navigate = useNavigate();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'customer' | null>(null);
  const { currency, setCurrency } = useCurrencyStore();

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

  return (
    <header className="bg-primary border-b border-primary-foreground/10">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-secondary-foreground font-heading font-bold text-lg">R</span>
            </div>
            <span className="font-heading text-xl font-bold text-primary-foreground">Reliq</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {!isAuthenticated && (
              <>
                <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Home
                </Link>
                <Link to="/features" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Features
                </Link>
                <Link to="/pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Pricing
                </Link>
                <Link to="/compliance" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Compliance
                </Link>
              </>
            )}
            {isAuthenticated && userRole === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Dashboard
                </Link>
                <Link to="/admin/loans" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Loans
                </Link>
                <Link to="/admin/customers" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Customers
                </Link>
                <Link to="/admin/reports" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Reports
                </Link>
              </>
            )}
            {isAuthenticated && userRole === 'customer' && (
              <>
                <Link to="/customer-portal" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
                  Dashboard
                </Link>
                <Link to="/customer-portal/loans" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-paragraph text-sm">
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
                <Button variant="ghost" className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10">
                  <Globe className="w-4 h-4" />
                  <span className="hidden md:inline font-paragraph text-sm">{currency}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-primary-foreground/20">
                {Object.entries(CURRENCY_RATES).map(([code, rate]) => (
                  <DropdownMenuItem 
                    key={code}
                    onClick={() => setCurrency(code as Currency)}
                    className="cursor-pointer"
                  >
                    {rate.symbol} {code} - {rate.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-primary-foreground/10 animate-pulse" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline font-paragraph text-sm">
                      {member?.profile?.nickname || member?.contact?.firstName || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border-primary-foreground/20">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {userRole === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {userRole === 'customer' && (
                    <DropdownMenuItem onClick={() => navigate('/customer-portal')} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Dashboard
                    </DropdownMenuItem>
                  )}
                  {userRole === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/settings/currency')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Currency Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={handleSignIn}
                className="bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90 font-paragraph rounded-lg h-10 px-6"
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
