import "server-only";

import { getMongoClient, getMongoDatabase } from "@/lib/mongodb";
import {
  addSubscriptionMonths,
  getLibraryCollections,
} from "@/lib/library-subscriptions";

export type ConfirmedLibraryPayment = {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  createdAtSeconds: number;
};

export type ActivationResult = {
  activated: boolean;
  alreadyProcessed: boolean;
  superseded: boolean;
};

export async function activateVerifiedLibraryPayment(
  payment: ConfirmedLibraryPayment
): Promise<ActivationResult> {
  if (
    payment.status !== "captured" ||
    !payment.paymentId ||
    !payment.orderId ||
    payment.currency !== "INR" ||
    !Number.isSafeInteger(payment.amountPaise) ||
    !Number.isSafeInteger(payment.createdAtSeconds) ||
    payment.createdAtSeconds <= 0
  ) {
    throw new Error("PAYMENT_NOT_CAPTURED");
  }

  const { payments, subscriptions, plans } =
    await getLibraryCollections();

  const client = await getMongoClient();
  const db = await getMongoDatabase();

  const studentState = db.collection<{
    studentId: string;
    revision: number;
    lastPaymentAt?: number;
    lastPaymentId?: string;
    updatedAt: Date;
  }>("digital_library_student_state");

  // Index preparation must occur outside transactions.
  await payments.createIndex(
    { razorpayOrderId: 1 },
    { unique: true }
  );

  await payments.createIndex(
    { razorpayPaymentId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        razorpayPaymentId: { $type: "string" },
      },
    }
  );

  await subscriptions.createIndex(
    { paymentId: 1 },
    { unique: true }
  );

  await studentState.createIndex(
    { studentId: 1 },
    { unique: true }
  );

  const mongoSession = client.startSession();

  let result: ActivationResult = {
    activated: false,
    alreadyProcessed: false,
    superseded: false,
  };

  try {
    await mongoSession.withTransaction(async () => {
      // The transaction callback can be retried.
      result = {
        activated: false,
        alreadyProcessed: false,
        superseded: false,
      };

      const transaction = await payments.findOne(
        { razorpayOrderId: payment.orderId },
        { session: mongoSession }
      );

      if (!transaction) {
        throw new Error("LOCAL_ORDER_NOT_FOUND");
      }

      if (
        transaction.amountPaise !== payment.amountPaise ||
        transaction.currency !== payment.currency
      ) {
        throw new Error("PAYMENT_AMOUNT_MISMATCH");
      }

      if (transaction.paymentStatus === "paid") {
        if (transaction.razorpayPaymentId !== payment.paymentId) {
          throw new Error("ORDER_ALREADY_PAID");
        }

        result.alreadyProcessed = true;
        return;
      }

      if (transaction.paymentStatus !== "pending") {
        throw new Error("PAYMENT_NOT_PENDING");
      }

      const plan = await plans.findOne(
        { planId: transaction.planId },
        { session: mongoSession }
      );

      if (
        !plan ||
        plan.currency !== "INR" ||
        ![1, 3, 12].includes(plan.durationMonths)
      ) {
        throw new Error("PLAN_UNAVAILABLE");
      }

      const now = new Date();

      // A write to this shared student record serializes
      // competing subscription activations.
      const stateResult = await studentState.findOneAndUpdate(
        { studentId: transaction.studentId },
        {
          $inc: { revision: 1 },
          $set: { updatedAt: now },
          $setOnInsert: { studentId: transaction.studentId },
        },
        {
          upsert: true,
          returnDocument: "before",
          session: mongoSession,
        }
      );

      const lastAt = stateResult?.lastPaymentAt ?? 0;
      const lastId = stateResult?.lastPaymentId ?? "";

      const isOlder =
        payment.createdAtSeconds < lastAt ||
        (
          payment.createdAtSeconds === lastAt &&
          payment.paymentId <= lastId
        );

      const claimed = await payments.updateOne(
        {
          _id: transaction._id,
          paymentStatus: "pending",
        },
        {
          $set: {
            paymentStatus: "paid",
            razorpayPaymentId: payment.paymentId,
            verifiedAt: now,
            updatedAt: now,
          },
        },
        { session: mongoSession }
      );

      if (claimed.modifiedCount !== 1) {
        throw new Error("PAYMENT_STATE_CONFLICT");
      }

      if (isOlder) {
        result.superseded = true;
        return;
      }

      await subscriptions.updateMany(
        {
          studentId: transaction.studentId,
          status: "active",
        },
        {
          $set: {
            status: "revoked",
            updatedAt: now,
          },
        },
        { session: mongoSession }
      );

      await subscriptions.insertOne(
        {
          studentId: transaction.studentId,
          planId: transaction.planId,
          paymentId: payment.paymentId,
          startDate: now,
          expiryDate: addSubscriptionMonths(
            now,
            plan.durationMonths
          ),
          status: "active",
          createdAt: now,
          updatedAt: now,
        },
        { session: mongoSession }
      );

      await studentState.updateOne(
        { studentId: transaction.studentId },
        {
          $set: {
            lastPaymentAt: payment.createdAtSeconds,
            lastPaymentId: payment.paymentId,
            updatedAt: now,
          },
        },
        { session: mongoSession }
      );

      result.activated = true;
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
}
