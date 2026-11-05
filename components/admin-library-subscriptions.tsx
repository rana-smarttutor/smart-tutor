"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

type Plan = {
  planId: string;
  name: string;
  pricePaise: number;
  currency: string;
  durationMonths: number;
  isActive: boolean;
};

type Subscription = {
  id: string;
  studentId: string;
  planId: string;
  status: string;
  startDate: string;
  expiryDate: string;
  paymentId: string;
  createdAt: string;
};

type Payment = {
  id: string;
  studentId: string;
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
  verifiedAt: string | null;
};

type Summary = {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  revokedSubscriptions: number;
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  revenuePaise: number;
  revenueRupees: number;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  summary?: Summary;
  plans?: Plan[];
  subscriptions?: Subscription[];
  payments?: Payment[];
  pagination?: {
    subscriptionsLimit: number;
    paymentsLimit: number;
  };
  generatedAt?: string;
};

type Tab = "subscriptions" | "payments";

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "expired":
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";

    case "revoked":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

function Status({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyle(value)}`}
    >
      {value}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {title}
        </p>

        <div className={`rounded-xl p-2.5 ${tone}`}>
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 break-words text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function AdminLibrarySubscriptions() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("subscriptions");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = useCallback(async (signal?: AbortSignal, manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await fetch("/api/digital-library/admin/subscriptions", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message || "Unable to load subscription management.",
        );
      }

      if (
        !payload.summary ||
        !Array.isArray(payload.plans) ||
        !Array.isArray(payload.subscriptions) ||
        !Array.isArray(payload.payments)
      ) {
        throw new Error("Incomplete subscription dashboard response.");
      }

      if (!signal?.aborted) {
        setData(payload);
      }
    } catch (err) {
      if (signal?.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load subscription data.",
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

  const planNames = useMemo(() => {
    return new Map((data?.plans || []).map((plan) => [plan.planId, plan.name]));
  }, [data?.plans]);

  const subscriptions = useMemo(() => {
    const search = query.trim().toLowerCase();

    return (data?.subscriptions || []).filter((item) => {
      const matchesSearch =
        !search ||
        [
          item.studentId,
          item.planId,
          planNames.get(item.planId),
          item.paymentId,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data?.subscriptions, query, statusFilter, planNames]);

  const payments = useMemo(() => {
    const search = query.trim().toLowerCase();

    return (data?.payments || []).filter((item) => {
      const matchesSearch =
        !search ||
        [
          item.studentId,
          item.planId,
          planNames.get(item.planId),
          item.razorpayOrderId,
          item.razorpayPaymentId,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus =
        statusFilter === "all" || item.paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data?.payments, query, statusFilter, planNames]);

  const summary = data?.summary;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-[#0A193A] via-[#0B40A1] to-[#2563EB] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
              SmartIQ Institute
            </p>

            <h1 className="mt-2 text-2xl font-black sm:text-3xl">
              Library Subscription Management
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              Monitor plans, student subscriptions and verified payment records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData(undefined, true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-bold text-white hover:bg-white/25 disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={20} className="shrink-0" />

          <div className="flex-1">
            <p className="font-bold">Unable to load dashboard</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <RefreshCw size={28} className="animate-spin text-blue-600" />
        </div>
      )}

      {!loading && summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active Subscriptions"
              value={summary.activeSubscriptions}
              icon={CheckCircle2}
              tone="bg-emerald-50 text-emerald-700"
            />

            <StatCard
              title="Expired Subscriptions"
              value={summary.expiredSubscriptions}
              icon={CalendarDays}
              tone="bg-amber-50 text-amber-700"
            />

            <StatCard
              title="Successful Payments"
              value={summary.successfulPayments}
              icon={CreditCard}
              tone="bg-blue-50 text-blue-700"
            />

            <StatCard
              title="Recorded Revenue"
              value={money(summary.revenuePaise)}
              icon={IndianRupee}
              tone="bg-violet-50 text-violet-700"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">
                Total Subscription Records
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {summary.totalSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">
                Pending Payments
              </p>
              <p className="mt-2 text-2xl font-black text-amber-600">
                {summary.pendingPayments}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">
                Failed Payments
              </p>
              <p className="mt-2 text-2xl font-black text-red-600">
                {summary.failedPayments}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Subscription Plans
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Plan prices and durations currently saved in MongoDB.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {(data?.plans || []).map((plan) => (
                <div
                  key={plan.planId}
                  className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{plan.name}</h3>

                    <Status value={plan.isActive ? "active" : "inactive"} />
                  </div>

                  <p className="mt-4 text-3xl font-black text-[#0B40A1]">
                    {money(plan.pricePaise)}
                  </p>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {plan.durationMonths === 1
                      ? "1 month"
                      : `${plan.durationMonths} months`}{" "}
                    of access
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <h2 className="text-lg font-black text-slate-900">
                Subscription Records & Payments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search and review recent database records. Only the latest 100
                records of each type are loaded.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab("subscriptions");
                    setStatusFilter("all");
                    setQuery("");
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
                    tab === "subscriptions"
                      ? "bg-[#0B40A1] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Subscriptions
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab("payments");
                    setStatusFilter("all");
                    setQuery("");
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
                    tab === "payments"
                      ? "bg-[#0B40A1] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Payments
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
                  <Search size={18} className="shrink-0 text-slate-400" />

                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search student ID, plan or payment..."
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter record status"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <option value="all">All statuses</option>

                  {tab === "subscriptions" ? (
                    <>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="revoked">Revoked</option>
                    </>
                  ) : (
                    <>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {tab === "subscriptions" ? (
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Student ID</th>
                      <th className="px-5 py-4">Plan</th>
                      <th className="px-5 py-4">Start</th>
                      <th className="px-5 py-4">Expiry</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {subscriptions.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {item.studentId}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {planNames.get(item.planId) || item.planId}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(item.startDate)}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(item.expiryDate)}
                        </td>

                        <td className="px-5 py-4">
                          <Status value={item.status} />
                        </td>
                      </tr>
                    ))}

                    {subscriptions.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-slate-500"
                        >
                          No matching subscription records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[840px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Student ID</th>
                      <th className="px-5 py-4">Plan</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {payments.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {item.studentId}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {planNames.get(item.planId) || item.planId}
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-900">
                          {money(item.amountPaise)}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <Status value={item.paymentStatus} />
                        </td>
                      </tr>
                    ))}

                    {payments.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-slate-500"
                        >
                          No matching payment records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
              Showing{" "}
              {tab === "subscriptions" ? subscriptions.length : payments.length}{" "}
              records from the latest 100 retrieved.
              {data?.generatedAt
                ? ` Updated ${formatDate(data.generatedAt)}.`
                : ""}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
