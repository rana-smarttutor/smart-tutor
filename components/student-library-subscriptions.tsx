"use client";

import LibrarySubscriptionPlans from "./library-subscription-plans";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Plan = {
  planId: string;
  name: string;
  pricePaise: number;
  currency: string;
  durationMonths: number;
  isActive: boolean;
};

type CurrentSubscription = {
  id: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string | null;
  expiryDate: string | null;
  daysRemaining: number;
  isActive: boolean;
};

type PaymentRecord = {
  id: string;
  planId: string;
  planName: string;
  amountPaise: number;
  currency: string;
  status: string;
  razorpayPaymentId: string | null;
  createdAt: string | null;
};

type DashboardResponse = {
  success: boolean;
  message?: string;
  student?: {
    name: string;
  };
  currentSubscription?: CurrentSubscription | null;
  plans?: Plan[];
  paymentHistory?: PaymentRecord[];
  paymentsConfigured?: boolean;
  generatedAt?: string;
};

function formatMoney(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "expired":
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClass(status)}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={17} />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>

      <p className="mt-3 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

export default function StudentLibrarySubscriptions() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (signal?: AbortSignal, manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        "/api/digital-library/student/subscription-dashboard",
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal,
        },
      );

      const payload = (await response.json()) as DashboardResponse;

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message || "Unable to load your library subscription.",
        );
      }

      if (
        !Array.isArray(payload.plans) ||
        !Array.isArray(payload.paymentHistory)
      ) {
        throw new Error("Incomplete subscription information received.");
      }

      if (!signal?.aborted) {
        setData(payload);
      }
    } catch (err) {
      if (signal?.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load subscription details.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadData(controller.signal);

    return () => controller.abort();
  }, [loadData]);

  const current = data?.currentSubscription ?? null;
  const isActive = Boolean(current?.isActive);

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A193A] via-[#0B40A1] to-[#2563EB] p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-blue-100">
              <BookOpen size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">
                SmartIQ Digital Library
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-black sm:text-3xl">
              My Library Subscription
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              Review your library plan, subscription validity, available plans
              and payment history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData(undefined, true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/25 disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <p className="font-bold">Unable to load your subscription</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <RefreshCw size={28} className="animate-spin text-[#0B40A1]" />
        </div>
      ) : null}

      {!loading && data && !error ? (
        <>
          <div
            className={`rounded-3xl border p-6 sm:p-8 ${
              isActive
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Current Subscription
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  {current ? current.planName : "No subscription yet"}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  {isActive
                    ? "Your subscription is currently active."
                    : current
                      ? "You do not currently have an active library subscription."
                      : "Choose a library plan when subscriptions become available."}
                </p>
              </div>

              <StatusBadge status={current?.status ?? "not_subscribed"} />
            </div>

            {isActive && current ? (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 px-5 py-4">
                  <p className="text-xs font-bold text-emerald-700">
                    Days remaining
                  </p>
                  <p className="mt-1 text-3xl font-black text-emerald-800">
                    {current.daysRemaining}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={18} />
                  Active subscription record
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <LockKeyhole size={20} className="shrink-0 text-slate-500" />

                <p className="text-sm leading-6 text-slate-600">
                  Premium book access requires an active subscription. The
                  library remains under its existing access restrictions while
                  system testing continues.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InfoCard
              label="Activation Date"
              value={formatDate(current?.startDate)}
              icon={CalendarDays}
            />

            <InfoCard
              label="Expiry Date"
              value={formatDate(current?.expiryDate)}
              icon={Clock3}
            />

            <InfoCard
              label="Subscription Status"
              value={
                current ? current.status.replace(/_/g, " ") : "Not subscribed"
              }
              icon={ShieldCheck}
            />
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
            <strong>Razorpay Test Mode</strong>
            <p className="mt-1">
              Payments below are simulated test payments.
              No real money will be charged.
            </p>
          </div>

          <LibrarySubscriptionPlans isLoggedIn />
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <CreditCard size={22} className="text-[#0B40A1]" />

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Payment History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your recent Digital Library payment records.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Plan</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(data.paymentHistory || []).map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(payment.createdAt)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {payment.planName}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatMoney(payment.amountPaise)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))}

                  {!data.paymentHistory?.length ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No library payment records yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
