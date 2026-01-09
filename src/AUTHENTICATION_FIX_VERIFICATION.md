# Authentication & Redirection Fix - Verification Guide

## Overview

This document provides a comprehensive guide to verify that the authentication and redirection logic is working correctly. The fix ensures:

1. ✅ Existing users with an organization are redirected to their dashboard upon login
2. ✅ Only new users are prompted to create an organization
3. ✅ Proper logging for debugging authentication flow
4. ✅ Graceful error handling with fallback behavior

## Implementation Details

### 1. AuthenticationService Updates

**File:** `/src/services/AuthenticationService.ts`

**Key Changes:**
- Added comprehensive logging at each step of the authentication check
- Logs include:
  - User email being checked
  - Number of admin organisations found
  - Whether user is admin, invited staff, or new
  - Organisation ID and role information

**Logging Output Example:**
```
[AuthenticationService] Checking context for email: admin@company.com
[AuthenticationService] Admin organisations found: 1
[AuthenticationService] User is admin of organisation: org-123
```

### 2. Header Component Updates

**File:** `/src/components/Header.tsx`

**Key Changes:**
- Added detailed logging to the authentication flow
- Logs track:
  - Authentication state changes
  - When post-login authentication is triggered
  - Context received from AuthenticationService
  - Routing decisions (redirect vs. role selection)

**Logging Output Example:**
```
[Header] Auth state changed: { isAuthenticated: true, isLoading: false, hasRedirected: false, email: "admin@company.com" }
[Header] Triggering post-login authentication
[Header] Starting authentication check for: admin@company.com
[Header] Authentication context received: { userType: 'admin', isOrganisationMember: true, redirectPath: '/admin/dashboard', canCreateOrganisation: false }
[Header] Redirecting existing member to: /admin/dashboard
```

## Testing & Verification Steps

### Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Look for logs starting with `[Header]` and `[AuthenticationService]`

### Step 2: Test Existing Admin User

**Scenario:** User with an organization (admin)

1. **Setup:**
   - Create an organization with contact email: `admin@test.com`
   - Create a staff member with email: `admin@test.com` and role: `Admin/Owner`

2. **Test Steps:**
   - Log out if already logged in
   - Click "Sign In" button
   - Complete authentication with `admin@test.com`
   - Observe console logs

3. **Expected Behavior:**
   - ✅ Console shows: `[Header] Redirecting existing member to: /admin/dashboard`
   - ✅ User is redirected to `/admin/dashboard` automatically
   - ✅ Role selection dialog is NOT shown
   - ✅ No organization creation prompt

4. **Verification Checklist:**
   - [ ] Console logs show "Redirecting existing member"
   - [ ] User lands on `/admin/dashboard`
   - [ ] Role selection dialog is hidden
   - [ ] Navigation shows admin menu items

### Step 3: Test Invited Staff Member

**Scenario:** User invited as staff member

1. **Setup:**
   - Create an organization: `org-123`
   - Create a staff member with:
     - Email: `officer@test.com`
     - Organisation ID: `org-123`
     - Role: `Loan Officer`

2. **Test Steps:**
   - Log out if already logged in
   - Click "Sign In" button
   - Complete authentication with `officer@test.com`
   - Observe console logs

3. **Expected Behavior:**
   - ✅ Console shows: `[Header] Redirecting existing member to: /admin/dashboard/loan-officer`
   - ✅ User is redirected to role-specific dashboard
   - ✅ Role selection dialog is NOT shown

4. **Verification Checklist:**
   - [ ] Console logs show "Redirecting existing member"
   - [ ] User lands on role-specific dashboard
   - [ ] Role selection dialog is hidden

### Step 4: Test New User

**Scenario:** User with no organization membership

1. **Setup:**
   - Use a new email that doesn't exist in the system: `newuser@test.com`
   - Ensure no organization with this contact email exists
   - Ensure no staff record with this email exists

2. **Test Steps:**
   - Log out if already logged in
   - Click "Sign In" button
   - Complete authentication with `newuser@test.com`
   - Observe console logs

