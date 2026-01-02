/**
 * Organisation Settings Service
 * Manages all organisation-level configurations and settings
 */

import { BaseCrudService } from './BaseCrudService';
import { Organizations, StaffMembers, LoanProducts, Roles } from '@/entities';

export interface OrganisationProfile {
  _id: string;
  organizationName: string;
  registrationNumber?: string;
  logo?: string;
  financialYearStart: string; // MM-DD format
  financialYearEnd: string; // MM-DD format
  defaultCurrency: string;
  timeZone: string;
  contactEmail: string;
  websiteUrl?: string;
  subscriptionPlanId: string;
  subscriptionPlanType: string;
}

export interface LoanProductSettings {
  _id: string;
  organisationId: string;
  productName: string;
  productType: string;
  interestMethod: 'FLAT' | 'DECLINING_BALANCE' | 'REDUCING_BALANCE';
  baseInterestRate: number;
  minLoanAmount: number;
  maxLoanAmount: number;
  loanTermMonths: number;
  processingFee: number;
  insuranceFee?: number;
  collateralRequired: boolean;
  collateralTypes?: string[];
  guarantorRequired: boolean;
  approvalThreshold: number;
  isActive: boolean;
}

export interface ECLSettings {
  _id: string;
  organisationId: string;
  pdStage1: number; // Probability of Default
  pdStage2: number;
  pdStage3: number;
  lgd: number; // Loss Given Default
  ead: number; // Exposure at Default
  discountRate: number;
  stagingRules: {
    stage1: string;
    stage2: string;
    stage3: string;
  };
  writeOffPolicy: string;
  recoveryAssumptions: number;
}

export interface KYCSettings {
  _id: string;
  organisationId: string;
  mandatoryDocuments: string[];
  customerTypes: string[];
  amlThreshold: number;
  pepRules: string;
  documentExpiryMonths: number;
  verificationRequired: boolean;
}

export interface StaffMember {
  _id: string;
  organisationId: string;
  fullName: string;
  email: string;
  role: string;
  branch: string;
  approvalLimit: number;
  accessLevel: 'BASIC' | 'STANDARD' | 'ADVANCED' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  dateHired: Date;
}

export interface BranchSettings {
  _id: string;
  organisationId: string;
  branchName: string;
  branchCode: string;
  branchManager: string;
  location: string;
  phoneNumber?: string;
  email?: string;
  isActive: boolean;
}

export interface CollateralSettings {
  _id: string;
  organisationId: string;
  collateralType: string;
  valuationRules: string;
  revaluationFrequencyMonths: number;
  insuranceRequired: boolean;
  minLTV: number;
  maxLTV: number;
}

export interface NotificationTemplate {
  _id: string;
  organisationId: string;
  templateType: 'SMS' | 'EMAIL';
  triggerEvent: string;
  subject?: string;
  body: string;
  isActive: boolean;
}

export class OrganisationSettingsService {
  /**
   * Get organisation profile
   */
  static async getOrganisationProfile(organisationId: string): Promise<OrganisationProfile> {
    const org = await BaseCrudService.getById<Organizations>('organisations', organisationId);

    if (!org) {
      throw new Error('Organisation not found');
    }

    return {
      _id: org._id,
      organizationName: org.organizationName || '',
      logo: '',
      financialYearStart: '01-01',
      financialYearEnd: '12-31',
      defaultCurrency: 'ZMW',
      timeZone: 'Africa/Lusaka',
      contactEmail: org.contactEmail || '',
      websiteUrl: org.websiteUrl,
      subscriptionPlanId: org.subscriptionPlanId || '',
      subscriptionPlanType: org.subscriptionPlanType || '',
    };
  }

  /**
   * Update organisation profile
   */
  static async updateOrganisationProfile(
    organisationId: string,
    updates: Partial<OrganisationProfile>
  ): Promise<OrganisationProfile> {
    await BaseCrudService.update<Organizations>('organisations', {
      _id: organisationId,
      organizationName: updates.organizationName,
      contactEmail: updates.contactEmail,
      websiteUrl: updates.websiteUrl,
    });

    return this.getOrganisationProfile(organisationId);
  }

  /**
   * Get all loan products for organisation
   */
  static async getLoanProducts(organisationId: string): Promise<LoanProductSettings[]> {
    const { items: products } = await BaseCrudService.getAll<LoanProducts>('loanproducts');

    return products
      .filter((p) => p.organisationId === organisationId)
      .map((p) => ({
        _id: p._id,
        organisationId: p.organisationId || '',
        productName: p.productName || '',
        productType: p.productType || '',
        interestMethod: 'DECLINING_BALANCE' as const,
        baseInterestRate: p.interestRate || 0,
        minLoanAmount: p.minLoanAmount || 0,
        maxLoanAmount: p.maxLoanAmount || 0,
        loanTermMonths: p.loanTermMonths || 0,
        processingFee: p.processingFee || 0,
        collateralRequired: true,
        guarantorRequired: false,
        approvalThreshold: p.maxLoanAmount || 0,
        isActive: p.isActive || false,
      }));
  }

