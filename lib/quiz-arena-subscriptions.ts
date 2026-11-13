import "server-only";

import { randomUUID } from "node:crypto";

import { getMongoDatabase } from "@/lib/mongodb";

import { getQuizArenaExamScopeByKey } from "@/lib/quiz-arena-exam-scope";

/**
 * SmartIQ Institute
 * Quiz Arena — Exam-Specific Subscription System
 *
 * NEW SUBSCRIPTION RULES
 *
 * 1. ₹49 for 30 days.
 * 2. Each purchase is for one individual exam.
 * 3. School subscriptions are specific to class,
 *    stream and board where applicable.
 * 4. Students may purchase multiple exams.
 * 5. Each exam expires independently.
 * 6. Quarterly and annual plans are no longer
 *    available for new purchases.
 * 7. Historical subscriptions and payments remain
 *    in MongoDB.
 *
 * IMPORTANT:
 *
 * This file manages subscription records.
 * Razorpay payment verification is handled by the
 * payment verification and activation modules.
 */

const COLLECTIONS = {
  plans: "quiz_arena_subscription_plans",
  subscriptions: "quiz_arena_subscriptions",
  payments: "quiz_arena_payments",
} as const;

/**
 * Subscription plan definition.
 *
 * The plan controls the price and duration.
 * The examScopeKey controls which exam is unlocked.
 *
 * Every exam uses the same monthly plan.
 */
export type QuizArenaPlan = {
  id: string;
  name: string;
  price: number;
  amountPaise: number;
  currency: "INR";
  durationDays: number;
  active: boolean;
};

/**
 * Only this plan may be offered for NEW purchases.
 */
export const QUIZ_ARENA_PLAN: QuizArenaPlan = {
  id: "quiz-arena-30-days",
  name: "Quiz Arena Monthly — Per Exam",
  price: 49,
  amountPaise: 4900,
  currency: "INR",
  durationDays: 30,
  active: true,
};

/**
 * Publicly purchasable plans.
 *
 * There are no quarterly or annual plans.
 */
export const QUIZ_ARENA_PLANS: QuizArenaPlan[] = [QUIZ_ARENA_PLAN];

/**
 * Historical pricing definitions.
 *
 * These are NOT available for new purchases.
 *
 * They are retained only to support historical
 * payment records, audits and safe reconciliation
 * of orders created under the previous system.
 */
export const QUIZ_ARENA_LEGACY_PLANS: QuizArenaPlan[] = [
  {
    id: "quiz-arena-90-days",
    name: "Quiz Arena Quarterly — Legacy",
    price: 120,
    amountPaise: 12000,
    currency: "INR",
    durationDays: 90,
    active: false,
  },
  {
    id: "quiz-arena-365-days",
    name: "Quiz Arena Annual — Legacy",
    price: 500,
    amountPaise: 50000,
    currency: "INR",
    durationDays: 365,
    active: false,
  },
];

/**
 * A subscription either represents:
 *
 * NEW:
 *   One exact examScopeKey.
 *
 * LEGACY:
 *   A historical global subscription without an
 *   examScopeKey.
 *
 * The optional fields are intentional because
 * old MongoDB documents must remain readable.
 */
export type QuizArenaSubscription = {
  id: string;
  userId: string;
  planId: string;

  examScopeKey?: string | null;
  examTitle?: string | null;

  startsAt: string;
  expiresAt: string;

  paymentId: string;
  createdAt: string;
};

/**
 * The exam scope is recorded when the order
 * is originally created.
 *
 * It must never be accepted from the browser
 * during payment verification or activation.
 */
export type QuizArenaPayment = {
  id: string;
  userId: string;
  planId: string;

  examScopeKey?: string | null;
  examTitle?: string | null;

  razorpayOrderId: string;
  razorpayPaymentId?: string;

  amountPaise: number;
  currency: "INR";

  status: "created" | "paid" | "failed";

  createdAt: string;
  paidAt?: string;
};

