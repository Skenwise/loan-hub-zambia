# Phase 1: Demo/Testing Environment Implementation

## Overview
This document outlines the Phase 1 implementation of the Demo/Testing Environment for the loan management system. This phase includes data cleanup/reset functionality, demo mode configuration, and a Super Admin setup wizard.

---

## 1. Data Cleanup Service (`DemoManagementService.ts`)

### Location
`/src/services/DemoManagementService.ts`

### Key Methods

#### `resetOrganisationData(organisationId: string)`
- **Purpose**: Programmatically reset all organisation-level data
- **Scope**: Removes all transactional and operational data
- **Deleted Items**:
  - Staff members and role assignments
  - Customer profiles
  - Loans (all statuses)
  - Repayments and disbursements
  - Loan documents
  - KYC documents and status tracking
  - Collateral records
- **Preserved Items**:
  - Platform-level configuration (subscription plans, system settings)
  - Audit logs (high-level system events only)
  - Organisation settings and metadata
- **Returns**: Success status with count of deleted items per category

#### `enableDemoMode(organisationId: string)`
- Enables demo mode for an organisation
- Updates `OrganisationSettings.isDemoMode = true`
- Creates settings record if it doesn't exist

#### `disableDemoMode(organisationId: string)`
- Disables demo mode for an organisation
- Updates `OrganisationSettings.isDemoMode = false`

#### `isDemoMode(organisationId: string)`
- Checks if an organisation is in demo mode
- Returns boolean

#### `getAllDemoModeStatuses()`
- Retrieves demo mode status for all organisations
- Returns array of `{ organisationId, isDemoMode }`

---

## 2. Demo Banner Component (`DemoBanner.tsx`)

### Location
`/src/components/DemoBanner.tsx`

### Features
- Displays persistent yellow banner when demo mode is active
- Shows warning: "Demo / Test Environment – No Real Transactions"
- Includes explanatory text about simulated transactions
- Uses AlertCircle icon from lucide-react
- Responsive design with proper spacing

### Usage
```tsx
import DemoBanner from '@/components/DemoBanner';

<DemoBanner isDemoMode={true} />
```

### Integration Points
- Should be added to `AdminPortalLayout.tsx` to display across all admin pages
- Should be added to `CustomerPortalPage.tsx` for customer-facing demo environments

---

## 3. Demo Management Page (`DemoManagementPage.tsx`)

### Location
`/src/components/pages/DemoManagementPage.tsx`

### Access Control
- **Route**: `/admin/demo-management`
- **Protected By**: `MemberProtectedRoute` + `RoleProtectedRoute` (Super Admin only)

### Features
- **View All Organisations**: Lists all organisations with their demo mode status
- **Reset Data**: Triggers data cleanup for a specific organisation
- **Confirmation Dialog**: Shows what will be deleted before confirming
- **Loading States**: Displays spinner during reset operations
- **Success Feedback**: Shows count of deleted items

### User Flow
1. Super Admin navigates to `/admin/demo-management`
2. Sees list of all organisations with demo mode status (ENABLED/DISABLED)
3. Clicks "Reset Data" button for an organisation
4. Confirmation dialog appears with deletion scope
5. Confirms action
6. Data is deleted and counts are displayed
7. Page refreshes to show updated state

---

## 4. Super Admin Setup Wizard (`SuperAdminSetupWizardPage.tsx`)

### Location
`/src/components/pages/SuperAdminSetupWizardPage.tsx`

### Access Control
- **Route**: `/setup-wizard`
- **Protected By**: `MemberProtectedRoute`
- **Trigger**: Should be auto-triggered when no organisations exist

### Wizard Steps

#### Step 1: Create Organisation
- Input: Organisation name
- Validation: Name is required and non-empty
- Action: Stores organisation name in wizard state

#### Step 2: Select Subscription Plan
- Input: Dropdown of active subscription plans
- Displays: Plan name and monthly price
- Validation: Plan must be selected
- Action: Stores selected plan ID

#### Step 3: Create Admin User
- Inputs:
  - Admin full name
  - Admin email address
