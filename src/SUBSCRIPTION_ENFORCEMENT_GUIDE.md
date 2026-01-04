# Subscription Feature Enforcement Guide

## Overview

This guide explains how subscription plan features are enforced throughout the LendZm application. When users select a subscription plan during organization setup, they can only access features included in that plan.

## Subscription Plans

### Starter Plan
- **Price**: $59/month
- **Features**:
  - `basic_reporting` - Basic reporting capabilities
  - `customer_management` - Customer profile management
  - `loan_management` - Basic loan management

### Professional Plan
- **Price**: $199/month
- **Features**:
  - `advanced_reporting` - Advanced reporting and analytics
  - `customer_management` - Customer profile management
  - `loan_management` - Full loan management
  - `ifrs9_compliance` - IFRS 9 compliance module
  - `boz_provisions` - Bank of Zambia provisions

### Enterprise Plan
- **Price**: $299/month
- **Features**:
  - `advanced_reporting` - Advanced reporting and analytics
  - `customer_management` - Customer profile management
  - `loan_management` - Full loan management
  - `ifrs9_compliance` - IFRS 9 compliance module
  - `boz_provisions` - Bank of Zambia provisions
  - `api_access` - API access for integrations
  - `custom_integrations` - Custom integration support
  - `bulk_disbursement` - Bulk disbursement processing
  - `credit_committee` - Credit committee features

## Implementation Details

### 1. Hook: `useSubscriptionFeatures`

Located in `/src/hooks/useSubscriptionFeatures.ts`

This hook provides methods to check feature availability:

```typescript
const { 
  hasFeature,           // Check if a single feature is available
  hasAnyFeature,        // Check if any of multiple features are available
  hasAllFeatures,       // Check if all features are available
  getAvailableFeatures, // Get list of all available features
  getPlanType,          // Get the current plan name
  canAccessFeature,     // Async check for feature access
  subscriptionPlan,     // Current subscription plan object
  currentOrganisation   // Current organization object
} = useSubscriptionFeatures();
```

**Usage Example:**
```typescript
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';

function MyComponent() {
  const { hasFeature, getPlanType } = useSubscriptionFeatures();
  
  if (!hasFeature('advanced_reporting')) {
    return <div>Advanced reporting is not available in {getPlanType()} plan</div>;
  }
  
  return <AdvancedReportingComponent />;
}
```

### 2. Component: `FeatureGuard`

Located in `/src/components/ui/feature-guard.tsx`

Wraps content and shows fallback if feature is not available:

```typescript
<FeatureGuard feature="advanced_reporting">
  <AdvancedReportingComponent />
</FeatureGuard>
```

**Props:**
- `feature` (string | string[]): Feature(s) to check
- `children`: Content to show if feature is available
- `fallback` (optional): Custom fallback content
- `requireAll` (optional): If true, requires all features (default: false)

### 3. Component: `SubscriptionFeatureGuard`

Located in `/src/components/ui/subscription-feature-guard.tsx`

Full-page guard that shows a message and upgrade button if feature is not available:

```typescript
<SubscriptionFeatureGuard feature="ifrs9_compliance">
  <IFRS9CompliancePage />
</SubscriptionFeatureGuard>
```

**Props:**
- `feature` (string | string[]): Feature(s) to check
- `children`: Page content to show if feature is available
- `requireAll` (optional): If true, requires all features (default: false)
- `fallbackPath` (optional): Path to redirect to if feature unavailable (default: '/admin/dashboard')

### 4. Navigation Control

The `AdminPortalLayout` component automatically hides navigation items for features not in the current plan:

```typescript
// Navigation items with feature requirements
const mainNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: null },
  { path: '/admin/loans', label: 'Loans', icon: FileText, feature: 'loan_management' },
  { path: '/admin/compliance/ifrs9', label: 'IFRS 9 Compliance', icon: BarChart3, feature: 'ifrs9_compliance' },
  // ... more items
];

// Items are filtered based on hasFeature() check
{mainNavItems.map((item) => {
  const isFeatureAvailable = !item.feature || hasFeature(item.feature);
  
  return isFeatureAvailable ? (
    <Link to={item.path}>{item.label}</Link>
  ) : (
    <div className="disabled">{item.label} <Lock /></div>
  );
})}
```

