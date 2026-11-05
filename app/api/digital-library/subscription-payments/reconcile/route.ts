import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLibraryCollections } from "@/lib/library-subscriptions";
import {
  activateVerifiedLibraryPayment,
} from "@/lib/library-payment-activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
  created_at: number;
};

type PaymentList = {
  items?: RazorpayPayment[];
};

function response(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function POST() {
  try {
    const user = await getSessionUser();

    if (!user) return response("Login required.", 401);

    if (String(user.role).toLowerCase() !== "student") {
      return response("Students only.", 403);
    }

    if (process.env.LIBRARY_TEST_PAYMENTS_ENABLED !== "true") {
      return response("Payment reconciliation disabled.", 503);
    }

    const key = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key?.startsWith("rzp_test_") || !secret) {
      return response("Razorpay test configuration missing.", 503);
    }

    const { payments } = await getLibraryCollections();

    const pendingOrders = await payments
      .find({
        studentId: user.id,
        paymentStatus: "pending",
      })
      .sort({ createdAt: 1 })
      .limit(10)
      .toArray();

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        checked: 0,
        recovered: 0,
        message: "No pending orders found.",
      });
    }

    const authorization = Buffer.from(
      `${key}:${secret}`
    ).toString("base64");

    let recovered = 0;
    let alreadyProcessed = 0;
    let superseded = 0;
    let unresolved = 0;

    for (const order of pendingOrders) {
      try {
        const result = await fetch(
          `https://api.razorpay.com/v1/orders/${encodeURIComponent(
            order.razorpayOrderId
          )}/payments`,
          {
            headers: {
              Authorization: `Basic ${authorization}`,
            },
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          }
        );

        if (!result.ok) {
          unresolved++;
          continue;
        }

        const data = (await result.json()) as PaymentList;

        const captured = (data.items || [])
          .filter(
            (payment) =>
              payment.order_id === order.razorpayOrderId &&
              payment.status === "captured" &&
              payment.captured === true &&
              payment.amount === order.amountPaise &&
              payment.currency === order.currency &&
              /^pay_[a-zA-Z0-9]+$/.test(payment.id) &&
              Number.isSafeInteger(payment.created_at) &&
              payment.created_at > 0
          )
          .sort(
            (a, b) =>
              a.created_at - b.created_at ||
              a.id.localeCompare(b.id)
          );

        if (captured.length !== 1) {
          // Zero or multiple captured payments require
          // further reconciliation or manual review.
          unresolved++;
          continue;
        }

        const payment = captured[0];

        const activation = await activateVerifiedLibraryPayment({
          paymentId: payment.id,
          orderId: order.razorpayOrderId,
          amountPaise: payment.amount,
          currency: payment.currency,
          status: payment.status,
          createdAtSeconds: payment.created_at,
        });

        if (activation.activated) recovered++;
        if (activation.alreadyProcessed) alreadyProcessed++;
        if (activation.superseded) superseded++;
      } catch (error) {
        console.error(
          "Library payment reconciliation failed:",
          error instanceof Error ? error.message : "Unknown error"
        );
        unresolved++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        checked: pendingOrders.length,
        recovered,
        alreadyProcessed,
        superseded,
        unresolved,
        message:
          unresolved > 0
            ? "Some orders require another reconciliation attempt or review."
            : "Payment reconciliation completed.",
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(
      "Subscription reconciliation error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return response("Unable to reconcile payments.", 500);
  }
}