- Validation: Both fields required
- Action: Stores admin details

#### Step 4: Demo Mode Settings
- Input: Checkbox to enable demo mode
- Info: Explains demo mode purpose
- Action: Stores demo mode preference

#### Step 5: Complete
- Creates organisation record
- Creates organisation settings with demo mode flag
- Creates admin staff member
- Enables demo mode if selected
- Redirects to `/admin/dashboard`

### Data Created
```typescript
// Organisation
{
  _id: UUID,
  organizationName: string,
  subscriptionPlanId: string,
  subscriptionPlanType: 'active',
  organizationStatus: 'ACTIVE',
  creationDate: Date,
  contactEmail: string
}

// Organisation Settings
{
  _id: organisationId,
  companyName: string,
  isDemoMode: boolean
}

// Staff Member (Admin)
{
  _id: UUID,
  fullName: string,
  email: string,
  role: 'Organisation Admin',
  status: 'ACTIVE',
  employeeId: string
}
```

### UI Features
- Multi-step progress indicator
- Error handling and validation
- Loading states during setup
- Success screen with redirect
- Back button to navigate between steps

---

## 5. CMS Collection Updates

### OrganisationSettings Collection
**New Field Added**:
- **Field Name**: `isDemoMode`
- **Field Type**: Boolean
- **Display Name**: Is Demo Mode
- **Default**: false
- **Purpose**: Tracks whether an organisation is in demo mode

---

## 6. Router Configuration

### New Routes Added

#### `/setup-wizard`
```typescript
{
  path: "setup-wizard",
  element: (
    <MemberProtectedRoute messageToSignIn="Sign in to access setup wizard">
      <SuperAdminSetupWizardPage />
    </MemberProtectedRoute>
  ),
}
```

#### `/admin/demo-management`
```typescript
{
  path: "demo-management",
  element: (
    <MemberProtectedRoute messageToSignIn="Sign in to access demo management">
      <RoleProtectedRoute 
        requiredRoles={['Super Admin']}
        messageToSignIn="This page is only accessible to Super Admin users."
      >
        <DemoManagementPage />
      </RoleProtectedRoute>
    </MemberProtectedRoute>
  ),
}
```

---

## 7. Integration Checklist

### Required Integrations (Phase 1)

- [ ] Add `DemoBanner` to `AdminPortalLayout.tsx`
  ```tsx
  import DemoBanner from '@/components/DemoBanner';
  
  // In render:
  <DemoBanner isDemoMode={isDemoMode} />
  ```

- [ ] Add `DemoBanner` to `CustomerPortalPage.tsx`

- [ ] Auto-trigger setup wizard when no organisations exist
  - Check in `HomePage.tsx` or main layout
  - Redirect to `/setup-wizard` if no organisations found

- [ ] Add Demo Management link to Super Admin navigation
  - Update `AdminPortalLayout.tsx` navigation menu
  - Add link to `/admin/demo-management`

- [ ] Disable payment processing in demo mode
  - Update `PaymentModal.tsx` to check `isDemoMode`
  - Show warning message instead of processing

- [ ] Add demo watermark to reports
  - Update report components to display "DEMO" watermark
  - Add footer: "For demonstration purposes only"

---

## 8. Usage Examples

### Check if Organisation is in Demo Mode
```typescript
import { DemoManagementService } from '@/services/DemoManagementService';

const isDemoMode = await DemoManagementService.isDemoMode(organisationId);
if (isDemoMode) {
  // Show demo banner, disable payments, etc.
}
```

### Reset Organisation Data
```typescript
const result = await DemoManagementService.resetOrganisationData(organisationId);
console.log(`Deleted ${result.deletedCounts.loans} loans`);
console.log(`Deleted ${result.deletedCounts.customers} customers`);
```

### Enable Demo Mode
```typescript
await DemoManagementService.enableDemoMode(organisationId);
```

### Get All Demo Statuses
```typescript
const statuses = await DemoManagementService.getAllDemoModeStatuses();
statuses.forEach(status => {
  console.log(`${status.organisationId}: ${status.isDemoMode ? 'DEMO' : 'LIVE'}`);
});
```

