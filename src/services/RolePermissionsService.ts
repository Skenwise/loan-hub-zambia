/**
 * Role Permissions Service
 * Manages detailed role-based permissions and access control
 */

import { BaseCrudService } from '@/integrations';
import { StaffMembers, Roles } from '@/entities';
import { CollectionIds, Permissions } from './index';

export interface RolePermissionConfig {
  roleId: string;
  roleName: string;
  permissions: {
    // Customer Management
    createCustomer: boolean;
    viewCustomer: boolean;
    updateCustomer: boolean;
    deleteCustomer: boolean;
    
    // KYC Management
    uploadKYCDocuments: boolean;
    verifyKYC: boolean;
    rejectKYC: boolean;
    flagHighRiskCustomer: boolean;
    lockCustomerAccount: boolean;
    
    // Loan Application
    createLoanApplication: boolean;
    viewLoanApplication: boolean;
    editLoanApplication: boolean;
    
    // Loan Approval
    approveLoan: boolean;
    rejectLoan: boolean;
    approveOverride: boolean;
    approveLoanRestructure: boolean;
    approveWriteOff: boolean;
    
    // Disbursement
    disburseLoan: boolean;
    reverseDisbursement: boolean;
    
    // Repayment
    recordRepayment: boolean;
    reverseRepayment: boolean;
    
    // Credit Analysis
    performCreditAnalysis: boolean;
    assignRiskGrade: boolean;
    assignIFRS9Stage: boolean;
    recommendApprovalReject: boolean;
    
    // Committee
    chairCreditCommittee: boolean;
    voteCreditCommittee: boolean;
    
    // Configuration
    editLoanProducts: boolean;
    configureApprovalLimits: boolean;
    manageRoles: boolean;
    manageStaff: boolean;
    
    // Reporting
    viewAuditLogs: boolean;
    generateReports: boolean;
    exportData: boolean;
    viewExecutiveDashboard: boolean;
    
    // Organization
    manageOrganization: boolean;
    manageSubscription: boolean;
  };
  
  approvalLimit: number; // In base currency
  branchScoped: boolean;
  canApproveOwnReview: boolean;
  requiresJustificationForOverride: boolean;
}

