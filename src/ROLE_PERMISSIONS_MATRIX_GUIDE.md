# Role-System Permissions Matrix & Governance Implementation Guide

## Overview
This comprehensive guide documents the complete implementation of role-based access control, approval limits, credit committee workflows, role-specific dashboards, IFRS 9 governance, and subscription enforcement.

---

## 1. ROLE → SYSTEM PERMISSIONS MATRIX

### Service: RolePermissionsService.ts
**Location**: `/src/services/RolePermissionsService.ts`

### Role Definitions

#### 1.1 Loan Officer
**Approval Limit**: ZMW 0 (No approval authority)
**Branch Scoped**: Yes
**Can Approve Own Review**: No

**Permissions**:
```
✓ Create customers
✓ View customers
✓ Upload KYC documents
✓ Create loan applications
✓ View loan applications
✓ Edit loan applications
✓ Generate reports (own portfolio)

✗ Approve loans
✗ Disburse funds
✗ Verify KYC
✗ Edit loan products
✗ Configure system settings
```

**System Controls**:
- Maker only (cannot approve)
- Limited to assigned branch
- Cannot view other branches' data
- Cannot modify customer information
- Cannot create loan products

**Dashboard Access**: My Loan Portfolio
- My customers
- Loans in progress
- Repayment reminders
- Arrears follow-ups

---

#### 1.2 Branch Manager
**Approval Limit**: ZMW 50,000
**Branch Scoped**: Yes
**Can Approve Own Review**: No

**Permissions**:
```
✓ Create customers
✓ View customers
✓ Update customers
✓ Upload KYC documents
✓ Create loan applications
✓ View loan applications
✓ Edit loan applications
✓ Approve loans (up to ZMW 50,000)
✓ Reject loans
✓ Reassign loan officers
✓ View branch reports
✓ Generate reports

✗ Disburse loans
✗ Change interest rates
✗ Configure products
✗ Approve loans above limit
```

**System Controls**:
- Approval cap enforced at ZMW 50,000
- Branch-scoped visibility
- Cannot approve own-reviewed loans
- Cannot modify loan products
- Cannot access other branches

**Dashboard Access**: Branch Loan Book
- Branch loan book overview
- PAR (Portfolio at Risk) by bucket
- Staff performance metrics
- Branch disbursements
- Branch reports

---

#### 1.3 Credit / Risk Officer
**Approval Limit**: ZMW 0 (No approval authority)
**Branch Scoped**: No
**Can Approve Own Review**: No

**Permissions**:
```
✓ Review applications
✓ Perform credit analysis
✓ Assign risk grade
✓ Assign IFRS 9 stage
✓ Recommend approve/reject
✓ View loan applications
✓ View customers
✓ Generate reports

✗ Disburse loans
✗ Create customers
✗ Approve loans
✗ Create loan applications
```

**System Controls**:
- Cannot approve own-reviewed loan
- Overrides require justification
- Full organization visibility
- Cannot modify customer data
- Cannot disburse funds

**Dashboard Access**: Credit Analysis Dashboard
- Pending applications for review
- Risk distribution analysis
- ECL summary
- Exceptions report

---

#### 1.4 Compliance / KYC Officer
**Approval Limit**: ZMW 0 (No approval authority)
**Branch Scoped**: No
**Can Approve Own Review**: No

**Permissions**:
```
✓ Verify KYC documents
✓ Approve KYC
✓ Reject KYC
✓ Flag high-risk customers
✓ Lock customer accounts
✓ View customers
✓ View loan applications
✓ Generate reports

✗ Create loans
✗ Approve loans
✗ Disburse funds
✗ Create customers
```

**System Controls**:
- KYC must be approved before loan approval
- Cannot create customer records
- Cannot approve loans
- Full organization visibility
- Cannot modify loan terms

**Dashboard Access**: KYC Compliance Dashboard
- Pending KYC verifications
- High-risk customer flags
- Verification status by bucket
- Compliance reports

---

#### 1.5 Finance / Disbursement Officer
**Approval Limit**: ZMW 0 (No approval authority)
**Branch Scoped**: No
**Can Approve Own Review**: No