---

## 9. Security Considerations

### Access Control
- Demo Management page: Super Admin only
- Setup Wizard: Authenticated users only
- Data cleanup: Only affects specified organisation (no cross-org data leakage)

### Data Integrity
- Cleanup is organisation-scoped (absolute boundaries)
- Platform-level data is never affected
- Audit logs preserved for compliance

### Validation
- All inputs validated before processing
- Confirmation dialogs prevent accidental data loss
- Error handling with user-friendly messages

---

## 10. Testing Checklist

### Functional Tests
- [ ] Setup wizard creates organisation correctly
- [ ] Setup wizard creates admin user
- [ ] Demo mode flag is set correctly
- [ ] Data cleanup removes all specified items
- [ ] Data cleanup preserves platform config
- [ ] Demo banner displays when isDemoMode = true
- [ ] Demo banner hidden when isDemoMode = false
- [ ] Demo management page loads organisations
- [ ] Reset button triggers confirmation dialog
- [ ] Reset operation completes successfully

### Security Tests
- [ ] Non-Super Admin cannot access demo management
- [ ] Unauthenticated users cannot access setup wizard
- [ ] Data cleanup only affects target organisation
- [ ] No cross-organisation data leakage

### Edge Cases
- [ ] Setup wizard handles empty subscription plans list
- [ ] Data cleanup handles missing collections gracefully
- [ ] Demo mode toggle works correctly
- [ ] Multiple organisations can have different demo modes

---

## 11. Next Steps (Phase 2)

- [ ] Auto-trigger setup wizard when no organisations exist
- [ ] Implement demo data generation
- [ ] Add demo watermark to reports
- [ ] Disable payment processing in demo mode
- [ ] Create demo data templates
- [ ] Implement demo transaction simulation

---

## 12. File Structure

```
/src
├── services/
│   └── DemoManagementService.ts          (NEW)
├── components/
│   ├── DemoBanner.tsx                    (NEW)
│   ├── pages/
│   │   ├── DemoManagementPage.tsx        (NEW)
│   │   └── SuperAdminSetupWizardPage.tsx (NEW)
│   └── Router.tsx                        (UPDATED)
├── entities/
│   └── index.ts                          (UPDATED - added isDemoMode field)
```

---

## 13. API Reference

### DemoManagementService

```typescript
class DemoManagementService {
  static async resetOrganisationData(organisationId: string): Promise<{
    success: boolean;
    message: string;
    deletedCounts: Record<string, number>;
  }>

  static async enableDemoMode(organisationId: string): Promise<void>

  static async disableDemoMode(organisationId: string): Promise<void>

  static async isDemoMode(organisationId: string): Promise<boolean>

  static async getAllDemoModeStatuses(): Promise<Array<{
    organisationId: string;
    isDemoMode: boolean;
  }>>
}
```

---

## 14. Known Limitations & Future Improvements

### Current Limitations
- Setup wizard doesn't auto-trigger (manual navigation required)
- Demo data generation not yet implemented
- Payment processing not yet disabled in demo mode
- Report watermarks not yet implemented

### Future Improvements
- Auto-trigger setup wizard on first login
- Bulk demo data generation
- Demo transaction simulation
- Scheduled cleanup of old demo data
- Demo mode analytics and reporting

---

## 15. Support & Troubleshooting

### Common Issues

**Issue**: Setup wizard not creating organisation
- **Solution**: Check that subscription plans exist and are marked as active

**Issue**: Data cleanup fails with "collection not found"
- **Solution**: This is expected for optional collections (e.g., collateral). Service handles gracefully.

**Issue**: Demo banner not showing
- **Solution**: Ensure `isDemoMode` is set to `true` in OrganisationSettings

**Issue**: Demo Management page shows "Access Denied"
- **Solution**: Verify user has "Super Admin" role assigned

---

## Document Version
- **Version**: 1.0
- **Date**: 2026-01-07
- **Status**: Phase 1 Complete
- **Next Review**: After Phase 2 Implementation
