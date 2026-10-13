"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type Kind = "expenses" | "daily-reports";
type Status = "submitted" | "approved" | "rejected";
type Decision = "approved" | "rejected";

type ApprovalItem = {
  id: string;
  title: string;
  details?: string;
  amount?: number | null;
  date?: string;
  branch?: string;
  ownerName?: string;
  ownerId?: string;
  status: Status;
  createdAt?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewReason?: string;
};

const endpoint = "/api/admin/staff-approvals";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export function AdminStaffApprovals() {
  const [kind, setKind] = useState<Kind>("expenses");
  const [status, setStatus] = useState<Status>("submitted");
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ kind, status });
      const response = await fetch(`${endpoint}?${params}`, {
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });

      const payload = (await response.json()) as {
        items?: ApprovalItem[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Could not load submissions.");
      }

      if (!signal?.aborted) {
        setItems(Array.isArray(payload.items) ? payload.items : []);
      }
    } catch (cause) {
      if (!signal?.aborted) {
        setItems([]);
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load submissions.",
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [kind, status]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  async function decide(item: ApprovalItem, decision: Decision) {
    const reason = (reasonById[item.id] || "").trim();

    if (decision === "rejected" && !reason) {
      setError("Enter a rejection reason before rejecting.");
      return;
    }

    const confirmed = window.confirm(
      `${decision === "approved" ? "Approve" : "Reject"} "${item.title}"?`,
    );

    if (!confirmed) return;

    setBusyId(item.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind,
          id: item.id,
          decision,
          reason,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Approval action failed.");
      }

      setNotice(
        `${item.title} ${decision === "approved" ? "approved" : "rejected"} successfully.`,
      );

      setReasonById((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });

      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Approval action failed.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const statuses: { id: Status; label: string }[] = [
    { id: "submitted", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <main className="space-y-5 text-slate-900">
      <header className="rounded-2xl bg-gradient-to-r from-[#091F47] to-[#1758AE] p-6 text-white">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Administration / Staff Operations
            </p>
            <h1 className="mt-1 text-2xl font-black">
              Staff Approvals
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-blue-100">
          Review staff expenses and daily branch reports.
          Every decision is protected by admin permissions and audited.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {([
              ["expenses", "Branch Expenses"],
              ["daily-reports", "Daily Branch Reports"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setKind(id);
                  setStatus("submitted");
                  setNotice("");
                }}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  kind === id
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || busyId !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {statuses.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setStatus(option.id);
                setNotice("");
              }}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                status === option.id
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">
            {statuses.find((item) => item.id === status)?.label} submissions
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {loading ? "Loading" : `${items.length} records`}
          </span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Loading submissions...
          </p>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <Clock3 className="mx-auto text-slate-400" size={30} />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No {status === "submitted" ? "pending" : status} records found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Staff: {item.ownerName || "Unknown"}
                      {" · "}Branch: {item.branch || "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Record date: {item.date || item.createdAt?.slice(0, 10) || "Not provided"}
                    </p>
                  </div>

                  <div className="text-right">
                    {kind === "expenses" && (
                      <p className="text-xl font-black text-slate-900">
                        {money(item.amount ?? 0)}
                      </p>
                    )}
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      item.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {item.details && (
                  <p className="mt-4 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-slate-700">
                    {item.details}
                  </p>
                )}

                {status === "submitted" ? (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      Decision reason
                      <textarea
                        maxLength={1000}
                        rows={2}
                        value={reasonById[item.id] || ""}
                        onChange={(event) =>
                          setReasonById((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Required for rejection; optional for approval"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => void decide(item, "approved")}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => void decide(item, "rejected")}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
                    <p>Reviewed by: {item.reviewedByName || "Unknown"}</p>
                    <p>Reviewed at: {item.reviewedAt || "Not available"}</p>
                    {item.reviewReason && (
                      <p className="mt-1">Reason: {item.reviewReason}</p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}