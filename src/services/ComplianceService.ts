/**
 * Compliance Service
 * Handles IFRS 9 ECL calculations and Bank of Zambia provisioning rules
 */

import { BaseCrudService } from '@/integrations';
import { ECLResults, BoZProvisions, Loans } from '@/entities';
import { CollectionIds } from './index';
import { LoanService } from './LoanService';

export interface ECLCalculationInput {
  loanId: string;
  outstandingBalance: number;
  daysOverdue: number;
  probabilityOfDefault: number;
  lossGivenDefault: number;
  exposureAtDefault: number;
}

export interface BoZProvisioningInput {
  loanId: string;
  outstandingBalance: number;
  daysOverdue: number;
  classification: string;
}

export class ComplianceService {
  /**
   * Calculate IFRS 9 ECL (Expected Credit Loss)
   * 
   * IFRS 9 has 3 stages:
   * Stage 1: No significant increase in credit risk - 12-month ECL
   * Stage 2: Significant increase in credit risk - Lifetime ECL
   * Stage 3: Credit-impaired - Lifetime ECL with specific adjustments
   */
  static calculateECL(input: ECLCalculationInput): {
    eclValue: number;
    stage: string;
    pd: number;
    lgd: number;
    ead: number;
  } {
    const { outstandingBalance, daysOverdue, probabilityOfDefault, lossGivenDefault, exposureAtDefault } = input;

    // Determine IFRS 9 stage based on days overdue
    let stage = 'STAGE_1';
    let pdAdjustment = 1;

    if (daysOverdue > 30 && daysOverdue <= 90) {
      stage = 'STAGE_2';
      pdAdjustment = 1.5; // Increase PD for stage 2
    } else if (daysOverdue > 90) {
      stage = 'STAGE_3';
      pdAdjustment = 2.5; // Increase PD for stage 3 (credit-impaired)
    }

    // Adjust PD based on stage
    const adjustedPD = Math.min(probabilityOfDefault * pdAdjustment, 1.0);

    // Calculate ECL = PD × LGD × EAD
    const eclValue = adjustedPD * lossGivenDefault * exposureAtDefault;

    return {
      eclValue: Math.round(eclValue * 100) / 100,
      stage,
      pd: adjustedPD,
      lgd: lossGivenDefault,
      ead: exposureAtDefault,
    };
  }

  /**
   * Calculate Bank of Zambia Provisioning Requirements
   * 
   * BoZ Classification:
   * Standard: 0-30 days overdue - 1% provision
   * Watch: 31-60 days overdue - 5% provision
   * Substandard: 61-90 days overdue - 10% provision
   * Doubtful: 91-180 days overdue - 50% provision
   * Loss: >180 days overdue - 100% provision
   */
  static calculateBoZProvisioning(input: BoZProvisioningInput): {
    provisionAmount: number;
    provisionPercentage: number;
    classification: string;
  } {
    const { outstandingBalance, daysOverdue } = input;

    let classification = 'STANDARD';
    let provisionPercentage = 0.01; // 1%

    if (daysOverdue > 30 && daysOverdue <= 60) {
      classification = 'WATCH';
      provisionPercentage = 0.05; // 5%
    } else if (daysOverdue > 60 && daysOverdue <= 90) {
      classification = 'SUBSTANDARD';
      provisionPercentage = 0.10; // 10%
    } else if (daysOverdue > 90 && daysOverdue <= 180) {
      classification = 'DOUBTFUL';
      provisionPercentage = 0.50; // 50%
    } else if (daysOverdue > 180) {
      classification = 'LOSS';
      provisionPercentage = 1.0; // 100%
    }

    const provisionAmount = outstandingBalance * provisionPercentage;

    return {
      provisionAmount: Math.round(provisionAmount * 100) / 100,
      provisionPercentage,
      classification,
    };
  }

  /**
   * Calculate ECL for a loan and save to database
   */
  static async calculateAndSaveLoanECL(
    loanId: string,
    organisationId: string
  ): Promise<ECLResults | null> {
    try {
      const loan = await LoanService.getLoan(loanId);
      if (!loan) return null;

      const daysOverdue = LoanService.calculateDaysOverdue(loan.nextPaymentDate);
      
      // Default PD and LGD values (can be customized per product)
      const probabilityOfDefault = 0.05; // 5% base PD
      const lossGivenDefault = 0.45; // 45% LGD
      const exposureAtDefault = loan.outstandingBalance || 0;

      const eclCalc = this.calculateECL({
        loanId,
        outstandingBalance: loan.outstandingBalance || 0,
        daysOverdue,
        probabilityOfDefault,
        lossGivenDefault,
        exposureAtDefault,
      });

      const eclResult: ECLResults = {
        _id: crypto.randomUUID(),
        loanReference: loan.loanNumber,
        eclValue: eclCalc.eclValue,
        ifrs9Stage: eclCalc.stage,
        calculationTimestamp: new Date(),
        effectiveDate: new Date(),
      };

      await BaseCrudService.create(CollectionIds.ECL_RESULTS, eclResult);
      return eclResult;
    } catch (error) {
      console.error('Error calculating ECL:', error);
      return null;
    }
  }

