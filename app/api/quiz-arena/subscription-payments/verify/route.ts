import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

import {
  QUIZ_ARENA_PLAN,
  getQuizArenaPlanById,
  type QuizArenaPayment,
} from "@/lib/quiz-arena-subscriptions";

import { getQuizArenaExamScopeByKey } from "@/lib/quiz-arena-exam-scope";

import { activateVerifiedQuizArenaPayment } from "@/lib/quiz-arena-payment-activation";

import { getQuizArenaPaymentConfig } from "@/lib/quiz-arena-payment-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyPaymentBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

type RazorpayCapturedPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
  created_at: number;
};

function reject(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
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
 * Verify and activate an individual
 * Quiz Arena exam subscription.
 *
 * Security requirements:
 *
 * - Authenticated active student
 * - Order belongs to that student
 * - Razorpay signature is valid
 * - Razorpay reports captured payment
 * - Exact ₹49 amount and INR currency
 * - Order belongs to a valid individual exam
 * - Exam scope is read from MongoDB
 * - Activation is handled transactionally
 *
 * Never accept an exam change during
 * payment verification.
 */
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return reject("Login required.", 401);
    }

    if (
      session.role !== "student" ||
      (session.status && session.status !== "active")
    ) {
      return reject(
        "Only active students can verify Quiz Arena payments.",
        403,
      );
    }

    const paymentConfig = getQuizArenaPaymentConfig();

    if (!paymentConfig.enabled) {
      return reject(paymentConfig.reason, 503);
    }

    const body = (await request
      .json()
      .catch(() => null)) as VerifyPaymentBody | null;

    const orderId = String(body?.razorpay_order_id ?? "");

    const paymentId = String(body?.razorpay_payment_id ?? "");

    const signature = String(body?.razorpay_signature ?? "");

    if (
      !/^order_[a-zA-Z0-9]+$/.test(orderId) ||
      !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
      !/^[a-fA-F0-9]{64}$/.test(signature)
    ) {
      return reject("Invalid payment verification fields.", 400);
    }

    const db = await getMongoDatabase();

    const payments = db.collection<QuizArenaPayment>("quiz_arena_payments");

    /**
     * Find the ORIGINAL order belonging to
     * the authenticated student.
     *
     * Never trust a userId supplied by
     * the browser.
     */
    const localOrder = await payments.findOne({
      razorpayOrderId: orderId,
      userId: session.id,
      currency: "INR",
    });

    if (!localOrder) {
      return reject("Quiz Arena payment order not found.", 404);
    }

    /**
     * Only the new ₹49 monthly plan may
     * activate an exam-specific entitlement.
     */
    if (localOrder.planId !== QUIZ_ARENA_PLAN.id) {
      return reject(
        "This order belongs to a previous subscription plan and requires separate reconciliation.",
        409,
      );
    }

    const plan = getQuizArenaPlanById(localOrder.planId);

    if (
      !plan ||
      plan.amountPaise !== 4900 ||
      plan.durationDays !== 30 ||
      localOrder.amountPaise !== plan.amountPaise ||
      localOrder.currency !== plan.currency
    ) {
      return reject(
        "Payment order does not match the monthly subscription plan.",
        409,
      );
    }

    /**
     * Validate the original selected exam.
     *
     * Legacy orders without examScopeKey
     * cannot be converted into an arbitrary
     * new exam subscription.
     */
    const examScope = getQuizArenaExamScopeByKey(localOrder.examScopeKey);

    if (!examScope) {
      return reject(
        "The original payment order does not contain a valid individual exam.",
        409,
      );
    }

    if (localOrder.examTitle && localOrder.examTitle !== examScope.title) {
      return reject(
        "Payment exam details do not match the examination catalogue.",
        409,
      );
    }

    /**
     * A paid order cannot be verified
     * against a different payment ID.
     */
    if (
      localOrder.status === "paid" &&
      localOrder.razorpayPaymentId !== paymentId
    ) {
      return reject("This order was already paid using another payment.", 409);
    }

    if (localOrder.status !== "created" && localOrder.status !== "paid") {
      return reject(
        "This payment order is not eligible for verification.",
        409,
      );
    }

    /**
     * Razorpay checkout signature:
     *
     * HMAC_SHA256(orderId|paymentId, keySecret)
     *
     * Use timing-safe comparison.
     */
    const expectedSignature = createHmac("sha256", paymentConfig.keySecret)
      .update(`${localOrder.razorpayOrderId}|${paymentId}`)
      .digest();

    const providedSignature = Buffer.from(signature, "hex");

    if (
      expectedSignature.length !== providedSignature.length ||
      !timingSafeEqual(expectedSignature, providedSignature)
    ) {
      return reject("Invalid Razorpay payment signature.", 400);
    }

    /**
     * Verify captured payment directly
     * with Razorpay's server API.
     *
     * A successful client callback alone
     * is not sufficient proof of payment.
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
        "Quiz Arena payment lookup failed:",
        razorpayResponse.status,
      );

      return reject("Payment confirmation is temporarily unavailable.", 502);
    }

    const payment = (await razorpayResponse.json()) as RazorpayCapturedPayment;

    /**
     * Confirm that the captured payment
     * matches the original stored order.
     */
    if (
      payment.id !== paymentId ||
      payment.order_id !== localOrder.razorpayOrderId ||
      payment.status !== "captured" ||
      payment.captured !== true ||
      payment.amount !== plan.amountPaise ||
      payment.currency !== plan.currency ||
      !Number.isSafeInteger(payment.created_at) ||
      payment.created_at <= 0
    ) {
      return reject(
        "Razorpay has not confirmed the exact subscription payment.",
        409,
      );
    }

    /**
     * Transactional activation.
     *
     * The activation helper reads the
     * examScopeKey from the original order.
     *
     * It does not use any exam ID supplied
     * during payment verification.
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
          ? `${examScope.title} subscription activated successfully.`
          : result.alreadyProcessed
            ? "Payment already verified. Your exam subscription remains active for its purchased validity period."
            : "Payment verified. Please check your exam subscription status.",

        examScopeKey: examScope.key,
        examTitle: examScope.title,
        planId: plan.id,
        durationDays: plan.durationDays,

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
      "Quiz Arena payment verification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return reject(
      "Unable to verify the Quiz Arena exam subscription payment.",
      500,
    );
  }
}
