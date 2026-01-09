# Persistent Database-Driven Organisation Membership Implementation

## Overview

This document describes the implementation of a persistent, database-driven organisation membership check during the login flow. The system ensures that:

1. ✅ **Database-Driven Lookups** - All membership checks query the `OrganisationMemberships` collection
2. ✅ **Unified Membership** - Admins and invited staff are in the same collection with different `membershipType` values
3. ✅ **One-Time Organisation Creation** - Only new users (no membership records) can create organisations
4. ✅ **Role-Specific Redirects** - Users are redirected to role-specific dashboards based on database data
5. ✅ **No Session Variables** - Redirection is based on database lookups, not frontend conditions
6. ✅ **Persistent Membership** - Membership status persists across sessions

## Architecture

### New Collection: OrganisationMemberships

**Location:** `/src/entities/index.ts`

```typescript
export interface OrganisationMemberships {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  userId?: string;                    // Authenticated user ID
  userEmail?: string;                 // User's email (case-insensitive lookup)
  organisationId?: string;            // Organisation they belong to
  role?: string;                      // Role within organisation (Admin/Owner, Loan Officer, etc.)
  membershipType?: 'admin' | 'staff' | 'viewer';  // Type of membership
  status?: string;                    // ACTIVE, PENDING, INACTIVE
  joinedDate?: Date | string;         // When they joined
  invitedBy?: string;                 // Who invited them (for staff)
  isActive?: boolean;                 // Whether membership is active
}
```

### Key Service: OrganisationMembershipService

**Location:** `/src/services/OrganisationMembershipService.ts`

#### Primary Method: `checkUserMembership(userEmail: string)`

This is the core method that:

1. **Queries the database** for membership records matching the user's email
2. **Returns a MembershipContext** with:
   - `membership`: The membership record (or null)
   - `organisation`: The organisation details
   - `userType`: 'admin' | 'staff' | 'viewer' | 'new_user'
   - `redirectPath`: Where to send the user
   - `canCreateOrganisation`: Whether they can create a new org
   - `isOrganisationMember`: Whether they have an active membership

#### Workflow

```
User Logs In
    ↓
Header Component Detects Authentication
    ↓
handlePostLoginMembershipCheck() Called
    ↓
OrganisationMembershipService.checkUserMembership(email)
    ↓
Query OrganisationMemberships Collection
    ↓
┌─────────────────────────────────────────────┐
│ Membership Found & Active?                  │
├─────────────────────────────────────────────┤
│ YES → Retrieve Organisation Details         │
│       Determine Role-Specific Redirect      │
│       Redirect User Automatically           │
│       NO ROLE SELECTION DIALOG              │
│                                             │
│ NO  → Check canCreateOrganisation Flag      │
│       Show Role Selection Dialog            │
│       Allow User to Create Organisation     │
└─────────────────────────────────────────────┘
```

## Implementation Details

### 1. Collection Setup

The `OrganisationMemberships` collection must be created in Wix CMS with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | Text | Yes | Authenticated user ID |
| userEmail | Text | Yes | User's email (indexed for fast lookup) |
| organisationId | Text | Yes | Reference to organisation |
| role | Text | Yes | Role name (Admin/Owner, Loan Officer, etc.) |
| membershipType | Text | Yes | admin \| staff \| viewer |
| status | Text | Yes | ACTIVE, PENDING, INACTIVE |
| joinedDate | DateTime | Yes | Membership start date |
| invitedBy | Text | No | Who invited this user |
| isActive | Boolean | Yes | Active status flag |

### 2. Service Methods

#### Create Membership (New Organisation)

```typescript
await OrganisationMembershipService.createMembership(
  userEmail: string,
  userId: string,
  organisationId: string,
  membershipType: 'admin' = 'admin',
  role: string = 'Admin/Owner'
): Promise<OrganisationMemberships>
```

Called when a new user creates an organisation.

#### Invite User to Organisation

```typescript
await OrganisationMembershipService.inviteUserToOrganisation(
  userEmail: string,
  userId: string,
  organisationId: string,
  role: string,
  invitedBy: string
): Promise<OrganisationMemberships>
```

Called when inviting staff members.

#### Update Membership Status

```typescript
await OrganisationMembershipService.updateMembershipStatus(
  membershipId: string,
  status: string,
  isActive: boolean = true
): Promise<void>
```

Called to activate pending invitations or change status.

#### Deactivate Membership

