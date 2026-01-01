# Phase 1: Foundation - Enterprise LMS Implementation

## Overview
Phase 1 establishes the core foundation of the Enterprise Loan Management System with multi-tenant architecture, role-based access control (RBAC), subscription billing, and audit trails.

## ✅ Completed Components

### 1. **Multi-Tenant Data Isolation**
- Added `organisationId` field to all relevant collections:
  - Customers, Loans, Repayments, Loan Products
  - Loan Documents, Loan Workflow History
  - KYC Verification History, BoZ Provisions, ECL Results
  - Customer Accounts
- Ensures complete data isolation between organisations

### 2. **Role-Based Access Control (RBAC)**
- **5 System Roles** with segregation of duties:
  - **Admin/Owner**: Full system access (Hierarchy Level 1)
  - **Credit Officer**: Customer onboarding & loan applications (Level 3)
  - **Credit Manager**: Loan approvals & reviews (Level 2)
  - **Finance Officer**: Disbursements & repayments (Level 3)
  - **Compliance Officer**: IFRS 9 & regulatory reporting (Level 2)

- **Permission System**: 15+ granular permissions
  - Customer management (create, view, update, verify KYC)
  - Loan operations (apply, approve, reject, disburse)
  - Repayment management
  - Compliance & reporting
  - Audit trail access

### 3. **Subscription Billing System**
- **3 Subscription Plans**:
  - **Starter**: $99/month - Basic features, 100 customers, 50 loans
  - **Professional**: $299/month - Advanced features, 1000 customers, 500 loans
  - **Enterprise**: $999/month - Unlimited, API access, custom integrations

- Features include:
  - Plan-based feature access control
  - Usage limit enforcement
  - Subscription validity checking

### 4. **Staff Management**
- Staff member profiles with:
  - Employee ID, Full Name, Email, Department
  - Phone Number, Date Hired
  - Status (active, inactive, suspended)
  - Last Login Date tracking

- Role assignment system:
  - Staff-to-Role mapping per organisation
  - Assignment date tracking
  - Status management (ACTIVE, INACTIVE)

### 5. **Authorization & Segregation of Duties**
- **AuthorizationService** provides:
  - Permission checking (single, multiple, all)
  - Segregation of duties enforcement
  - Conflicting permission detection
  - Full authorization workflow

- **Segregation Rules**:
  - Credit Officer cannot approve their own applications
  - Credit Manager cannot disburse loans they approved
  - Finance Officer cannot approve loans

### 6. **Audit Trail System**
- Comprehensive logging of all actions:
  - Customer creation/updates
  - Loan applications, approvals, rejections
  - Disbursements and repayments
  - KYC verifications
  - Staff actions with timestamps

- Audit queries:
  - By resource ID
  - By staff member
  - By date range
  - Full audit trail retrieval

### 7. **Service Layer Architecture**

#### Core Services:

**OrganisationService**
```typescript
- getOrganisation(id)
- getAllOrganisations()
- createOrganisation(data)
- updateOrganisation(id, data)
- hasActiveSubscription(id)
- getSubscriptionPlan(id)
```

**RoleService**
```typescript
- getRole(id)
- getRoleByName(name)
- getAllRoles()
- createRole(data)
- updateRole(id, data)
- initializeDefaultRoles()
- getRolePermissions(id)
- roleHasPermission(id, permission)
```

**StaffService**
```typescript
- getStaffMember(id)
- getOrganisationStaff(orgId)
- createStaffMember(data)
- updateStaffMember(id, data)
- assignRole(staffId, roleId, orgId, assignedBy)
- getStaffRole(staffId, orgId)
- updateStaffStatus(id, status)
- updateLastLogin(id)
- getStaffByEmail(email)
```

**AuthorizationService**
```typescript
- hasPermission(staffId, orgId, permission)
- hasAnyPermission(staffId, orgId, permissions[])
- hasAllPermissions(staffId, orgId, permissions[])
- getStaffPermissions(staffId, orgId)
- checkSegregationOfDuties(staffId, orgId, action)
- authorizeAction(staffId, orgId, action)
```

