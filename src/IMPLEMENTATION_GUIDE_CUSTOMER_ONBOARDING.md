# Customer Onboarding Integration - Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the comprehensive customer onboarding and portal integration system.

## What Has Been Implemented

### 1. ✅ Data Model Extensions
- **CustomerProfiles** - Enhanced with:
  - `branchId` - Links customer to branch
  - `activationStatus` - PENDING_ACTIVATION, ACTIVATED, SUSPENDED, INACTIVE
  - `activatedDate` - When customer was activated
  - `kycVerifiedDate` - When KYC was verified
  - `accountStatus` - ACTIVE, INACTIVE, SUSPENDED
  - `lastLoginDate` - Track login activity
  - `createdBy` - Staff member who created customer
  - `invitationSentDate` - When invitation was sent
  - `invitationExpiryDate` - When invitation expires

- **CustomerInvitations** (New Collection)
  - Tracks all customer invitations
  - Secure token generation
  - Status tracking (PENDING, ACCEPTED, EXPIRED, REVOKED)
  - Attempt counting
  - Expiry management

- **CustomerActivationLog** (New Collection)
  - Tracks activation progress
  - Step-by-step completion tracking
  - Completion percentage
  - IP and user agent logging

### 2. ✅ Services Created

#### CustomerOnboardingService
- `createCustomer()` - Create customer with pending activation
- `generateInvitationToken()` - Secure token generation
- `sendInvitation()` - Send email/SMS invitations
- `verifyInvitationToken()` - Validate tokens
- `activateCustomer()` - Complete activation
- `resendInvitation()` - Resend with attempt tracking
- `getActivationStatus()` - Check progress
- `getPendingInvitations()` - List pending
- `validateCustomerOrganization()` - Enforce org isolation

#### CustomerInvitationService
- `getInvitationByToken()` - Retrieve invitation
- `getCustomerInvitations()` - Get customer's invitations
- `getOrganizationPendingInvitations()` - Org-level view
- `getInvitationsNeedingReminder()` - Automated reminders
- `sendReminderEmail()` - Send reminder
- `revokeInvitation()` - Revoke with audit log
- `getInvitationStats()` - Statistics
- `isInvitationValid()` - Validation
- `getInvitationExpiryStatus()` - Expiry tracking
- `bulkSendInvitations()` - Batch operations

### 3. ✅ UI Components

#### CustomerSignupPage
- Multi-step signup flow
- Email verification with OTP
- Phone verification with OTP
- Password setup with validation
- Account activation
- Progress tracking
- Error handling
- Success feedback

### 4. ✅ Routes Added
- `/customer-signup?token=<token>` - Customer signup page

## What Needs to Be Implemented

### Phase 1: Admin Portal Enhancements (PRIORITY)

#### 1. Update CustomersPage.tsx
```typescript
// Add organization filtering
const [selectedOrganisation, setSelectedOrganisation] = useState<string>('');

// Add branch selection
const [selectedBranch, setSelectedBranch] = useState<string>('');

// Update customer creation form
const handleCreateCustomer = async () => {
  // 1. Validate organization is selected
  // 2. Create customer with organisationId and branchId
  // 3. Automatically send invitation
  // 4. Show activation status
};

// Add activation status column
// Add KYC status column
// Add invitation status column
// Add resend invitation button
```

#### 2. Create CustomerActivationStatusPage
```typescript
// Show activation progress for each customer
// Display:
// - Invitation sent date
// - Email verification status
// - Phone verification status
// - Password set status
// - Account activation status
// - Completion percentage
```

#### 3. Create InvitationManagementPage
```typescript
// Manage all invitations
// Features:
// - View pending invitations
// - Resend invitations
// - Revoke invitations
// - View invitation statistics
// - Bulk send invitations
// - Track invitation attempts
```

#### 4. Create KYCVerificationPage
```typescript
// Manage KYC verification
// Features:
// - View KYC status for each customer
// - Block loan approval until verified
// - View KYC documents
// - Approve/reject KYC
// - Track verification history
```

