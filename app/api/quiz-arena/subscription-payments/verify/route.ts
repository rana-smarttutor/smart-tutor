
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

import {
  getQuizArenaPlanById,
  type QuizArenaPayment,
} from "@/lib/quiz-arena-subscriptions";

import {
  activateVerifiedQuizArenaPayment,
} from "@/lib/quiz-arena-payment-activation";

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
    { success: false, message },
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
    const session = await getSessionUser();

    if (!session) {
      return reject("Login required.", 401);
    }

    if (
      session.role !== "student" ||
      (session.status && session.status !== "active")
    ) {
      return reject("Student access only.", 403);
    }


const paymentConfig = getQuizArenaPaymentConfig();

if (!paymentConfig.enabled) {
  return reject(paymentConfig.reason, 503);
}

const keyId = paymentConfig.keyId;
const keySecret = paymentConfig.keySecret;


    const body = (await request
      .json()
      .catch(() => null)) as VerifyPaymentBody | null;

    const orderId = String(body?.razorpay_order_id || "");
    const paymentId = String(body?.razorpay_payment_id || "");
    const signature = String(body?.razorpay_signature || "");

    if (
      !/^order_[a-zA-Z0-9]+$/.test(orderId) ||
      !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
      !/^[a-fA-F0-9]{64}$/.test(signature)
    ) {
      return reject(
        "Invalid payment verification fields.",
        400,
      );
    }

    const db = await getMongoDatabase();

    const payments = db.collection<QuizArenaPayment>(
      "quiz_arena_payments",
    );

    const localOrder = await payments.findOne({
      razorpayOrderId: orderId,
      userId: session.id,
      currency: "INR",
    });

    if (!localOrder) {
      return reject(
        "Quiz Arena payment order not found.",
        404,
      );
    }

    // Resolve the exact trusted plan attached to this order.
    const plan = getQuizArenaPlanById(localOrder.planId);

    if (
      !plan ||
      localOrder.amountPaise !== plan.amountPaise ||
      localOrder.currency !== plan.currency
    ) {
      return reject(
        "Payment order does not match a valid subscription plan.",
        409,
      );
    }

    if (
      localOrder.status === "paid" &&
      localOrder.razorpayPaymentId !== paymentId
    ) {
      return reject(
        "This order was already paid using another payment.",
        409,
      );
    }

    if (
      localOrder.status !== "created" &&
      localOrder.status !== "paid"
    ) {
      return reject(
        "Payment order is not eligible for verification.",
        409,
      );
    }

    const expectedSignature = createHmac(
      "sha256",
      keySecret,
    )
      .update(
        `${localOrder.razorpayOrderId}|${paymentId}`,
      )
      .digest();

    const providedSignature = Buffer.from(
      signature,
      "hex",
    );

    if (
      expectedSignature.length !== providedSignature.length ||
      !timingSafeEqual(
        expectedSignature,
        providedSignature,
      )
    ) {
      return reject(
        "Invalid Razorpay payment signature.",
        400,
      );
    }

    const authorization = Buffer.from(
      `${keyId}:${keySecret}`,
    ).toString("base64");

    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(
        paymentId,
      )}`,
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
        "Quiz Arena Razorpay payment lookup failed:",
        razorpayResponse.status,
      );

      return reject(
        "Payment confirmation is temporarily unavailable.",
        502,
      );
    }

    const payment =
      (await razorpayResponse.json()) as RazorpayCapturedPayment;

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

    // Keep the existing transactional activation helper.
    // It must also validate the plan and its duration.
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
          ? "Quiz Arena subscription activated successfully."
          : result.alreadyProcessed
            ? "Payment already verified."
            : "Payment verified. A newer subscription already exists.",
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
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    return reject(
      "Unable to verify Quiz Arena payment.",
      500,
    );
  }
}
