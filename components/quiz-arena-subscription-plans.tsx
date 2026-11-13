"use client";

import { useCallback, useEffect, useState } from "react";

type Plan = {
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
  examScopeKey?: string | null;
};

type SubscriptionResponse = {
  success?: boolean;
  active?: boolean;
  unlimitedAccess?: boolean;
  subscription?: Subscription | null;
  selectedExam?: {
    active: boolean;
    examScopeKey: string;
    examTitle: string;
    expiresAt: string | null;
    accessType: string;
  } | null;
  error?: string;
};

type OrderResponse = {
  success?: boolean;
  message?: string;
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  examScopeKey?: string;
};

type VerifyResponse = {
  success?: boolean;
  message?: string;
  examScopeKey?: string;
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
  theme: { color: string };
  modal: { ondismiss: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
};

type Props = {
  examScopeKey?: string | null;
  examTitle?: string | null;
  onSubscribed?: () => void;
  onClose?: () => void;
};

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const MONTHLY_PLAN_ID = "quiz-arena-30-days";

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = window as RazorpayWindow;
    if (win.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Razorpay checkout failed to load.")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Razorpay checkout failed to load."));
    document.body.appendChild(script);
  });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export default function QuizArenaSubscriptionPlans({
  examScopeKey,
  examTitle,
  onSubscribed,
  onClose,
}: Props) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedExam, setSelectedExam] =
    useState<SubscriptionResponse["selectedExam"]>(null);
  const [adminAccess, setAdminAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // The parent Quiz Arena selection screen must pass the EXACT canonical scope.
  const validSelection =
    typeof examScopeKey === "string" && examScopeKey.length > 0;

  const refreshSubscription = useCallback(async (): Promise<boolean> => {
    if (!examScopeKey) {
      setSelectedExam(null);
      setAdminAccess(false);
      return false;
    }
    const response = await fetch(
      `/api/quiz-arena/subscriptions?examScopeKey=${encodeURIComponent(examScopeKey)}`,
      { method: "GET", cache: "no-store", credentials: "same-origin" },
    );
    const data = (await response.json()) as SubscriptionResponse;
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to check this exam subscription.");
    }
    // Never interpret the overview 'active' flag as access to this exam.
    const exactExam =
      data.selectedExam?.examScopeKey === examScopeKey
        ? data.selectedExam
        : null;
    setSelectedExam(exactExam);
    setAdminAccess(Boolean(data.unlimitedAccess));
    return Boolean(exactExam?.active || data.unlimitedAccess);
  }, [examScopeKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPlan(null);
    setSelectedExam(null);
    setAdminAccess(false);
    async function load() {
      try {
        const response = await fetch("/api/quiz-arena/subscription-plans", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await response.json()) as {
          plans?: Plan[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(data.error || "Unable to load monthly plan.");
        const valid =
          data.plans?.find(
            (item) =>
              item.id === MONTHLY_PLAN_ID &&
              item.active === true &&
              item.price === 49 &&
              item.amountPaise === 4900 &&
              item.currency === "INR" &&
              item.durationDays === 30,
          ) ?? null;
        if (cancelled) return;
        setPlan(valid);
        if (examScopeKey) await refreshSubscription();
      } catch (caught) {
        if (!cancelled)
          setError(
            caught instanceof Error ? caught.message : "Unable to load plans.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [examScopeKey, refreshSubscription]);

  async function reconcilePayments() {
    if (processing || reconciling || !examScopeKey) return;
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
      };
      if (!response.ok || !data.success)
        throw new Error(data.message || "Payment check failed.");
      const active = await refreshSubscription();
      setMessage(
        active
          ? "Subscription for the selected exam is active."
          : data.message || "No confirmed payment found for this exam.",
      );
      if (active) onSubscribed?.();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Payment check failed.",
      );
    } finally {
      setReconciling(false);
    }
  }

  async function purchase() {
    if (
      !validSelection ||
      !plan ||
      processing ||
      reconciling ||
      selectedExam?.active ||
      adminAccess
    )
      return;
    setProcessing(true);
    setError("");
    setMessage("");
    try {
      await loadRazorpay();
      const response = await fetch(
        "/api/quiz-arena/subscription-payments/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ planId: plan.id, examScopeKey }),
        },
      );
      const order = (await response.json()) as OrderResponse;
      if (
        !response.ok ||
        !order.success ||
        !order.orderId ||
        !order.keyId ||
        order.amount !== 4900 ||
        order.currency !== "INR" ||
        order.examScopeKey !== examScopeKey
      ) {
        throw new Error(
          order.message || "Unable to create the selected exam payment order.",
        );
      }
      const Razorpay = (window as RazorpayWindow).Razorpay;
      if (!Razorpay) throw new Error("Razorpay checkout is unavailable.");
      let completed = false;
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SmartIQ Institute",
        description: `${examTitle || selectedExam?.examTitle || "Selected exam"} — 30 days`,
        order_id: order.orderId,
        theme: { color: "#1754EC" },
        modal: {
          ondismiss: () => {
            if (!completed) setProcessing(false);
          },
        },
        handler: async (paymentResponse) => {
          completed = true;
          try {
            setMessage("Verifying your payment...");
            const verifyResponse = await fetch(
              "/api/quiz-arena/subscription-payments/verify",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(paymentResponse),
              },
            );
            const verified = (await verifyResponse.json()) as VerifyResponse;
            if (
              !verifyResponse.ok ||
              !verified.success ||
              verified.examScopeKey !== examScopeKey
            ) {
              throw new Error(
                verified.message || "Exam payment verification is pending.",
              );
            }
            const active = await refreshSubscription();
            if (active) {
              setMessage(
                "Payment verified. Your selected exam is now unlocked!",
              );
              onSubscribed?.();
            } else {
              setMessage(
                "Payment confirmed. Please check your exam subscription status.",
              );
            }
          } catch (caught) {
            setMessage("");
            setError(
              caught instanceof Error
                ? caught.message
                : "Payment confirmation pending. Check payment status.",
            );
          } finally {
            setProcessing(false);
          }
        },
      });
      checkout.on("payment.failed", () => {
        setError(
          "Payment failed or was cancelled. No new exam access was granted.",
        );
        setProcessing(false);
      });
      checkout.open();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to start checkout.",
      );
      setProcessing(false);
    }
  }

  const active = Boolean(selectedExam?.active || adminAccess);
  const displayTitle = selectedExam?.examTitle || examTitle || "Selected exam";

  return (
    <section className="w-full rounded-2xl bg-white p-5 text-left sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
            SmartIQ Institute
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Quiz Arena — Monthly Exam Access
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            ₹49 for 30 days of practice in one selected exam. No automatic
            renewal.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700"
          >
            Close
          </button>
        )}
      </div>

      {!validSelection && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Select an individual exam and, for school programmes, its class and
          board before purchasing.
        </p>
      )}

      {validSelection && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            Selected exam
          </p>
          <p className="mt-1 text-lg font-bold text-slate-950">
            {displayTitle}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Only this exam is included in the subscription.
          </p>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-600">
          Loading subscription status...
        </p>
      ) : (
        <div className="rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-950">
            Monthly — Per Exam
          </h3>
          <p className="mt-3 text-4xl font-black text-slate-950">
            ₹49{" "}
            <span className="text-base font-medium text-slate-500">
              / 30 days
            </span>
          </p>
          <p className="mt-3 text-sm text-slate-600">
            All quiz levels and rounds for the selected exam during its paid
            validity.
          </p>
          {active && (
            <p
              role="status"
              className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
            >
              {adminAccess
                ? "Administrator access"
                : `This exam is active until ${formatDate(selectedExam?.expiresAt)}`}
            </p>
          )}
          {!plan && (
            <p className="mt-5 text-sm text-amber-800">
              The monthly subscription plan is not currently available.
            </p>
          )}
          <button
            type="button"
            disabled={
              !plan || !validSelection || active || processing || reconciling
            }
            onClick={() => void purchase()}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {active
              ? "Exam access active"
              : processing
                ? "Processing..."
                : "Subscribe for ₹49"}
          </button>
          <button
            type="button"
            disabled={!validSelection || processing || reconciling}
            onClick={() => void reconcilePayments()}
            className="mt-3 w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {reconciling ? "Checking payments..." : "Check payment status"}
          </button>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800"
        >
          {message}
        </p>
      )}
    </section>
  );
}
