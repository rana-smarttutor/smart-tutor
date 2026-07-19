import "server-only";

import { createHash, randomUUID } from "crypto";
import type { ClientSession, Db, Document } from "mongodb";

import { getMongoDatabase } from "@/lib/mongodb";

import type {
  AdminRewardDashboard,
  AdminRewardSummary,
  ConfirmReferralEnrollmentInput,
  CreateReferralInput,
  CreateRewardRedemptionInput,
  EducatorReferral,
  EducatorRewardDashboard,
  EducatorRewardSummary,
  ProcessRedemptionInput,
  ReferralStatus,
  RewardRedemption,
  RewardSettings,
  RewardTransaction,
  RewardWallet,
  UpdateRewardSettingsInput,
} from "@/lib/reward-types";

const REWARD_COLLECTIONS = {
  referralCodes: "reward_referral_codes",
  referrals: "educator_referrals",
  wallets: "reward_wallets",
  transactions: "reward_transactions",
  redemptions: "reward_redemptions",
  settings: "reward_settings",
  users: "users",
} as const;

type ReferralCodeDocument = {
  id: string;

  educatorId: string;
  educatorName: string;
  educatorEmail?: string;

  referralCode: string;

  active: boolean;

  createdAt: string;
  updatedAt: string;
};

type RewardUserDocument = {
  id: string;
  name: string;
  email?: string;
  mobile?: string;

  role: string;

  status?: "active" | "pending" | "rejected";
  verified?: boolean;

  program?: string;

  profile?: {
    courseWanted?: string;
    courseWantedTitle?: string;
  };
};

type MongoDocument<T> = T & Document;

let rewardIndexesPromise: Promise<void> | null = null;

function nowIso() {
  return new Date().toISOString();
}

function toPlainData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stripMongoId<T>(document: T & { _id?: unknown }) {
  const plain = toPlainData(document) as T & {
    _id?: unknown;
  };

  if (
    plain &&
    typeof plain === "object" &&
    "_id" in plain
  ) {
    delete plain._id;
  }

  return plain as T;
}

function stripMongoIds<T extends { _id?: unknown }[]>(
  documents: T,
) {
  return documents.map((document) =>
    stripMongoId(document),
  );
}

function normalizeReferralCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

function normalizeMoney(value: number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount);
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number(
      (error as { code?: unknown }).code,
    ) === 11000
  );
}

function buildReferralCode(
  educatorId: string,
  educatorName: string,
  attempt = 0,
) {
  const namePart =
    educatorName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8) || "TUTOR";

  const hash = createHash("sha256")
    .update(
      `${educatorId}-${attempt}-${Date.now()}`,
    )
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();

  return `ST-${namePart}-${hash}`;
}



function getDefaultRewardSettings(): RewardSettings {
  const now = nowIso();

  return {
    id: "default",

    referralRewardAmount: 1000,
    minimumRedemptionAmount: 1000,

    creditAfterPayment: true,
    requireActiveStudentAccount: true,
    requireConfirmedEnrollment: true,

    redemptionsEnabled: true,

    createdAt: now,
    updatedAt: now,
  };
}

async function getCollections() {
  const db = await getMongoDatabase();

  return {
    db,

    referralCodes:
      db.collection<
        MongoDocument<ReferralCodeDocument>
      >(
        REWARD_COLLECTIONS.referralCodes,
      ),

    referrals:
      db.collection<
        MongoDocument<EducatorReferral>
      >(
        REWARD_COLLECTIONS.referrals,
      ),

    wallets:
      db.collection<
        MongoDocument<RewardWallet>
      >(
        REWARD_COLLECTIONS.wallets,
      ),

    transactions:
      db.collection<
        MongoDocument<RewardTransaction>
      >(
        REWARD_COLLECTIONS.transactions,
      ),

    redemptions:
      db.collection<
        MongoDocument<RewardRedemption>
      >(
        REWARD_COLLECTIONS.redemptions,
      ),

    settings:
      db.collection<
        MongoDocument<RewardSettings>
      >(
        REWARD_COLLECTIONS.settings,
      ),

    users:
      db.collection<
        MongoDocument<RewardUserDocument>
      >(
        REWARD_COLLECTIONS.users,
      ),
  };
}

