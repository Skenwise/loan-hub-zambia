/**
 * Email Service for sending verification emails and other notifications
 * This is a placeholder service that should be integrated with your email provider
 * (e.g., SendGrid, AWS SES, Mailgun, etc.)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send a verification code email
   */
  static async sendVerificationCodeEmail(
    email: string,
    code: string,
    recipientName?: string
  ): Promise<boolean> {
    const name = recipientName || 'User';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="letter-spacing: 5px; margin: 0; color: #333;">${code}</h1>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Email Verification Code',
      html,
      text: `Your verification code is: ${code}. This code will expire in 15 minutes.`,
    });
  }

  /**
   * Send a verification link email
   */
  static async sendVerificationLinkEmail(
    email: string,
    verificationLink: string,
    recipientName?: string
  ): Promise<boolean> {
    const name = recipientName || 'User';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Please click the link below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #3567fd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html,
      text: `Please verify your email by clicking this link: ${verificationLink}`,
    });
  }

  /**
   * Send customer portal invitation email
   */
  static async sendCustomerInvite(
    email: string,
    firstName: string,
    temporaryPassword: string,
    portalUrl?: string
  ): Promise<boolean> {
    const url = portalUrl || `${window.location.origin}/customer-portal`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Lunar Customer Portal</h2>
        <p>Hello ${firstName},</p>
        <p>Your customer portal account has been created. You can now access your account using the following credentials:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Portal URL:</strong> <a href="${url}">${url}</a></p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 5px 10px; border-radius: 3px;">${temporaryPassword}</code></p>
        </div>
        <p><strong>Important:</strong> You will be required to change your password on first login.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #3567fd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Portal
          </a>
        </div>
        <p>If you did not expect this invitation, please contact support.</p>
        <p>Best regards,<br>The Lunar Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Lunar Customer Portal',
      html,
      text: `Welcome to Lunar! Access your portal at ${url} using email: ${email} and temporary password: ${temporaryPassword}. You will be required to change your password on first login.`,
    });
  }

  /**
   * Send a generic email
   * This is a placeholder - implement with your email provider
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // TODO: Implement with your email provider (SendGrid, AWS SES, etc.)
      // Example with fetch to a backend endpoint:
      // const response = await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(options),
      // });
      // return response.ok;

      console.log('Email would be sent:', options);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}
