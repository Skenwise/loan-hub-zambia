# Authentication & Conditional Routing Implementation Guide

## Overview

This document describes the implementation of persistent user-organisation relationship checks and conditional routing based on organisation membership and user role.

## Key Features Implemented

### 1. **AuthenticationService** (`/src/services/AuthenticationService.ts`)

A new centralized service that handles all authentication logic and organisation context determination.

#### Core Methods:

**`checkUserOrganisationContext(userEmail: string): Promise<UserOrganisationContext>`**
- Primary method for post-login authentication flow
- Checks user's organisation membership in this order:
  1. Admin check: Is user an admin (organisation contact email match)?
  2. Invited user check: Is user an invited staff member?
  3. New user: No organisation membership
- Returns comprehensive context object with routing information

**`canUserCreateOrganisation(userEmail: string): Promise<boolean>`**
- Validates if user can create a new organisation
- Only new users without any organisation membership can create

**`isUserOrganisationMember(userEmail: string): Promise<boolean>`**
- Quick check for organisation membership status

**`getUserOrganisations(userEmail: string): Promise<Organizations[]>`**
- Returns all organisations where user is a member (admin or invited staff)

**`storeAuthContext(context: UserOrganisationContext): void`**
- Stores authentication context in sessionStorage for quick access
- Includes timestamp for validation (1-hour expiry)

**`getStoredAuthContext(): Partial<UserOrganisationContext> | null`**
- Retrieves stored authentication context
- Validates timestamp before returning

**`clearAuthContext(): void`**
- Clears stored authentication context on logout

### 2. **UserOrganisationContext Interface**

```typescript
interface UserOrganisationContext {
  organisation: Organizations | null;
  staff: StaffMembers | null;
  role: Roles | null;
  userType: 'admin' | 'customer' | 'invited_user' | 'new_user';
  redirectPath: string | null;
  canCreateOrganisation: boolean;
  isOrganisationMember: boolean;
}
```

**User Types:**
- **admin**: User is an organisation admin (contact email match)
- **invited_user**: User is an invited staff member
- **customer**: User is a customer/borrower
- **new_user**: User has no organisation membership

### 3. **Updated Header Component** (`/src/components/Header.tsx`)

#### New Authentication Flow:

1. **Post-Login Detection**
   - Triggers when `isAuthenticated` becomes true
   - Calls `handlePostLoginAuthentication()`

2. **Organisation Context Check**
   - Calls `AuthenticationService.checkUserOrganisationContext()`
   - Stores context for quick access

3. **Conditional Routing**
   - **Existing Members**: Redirects directly to appropriate dashboard
     - Admins → `/admin/dashboard`
     - Invited users → Role-specific dashboard (Loan Officer, Branch Manager, etc.)
   - **New Users**: Shows role selection dialog
   - **Error Handling**: Falls back to role selection on error

#### Key Changes:
- Removed `handleSignInWithExistingOrg()` method
- Replaced with `handlePostLoginAuthentication()` for comprehensive checks
- Added `authContext` state to track user's organisation context
- Added `isCheckingAuth` state for loading during authentication check

### 4. **Authentication Flow Diagram**

```
User Logs In
    ↓
isAuthenticated = true
    ↓
handlePostLoginAuthentication()
    ↓
checkUserOrganisationContext(userEmail)
    ↓
    ├─ Is Admin? (organisation contact email match)
    │  ├─ YES → Redirect to /admin/dashboard
    │  └─ NO → Continue
    │
    ├─ Is Invited Staff? (staff member with organisationId)
    │  ├─ YES → Redirect to role-specific dashboard
    │  └─ NO → Continue
    │
    └─ Is New User?
       ├─ YES → Show role selection dialog
       └─ NO → Handle error (show role selection as fallback)
```

## Implementation Details

### Organisation Membership Checks

#### 1. Admin Check
```typescript
const adminOrganisations = await OrganisationService.getOrganisationsByEmail(userEmail);
if (adminOrganisations.length > 0) {
  // User is an admin
  return {
    userType: 'admin',
    redirectPath: '/admin/dashboard',
    canCreateOrganisation: false,
    isOrganisationMember: true,
  };
}
```

#### 2. Invited Staff Check
```typescript
const staffMember = await this.getStaffByEmail(userEmail);
if (staffMember && staffMember.organisationId) {
  // User is an invited staff member
  return {
    userType: 'invited_user',
    redirectPath: '/admin/dashboard', // or role-specific path
    canCreateOrganisation: false,
    isOrganisationMember: true,
  };
}
```

#### 3. New User Check
```typescript
// No admin organisation, no staff record
return {
  userType: 'new_user',
  redirectPath: null,
  canCreateOrganisation: true,
  isOrganisationMember: false,
};
```

### Session Storage

Authentication context is stored in sessionStorage for quick access:

```typescript
{
  userType: 'admin' | 'customer' | 'invited_user' | 'new_user',
  organisationId: string | null,
  staffId: string | null,
  roleId: string | null,
  redirectPath: string | null,
  canCreateOrganisation: boolean,
  isOrganisationMember: boolean,
  timestamp: number
}
```

**Expiry**: 1 hour (3600000 ms)

## Usage Examples

### Example 1: Admin User Login