async function ensureRewardIndexes() {
  if (!rewardIndexesPromise) {
    rewardIndexesPromise = (async () => {
      const {
        referralCodes,
        referrals,
        wallets,
        transactions,
        redemptions,
        settings,
      } = await getCollections();

      await Promise.all([
        referralCodes.createIndex(
          {
            id: 1,
          },
          {
            unique: true,
            name: "reward_referral_codes_unique_id",
          },
        ),

        referralCodes.createIndex(
          {
            educatorId: 1,
          },
          {
            unique: true,
            name: "reward_referral_codes_unique_educator",
          },
        ),

        referralCodes.createIndex(
          {
            referralCode: 1,
          },
          {
            unique: true,
            name: "reward_referral_codes_unique_code",
          },
        ),

        referrals.createIndex(
          {
            id: 1,
          },
          {
            unique: true,
            name: "educator_referrals_unique_id",
          },
        ),

        referrals.createIndex(
          {
            studentId: 1,
          },
          {
            unique: true,
            name: "educator_referrals_unique_student",
          },
        ),

        referrals.createIndex(
          {
            educatorId: 1,
            createdAt: -1,
          },
          {
            name: "educator_referrals_by_educator",
          },
        ),

        referrals.createIndex(
          {
            status: 1,
            createdAt: -1,
          },
          {
            name: "educator_referrals_by_status",
          },
        ),

        wallets.createIndex(
          {
            id: 1,
          },
          {
            unique: true,
            name: "reward_wallets_unique_id",
          },
        ),

        wallets.createIndex(
          {
            educatorId: 1,
          },
          {
            unique: true,
            name: "reward_wallets_unique_educator",
          },
        ),

        transactions.createIndex(
          {
            id: 1,
          },
          {
            unique: true,
            name: "reward_transactions_unique_id",
          },
        ),

        transactions.createIndex(
          {
            educatorId: 1,
            createdAt: -1,
          },
          {
            name: "reward_transactions_by_educator",
          },
        ),

        transactions.createIndex(
          {
            referralId: 1,
            type: 1,
          },
          {
            unique: true,
            sparse: true,
            name: "reward_transactions_unique_referral_action",
          },
        ),

        transactions.createIndex(
          {
            redemptionId: 1,
            type: 1,
          },
          {
            unique: true,
            sparse: true,
            name: "reward_transactions_unique_redemption_action",
          },
        ),

        redemptions.createIndex(
          {
            id: 1,
          },
          {
            unique: true,
            name: "reward_redemptions_unique_id",
          },
        ),

        redemptions.createIndex(
          {
            educatorId: 1,
            requestedAt: -1,
          },
          {
            name: "reward_redemptions_by_educator",
          },
        ),

        redemptions.createIndex(
          {
            status: 1,
            requestedAt: -1,
          },
          {
            name: "reward_redemptions_by_status",
          },
        ),

        settings.createIndex(
          {
            id: 1,
          },
          {
            unique: true,
            name: "reward_settings_unique_id",
          },
        ),
      ]);
    })().catch((error) => {
      rewardIndexesPromise = null;
      throw error;
    });
  }

  return rewardIndexesPromise;
}

async function getOrCreateWallet(
  educatorId: string,
  educatorName: string,
  session?: ClientSession,
) {
  const { wallets } = await getCollections();

  const now = nowIso();

  /*
   * First create the wallet only when it does not exist.
   * All insertion fields stay inside $setOnInsert.
   */
  await wallets.updateOne(
    {
      educatorId,
    },
    {
      $setOnInsert: {
        id: `reward-wallet-${randomUUID()}`,

        educatorId,
        educatorName,

        availableBalance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        totalReversed: 0,

        createdAt: now,
        updatedAt: now,
      },
    },
    {
      upsert: true,
      session,
    },
  );

  /*
   * Update changing fields in a separate database operation.
   * This prevents MongoDB update-path conflicts.
   */
  await wallets.updateOne(
    {
      educatorId,
    },
    {
      $set: {
        educatorName,
        updatedAt: now,
      },
    },
    {
      session,
    },
  );

  const wallet = await wallets.findOne(
    {
      educatorId,
    },
    {
      session,
    },
  );

  if (!wallet) {
    throw new Error(
      "Educator reward wallet could not be created.",
    );
  }

  return stripMongoId(wallet);
}

async function getEducatorUser(
  educatorId: string,
  session?: ClientSession,
) {
  const { users } = await getCollections();

  const educator = await users.findOne(
    {
      id: educatorId,
      role: "educator",
    },
    {
      session,
    },
  );

  return educator
    ? stripMongoId(educator)
    : null;
}

async function getStudentUser(
  studentId: string,
  session?: ClientSession,
) {
  const { users } = await getCollections();

  const student = await users.findOne(
    {
      id: studentId,
      role: "student",
    },
    {
      session,
    },
  );

  return student
    ? stripMongoId(student)
    : null;
}

export async function getRewardSettings() {
  await ensureRewardIndexes();

  const { settings } = await getCollections();

  const defaults =
    getDefaultRewardSettings();

  await settings.updateOne(
    {
      id: "default",
    },
    {
      $setOnInsert: defaults,
    },
    {
      upsert: true,
    },
  );

  const document = await settings.findOne({
    id: "default",
  });

  return document
    ? stripMongoId(document)
    : defaults;
}

export async function updateRewardSettings(
  input: UpdateRewardSettingsInput,
  updatedBy?: string,
) {
  await ensureRewardIndexes();

  const current =
    await getRewardSettings();

  const referralRewardAmount =
    input.referralRewardAmount === undefined
      ? current.referralRewardAmount
      : normalizeMoney(
          input.referralRewardAmount,
        );

  const minimumRedemptionAmount =
    input.minimumRedemptionAmount === undefined
      ? current.minimumRedemptionAmount
      : normalizeMoney(
          input.minimumRedemptionAmount,
        );

  if (referralRewardAmount < 0) {
    throw new Error(
      "Referral reward amount cannot be negative.",
    );
  }

  if (minimumRedemptionAmount < 1) {
    throw new Error(
      "Minimum redemption amount must be at least ₹1.",
    );
  }

  const now = nowIso();

  const nextSettings: RewardSettings = {
    ...current,

    referralRewardAmount,
    minimumRedemptionAmount,

    creditAfterPayment:
      input.creditAfterPayment ??
      current.creditAfterPayment,

    requireActiveStudentAccount:
      input.requireActiveStudentAccount ??
      current.requireActiveStudentAccount,

    requireConfirmedEnrollment:
      input.requireConfirmedEnrollment ??
      current.requireConfirmedEnrollment,

    redemptionsEnabled:
      input.redemptionsEnabled ??
      current.redemptionsEnabled,

    updatedAt: now,
    updatedBy,
  };

  const { settings } = await getCollections();

  await settings.updateOne(
    {
      id: "default",
    },
    {
      $set: nextSettings,
    },
    {
      upsert: true,
    },
  );

  return nextSettings;
}

