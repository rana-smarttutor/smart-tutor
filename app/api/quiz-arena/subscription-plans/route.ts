
import { NextResponse } from "next/server";

import {
  getQuizArenaSubscriptionPlans,
  QUIZ_ARENA_PLANS,
} from "@/lib/quiz-arena-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const storedPlans = await getQuizArenaSubscriptionPlans();

    // Return only enabled, valid plans from MongoDB.
    // Keep monthly as a safe fallback if no plans are configured.
    const plans =
      storedPlans.length > 0
        ? storedPlans
        : [QUIZ_ARENA_PLANS[0]];

    return NextResponse.json(
      {
        success: true,
        plans: [...plans].sort(
          (a, b) => a.durationDays - b.durationDays,
        ),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Quiz Arena plans error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load Quiz Arena subscription plans.",
      },
      { status: 500 },
    );
  }
}
