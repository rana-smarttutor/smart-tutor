import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getLibraryCollections } from "@/lib/library-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function validDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return respond(
        {
          success: false,
          message: "Please log in to view your subscription.",
        },
        401,
      );
    }

    if (session.role !== "student") {
      return respond(
        {
          success: false,
          message: "Student access required.",
        },
        403,
      );
    }

    // Always use the authenticated session ID.
    // Never trust a student ID from a query parameter.
    const studentId = session.id;

    const { plans, subscriptions, payments } = await getLibraryCollections();

    const now = new Date();

    const [planRecords, subscriptionRecords, paymentRecords] =
      await Promise.all([
        plans.find({}).sort({ durationMonths: 1 }).toArray(),

        subscriptions.find({ studentId }).sort({ createdAt: -1 }).toArray(),

        payments
          .find({ studentId })
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray(),
      ]);

    const activeRecord = subscriptionRecords.find((record) => {
      const start = validDate(record.startDate);
      const expiry = validDate(record.expiryDate);

      return (
        record.status === "active" &&
        start !== null &&
        expiry !== null &&
        start <= now &&
        expiry > now
      );
    });

    const latestRecord = subscriptionRecords[0] ?? null;

    const selectedRecord = activeRecord ?? latestRecord;

    const selectedExpiry = selectedRecord
      ? validDate(selectedRecord.expiryDate)
      : null;

    const isActive = Boolean(activeRecord);

    const remainingMilliseconds =
      isActive && selectedExpiry
        ? Math.max(0, selectedExpiry.getTime() - now.getTime())
        : 0;

    const daysRemaining = Math.ceil(
      remainingMilliseconds / (1000 * 60 * 60 * 24),
    );

    const planMap = new Map(
      planRecords.map((plan) => [
        plan.planId,
        {
          planId: plan.planId,
          name: plan.name,
          pricePaise: plan.pricePaise,
          currency: plan.currency,
          durationMonths: plan.durationMonths,
          isActive: plan.isActive,
        },
      ]),
    );

    const currentPlan = selectedRecord
      ? (planMap.get(selectedRecord.planId) ?? null)
      : null;

    const currentStatus = !selectedRecord
      ? "not_subscribed"
      : isActive
        ? "active"
        : selectedRecord.status === "revoked"
          ? "revoked"
          : selectedExpiry && selectedExpiry <= now
            ? "expired"
            : selectedRecord.status;

    return respond({
      success: true,

      student: {
        name: session.name,
      },

      currentSubscription: selectedRecord
        ? {
            id: String(selectedRecord._id),
            planId: selectedRecord.planId,
            planName: currentPlan?.name ?? selectedRecord.planId,
            status: currentStatus,
            startDate:
              validDate(selectedRecord.startDate)?.toISOString() ?? null,
            expiryDate: selectedExpiry?.toISOString() ?? null,
            daysRemaining,
            isActive,
          }
        : null,

      plans: planRecords.map((plan) => ({
        planId: plan.planId,
        name: plan.name,
        pricePaise: plan.pricePaise,
        currency: plan.currency,
        durationMonths: plan.durationMonths,
        isActive: plan.isActive,
      })),

      paymentHistory: paymentRecords.map((payment) => ({
        id: String(payment._id),
        planId: payment.planId,
        planName: planMap.get(payment.planId)?.name ?? payment.planId,
        amountPaise: payment.amountPaise,
        currency: payment.currency,
        status: payment.paymentStatus,
        razorpayPaymentId: payment.razorpayPaymentId ?? null,
        createdAt: validDate(payment.createdAt)?.toISOString() ?? null,
      })),

      generatedAt: now.toISOString(),

      paymentsConfigured:
        process.env.LIBRARY_TEST_PAYMENTS_ENABLED === "true" &&
        Boolean(process.env.RAZORPAY_KEY_ID) &&
        Boolean(process.env.RAZORPAY_KEY_SECRET),
    });
  } catch (error) {
    console.error(
      "Student subscription dashboard error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond(
      {
        success: false,
        message: "Unable to load your library subscription.",
      },
      500,
    );
  }
}
