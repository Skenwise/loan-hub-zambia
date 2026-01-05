/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: audittrail
 * Interface for AuditTrail
 */
export interface AuditTrail {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  staffMemberId?: string;
  /** @wixFieldType text */
  performedBy?: string;
  /** @wixFieldType datetime */
  timestamp?: Date | string;
  /** @wixFieldType text */
  actionDetails?: string;
  /** @wixFieldType text */
  actionType?: string;
  /** @wixFieldType text */
  resourceAffected?: string;
  /** @wixFieldType text */
  resourceId?: string;
}


/**
 * Collection ID: bozprovisions
 * Interface for BoZProvisions
 */
export interface BoZProvisions {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  loanId?: string;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  bozClassification?: string;
  /** @wixFieldType number */
  provisionAmount?: number;
  /** @wixFieldType number */
  provisionPercentage?: number;
  /** @wixFieldType datetime */
  calculationDate?: Date | string;
  /** @wixFieldType date */
  effectiveDate?: Date | string;
  /** @wixFieldType text */
  ifrs9StageClassification?: string;
  /** @wixFieldType text */
  notes?: string;
}


/**
 * Collection ID: customeraccounts
 * Interface for CustomerAccounts
 */
export interface CustomerAccounts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  customerProfileId?: string;
  /** @wixFieldType text */
  organizationId?: string;
  /** @wixFieldType text */
  accountIdentifier?: string;
  /** @wixFieldType text */
  accountStatus?: string;
  /** @wixFieldType datetime */
  dateCreated?: Date | string;
  /** @wixFieldType datetime */
  lastUpdated?: Date | string;
}


/**
 * Collection ID: customers
 * Interface for CustomerProfiles
 */
export interface CustomerProfiles {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  firstName?: string;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  lastName?: string;
  /** @wixFieldType text */
  nationalIdNumber?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType text */
  emailAddress?: string;
  /** @wixFieldType text */
  residentialAddress?: string;
  /** @wixFieldType date */
  dateOfBirth?: Date | string;
  /** @wixFieldType text */
  kycVerificationStatus?: string;
  /** @wixFieldType number */
  creditScore?: number;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  idDocumentImage?: string;
}


/**
 * Collection ID: eclresults
 * Interface for ECLResults
 */
export interface ECLResults {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  loanReference?: string;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType number */
  eclValue?: number;
  /** @wixFieldType text */
  ifrs9Stage?: string;
  /** @wixFieldType datetime */
  calculationTimestamp?: Date | string;
  /** @wixFieldType date */
  effectiveDate?: Date | string;
}


/**
 * Collection ID: kycdocumentconfiguration
 * Interface for KYCDocumentConfiguration
 */
export interface KYCDocumentConfiguration {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  loanProductId?: string;
  /** @wixFieldType text */
  customerType?: string;
  /** @wixFieldType text */
  documentCategory?: string;
  /** @wixFieldType text */
  documentType?: string;
  /** @wixFieldType boolean */
  isMandatory?: boolean;
}


/**
 * Collection ID: kycdocumentsubmissions
 * Interface for KYCDocumentSubmissions
 */
export interface KYCDocumentSubmissions {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  documentType?: string;
  /** @wixFieldType url */
  documentFile?: string;
  /** @wixFieldType text */
  customerId?: string;
  /** @wixFieldType text */
  loanId?: string;
  /** @wixFieldType text */
  uploadedBy?: string;
  /** @wixFieldType datetime */
  uploadDate?: Date | string;
  /** @wixFieldType text */
  verificationStatus?: string;
  /** @wixFieldType text */
  verifiedBy?: string;
  /** @wixFieldType datetime */
  verificationDate?: Date | string;
  /** @wixFieldType text */
  verificationComments?: string;
}


/**
 * Collection ID: kycstatustracking
 * Interface for KYCStatusTracking
 */
export interface KYCStatusTracking {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  customerId?: string;
  /** @wixFieldType text */
  loanApplicationId?: string;
  /** @wixFieldType text */
  kycStatus?: string;
  /** @wixFieldType text */
  lastUpdatedBy?: string;
  /** @wixFieldType datetime */
  lastUpdatedAt?: Date | string;
  /** @wixFieldType text */
  rejectionReason?: string;
}