export async function getOrCreateEducatorReferralCode(
  educatorId: string,
  educatorName?: string,
  educatorEmail?: string,
) {
  await ensureRewardIndexes();

  const {
    referralCodes,
  } = await getCollections();

  const existing =
    await referralCodes.findOne({
      educatorId,
    });

  if (existing) {
    return stripMongoId(existing);
  }

  const educator =
    await getEducatorUser(educatorId);

  if (!educator) {
    throw new Error(
      "Educator account was not found.",
    );
  }

  if (
    educator.status === "rejected"
  ) {
    throw new Error(
      "Rejected educator accounts cannot create referral codes.",
    );
  }

  const resolvedEducatorName =
    educator.name ||
    educatorName ||
    "Educator";

  const resolvedEducatorEmail =
    educator.email ||
    educatorEmail;

  for (
    let attempt = 0;
    attempt < 5;
    attempt += 1
  ) {
    const referralCode =
      buildReferralCode(
        educatorId,
        resolvedEducatorName,
        attempt,
      );

    const now = nowIso();

    const document: ReferralCodeDocument = {
      id: `referral-code-${randomUUID()}`,

      educatorId,
      educatorName:
        resolvedEducatorName,
      educatorEmail:
        resolvedEducatorEmail,

      referralCode,

      active: true,

      createdAt: now,
      updatedAt: now,
    };

    try {
      await referralCodes.insertOne(
        document,
      );

      await getOrCreateWallet(
        educatorId,
        resolvedEducatorName,
      );

      return document;
    } catch (error) {
      if (
        !isDuplicateKeyError(error)
      ) {
        throw error;
      }

      const documentCreatedByAnotherRequest =
        await referralCodes.findOne({
          educatorId,
        });

      if (
        documentCreatedByAnotherRequest
      ) {
        return stripMongoId(
          documentCreatedByAnotherRequest,
        );
      }
    }
  }

  throw new Error(
    "Unable to generate a unique educator referral code.",
  );
}

export async function validateEducatorReferralCode(
  referralCode: string,
) {
  await ensureRewardIndexes();

  const normalizedCode =
    normalizeReferralCode(
      referralCode,
    );

  if (!normalizedCode) {
    return null;
  }

  const {
    referralCodes,
  } = await getCollections();

  const document =
    await referralCodes.findOne({
      referralCode: normalizedCode,
      active: true,
    });

  if (!document) {
    return null;
  }

  const educator =
    await getEducatorUser(
      document.educatorId,
    );

  if (
    !educator ||
    educator.status === "rejected"
  ) {
    return null;
  }

  return stripMongoId(document);
}

export async function createEducatorReferral(
  input: CreateReferralInput,
) {
  await ensureRewardIndexes();

  const normalizedCode =
    normalizeReferralCode(
      input.referralCode,
    );

  if (!normalizedCode) {
    throw new Error(
      "A valid referral code is required.",
    );
  }

  const referralCodeDocument =
    await validateEducatorReferralCode(
      normalizedCode,
    );

  if (!referralCodeDocument) {
    throw new Error(
      "Referral code is invalid or inactive.",
    );
  }

  if (
    referralCodeDocument.educatorId ===
    input.studentId
  ) {
    throw new Error(
      "An educator cannot refer themselves.",
    );
  }

  const student =
    await getStudentUser(
      input.studentId,
    );

  if (!student) {
    throw new Error(
      "Registered student account was not found.",
    );
  }

  const settings =
    await getRewardSettings();

  const {
    referrals,
  } = await getCollections();

  const existingReferral =
    await referrals.findOne({
      studentId: input.studentId,
    });

  if (existingReferral) {
    throw new Error(
      "This student is already connected to a referral.",
    );
  }

  const now = nowIso();

  const referral: EducatorReferral = {
    id: `educator-referral-${randomUUID()}`,

    educatorId:
      referralCodeDocument.educatorId,
    educatorName:
      referralCodeDocument.educatorName,
    educatorEmail:
      referralCodeDocument.educatorEmail,

    studentId: input.studentId,
    studentName:
      input.studentName ||
      student.name,
    studentEmail:
      input.studentEmail ||
      student.email,
    studentMobile:
      input.studentMobile ||
      student.mobile,

    referralCode:
      referralCodeDocument.referralCode,

    programId:
      input.programId,
    programTitle:
      input.programTitle ||
      student.profile?.courseWantedTitle ||
      student.program,

    status: "registered",

    rewardAmount:
      settings.referralRewardAmount,

    rewardCredited: false,

    registrationCompletedAt: now,

    createdAt: now,
    updatedAt: now,
  };

  try {
    await referrals.insertOne(
      referral,
    );
  } catch (error) {
    if (
      isDuplicateKeyError(error)
    ) {
      throw new Error(
        "This student is already connected to a referral.",
      );
    }

    throw error;
  }

  return referral;
}

export async function getReferralByStudentId(
  studentId: string,
) {
  await ensureRewardIndexes();

  const {
    referrals,
  } = await getCollections();

  const referral =
    await referrals.findOne({
      studentId,
    });

  return referral
    ? stripMongoId(referral)
    : null;
}

