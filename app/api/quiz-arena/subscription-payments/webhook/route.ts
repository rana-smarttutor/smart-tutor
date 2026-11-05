import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getMongoDatabase } from "@/lib/mongodb";

import {
  QUIZ_ARENA_PLAN,
  type QuizArenaPayment,
} from "@/lib/quiz-arena-subscriptions";

import { activateVerifiedQuizArenaPayment } from "@/lib/quiz-arena-payment-activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
  created_at: number;
};

function reply(message: string, status = 200) {
  return NextResponse.json(
    {
      success: status < 400,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    // 1. Do not process payments until test mode is enabled.
    if (process.env.QUIZ_ARENA_TEST_PAYMENTS_ENABLED !== "true") {
      return reply("Quiz Arena webhook processing is disabled.", 503);
    }

    // 2. Verify webhook configuration.
    const webhookSecret = process.env.RAZORPAY_QUIZ_ARENA_WEBHOOK_SECRET;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (
      !webhookSecret ||
      !keyId?.startsWith("rzp_test_") ||
      !keySecret ||
      keySecret === "YOUR_KEY_SECRET"
    ) {
      return reply("Quiz Arena webhook is not configured.", 503);
    }

    // 3. Verify Razorpay's webhook signature.
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      return reply("Invalid webhook signature.", 401);
    }

    const rawBody = await request.text();

    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest();

    if (!timingSafeEqual(expectedSignature, Buffer.from(signature, "hex"))) {
      return reply("Invalid webhook signature.", 401);
    }

    // 4. Parse the authenticated webhook event.
    const event = JSON.parse(rawBody);

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

    // 5. Find the order in Quiz Arena's collection only.
    const db = await getMongoDatabase();

    const payments = db.collection<QuizArenaPayment>("quiz_arena_payments");

    const localOrder = await payments.findOne({
      razorpayOrderId: orderId,
      planId: QUIZ_ARENA_PLAN.id,
      amountPaise: QUIZ_ARENA_PLAN.amountPaise,
      currency: "INR",
    });

    if (!localOrder) {
      // The same Razorpay merchant may also have
      // Digital Library or other unrelated orders.
      return reply("Unrelated order ignored.");
    }

    // 6. Independently fetch the current payment status.
    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString(
      "base64",
    );

    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${authorization}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!razorpayResponse.ok) {
      console.error(
        "Quiz Arena webhook payment lookup failed:",
        razorpayResponse.status,
      );

      return reply("Razorpay payment confirmation unavailable.", 503);
    }

    const payment = (await razorpayResponse.json()) as RazorpayPayment;

    // 7. Confirm exact captured payment details.
    if (
      payment.id !== paymentId ||
      payment.order_id !== localOrder.razorpayOrderId ||
      payment.status !== "captured" ||
      payment.captured !== true ||
      payment.amount !== localOrder.amountPaise ||
      payment.currency !== localOrder.currency ||
      !Number.isSafeInteger(payment.created_at) ||
      payment.created_at <= 0
    ) {
      return reply("Razorpay payment confirmation mismatch.", 409);
    }

    // 8. Activate or safely recognize an already processed payment.
    const result = await activateVerifiedQuizArenaPayment({
      paymentId: payment.id,
      orderId: localOrder.razorpayOrderId,
      amountPaise: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAtSeconds: payment.created_at,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Quiz Arena webhook failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return reply("Quiz Arena webhook processing failed.", 500);
  }
}
