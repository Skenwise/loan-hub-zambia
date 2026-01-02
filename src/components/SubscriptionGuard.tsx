import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useOrganisationStore } from '@/store/organisationStore';
import { BaseCrudService } from '@/integrations';
import { Organizations, SubscriptionPlans, StaffMembers } from '@/entities';
import { StaffService, RoleService } from '@/services';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { member } = useMember();
  const { currentOrganisation, subscriptionPlan, setOrganisation, setSubscriptionPlan, setStaff, setRole, setPermissions } = useOrganisationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  useEffect(() => {
    loadOrganisationData();
  }, []);

  const loadOrganisationData = async () => {
    try {
      // In a real app, you'd get the organisation ID from the authenticated user
      // For now, we'll check if there's a current organisation in the store
      if (!currentOrganisation) {
        // Redirect to setup if no organisation is selected
        navigate('/setup');
        return;
      }

      // Fetch the subscription plan
      if (currentOrganisation.subscriptionPlanType) {
        const plan = await BaseCrudService.getById<SubscriptionPlans>(
          'subscriptionplans',
          currentOrganisation.subscriptionPlanType
        );

        if (plan) {
          setSubscriptionPlan(plan);

          // Check if subscription is active
          if (!plan.isActive) {
            setSubscriptionExpired(true);
          }
        }
      }

      // Load staff member and role information for the current user
      if (member?.loginEmail) {
        try {
          // Get staff member by email
          let staffMember = await StaffService.getStaffByEmail(member.loginEmail);
          
          // If staff member doesn't exist, create one with Admin/Owner role
           if (!staffMember) {
             console.warn('Staff member not found for email:', member.loginEmail);
             // Create a staff member with Admin/Owner role
             const newStaffId = crypto.randomUUID();
             staffMember = {
               _id: newStaffId,
               email: member.loginEmail,
               fullName: member.profile?.nickname || 'Administrator',
               role: 'Admin/Owner',
               status: 'active',
               employeeId: `EMP-${newStaffId.substring(0, 8).toUpperCase()}`,
               dateHired: new Date(),
             } as StaffMembers;
             
             // Create the staff member in the database
             await BaseCrudService.create('staffmembers', staffMember);
             
             // Assign Admin/Owner role
             const adminRole = await RoleService.getRoleByName('Admin/Owner');
             if (adminRole) {
               await StaffService.assignRole(
                 newStaffId,
                 adminRole._id,
                 currentOrganisation._id,
                 member.loginEmail
               );
             }
           }
          
          setStaff(staffMember);

          // Get staff member's role assignment
          let roleAssignment = await StaffService.getStaffRole(staffMember._id, currentOrganisation._id);
          
          // If no role assignment exists, assign Admin/Owner role
          if (!roleAssignment) {
            console.warn('No role assignment found for staff member, assigning Admin/Owner role');
            // Get or create Admin/Owner role
            const adminRole = await RoleService.getRoleByName('Admin/Owner');
            if (adminRole) {
              await StaffService.assignRole(
                staffMember._id,
                adminRole._id,
                currentOrganisation._id,
                member.loginEmail
              );
              
              roleAssignment = {
                _id: crypto.randomUUID(),
                staffMemberId: staffMember._id,
                roleId: adminRole._id,
                organizationId: currentOrganisation._id,
                status: 'ACTIVE',
              };
            }
          }
          
          if (roleAssignment?.roleId) {
            // Get the role details
            const role = await RoleService.getRole(roleAssignment.roleId);
            if (role) {
              setRole(role);
              
              // Get role permissions
              const permissions = await RoleService.getRolePermissions(roleAssignment.roleId);
              setPermissions(permissions);
            }
          }
        } catch (error) {
          console.error('Failed to load staff information:', error);
          // Create a fallback Admin/Owner staff member to allow admin access
          try {
            const fallbackStaffId = crypto.randomUUID();
            const fallbackStaff: StaffMembers = {
              _id: fallbackStaffId,
              email: member?.loginEmail || 'admin@system.local',
              fullName: member?.profile?.nickname || 'System Administrator',
              role: 'Admin/Owner',
              status: 'active',
              employeeId: `EMP-${fallbackStaffId.substring(0, 8).toUpperCase()}`,
              dateHired: new Date(),
            };
            setStaff(fallbackStaff);
            
            // Get Admin/Owner role
            const adminRole = await RoleService.getRoleByName('Admin/Owner');
            if (adminRole) {
              setRole(adminRole);
              const permissions = await RoleService.getRolePermissions(adminRole._id);
              setPermissions(permissions);
            }
          } catch (fallbackError) {
            console.error('Failed to create fallback staff member:', fallbackError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load organisation data:', error);
      navigate('/setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (subscriptionExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Expired</h1>
            <p className="text-gray-600 mb-6">
              Your subscription has expired. Please renew your subscription to continue using the platform.
            </p>
            <Button
              onClick={() => navigate('/setup')}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              Renew Subscription
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
