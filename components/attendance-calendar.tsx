"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ManagedUser, Role, StaffAttendanceRecord, StaffAttendanceStatus, RegularisationRequest } from "@/lib/types";

type Props = {
  role: Role;
  managedUsers: ManagedUser[];
  userId?: string;
};

type CalendarDay = {
  date: Date;
  dateStr: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isFuture: boolean;
  record?: StaffAttendanceRecord;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: "#DCFCE7", text: "#059669", label: "Present" },
  absent: { bg: "#FEE2E2", text: "#DC2626", label: "Absent" },
  half_day: { bg: "#FEF3C7", text: "#D97706", label: "Half Day" },
  late: { bg: "#FED7AA", text: "#C2410C", label: "Late" },
  on_leave: { bg: "#DBEAFE", text: "#2563EB", label: "Leave" },
  holiday: { bg: "#F1F5F9", text: "#64748B", label: "Holiday" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const days: CalendarDay[] = [];

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const startPad = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;

  for (let p = startPad - 1; p >= 0; p--) {
    const d = new Date(year, month, -p);
    days.push({
      date: d,
      dateStr: d.toISOString().slice(0, 10),
      day: d.getDate(),
      isCurrentMonth: false,
      isToday: d.toISOString().slice(0, 10) === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isFuture: d.toISOString().slice(0, 10) > todayStr,
    });
  }

  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      dateStr: date.toISOString().slice(0, 10),
      day: d,
      isCurrentMonth: true,
      isToday: date.toISOString().slice(0, 10) === todayStr,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isFuture: date.toISOString().slice(0, 10) > todayStr,
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      dateStr: d.toISOString().slice(0, 10),
      day: d.getDate(),
      isCurrentMonth: false,
      isToday: d.toISOString().slice(0, 10) === todayStr,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isFuture: d.toISOString().slice(0, 10) > todayStr,
    });
  }

  return days;
}

function computeMonthStats(records: StaffAttendanceRecord[]) {
  const stats = { present: 0, absent: 0, halfDay: 0, late: 0, onLeave: 0, holiday: 0 };
  for (const r of records) {
    if (r.status === "present") stats.present++;
    else if (r.status === "absent") stats.absent++;
    else if (r.status === "half_day") stats.halfDay++;
    else if (r.status === "late") stats.late++;
    else if (r.status === "on_leave") stats.onLeave++;
    else if (r.status === "holiday") stats.holiday++;
  }
  return stats;
}