  /**
   * Calculate BoZ provisioning for a loan and save to database
   */
  static async calculateAndSaveBoZProvisioning(
    loanId: string,
    organisationId: string
  ): Promise<BoZProvisions | null> {
    try {
      const loan = await LoanService.getLoan(loanId);
      if (!loan) return null;

      const daysOverdue = LoanService.calculateDaysOverdue(loan.nextPaymentDate);

      const bozCalc = this.calculateBoZProvisioning({
        loanId,
        outstandingBalance: loan.outstandingBalance || 0,
        daysOverdue,
        classification: '',
      });

      const bozProvisioning: BoZProvisions = {
        _id: crypto.randomUUID(),
        loanId,
        bozClassification: bozCalc.classification,
        provisionAmount: bozCalc.provisionAmount,
        provisionPercentage: bozCalc.provisionPercentage * 100,
        calculationDate: new Date(),
        effectiveDate: new Date(),
        ifrs9StageClassification: '', // Will be populated from ECL calculation
      };

      await BaseCrudService.create(CollectionIds.BOZ_PROVISIONS, bozProvisioning);
      return bozProvisioning;
    } catch (error) {
      console.error('Error calculating BoZ provisioning:', error);
      return null;
    }
  }

  /**
   * Calculate ECL and BoZ provisioning for all loans in an organisation
   */
  static async calculateComplianceMetricsForOrganisation(
    organisationId: string
  ): Promise<{ eclResults: ECLResults[]; bozProvisions: BoZProvisions[] }> {
    try {
      const loans = await LoanService.getOrganisationLoans(organisationId);
      const eclResults: ECLResults[] = [];
      const bozProvisions: BoZProvisions[] = [];

      for (const loan of loans) {
        if (loan._id) {
          const ecl = await this.calculateAndSaveLoanECL(loan._id, organisationId);
          if (ecl) eclResults.push(ecl);

          const boz = await this.calculateAndSaveBoZProvisioning(loan._id, organisationId);
          if (boz) bozProvisions.push(boz);
        }
      }

      return { eclResults, bozProvisions };
    } catch (error) {
      console.error('Error calculating compliance metrics:', error);
      return { eclResults: [], bozProvisions: [] };
    }
  }

  /**
   * Get ECL results for a loan
   */
  static async getLoanECL(loanId: string): Promise<ECLResults | null> {
    try {
      const { items } = await BaseCrudService.getAll<ECLResults>(
        CollectionIds.ECL_RESULTS
      );
      
      const ecl = items?.find(e => e.loanReference === loanId);
      return ecl || null;
    } catch (error) {
      console.error('Error fetching ECL results:', error);
      return null;
    }
  }

  /**
   * Get BoZ provisioning for a loan
   */
  static async getLoanBoZProvisioning(loanId: string): Promise<BoZProvisions | null> {
    try {
      const { items } = await BaseCrudService.getAll<BoZProvisions>(
        CollectionIds.BOZ_PROVISIONS
      );
      
      const boz = items?.find(b => b.loanId === loanId);
      return boz || null;
    } catch (error) {
      console.error('Error fetching BoZ provisioning:', error);
      return null;
    }
  }

  /**
   * Get total ECL for an organisation
   */
  static async getOrganisationTotalECL(organisationId: string): Promise<number> {
    try {
      const loans = await LoanService.getOrganisationLoans(organisationId);
      let totalECL = 0;

      for (const loan of loans) {
        if (loan._id) {
          const ecl = await this.getLoanECL(loan._id);
          if (ecl) {
            totalECL += ecl.eclValue || 0;
          }
        }
      }

      return Math.round(totalECL * 100) / 100;
    } catch (error) {
      console.error('Error calculating total ECL:', error);
      return 0;
    }
  }

  /**
   * Get total BoZ provisioning for an organisation
   */
  static async getOrganisationTotalBoZProvisioning(organisationId: string): Promise<number> {
    try {
      const loans = await LoanService.getOrganisationLoans(organisationId);
      let totalProvisioning = 0;

      for (const loan of loans) {
        if (loan._id) {
          const boz = await this.getLoanBoZProvisioning(loan._id);
          if (boz) {
            totalProvisioning += boz.provisionAmount || 0;
          }
        }
      }

      return Math.round(totalProvisioning * 100) / 100;
    } catch (error) {
      console.error('Error calculating total BoZ provisioning:', error);
      return 0;
    }
  }
}
