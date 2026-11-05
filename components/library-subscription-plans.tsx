"use client";

import { useEffect, useState } from "react";
import { requestLoginIfNeeded } from "@/lib/request-login";

import {
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

// =====================================================
// CONFIGURATION
// =====================================================

// Enable this ONLY after live Razorpay configuration, webhook,
// payment verification, reconciliation and R2 cutover checks pass.
// The backend must independently enforce its payment switch.
const LIBRARY_CHECKOUT_ENABLED =
  process.env.NEXT_PUBLIC_LIBRARY_PAYMENTS_ENABLED === "true";

// =====================================================
// TYPES
// =====================================================

type Plan = {
  planId: string;
  name: string;
  pricePaise: number;
  currency: "INR";
  durationMonths: number;
};

type Subscription = {
  planId: string;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
};

type CheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type OrderResult = {
  success?: boolean;
  message?: string;
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: string,
    handler: (error: {
      error?: {
        description?: string;
      };
    }) => void,
  ) => void;
};

type RazorpayConstructor = new (
  options: Record<string, unknown>,
) => RazorpayInstance;

// =====================================================
// HELPERS
// =====================================================

function money(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return date.toLocaleDateString("en-IN");
}

let checkoutScriptPromise: Promise<void> | null = null;

// =====================================================
// RAZORPAY CHECKOUT LOADER
// =====================================================

function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser required."));
  }

  const host = window as Window & {
    Razorpay?: RazorpayConstructor;
  };

  if (host.Razorpay) {
    return Promise.resolve();
  }

  if (checkoutScriptPromise) {
    return checkoutScriptPromise;
  }

  checkoutScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      if (host.Razorpay) {
        resolve();
      } else {
        reject(new Error("Razorpay Checkout could not initialize."));
      }
    };

    script.onerror = () => {
      reject(new Error("Unable to load Razorpay Checkout."));
    };

    document.body.appendChild(script);
  }).catch((error) => {
    checkoutScriptPromise = null;
    throw error;
  });

  return checkoutScriptPromise;
}

// =====================================================
// COMPONENT
// =====================================================