**SubscriptionService**
```typescript
- getPlan(id)
- getAllPlans()
- createPlan(data)
- updatePlan(id, data)
- getOrganisationPlan(orgId)
- hasFeatureAccess(orgId, feature)
- getPlanLimits(planId)
- initializeDefaultPlans()
```

**AuditService**
```typescript
- logAction(entry)
- getResourceAuditTrail(resourceId)
- getStaffAuditTrail(staffMemberId)
- getAuditTrailByDateRange(start, end)
- getAllAuditTrail()
- logCustomerCreation/Update
- logLoanApplication/Approval/Rejection/Disbursement
- logRepayment
- logKYCVerification
```

**LoanService**
```typescript
- getLoan(id)
- getCustomerLoans(customerId)
- getOrganisationLoans(orgId)
- createLoan(data)
- updateLoan(id, data)
- getLoanProduct(id)
- getOrganisationLoanProducts(orgId)
- calculateMonthlyPayment(principal, rate, months)
- calculateInterestAmount(balance, rate)
- calculatePrincipalAmount(payment, interest)
- updateLoanStatus(id, status, performedBy, staffId)
- logWorkflowChange(loanId, stage, changedBy, staffId)
- getLoanWorkflowHistory(loanId)
- recordRepayment(data)
- getLoanRepayments(loanId)
- getTotalRepaid(loanId)
- isLoanOverdue(date)
- calculateDaysOverdue(date)
```

**CustomerService**
```typescript
- getCustomer(id)
- getOrganisationCustomers(orgId)
- createCustomer(data)
- updateCustomer(id, data)
- verifyKYC(customerId, status, verifierId, notes)
- getKYCHistory(customerId)
- createCustomerAccount(data)
- getCustomerAccounts(customerId)
- isKYCVerified(customerId)
- getCustomerCreditScore(customerId)
- updateCreditScore(customerId, score)
- getCustomerByEmail(email)
- getCustomerByNationalId(nationalId)
```

**ComplianceService**
```typescript
- calculateECL(input) - IFRS 9 ECL calculation
- calculateBoZProvisioning(input) - Bank of Zambia provisioning
- calculateAndSaveLoanECL(loanId, orgId)
- calculateAndSaveBoZProvisioning(loanId, orgId)
- calculateComplianceMetricsForOrganisation(orgId)
- getLoanECL(loanId)
- getLoanBoZProvisioning(loanId)
- getOrganisationTotalECL(orgId)
- getOrganisationTotalBoZProvisioning(orgId)
```

**InitializationService**
```typescript
- initializeSystem() - Full system setup
- initializeDefaultLoanProducts()
- createSampleOrganisation()
- resetSystem() - For testing
- isSystemInitialized()
```

## 📊 Database Collections Enhanced

| Collection | New Fields | Purpose |
|---|---|---|
| customers | organisationId | Multi-tenant isolation |
| loans | organisationId | Multi-tenant isolation |
| repayments | organisationId | Multi-tenant isolation |
| loanproducts | organisationId | Multi-tenant isolation |
| loandocuments | organisationId | Multi-tenant isolation |
| loanworkflowhistory | organisationId, staffMemberId | Audit trail |
| kycverificationhistory | organisationId | Multi-tenant isolation |
| bozprovisions | organisationId | Multi-tenant isolation |
| eclresults | organisationId | Multi-tenant isolation |
| customeraccounts | (existing) | Multi-tenant ready |
| audittrail | staffMemberId | Staff tracking |
| organisations | subscriptionPlanId | Billing integration |
| staffmembers | roleId, status, lastLoginDate | RBAC & tracking |

## 🔐 Security Features

1. **Multi-Tenant Isolation**: All queries filtered by organisationId
2. **Segregation of Duties**: Conflicting permissions prevented
3. **Audit Trail**: All actions logged with staff member tracking
4. **Role-Based Access**: Granular permission control
5. **Subscription Enforcement**: Feature access based on plan
6. **Status Tracking**: Staff member status management

## 🚀 Usage Examples

