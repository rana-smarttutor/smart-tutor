"use client";

import { useEffect, useState } from "react";
import type { PasswordResetRequest } from "@/lib/types";

export function PasswordResetRequestManager() {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/admin/password-reset-requests");
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
    } catch {
      console.error("Failed to fetch password reset requests.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    id: string,
    status: PasswordResetRequest["status"],
  ) {
    const note =
      status === "contacted"
        ? "Admin has been notified. Will reach out shortly."
        : status === "resolved"
          ? "Password has been reset."
          : "";

    try {
      await fetch("/api/admin/password-reset-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNote: note }),
      });
      fetchRequests();
    } catch {
      console.error("Failed to update request.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
        <div className="mb-4 h-6 w-44 animate-pulse rounded-lg bg-[var(--color-border)]" />
        <div className="mb-3 h-14 animate-pulse rounded-xl bg-[var(--color-border)]" />
        <div className="h-14 animate-pulse rounded-xl bg-[var(--color-border)]" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="surface flex items-center justify-between rounded-[1.5rem] px-6 py-5">
        <div>
          <p className="section-label">Admin Tool</p>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-heading)]">
            Password Reset Requests
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Review and respond to password reset requests from users.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
          {requests.length} Total
        </span>
      </header>

      {requests.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-10 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            No password reset requests yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="surface rounded-[1.5rem] border border-[var(--color-border)] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--color-heading)]">
                      {req.name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        req.status === "new"
                          ? "bg-yellow-50 text-yellow-700"
                          : req.status === "contacted"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-green-50 text-green-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Email
                      </span>
                      <p className="text-[var(--color-heading)]">{req.email}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Phone
                      </span>
                      <p className="text-[var(--color-heading)]">{req.phone}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Role
                      </span>
                      <p className="text-[var(--color-heading)] capitalize">
                        {req.role}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Submitted
                      </span>
                      <p className="text-[var(--color-heading)]">
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                      Last Password Given
                    </span>
                    <p className="font-mono text-sm text-[var(--color-heading)]">
                      {req.lastPassword}
                    </p>
                  </div>

                  {req.adminNote && (
                    <div className="rounded-lg bg-indigo-50 px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Admin Note
                      </span>
                      <p className="text-sm text-indigo-800">{req.adminNote}</p>
                    </div>
                  )}
                </div>

                {req.status === "new" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(req.id, "contacted")}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                    >
                      Mark Contacted
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(req.id, "resolved")}
                      className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100"
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}

                {req.status === "contacted" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(req.id, "resolved")}
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
