/**
 * Customer Invitation Service
 * Manages customer invitation tracking and reminders
 */

import { BaseCrudService } from './BaseCrudService';
import { AuditService } from './AuditService';
import { EmailService } from './EmailService';
import { CustomerInvitations, CustomerProfiles } from '@/entities';

export class CustomerInvitationService {
  private static readonly REMINDER_INTERVAL_DAYS = 3;
  private static readonly FINAL_REMINDER_DAYS = 7;

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string): Promise<CustomerInvitations | null> {
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitations>(
      'customerinvitations'
    );
    return invitations?.find((inv) => inv.invitationToken === token) || null;
  }

  /**
   * Get invitations for customer
   */
  static async getCustomerInvitations(customerId: string): Promise<CustomerInvitations[]> {
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitations>(
      'customerinvitations'
    );
    return invitations?.filter((inv) => inv.customerId === customerId) || [];
  }

  /**
   * Get pending invitations for organization
   */
  static async getOrganizationPendingInvitations(
    organisationId: string
  ): Promise<CustomerInvitations[]> {
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitations>(
      'customerinvitations'
    );
    return (
      invitations?.filter(
        (inv) => inv.organisationId === organisationId && inv.status === 'PENDING'
      ) || []
    );
  }

  /**
   * Get invitations needing reminder
   */
  static async getInvitationsNeedingReminder(): Promise<CustomerInvitations[]> {
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitations>(
      'customerinvitations'
    );

    const now = new Date();
    const reminderThreshold = new Date(now.getTime() - this.REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

    return (
      invitations?.filter((inv) => {
        if (inv.status !== 'PENDING') return false;
        if (!inv.sentDate) return false;

        const sentDate = new Date(inv.sentDate);
        return sentDate <= reminderThreshold;
      }) || []
    );
  }

  /**
   * Send reminder for pending invitation
   */
  static async sendReminderEmail(
    invitationId: string,
    organisationId: string,
    performedBy: string
  ): Promise<void> {
    const invitation = await BaseCrudService.getById<CustomerInvitations>(
      'customerinvitations',
      invitationId
    );

    if (!invitation || invitation.status !== 'PENDING') {
      throw new Error('Invitation not found or not pending');
    }

    // Get customer details
    const customer = await BaseCrudService.getById<CustomerProfiles>(
      'customers',
      invitation.customerId || ''
    );

    if (!customer || !customer.emailAddress) {
      throw new Error('Customer or email not found');
    }

    // Send reminder email
    const signupLink = `${window.location.origin}/customer-signup?token=${invitation.invitationToken}`;
    await EmailService.sendCustomerInvite(
      customer.emailAddress,
      customer.firstName || 'Customer',
      signupLink
    );

    // Update invitation
    const emailSentCount = (invitation.emailSentCount || 0) + 1;
    await BaseCrudService.update<CustomerInvitations>('customerinvitations', {
      _id: invitationId,
      emailSentCount,
      sentDate: new Date(),
    });

    // Log reminder
    await AuditService.logAction({
      actionType: 'INVITATION_REMINDER_SENT',
      actionDetails: `Invitation reminder sent (count: ${emailSentCount})`,
      resourceAffected: 'CUSTOMER_INVITATION',
      resourceId: invitationId,
      performedBy,
      organisationId,
    });
  }

  /**
   * Revoke invitation
   */
  static async revokeInvitation(
    invitationId: string,
    organisationId: string,
    performedBy: string,
    reason?: string
  ): Promise<void> {
    const invitation = await BaseCrudService.getById<CustomerInvitations>(
      'customerinvitations',
      invitationId
    );

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Update invitation status
    await BaseCrudService.update<CustomerInvitations>('customerinvitations', {
      _id: invitationId,
      status: 'REVOKED',
      notes: reason || 'Revoked by admin',
    });

    // Log revocation
    await AuditService.logAction({
      actionType: 'INVITATION_REVOKED',
      actionDetails: `Invitation revoked: ${reason || 'No reason provided'}`,
      resourceAffected: 'CUSTOMER_INVITATION',
      resourceId: invitationId,
      performedBy,
      organisationId,
    });
  }

  /**
   * Get invitation statistics for organization
   */
  static async getInvitationStats(organisationId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    revoked: number;
  }> {
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitations>(
      'customerinvitations'
    );

    const orgInvitations = invitations?.filter((inv) => inv.organisationId === organisationId) || [];

    return {
      total: orgInvitations.length,
      pending: orgInvitations.filter((inv) => inv.status === 'PENDING').length,
      accepted: orgInvitations.filter((inv) => inv.status === 'ACCEPTED').length,
      expired: orgInvitations.filter((inv) => inv.status === 'EXPIRED').length,
      revoked: orgInvitations.filter((inv) => inv.status === 'REVOKED').length,
    };
  }

  /**
   * Check if invitation is valid
   */
  static async isInvitationValid(token: string): Promise<boolean> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) return false;

    if (invitation.status !== 'PENDING') return false;

    const now = new Date();
    const expiryDate = new Date(invitation.expiryDate || 0);

    return now <= expiryDate;
  }

  /**
   * Get invitation expiry status
   */
  static getInvitationExpiryStatus(invitation: CustomerInvitations): {
    status: 'valid' | 'expiring-soon' | 'expired';
    daysRemaining: number;
  } {
    const now = new Date();
    const expiryDate = new Date(invitation.expiryDate || 0);
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { status: 'expired', daysRemaining: 0 };
    } else if (daysRemaining <= 2) {
      return { status: 'expiring-soon', daysRemaining };
    } else {
      return { status: 'valid', daysRemaining };
    }
  }

  /**
   * Bulk send invitations
   */
  static async bulkSendInvitations(
    customerIds: string[],
    organisationId: string,
    performedBy: string
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    for (const customerId of customerIds) {
      try {
        const customer = await BaseCrudService.getById<CustomerProfiles>(
          'customers',
          customerId
        );

        if (!customer) {
          errors.push(`Customer ${customerId} not found`);
          failed++;
          continue;
        }

        // Check if invitation already exists
        const existingInvitations = await this.getCustomerInvitations(customerId);
        const pendingInvitation = existingInvitations.find((inv) => inv.status === 'PENDING');

        if (pendingInvitation) {
          errors.push(`Customer ${customerId} already has a pending invitation`);
          failed++;
          continue;
        }

        // Send invitation
        const invitationToken = this.generateInvitationToken();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        const invitationId = crypto.randomUUID();
        const invitation: CustomerInvitations = {
          _id: invitationId,
          customerId,
          organisationId,
          invitationToken,
          invitationEmail: customer.emailAddress,
          invitationType: 'EMAIL',
          status: 'PENDING',
          sentDate: new Date(),
          expiryDate,
          emailSentCount: 1,
          smsSentCount: 0,
          maxAttempts: 3,
          createdBy: performedBy,
        };

        await BaseCrudService.create<CustomerInvitations>('customerinvitations', invitation);

        if (customer.emailAddress) {
          const signupLink = `${window.location.origin}/customer-signup?token=${invitationToken}`;
          await EmailService.sendCustomerInvite(
            customer.emailAddress,
            customer.firstName || 'Customer',
            signupLink
          );
        }

        successful++;
      } catch (error) {
        errors.push(`Failed to send invitation to customer ${customerId}`);
        failed++;
      }
    }

    return { successful, failed, errors };
  }

  /**
   * Generate invitation token
   */
  private static generateInvitationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    for (let i = 0; i < 32; i++) {
      token += chars[array[i] % chars.length];
    }
    return token;
  }
}
