/**
 * Customer Onboarding Service
 * Manages customer creation, invitation, and activation workflows
 */

import { BaseCrudService } from './BaseCrudService';
import { EmailService } from './EmailService';
import { AuditService } from './AuditService';
import { CustomerProfiles, Organizations } from '@/entities';

export interface CustomerInvitation {
  _id: string;
  customerId: string;
  organisationId: string;
  invitationToken: string;
  invitationEmail: string;
  invitationPhone?: string;
  invitationType: 'EMAIL' | 'SMS' | 'BOTH';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  sentDate: Date;
  expiryDate: Date;
  acceptedDate?: Date;
  emailSentCount: number;
  smsSentCount: number;
  maxAttempts: number;
  createdBy: string;
  notes?: string;
}

export interface CustomerActivationLog {
  _id: string;
  customerId: string;
  organisationId: string;
  invitationSent: Date;
  emailVerified?: Date;
  phoneVerified?: Date;
  passwordSet?: Date;
  accountActivated?: Date;
  currentStep: 'INVITED' | 'EMAIL_VERIFIED' | 'PHONE_VERIFIED' | 'PASSWORD_SET' | 'ACTIVATED';
  completionPercentage: number;
  ipAddress?: string;
  userAgent?: string;
}

export class CustomerOnboardingService {
  private static readonly INVITATION_EXPIRY_DAYS = 7;
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Create a new customer with pending activation status
   */
  static async createCustomer(
    customerData: Omit<CustomerProfiles, '_id'>,
    organisationId: string,
    createdBy: string
  ): Promise<CustomerProfiles> {
    const customerId = crypto.randomUUID();

    const newCustomer: CustomerProfiles = {
      _id: customerId,
      ...customerData,
      organisationId,
      kycVerificationStatus: 'PENDING',
    };

    await BaseCrudService.create<CustomerProfiles>('customers', newCustomer);

    // Log creation
    await AuditService.logAction({
      actionType: 'CUSTOMER_CREATED',
      actionDetails: `Customer created: ${customerData.firstName} ${customerData.lastName}`,
      resourceAffected: 'CUSTOMER',
      resourceId: customerId,
      performedBy: createdBy,
      organisationId,
    });

    return newCustomer;
  }