export async function confirmReferralEnrollment(
  input: ConfirmReferralEnrollmentInput,
) {
  await ensureRewardIndexes();

  const {
    referrals,
  } = await getCollections();

  const referral =
    await referrals.findOne({
      studentId: input.studentId,
    });

  if (!referral) {
    return null;
  }

  if (
    referral.status === "cancelled" ||
    referral.status === "reversed"
  ) {
    throw new Error(
      "This referral is no longer active.",
    );
  }

  if (referral.rewardCredited) {
    return stripMongoId(referral);
  }

  const settings =
    await getRewardSettings();

  const now = nowIso();

  const nextStatus: ReferralStatus =
    settings.creditAfterPayment &&
    !referral.paymentConfirmedAt
      ? "pending_payment"
      : "pending_enrollment";

  await referrals.updateOne(
    {
      id: referral.id,
    },
    {
      $set: {
        programId:
          input.programId ??
          referral.programId,

        programTitle:
          input.programTitle ??
          referral.programTitle,

        enrollmentConfirmedAt: now,

        status: nextStatus,
        updatedAt: now,
      },
    },
  );

  const updatedReferral =
    await referrals.findOne({
      id: referral.id,
    });

  if (!updatedReferral) {
    throw new Error(
      "Referral could not be updated.",
    );
  }

  const paymentRequirementMet =
    !settings.creditAfterPayment ||
    Boolean(
      updatedReferral.paymentConfirmedAt,
    );

  if (paymentRequirementMet) {
    return creditReferralReward(
      updatedReferral.id,
      input.confirmedBy,
    );
  }

  return stripMongoId(
    updatedReferral,
  );
}

export async function confirmReferralPayment(
  input: ConfirmReferralEnrollmentInput,
) {
  await ensureRewardIndexes();

  const {
    referrals,
  } = await getCollections();

  const referral =
    await referrals.findOne({
      studentId: input.studentId,
    });

  if (!referral) {
    return null;
  }

  if (
    referral.status === "cancelled" ||
    referral.status === "reversed"
  ) {
    throw new Error(
      "This referral is no longer active.",
    );
  }

  if (referral.rewardCredited) {
    return stripMongoId(referral);
  }

  const settings =
    await getRewardSettings();

  const now = nowIso();

  const enrollmentRequirementMet =
    !settings.requireConfirmedEnrollment ||
    Boolean(
      referral.enrollmentConfirmedAt,
    );

  await referrals.updateOne(
    {
      id: referral.id,
    },
    {
      $set: {
        paymentConfirmedAt: now,

        programId:
          input.programId ??
          referral.programId,

        programTitle:
          input.programTitle ??
          referral.programTitle,

        status:
          enrollmentRequirementMet
            ? "pending_payment"
            : "pending_enrollment",

        updatedAt: now,
      },
    },
  );

  if (
    enrollmentRequirementMet
  ) {
    return creditReferralReward(
      referral.id,
      input.confirmedBy,
    );
  }

  const updated =
    await referrals.findOne({
      id: referral.id,
    });

  return updated
    ? stripMongoId(updated)
    : null;
}

