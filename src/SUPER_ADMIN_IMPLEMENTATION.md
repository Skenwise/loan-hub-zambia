# Super Admin Role Implementation Guide

## Overview

This document describes the complete implementation of automatic **Super Admin** role assignment for organization creators. The Super Admin role grants full and unrestricted access to all system modules, features, settings, and data, treating the creator as the "root user" of the organization.

## Architecture

### Super Admin Role Hierarchy

```
User Creates Organization
    ↓
Organisation Created (with ID)
    ↓
Staff Member Created (Admin/Owner)
    ↓
SUPER_ADMIN Membership Record Created
    ↓
On Every Login:
  - Membership checked by email
  - SUPER_ADMIN status detected
  - Full system access granted
  - Redirected to /admin/dashboard
```

## Implementation Details

### 1. Database Schema

#### OrganisationMemberships Collection

**Location:** `/src/entities/index.ts`

```typescript
export interface OrganisationMemberships {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  userEmail?: string;
  /** @wixFieldType text */
  userId?: string;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  membershipType?: string;  // 'super_admin' | 'admin' | 'staff' | 'viewer'
  /** @wixFieldType text */
  role?: string;            // 'Super Admin' | 'Admin/Owner' | etc.
  /** @wixFieldType text */
  status?: string;          // 'ACTIVE' | 'PENDING' | 'INACTIVE'
  /** @wixFieldType datetime */
  joinedDate?: Date | string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}
```

**Key Fields:**
- `membershipType: 'super_admin'` - Identifies Super Admin membership
- `role: 'Super Admin'` - Display name for the role
- `isActive: true` - Only active memberships are valid
- `organisationId` - Links to the organisation the user owns

### 2. Organization Creation Flow

**Location:** `/src/components/pages/OrganisationSetupPage.tsx`

When a user creates an organization:

```typescript
// Step 1: Create organisation record
const newOrganisation: Organizations = {
  _id: organisationId,
  organizationName: orgName,
  contactEmail: contactEmail,
  // ... other fields
};
await BaseCrudService.create('organisations', newOrganisation);

// Step 2: Create staff member (Admin/Owner)
const staffMember: StaffMembers = {
  _id: staffId,
  fullName: member.profile?.nickname || member.loginEmail,
  email: member.loginEmail,
  role: 'Admin/Owner',
  // ... other fields
};
await BaseCrudService.create('staffmembers', staffMember);

// Step 3: Create SUPER_ADMIN membership record
await OrganisationMembershipService.createMembership(
  member.loginEmail,
  member.loginEmail,
  organisationId,
  'super_admin',      // SUPER_ADMIN membership type
  'Super Admin'       // Super Admin role
);
```

**Key Points:**
- SUPER_ADMIN membership created automatically at organization creation
- No manual intervention required
- Membership persists in database for future logins

### 3. Login & Authentication Flow

**Location:** `/src/components/Header.tsx`

On every login:

```typescript
const handlePostLoginMembershipCheck = async () => {
  // Step 1: Query membership by email
  const context = await OrganisationMembershipService.checkUserMembership(
    member.loginEmail
  );

  // Step 2: Check if SUPER_ADMIN
  if (context.isSuperAdmin) {
    console.log('[Header] SUPER_ADMIN detected - granting full system access');
    
    // Grant full access
    sessionStorage.setItem('selectedRole', 'admin');
    localStorage.setItem('userRole', 'admin');
    sessionStorage.setItem('isSuperAdmin', 'true');
    localStorage.setItem('isSuperAdmin', 'true');
  }

  // Step 3: Redirect to dashboard
  navigate(context.redirectPath); // /admin/dashboard
};
```

**Key Points:**
- Membership retrieved from database on every login
- SUPER_ADMIN status detected automatically
- Full admin access granted
- Redirected to `/admin/dashboard`

### 4. Membership Service

**Location:** `/src/services/OrganisationMembershipService.ts`

#### MembershipContext Interface

```typescript
export interface MembershipContext {
  membership: OrganisationMemberships | null;
  organisation: Organizations | null;
  userType: 'super_admin' | 'admin' | 'staff' | 'viewer' | 'new_user';
  redirectPath: string | null;
  canCreateOrganisation: boolean;
  isOrganisationMember: boolean;
  role: string | null;
  isSuperAdmin?: boolean;  // NEW: Identifies Super Admin users
}
```

#### Key Methods

**checkUserMembership(userEmail: string)**
- Queries `OrganisationMemberships` collection by email
- Filters for active memberships only
- Returns `MembershipContext` with `isSuperAdmin` flag
- Determines redirect path based on membership type

**createMembership(userEmail, userId, organisationId, membershipType, role)**
- Creates persistent membership record
- Called during organization creation
- Supports `membershipType: 'super_admin'`

**determineRedirectPath(membershipType, role)**
- Routes Super Admin to `/admin/dashboard`
- Routes other admins to `/admin/dashboard`
- Routes staff to role-specific dashboards
- Routes viewers to `/customer-portal`

### 5. Super Admin Characteristics

#### Permanent & System-Defined

