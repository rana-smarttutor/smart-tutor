import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getQuizArenaAccess } from "@/lib/quiz-arena-access-guard";
import { getQuizArenaExamScope } from "@/lib/quiz-arena-exam-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * GET /api/quiz-arena/access
 *
 * Accepted query parameters:
 *   exam
 *   level
 *   schoolClass
 *   board
 *
 * Example:
 * ?exam=ssc-cgl&level=government-exam
 *
 * School example:
 * ?exam=class-11-12-science
 * &level=school-junior-college
 * &schoolClass=12
 * &board=Maharashtra%20State%20Board
 *
 * An individual-exam subscription never grants
 * access to an unrelated exam.
 */
export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return response({ success: false, error: "Login required." }, 401);
    }

    const role = String(session.role).toLowerCase();

    if (role !== "student" && role !== "admin") {
      return response(
        {
          success: false,
          error:
            "Quiz Arena access is restricted to students and administrators.",
        },
        403,
      );
    }

    if (session.status && session.status !== "active") {
      return response(
        {
          success: false,
          error: "Your account is not active.",
        },
        403,
      );
    }

    const params = new URL(request.url).searchParams;

    const exam = params.get("exam");

    /**
     * The frontend must select an individual
     * examination before requesting access.
     *
     * This also prevents an unscoped request
     * from being treated as global access.
     */
    if (!exam) {
      return response(
        {
          success: false,
          error: "Please select an individual exam.",
          code: "QUIZ_EXAM_REQUIRED",
        },
        400,
      );
    }

    const scope = getQuizArenaExamScope({
      exam,
      level: params.get("level") ?? undefined,
      schoolClass: params.get("schoolClass") ?? undefined,
      board: params.get("board") ?? undefined,
    });

    if (!scope) {
      return response(
        {
          success: false,
          error: "Invalid exam, school class or board selection.",
          code: "QUIZ_EXAM_INVALID",
        },
        400,
      );
    }

    const access = await getQuizArenaAccess(session.id, role, scope.key);

    return response({
      success: true,

      allowed: access.allowed,
      unlimitedAccess: access.unlimitedAccess,
      requiresSubscription: access.requiresSubscription,

      canStartFreeQuiz: access.canStartFreeQuiz,
      mustResumeFreeQuiz: access.mustResumeFreeQuiz,

      status: access.status,
      accessType: access.accessType,

      examScopeKey: scope.key,
      examTitle: scope.title,
      examId: scope.examId,

      pricingModel: "per-exam",
      price: 49,
      durationDays: 30,

      freeTrial: access.freeTrial,
      subscription: access.subscription,
    });
  } catch (error) {
    console.error(
      "Quiz Arena access check failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return response(
      {
        success: false,
        error: "Unable to verify Quiz Arena access.",
      },
      500,
    );
  }
}