export async function creditReferralReward(
  referralId: string,
  creditedBy?: string,
) {
  await ensureRewardIndexes();

  const {
    db,
  } = await getCollections();

  const mongoSession =
    db.client.startSession();

  let creditedReferral:
    | EducatorReferral
    | null = null;

  try {
    await mongoSession.withTransaction(
      async () => {
        const {
          referrals,
          wallets,
          transactions,
          users,
        } = await getCollections();

        const referral =
          await referrals.findOne(
            {
              id: referralId,
            },
            {
              session:
                mongoSession,
            },
          );

        if (!referral) {
          throw new Error(
            "Referral was not found.",
          );
        }

        if (
          referral.rewardCredited
        ) {
          creditedReferral =
            stripMongoId(
              referral,
            );

          return;
        }

        if (
          referral.status ===
            "cancelled" ||
          referral.status ===
            "reversed"
        ) {
          throw new Error(
            "Cancelled or reversed referrals cannot receive rewards.",
          );
        }

        const settingsDocument =
          await db
            .collection<
              MongoDocument<RewardSettings>
            >(
              REWARD_COLLECTIONS.settings,
            )
            .findOne(
              {
                id: "default",
              },
              {
                session:
                  mongoSession,
              },
            );

        const settings =
          settingsDocument
            ? stripMongoId(
                settingsDocument,
              )
            : getDefaultRewardSettings();

        if (
          settings.requireConfirmedEnrollment &&
          !referral.enrollmentConfirmedAt
        ) {
          throw new Error(
            "Student enrollment must be confirmed before crediting the reward.",
          );
        }

        if (
          settings.creditAfterPayment &&
          !referral.paymentConfirmedAt
        ) {
          throw new Error(
            "Student payment must be confirmed before crediting the reward.",
          );
        }

        if (
          settings.requireActiveStudentAccount
        ) {
          const student =
            await users.findOne(
              {
                id: referral.studentId,
                role: "student",
              },
              {
                session:
                  mongoSession,
              },
            );

          if (!student) {
            throw new Error(
              "Referred student account was not found.",
            );
          }

          if (
            student.status &&
            student.status !==
              "active"
          ) {
            throw new Error(
              "The referred student account must be active before crediting the reward.",
            );
          }
        }

        const rewardAmount =
          referral.rewardAmount > 0
            ? referral.rewardAmount
            : settings.referralRewardAmount;

        const walletBefore =
          await getOrCreateWallet(
            referral.educatorId,
            referral.educatorName,
            mongoSession,
          );

        const balanceBefore =
          walletBefore.availableBalance;

        const balanceAfter =
          balanceBefore +
          rewardAmount;

        const transactionId =
          `reward-transaction-${randomUUID()}`;

        const now = nowIso();

        const referralUpdate =
          await referrals.updateOne(
            {
              id: referral.id,
              rewardCredited: false,
            },
            {
              $set: {
                status: "successful",
                rewardAmount,
                rewardCredited: true,

                rewardTransactionId:
                  transactionId,

                rewardCreditedAt:
                  now,

                updatedAt: now,
              },
            },
            {
              session:
                mongoSession,
            },
          );

        if (
          referralUpdate.modifiedCount !==
          1
        ) {
          const existing =
            await referrals.findOne(
              {
                id: referral.id,
              },
              {
                session:
                  mongoSession,
              },
            );

          creditedReferral =
            existing
              ? stripMongoId(
                  existing,
                )
              : null;

          return;
        }

        await wallets.updateOne(
          {
            educatorId:
              referral.educatorId,
          },
          {
            $inc: {
              availableBalance:
                rewardAmount,

              totalEarned:
                rewardAmount,
            },

            $set: {
              educatorName:
                referral.educatorName,

              updatedAt: now,
            },
          },
          {
            session:
              mongoSession,
          },
        );

        const transaction: RewardTransaction =
          {
            id: transactionId,

            educatorId:
              referral.educatorId,
            educatorName:
              referral.educatorName,

            type: "referral_credit",

            amount: rewardAmount,

            description:
              `Referral reward for ${referral.studentName}`,

            referralId:
              referral.id,

            balanceBefore,
            balanceAfter,

            createdBy:
              creditedBy,

            createdByRole:
              creditedBy
                ? "admin"
                : "system",

            createdAt: now,
          };

        await transactions.insertOne(
          transaction,
          {
            session:
              mongoSession,
          },
        );

        const updatedReferral =
          await referrals.findOne(
            {
              id: referral.id,
            },
            {
              session:
                mongoSession,
            },
          );

        creditedReferral =
          updatedReferral
            ? stripMongoId(
                updatedReferral,
              )
            : null;
      },
    );
  } finally {
    await mongoSession.endSession();
  }

  if (!creditedReferral) {
    throw new Error(
      "Referral reward could not be credited.",
    );
  }

  return creditedReferral;
}

export async function cancelEducatorReferral(
  referralId: string,
  reason?: string,
) {
  await ensureRewardIndexes();

  const {
    referrals,
  } = await getCollections();

  const referral =
    await referrals.findOne({
      id: referralId,
    });

  if (!referral) {
    return null;
  }

  if (
    referral.rewardCredited
  ) {
    throw new Error(
      "A credited referral must be reversed instead of cancelled.",
    );
  }

  if (
    referral.status === "reversed"
  ) {
    throw new Error(
      "A reversed referral cannot be cancelled.",
    );
  }

  const now = nowIso();

  await referrals.updateOne(
    {
      id: referralId,
    },
    {
      $set: {
        status: "cancelled",

        cancellationReason:
          reason?.trim() ||
          "Referral cancelled.",

        updatedAt: now,
      },
    },
  );

  const updated =
    await referrals.findOne({
      id: referralId,
    });

  return updated
    ? stripMongoId(updated)
    : null;
}

export async function reverseReferralReward(
  referralId: string,
  reversedBy?: string,
  reason?: string,
) {
  await ensureRewardIndexes();

  const {
    db,
  } = await getCollections();

  const mongoSession =
    db.client.startSession();

  let reversedReferral:
    | EducatorReferral
    | null = null;

  try {
    await mongoSession.withTransaction(
      async () => {
        const {
          referrals,
          wallets,
          transactions,
        } = await getCollections();

        const referral =
          await referrals.findOne(
            {
              id: referralId,
            },
            {
              session:
                mongoSession,
            },
          );

        if (!referral) {
          throw new Error(
            "Referral was not found.",
          );
        }

        if (
          referral.status === "reversed"
        ) {
          reversedReferral =
            stripMongoId(
              referral,
            );

          return;
        }

        if (
          !referral.rewardCredited
        ) {
          throw new Error(
            "This referral has no credited reward to reverse.",
          );
        }

        const wallet =
          await wallets.findOne(
            {
              educatorId:
                referral.educatorId,
            },
            {
              session:
                mongoSession,
            },
          );

        if (!wallet) {
          throw new Error(
            "Educator reward wallet was not found.",
          );
        }

        if (
          wallet.availableBalance <
          referral.rewardAmount
        ) {
          throw new Error(
            "The reward has already been redeemed or the available balance is insufficient. Admin review is required.",
          );
        }

        const balanceBefore =
          wallet.availableBalance;

        const balanceAfter =
          balanceBefore -
          referral.rewardAmount;

        const now = nowIso();

        await wallets.updateOne(
          {
            educatorId:
              referral.educatorId,

            availableBalance: {
              $gte:
                referral.rewardAmount,
            },
          },
          {
            $inc: {
              availableBalance:
                -referral.rewardAmount,

              totalReversed:
                referral.rewardAmount,
            },

            $set: {
              updatedAt: now,
            },
          },
          {
            session:
              mongoSession,
          },
        );

        await referrals.updateOne(
          {
            id: referral.id,
          },
          {
            $set: {
              status: "reversed",

              cancellationReason:
                reason?.trim() ||
                "Referral reward reversed.",

              reversedAt: now,
              reversedBy,

              updatedAt: now,
            },
          },
          {
            session:
              mongoSession,
          },
        );

        const transaction: RewardTransaction =
          {
            id: `reward-transaction-${randomUUID()}`,

            educatorId:
              referral.educatorId,

            educatorName:
              referral.educatorName,

            type: "reward_reversal",

            amount:
              referral.rewardAmount,

            description:
              reason?.trim() ||
              `Referral reward reversed for ${referral.studentName}`,

            referralId:
              referral.id,

            balanceBefore,
            balanceAfter,

            createdBy:
              reversedBy,

            createdByRole:
              "admin",

            createdAt: now,
          };

        await transactions.insertOne(
          transaction,
          {
            session:
              mongoSession,
          },
        );

        const updated =
          await referrals.findOne(
            {
              id: referral.id,
            },
            {
              session:
                mongoSession,
            },
          );

        reversedReferral =
          updated
            ? stripMongoId(
                updated,
              )
            : null;
      },
    );
  } finally {
    await mongoSession.endSession();
  }

  return reversedReferral;
}