## Protected Routes

The following routes are protected with feature guards:

### Loan Management Routes
- `/admin/loans` - requires `loan_management`
- `/admin/loans/apply` - requires `loan_management`
- `/admin/loans/approve` - requires `loan_management`
- `/admin/loans/disburse` - requires `loan_management`
- `/admin/repayments` - requires `loan_management`

### Customer Management Routes
- `/admin/customers` - requires `customer_management`
- `/admin/customers/bulk-upload` - requires `customer_management`

### Reporting Routes
- `/admin/reports` - requires `basic_reporting`
- `/admin/reports/advanced` - requires `advanced_reporting`
- `/admin/reports/comprehensive` - requires `advanced_reporting`
- `/admin/reports/disbursements` - requires `advanced_reporting`

### Compliance Routes
- `/admin/compliance/ifrs9` - requires `ifrs9_compliance`

## How It Works

1. **Organization Setup**: When a user creates an organization, they select a subscription plan
2. **Plan Storage**: The selected plan is stored in the organization record and the Zustand store
3. **Feature Checking**: Components use `useSubscriptionFeatures()` hook to check available features
4. **Access Control**: 
   - Navigation items are hidden for unavailable features
   - Routes show a message if feature is not available
   - Users cannot access restricted features even if they try to navigate directly

## Adding New Features

To add a new feature to the system:

1. **Update Subscription Plans**: Add the feature to the appropriate plans in `SubscriptionService.ts`:
   ```typescript
   {
     planName: 'Professional',
     features: 'advanced_reporting,customer_management,loan_management,new_feature',
     // ...
   }
   ```

2. **Update Hook**: Add the feature to the `FeatureKey` type in `useSubscriptionFeatures.ts`:
   ```typescript
   export type FeatureKey = 
     | 'basic_reporting'
     | 'advanced_reporting'
     | 'new_feature'  // Add here
     // ...
   ```

3. **Protect Routes**: Wrap the route with `SubscriptionFeatureGuard`:
   ```typescript
   {
     path: "new-feature",
     element: (
       <SubscriptionFeatureGuard feature="new_feature">
         <NewFeaturePage />
       </SubscriptionFeatureGuard>
     ),
   }
   ```

4. **Update Navigation**: Add the feature requirement to navigation items in `AdminPortalLayout.tsx`:
   ```typescript
   { path: '/admin/new-feature', label: 'New Feature', icon: Icon, feature: 'new_feature' }
   ```

## Testing Feature Access

To test feature enforcement:

1. Create an organization with the **Starter** plan
2. Verify that only basic features are accessible:
   - Dashboard ✓
   - Customers ✓
   - Loans ✓
   - Basic Reports ✓
   - Advanced Reports ✗ (locked)
   - IFRS 9 Compliance ✗ (locked)

3. Create another organization with the **Enterprise** plan
4. Verify all features are accessible

## Upgrade Flow

When a user tries to access a restricted feature:

1. They see a message: "Feature Not Available"
2. The message shows their current plan and required feature
3. They can click "Upgrade Plan" to go to `/setup` and select a higher plan
4. After upgrading, they can access the feature

## Best Practices

1. **Always use feature guards** for sensitive features
2. **Hide navigation items** for unavailable features to avoid confusion
3. **Provide clear upgrade messaging** when users encounter restrictions
4. **Test with different plans** to ensure proper enforcement
5. **Document feature requirements** in code comments

## Troubleshooting

### Feature not showing as available
- Check that the feature is included in the subscription plan definition
- Verify the organization's `subscriptionPlanType` is set correctly
- Check the feature name matches exactly (case-sensitive)

### Navigation items still showing
- Ensure `AdminPortalLayout.tsx` has the feature requirement defined
- Check that `useSubscriptionFeatures()` is imported and used
- Verify the feature name in the navigation item matches the plan definition

### Users can still access restricted routes
- Ensure the route is wrapped with `SubscriptionFeatureGuard`
- Check that the feature name is correct
- Verify the organization's subscription plan is loaded in the store
