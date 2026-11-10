"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CreditCard,
  IndianRupee,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react";

type Order = {
  orderId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  bookTitle: string;
  bookPathname: string;
  amountPaise: number;
  currency: string;
  status: string;
  verified: boolean;
  paymentId: string;
  createdAt: string | null;
  purchasedAt: string | null;
};

type Summary = {
  totalOrders: number;
  displayedOrders: number;
  verifiedPurchases: number;
  verifiedAmountPaise: number;
};

type Payload = {
  success: boolean;
  items?: Order[];
  summary?: Summary;
  limited?: boolean;
  paymentMode?: string;
  message?: string;
};

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);

function dateLabel(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusStyle(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-violet-50 text-violet-700 border-violet-200";
  }
}

const emptySummary: Summary = {
  totalOrders: 0,
  displayedOrders: 0,
  verifiedPurchases: 0,
  verifiedAmountPaise: 0,
};

export function AdminLibraryBookOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limited, setLimited] = useState(false);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/library-book-orders", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });

      const data = (await response.json()) as Payload;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load purchase orders.");
      }

      if (signal?.aborted) return;

      setOrders(data.items || []);
      setSummary(data.summary || emptySummary);
      setLimited(Boolean(data.limited));
    } catch (cause) {
      if (signal?.aborted) return;

      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load purchase orders.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadOrders(controller.signal);

    return () => controller.abort();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return [
        order.studentName,
        order.studentEmail,
        order.studentId,
        order.bookTitle,
        order.orderId,
        order.paymentId,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [orders, search, statusFilter]);

  const stats = [
    {
      label: "Total orders",
      value: summary.totalOrders.toLocaleString("en-IN"),
      icon: ShoppingBag,
    },
    {
      label: "Verified purchases",
      value: summary.verifiedPurchases.toLocaleString("en-IN"),
      icon: BookOpen,
    },
    {
      label: "Verified payment value",
      value: money(summary.verifiedAmountPaise),
      icon: IndianRupee,
    },
    {
      label: "Recent records",
      value: summary.displayedOrders.toLocaleString("en-IN"),
      icon: CreditCard,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#0A193A] to-[#0B40A1] p-6 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            Digital Library / Administration
          </p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            Book Purchase Orders
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            Track student purchases, Razorpay orders and verified book
            ownership.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0A193A] disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Razorpay per-book payments are currently configured in Test Mode.
        Verified payment values shown here are not live revenue.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{stat.label}</span>
                <Icon size={19} className="text-blue-700" />
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, book, order or payment..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="review_required">Review required</option>
          </select>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Showing {filteredOrders.length} of {orders.length} loaded orders
          {limited
            ? " (latest 250; older records are not included in search)"
            : ""}
          .
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-4">Student</th>
                <th className="px-4 py-4">Book</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Order / Payment</th>
                <th className="px-4 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-900">
                      {order.studentName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.studentEmail || order.studentId}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="max-w-[230px] font-semibold text-slate-900">
                      {order.bookTitle}
                    </p>
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900">
                    {money(order.amountPaise)}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyle(order.status)}`}
                    >
                      {order.status.replaceAll("_", " ")}
                    </span>
                    {order.verified ? (
                      <p className="mt-2 text-xs text-emerald-700">
                        Ownership verified
                      </p>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <p className="break-all font-mono text-xs text-slate-800">
                      {order.orderId}
                    </p>
                    <p className="mt-2 break-all font-mono text-xs text-slate-500">
                      {order.paymentId || "No payment ID"}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    <p>{dateLabel(order.createdAt)}</p>
                    {order.purchasedAt ? (
                      <p className="mt-2 text-emerald-700">
                        Paid: {dateLabel(order.purchasedAt)}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredOrders.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">
            {orders.length === 0
              ? "No book payment orders have been recorded yet."
              : "No orders match your search or filter."}
          </div>
        ) : null}

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Loading book purchase orders...
          </div>
        ) : null}
      </div>
    </section>
  );
}