3. **Expected Behavior:**
   - ✅ Console shows: `[Header] New user - showing role selection dialog`
   - ✅ Role selection dialog appears
   - ✅ User can select "Admin/Institution" or "Customer/Borrower"
   - ✅ After selection, user is prompted to create organization

4. **Verification Checklist:**
   - [ ] Console logs show "New user - showing role selection dialog"
   - [ ] Role selection dialog is visible
   - [ ] User can select a role
   - [ ] Organization creation flow starts

### Step 5: Test Error Handling

**Scenario:** Network error or service failure

1. **Test Steps:**
   - Open browser DevTools Network tab
   - Simulate offline mode or throttle network
   - Try to log in
   - Observe console logs

2. **Expected Behavior:**
   - ✅ Console shows error message
   - ✅ Fallback behavior: role selection dialog shown
   - ✅ User is not stuck in loading state

3. **Verification Checklist:**
   - [ ] Error is logged to console
   - [ ] Role selection dialog appears as fallback
   - [ ] User can still proceed

## Console Log Reference

### Authentication Service Logs

```
[AuthenticationService] Checking context for email: {email}
[AuthenticationService] Admin organisations found: {count}
[AuthenticationService] User is admin of organisation: {orgId}
[AuthenticationService] Staff member found: {true/false}
[AuthenticationService] User is invited staff member of organisation: {orgId}
[AuthenticationService] User is new - no organisation membership
```

### Header Component Logs

```
[Header] Auth state changed: {state}
[Header] Triggering post-login authentication
[Header] No login email available
[Header] Starting authentication check for: {email}
[Header] Authentication context received: {context}
[Header] Redirecting existing member to: {path}
[Header] New user - showing role selection dialog
[Header] Unexpected state - user is not member and cannot create org
```

## Troubleshooting

### Issue: User not redirected after login

**Diagnosis:**
1. Check console for `[Header]` logs
2. Look for "Triggering post-login authentication"
3. Check if "Authentication context received" appears

**Solutions:**
- Verify `member?.loginEmail` is populated
- Check if organization contact email matches user email (case-insensitive)
- Verify staff record exists with correct organisation ID
- Check browser console for errors

### Issue: Role selection dialog not appearing for new users

**Diagnosis:**
1. Check console for "New user - showing role selection dialog"
2. Verify `canCreateOrganisation` is `true` in context

**Solutions:**
- Ensure user email doesn't match any organization contact email
- Ensure no staff record exists for this email
- Clear browser cache and try again
- Check for JavaScript errors in console

### Issue: User stuck in loading state

**Diagnosis:**
1. Check if `[Header] Auth state changed` logs appear
2. Look for error messages in console

**Solutions:**
- Check network tab for failed requests
- Verify services are responding correctly
- Clear sessionStorage and localStorage
- Refresh the page

## Database Verification

### Check Organization Data

```sql
-- Find organizations by contact email
SELECT * FROM organisations WHERE contactEmail = 'admin@test.com'

-- Expected: Should find the organization if user is admin
```

### Check Staff Data

```sql
-- Find staff members by email
SELECT * FROM staffmembers WHERE email = 'officer@test.com'

-- Expected: Should find staff record with organisationId populated
```

## Performance Considerations

The authentication check performs:
1. **One call** to get all organizations (filtered by email)
2. **One call** to get staff member by email
3. **One call** to get role information (if staff member found)

**Total:** 2-3 database calls per login (cached after first check)

## Security Notes

1. **Email Matching:** Case-insensitive comparison for robustness
2. **Session Storage:** Auth context stored with 1-hour expiry
3. **Logout:** All authentication data cleared on logout
4. **Error Handling:** Graceful fallback to role selection on errors

## Next Steps

1. **Monitor Logs:** Watch browser console during login
2. **Test Scenarios:** Run through all test scenarios above
3. **Verify Redirects:** Confirm users land on correct pages
4. **Check Navigation:** Verify menu items match user role
5. **Test Logout:** Ensure logout clears all data

## Support

If issues persist:
1. Check all console logs for errors
2. Verify database data matches expectations
3. Clear browser cache and localStorage
4. Check network requests in DevTools
5. Review error messages in console

---

**Last Updated:** 2026-01-09
**Status:** ✅ Implementation Complete with Logging
