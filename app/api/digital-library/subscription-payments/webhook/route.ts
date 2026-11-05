import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getLibraryCollections } from "@/lib/library-subscriptions";
import { activateVerifiedLibraryPayment } from "@/lib/library-payment-activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(message: string, status = 200) {
  return NextResponse.json(
    { success: status < 400, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    if (process.env.LIBRARY_TEST_PAYMENTS_ENABLED !== "true") {
      return reply("Webhook processing disabled.", 503);
    }

    const secret = process.env.RAZORPAY_LIBRARY_WEBHOOK_SECRET;
    const key = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (
      !secret ||
      !key?.startsWith("rzp_test_") ||
      !keySecret
    ) {
      return reply("Webhook not configured.", 503);
    }

    const signature = request.headers.get("x-razorpay-signature") || "";
    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      return reply("Invalid webhook signature.", 401);
    }

    const raw = await request.text();

    const expected = createHmac("sha256", secret)
      .update(raw)
      .digest();

    if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) {
      return reply("Invalid webhook signature.", 401);
    }

    const event = JSON.parse(raw);

    // Only captured payments activate subscriptions.
    if (event.event !== "payment.captured") {
      return reply("Event ignored.");
    }

    const entity = event.payload?.payment?.entity;
    const paymentId = String(entity?.id || "");
    const orderId = String(entity?.order_id || "");

    if (
      !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
      !/^order_[a-zA-Z0-9]+$/.test(orderId)
    ) {
      return reply("Invalid payment event.", 400);
    }

    const { payments } = await getLibraryCollections();
    const local = await payments.findOne({
      razorpayOrderId: orderId,
    });

    // This webhook handles only library orders.
    // Other Razorpay orders are deliberately ignored.
    if (!local) return reply("Unrelated order ignored.");

    // Fetch current Razorpay state rather than trusting
    // an old event snapshot.
    const authorization = Buffer.from(
      `${key}:${keySecret}`
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
      return reply("Razorpay confirmation unavailable.", 503);
    }

    const payment = await response.json();

    if (
      payment.id !== paymentId ||
      payment.order_id !== local.razorpayOrderId ||
      payment.status !== "captured" ||
      payment.captured !== true ||
      payment.currency !== local.currency ||
      payment.amount !== local.amountPaise ||
      !Number.isSafeInteger(payment.created_at)
    ) {
      return reply("Payment confirmation mismatch.", 409);
    }

    const result = await activateVerifiedLibraryPayment({
      paymentId,
      orderId,
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
      "Library webhook failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return reply("Webhook processing failed.", 500);
  }
}