  /**
   * Create loan product
   */
  static async createLoanProduct(
    organisationId: string,
    product: Omit<LoanProductSettings, '_id' | 'organisationId'>
  ): Promise<LoanProductSettings> {
    const productId = crypto.randomUUID();

    await BaseCrudService.create('loanproducts', {
      _id: productId,
      organisationId,
      productName: product.productName,
      productType: product.productType,
      description: '',
      interestRate: product.baseInterestRate,
      minLoanAmount: product.minLoanAmount,
      maxLoanAmount: product.maxLoanAmount,
      loanTermMonths: product.loanTermMonths,
      processingFee: product.processingFee,
      eligibilityCriteria: '',
      isActive: product.isActive,
    });

    return {
      _id: productId,
      organisationId,
      ...product,
    };
  }

  /**
   * Get all staff members
   */
  static async getStaffMembers(organisationId: string): Promise<StaffMember[]> {
    const { items: staff } = await BaseCrudService.getAll<StaffMembers>('staffmembers');

    return staff
      .filter((s) => {
        // In production, filter by organisation
        return true;
      })
      .map((s) => ({
        _id: s._id,
        organisationId,
        fullName: s.fullName || '',
        email: s.email || '',
        role: s.role || '',
        branch: s.department || '',
        approvalLimit: 100000,
        accessLevel: 'STANDARD' as const,
        status: (s.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
        dateHired: s.dateHired ? new Date(s.dateHired) : new Date(),
      }));
  }

  /**
   * Add staff member
   */
  static async addStaffMember(
    organisationId: string,
    staff: Omit<StaffMember, '_id' | 'organisationId'>
  ): Promise<StaffMember> {
    const staffId = crypto.randomUUID();

    await BaseCrudService.create('staffmembers', {
      _id: staffId,
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role,
      department: staff.branch,
      phoneNumber: '',
      dateHired: staff.dateHired,
      status: staff.status,
      employeeId: staffId,
      roleId: '',
      lastLoginDate: new Date(),
    });

    return {
      _id: staffId,
      organisationId,
      ...staff,
    };
  }

  /**
   * Update staff member
   */
  static async updateStaffMember(
    staffId: string,
    updates: Partial<StaffMember>
  ): Promise<StaffMember> {
    await BaseCrudService.update<StaffMembers>('staffmembers', {
      _id: staffId,
      fullName: updates.fullName,
      email: updates.email,
      role: updates.role,
      department: updates.branch,
      status: updates.status,
    });

    const updated = await BaseCrudService.getById<StaffMembers>('staffmembers', staffId);

    return {
      _id: updated?._id || '',
      organisationId: updates.organisationId || '',
      fullName: updated?.fullName || '',
      email: updated?.email || '',
      role: updated?.role || '',
      branch: updated?.department || '',
      approvalLimit: updates.approvalLimit || 100000,
      accessLevel: updates.accessLevel || 'STANDARD',
      status: (updated?.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || 'ACTIVE',
      dateHired: updated?.dateHired ? new Date(updated.dateHired) : new Date(),
    };
  }

  /**
   * Get all branches
   */
  static async getBranches(organisationId: string): Promise<BranchSettings[]> {
    // In production, fetch from database
    // For now, return placeholder
    return [];
  }

  /**
   * Create branch
   */
  static async createBranch(
    organisationId: string,
    branch: Omit<BranchSettings, '_id' | 'organisationId'>
  ): Promise<BranchSettings> {
    const branchId = crypto.randomUUID();

    return {
      _id: branchId,
      organisationId,
      ...branch,
    };
  }

  /**
   * Get KYC settings
   */
  static async getKYCSettings(organisationId: string): Promise<KYCSettings> {
    return {
      _id: crypto.randomUUID(),
      organisationId,
      mandatoryDocuments: ['National ID', 'Proof of Address', 'Bank Statement'],
      customerTypes: ['Individual', 'Business', 'NGO'],
      amlThreshold: 50000,
      pepRules: 'Require additional verification for PEPs',
      documentExpiryMonths: 36,
      verificationRequired: true,
    };
  }

  /**
   * Update KYC settings
   */
  static async updateKYCSettings(
    organisationId: string,
    settings: Partial<KYCSettings>
  ): Promise<KYCSettings> {
    return {
      _id: crypto.randomUUID(),
      organisationId,
      mandatoryDocuments: settings.mandatoryDocuments || [],
      customerTypes: settings.customerTypes || [],
      amlThreshold: settings.amlThreshold || 50000,
      pepRules: settings.pepRules || '',
      documentExpiryMonths: settings.documentExpiryMonths || 36,
      verificationRequired: settings.verificationRequired || true,
    };
  }

  /**
   * Get ECL settings
   */
  static async getECLSettings(organisationId: string): Promise<ECLSettings> {
    return {
      _id: crypto.randomUUID(),
      organisationId,
      pdStage1: 0.01,
      pdStage2: 0.05,
      pdStage3: 0.25,
      lgd: 0.45,
      ead: 1.0,
      discountRate: 0.08,
      stagingRules: {
        stage1: 'Not past due',
        stage2: '1-30 days past due',
        stage3: '30+ days past due',
      },
      writeOffPolicy: 'Write off after 180 days past due',
      recoveryAssumptions: 0.3,
    };
  }

  /**
   * Update ECL settings
   */
  static async updateECLSettings(
    organisationId: string,
    settings: Partial<ECLSettings>
  ): Promise<ECLSettings> {
    return {
      _id: crypto.randomUUID(),
      organisationId,
      pdStage1: settings.pdStage1 || 0.01,
      pdStage2: settings.pdStage2 || 0.05,
      pdStage3: settings.pdStage3 || 0.25,
      lgd: settings.lgd || 0.45,
      ead: settings.ead || 1.0,
      discountRate: settings.discountRate || 0.08,
      stagingRules: settings.stagingRules || {
        stage1: 'Not past due',
        stage2: '1-30 days past due',
        stage3: '30+ days past due',
      },
      writeOffPolicy: settings.writeOffPolicy || 'Write off after 180 days past due',
      recoveryAssumptions: settings.recoveryAssumptions || 0.3,
    };
  }

  /**
   * Get notification templates
   */
  static async getNotificationTemplates(organisationId: string): Promise<NotificationTemplate[]> {
    return [
      {
        _id: crypto.randomUUID(),
        organisationId,
        templateType: 'SMS',
        triggerEvent: 'PAYMENT_REMINDER',
        body: 'Payment reminder: ZMW {{amount}} due on {{dueDate}} for loan {{loanNumber}}',
        isActive: true,
      },
      {
        _id: crypto.randomUUID(),
        organisationId,
        templateType: 'EMAIL',
        triggerEvent: 'PAYMENT_CONFIRMATION',
        subject: 'Payment Confirmation - {{loanNumber}}',
        body: 'Your payment of ZMW {{amount}} has been received.',
        isActive: true,
      },
    ];
  }

  /**
   * Get subscription info
   */
  static async getSubscriptionInfo(organisationId: string): Promise<any> {
    const org = await BaseCrudService.getById<Organizations>('organisations', organisationId);

    return {
      currentPlan: org?.subscriptionPlanType || 'BASIC',
      modulesEnabled: ['Loans', 'Repayments', 'Reports'],
      userLimits: {
        current: 5,
        maximum: 10,
      },
      paymentHistory: [],
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Get organisation-wide dashboard data
   */
  static async getOrganisationDashboard(organisationId: string): Promise<any> {
    const { items: loans } = await BaseCrudService.getAll<any>('loans');
    const orgLoans = loans.filter((l: any) => l.organisationId === organisationId);

    const totalLoanBook = orgLoans.reduce((sum: number, l: any) => sum + (l.principalAmount || 0), 0);
    const totalOutstanding = orgLoans.reduce((sum: number, l: any) => sum + (l.outstandingBalance || 0), 0);
    const totalECL = totalOutstanding * 0.05; // Simplified

    // Calculate PAR
    const today = new Date();
    const overdueLoans = orgLoans.filter((l: any) => {
      const dueDate = l.nextPaymentDate ? new Date(l.nextPaymentDate) : null;
      return dueDate && dueDate < today;
    });

    const parAmount = overdueLoans.reduce((sum: number, l: any) => sum + (l.outstandingBalance || 0), 0);
    const par = totalLoanBook > 0 ? (parAmount / totalLoanBook) * 100 : 0;
    const nplRatio = orgLoans.length > 0 ? (overdueLoans.length / orgLoans.length) * 100 : 0;

    return {
      totalLoanBook,
      totalOutstanding,
      totalECL,
      par,
      nplRatio,
      activeLoans: orgLoans.filter((l: any) => l.loanStatus === 'ACTIVE').length,
      closedLoans: orgLoans.filter((l: any) => l.loanStatus === 'CLOSED').length,
      branchExposure: {},
    };
  }
}