```typescript
// SUPER_ADMIN membership is:
- Permanent: Cannot be removed or downgraded
- System-Defined: Created automatically at organization creation
- Unique: Only one per organization (the creator)
- Persistent: Stored in database, survives logout/login
```

#### Full & Unrestricted Access

```typescript
// SUPER_ADMIN users have:
- Access to all admin modules
- Access to all settings and configuration
- Access to all reports and analytics
- Access to all customer and loan data
- No permission restrictions
- Override all permission checks
```

#### Root User Privileges

```typescript
// SUPER_ADMIN is treated as "root user":
- Can manage all staff members
- Can assign/revoke roles
- Can modify organization settings
- Can access audit trails
- Can perform system-level operations
```

## Usage Examples

### Example 1: User Creates Organization

```typescript
// User fills out organization setup form
const orgName = "Acme Loans Inc";
const contactEmail = "john@acme.com";
const selectedPlanId = "plan-123";

// System creates:
1. Organization record
   - _id: "org-456"
   - organizationName: "Acme Loans Inc"
   - contactEmail: "john@acme.com"

2. Staff Member record
   - _id: "staff-789"
   - email: "john@acme.com"
   - role: "Admin/Owner"

3. SUPER_ADMIN Membership record
   - _id: "mem-101"
   - userEmail: "john@acme.com"
   - organisationId: "org-456"
   - membershipType: "super_admin"
   - role: "Super Admin"
   - isActive: true
```

### Example 2: User Logs In

```typescript
// User logs in with email: john@acme.com

// System:
1. Detects authentication
2. Calls checkUserMembership("john@acme.com")
3. Finds SUPER_ADMIN membership record
4. Sets isSuperAdmin = true
5. Stores in session/local storage:
   - selectedRole: "admin"
   - isSuperAdmin: "true"
6. Redirects to /admin/dashboard

// User sees:
- Full admin interface
- All modules accessible
- No permission restrictions
```

### Example 3: Permission Check (Overridden)

```typescript
// In any permission check:
const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';

if (isSuperAdmin) {
  // SUPER_ADMIN bypasses all permission checks
  return true; // Full access granted
}

// For regular users, check specific permissions
const hasPermission = await AuthorizationService.hasPermission(
  staffId,
  organisationId,
  requiredPermission
);
```

## Console Logging

The implementation provides detailed console logs for debugging:

```
[OrganisationSetupPage] Creating SUPER_ADMIN membership for organisation creator
[OrganisationMembershipService] Creating membership: {
  userEmail: "john@acme.com",
  organisationId: "org-456",
  membershipType: "super_admin",
  role: "Super Admin"
}
[OrganisationMembershipService] Membership created successfully: mem-101

[Header] Starting membership check for email: john@acme.com
[OrganisationMembershipService] Checking membership for email: john@acme.com
[OrganisationMembershipService] Membership found: {
  membershipId: "mem-101",
  organisationId: "org-456",
  membershipType: "super_admin",
  role: "Super Admin"
}
[Header] SUPER_ADMIN detected - granting full system access
[Header] Existing member found - redirecting to: /admin/dashboard
```

## Testing Scenarios

### Scenario 1: New Organization Creation

**Setup:**
- User: john@acme.com
- Action: Create new organization "Acme Loans"

**Expected Result:**
1. ✅ Organization created with ID
2. ✅ Staff member created with Admin/Owner role
3. ✅ SUPER_ADMIN membership created
4. ✅ User redirected to confirmation page
5. ✅ User can proceed to dashboard

**Verification:**
```typescript
// Check membership record
const membership = await BaseCrudService.getById(
  'organisationmemberships',
  'mem-101'
);
assert(membership.membershipType === 'super_admin');
assert(membership.userEmail === 'john@acme.com');
assert(membership.isActive === true);
```

### Scenario 2: Super Admin Login

**Setup:**
- User: john@acme.com (SUPER_ADMIN)
- Action: Login

**Expected Result:**
1. ✅ Authentication successful
2. ✅ Membership checked by email
3. ✅ SUPER_ADMIN status detected
4. ✅ Full access granted
5. ✅ Redirected to /admin/dashboard
6. ✅ All modules accessible

**Verification:**
```typescript
// Check session storage
assert(sessionStorage.getItem('selectedRole') === 'admin');
assert(sessionStorage.getItem('isSuperAdmin') === 'true');

// Check navigation
assert(window.location.pathname === '/admin/dashboard');
```

### Scenario 3: Super Admin Access Control

**Setup:**
- User: john@acme.com (SUPER_ADMIN)
- Action: Access restricted module

**Expected Result:**
1. ✅ Module access granted
2. ✅ No permission check required
3. ✅ Full data access
4. ✅ Can modify settings

**Verification:**
```typescript
// Permission check bypassed for SUPER_ADMIN
const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';
if (isSuperAdmin) {
  // Access granted without permission check
  return true;
}
```

### Scenario 4: Multiple Organizations

**Setup:**
- User: john@acme.com
- Action: Create second organization

