import { BaseCrudService } from './BaseCrudService';
import { 
  Organizations, 
  OrganisationSettings, 
  Branches, 
  StaffMembers, 
  StaffRoleAssignments,
  Roles,
  CustomerProfiles,
  Loans,
  Repayments,
  LoanProducts
} from '@/entities';

/**
 * DemoDataGenerationService
 * Generates realistic demo data for testing and demonstration purposes
 * All generated data is tagged as DEMO and can be removed via DemoManagementService
 */
export class DemoDataGenerationService {
  /**
   * Generate complete demo data structure for an organisation
   * Includes: branches, staff, roles, customers, loans, repayments, collateral
   */
  static async generateDemoData(organisationId: string): Promise<{
    success: boolean;
    message: string;
    generatedCounts: Record<string, number>;
  }> {
    try {
      const generatedCounts: Record<string, number> = {};

      // 1. Generate Branches
      const branches = await this.generateBranches(organisationId);
      generatedCounts['branches'] = branches.length;

      // 2. Generate Roles
      const roles = await this.generateRoles();
      generatedCounts['roles'] = roles.length;

      // 3. Generate Staff Members
      const staffMembers = await this.generateStaffMembers(organisationId, branches);
      generatedCounts['staffMembers'] = staffMembers.length;

      // 4. Generate Staff Role Assignments
      const roleAssignments = await this.generateStaffRoleAssignments(organisationId, staffMembers, roles);
      generatedCounts['roleAssignments'] = roleAssignments.length;

      // 5. Generate Loan Products
      const loanProducts = await this.generateLoanProducts(organisationId);
      generatedCounts['loanProducts'] = loanProducts.length;

      // 6. Generate Customers
      const customers = await this.generateCustomers(organisationId);
      generatedCounts['customers'] = customers.length;

      // 7. Generate Loans
      const loans = await this.generateLoans(organisationId, customers, loanProducts);
      generatedCounts['loans'] = loans.length;

      // 8. Generate Repayments
      const repayments = await this.generateRepayments(organisationId, loans);
      generatedCounts['repayments'] = repayments.length;

      return {
        success: true,
        message: `Successfully generated demo data for organisation ${organisationId}`,
        generatedCounts,
      };
    } catch (error) {
      console.error('Error generating demo data:', error);
      throw new Error(`Failed to generate demo data: ${error}`);
    }
  }

  private static async generateBranches(organisationId: string): Promise<Branches[]> {
    const branchData = [
      {
        branchName: 'Head Office',
        branchCode: 'HO-001',
        addressLine1: '123 Main Street',
        city: 'Capital City',
        stateProvince: 'Central',
        postalCode: '10001',
        phoneNumber: '+1-555-0100',
        emailAddress: 'headoffice@demo.local',
        managerName: 'John Smith',
        isActive: true,
      },
      {
        branchName: 'Downtown Branch',
        branchCode: 'DB-001',
        addressLine1: '456 Commerce Ave',
        city: 'Capital City',
        stateProvince: 'Central',
        postalCode: '10002',
        phoneNumber: '+1-555-0101',
        emailAddress: 'downtown@demo.local',
        managerName: 'Sarah Johnson',
        isActive: true,
      },
      {
        branchName: 'Suburban Branch',
        branchCode: 'SB-001',
        addressLine1: '789 Oak Road',
        city: 'Suburb Town',
        stateProvince: 'North',
        postalCode: '10003',
        phoneNumber: '+1-555-0102',
        emailAddress: 'suburban@demo.local',
        managerName: 'Michael Brown',
        isActive: true,
      },
    ];

    const branches: Branches[] = [];
    for (const data of branchData) {
      const branch = await BaseCrudService.create('branches', {
        _id: crypto.randomUUID(),
        ...data,
      });
      branches.push(branch as Branches);
    }
    return branches;
  }

