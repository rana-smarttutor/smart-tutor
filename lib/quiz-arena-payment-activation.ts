import "server-only";

import { randomUUID } from "node:crypto";

import { getMongoClient, getMongoDatabase } from "@/lib/mongodb";

import {
  getQuizArenaPlanById,
  type QuizArenaPayment,
  type QuizArenaSubscription,
  calculateQuizArenaExpiry,
} from "@/lib/quiz-arena-subscriptions";

import { getQuizArenaExamScopeByKey } from "@/lib/quiz-arena-exam-scope";

/**
 * SmartIQ Institute
 * Quiz Arena — Exam-Specific Payment Activation
 *
 * Each captured payment activates only the exact
 * exam stored in the original Razorpay order.
 *
 * Supports:
 *
 * - ₹49 / 30 days / selected exam
 * - Multiple independently purchased exams
 * - Independent exam renewals
 * - Transactional MongoDB activation
 * - Idempotent Razorpay callbacks
 * - Safe concurrent payment processing
 *
 * Existing historical global subscriptions
 * are never modified or deleted here.
 */

type ConfirmedQuizPayment = {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  createdAtSeconds: number;
};

export type QuizArenaActivationResult = {
  activated: boolean;
  alreadyProcessed: boolean;

  /**
   * Retained for existing webhook and API
   * response compatibility.
   *
   * Independent exam purchases are not
   * superseded by purchases for other exams.
   */
  superseded: boolean;
};

/**
 * One serialisation record for each
 * student + individual exam.
 *
 * This replaces the previous global payment
 * state for new exam-specific activations.
 */
type QuizExamPaymentState = {
  userId: string;
  examScopeKey: string;
  revision: number;
  lastPaymentAt?: number;
  lastPaymentId?: string;
  updatedAt: Date;
};

function validateCapturedPayment(payment: ConfirmedQuizPayment): void {
  if (
    payment.status !== "captured" ||
    !/^pay_[a-zA-Z0-9]+$/.test(payment.paymentId) ||
    !/^order_[a-zA-Z0-9]+$/.test(payment.orderId) ||
    payment.currency !== "INR" ||
    !Number.isSafeInteger(payment.amountPaise) ||
    payment.amountPaise <= 0 ||
    !Number.isSafeInteger(payment.createdAtSeconds) ||
    payment.createdAtSeconds <= 0
  ) {
    throw new Error("INVALID_QUIZ_ARENA_PAYMENT");
  }
}

/**
 * Safely activate one captured payment.
 *
 * Security:
 *
 * The client does not supply the exam here.
 * The purchased exam is resolved exclusively
 * from the original MongoDB payment order.
 *
 * This prevents a student from modifying the
 * requested exam after completing payment.
 */
