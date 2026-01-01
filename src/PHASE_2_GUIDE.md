# Phase 2: Core Modules & UI - Implementation Guide

## 🎯 Phase 2 Overview

Phase 2 builds the complete user interfaces and workflows for the Enterprise LMS, including:
- Customer Portal for loan applications and tracking
- Admin Portal for comprehensive loan management
- Complete loan lifecycle workflows
- Repayment management system
- Reporting and analytics

## ✅ What's Been Implemented

### 1. Customer Portal Pages

#### CustomerLoanApplicationPage
- Loan product selection
- Loan amount input with validation
- Loan term selection
- Real-time monthly payment calculation
- Form validation with error messages
- Success/error notifications
- Loan product details display
- KYC verification check

**Route**: `/customer-portal/apply`

**Features**:
- Validates loan amount against product limits
- Calculates monthly payment using reducing balance method
- Logs loan application to audit trail
- Checks customer KYC status
- Shows available loan products with details

**Usage**:
```typescript
// Customer applies for loan
const loan = await LoanService.createLoan({
  loanNumber: `LOAN-${Date.now()}`,
  customerId: customer._id,
  loanProductId: selectedProductId,
  principalAmount: amount,
  outstandingBalance: amount,
  loanStatus: 'PENDING',
  nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  interestRate: product.interestRate,
  loanTermMonths: term,
  organisationId,
});

// Log to audit trail
await AuditService.logLoanApplication(loan._id, email, customerId);
```

#### CustomerLoansPage
- Display all customer loans
- Summary statistics (active loans, outstanding balance, total repaid)
- Loan status badges with color coding
- Days overdue indicator
- Monthly payment display
- Link to loan details
- Empty state with CTA

**Route**: `/customer-portal/loans`

**Features**:
- Real-time loan data enrichment
- Status color coding
- Overdue loan highlighting
- Quick action links
- Responsive grid layout

**Data Displayed**:
- Loan number and status
- Principal amount and interest rate
- Outstanding balance
- Monthly payment amount
- Next payment date
- Days overdue (if applicable)

### 2. Admin Portal Pages

#### AdminLoansManagementPage
- Comprehensive loan list with filtering
- Search by loan number, customer name, or email
- Filter by loan status
- Summary statistics (total, pending, active, overdue)
- Status badges with icons
- Quick action buttons
- Responsive table layout

**Route**: `/admin/loans`

**Features**:
- Real-time search filtering
- Status-based filtering
- Loan enrichment with customer data
- Permission-based action buttons
- Days overdue calculation
- Monthly payment calculation

**Permissions**:
- `APPROVE_LOAN`: Shows "Approve" button for pending loans
- `DISBURSE_LOAN`: Shows "Disburse" button for approved loans

**Statistics Displayed**:
- Total loans count
- Pending loans count
- Active loans count
- Overdue loans count

### 3. Enhanced Admin Dashboard

**AdminDashboardPage** (already created in Phase 1)
- Real-time metrics
- Quick action buttons
- Compliance status
- Recent loans list

## 🔄 Loan Workflow States

```
PENDING
  ↓
UNDER_REVIEW (optional)
  ↓
APPROVED ← REJECTED
  ↓
DISBURSED
  ↓
ACTIVE
  ↓
CLOSED (when fully repaid)
```

## 📊 Key Calculations

### Monthly Payment (Reducing Balance)
```typescript
const monthlyPayment = LoanService.calculateMonthlyPayment(
  principalAmount,
  annualInterestRate,
  loanTermMonths
);

// Formula: (P × r × (1 + r)^n) / ((1 + r)^n - 1)
// Where:
//   P = Principal
//   r = Monthly interest rate (annual / 12 / 100)
//   n = Number of months
```

### Interest Amount
```typescript
const interestAmount = LoanService.calculateInterestAmount(
  outstandingBalance,
  annualInterestRate
);

// Formula: Outstanding Balance × (Annual Rate / 100 / 12)
```

