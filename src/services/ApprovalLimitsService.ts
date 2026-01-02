/**
 * Approval Limits Service
 * Manages configurable approval limits and escalation rules
 */

import { BaseCrudService } from '@/integrations';
import { CollectionIds } from './index';
import { RolePermissionsService } from './RolePermissionsService';

export interface ApprovalLimitConfig {
  _id: string;
  organisationId: string;
  roleApprovalLimits: Record<string, number>;
  escalationRules: {
    singleApproverLimit: number;
    requiresCommitteeAbove: number;
    requiresCEOAbove: number;
  };
  decisionRule: 'majority' | 'unanimous';
  _createdDate?: Date;
  _updatedDate?: Date;
}

export interface ApprovalEscalationResult {
  requiresApproval: boolean;
  approverRoleId: string | null;
  requiresCommittee: boolean;
  requiresCEO: boolean;
  escalationReason: string;
}

export const DEFAULT_APPROVAL_LIMITS: ApprovalLimitConfig = {
  _id: 'default-limits',
  organisationId: 'default',
  roleApprovalLimits: {
    'loan-officer': 0,
    'branch-manager': 50000,
    'credit-officer': 0,
    'kyc-officer': 0,
    'finance-officer': 0,
    'credit-manager': 250000,
    'ceo': Number.MAX_SAFE_INTEGER,
    'internal-auditor': 0,
  },
  escalationRules: {
    singleApproverLimit: 250000,
    requiresCommitteeAbove: 500000,
    requiresCEOAbove: 1000000,
  },
  decisionRule: 'majority',
};

export class ApprovalLimitsService {
  /**
   * Get approval limit configuration for organization
   */
  static async getApprovalLimitConfig(organisationId: string): Promise<ApprovalLimitConfig> {
    try {
      // Try to fetch from database
      const { items } = await BaseCrudService.getAll<ApprovalLimitConfig>(
        CollectionIds.ORGANISATIONS
      );
      
      const config = items?.find(item => (item as any).organisationId === organisationId);
      if (config) {
        return config as ApprovalLimitConfig;
      }

      // Return default if not found
      return { ...DEFAULT_APPROVAL_LIMITS, organisationId };
    } catch (error) {
      console.error('Error fetching approval limit config:', error);
      return { ...DEFAULT_APPROVAL_LIMITS, organisationId };
    }
  }

  /**
   * Get approval limit for a specific role
   */
  static async getApprovalLimitForRole(
    organisationId: string,
    roleId: string
  ): Promise<number> {
    const config = await this.getApprovalLimitConfig(organisationId);
    return config.roleApprovalLimits[roleId] || 0;
  }

  /**
   * Determine if loan amount requires escalation
   */
  static async determineApprovalEscalation(
    loanAmount: number,
    approverRoleId: string,
    organisationId: string,
    isHighRisk: boolean = false,
    isPolicyException: boolean = false
  ): Promise<ApprovalEscalationResult> {
    try {
      const config = await this.getApprovalLimitConfig(organisationId);
      const approverLimit = config.roleApprovalLimits[approverRoleId] || 0;

      // Check if amount exceeds approver's limit
      if (loanAmount > approverLimit) {
        // Determine next approver
        const nextApprover = this.getNextApprover(approverRoleId, loanAmount, config);
        
        return {
          requiresApproval: true,
          approverRoleId: nextApprover,
          requiresCommittee: loanAmount > config.escalationRules.requiresCommitteeAbove,
          requiresCEO: loanAmount > config.escalationRules.requiresCEOAbove,
          escalationReason: `Amount ZMW ${loanAmount.toLocaleString()} exceeds ${approverRoleId} limit of ZMW ${approverLimit.toLocaleString()}`,
        };
      }

      // Check if high-risk or policy exception requires escalation
      if (isHighRisk || isPolicyException) {
        return {
          requiresApproval: true,
          approverRoleId: 'credit-manager',
          requiresCommittee: isHighRisk && loanAmount > config.escalationRules.requiresCommitteeAbove,
          requiresCEO: false,
          escalationReason: isHighRisk ? 'High-risk loan requires credit manager review' : 'Policy exception requires approval',
        };
      }

      return {
        requiresApproval: false,
        approverRoleId: null,
        requiresCommittee: false,
        requiresCEO: false,
        escalationReason: 'No escalation required',
      };
    } catch (error) {
      console.error('Error determining approval escalation:', error);
      return {
        requiresApproval: true,
        approverRoleId: 'credit-manager',
        requiresCommittee: false,
        requiresCEO: false,
        escalationReason: 'Error in escalation logic - defaulting to credit manager',
      };
    }
  }