function validateRedemptionDetails(
  input: CreateRewardRedemptionInput,
) {
  if (
    input.paymentMethod === "upi"
  ) {
    const upiId =
      input.upiId?.trim() || "";

    if (
      !/^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$/.test(
        upiId,
      )
    ) {
      throw new Error(
        "Enter a valid UPI ID.",
      );
    }

    return;
  }

  const bankDetails =
    input.bankDetails;

  if (!bankDetails) {
    throw new Error(
      "Bank details are required.",
    );
  }

  if (
    !bankDetails.accountHolderName.trim()
  ) {
    throw new Error(
      "Account holder name is required.",
    );
  }

  if (
    !/^\d{6,20}$/.test(
      bankDetails.accountNumber.trim(),
    )
  ) {
    throw new Error(
      "Enter a valid bank account number.",
    );
  }

  if (
    !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(
      bankDetails.ifscCode.trim(),
    )
  ) {
    throw new Error(
      "Enter a valid IFSC code.",
    );
  }
}

export async function createRewardRedemption(
  educatorId: string,
  educatorName: string,
  educatorEmail: string | undefined,
  input: CreateRewardRedemptionInput,
) {
  await ensureRewardIndexes();

  const settings =
    await getRewardSettings();

  if (
    !settings.redemptionsEnabled
  ) {
    throw new Error(
      "Reward redemptions are currently disabled.",
    );
  }

  const amount =
    normalizeMoney(input.amount);

  if (
    amount <
    settings.minimumRedemptionAmount
  ) {
    throw new Error(
      `Minimum redemption amount is ₹${settings.minimumRedemptionAmount.toLocaleString(
        "en-IN",
      )}.`,
    );
  }

  validateRedemptionDetails(
    input,
  );

  const {
    db,
  } = await getCollections();

  const mongoSession =
    db.client.startSession();

  let createdRedemption:
    | RewardRedemption
    | null = null;

  try {
    await mongoSession.withTransaction(
      async () => {
        const {
          wallets,
          transactions,
          redemptions,
        } = await getCollections();

        const wallet =
          await getOrCreateWallet(
            educatorId,
            educatorName,
            mongoSession,
          );

        if (
          wallet.availableBalance <
          amount
        ) {
          throw new Error(
            "Your available reward balance is insufficient.",
          );
        }

        const balanceBefore =
          wallet.availableBalance;

        const balanceAfter =
          balanceBefore -
          amount;

        const redemptionId =
          `reward-redemption-${randomUUID()}`;

        const transactionId =
          `reward-transaction-${randomUUID()}`;

        const now = nowIso();

        const walletResult =
          await wallets.updateOne(
            {
              educatorId,

              availableBalance: {
                $gte: amount,
              },
            },
            {
              $inc: {
                availableBalance:
                  -amount,
              },

              $set: {
                educatorName,
                updatedAt: now,
              },
            },
            {
              session:
                mongoSession,
            },
          );

        if (
          walletResult.modifiedCount !==
          1
        ) {
          throw new Error(
            "Your available reward balance changed. Please try again.",
          );
        }

        const redemption: RewardRedemption =
          {
            id: redemptionId,

            educatorId,
            educatorName,
            educatorEmail,

            amount,

            paymentMethod:
              input.paymentMethod,

            upiId:
              input.paymentMethod ===
              "upi"
                ? input.upiId?.trim()
                : undefined,

            bankDetails:
              input.paymentMethod ===
              "bank" &&
              input.bankDetails
                ? {
                    accountHolderName:
                      input.bankDetails.accountHolderName.trim(),

                    accountNumber:
                      input.bankDetails.accountNumber.trim(),

                    ifscCode:
                      input.bankDetails.ifscCode
                        .trim()
                        .toUpperCase(),

                    bankName:
                      input.bankDetails.bankName?.trim(),
                  }
                : undefined,

            status: "pending",

            walletTransactionId:
              transactionId,

            requestedAt: now,
            updatedAt: now,
          };

        const transaction: RewardTransaction =
          {
            id: transactionId,

            educatorId,
            educatorName,

            type: "redemption_debit",

            amount,

            description:
              "Reward redemption request",

            redemptionId,

            balanceBefore,
            balanceAfter,

            createdBy:
              educatorId,

            createdByRole:
              "educator",

            createdAt: now,
          };

        await redemptions.insertOne(
          redemption,
          {
            session:
              mongoSession,
          },
        );

        await transactions.insertOne(
          transaction,
          {
            session:
              mongoSession,
          },
        );

        createdRedemption =
          redemption;
      },
    );
  } finally {
    await mongoSession.endSession();
  }

  if (!createdRedemption) {
    throw new Error(
      "Redemption request could not be created.",
    );
  }

  return createdRedemption;
}

