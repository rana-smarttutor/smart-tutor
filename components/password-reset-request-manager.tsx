"use client";

import { useEffect, useState, useCallback } from "react";
import type { PasswordResetRequest } from "@/lib/types";

type Props = {
  onNavigateToSection?: (section: string) => void;
};

export function PasswordResetRequestManager({
  onNavigateToSection,
}: Props) {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function reqKey(req: PasswordResetRequest, index: number): string {
    return req.id || `fallback-${index}`;
  }
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<{
    id: string;
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete(id: string) {
    if (!id) return;
    if (!window.confirm("Delete this password reset request?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/password-reset-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id && r.id !== id));
      }
    } catch {
      console.error("Failed to delete request.");
    } finally {
      setDeletingId(null);
    }
  }

  const handleResetPassword = useCallback(
    async (req: PasswordResetRequest, key: string) => {
      const password = newPasswords[key]?.trim();
      if (!password || password.length < 8) {
        setResetMessage({
          id: key,
          type: "error",
          text: "Password must be at least 8 characters.",
        });
        return;
      }

      setResettingId(key);
      setResetMessage(null);

      try {
        const res = await fetch("/api/admin/password-reset-requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: req.id || key,
            status: "resolved",
            newPassword: password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setResetMessage({
            id: key,
            type: "error",
            text: data.error || "Failed to reset password.",
          });
          return;
        }

        setResetMessage({
          id: key,
          type: "success",
          text: "Password reset successfully. Copy the email template below to send to the user.",
        });
        setNewPasswords((prev) => ({ ...prev, [key]: "" }));
        fetchRequests();
      } catch {
        setResetMessage({
          id: key,
          type: "error",
          text: "Network error. Please try again.",
        });
      } finally {
        setResettingId(null);
      }
    },
    [newPasswords],
  );

  function generateEmailTemplate(
    req: PasswordResetRequest,
    password: string,
  ): string {
    return `Subject: Your Smart Tutors Account - Password Reset

Dear ${req.name},

Your password has been reset as requested. Please find your new login credentials below:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ACCOUNT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Name:      ${req.name}
  Email:     ${req.email}
  Role:      ${req.role.charAt(0).toUpperCase() + req.role.slice(1)}
  New Password: ${password}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For security reasons, we recommend you change your password after your first login.

If you did not request this password reset, please contact our support team immediately.

 Regards,
  Smart Tutors Team
  Vashi, Navi Mumbai`;
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
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
            Set a new password and send login details to the user.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
          {requests.filter((r) => r.status === "new").length} Pending
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
          {requests.map((req, index) => {
            const key = reqKey(req, index);
            const isExpanded = expandedId === key;
            const password = newPasswords[key] || "";
            const emailTemplate =
              password.length >= 8 ? generateEmailTemplate(req, password) : "";
            const isResetting = resettingId === key;
            const isDeleting = deletingId === key;
            const msg = resetMessage?.id === key ? resetMessage : null;

            return (
              <div
                key={key}
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
                        <p className="text-[var(--color-heading)]">
                          {req.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Phone
                        </span>
                        <p className="text-[var(--color-heading)]">
                          {req.phone}
                        </p>
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

                    {req.lastPassword && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          Last Password Given
                        </span>
                        <p className="font-mono text-sm text-[var(--color-heading)]">
                          {req.lastPassword}
                        </p>
                      </div>
                    )}

                    {req.adminNote && (
                      <div className="rounded-lg bg-indigo-50 px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Admin Note
                        </span>
                        <p className="text-sm text-indigo-800">
                          {req.adminNote}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {onNavigateToSection && (
                      <button
                        type="button"
                        onClick={() => onNavigateToSection("accounts")}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-xs font-bold text-[var(--color-heading)] transition hover:opacity-80"
                        title="View in Accounts"
                      >
                        <i className="bi bi-person mr-1" />
                        View Profile
                      </button>
                    )}

                    {req.status === "new" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(req.id || key, "contacted")}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          <i className="bi bi-phone mr-1" />
                          Contacted
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : key)
                          }
                          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
                        >
                          <i className="bi bi-shield-lock mr-1" />
                          {isExpanded ? "Close" : "Reset"}
                        </button>
                      </>
                    )}

                    {req.status === "contacted" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(req.id || key, "resolved")}
                          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100"
                        >
                          <i className="bi bi-check-circle mr-1" />
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : key)
                          }
                          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
                        >
                          <i className="bi bi-shield-lock mr-1" />
                          {isExpanded ? "Close" : "Reset"}
                        </button>
                      </>
                    )}

                    {req.status === "resolved" && (
                      <span className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                        <i className="bi bi-check-circle-fill mr-1" />
                        Closed
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(req.id || key)}
                      disabled={isDeleting}
                      className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-500 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                      title="Delete request"
                    >
                      <i className="bi bi-trash text-sm" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-5 space-y-4 rounded-xl border border-violet-200 bg-violet-50/50 p-5">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Set New Password for {req.name}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={password}
                          onChange={(e) =>
                            setNewPasswords((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder="Min. 8 characters"
                          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleResetPassword(req, key)}
                          disabled={isResetting || password.length < 8}
                          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
                        >
                          <i className="bi bi-shield-check" />
                          {isResetting ? "Resetting..." : "Reset & Notify"}
                        </button>
                      </div>
                    </div>

                    {msg && (
                      <div
                        className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                          msg.type === "success"
                            ? "border border-green-200 bg-green-50 text-green-700"
                            : "border border-red-200 bg-red-50 text-red-600"
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {emailTemplate && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            Email Template - Copy & Send
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(emailTemplate, key)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-50"
                          >
                            <i
                              className={`bi ${
                                copiedId === key
                                  ? "bi-check-circle-fill"
                                  : "bi-clipboard"
                              }`}
                            />
                            {copiedId === key ? "Copied!" : "Copy Template"}
                          </button>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-[var(--color-border)] bg-white p-4 font-mono text-xs leading-relaxed text-[var(--color-heading)]">
                          {emailTemplate}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
