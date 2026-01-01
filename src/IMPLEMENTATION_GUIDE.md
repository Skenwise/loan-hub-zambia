# Enterprise LMS Implementation Guide

## 🎯 Project Overview

This is a comprehensive **Enterprise Loan Management System (LMS)** built on the Wix platform with:
- ✅ Multi-tenant architecture with complete data isolation
- ✅ Role-based access control (RBAC) with 5 system roles
- ✅ Subscription billing with 3 tier plans
- ✅ IFRS 9 ECL calculations
- ✅ Bank of Zambia provisioning rules
- ✅ Comprehensive audit trail system
- ✅ Segregation of duties enforcement

## 📁 Project Structure

```
/src
├── services/                          # Core business logic
│   ├── index.ts                      # Service exports & constants
│   ├── BaseCrudService.ts            # Database operations wrapper
│   ├── OrganisationService.ts        # Multi-tenant management
│   ├── RoleService.ts                # RBAC & permissions
│   ├── StaffService.ts               # Staff & role assignments
│   ├── SubscriptionService.ts        # Billing & feature access
│   ├── AuthorizationService.ts       # Permission checking
│   ├── AuditService.ts               # Audit trail logging
│   ├── LoanService.ts                # Loan operations
│   ├── CustomerService.ts            # Customer management
│   ├── ComplianceService.ts          # IFRS 9 & BoZ calculations
│   └── InitializationService.ts      # System setup
├── components/
│   ├── pages/
│   │   ├── HomePage.tsx              # Public landing page
│   │   ├── AdminDashboardPage.tsx    # Admin dashboard (NEW)
│   │   ├── CustomersPage.tsx         # Customer management
│   │   ├── LoansPage.tsx             # Loan management
│   │   ├── LoanApplicationPage.tsx   # Loan application form
│   │   ├── LoanApprovalPage.tsx      # Loan approval workflow
│   │   ├── DisbursementPage.tsx      # Disbursement processing
│   │   ├── RepaymentsPage.tsx        # Repayment tracking
│   │   ├── ReportsPage.tsx           # Standard reports
│   │   ├── AdvancedReportsPage.tsx   # Advanced analytics
│   │   ├── IFRS9CompliancePage.tsx   # Compliance reporting
│   │   ├── OrganisationSetupPage.tsx # Setup wizard
│   │   ├── CustomerPortalPage.tsx    # Customer self-service
│   │   └── ProfilePage.tsx           # User profile
│   ├── AdminPortalLayout.tsx         # Admin portal wrapper
│   ├── Router.tsx                    # Route definitions
│   └── ui/                           # shadcn/ui components
├── entities/                         # TypeScript types
├── store/
│   └── organisationStore.ts          # Zustand state management
└── PHASE_1_FOUNDATION.md             # Phase 1 documentation
```

## 🔑 Key Services

### 1. **OrganisationService**
Manages multi-tenant organisations and subscription validation.

```typescript
import { OrganisationService } from '@/services';

// Get organisation
const org = await OrganisationService.getOrganisation(orgId);

// Check subscription
const hasSubscription = await OrganisationService.hasActiveSubscription(orgId);

// Get subscription plan
const plan = await OrganisationService.getSubscriptionPlan(orgId);
```

### 2. **RoleService**
Manages roles and permissions for RBAC.

```typescript
import { RoleService, Permissions } from '@/services';

// Get role
const role = await RoleService.getRoleByName('Credit Officer');

// Check permission
const canApprove = await RoleService.roleHasPermission(roleId, Permissions.APPROVE_LOAN);

// Initialize default roles
await RoleService.initializeDefaultRoles();
```

### 3. **StaffService**
Manages staff members and role assignments.

```typescript
import { StaffService } from '@/services';

// Create staff member
const staff = await StaffService.createStaffMember({
  employeeId: 'EMP001',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'Credit Officer',
  department: 'Lending',
  phoneNumber: '+260123456789',
  dateHired: new Date(),
  status: 'ACTIVE',
});

// Assign role
await StaffService.assignRole(staffId, roleId, organisationId, 'SYSTEM');

// Get staff role
const assignment = await StaffService.getStaffRole(staffId, organisationId);
```

### 4. **AuthorizationService**
Checks permissions and enforces segregation of duties.

```typescript
import { AuthorizationService, Permissions } from '@/services';

// Check single permission
const canApprove = await AuthorizationService.hasPermission(
  staffId,
  organisationId,
  Permissions.APPROVE_LOAN
);

// Authorize action with full checks
const auth = await AuthorizationService.authorizeAction(
  staffId,
  organisationId,
  Permissions.APPROVE_LOAN
);

if (auth.authorized) {
  // Proceed with action
} else {
  console.error('Authorization failed:', auth.reason);
}
```

### 5. **LoanService**
Handles loan operations and calculations.

