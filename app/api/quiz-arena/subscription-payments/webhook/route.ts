import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getMongoDatabase } from "@/lib/mongodb";

import {
  QUIZ_ARENA_PLAN,
  type QuizArenaPayment,
} from "@/lib/quiz-arena-subscriptions";

import { getQuizArenaExamScopeByKey } from "@/lib/quiz-arena-exam-scope";

import { activateVerifiedQuizArenaPayment } from "@/lib/quiz-arena-payment-activation";

import { getQuizArenaPaymentConfig } from "@/lib/quiz-arena-payment-config";

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

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
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

/**
 * SmartIQ Institute
 * Quiz Arena — Exam-Specific Razorpay Webhook
 *
 * Existing endpoint:
 *
 * /api/quiz-arena/subscription-payments/webhook
 *
 * No new webhook is required.
 *
 * Security:
 *
 * - Verify Razorpay webhook signature.
 * - Accept only payment.captured.
 * - Find the original Quiz Arena order.
 * - Validate monthly ₹49 plan.
 * - Validate the exact purchased exam.
 * - Independently fetch captured payment.
 * - Activate transactionally.
 * - Handle duplicate webhook deliveries.
 *
 * Never accept a new exam ID from webhook
 * metadata as the source of entitlement.
 *
 * The MongoDB order is authoritative.
 */

export async function POST(request: Request) {
  try {
    /**
     * Do not process payments unless the
     * configured environment permits them.
     *
     * Test and live environments must use
     * the matching Razorpay credentials.
     */
    const paymentConfig = getQuizArenaPaymentConfig();

    if (!paymentConfig.enabled) {
      return reply(paymentConfig.reason, 503);
    }

    const webhookSecret = process.env.RAZORPAY_QUIZ_ARENA_WEBHOOK_SECRET;

    if (
      !webhookSecret ||
      !webhookSecret.trim() ||
      webhookSecret === "YOUR_WEBHOOK_SECRET"
    ) {
      return reply("Quiz Arena webhook is not configured.", 503);
    }

    /**
     * Verify the signature using the
     * original raw request body.
     *
     * JSON.stringify(parsedEvent) must not
     * be used for HMAC verification.
     */
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      return reply("Invalid webhook signature.", 401);
    }

    const rawBody = await request.text();

    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest();

    const suppliedSignature = Buffer.from(signature, "hex");

    if (
      expectedSignature.length !== suppliedSignature.length ||
      !timingSafeEqual(expectedSignature, suppliedSignature)
    ) {
      return reply("Invalid webhook signature.", 401);
    }

    let event: RazorpayWebhookEvent;

    try {
      event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    } catch {
      return reply("Invalid webhook JSON.", 400);
    }

    /**
     * Subscription activation requires a
     * successfully captured payment.
     */
    if (event.event !== "payment.captured") {
      return reply("Event ignored.");
    }

    const paymentId = String(event.payload?.payment?.entity?.id ?? "");

    const orderId = String(event.payload?.payment?.entity?.order_id ?? "");

    if (
      !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
      !/^order_[a-zA-Z0-9]+$/.test(orderId)
    ) {
      return reply("Invalid payment event.", 400);
    }

    /**
     * The same Razorpay merchant may process
     * unrelated Digital Library orders.
     *
     * Search Quiz Arena's own collection.
     */
    const db = await getMongoDatabase();

    const payments = db.collection<QuizArenaPayment>("quiz_arena_payments");

    const localOrder = await payments.findOne({
      razorpayOrderId: orderId,
    });

    if (!localOrder) {
      return reply("Unrelated order ignored.");
    }

    /**
     * Legacy global orders were created before
     * exam-specific subscriptions existed.
     *
     * Never silently assign one of those
     * orders to a new individual exam.
     *
     * Returning a retryable error prevents
     * acknowledging an unprocessed payment.
     */
    if (!localOrder.examScopeKey) {
      console.error(
        "Legacy Quiz Arena payment requires reconciliation:",
        orderId,
      );

      return reply(
        "Legacy subscription order requires separate reconciliation.",
        503,
      );
    }

    /**
     * Resolve the original exam saved when
     * checkout was created.
     */
    const examScope = getQuizArenaExamScopeByKey(localOrder.examScopeKey);

    if (!examScope) {
      return reply("Invalid stored exam subscription.", 409);
    }

    if (localOrder.examTitle && localOrder.examTitle !== examScope.title) {
      return reply("Stored exam details do not match.", 409);
    }

    /**
     * Only new ₹49 / 30-day orders may be
     * activated through this flow.
     */
    if (
      localOrder.planId !== QUIZ_ARENA_PLAN.id ||
      localOrder.amountPaise !== QUIZ_ARENA_PLAN.amountPaise ||
      localOrder.currency !== QUIZ_ARENA_PLAN.currency
    ) {
      return reply("Subscription plan mismatch.", 409);
    }

    /**
     * Confirm that the payment is still
     * captured directly with Razorpay.
     *
     * Do not rely only on fields supplied
     * in the webhook event body.
     */
    const authorization = Buffer.from(
      `${paymentConfig.keyId}:${paymentConfig.keySecret}`,
    ).toString("base64");

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

    /**
     * Confirm payment identity, captured
     * status, amount, currency and timestamp.
     */
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

    /**
     * The activation helper independently
     * reads the original exam scope and
     * activates only that exam.
     *
     * MongoDB transactions protect against
     * partial activation and duplicate
     * processing.
     */
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
        message: result.activated
          ? "Exam subscription activated successfully."
          : result.alreadyProcessed
            ? "Payment already processed."
            : "Payment processed.",
        examScopeKey: examScope.key,
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
      "Quiz Arena exam webhook failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return reply("Quiz Arena webhook processing failed.", 500);
  }
}