  /**
   * Generate a secure invitation token
   */
  static generateInvitationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    for (let i = 0; i < this.TOKEN_LENGTH; i++) {
      token += chars[array[i] % chars.length];
    }
    return token;
  }

  /**
   * Send invitation to customer
   */
  static async sendInvitation(
    customerId: string,
    organisationId: string,
    invitationType: 'EMAIL' | 'SMS' | 'BOTH',
    createdBy: string
  ): Promise<CustomerInvitation> {
    // Get customer details
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    // Generate invitation token
    const invitationToken = this.generateInvitationToken();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.INVITATION_EXPIRY_DAYS);

    // Create invitation record
    const invitationId = crypto.randomUUID();
    const invitation: CustomerInvitation = {
      _id: invitationId,
      customerId,
      organisationId,
      invitationToken,
      invitationEmail: customer.emailAddress || '',
      invitationPhone: customer.phoneNumber,
      invitationType,
      status: 'PENDING',
      sentDate: new Date(),
      expiryDate,
      emailSentCount: 0,
      smsSentCount: 0,
      maxAttempts: 3,
      createdBy,
    };

    await BaseCrudService.create<CustomerInvitation>('customerinvitations', invitation);

    // Send invitation via email/SMS
    if (invitationType === 'EMAIL' || invitationType === 'BOTH') {
      if (customer.emailAddress) {
        const signupLink = `${window.location.origin}/customer-signup?token=${invitationToken}`;
        await EmailService.sendCustomerInvite(
          customer.emailAddress,
          customer.firstName || 'Customer',
          signupLink
        );
        invitation.emailSentCount = 1;
      }
    }

    if (invitationType === 'SMS' || invitationType === 'BOTH') {
      if (customer.phoneNumber) {
        const signupLink = `${window.location.origin}/customer-signup?token=${invitationToken}`;
        // TODO: Implement SMS service
        // await SMSService.sendInvitation(customer.phoneNumber, signupLink);
        invitation.smsSentCount = 1;
      }
    }

    // Update invitation with sent counts
    await BaseCrudService.update<CustomerInvitation>('customerinvitations', invitation);

    // Create activation log
    const logId = crypto.randomUUID();
    const activationLog: CustomerActivationLog = {
      _id: logId,
      customerId,
      organisationId,
      invitationSent: new Date(),
      currentStep: 'INVITED',
      completionPercentage: 10,
    };

    await BaseCrudService.create<CustomerActivationLog>('customeractivationlog', activationLog);

    // Log invitation
    await AuditService.logAction({
      actionType: 'INVITATION_SENT',
      actionDetails: `Invitation sent via ${invitationType} (expires: ${expiryDate.toISOString()})`,
      resourceAffected: 'CUSTOMER_INVITATION',
      resourceId: invitationId,
      performedBy: createdBy,
      organisationId,
    });

    return invitation;
  }

  /**
   * Verify invitation token and get customer details
   */
  static async verifyInvitationToken(token: string): Promise<{
    customer: CustomerProfiles;
    invitation: CustomerInvitation;
  } | null> {
    // Get invitation by token
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitation>(
      'customerinvitations'
    );

    const invitation = invitations?.find((inv) => inv.invitationToken === token);
    if (!invitation) {
      return null;
    }

    // Check if expired
    if (new Date() > new Date(invitation.expiryDate)) {
      // Mark as expired
      const updatedInvitation = { ...invitation, status: 'EXPIRED' as const };
      await BaseCrudService.update<CustomerInvitation>('customerinvitations', updatedInvitation);
      return null;
    }

    // Check if already accepted
    if (invitation.status === 'ACCEPTED') {
      return null;
    }

    // Get customer details
    const customer = await BaseCrudService.getById<CustomerProfiles>(
      'customers',
      invitation.customerId
    );
    if (!customer) {
      return null;
    }

    return { customer, invitation };
  }

  /**
   * Activate customer account after successful signup
   */
  static async activateCustomer(
    customerId: string,
    invitationToken: string,
    organisationId: string
  ): Promise<void> {
    // Verify token
    const verification = await this.verifyInvitationToken(invitationToken);
    if (!verification) {
      throw new Error('Invalid or expired invitation token');
    }

    // Update customer status
    await BaseCrudService.update<CustomerProfiles>('customers', {
      _id: customerId,
      kycVerificationStatus: 'VERIFIED',
    });

    // Update invitation status
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitation>(
      'customerinvitations'
    );
    const invitation = invitations?.find((inv) => inv.invitationToken === invitationToken);
    if (invitation) {
      const updatedInvitation = { 
        ...invitation, 
        status: 'ACCEPTED' as const, 
        acceptedDate: new Date() 
      };
      await BaseCrudService.update<CustomerInvitation>('customerinvitations', updatedInvitation);
    }

    // Update activation log
    const { items: logs } = await BaseCrudService.getAll<CustomerActivationLog>(
      'customeractivationlog'
    );
    const log = logs?.find((l) => l.customerId === customerId);
    if (log) {
      const updatedLog = {
        ...log,
        accountActivated: new Date(),
        currentStep: 'ACTIVATED' as const,
        completionPercentage: 100,
      };
      await BaseCrudService.update<CustomerActivationLog>('customeractivationlog', updatedLog);
    }

    // Log activation
    await AuditService.logAction({
      actionType: 'CUSTOMER_ACTIVATED',
      actionDetails: `Customer account activated on ${new Date().toISOString()}`,
      resourceAffected: 'CUSTOMER',
      resourceId: customerId,
      performedBy: customerId,
      organisationId,
    });
  }

  /**
   * Resend invitation to customer
   */
  static async resendInvitation(
    customerId: string,
    organisationId: string,
    createdBy: string
  ): Promise<CustomerInvitation> {
    // Get existing invitation
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitation>(
      'customerinvitations'
    );
    const existingInvitation = invitations?.find(
      (inv) => inv.customerId === customerId && inv.status === 'PENDING'
    );

    if (!existingInvitation) {
      throw new Error('No pending invitation found for this customer');
    }

    // Check if max attempts exceeded
    if (
      existingInvitation.emailSentCount + existingInvitation.smsSentCount >=
      existingInvitation.maxAttempts
    ) {
      throw new Error('Maximum invitation attempts exceeded');
    }

    // Resend invitation
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    if (customer.emailAddress) {
      const signupLink = `${window.location.origin}/customer-signup?token=${existingInvitation.invitationToken}`;
      await EmailService.sendCustomerInvite(
        customer.emailAddress,
        customer.firstName || 'Customer',
        signupLink
      );
    }

    // Update invitation
    existingInvitation.emailSentCount += 1;
    existingInvitation.sentDate = new Date();
    await BaseCrudService.update<CustomerInvitation>('customerinvitations', existingInvitation);

    // Log resend
    await AuditService.logAction({
      actionType: 'INVITATION_RESENT',
      actionDetails: `Invitation resent (attempt ${existingInvitation.emailSentCount})`,
      resourceAffected: 'CUSTOMER_INVITATION',
      resourceId: existingInvitation._id,
      performedBy: createdBy,
      organisationId,
    });

    return existingInvitation;
  }

  /**
   * Get customer activation status
   */
  static async getActivationStatus(customerId: string): Promise<CustomerActivationLog | null> {
    const { items: logs } = await BaseCrudService.getAll<CustomerActivationLog>(
      'customeractivationlog'
    );
    return logs?.find((l) => l.customerId === customerId) || null;
  }

  /**
   * Get pending invitations for an organization
   */
  static async getPendingInvitations(organisationId: string): Promise<CustomerInvitation[]> {
    const { items: invitations } = await BaseCrudService.getAll<CustomerInvitation>(
      'customerinvitations'
    );
    return (
      invitations?.filter(
        (inv) => inv.organisationId === organisationId && inv.status === 'PENDING'
      ) || []
    );
  }

  /**
   * Check if customer can access organization
   */
  static async validateCustomerOrganization(
    customerId: string,
    organisationId: string
  ): Promise<boolean> {
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    if (!customer) {
      return false;
    }

    return customer.organisationId === organisationId && customer.kycVerificationStatus === 'VERIFIED';
  }
}
