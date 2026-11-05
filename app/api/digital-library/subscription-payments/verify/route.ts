import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLibraryCollections } from "@/lib/library-subscriptions";
import { activateVerifiedLibraryPayment } from "@/lib/library-payment-activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reject(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return reject("Login required.", 401);
    if (String(user.role).toLowerCase() !== "student") {
      return reject("Students only.", 403);
    }

    if (process.env.LIBRARY_TEST_PAYMENTS_ENABLED !== "true") {
      return reject("Payments disabled.", 503);
    }

    const key = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key?.startsWith("rzp_test_") || !secret) {
      return reject("Test payment configuration missing.", 503);
    }

    const body = await request.json().catch(() => null);
    const orderId = String(body?.razorpay_order_id || "");
    const paymentId = String(body?.razorpay_payment_id || "");
    const signature = String(body?.razorpay_signature || "");

    if (
      !/^order_[a-zA-Z0-9]+$/.test(orderId) ||
      !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
      !/^[a-fA-F0-9]{64}$/.test(signature)
    ) {
      return reject("Invalid payment fields.", 400);
    }

    const { payments } = await getLibraryCollections();
    const local = await payments.findOne({
      razorpayOrderId: orderId,
      studentId: user.id,
    });
    if (!local) return reject("Order not found.", 404);

    const expected = createHmac("sha256", secret)
      .update(`${local.razorpayOrderId}|${paymentId}`)
      .digest();
    const supplied = Buffer.from(signature, "hex");

    if (!timingSafeEqual(expected, supplied)) {
      return reject("Invalid payment signature.", 400);
    }

    const authorization = Buffer.from(
      `${key}:${secret}`
    ).toString("base64");

    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Basic ${authorization}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      return reject("Payment confirmation unavailable.", 502);
    }

    const payment = await response.json();

    if (
      payment.id !== paymentId ||
      payment.order_id !== local.razorpayOrderId ||
      payment.status !== "captured" ||
      payment.captured !== true ||
      payment.amount !== local.amountPaise ||
      payment.currency !== "INR" ||
      !Number.isSafeInteger(payment.created_at)
    ) {
      return reject("Payment not confirmed as captured.", 409);
    }

    const result = await activateVerifiedLibraryPayment({
      paymentId,
      orderId: local.razorpayOrderId,
      amountPaise: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAtSeconds: payment.created_at,
    });

    return NextResponse.json(
      { success: true, ...result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Library payment verification failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return reject("Unable to verify payment.", 500);
  }
}
