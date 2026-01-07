import { BaseCrudService } from './BaseCrudService';
import { Loans, CustomerProfiles, Repayments } from '@/entities';

export interface StatementGenerationOptions {
  branchId: string;
  statementTypes: {
    borrowerStatements: boolean;
    loanStatements: boolean;
    originalSchedules: boolean;
    adjustedSchedules: boolean;
  };
  borrowerIds?: string[];
  allBorrowers: boolean;
}

export class StatementGenerationService {
  /**
   * Get count of borrowers in a branch
   */
  static async getBorrowerCountByBranch(branchId: string): Promise<number> {
    try {
      const { items: allCustomers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      // In a real scenario, borrowers would have a branchId field
      // For now, we'll return a count based on organization
      return allCustomers?.length || 0;
    } catch (error) {
      console.error('Error getting borrower count:', error);
      return 0;
    }
  }

  /**
   * Get count of loans in a branch
   */
  static async getLoanCountByBranch(branchId: string): Promise<number> {
    try {
      const { items: allLoans } = await BaseCrudService.getAll<Loans>('loans');
      // In a real scenario, loans would have a branchId field
      return allLoans?.length || 0;
    } catch (error) {
      console.error('Error getting loan count:', error);
      return 0;
    }
  }

  /**
   * Get borrowers for a branch
   */
  static async getBorrowersByBranch(branchId: string, limit?: number): Promise<CustomerProfiles[]> {
    try {
      const { items: allCustomers } = await BaseCrudService.getAll<CustomerProfiles>('customers');
      let borrowers = allCustomers || [];
      
      if (limit) {
        borrowers = borrowers.slice(0, limit);
      }
      
      return borrowers;
    } catch (error) {
      console.error('Error getting borrowers:', error);
      return [];
    }
  }

  /**
   * Get loans for a branch
   */
  static async getLoansByBranch(branchId: string): Promise<Loans[]> {
    try {
      const { items: allLoans } = await BaseCrudService.getAll<Loans>('loans');
      return allLoans || [];
    } catch (error) {
      console.error('Error getting loans:', error);
      return [];
    }
  }

  /**
   * Generate borrower statement in CSV format
   */
  static async generateBorrowerStatement(borrower: CustomerProfiles): Promise<string> {
    // Create borrower info CSV
    const borrowerData = [
      ['Borrower Statement'],
      [],
      ['Borrower ID:', borrower._id],
      ['Name:', `${borrower.firstName} ${borrower.lastName}`],
      ['Email:', borrower.emailAddress],
      ['Phone:', borrower.phoneNumber],
      ['National ID:', borrower.nationalIdNumber],
      ['Address:', borrower.residentialAddress],
      ['KYC Status:', borrower.kycVerificationStatus],
      ['Credit Score:', borrower.creditScore?.toString() || ''],
      ['Date of Birth:', borrower.dateOfBirth || ''],
    ];

    return this.arrayToCSV(borrowerData);
  }

  /**
   * Generate loan statement in CSV format
   */
  static async generateLoanStatement(loan: Loans, borrower?: CustomerProfiles): Promise<string> {
    // Loan details
    const loanData = [
      ['Loan Statement'],
      [],
      ['Loan Number:', loan.loanNumber || ''],
      ['Loan ID:', loan._id],
      ['Borrower:', borrower ? `${borrower.firstName} ${borrower.lastName}` : 'N/A'],
      ['Principal Amount:', loan.principalAmount?.toString() || ''],
      ['Outstanding Balance:', loan.outstandingBalance?.toString() || ''],
      ['Interest Rate:', `${loan.interestRate}%`],
      ['Loan Term:', `${loan.loanTermMonths} months`],
      ['Status:', loan.loanStatus || ''],
      ['Disbursement Date:', loan.disbursementDate || ''],
      ['Next Payment Date:', loan.nextPaymentDate || ''],
      ['Closure Date:', loan.closureDate || ''],
    ];

    return this.arrayToCSV(loanData);
  }

  /**
   * Generate original loan schedule
   */
  static async generateOriginalLoanSchedule(loan: Loans): Promise<string> {
    // Calculate schedule based on loan details
    const scheduleData: any[] = [
      ['Original Loan Schedule'],
      ['Loan Number:', loan.loanNumber || ''],
      [],
      ['Payment #', 'Due Date', 'Principal', 'Interest', 'Total Payment', 'Balance'],
    ];

    // Generate sample schedule (in production, this would be calculated from actual schedule data)
    const monthlyPayment = this.calculateMonthlyPayment(
      loan.principalAmount || 0,
      loan.interestRate || 0,
      loan.loanTermMonths || 0
    );

    let balance = loan.principalAmount || 0;
    const startDate = new Date(loan.disbursementDate || new Date());

    for (let i = 1; i <= (loan.loanTermMonths || 12); i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const interestPayment = (balance * (loan.interestRate || 0)) / 100 / 12;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      scheduleData.push([
        i.toString(),
        dueDate.toLocaleDateString(),
        principalPayment.toFixed(2),
        interestPayment.toFixed(2),
        monthlyPayment.toFixed(2),
        Math.max(0, balance).toFixed(2),
      ]);
    }

    return this.arrayToCSV(scheduleData);
  }

  /**
   * Generate adjusted loan schedule
   */
  static async generateAdjustedLoanSchedule(loan: Loans): Promise<string> {
    // Get repayments to show actual vs scheduled
    const { items: allRepayments } = await BaseCrudService.getAll<Repayments>('repayments');
    const loanRepayments = allRepayments?.filter((r) => r.loanId === loan._id) || [];

    const scheduleData: any[] = [
      ['Adjusted Loan Schedule (with Actual Repayments)'],
      ['Loan Number:', loan.loanNumber || ''],
      [],
      ['Payment #', 'Due Date', 'Scheduled Principal', 'Scheduled Interest', 'Actual Payment', 'Status'],
    ];

    const monthlyPayment = this.calculateMonthlyPayment(
      loan.principalAmount || 0,
      loan.interestRate || 0,
      loan.loanTermMonths || 0
    );

    let balance = loan.principalAmount || 0;
    const startDate = new Date(loan.disbursementDate || new Date());

    for (let i = 1; i <= (loan.loanTermMonths || 12); i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const interestPayment = (balance * (loan.interestRate || 0)) / 100 / 12;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      // Find actual repayment for this period
      const actualRepayment = loanRepayments.find(
        (r) => new Date(r.repaymentDate || '').getMonth() === dueDate.getMonth()
      );

      const status = actualRepayment ? 'Paid' : 'Pending';
      const actualAmount = actualRepayment?.totalAmountPaid || 0;

      scheduleData.push([
        i.toString(),
        dueDate.toLocaleDateString(),
        principalPayment.toFixed(2),
        interestPayment.toFixed(2),
        actualAmount.toFixed(2),
        status,
      ]);
    }

    return this.arrayToCSV(scheduleData);
  }

  /**
   * Generate complete ZIP-like structure with selected statements
   * Returns a JSON structure that can be downloaded
   */
  static async generateStatementZip(
    options: StatementGenerationOptions,
    branchName: string
  ): Promise<Blob> {
    const timestamp = new Date().toISOString().split('T')[0];
    const folderName = `${branchName.replace(/\s+/g, '_')}_Reports_${timestamp}`;

    try {
      // Get borrowers and loans
      let borrowers: CustomerProfiles[] = [];
      let loans: Loans[] = [];

      if (options.allBorrowers) {
        borrowers = await this.getBorrowersByBranch(options.branchId);
        loans = await this.getLoansByBranch(options.branchId);
      } else if (options.borrowerIds && options.borrowerIds.length > 0) {
        const allBorrowers = await this.getBorrowersByBranch(options.branchId);
        borrowers = allBorrowers.filter((b) => options.borrowerIds?.includes(b._id));
        loans = await this.getLoansByBranch(options.branchId);
        loans = loans.filter((l) => options.borrowerIds?.includes(l.customerId || ''));
      }

      const files: { [key: string]: string } = {};

      // Generate borrower statements
      if (options.statementTypes.borrowerStatements && borrowers.length > 0) {
        for (const borrower of borrowers) {
          const csvContent = await this.generateBorrowerStatement(borrower);
          files[`Borrower_Statements/Borrower_${borrower._id}_Statement.csv`] = csvContent;
        }
      }

      // Generate loan statements
      if (options.statementTypes.loanStatements && loans.length > 0) {
        for (const loan of loans) {
          const borrower = borrowers.find((b) => b._id === loan.customerId);
          const csvContent = await this.generateLoanStatement(loan, borrower);
          files[`Loan_Statements/Loan_${loan.loanNumber}_Statement.csv`] = csvContent;
        }
      }

      // Generate original schedules
      if (options.statementTypes.originalSchedules && loans.length > 0) {
        for (const loan of loans) {
          const csvContent = await this.generateOriginalLoanSchedule(loan);
          files[`Original_Schedules/Loan_${loan.loanNumber}_Original_Schedule.csv`] = csvContent;
        }
      }

      // Generate adjusted schedules
      if (options.statementTypes.adjustedSchedules && loans.length > 0) {
        for (const loan of loans) {
          const csvContent = await this.generateAdjustedLoanSchedule(loan);
          files[`Adjusted_Schedules/Loan_${loan.loanNumber}_Adjusted_Schedule.csv`] = csvContent;
        }
      }

      // Generate summary report
      const summaryData = [
        ['Statement Generation Summary'],
        [],
        ['Branch:', branchName],
        ['Generation Date:', new Date().toLocaleDateString()],
        ['Total Borrowers:', borrowers.length.toString()],
        ['Total Loans:', loans.length.toString()],
        [],
        ['Included Reports:'],
        ['Borrower Statements:', options.statementTypes.borrowerStatements ? 'Yes' : 'No'],
        ['Loan Statements:', options.statementTypes.loanStatements ? 'Yes' : 'No'],
        ['Original Schedules:', options.statementTypes.originalSchedules ? 'Yes' : 'No'],
        ['Adjusted Schedules:', options.statementTypes.adjustedSchedules ? 'Yes' : 'No'],
      ];

      files['Summary.csv'] = this.arrayToCSV(summaryData);

      // Create a JSON blob containing all files
      const jsonContent = JSON.stringify({ folderName, files }, null, 2);
      return new Blob([jsonContent], { type: 'application/json' });
    } catch (error) {
      console.error('Error generating statement package:', error);
      throw error;
    }
  }

  /**
   * Calculate monthly payment using standard loan formula
   */
  private static calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
    if (months === 0 || annualRate === 0) return principal / (months || 1);

    const monthlyRate = annualRate / 100 / 12;
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;

    return (principal * numerator) / denominator;
  }

  /**
   * Convert 2D array to CSV string
   */
  private static arrayToCSV(data: any[][]): string {
    return data
      .map((row) =>
        row
          .map((cell) => {
            const cellStr = cell?.toString() || '';
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(',')
      )
      .join('\n');
  }

  /**
   * Download file
   */
  static downloadZip(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
