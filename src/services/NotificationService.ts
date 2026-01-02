/**
 * Notification Service
 * Handles SMS and Email notifications for repayments
 */

import { BaseCrudService } from './BaseCrudService';
import { Loans, CustomerProfiles } from '@/entities';

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  emailBody: string;
  smsBody: string;
  variables: string[];
}

export interface NotificationLog {
  _id: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  type: 'EMAIL' | 'SMS';
  templateId: string;
  subject?: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentDate?: Date;
  failureReason?: string;
  loanId?: string;
  organisationId: string;
}

export class NotificationService {
  /**
   * Predefined notification templates
   */
  static readonly TEMPLATES: Record<string, NotificationTemplate> = {
    REPAYMENT_CONFIRMATION: {
      id: 'repayment_confirmation',
      name: 'Repayment Confirmation',
      subject: 'Repayment Received - {{loanNumber}}',
      emailBody: `Dear {{customerName}},

Your repayment of ZMW {{amount}} for loan {{loanNumber}} has been successfully received on {{paymentDate}}.

Payment Details:
- Loan Number: {{loanNumber}}
- Amount Paid: ZMW {{amount}}
- Payment Date: {{paymentDate}}
- Payment Method: {{paymentMethod}}
- Reference: {{referenceNumber}}

Outstanding Balance: ZMW {{outstandingBalance}}
Next Payment Due: {{nextPaymentDate}}

Thank you for your timely payment.

Best regards,
Finance Team`,
      smsBody: `Payment confirmed for {{loanNumber}}: ZMW {{amount}} received on {{paymentDate}}. Outstanding: ZMW {{outstandingBalance}}. Ref: {{referenceNumber}}`,
      variables: [
        'customerName',
        'loanNumber',
        'amount',
        'paymentDate',
        'paymentMethod',
        'referenceNumber',
        'outstandingBalance',
        'nextPaymentDate',
      ],
    },

    PAYMENT_REMINDER: {
      id: 'payment_reminder',
      name: 'Payment Reminder',
      subject: 'Payment Reminder - {{loanNumber}}',
      emailBody: `Dear {{customerName}},

This is a friendly reminder that your loan payment is due.

Loan Details:
- Loan Number: {{loanNumber}}
- Amount Due: ZMW {{amountDue}}
- Due Date: {{dueDate}}
- Days Overdue: {{daysOverdue}}

Please make your payment at your earliest convenience to avoid penalties.

Payment Methods:
- Cash: Visit our office
- Bank Transfer: Account details available on our website
- Mobile Money: Use code {{mobileMoneyCode}}

Best regards,
Finance Team`,
      smsBody: `Reminder: Payment of ZMW {{amountDue}} is due for {{loanNumber}}. Days overdue: {{daysOverdue}}. Please pay to avoid penalties.`,
      variables: [
        'customerName',
        'loanNumber',
        'amountDue',
        'dueDate',
        'daysOverdue',
        'mobileMoneyCode',
      ],
    },

    OVERDUE_NOTICE: {
      id: 'overdue_notice',
      name: 'Overdue Notice',
      subject: 'URGENT: Overdue Payment - {{loanNumber}}',
      emailBody: `Dear {{customerName}},

Your loan payment is now OVERDUE.

Loan Details:
- Loan Number: {{loanNumber}}
- Amount Due: ZMW {{amountDue}}
- Days Overdue: {{daysOverdue}}
- Penalties Accrued: ZMW {{penalties}}

Immediate action is required to avoid further penalties and legal action.

Please contact our office immediately to arrange payment.

Contact: {{contactPhone}} | {{contactEmail}}

Best regards,
Finance Team`,
      smsBody: `URGENT: Payment overdue for {{loanNumber}}. Amount: ZMW {{amountDue}}. Days overdue: {{daysOverdue}}. Penalties: ZMW {{penalties}}. Contact us immediately.`,
      variables: [
        'customerName',
        'loanNumber',
        'amountDue',
        'daysOverdue',
        'penalties',
        'contactPhone',
        'contactEmail',
      ],
    },

    LOAN_CLOSED: {
      id: 'loan_closed',
      name: 'Loan Closed Notification',
      subject: 'Loan Closed - {{loanNumber}}',
      emailBody: `Dear {{customerName}},

Congratulations! Your loan has been fully repaid and closed.

Loan Details:
- Loan Number: {{loanNumber}}
- Total Amount Paid: ZMW {{totalPaid}}
- Closure Date: {{closureDate}}

Thank you for your business. We look forward to serving you again.

Best regards,
Finance Team`,
      smsBody: `Loan {{loanNumber}} has been closed. Total paid: ZMW {{totalPaid}}. Thank you for your business.`,
      variables: ['customerName', 'loanNumber', 'totalPaid', 'closureDate'],
    },

    PENALTY_WAIVER_APPROVED: {
      id: 'penalty_waiver_approved',
      name: 'Penalty Waiver Approved',
      subject: 'Penalty Waiver Approved - {{loanNumber}}',
      emailBody: `Dear {{customerName}},

Your request for penalty waiver has been APPROVED.

Details:
- Loan Number: {{loanNumber}}
- Original Penalties: ZMW {{originalPenalties}}
- Waived Amount: ZMW {{waivedAmount}}
- New Outstanding: ZMW {{newOutstanding}}
- Approval Date: {{approvalDate}}

Thank you for your patience.

Best regards,
Finance Team`,
      smsBody: `Penalty waiver approved for {{loanNumber}}. Waived: ZMW {{waivedAmount}}. New outstanding: ZMW {{newOutstanding}}.`,
      variables: [
        'customerName',
        'loanNumber',
        'originalPenalties',
        'waivedAmount',
        'newOutstanding',
        'approvalDate',
      ],
    },
  };