export async function processRewardRedemption(
  redemptionId: string,
  input: ProcessRedemptionInput,
  admin: {
    id: string;
    name: string;
  },
) {
  await ensureRewardIndexes();

  const {
    db,
  } = await getCollections();

  const mongoSession =
    db.client.startSession();

  let processedRedemption:
    | RewardRedemption
    | null = null;

  try {
    await mongoSession.withTransaction(
      async () => {
        const {
          redemptions,
          wallets,
          transactions,
        } = await getCollections();

        const redemption =
          await redemptions.findOne(
            {
              id: redemptionId,
            },
            {
              session:
                mongoSession,
            },
          );

        if (!redemption) {
          throw new Error(
            "Redemption request was not found.",
          );
        }

        if (
          input.action === "approve"
        ) {
          if (
            redemption.status !==
            "pending"
          ) {
            throw new Error(
              "Only pending redemption requests can be approved.",
            );
          }

          const now = nowIso();

          await redemptions.updateOne(
            {
              id: redemptionId,
              status: "pending",
            },
            {
              $set: {
                status: "approved",
                approvedAt: now,

                processedBy:
                  admin.id,

                processedByName:
                  admin.name,

                adminNote:
                  input.adminNote?.trim(),

                updatedAt: now,
              },
            },
            {
              session:
                mongoSession,
            },
          );
        }

        if (
          input.action === "reject"
        ) {
          if (
            redemption.status !==
              "pending" &&
            redemption.status !==
              "approved"
          ) {
            throw new Error(
              "This redemption request cannot be rejected.",
            );
          }

          const wallet =
            await wallets.findOne(
              {
                educatorId:
                  redemption.educatorId,
              },
              {
                session:
                  mongoSession,
              },
            );

          if (!wallet) {
            throw new Error(
              "Educator reward wallet was not found.",
            );
          }

          const balanceBefore =
            wallet.availableBalance;

          const balanceAfter =
            balanceBefore +
            redemption.amount;

          const now = nowIso();

          await wallets.updateOne(
            {
              educatorId:
                redemption.educatorId,
            },
            {
              $inc: {
                availableBalance:
                  redemption.amount,
              },

              $set: {
                updatedAt: now,
              },
            },
            {
              session:
                mongoSession,
            },
          );

          await redemptions.updateOne(
            {
              id: redemptionId,
            },
            {
              $set: {
                status: "rejected",

                rejectionReason:
                  input.rejectionReason?.trim() ||
                  "Redemption request rejected.",

                adminNote:
                  input.adminNote?.trim(),

                rejectedAt: now,

                processedBy:
                  admin.id,

                processedByName:
                  admin.name,

                updatedAt: now,
              },
            },
            {
              session:
                mongoSession,
            },
          );

          const releaseTransaction: RewardTransaction =
            {
              id: `reward-transaction-${randomUUID()}`,

              educatorId:
                redemption.educatorId,

              educatorName:
                redemption.educatorName,

              type:
                "redemption_release",

              amount:
                redemption.amount,

              description:
                "Rejected redemption amount returned to wallet",

              redemptionId:
                redemption.id,

              balanceBefore,
              balanceAfter,

              createdBy:
                admin.id,

              createdByRole:
                "admin",

              createdAt: now,
            };

          await transactions.insertOne(
            releaseTransaction,
            {
              session:
                mongoSession,
            },
          );
        }

        if (
          input.action ===
          "mark_paid"
        ) {
          if (
            redemption.status !==
              "approved" &&
            redemption.status !==
              "pending"
          ) {
            throw new Error(
              "Only pending or approved redemption requests can be marked as paid.",
            );
          }

          const transactionReference =
            input.transactionReference?.trim();

          if (
            !transactionReference
          ) {
            throw new Error(
              "Transaction reference is required before marking the redemption as paid.",
            );
          }

          const now = nowIso();

          await redemptions.updateOne(
            {
              id: redemptionId,
            },
            {
              $set: {
                status: "paid",

                transactionReference,

                adminNote:
                  input.adminNote?.trim(),

                paidAt: now,

                processedBy:
                  admin.id,

                processedByName:
                  admin.name,

                updatedAt: now,
              },
            },
            {
              session:
                mongoSession,
            },
          );

          await wallets.updateOne(
            {
              educatorId:
                redemption.educatorId,
            },
            {
              $inc: {
                totalRedeemed:
                  redemption.amount,
              },

              $set: {
                updatedAt: now,
              },
            },
            {
              session:
                mongoSession,
            },
          );
        }

        const updated =
          await redemptions.findOne(
            {
              id: redemptionId,
            },
            {
              session:
                mongoSession,
            },
          );

        processedRedemption =
          updated
            ? stripMongoId(
                updated,
              )
            : null;
      },
    );
  } finally {
    await mongoSession.endSession();
  }

  return processedRedemption;
}

