import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  getQuizArenaSubscriptionHistory,
  getActiveQuizArenaSubscriptionForExam,
  getActiveQuizArenaSubscription,
} from "@/lib/quiz-arena-subscriptions";

import { getStudentQuizArenaEntitlements } from "@/lib/quiz-arena-exam-entitlements";

import { getQuizArenaExamScopeByKey } from "@/lib/quiz-arena-exam-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SmartIQ Institute — Quiz Arena Subscriptions API
 *
 * Returns:
 *
 * - Active individually purchased exams
 * - Independent exam expiry dates
 * - Historical global subscription status
 * - Complete subscription history
 * - Selected exam subscription status
 *
 * Administrators retain testing access.
 *
 * This endpoint must never grant access
 * to other exams based on a single
 * individual exam subscription.
 */

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return jsonResponse(
        {
          success: false,
          error: "Login is required.",
        },
        401,
      );
    }

    if (session.role !== "student" && session.role !== "admin") {
      return jsonResponse(
        {
          success: false,
          error: "Access denied.",
        },
        403,
      );
    }

    const url = new URL(request.url);

    const requestedScopeKey = url.searchParams.get("examScopeKey");

    /**
     * A missing query parameter means the
     * caller wants the student's complete
     * subscription overview.
     *
     * If a scope is supplied, it must resolve
     * to a valid individual exam.
     */
    const selectedScope =
      requestedScopeKey === null
        ? null
        : getQuizArenaExamScopeByKey(requestedScopeKey);

    if (requestedScopeKey !== null && !selectedScope) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid individual exam selection.",
        },
        400,
      );
    }

    /**
     * Administrators can test all exams.
     *
     * Admin access does not create a
     * student subscription record.
     */
    if (session.role === "admin") {
      return jsonResponse({
        success: true,
        isAdmin: true,
        unlimitedAccess: true,

        pricingModel: "per-exam",

        active: true,
        subscription: null,

        selectedExam: selectedScope
          ? {
              examScopeKey: selectedScope.key,
              examTitle: selectedScope.title,
              active: true,
              accessType: "admin",
              expiresAt: null,
              subscription: null,
            }
          : null,

        activeExams: [],

        legacyAccess: {
          active: false,
          subscriptionId: null,
          expiresAt: null,
        },

        history: [],
      });
    }

    /**
     * Read all current student entitlements,
     * including legacy global access.
     */
    const [entitlements, history] = await Promise.all([
      getStudentQuizArenaEntitlements(session.id),

      getQuizArenaSubscriptionHistory(session.id),
    ]);

    const legacyActive = entitlements.legacyAccess.active;

    /**
     * Keep this response field compatible
     * with existing clients.
     *
     * The old "subscription" field represents
     * only historical global access unless
     * the caller selected an exact exam.
     *
     * An exam-specific purchase must never
     * be represented as platform-wide access.
     */
    const legacySubscription = legacyActive
      ? await getActiveQuizArenaSubscription(session.id)
      : null;

    let selectedExam: {
      examScopeKey: string;
      examTitle: string;
      active: boolean;
      accessType: "exam-subscription" | "legacy-subscription" | "none";
      expiresAt: string | null;
      subscription: Awaited<
        ReturnType<typeof getActiveQuizArenaSubscriptionForExam>
      >;
    } | null = null;

    let selectedSubscription = null;

    if (selectedScope) {
      /**
       * Find a subscription for the exact
       * selected exam only.
       */
      const examSubscription = await getActiveQuizArenaSubscriptionForExam(
        session.id,
        selectedScope.key,
      );

      selectedSubscription = examSubscription;

      const exactExamActive = examSubscription !== null;

      const active = exactExamActive || legacyActive;

      const exactExpiry = examSubscription?.expiresAt ?? null;

      const legacyExpiry = entitlements.legacyAccess.expiresAt;

      /**
       * If both a paid exam subscription and
       * an old global subscription exist,
       * show the later relevant expiry.
       */
      const expiresAt =
        exactExpiry && legacyExpiry
          ? new Date(exactExpiry).getTime() >= new Date(legacyExpiry).getTime()
            ? exactExpiry
            : legacyExpiry
          : (exactExpiry ?? legacyExpiry);

      selectedExam = {
        examScopeKey: selectedScope.key,
        examTitle: selectedScope.title,

        active,

        accessType: exactExamActive
          ? "exam-subscription"
          : legacyActive
            ? "legacy-subscription"
            : "none",

        expiresAt: active ? expiresAt : null,

        subscription: examSubscription,
      };
    }

    /**
     * Without a selected exam, "active"
     * indicates that the student owns at
     * least one active paid entitlement.
     *
     * This is an OVERVIEW flag only.
     *
     * It must never be used to authorize
     * a specific exam.
     */
    const hasAnyActiveSubscription =
      legacyActive || entitlements.activeExams.length > 0;

    /**
     * For a specific exam, the response's
     * active flag describes only that exam.
     *
     * For an overview, it means the student
     * owns at least one subscription.
     */
    const active = selectedScope
      ? selectedExam?.active === true
      : hasAnyActiveSubscription;

    return jsonResponse({
      success: true,

      isAdmin: false,
      unlimitedAccess: false,

      pricingModel: "per-exam",

      active,

      /**
       * Existing response compatibility:
       *
       * When a specific exam was requested,
       * return its subscription.
       *
       * Otherwise return only a legacy
       * global subscription, if any.
       */
      subscription: selectedScope
        ? (selectedSubscription ?? (legacyActive ? legacySubscription : null))
        : legacySubscription,

      selectedExam,

      activeExams: entitlements.activeExams,

      legacyAccess: entitlements.legacyAccess,

      history,
    });
  } catch (error) {
    console.error(
      "Quiz Arena subscriptions error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonResponse(
      {
        success: false,
        error: "Unable to load Quiz Arena subscription details.",
      },
      500,
    );
  }
}
