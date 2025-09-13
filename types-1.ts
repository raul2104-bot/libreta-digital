export enum TransactionCategory {
  SAVINGS = 'Ahorro',
  LOAN = 'Préstamo',
  SOCIAL_PROTECTION = 'Protección Social',
  FUND = 'Fondo Especial',
  CONTRIBUTION_CERTIFICATE = 'Certificado de Aportación',
}

export interface Transaction {
  id: string;
  date: string;
  memberId: number;
  category: TransactionCategory;
  description: string;
  amountBs: number;
  reference: string;
  monthsPaid?: number;
}

export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  savingsId: number;
  socialProtectionId?: string;
  setupComplete?: boolean;
  // New fields for initial setup
  initialSavingsUsd?: number;
  initialLoanUsd?: number;
  paidProtectionMonths?: number;
  monthlyProtectionFeeUsd?: number;
  fundContributionUsd?: number; // Configurable fund amount
  contributionCertificateTotal?: number;
  // Loan tracking fields
  loanStartDate?: string;
  loanPaymentFrequency?: 'weekly' | 'biweekly' | 'monthly';
  loanInstallmentUsd?: number;
  lastProtectionPaymentDate?: string; // YYYY-MM format
}