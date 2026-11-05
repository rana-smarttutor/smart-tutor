import "server-only";

import { getQuizArenaFreeTrialState } from "@/lib/quiz-arena-free-trial";

import { getActiveQuizArenaSubscription } from "@/lib/quiz-arena-subscriptions";

export type QuizArenaAccessStatus =
  | "admin"
  | "subscribed"
  | "free-available"
  | "free-in-progress"
  | "subscription-required";

export type QuizArenaAccessResult = {
  allowed: boolean;
  unlimitedAccess: boolean;
  requiresSubscription: boolean;
  canStartFreeQuiz: boolean;
  mustResumeFreeQuiz: boolean;
  status: QuizArenaAccessStatus;
  freeTrial: {
    consumed: boolean;
    draftId: string | null;
  };
  subscription: {
    active: boolean;
    expiresAt: string | null;
  };
};

export async function getQuizArenaAccess(
  userId: string,
  role: string,
): Promise<QuizArenaAccessResult> {
  const normalizedRole = role.toLowerCase();

  // Administrators have unlimited access for testing.
  if (normalizedRole === "admin") {
    return {
      allowed: true,
      unlimitedAccess: true,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "admin",
      freeTrial: {
        consumed: false,
        draftId: null,
      },
      subscription: {
        active: false,
        expiresAt: null,
      },
    };
  }

  // Other roles cannot use student Quiz Arena access.
  if (normalizedRole !== "student") {
    return {
      allowed: false,
      unlimitedAccess: false,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "subscription-required",
      freeTrial: {
        consumed: false,
        draftId: null,
      },
      subscription: {
        active: false,
        expiresAt: null,
      },
    };
  }

  // Subscription and free-trial checks are independent.
  const [subscription, trial] = await Promise.all([
    getActiveQuizArenaSubscription(userId),
    getQuizArenaFreeTrialState(userId),
  ]);

  const freeTrial = {
    consumed: trial?.consumed === true,
    draftId: trial?.draftId ?? null,
  };

  // An active subscription overrides trial restrictions.
  if (subscription) {
    return {
      allowed: true,
      unlimitedAccess: true,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "subscribed",
      freeTrial,
      subscription: {
        active: true,
        expiresAt: subscription.expiresAt,
      },
    };
  }

  // The free trial has already been completed.
  if (freeTrial.consumed) {
    return {
      allowed: false,
      unlimitedAccess: false,
      requiresSubscription: true,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: false,
      status: "subscription-required",
      freeTrial,
      subscription: {
        active: false,
        expiresAt: null,
      },
    };
  }

  // A free-trial draft is already reserved.
  // The student must continue that draft.
  if (freeTrial.draftId) {
    return {
      allowed: true,
      unlimitedAccess: false,
      requiresSubscription: false,
      canStartFreeQuiz: false,
      mustResumeFreeQuiz: true,
      status: "free-in-progress",
      freeTrial,
      subscription: {
        active: false,
        expiresAt: null,
      },
    };
  }

  // The student has never started their free trial.
  return {
    allowed: true,
    unlimitedAccess: false,
    requiresSubscription: false,
    canStartFreeQuiz: true,
    mustResumeFreeQuiz: false,
    status: "free-available",
    freeTrial,
    subscription: {
      active: false,
      expiresAt: null,
    },
  };
}
