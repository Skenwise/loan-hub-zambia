# LoanDisk - Loan Management Modules Guide

## Overview
This document outlines the complete loan lifecycle modules, IFRS 9 compliance system, and advanced reporting capabilities implemented in LoanDisk.

---

## Module 1: Loan Lifecycle Management

### 1.1 Loan Application (`/admin/loans/apply`)

**Purpose:** Create new loan applications from customer requests.

**Features:**
- **Step 1: Customer Selection**
  - Browse and select existing customers
  - View customer KYC status and credit score
  - Validate customer eligibility

- **Step 2: Loan Details**
  - Select loan product
  - Enter principal amount (validated against product limits)
  - Specify loan term in months
  - Add loan purpose

- **Step 3: Review**
  - Review all application details
  - Calculate monthly payment
  - Confirm before submission

- **Step 4: Confirmation**
  - Application successfully created
  - Loan status: `pending-approval`
  - Redirect to loans list

**Data Flow:**
```
Customer Selection → Loan Details → Review → Create Loan Record
                                              ↓
                                    Status: pending-approval
```

**Key Fields:**
- `loanNumber`: Auto-generated (LN-{timestamp})
- `customerId`: Reference to customer
- `loanProductId`: Reference to loan product
- `principalAmount`: Loan amount
- `loanStatus`: pending-approval
- `interestRate`: From product
- `loanTermMonths`: Repayment period

---

### 1.2 Loan Approval (`/admin/loans/approve`)

**Purpose:** Review and approve/reject pending loan applications.

**Features:**
- **Pending Applications List**
  - View all loans with `pending-approval` status
  - Quick selection interface
  - Shows loan number and amount

- **Application Review**
  - Customer information (name, ID, email, credit score)
  - Loan details (product, amount, interest rate, term)
  - Approval notes field

- **Approval Actions**
  - **Approve**: Changes status to `approved`
  - **Reject**: Changes status to `rejected` (requires notes)

**Workflow:**
```
Pending Loan → Review Details → Approve/Reject → Update Status
                                                    ↓
                                    approved OR rejected
```

**Status Transitions:**
- `pending-approval` → `approved` (ready for disbursement)
- `pending-approval` → `rejected` (application denied)

---

### 1.3 Loan Disbursement (`/admin/loans/disburse`)

**Purpose:** Process approved loans for disbursement to customers.

**Features:**
- **Ready for Disbursement List**
  - Shows all loans with `approved` status
  - Displays customer name and loan amount
  - Quick selection interface

- **Disbursement Form**
  - Set disbursement date
  - View customer and loan details
  - Calculate net disbursement (principal - processing fee)
  - Show first payment due date

- **Disbursement Summary**
  - Principal amount
  - Processing fee (from product)
  - Net disbursement amount
  - First payment date calculation

**Workflow:**
```
Approved Loan → Set Disbursement Date → Process → Update Status
                                                      ↓
                                            Status: disbursed
                                            Set nextPaymentDate
```

**Calculations:**
```
Net Disbursement = Principal - (Principal × Processing Fee %)
First Payment Date = Disbursement Date + 1 Month
```

---

## Module 2: IFRS 9 Compliance (`/admin/compliance/ifrs9`)

**Purpose:** Track Expected Credit Loss (ECL) and regulatory provisions.

### 2.1 IFRS 9 Stage Classification

**Stage 1: Low Credit Risk**
- No significant increase in credit risk since origination
- 12-month ECL provision
- Typical: Current loans, no payment issues

**Stage 2: Medium Credit Risk**
- Significant increase in credit risk
- Lifetime ECL provision
- Typical: 1-30 days past due, credit deterioration

**Stage 3: High Credit Risk**
- Credit-impaired loans
- Lifetime ECL provision with higher rates
- Typical: 30+ days past due, default risk

### 2.2 ECL Calculation

**Components:**
1. **Probability of Default (PD)**: Likelihood of default within period
2. **Loss Given Default (LGD)**: % of exposure lost if default occurs
3. **Exposure at Default (EAD)**: Outstanding amount at default

**Formula:**
```
ECL = PD × LGD × EAD
```

**Stage-Specific Rates:**
- Stage 1: 12-month ECL (1-year PD)
- Stage 2: Lifetime ECL (full loan term PD)
- Stage 3: Lifetime ECL with 100% LGD

