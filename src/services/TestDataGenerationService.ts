/**
 * Test Data Generation Service
 * Generates multi-organization test scenarios for Phase 1: Core Data Isolation
 * 
 * Used for testing data isolation, filtering, and cross-organization access prevention
 */

import { BaseCrudService } from '@/integrations';
import { CollectionIds } from './index';
import {
  Organizations,
  CustomerProfiles,
  Loans,
  Repayments,
  LoanProducts,
  Branches,
  StaffMembers,
  Roles,
} from '@/entities';

interface TestOrganizationScenario {
  organization: Organizations;
  customers: CustomerProfiles[];
  loans: Loans[];
  repayments: Repayments[];
  loanProducts: LoanProducts[];
  branches: Branches[];
  staff: StaffMembers[];
}

export class TestDataGenerationService {
  /**
   * Generate a complete test scenario with multiple organizations
   */
  static async generateMultiOrgScenario(): Promise<TestOrganizationScenario[]> {
    const scenarios: TestOrganizationScenario[] = [];

    // Organization 1: Acme Microfinance
    const org1 = await this.createTestOrganization('Acme Microfinance', 'acme-001');
    const scenario1 = await this.generateOrgScenario(org1);
    scenarios.push(scenario1);

    // Organization 2: Global Finance Solutions
    const org2 = await this.createTestOrganization('Global Finance Solutions', 'global-001');
    const scenario2 = await this.generateOrgScenario(org2);
    scenarios.push(scenario2);

    // Organization 3: Community Credit Union
    const org3 = await this.createTestOrganization('Community Credit Union', 'community-001');
    const scenario3 = await this.generateOrgScenario(org3);
    scenarios.push(scenario3);

    return scenarios;
  }

  /**
   * Generate test scenario for a single organization
   */
  static async generateOrgScenario(org: Organizations): Promise<TestOrganizationScenario> {
    const customers = await this.generateTestCustomers(org._id, 5);
    const loanProducts = await this.generateTestLoanProducts(org._id, 3);
    const loans = await this.generateTestLoans(org._id, customers, loanProducts, 8);
    const repayments = await this.generateTestRepayments(org._id, loans, 15);
    const branches = await this.generateTestBranches(org._id, 2);
    const staff = await this.generateTestStaff(org._id, 4);

    return {
      organization: org,
      customers,
      loans,
      repayments,
      loanProducts,
      branches,
      staff,
    };
  }

  /**
   * Create a test organization
   */
  private static async createTestOrganization(
    name: string,
    code: string
  ): Promise<Organizations> {
    const org: Organizations = {
      _id: crypto.randomUUID(),
      organizationName: name,
      subscriptionPlanId: 'test-plan-001',
      subscriptionPlanType: 'premium',
      organizationStatus: 'active',
      creationDate: new Date(),
      contactEmail: `contact@${code}.test`,
      websiteUrl: `https://${code}.test`,
      lastActivityDate: new Date(),
    };

    try {
      await BaseCrudService.create(CollectionIds.ORGANISATIONS, org);
      return org;
    } catch (error) {
      console.error('Error creating test organization:', error);
      return org;
    }
  }

  /**
   * Generate test customers for an organization
   */
  private static async generateTestCustomers(
    organisationId: string,
    count: number
  ): Promise<CustomerProfiles[]> {
    const customers: CustomerProfiles[] = [];

    for (let i = 1; i <= count; i++) {
      const customer: CustomerProfiles = {
        _id: crypto.randomUUID(),
        firstName: `Test${i}`,
        lastName: `Customer${i}`,
        organisationId,
        nationalIdNumber: `ID-${organisationId.substring(0, 8)}-${i}`,
        phoneNumber: `+1234567890${i}`,
        emailAddress: `customer${i}@test.org`,
        residentialAddress: `${i} Test Street, Test City`,
        dateOfBirth: new Date('1990-01-01'),
        kycVerificationStatus: 'verified',
        creditScore: 700 + i * 10,
      };

      try {
        await BaseCrudService.create(CollectionIds.CUSTOMERS, customer);
        customers.push(customer);
      } catch (error) {
        console.error(`Error creating test customer ${i}:`, error);
      }
    }

    return customers;
  }

