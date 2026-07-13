"use client";

import React, { useCallback, useEffect, useState } from "react";
import type {
  HolidayItem,
  LeaveBalanceItem,
  LeaveRequest,
  LeaveTypeItem,
  Role,
  SessionUser,
} from "@/lib/types";

type Props = {
  session: SessionUser | null;
  role: Role;
  managedUsers: { id: string; name: string; role: string; email: string }[];
};

type Tab = "requests" | "apply" | "types" | "holidays" | "balances";

function getStatusPill(status: string) {
  if (status === "approved") {
    return (
      <span
        className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
        style={{
          background: "#ECFDF5",
          color: "#065F46",
          border: "1px solid #A7F3D0",
        }}
      >
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span
        className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
        style={{
          background: "#FEF2F2",
          color: "#991B1B",
          border: "1px solid #FECACA",
        }}
      >
        Rejected
      </span>
    );
  }
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{
        background: "#FFFBEB",
        color: "#92400E",
        border: "1px solid #FDE68A",
      }}
    >
      Pending
    </span>
  );
}

const leaveCategories = [
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "earned", label: "Earned Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "medical", label: "Medical Leave" },
  { value: "study", label: "Study Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "other", label: "Other" },
];

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(from: string, to: string) {
  const f = new Date(from + "T00:00:00");
  const t = new Date(to + "T00:00:00");
  return Math.max(1, Math.round((t.getTime() - f.getTime()) / 86400000) + 1);
}

export function LeaveManager({ session, role, managedUsers }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    leaveTypeId: "",
    leaveTypeName: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  // New leave type form
  const [newType, setNewType] = useState({
    name: "",
    category: "",
    daysAllowed: 10,
    isPaid: true,
    color: "#4F46E5",
  });

  // New holiday form
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    type: "institute",
    color: "#EF4444",
  });

  // New balance form
  const [newBalance, setNewBalance] = useState({
    userId: "",
    userName: "",
    leaveTypeId: "",
    leaveTypeName: "",
    daysAllowed: 10,
    note: "",
  });

// Student apply-leave popup
const [showApplyForm, setShowApplyForm] = useState(false);

// Reject modal
const [rejectTarget, setRejectTarget] =
  useState<LeaveRequest | null>(null);

const [rejectReason, setRejectReason] = useState("");

const isAdmin = role === "admin";
const isStudent = role === "student";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leave", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRequests(data.requests || []);
      setLeaveTypes(data.leaveTypes || []);
      setHolidays(data.holidays || []);
    } catch {
      setError("Could not load leave data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await fetch("/api/leave/balances", {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setBalances(data.balances || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (activeTab === "balances") {
      void fetchBalances();
    }
  }, [activeTab, fetchBalances]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.leaveTypeId || !formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      alert("Please fill all required fields.");
      return;
    }
    const days = daysBetween(formData.fromDate, formData.toDate);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          leaveTypeId: formData.leaveTypeId,
          leaveTypeName: formData.leaveTypeName,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          reason: formData.reason.trim(),
          days,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to submit.");
        return;
      }
      setFormData({
        leaveTypeId: "",
        leaveTypeName: "",
        fromDate: "",
        toDate: "",
        reason: "",
      });
setShowApplyForm(false);
setActiveTab("requests");
void fetchAll();
    } catch {
      alert("Network error. Please try again.");
    }
  }

  async function handleStatusAction(id: string, status: "approved" | "rejected", rejectReasonStr = "") {
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          status,
          ...(status === "rejected" ? { rejectReason: rejectReasonStr } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update.");
        return;
      }
      void fetchAll();
    } catch {
      alert("Network error.");
    }
  }

  async function handleCreateType(e: React.FormEvent) {
    e.preventDefault();
    if (!newType.name || !newType.category) {
      alert("Name and category are required.");
      return;
    }
    try {
      const res = await fetch("/api/leave/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(newType),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create.");
        return;
      }
      setNewType({ name: "", category: "", daysAllowed: 10, isPaid: true, color: "#4F46E5" });
      void fetchAll();
    } catch {
      alert("Network error.");
    }
  }

  async function handleDeleteType(id: string) {
    if (!confirm("Delete this leave type?")) return;
    try {
      const res = await fetch(`/api/leave/types/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Delete failed on server.");
        return;
      }
      void fetchAll();
    } catch {
      alert("Network error during delete.");
    }
  }

  async function handleCreateHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) {
      alert("Name and date are required.");
      return;
    }
    try {
      const res = await fetch("/api/leave/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(newHoliday),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create.");
        return;
      }
      setNewHoliday({ name: "", date: "", type: "institute", color: "#EF4444" });
      void fetchAll();
    } catch {
      alert("Network error.");
    }
  }

  async function handleDeleteHoliday(id: string) {
    if (!confirm("Remove holiday?")) return;
    try {
      const res = await fetch(`/api/leave/holidays/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Delete failed on server.");
        return;
      }
      void fetchAll();
    } catch {
      alert("Network error during delete.");
    }
  }

  async function handleCreateBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!newBalance.userId || !newBalance.leaveTypeId || !newBalance.daysAllowed) {
      alert("User, leave type, and days are required.");
      return;
    }
    try {
      const res = await fetch("/api/leave/balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(newBalance),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create.");
        return;
      }
      setNewBalance({
        userId: "",
        userName: "",
        leaveTypeId: "",
        leaveTypeName: "",
        daysAllowed: 10,
        note: "",
      });
      void fetchBalances();
    } catch {
      alert("Network error.");
    }
  }

