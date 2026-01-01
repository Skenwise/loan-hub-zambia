/**
 * Write-off Service
 * Handles loan write-off and recovery management
 */

import { BaseCrudService } from './BaseCrudService';

export type WriteoffStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECORDED' | 'RECOVERED';
export type WriteoffType = 'FULL' | 'PARTIAL' | 'CHARGE_OFF';

export interface WriteoffRequest {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  loanId: string;
  organisationId: string;
  writeoffType: WriteoffType;
  writeoffAmount: number;
  reason: string;
  justification: string;
  requestedBy: string;
  requestDate: Date | string;
  status: WriteoffStatus;
  approvedBy?: string;
  approvalDate?: Date | string;
  approvalNotes?: string;
  recordedDate?: Date | string;
  recoveryAmount?: number;
  recoveryRate?: number;
}

export interface RecoveryPayment {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  writeoffId: string;
  loanId: string;
  organisationId: string;
  paymentAmount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  reference: string;
  recordedBy: string;
}

export class WriteoffService {
  /**
   * Create write-off request
   */
  static async createWriteoffRequest(
    loanId: string,
    organisationId: string,
    writeoffType: WriteoffType,
    writeoffAmount: number,
    reason: string,
    justification: string,
    requestedBy: string
  ): Promise<WriteoffRequest> {
    const writeoffRequest: WriteoffRequest = {
      _id: `writeoff-${Date.now()}`,
      loanId,
      organisationId,
      writeoffType,
      writeoffAmount,
      reason,
      justification,
      requestedBy,
      requestDate: new Date(),
      status: 'PENDING',
    };

    // Save to database
    await BaseCrudService.create('writeoffs', writeoffRequest);

    return writeoffRequest;
  }

  /**
   * Get write-off request
   */
  static async getWriteoffRequest(writeoffId: string): Promise<WriteoffRequest | null> {
    try {
      const writeoff = await BaseCrudService.getById<WriteoffRequest>('writeoffs', writeoffId);
      return writeoff;
    } catch {
      return null;
    }
  }

  /**
   * Get write-offs by organization
   */
  static async getWriteoffsByOrganisation(organisationId: string): Promise<WriteoffRequest[]> {
    try {
      const { items } = await BaseCrudService.getAll<WriteoffRequest>('writeoffs');
      return items.filter(w => w.organisationId === organisationId);
    } catch {
      return [];
    }
  }

  /**
   * Get pending write-offs
   */
  static async getPendingWriteoffs(organisationId: string): Promise<WriteoffRequest[]> {
    try {
      const { items } = await BaseCrudService.getAll<WriteoffRequest>('writeoffs');
      return items.filter(w => w.organisationId === organisationId && w.status === 'PENDING');
    } catch {
      return [];
    }
  }

  /**
   * Approve write-off request
   */
  static async approveWriteoff(
    writeoffId: string,
    approvedBy: string,
    approvalNotes: string = ''
  ): Promise<void> {
    await BaseCrudService.update<Partial<WriteoffRequest>>('writeoffs', {
      _id: writeoffId,
      status: 'APPROVED',
      approvedBy,
      approvalDate: new Date(),
      approvalNotes,
    });
  }

  /**
   * Reject write-off request
   */
  static async rejectWriteoff(
    writeoffId: string,
    approvedBy: string,
    approvalNotes: string = ''
  ): Promise<void> {
    await BaseCrudService.update<Partial<WriteoffRequest>>('writeoffs', {
      _id: writeoffId,
      status: 'REJECTED',
      approvedBy,
      approvalDate: new Date(),
      approvalNotes,
    });
  }

  /**
   * Record write-off
   */
  static async recordWriteoff(writeoffId: string): Promise<void> {
    await BaseCrudService.update<Partial<WriteoffRequest>>('writeoffs', {
      _id: writeoffId,
      status: 'RECORDED',
      recordedDate: new Date(),
    });
  }

  /**
   * Record recovery payment
   */
  static async recordRecoveryPayment(
    writeoffId: string,
    loanId: string,
    organisationId: string,
    paymentAmount: number,
    paymentDate: Date,
    paymentMethod: string,
    reference: string,
    recordedBy: string
  ): Promise<RecoveryPayment> {
    const payment: RecoveryPayment = {
      _id: `recovery-${Date.now()}`,
      writeoffId,
      loanId,
      organisationId,
      paymentAmount,
      paymentDate,
      paymentMethod,
      reference,
      recordedBy,
    };

    // Save to database
    await BaseCrudService.create('recoveries', payment);

    // Update write-off with recovery amount
    const writeoff = await this.getWriteoffRequest(writeoffId);
    if (writeoff) {
      const totalRecovery = (writeoff.recoveryAmount || 0) + paymentAmount;
      const recoveryRate = (totalRecovery / writeoff.writeoffAmount) * 100;

      await BaseCrudService.update<Partial<WriteoffRequest>>('writeoffs', {
        _id: writeoffId,
        recoveryAmount: totalRecovery,
        recoveryRate: Math.min(recoveryRate, 100),
        status: recoveryRate >= 100 ? 'RECOVERED' : 'RECORDED',
      });
    }

    return payment;
  }