```typescript
// User email: admin@company.com
// Organisation contact email: admin@company.com

const context = await AuthenticationService.checkUserOrganisationContext('admin@company.com');

// Result:
{
  organisation: { _id: 'org-123', organizationName: 'Company', contactEmail: 'admin@company.com', ... },
  staff: { _id: 'staff-123', email: 'admin@company.com', organisationId: 'org-123', role: 'Admin/Owner', ... },
  role: { _id: 'role-123', roleName: 'Admin/Owner', ... },
  userType: 'admin',
  redirectPath: '/admin/dashboard',
  canCreateOrganisation: false,
  isOrganisationMember: true
}

// User is redirected to /admin/dashboard
```

### Example 2: Invited Staff Member Login

```typescript
// User email: officer@company.com
// Staff record exists with organisationId: 'org-123'

const context = await AuthenticationService.checkUserOrganisationContext('officer@company.com');

// Result:
{
  organisation: { _id: 'org-123', ... },
  staff: { _id: 'staff-456', email: 'officer@company.com', organisationId: 'org-123', role: 'Loan Officer', ... },
  role: { _id: 'role-456', roleName: 'Loan Officer', ... },
  userType: 'invited_user',
  redirectPath: '/admin/dashboard/loan-officer',
  canCreateOrganisation: false,
  isOrganisationMember: true
}

// User is redirected to /admin/dashboard/loan-officer
```

### Example 3: New User Login

```typescript
// User email: newuser@example.com
// No organisation with matching contact email
// No staff record

const context = await AuthenticationService.checkUserOrganisationContext('newuser@example.com');

// Result:
{
  organisation: null,
  staff: null,
  role: null,
  userType: 'new_user',
  redirectPath: null,
  canCreateOrganisation: true,
  isOrganisationMember: false
}

// Role selection dialog is shown
```

## Key Business Rules

### 1. Organisation Creation
- **Only new users** can create organisations
- **Admins cannot create new organisations** (one-time action)
- **Invited users cannot create organisations**

### 2. Automatic Redirection
- **Existing members** are redirected directly to their dashboard
- **No role selection dialog** for existing members
- **Role selection only** for new users

### 3. User Types
- **Admin**: Has organisation with matching contact email
- **Invited User**: Has staff record with organisationId
- **Customer**: Registered customer without organisation membership
- **New User**: No organisation membership, can create one

### 4. Session Persistence
- Authentication context stored in sessionStorage
- Persists across page refreshes (within 1-hour window)
- Cleared on logout

## Integration Points

### 1. Header Component (`/src/components/Header.tsx`)
- Triggers authentication check on login
- Handles conditional routing
- Shows role selection for new users

### 2. RoleSelectionDialog (`/src/components/RoleSelectionDialog.tsx`)
- Only shown for new users
- Allows role selection (admin/customer)
- Triggers organisation creation flow

### 3. Router (`/src/components/Router.tsx`)
- Protected routes use `MemberProtectedRoute`
- Subscription features use `SubscriptionFeatureGuard`
- No changes needed for this implementation

### 4. Organisation Service (`/src/services/OrganisationService.ts`)
- Provides `getOrganisationsByEmail()` method
- Used by AuthenticationService for admin checks

### 5. Staff Service (`/src/services/StaffService.ts`)
- Provides staff member retrieval
- Used by AuthenticationService for invited user checks

## Error Handling

### Graceful Degradation
- If organisation check fails, shows role selection dialog
- Prevents user lockout
- Logs errors for debugging

### Session Expiry
- Stored context expires after 1 hour
- User must re-authenticate after expiry
- Automatic cleanup on logout

## Testing Scenarios

### Scenario 1: Admin User
1. Login with admin email
2. System checks organisation contact email
3. User redirected to `/admin/dashboard`
4. No role selection dialog shown

### Scenario 2: Invited Staff Member
1. Login with staff email
2. System checks staff records
3. User redirected to role-specific dashboard
4. No role selection dialog shown

### Scenario 3: New User
1. Login with new email
2. System finds no organisation or staff record
3. Role selection dialog shown
4. User selects role and creates organisation

### Scenario 4: Logout and Re-login
1. User logs out
2. Authentication context cleared
3. User logs in again
4. Full authentication check performed
5. Appropriate routing applied

## Future Enhancements

1. **Multi-Organisation Support**
   - Allow users to switch between organisations
   - Add organisation selector in header

2. **Role-Based Dashboards**
   - Customized dashboards per role
   - Different feature access based on role

3. **Invitation System**
   - Email invitations for staff members
   - Automatic staff record creation on acceptance

4. **SSO Integration**
   - Single Sign-On support
   - Automatic organisation detection

5. **Audit Logging**
   - Log authentication events
   - Track organisation membership changes

## Troubleshooting

### Issue: User not redirected after login
**Solution**: Check if `member?.loginEmail` is populated. Ensure authentication is complete before checking organisation context.

### Issue: Role selection dialog not showing for new users
**Solution**: Verify that no organisation or staff record exists for the user email. Check database for duplicate entries.

### Issue: Invited user cannot access dashboard
**Solution**: Verify staff record exists with correct `organisationId`. Check role permissions for the assigned role.

### Issue: Admin user redirected to wrong dashboard
**Solution**: Verify organisation contact email matches user login email (case-insensitive). Check for multiple organisations with same email.

## Summary

This implementation provides:
- ✅ Persistent user-organisation relationship checks
- ✅ Conditional routing based on membership and role
- ✅ One-time organisation creation for admins
- ✅ Direct dashboard access for existing members
- ✅ Role selection only for new users
- ✅ Prevention of organisation creation by invited users
- ✅ Graceful error handling
- ✅ Session persistence
- ✅ Comprehensive logging for debugging
