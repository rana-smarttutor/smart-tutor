import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getLibraryCollections } from "@/lib/library-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return fail("Authentication required.", 401);
    }

    if (String(session.role).toLowerCase() !== "admin") {
      return fail("Administrator access required.", 403);
    }

    const { plans, subscriptions, payments } = await getLibraryCollections();

    const now = new Date();

    const [
      planRecords,
      totalSubscriptions,
      activeSubscriptions,
      revokedSubscriptions,
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      revenueResult,
      subscriptionRecords,
      paymentRecords,
    ] = await Promise.all([
      plans.find({}).sort({ durationMonths: 1 }).toArray(),

      subscriptions.countDocuments(),

      subscriptions.countDocuments({
        status: "active",
        startDate: { $lte: now },
        expiryDate: { $gt: now },
      }),

      subscriptions.countDocuments({
        status: "revoked",
      }),

      payments.countDocuments(),

      payments.countDocuments({
        paymentStatus: "paid",
      }),

      payments.countDocuments({
        paymentStatus: "pending",
      }),

      payments.countDocuments({
        paymentStatus: "failed",
      }),

      payments
        .aggregate<{ totalPaise: number }>([
          {
            $match: {
              paymentStatus: "paid",
            },
          },
          {
            $group: {
              _id: null,
              totalPaise: {
                $sum: "$amountPaise",
              },
            },
          },
        ])
        .toArray(),

      subscriptions.find({}).sort({ createdAt: -1 }).limit(100).toArray(),

      payments.find({}).sort({ createdAt: -1 }).limit(100).toArray(),
    ]);

    const expiredSubscriptions = await subscriptions.countDocuments({
      $or: [
        { status: "expired" },
        {
          status: "active",
          expiryDate: { $lte: now },
        },
      ],
    });

    const revenuePaise = revenueResult[0]?.totalPaise ?? 0;

    return NextResponse.json(
      {
        success: true,

        summary: {
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          revokedSubscriptions,
          totalPayments,
          successfulPayments,
          pendingPayments,
          failedPayments,
          revenuePaise,
          revenueRupees: revenuePaise / 100,
        },

        plans: planRecords.map((plan) => ({
          planId: plan.planId,
          name: plan.name,
          pricePaise: plan.pricePaise,
          currency: plan.currency,
          durationMonths: plan.durationMonths,
          isActive: plan.isActive,
        })),

        subscriptions: subscriptionRecords.map((record) => {
          const currentlyActive =
            record.status === "active" &&
            record.startDate <= now &&
            record.expiryDate > now;

          const effectiveStatus = currentlyActive
            ? "active"
            : record.status === "revoked"
              ? "revoked"
              : record.expiryDate <= now
                ? "expired"
                : record.status;

          return {
            id: String(record._id),
            studentId: record.studentId,
            planId: record.planId,
            status: effectiveStatus,
            startDate: record.startDate,
            expiryDate: record.expiryDate,
            paymentId: record.paymentId,
            createdAt: record.createdAt,
          };
        }),

        payments: paymentRecords.map((payment) => ({
          id: String(payment._id),
          studentId: payment.studentId,
          planId: payment.planId,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId ?? null,
          amountPaise: payment.amountPaise,
          currency: payment.currency,
          paymentStatus: payment.paymentStatus,
          createdAt: payment.createdAt,
          verifiedAt: payment.verifiedAt ?? null,
        })),

        pagination: {
          subscriptionsLimit: 100,
          paymentsLimit: 100,
        },

        generatedAt: now.toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Admin library subscription API error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to load library subscription management data.", 500);
  }
}