  /**
   * Get recovery payments for write-off
   */
  static async getRecoveryPayments(writeoffId: string): Promise<RecoveryPayment[]> {
    try {
      const { items } = await BaseCrudService.getAll<RecoveryPayment>('recoveries');
      return items.filter(r => r.writeoffId === writeoffId);
    } catch {
      return [];
    }
  }

  /**
   * Calculate recovery rate
   */
  static calculateRecoveryRate(recoveryAmount: number, writeoffAmount: number): number {
    if (writeoffAmount === 0) return 0;
    return Math.min((recoveryAmount / writeoffAmount) * 100, 100);
  }

  /**
   * Get write-off statistics
   */
  static async getWriteoffStatistics(organisationId: string): Promise<{
    totalWriteoffs: number;
    totalWriteoffAmount: number;
    totalRecoveryAmount: number;
    averageRecoveryRate: number;
    pendingWriteoffs: number;
    approvedWriteoffs: number;
    recordedWriteoffs: number;
  }> {
    const writeoffs = await this.getWriteoffsByOrganisation(organisationId);

    const totalWriteoffs = writeoffs.length;
    const totalWriteoffAmount = writeoffs.reduce((sum, w) => sum + (w.writeoffAmount || 0), 0);
    const totalRecoveryAmount = writeoffs.reduce((sum, w) => sum + (w.recoveryAmount || 0), 0);
    const averageRecoveryRate = writeoffs.length > 0
      ? writeoffs.reduce((sum, w) => sum + (w.recoveryRate || 0), 0) / writeoffs.length
      : 0;
    const pendingWriteoffs = writeoffs.filter(w => w.status === 'PENDING').length;
    const approvedWriteoffs = writeoffs.filter(w => w.status === 'APPROVED').length;
    const recordedWriteoffs = writeoffs.filter(w => w.status === 'RECORDED').length;

    return {
      totalWriteoffs,
      totalWriteoffAmount,
      totalRecoveryAmount,
      averageRecoveryRate,
      pendingWriteoffs,
      approvedWriteoffs,
      recordedWriteoffs,
    };
  }

  /**
   * Get write-offs by status
   */
  static async getWriteoffsByStatus(
    organisationId: string,
    status: WriteoffStatus
  ): Promise<WriteoffRequest[]> {
    try {
      const { items } = await BaseCrudService.getAll<WriteoffRequest>('writeoffs');
      return items.filter(w => w.organisationId === organisationId && w.status === status);
    } catch {
      return [];
    }
  }

  /**
   * Get write-offs by type
   */
  static async getWriteoffsByType(
    organisationId: string,
    type: WriteoffType
  ): Promise<WriteoffRequest[]> {
    try {
      const { items } = await BaseCrudService.getAll<WriteoffRequest>('writeoffs');
      return items.filter(w => w.organisationId === organisationId && w.writeoffType === type);
    } catch {
      return [];
    }
  }

  /**
   * Calculate total write-off amount
   */
  static calculateTotalWriteoffAmount(writeoffs: WriteoffRequest[]): number {
    return writeoffs.reduce((sum, w) => sum + (w.writeoffAmount || 0), 0);
  }

  /**
   * Calculate total recovery amount
   */
  static calculateTotalRecoveryAmount(writeoffs: WriteoffRequest[]): number {
    return writeoffs.reduce((sum, w) => sum + (w.recoveryAmount || 0), 0);
  }

  /**
   * Calculate portfolio write-off rate
   */
  static calculatePortfolioWriteoffRate(
    totalWriteoffAmount: number,
    totalPortfolioAmount: number
  ): number {
    if (totalPortfolioAmount === 0) return 0;
    return (totalWriteoffAmount / totalPortfolioAmount) * 100;
  }

  /**
   * Get write-off trend
   */
  static async getWriteoffTrend(
    organisationId: string,
    months: number = 12
  ): Promise<Array<{ month: string; writeoffAmount: number; recoveryAmount: number }>> {
    const writeoffs = await this.getWriteoffsByOrganisation(organisationId);
    const trend: Record<string, { writeoffAmount: number; recoveryAmount: number }> = {};

    // Initialize months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      trend[monthKey] = { writeoffAmount: 0, recoveryAmount: 0 };
    }

    // Aggregate data
    writeoffs.forEach(w => {
      const date = new Date(w.requestDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (trend[monthKey]) {
        trend[monthKey].writeoffAmount += w.writeoffAmount || 0;
        trend[monthKey].recoveryAmount += w.recoveryAmount || 0;
      }
    });

    return Object.entries(trend).map(([month, data]) => ({
      month,
      ...data,
    }));
  }
}