```typescript
await OrganisationMembershipService.deactivateMembership(
  membershipId: string
): Promise<void>
```

Called to remove a user from an organisation.

### 3. Header Component Integration

**Location:** `/src/components/Header.tsx`

The Header component now:

1. **Detects authentication** via `useMember()` hook
2. **Calls membership check** on every login
3. **Queries database** for membership records
4. **Redirects automatically** if membership exists
5. **Shows role selection** only for new users

```typescript
const handlePostLoginMembershipCheck = async () => {
  const context = await OrganisationMembershipService.checkUserMembership(
    member.loginEmail
  );
  
  if (context.isOrganisationMember && context.redirectPath) {
    // Existing member - redirect automatically
    navigate(context.redirectPath);
  } else if (context.canCreateOrganisation) {
    // New user - show role selection
    setShowRoleDialog(true);
  }
};
```

## Role-Specific Redirects

The system determines redirect paths based on `membershipType` and `role`:

| Membership Type | Role | Redirect Path |
|---|---|---|
| admin | Any | `/admin/dashboard` |
| staff | Loan Officer | `/admin/dashboard/loan-officer` |
| staff | Branch Manager | `/admin/settings/branch-manager` |
| staff | Compliance Officer | `/admin/reports/comprehensive` |
| staff | Other | `/admin/dashboard` |
| viewer | Any | `/customer-portal` |
| new_user | N/A | Role Selection Dialog |

## Database Queries

### Query 1: Find User Membership

```
Collection: OrganisationMemberships
Filter: userEmail = {email} AND isActive = true
Expected: 0 or 1 record
```

### Query 2: Get Organisation Details

```
Collection: Organisations
Filter: _id = {organisationId}
Expected: 1 record
```

### Query 3: Get All Members of Organisation

```
Collection: OrganisationMemberships
Filter: organisationId = {organisationId} AND isActive = true
Expected: Multiple records
```

## Security Considerations

1. **Email Case-Insensitivity** - All email lookups are case-insensitive
2. **Active Status Check** - Only active memberships are considered valid
3. **One-Time Creation** - Users with any membership cannot create new organisations
4. **Membership Validation** - All redirects verify membership exists in database
5. **Session Cleanup** - Logout clears all session data

## Testing Scenarios

### Scenario 1: Existing Admin User

1. **Setup:**
   - Create organisation with ID `org-123`
   - Create membership record:
     - userEmail: `admin@company.com`
     - organisationId: `org-123`
     - membershipType: `admin`
     - isActive: `true`

2. **Test:**
   - User logs in with `admin@company.com`
   - System queries OrganisationMemberships collection
   - Membership found with `membershipType: admin`
   - User redirected to `/admin/dashboard`
   - NO role selection dialog shown

3. **Expected Result:**
   - ✅ User lands on admin dashboard
   - ✅ Navigation shows admin menu items
   - ✅ No organisation creation prompt

### Scenario 2: Invited Staff Member

1. **Setup:**
   - Create organisation with ID `org-123`
   - Create membership record:
     - userEmail: `officer@company.com`
     - organisationId: `org-123`
     - membershipType: `staff`
     - role: `Loan Officer`
     - status: `ACTIVE`
     - isActive: `true`

2. **Test:**
   - User logs in with `officer@company.com`
   - System queries OrganisationMemberships collection
   - Membership found with `membershipType: staff` and `role: Loan Officer`
   - User redirected to `/admin/dashboard/loan-officer`
   - NO role selection dialog shown

3. **Expected Result:**
   - ✅ User lands on loan officer dashboard
   - ✅ Navigation shows loan officer menu items
   - ✅ No organisation creation prompt

### Scenario 3: New User (No Membership)

1. **Setup:**
   - Use email not in OrganisationMemberships collection: `newuser@test.com`
   - No membership record exists

2. **Test:**
   - User logs in with `newuser@test.com`
   - System queries OrganisationMemberships collection
   - No membership found
   - Role selection dialog shown
   - User selects "Admin/Institution"
   - System creates organisation and membership record

3. **Expected Result:**
   - ✅ Role selection dialog appears
   - ✅ User can select role
   - ✅ Organisation creation flow starts
   - ✅ Membership record created after organisation setup

### Scenario 4: Inactive Membership

1. **Setup:**
   - Create membership record with `isActive: false`

2. **Test:**
   - User logs in
   - System queries OrganisationMemberships collection
   - Membership found but `isActive: false`
   - System treats as new user
   - Role selection dialog shown