/**
 * Return a plan eligible for NEW purchases.
 *
 * Quarterly and annual IDs always return null.
 *
 * Server payment-order creation must use this
 * function or the equivalent strict monthly-only
 * validation.
 */
export function getQuizArenaPlanById(planId: string): QuizArenaPlan | null {
  return (
    QUIZ_ARENA_PLANS.find(
      (plan) => plan.id === planId && plan.active === true,
    ) ?? null
  );
}

/**
 * Historical plan lookup.
 *
 * Use only for previously created orders or
 * subscription history.
 *
 * DO NOT use this function to create new
 * Razorpay orders.
 */
export function getHistoricalQuizArenaPlanById(
  planId: string,
): QuizArenaPlan | null {
  return (
    QUIZ_ARENA_PLANS.find((plan) => plan.id === planId) ??
    QUIZ_ARENA_LEGACY_PLANS.find((plan) => plan.id === planId) ??
    null
  );
}

/**
 * Read the active purchasable plans from MongoDB.
 *
 * The server defines the trusted price.
 *
 * MongoDB cannot override:
 * - Plan ID
 * - Price
 * - Amount in paise
 * - Currency
 * - Duration
 *
 * This ensures that an old quarterly or
 * annual database record cannot accidentally
 * become purchasable again.
 */
export async function getQuizArenaSubscriptionPlans(): Promise<
  QuizArenaPlan[]
> {
  const db = await getMongoDatabase();

  const collection = db.collection<QuizArenaPlan>(COLLECTIONS.plans);

  const storedPlans = await collection
    .find({
      active: true,
    })
    .project<QuizArenaPlan>({
      _id: 0,
    })
    .toArray();

  return QUIZ_ARENA_PLANS.filter((plan) =>
    storedPlans.some(
      (stored) =>
        stored.id === plan.id &&
        stored.active === true &&
        stored.price === plan.price &&
        stored.amountPaise === plan.amountPaise &&
        stored.currency === plan.currency &&
        stored.durationDays === plan.durationDays,
    ),
  );
}

/**
 * Validate that a subscription covers one
 * specific exam in the official catalogue.
 */
export function isValidQuizArenaSubscriptionScope(
  examScopeKey: unknown,
): boolean {
  return getQuizArenaExamScopeByKey(examScopeKey) !== null;
}

/**
 * Identify historical GLOBAL subscriptions.
 *
 * Older records have no examScopeKey.
 *
 * These subscriptions remain valid until
 * their original expiry.
 *
 * Newly verified payments must always have
 * an examScopeKey and must never create
 * new global subscriptions.
 */
export function isLegacyQuizArenaSubscription(
  subscription: Pick<QuizArenaSubscription, "examScopeKey">,
): boolean {
  return (
    subscription.examScopeKey === undefined ||
    subscription.examScopeKey === null ||
    subscription.examScopeKey === ""
  );
}

/**
 * Backward-compatible global subscription lookup.
 *
 * IMPORTANT:
 * This function deliberately checks LEGACY global
 * subscriptions only.
 *
 * It must not return an exam-specific subscription,
 * because existing callers may interpret the result
 * as access to the entire Quiz Arena.
 *
 * New exam-specific access checks should use
 * lib/quiz-arena-exam-entitlements.ts.
 */
export async function getActiveQuizArenaSubscription(
  userId: string,
): Promise<QuizArenaSubscription | null> {
  if (!userId.trim()) {
    return null;
  }

  const db = await getMongoDatabase();

  const collection = db.collection<QuizArenaSubscription>(
    COLLECTIONS.subscriptions,
  );

  const now = new Date().toISOString();

  return collection.findOne(
    {
      userId,
      startsAt: {
        $lte: now,
      },
      expiresAt: {
        $gt: now,
      },
      $or: [
        {
          examScopeKey: {
            $exists: false,
          },
        },
        {
          examScopeKey: null,
        },
        {
          examScopeKey: "",
        },
      ],
    },
    {
      sort: {
        expiresAt: -1,
      },
      projection: {
        _id: 0,
      },
    },
  );
}

