# Quick Access Guide - New Features

## How to Access the New Pages

### 1. System Owner Settings
**URL**: `/admin/settings/system-owner`
- **What it does**: Manage global platform settings, view all organizations, manage subscription plans
- **How to access**: 
  1. Navigate to the URL above
  2. Click "System Owner" button to select the role
  3. View organizations and subscription plans

### 2. Organization Admin Settings
**URL**: `/admin/settings/organisation-admin`
- **What it does**: Manage organization staff, loan products, KYC settings
- **How to access**:
  1. Navigate to the URL above
  2. Click "Organization Admin" button to select the role
  3. Manage staff, products, and KYC requirements

### 3. Branch Manager Settings
**URL**: `/admin/settings/branch-manager`
- **What it does**: Manage branch staff, customers, and performance metrics
- **How to access**:
  1. Navigate to the URL above
  2. Click "Branch Manager" button to select the role
  3. View staff and customer information

### 4. Collateral Register
**URL**: `/admin/collateral-register`
- **What it does**: Register and manage loan collateral
- **How to access**:
  1. Navigate to the URL above
  2. Register new collateral items
  3. View collateral list and analytics

### 5. Create Loan Application (Admin Only)
**URL**: `/admin/loans/apply`
- **What it does**: Create loan applications for customers (admin staff only)
- **How to access**:
  1. Navigate to the URL above
  2. Click "Admin Staff" button to select the role
  3. Select a customer and create a loan application

## Role Selection

Each page now has a **role selector** that allows you to choose your role for testing:
- **System Owner**: Full platform access
- **Organization Admin**: Organization-level management
- **Branch Manager**: Branch-level operations
- **Admin Staff**: Can create loan applications for customers

Once you select a role, you can access all features for that role. To change roles, click the "Change Role" button on the access denied page.

## Testing the Features

### Test System Owner Settings
1. Go to `/admin/settings/system-owner`
2. Select "System Owner" role
3. View all organizations and subscription plans
4. Switch tabs to see different settings

### Test Organization Admin Settings
1. Go to `/admin/settings/organisation-admin`
2. Select "Organization Admin" role
3. View staff members and loan products
4. Manage KYC settings

### Test Branch Manager Settings
1. Go to `/admin/settings/branch-manager`
2. Select "Branch Manager" role
3. View branch staff and customers
4. Check performance metrics

### Test Collateral Register
1. Go to `/admin/collateral-register`
2. Register a new collateral item
3. View the collateral list
4. Check analytics

### Test Loan Application Creation
1. Go to `/admin/loans/apply`
2. Select "Admin Staff" role
3. Select a customer and loan product
4. Create a loan application

## Features Implemented

✅ **Three-Level Admin Hierarchy**
- System Owner (Global)
- Organization Admin (Organization-level)
- Branch Manager (Branch-level)

✅ **Customer Loan Application Restriction**
- Only admin staff can create loan applications
- Customers view their loans in the customer portal

✅ **Collateral Register**
- Register collateral items
- Track collateral status
- View collateral analytics

✅ **Role-Based Access Control**
- Role store for managing user roles
- Permission enforcement
- Role-specific pages

## Troubleshooting

### Page shows "Access Denied"
- Click "Change Role" button
- Select the appropriate role for that page
- The page will reload with the new role

### Data not loading
- Check browser console for errors
- Ensure you have selected a role
- Try refreshing the page

### Role not persisting
- Roles are stored in browser memory
- They will reset on page refresh
- Select the role again when needed

## Next Steps

1. **Add Navigation Links**: Add links to these pages in the admin menu
2. **Implement Backend**: Connect to real database for organizations and staff
3. **Add More Features**: Implement additional admin functions
4. **User Testing**: Test with real users to gather feedback

---

**Last Updated**: January 2, 2026