**Permissions**:
```
✓ Disburse approved loans
✓ Post repayments
✓ Reverse disbursements (with approval)
✓ Generate finance reports
✓ View loan applications
✓ View customers
✓ View repayments

✗ Approve loans
✗ Modify KYC
✗ Create customers
✗ Create loan applications
```

**System Controls**:
- Disbursement only after full approval
- Cannot approve loans
- Cannot modify KYC status
- Cannot reverse without credit manager approval
- Full organization visibility

**Dashboard Access**: Finance Dashboard
- Daily collections
- Disbursements
- Interest income
- Reconciliations
- Finance reports

---

#### 1.6 Credit Manager / Head of Credit
**Approval Limit**: ZMW 250,000
**Branch Scoped**: No
**Can Approve Own Review**: No

**Permissions**:
```
✓ Approve high-value loans (up to ZMW 250,000)
✓ Approve overrides
✓ Approve restructures
✓ Approve write-offs
✓ Chair credit committee
✓ Vote in credit committee
✓ Perform credit analysis
✓ Assign risk grade
✓ Assign IFRS 9 stage
✓ View all data
✓ Generate reports
✓ Export data
✓ View audit logs

✗ Disburse loans
✗ Create customers
✗ Modify KYC
```

**System Controls**:
- Approval cap enforced at ZMW 250,000
- Cannot approve own-reviewed loans
- Overrides require justification
- Full organization visibility
- Cannot disburse funds

**Dashboard Access**: Credit Manager Dashboard
- Approval queue
- Risk distribution
- ECL summary
- Exceptions report
- Audit logs

---

#### 1.7 CEO / Managing Director
**Approval Limit**: Unlimited
**Branch Scoped**: No
**Can Approve Own Review**: No

**Permissions**:
```
✓ Approve very large exposures (unlimited)
✓ Approve overrides
✓ Approve restructures
✓ Approve write-offs
✓ Chair credit committee
✓ Vote in credit committee
✓ View all data (read-only)
✓ View executive dashboards
✓ View audit logs
✓ Generate reports
✓ Export data

✗ Disburse loans
✗ Create customers
✗ Modify KYC
✗ Create loan applications
```

**System Controls**:
- Unlimited approval authority
- Mostly read-only access
- Full organization visibility
- Cannot disburse funds
- Cannot create operational records

**Dashboard Access**: Executive Dashboard
- Total loan book
- NPL ratio
- Profitability metrics
- Growth trends
- Risk summary

---

#### 1.8 Internal Auditor
**Approval Limit**: ZMW 0 (No approval authority)
**Branch Scoped**: No
**Can Approve Own Review**: No

**Permissions**:
```
✓ View all data (read-only)
✓ Access audit logs
✓ Export reports
✓ Generate reports
✓ View customers
✓ View loans
✓ View repayments

✗ Create any records
✗ Approve loans
✗ Disburse funds
✗ Modify any data
```

**System Controls**:
- Read-only access to all data
- Full audit trail access
- Cannot modify any records
- Full organization visibility
- Cannot approve or disburse

**Dashboard Access**: Audit Dashboard
- Complete audit logs
- System activity tracking
- Data export capabilities
- Compliance reports

---

## 2. APPROVAL LIMIT MATRIX

### Service: ApprovalLimitsService.ts
**Location**: `/src/services/ApprovalLimitsService.ts`

### Default Approval Limits

```typescript
{
  'loan-officer': 0,
  'branch-manager': 50,000,
  'credit-officer': 0,
  'kyc-officer': 0,
  'finance-officer': 0,
  'credit-manager': 250,000,
  'ceo': Unlimited,
  'internal-auditor': 0,
}
```

### Escalation Rules

```typescript
{
  singleApproverLimit: 250,000,
  requiresCommitteeAbove: 500,000,
  requiresCEOAbove: 1,000,000,
  decisionRule: 'majority' | 'unanimous'
}
```

### Approval Escalation Logic

**Amount ≤ ZMW 50,000**:
- Branch Manager can approve
- No escalation needed

**Amount ZMW 50,001 - ZMW 250,000**:
- Requires Credit Manager approval
- Branch Manager cannot approve

**Amount ZMW 250,001 - ZMW 500,000**:
- Requires Credit Manager approval
- May require committee if high-risk

**Amount ZMW 500,001 - ZMW 1,000,000**:
- Requires Credit Committee approval
- CEO votes as member