/**
 * Retained for compatibility with existing
 * global subscription checks.
 *
 * This function will not grant global access
 * through an individual exam subscription.
 */
export async function hasActiveQuizArenaSubscription(
  userId: string,
): Promise<boolean> {
  return (await getActiveQuizArenaSubscription(userId)) !== null;
}

/**
 * Find an active subscription for one exact exam.
 *
 * The key must resolve to an individual exam,
 * school class and board where appropriate.
 */
export async function getActiveQuizArenaSubscriptionForExam(
  userId: string,
  examScopeKey: string,
): Promise<QuizArenaSubscription | null> {
  if (!userId.trim()) {
    return null;
  }

  const scope = getQuizArenaExamScopeByKey(examScopeKey);

  if (!scope) {
    return null;
  }

  const db = await getMongoDatabase();

  const subscriptions = db.collection<QuizArenaSubscription>(
    COLLECTIONS.subscriptions,
  );

  const now = new Date().toISOString();

  return subscriptions.findOne(
    {
      userId,
      examScopeKey: scope.key,
      startsAt: {
        $lte: now,
      },
      expiresAt: {
        $gt: now,
      },
    },
    {
      sort: {
        expiresAt: -1,
      },
      projection: {
        _id: 0,
      },
    },
  );
}

/**
 * Calculate expiry from a subscription start date.
 *
 * Current monthly plan: 30 days.
 *
 * This also supports historical subscriptions
 * that used 90 or 365 days.
 */
export function calculateQuizArenaExpiry(
  startsAt: Date,
  durationDays: number = QUIZ_ARENA_PLAN.durationDays,
): Date {
  if (
    Number.isNaN(startsAt.getTime()) ||
    !Number.isInteger(durationDays) ||
    durationDays <= 0
  ) {
    throw new Error("Invalid subscription date or duration.");
  }

  const expiresAt = new Date(startsAt.getTime());

  expiresAt.setUTCDate(expiresAt.getUTCDate() + durationDays);

  return expiresAt;
}

/**
 * Return the complete subscription history.
 *
 * Includes:
 * - Active subscriptions
 * - Expired subscriptions
 * - Historical global subscriptions
 * - Individual exam subscriptions
 *
 * Never filter or delete historical records
 * merely because a plan is no longer sold.
 */
export async function getQuizArenaSubscriptionHistory(
  userId: string,
): Promise<QuizArenaSubscription[]> {
  if (!userId.trim()) {
    return [];
  }

  const db = await getMongoDatabase();

  const collection = db.collection<QuizArenaSubscription>(
    COLLECTIONS.subscriptions,
  );

  const subscriptions = await collection
    .find({
      userId,
    })
    .sort({
      createdAt: -1,
    })
    .toArray();

  return subscriptions.map(({ _id, ...subscription }) => subscription);
}

/**
 * Return the student's active individual exams.
 *
 * Legacy subscriptions are intentionally excluded.
 * Their global access is handled separately.
 *
 * If a student has renewed the same exam several
 * times, return the subscription with the latest
 * expiry for that exam.
 */
export async function getActiveQuizArenaExamSubscriptions(
  userId: string,
): Promise<QuizArenaSubscription[]> {
  if (!userId.trim()) {
    return [];
  }

  const db = await getMongoDatabase();

  const collection = db.collection<QuizArenaSubscription>(
    COLLECTIONS.subscriptions,
  );

  const now = new Date().toISOString();

  const subscriptions = await collection
    .find({
      userId,
      startsAt: {
        $lte: now,
      },
      expiresAt: {
        $gt: now,
      },
      examScopeKey: {
        $type: "string",
        $ne: "",
      },
    })
    .sort({
      expiresAt: -1,
    })
    .toArray();

  const seenScopes = new Set<string>();

  const result: QuizArenaSubscription[] = [];

  for (const subscription of subscriptions) {
    const scope = getQuizArenaExamScopeByKey(subscription.examScopeKey);

    if (!scope) {
      continue;
    }

    if (seenScopes.has(scope.key)) {
      continue;
    }

    seenScopes.add(scope.key);

    result.push({
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.planId,
      examScopeKey: scope.key,
      examTitle: scope.title,
      startsAt: subscription.startsAt,
      expiresAt: subscription.expiresAt,
      paymentId: subscription.paymentId,
      createdAt: subscription.createdAt,
    });
  }

  return result;
}

