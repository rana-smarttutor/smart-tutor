import "server-only";
import { getMongoDatabase } from "@/lib/mongodb";

export type LibraryPlan = {
  planId: string;
  name: string;
  pricePaise: number;
  currency: "INR";
  durationMonths: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type LibrarySubscription = {
  studentId: string;
  planId: string;
  startDate: Date;
  expiryDate: Date;
  status: "active" | "expired" | "revoked";
  paymentId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LibraryPayment = {
  studentId: string;
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amountPaise: number;
  currency: "INR";
  paymentStatus:
    | "pending"
    | "paid"
    | "failed";
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export async function getLibraryCollections() {
  const db = await getMongoDatabase();

  return {
    plans: db.collection<LibraryPlan>(
      "digital_library_subscription_plans"
    ),
    subscriptions: db.collection<LibrarySubscription>(
      "digital_library_subscriptions"
    ),
    payments: db.collection<LibraryPayment>(
      "digital_library_payments"
    ),
  };
}

export async function getActiveLibrarySubscription(
  studentId: string
) {
  if (!studentId) return null;

  const { subscriptions } = await getLibraryCollections();

  return subscriptions.findOne(
    {
      studentId,
      status: "active",
      expiryDate: { $gt: new Date() },
      startDate: { $lte: new Date() },
    },
    {
      sort: { expiryDate: -1 },
    }
  );
}

export async function hasActiveLibrarySubscription(
  studentId: string
): Promise<boolean> {
  return Boolean(
    await getActiveLibrarySubscription(studentId)
  );
}

export function addSubscriptionMonths(
  startDate: Date,
  months: number
): Date {
  if (
    !Number.isInteger(months) ||
    months < 1 ||
    months > 120 ||
    !Number.isFinite(startDate.getTime())
  ) {
    throw new Error("Invalid subscription duration.");
  }

  const result = new Date(startDate);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDay = new Date(
    Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDay));

  return result;
}