export interface ApprovalLimitConfig {
  organisationId: string;
  roleApprovalLimits: {
    [roleId: string]: number;
  };
  escalationRules: {
    singleApproverLimit: number;
    requiresCommitteeAbove: number;
    requiresCEOAbove: number;
  };
  decisionRule: 'majority' | 'unanimous';
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissionConfig> = {
  'loan-officer': {
    roleId: 'loan-officer',
    roleName: 'Loan Officer',
    permissions: {
      createCustomer: true,
      viewCustomer: true,
      updateCustomer: false,
      deleteCustomer: false,
      uploadKYCDocuments: true,
      verifyKYC: false,
      rejectKYC: false,
      flagHighRiskCustomer: false,
      lockCustomerAccount: false,
      createLoanApplication: true,
      viewLoanApplication: true,
      editLoanApplication: true,
      approveLoan: false,
      rejectLoan: false,
      approveOverride: false,
      approveLoanRestructure: false,
      approveWriteOff: false,
      disburseLoan: false,
      reverseDisbursement: false,
      recordRepayment: false,
      reverseRepayment: false,
      performCreditAnalysis: false,
      assignRiskGrade: false,
      assignIFRS9Stage: false,
      recommendApprovalReject: false,
      chairCreditCommittee: false,
      voteCreditCommittee: false,
      editLoanProducts: false,
      configureApprovalLimits: false,
      manageRoles: false,
      manageStaff: false,
      viewAuditLogs: false,
      generateReports: false,
      exportData: false,
      viewExecutiveDashboard: false,
      manageOrganization: false,
      manageSubscription: false,
    },
    approvalLimit: 0,
    branchScoped: true,
    canApproveOwnReview: false,
    requiresJustificationForOverride: true,
  },
  
  'branch-manager': {
    roleId: 'branch-manager',
    roleName: 'Branch Manager',
    permissions: {
      createCustomer: true,
      viewCustomer: true,
      updateCustomer: true,
      deleteCustomer: false,
      uploadKYCDocuments: true,
      verifyKYC: false,
      rejectKYC: false,
      flagHighRiskCustomer: false,
      lockCustomerAccount: false,
      createLoanApplication: true,
      viewLoanApplication: true,
      editLoanApplication: true,
      approveLoan: true,
      rejectLoan: true,
      approveOverride: false,
      approveLoanRestructure: false,
      approveWriteOff: false,
      disburseLoan: false,
      reverseDisbursement: false,
      recordRepayment: false,
      reverseRepayment: false,
      performCreditAnalysis: false,
      assignRiskGrade: false,
      assignIFRS9Stage: false,
      recommendApprovalReject: false,
      chairCreditCommittee: false,
      voteCreditCommittee: false,
      editLoanProducts: false,
      configureApprovalLimits: false,
      manageRoles: false,
      manageStaff: true,
      viewAuditLogs: false,
      generateReports: true,
      exportData: false,
      viewExecutiveDashboard: false,
      manageOrganization: false,
      manageSubscription: false,
    },
    approvalLimit: 50000,
    branchScoped: true,
    canApproveOwnReview: false,
    requiresJustificationForOverride: true,
  },
  
  'credit-officer': {
    roleId: 'credit-officer',
    roleName: 'Credit / Risk Officer',
    permissions: {
      createCustomer: false,
      viewCustomer: true,
      updateCustomer: false,
      deleteCustomer: false,
      uploadKYCDocuments: false,
      verifyKYC: false,
      rejectKYC: false,
      flagHighRiskCustomer: false,
      lockCustomerAccount: false,
      createLoanApplication: false,
      viewLoanApplication: true,
      editLoanApplication: false,
      approveLoan: false,
      rejectLoan: false,
      approveOverride: false,
      approveLoanRestructure: false,
      approveWriteOff: false,
      disburseLoan: false,
      reverseDisbursement: false,
      recordRepayment: false,
      reverseRepayment: false,
      performCreditAnalysis: true,
      assignRiskGrade: true,
      assignIFRS9Stage: true,
      recommendApprovalReject: true,
      chairCreditCommittee: false,
      voteCreditCommittee: false,
      editLoanProducts: false,
      configureApprovalLimits: false,
      manageRoles: false,
      manageStaff: false,
      viewAuditLogs: false,
      generateReports: true,
      exportData: false,
      viewExecutiveDashboard: false,
      manageOrganization: false,
      manageSubscription: false,
    },
    approvalLimit: 0,
    branchScoped: false,
    canApproveOwnReview: false,
    requiresJustificationForOverride: true,
  },
  
  'kyc-officer': {
    roleId: 'kyc-officer',
    roleName: 'Compliance / KYC Officer',
    permissions: {
      createCustomer: false,
      viewCustomer: true,
      updateCustomer: false,
      deleteCustomer: false,
      uploadKYCDocuments: false,
      verifyKYC: true,
      rejectKYC: true,
      flagHighRiskCustomer: true,
      lockCustomerAccount: true,
      createLoanApplication: false,
      viewLoanApplication: true,
      editLoanApplication: false,
      approveLoan: false,
      rejectLoan: false,
      approveOverride: false,
      approveLoanRestructure: false,
      approveWriteOff: false,
      disburseLoan: false,
      reverseDisbursement: false,
      recordRepayment: false,
      reverseRepayment: false,
      performCreditAnalysis: false,
      assignRiskGrade: false,
      assignIFRS9Stage: false,
      recommendApprovalReject: false,
      chairCreditCommittee: false,
      voteCreditCommittee: false,
      editLoanProducts: false,
      configureApprovalLimits: false,
      manageRoles: false,
      manageStaff: false,
      viewAuditLogs: false,
      generateReports: true,
      exportData: false,
      viewExecutiveDashboard: false,
      manageOrganization: false,
      manageSubscription: false,
    },
    approvalLimit: 0,
    branchScoped: false,
    canApproveOwnReview: false,
    requiresJustificationForOverride: false,
  },
  
  'finance-officer': {
    roleId: 'finance-officer',
    roleName: 'Finance / Disbursement Officer',
    permissions: {
      createCustomer: false,
      viewCustomer: true,
      updateCustomer: false,
      deleteCustomer: false,
      uploadKYCDocuments: false,
      verifyKYC: false,
      rejectKYC: false,
      flagHighRiskCustomer: false,
      lockCustomerAccount: false,
      createLoanApplication: false,
      viewLoanApplication: true,
      editLoanApplication: false,
      approveLoan: false,
      rejectLoan: false,
      approveOverride: false,
      approveLoanRestructure: false,
      approveWriteOff: false,
      disburseLoan: true,
      reverseDisbursement: true,
      recordRepayment: true,
      reverseRepayment: false,
      performCreditAnalysis: false,
      assignRiskGrade: false,
      assignIFRS9Stage: false,
      recommendApprovalReject: false,
      chairCreditCommittee: false,
      voteCreditCommittee: false,
      editLoanProducts: false,
      configureApprovalLimits: false,
      manageRoles: false,
      manageStaff: false,
      viewAuditLogs: false,
      generateReports: true,
      exportData: false,
      viewExecutiveDashboard: false,
      manageOrganization: false,
      manageSubscription: false,
    },
    approvalLimit: 0,
    branchScoped: false,
    canApproveOwnReview: false,
    requiresJustificationForOverride: false,
  },
  
  'credit-manager': {
    roleId: 'credit-manager',
    roleName: 'Credit Manager / Head of Credit',
    permissions: {
      createCustomer: false,
      viewCustomer: true,
      updateCustomer: false,
      deleteCustomer: false,
      uploadKYCDocuments: false,
      verifyKYC: false,
      rejectKYC: false,
      flagHighRiskCustomer: false,
      lockCustomerAccount: false,
      createLoanApplication: false,
      viewLoanApplication: true,
      editLoanApplication: false,
      approveLoan: true,
      rejectLoan: true,
      approveOverride: true,
      approveLoanRestructure: true,
      approveWriteOff: true,
      disburseLoan: false,
      reverseDisbursement: false,
      recordRepayment: false,
      reverseRepayment: false,
      performCreditAnalysis: true,
      assignRiskGrade: true,
      assignIFRS9Stage: true,
      recommendApprovalReject: true,
      chairCreditCommittee: true,
      voteCreditCommittee: true,
      editLoanProducts: false,
      configureApprovalLimits: false,
      manageRoles: false,
      manageStaff: false,
      viewAuditLogs: true,
      generateReports: true,
      exportData: true,
      viewExecutiveDashboard: true,
      manageOrganization: false,
      manageSubscription: false,
    },
    approvalLimit: 250000,
    branchScoped: false,
    canApproveOwnReview: false,
    requiresJustificationForOverride: true,
  },
  
  'ceo': {
    roleId: 'ceo',
    roleName: 'CEO / Managing Director',
    permissions: {
      createCustomer: false,
      viewCustomer: true,
      updateCustomer: false,
      deleteCustomer: false,
      uploadKYCDocuments: false,
      verifyKYC: false,
      rejectKYC: false,
      flagHighRiskCustomer: false,
      lockCustomerAccount: false,
      createLoanApplication: false,
      viewLoanApplication: true,
      editLoanApplication: false,
      approveLoan: true,
      rejectLoan: true,
      approveOverride: true,
      approveLoanRestructure: true,
      approveWriteOff: true,
      disburseLoan: false,
      reverseDisbursement: false,
      recordRepayment: false,
      reverseRepayment: false,
      performCreditAnalysis: false,
      assignRiskGrade: false,
      assignIFRS9Stage: false,
      recommendApprovalReject: false,
      chairCreditCommittee: true,
      voteCreditCommittee: true,
      editLoanProducts: false,
      configureApprovalLimits: false,
      manageRoles: false,
      manageStaff: false,
      viewAuditLogs: true,
      generateReports: true,
      exportData: true,
      viewExecutiveDashboard: true,
      manageOrganization: false,
      manageSubscription: false,
    },
    approvalLimit: Number.MAX_SAFE_INTEGER,
    branchScoped: false,
    canApproveOwnReview: false,
    requiresJustificationForOverride: false,
  },
  
  'internal-auditor': {
    roleId: 'internal-auditor',
    roleName: 'Internal Auditor',
    permissions: {
      createCustomer: false,
      viewCustomer: true,
      updateCustomer: false,
      deleteCustomer: false,
      uploadKYCDocuments: false,
      verifyKYC: false,
      rejectKYC: false,
      flagHighRiskCustomer: false,
      lockCustomerAccount: false,
      createLoanApplication: false,
      viewLoanApplication: true,
      editLoanApplication: false,
      approveLoan: false,
      rejectLoan: false,
      approveOverride: false,
      approveLoanRestructure: false,
      approveWriteOff: false,
      disburseLoan: false,
      reverseDisbursement: false,
      recordRepayment: false,
      reverseRepayment: false,
      performCreditAnalysis: false,
      assignRiskGrade: false,
      assignIFRS9Stage: false,
      recommendApprovalReject: false,
      chairCreditCommittee: false,
      voteCreditCommittee: false,
      editLoanProducts: false,
      configureApprovalLimits: false,
      manageRoles: false,
      manageStaff: false,
      viewAuditLogs: true,
      generateReports: true,
      exportData: true,
      viewExecutiveDashboard: false,
      manageOrganization: false,
      manageSubscription: false,
    },
    approvalLimit: 0,
    branchScoped: false,
    canApproveOwnReview: false,
    requiresJustificationForOverride: false,
  },
};

export class RolePermissionsService {
  /**
   * Get role permission configuration
   */
  static getRolePermissions(roleId: string): RolePermissionConfig | null {
    return DEFAULT_ROLE_PERMISSIONS[roleId] || null;
  }

