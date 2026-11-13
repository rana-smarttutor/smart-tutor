import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

import {
  QUIZ_ARENA_PLAN,
  getQuizArenaPlanById,
  type QuizArenaPayment,
} from "@/lib/quiz-arena-subscriptions";

import { getQuizArenaExamScopeByKey } from "@/lib/quiz-arena-exam-scope";

import { getQuizArenaPaymentConfig } from "@/lib/quiz-arena-payment-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

type CreateOrderBody = {
  planId?: unknown;
  examScopeKey?: unknown;
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
 * Create an exam-specific Quiz Arena payment order.
 *
 * Price: ₹49
 * Duration: 30 days
 *
 * The selected exam must exist in the official
 * Quiz Arena examination catalogue.
 *
 * Each Razorpay order is bound to exactly one
 * validated exam scope.
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
        "Only active students can purchase Quiz Arena subscriptions.",
        403,
      );
    }

    const paymentConfig = getQuizArenaPaymentConfig();

    if (!paymentConfig.enabled) {
      return reject(paymentConfig.reason, 503);
    }

    const body = (await request
      .json()
      .catch(() => null)) as CreateOrderBody | null;

    if (!body) {
      return reject("Invalid payment request.", 400);
    }

    /**
     * Only the ₹49 monthly subscription is
     * permitted for new purchases.
     */
    if (typeof body.planId !== "string" || body.planId !== QUIZ_ARENA_PLAN.id) {
      return reject("Only the ₹49 monthly Quiz Arena plan is available.", 400);
    }

    const plan = getQuizArenaPlanById(body.planId);

    if (
      !plan ||
      !plan.active ||
      plan.amountPaise !== 4900 ||
      plan.durationDays !== 30
    ) {
      return reject("The selected monthly plan is unavailable.", 400);
    }

    /**
     * Validate the EXACT exam.
     *
     * Examples:
     *
     * exam:ssc-cgl
     * exam:cat
     * school:class-11-12-science:12:mh
     *
     * A category or parent group is never
     * accepted as a paid exam scope.
     */
    const scope = getQuizArenaExamScopeByKey(body.examScopeKey);

    if (!scope) {
      return reject(
        "Please select a valid individual exam before subscribing.",
        400,
      );
    }

    const db = await getMongoDatabase();

    /**
     * The database plan must match the
     * trusted server-side plan exactly.
     */
    const storedPlan = await db
      .collection("quiz_arena_subscription_plans")
      .findOne({
        id: plan.id,
        active: true,
        amountPaise: plan.amountPaise,
        price: plan.price,
        currency: plan.currency,
        durationDays: plan.durationDays,
      });

    if (!storedPlan) {
      return reject("The monthly Quiz Arena plan is not yet enabled.", 503);
    }

    /**
     * Store exam information in Razorpay
     * notes for audit purposes.
     *
     * The MongoDB order remains the trusted
     * source for subscription activation.
     */
    const receipt = `quiz_${randomUUID().replace(/-/g, "").slice(0, 28)}`;

    const authorization = Buffer.from(
      `${paymentConfig.keyId}:${paymentConfig.keySecret}`,
    ).toString("base64");

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authorization}`,
      },
      body: JSON.stringify({
        amount: plan.amountPaise,
        currency: plan.currency,
        receipt,
        notes: {
          purpose: "quiz_arena_exam_subscription",
          studentId: session.id,
          planId: plan.id,
          examScopeKey: scope.key,
          examId: scope.examId,
        },
      }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });

    if (!razorpayResponse.ok) {
      console.error(
        "Quiz Arena Razorpay order creation failed:",
        razorpayResponse.status,
      );

      return reject("Unable to create Razorpay payment order.", 502);
    }

    const order = (await razorpayResponse.json()) as RazorpayOrder;

    if (
      !/^order_[a-zA-Z0-9]+$/.test(order.id) ||
      order.amount !== plan.amountPaise ||
      order.currency !== plan.currency ||
      order.status !== "created"
    ) {
      throw new Error("Unexpected Razorpay order response.");
    }

    const payments = db.collection<QuizArenaPayment>("quiz_arena_payments");

    await payments.createIndex(
      {
        razorpayOrderId: 1,
      },
      {
        unique: true,
      },
    );

    const now = new Date().toISOString();

    /**
     * The original order records its exact
     * exam before checkout begins.
     *
     * Verification, webhook and reconciliation
     * must read this saved examScopeKey.
     */
    await payments.insertOne({
      id: `quiz-payment-${randomUUID()}`,
      userId: session.id,
      planId: plan.id,
      examScopeKey: scope.key,
      examTitle: scope.title,
      razorpayOrderId: order.id,
      amountPaise: plan.amountPaise,
      currency: "INR",
      status: "created",
      createdAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        keyId: paymentConfig.keyId,
        amount: plan.amountPaise,
        currency: plan.currency,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        examScopeKey: scope.key,
        examTitle: scope.title,
        examId: scope.examId,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Quiz Arena create-order error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return reject(
      "Unable to prepare the Quiz Arena exam subscription payment.",
      500,
    );
  }
}
