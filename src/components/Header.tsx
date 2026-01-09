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
import { OrganisationMembershipService, type MembershipContext } from '@/services/OrganisationMembershipService';

export default function Header() {
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const navigate = useNavigate();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'customer' | null>(null);
  const { currency, setCurrency } = useCurrencyStore();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [membershipContext, setMembershipContext] = useState<MembershipContext | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Handle post-login authentication and routing
  // CRITICAL: Only run this effect once when user first authenticates
  useEffect(() => {
    console.log('[Header] Auth state changed:', { isAuthenticated, isLoading, hasRedirected, email: member?.loginEmail });
    
    // Only check membership once per session - prevent redirect loops
    if (isAuthenticated && !hasRedirected && !isLoading && member?.loginEmail) {
      // Check if we've already processed this user in this session
      const processedEmail = sessionStorage.getItem('processedAuthEmail');
      if (processedEmail === member.loginEmail) {
        console.log('[Header] User already processed in this session, skipping membership check');
        setHasRedirected(true);
        return;
      }
      
      console.log('[Header] Triggering post-login membership check');
      handlePostLoginMembershipCheck();
    }
  }, [isAuthenticated, isLoading, hasRedirected, member?.loginEmail]);

  const handlePostLoginMembershipCheck = async () => {
    if (!member?.loginEmail) {
      console.log('[Header] No login email available');
      return;
    }

    try {
      setIsCheckingAuth(true);
      console.log('[Header] Starting membership check for email:', member.loginEmail);

      // Check user's organisation membership from database by email
      const context = await OrganisationMembershipService.checkUserMembership(member.loginEmail);
      console.log('[Header] Membership context received:', {
        userType: context.userType,
        isSuperAdmin: context.isSuperAdmin,
        isOrganisationMember: context.isOrganisationMember,
        redirectPath: context.redirectPath,
        canCreateOrganisation: context.canCreateOrganisation,
      });
      
      setMembershipContext(context);

      // CRITICAL FIX: Only redirect if user is an organisation member
      // Never redirect existing members to setup page
      if (context.isOrganisationMember && context.redirectPath) {
        // Existing organisation member - redirect directly to role-specific dashboard
        console.log('[Header] Existing member found - redirecting to:', context.redirectPath);
        
        // For SUPER_ADMIN, grant full access and set admin role
        if (context.isSuperAdmin) {
          console.log('[Header] SUPER_ADMIN detected - granting full system access');
          sessionStorage.setItem('selectedRole', 'admin');
          localStorage.setItem('userRole', 'admin');
          sessionStorage.setItem('isSuperAdmin', 'true');
          localStorage.setItem('isSuperAdmin', 'true');
        } else {
          // Regular admin or staff member
          sessionStorage.setItem('selectedRole', context.userType === 'admin' || context.userType === 'staff' ? 'admin' : 'customer');
          localStorage.setItem('userRole', context.userType === 'admin' || context.userType === 'staff' ? 'admin' : 'customer');
        }
        
        // Mark this user as processed to prevent re-checking
        sessionStorage.setItem('processedAuthEmail', member.loginEmail);
        
        navigate(context.redirectPath);
        setHasRedirected(true);
      } else if (context.canCreateOrganisation && !context.isOrganisationMember) {
        // New user with no membership - redirect to organisation setup ONLY if they can create
        console.log('[Header] New user detected - redirecting to organisation setup');
        sessionStorage.setItem('processedAuthEmail', member.loginEmail);
        navigate('/setup');
        setHasRedirected(true);
      } else {
        // User is not a member and cannot create - this shouldn't happen in normal flow
        console.log('[Header] Unexpected state - user is not member and cannot create org');
        console.log('[Header] Keeping user on current page to prevent redirect loop');
        setHasRedirected(true);
      }
    } catch (error) {
      console.error('[Header] Error during membership check:', error);
      // On error, don't redirect - let user stay on current page
      console.log('[Header] Error occurred, not redirecting to prevent loops');
      setHasRedirected(true);
    } finally {
      setIsCheckingAuth(false);
    }
  };

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
    // Clear stored authentication data on logout
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
    <header className="bg-primary border-b border-deep-blue/20 shadow-sm">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-sm">
              <span className="text-primary font-heading font-bold text-lg">L</span>
            </div>
            <span className="font-heading text-xl font-bold text-white">Lunar</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {!isAuthenticated && (
              <>
                <Link to="/" className="text-white font-semibold hover:text-secondary transition-colors font-paragraph text-sm">
                  Home
                </Link>
                <Link to="/features" className="text-white font-semibold hover:text-secondary transition-colors font-paragraph text-sm">
                  Features
                </Link>
                <Link to="/pricing" className="text-white font-semibold hover:text-secondary transition-colors font-paragraph text-sm">
                  Pricing
                </Link>
                <Link to="/compliance" className="text-white font-semibold hover:text-secondary transition-colors font-paragraph text-sm">
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
                <Button variant="ghost" className="flex items-center gap-2 text-white font-semibold hover:text-secondary hover:bg-primary-foreground/10 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="hidden md:inline font-paragraph text-sm">{currency}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border border-deep-blue/20">
                {Object.entries(CURRENCY_RATES).map(([code, rate]) => (
                  <DropdownMenuItem 
                    key={code}
                    onClick={() => setCurrency(code as Currency)}
                    className="cursor-pointer text-deep-blue font-medium hover:bg-secondary/10"
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
                onClick={handleSignIn}
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