  /**
   * Send repayment confirmation notification
   */
  static async sendRepaymentConfirmation(
    customerId: string,
    loanId: string,
    amount: number,
    paymentDate: string,
    paymentMethod: string,
    referenceNumber: string,
    organisationId: string,
    sendEmail: boolean = true,
    sendSMS: boolean = true
  ): Promise<void> {
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);

    if (!customer || !loan) {
      throw new Error('Customer or loan not found');
    }

    const template = this.TEMPLATES.REPAYMENT_CONFIRMATION;
    const variables = {
      customerName: `${customer.firstName} ${customer.lastName}`,
      loanNumber: loan.loanNumber,
      amount: amount.toLocaleString(),
      paymentDate,
      paymentMethod,
      referenceNumber,
      outstandingBalance: (loan.outstandingBalance || 0).toLocaleString(),
      nextPaymentDate: loan.nextPaymentDate
        ? new Date(loan.nextPaymentDate).toLocaleDateString()
        : 'N/A',
    };

    if (sendEmail && customer.emailAddress) {
      await this.sendEmail(
        customer._id,
        customer.emailAddress,
        template.subject,
        template.emailBody,
        variables,
        loanId,
        organisationId
      );
    }

    if (sendSMS && customer.phoneNumber) {
      await this.sendSMS(
        customer._id,
        customer.phoneNumber,
        template.smsBody,
        variables,
        loanId,
        organisationId
      );
    }
  }

  /**
   * Send payment reminder
   */
  static async sendPaymentReminder(
    customerId: string,
    loanId: string,
    amountDue: number,
    dueDate: string,
    daysOverdue: number,
    organisationId: string,
    sendEmail: boolean = true,
    sendSMS: boolean = true
  ): Promise<void> {
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);

    if (!customer || !loan) {
      throw new Error('Customer or loan not found');
    }

    const template = this.TEMPLATES.PAYMENT_REMINDER;
    const variables = {
      customerName: `${customer.firstName} ${customer.lastName}`,
      loanNumber: loan.loanNumber,
      amountDue: amountDue.toLocaleString(),
      dueDate,
      daysOverdue: daysOverdue.toString(),
      mobileMoneyCode: 'LOANPAY',
    };

    if (sendEmail && customer.emailAddress) {
      await this.sendEmail(
        customer._id,
        customer.emailAddress,
        template.subject,
        template.emailBody,
        variables,
        loanId,
        organisationId
      );
    }

    if (sendSMS && customer.phoneNumber) {
      await this.sendSMS(
        customer._id,
        customer.phoneNumber,
        template.smsBody,
        variables,
        loanId,
        organisationId
      );
    }
  }

  /**
   * Send overdue notice
   */
  static async sendOverdueNotice(
    customerId: string,
    loanId: string,
    amountDue: number,
    daysOverdue: number,
    penalties: number,
    organisationId: string,
    contactPhone: string = '+260 1 234567',
    contactEmail: string = 'finance@company.com'
  ): Promise<void> {
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);

    if (!customer || !loan) {
      throw new Error('Customer or loan not found');
    }

    const template = this.TEMPLATES.OVERDUE_NOTICE;
    const variables = {
      customerName: `${customer.firstName} ${customer.lastName}`,
      loanNumber: loan.loanNumber,
      amountDue: amountDue.toLocaleString(),
      daysOverdue: daysOverdue.toString(),
      penalties: penalties.toLocaleString(),
      contactPhone,
      contactEmail,
    };

    if (customer.emailAddress) {
      await this.sendEmail(
        customer._id,
        customer.emailAddress,
        template.subject,
        template.emailBody,
        variables,
        loanId,
        organisationId
      );
    }

    if (customer.phoneNumber) {
      await this.sendSMS(
        customer._id,
        customer.phoneNumber,
        template.smsBody,
        variables,
        loanId,
        organisationId
      );
    }
  }

  /**
   * Send loan closed notification
   */
  static async sendLoanClosedNotification(
    customerId: string,
    loanId: string,
    totalPaid: number,
    closureDate: string,
    organisationId: string
  ): Promise<void> {
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);

    if (!customer || !loan) {
      throw new Error('Customer or loan not found');
    }

    const template = this.TEMPLATES.LOAN_CLOSED;
    const variables = {
      customerName: `${customer.firstName} ${customer.lastName}`,
      loanNumber: loan.loanNumber,
      totalPaid: totalPaid.toLocaleString(),
      closureDate,
    };

    if (customer.emailAddress) {
      await this.sendEmail(
        customer._id,
        customer.emailAddress,
        template.subject,
        template.emailBody,
        variables,
        loanId,
        organisationId
      );
    }

    if (customer.phoneNumber) {
      await this.sendSMS(
        customer._id,
        customer.phoneNumber,
        template.smsBody,
        variables,
        loanId,
        organisationId
      );
    }
  }

  /**
   * Send penalty waiver approval notification
   */
  static async sendPenaltyWaiverApproved(
    customerId: string,
    loanId: string,
    originalPenalties: number,
    waivedAmount: number,
    newOutstanding: number,
    organisationId: string
  ): Promise<void> {
    const customer = await BaseCrudService.getById<CustomerProfiles>('customers', customerId);
    const loan = await BaseCrudService.getById<Loans>('loans', loanId);

    if (!customer || !loan) {
      throw new Error('Customer or loan not found');
    }

    const template = this.TEMPLATES.PENALTY_WAIVER_APPROVED;
    const variables = {
      customerName: `${customer.firstName} ${customer.lastName}`,
      loanNumber: loan.loanNumber,
      originalPenalties: originalPenalties.toLocaleString(),
      waivedAmount: waivedAmount.toLocaleString(),
      newOutstanding: newOutstanding.toLocaleString(),
      approvalDate: new Date().toLocaleDateString(),
    };

    if (customer.emailAddress) {
      await this.sendEmail(
        customer._id,
        customer.emailAddress,
        template.subject,
        template.emailBody,
        variables,
        loanId,
        organisationId
      );
    }

    if (customer.phoneNumber) {
      await this.sendSMS(
        customer._id,
        customer.phoneNumber,
        template.smsBody,
        variables,
        loanId,
        organisationId
      );
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmail(
    recipientId: string,
    email: string,
    subject: string,
    body: string,
    variables: Record<string, string>,
    loanId?: string,
    organisationId?: string
  ): Promise<void> {
    // Replace variables in body
    let processedBody = body;
    Object.entries(variables).forEach(([key, value]) => {
      processedBody = processedBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    let processedSubject = subject;
    Object.entries(variables).forEach(([key, value]) => {
      processedSubject = processedSubject.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Log notification
    const logId = crypto.randomUUID();
    const log: NotificationLog = {
      _id: logId,
      recipientId,
      recipientEmail: email,
      type: 'EMAIL',
      templateId: 'custom',
      subject: processedSubject,
      body: processedBody,
      status: 'SENT',
      sentDate: new Date(),
      loanId,
      organisationId: organisationId || '',
    };

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Email sent:', log);
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(
    recipientId: string,
    phone: string,
    body: string,
    variables: Record<string, string>,
    loanId?: string,
    organisationId?: string
  ): Promise<void> {
    // Replace variables in body
    let processedBody = body;
    Object.entries(variables).forEach(([key, value]) => {
      processedBody = processedBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Truncate to SMS length
    if (processedBody.length > 160) {
      processedBody = processedBody.substring(0, 157) + '...';
    }

    // Log notification
    const logId = crypto.randomUUID();
    const log: NotificationLog = {
      _id: logId,
      recipientId,
      recipientPhone: phone,
      type: 'SMS',
      templateId: 'custom',
      body: processedBody,
      status: 'SENT',
      sentDate: new Date(),
      loanId,
      organisationId: organisationId || '',
    };

    // In production, integrate with SMS service (Twilio, Africa's Talking, etc.)
    console.log('SMS sent:', log);
  }
}