**Amount > ZMW 1,000,000**:
- Requires CEO approval
- Requires Credit Committee approval
- Unanimous decision required

### Configurable Limits

Each organization can customize:
- Role approval limits
- Escalation thresholds
- Decision rules (majority vs unanimous)
- Committee composition

**API Methods**:
```typescript
// Get approval limit for role
await ApprovalLimitsService.getApprovalLimitForRole(orgId, roleId);

// Check if amount requires escalation
await ApprovalLimitsService.determineApprovalEscalation(
  loanAmount,
  approverRoleId,
  orgId,
  isHighRisk,
  isPolicyException
);

// Update approval limit
await ApprovalLimitsService.updateApprovalLimit(orgId, roleId, newLimit);

// Get approval hierarchy
await ApprovalLimitsService.getApprovalHierarchy(orgId);
```

---

## 3. CREDIT COMMITTEE WORKFLOW

### Service: CreditCommitteeService.ts
**Location**: `/src/services/CreditCommitteeService.ts`

### When Committee is Triggered

1. **Loan Amount Exceeds Limit**
   - Amount > ZMW 500,000
   - Single approver cannot approve

2. **High-Risk Grade**
   - Risk grade: High
   - Automatic escalation to committee

3. **Policy Exception**
   - Loan violates standard policy
   - Requires committee override

### Committee Composition

**Default Members**:
- CEO (Chairperson)
- Credit Manager
- CFO (if available)
- Risk Manager (if available)

**Minimum Members**: 3
**Maximum Members**: 7

### Committee Workflow

#### Step 1: Session Creation
```
Loan flagged for committee
↓
Committee session created
↓
Members notified (email + SMS)
↓
Session status: PENDING
```

#### Step 2: Member Review
```
Each member reviews independently
↓
Member performs credit analysis
↓
Member votes: Approve / Reject / Defer
↓
Optional comments recorded
```

#### Step 3: Voting
```
All members vote
↓
Votes recorded with timestamp
↓
Cannot vote twice
↓
Audit trail maintained
```

#### Step 4: Decision
```
Majority rule (default):
- Approve: > 50% votes
- Reject: > 50% votes
- Defer: Any member can defer

Unanimous rule (high-risk):
- Approve: 100% votes
- Reject: 100% votes
- Defer: Any member can defer
```

#### Step 5: Minutes Generation
```
Auto-generated meeting minutes
↓
Includes all votes and comments
↓
Stored in audit trail
↓
Sent to all members
```

### Committee Session Data

```typescript
interface CreditCommitteeSession {
  _id: string;
  organisationId: string;
  loanId: string;
  loanNumber: string;
  customerId: string;
  customerName: string;
  loanAmount: number;
  riskGrade: string;
  
  // Committee
  chairperson: CommitteeMember;
  members: CommitteeMember[];
  
  // Voting
  votes: {
    approve: number;
    reject: number;
    defer: number;
  };
  decision?: 'approved' | 'rejected' | 'deferred';
  
  // Metadata
  escalationReason: string;
  isHighRisk: boolean;
  isPolicyException: boolean;
  requiresUnanimous: boolean;
  
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
}
```

### API Methods

```typescript
// Create committee session
await CreditCommitteeService.createCommitteeSession(
  loanId, loanNumber, customerId, customerName,
  loanAmount, riskGrade, orgId, createdBy,
  escalationReason, isHighRisk, isPolicyException
);

// Record vote
await CreditCommitteeService.recordVote(
  sessionId, staffMemberId, vote, comments
);

// Finalize decision
await CreditCommitteeService.finalizeDecision(
  sessionId, decision, decisionReason, finalizedBy
);

// Generate minutes
await CreditCommitteeService.generateMinutes(sessionId, session);

// Check if decision is final
CreditCommitteeService.isDecisionFinal(session);

// Get committee decision
CreditCommitteeService.getCommitteeDecision(session);
```

---

## 4. ROLE-SPECIFIC DASHBOARDS

### Dashboard Implementations

#### 4.1 Loan Officer Dashboard
**File**: `/src/components/pages/LoanOfficerDashboardPage.tsx`

**Content**:
- My customers (count)
- Total loans (count)
- Loans in progress (count)
- In arrears (count)
- Portfolio value (ZMW)