  /**
   * Generate test loan products for an organization
   */
  private static async generateTestLoanProducts(
    organisationId: string,
    count: number
  ): Promise<LoanProducts[]> {
    const products: LoanProducts[] = [];
    const productTypes = ['Personal', 'Business', 'Agricultural'];

    for (let i = 0; i < count; i++) {
      const product: LoanProducts = {
        _id: crypto.randomUUID(),
        organisationId,
        productName: `${productTypes[i]} Loan Product ${i + 1}`,
        productType: productTypes[i],
        description: `Test ${productTypes[i]} loan product for testing`,
        interestRate: 8 + i * 2,
        minLoanAmount: 1000 + i * 500,
        maxLoanAmount: 50000 + i * 10000,
        loanTermMonths: 12 + i * 6,
        processingFee: 50 + i * 25,
        eligibilityCriteria: 'Test eligibility criteria',
        isActive: true,
      };

      try {
        await BaseCrudService.create(CollectionIds.LOAN_PRODUCTS, product);
        products.push(product);
      } catch (error) {
        console.error(`Error creating test loan product ${i}:`, error);
      }
    }

    return products;
  }

  /**
   * Generate test loans for an organization
   */
  private static async generateTestLoans(
    organisationId: string,
    customers: CustomerProfiles[],
    products: LoanProducts[],
    count: number
  ): Promise<Loans[]> {
    const loans: Loans[] = [];
    const statuses = ['active', 'pending', 'approved', 'disbursed'];

    for (let i = 0; i < count; i++) {
      const customer = customers[i % customers.length];
      const product = products[i % products.length];

      const loan: Loans = {
        _id: crypto.randomUUID(),
        loanNumber: `LOAN-${organisationId.substring(0, 8)}-${i + 1}`,
        organisationId,
        customerId: customer._id,
        loanProductId: product._id,
        disbursementDate: new Date(),
        principalAmount: 10000 + i * 1000,
        outstandingBalance: 10000 + i * 1000,
        loanStatus: statuses[i % statuses.length],
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        interestRate: product.interestRate,
        loanTermMonths: product.loanTermMonths,
      };

      try {
        await BaseCrudService.create(CollectionIds.LOANS, loan);
        loans.push(loan);
      } catch (error) {
        console.error(`Error creating test loan ${i}:`, error);
      }
    }

    return loans;
  }

  /**
   * Generate test repayments for an organization
   */
  private static async generateTestRepayments(
    organisationId: string,
    loans: Loans[],
    count: number
  ): Promise<Repayments[]> {
    const repayments: Repayments[] = [];
    const paymentMethods = ['bank_transfer', 'cash', 'check', 'mobile_money'];

    for (let i = 0; i < count; i++) {
      const loan = loans[i % loans.length];

      const repayment: Repayments = {
        _id: crypto.randomUUID(),
        organisationId,
        transactionReference: `TXN-${organisationId.substring(0, 8)}-${i + 1}`,
        loanId: loan._id,
        repaymentDate: new Date(),
        totalAmountPaid: 500 + i * 100,
        principalAmount: 300 + i * 50,
        interestAmount: 200 + i * 50,
        paymentMethod: paymentMethods[i % paymentMethods.length],
      };

      try {
        await BaseCrudService.create(CollectionIds.REPAYMENTS, repayment);
        repayments.push(repayment);
      } catch (error) {
        console.error(`Error creating test repayment ${i}:`, error);
      }
    }

    return repayments;
  }