const pendingCount = requests.filter(
  (request) => request.status === "pending",
).length;

const approvedCount = requests.filter(
  (request) => request.status === "approved",
).length;

const rejectedCount = requests.filter(
  (request) => request.status === "rejected",
).length;
const stats = [
  {
    label: "Pending",
    count: pendingCount,
    color: "#F59E0B",
    bg: "#FFFBEB",
    iconPath:
      "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Approved",
    count: approvedCount,
    color: "#10B981",
    bg: "#ECFDF5",
    iconPath:
      "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Rejected",
    count: rejectedCount,
    color: "#EF4444",
    bg: "#FEF2F2",
    iconPath:
      "M6 18L18 6M6 6l12 12",
  },
];

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "requests", label: "Leave Requests", show: true },
    { id: "apply", label: "Apply Leave", show: !isStudent },
    { id: "types", label: "Leave Types", show: isAdmin },
    { id: "holidays", label: "Holidays", show: isAdmin },
    { id: "balances", label: "Balances", show: isAdmin },
  ];

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="section-label">HR</p>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-heading)]">
          Leave Management
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {isAdmin
            ? "Approve leave requests and manage leave configuration."
            : "Apply for leave and view your request history."}
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-4 shadow-sm"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: s.bg, color: s.color }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
  strokeLinecap="round"
  strokeLinejoin="round"
  strokeWidth={2}
  d={s.iconPath}
/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {s.label}
              </p>
              <p className="text-xl font-extrabold text-[var(--color-heading)]">
                {s.count}
              </p>
            </div>
          </div>
        ))}
      </div>