### 2.3 Bank of Zimbabwe (BoZ) Provisions

**Classification System:**
- **Standard**: 0% provision
- **Watch**: 1% provision
- **Substandard**: 5% provision
- **Doubtful**: 25% provision
- **Loss**: 100% provision

**Provision Calculation:**
```
Provision Amount = Principal × Provision Percentage
```

### 2.4 Compliance Dashboard

**Key Metrics:**
- Total loans by stage
- Total ECL value
- Total provisions
- Average ECL per loan
- Portfolio composition

**Reports:**
- ECL Results Table (loan reference, stage, ECL value, date)
- BoZ Provisions Table (loan ID, classification, amount, %)

---

## Module 3: Advanced Reporting (`/admin/reports/advanced`)

### 3.1 Portfolio Analysis

**Metrics Displayed:**
- **Total Loans**: Count of all loans
- **Total Outstanding**: Sum of outstanding balances
- **Total Disbursed**: Sum of all principal amounts
- **Active Loans**: Loans with `disbursed` status
- **Closed Loans**: Loans with `closed` status
- **Defaulted Loans**: Loans with `defaulted` status

**Visualizations:**
- Loan Status Distribution (Pie Chart)
  - Active, Closed, Defaulted
  - Color-coded by status
  - Percentage breakdown

**Portfolio Summary Table:**
- Total Disbursed
- Outstanding Balance
- Repaid Amount
- Repayment Rate (%)

### 3.2 Ageing Analysis (Portfolio at Risk - PAR)

**Categories:**
1. **Current**: No days overdue
2. **1-30 Days**: 1-30 days past due
3. **31-60 Days**: 31-60 days past due
4. **61-90 Days**: 61-90 days past due
5. **90+ Days**: 90+ days past due

**Metrics per Category:**
- Count of loans
- Total outstanding amount
- % of portfolio

**PAR Calculation:**
```
PAR = (Loans 30+ days overdue / Total loans) × 100
```

### 3.3 Performance Trends

**Metrics:**
- Monthly disbursements
- Monthly repayments
- Trend analysis over 6 months

**Visualizations:**
- Line chart showing disbursement vs repayment trends
- Identify seasonal patterns
- Track collection efficiency

### 3.4 Export Functionality

**Export Format:** JSON
**Includes:**
- Generated date
- All metrics
- Ageing data
- Loan count
- Repayment count

**File Naming:** `loan-report-{YYYY-MM-DD}.json`

---

## Data Models & Relationships

### Loans Collection
```typescript
{
  _id: string;
  loanNumber: string;           // LN-{timestamp}
  customerId: string;           // Reference to customer
  loanProductId: string;        // Reference to product
  principalAmount: number;      // Loan amount
  outstandingBalance: number;   // Remaining amount
  loanStatus: string;           // pending-approval | approved | disbursed | closed | defaulted
  interestRate: number;         // Annual interest rate
  loanTermMonths: number;       // Repayment period
  disbursementDate: Date;       // When loan was disbursed
  nextPaymentDate: Date;        // Next payment due date
  closureDate?: Date;           // When loan was closed
}
```

### ECLResults Collection
```typescript
{
  _id: string;
  loanReference: string;        // Reference to loan
  eclValue: number;             // Expected Credit Loss amount
  ifrs9Stage: string;           // Stage 1 | Stage 2 | Stage 3
  calculationTimestamp: Date;   // When ECL was calculated
  effectiveDate: Date;          // When classification is effective
}
```

### BoZProvisions Collection
```typescript
{
  _id: string;
  loanId: string;               // Reference to loan
  bozClassification: string;    // Standard | Watch | Substandard | Doubtful | Loss
  provisionAmount: number;      // Amount to provision
  provisionPercentage: number;  // % of principal
  calculationDate: Date;        // When calculated
  effectiveDate: Date;          // When effective
  ifrs9StageClassification: string; // IFRS 9 stage
  notes?: string;               // Additional notes
}
```

### Repayments Collection
```typescript
{
  _id: string;
  transactionReference: string; // Unique transaction ID
  loanId: string;               // Reference to loan
  repaymentDate: Date;          // When payment was made
  totalAmountPaid: number;      // Total payment amount
  principalAmount: number;      // Principal portion
  interestAmount: number;       // Interest portion
  paymentMethod: string;        // Cash | Bank Transfer | Mobile Money
}
```

