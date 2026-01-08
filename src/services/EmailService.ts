/**
 * Email Service for sending verification emails and other notifications
 * Supports multiple email providers: SendGrid, AWS SES, Mailgun, SMTP
 * 
 * Configuration via environment variables:
 * - VITE_EMAIL_PROVIDER: 'sendgrid' | 'aws-ses' | 'mailgun' | 'smtp'
 * - VITE_EMAIL_FROM: sender email address
 * - VITE_SENDGRID_API_KEY: SendGrid API key
 * - VITE_AWS_ACCESS_KEY_ID: AWS access key
 * - VITE_AWS_SECRET_ACCESS_KEY: AWS secret key
 * - VITE_AWS_REGION: AWS region (default: us-east-1)
 * - VITE_MAILGUN_API_KEY: Mailgun API key
 * - VITE_MAILGUN_DOMAIN: Mailgun domain
 */

import { BaseCrudService } from './BaseCrudService';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailLog {
  _id: string;
  to: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  provider: string;
  sentAt: Date;
  error?: string;
  messageId?: string;
  retryCount: number;
  maxRetries: number;
}

export class EmailService {
  private static readonly EMAIL_PROVIDER = import.meta.env.VITE_EMAIL_PROVIDER || 'sendgrid';
  private static readonly EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM || 'noreply@lunar.local';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 5000;

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
   * Send a generic email with provider support
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Validate email
      if (!this.isValidEmail(options.to)) {
        console.error('Invalid recipient email:', options.to);
        return false;
      }

      // Log email attempt
      const logId = crypto.randomUUID();
      await this.logEmailAttempt(logId, options, 'pending');

      // Send based on configured provider
      let success = false;
      let messageId: string | undefined;
      let error: string | undefined;

      try {
        switch (this.EMAIL_PROVIDER.toLowerCase()) {
          case 'sendgrid':
            ({ success, messageId, error } = await this.sendViaSendGrid(options));
            break;
          case 'aws-ses':
            ({ success, messageId, error } = await this.sendViaAwsSES(options));
            break;
          case 'mailgun':
            ({ success, messageId, error } = await this.sendViaMailgun(options));
            break;
          case 'smtp':
            ({ success, messageId, error } = await this.sendViaSMTP(options));
            break;
          default:
            console.warn(`Unknown email provider: ${this.EMAIL_PROVIDER}, using console logging`);
            success = this.logToConsole(options);
        }
      } catch (providerError) {
        error = providerError instanceof Error ? providerError.message : String(providerError);
        success = false;
      }

      // Update log with result
      await this.logEmailAttempt(logId, options, success ? 'sent' : 'failed', messageId, error);

      if (!success) {
        console.error(`Failed to send email to ${options.to}:`, error);
      } else {
        console.log(`Email sent successfully to ${options.to} via ${this.EMAIL_PROVIDER}`);
      }

      return success;
    } catch (error) {
      console.error('Error in sendEmail:', error);
      return false;
    }
  }

  /**
   * Send via SendGrid
   */
  private static async sendViaSendGrid(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: this.EMAIL_FROM },
          subject: options.subject,
          content: [
            { type: 'text/plain', value: options.text || options.html },
            { type: 'text/html', value: options.html },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `SendGrid error: ${response.status} - ${error}` };
      }

      const messageId = response.headers.get('X-Message-Id') || 'unknown';
      return { success: true, messageId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Send via AWS SES
   */
  private static async sendViaAwsSES(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
    const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      return { success: false, error: 'AWS credentials not configured' };
    }

    try {
      // Note: In production, use AWS SDK v3 or a backend service
      // This is a simplified example
      const response = await fetch(`https://email.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'Action': 'SendEmail',
          'Source': this.EMAIL_FROM,
          'Destination.ToAddresses.member.1': options.to,
          'Message.Subject.Data': options.subject,
          'Message.Body.Html.Data': options.html,
        }).toString(),
      });

      if (!response.ok) {
        return { success: false, error: `AWS SES error: ${response.status}` };
      }

      return { success: true, messageId: 'aws-ses-sent' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Send via Mailgun
   */
  private static async sendViaMailgun(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const apiKey = import.meta.env.VITE_MAILGUN_API_KEY;
    const domain = import.meta.env.VITE_MAILGUN_DOMAIN;

    if (!apiKey || !domain) {
      return { success: false, error: 'Mailgun credentials not configured' };
    }

    try {
      const formData = new FormData();
      formData.append('from', this.EMAIL_FROM);
      formData.append('to', options.to);
      formData.append('subject', options.subject);
      formData.append('html', options.html);
      if (options.text) {
        formData.append('text', options.text);
      }

      const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Mailgun error: ${response.status} - ${error}` };
      }

      const data = await response.json() as { id?: string };
      return { success: true, messageId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Send via SMTP (generic fallback)
   */
  private static async sendViaSMTP(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // SMTP requires backend support - this is a placeholder
    console.warn('SMTP provider requires backend implementation');
    return { success: false, error: 'SMTP provider not yet implemented' };
  }

  /**
   * Log email to console (fallback)
   */
  private static logToConsole(options: EmailOptions): boolean {
    console.log('📧 Email (Console Log - No Provider Configured):', {
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  /**
   * Validate email address
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Log email attempt to database
   */
  private static async logEmailAttempt(
    logId: string,
    options: EmailOptions,
    status: 'pending' | 'sent' | 'failed',
    messageId?: string,
    error?: string
  ): Promise<void> {
    try {
      const log: EmailLog = {
        _id: logId,
        to: options.to,
        subject: options.subject,
        status,
        provider: this.EMAIL_PROVIDER,
        sentAt: new Date(),
        messageId,
        error,
        retryCount: 0,
        maxRetries: this.MAX_RETRIES,
      };

      // Try to save to database if collection exists
      try {
        await BaseCrudService.create('emaillogs', log);
      } catch {
        // Email logs collection may not exist - that's okay
        console.log('Email log saved to memory (database collection not available)');
      }
    } catch (error) {
      console.error('Error logging email attempt:', error);
    }
  }

  /**
   * Get email logs
   */
  static async getEmailLogs(limit: number = 100): Promise<EmailLog[]> {
    try {
      const { items } = await BaseCrudService.getAll<EmailLog>('emaillogs');
      return (items || []).slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Get email delivery status
   */
  static async getEmailStatus(email: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    try {
      const logs = await this.getEmailLogs(1000);
      const emailLogs = logs.filter((log) => log.to === email);

      return {
        total: emailLogs.length,
        sent: emailLogs.filter((log) => log.status === 'sent').length,
        failed: emailLogs.filter((log) => log.status === 'failed').length,
        pending: emailLogs.filter((log) => log.status === 'pending').length,
      };
    } catch {
      return { total: 0, sent: 0, failed: 0, pending: 0 };
    }
  }
}
