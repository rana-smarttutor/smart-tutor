import "server-only";

import { getMongoDatabase } from "@/lib/mongodb";

import {
  getQuizArenaExamScopeByKey,
  type QuizArenaExamScope,
} from "@/lib/quiz-arena-exam-scope";

/**
 * SmartIQ Institute
 * Quiz Arena — Exam-Specific Entitlements
 *
 * Subscription rules:
 *
 * 1. Each new subscription belongs to one exact exam.
 * 2. Each exam has its own validity period.
 * 3. A student may own multiple exam subscriptions.
 * 4. A subscription never unlocks an unrelated exam.
 * 5. Existing legacy subscriptions are honoured until
 *    their original expiry date.
 * 6. Historical payment and subscription records
 *    must never be deleted during migration.
 *
 * Quiz Arena and Mock Test share these entitlements.
 */

const SUBSCRIPTION_COLLECTION = "quiz_arena_subscriptions";

export type QuizArenaExamEntitlement = {
  subscriptionId: string;
  userId: string;
  examScopeKey: string;
  examTitle: string;
  planId: string;
  startsAt: string;
  expiresAt: string;
  paymentId: string;
  active: boolean;
};

export type QuizArenaExamAccessResult = {
  allowed: boolean;
  accessType: "exam-subscription" | "legacy-subscription" | "none";
  examScopeKey: string;
  examTitle: string;
  subscriptionId: string | null;
  startsAt: string | null;
  expiresAt: string | null;
};

export type QuizArenaStudentEntitlements = {
  activeExams: QuizArenaExamEntitlement[];
  legacyAccess: {
    active: boolean;
    subscriptionId: string | null;
    expiresAt: string | null;
  };
};

type StoredQuizArenaSubscription = {
  id: string;
  userId: string;
  planId: string;
  examScopeKey?: string | null;
  examTitle?: string | null;
  startsAt: string;
  expiresAt: string;
  paymentId: string;
  createdAt: string;
};

/**
 * The original subscription system saved no exam key.
 *
 * These are historical platform-wide subscriptions.
 * They remain valid until their actual expiry.
 *
 * Never use this legacy check to activate new payments.
 */
function isLegacySubscription(
  subscription: StoredQuizArenaSubscription,
): boolean {
  return (
    subscription.examScopeKey === undefined ||
    subscription.examScopeKey === null ||
    subscription.examScopeKey === ""
  );
}

/**
 * ISO-8601 strings produced by the subscription system
 * can be compared chronologically.
 *
 * Additionally verify the values are valid date strings.
 */