  /**
   * Get next approver based on amount and current approver
   */
  private static getNextApprover(
    currentRoleId: string,
    loanAmount: number,
    config: ApprovalLimitConfig
  ): string {
    const approverHierarchy = [
      'loan-officer',
      'branch-manager',
      'credit-manager',
      'ceo',
    ];

    const currentIndex = approverHierarchy.indexOf(currentRoleId);
    
    // Find next approver with sufficient limit
    for (let i = currentIndex + 1; i < approverHierarchy.length; i++) {
      const roleId = approverHierarchy[i];
      const limit = config.roleApprovalLimits[roleId] || 0;
      if (loanAmount <= limit) {
        return roleId;
      }
    }

    // Default to CEO if no other approver has sufficient limit
    return 'ceo';
  }

  /**
   * Check if staff member can approve loan amount
   */
  static async canApproveAmount(
    staffMemberId: string,
    loanAmount: number,
    organisationId: string,
    staffRoleId: string
  ): Promise<boolean> {
    try {
      const approvalLimit = await this.getApprovalLimitForRole(organisationId, staffRoleId);
      return loanAmount <= approvalLimit;
    } catch (error) {
      console.error('Error checking approval amount:', error);
      return false;
    }
  }

  /**
   * Update approval limit for a role
   */
  static async updateApprovalLimit(
    organisationId: string,
    roleId: string,
    newLimit: number
  ): Promise<void> {
    try {
      const config = await this.getApprovalLimitConfig(organisationId);
      config.roleApprovalLimits[roleId] = newLimit;

      // Update in database
      await BaseCrudService.update(CollectionIds.ORGANISATIONS, {
        _id: config._id,
        roleApprovalLimits: config.roleApprovalLimits,
      });
    } catch (error) {
      console.error('Error updating approval limit:', error);
      throw error;
    }
  }

  /**
   * Update escalation rules
   */
  static async updateEscalationRules(
    organisationId: string,
    rules: {
      singleApproverLimit?: number;
      requiresCommitteeAbove?: number;
      requiresCEOAbove?: number;
    }
  ): Promise<void> {
    try {
      const config = await this.getApprovalLimitConfig(organisationId);
      config.escalationRules = {
        ...config.escalationRules,
        ...rules,
      };

      await BaseCrudService.update(CollectionIds.ORGANISATIONS, {
        _id: config._id,
        escalationRules: config.escalationRules,
      });
    } catch (error) {
      console.error('Error updating escalation rules:', error);
      throw error;
    }
  }

  /**
   * Get approval hierarchy for organization
   */
  static async getApprovalHierarchy(organisationId: string): Promise<Array<{
    roleId: string;
    roleName: string;
    limit: number;
  }>> {
    try {
      const config = await this.getApprovalLimitConfig(organisationId);
      const roles = RolePermissionsService.getApprovingRoles();

      return roles
        .map(role => ({
          roleId: role.roleId,
          roleName: role.roleName,
          limit: config.roleApprovalLimits[role.roleId] || 0,
        }))
        .sort((a, b) => a.limit - b.limit);
    } catch (error) {
      console.error('Error getting approval hierarchy:', error);
      return [];
    }
  }

  /**
   * Get escalation summary for a loan amount
   */
  static async getEscalationSummary(
    loanAmount: number,
    organisationId: string
  ): Promise<{
    requiresCommittee: boolean;
    requiresCEO: boolean;
    approvalPath: string[];
  }> {
    try {
      const config = await this.getApprovalLimitConfig(organisationId);
      const approvalPath: string[] = [];

      // Build approval path
      const roles = RolePermissionsService.getApprovingRoles()
        .sort((a, b) => (a.approvalLimit || 0) - (b.approvalLimit || 0));

      for (const role of roles) {
        const limit = config.roleApprovalLimits[role.roleId] || 0;
        if (loanAmount <= limit) {
          approvalPath.push(role.roleName);
          break;
        }
        approvalPath.push(role.roleName);
      }

      return {
        requiresCommittee: loanAmount > config.escalationRules.requiresCommitteeAbove,
        requiresCEO: loanAmount > config.escalationRules.requiresCEOAbove,
        approvalPath,
      };
    } catch (error) {
      console.error('Error getting escalation summary:', error);
      return {
        requiresCommittee: false,
        requiresCEO: false,
        approvalPath: [],
      };
    }
  }
}
