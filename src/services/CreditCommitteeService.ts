/**
 * Credit Committee Service
 * Manages credit committee workflows, voting, and decisions
 */

import { BaseCrudService } from '@/integrations';
import { CollectionIds } from './index';
import { AuditService } from './AuditService';
import { RolePermissionsService } from './RolePermissionsService';

export interface CommitteeMember {
  staffMemberId: string;
  staffName: string;
  roleId: string;
  roleName: string;
  email: string;
  hasVoted: boolean;
  vote?: 'approve' | 'reject' | 'defer';
  votedAt?: Date;
  comments?: string;
}

export interface CreditCommitteeSession {
  _id: string;
  organisationId: string;
  loanId: string;
  loanNumber: string;
  customerId: string;
  customerName: string;
  loanAmount: number;
  riskGrade: string;
  createdBy: string;
  createdAt: Date;
  
  // Committee composition
  chairperson: CommitteeMember;
  members: CommitteeMember[];
  
  // Voting
  votes: {
    approve: number;
    reject: number;
    defer: number;
  };
  decision?: 'approved' | 'rejected' | 'deferred';
  decisionDate?: Date;
  decisionReason?: string;
  
  // Metadata
  escalationReason: string;
  isHighRisk: boolean;
  isPolicyException: boolean;
  requiresUnanimous: boolean;
  
  // Minutes
  minutesGenerated: boolean;
  minutesUrl?: string;
  
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  _createdDate?: Date;
  _updatedDate?: Date;
}

export interface CommitteeVote {
  _id: string;
  sessionId: string;
  staffMemberId: string;
  vote: 'approve' | 'reject' | 'defer';
  comments?: string;
  votedAt: Date;
  _createdDate?: Date;
  _updatedDate?: Date;
}

export class CreditCommitteeService {
  /**
   * Create credit committee session
   */
  static async createCommitteeSession(
    loanId: string,
    loanNumber: string,
    customerId: string,
    customerName: string,
    loanAmount: number,
    riskGrade: string,
    organisationId: string,
    createdBy: string,
    escalationReason: string,
    isHighRisk: boolean = false,
    isPolicyException: boolean = false
  ): Promise<CreditCommitteeSession> {
    try {
      const sessionId = crypto.randomUUID();

      // Get committee members
      const { items: staffMembers } = await BaseCrudService.getAll<any>(
        CollectionIds.STAFF_MEMBERS
      );

      // Filter for committee members (CEO, Credit Manager, CFO, Risk Manager)
      const committeeRoles = ['ceo', 'credit-manager'];
      const committeeMembers = staffMembers?.filter(
        (staff: any) => committeeRoles.includes(staff.role?.toLowerCase())
      ) || [];

      if (committeeMembers.length === 0) {
        throw new Error('No committee members found for this organization');
      }

      // Designate chairperson (CEO if available, else Credit Manager)
      const chairperson = committeeMembers.find((m: any) => m.role === 'CEO') ||
        committeeMembers.find((m: any) => m.role === 'Credit Manager') ||
        committeeMembers[0];

      // Create member objects
      const members: CommitteeMember[] = committeeMembers.map((staff: any) => ({
        staffMemberId: staff._id,
        staffName: staff.fullName,
        roleId: staff.role?.toLowerCase(),
        roleName: staff.role,
        email: staff.email,
        hasVoted: false,
      }));

      const session: CreditCommitteeSession = {
        _id: sessionId,
        organisationId,
        loanId,
        loanNumber,
        customerId,
        customerName,
        loanAmount,
        riskGrade,
        createdBy,
        createdAt: new Date(),
        chairperson: {
          staffMemberId: chairperson._id,
          staffName: chairperson.fullName,
          roleId: chairperson.role?.toLowerCase(),
          roleName: chairperson.role,
          email: chairperson.email,
          hasVoted: false,
        },
        members,
        votes: {
          approve: 0,
          reject: 0,
          defer: 0,
        },
        escalationReason,
        isHighRisk,
        isPolicyException,
        requiresUnanimous: isHighRisk || isPolicyException,
        minutesGenerated: false,
        status: 'pending',
      };

      // Log to audit trail
      await AuditService.logAction({
        performedBy: createdBy,
        actionType: 'COMMITTEE_SESSION_CREATED',
        actionDetails: `Credit committee session created for loan ${loanNumber}`,
        resourceAffected: 'LOAN',
        resourceId: loanId,
      });

      return session;
    } catch (error) {
      console.error('Error creating committee session:', error);
      throw error;
    }
  }

  /**
   * Record committee member vote
   */
  static async recordVote(
    sessionId: string,
    staffMemberId: string,
    vote: 'approve' | 'reject' | 'defer',
    comments?: string,
    organisationId?: string
  ): Promise<void> {
    try {
      const voteId = crypto.randomUUID();

      // Create vote record
      const voteRecord: CommitteeVote = {
        _id: voteId,
        sessionId,
        staffMemberId,
        vote,
        comments,
        votedAt: new Date(),
      };

      // Log to audit trail
      await AuditService.logAction({
        performedBy: staffMemberId,
        actionType: 'COMMITTEE_VOTE_RECORDED',
        actionDetails: `Committee member voted: ${vote}${comments ? ` - ${comments}` : ''}`,
        resourceAffected: 'COMMITTEE_SESSION',
        resourceId: sessionId,
      });

      // Update session vote counts
      // This would be done in the database update
    } catch (error) {
      console.error('Error recording vote:', error);
      throw error;
    }
  }

