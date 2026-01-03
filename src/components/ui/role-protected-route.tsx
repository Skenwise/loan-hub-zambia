import { ReactNode } from 'react';
import { useOrganisationStore } from '@/store/organisationStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles: string[];
  messageToSignIn?: string;
}

/**
 * Role-based route protection component
 * Restricts access to specific user roles
 */
export function RoleProtectedRoute({
  children,
  requiredRoles,
  messageToSignIn = 'You do not have permission to access this page.',
}: RoleProtectedRouteProps) {
  const { currentStaff } = useOrganisationStore();

  // Check if user has required role
  const hasRequiredRole = currentStaff?.role && requiredRoles.includes(currentStaff.role);

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/95 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-foreground/70">
                {messageToSignIn}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