  /**
   * Generate test branches for an organization
   */
  private static async generateTestBranches(
    organisationId: string,
    count: number
  ): Promise<Branches[]> {
    const branches: Branches[] = [];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston'];

    for (let i = 0; i < count; i++) {
      const branch: Branches = {
        _id: crypto.randomUUID(),
        branchName: `${cities[i % cities.length]} Branch`,
        branchCode: `BR-${organisationId.substring(0, 8)}-${i + 1}`,
        organisationId,
        addressLine1: `${i + 1} Main Street`,
        city: cities[i % cities.length],
        stateProvince: 'Test State',
        postalCode: `12345${i}`,
        phoneNumber: `+1234567890${i}`,
        emailAddress: `branch${i}@test.org`,
        managerName: `Manager ${i + 1}`,
        isActive: true,
      };

      try {
        await BaseCrudService.create(CollectionIds.BRANCHES, branch);
        branches.push(branch);
      } catch (error) {
        console.error(`Error creating test branch ${i}:`, error);
      }
    }

    return branches;
  }

  /**
   * Generate test staff for an organization
   */
  private static async generateTestStaff(
    organisationId: string,
    count: number
  ): Promise<StaffMembers[]> {
    const staff: StaffMembers[] = [];
    const departments = ['Credit', 'Finance', 'Operations', 'Compliance'];

    for (let i = 0; i < count; i++) {
      const staffMember: StaffMembers = {
        _id: crypto.randomUUID(),
        employeeId: `EMP-${organisationId.substring(0, 8)}-${i + 1}`,
        fullName: `Test Staff ${i + 1}`,
        email: `staff${i}@test.org`,
        role: departments[i % departments.length],
        department: departments[i % departments.length],
        phoneNumber: `+1234567890${i}`,
        dateHired: new Date(),
        status: 'active',
      };

      try {
        await BaseCrudService.create(CollectionIds.STAFF_MEMBERS, staffMember);
        staff.push(staffMember);
      } catch (error) {
        console.error(`Error creating test staff ${i}:`, error);
      }
    }

    return staff;
  }

  /**
   * Clean up test data for an organization
   */
  static async cleanupTestData(organisationId: string): Promise<void> {
    const collections = [
      CollectionIds.REPAYMENTS,
      CollectionIds.LOANS,
      CollectionIds.LOAN_PRODUCTS,
      CollectionIds.CUSTOMERS,
      CollectionIds.STAFF_MEMBERS,
      CollectionIds.BRANCHES,
    ];

    for (const collectionId of collections) {
      try {
        const { items } = await BaseCrudService.getAll<any>(collectionId);
        const orgItems = items.filter(item => item.organisationId === organisationId);

        for (const item of orgItems) {
          await BaseCrudService.delete(collectionId, item._id);
        }

        console.log(`Cleaned up ${orgItems.length} items from ${collectionId}`);
      } catch (error) {
        console.error(`Error cleaning up ${collectionId}:`, error);
      }
    }

    // Delete the organization itself
    try {
      await BaseCrudService.delete(CollectionIds.ORGANISATIONS, organisationId);
      console.log(`Deleted organization ${organisationId}`);
    } catch (error) {
      console.error(`Error deleting organization:`, error);
    }
  }

  /**
   * Log test data summary
   */
  static logTestDataSummary(scenarios: TestOrganizationScenario[]): void {
    console.log('[TestData] Multi-Organization Test Scenario Summary:');
    console.log('='.repeat(60));

    scenarios.forEach((scenario, index) => {
      console.log(`\nOrganization ${index + 1}: ${scenario.organization.organizationName}`);
      console.log(`  Organization ID: ${scenario.organization._id}`);
      console.log(`  Customers: ${scenario.customers.length}`);
      console.log(`  Loan Products: ${scenario.loanProducts.length}`);
      console.log(`  Loans: ${scenario.loans.length}`);
      console.log(`  Repayments: ${scenario.repayments.length}`);
      console.log(`  Branches: ${scenario.branches.length}`);
      console.log(`  Staff: ${scenario.staff.length}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('Total Organizations:', scenarios.length);
    console.log('Total Customers:', scenarios.reduce((sum, s) => sum + s.customers.length, 0));
    console.log('Total Loans:', scenarios.reduce((sum, s) => sum + s.loans.length, 0));
    console.log('Total Repayments:', scenarios.reduce((sum, s) => sum + s.repayments.length, 0));
  }
}