  private static async generateRoles(): Promise<Roles[]> {
    const roleData = [
      {
        roleName: 'CEO',
        description: 'Chief Executive Officer - Full system access',
        permissions: 'all',
        isSystemRole: false,
        hierarchyLevel: 1,
      },
      {
        roleName: 'Operations Manager',
        description: 'Manages branch operations and staff',
        permissions: 'operations,reporting',
        isSystemRole: false,
        hierarchyLevel: 2,
      },
      {
        roleName: 'Loan Officer',
        description: 'Processes loan applications and approvals',
        permissions: 'loans,customers',
        isSystemRole: false,
        hierarchyLevel: 3,
      },
      {
        roleName: 'Collections Officer',
        description: 'Manages loan repayments and collections',
        permissions: 'repayments,collections',
        isSystemRole: false,
        hierarchyLevel: 3,
      },
      {
        roleName: 'Accountant',
        description: 'Manages accounting and financial records',
        permissions: 'accounting,reporting',
        isSystemRole: false,
        hierarchyLevel: 3,
      },
    ];

    const roles: Roles[] = [];
    for (const data of roleData) {
      const role = await BaseCrudService.create('roles', {
        _id: crypto.randomUUID(),
        ...data,
      });
      roles.push(role as Roles);
    }
    return roles;
  }

  private static async generateStaffMembers(organisationId: string, branches: Branches[]): Promise<StaffMembers[]> {
    const staffData = [
      {
        fullName: 'Demo CEO',
        email: 'ceo@demo.local',
        role: 'CEO',
        department: 'Executive',
        phoneNumber: '+1-555-0200',
        employeeId: 'EMP-CEO-001',
        status: 'ACTIVE',
        dateHired: new Date('2024-01-01'),
      },
      {
        fullName: 'Demo Operations Manager',
        email: 'ops@demo.local',
        role: 'Operations Manager',
        department: 'Operations',
        phoneNumber: '+1-555-0201',
        employeeId: 'EMP-OPS-001',
        status: 'ACTIVE',
        dateHired: new Date('2024-01-15'),
      },
      {
        fullName: 'Demo Loan Officer 1',
        email: 'loanofficer1@demo.local',
        role: 'Loan Officer',
        department: 'Lending',
        phoneNumber: '+1-555-0202',
        employeeId: 'EMP-LO-001',
        status: 'ACTIVE',
        dateHired: new Date('2024-02-01'),
      },
      {
        fullName: 'Demo Loan Officer 2',
        email: 'loanofficer2@demo.local',
        role: 'Loan Officer',
        department: 'Lending',
        phoneNumber: '+1-555-0203',
        employeeId: 'EMP-LO-002',
        status: 'ACTIVE',
        dateHired: new Date('2024-02-01'),
      },
      {
        fullName: 'Demo Collections Officer',
        email: 'collections@demo.local',
        role: 'Collections Officer',
        department: 'Collections',
        phoneNumber: '+1-555-0204',
        employeeId: 'EMP-CO-001',
        status: 'ACTIVE',
        dateHired: new Date('2024-02-15'),
      },
      {
        fullName: 'Demo Accountant',
        email: 'accountant@demo.local',
        role: 'Accountant',
        department: 'Finance',
        phoneNumber: '+1-555-0205',
        employeeId: 'EMP-ACC-001',
        status: 'ACTIVE',
        dateHired: new Date('2024-03-01'),
      },
    ];

    const staffMembers: StaffMembers[] = [];
    for (const data of staffData) {
      const staff = await BaseCrudService.create('staffmembers', {
        _id: crypto.randomUUID(),
        ...data,
      });
      staffMembers.push(staff as StaffMembers);
    }
    return staffMembers;
  }

