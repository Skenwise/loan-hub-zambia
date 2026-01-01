/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

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
  /** @wixFieldType image */
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
 * Collection ID: loanproducts
 * Interface for LoanProducts
 */
export interface LoanProducts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
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
 * Collection ID: repayments
 * Interface for Repayments
 */
export interface Repayments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
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
 * Collection ID: staffmembers
 * Interface for StaffMembers
 */
export interface StaffMembers {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  employeeId?: string;
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
