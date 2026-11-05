
import "server-only";

import { randomUUID } from "node:crypto";

import { getMongoClient, getMongoDatabase } from "@/lib/mongodb";

import {
  getQuizArenaPlanById,
  type QuizArenaPayment,
  type QuizArenaSubscription,
  calculateQuizArenaExpiry,
} from "@/lib/quiz-arena-subscriptions";

type ConfirmedQuizPayment = {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  createdAtSeconds: number;
};

type ActivationResult = {
  activated: boolean;
  alreadyProcessed: boolean;
  superseded: boolean;
};

type QuizPaymentState = {
  userId: string;
  revision: number;
  lastPaymentAt?: number;
  lastPaymentId?: string;
  updatedAt: Date;
};

export async function activateVerifiedQuizArenaPayment(
  payment: ConfirmedQuizPayment,
): Promise<ActivationResult> {
  // Validate the confirmed Razorpay payment fields.
  // The exact amount is checked against the stored
  // order's selected plan inside the transaction.
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

  const db = await getMongoDatabase();
  const client = await getMongoClient();

  const payments = db.collection<QuizArenaPayment>(
    "quiz_arena_payments",
  );

  const subscriptions = db.collection<QuizArenaSubscription>(
    "quiz_arena_subscriptions",
  );

  const studentState = db.collection<QuizPaymentState>(
    "quiz_arena_student_payment_state",
  );

  // Create indexes before starting the transaction.
  await Promise.all([
    payments.createIndex(
      { razorpayOrderId: 1 },
      { unique: true },
    ),

    payments.createIndex(
      { razorpayPaymentId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          razorpayPaymentId: { $type: "string" },
        },
      },
    ),

    subscriptions.createIndex(
      { paymentId: 1 },
      { unique: true },
    ),

    studentState.createIndex(
      { userId: 1 },
      { unique: true },
    ),
  ]);

  const mongoSession = client.startSession();

  let result: ActivationResult = {
    activated: false,
    alreadyProcessed: false,
    superseded: false,
  };

  try {
    await mongoSession.withTransaction(async () => {
      result = {
        activated: false,
        alreadyProcessed: false,
        superseded: false,
      };

      // Fetch the original order created by our server.
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

      // Determine the plan from the trusted stored order,
      // not from a client-supplied plan ID.
      const plan = getQuizArenaPlanById(order.planId);

      if (!plan) {
        throw new Error("QUIZ_PLAN_NOT_FOUND");
      }

      // Confirm the payment matches the selected plan.
      if (
        order.amountPaise !== plan.amountPaise ||
        payment.amountPaise !== plan.amountPaise ||
        order.currency !== plan.currency ||
        payment.currency !== plan.currency
      ) {
        throw new Error("QUIZ_PAYMENT_MISMATCH");
      }

      // Retry-safe handling of an already verified payment.
      if (order.status === "paid") {
        if (order.razorpayPaymentId !== payment.paymentId) {
          throw new Error("QUIZ_ORDER_ALREADY_PAID");
        }

        result.alreadyProcessed = true;
        return;
      }

      if (order.status !== "created") {
        throw new Error("QUIZ_PAYMENT_NOT_PENDING");
      }

      const now = new Date();

      // Serialize competing activations for one student.
      const previousState = await studentState.findOneAndUpdate(
        {
          userId: order.userId,
        },
        {
          $inc: {
            revision: 1,
          },
          $set: {
            updatedAt: now,
          },
          $setOnInsert: {
            userId: order.userId,
          },
        },
        {
          upsert: true,
          returnDocument: "before",
          session: mongoSession,
        },
      );

      const previousAt = previousState?.lastPaymentAt ?? 0;
      const previousId = previousState?.lastPaymentId ?? "";

      const superseded =
        payment.createdAtSeconds < previousAt ||
        (
          payment.createdAtSeconds === previousAt &&
          payment.paymentId <= previousId
        );

      // Atomically claim the successfully captured payment.
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

      // Older captured payments must not overwrite
      // subscriptions activated by newer payments.
      if (superseded) {
        result.superseded = true;
        return;
      }

      const start = now.toISOString();

      // Activate the exact purchased subscription plan.
      const subscription: QuizArenaSubscription = {
        id: `quiz-sub-${randomUUID()}`,
        userId: order.userId,
        planId: plan.id,
        startsAt: start,
        expiresAt: calculateQuizArenaExpiry(
          now,
          plan.durationDays,
        ).toISOString(),
        paymentId: payment.paymentId,
        createdAt: start,
      };

      await subscriptions.insertOne(
        subscription,
        {
          session: mongoSession,
        },
      );

      await studentState.updateOne(
        {
          userId: order.userId,
        },
        {
          $set: {
            lastPaymentAt: payment.createdAtSeconds,
            lastPaymentId: payment.paymentId,
            updatedAt: now,
          },
        },
        {
          session: mongoSession,
        },
      );

      result.activated = true;
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}