  private static async generateStaffRoleAssignments(
    organisationId: string,
    staffMembers: StaffMembers[],
    roles: Roles[]
  ): Promise<StaffRoleAssignments[]> {
    const assignments: StaffRoleAssignments[] = [];

    for (const staff of staffMembers) {
      const role = roles.find(r => r.roleName === staff.role);
      if (role) {
        const assignment = await BaseCrudService.create('staffroleassignments', {
          _id: crypto.randomUUID(),
          staffMemberId: staff._id,
          roleId: role._id,
          organizationId: organisationId,
          assignmentDate: new Date(),
          status: 'ACTIVE',
          assignedBy: 'DEMO_SYSTEM',
        });
        assignments.push(assignment as StaffRoleAssignments);
      }
    }

    return assignments;
  }

  private static async generateLoanProducts(organisationId: string): Promise<LoanProducts[]> {
    const productData = [
      {
        organisationId,
        productName: 'Personal Loan',
        productType: 'PERSONAL',
        description: 'Short-term personal loans for individuals',
        interestRate: 12.5,
        minLoanAmount: 1000,
        maxLoanAmount: 50000,
        loanTermMonths: 24,
        processingFee: 2.5,
        eligibilityCriteria: 'Minimum income $2000/month',
        isActive: true,
      },
      {
        organisationId,
        productName: 'Business Loan',
        productType: 'BUSINESS',
        description: 'Medium-term loans for small businesses',
        interestRate: 10.0,
        minLoanAmount: 10000,
        maxLoanAmount: 500000,
        loanTermMonths: 36,
        processingFee: 3.0,
        eligibilityCriteria: 'Business registration required',
        isActive: true,
      },
      {
        organisationId,
        productName: 'Micro Loan',
        productType: 'MICRO',
        description: 'Small loans for microenterprises',
        interestRate: 15.0,
        minLoanAmount: 500,
        maxLoanAmount: 10000,
        loanTermMonths: 12,
        processingFee: 2.0,
        eligibilityCriteria: 'Minimal documentation',
        isActive: true,
      },
    ];

    const products: LoanProducts[] = [];
    for (const data of productData) {
      const product = await BaseCrudService.create('loanproducts', {
        _id: crypto.randomUUID(),
        ...data,
      });
      products.push(product as LoanProducts);
    }
    return products;
  }

  private static async generateCustomers(organisationId: string): Promise<CustomerProfiles[]> {
    const customerData = [
      {
        firstName: 'Demo',
        lastName: 'Customer One',
        nationalIdNumber: 'ID-DEMO-001',
        phoneNumber: '+1-555-1001',
        emailAddress: 'customer1@demo.local',
        residentialAddress: '100 Demo Street',
        dateOfBirth: new Date('1985-05-15'),
        kycVerificationStatus: 'VERIFIED',
        creditScore: 750,
        organisationId,
      },
      {
        firstName: 'Demo',
        lastName: 'Customer Two',
        nationalIdNumber: 'ID-DEMO-002',
        phoneNumber: '+1-555-1002',
        emailAddress: 'customer2@demo.local',
        residentialAddress: '200 Demo Avenue',
        dateOfBirth: new Date('1990-08-22'),
        kycVerificationStatus: 'VERIFIED',
        creditScore: 680,
        organisationId,
      },
      {
        firstName: 'Demo',
        lastName: 'Customer Three',
        nationalIdNumber: 'ID-DEMO-003',
        phoneNumber: '+1-555-1003',
        emailAddress: 'customer3@demo.local',
        residentialAddress: '300 Demo Road',
        dateOfBirth: new Date('1988-03-10'),
        kycVerificationStatus: 'VERIFIED',
        creditScore: 720,
        organisationId,
      },
      {
        firstName: 'Demo',
        lastName: 'Customer Four',
        nationalIdNumber: 'ID-DEMO-004',
        phoneNumber: '+1-555-1004',
        emailAddress: 'customer4@demo.local',
        residentialAddress: '400 Demo Lane',
        dateOfBirth: new Date('1992-11-30'),
        kycVerificationStatus: 'VERIFIED',
        creditScore: 650,
        organisationId,
      },
      {
        firstName: 'Demo',
        lastName: 'Customer Five',
        nationalIdNumber: 'ID-DEMO-005',
        phoneNumber: '+1-555-1005',
        emailAddress: 'customer5@demo.local',
        residentialAddress: '500 Demo Boulevard',
        dateOfBirth: new Date('1987-07-18'),
        kycVerificationStatus: 'VERIFIED',
        creditScore: 700,
        organisationId,
      },
    ];

    const customers: CustomerProfiles[] = [];
    for (const data of customerData) {
      const customer = await BaseCrudService.create('customers', {
        _id: crypto.randomUUID(),
        ...data,
      });
      customers.push(customer as CustomerProfiles);
    }
    return customers;
  }

