/**
 * SMS Service for sending verification codes and other notifications via SMS
 * This is a placeholder service that should be integrated with your SMS provider
 * (e.g., Twilio, AWS SNS, Nexmo, etc.)
 */

export interface SMSOptions {
  to: string;
  message: string;
}

export class SMSService {
  /**
   * Send a verification code via SMS
   */
  static async sendVerificationCodeSMS(
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    const message = `Your verification code is: ${code}. This code will expire in 15 minutes.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  }

  /**
   * Send a verification link via SMS
   */
  static async sendVerificationLinkSMS(
    phoneNumber: string,
    verificationLink: string
  ): Promise<boolean> {
    const message = `Please verify your phone number by clicking this link: ${verificationLink} (expires in 15 minutes)`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  }

  /**
   * Send a generic SMS
   * This is a placeholder - implement with your SMS provider
   */
  static async sendSMS(options: SMSOptions): Promise<boolean> {
    try {
      // TODO: Implement with your SMS provider (Twilio, AWS SNS, etc.)
      // Example with fetch to a backend endpoint:
      // const response = await fetch('/api/send-sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(options),
      // });
      // return response.ok;

      console.log('SMS would be sent:', options);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }
}