3. **Expected Result:**
   - ✅ Inactive membership ignored
   - ✅ User treated as new user
   - ✅ Can create new organisation

## Console Logging

The system provides detailed console logs for debugging:

```
[OrganisationMembershipService] Checking membership for email: admin@company.com
[OrganisationMembershipService] Membership found: {
  membershipId: "mem-123",
  organisationId: "org-456",
  membershipType: "admin",
  role: "Admin/Owner"
}
[OrganisationMembershipService] User is organisation member: {
  membershipType: "admin",
  redirectPath: "/admin/dashboard"
}
[Header] Membership context received: {
  userType: "admin",
  isOrganisationMember: true,
  redirectPath: "/admin/dashboard",
  canCreateOrganisation: false
}
[Header] Redirecting existing member to: /admin/dashboard
```

## Migration from Old System

If migrating from the previous authentication system:

1. **Create OrganisationMemberships collection** in Wix CMS
2. **Migrate existing data:**
   - For each organisation admin: Create membership with `membershipType: admin`
   - For each staff member: Create membership with `membershipType: staff`
3. **Update Header component** to use new service
4. **Test all scenarios** before deploying to production

## API Reference

### OrganisationMembershipService

```typescript
// Check user membership (primary method)
static async checkUserMembership(userEmail: string): Promise<MembershipContext>

// Create new membership
static async createMembership(
  userEmail: string,
  userId: string,
  organisationId: string,
  membershipType?: 'admin' | 'staff' | 'viewer',
  role?: string
): Promise<OrganisationMemberships>

// Invite user to organisation
static async inviteUserToOrganisation(
  userEmail: string,
  userId: string,
  organisationId: string,
  role: string,
  invitedBy: string
): Promise<OrganisationMemberships>

// Update membership status
static async updateMembershipStatus(
  membershipId: string,
  status: string,
  isActive?: boolean
): Promise<void>

// Deactivate membership
static async deactivateMembership(membershipId: string): Promise<void>

// Get user's memberships
static async getUserMemberships(userEmail: string): Promise<OrganisationMemberships[]>

// Get organisation members
static async getOrganisationMembers(organisationId: string): Promise<OrganisationMemberships[]>

// Check if user can create organisation
static async canUserCreateOrganisation(userEmail: string): Promise<boolean>

// Validate membership
static async validateMembership(membershipId: string): Promise<boolean>
```

## Performance Considerations

1. **Database Queries** - All queries use indexed email field for fast lookups
2. **Caching** - Consider implementing cache layer for frequently accessed memberships
3. **Batch Operations** - Use batch queries when fetching multiple memberships
4. **Pagination** - Implement pagination for large organisation member lists

## Future Enhancements

1. **Multi-Organisation Support** - Allow users to switch between multiple organisations
2. **Membership Expiry** - Add expiration dates for temporary memberships
3. **Audit Trail** - Log all membership changes for compliance
4. **Bulk Invitations** - Support CSV upload for inviting multiple users
5. **Membership Approval** - Require admin approval for new memberships

## Troubleshooting

### Issue: User not redirected after login

**Diagnosis:**
1. Check browser console for `[OrganisationMembershipService]` logs
2. Verify membership record exists in database
3. Confirm `isActive: true` in membership record
4. Check email matches exactly (case-insensitive)

**Solutions:**
- Verify membership record in OrganisationMemberships collection
- Check that `userEmail` field is populated
- Ensure `isActive` is set to `true`
- Clear browser cache and try again

### Issue: Role selection dialog not appearing for new users

**Diagnosis:**
1. Check if membership record exists for user
2. Verify `isActive: false` or no record found

**Solutions:**
- Delete any inactive membership records
- Verify user email is not in OrganisationMemberships collection
- Check `canCreateOrganisation` flag in context

### Issue: Wrong redirect path

**Diagnosis:**
1. Check `membershipType` and `role` in membership record
2. Verify role name matches expected values

**Solutions:**
- Update membership record with correct `membershipType`
- Verify `role` field matches expected role names
- Check role-specific redirect mapping in service

## Support

For issues or questions about the persistent membership implementation:

1. Check console logs for detailed error messages
2. Review membership record in database
3. Verify collection structure matches specification
4. Test with different user scenarios

---

**Last Updated:** 2026-01-09
**Status:** ✅ Implementation Complete
**Version:** 1.0