  /**
   * Check if role has specific permission
   */
  static hasPermission(roleId: string, permission: keyof RolePermissionConfig['permissions']): boolean {
    const roleConfig = this.getRolePermissions(roleId);
    if (!roleConfig) return false;
    return roleConfig.permissions[permission] === true;
  }

  /**
   * Get approval limit for role
   */
  static getApprovalLimit(roleId: string): number {
    const roleConfig = this.getRolePermissions(roleId);
    return roleConfig?.approvalLimit || 0;
  }

  /**
   * Check if role is branch scoped
   */
  static isBranchScoped(roleId: string): boolean {
    const roleConfig = this.getRolePermissions(roleId);
    return roleConfig?.branchScoped || false;
  }

  /**
   * Get all available roles
   */
  static getAllRoles(): RolePermissionConfig[] {
    return Object.values(DEFAULT_ROLE_PERMISSIONS);
  }

  /**
   * Get roles that can approve loans
   */
  static getApprovingRoles(): RolePermissionConfig[] {
    return Object.values(DEFAULT_ROLE_PERMISSIONS).filter(
      role => role.permissions.approveLoan
    );
  }

  /**
   * Get roles that can disburse loans
   */
  static getDisbursementRoles(): RolePermissionConfig[] {
    return Object.values(DEFAULT_ROLE_PERMISSIONS).filter(
      role => role.permissions.disburseLoan
    );
  }

  /**
   * Get roles that can chair credit committee
   */
  static getCommitteeChairRoles(): RolePermissionConfig[] {
    return Object.values(DEFAULT_ROLE_PERMISSIONS).filter(
      role => role.permissions.chairCreditCommittee
    );
  }

  /**
   * Get roles that can vote in credit committee
   */
  static getCommitteeVoterRoles(): RolePermissionConfig[] {
    return Object.values(DEFAULT_ROLE_PERMISSIONS).filter(
      role => role.permissions.voteCreditCommittee
    );
  }
}