### Phase 2: Customer Portal Enhancements

#### 1. Update CustomerPortalPage.tsx
```typescript
// Add organization enforcement
// Prevent access if:
// - activationStatus !== 'ACTIVATED'
// - accountStatus !== 'ACTIVE'
// - organisationId doesn't match

// Add KYC status blocking
// Block loan application if KYC not verified
```

#### 2. Create ProfileManagementPage
```typescript
// Allow customers to:
// - View profile (read-only organization)
// - Update personal details
// - Change password
// - View account status
// - View activation history
```

#### 3. Create KYCUploadPage (Enhanced)
```typescript
// Allow customers to:
// - Upload KYC documents
// - Track verification status
// - Resubmit if rejected
// - View submission history
```

### Phase 3: Security & Compliance

#### 1. Implement OTP Service
```typescript
// EmailService.sendOTP()
// SMSService.sendOTP()
// OTPService.verifyOTP()
// OTPService.generateOTP()
```

#### 2. Implement Password Management
```typescript
// AuthService.setPassword()
// AuthService.validatePassword()
// AuthService.hashPassword()
```

#### 3. Implement Audit Logging
```typescript
// Already partially implemented in AuditService
// Ensure all actions are logged:
// - Customer creation
// - Invitation sent/resent/revoked
// - Email/phone verification
// - Password setup
// - Account activation
// - KYC submission/verification
// - Login attempts
```

### Phase 4: Automated Reminders

#### 1. Implement Scheduled Jobs
```typescript
// Create cron job to:
// - Check for pending invitations older than 3 days
// - Send reminder emails
// - Check for pending invitations older than 7 days
// - Send final reminder
// - Mark as expired after 7 days
```

#### 2. Create ReminderService
```typescript
// ReminderService.sendPendingInvitationReminders()
// ReminderService.sendKYCReminders()
// ReminderService.sendPaymentReminders()
```

### Phase 5: Subscription & Limits

#### 1. Implement Customer Limit Enforcement
```typescript
// SubscriptionService.checkCustomerLimit()
// - Get organization's subscription plan
// - Count existing customers
// - Check if limit exceeded
// - Prompt upgrade if needed
```

#### 2. Create UpgradePromptModal
```typescript
// Show when:
// - Customer limit exceeded
// - Trying to create new customer
// - Allow upgrade or cancel
```

## Implementation Checklist

### Data Model
- [x] Extend CustomerProfiles entity
- [x] Create CustomerInvitations entity
- [x] Create CustomerActivationLog entity
- [ ] Create database migrations (if needed)
- [ ] Add fields to CMS collections

### Services
- [x] Create CustomerOnboardingService
- [x] Create CustomerInvitationService
- [ ] Create OTPService
- [ ] Create PasswordService
- [ ] Create ReminderService
- [ ] Update EmailService with OTP support
- [ ] Create SMSService

### UI Components
- [x] Create CustomerSignupPage
- [ ] Update CustomersPage with org/branch filtering
- [ ] Create CustomerActivationStatusPage
- [ ] Create InvitationManagementPage
- [ ] Create KYCVerificationPage
- [ ] Create ProfileManagementPage
- [ ] Create UpgradePromptModal
- [ ] Update CustomerPortalPage with org enforcement

### Routes
- [x] Add /customer-signup route
- [ ] Add /admin/customers/activation-status route
- [ ] Add /admin/customers/invitations route
- [ ] Add /admin/customers/kyc-verification route
- [ ] Add /customer-portal/profile route
- [ ] Add /customer-portal/kyc route

### Security
- [ ] Implement token expiration
- [ ] Implement single-use tokens
- [ ] Implement OTP verification
- [ ] Implement password hashing
- [ ] Implement audit logging
- [ ] Implement data isolation by organization
- [ ] Implement role-based access control

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for workflows
- [ ] Security tests for token handling
- [ ] E2E tests for signup flow

## Key Integration Points

