# CRITICAL BUG FIX: Redirect Loop to Setup Page

## Problem Statement
After logging in, users were being incorrectly redirected to the "create organization" (setup) page whenever they clicked on any section or navigation item. This created a redirect loop that prevented authenticated users from accessing their intended dashboards.

## Root Causes Identified

### 1. **Missing OrganisationMemberships Entity**
- The `OrganisationMemberships` interface was referenced in `OrganisationMembershipService.ts` but was not defined in `/src/entities/index.ts`
- This caused the membership check to fail silently, treating all users as "new users"
- Result: All authenticated users were redirected to setup page

### 2. **Multiple Redirect Points Without Coordination**
- **Header.tsx**: Performed membership check and redirected to setup on error
- **HomePage.tsx**: Had its own redirect logic for authenticated users
- **SubscriptionGuard.tsx**: Redirected to setup if no organisation in store
- **PricingPage.tsx**: Redirected all users to setup regardless of auth status
- These components didn't coordinate, causing cascading redirects

### 3. **No Session-Level Redirect Prevention**
- The membership check ran on every page load
- No mechanism to prevent re-checking the same user multiple times
- This caused infinite redirect loops

### 4. **Incorrect Error Handling**
- When membership check failed, the system defaulted to redirecting to setup
- Should have kept users on their current page instead

## Solutions Implemented

### 1. **Added OrganisationMemberships Entity** ✅
**File**: `/src/entities/index.ts`

Added the missing interface definition:
```typescript
export interface OrganisationMemberships {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  userEmail?: string;
  userId?: string;
  organisationId?: string;
  membershipType?: string;
  role?: string;
  status?: string;
  joinedDate?: Date | string;
  isActive?: boolean;
}
```

### 2. **Fixed Header.tsx Authentication Flow** ✅
**File**: `/src/components/Header.tsx`

**Changes**:
- Added session-level tracking to prevent re-checking same user
- Only run membership check once per authenticated session
- Store `processedAuthEmail` in sessionStorage to prevent duplicate checks
- **CRITICAL**: Only redirect to setup if user is NEW (canCreateOrganisation && !isOrganisationMember)
- **CRITICAL**: Never redirect existing members to setup page
- On error, don't redirect - keep user on current page to prevent loops

**Key Logic**:
```typescript
// Only redirect if user is an organisation member
if (context.isOrganisationMember && context.redirectPath) {
  // Redirect to their role-specific dashboard
  navigate(context.redirectPath);
} else if (context.canCreateOrganisation && !context.isOrganisationMember) {
  // Only NEW users go to setup
  navigate('/setup');
} else {
  // Unexpected state - don't redirect
  setHasRedirected(true);
}
```

### 3. **Fixed HomePage.tsx** ✅
**File**: `/src/components/pages/HomePage.tsx`

**Changes**:
- Removed automatic redirect logic from HomePage
- Let Header component handle all authentication routing
- Prevents duplicate redirect attempts
- HomePage now only shows content, doesn't redirect authenticated users

### 4. **Fixed SubscriptionGuard.tsx** ✅
**File**: `/src/components/SubscriptionGuard.tsx`

**Changes**:
- Removed redirect to setup when organisation not in store
- SubscriptionGuard now only validates subscriptions for existing organisations
- Doesn't interfere with Header's membership routing

### 5. **Fixed PricingPage.tsx** ✅
**File**: `/src/components/pages/PricingPage.tsx`

**Changes**:
- Added authentication check before redirecting to setup
- Only unauthenticated users are redirected to setup
- Authenticated users stay on pricing page or navigate to their dashboard
- Prevents authenticated users from being redirected away from pricing page

## How the Fixed Flow Works

### For New Users (No Membership):
1. User logs in
2. Header checks membership via `OrganisationMembershipService`
3. No membership found → `canCreateOrganisation = true`
4. User redirected to `/setup` to create organisation
5. After organisation creation, membership record is created
6. Next login: User is recognized as member and redirected to dashboard

### For Existing Members:
1. User logs in
2. Header checks membership via `OrganisationMembershipService`
3. Membership found → `isOrganisationMember = true`
4. User redirected to role-specific dashboard (e.g., `/admin/dashboard`)
5. Session flag `processedAuthEmail` prevents re-checking
6. User can navigate freely without redirect loops

### For Authenticated Users on Public Pages:
1. User is on pricing page, features page, etc.
2. Clicks CTA button
3. System checks if user is authenticated
4. If authenticated: User stays on page or navigates to dashboard
5. If not authenticated: User redirected to setup

## Testing Checklist

- [ ] New user can log in and be redirected to setup page
- [ ] Existing member can log in and be redirected to their dashboard
- [ ] Existing member can click navigation items without redirect loops
- [ ] Existing member can navigate between sections (loans, customers, reports, etc.)
- [ ] Authenticated user on pricing page is not redirected to setup
- [ ] Unauthenticated user on pricing page can click CTA to go to setup
- [ ] Logout clears session flags and allows re-login
- [ ] No console errors related to membership checks
- [ ] Membership check only runs once per session (check logs)

## Key Improvements

1. **Single Source of Truth**: Header component is the only place that handles post-login routing
2. **Session-Level Tracking**: Prevents duplicate membership checks
3. **Explicit Membership Validation**: Uses database-driven membership records
4. **Error Resilience**: Doesn't redirect on errors, keeps user on current page
5. **Role-Based Routing**: Different roles get different dashboards
6. **Backward Compatible**: Works with existing authentication system

## Files Modified

1. `/src/entities/index.ts` - Added OrganisationMemberships interface
2. `/src/components/Header.tsx` - Fixed membership check and routing logic
3. `/src/components/pages/HomePage.tsx` - Removed duplicate redirect logic
4. `/src/components/SubscriptionGuard.tsx` - Removed setup redirect
5. `/src/components/pages/PricingPage.tsx` - Added auth check before redirect

## Related Services

- `OrganisationMembershipService.ts` - Handles membership database lookups
- `OrganisationService.ts` - Manages organisation data
- `StaffService.ts` - Manages staff member data
- `RoleService.ts` - Manages role assignments

## Future Improvements

1. Add membership caching to reduce database queries
2. Implement role-based feature access control
3. Add organisation switching for users with multiple memberships
4. Implement session timeout and re-authentication
5. Add audit logging for all membership changes