### Initialize System
```typescript
import { InitializationService } from '@/services';

// Initialize with default roles, plans, and products
await InitializationService.initializeSystem();

// Create sample organisation
const orgId = await InitializationService.createSampleOrganisation();
```

### Create Staff Member with Role
```typescript
import { StaffService, RoleService } from '@/services';

// Get admin role
const adminRole = await RoleService.getRoleByName('Admin/Owner');

// Create staff member
const staff = await StaffService.createStaffMember({
  employeeId: 'EMP001',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'Admin',
  department: 'Management',
  phoneNumber: '+260123456789',
  dateHired: new Date(),
  status: 'ACTIVE',
  roleId: adminRole?._id,
});

// Assign role
await StaffService.assignRole(
  staff._id,
  adminRole?._id || '',
  organisationId,
  'SYSTEM'
);
```

### Check Authorization
```typescript
import { AuthorizationService } from '@/services';

// Check single permission
const canApprove = await AuthorizationService.hasPermission(
  staffId,
  organisationId,
  Permissions.APPROVE_LOAN
);

// Check segregation of duties
const auth = await AuthorizationService.authorizeAction(
  staffId,
  organisationId,
  Permissions.APPROVE_LOAN
);

if (auth.authorized) {
  // Proceed with approval
} else {
  console.error('Authorization failed:', auth.reason);
}
```

### Create Customer with KYC
```typescript
import { CustomerService } from '@/services';

// Create customer
const customer = await CustomerService.createCustomer({
  firstName: 'Jane',
  lastName: 'Smith',
  nationalIdNumber: 'NID123456',
  phoneNumber: '+260987654321',
  emailAddress: 'jane@example.com',
  residentialAddress: '123 Main St',
  dateOfBirth: new Date('1990-01-01'),
  organisationId,
});

// Verify KYC
await CustomerService.verifyKYC(
  customer._id,
  'APPROVED',
  staffMemberId,
  'All documents verified'
);
```

### Create and Manage Loan
```typescript
import { LoanService, ComplianceService } from '@/services';

// Create loan
const loan = await LoanService.createLoan({
  loanNumber: 'LOAN001',
  customerId,
  loanProductId,
  disbursementDate: new Date(),
  principalAmount: 50000,
  outstandingBalance: 50000,
  loanStatus: 'PENDING',
  nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  interestRate: 18.5,
  loanTermMonths: 24,
  organisationId,
});

// Calculate monthly payment
const monthlyPayment = LoanService.calculateMonthlyPayment(50000, 18.5, 24);

// Calculate compliance metrics
const ecl = await ComplianceService.calculateAndSaveLoanECL(loan._id, organisationId);
const boz = await ComplianceService.calculateAndSaveBoZProvisioning(loan._id, organisationId);
```

### Record Repayment
```typescript
import { LoanService, AuditService } from '@/services';

// Record repayment
const repayment = await LoanService.recordRepayment({
  transactionReference: 'TXN001',
  loanId,
  repaymentDate: new Date(),
  totalAmountPaid: 2500,
  principalAmount: 2000,
  interestAmount: 500,
  paymentMethod: 'BANK_TRANSFER',
  organisationId,
});

// Audit log
await AuditService.logRepayment(loanId, 2500, staffMemberId, staffMemberId);
```

## 📋 Next Steps (Phase 2)

Phase 2 will implement:
- Customer Portal (loan applications, repayment tracking)
- Admin Portal (dashboard, customer management)
- Loan Application Workflow
- Loan Approval Process
- Disbursement Management
- Repayment Processing
- Advanced Reporting

## 🔗 Integration Points

All services are designed to work together:
1. **Authentication** → Staff member lookup
2. **Authorization** → Permission checking
3. **Audit Trail** → Action logging
4. **Compliance** → ECL & BoZ calculations
5. **Subscription** → Feature access control

## 📝 Notes

- All timestamps are stored as ISO strings and converted to Date objects
- All IDs are UUIDs generated with `crypto.randomUUID()`
- Services handle errors gracefully with console logging
- Multi-tenant isolation is enforced at the service layer
- Segregation of duties is checked before critical operations
