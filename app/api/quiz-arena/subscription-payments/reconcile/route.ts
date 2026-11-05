
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
    { success: false, message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

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
      return reject("Student access only.", 403);
    }


const paymentConfig = getQuizArenaPaymentConfig();

if (!paymentConfig.enabled) {
  return reject(paymentConfig.reason, 503);
}

const keyId = paymentConfig.keyId;
const keySecret = paymentConfig.keySecret;


    const db = await getMongoDatabase();

    const payments = db.collection<QuizArenaPayment>(
      "quiz_arena_payments",
    );

    // Find pending orders across every Quiz Arena plan.
    const pendingOrders = await payments
      .find({
        userId: session.id,
        status: "created",
        currency: "INR",
      })
      .sort({ createdAt: 1 })
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
          message: "No pending Quiz Arena payments found.",
        },
        {
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const authorization = Buffer.from(
      `${keyId}:${keySecret}`,
    ).toString("base64");

    let recovered = 0;
    let alreadyProcessed = 0;
    let superseded = 0;
    let unresolved = 0;

    for (const order of pendingOrders) {
      try {
        const plan = getQuizArenaPlanById(order.planId);

        if (
          !plan ||
          order.amountPaise !== plan.amountPaise ||
          order.currency !== plan.currency ||
          !/^order_[a-zA-Z0-9]+$/.test(order.razorpayOrderId)
        ) {
          unresolved += 1;
          continue;
        }

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

        const data =
          (await razorpayResponse.json()) as RazorpayPaymentList;

        if (!Array.isArray(data.items)) {
          unresolved += 1;
          continue;
        }

        const capturedPayments = data.items
          .filter(
            (payment) =>
              payment.order_id === order.razorpayOrderId &&
              payment.status === "captured" &&
              payment.captured === true &&
              payment.amount === plan.amountPaise &&
              payment.currency === plan.currency &&
              /^pay_[a-zA-Z0-9]+$/.test(payment.id) &&
              Number.isSafeInteger(payment.created_at) &&
              payment.created_at > 0,
          )
          .sort(
            (a, b) =>
              a.created_at - b.created_at ||
              a.id.localeCompare(b.id),
          );

        // Do not automatically process ambiguous orders.
        if (capturedPayments.length !== 1) {
          unresolved += 1;
          continue;
        }

        const payment = capturedPayments[0];

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
        }

        if (result.alreadyProcessed) {
          alreadyProcessed += 1;
        }

        if (result.superseded) {
          superseded += 1;
        }
      } catch (error) {
        console.error(
          "Quiz Arena reconciliation error:",
          error instanceof Error
            ? error.message
            : "Unknown error",
        );

        unresolved += 1;
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
            ? "Some Quiz Arena payments require another check or manual review."
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
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    return reject(
      "Unable to reconcile Quiz Arena payments.",
      500,
    );
  }
}