export default function LibrarySubscriptionPlans({
  isLoggedIn = false,
  canManage = false,
}: {
  isLoggedIn?: boolean;
  canManage?: boolean;
}) {
  // ===================================================
  // STATE
  // ===================================================

  const [plans, setPlans] = useState<Plan[]>([]);

  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [busyPlan, setBusyPlan] = useState("");

  const [notice, setNotice] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);

  const paymentsEnabled = LIBRARY_CHECKOUT_ENABLED;

  // ===================================================
  // REFRESH SUBSCRIPTION
  // ===================================================

  async function refreshSubscription() {
    if (!isLoggedIn || canManage) {
      return;
    }

    const response = await fetch("/api/digital-library/subscriptions", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to load subscription status.");
    }

    const result = (await response.json()) as {
      success?: boolean;
      subscription?: Subscription | null;
    };

    if (!result.success) {
      throw new Error("Subscription status unavailable.");
    }

    setSubscription(result.subscription || null);
  }

  // ===================================================
  // INITIALIZE PLANS AND SUBSCRIPTION
  // ===================================================

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const response = await fetch(
          "/api/digital-library/subscription-plans",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Unable to load subscription plans.");
        }

        const result = (await response.json()) as {
          success?: boolean;
          plans?: Plan[];
        };

        if (!result.success) {
          throw new Error("Subscription plans unavailable.");
        }

        if (active) {
          setPlans(result.plans || []);
        }

        // Management accounts can view the plans
        // but do not need student subscription data.
        if (isLoggedIn && !canManage) {
          const statusResponse = await fetch(
            "/api/digital-library/subscriptions",
            {
              cache: "no-store",
              credentials: "same-origin",
            },
          );

          if (!statusResponse.ok) {
            throw new Error("Unable to load subscription status.");
          }

          const status = (await statusResponse.json()) as {
            success?: boolean;
            subscription?: Subscription | null;
          };

          if (!status.success) {
            throw new Error("Subscription status unavailable.");
          }

          if (active) {
            setSubscription(status.subscription || null);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load library memberships.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [isLoggedIn, canManage]);

  // ===================================================
  // START RAZORPAY CHECKOUT
  // ===================================================

  async function startCheckout(plan: Plan) {
    // Important:
    // Do not create Razorpay orders during
    // the Digital Library migration.
    if (!paymentsEnabled) {
      setError(
        "Online subscription payments are not enabled for this environment.",
      );

      return;
    }

    if (!isLoggedIn || canManage || busyPlan) {
      return;
    }

    setBusyPlan(plan.planId);

    setError("");
    setNotice("");

    try {
      await loadCheckoutScript();

      // Create Razorpay order.
      const response = await fetch(
        "/api/digital-library/subscription-payments/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            planId: plan.planId,
          }),
        },
      );

      const order = (await response.json()) as OrderResult;

      if (
        !response.ok ||
        !order.success ||
        !order.orderId ||
        !order.keyId ||
        order.amount !== plan.pricePaise ||
        order.currency !== "INR"
      ) {
        throw new Error(
          order.message || "Unable to prepare subscription payment.",
        );
      }

      const host = window as Window & {
        Razorpay?: RazorpayConstructor;
      };

      if (!host.Razorpay) {
        throw new Error("Razorpay Checkout is not available.");
      }

      // =================================================
      // RAZORPAY CHECKOUT
      // =================================================

      const checkout = new host.Razorpay({
        key: order.keyId,

        amount: order.amount,

        currency: order.currency,

        order_id: order.orderId,

        name: "SmartIQ Institute",

        description: `${plan.name} Digital Library Membership`,

        theme: {
          color: "#2563eb",
        },

        modal: {
          ondismiss: () => {
            setBusyPlan("");

            setNotice("Checkout closed. No payment confirmed.");
          },
        },

        // ===============================================
        // VERIFY PAYMENT
        // ===============================================

        handler: async (payment: CheckoutResponse) => {
          try {
            setNotice("Verifying payment securely...");

            const verification = await fetch(
              "/api/digital-library/subscription-payments/verify",
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                credentials: "same-origin",

                body: JSON.stringify(payment),
              },
            );

            const result = (await verification.json()) as {
              success?: boolean;
              message?: string;
              activated?: boolean;
              alreadyProcessed?: boolean;
              superseded?: boolean;
            };

            if (!verification.ok || !result.success) {
              throw new Error(
                result.message || "Payment confirmation is pending.",
              );
            }

            await refreshSubscription();

            setNotice(
              result.superseded
                ? "Payment confirmed. A newer subscription is already active."
                : "Payment verified. Your subscription has been recorded.",
            );
          } catch (err) {
            setNotice("");

            setError(
              (err instanceof Error ? err.message : "Verification failed.") +
                " If payment was captured, do not pay again until it is reconciled.",
            );
          } finally {
            setBusyPlan("");
          }
        },
      });

      // =================================================
      // PAYMENT FAILURE
      // =================================================

      checkout.on("payment.failed", (failure) => {
        setBusyPlan("");

        setError(
          failure.error?.description || "Payment failed. Please try again.",
        );
      });

      checkout.open();
    } catch (err) {
      setBusyPlan("");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to open Razorpay Checkout.",
      );
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border bg-white p-5 text-sm text-slate-500">
        Loading subscription plans...
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
      {/* ===============================================
          HEADING
      =============================================== */}

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <BookOpen size={22} />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">
            Digital Library Membership
          </h2>

          <p className="text-sm text-slate-500">
            One-time payment. No automatic renewal.
          </p>
        </div>
      </div>


      {/* ===============================================
          MANAGEMENT NOTICE
      =============================================== */}

      {canManage && (
        <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          Management preview — student payments are unavailable from this
          account.
        </div>
      )}

      {/* ===============================================
          ACTIVE SUBSCRIPTION
      =============================================== */}

      {subscription && !canManage && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <ShieldCheck size={19} />
            Active Subscription
          </div>

          <p className="mt-2 text-sm text-emerald-900">
            Plan:{" "}
            {plans.find((p) => p.planId === subscription.planId)?.name ||
              subscription.planId}
          </p>

          <p className="mt-1 text-sm text-emerald-900">
            Started: {formatDate(subscription.startDate)}
          </p>

          <p className="mt-1 text-sm text-emerald-900">
            Expires: {formatDate(subscription.expiryDate)}
          </p>

          <p className="mt-1 text-sm font-bold text-emerald-900">
            {subscription.daysRemaining} days remaining
          </p>
        </div>
      )}

      {/* ===============================================
          ERRORS
      =============================================== */}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* ===============================================
          NOTICES
      =============================================== */}

      {notice && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-700"
        >
          {notice}
        </p>
      )}

      {/* ===============================================
          NO PLANS
      =============================================== */}

      {plans.length === 0 && (
        <p className="mt-5 text-sm text-slate-500">
          No subscription plans are currently available.
        </p>
      )}

      {/* ===============================================
          SUBSCRIPTION PLAN CARDS
      =============================================== */}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.planId}
            className="flex flex-col rounded-2xl border border-blue-100 bg-slate-50 p-5"
          >
            {/* PLAN NAME */}

            <h3 className="text-lg font-extrabold text-slate-900">
              {plan.name}
            </h3>

            {/* PRICE */}

            <p className="mt-3 text-2xl font-black text-blue-700">
              {money(plan.pricePaise)}
            </p>

            {/* DURATION */}

            <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <Clock3 size={16} />
              {plan.durationMonths}{" "}
              {plan.durationMonths === 1 ? "month" : "months"}
            </p>

            {/* ACCESS */}

            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 size={16} />
              Full Digital Library access
            </p>

            {/* RENEWAL NOTICE */}

            <p className="mt-2 text-xs text-slate-500">
              Early renewal restarts your subscription immediately.
            </p>

            {/* =========================================
                CHECKOUT BUTTON
            ========================================= */}

            <div className="mt-auto pt-5">
              <button
                type="button"
                disabled={canManage || !paymentsEnabled || Boolean(busyPlan)}
                onClick={() => {
                  if (!isLoggedIn) {
                    void requestLoginIfNeeded("/library");
                    return;
                  }
                  void startCheckout(plan);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                <CreditCard size={17} />

                {busyPlan === plan.planId
                  ? "Processing..."
                  : !isLoggedIn
                    ? "Login Required"
                    : canManage
                      ? "Student Checkout Only"
                      : !paymentsEnabled
                        ? "Payments Unavailable"
                        : subscription
                          ? "Renew Membership"
                          : "Subscribe Now"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