function formatHours(hours?: number) {
  if (hours == null) return "";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function formatTotalHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h} : ${String(m).padStart(2, "0")}`;
}

export function AttendanceCalendar({ role, managedUsers, userId }: Props) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">("calendar");
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || "");

  // Regularisation modal state
  const [showRegulariseModal, setShowRegulariseModal] = useState(false);
  const [regulariseDate, setRegulariseDate] = useState("");
  const [regulariseReason, setRegulariseReason] = useState("");
  const [regulariseCheckIn, setRegulariseCheckIn] = useState("");
  const [regulariseCheckOut, setRegulariseCheckOut] = useState("");
  const [regulariseStatus, setRegulariseStatus] = useState<StaffAttendanceStatus>("present");
  const [submittingRegularise, setSubmittingRegularise] = useState(false);

  const isAdmin = role === "admin";

  const monthLabel = new Date(currentYear, currentMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  const recordMap = useMemo(() => {
    const map = new Map<string, StaffAttendanceRecord>();
    const filtered = selectedUserId ? records.filter((r) => r.userId === selectedUserId) : records;
    for (const r of filtered) {
      map.set(r.date, r);
    }
    return map;
  }, [records, selectedUserId]);

  const monthStats = useMemo(() => {
    const filtered = selectedUserId ? records.filter((r) => r.userId === selectedUserId) : records;
    return computeMonthStats(filtered);
  }, [records, selectedUserId]);

  const workingDaysCount = useMemo(
    () => days.filter((d) => d.isCurrentMonth && !d.isWeekend && !d.isFuture).length,
    [days],
  );

  const totalHours = useMemo(
    () => records.filter((r) => !selectedUserId || r.userId === selectedUserId).reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
    [records, selectedUserId],
  );

  const workingHours = useMemo(() => {
    const filtered = records.filter((r) => !selectedUserId || r.userId === selectedUserId);
    const presentHours = filtered.filter((r) => r.status === "present" || r.status === "late" || r.status === "half_day").reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    return presentHours;
  }, [records, selectedUserId]);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10);
      let url = `/api/staff-attendance?startDate=${startDate}&endDate=${endDate}`;
      if (selectedUserId) url += `&userId=${selectedUserId}`;
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth, selectedUserId]);

  useEffect(() => {
    void fetchMonth();
  }, [fetchMonth]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }

  const staffOptions = useMemo(
    () => managedUsers.filter((u) => u.role === "educator" || u.role === "admin" || u.role === "counsellor"),
    [managedUsers],
  );

  function openRegularise(dateStr: string) {
    setRegulariseDate(dateStr);
    setRegulariseReason("");
    setRegulariseCheckIn("");
    setRegulariseCheckOut("");
    setRegulariseStatus("present");
    setShowRegulariseModal(true);
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
    } catch {
      alert("Network error.");
    } finally {
      setSubmittingRegularise(false);
    }
  }

  return (
    <div>
      {/* Header with month nav and view toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-900">{monthLabel}</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 h-8 text-xs font-bold text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
            >
              <option value="">All Staff</option>
              {staffOptions.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          )}

          {/* Month/Week toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="inline mr-1 align-middle">
                <path d="M4.66667 0.5V3.83333M14.6667 15.5H1.33333C1.11232 15.5 0.900358 15.4122 0.744078 15.2559C0.587797 15.0996 0.5 14.8877 0.5 14.6667V6.33333H15.5V14.6667C15.5 14.8877 15.4122 15.0996 15.2559 15.2559C15.0996 15.4122 14.8877 15.5 14.6667 15.5ZM15.5 3C15.5 2.77899 15.4122 2.56702 15.2559 2.41074C15.0996 2.25446 14.8877 2.16667 14.6667 2.16667H1.33333C1.11232 2.16667 0.900358 2.25446 0.744078 2.41074C0.587797 2.56702 0.5 2.77899 0.5 3V6.33333H15.5V3ZM11.3333 0.5V3.83333V0.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="inline mr-1 align-middle">
                <path d="M0.5 6.33333V14.6667C0.5 14.8877 0.587797 15.0996 0.744078 15.2559C0.900358 15.4122 1.11232 15.5 1.33333 15.5H14.6667C14.8877 15.5 15.0996 15.4122 15.2559 15.2559C15.4122 15.0996 15.5 14.8877 15.5 14.6667V6.33333M0.5 6.33333V3C0.5 2.77899 0.587797 2.56702 0.744078 2.41074C0.900358 2.25446 1.11232 2.16667 1.33333 2.16667H14.6667C14.8877 2.16667 15.0996 2.25446 15.2559 2.41074C15.4122 2.56702 15.5 2.77899 15.5 3V6.33333M0.5 6.33333H8H15.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Week
            </button>
          </div>

          {/* Calendar/List toggle */}
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="displayMode"
                checked={displayMode === "calendar"}
                onChange={() => setDisplayMode("calendar")}
                className="accent-violet-600"
              />
              <span className="font-semibold text-slate-600">Calendar</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="displayMode"
                checked={displayMode === "list"}
                onChange={() => setDisplayMode("list")}
                className="accent-violet-600"
              />
              <span className="font-semibold text-slate-600">List</span>
            </label>
          </div>
        </div>
      </div>

      {/* Stats cards - Angular style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-[#E8EDF2] p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Present</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{monthStats.present}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E8EDF2] p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Absent</div>
          <div className="text-xl font-bold text-red-600 mt-1">{monthStats.absent}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E8EDF2] p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Leave</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{monthStats.onLeave}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E8EDF2] p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Working Days</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{workingDaysCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E8EDF2] p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Working Hours</div>
          <div className="text-xl font-bold text-violet-600 mt-1">{formatTotalHours(workingHours)}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E8EDF2] p-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Hours</div>
          <div className="text-xl font-bold text-slate-600 mt-1">{formatTotalHours(totalHours)}</div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayMode === "calendar" ? (
        /* Calendar Grid View - Angular style */
        <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#F1F5F9]">
            {WEEKDAYS.map((day) => (
              <div key={day} className="flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-r border-[#F1F5F9] last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar body */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const rec = recordMap.get(day.dateStr);
              const statusColor = rec ? STATUS_COLORS[rec.status] : null;
              const canRegularise = !day.isFuture && !day.isWeekend && day.isCurrentMonth;

              return (
                <div
                  key={day.dateStr}
                  className={`min-h-[100px] border-b border-r border-[#F1F5F9] p-1.5 relative transition-colors ${
                    !day.isCurrentMonth ? "bg-slate-50/50" : ""
                  } ${day.isToday ? "bg-violet-50/50" : ""} ${
                    !day.isCurrentMonth ? "opacity-50" : ""
                  }`}
                >
                  {/* Top row: Date + Regularize icon */}
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-xs font-bold ${
                      day.isToday ? "text-violet-600" :
                      !day.isCurrentMonth ? "text-slate-300" :
                      day.isWeekend ? "text-slate-400" : "text-slate-600"
                    }`}>
                      {day.isToday ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-white text-[10px]">{day.day}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-slate-300">
                            <rect x="1" y="2" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M1 6H15" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M5 0.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            <path d="M11 0.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          {day.day}
                        </span>
                      )}
                    </div>
                    {canRegularise && (
                      <button
                        type="button"
                        onClick={() => openRegularise(day.dateStr)}
                        className="w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        title="Regularise"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Attendance body */}
                  <div className="mt-1">
                    {/* Status badge */}
                    {rec && statusColor ? (
                      <span
                        className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mb-1"
                        style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      >
                        {statusColor.label}
                      </span>
                    ) : day.isWeekend && day.isCurrentMonth ? (
                      <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 mb-1">
                        Weekend
                      </span>
                    ) : null}

                    {/* Check-in/out times */}
                    {rec && (
                      <div className="space-y-0.5">
                        {rec.checkIn && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-500">
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="6" stroke="#059669" strokeWidth="1.5"/>
                              <path d="M8 5V8L10 10" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            {rec.checkIn}
                          </div>
                        )}
                        {rec.checkOut && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-500">
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="6" stroke="#EF4444" strokeWidth="1.5"/>
                              <path d="M8 5V8L10 10" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            {rec.checkOut}
                          </div>
                        )}
                        {rec.hoursWorked != null && (
                          <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-600">
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="8" r="6" stroke="#6D28D9" strokeWidth="1.5"/>
                              <path d="M8 5V8H11" stroke="#6D28D9" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            {formatHours(rec.hoursWorked)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* No record */}
                    {!rec && !day.isWeekend && day.isCurrentMonth && !day.isFuture && (
                      <span className="text-[9px] text-slate-300">No record</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden">
          <div className="divide-y divide-[#F1F5F9]">
            {days.filter((d) => d.isCurrentMonth && !d.isFuture).map((day) => {
              const rec = recordMap.get(day.dateStr);
              const statusColor = rec ? STATUS_COLORS[rec.status] : null;
              const canRegularise = !day.isWeekend && day.isCurrentMonth;

              return (
                <div key={day.dateStr} className={`flex items-center justify-between px-4 py-3 ${day.isWeekend ? "bg-slate-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      day.isToday ? "bg-violet-600 text-white" :
                      day.isWeekend ? "bg-slate-100 text-slate-400" :
                      "bg-slate-50 text-slate-600"
                    }`}>
                      {day.day}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {day.isWeekend ? "Weekend" : rec ? `${rec.checkIn || "—"} → ${rec.checkOut || "—"}` : "No record"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec && statusColor && (
                      <span
                        className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      >
                        {statusColor.label}
                      </span>
                    )}
                    {rec?.hoursWorked != null && (
                      <span className="text-[10px] font-semibold text-slate-500">{formatHours(rec.hoursWorked)}</span>
                    )}
                    {canRegularise && (
                      <button
                        type="button"
                        onClick={() => openRegularise(day.dateStr)}
                        className="text-[10px] font-bold text-violet-600 hover:text-violet-800 px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
                      >
                        Regularise
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regularisation Modal */}
      {showRegulariseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowRegulariseModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Request Regularisation</h3>
              <button type="button" onClick={() => setShowRegulariseModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={regulariseDate}
                  onChange={(e) => setRegulariseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Reason *</label>
                <textarea
                  value={regulariseReason}
                  onChange={(e) => setRegulariseReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., Forgot to check in, system error..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Check In</label>
                  <input
                    type="time"
                    value={regulariseCheckIn}
                    onChange={(e) => setRegulariseCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Check Out</label>
                  <input
                    type="time"
                    value={regulariseCheckOut}
                    onChange={(e) => setRegulariseCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Status</label>
                <select
                  value={regulariseStatus}
                  onChange={(e) => setRegulariseStatus(e.target.value as StaffAttendanceStatus)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-500"
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
                className="w-full rounded-full bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
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