export async function activateVerifiedQuizArenaPayment(
  payment: ConfirmedQuizPayment,
): Promise<QuizArenaActivationResult> {
  validateCapturedPayment(payment);

  const db = await getMongoDatabase();
  const client = await getMongoClient();

  const payments = db.collection<QuizArenaPayment>("quiz_arena_payments");

  const subscriptions = db.collection<QuizArenaSubscription>(
    "quiz_arena_subscriptions",
  );

  const examPaymentState = db.collection<QuizExamPaymentState>(
    "quiz_arena_exam_payment_state",
  );

  /**
   * Create indexes before entering a
   * MongoDB transaction.
   *
   * These indexes prevent duplicate payments
   * and duplicate activation of the same
   * Razorpay payment ID.
   */
  await Promise.all([
    payments.createIndex(
      {
        razorpayOrderId: 1,
      },
      {
        unique: true,
      },
    ),

    payments.createIndex(
      {
        razorpayPaymentId: 1,
      },
      {
        unique: true,
        partialFilterExpression: {
          razorpayPaymentId: {
            $type: "string",
          },
        },
      },
    ),

    subscriptions.createIndex(
      {
        paymentId: 1,
      },
      {
        unique: true,
      },
    ),

    subscriptions.createIndex({
      userId: 1,
      examScopeKey: 1,
      expiresAt: -1,
    }),

    examPaymentState.createIndex(
      {
        userId: 1,
        examScopeKey: 1,
      },
      {
        unique: true,
      },
    ),
  ]);

  const mongoSession = client.startSession();

  let result: QuizArenaActivationResult = {
    activated: false,
    alreadyProcessed: false,
    superseded: false,
  };

  try {
    await mongoSession.withTransaction(
      async () => {
        /**
         * Reset local result before each
         * transaction retry.
         */
        result = {
          activated: false,
          alreadyProcessed: false,
          superseded: false,
        };

        /**
         * Fetch the original payment order.
         *
         * Never trust an exam ID supplied during
         * payment verification.
         */
        const order = await payments.findOne(
          {
            razorpayOrderId: payment.orderId,
          },
          {
            session: mongoSession,
          },
        );

        if (!order) {
          throw new Error("QUIZ_ORDER_NOT_FOUND");
        }

        /**
         * Check the selected monthly plan.
         *
         * This activation path is strictly
         * for new exam-specific purchases.
         */
        const plan = getQuizArenaPlanById(order.planId);

        if (!plan) {
          throw new Error("QUIZ_PLAN_NOT_AVAILABLE");
        }

        if (plan.durationDays !== 30 || plan.amountPaise !== 4900) {
          throw new Error("QUIZ_INVALID_MONTHLY_PLAN");
        }

        /**
         * Verify original order amount,
         * currency and captured payment.
         */
        if (
          order.amountPaise !== plan.amountPaise ||
          payment.amountPaise !== plan.amountPaise ||
          order.currency !== plan.currency ||
          payment.currency !== plan.currency
        ) {
          throw new Error("QUIZ_PAYMENT_MISMATCH");
        }

        /**
         * Resolve the exact purchased exam.
         *
         * For example:
         *
         * exam:ssc-cgl
         *
         * school:class-11-12-science:12:mh
         *
         * A missing scope is rejected.
         * This prevents accidental creation of
         * new platform-wide subscriptions.
         */
        const scope = getQuizArenaExamScopeByKey(order.examScopeKey);

        if (!scope) {
          throw new Error("QUIZ_EXAM_SCOPE_INVALID");
        }

        if (order.examTitle && order.examTitle !== scope.title) {
          throw new Error("QUIZ_EXAM_TITLE_MISMATCH");
        }

        /**
         * Idempotency:
         *
         * The same captured payment may be
         * delivered by:
         *
         * - Checkout verification
         * - Razorpay webhook
         * - Payment reconciliation
         *
         * It may be processed only once.
         */
        if (order.status === "paid") {
          if (order.razorpayPaymentId !== payment.paymentId) {
            throw new Error("QUIZ_ORDER_ALREADY_PAID");
          }

          const existingSubscription = await subscriptions.findOne(
            {
              paymentId: payment.paymentId,
              userId: order.userId,
              examScopeKey: scope.key,
              planId: plan.id,
            },
            {
              session: mongoSession,
            },
          );

          if (!existingSubscription) {
            throw new Error("QUIZ_PAID_ORDER_ENTITLEMENT_MISSING");
          }

          result.alreadyProcessed = true;
          return;
        }

        if (order.status !== "created") {
          throw new Error("QUIZ_PAYMENT_NOT_PENDING");
        }

        const now = new Date();

        /**
         * Serialise activation for ONE exam.
         *
         * A student purchasing SSC CGL and
         * CAT should have independent payment
         * states and expiry dates.
         *
         * Transactions writing the same
         * student/exam state will conflict
         * rather than silently overwrite
         * each other's renewal calculations.
         */
        await examPaymentState.findOneAndUpdate(
          {
            userId: order.userId,
            examScopeKey: scope.key,
          },
          {
            $inc: {
              revision: 1,
            },
            $set: {
              updatedAt: now,
              lastPaymentAt: payment.createdAtSeconds,
              lastPaymentId: payment.paymentId,
            },
            $setOnInsert: {
              userId: order.userId,
              examScopeKey: scope.key,
            },
          },
          {
            upsert: true,
            returnDocument: "after",
            session: mongoSession,
          },
        );

        /**
         * Find the latest subscription expiry
         * for this particular exam.
         *
         * Never look up the student's most
         * recent subscription across all exams.
         */
        const latestForExam = await subscriptions.findOne(
          {
            userId: order.userId,
            examScopeKey: scope.key,
          },
          {
            sort: {
              expiresAt: -1,
            },
            session: mongoSession,
          },
        );

        /**
         * New exam:
         * Starts immediately.
         *
         * Renewal of the same exam:
         * Adds 30 days from the existing
         * expiry when it has not yet expired.
         *
         * This avoids losing already-paid
         * days during an early renewal.
         */
        let subscriptionStart = now;

        if (latestForExam) {
          const previousExpiry = new Date(latestForExam.expiresAt);

          if (
            !Number.isNaN(previousExpiry.getTime()) &&
            previousExpiry.getTime() > now.getTime()
          ) {
            subscriptionStart = previousExpiry;
          }
        }

        const startsAt = subscriptionStart.toISOString();

        const expiresAt = calculateQuizArenaExpiry(
          subscriptionStart,
          plan.durationDays,
        ).toISOString();

        /**
         * Mark the original order as paid.
         *
         * Both the order update and the
         * subscription insert are inside
         * the same MongoDB transaction.
         */
        const claimed = await payments.updateOne(
          {
            _id: order._id,
            status: "created",
          },
          {
            $set: {
              status: "paid",
              razorpayPaymentId: payment.paymentId,
              paidAt: now.toISOString(),
            },
          },
          {
            session: mongoSession,
          },
        );

        if (claimed.modifiedCount !== 1) {
          throw new Error("QUIZ_PAYMENT_STATE_CONFLICT");
        }

        /**
         * Save exact exam entitlement.
         */
        const subscription: QuizArenaSubscription = {
          id: `quiz-sub-${randomUUID()}`,

          userId: order.userId,

          planId: plan.id,

          examScopeKey: scope.key,

          examTitle: scope.title,

          startsAt,

          expiresAt,

          paymentId: payment.paymentId,

          createdAt: now.toISOString(),
        };

        await subscriptions.insertOne(subscription, {
          session: mongoSession,
        });

        result.activated = true;
      },
      {
        writeConcern: {
          w: "majority",
        },
      },
    );

    return result;
  } finally {
    await mongoSession.endSession();
  }
}
