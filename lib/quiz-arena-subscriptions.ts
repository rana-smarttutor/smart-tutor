
import "server-only";

import { randomUUID } from "node:crypto";
import { getMongoDatabase } from "@/lib/mongodb";

const COLLECTIONS = {
  plans: "quiz_arena_subscription_plans",
  subscriptions: "quiz_arena_subscriptions",
  payments: "quiz_arena_payments",
} as const;

export type QuizArenaPlan = {
  id: string;
  name: string;
  price: number;
  amountPaise: number;
  currency: "INR";
  durationDays: number;
  active: boolean;
};

export const QUIZ_ARENA_PLAN: QuizArenaPlan = {
  id: "quiz-arena-30-days",
  name: "Quiz Arena Monthly",
  price: 49,
  amountPaise: 4900,
  currency: "INR",
  durationDays: 30,
  active: true,
};

export const QUIZ_ARENA_PLANS: QuizArenaPlan[] = [
  QUIZ_ARENA_PLAN,
  {
    id: "quiz-arena-90-days",
    name: "Quiz Arena Quarterly",
    price: 120,
    amountPaise: 12000,
    currency: "INR",
    durationDays: 90,
    active: true,
  },
  {
    id: "quiz-arena-365-days",
    name: "Quiz Arena Annual",
    price: 500,
    amountPaise: 50000,
    currency: "INR",
    durationDays: 365,
    active: true,
  },
];

export type QuizArenaSubscription = {
  id: string;
  userId: string;
  planId: string;
  startsAt: string;
  expiresAt: string;
  paymentId: string;
  createdAt: string;
};

export type QuizArenaPayment = {
  id: string;
  userId: string;
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amountPaise: number;
  currency: "INR";
  status: "created" | "paid" | "failed";
  createdAt: string;
  paidAt?: string;
};

export function getQuizArenaPlanById(
  planId: string,
): QuizArenaPlan | null {
  return (
    QUIZ_ARENA_PLANS.find(
      (plan) => plan.id === planId && plan.active,
    ) ?? null
  );
}

export async function getQuizArenaSubscriptionPlans(): Promise<
  QuizArenaPlan[]
> {
  const db = await getMongoDatabase();
  const collection = db.collection<QuizArenaPlan>(
    COLLECTIONS.plans,
  );

  const storedPlans = await collection
    .find({ active: true })
    .project<QuizArenaPlan>({ _id: 0 })
    .toArray();

  // Only return plans with trusted, matching server prices.
  // This prevents an outdated or incorrectly priced DB record
  // from being advertised to students.
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

export async function getActiveQuizArenaSubscription(
  userId: string,
): Promise<QuizArenaSubscription | null> {
  const db = await getMongoDatabase();
  const now = new Date().toISOString();

  const collection = db.collection<QuizArenaSubscription>(
    COLLECTIONS.subscriptions,
  );

  const subscription = await collection.findOne(
    {
      userId,
      startsAt: { $lte: now },
      expiresAt: { $gt: now },
    },
    {
      sort: { expiresAt: -1 },
      projection: { _id: 0 },
    },
  );

  return subscription;
}

export async function hasActiveQuizArenaSubscription(
  userId: string,
): Promise<boolean> {
  return (await getActiveQuizArenaSubscription(userId)) !== null;
}

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
  expiresAt.setUTCDate(
    expiresAt.getUTCDate() + durationDays,
  );

  return expiresAt;
}

export async function getQuizArenaSubscriptionHistory(
  userId: string,
): Promise<QuizArenaSubscription[]> {
  const db = await getMongoDatabase();

  const collection = db.collection<QuizArenaSubscription>(
    COLLECTIONS.subscriptions,
  );

  const subscriptions = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return subscriptions.map(
    ({ _id, ...subscription }) => subscription,
  );
}

/**
 * Called only after the server has independently verified
 * the Razorpay payment, order, signature, amount,
 * currency and payment ownership.
 */
export async function activateVerifiedQuizArenaSubscription(input: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}): Promise<QuizArenaSubscription> {
  const db = await getMongoDatabase();

  const payments = db.collection<QuizArenaPayment>(
    COLLECTIONS.payments,
  );

  const subscriptions = db.collection<QuizArenaSubscription>(
    COLLECTIONS.subscriptions,
  );

  // Locate the verified payment belonging to this student.
  const payment = await payments.findOne({
    userId: input.userId,
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    status: "paid",
    currency: "INR",
  });

  if (!payment) {
    throw new Error(
      "A verified Quiz Arena payment record is required.",
    );
  }

  const plan = getQuizArenaPlanById(payment.planId);

  if (!plan) {
    throw new Error("Invalid Quiz Arena subscription plan.");
  }

  // The payment must match the selected plan exactly.
  if (
    payment.amountPaise !== plan.amountPaise ||
    payment.currency !== plan.currency
  ) {
    throw new Error("Subscription payment amount mismatch.");
  }

  await subscriptions.createIndex(
    { paymentId: 1 },
    { unique: true },
  );

  const existing = await subscriptions.findOne({
    paymentId: input.razorpayPaymentId,
  });

  if (existing) {
    if (
      existing.userId !== input.userId ||
      existing.planId !== payment.planId
    ) {
      throw new Error("Payment ownership or plan mismatch.");
    }

    return existing;
  }

  const start = new Date();
  const now = start.toISOString();

  const subscription: QuizArenaSubscription = {
    id: `quiz-sub-${randomUUID()}`,
    userId: input.userId,
    planId: plan.id,
    startsAt: now,
    expiresAt: calculateQuizArenaExpiry(
      start,
      plan.durationDays,
    ).toISOString(),
    paymentId: input.razorpayPaymentId,
    createdAt: now,
  };

  try {
    await subscriptions.insertOne(subscription);
    return subscription;
  } catch (error) {
    const saved = await subscriptions.findOne({
      paymentId: input.razorpayPaymentId,
    });

    if (
      saved &&
      saved.userId === input.userId &&
      saved.planId === plan.id
    ) {
      return saved;
    }

    throw error;
  }
}
