import { NextResponse } from "next/server";

import {
  getQuizArenaSubscriptionPlans,
  QUIZ_ARENA_PLAN,
} from "@/lib/quiz-arena-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SmartIQ Institute — Quiz Arena Plans API
 *
 * New commercial model:
 *
 * ₹49 per individual exam for 30 days.
 *
 * One shared monthly pricing plan, but each
 * purchase grants access to one exam only.
 *
 * Quarterly and annual plans are no longer sold.
 *
 * MongoDB must contain an active monthly plan
 * matching the trusted server-side price.
 */

export async function GET() {
  try {
    const storedPlans = await getQuizArenaSubscriptionPlans();

    /**
     * Only advertise the exact trusted
     * monthly plan when it is active
     * and correctly configured in MongoDB.
     *
     * Avoid advertising a purchase option
     * if the payment-order API would reject it.
     */
    const monthlyPlan = storedPlans.find(
      (plan) =>
        plan.id === QUIZ_ARENA_PLAN.id &&
        plan.active === true &&
        plan.price === 49 &&
        plan.amountPaise === 4900 &&
        plan.currency === "INR" &&
        plan.durationDays === 30,
    );

    return NextResponse.json(
      {
        success: true,

        pricingModel: "per-exam",

        currency: "INR",

        durationDays: 30,

        plans: monthlyPlan ? [monthlyPlan] : [],

        configurationReady: Boolean(monthlyPlan),

        message: monthlyPlan
          ? "₹49 for 30 days of access to one selected exam."
          : "Quiz Arena monthly subscriptions are not yet available.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Quiz Arena subscription plans error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      {
        success: false,
        pricingModel: "per-exam",
        plans: [],
        error: "Unable to load Quiz Arena subscription plans.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