export async function getEducatorRewardDashboard(
  educatorId: string,
  educatorName: string,
  educatorEmail?: string,
): Promise<EducatorRewardDashboard> {
  await ensureRewardIndexes();

  const [
    referralCodeDocument,
    settings,
  ] = await Promise.all([
    getOrCreateEducatorReferralCode(
      educatorId,
      educatorName,
      educatorEmail,
    ),

    getRewardSettings(),
  ]);

  const {
    referrals,
    transactions,
    redemptions,
  } = await getCollections();

  const [
    wallet,
    referralDocuments,
    transactionDocuments,
    redemptionDocuments,
  ] = await Promise.all([
    getOrCreateWallet(
      educatorId,
      educatorName,
    ),

    referrals
      .find({
        educatorId,
      })
      .sort({
        createdAt: -1,
      })
      .toArray(),

    transactions
      .find({
        educatorId,
      })
      .sort({
        createdAt: -1,
      })
      .limit(100)
      .toArray(),

    redemptions
      .find({
        educatorId,
      })
      .sort({
        requestedAt: -1,
      })
      .limit(100)
      .toArray(),
  ]);

  const educatorReferrals =
    stripMongoIds(
      referralDocuments,
    ) as EducatorReferral[];

  const educatorTransactions =
    stripMongoIds(
      transactionDocuments,
    ) as RewardTransaction[];

  const educatorRedemptions =
    stripMongoIds(
      redemptionDocuments,
    ) as RewardRedemption[];

  const successfulReferrals =
    educatorReferrals.filter(
      (referral) =>
        referral.status ===
        "successful",
    );

  const pendingReferrals =
    educatorReferrals.filter(
      (referral) =>
        referral.status ===
          "registered" ||
        referral.status ===
          "pending_enrollment" ||
        referral.status ===
          "pending_payment",
    );

  const pendingRewardAmount =
    pendingReferrals.reduce(
      (total, referral) =>
        total +
        referral.rewardAmount,
      0,
    );

  const summary: EducatorRewardSummary =
    {
      referralCode:
        referralCodeDocument.referralCode,


      availableBalance:
        wallet.availableBalance,

      totalEarned:
        wallet.totalEarned,

      totalRedeemed:
        wallet.totalRedeemed,

      totalReferrals:
        educatorReferrals.length,

      successfulReferrals:
        successfulReferrals.length,

      pendingReferrals:
        pendingReferrals.length,

      pendingRewardAmount,

      minimumRedemptionAmount:
        settings.minimumRedemptionAmount,

      referralRewardAmount:
        settings.referralRewardAmount,

      redemptionsEnabled:
        settings.redemptionsEnabled,
    };

  return {
    summary,
    wallet,

    referrals:
      educatorReferrals,

    transactions:
      educatorTransactions,

    redemptions:
      educatorRedemptions,

    settings,
  };
}

export async function getAdminRewardDashboard(): Promise<AdminRewardDashboard> {
  await ensureRewardIndexes();

  const {
    referrals,
    redemptions,
  } = await getCollections();

  const [
    settings,
    referralDocuments,
    redemptionDocuments,
  ] = await Promise.all([
    getRewardSettings(),

    referrals
      .find({})
      .sort({
        createdAt: -1,
      })
      .limit(500)
      .toArray(),

    redemptions
      .find({})
      .sort({
        requestedAt: -1,
      })
      .limit(500)
      .toArray(),
  ]);

  const allReferrals =
    stripMongoIds(
      referralDocuments,
    ) as EducatorReferral[];

  const allRedemptions =
    stripMongoIds(
      redemptionDocuments,
    ) as RewardRedemption[];

  const successfulReferrals =
    allReferrals.filter(
      (referral) =>
        referral.status ===
        "successful",
    );

  const pendingReferrals =
    allReferrals.filter(
      (referral) =>
        referral.status ===
          "registered" ||
        referral.status ===
          "pending_enrollment" ||
        referral.status ===
          "pending_payment",
    );

  const cancelledReferrals =
    allReferrals.filter(
      (referral) =>
        referral.status ===
          "cancelled" ||
        referral.status ===
          "reversed",
    );

  const pendingRedemptions =
    allRedemptions.filter(
      (redemption) =>
        redemption.status ===
          "pending" ||
        redemption.status ===
          "approved",
    );

  const summary: AdminRewardSummary =
    {
      totalReferrals:
        allReferrals.length,

      successfulReferrals:
        successfulReferrals.length,

      pendingReferrals:
        pendingReferrals.length,

      cancelledReferrals:
        cancelledReferrals.length,

      totalRewardsCredited:
        successfulReferrals.reduce(
          (total, referral) =>
            total +
            referral.rewardAmount,
          0,
        ),

      totalRewardsRedeemed:
        allRedemptions
          .filter(
            (redemption) =>
              redemption.status ===
              "paid",
          )
          .reduce(
            (total, redemption) =>
              total +
              redemption.amount,
            0,
          ),

      pendingRedemptionCount:
        pendingRedemptions.length,

      pendingRedemptionAmount:
        pendingRedemptions.reduce(
          (total, redemption) =>
            total +
            redemption.amount,
          0,
        ),
    };

  return {
    summary,

    referrals:
      allReferrals,

    redemptions:
      allRedemptions,

    settings,
  };
}