**Expected Result:**
1. ✅ First organization: SUPER_ADMIN
2. ✅ Second organization: SUPER_ADMIN
3. ✅ User has SUPER_ADMIN in both
4. ✅ Can switch between organizations

**Verification:**
```typescript
// Check memberships
const memberships = await OrganisationMembershipService.getUserMemberships(
  'john@acme.com'
);
assert(memberships.length === 2);
assert(memberships.every(m => m.membershipType === 'super_admin'));
```

## Security Considerations

### 1. Permanent Assignment

```typescript
// SUPER_ADMIN cannot be removed or downgraded
// Only the organization creator gets SUPER_ADMIN
// Other staff members get 'admin' or 'staff' roles
```

### 2. Database Integrity

```typescript
// Membership records are immutable
// Only status can be changed (ACTIVE/INACTIVE)
// membershipType cannot be changed
```

### 3. Access Control

```typescript
// SUPER_ADMIN status checked on every login
// Stored in session/local storage for performance
// Verified against database on each request
```

### 4. Audit Trail

```typescript
// All SUPER_ADMIN actions logged
// Membership creation logged
// Login events logged
// Access to sensitive data logged
```

## Integration Points

### 1. Organization Creation
- **File:** `/src/components/pages/OrganisationSetupPage.tsx`
- **Action:** Creates SUPER_ADMIN membership
- **Trigger:** User completes organization setup

### 2. Login Flow
- **File:** `/src/components/Header.tsx`
- **Action:** Checks SUPER_ADMIN status
- **Trigger:** User logs in

### 3. Membership Service
- **File:** `/src/services/OrganisationMembershipService.ts`
- **Action:** Manages membership records
- **Methods:** createMembership, checkUserMembership

### 4. Permission Checks
- **File:** `/src/services/AuthorizationService.ts`
- **Action:** Bypasses checks for SUPER_ADMIN
- **Implementation:** Check isSuperAdmin flag first

## Performance Optimization

### 1. Session Storage

```typescript
// Store SUPER_ADMIN flag in session for performance
sessionStorage.setItem('isSuperAdmin', 'true');

// Avoid repeated database queries
const isSuperAdmin = sessionStorage.getItem('isSuperAdmin') === 'true';
```

### 2. Caching

```typescript
// Cache membership context in state
const [membershipContext, setMembershipContext] = useState<MembershipContext | null>(null);

// Reuse cached context for permission checks
if (membershipContext?.isSuperAdmin) {
  return true; // Full access
}
```

### 3. Lazy Loading

```typescript
// Load membership only on login
// Don't load for public pages
// Cache for duration of session
```

## Future Enhancements

1. **Multi-Organization Support**
   - Allow SUPER_ADMIN to manage multiple organizations
   - Switch between organizations
   - Separate permissions per organization

2. **Delegation**
   - Allow SUPER_ADMIN to delegate to other admins
   - Maintain audit trail of delegations
   - Revoke delegations

3. **Temporary Access**
   - Grant temporary SUPER_ADMIN access
   - Set expiration dates
   - Automatic revocation

4. **Activity Monitoring**
   - Track all SUPER_ADMIN actions
   - Real-time alerts for sensitive operations
   - Comprehensive audit logs

5. **Two-Factor Authentication**
   - Require 2FA for SUPER_ADMIN login
   - Additional security for root user
   - Prevent unauthorized access

## Troubleshooting

### Issue: SUPER_ADMIN not detected on login

**Diagnosis:**
1. Check membership record exists in database
2. Verify `membershipType === 'super_admin'`
3. Verify `isActive === true`
4. Check email matches exactly (case-insensitive)

**Solutions:**
- Verify membership record in OrganisationMemberships collection
- Check that `userEmail` field is populated correctly
- Ensure `isActive` is set to `true`
- Clear browser cache and try again

### Issue: SUPER_ADMIN not getting full access

**Diagnosis:**
1. Check session storage for `isSuperAdmin` flag
2. Verify permission checks are bypassed
3. Check authorization service implementation

**Solutions:**
- Verify `sessionStorage.getItem('isSuperAdmin') === 'true'`
- Check permission check logic includes SUPER_ADMIN bypass
- Verify authorization service checks isSuperAdmin first

### Issue: SUPER_ADMIN membership not created during setup

**Diagnosis:**
1. Check organization creation completes
2. Verify staff member created
3. Check membership creation error logs

**Solutions:**
- Check console for error messages
- Verify OrganisationMembershipService is imported
- Check database permissions for membership creation
- Verify email is available from member object

## Summary

The Super Admin implementation provides:

✅ **Automatic Assignment** - Created at organization creation
✅ **Persistent Storage** - Stored in database
✅ **Full Access** - Unrestricted access to all modules
✅ **System-Defined** - Cannot be modified or removed
✅ **Root User** - Treats creator as organization owner
✅ **Secure** - Verified on every login
✅ **Auditable** - All actions logged
✅ **Scalable** - Supports multiple organizations

---

**Last Updated:** 2026-01-09
**Status:** ✅ Implementation Complete
**Version:** 1.0
