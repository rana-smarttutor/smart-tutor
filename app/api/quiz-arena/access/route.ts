import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getQuizArenaAccess } from "@/lib/quiz-arena-access-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Login required.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const role = String(session.role).toLowerCase();

    if (role !== "student" && role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Quiz Arena access is restricted to students.",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const access = await getQuizArenaAccess(session.id, role);

    return NextResponse.json(
      {
        success: true,
        allowed: access.allowed,
        unlimitedAccess: access.unlimitedAccess,
        requiresSubscription: access.requiresSubscription,
        canStartFreeQuiz: access.canStartFreeQuiz,
        mustResumeFreeQuiz: access.mustResumeFreeQuiz,
        status: access.status,
        freeTrial: access.freeTrial,
        subscription: access.subscription,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Quiz Arena access check failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify Quiz Arena access.",
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