/**
 * Collection ID: kycverificationhistory
 * Interface for KYCVerificationHistory
 */
export interface KYCVerificationHistory {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  customerId?: string;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  verificationStatus?: string;
  /** @wixFieldType datetime */
  verificationTimestamp?: Date | string;
  /** @wixFieldType text */
  verifierNotes?: string;
  /** @wixFieldType text */
  verifierId?: string;
  /** @wixFieldType number */
  attemptNumber?: number;
}


/**
 * Collection ID: loandocuments
 * Interface for LoanDocuments
 */
export interface LoanDocuments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  loanId?: string;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  documentName?: string;
  /** @wixFieldType text */
  documentType?: string;
  /** @wixFieldType url */
  documentUrl?: string;
  /** @wixFieldType datetime */
  uploadDate?: Date | string;
  /** @wixFieldType text */
  uploadedBy?: string;
  /** @wixFieldType number */
  fileSize?: number;
}


/**
 * Collection ID: loanpenaltysettings
 * Interface for LoanPenaltySettings
 */
export interface LoanPenaltySettings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  loanProductId?: string;
  /** @wixFieldType boolean */
  enableLatePaymentPenalty?: boolean;
  /** @wixFieldType number */
  latePaymentGracePeriodDays?: number;
  /** @wixFieldType number */
  latePaymentRate?: number;
  /** @wixFieldType number */
  latePaymentCapAmount?: number;
  /** @wixFieldType text */
  latePaymentCalculationMethod?: string;
  /** @wixFieldType boolean */
  enableEarlySettlementPenalty?: boolean;
  /** @wixFieldType number */
  earlySettlementRate?: number;
  /** @wixFieldType number */
  earlySettlementCapAmount?: number;
  /** @wixFieldType text */
  earlySettlementCalculationMethod?: string;
  /** @wixFieldType boolean */
  enablePrepaymentPenalty?: boolean;
  /** @wixFieldType number */
  prepaymentRate?: number;
  /** @wixFieldType number */
  prepaymentCapAmount?: number;
  /** @wixFieldType text */
  prepaymentCalculationMethod?: string;
}


/**
 * Collection ID: loanproducts
 * Interface for LoanProducts
 */
export interface LoanProducts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  productName?: string;
  /** @wixFieldType text */
  productType?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  interestRate?: number;
  /** @wixFieldType number */
  minLoanAmount?: number;
  /** @wixFieldType number */
  maxLoanAmount?: number;
  /** @wixFieldType number */
  loanTermMonths?: number;
  /** @wixFieldType number */
  processingFee?: number;
  /** @wixFieldType text */
  eligibilityCriteria?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}


/**
 * Collection ID: loans
 * Interface for Loans
 */
export interface Loans {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  loanNumber?: string;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  customerId?: string;
  /** @wixFieldType text */
  loanProductId?: string;
  /** @wixFieldType date */
  disbursementDate?: Date | string;
  /** @wixFieldType number */
  principalAmount?: number;
  /** @wixFieldType number */
  outstandingBalance?: number;
  /** @wixFieldType text */
  loanStatus?: string;
  /** @wixFieldType date */
  nextPaymentDate?: Date | string;
  /** @wixFieldType number */
  interestRate?: number;
  /** @wixFieldType number */
  loanTermMonths?: number;
  /** @wixFieldType date */
  closureDate?: Date | string;
}


/**
 * Collection ID: loanworkflowhistory
 * Interface for LoanWorkflowHistory
 */
export interface LoanWorkflowHistory {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  loanId?: string;
  /** @wixFieldType text */
  staffMemberId?: string;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  stage?: string;
  /** @wixFieldType datetime */
  timestamp?: Date | string;
  /** @wixFieldType text */
  changedBy?: string;
  /** @wixFieldType text */
  notes?: string;
}


/**
 * Collection ID: organisations
 * Interface for Organizations
 */