---

## Loan Status Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Loan Status Flow                         │
└─────────────────────────────────────────────────────────────┘

pending-approval
    ↓
    ├─→ approved (Approval Workflow)
    │       ↓
    │   disbursed (Disbursement Workflow)
    │       ↓
    │   active (Repayment Phase)
    │       ├─→ closed (Fully repaid)
    │       └─→ defaulted (Payment default)
    │
    └─→ rejected (Application denied)
```

---

## Key Business Rules

### Loan Application
1. Customer must exist and have valid KYC status
2. Principal amount must be within product limits
3. Loan term must be positive integer
4. Interest rate inherited from product

### Loan Approval
1. Only `pending-approval` loans can be approved/rejected
2. Rejection requires approval notes
3. Approved loans ready for disbursement

### Loan Disbursement
1. Only `approved` loans can be disbursed
2. Disbursement date cannot be in the past
3. First payment date = disbursement date + 1 month
4. Processing fee deducted from principal

### IFRS 9 Classification
1. Stage 1: Default PD = 0.5%, LGD = 45%
2. Stage 2: Default PD = 5%, LGD = 45%
3. Stage 3: Default PD = 100%, LGD = 100%
4. Automatic reclassification based on payment status

### Repayment Processing
1. Payment can be partial or full
2. Interest calculated daily
3. Principal applied after interest
4. PAR updated based on payment status

---

## Integration Points

### With Customers Module
- Validate customer existence
- Check KYC status
- Retrieve credit score
- Update customer activity date

### With Loan Products Module
- Validate product active status
- Retrieve interest rate
- Validate amount limits
- Get processing fee

### With Repayments Module
- Track payment history
- Calculate outstanding balance
- Determine PAR status
- Update next payment date

### With Compliance Module
- Calculate ECL values
- Determine IFRS 9 stage
- Generate BoZ provisions
- Track regulatory requirements

---

## Reporting & Analytics

### Standard Reports
- Portfolio summary
- Ageing analysis
- Performance trends
- Compliance status

### Regulatory Reports
- IFRS 9 ECL report
- BoZ provision report
- Loan classification report
- Default rate analysis

### Management Reports
- Disbursement pipeline
- Approval metrics
- Collection efficiency
- Risk concentration

---

## Security & Compliance

### Data Protection
- All loan data encrypted at rest
- HTTPS for all communications
- Audit trail for all changes
- Role-based access control

### Regulatory Compliance
- IFRS 9 compliant ECL calculation
- BoZ provision requirements
- Audit trail requirements
- Data retention policies

### Access Control
- Admin: Full access to all modules
- Manager: Approval and disbursement
- Officer: Application creation and repayment
- Viewer: Read-only access

---

## Performance Optimization

### Database Queries
- Index on loanStatus for filtering
- Index on customerId for lookups
- Index on disbursementDate for reporting
- Batch processing for ECL calculations

### Caching Strategy
- Cache loan products (static)
- Cache customer data (30-minute TTL)
- Cache ECL results (daily refresh)
- Cache reports (hourly refresh)

---

## Future Enhancements

### Phase 2
- [ ] Automated ECL calculation engine
- [ ] Loan restructuring module
- [ ] Collateral management
- [ ] Guarantor tracking

### Phase 3
- [ ] Mobile app for customers
- [ ] SMS/Email notifications
- [ ] Payment gateway integration
- [ ] Automated payment processing

### Phase 4
- [ ] Machine learning for credit scoring
- [ ] Predictive analytics
- [ ] Portfolio optimization
- [ ] Risk modeling

---

## Testing Checklist

- [ ] Create loan application
- [ ] Approve loan application
- [ ] Reject loan application
- [ ] Disburse approved loan
- [ ] Calculate ECL for loans
- [ ] Generate ageing report
- [ ] Export report data
- [ ] Verify PAR calculation
- [ ] Test status transitions
- [ ] Validate amount limits

---

## Support & Documentation

For questions or issues:
1. Check this module guide
2. Review component code comments
3. Check entity type definitions
4. Review business rules section

---

**Last Updated:** January 1, 2026
**Version:** 2.0 (Loan Lifecycle & Compliance Phase)
