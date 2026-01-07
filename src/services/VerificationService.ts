import { BaseCrudService } from '@/integrations';
import { VerificationRecords } from '@/entities';
import crypto from 'crypto';

export class VerificationService {
  private static readonly VERIFICATION_CODE_LENGTH = 6;
  private static readonly VERIFICATION_TOKEN_LENGTH = 32;
  private static readonly EXPIRATION_TIME_MINUTES = 15;
  private static readonly COLLECTION_ID = 'verificationrecords';

  /**
   * Generate a random verification code (6 digits)
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a random verification token
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(this.VERIFICATION_TOKEN_LENGTH).toString('hex');
  }

  /**
   * Calculate expiration time (15 minutes from now)
   */
  static getExpirationTime(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRATION_TIME_MINUTES);
    return expiresAt;
  }

  /**
   * Create a verification record for email or phone
   */
  static async createVerification(
    memberId: string,
    recipient: string,
    verificationType: 'email' | 'phone'
  ): Promise<VerificationRecords> {
    const verificationCode = this.generateVerificationCode();
    const verificationToken = this.generateVerificationToken();
    const expiresAt = this.getExpirationTime();

    const verificationRecord: VerificationRecords = {
      _id: crypto.randomUUID(),
      memberId,
      recipient,
      verificationCode,
      verificationToken,
      verificationType,
      status: 'pending',
      expiresAt,
    };

    await BaseCrudService.create('verificationrecords', verificationRecord);
    return verificationRecord;
  }

  /**
   * Verify a code for a given recipient
   */
  static async verifyCode(
    recipient: string,
    code: string,
    verificationType: 'email' | 'phone'
  ): Promise<boolean> {
    const { items } = await BaseCrudService.getAll<VerificationRecords>('verificationrecords');
    
    const record = items.find(
      (r) =>
        r.recipient === recipient &&
        r.verificationCode === code &&
        r.verificationType === verificationType &&
        r.status === 'pending'
    );

    if (!record) {
      return false;
    }

    // Check if expired
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return false;
    }

    // Mark as verified
    await BaseCrudService.update<VerificationRecords>('verificationrecords', {
      _id: record._id,
      status: 'verified',
    });

    return true;
  }

  /**
   * Verify a token for a given recipient
   */
  static async verifyToken(
    recipient: string,
    token: string,
    verificationType: 'email' | 'phone'
  ): Promise<boolean> {
    const { items } = await BaseCrudService.getAll<VerificationRecords>('verificationrecords');
    
    const record = items.find(
      (r) =>
        r.recipient === recipient &&
        r.verificationToken === token &&
        r.verificationType === verificationType &&
        r.status === 'pending'
    );

    if (!record) {
      return false;
    }

    // Check if expired
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return false;
    }

    // Mark as verified
    await BaseCrudService.update<VerificationRecords>('verificationrecords', {
      _id: record._id,
      status: 'verified',
    });

    return true;
  }

  /**
   * Get the latest verification record for a recipient
   */
  static async getLatestVerification(
    recipient: string,
    verificationType: 'email' | 'phone'
  ): Promise<VerificationRecords | null> {
    const { items } = await BaseCrudService.getAll<VerificationRecords>('verificationrecords');
    
    const records = items
      .filter(
        (r) =>
          r.recipient === recipient &&
          r.verificationType === verificationType
      )
      .sort((a, b) => {
        const dateA = new Date(a._createdDate || 0).getTime();
        const dateB = new Date(b._createdDate || 0).getTime();
        return dateB - dateA;
      });

    return records.length > 0 ? records[0] : null;
  }

  /**
   * Check if a recipient is verified
   */
  static async isVerified(
    recipient: string,
    verificationType: 'email' | 'phone'
  ): Promise<boolean> {
    const record = await this.getLatestVerification(recipient, verificationType);
    return record?.status === 'verified' || false;
  }

  /**
   * Delete expired verification records
   */
  static async cleanupExpiredRecords(): Promise<void> {
    const { items } = await BaseCrudService.getAll<VerificationRecords>('verificationrecords');
    const now = new Date();

    for (const record of items) {
      if (record.expiresAt && new Date(record.expiresAt) < now && record.status === 'pending') {
        await BaseCrudService.delete('verificationrecords', record._id);
      }
    }
  }
}