```typescript
import { LoanService } from '@/services';

// Create loan
const loan = await LoanService.createLoan({
  loanNumber: 'LOAN001',
  customerId,
  loanProductId,
  disbursementDate: new Date(),
  principalAmount: 50000,
  outstandingBalance: 50000,
  loanStatus: 'PENDING',
  nextPaymentDate: new Date(),
  interestRate: 18.5,
  loanTermMonths: 24,
  organisationId,
});

// Calculate monthly payment
const monthlyPayment = LoanService.calculateMonthlyPayment(50000, 18.5, 24);

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
```

### 6. **CustomerService**
Manages customers and KYC verification.

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
  customerId,
  'APPROVED',
  staffMemberId,
  'All documents verified'
);

// Check KYC status
const isVerified = await CustomerService.isKYCVerified(customerId);
```

### 7. **ComplianceService**
Calculates IFRS 9 ECL and BoZ provisioning.

```typescript
import { ComplianceService } from '@/services';

// Calculate ECL for a loan
const ecl = await ComplianceService.calculateAndSaveLoanECL(loanId, organisationId);

// Calculate BoZ provisioning
const boz = await ComplianceService.calculateAndSaveBoZProvisioning(loanId, organisationId);

// Get total ECL for organisation
const totalECL = await ComplianceService.getOrganisationTotalECL(organisationId);

// Get total BoZ provisioning
const totalBoz = await ComplianceService.getOrganisationTotalBoZProvisioning(organisationId);
```

### 8. **AuditService**
Logs all system actions for compliance.

```typescript
import { AuditService } from '@/services';

// Log custom action
await AuditService.logAction({
  actionType: 'CREATE',
  actionDetails: 'Customer created',
  resourceAffected: 'CUSTOMER',
  resourceId: customerId,
  performedBy: staffMemberId,
  staffMemberId,
});

// Get audit trail for resource
const trail = await AuditService.getResourceAuditTrail(resourceId);

// Get audit trail by date range
const dateTrail = await AuditService.getAuditTrailByDateRange(startDate, endDate);
```

## 🔐 System Roles & Permissions

### Admin/Owner
- Full system access
- Manage organisation settings
- Manage staff and roles
- View all reports and audit trails

### Credit Officer
- Create and manage customers
- Verify KYC documents
- Submit loan applications
- View loan applications

### Credit Manager
- View customer profiles
- Review loan applications
- Approve/reject loans
- View approval history

### Finance Officer
- Process loan disbursements
- Record repayments
- Manage penalties
- View repayment history

### Compliance Officer
- View compliance reports
- Calculate ECL (IFRS 9)
- Calculate BoZ provisioning
- View audit trails

## 📊 Database Collections

All collections have been enhanced with multi-tenant support:

| Collection | Key Fields | Purpose |
|---|---|---|
| organisations | subscriptionPlanId | Multi-tenant root |
| customers | organisationId | Customer isolation |
| loans | organisationId | Loan isolation |
| repayments | organisationId | Repayment isolation |
| loanproducts | organisationId | Product isolation |
| staffmembers | roleId, status, lastLoginDate | Staff management |
| staffroleassignments | staffMemberId, roleId, organizationId | Role mapping |
| roles | permissions, hierarchyLevel | RBAC definition |
| subscriptionplans | features, usageLimits | Billing tiers |
| audittrail | staffMemberId, timestamp | Action logging |
| kycverificationhistory | organisationId | KYC tracking |
| loanworkflowhistory | organisationId, staffMemberId | Workflow audit |
| bozprovisions | organisationId | BoZ compliance |
| eclresults | organisationId | IFRS 9 compliance |

## 🚀 Getting Started

### 1. Initialize System
```typescript
import { InitializationService } from '@/services';

// Initialize with default roles, plans, and products
await InitializationService.initializeSystem();
```

### 2. Create Organisation
```typescript
import { OrganisationService } from '@/services';

const org = await OrganisationService.createOrganisation({
  organizationName: 'My Lending Institution',
  subscriptionPlanType: 'Professional',
  organizationStatus: 'ACTIVE',
  creationDate: new Date(),
  contactEmail: 'admin@example.com',
  websiteUrl: 'https://example.com',
  lastActivityDate: new Date(),
});
```

### 3. Create Staff Member
```typescript
import { StaffService, RoleService } from '@/services';

const creditOfficerRole = await RoleService.getRoleByName('Credit Officer');

const staff = await StaffService.createStaffMember({
  employeeId: 'EMP001',
  fullName: 'John Doe',
  email: 'john@example.com',
  role: 'Credit Officer',
  department: 'Lending',
  phoneNumber: '+260123456789',
  dateHired: new Date(),
  status: 'ACTIVE',
  roleId: creditOfficerRole?._id,
});

await StaffService.assignRole(
  staff._id,
  creditOfficerRole?._id || '',
  org._id,
  'SYSTEM'
);
```

### 4. Create Customer
```typescript
import { CustomerService } from '@/services';

const customer = await CustomerService.createCustomer({
  firstName: 'Jane',
  lastName: 'Smith',
  nationalIdNumber: 'NID123456',
  phoneNumber: '+260987654321',
  emailAddress: 'jane@example.com',
  residentialAddress: '123 Main St',
  dateOfBirth: new Date('1990-01-01'),
  organisationId: org._id,
});
```

### 5. Create Loan
```typescript
import { LoanService } from '@/services';