export interface Organizations {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  organizationName?: string;
  /** @wixFieldType text */
  subscriptionPlanId?: string;
  /** @wixFieldType text */
  subscriptionPlanType?: string;
  /** @wixFieldType text */
  organizationStatus?: string;
  /** @wixFieldType date */
  creationDate?: Date | string;
  /** @wixFieldType text */
  contactEmail?: string;
  /** @wixFieldType url */
  websiteUrl?: string;
  /** @wixFieldType datetime */
  lastActivityDate?: Date | string;
}


/**
 * Collection ID: organisationsettings
 * Interface for OrganisationSettings
 */
export interface OrganisationSettings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  companyName?: string;
  /** @wixFieldType text */
  country?: string;
  /** @wixFieldType text */
  timezone?: string;
  /** @wixFieldType text */
  currency?: string;
  /** @wixFieldType text */
  dateFormat?: string;
  /** @wixFieldType text */
  decimalSeparator?: string;
  /** @wixFieldType text */
  thousandSeparator?: string;
  /** @wixFieldType text */
  loanRepaymentCycle?: string;
  /** @wixFieldType number */
  daysInMonthForInterestCalculation?: number;
  /** @wixFieldType number */
  daysInYearForInterestCalculation?: number;
  /** @wixFieldType text */
  businessRegistrationNumber?: string;
  /** @wixFieldType text */
  address?: string;
  /** @wixFieldType text */
  city?: string;
  /** @wixFieldType text */
  provinceState?: string;
  /** @wixFieldType text */
  zipPostalCode?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  companyLogo?: string;
}


/**
 * Collection ID: organisationsetup
 * Interface for OrganisationSetup
 */
export interface OrganisationSetup {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  organisationName?: string;
  /** @wixFieldType text */
  currentSetupStep?: string;
  /** @wixFieldType text */
  setupStatus?: string;
  /** @wixFieldType datetime */
  lastUpdated?: Date | string;
  /** @wixFieldType boolean */
  isSetupComplete?: boolean;
  /** @wixFieldType datetime */
  completionDate?: Date | string;
  /** @wixFieldType text */
  setupNotes?: string;
}


/**
 * Collection ID: repayments
 * Interface for Repayments
 */
export interface Repayments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  organisationId?: string;
  /** @wixFieldType text */
  transactionReference?: string;
  /** @wixFieldType text */
  loanId?: string;
  /** @wixFieldType date */
  repaymentDate?: Date | string;
  /** @wixFieldType number */
  totalAmountPaid?: number;
  /** @wixFieldType number */
  principalAmount?: number;
  /** @wixFieldType number */
  interestAmount?: number;
  /** @wixFieldType text */
  paymentMethod?: string;
}


/**
 * Collection ID: roles
 * Interface for Roles
 */
export interface Roles {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  roleName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  permissions?: string;
  /** @wixFieldType boolean */
  isSystemRole?: boolean;
  /** @wixFieldType number */
  hierarchyLevel?: number;
}


/**
 * Collection ID: staffmembers
 * Interface for StaffMembers
 */
export interface StaffMembers {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType datetime */
  lastLoginDate?: Date | string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  employeeId?: string;
  /** @wixFieldType text */
  roleId?: string;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  role?: string;
  /** @wixFieldType text */
  department?: string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType date */
  dateHired?: Date | string;
}


/**
 * Collection ID: staffroleassignments
 * Interface for StaffRoleAssignments
 */
export interface StaffRoleAssignments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  staffMemberId?: string;
  /** @wixFieldType text */
  roleId?: string;
  /** @wixFieldType date */
  assignmentDate?: Date | string;
  /** @wixFieldType text */
  organizationId?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  assignedBy?: string;
}


/**
 * Collection ID: subscriptionplans
 * Interface for SubscriptionPlans
 */
export interface SubscriptionPlans {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  planName?: string;
  /** @wixFieldType number */
  pricePerMonth?: number;
  /** @wixFieldType text */
  features?: string;
  /** @wixFieldType text */
  usageLimits?: string;
  /** @wixFieldType text */
  planDescription?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}