**Sections**:
1. **Loans in Progress**
   - Pending and approved loans
   - Awaiting next action
   - Quick action buttons

2. **Repayment Reminders**
   - Loans with payments due in 7 days
   - Payment amount
   - Due date
   - Customer name

3. **Arrears Follow-up**
   - Overdue loans
   - Days overdue
   - Follow-up action button
   - Customer contact info

**Access Control**:
- Loan Officer role
- Own branch only
- Own customers only

---

#### 4.2 Branch Manager Dashboard
**Content**:
- Branch loan book overview
- PAR (Portfolio at Risk) by bucket
- Staff performance metrics
- Branch disbursements
- Branch reports

**Sections**:
1. **Branch Loan Book**
   - Total loans
   - Total amount
   - Active loans
   - Closed loans

2. **PAR Analysis**
   - Current (0-30 days)
   - 31-60 days
   - 61-90 days
   - 90+ days

3. **Staff Performance**
   - Loan officers
   - Loans created
   - Approval rate
   - Portfolio quality

4. **Disbursements**
   - Daily disbursements
   - Weekly trend
   - Method breakdown

---

#### 4.3 Credit Manager Dashboard
**Content**:
- Approval queue
- Risk distribution
- ECL summary
- Exceptions report
- Audit logs

**Sections**:
1. **Approval Queue**
   - Pending approvals
   - Amount
   - Risk grade
   - Days pending

2. **Risk Distribution**
   - Low risk
   - Medium risk
   - High risk
   - Pie chart

3. **ECL Summary**
   - Stage 1 (Low risk)
   - Stage 2 (Medium risk)
   - Stage 3 (High risk)
   - Total provision

4. **Exceptions**
   - Policy exceptions
   - Override requests
   - Restructures
   - Write-offs

---

#### 4.4 Finance Dashboard
**Content**:
- Daily collections
- Disbursements
- Interest income
- Reconciliations
- Finance reports

**Sections**:
1. **Daily Collections**
   - Collections today
   - Collections this month
   - Collections trend

2. **Disbursements**
   - Disbursed today
   - Disbursed this month
   - Pending disbursements

3. **Interest Income**
   - Interest accrued
   - Interest collected
   - Interest receivable

4. **Reconciliations**
   - Bank reconciliation
   - GL reconciliation
   - Variance analysis

---

#### 4.5 CEO / Executive Dashboard
**Content**:
- Total loan book
- NPL ratio
- Profitability
- Growth trends
- Risk summary

**Sections**:
1. **Loan Book**
   - Total loans
   - Total amount
   - Active loans
   - Closed loans

2. **NPL Ratio**
   - Current NPL %
   - Trend
   - By branch
   - By product

3. **Profitability**
   - Interest income
   - Fee income
   - Operating expenses
   - Net profit

4. **Growth Trends**
   - Monthly growth
   - Quarterly growth
   - YoY growth
   - Forecast

---

## 5. IFRS 9 & RISK GOVERNANCE

### Automatic ECL Staging

**Stage 1**: Low Risk
- No payment default
- Low credit risk
- ECL: 12-month expected loss

**Stage 2**: Medium Risk
- Payment default 30-90 days
- Significant increase in credit risk
- ECL: Lifetime expected loss

**Stage 3**: High Risk
- Payment default 90+ days
- Credit-impaired
- ECL: Lifetime expected loss (with recovery)

### Override Approvals

**When Override Required**:
- Loan exceeds risk parameters
- Loan exceeds approval limit
- Policy exception
- Restructure request

**Override Process**:
1. Loan flagged for override
2. Credit Manager reviews
3. Justification required
4. Approval/rejection
5. Audit trail recorded

### Provision Movement Reports

**Reports Include**:
- Opening balance by stage
- Movements between stages
- New loans added
- Loans closed
- Closing balance by stage
- Provision expense

### Audit Trail for Model Changes

**Tracked Changes**:
- ECL model updates
- Parameter changes
- Staging changes
- Override approvals
- Provision adjustments

**Audit Information**:
- Who made change
- When change made
- What changed
- Why (justification)
- Before/after values

---

## 6. SUBSCRIPTION ENFORCEMENT

### Service: SubscriptionEnforcementService.ts
**Location**: `/src/services/SubscriptionEnforcementService.ts`

### Subscription Plans

