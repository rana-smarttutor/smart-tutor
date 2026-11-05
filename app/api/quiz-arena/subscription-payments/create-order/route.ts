import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

import {
  getQuizArenaPlanById,
  type QuizArenaPayment,
} from "@/lib/quiz-arena-subscriptions";

import { getQuizArenaPaymentConfig } from "@/lib/quiz-arena-payment-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
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

const keyId = paymentConfig.keyId;
const keySecret = paymentConfig.keySecret;


    const body = (await request.json().catch(() => null)) as {
      planId?: unknown;
    } | null;

    if (!body || typeof body.planId !== "string") {
      return reject("Invalid Quiz Arena subscription plan.", 400);
    }

    const plan = getQuizArenaPlanById(body.planId);

    if (!plan || !plan.active) {
      return reject(
        "The selected Quiz Arena subscription plan is unavailable.",
        400,
      );
    }

    const db = await getMongoDatabase();

    // Only accept plans enabled with matching prices in MongoDB.
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
      return reject("This subscription plan is not yet enabled.", 503);
    }

    const amountPaise = plan.amountPaise;

    const receipt = `quiz_${randomUUID().replace(/-/g, "").slice(0, 28)}`;

    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString(
      "base64",
    );

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authorization}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: plan.currency,
        receipt,
        notes: {
          purpose: "quiz_arena_subscription",
          studentId: session.id,
          planId: plan.id,
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
      order.amount !== amountPaise ||
      order.currency !== plan.currency ||
      order.status !== "created"
    ) {
      throw new Error("Unexpected Razorpay order response.");
    }

    const payments = db.collection<QuizArenaPayment>("quiz_arena_payments");

    await payments.createIndex({ razorpayOrderId: 1 }, { unique: true });

    const now = new Date().toISOString();

    await payments.insertOne({
      id: `quiz-payment-${randomUUID()}`,
      userId: session.id,
      planId: plan.id,
      razorpayOrderId: order.id,
      amountPaise,
      currency: "INR",
      status: "created",
      createdAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        keyId,
        amount: amountPaise,
        currency: plan.currency,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error(
      "Quiz Arena order creation error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return reject("Unable to prepare Quiz Arena subscription payment.", 500);
  }
}
