import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
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
  captured?: boolean;
  created_at: number;
};

type RazorpayPaymentList = {
  items?: RazorpayPayment[];
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
 * SmartIQ Institute
 * Quiz Arena — Exam-Specific Payment Reconciliation
 *
 * Used to recover payments that were captured
 * by Razorpay but not successfully activated
 * due to interrupted checkout verification.
 *
 * Rules:
 *
 * - Students can reconcile only their orders.
 * - Each order belongs to one exact exam.
 * - Never change examScopeKey during recovery.
 * - Never assign an old global order to a
 *   new individual exam automatically.
 * - Never trust the browser's payment status.
 * - Activate only confirmed captured payments.
 * - Support multiple independent exam orders.
 */
export async function POST() {
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
        "Only active students can reconcile Quiz Arena payments.",
        403,
      );
    }

    const paymentConfig = getQuizArenaPaymentConfig();

    if (!paymentConfig.enabled) {
      return reject(paymentConfig.reason, 503);
    }

    const db = await getMongoDatabase();

    const payments = db.collection<QuizArenaPayment>("quiz_arena_payments");

    /**
     * Read pending orders belonging only
     * to the authenticated student.
     *
     * Do not accept student IDs or exam IDs
     * from the browser.
     */
    const pendingOrders = await payments
      .find({
        userId: session.id,
        status: "created",
        currency: "INR",
      })
      .sort({
        createdAt: 1,
      })
      .limit(10)
      .toArray();

    if (pendingOrders.length === 0) {
      return NextResponse.json(
        {
          success: true,
          checked: 0,
          recovered: 0,
          alreadyProcessed: 0,
          superseded: 0,
          unresolved: 0,
          legacyPending: 0,
          recoveredExams: [],
          message: "No pending Quiz Arena payments found.",
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const authorization = Buffer.from(
      `${paymentConfig.keyId}:${paymentConfig.keySecret}`,
    ).toString("base64");

    let recovered = 0;
    let alreadyProcessed = 0;
    let superseded = 0;
    let unresolved = 0;
    let legacyPending = 0;

    const recoveredExams: Array<{
      examScopeKey: string;
      examTitle: string;
      orderId: string;
    }> = [];

    /**
     * Each order is independently verified.
     *
     * Failure of one order must not prevent
     * reconciliation of other exams.
     */
    for (const order of pendingOrders) {
      try {
        /**
         * Orders created before the new model
         * may not contain an exam scope.
         *
         * Preserve them for separate legacy
         * reconciliation rather than silently
         * converting them.
         */
        if (!order.examScopeKey) {
          legacyPending += 1;
          unresolved += 1;
          continue;
        }

        /**
         * Verify the original purchased exam
         * from MongoDB.
         */
        const scope = getQuizArenaExamScopeByKey(order.examScopeKey);

        if (!scope) {
          unresolved += 1;
          continue;
        }

        if (order.examTitle && order.examTitle !== scope.title) {
          unresolved += 1;
          continue;
        }

        /**
         * Validate the original ₹49 monthly
         * subscription order.
         */
        if (
          order.planId !== QUIZ_ARENA_PLAN.id ||
          order.amountPaise !== QUIZ_ARENA_PLAN.amountPaise ||
          order.currency !== QUIZ_ARENA_PLAN.currency ||
          !/^order_[a-zA-Z0-9]+$/.test(order.razorpayOrderId)
        ) {
          unresolved += 1;
          continue;
        }

        /**
         * Fetch actual payment records
         * directly from Razorpay.
         */
        const razorpayResponse = await fetch(
          `https://api.razorpay.com/v1/orders/${encodeURIComponent(
            order.razorpayOrderId,
          )}/payments`,
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
          unresolved += 1;
          continue;
        }

        const data = (await razorpayResponse.json()) as RazorpayPaymentList;

        if (!Array.isArray(data.items)) {
          unresolved += 1;
          continue;
        }

        /**
         * Select only exact captured payments
         * matching the original order.
         */
        const capturedPayments = data.items
          .filter(
            (payment) =>
              payment.order_id === order.razorpayOrderId &&
              payment.status === "captured" &&
              payment.captured === true &&
              payment.amount === QUIZ_ARENA_PLAN.amountPaise &&
              payment.currency === QUIZ_ARENA_PLAN.currency &&
              /^pay_[a-zA-Z0-9]+$/.test(payment.id) &&
              Number.isSafeInteger(payment.created_at) &&
              payment.created_at > 0,
          )
          .sort(
            (a, b) => a.created_at - b.created_at || a.id.localeCompare(b.id),
          );

        /**
         * Never automatically activate
         * ambiguous payments.
         *
         * Exactly one matching captured
         * payment is required per order.
         */
        if (capturedPayments.length !== 1) {
          unresolved += 1;
          continue;
        }

        const payment = capturedPayments[0];

        /**
         * Activate using the original stored
         * order, never a replacement exam ID.
         */
        const result = await activateVerifiedQuizArenaPayment({
          paymentId: payment.id,
          orderId: order.razorpayOrderId,
          amountPaise: payment.amount,
          currency: payment.currency,
          status: payment.status,
          createdAtSeconds: payment.created_at,
        });

        if (result.activated) {
          recovered += 1;

          recoveredExams.push({
            examScopeKey: scope.key,
            examTitle: scope.title,
            orderId: order.razorpayOrderId,
          });
        }

        if (result.alreadyProcessed) {
          alreadyProcessed += 1;
        }

        if (result.superseded) {
          superseded += 1;
        }
      } catch (error) {
        console.error(
          "Quiz Arena exam payment reconciliation error:",
          error instanceof Error ? error.message : "Unknown error",
        );

        unresolved += 1;
      }
    }

    /**
     * Return a summary for the student
     * subscription interface.
     *
     * Do not expose another student's
     * payment records.
     */
    return NextResponse.json(
      {
        success: true,
        checked: pendingOrders.length,
        recovered,
        alreadyProcessed,
        superseded,
        unresolved,
        legacyPending,
        recoveredExams,
        message:
          unresolved > 0
            ? legacyPending > 0
              ? "Some payments belong to the previous Quiz Arena subscription system and require separate reconciliation."
              : "Some Quiz Arena payments require another check or manual review."
            : recovered > 0
              ? `${recovered} exam subscription payment(s) recovered successfully.`
              : "Quiz Arena payment reconciliation completed.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Quiz Arena reconciliation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return reject("Unable to reconcile Quiz Arena payments.", 500);
  }
}
