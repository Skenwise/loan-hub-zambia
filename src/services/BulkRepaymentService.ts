/**
 * Bulk Repayment Service
 * Handles CSV upload, validation, and batch processing of repayments
 */

import { BaseCrudService } from './BaseCrudService';
import { RepaymentService } from './RepaymentService';
import { Loans, Repayments } from '@/entities';

export interface BulkRepaymentRecord {
  loanNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes?: string;
}

export interface BulkRepaymentValidationResult {
  isValid: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: BulkRepaymentError[];
  warnings: BulkRepaymentWarning[];
  summary: {
    totalAmount: number;
    estimatedProcessingTime: string;
  };
}

export interface BulkRepaymentError {
  rowNumber: number;
  field: string;
  value: string;
  message: string;
}

export interface BulkRepaymentWarning {
  rowNumber: number;
  field: string;
  value: string;
  message: string;
}

export interface BulkRepaymentJob {
  _id: string;
  organisationId: string;
  staffMemberId: string;
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadDate: Date;
  completionDate?: Date;
  totalAmount: number;
  successfulAmount: number;
  failedAmount: number;
  errors: string[];
}

export class BulkRepaymentService {
  /**
   * Parse CSV file and extract repayment records
   */
  static parseCSV(csvContent: string): BulkRepaymentRecord[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const records: BulkRepaymentRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',').map((v) => v.trim());
      const record: any = {};

      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      records.push({
        loanNumber: record.loannumber || record.loan_number || '',
        amount: parseFloat(record.amount) || 0,
        paymentDate: record.paymentdate || record.payment_date || '',
        paymentMethod: record.paymentmethod || record.payment_method || 'cash',
        referenceNumber: record.referencenumber || record.reference_number || '',
        notes: record.notes || '',
      });
    }

    return records;
  }

  /**
   * Validate bulk repayment records
   */
  static async validateBulkRepayments(
    records: BulkRepaymentRecord[],
    organisationId: string
  ): Promise<BulkRepaymentValidationResult> {
    const errors: BulkRepaymentError[] = [];
    const warnings: BulkRepaymentWarning[] = [];
    let validRecords = 0;
    let totalAmount = 0;

    // Get all loans for the organisation
    const { items: allLoans } = await BaseCrudService.getAll<Loans>('loans');
    const orgLoans = allLoans.filter((l) => l.organisationId === organisationId);
    const loanMap = new Map(orgLoans.map((l) => [l.loanNumber, l]));

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because of header and 1-based indexing

      // Validate loan number
      if (!record.loanNumber) {
        errors.push({
          rowNumber,
          field: 'loanNumber',
          value: record.loanNumber,
          message: 'Loan number is required',
        });
        continue;
      }

      const loan = loanMap.get(record.loanNumber);
      if (!loan) {
        errors.push({
          rowNumber,
          field: 'loanNumber',
          value: record.loanNumber,
          message: `Loan ${record.loanNumber} not found`,
        });
        continue;
      }

      // Validate amount
      if (!record.amount || record.amount <= 0) {
        errors.push({
          rowNumber,
          field: 'amount',
          value: record.amount.toString(),
          message: 'Amount must be greater than zero',
        });
        continue;
      }

      // Validate payment date
      const paymentDate = new Date(record.paymentDate);
      if (isNaN(paymentDate.getTime())) {
        errors.push({
          rowNumber,
          field: 'paymentDate',
          value: record.paymentDate,
          message: 'Invalid payment date format (use YYYY-MM-DD)',
        });
        continue;
      }

      if (paymentDate > new Date()) {
        errors.push({
          rowNumber,
          field: 'paymentDate',
          value: record.paymentDate,
          message: 'Payment date cannot be in the future',
        });
        continue;
      }

      // Validate payment method
      const validMethods = ['cash', 'bank_transfer', 'mobile_money', 'standing_order'];
      if (!validMethods.includes(record.paymentMethod.toLowerCase())) {
        errors.push({
          rowNumber,
          field: 'paymentMethod',
          value: record.paymentMethod,
          message: `Invalid payment method. Must be one of: ${validMethods.join(', ')}`,
        });
        continue;
      }

      // Check loan status
      if (loan.loanStatus === 'CLOSED' || loan.loanStatus === 'WRITTEN_OFF') {
        errors.push({
          rowNumber,
          field: 'loanNumber',
          value: record.loanNumber,
          message: `Cannot post repayment for ${loan.loanStatus} loan`,
        });
        continue;
      }

      // Get repayment status
      const status = await RepaymentService.getLoanRepaymentStatus(loan._id || '');

      // Check if amount exceeds outstanding
      if (record.amount > status.totalOutstanding * 1.1) {
        warnings.push({
          rowNumber,
          field: 'amount',
          value: record.amount.toString(),
          message: `Amount exceeds outstanding balance by more than 10%`,
        });
      }

      validRecords++;
      totalAmount += record.amount;
    }

    return {
      isValid: errors.length === 0,
      totalRecords: records.length,
      validRecords,
      invalidRecords: errors.length,
      errors,
      warnings,
      summary: {
        totalAmount,
        estimatedProcessingTime: `${Math.ceil(validRecords / 10)} minutes`,
      },
    };
  }

  /**
   * Process bulk repayments
   */
  static async processBulkRepayments(
    records: BulkRepaymentRecord[],
    organisationId: string,
    staffMemberId: string,
    fileName: string
  ): Promise<BulkRepaymentJob> {
    const jobId = crypto.randomUUID();
    let processedRecords = 0;
    let failedRecords = 0;
    let successfulAmount = 0;
    let failedAmount = 0;
    const errors: string[] = [];

    // Get all loans
    const { items: allLoans } = await BaseCrudService.getAll<Loans>('loans');
    const orgLoans = allLoans.filter((l) => l.organisationId === organisationId);
    const loanMap = new Map(orgLoans.map((l) => [l.loanNumber, l]));

    // Process each record
    for (const record of records) {
      try {
        const loan = loanMap.get(record.loanNumber);
        if (!loan || !loan._id) {
          failedRecords++;
          failedAmount += record.amount;
          errors.push(`Failed to process ${record.loanNumber}: Loan not found`);
          continue;
        }

        // Post repayment
        await RepaymentService.postRepayment(
          loan._id,
          record.amount,
          record.paymentDate,
          record.paymentMethod,
          record.referenceNumber || `BULK-${jobId}-${processedRecords}`,
          staffMemberId,
          organisationId,
          `Bulk upload: ${fileName}`
        );

        processedRecords++;
        successfulAmount += record.amount;
      } catch (error: any) {
        failedRecords++;
        failedAmount += record.amount;
        errors.push(`Failed to process ${record.loanNumber}: ${error.message}`);
      }
    }

    // Create job record
    const job: BulkRepaymentJob = {
      _id: jobId,
      organisationId,
      staffMemberId,
      fileName,
      totalRecords: records.length,
      processedRecords,
      failedRecords,
      status: failedRecords === 0 ? 'COMPLETED' : failedRecords === records.length ? 'FAILED' : 'COMPLETED',
      uploadDate: new Date(),
      completionDate: new Date(),
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
      successfulAmount,
      failedAmount,
      errors,
    };

    return job;
  }

  /**
   * Generate CSV template
   */
  static generateCSVTemplate(): string {
    return `LoanNumber,Amount,PaymentDate,PaymentMethod,ReferenceNumber,Notes
LOAN-001,5000,2024-01-15,cash,REF-001,Regular monthly payment
LOAN-002,3500,2024-01-15,bank_transfer,REF-002,Partial payment
LOAN-003,7200,2024-01-16,mobile_money,REF-003,Full settlement`;
  }

  /**
   * Export bulk repayment job results
   */
  static exportJobResults(job: BulkRepaymentJob): string {
    let csv = 'Bulk Repayment Job Report\n';
    csv += `Job ID,${job._id}\n`;
    csv += `File Name,${job.fileName}\n`;
    csv += `Status,${job.status}\n`;
    csv += `Upload Date,${job.uploadDate}\n`;
    csv += `Completion Date,${job.completionDate}\n\n`;

    csv += 'Summary\n';
    csv += `Total Records,${job.totalRecords}\n`;
    csv += `Processed Records,${job.processedRecords}\n`;
    csv += `Failed Records,${job.failedRecords}\n`;
    csv += `Success Rate,${((job.processedRecords / job.totalRecords) * 100).toFixed(2)}%\n`;
    csv += `Total Amount,${job.totalAmount}\n`;
    csv += `Successful Amount,${job.successfulAmount}\n`;
    csv += `Failed Amount,${job.failedAmount}\n\n`;

    if (job.errors.length > 0) {
      csv += 'Errors\n';
      job.errors.forEach((error) => {
        csv += `"${error}"\n`;
      });
    }

    return csv;
  }
}