function isActiveSubscription(
  subscription: StoredQuizArenaSubscription,
  now: Date,
): boolean {
  const startsAt = new Date(subscription.startsAt);
  const expiresAt = new Date(subscription.expiresAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  return (
    startsAt.getTime() <= now.getTime() && expiresAt.getTime() > now.getTime()
  );
}

/**
 * Find an active subscription for one exact exam.
 *
 * The exam scope is derived and validated by the
 * official quiz-arena-exam-scope helper.
 *
 * This query does not match parent categories,
 * other exams, classes, streams or boards.
 */
export async function getActiveQuizArenaExamSubscription(
  userId: string,
  examScopeKey: string,
): Promise<StoredQuizArenaSubscription | null> {
  if (!userId.trim()) {
    return null;
  }

  const scope = getQuizArenaExamScopeByKey(examScopeKey);

  if (!scope) {
    return null;
  }

  const db = await getMongoDatabase();

  const subscriptions = db.collection<StoredQuizArenaSubscription>(
    SUBSCRIPTION_COLLECTION,
  );

  const now = new Date().toISOString();

  return subscriptions.findOne(
    {
      userId,
      examScopeKey: scope.key,
      startsAt: { $lte: now },
      expiresAt: { $gt: now },
    },
    {
      sort: {
        expiresAt: -1,
      },
      projection: {
        _id: 0,
      },
    },
  );
}

/**
 * Return an existing global subscription.
 *
 * This is strictly for backward compatibility.
 *
 * When all historical global subscriptions expire,
 * this function can be retired in a future migration.
 */
export async function getActiveLegacyQuizArenaSubscription(
  userId: string,
): Promise<StoredQuizArenaSubscription | null> {
  if (!userId.trim()) {
    return null;
  }

  const db = await getMongoDatabase();

  const subscriptions = db.collection<StoredQuizArenaSubscription>(
    SUBSCRIPTION_COLLECTION,
  );

  const now = new Date().toISOString();

  return subscriptions.findOne(
    {
      userId,
      startsAt: { $lte: now },
      expiresAt: { $gt: now },
      $or: [
        { examScopeKey: { $exists: false } },
        { examScopeKey: null },
        { examScopeKey: "" },
      ],
    },
    {
      sort: {
        expiresAt: -1,
      },
      projection: {
        _id: 0,
      },
    },
  );
}

/**
 * Main exam access checker.
 *
 * This returns only paid/legacy subscription access.
 *
 * Administrator access and the one-time free trial
 * are handled by quiz-arena-access-guard.ts.
 */
export async function getQuizArenaExamEntitlement(
  userId: string,
  scope: QuizArenaExamScope,
): Promise<QuizArenaExamAccessResult> {
  const validScope = getQuizArenaExamScopeByKey(scope.key);

  if (!validScope) {
    return {
      allowed: false,
      accessType: "none",
      examScopeKey: scope.key,
      examTitle: scope.title,
      subscriptionId: null,
      startsAt: null,
      expiresAt: null,
    };
  }

  const [examSubscription, legacySubscription] = await Promise.all([
    getActiveQuizArenaExamSubscription(userId, validScope.key),
    getActiveLegacyQuizArenaSubscription(userId),
  ]);

  if (examSubscription) {
    return {
      allowed: true,
      accessType: "exam-subscription",
      examScopeKey: validScope.key,
      examTitle: validScope.title,
      subscriptionId: examSubscription.id,
      startsAt: examSubscription.startsAt,
      expiresAt: examSubscription.expiresAt,
    };
  }

  if (legacySubscription) {
    return {
      allowed: true,
      accessType: "legacy-subscription",
      examScopeKey: validScope.key,
      examTitle: validScope.title,
      subscriptionId: legacySubscription.id,
      startsAt: legacySubscription.startsAt,
      expiresAt: legacySubscription.expiresAt,
    };
  }

  return {
    allowed: false,
    accessType: "none",
    examScopeKey: validScope.key,
    examTitle: validScope.title,
    subscriptionId: null,
    startsAt: null,
    expiresAt: null,
  };
}

/**
 * Convenience function for server-side routes.
 */
export async function hasQuizArenaExamAccess(
  userId: string,
  scope: QuizArenaExamScope,
): Promise<boolean> {
  const entitlement = await getQuizArenaExamEntitlement(userId, scope);

  return entitlement.allowed;
}

/**
 * Return every active exam subscription belonging
 * to a student, along with legacy access if present.
 *
 * Useful for:
 * - Subscription status
 * - My Purchased Exams
 * - Renewal buttons
 * - Exam selection screen
 */
export async function getStudentQuizArenaEntitlements(
  userId: string,
): Promise<QuizArenaStudentEntitlements> {
  if (!userId.trim()) {
    return {
      activeExams: [],
      legacyAccess: {
        active: false,
        subscriptionId: null,
        expiresAt: null,
      },
    };
  }

  const db = await getMongoDatabase();

  const subscriptions = db.collection<StoredQuizArenaSubscription>(
    SUBSCRIPTION_COLLECTION,
  );

  const now = new Date();

  const stored = await subscriptions
    .find(
      {
        userId,
        startsAt: {
          $lte: now.toISOString(),
        },
        expiresAt: {
          $gt: now.toISOString(),
        },
      },
      {
        projection: {
          _id: 0,
        },
      },
    )
    .sort({
      expiresAt: -1,
    })
    .toArray();

  const activeSubscriptions = stored.filter((subscription) =>
    isActiveSubscription(subscription, now),
  );

  const activeExams: QuizArenaExamEntitlement[] = [];

  const seenScopes = new Set<string>();

  let legacySubscription: StoredQuizArenaSubscription | null = null;

  for (const subscription of activeSubscriptions) {
    if (isLegacySubscription(subscription)) {
      if (
        !legacySubscription ||
        new Date(subscription.expiresAt).getTime() >
          new Date(legacySubscription.expiresAt).getTime()
      ) {
        legacySubscription = subscription;
      }

      continue;
    }

    const scope = getQuizArenaExamScopeByKey(subscription.examScopeKey);

    if (!scope) {
      // Never grant access to an unknown or
      // malformed exam key.
      continue;
    }

    if (seenScopes.has(scope.key)) {
      // The subscriptions are ordered by expiry.
      // Keep the latest active entitlement per exam.
      continue;
    }

    seenScopes.add(scope.key);

    activeExams.push({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      examScopeKey: scope.key,
      examTitle: scope.title,
      planId: subscription.planId,
      startsAt: subscription.startsAt,
      expiresAt: subscription.expiresAt,
      paymentId: subscription.paymentId,
      active: true,
    });
  }

  return {
    activeExams,
    legacyAccess: {
      active: legacySubscription !== null,
      subscriptionId: legacySubscription?.id ?? null,
      expiresAt: legacySubscription?.expiresAt ?? null,
    },
  };
}

/**
 * Find the active expiry date for an exact exam.
 *
 * Returns null if the student has no paid
 * subscription or legacy entitlement.
 */
export async function getQuizArenaExamExpiry(
  userId: string,
  scope: QuizArenaExamScope,
): Promise<string | null> {
  const entitlement = await getQuizArenaExamEntitlement(userId, scope);

  return entitlement.expiresAt;
}
