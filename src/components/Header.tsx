import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from '@/integrations';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard } from 'lucide-react';
import RoleSelectionDialog from '@/components/RoleSelectionDialog';

export default function Header() {
  const { member, isAuthenticated, isLoading, actions } = useMember();
  const navigate = useNavigate();
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const handleLogout = async () => {
    await actions.logout();
    navigate('/');
  };

  const handleSignIn = () => {
    setShowRoleDialog(true);
  };

  const handleRoleSelect = (role: 'admin' | 'customer') => {
    setShowRoleDialog(false);
    // Store the selected role in sessionStorage for use after login
    sessionStorage.setItem('selectedRole', role);
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
              <span className="text-secondary-foreground font-heading font-bold text-lg">Z</span>
            </div>
            <span className="font-heading text-xl font-bold text-primary-foreground">ZamLoan</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {!isAuthenticated && (
              <>
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
            {isAuthenticated && (
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
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
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
                  <DropdownMenuItem onClick={() => navigate('/admin/dashboard')} className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
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