  /**
   * Finalize committee decision
   */
  static async finalizeDecision(
    sessionId: string,
    decision: 'approved' | 'rejected' | 'deferred',
    decisionReason: string,
    finalizedBy: string
  ): Promise<void> {
    try {
      // Log decision
      await AuditService.logAction({
        performedBy: finalizedBy,
        actionType: 'COMMITTEE_DECISION_FINALIZED',
        actionDetails: `Committee decision: ${decision} - ${decisionReason}`,
        resourceAffected: 'COMMITTEE_SESSION',
        resourceId: sessionId,
      });

      // Update session status
      // This would be done in the database update
    } catch (error) {
      console.error('Error finalizing decision:', error);
      throw error;
    }
  }

  /**
   * Generate committee minutes
   */
  static async generateMinutes(
    sessionId: string,
    session: CreditCommitteeSession
  ): Promise<string> {
    try {
      const minutes = `
CREDIT COMMITTEE MEETING MINUTES

Session ID: ${sessionId}
Date: ${new Date().toLocaleDateString()}
Chairperson: ${session.chairperson.staffName}

LOAN DETAILS
Loan Number: ${session.loanNumber}
Customer: ${session.customerName}
Amount: ZMW ${session.loanAmount.toLocaleString()}
Risk Grade: ${session.riskGrade}

ESCALATION REASON
${session.escalationReason}

COMMITTEE MEMBERS
${session.members.map(m => `- ${m.staffName} (${m.roleName})`).join('\n')}

VOTING RESULTS
Approve: ${session.votes.approve}
Reject: ${session.votes.reject}
Defer: ${session.votes.defer}

DECISION
${session.decision?.toUpperCase() || 'PENDING'}
Reason: ${session.decisionReason || 'N/A'}

INDIVIDUAL VOTES
${session.members
  .filter(m => m.hasVoted)
  .map(m => `- ${m.staffName}: ${m.vote?.toUpperCase()} ${m.comments ? `(${m.comments})` : ''}`)
  .join('\n')}

Generated: ${new Date().toLocaleString()}
      `;

      return minutes;
    } catch (error) {
      console.error('Error generating minutes:', error);
      throw error;
    }
  }

  /**
   * Check if committee decision is final
   */
  static isDecisionFinal(session: CreditCommitteeSession): boolean {
    const totalMembers = session.members.length;
    const votedMembers = session.members.filter(m => m.hasVoted).length;

    if (votedMembers < totalMembers) {
      return false; // Not all members have voted
    }

    if (session.requiresUnanimous) {
      // For unanimous requirement, all must agree
      return session.votes.approve === totalMembers || session.votes.reject === totalMembers;
    } else {
      // For majority, more than half must agree
      const majority = Math.ceil(totalMembers / 2);
      return session.votes.approve >= majority || session.votes.reject >= majority;
    }
  }

  /**
   * Get committee decision
   */
  static getCommitteeDecision(session: CreditCommitteeSession): 'approved' | 'rejected' | 'deferred' | null {
    const totalMembers = session.members.length;

    if (session.requiresUnanimous) {
      if (session.votes.approve === totalMembers) return 'approved';
      if (session.votes.reject === totalMembers) return 'rejected';
      if (session.votes.defer > 0) return 'deferred';
    } else {
      const majority = Math.ceil(totalMembers / 2);
      if (session.votes.approve >= majority) return 'approved';
      if (session.votes.reject >= majority) return 'rejected';
      if (session.votes.defer > 0) return 'deferred';
    }

    return null;
  }

  /**
   * Get pending committee sessions
   */
  static async getPendingCommitteeSessions(
    organisationId: string
  ): Promise<CreditCommitteeSession[]> {
    try {
      // This would fetch from database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching pending sessions:', error);
      return [];
    }
  }

  /**
   * Get committee session by ID
   */
  static async getCommitteeSession(sessionId: string): Promise<CreditCommitteeSession | null> {
    try {
      // This would fetch from database
      return null;
    } catch (error) {
      console.error('Error fetching committee session:', error);
      return null;
    }
  }

  /**
   * Cancel committee session
   */
  static async cancelSession(
    sessionId: string,
    reason: string,
    cancelledBy: string
  ): Promise<void> {
    try {
      await AuditService.logAction({
        performedBy: cancelledBy,
        actionType: 'COMMITTEE_SESSION_CANCELLED',
        actionDetails: `Committee session cancelled: ${reason}`,
        resourceAffected: 'COMMITTEE_SESSION',
        resourceId: sessionId,
      });
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  /**
   * Get committee members for organization
   */
  static async getCommitteeMembers(organisationId: string): Promise<CommitteeMember[]> {
    try {
      const { items: staffMembers } = await BaseCrudService.getAll<any>(
        CollectionIds.STAFF_MEMBERS
      );

      const committeeRoles = ['ceo', 'credit-manager'];
      const committeeMembers = staffMembers?.filter(
        (staff: any) => committeeRoles.includes(staff.role?.toLowerCase())
      ) || [];

      return committeeMembers.map((staff: any) => ({
        staffMemberId: staff._id,
        staffName: staff.fullName,
        roleId: staff.role?.toLowerCase(),
        roleName: staff.role,
        email: staff.email,
        hasVoted: false,
      }));
    } catch (error) {
      console.error('Error fetching committee members:', error);
      return [];
    }
  }

  /**
   * Check if staff member can vote in committee
   */
  static canVoteInCommittee(staffMemberId: string, session: CreditCommitteeSession): boolean {
    return session.members.some(m => m.staffMemberId === staffMemberId);
  }

  /**
   * Check if staff member has already voted
   */
  static hasAlreadyVoted(staffMemberId: string, session: CreditCommitteeSession): boolean {
    const member = session.members.find(m => m.staffMemberId === staffMemberId);
    return member?.hasVoted || false;
  }
}
