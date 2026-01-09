/**
 * Central export file for all services
 */

export { BaseCrudService } from './BaseCrudService';
export { OrganisationService } from './OrganisationService';
export { RoleService } from './RoleService';
export { StaffService } from './StaffService';
export { SubscriptionService } from './SubscriptionService';
export { AuthorizationService } from './AuthorizationService';
export { AuthenticationService } from './AuthenticationService';
export { AuditService } from './AuditService';
export { LoanService } from './LoanService';
export { CustomerService } from './CustomerService';
export { ComplianceService } from './ComplianceService';
export { InterestCalculationService } from './InterestCalculationService';
export { WriteoffService } from './WriteoffService';
export { AnalyticsService } from './AnalyticsService';
export { SubscriptionEnforcementService } from './SubscriptionEnforcementService';
export { CollateralService } from './CollateralService';
export { KYCService } from './KYCService';
export { EmailService } from './EmailService';
export { InitializationService } from './InitializationService';
export { DisbursementService } from './DisbursementService';
export { RolePermissionsService } from './RolePermissionsService';
export { ApprovalLimitsService } from './ApprovalLimitsService';
export { CreditCommitteeService } from './CreditCommitteeService';
export { RepaymentService } from './RepaymentService';
export { BulkRepaymentService } from './BulkRepaymentService';
export { NotificationService } from './NotificationService';
export { AdvancedReportingService } from './AdvancedReportingService';
export { GLIntegrationService } from './GLIntegrationService';
export { PenaltyWaiverService } from './PenaltyWaiverService';
export { ReportingService } from './ReportingService';
export { OrganisationSettingsService } from './OrganisationSettingsService';
export { CustomerOnboardingService } from './CustomerOnboardingService';
export { CustomerInvitationService } from './CustomerInvitationService';
export { OrganisationFilteringService } from './OrganisationFilteringService';
export { DataIsolationValidationService } from './DataIsolationValidationService';
export { TestDataGenerationService } from './TestDataGenerationService';
export { BranchManagementService } from './BranchManagementService';
export { CacheService } from './CacheService';
export { PaginationService } from './PaginationService';
export { default as AdvancedFilteringService } from './AdvancedFilteringService';
export { default as AdminEnhancementsService } from './AdminEnhancementsService';
export { default as OptimizationService } from './OptimizationService';
export { default as DataValidationService } from './DataValidationService';

// Collection IDs
export const CollectionIds = {
  AUDIT_TRAIL: 'audittrail',
  BOZ_PROVISIONS: 'bozprovisions',
  BRANCHES: 'branches',
  BRANCH_HOLIDAYS: 'branchholidays',
  CUSTOMER_ACCOUNTS: 'customeraccounts',
  CUSTOMERS: 'customers',
  CUSTOMER_INVITATIONS: 'customerinvitations',
  CUSTOMER_ACTIVATION_LOG: 'customeractivationlog',
  ECL_RESULTS: 'eclresults',
  KYC_DOCUMENT_CONFIGURATION: 'kycdocumentconfiguration',
  KYC_DOCUMENT_SUBMISSIONS: 'kycdocumentsubmissions',
  KYC_STATUS_TRACKING: 'kycstatustracking',
  KYC_VERIFICATION_HISTORY: 'kycverificationhistory',
  LOAN_DOCUMENTS: 'loandocuments',
  LOAN_FEES: 'loanfees',
  LOAN_PENALTY_SETTINGS: 'loanpenaltysettings',
  LOAN_PRODUCTS: 'loanproducts',
  LOANS: 'loans',
  LOAN_WORKFLOW_HISTORY: 'loanworkflowhistory',
  ORGANISATIONS: 'organisations',
  ORGANISATION_SETUP: 'organisationsetup',
  ORGANISATION_SETTINGS: 'organisationsettings',
  REPAYMENTS: 'repayments',
  ROLES: 'roles',
  STAFF_MEMBERS: 'staffmembers',
  STAFF_ROLE_ASSIGNMENTS: 'staffroleassignments',
  SUBSCRIPTION_PLANS: 'subscriptionplans',
  VERIFICATION_RECORDS: 'verificationrecords',
} as const;

// Permission constants
export const Permissions = {
  // Admin permissions
  MANAGE_ORGANISATION: 'manage_organisation',
  MANAGE_STAFF: 'manage_staff',
  MANAGE_ROLES: 'manage_roles',
  VIEW_AUDIT_TRAIL: 'view_audit_trail',
  MANAGE_SUBSCRIPTION: 'manage_subscription',

  // Credit Officer permissions
  CREATE_CUSTOMER: 'create_customer',
  VIEW_CUSTOMER: 'view_customer',
  UPDATE_CUSTOMER: 'update_customer',
  VERIFY_KYC: 'verify_kyc',
  CREATE_LOAN_APPLICATION: 'create_loan_application',
  VIEW_LOAN_APPLICATION: 'view_loan_application',

  // Credit Manager permissions
  APPROVE_LOAN: 'approve_loan',
  REJECT_LOAN: 'reject_loan',
  VIEW_LOAN_APPROVAL: 'view_loan_approval',

  // Finance Officer permissions
  DISBURSE_LOAN: 'disburse_loan',
  POST_REPAYMENT: 'post_repayment',
  RECORD_REPAYMENT: 'record_repayment',
  VIEW_REPAYMENT: 'view_repayment',
  MANAGE_PENALTIES: 'manage_penalties',

  // Compliance Officer permissions
  VIEW_COMPLIANCE_REPORTS: 'view_compliance_reports',
  CALCULATE_ECL: 'calculate_ecl',
  CALCULATE_BOZ_PROVISIONS: 'calculate_boz_provisions',
  VIEW_IFRS9_REPORTS: 'view_ifrs9_reports',
} as const;