### Principal Amount
```typescript
const principalAmount = LoanService.calculatePrincipalAmount(
  monthlyPayment,
  interestAmount
);

// Formula: Monthly Payment - Interest Amount
```

### Days Overdue
```typescript
const daysOverdue = LoanService.calculateDaysOverdue(nextPaymentDate);

// Returns number of days past due date
// Returns 0 if not overdue
```

## 🔐 Authorization & Permissions

### Customer Portal
- **View own loans**: All authenticated customers
- **Apply for loan**: Only KYC-verified customers
- **View loan details**: Only own loans
- **Make payments**: Only own loans

### Admin Portal
- **View all loans**: All staff members
- **Search/filter loans**: All staff members
- **Approve loans**: Credit Manager role
- **Disburse loans**: Finance Officer role
- **Record repayments**: Finance Officer role
- **View compliance**: Compliance Officer role

## 📱 Responsive Design

All pages are fully responsive:
- **Mobile**: Single column layout
- **Tablet**: 2-column grid
- **Desktop**: 3-4 column grid

## 🎨 UI Components Used

### From shadcn/ui
- Card, CardContent, CardDescription, CardHeader, CardTitle
- Button (with variants)
- Input
- Label
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Badge
- LoadingSpinner

### From Lucide React
- Search, Filter, AlertCircle, CheckCircle2
- DollarSign, Calendar, Percent, Clock
- TrendingUp, ArrowRight

### From Framer Motion
- motion.div for animations
- initial, animate, transition props
- staggerChildren for sequential animations

## 🚀 Usage Examples

### Customer Applies for Loan
```typescript
// 1. Customer navigates to /customer-portal/apply
// 2. Page loads available loan products
// 3. Customer selects product, amount, and term
// 4. Monthly payment calculated in real-time
// 5. Customer submits form
// 6. Loan created with PENDING status
// 7. Audit trail logged
// 8. Success message shown
```

### Admin Reviews Loans
```typescript
// 1. Admin navigates to /admin/loans
// 2. Page loads all organisation loans
// 3. Admin can search by loan number or customer
// 4. Admin can filter by status
// 5. Admin sees summary statistics
// 6. Admin clicks "Approve" for pending loans
// 7. Admin clicks "Disburse" for approved loans
```

### Customer Tracks Loan
```typescript
// 1. Customer navigates to /customer-portal/loans
// 2. Page loads all customer loans
// 3. Shows summary statistics
// 4. Lists all loans with status
// 5. Shows next payment date and amount
// 6. Highlights overdue loans
// 7. Customer can click "View Details" for more info
```

## 🔄 Data Flow

### Loan Application Flow
```
Customer Form Input
  ↓
Validation (amount, term, product)
  ↓
Create Loan (status: PENDING)
  ↓
Log to Audit Trail
  ↓
Show Success Message
  ↓
Redirect to Loans List
```

### Loan Approval Flow
```
Admin Views Pending Loans
  ↓
Admin Clicks "Approve"
  ↓
Check Authorization (APPROVE_LOAN permission)
  ↓
Update Loan Status (PENDING → APPROVED)
  ↓
Log to Audit Trail
  ↓
Update UI
```

### Loan Disbursement Flow
```
Admin Views Approved Loans
  ↓
Admin Clicks "Disburse"
  ↓
Check Authorization (DISBURSE_LOAN permission)
  ↓
Update Loan Status (APPROVED → DISBURSED)
  ↓
Set Disbursement Date
  ↓
Log to Audit Trail
  ↓
Update UI
```

## 📊 Data Models

### Loan Status Enum
```typescript
type LoanStatus = 
  | 'PENDING'      // Initial submission
  | 'UNDER_REVIEW' // Being reviewed
  | 'APPROVED'     // Approved for disbursement
  | 'REJECTED'     // Application rejected
  | 'DISBURSED'    // Funds disbursed
  | 'ACTIVE'       // Loan is active
  | 'CLOSED'       // Loan fully repaid
  | 'DEFAULTED';   // Payment default
```