  private static async generateLoans(
    organisationId: string,
    customers: CustomerProfiles[],
    loanProducts: LoanProducts[]
  ): Promise<Loans[]> {
    const loans: Loans[] = [];
    const today = new Date();

    // Generate loans with different statuses
    const loanStatuses = ['ACTIVE', 'ACTIVE', 'ARREARS', 'CLOSED'];
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const product = loanProducts[i % loanProducts.length];
      const status = loanStatuses[i % loanStatuses.length];

      const disbursementDate = new Date(today);
      disbursementDate.setMonth(disbursementDate.getMonth() - (i + 1));

      const principalAmount = 15000 + (i * 5000);
      let outstandingBalance = principalAmount;
      let nextPaymentDate = new Date(disbursementDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      if (status === 'CLOSED') {
        outstandingBalance = 0;
        nextPaymentDate = new Date(disbursementDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + product.loanTermMonths!);
      } else if (status === 'ARREARS') {
        outstandingBalance = principalAmount * 0.6;
        nextPaymentDate = new Date(today);
        nextPaymentDate.setDate(nextPaymentDate.getDate() - 30); // 30 days overdue
      }

      const loan = await BaseCrudService.create('loans', {
        _id: crypto.randomUUID(),
        loanNumber: `LOAN-DEMO-${String(i + 1).padStart(4, '0')}`,
        organisationId,
        customerId: customer._id,
        loanProductId: product._id,
        disbursementDate,
        principalAmount,
        outstandingBalance,
        loanStatus: status,
        nextPaymentDate,
        interestRate: product.interestRate,
        loanTermMonths: product.loanTermMonths,
        closureDate: status === 'CLOSED' ? new Date(disbursementDate.getTime() + product.loanTermMonths! * 30 * 24 * 60 * 60 * 1000) : undefined,
      });
      loans.push(loan as Loans);
    }

    return loans;
  }

  private static async generateRepayments(organisationId: string, loans: Loans[]): Promise<Repayments[]> {
    const repayments: Repayments[] = [];

    for (const loan of loans) {
      if (loan.loanStatus === 'CLOSED' || loan.loanStatus === 'ACTIVE') {
        // Generate 2-4 repayments per loan
        const repaymentCount = loan.loanStatus === 'CLOSED' ? 4 : 2;

        for (let i = 0; i < repaymentCount; i++) {
          const repaymentDate = new Date(loan.disbursementDate!);
          repaymentDate.setMonth(repaymentDate.getMonth() + (i + 1));

          const principalPortion = loan.principalAmount! / repaymentCount;
          const interestPortion = (loan.principalAmount! * loan.interestRate! / 100) / repaymentCount;

          const repayment = await BaseCrudService.create('repayments', {
            _id: crypto.randomUUID(),
            organisationId,
            transactionReference: `REP-DEMO-${loan.loanNumber}-${String(i + 1).padStart(2, '0')}`,
            loanId: loan._id,
            repaymentDate,
            totalAmountPaid: principalPortion + interestPortion,
            principalAmount: principalPortion,
            interestAmount: interestPortion,
            paymentMethod: 'BANK_TRANSFER',
          });
          repayments.push(repayment as Repayments);
        }
      }
    }

    return repayments;
  }
}