// Role definitions
export const RoleDefinitions = {
  SYSTEM_OWNER: {
    name: 'System Owner',
    permissions: Object.values(Permissions),
    hierarchyLevel: 0,
    description: 'Global platform access and management',
  },
  ORGANISATION_ADMIN: {
    name: 'Organisation Admin',
    permissions: [
      Permissions.MANAGE_ORGANISATION,
      Permissions.MANAGE_STAFF,
      Permissions.MANAGE_ROLES,
      Permissions.VIEW_AUDIT_TRAIL,
      Permissions.CREATE_CUSTOMER,
      Permissions.VIEW_CUSTOMER,
      Permissions.UPDATE_CUSTOMER,
      Permissions.VERIFY_KYC,
      Permissions.CREATE_LOAN_APPLICATION,
      Permissions.VIEW_LOAN_APPLICATION,
      Permissions.APPROVE_LOAN,
      Permissions.REJECT_LOAN,
      Permissions.VIEW_LOAN_APPROVAL,
      Permissions.DISBURSE_LOAN,
      Permissions.RECORD_REPAYMENT,
      Permissions.VIEW_REPAYMENT,
      Permissions.MANAGE_PENALTIES,
      Permissions.VIEW_COMPLIANCE_REPORTS,
      Permissions.CALCULATE_ECL,
      Permissions.CALCULATE_BOZ_PROVISIONS,
      Permissions.VIEW_IFRS9_REPORTS,
    ],
    hierarchyLevel: 1,
    description: 'Organization-level management',
  },
  BRANCH_MANAGER: {
    name: 'Branch Manager',
    permissions: [
      Permissions.MANAGE_STAFF,
      Permissions.CREATE_CUSTOMER,
      Permissions.VIEW_CUSTOMER,
      Permissions.UPDATE_CUSTOMER,
      Permissions.VERIFY_KYC,
      Permissions.CREATE_LOAN_APPLICATION,
      Permissions.VIEW_LOAN_APPLICATION,
      Permissions.VIEW_AUDIT_TRAIL,
    ],
    hierarchyLevel: 2,
    description: 'Branch-level operations management',
  },
  ADMIN: {
    name: 'Admin/Owner',
    permissions: Object.values(Permissions),
    hierarchyLevel: 1,
    description: 'Full system access and organization management',
  },
  CREDIT_OFFICER: {
    name: 'Credit Officer',
    permissions: [
      Permissions.CREATE_CUSTOMER,
      Permissions.VIEW_CUSTOMER,
      Permissions.UPDATE_CUSTOMER,
      Permissions.VERIFY_KYC,
      Permissions.CREATE_LOAN_APPLICATION,
      Permissions.VIEW_LOAN_APPLICATION,
    ],
    hierarchyLevel: 3,
    description: 'Manages customer onboarding and loan applications',
  },
  CREDIT_MANAGER: {
    name: 'Credit Manager',
    permissions: [
      Permissions.VIEW_CUSTOMER,
      Permissions.VIEW_LOAN_APPLICATION,
      Permissions.APPROVE_LOAN,
      Permissions.REJECT_LOAN,
      Permissions.VIEW_LOAN_APPROVAL,
    ],
    hierarchyLevel: 2,
    description: 'Reviews and approves loan applications',
  },
  FINANCE_OFFICER: {
    name: 'Finance Officer',
    permissions: [
      Permissions.DISBURSE_LOAN,
      Permissions.RECORD_REPAYMENT,
      Permissions.VIEW_REPAYMENT,
      Permissions.MANAGE_PENALTIES,
    ],
    hierarchyLevel: 3,
    description: 'Manages loan disbursements and repayments',
  },
  COMPLIANCE_OFFICER: {
    name: 'Compliance Officer',
    permissions: [
      Permissions.VIEW_COMPLIANCE_REPORTS,
      Permissions.CALCULATE_ECL,
      Permissions.CALCULATE_BOZ_PROVISIONS,
      Permissions.VIEW_IFRS9_REPORTS,
      Permissions.VIEW_AUDIT_TRAIL,
    ],
    hierarchyLevel: 2,
    description: 'Manages IFRS 9 compliance and regulatory reporting',
  },
} as const;
