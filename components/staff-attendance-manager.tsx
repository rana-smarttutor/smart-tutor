"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { ManagedUser, Role, StaffAttendanceRecord, StaffAttendanceStatus, StaffCategory, EmploymentType, RegularisationRequest } from "@/lib/types";

type Props = {
  role: Role;
  managedUsers: ManagedUser[];
  userId?: string;
  userName?: string;
};

export function StaffAttendanceManager({ role, managedUsers, userId, userName }: Props) {
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, halfDay: 0, late: 0, onLeave: 0, holiday: 0 });
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [myAttendance, setMyAttendance] = useState<StaffAttendanceRecord[]>([]);
  const [viewTab, setViewTab] = useState<"admin" | "mine">(role === "admin" ? "admin" : "mine");
  const [saving, setSaving] = useState(false);

  // Bulk edit state
  const [editMap, setEditMap] = useState<Record<string, { status: StaffAttendanceStatus; checkIn: string; checkOut: string }>>({});

  // Regularisation state
  const [showRegulariseModal, setShowRegulariseModal] = useState(false);
  const [regulariseDate, setRegulariseDate] = useState("");
  const [regulariseReason, setRegulariseReason] = useState("");
  const [regulariseCheckIn, setRegulariseCheckIn] = useState("");
  const [regulariseCheckOut, setRegulariseCheckOut] = useState("");
  const [regulariseStatus, setRegulariseStatus] = useState<StaffAttendanceStatus>("present");
  const [submittingRegularise, setSubmittingRegularise] = useState(false);
  const [regularisationRequests, setRegularisationRequests] = useState<RegularisationRequest[]>([]);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff-attendance?date=${date}`, { credentials: "same-origin" });
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records || []);
      setStats(data.stats || { total: 0, present: 0, absent: 0, halfDay: 0, late: 0, onLeave: 0, holiday: 0 });
      setEditMap({});
      data.records?.forEach((r: StaffAttendanceRecord) => {
        setEditMap((prev) => ({
          ...prev,
          [r.userId]: { status: r.status, checkIn: r.checkIn || "", checkOut: r.checkOut || "" },
        }));
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [date]);

  const fetchMine = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/staff-attendance/my?userId=${userId}`, { credentials: "same-origin" });
      if (!res.ok) return;
      const data = await res.json();
      setMyAttendance(data.records || []);
    } catch {
      // silent
    }
  }, [userId]);

  useEffect(() => {
    void fetchAll();
    void fetchMine();
  }, [fetchAll, fetchMine]);

  const fetchRegularisationRequests = useCallback(async () => {
    try {
      const body: Record<string, string> = { action: "list-regularisations" };
      if (role !== "admin") body.userId = userId || "";
      const res = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const data = await res.json();
      setRegularisationRequests(data.requests || []);
    } catch {
      // silent
    }
  }, [role, userId]);

  useEffect(() => {
    void fetchRegularisationRequests();
  }, [fetchRegularisationRequests]);

  async function handleSelfCheckin() {
    const confirmed = window.confirm("Are you sure you want to check in now?");
    if (!confirmed) return;
    setCheckingIn(true);
    try {
      const res = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "checkin", date }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Check-in failed.");
        return;
      }
      alert("Checked in successfully!");
      void fetchAll();
      void fetchMine();
    } catch {
      alert("Network error.");
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleSelfCheckout() {
    const confirmed = window.confirm("Are you sure you want to check out now?");
    if (!confirmed) return;
    setCheckingIn(true);
    try {
      const res = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "checkout", date }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Check-out failed.");
        return;
      }
      alert("Checked out successfully!");
      void fetchAll();
      void fetchMine();
    } catch {
      alert("Network error.");
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleBulkSave() {
    if (role !== "admin") return;
    setSaving(true);
    try {
      const staffUsers = managedUsers.filter((u) =>
        u.role === "educator" || u.role === "admin" || u.role === "counsellor"
      );
      const recordsToSave = staffUsers.map((u) => {
        const edit = editMap[u.id] || { status: "absent" as StaffAttendanceStatus, checkIn: "", checkOut: "" };
        const category: StaffCategory = u.role === "admin" ? "Admin" : u.role === "counsellor" ? "Counsellor" : "Teacher";
        const employmentType: EmploymentType = "full_time";
        return {
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          category,
          employmentType,
          status: edit.status || "absent",
          checkIn: edit.checkIn || undefined,
          checkOut: edit.checkOut || undefined,
        };
      });
      const res = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "bulk-mark", date, records: recordsToSave }),
      });
      if (!res.ok) {
        alert("Failed to save attendance.");
        return;
      }
      alert("Attendance saved!");
      void fetchAll();
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  }

  function setAllStatus(status: StaffAttendanceStatus) {
    const newMap = { ...editMap };
    managedUsers
      .filter((u) => u.role === "educator" || u.role === "admin" || u.role === "counsellor")
      .forEach((u) => {
        newMap[u.id] = { ...(newMap[u.id] || { status: "absent", checkIn: "", checkOut: "" }), status };
      });
    setEditMap(newMap);
  }

  async function handleSubmitRegularise() {
    if (!regulariseDate || !regulariseReason) {
      alert("Date and reason are required.");
      return;
    }
    setSubmittingRegularise(true);
    try {
      const res = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "regularise",
          date: regulariseDate,
          reason: regulariseReason,
          requestedCheckIn: regulariseCheckIn || undefined,
          requestedCheckOut: regulariseCheckOut || undefined,
          requestedStatus: regulariseStatus,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to submit request.");
        return;
      }
      alert("Regularisation request submitted!");
      setShowRegulariseModal(false);
      setRegulariseDate("");
      setRegulariseReason("");
      setRegulariseCheckIn("");
      setRegulariseCheckOut("");
      setRegulariseStatus("present");
      void fetchRegularisationRequests();
    } catch {
      alert("Network error.");
    } finally {
      setSubmittingRegularise(false);
    }
  }

  async function handleReviewRequest(requestId: string, reviewStatus: "approved" | "rejected") {
    try {
      const res = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "review",
          requestId,
          reviewStatus,
        }),
      });
      if (!res.ok) {
        alert("Failed to review request.");
        return;
      }
      alert(`Request ${reviewStatus}!`);
      void fetchRegularisationRequests();
    } catch {
      alert("Network error.");
    }
  }

  const staffUsers = managedUsers.filter((u) =>
    u.role === "educator" || u.role === "admin" || u.role === "counsellor"
  );

  const myRecord = records.find((r) => r.userId === userId);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { label: "Total", value: stats.total, color: "#4F46E5", bg: "#EEF2FF" },
    { label: "Present", value: stats.present, color: "#059669", bg: "#ECFDF5" },
    { label: "Absent", value: stats.absent, color: "#EF4444", bg: "#FEF2F2" },
    { label: "Half Day", value: stats.halfDay, color: "#D97706", bg: "#FEF3C7" },
    { label: "Late", value: stats.late, color: "#0EA5E9", bg: "#F0F9FF" },
    { label: "On Leave", value: stats.onLeave, color: "#8B5CF6", bg: "#F5F3FF" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label">{role === "admin" ? "Operations" : "My Attendance"}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-heading)]">
          Staff Attendance
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {role === "admin"
            ? "Mark staff attendance, manage check-in/check-out times."
            : "Check in / check out for the day and view your attendance history."}
        </p>
      </div>

      {/* Self Check-in/out */}
      {(role === "educator" || role === "counsellor" || role === "admin") && (
        <div className="surface rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF]">
                <svg className="h-6 w-6" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--color-heading)]">{userName || "Self Check-in"}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {date} &middot;{" "}
                  {myRecord
                    ? `Checked in at ${myRecord.checkIn || "—"}${myRecord.checkOut ? `, out at ${myRecord.checkOut}` : ""}`
                    : "Not checked in yet"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelfCheckin}
                disabled={checkingIn || !!myRecord?.checkIn}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  myRecord?.checkIn
                    ? "bg-[#ECFDF5] text-[#059669] cursor-default"
                    : "bg-[var(--color-primary)] text-white hover:opacity-90"
                }`}
              >
                {checkingIn ? "..." : myRecord?.checkIn ? "Checked In" : "Check In"}
              </button>
              <button
                type="button"
                onClick={handleSelfCheckout}
                disabled={checkingIn || !myRecord?.checkIn || !!myRecord?.checkOut}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                  myRecord?.checkOut
                    ? "bg-[#F0F9FF] text-[#0EA5E9] cursor-default"
                    : "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                }`}
              >
                {checkingIn ? "..." : myRecord?.checkOut ? "Checked Out" : "Check Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 sm:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="surface rounded-2xl p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: s.bg }}>
              <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      {role === "admin" && (
        <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
          <button
            type="button"
            onClick={() => setViewTab("admin")}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              viewTab === "admin"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-muted)] hover:bg-[var(--color-primary)]/10"
            }`}
          >
            Manage All
          </button>
          <button
            type="button"
            onClick={() => setViewTab("mine")}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              viewTab === "mine"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-muted)] hover:bg-[var(--color-primary)]/10"
            }`}
          >
            My History
          </button>
        </div>
      )}

      {/* Admin: Bulk Mark */}
      {(viewTab === "admin" && role === "admin") && (
        <div className="surface rounded-[2rem] overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3 flex-wrap">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-bold text-[var(--color-heading)]">Attendance for {date}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-heading)] outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAllStatus("present")} className="rounded-lg bg-[#ECFDF5] px-3 py-1.5 text-xs font-bold text-[#059669] hover:bg-[#D1FAE5]">All Present</button>
              <button type="button" onClick={() => setAllStatus("absent")} className="rounded-lg bg-[#FEF2F2] px-3 py-1.5 text-xs font-bold text-[#EF4444] hover:bg-[#FEE2E2]">All Absent</button>
              {role === "admin" && (
                <button
                  type="button"
                  onClick={handleBulkSave}
                  disabled={saving}
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
                >
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--color-background-strong)]">
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Staff Member</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Category</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Employment</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Status</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Check In</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Check Out</th>
                  <th className="px-4 py-3 font-bold text-[var(--color-muted)]">Biometric</th>
                </tr>
              </thead>
              <tbody>
                {staffUsers.map((user) => {
                  const existing = records.find((r) => r.userId === user.id);
                  const edit = editMap[user.id] || { status: existing?.status || "absent", checkIn: existing?.checkIn || "", checkOut: existing?.checkOut || "" };
                  const category: StaffCategory = user.role === "admin" ? "Admin" : user.role === "counsellor" ? "Counsellor" : "Teacher";
                  const initials = user.name.split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <tr key={user.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background-strong)]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--color-heading)]">{user.name}</div>
                            <div className="text-[11px] text-[var(--color-muted)]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-[var(--color-primary)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--color-primary)]">
                          {category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#10B98118] px-2.5 py-1 text-[10px] font-bold text-[#10B981]">
                          Full time
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={edit.status}
                          onChange={(e) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [user.id]: { ...(prev[user.id] || { checkIn: "", checkOut: "" }), status: e.target.value as StaffAttendanceStatus },
                            }))
                          }
                          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="half_day">Half Day</option>
                          <option value="late">Late</option>
                          <option value="on_leave">On Leave</option>
                          <option value="holiday">Holiday</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={edit.checkIn}
                          onChange={(e) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [user.id]: { ...(prev[user.id] || { status: "absent" }), checkIn: e.target.value },
                            }))
                          }
                          className="w-[110px] rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={edit.checkOut}
                          onChange={(e) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [user.id]: { ...(prev[user.id] || { status: "absent" }), checkOut: e.target.value },
                            }))
                          }
                          className="w-[110px] rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {existing?.biometricId ? (
                          <span className="text-xs text-[#059669]">&check; Biometric</span>
                        ) : (
                          <span className="text-xs text-[#CBD5E1]">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My History */}
      {(viewTab === "mine" || role !== "admin") && (
        <div className="surface rounded-[2rem] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--color-heading)]">My Attendance History</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRequestsPanel(!showRequestsPanel)}
                className="rounded-lg bg-[#F5F3FF] px-3 py-1.5 text-xs font-bold text-[#7C3AED] hover:bg-[#EDE9FE] transition-colors"
              >
                My Requests ({regularisationRequests.length})
              </button>
              <button
                type="button"
                onClick={() => { setShowRegulariseModal(true); setRegulariseDate(date); }}
                className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-colors"
              >
                + Regularise
              </button>
            </div>
          </div>
          {myAttendance.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No attendance records yet.</p>
          ) : (
            <div className="space-y-3">
              {myAttendance.slice(0, 15).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-heading)]">{r.date}</div>
                    <div className="text-[11px] text-[var(--color-muted)]">
                      {r.checkIn ? `In: ${r.checkIn}` : "—"} &middot; {r.checkOut ? `Out: ${r.checkOut}` : "—"}
                      {r.hoursWorked ? ` (${r.hoursWorked}h)` : ""}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                      r.status === "present" ? "bg-[#ECFDF5] text-[#059669]" :
                      r.status === "absent" ? "bg-[#FEF2F2] text-[#EF4444]" :
                      r.status === "half_day" ? "bg-[#FEF3C7] text-[#D97706]" :
                      r.status === "late" ? "bg-[#F0F9FF] text-[#0EA5E9]" :
                      r.status === "on_leave" ? "bg-[#F5F3FF] text-[#8B5CF6]" :
                      "bg-[#F8FAFC] text-[#94A3B8]"
                    }`}
                  >
                    {r.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin: Pending Regularisation Requests */}
      {role === "admin" && (
        <div className="surface rounded-[2rem] p-5">
          <h3 className="mb-4 text-lg font-bold text-[var(--color-heading)]">Regularisation Requests</h3>
          {regularisationRequests.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {regularisationRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-heading)]">{req.userName}</div>
                    <div className="text-[11px] text-[var(--color-muted)]">
                      {req.date} &middot; {req.reason}
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)]">
                      {req.requestedCheckIn ? `In: ${req.requestedCheckIn}` : ""} {req.requestedCheckOut ? `Out: ${req.requestedCheckOut}` : ""} → {req.requestedStatus.replace("_", " ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                      req.status === "pending" ? "bg-[#FEF3C7] text-[#D97706]" :
                      req.status === "approved" ? "bg-[#ECFDF5] text-[#059669]" :
                      "bg-[#FEF2F2] text-[#EF4444]"
                    }`}>
                      {req.status}
                    </span>
                    {req.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req.id, "approved")}
                          className="rounded-lg bg-[#ECFDF5] px-3 py-1 text-[10px] font-bold text-[#059669] hover:bg-[#D1FAE5]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req.id, "rejected")}
                          className="rounded-lg bg-[#FEF2F2] px-3 py-1 text-[10px] font-bold text-[#EF4444] hover:bg-[#FEE2E2]"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Regularisation Modal */}
      {showRegulariseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowRegulariseModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[var(--color-heading)]">Request Regularisation</h3>
              <button type="button" onClick={() => setShowRegulariseModal(false)} className="text-[var(--color-muted)] hover:text-[var(--color-heading)]">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Date *</label>
                <input
                  type="date"
                  value={regulariseDate}
                  onChange={(e) => setRegulariseDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Reason *</label>
                <textarea
                  value={regulariseReason}
                  onChange={(e) => setRegulariseReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., Forgot to check in, system error..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Check In Time</label>
                  <input
                    type="time"
                    value={regulariseCheckIn}
                    onChange={(e) => setRegulariseCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Check Out Time</label>
                  <input
                    type="time"
                    value={regulariseCheckOut}
                    onChange={(e) => setRegulariseCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Status</label>
                <select
                  value={regulariseStatus}
                  onChange={(e) => setRegulariseStatus(e.target.value as StaffAttendanceStatus)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="present">Present</option>
                  <option value="half_day">Half Day</option>
                  <option value="late">Late</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleSubmitRegularise}
                disabled={submittingRegularise || !regulariseDate || !regulariseReason}
                className="w-full rounded-full bg-[var(--color-primary)] py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {submittingRegularise ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