### Loan Object
```typescript
interface Loans {
  _id: string;
  loanNumber: string;
  customerId: string;
  loanProductId: string;
  organisationId: string;
  disbursementDate?: Date | string;
  principalAmount?: number;
  outstandingBalance?: number;
  loanStatus?: string;
  nextPaymentDate?: Date | string;
  interestRate?: number;
  loanTermMonths?: number;
  closureDate?: Date | string;
}
```

## 🎯 Features Implemented

### Customer Portal
- ✅ Loan application form
- ✅ Loan product selection
- ✅ Amount and term input
- ✅ Real-time payment calculation
- ✅ Form validation
- ✅ Success/error notifications
- ✅ Loan list view
- ✅ Loan status tracking
- ✅ KYC verification check

### Admin Portal
- ✅ Comprehensive loan list
- ✅ Search functionality
- ✅ Status filtering
- ✅ Summary statistics
- ✅ Permission-based actions
- ✅ Loan enrichment with customer data
- ✅ Days overdue calculation
- ✅ Quick action buttons

### Shared Features
- ✅ Real-time data loading
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ Audit trail logging
- ✅ Authorization checks
- ✅ Status color coding
- ✅ Animations

## 🔗 Routes Added

### Customer Portal Routes
- `/customer-portal` - Main portal (existing)
- `/customer-portal/apply` - Loan application form (NEW)
- `/customer-portal/loans` - Loan list (NEW)

### Admin Portal Routes
- `/admin/loans` - Loan management (UPDATED)

## 🧪 Testing Checklist

- [ ] Customer can apply for loan
- [ ] Loan amount validation works
- [ ] Monthly payment calculates correctly
- [ ] Loan appears in customer's loan list
- [ ] Admin can view all loans
- [ ] Search filtering works
- [ ] Status filtering works
- [ ] Permission checks work
- [ ] Audit trail logs all actions
- [ ] Responsive design works on mobile
- [ ] Error messages display correctly
- [ ] Success messages display correctly

## 📈 Next Steps (Phase 3)

Phase 3 will implement:
- Loan detail pages
- Loan approval workflow UI
- Disbursement processing UI
- Repayment recording UI
- Payment schedule display
- Document management
- Advanced reporting
- Compliance dashboards

## 🐛 Common Issues & Solutions

### Issue: "Cannot apply for loan" message
**Solution**: Customer needs to complete KYC verification first. Navigate to profile and complete KYC process.

### Issue: Monthly payment not calculating
**Solution**: Ensure all three fields (product, amount, term) are filled. Check that product has interest rate set.

### Issue: Loan not appearing in list
**Solution**: Refresh the page. Check that organisation is set correctly in store.

### Issue: "Approve" button not showing
**Solution**: Check that logged-in user has APPROVE_LOAN permission. Verify user role is Credit Manager.

## 📚 Related Documentation

- PHASE_1_FOUNDATION.md - Service layer details
- IMPLEMENTATION_GUIDE.md - Developer guide
- PHASE_2_IMPLEMENTATION.md - Phase 2 overview
- Entity types in /src/entities/

## ✅ Phase 2 Completion Checklist

- [x] Customer loan application page
- [x] Customer loans list page
- [x] Admin loans management page
- [x] Routes added to Router.tsx
- [x] Authorization checks implemented
- [x] Audit logging implemented
- [x] Real-time calculations
- [x] Error handling
- [x] Responsive design
- [ ] Loan detail pages (Phase 3)
- [ ] Approval workflow UI (Phase 3)
- [ ] Disbursement UI (Phase 3)
- [ ] Repayment UI (Phase 3)

## 🎉 Phase 2 Summary

Phase 2 successfully implements the core customer and admin interfaces for loan management. Customers can now apply for loans and track their applications, while admins have a comprehensive dashboard to manage all loans in their organization.

The foundation is solid and ready for Phase 3, which will add more detailed workflows and advanced features.
