"use client";

import { useCallback, useEffect, useState } from "react";

type QuizArenaPlan = {
  id: string;
  name: string;
  price: number;
  amountPaise: number;
  currency: string;
  durationDays: number;
  active: boolean;
};

type Subscription = {
  id: string;
  planId: string;
  startsAt: string;
  expiresAt: string;
};

type SubscriptionResponse = {
  active?: boolean;
  unlimitedAccess?: boolean;
  subscription?: Subscription | null;
  error?: string;
};

type OrderResponse = {
  success?: boolean;
  message?: string;
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
};

type VerifyResponse = {
  success?: boolean;
  message?: string;
  activated?: boolean;
  alreadyProcessed?: boolean;
  superseded?: boolean;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

type RazorpayWindow = Window & {
  Razorpay?: RazorpayConstructor;
};

type Props = {
  onSubscribed?: () => void;
  onClose?: () => void;
};

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const ALLOWED_PLANS = [
  {
    id: "quiz-arena-30-days",
    price: 49,
    amountPaise: 4900,
    durationDays: 30,
  },
  {
    id: "quiz-arena-90-days",
    price: 120,
    amountPaise: 12000,
    durationDays: 90,
  },
  {
    id: "quiz-arena-365-days",
    price: 500,
    amountPaise: 50000,
    durationDays: 365,
  },
] as const;

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    const razorpayWindow = window as RazorpayWindow;

    if (razorpayWindow.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`);

    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");

    script.src = CHECKOUT_SCRIPT;
    script.async = true;

    script.onload = () => resolve();

    script.onerror = () => {
      reject(new Error("Unable to load Razorpay checkout."));
    };

    document.body.appendChild(script);
  });
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getPlanTitle(durationDays: number): string {
  if (durationDays === 30) return "Monthly";
  if (durationDays === 90) return "Quarterly";
  if (durationDays === 365) return "Annual";

  return "Subscription";
}

function getPlanDescription(durationDays: number): string {
  if (durationDays === 30) {
    return "Flexible access for your daily practice.";
  }

  if (durationDays === 90) {
    return "Stay consistent with three months of preparation.";
  }

  if (durationDays === 365) {
    return "One full year of uninterrupted preparation.";
  }

  return "Unlimited Quiz Arena practice.";
}

export default function QuizArenaSubscriptionPlans({
  onSubscribed,
  onClose,
}: Props) {
  const [plans, setPlans] = useState<QuizArenaPlan[]>([]);

  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [unlimitedAccess, setUnlimitedAccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refreshSubscription = useCallback(async (): Promise<boolean> => {
    const response = await fetch("/api/quiz-arena/subscriptions", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });

    const data = (await response.json()) as SubscriptionResponse;

    if (!response.ok) {
      throw new Error(data.error || "Unable to load subscription status.");
    }

    setSubscription(data.subscription ?? null);

    setUnlimitedAccess(Boolean(data.unlimitedAccess));

    return Boolean(data.active || data.unlimitedAccess);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/quiz-arena/subscription-plans", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Unable to load subscription plans.");
        }

        const data = (await response.json()) as {
          plans?: QuizArenaPlan[];
        };

        if (cancelled) return;

        const validPlans = Array.isArray(data.plans)
          ? data.plans
              .filter((plan) => {
                const expected = ALLOWED_PLANS.find(
                  (item) => item.id === plan.id,
                );

                return (
                  Boolean(expected) &&
                  plan.active === true &&
                  plan.currency === "INR" &&
                  plan.price === expected?.price &&
                  plan.amountPaise === expected?.amountPaise &&
                  plan.durationDays === expected?.durationDays
                );
              })
              .sort((a, b) => a.durationDays - b.durationDays)
          : [];

        setPlans(validPlans);

        await refreshSubscription();
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Something went wrong.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [refreshSubscription]);

  async function reconcilePayments() {
    if (reconciling || processing) return;

    setReconciling(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/quiz-arena/subscription-payments/reconcile",
        {
          method: "POST",
          credentials: "same-origin",
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        recovered?: number;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to check payment status.");
      }

      const active = await refreshSubscription();

      if (active) {
        setMessage("Your Quiz Arena subscription is active.");

        onSubscribed?.();
      } else {
        setMessage(
          data.message || "No confirmed subscription payment was found.",
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Payment recovery failed.",
      );
    } finally {
      setReconciling(false);
    }
  }

  async function purchase(plan: QuizArenaPlan) {
    if (processing || reconciling) return;

    setProcessing(true);
    setProcessingPlanId(plan.id);

    setError("");
    setMessage("");

    try {
      await loadRazorpay();

      const response = await fetch(
        "/api/quiz-arena/subscription-payments/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            planId: plan.id,
          }),
        },
      );

      const order = (await response.json()) as OrderResponse;

      if (
        !response.ok ||
        !order.success ||
        !order.orderId ||
        !order.keyId ||
        order.amount !== plan.amountPaise ||
        order.currency !== "INR"
      ) {
        throw new Error(order.message || "Unable to create the payment order.");
      }

      const Razorpay = (window as RazorpayWindow).Razorpay;

      if (!Razorpay) {
        throw new Error("Razorpay checkout is unavailable.");
      }

      let checkoutCompleted = false;

      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SmartIQ Institute",
        description: `Quiz Arena — ${getPlanTitle(
          plan.durationDays,
        )} subscription`,
        order_id: order.orderId,
        theme: {
          color: "#1754EC",
        },
        modal: {
          ondismiss: () => {
            if (!checkoutCompleted) {
              setProcessing(false);
              setProcessingPlanId(null);
            }
          },
        },
        handler: async (paymentResponse) => {
          checkoutCompleted = true;

          try {
            setMessage("Verifying your payment...");

            const verifyResponse = await fetch(
              "/api/quiz-arena/subscription-payments/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify(paymentResponse),
              },
            );

            const verified = (await verifyResponse.json()) as VerifyResponse;

            if (!verifyResponse.ok || !verified.success) {
              throw new Error(
                verified.message || "Payment verification failed.",
              );
            }

            const active = await refreshSubscription();

            if (active) {
              setMessage(
                "Payment verified. Your Quiz Arena subscription is active!",
              );

              onSubscribed?.();
            } else {
              setMessage(
                "Payment confirmed. Please check your subscription status.",
              );
            }
          } catch (caught) {
            setMessage("");

            setError(
              caught instanceof Error
                ? caught.message
                : "Payment confirmation is pending. Use Check Payment Status.",
            );
          } finally {
            setProcessing(false);
            setProcessingPlanId(null);
          }
        },
      });

      checkout.on("payment.failed", () => {
        setError(
          "Payment failed or was cancelled. Subscription access has not been granted.",
        );

        setProcessing(false);
        setProcessingPlanId(null);
      });

      checkout.open();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to start checkout.",
      );

      setProcessing(false);
      setProcessingPlanId(null);
    }
  }

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
        Loading Quiz Arena subscription plans...
      </div>
    );
  }

  return (
    <section className="w-full text-left">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-blue-600">
            SmartIQ Institute
          </p>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            Choose Your Quiz Arena Plan
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            One subscription unlocks unlimited practice across every category,
            level and round. Choose the plan that suits your preparation.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        )}
      </div>

      {/* Active Subscription */}
      {(subscription || unlimitedAccess) && (
        <div
          role="status"
          className="mb-7 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
        >
          <p className="font-bold text-emerald-800">
            Quiz Arena access is active
          </p>

          {subscription && (
            <p className="mt-1 text-sm text-emerald-700">
              Valid until {formatDate(subscription.expiresAt)}
            </p>
          )}

          {unlimitedAccess && !subscription && (
            <p className="mt-1 text-sm text-emerald-700">
              Administrator access
            </p>
          )}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
        {plans.map((plan) => {
          const isQuarterly = plan.durationDays === 90;

          const isAnnual = plan.durationDays === 365;

          const title = getPlanTitle(plan.durationDays);

          const isCurrentProcessing = processingPlanId === plan.id;

          return (
            <article
              key={plan.id}
              className={`relative flex h-full flex-col rounded-[26px] border-2 px-5 pb-6 pt-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:px-7 ${
                isQuarterly
                  ? "border-blue-500 bg-gradient-to-b from-blue-50 to-white shadow-lg shadow-blue-100/70"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {/* Plan Badge */}
              {isQuarterly && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                  Most Popular
                </span>
              )}

              {isAnnual && (
                <span className="absolute -top-3 right-5 whitespace-nowrap rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                  Annual Access
                </span>
              )}

              {/* Title */}
              <div className="mb-5">
                <h3 className="text-xl font-extrabold text-slate-950">
                  {title}
                </h3>

                <p className="mt-2 min-h-[42px] text-sm leading-5 text-slate-500">
                  {getPlanDescription(plan.durationDays)}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight text-slate-950">
                    ₹{plan.price}
                  </span>

                  <span className="text-sm font-medium text-slate-500">
                    / {plan.durationDays} days
                  </span>
                </div>

                {isQuarterly && (
                  <p className="mt-2 text-xs font-bold text-blue-700">
                    Save ₹27 compared with monthly
                  </p>
                )}

                {isAnnual && (
                  <p className="mt-2 text-xs font-bold text-emerald-700">
                    Save ₹88 compared with monthly
                  </p>
                )}
              </div>

              <div className="mb-6 h-px bg-slate-200" />

              {/* Benefits */}
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Everything included
              </p>

              <ul className="mb-8 space-y-4 text-sm leading-6 text-slate-700">
                {[
                  "All Quiz Arena categories",
                  "All levels and rounds",
                  "Unlimited quiz practice",
                  "No automatic renewal",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                      ✓
                    </span>

                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe Button */}
              <button
                type="button"
                disabled={
                  processing ||
                  reconciling ||
                  unlimitedAccess ||
                  Boolean(subscription)
                }
                onClick={() => void purchase(plan)}
                className={`mt-auto w-full rounded-xl px-4 py-4 text-sm font-extrabold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isQuarterly
                    ? "bg-blue-600 hover:bg-blue-700"
                    : isAnnual
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {isCurrentProcessing
                  ? "Processing..."
                  : subscription || unlimitedAccess
                    ? "Access Active"
                    : `Subscribe for ₹${plan.price}`}
              </button>
            </article>
          );
        })}
      </div>

      {/* No Plans */}
      {plans.length === 0 && !error && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No Quiz Arena subscription plans are available.
        </p>
      )}

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

      {/* Message */}
      {message && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800"
        >
          {message}
        </p>
      )}
    </section>
  );
}
