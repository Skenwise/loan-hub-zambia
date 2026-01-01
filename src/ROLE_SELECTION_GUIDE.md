# Role Selection & User Portal Guide

## Overview

The ZamLoan platform now includes a comprehensive role-based signup and authentication system that allows users to choose between two distinct user types: **Admin/Institution** and **Customer/Borrower**. Each role has its own dedicated interface and feature set.

---

## Role Selection Flow

### 1. Entry Points for Role Selection

Users can initiate the role selection process from two locations:

#### A. Landing Page (Homepage)
- **Location:** `/` (root path)
- **Trigger:** Click "Access Platform" or "Get Started Now" button
- **Behavior:** Opens `RoleSelectionDialog` modal

#### B. Header Sign In Button
- **Location:** Top navigation bar (visible when not authenticated)
- **Trigger:** Click "Sign In" button
- **Behavior:** Opens `RoleSelectionDialog` modal

### 2. Role Selection Dialog

**Component:** `RoleSelectionDialog.tsx`

**Features:**
- Clean, side-by-side role comparison
- Visual icons for each role (Building2 for Admin, User for Customer)
- Detailed feature lists for each role
- Hover animations and selection feedback
- Disabled "Continue" button until role is selected

**Dialog Content:**

#### Admin/Institution Role
```
Icon: Building2
Title: Admin/Institution
Description: Manage loans, customers, approvals, and compliance. 
             Full access to all platform features.

Features:
- Create and manage loan products
- Approve/reject loan applications
- Process disbursements
- Monitor portfolio performance
- IFRS 9 compliance tracking
- Generate regulatory reports
```

#### Customer/Borrower Role
```
Icon: User
Title: Customer/Borrower
Description: Apply for loans, track applications, and manage repayments. 
             Limited access to personal account.

Features:
- Apply for loans
- Track application status
- View loan details
- Make repayments
- Download statements
- Manage profile
```

---

## Authentication Flow

### Step 1: Role Selection
User selects their role in the dialog

### Step 2: Data Storage
Selected role is stored in `sessionStorage`:
```javascript
sessionStorage.setItem('selectedRole', role); // 'admin' or 'customer'
sessionStorage.setItem('redirectAfterLogin', redirectUrl);
```

### Step 3: Login Redirect
User is redirected to Wix Members login page via `actions.login()`

### Step 4: Post-Login Redirect
After successful authentication, user is redirected to:
- **Admin:** `/admin/dashboard`
- **Customer:** `/customer-portal`

---

## User Interfaces

### Admin Dashboard
**Route:** `/admin/dashboard`
**Component:** `DashboardPage.tsx`

**Features:**
- Loan portfolio overview
- Key metrics and KPIs
- Recent applications
- Approval queue
- Disbursement pipeline
- Compliance status

**Navigation Menu:**
- Dashboard
- Customers
- Loans
- New Application
- Approvals
- Disbursement
- Repayments
- Reports
- Advanced Reports
- IFRS 9 Compliance

---

### Customer Portal
**Route:** `/customer-portal`
**Component:** `CustomerPortalPage.tsx`

**Features:**
- Welcome greeting with customer name
- Key metrics cards:
  - Total Loans
  - Active Loans
  - Outstanding Balance
- Loan listing with status badges
- Loan details (principal, outstanding, dates, interest rate)
- Quick actions:
  - View Details
  - Make Payment (for active loans)
- Quick action cards:
  - Apply for a Loan
  - Download Statements

**Loan Status Indicators:**
- `pending-approval` - Yellow badge
- `approved` - Blue badge
- `disbursed` - Green badge
- `closed` - Gray badge
- `defaulted` - Red badge

---

## Component Architecture

### RoleSelectionDialog.tsx
**Purpose:** Modal dialog for role selection

**Props:**
```typescript
interface RoleSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'admin' | 'customer') => void;
}
```

**Features:**
- Framer Motion animations
- Responsive grid layout
- Feature comparison
- Selection state management
- Disabled continue button logic

### Updated Components

#### Header.tsx
**Changes:**
- Added `RoleSelectionDialog` state management
- New `handleSignIn()` function opens role dialog
- New `handleRoleSelect()` function processes role selection
- Stores role and redirect URL in sessionStorage

#### HomePage.tsx
**Changes:**
- Added `RoleSelectionDialog` state management
- Updated `handleGetStarted()` to open role dialog
- New `handleRoleSelect()` function processes role selection
- Stores role and redirect URL in sessionStorage

#### Router.tsx
**Changes:**
- Added import for `CustomerPortalPage`
- New route: `/customer-portal` with `MemberProtectedRoute`

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Visits Homepage                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Click "Get Started" or "Sign In"                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          RoleSelectionDialog Opens                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Admin/Institution        │        Customer/Borrower  │   │
│  │ - Manage loans          │        - Apply for loans   │   │
│  │ - Approve applications  │        - Track status      │   │
│  │ - Process disbursements │        - Make payments     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              User Selects Role                               │
│  sessionStorage.setItem('selectedRole', role)               │
│  sessionStorage.setItem('redirectAfterLogin', url)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          Wix Members Login Page                              │
│  (User enters email and password)                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          Authentication Successful                           │
│  MemberProvider updates authentication state                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          Redirect to Role-Specific Dashboard                │
│  Admin → /admin/dashboard                                   │
│  Customer → /customer-portal                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Session Storage Usage