const loan = await LoanService.createLoan({
  loanNumber: 'LOAN001',
  customerId: customer._id,
  loanProductId: productId,
  disbursementDate: new Date(),
  principalAmount: 50000,
  outstandingBalance: 50000,
  loanStatus: 'PENDING',
  nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  interestRate: 18.5,
  loanTermMonths: 24,
  organisationId: org._id,
});
```

## 🔄 Workflow Examples

### Loan Application Workflow
1. Credit Officer creates customer and verifies KYC
2. Credit Officer submits loan application
3. Credit Manager reviews and approves/rejects
4. Finance Officer disburses approved loan
5. Customer makes repayments
6. Compliance Officer monitors IFRS 9 & BoZ compliance

### Authorization Flow
```typescript
// 1. Check permission
const hasPermission = await AuthorizationService.hasPermission(
  staffId,
  organisationId,
  Permissions.APPROVE_LOAN
);

// 2. Check segregation of duties
const passedSOD = await AuthorizationService.checkSegregationOfDuties(
  staffId,
  organisationId,
  Permissions.APPROVE_LOAN
);

// 3. Full authorization check
const auth = await AuthorizationService.authorizeAction(
  staffId,
  organisationId,
  Permissions.APPROVE_LOAN
);

if (auth.authorized) {
  // Proceed with approval
  await LoanService.updateLoanStatus(loanId, 'APPROVED', staffId, staffId);
}
```

## 📈 Compliance Calculations

### IFRS 9 ECL Calculation
```typescript
const ecl = ComplianceService.calculateECL({
  loanId,
  outstandingBalance: 50000,
  daysOverdue: 45,
  probabilityOfDefault: 0.05,
  lossGivenDefault: 0.45,
  exposureAtDefault: 50000,
});

// Returns:
// {
//   eclValue: 1012.50,
//   stage: 'STAGE_2',
//   pd: 0.075,
//   lgd: 0.45,
//   ead: 50000
// }
```

### BoZ Provisioning Calculation
```typescript
const boz = ComplianceService.calculateBoZProvisioning({
  loanId,
  outstandingBalance: 50000,
  daysOverdue: 45,
  classification: '',
});

// Returns:
// {
//   provisionAmount: 2500,
//   provisionPercentage: 0.05,
//   classification: 'WATCH'
// }
```

## 🛠️ Development Tips

### 1. Always Check Subscription
```typescript
const hasAccess = await SubscriptionService.hasFeatureAccess(
  organisationId,
  'advanced_reporting'
);
```

### 2. Always Log Actions
```typescript
await AuditService.logAction({
  actionType: 'APPROVE',
  actionDetails: 'Loan approved',
  resourceAffected: 'LOAN',
  resourceId: loanId,
  performedBy: staffMemberId,
  staffMemberId,
});
```

### 3. Always Check Authorization
```typescript
const auth = await AuthorizationService.authorizeAction(
  staffId,
  organisationId,
  action
);

if (!auth.authorized) {
  throw new Error(`Unauthorized: ${auth.reason}`);
}
```

### 4. Always Filter by Organisation
```typescript
// ✅ CORRECT
const loans = await LoanService.getOrganisationLoans(organisationId);

// ❌ WRONG - Gets all loans
const allLoans = await BaseCrudService.getAll('loans');
```

## 📚 Next Phases

### Phase 2: Core Modules
- Customer Portal (loan applications, tracking)
- Admin Portal (dashboards, management)
- Loan Application Workflow
- Loan Approval Process
- Disbursement Management
- Repayment Processing

### Phase 3: Advanced Features
- Interest & Repayment Engine
- Advanced Analytics & Dashboards
- Write-offs Management
- Penalty Management
- Loan Restructuring

### Phase 4: Integration
- API Access
- Custom Integrations
- Third-party Services
- Mobile App Support

## 🐛 Troubleshooting

### Issue: "Unauthorized" error
**Solution**: Check that staff member has the required permission and passes segregation of duties checks.

### Issue: Data not filtering by organisation
**Solution**: Ensure you're using organisation-specific service methods (e.g., `getOrganisationLoans` instead of `getAll`).

### Issue: Subscription features not accessible
**Solution**: Check that organisation has active subscription and plan includes the feature.

### Issue: Audit trail not logging
**Solution**: Ensure `AuditService.logAction` is called after each action.

## 📞 Support

For issues or questions:
1. Check the service documentation in `/src/services/`
2. Review the PHASE_1_FOUNDATION.md guide
3. Check the entity types in `/src/entities/`
4. Review error messages in console logs

## ✅ Checklist for New Features

- [ ] Check organisation subscription
- [ ] Verify staff authorization
- [ ] Check segregation of duties
- [ ] Log action to audit trail
- [ ] Filter data by organisation
- [ ] Handle errors gracefully
- [ ] Update compliance metrics if needed
- [ ] Test with multiple organisations
