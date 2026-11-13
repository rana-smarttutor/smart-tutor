import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMockQuizQuestions } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SmartIQ Institute — Legacy Mock Test Question API
 *
 * This endpoint returns the complete stored
 * question collection, including answer keys.
 *
 * Students must use the protected Quiz Arena
 * question-generation endpoint instead.
 *
 * Quiz Arena and Mock Test share the same
 * exam-specific subscription access system.
 */

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
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

    if (
      session.role !== "admin" ||
      (session.status && session.status !== "active")
    ) {
      return NextResponse.json(
        {
          error: "Bulk question access is restricted to administrators.",
          code: "ADMIN_ACCESS_REQUIRED",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const questions = await getMockQuizQuestions();

    return NextResponse.json(
      {
        questions,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Mock Test question API failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      {
        error: "Unable to retrieve Mock Test questions.",
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
