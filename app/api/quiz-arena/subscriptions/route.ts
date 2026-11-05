import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  getActiveQuizArenaSubscription,
  getQuizArenaSubscriptionHistory,
} from "@/lib/quiz-arena-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Login is required." },
        { status: 401 },
      );
    }

    if (session.role !== "student" && session.role !== "admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    if (session.role === "admin") {
      return NextResponse.json({
        isAdmin: true,
        unlimitedAccess: true,
        subscription: null,
        history: [],
      });
    }

    const [subscription, history] = await Promise.all([
      getActiveQuizArenaSubscription(session.id),
      getQuizArenaSubscriptionHistory(session.id),
    ]);

    return NextResponse.json(
      {
        isAdmin: false,
        unlimitedAccess: false,
        subscription,
        active: Boolean(subscription),
        history,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Quiz Arena subscriptions error:", error);

    return NextResponse.json(
      { error: "Unable to load subscription details." },
      { status: 500 },
    );
  }
}