### 1. Email Service
```typescript
// Update EmailService to support:
EmailService.sendCustomerInvite(email, name, signupLink, isReminder?)
EmailService.sendOTP(email, otp)
EmailService.sendKYCStatusUpdate(email, status)
EmailService.sendPaymentReminder(email, amount, dueDate)
```

### 2. Authentication
```typescript
// Integrate with Wix Members SDK:
// - Create member account on password setup
// - Link member to customer record
// - Enforce role-based access
// - Track login sessions
```

### 3. Subscription Service
```typescript
// Check limits before creating customer:
SubscriptionService.canCreateCustomer(organisationId)
// Returns: { allowed: boolean, currentCount: number, limit: number }
```

### 4. Audit Service
```typescript
// Log all actions:
AuditService.logAction({
  actionType: string,
  resourceType: string,
  resourceId: string,
  performedBy: string,
  organisationId: string,
  details: object
})
```

## Testing Scenarios

### Scenario 1: Complete Signup Flow
1. Admin creates customer
2. Invitation email sent
3. Customer clicks link
4. Email verification with OTP
5. Phone verification with OTP
6. Password setup
7. Account activation
8. Redirect to portal

### Scenario 2: Invitation Expiry
1. Admin creates customer
2. Customer doesn't sign up for 7 days
3. Invitation expires
4. Link becomes invalid
5. Customer receives reminder email
6. Admin can resend invitation

### Scenario 3: KYC Blocking
1. Customer activated
2. Customer tries to apply for loan
3. KYC not verified
4. Loan application blocked
5. Customer directed to KYC upload
6. After verification, loan application allowed

### Scenario 4: Organization Isolation
1. Customer A from Org 1
2. Customer B from Org 2
3. Customer A cannot access Org 2 data
4. Customer A cannot change organization
5. Admin can only see their organization's customers

## Database Queries

### Get pending invitations for organization
```typescript
const { items } = await BaseCrudService.getAll<CustomerInvitations>('customerinvitations');
const pending = items.filter(inv => 
  inv.organisationId === orgId && inv.status === 'PENDING'
);
```

### Get customers by activation status
```typescript
const { items } = await BaseCrudService.getAll<CustomerProfiles>('customers');
const activated = items.filter(c => 
  c.organisationId === orgId && c.activationStatus === 'ACTIVATED'
);
```

### Get KYC pending customers
```typescript
const { items } = await BaseCrudService.getAll<CustomerProfiles>('customers');
const kycPending = items.filter(c => 
  c.organisationId === orgId && c.kycVerificationStatus === 'PENDING'
);
```

## Error Handling

### Common Errors
1. **Invalid Token** - Expired or non-existent
2. **Duplicate Invitation** - Customer already has pending invitation
3. **Max Attempts Exceeded** - Too many invitation attempts
4. **Organization Mismatch** - Customer trying to access wrong org
5. **Activation Required** - Customer not activated
6. **KYC Required** - KYC not verified for operation

### Error Messages
```typescript
const errors = {
  INVALID_TOKEN: 'Invitation link is invalid or expired',
  DUPLICATE_INVITATION: 'Customer already has a pending invitation',
  MAX_ATTEMPTS: 'Maximum invitation attempts exceeded',
  ORG_MISMATCH: 'You do not have access to this organization',
  NOT_ACTIVATED: 'Your account is not yet activated',
  KYC_REQUIRED: 'KYC verification is required for this operation',
};
```

## Next Steps

1. **Immediate**: Implement OTP service and password management
2. **Short-term**: Update CustomersPage with org/branch filtering
3. **Medium-term**: Create admin pages for activation and KYC management
4. **Long-term**: Implement automated reminders and subscription limits

## Support

For questions or issues, refer to:
- `/src/CUSTOMER_ONBOARDING_INTEGRATION.md` - Architecture overview
- `/src/services/CustomerOnboardingService.ts` - Service implementation
- `/src/services/CustomerInvitationService.ts` - Invitation management
- `/src/components/pages/CustomerSignupPage.tsx` - Signup UI
