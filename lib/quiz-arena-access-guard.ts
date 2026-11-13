import "server-only";

import { getQuizArenaFreeTrialState } from "@/lib/quiz-arena-free-trial";

import { getQuizArenaExamScopeByKey } from "@/lib/quiz-arena-exam-scope";

import { getQuizArenaExamEntitlement } from "@/lib/quiz-arena-exam-entitlements";

/**
 * SmartIQ Institute — Quiz Arena Access Guard
 *
 * New access policy:
 *
 * - Admins can access all exams for testing.
 * - Students may access exams they purchased.
 * - Each paid exam is independent.
 * - Existing global subscriptions are honoured.
 * - The free trial remains one-time per student.
 * - Quiz Arena and Mock Test use the same rules.
 *
 * IMPORTANT:
 *
 * Paid exam access must be checked with the
 * exact validated exam scope key.
 *
 * Calling this function without an exam scope
 * NEVER grants access through a new exam-specific
 * subscription.
 */

export type QuizArenaAccessStatus =
  | "admin"
  | "subscribed"
  | "free-available"
  | "free-in-progress"
  | "subscription-required";

export type QuizArenaAccessType =
  | "admin"
  | "exam-subscription"
  | "legacy-subscription"
  | "free-trial"
  | "none";

export type QuizArenaAccessResult = {
  allowed: boolean;

  /**
   * Retained for compatibility with existing APIs.
   *
   * For an exam-specific subscription, this means
   * unrestricted access to the REQUESTED exam only.
   * It must never mean access to all exams.
   */
  unlimitedAccess: boolean;

  requiresSubscription: boolean;
  canStartFreeQuiz: boolean;
  mustResumeFreeQuiz: boolean;

  status: QuizArenaAccessStatus;
  accessType: QuizArenaAccessType;

  examScopeKey: string | null;

  freeTrial: {
    consumed: boolean;
    draftId: string | null;
  };

  subscription: {
    active: boolean;
    expiresAt: string | null;
    examScopeKey: string | null;
    subscriptionId: string | null;
  };
};

function makeAccessResult(input: {
  allowed: boolean;
  unlimitedAccess: boolean;
  requiresSubscription: boolean;
  canStartFreeQuiz: boolean;
  mustResumeFreeQuiz: boolean;
  status: QuizArenaAccessStatus;
  accessType: QuizArenaAccessType;
  examScopeKey: string | null;
  freeTrialConsumed: boolean;
  freeTrialDraftId: string | null;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
  subscriptionId: string | null;
}): QuizArenaAccessResult {
  return {
    allowed: input.allowed,
    unlimitedAccess: input.unlimitedAccess,
    requiresSubscription: input.requiresSubscription,
    canStartFreeQuiz: input.canStartFreeQuiz,
    mustResumeFreeQuiz: input.mustResumeFreeQuiz,
    status: input.status,
    accessType: input.accessType,
    examScopeKey: input.examScopeKey,
    freeTrial: {
      consumed: input.freeTrialConsumed,
      draftId: input.freeTrialDraftId,
    },
    subscription: {
      active: input.subscriptionActive,
      expiresAt: input.subscriptionExpiresAt,
      examScopeKey: input.examScopeKey,
      subscriptionId: input.subscriptionId,
    },
  };
}

/**
 * Check student access for one selected exam.
 *
 * Usage:
 *
 * await getQuizArenaAccess(
 *   session.id,
 *   session.role,
 *   "exam:ssc-cgl",
 * );
 *
 * For school exams:
 *
 * await getQuizArenaAccess(
 *   session.id,
 *   session.role,
 *   "school:class-11-12-science:12:mh",
 * );
 *
 * The examScopeKey must originate from the
 * server-side scope validation helper.
 *
 * Existing callers without the third parameter
 * remain valid during migration, but cannot
 * grant access through new exam purchases.
 */