### selectedRole
```javascript
// Stores the user's selected role
sessionStorage.getItem('selectedRole'); // 'admin' | 'customer'
```

**Usage:**
- Can be used to customize UI based on role
- Can be used for analytics/tracking
- Should be cleared on logout

### redirectAfterLogin
```javascript
// Stores the URL to redirect to after login
sessionStorage.getItem('redirectAfterLogin'); 
// '/admin/dashboard' | '/customer-portal'
```

**Usage:**
- Guides post-login redirect
- Ensures users land on correct dashboard
- Should be cleared after redirect

---

## Feature Comparison

### Admin/Institution Features

#### Loan Management
- Create loan products
- View all loans
- Create new applications
- Approve/reject applications
- Process disbursements
- Track repayments

#### Customer Management
- View all customers
- Create customer profiles
- Verify KYC status
- Monitor credit scores

#### Compliance & Reporting
- IFRS 9 ECL calculations
- Bank of Zimbabwe provisions
- Portfolio ageing analysis
- Performance trends
- Export reports

#### Dashboard
- Portfolio overview
- Key metrics
- Recent activity
- Approval queue
- Risk metrics

### Customer/Borrower Features

#### Loan Management
- Apply for loans
- View application status
- View loan details
- Track outstanding balance
- View repayment schedule

#### Repayments
- Make payments
- View payment history
- Download receipts

#### Account Management
- Update profile
- View personal information
- Download statements
- Manage preferences

#### Dashboard
- Active loans overview
- Outstanding balance
- Next payment dates
- Quick actions

---

## UI/UX Considerations

### Role Selection Dialog
- **Modal Design:** Prevents accidental navigation
- **Clear Comparison:** Side-by-side feature lists
- **Visual Feedback:** Hover states and selection highlighting
- **Accessibility:** Proper button states and labels
- **Mobile Responsive:** Stacks on smaller screens

### Navigation
- **Admin:** Full sidebar navigation with all modules
- **Customer:** Simplified header navigation
- **Consistent Branding:** Same color scheme and typography

### Feedback
- **Selection Feedback:** Visual indication of selected role
- **Loading States:** Spinner during authentication
- **Error Handling:** Clear error messages if login fails

---

## Security Considerations

### Session Storage
- `sessionStorage` is cleared when browser tab closes
- Not suitable for sensitive data
- Used only for temporary routing information

### Authentication
- All protected routes use `MemberProtectedRoute`
- Automatic redirect to login if not authenticated
- Role information stored in Wix Members system

### Data Access
- Admin users have full database access
- Customer users can only see their own data
- Backend should enforce role-based access control

---

## Future Enhancements

### Phase 1 (Current)
- [x] Role selection dialog
- [x] Admin dashboard
- [x] Customer portal
- [x] Basic navigation

### Phase 2
- [ ] Role-based data filtering
- [ ] Customer loan application form
- [ ] Payment processing UI
- [ ] Statement generation
- [ ] Notification system

### Phase 3
- [ ] Role management in admin panel
- [ ] Custom role creation
- [ ] Permission matrix
- [ ] Audit logging
- [ ] Two-factor authentication

### Phase 4
- [ ] Mobile app with role selection
- [ ] Single sign-on (SSO)
- [ ] API key management
- [ ] Webhook integrations
- [ ] Advanced analytics

---

## Testing Checklist

### Role Selection
- [ ] Dialog opens on "Get Started" click
- [ ] Dialog opens on "Sign In" click
- [ ] Both roles can be selected
- [ ] Continue button disabled until role selected
- [ ] Dialog closes on cancel
- [ ] SessionStorage updated correctly

### Authentication
- [ ] Login redirects to Wix Members
- [ ] Admin users redirect to `/admin/dashboard`
- [ ] Customer users redirect to `/customer-portal`
- [ ] SessionStorage cleared after redirect
- [ ] Logout clears all session data

### Navigation
- [ ] Admin can access all admin routes
- [ ] Customer can access customer portal
- [ ] Unauthenticated users redirected to login
- [ ] Protected routes show sign-in prompt

### UI/UX
- [ ] Dialog is responsive on mobile
- [ ] Role cards are clickable
- [ ] Animations are smooth
- [ ] Text is readable on all backgrounds
- [ ] Buttons are properly sized for touch

---

## Troubleshooting

### Issue: Dialog doesn't open
**Solution:** Check that `showRoleDialog` state is being set to `true`

### Issue: Role not being stored
**Solution:** Verify `sessionStorage.setItem()` is being called

### Issue: Wrong redirect after login
**Solution:** Check `redirectAfterLogin` value in sessionStorage

### Issue: Customer portal shows no loans
**Solution:** Verify customer ID is being used to filter loans

### Issue: Admin dashboard not loading
**Solution:** Check that user has admin role in Wix Members

---

## Support & Documentation

For questions or issues:
1. Check this role selection guide
2. Review component code comments
3. Check Router configuration
4. Review authentication flow

---

**Last Updated:** January 1, 2026
**Version:** 1.0 (Role Selection & Customer Portal Phase)
