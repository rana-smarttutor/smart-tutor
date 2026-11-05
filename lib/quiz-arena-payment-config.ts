import "server-only";

type PaymentConfig =
  | {
      enabled: true;
      mode: "test" | "live";
      keyId: string;
      keySecret: string;
    }
  | {
      enabled: false;
      reason: string;
    };

export function getQuizArenaPaymentConfig(): PaymentConfig {
  const vercelEnv = process.env.VERCEL_ENV;
  const isVercel = Boolean(vercelEnv);

  // Never enable real payments on preview deployments.
  if (isVercel && vercelEnv !== "production") {
    return {
      enabled: false,
      reason: "Quiz Arena payments are disabled on preview deployments.",
    };
  }

  // Live payments require Vercel Production.
  // Local development must use test credentials.
  const isLive = vercelEnv === "production";

  const enabled = isLive
    ? process.env.QUIZ_ARENA_PAYMENTS_ENABLED === "true"
    : !isVercel &&
      process.env.NODE_ENV === "development" &&
      process.env.QUIZ_ARENA_TEST_PAYMENTS_ENABLED === "true";

  if (!enabled) {
    return {
      enabled: false,
      reason: "Quiz Arena payments are not enabled.",
    };
  }

  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";

  const expectedPrefix = isLive ? "rzp_live_" : "rzp_test_";

  if (
    !keyId.startsWith(expectedPrefix) ||
    !keySecret.trim() ||
    keySecret === "YOUR_KEY_SECRET"
  ) {
    return {
      enabled: false,
      reason: "Razorpay credentials are not configured for this environment.",
    };
  }

  return {
    enabled: true,
    mode: isLive ? "live" : "test",
    keyId,
    keySecret,
  };
}
