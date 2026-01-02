# Customer Onboarding & KYC Implementation Plan

## Overview
This document outlines the implementation of the complete customer onboarding flow including:
1. Admin creating customers
2. Customer login & password reset
3. KYC document upload
4. Loan application viewing
5. Admin monitoring of customer status
6. Optional KYC automation & reminders

## Data Structure

### 1. Customer Profiles (Existing)
- `_id`: UUID
- `firstName`, `lastName`: string
- `emailAddress`: string (unique)
- `phoneNumber`: string
- `nationalIdNumber`: string (unique)
- `residentialAddress`: string
- `dateOfBirth`: date
- `kycVerificationStatus`: 'PENDING' | 'APPROVED' | 'REJECTED'
- `creditScore`: number
- `idDocumentImage`: string (URL)
- `organisationId`: string

### 2. Customer Login Records (NEW - CustomerAccounts)
- `_id`: UUID
- `customerProfileId`: string (FK)
- `organizationId`: string
- `accountIdentifier`: string (email or username)
- `accountStatus`: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION'
- `dateCreated`: datetime
- `lastUpdated`: datetime

### 3. KYC Verification History (Existing)
- `_id`: UUID
- `customerId`: string (FK)
- `organisationId`: string
- `verificationStatus`: 'PENDING' | 'APPROVED' | 'REJECTED'
- `verificationTimestamp`: datetime
- `verifierNotes`: string
- `verifierId`: string
- `attemptNumber`: number

### 4. Loan Documents (Existing)
- `_id`: UUID
- `loanId`: string (FK)
- `organisationId`: string
- `documentName`: string
- `documentType`: string
- `documentUrl`: string
- `uploadDate`: datetime
- `uploadedBy`: string
- `fileSize`: number

## Implementation Steps

### Phase 1: Admin Customer Creation
1. **Update CustomersPage.tsx**
   - Add form to create new customers
   - Validate email uniqueness
   - Generate temporary password
   - Create customer account record
   - Send email invite with login credentials
   - Log audit trail

### Phase 2: Customer Login & Account Management
1. **Create CustomerLoginPage.tsx**
   - Customer login form (email + password)
   - Password reset functionality
   - Account activation flow
   - Session management

2. **Update Router.tsx**
   - Add `/customer-login` route (public)
   - Add `/customer-reset-password` route (public)

### Phase 3: KYC Document Upload
1. **Create KYCUploadPage.tsx**
   - Document upload interface
   - File validation
   - Progress tracking
   - Document status display

2. **Update CustomerPortalPage.tsx**
   - Show KYC status
   - Link to KYC upload
   - Display uploaded documents

### Phase 4: Loan Application Viewing
1. **Update CustomerLoansPage.tsx**
   - Display customer's loans
   - Show application status
   - Link to loan details

### Phase 5: Admin Monitoring
1. **Create CustomerStatusDashboard.tsx**
   - List all customers with status
   - Filter by KYC status
   - Filter by account status
   - View customer details
   - Approve/reject KYC
   - Send reminders

### Phase 6: Automation & Reminders (Optional)
1. **Create KYCReminderService.ts**
   - Scheduled reminders for pending KYC
   - Email notifications
   - Status tracking

## Routes to Create
- `/customer-login` - Customer login page
- `/customer-reset-password` - Password reset
- `/customer-portal/kyc` - KYC upload
- `/admin/customers/status` - Customer status dashboard
- `/admin/customers/:id/details` - Customer details view

## Services to Update/Create
- `CustomerService` - Add login/account methods
- `KYCService` - New service for KYC operations
- `EmailService` - Send invites and reminders
- `KYCReminderService` - Automation for reminders

## UI Components to Create
1. CustomerLoginPage
2. KYCUploadPage
3. CustomerStatusDashboard
4. KYCDocumentUpload
5. CustomerDetailsModal

## Database Collections Used
- customers
- customeraccounts
- kycverificationhistory
- loandocuments
- audittrail
- loans
