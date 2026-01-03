# Customer Onboarding & Portal Integration Implementation

## Overview
This document outlines the comprehensive integration between Admin Portal and Customer Portal with controlled onboarding, user hierarchy, and secure invitation workflows.

## Architecture

### User Hierarchy
1. **Platform Owner** (System Owner)
   - Full system access
   - Manages multiple organizations
   - Subscription management

2. **Organisation Admin**
   - Organization-level management
   - Create and manage customers
   - View KYC and activation status
   - Manage staff and branches

3. **End Customer**
   - Access to Customer Portal
   - Profile management
   - KYC upload
   - Loan applications
   - Repayment tracking

### Data Model Extensions

#### CustomerProfiles (Enhanced)
```typescript
{
  _id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  nationalIdNumber: string;
  residentialAddress: string;
  dateOfBirth: Date;
  
  // Organization & Branch Linking
  organisationId: string;        // REQUIRED - Links to Organizations
  branchId?: string;             // Optional - Links to Branch
  
  // Activation Status
  activationStatus: 'PENDING_ACTIVATION' | 'ACTIVATED' | 'SUSPENDED' | 'INACTIVE';
  activatedDate?: Date;
  
  // KYC Status
  kycVerificationStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  kycVerifiedDate?: Date;
  
  // Account Management
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginDate?: Date;
  
  // Metadata
  createdBy?: string;            // Staff member ID who created
  invitationSentDate?: Date;
  invitationExpiryDate?: Date;
  creditScore?: number;
  idDocumentImage?: string;
}
```

#### CustomerInvitations (New Collection)
```typescript
{
  _id: string;
  customerId: string;            // Reference to CustomerProfiles
  organisationId: string;
  invitationToken: string;       // Secure, unique token
  invitationEmail: string;
  invitationPhone?: string;
  invitationType: 'EMAIL' | 'SMS' | 'BOTH';
  
  // Status Tracking
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  sentDate: Date;
  expiryDate: Date;              // 7 days default
  acceptedDate?: Date;
  
  // Attempt Tracking
  emailSentCount: number;
  smsSentCount: number;
  maxAttempts: number;           // Default 3
  
  // Metadata
  createdBy: string;
  notes?: string;
}
```

#### CustomerActivationLog (New Collection)
```typescript
{
  _id: string;
  customerId: string;
  organisationId: string;
  
  // Activation Steps
  invitationSent: Date;
  emailVerified?: Date;
  phoneVerified?: Date;
  passwordSet?: Date;
  accountActivated?: Date;
  
  // Status
  currentStep: 'INVITED' | 'EMAIL_VERIFIED' | 'PHONE_VERIFIED' | 'PASSWORD_SET' | 'ACTIVATED';
  completionPercentage: number;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
}
```

## Implementation Phases

### Phase 1: Data Model & Services
- [ ] Update CustomerProfiles entity with new fields
- [ ] Create CustomerInvitations collection
- [ ] Create CustomerActivationLog collection
- [ ] Create CustomerOnboardingService
- [ ] Create InvitationService
- [ ] Create ActivationService

### Phase 2: Admin Portal - Customer Management
- [ ] Enhanced CustomersPage with organization filtering
- [ ] Create customer with organization & branch linking
- [ ] Customer invitation workflow
- [ ] Activation status tracking
- [ ] KYC verification blocking
- [ ] Invitation resend functionality
- [ ] Bulk invitation management

### Phase 3: Customer Invitation & Sign-up Flow
- [ ] Invitation email/SMS templates
- [ ] Secure invitation link generation
- [ ] Sign-up page with:
  - Email verification (OTP)
  - Phone verification (OTP)
  - Password setup
  - Account activation
- [ ] Redirect to Customer Portal Dashboard

### Phase 4: Customer Portal Enhancements
- [ ] Profile management (read-only organization)
- [ ] KYC upload & status tracking
- [ ] Loan applications
- [ ] Repayment schedules & statements
- [ ] Notifications & reminders
- [ ] Organization restriction enforcement

### Phase 5: Security & Compliance
- [ ] Expiring invitation links (7 days)
- [ ] Single-use tokens
- [ ] Audit logging for all actions
- [ ] Role-based access control
- [ ] Data isolation by organization
- [ ] Subscription limit enforcement

### Phase 6: Automated Reminders
- [ ] Scheduled job for pending invitations
- [ ] Reminder emails after 3 days
- [ ] Follow-up emails after 7 days
- [ ] Configurable reminder settings

## Key Features

### Admin Portal Features
1. **Customer Creation**
   - Capture full customer details
   - Link to organization & branch
   - Set initial activation status (PENDING_ACTIVATION)
   - Automatic invitation generation

2. **Invitation Management**
   - Send invitations via email/SMS
   - Track invitation status
   - Resend invitations
   - Revoke invitations
   - View activation progress

3. **KYC Verification**
   - View KYC status
   - Block loan approval until verified
   - Track verification history

4. **Activation Tracking**
   - View activation status
   - Track completion percentage
   - Monitor activation attempts
   - Audit trail

### Customer Portal Features
1. **Profile Management**
   - View profile (read-only organization)
   - Update personal details
   - Change password
   - View account status

2. **KYC Management**
   - Upload KYC documents
   - Track verification status
   - Resubmit if rejected

3. **Loan Management**
   - View active loans
   - Apply for new loans
   - Track application status
   - View repayment schedules

4. **Notifications**
   - Payment reminders
   - Loan status updates
   - KYC status updates
   - System notifications

## Security Considerations

1. **Invitation Links**
   - Unique, cryptographically secure tokens
   - 7-day expiration
   - Single-use only
   - Audit logged

2. **Data Isolation**
   - Customers can only access their own data
   - Organization-based filtering
   - No cross-organization access

3. **Role-Based Access**
   - Admin Portal: Organization Admin only
   - Customer Portal: End Customer only
   - Enforce via middleware

4. **Audit Logging**
   - All invitations logged
   - All activations logged
   - All KYC changes logged
   - All login attempts logged

## Integration Points

1. **Email Service**
   - Invitation emails with secure links
   - OTP emails
   - Reminder emails

2. **SMS Service**
   - OTP SMS
   - Invitation SMS
   - Reminder SMS

3. **Authentication**
   - Wix Members SDK integration
   - Role-based access control
   - Session management

4. **Subscription Service**
   - Customer limit enforcement
   - Upgrade prompts
   - Limit tracking

## Testing Strategy

1. **Unit Tests**
   - Service methods
   - Token generation
   - Validation logic

2. **Integration Tests**
   - End-to-end invitation flow
   - Activation workflow
   - KYC verification

3. **Security Tests**
   - Token expiration
   - Single-use enforcement
   - Data isolation
   - Cross-organization access prevention

## Deployment Checklist

- [ ] Database migrations
- [ ] Service implementations
- [ ] UI components
- [ ] Email templates
- [ ] SMS templates
- [ ] Audit logging
- [ ] Error handling
- [ ] Documentation
- [ ] Testing
- [ ] Security review