/**
 * Activate an individually purchased exam.
 *
 * This is a compatibility helper for existing
 * code that calls the subscription module
 * directly after verification.
 *
 * IMPORTANT:
 *
 * The payment must already exist in MongoDB
 * with status "paid" and a verified payment ID.
 *
 * The exam is read from the ORIGINAL stored
 * order, not from the caller.
 *
 * New exam subscriptions cannot be created
 * without a valid examScopeKey.
 *
 * The transactional payment activation module
 * remains the preferred payment activation path.
 */
export async function activateVerifiedQuizArenaSubscription(input: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}): Promise<QuizArenaSubscription> {
  const db = await getMongoDatabase();

  const payments = db.collection<QuizArenaPayment>(COLLECTIONS.payments);

  const subscriptions = db.collection<QuizArenaSubscription>(
    COLLECTIONS.subscriptions,
  );

  const payment = await payments.findOne({
    userId: input.userId,
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    status: "paid",
    currency: "INR",
  });

  if (!payment) {
    throw new Error("A verified Quiz Arena payment record is required.");
  }

  /**
   * Only the new monthly plan is allowed
   * to create a new exam-specific subscription.
   */
  const plan = getQuizArenaPlanById(payment.planId);

  if (!plan) {
    throw new Error(
      "This plan is not eligible for a new Quiz Arena subscription.",
    );
  }

  if (
    payment.amountPaise !== plan.amountPaise ||
    payment.currency !== plan.currency
  ) {
    throw new Error("Subscription payment amount mismatch.");
  }

  /**
   * Resolve the exam from trusted stored
   * payment information.
   */
  const scope = getQuizArenaExamScopeByKey(payment.examScopeKey);

  if (!scope) {
    throw new Error(
      "A valid exam scope is required to activate a subscription.",
    );
  }

  if (payment.examTitle && payment.examTitle !== scope.title) {
    throw new Error(
      "Payment exam details do not match the official catalogue.",
    );
  }

  await subscriptions.createIndex(
    {
      paymentId: 1,
    },
    {
      unique: true,
    },
  );

  /**
   * Idempotency:
   *
   * Processing the same verified payment twice
   * must not create two subscriptions.
   */
  const existing = await subscriptions.findOne({
    paymentId: input.razorpayPaymentId,
  });

  if (existing) {
    if (
      existing.userId !== input.userId ||
      existing.planId !== payment.planId ||
      existing.examScopeKey !== scope.key
    ) {
      throw new Error("Payment ownership, plan or exam mismatch.");
    }

    return existing;
  }

  const start = new Date();

  const now = start.toISOString();

  const subscription: QuizArenaSubscription = {
    id: `quiz-sub-${randomUUID()}`,

    userId: input.userId,

    planId: plan.id,

    examScopeKey: scope.key,

    examTitle: scope.title,

    startsAt: now,

    expiresAt: calculateQuizArenaExpiry(start, plan.durationDays).toISOString(),

    paymentId: input.razorpayPaymentId,

    createdAt: now,
  };

  try {
    await subscriptions.insertOne(subscription);

    return subscription;
  } catch (error) {
    /**
     * Concurrent payment callbacks can race.
     *
     * Read the subscription again before
     * treating the insert as a failure.
     */
    const saved = await subscriptions.findOne({
      paymentId: input.razorpayPaymentId,
    });

    if (
      saved &&
      saved.userId === input.userId &&
      saved.planId === plan.id &&
      saved.examScopeKey === scope.key
    ) {
      return saved;
    }

    throw error;
  }
}