#### Starter Plan
- **Max Users**: 5
- **Max Branches**: 1
- **Enabled Roles**: Loan Officer, Branch Manager
- **Features**:
  - ✗ Credit Committee
  - ✗ IFRS 9 Module
  - ✗ Bulk Disbursement
  - ✗ Advanced Reporting
  - ✗ API Access
  - ✗ Custom Branding
  - ✗ Dedicated Support

#### Professional Plan
- **Max Users**: 25
- **Max Branches**: 3
- **Enabled Roles**: Loan Officer, Branch Manager, Credit Officer, KYC Officer, Finance Officer
- **Features**:
  - ✗ Credit Committee
  - ✗ IFRS 9 Module
  - ✓ Bulk Disbursement
  - ✓ Advanced Reporting
  - ✗ API Access
  - ✗ Custom Branding
  - ✗ Dedicated Support

#### Enterprise Plan
- **Max Users**: 100
- **Max Branches**: 10
- **Enabled Roles**: All roles
- **Features**:
  - ✓ Credit Committee
  - ✓ IFRS 9 Module
  - ✓ Bulk Disbursement
  - ✓ Advanced Reporting
  - ✓ API Access
  - ✓ Custom Branding
  - ✓ Dedicated Support

#### Custom Plan
- **Max Users**: Unlimited
- **Max Branches**: Unlimited
- **Enabled Roles**: All roles
- **Features**: All features enabled

### Enforcement Rules

**User Limit Enforcement**:
```
If activeUsers >= maxUsers:
  → Block new user creation
  → Show upgrade prompt
  → Suggest Enterprise plan
```

**Feature Enforcement**:
```
If feature not enabled:
  → Hide feature UI
  → Block API access
  → Show upgrade prompt
```

**Role Enforcement**:
```
If role not enabled:
  → Cannot assign role
  → Cannot access role features
  → Show upgrade prompt
```

### API Methods

```typescript
// Check subscription compliance
await SubscriptionEnforcementService.checkSubscriptionCompliance(orgId);

// Check if feature enabled
await SubscriptionEnforcementService.isFeatureEnabled(orgId, 'creditCommitteeFeature');

// Check if role enabled
await SubscriptionEnforcementService.isRoleEnabled(orgId, 'credit-manager');

// Check if user can be added
await SubscriptionEnforcementService.canAddUser(orgId);

// Get subscription usage
await SubscriptionEnforcementService.getSubscriptionUsageSummary(orgId);

// Upgrade plan
await SubscriptionEnforcementService.upgradeSubscriptionPlan(orgId, 'enterprise');

// Get upgrade recommendations
await SubscriptionEnforcementService.getUpgradeRecommendations(orgId);
```

### Enforcement Points

**User Creation**:
- Check user limit before creating
- Block if limit exceeded
- Show upgrade prompt

**Feature Access**:
- Check feature enabled before showing
- Block API calls if not enabled
- Show upgrade prompt

**Role Assignment**:
- Check role enabled before assigning
- Block if not enabled
- Show upgrade prompt

**Committee Feature**:
- Check if enabled before creating session
- Block if not enabled
- Show upgrade prompt

**IFRS 9 Module**:
- Check if enabled before showing
- Block if not enabled
- Show upgrade prompt

---

## 7. IMPLEMENTATION CHECKLIST

### Services
- [ ] RolePermissionsService.ts created
- [ ] ApprovalLimitsService.ts created
- [ ] CreditCommitteeService.ts created
- [ ] SubscriptionEnforcementService.ts updated
- [ ] Services exported in index.ts

### Dashboards
- [ ] LoanOfficerDashboardPage.tsx created
- [ ] BranchManagerDashboardPage.tsx created
- [ ] CreditManagerDashboardPage.tsx created
- [ ] FinanceDashboardPage.tsx created
- [ ] ExecutiveDashboardPage.tsx created
- [ ] Routes added to Router.tsx

### Database
- [ ] Committee sessions collection created
- [ ] Committee votes collection created
- [ ] Approval limits configuration stored
- [ ] Role permissions configured

### Integration
- [ ] Loan approval flow updated
- [ ] Committee workflow integrated
- [ ] Subscription checks added
- [ ] Audit trail updated

