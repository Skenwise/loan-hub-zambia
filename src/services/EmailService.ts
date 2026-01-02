/**
 * Email Service
 * Handles email notifications for customer invites, password resets, and reminders
 * Note: This is a mock implementation. In production, integrate with SendGrid, AWS SES, etc.
 */

export interface EmailTemplate {
  subject: string;
  body: string;
  htmlBody?: string;
}

export class EmailService {
  /**
   * Send customer invitation email
   */
  static async sendCustomerInvite(
    email: string,
    firstName: string,
    temporaryPassword: string,
    loginUrl: string = 'https://zamloan.com/customer-login'
  ): Promise<boolean> {
    try {
      const template = this.getCustomerInviteTemplate(firstName, email, temporaryPassword, loginUrl);
      return await this.sendEmail(email, template);
    } catch (error) {
      console.error('Error sending customer invite:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    email: string,
    firstName: string,
    resetLink: string
  ): Promise<boolean> {
    try {
      const template = this.getPasswordResetTemplate(firstName, resetLink);
      return await this.sendEmail(email, template);
    } catch (error) {
      console.error('Error sending password reset:', error);
      return false;
    }
  }

  /**
   * Send KYC reminder email
   */
  static async sendKYCReminder(
    email: string,
    firstName: string,
    kycUrl: string = 'https://zamloan.com/customer-portal/kyc'
  ): Promise<boolean> {
    try {
      const template = this.getKYCReminderTemplate(firstName, kycUrl);
      return await this.sendEmail(email, template);
    } catch (error) {
      console.error('Error sending KYC reminder:', error);
      return false;
    }
  }

  /**
   * Send KYC approval notification
   */
  static async sendKYCApprovalNotification(
    email: string,
    firstName: string
  ): Promise<boolean> {
    try {
      const template = this.getKYCApprovalTemplate(firstName);
      return await this.sendEmail(email, template);
    } catch (error) {
      console.error('Error sending KYC approval notification:', error);
      return false;
    }
  }

  /**
   * Send KYC rejection notification
   */
  static async sendKYCRejectionNotification(
    email: string,
    firstName: string,
    reason: string
  ): Promise<boolean> {
    try {
      const template = this.getKYCRejectionTemplate(firstName, reason);
      return await this.sendEmail(email, template);
    } catch (error) {
      console.error('Error sending KYC rejection notification:', error);
      return false;
    }
  }

  /**
   * Send loan application status email
   */
  static async sendLoanApplicationStatus(
    email: string,
    firstName: string,
    loanNumber: string,
    status: string
  ): Promise<boolean> {
    try {
      const template = this.getLoanApplicationStatusTemplate(firstName, loanNumber, status);
      return await this.sendEmail(email, template);
    } catch (error) {
      console.error('Error sending loan application status:', error);
      return false;
    }
  }

  /**
   * Generic email send (mock implementation)
   */
  private static async sendEmail(email: string, template: EmailTemplate): Promise<boolean> {
    try {
      // Mock implementation - logs to console
      console.log(`📧 Email sent to ${email}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Body: ${template.body}`);

      // In production, integrate with email service:
      // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     personalizations: [{ to: [{ email }] }],
      //     from: { email: 'noreply@zamloan.com' },
      //     subject: template.subject,
      //     content: [{ type: 'text/html', value: template.htmlBody || template.body }],
      //   }),
      // });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Email templates
   */

  private static getCustomerInviteTemplate(
    firstName: string,
    email: string,
    temporaryPassword: string,
    loginUrl: string
  ): EmailTemplate {
    return {
      subject: 'Welcome to ZamLoan - Your Account is Ready',
      body: `
Dear ${firstName},

Welcome to ZamLoan! Your account has been created and is ready to use.

Your Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

Please log in at: ${loginUrl}

For security, you will be prompted to change your password on first login.

If you have any questions, please contact our support team.

Best regards,
ZamLoan Team
      `,
      htmlBody: `
<h2>Welcome to ZamLoan!</h2>
<p>Dear ${firstName},</p>
<p>Your account has been created and is ready to use.</p>
<h3>Your Login Credentials:</h3>
<ul>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Temporary Password:</strong> ${temporaryPassword}</li>
</ul>
<p><a href="${loginUrl}" style="background-color: #B9E54F; color: #0D3B47; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Log In Now</a></p>
<p>For security, you will be prompted to change your password on first login.</p>
      `,
    };
  }

  private static getPasswordResetTemplate(firstName: string, resetLink: string): EmailTemplate {
    return {
      subject: 'Reset Your ZamLoan Password',
      body: `
Dear ${firstName},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
ZamLoan Team
      `,
    };
  }

  private static getKYCReminderTemplate(firstName: string, kycUrl: string): EmailTemplate {
    return {
      subject: 'Complete Your KYC Verification - ZamLoan',
      body: `
Dear ${firstName},

To access all features of ZamLoan, please complete your KYC (Know Your Customer) verification.

This is a quick process that helps us verify your identity and comply with regulations.

Complete KYC: ${kycUrl}

Thank you,
ZamLoan Team
      `,
    };
  }

  private static getKYCApprovalTemplate(firstName: string): EmailTemplate {
    return {
      subject: 'KYC Verification Approved - ZamLoan',
      body: `
Dear ${firstName},

Great news! Your KYC verification has been approved.

You now have full access to ZamLoan and can apply for loans.

Log in to get started: https://zamloan.com/customer-portal

Best regards,
ZamLoan Team
      `,
    };
  }

  private static getKYCRejectionTemplate(firstName: string, reason: string): EmailTemplate {
    return {
      subject: 'KYC Verification Status - ZamLoan',
      body: `
Dear ${firstName},

Your KYC verification could not be approved at this time.

Reason: ${reason}

Please contact our support team for more information or to resubmit your documents.

Best regards,
ZamLoan Team
      `,
    };
  }

  private static getLoanApplicationStatusTemplate(
    firstName: string,
    loanNumber: string,
    status: string
  ): EmailTemplate {
    const statusMessage = {
      'pending-approval': 'Your loan application is under review.',
      'approved': 'Congratulations! Your loan application has been approved.',
      'rejected': 'Unfortunately, your loan application was not approved.',
      'disbursed': 'Your loan has been disbursed. Check your account for details.',
    }[status] || 'Your loan application status has been updated.';

    return {
      subject: `Loan Application Update - ${loanNumber}`,
      body: `
Dear ${firstName},

${statusMessage}

Loan Number: ${loanNumber}
Status: ${status}

Log in to view details: https://zamloan.com/customer-portal/loans

Best regards,
ZamLoan Team
      `,
    };
  }
}