export async function getQuizArenaAccess(
  userId: string,
  role: string,
  examScopeKey?: string | null,
): Promise<QuizArenaAccessResult> {
  const normalizedRole = String(role ?? "")
    .trim()
    .toLowerCase();

  const requestedScope =
    examScopeKey == null ? null : getQuizArenaExamScopeByKey(examScopeKey);

  /**
   * Invalid explicit exam scopes must fail closed.
   */
  if (examScopeKey != null && !requestedScope) {
    return makeAccessResult({
      allowed: false,
      unlimitedAccess: false,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "subscription-required",
      accessType: "none",
      examScopeKey: null,
      freeTrialConsumed: false,
      freeTrialDraftId: null,
      subscriptionActive: false,
      subscriptionExpiresAt: null,
      subscriptionId: null,
    });
  }

  const validatedScopeKey = requestedScope?.key ?? null;

  /**
   * Administrators retain testing access.
   *
   * This is a role permission, not a student
   * subscription.
   */
  if (normalizedRole === "admin") {
    return makeAccessResult({
      allowed: true,
      unlimitedAccess: true,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "admin",
      accessType: "admin",
      examScopeKey: validatedScopeKey,
      freeTrialConsumed: false,
      freeTrialDraftId: null,
      subscriptionActive: false,
      subscriptionExpiresAt: null,
      subscriptionId: null,
    });
  }

  /**
   * Only student accounts may purchase or
   * use student subscriptions.
   */
  if (normalizedRole !== "student" || !userId.trim()) {
    return makeAccessResult({
      allowed: false,
      unlimitedAccess: false,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "subscription-required",
      accessType: "none",
      examScopeKey: validatedScopeKey,
      freeTrialConsumed: false,
      freeTrialDraftId: null,
      subscriptionActive: false,
      subscriptionExpiresAt: null,
      subscriptionId: null,
    });
  }

  const [trial, entitlement] = await Promise.all([
    getQuizArenaFreeTrialState(userId),

    requestedScope
      ? getQuizArenaExamEntitlement(userId, requestedScope)
      : Promise.resolve(null),
  ]);

  const freeTrialConsumed = trial?.consumed === true;

  const freeTrialDraftId = trial?.draftId ?? null;

  /**
   * Paid or grandfathered access to the
   * exact requested exam.
   *
   * An SSC CGL subscription cannot unlock
   * SSC CHSL, CAT, NEET or another exam.
   */
  if (entitlement?.allowed) {
    return makeAccessResult({
      allowed: true,
      unlimitedAccess: true,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "subscribed",
      accessType: entitlement.accessType,
      examScopeKey: validatedScopeKey,
      freeTrialConsumed,
      freeTrialDraftId,
      subscriptionActive: true,
      subscriptionExpiresAt: entitlement.expiresAt,
      subscriptionId: entitlement.subscriptionId,
    });
  }

  /**
   * Compatibility for old callers that have
   * not yet supplied an exam scope.
   *
   * We can honour an active legacy GLOBAL
   * subscription, but we must not treat a
   * purchased individual exam as global.
   */
  if (!requestedScope) {
    const { getActiveLegacyQuizArenaSubscription } =
      await import("@/lib/quiz-arena-exam-entitlements");

    const legacy = await getActiveLegacyQuizArenaSubscription(userId);

    if (legacy) {
      return makeAccessResult({
        allowed: true,
        unlimitedAccess: true,
        requiresSubscription: false,
        canStartFreeQuiz: false,
        mustResumeFreeQuiz: false,
        status: "subscribed",
        accessType: "legacy-subscription",
        examScopeKey: null,
        freeTrialConsumed,
        freeTrialDraftId,
        subscriptionActive: true,
        subscriptionExpiresAt: legacy.expiresAt,
        subscriptionId: legacy.id,
      });
    }
  }

  /**
   * A student receives only one free trial
   * across Quiz Arena and Mock Test.
   *
   * Exam-specific paid subscriptions do not
   * reset or recreate the free trial.
   */
  if (freeTrialConsumed) {
    return makeAccessResult({
      allowed: false,
      unlimitedAccess: false,
      requiresSubscription: true,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "subscription-required",
      accessType: "none",
      examScopeKey: validatedScopeKey,
      freeTrialConsumed: true,
      freeTrialDraftId,
      subscriptionActive: false,
      subscriptionExpiresAt: null,
      subscriptionId: null,
    });
  }

  /**
   * A free trial has already been reserved
   * against an unfinished quiz.
   *
   * The draft APIs must validate that the
   * saved draft is the same reserved trial.
   */
  if (freeTrialDraftId) {
    return makeAccessResult({
      allowed: true,
      unlimitedAccess: false,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: true,
      status: "free-in-progress",
      accessType: "free-trial",
      examScopeKey: validatedScopeKey,
      freeTrialConsumed: false,
      freeTrialDraftId,
      subscriptionActive: false,
      subscriptionExpiresAt: null,
      subscriptionId: null,
    });
  }

  /**
   * First-time free trial eligibility.
   *
   * Round restrictions remain enforced by
   * the draft and generation endpoints:
   *
   * Level 1, Round 1 only.
   */
  return makeAccessResult({
    allowed: true,
    unlimitedAccess: false,
    requiresSubscription: false,
    canStartFreeQuiz: true,
    mustResumeFreeQuiz: false,
    status: "free-available",
    accessType: "free-trial",
    examScopeKey: validatedScopeKey,
    freeTrialConsumed: false,
    freeTrialDraftId: null,
    subscriptionActive: false,
    subscriptionExpiresAt: null,
    subscriptionId: null,
  });
}
