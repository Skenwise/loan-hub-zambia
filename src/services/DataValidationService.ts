/**
 * Data Validation Service (Phase 2D)
 * Provides comprehensive data validation, sanitization,
 * and business rule enforcement
 */

import { Loans, CustomerProfiles, Repayments, LoanProducts } from '@/entities';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

class DataValidationService {
  /**
   * Validate loan data
   */
  static validateLoan(loan: Partial<Loans>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!loan.loanNumber) {
      errors.push({
        field: 'loanNumber',
        message: 'Loan number is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!loan.customerId) {
      errors.push({
        field: 'customerId',
        message: 'Customer ID is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!loan.principalAmount || loan.principalAmount <= 0) {
      errors.push({
        field: 'principalAmount',
        message: 'Principal amount must be greater than 0',
        code: 'INVALID_AMOUNT',
      });
    }

    // Validate amounts
    if (loan.principalAmount && loan.outstandingBalance) {
      if (loan.outstandingBalance > loan.principalAmount) {
        errors.push({
          field: 'outstandingBalance',
          message: 'Outstanding balance cannot exceed principal amount',
          code: 'INVALID_BALANCE',
        });
      }
    }

    // Validate dates
    if (loan.disbursementDate && loan.nextPaymentDate) {
      const disbursement = new Date(loan.disbursementDate);
      const nextPayment = new Date(loan.nextPaymentDate);

      if (nextPayment < disbursement) {
        errors.push({
          field: 'nextPaymentDate',
          message: 'Next payment date cannot be before disbursement date',
          code: 'INVALID_DATE',
        });
      }
    }

    // Validate loan term
    if (loan.loanTermMonths && loan.loanTermMonths <= 0) {
      errors.push({
        field: 'loanTermMonths',
        message: 'Loan term must be greater than 0',
        code: 'INVALID_TERM',
      });
    }

    // Validate interest rate
    if (loan.interestRate !== undefined) {
      if (loan.interestRate < 0 || loan.interestRate > 100) {
        errors.push({
          field: 'interestRate',
          message: 'Interest rate must be between 0 and 100',
          code: 'INVALID_RATE',
        });
      }
    }

    // Warnings
    if (loan.outstandingBalance === 0 && loan.loanStatus !== 'CLOSED') {
      warnings.push({
        field: 'loanStatus',
        message: 'Loan has zero outstanding balance but status is not CLOSED',
        code: 'STATUS_MISMATCH',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate customer data
   */
  static validateCustomer(customer: Partial<CustomerProfiles>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!customer.firstName || !customer.firstName.trim()) {
      errors.push({
        field: 'firstName',
        message: 'First name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!customer.lastName || !customer.lastName.trim()) {
      errors.push({
        field: 'lastName',
        message: 'Last name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!customer.emailAddress || !this.isValidEmail(customer.emailAddress)) {
      errors.push({
        field: 'emailAddress',
        message: 'Valid email address is required',
        code: 'INVALID_EMAIL',
      });
    }

    // Validate phone number if provided
    if (customer.phoneNumber && !this.isValidPhoneNumber(customer.phoneNumber)) {
      warnings.push({
        field: 'phoneNumber',
        message: 'Phone number format may be invalid',
        code: 'INVALID_PHONE',
      });
    }

    // Validate date of birth
    if (customer.dateOfBirth) {
      const dob = new Date(customer.dateOfBirth);
      const age = new Date().getFullYear() - dob.getFullYear();

      if (age < 18) {
        errors.push({
          field: 'dateOfBirth',
          message: 'Customer must be at least 18 years old',
          code: 'INVALID_AGE',
        });
      }

      if (age > 120) {
        warnings.push({
          field: 'dateOfBirth',
          message: 'Date of birth seems unusually old',
          code: 'UNUSUAL_AGE',
        });
      }
    }

    // Validate credit score
    if (customer.creditScore !== undefined) {
      if (customer.creditScore < 0 || customer.creditScore > 1000) {
        warnings.push({
          field: 'creditScore',
          message: 'Credit score is outside typical range (0-1000)',
          code: 'UNUSUAL_SCORE',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate repayment data
   */
  static validateRepayment(repayment: Partial<Repayments>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!repayment.loanId) {
      errors.push({
        field: 'loanId',
        message: 'Loan ID is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!repayment.repaymentDate) {
      errors.push({
        field: 'repaymentDate',
        message: 'Repayment date is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!repayment.totalAmountPaid || repayment.totalAmountPaid <= 0) {
      errors.push({
        field: 'totalAmountPaid',
        message: 'Total amount paid must be greater than 0',
        code: 'INVALID_AMOUNT',
      });
    }

    // Validate amount breakdown
    if (repayment.principalAmount !== undefined && repayment.interestAmount !== undefined) {
      const total = (repayment.principalAmount || 0) + (repayment.interestAmount || 0);
      if (Math.abs(total - (repayment.totalAmountPaid || 0)) > 0.01) {
        errors.push({
          field: 'totalAmountPaid',
          message: 'Total amount paid does not match principal + interest',
          code: 'AMOUNT_MISMATCH',
        });
      }
    }

    // Validate repayment date is not in future
    if (repayment.repaymentDate) {
      const repaymentDate = new Date(repayment.repaymentDate);
      if (repaymentDate > new Date()) {
        errors.push({
          field: 'repaymentDate',
          message: 'Repayment date cannot be in the future',
          code: 'FUTURE_DATE',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate loan product data
   */
  static validateLoanProduct(product: Partial<LoanProducts>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!product.productName || !product.productName.trim()) {
      errors.push({
        field: 'productName',
        message: 'Product name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!product.productType || !product.productType.trim()) {
      errors.push({
        field: 'productType',
        message: 'Product type is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Validate amounts
    if (product.minLoanAmount !== undefined && product.maxLoanAmount !== undefined) {
      if (product.minLoanAmount > product.maxLoanAmount) {
        errors.push({
          field: 'minLoanAmount',
          message: 'Minimum loan amount cannot exceed maximum',
          code: 'INVALID_RANGE',
        });
      }
    }

    // Validate interest rate
    if (product.interestRate !== undefined) {
      if (product.interestRate < 0 || product.interestRate > 100) {
        errors.push({
          field: 'interestRate',
          message: 'Interest rate must be between 0 and 100',
          code: 'INVALID_RATE',
        });
      }
    }

    // Validate loan term
    if (product.loanTermMonths && product.loanTermMonths <= 0) {
      errors.push({
        field: 'loanTermMonths',
        message: 'Loan term must be greater than 0',
        code: 'INVALID_TERM',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, 255); // Limit length
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  private static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(
    entityType: 'loan' | 'customer' | 'repayment',
    data: any
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    switch (entityType) {
      case 'loan':
        // High interest rate warning
        if (data.interestRate > 30) {
          warnings.push({
            field: 'interestRate',
            message: 'Interest rate is unusually high',
            code: 'HIGH_INTEREST',
          });
        }

        // Large loan amount warning
        if (data.principalAmount > 1000000) {
          warnings.push({
            field: 'principalAmount',
            message: 'Loan amount is unusually large',
            code: 'LARGE_AMOUNT',
          });
        }
        break;

      case 'customer':
        // New customer with high credit score
        if (data.creditScore && data.creditScore > 900) {
          warnings.push({
            field: 'creditScore',
            message: 'Unusually high credit score for new customer',
            code: 'UNUSUAL_SCORE',
          });
        }
        break;

      case 'repayment':
        // Partial repayment warning
        if (data.principalAmount === 0 && data.interestAmount > 0) {
          warnings.push({
            field: 'principalAmount',
            message: 'Repayment contains only interest, no principal',
            code: 'INTEREST_ONLY',
          });
        }
        break;
    }

    return warnings;
  }

  /**
   * Batch validate items
   */
  static batchValidate<T>(
    items: T[],
    validator: (item: T) => ValidationResult
  ): { valid: T[]; invalid: Array<{ item: T; result: ValidationResult }> } {
    const valid: T[] = [];
    const invalid: Array<{ item: T; result: ValidationResult }> = [];

    for (const item of items) {
      const result = validator(item);
      if (result.isValid) {
        valid.push(item);
      } else {
        invalid.push({ item, result });
      }
    }

    return { valid, invalid };
  }
}

export default DataValidationService;
