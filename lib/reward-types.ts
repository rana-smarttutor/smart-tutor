export type ReferralStatus =
  | "registered"
  | "pending_enrollment"
  | "pending_payment"
  | "successful"
  | "cancelled"
  | "reversed";

export type RewardTransactionType =
  | "referral_credit"
  | "redemption_debit"
  | "redemption_release"
  | "reward_reversal"
  | "manual_credit"
  | "manual_debit";

export type RewardRedemptionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

export type RewardPaymentMethod =
  | "upi"
  | "bank";

export type EducatorReferral = {
  id: string;

  educatorId: string;
  educatorName: string;
  educatorEmail?: string;

  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentMobile?: string;

  referralCode: string;

  programId?: string;
  programTitle?: string;

  status: ReferralStatus;

  rewardAmount: number;
  rewardCredited: boolean;
  rewardTransactionId?: string;
  rewardCreditedAt?: string;

  registrationCompletedAt?: string;
  enrollmentConfirmedAt?: string;
  paymentConfirmedAt?: string;

  cancellationReason?: string;
  reversedAt?: string;
  reversedBy?: string;

  createdAt: string;
  updatedAt: string;
};

export type RewardWallet = {
  id: string;
  educatorId: string;
  educatorName: string;

  availableBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  totalReversed: number;

  createdAt: string;
  updatedAt: string;
};

export type RewardTransaction = {
  id: string;

  educatorId: string;
  educatorName?: string;

  type: RewardTransactionType;

  amount: number;

  description: string;

  referralId?: string;
  redemptionId?: string;

  balanceBefore: number;
  balanceAfter: number;

  createdBy?: string;
  createdByRole?: string;

  createdAt: string;
};

export type RewardBankDetails = {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
};

export type RewardRedemption = {
  id: string;

  educatorId: string;
  educatorName: string;
  educatorEmail?: string;

  amount: number;

  paymentMethod: RewardPaymentMethod;

  upiId?: string;
  bankDetails?: RewardBankDetails;

  status: RewardRedemptionStatus;

  walletTransactionId: string;

  transactionReference?: string;
  adminNote?: string;
  rejectionReason?: string;

  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;

  processedBy?: string;
  processedByName?: string;

  updatedAt: string;
};

export type RewardSettings = {
  id: "default";

  referralRewardAmount: number;
  minimumRedemptionAmount: number;

  creditAfterPayment: boolean;
  requireActiveStudentAccount: boolean;
  requireConfirmedEnrollment: boolean;

  redemptionsEnabled: boolean;

  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
};

export type EducatorRewardSummary = {
  referralCode: string;

  availableBalance: number;
  totalEarned: number;
  totalRedeemed: number;

  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;

  pendingRewardAmount: number;

  minimumRedemptionAmount: number;
  referralRewardAmount: number;
  redemptionsEnabled: boolean;
};

export type EducatorRewardDashboard = {
  summary: EducatorRewardSummary;

  wallet: RewardWallet;

  referrals: EducatorReferral[];

  transactions: RewardTransaction[];

  redemptions: RewardRedemption[];

  settings: RewardSettings;
};

export type AdminRewardSummary = {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  cancelledReferrals: number;

  totalRewardsCredited: number;
  totalRewardsRedeemed: number;

  pendingRedemptionCount: number;
  pendingRedemptionAmount: number;
};

export type AdminRewardDashboard = {
  summary: AdminRewardSummary;

  referrals: EducatorReferral[];

  redemptions: RewardRedemption[];

  settings: RewardSettings;
};

export type CreateReferralInput = {
  referralCode: string;

  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentMobile?: string;

  programId?: string;
  programTitle?: string;
};

export type ConfirmReferralEnrollmentInput = {
  studentId: string;

  programId?: string;
  programTitle?: string;

  paymentTransactionId?: string;
  paymentAmount?: number;

  confirmedBy?: string;
};

export type CreateRewardRedemptionInput = {
  amount: number;

  paymentMethod: RewardPaymentMethod;

  upiId?: string;

  bankDetails?: RewardBankDetails;
};

export type UpdateRewardSettingsInput = {
  referralRewardAmount?: number;
  minimumRedemptionAmount?: number;

  creditAfterPayment?: boolean;
  requireActiveStudentAccount?: boolean;
  requireConfirmedEnrollment?: boolean;

  redemptionsEnabled?: boolean;
};

export type ProcessRedemptionInput = {
  action:
    | "approve"
    | "reject"
    | "mark_paid";

  transactionReference?: string;
  adminNote?: string;
  rejectionReason?: string;
};

export type ProcessReferralInput = {
  action:
    | "confirm_enrollment"
    | "confirm_payment"
    | "credit_reward"
    | "cancel"
    | "reverse_reward";

  programId?: string;
  programTitle?: string;

  paymentTransactionId?: string;
  paymentAmount?: number;

  reason?: string;
};