### Testing
- [ ] Role permissions tested
- [ ] Approval limits tested
- [ ] Committee workflow tested
- [ ] Subscription enforcement tested
- [ ] Dashboard access control tested

### Documentation
- [ ] Role matrix documented
- [ ] Approval limits documented
- [ ] Committee workflow documented
- [ ] Dashboard guide documented
- [ ] Subscription guide documented

---

## 8. USAGE EXAMPLES

### Check User Permissions

```typescript
import { RolePermissionsService } from '@/services';

// Get role permissions
const roleConfig = RolePermissionsService.getRolePermissions('credit-manager');

// Check specific permission
const canApprove = RolePermissionsService.hasPermission('credit-manager', 'approveLoan');

// Get approval limit
const limit = RolePermissionsService.getApprovalLimit('branch-manager');
```

### Determine Approval Escalation

```typescript
import { ApprovalLimitsService } from '@/services';

// Check if escalation needed
const escalation = await ApprovalLimitsService.determineApprovalEscalation(
  loanAmount: 300000,
  approverRoleId: 'branch-manager',
  organisationId: 'org-123',
  isHighRisk: false,
  isPolicyException: false
);

if (escalation.requiresApproval) {
  // Escalate to next approver
  console.log(`Escalate to: ${escalation.approverRoleId}`);
}

if (escalation.requiresCommittee) {
  // Create committee session
}
```

### Create Committee Session

```typescript
import { CreditCommitteeService } from '@/services';

// Create session
const session = await CreditCommitteeService.createCommitteeSession(
  loanId: 'loan-123',
  loanNumber: 'LN-2024-001',
  customerId: 'cust-123',
  customerName: 'John Doe',
  loanAmount: 750000,
  riskGrade: 'High',
  organisationId: 'org-123',
  createdBy: 'staff-123',
  escalationReason: 'Amount exceeds single approver limit',
  isHighRisk: true,
  isPolicyException: false
);

// Record votes
await CreditCommitteeService.recordVote(
  sessionId: session._id,
  staffMemberId: 'staff-456',
  vote: 'approve',
  comments: 'Customer has strong repayment history'
);

// Check if decision final
if (CreditCommitteeService.isDecisionFinal(session)) {
  const decision = CreditCommitteeService.getCommitteeDecision(session);
  // Process decision
}
```

### Check Subscription Compliance

```typescript
import { SubscriptionEnforcementService } from '@/services';

// Check overall compliance
const compliance = await SubscriptionEnforcementService.checkSubscriptionCompliance('org-123');

if (!compliance.isCompliant) {
  // Show violations
  compliance.violations.forEach(v => {
    console.log(`${v.message} (${v.current}/${v.limit})`);
  });
}

// Check specific feature
const hasCommittee = await SubscriptionEnforcementService.isFeatureEnabled(
  'org-123',
  'creditCommitteeFeature'
);

if (!hasCommittee) {
  // Show upgrade prompt
}

// Check if can add user
const canAdd = await SubscriptionEnforcementService.canAddUser('org-123');

if (!canAdd.canAdd) {
  // Show upgrade prompt
  console.log(canAdd.reason);
}
```

---

## 9. SECURITY & COMPLIANCE

### Segregation of Duties
- Approver cannot disburse
- Loan officer cannot approve
- KYC officer cannot approve loans
- Finance officer cannot approve

### Audit Trail
- All approvals logged
- All votes recorded
- All overrides justified
- All changes tracked

### Access Control
- Role-based permissions
- Branch-scoped visibility
- Organization-scoped data
- Read-only audit access

### Compliance
- IFRS 9 staging automatic
- ECL calculation automatic
- Provision tracking automatic
- Regulatory reporting ready

---

## 10. FUTURE ENHANCEMENTS

1. **Delegation of Authority**
   - Temporary role delegation
   - Approval delegation
   - Audit trail of delegations

2. **Advanced Committee Features**
   - Video conferencing integration
   - Digital signatures
   - Scheduled meetings
   - Recurring committees

3. **Predictive Analytics**
   - Risk scoring
   - Default prediction
   - Approval recommendations
   - Limit optimization

4. **Integration**
   - External rating agencies
   - Credit bureau integration
   - Accounting system integration
   - Reporting system integration

---

## Support & Contact

For questions or issues, refer to the main system documentation or contact the development team.