{/* Tabs — hidden for the merged student view */}
{!isStudent ? (
  <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-2">
    {tabs
      .filter((tab) => tab.show)
      .map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() =>
            setActiveTab(tab.id)
          }
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === tab.id
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-heading)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
  </div>
) : null}

      {error && (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── Requests Tab ── */}
{activeTab === "requests" && (
  <div className="surface overflow-hidden rounded-[2rem]">
    {/* Student merged-page header */}
    {isStudent ? (
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-[var(--color-heading)]">
            My Leave Requests
          </h3>

          <p className="mt-1 text-sm text-[var(--color-muted)]">
            View your leave history or submit a new request.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowApplyForm(true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Apply for Leave
        </button>
      </div>
    ) : null}

    {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg className="mb-4 h-12 w-12 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-[var(--color-muted)]">
                    No leave requests yet.
                  </p>
{!isStudent ? (
  <button
    type="button"
    onClick={() =>
      setActiveTab("apply")
    }
    className="mt-3 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
  >
    Apply for Leave
  </button>
) : null}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-background-strong)]">
                        <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Name</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Type</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Dates</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Days</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Reason</th>
                        <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Status</th>
                        {isAdmin && (
                          <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr
                          key={req.id}
                          className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-background-strong)]/50"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[var(--color-heading)]">
                              {req.userName}
                            </div>
                            <div className="text-[11px] text-[var(--color-muted)]">
                              {req.userRole === "admin"
                                ? "Institute Admin"
                                : req.userRole === "educator"
                                  ? "Educator"
                                  : "Student"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                              style={{
                                background: `${getLeaveTypeColor(req.leaveTypeId || "")}15`,
                                color: getLeaveTypeColor(req.leaveTypeId || ""),
                                border: `1px solid ${getLeaveTypeColor(req.leaveTypeId || "")}30`,
                              }}
                            >
                              {req.leaveTypeName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-muted)]">
                            {formatDate(req.fromDate)} – {formatDate(req.toDate)}
                          </td>
                          <td className="px-4 py-3 font-semibold">{req.days}d</td>
                          <td className="max-w-[180px] truncate px-4 py-3 text-[var(--color-muted)]">
                            {req.reason}
                          </td>
                          <td className="px-4 py-3">{getStatusPill(req.status)}</td>
                          {isAdmin && req.status === "pending" && (
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusAction(req.id, "approved")
                                  }
                                  className="rounded-lg bg-[#ECFDF5] px-3 py-1.5 text-[11px] font-bold text-[#065F46] transition-colors hover:bg-[#A7F3D0]"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectTarget(req);
                                    setRejectReason("");
                                  }}
                                  className="rounded-lg bg-[#FEF2F2] px-3 py-1.5 text-[11px] font-bold text-[#991B1B] transition-colors hover:bg-[#FECACA]"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          )}
                          {isAdmin && req.status !== "pending" && (
                            <td className="px-4 py-3 text-[11px] text-[var(--color-muted)]">
                              {req.approvedBy && `by ${req.approvedBy}`}
                              {req.rejectReason && (
                                <span title={req.rejectReason} className="ml-1 cursor-help">
                                  (reason)
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Apply Tab ── */}
          {activeTab === "apply" &&
!isStudent && (
            <div className="surface rounded-[2rem] p-6">
              <h3 className="mb-4 text-xl font-bold text-[var(--color-heading)]">
                Apply for Leave
              </h3>
              <form onSubmit={handleApply} className="max-w-xl space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                    Leave Type *
                  </label>
                  <select
                    value={formData.leaveTypeId}
                    onChange={(e) => {
                      const opt = e.target.selectedOptions[0];
                      setFormData({
                        ...formData,
                        leaveTypeId: e.target.value,
                        leaveTypeName: opt?.dataset?.name || "",
                      });
                    }}
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                  >
                    <option value="">Select type…</option>
                    {leaveTypes.map((lt) => (
                      <option
                        key={lt.id}
                        value={lt.id}
                        data-name={lt.name}
                      >
                        {lt.name} ({lt.daysAllowed}d/yr)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                      From Date *
                    </label>
                    <input
                      type="date"
                      value={formData.fromDate}
                      onChange={(e) =>
                        setFormData({ ...formData, fromDate: e.target.value })
                      }
                      min={today}
                      required
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                      To Date *
                    </label>
                    <input
                      type="date"
                      value={formData.toDate}
                      onChange={(e) =>
                        setFormData({ ...formData, toDate: e.target.value })
                      }
                      min={formData.fromDate || today}
                      required
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>
                {formData.fromDate && formData.toDate && (
                  <p className="text-sm text-[var(--color-muted)]">
                    Total: <strong>{daysBetween(formData.fromDate, formData.toDate)} day(s)</strong>
                  </p>
                )}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                    Reason *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    rows={3}
                    required
                    placeholder="Reason for leave…"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Submit Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("requests")}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-2.5 text-sm font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Leave Types Tab (Admin) ── */}
          {activeTab === "types" && isAdmin && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Existing types */}
              <div className="surface rounded-[2rem] p-6">
                <h3 className="mb-4 text-xl font-bold text-[var(--color-heading)]">
                  Leave Types
                </h3>
                {leaveTypes.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    No leave types configured.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaveTypes.map((lt) => (
                      <div
                        key={lt.id}
                        className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-3"
                      >
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ background: lt.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-[var(--color-heading)]">
                            {lt.name}
                          </span>
                          <span className="ml-2 text-xs text-[var(--color-muted)]">
                            {lt.daysAllowed}d
                          </span>
                          <span
                            className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              lt.isPaid
                                ? "bg-[#ECFDF5] text-[#065F46]"
                                : "bg-[#F1F5F9] text-[#64748B]"
                            }`}
                          >
                            {lt.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteType(lt.id)}
                          className="shrink-0 rounded-lg p-1.5 text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new type */}
              <div className="surface rounded-[2rem] p-6">
                <h3 className="mb-4 text-xl font-bold text-[var(--color-heading)]">
                  Add Leave Type
                </h3>
                <form onSubmit={handleCreateType} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                      Category *
                    </label>
                    <select
                      value={newType.category}
                      onChange={(e) => {
                        const opt = e.target.selectedOptions[0];
                        setNewType({
                          ...newType,
                          category: e.target.value,
                          name: opt?.dataset?.name || newType.name,
                        });
                      }}
                      required
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">— Select category —</option>
                      {leaveCategories.map((c) => (
                        <option key={c.value} value={c.value} data-name={c.label}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={newType.name}
                      onChange={(e) =>
                        setNewType({ ...newType, name: e.target.value })
                      }
                      required
                      placeholder="e.g. Sick Leave"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                        Days
                      </label>
                      <input
                        type="number"
                        value={newType.daysAllowed}
                        onChange={(e) =>
                          setNewType({
                            ...newType,
                            daysAllowed: Number(e.target.value),
                          })
                        }
                        min={1}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                        Type
                      </label>
                      <select
                        value={newType.isPaid ? "paid" : "unpaid"}
                        onChange={(e) =>
                          setNewType({
                            ...newType,
                            isPaid: e.target.value === "paid",
                          })
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                        Color
                      </label>
                      <input
                        type="color"
                        value={newType.color}
                        onChange={(e) =>
                          setNewType({ ...newType, color: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-1"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Create Leave Type
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Holidays Tab (Admin) ── */}
          {activeTab === "holidays" && isAdmin && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="surface rounded-[2rem] p-6">
                <h3 className="mb-4 text-xl font-bold text-[var(--color-heading)]">
                  Holiday Calendar
                </h3>
                {holidays.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    No holidays configured.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {holidays.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-3"
                      >
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ background: h.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[var(--color-heading)]">
                            {h.name}
                          </div>
                          <div className="text-[11px] text-[var(--color-muted)]">
                            {formatDate(h.date)} · {h.type}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="shrink-0 rounded-lg p-1.5 text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
                          title="Remove"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="surface rounded-[2rem] p-6">
                <h3 className="mb-4 text-xl font-bold text-[var(--color-heading)]">
                  Add Holiday
                </h3>
                <form onSubmit={handleCreateHoliday} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                      Holiday Name *
                    </label>
                    <input
                      type="text"
                      value={newHoliday.name}
                      onChange={(e) =>
                        setNewHoliday({ ...newHoliday, name: e.target.value })
                      }
                      required
                      placeholder="e.g. Diwali"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={newHoliday.date}
                        onChange={(e) =>
                          setNewHoliday({ ...newHoliday, date: e.target.value })
                        }
                        required
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                        Type
                      </label>
                      <select
                        value={newHoliday.type}
                        onChange={(e) =>
                          setNewHoliday({ ...newHoliday, type: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      >
                        <option value="institute">Institute</option>
                        <option value="national">National</option>
                        <option value="religious">Religious</option>
                        <option value="local">Local</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                      Color
                    </label>
                    <input
                      type="color"
                      value={newHoliday.color}
                      onChange={(e) =>
                        setNewHoliday({ ...newHoliday, color: e.target.value })
                      }
                      className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-1"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Add Holiday
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Balances Tab (Admin) ── */}
          {activeTab === "balances" && isAdmin && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="surface rounded-[2rem] p-6">
                <h3 className="mb-4 text-xl font-bold text-[var(--color-heading)]">
                  Leave Balances
                </h3>
                {balances.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    No balances configured.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {balances.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[var(--color-heading)]">
                            {b.userName || b.userId}
                          </div>
                          <div className="text-[11px] text-[var(--color-muted)]">
                            {b.leaveTypeName} · {b.daysUsed}/{b.daysAllowed}d used
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            b.daysUsed >= b.daysAllowed
                              ? "bg-[#FEF2F2] text-[#991B1B]"
                              : "bg-[#ECFDF5] text-[#065F46]"
                          }`}
                        >
                          {b.daysAllowed - b.daysUsed}d left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="surface rounded-[2rem] p-6">
                <h3 className="mb-4 text-xl font-bold text-[var(--color-heading)]">
                  Grant / Adjust Balance
                </h3>
                <form onSubmit={handleCreateBalance} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                      Employee *
                    </label>
                    <select
                      value={newBalance.userId}
                      onChange={(e) => {
                        const opt = e.target.selectedOptions[0];
                        setNewBalance({
                          ...newBalance,
                          userId: e.target.value,
                          userName: opt?.dataset?.name || "",
                        });
                      }}
                      required
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">— Pick employee —</option>
                      {managedUsers.map((u) => (
                        <option key={u.id} value={u.id} data-name={u.name}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                        Leave Type *
                      </label>
                      <select
                        value={newBalance.leaveTypeId}
                        onChange={(e) => {
                          const opt = e.target.selectedOptions[0];
                          setNewBalance({
                            ...newBalance,
                            leaveTypeId: e.target.value,
                            leaveTypeName: opt?.dataset?.name || "",
                          });
                        }}
                        required
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      >
                        <option value="">— Select —</option>
                        {leaveTypes.map((lt) => (
                          <option key={lt.id} value={lt.id} data-name={lt.name}>
                            {lt.name} (default {lt.daysAllowed}d)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                        Days Allowed *
                      </label>
                      <input
                        type="number"
                        value={newBalance.daysAllowed}
                        onChange={(e) =>
                          setNewBalance({
                            ...newBalance,
                            daysAllowed: Number(e.target.value),
                          })
                        }
                        min={1}
                        max={365}
                        required
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[var(--color-heading)]">
                      Note
                    </label>
                    <input
                      type="text"
                      value={newBalance.note}
                      onChange={(e) =>
                        setNewBalance({ ...newBalance, note: e.target.value })
                      }
                      placeholder="e.g. one-time grant"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Save Balance
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
{/* ── Student Apply Leave Popup ── */}
{isStudent &&
showApplyForm ? (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
    onClick={() =>
      setShowApplyForm(false)
    }
  >
    <div
      className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-[var(--color-panel)] shadow-2xl"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      {/* Popup header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            Leave Application
          </p>

          <h3 className="mt-1 text-xl font-bold text-[var(--color-heading)]">
            Apply for Leave
          </h3>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowApplyForm(false)
          }
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)] hover:text-[var(--color-heading)]"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={handleApply}
        className="space-y-5 p-6"
      >
        {/* Leave Type */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--color-heading)]">
            Leave Type{" "}
            <span className="text-red-500">
              *
            </span>
          </label>

          <select
            value={
              formData.leaveTypeId
            }
            onChange={(event) => {
              const option =
                event.target
                  .selectedOptions[0];

              setFormData({
                ...formData,
                leaveTypeId:
                  event.target.value,
                leaveTypeName:
                  option?.dataset
                    ?.name || "",
              });
            }}
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
          >
            <option value="">
              Select leave type
            </option>

            {leaveTypes.map(
              (leaveType) => (
                <option
                  key={leaveType.id}
                  value={leaveType.id}
                  data-name={
                    leaveType.name
                  }
                >
                  {leaveType.name} (
                  {
                    leaveType.daysAllowed
                  }
                  d/year)
                </option>
              ),
            )}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-heading)]">
              From Date{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="date"
              value={
                formData.fromDate
              }
              onChange={(event) =>
                setFormData({
                  ...formData,
                  fromDate:
                    event.target.value,
                })
              }
              min={today}
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-heading)]">
              To Date{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="date"
              value={
                formData.toDate
              }
              onChange={(event) =>
                setFormData({
                  ...formData,
                  toDate:
                    event.target.value,
                })
              }
              min={
                formData.fromDate ||
                today
              }
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
            />
          </div>
        </div>

        {/* Day calculation */}
        {formData.fromDate &&
        formData.toDate ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Total leave duration:{" "}
            <strong>
              {daysBetween(
                formData.fromDate,
                formData.toDate,
              )}{" "}
              day(s)
            </strong>
          </div>
        ) : null}

        {/* Reason */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--color-heading)]">
            Reason{" "}
            <span className="text-red-500">
              *
            </span>
          </label>

          <textarea
            value={formData.reason}
            onChange={(event) =>
              setFormData({
                ...formData,
                reason:
                  event.target.value,
              })
            }
            rows={4}
            required
            placeholder="Write the reason for your leave..."
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              setShowApplyForm(false)
            }
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-2.5 text-sm font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)]"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  </div>
) : null}
      {/* ── Reject Modal ── */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setRejectTarget(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-panel)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-6 py-4"
              style={{
                background: "linear-gradient(135deg,#FEF2F2,#FFE4E6)",
              }}
            >
              <h3 className="text-lg font-bold text-[#EF4444]">
                Reject Leave Request
              </h3>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-3 text-sm text-[#92400E]">
                You're rejecting <strong>{rejectTarget.userName}</strong>'s leave
                request for{" "}
                <strong>
                  {formatDate(rejectTarget.fromDate)} –{" "}
                  {formatDate(rejectTarget.toDate)}
                </strong>
                .
              </div>
              <label className="block text-sm font-semibold text-[var(--color-heading)]">
                Reason for rejection *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                required
                placeholder="e.g. Already two team members on leave that week..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-2 text-sm font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-background-strong)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      alert("Please provide a reason.");
                      return;
                    }
                    handleStatusAction(rejectTarget.id, "rejected", rejectReason.trim());
                    setRejectTarget(null);
                  }}
                  className="rounded-full bg-[#EF4444] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#DC2626]"
                >
                  Reject Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to pick a color for leave type chips based on name
function getLeaveTypeColor(leaveTypeId: string) {
  const colors = ["#3B82F6", "#EF4444", "#10B981", "#EC4899", "#6B7280", "#4F46E5", "#F59E0B"];
  let hash = 0;
  for (let i = 0; i < leaveTypeId.length; i++) {
    hash = leaveTypeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}