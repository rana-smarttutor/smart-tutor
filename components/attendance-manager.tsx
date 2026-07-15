"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AttendanceSheet,
  AttendanceStatus,
  ManagedUser,
  Role,
} from "@/lib/types";

type AttendanceManagerProps = {
  role: Role;
  attendanceSheets: AttendanceSheet[];
  studentDirectory: ManagedUser[];
  managedUsers: ManagedUser[];
  userId?: string;
  embedded?: boolean;
};

const STATUS_CYCLE: (AttendanceStatus | "unmarked")[] = [
  "unmarked",
  "present",
  "absent",
  "late",
];

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; dot: string }
> = {
  unmarked: {
    label: "Unmarked",
    bg: "bg-[var(--color-background-strong)]",
    color: "text-[var(--color-muted)]",
    dot: "bg-[var(--color-border)]",
  },
  present: {
    label: "Present",
    bg: "bg-[var(--color-success)]/10",
    color: "text-[var(--color-success)]",
    dot: "bg-[var(--color-success)]",
  },
  absent: {
    label: "Absent",
    bg: "bg-[var(--color-danger)]/10",
    color: "text-[var(--color-danger)]",
    dot: "bg-[var(--color-danger)]",
  },
  late: {
    label: "Late",
    bg: "bg-[var(--color-amber-soft)]",
    color: "text-[var(--color-amber-strong)]",
    dot: "bg-[var(--color-amber)]",
  },
};
function toLocalDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
const AVATAR_COLORS = [
  "from-[var(--color-primary)] to-[var(--color-primary-strong)]",
  "from-[var(--color-secondary)] to-[var(--color-secondary-strong)]",
  "from-[var(--color-purple)] to-[var(--color-purple-strong)]",
  "from-[var(--color-amber)] to-[var(--color-amber-strong)]",
  "from-[var(--color-rose)] to-[var(--color-rose-strong)]",
  "from-[var(--color-info)] to-[var(--color-info-strong)]",
  "from-[var(--color-success)] to-[var(--color-success-strong)]",
  "from-[var(--color-danger)] to-[var(--color-danger-strong)]",
];

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function AttendanceManager({
  role,
  attendanceSheets,
  studentDirectory,
  managedUsers,
  userId,
  embedded = false,
}: AttendanceManagerProps) {
  const canEdit = role === "admin" || role === "educator";
  const isAdmin = role === "admin" || role === "educator";

  const [selectedDate, setSelectedDate] = useState(
    toLocalDateString(new Date()),
  );
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");

  const [viewMode, setViewMode] = useState<"students" | "faculty">("students");

  const [localRecords, setLocalRecords] = useState<
    {
      personId: string;
      personName: string;
      status: AttendanceStatus | "unmarked";
    }[]
  >([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  const allStudents = useMemo(() => {
    return studentDirectory.filter((s) => s.role === "student");
  }, [studentDirectory]);

  const filteredPeople = useMemo(() => {
    if (!search) return allStudents;
    const q = search.toLowerCase();
    return allStudents.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.id?.toLowerCase() || "").includes(q),
    );
  }, [allStudents, search]);

  function loadAttendance() {
    if (!selectedDate) {
      setMessage("Select a date first.");
      return;
    }

    const sheetType = viewMode === "faculty" ? "faculty" : "student";
    const existing = attendanceSheets.find(
      (s) => s.date === selectedDate && s.lectureId === sheetType,
    );

    if (existing) {
      setActiveSheetId(existing.id);
      setLocalRecords(
        existing.records.map((r) => ({
          personId: r.studentId,
          personName: r.studentName,
          status: r.status,
        })),
      );
      if (existing.subject) setSubject(existing.subject);
      setMessage("");
      setHasUnsaved(false);
      setLastSaved("");
      return;
    }

    const people = allStudents;
    if (!people.length) {
      setMessage(`No ${viewMode} found.`);
      return;
    }

    setActiveSheetId(null);
    setLocalRecords(
      people.map((p) => ({
        personId: p.id,
        personName: p.name,
        status: "unmarked" as const,
      })),
    );
    setMessage("");
    setHasUnsaved(false);
    setLastSaved("");
  }

  function cycleStatus(personId: string) {
    if (!canEdit) return;
    if (viewMode === "faculty" && !isAdmin) return;
    setLocalRecords((prev) =>
      prev.map((r) => {
        if (r.personId !== personId) return r;
        const idx = STATUS_CYCLE.indexOf(r.status);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        return { ...r, status: next as AttendanceStatus | "unmarked" };
      }),
    );
    setHasUnsaved(true);
  }

  function markAll(status: AttendanceStatus) {
    if (!canEdit) return;
    if (viewMode === "faculty" && !isAdmin) return;
    setLocalRecords((prev) => prev.map((r) => ({ ...r, status })));
    setHasUnsaved(true);
  }

  const stats = useMemo(() => {
    const present = localRecords.filter((r) => r.status === "present").length;
    const absent = localRecords.filter((r) => r.status === "absent").length;
    const late = localRecords.filter((r) => r.status === "late").length;
    const unmarked = localRecords.filter((r) => r.status === "unmarked").length;
    const pct =
      localRecords.length > 0
        ? Math.round(((present + late) / localRecords.length) * 100)
        : 0;
    return { present, absent, late, unmarked, total: localRecords.length, pct };
  }, [localRecords]);

  async function saveAttendance() {
    if (!canEdit || !selectedDate) return;
    if (viewMode === "faculty" && !isAdmin) return;
    setIsSaving(true);
    setMessage("");

    const records = localRecords
      .filter((r) => r.status !== "unmarked")
      .map((r) => ({
        studentId: r.personId,
        studentName: r.personName,
        status: r.status as AttendanceStatus,
      }));

    const sheetType = viewMode === "faculty" ? "faculty" : "student";

    try {
      if (activeSheetId) {
        const res = await fetch(`/api/attendance/${activeSheetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records }),
        });
        const data = (await res.json()) as {
          attendanceSheet?: AttendanceSheet;
          error?: string;
        };
        if (!res.ok || !data.attendanceSheet) {
          setMessage(data.error ?? "Save failed.");
          setIsSaving(false);
          return;
        }
        setLastSaved(new Date().toLocaleTimeString());
      } else {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${viewMode === "faculty" ? "Faculty" : "Student"} Attendance - ${selectedDate}`,
            date: selectedDate,
            lectureId: sheetType,
            subject: subject.trim() || undefined,
            records,
          }),
        });
        const data = (await res.json()) as {
          attendanceSheet?: AttendanceSheet;
          error?: string;
        };
        if (!res.ok || !data.attendanceSheet) {
          setMessage(data.error ?? "Save failed.");
          setIsSaving(false);
          return;
        }
        setActiveSheetId(data.attendanceSheet.id);
        setLastSaved(new Date().toLocaleTimeString());
      }

      setHasUnsaved(false);
      setMessage("Attendance saved.");
    } catch {
      setMessage("Unable to save attendance.");
    } finally {
      setIsSaving(false);
    }
  }

  const viewerSummary = useMemo(() => {
    if (canEdit || !userId) return null;
    let present = 0;
    let absent = 0;
    let late = 0;
    let total = 0;
    for (const sheet of attendanceSheets) {
      const record = sheet.records.find((r) => r.studentId === userId);
      if (!record) continue;
      total++;
      if (record.status === "present") present++;
      else if (record.status === "absent") absent++;
      else if (record.status === "late") late++;
    }
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, pct };
  }, [canEdit, attendanceSheets, userId]);

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const calDateMap = useMemo(() => {
    if (canEdit || !userId) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const sheet of attendanceSheets) {
      const record = sheet.records.find((r) => r.studentId === userId);
      if (record && sheet.date) map.set(sheet.date, record.status);
    }
    return map;
  }, [canEdit, attendanceSheets, userId]);

  const calMonthLabel = new Date(calYear, calMonth).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    const todayStr = toLocalDateString(new Date());
    const pad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const days: {
      date: string;
      day: number;
      currentMonth: boolean;
      status?: string;
      isToday: boolean;
      isFuture: boolean;
    }[] = [];
    for (let p = pad - 1; p >= 0; p--) {
      const d = new Date(calYear, calMonth, -p);
      const ds = toLocalDateString(d);
      days.push({
        date: ds,
        day: d.getDate(),
        currentMonth: false,
        status: calDateMap.get(ds),
        isToday: ds === todayStr,
        isFuture: ds > todayStr,
      });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(calYear, calMonth, d);
      const ds = toLocalDateString(date);
      days.push({
        date: ds,
        day: d,
        currentMonth: true,
        status: calDateMap.get(ds),
        isToday: ds === todayStr,
        isFuture: ds > todayStr,
      });
    }
    const rem = 42 - days.length;
    for (let i = 1; i <= rem; i++) {
      const d = new Date(calYear, calMonth + 1, i);
      const ds = toLocalDateString(d);
      days.push({
        date: ds,
        day: d.getDate(),
        currentMonth: false,
        status: calDateMap.get(ds),
        isToday: ds === todayStr,
        isFuture: ds > todayStr,
      });
    }
    return days;
  }, [calYear, calMonth, calDateMap]);

  return (
    <section className="space-y-6">
{/* Hero */}
{!embedded ? (
  <div className="surface rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-label">Attendance Management</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-heading)]">
                Student Attendance
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {canEdit
                  ? "Mark, review and save student attendance by date and subject."
                  : "View your attendance records."}
              </p>
            </div>
            {canEdit && localRecords.length > 0 ? (
              <button
                type="button"
                onClick={saveAttendance}
                disabled={isSaving || !hasUnsaved}
                className="btn-action btn-md font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Save
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Student/Parent Calendar View */}
      {!canEdit && viewerSummary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              {
                label: "Present",
                value: viewerSummary.present,
                color: "var(--color-success)",
                bg: "var(--color-success)",
              },
              {
                label: "Absent",
                value: viewerSummary.absent,
                color: "var(--color-danger)",
                bg: "var(--color-danger)",
              },
              {
                label: "Late",
                value: viewerSummary.late,
                color: "var(--color-amber)",
                bg: "var(--color-amber)",
              },
              {
                label: "Total Lectures",
                value: viewerSummary.total,
                color: "var(--color-info)",
                bg: "var(--color-info)",
              },
              {
                label: "Attendance",
                value: `${viewerSummary.pct}%`,
                color: "var(--color-primary)",
                bg: "var(--color-primary)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="surface rounded-2xl p-4 sm:p-5 text-center"
                style={{ borderTop: `3px solid ${s.bg}` }}
              >
                <p
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ color: s.color }}
                >
                  {s.value}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="surface rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear(calYear - 1);
                  } else setCalMonth(calMonth - 1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--color-background-strong)] transition"
              >
                <svg
                  className="h-4 w-4 text-[var(--color-heading)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <p className="text-sm font-bold text-[var(--color-heading)]">
                {calMonthLabel}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear(calYear + 1);
                  } else setCalMonth(calMonth + 1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--color-background-strong)] transition"
              >
                <svg
                  className="h-4 w-4 text-[var(--color-heading)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calDays.map((d) => {
                const statusColor: Record<
                  string,
                  { bg: string; text: string; label: string }
                > = {
                  present: { bg: "#DCFCE7", text: "#059669", label: "P" },
                  absent: { bg: "#FEE2E2", text: "#DC2626", label: "A" },
                  late: { bg: "#FEF3C7", text: "#D97706", label: "L" },
                  on_leave: { bg: "#DBEAFE", text: "#2563EB", label: "Lv" },
                };
                const sc = d.status ? statusColor[d.status] : undefined;
                return (
                  <div
                    key={d.date}
                    className={`relative flex flex-col items-center justify-center border-b border-r border-[var(--color-border)] p-1.5 sm:p-2 min-h-[48px] sm:min-h-[60px] transition ${
                      !d.currentMonth
                        ? "bg-[var(--color-background)] opacity-40"
                        : ""
                    } ${d.isToday ? "bg-[var(--color-primary)]/5" : ""} ${
                      d.isFuture ? "opacity-50" : ""
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${d.isToday ? "text-[var(--color-primary)]" : d.currentMonth ? "text-[var(--color-heading)]" : "text-[var(--color-muted)]"}`}
                    >
                      {d.day}
                    </span>
                    {sc && (
                      <span
                        className="mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] font-bold"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {sc.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] px-5 py-3">
              {[
                { label: "Present", color: "#059669", bg: "#DCFCE7" },
                { label: "Absent", color: "#DC2626", bg: "#FEE2E2" },
                { label: "Late", color: "#D97706", bg: "#FEF3C7" },
                { label: "Leave", color: "#2563EB", bg: "#DBEAFE" },
              ].map((l) => (
                <span
                  key={l.label}
                  className="flex items-center gap-1.5 text-[10px] font-bold"
                  style={{ color: l.color }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: l.bg }}
                  />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Empty calendar state for student/parent */}
      {!canEdit && !viewerSummary ? (
        <div className="surface rounded-2xl p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)]">
            <svg
              className="h-6 w-6 text-[var(--color-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="mt-4 text-lg font-bold text-[var(--color-heading)]">
            No Attendance Data
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Your attendance records will appear here once your teacher marks
            them.
          </p>
        </div>
      ) : null}

      {/* Filter Bar */}
      {canEdit ? (
        <div className="surface rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[150px] flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Date
              </p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="min-w-[140px] flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Subject
              </p>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)]"
              />
            </div>
            <button
              type="button"
              onClick={loadAttendance}
              className="btn-action btn-md font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Load Attendance
            </button>
          </div>
        </div>
      ) : null}

      {/* Stats */}
      {localRecords.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            className="surface rounded-[1.25rem] p-4 text-center"
            style={{ borderLeft: "3px solid var(--color-success)" }}
          >
            <p className="text-2xl font-bold tracking-tight text-[var(--color-success)]">
              {stats.present}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Present
            </p>
          </div>
          <div
            className="surface rounded-[1.25rem] p-4 text-center"
            style={{ borderLeft: "3px solid var(--color-danger)" }}
          >
            <p className="text-2xl font-bold tracking-tight text-[var(--color-danger)]">
              {stats.absent}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Absent
            </p>
          </div>
          <div
            className="surface rounded-[1.25rem] p-4 text-center"
            style={{ borderLeft: "3px solid var(--color-amber)" }}
          >
            <p className="text-2xl font-bold tracking-tight text-[var(--color-amber)]">
              {stats.late}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Late
            </p>
          </div>
          <div
            className="surface rounded-[1.25rem] p-4 text-center"
            style={{ borderLeft: "3px solid var(--color-primary)" }}
          >
            <p className="text-2xl font-bold tracking-tight text-[var(--color-primary)]">
              {stats.pct}%
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Rate
            </p>
          </div>
        </div>
      ) : null}

      {/* Message */}
      {message ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-strong)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)]">
          {message}
        </div>
      ) : null}

      {/* Attendance Grid */}
      {localRecords.length > 0 ? (
        <div className="surface rounded-2xl overflow-hidden">
          {/* Session header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-soft)]">
                <svg
                  className="h-4 w-4 text-[var(--color-primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-heading)]">
                  {viewMode === "faculty" ? "Faculty" : "Students"} Attendance
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {new Date(selectedDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-success)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />{" "}
                {stats.present} Present
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-danger)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />{" "}
                {stats.absent} Absent
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-amber)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-amber)]" />{" "}
                {stats.late} Late
              </span>
              {stats.unmarked > 0 ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-muted)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-border)]" />{" "}
                  {stats.unmarked} Unmarked
                </span>
              ) : null}
            </div>
          </div>

          {/* Actions bar */}
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => markAll("present")}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3 py-1.5 text-xs font-bold text-[var(--color-success)] transition hover:bg-[var(--color-success)]/20"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                All Present
              </button>
              <button
                type="button"
                onClick={() => markAll("absent")}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-1.5 text-xs font-bold text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/20"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                All Absent
              </button>
              <div className="relative ml-auto max-w-[200px] flex-1">
                <svg
                  className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--color-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name..."
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1.5 pl-9 pr-3 text-xs text-[var(--color-heading)] outline-none transition focus:border-[var(--color-primary)]"
                />
              </div>
              {lastSaved ? (
                <span className="text-[10px] text-[var(--color-muted)]">
                  Saved: {lastSaved}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Person cards */}
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-6">
            {filteredPeople.map((person) => {
              const record = localRecords.find((r) => r.personId === person.id);
              const status = record?.status ?? "unmarked";
              const cfg = STATUS_CONFIG[status];
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => cycleStatus(person.id)}
                  disabled={!canEdit || (viewMode === "faculty" && !isAdmin)}
                  className={`relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    !canEdit || (viewMode === "faculty" && !isAdmin)
                      ? "cursor-default border-[var(--color-border)]"
                      : status === "unmarked"
                        ? "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm cursor-pointer"
                        : "border-transparent cursor-pointer"
                  } ${cfg.bg}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(person.id)} text-sm font-bold text-white shadow-sm`}
                  >
                    {getInitials(person.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                      {person.name}
                    </p>
                    <p className="truncate text-[10px] text-[var(--color-muted)]">
                      {viewMode === "faculty" ? "Faculty" : person.id}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-[10px] font-bold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredPeople.length === 0 && search ? (
            <div className="px-6 pb-6 text-center text-sm text-[var(--color-muted)]">
              No {viewMode} match &quot;{search}&quot;
            </div>
          ) : null}

          {/* Footer */}
          <div className="border-t border-[var(--color-border)] px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-[var(--color-heading)]">
                {filteredPeople.length}{" "}
                {viewMode === "faculty" ? "faculty" : "student"}
                {filteredPeople.length !== 1 ? "s" : ""} · {stats.unmarked}{" "}
                unmarked
              </p>
              {canEdit && !(viewMode === "faculty" && !isAdmin) ? (
                <button
                  type="button"
                  onClick={saveAttendance}
                  disabled={isSaving || !hasUnsaved}
                  className="btn-action btn-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Saving..."
                    : hasUnsaved
                      ? "Save Changes"
                      : "No Changes"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Empty state */}
      {localRecords.length === 0 && canEdit ? (
        <div className="surface rounded-2xl p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)]">
            <svg
              className="h-6 w-6 text-[var(--color-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="mt-4 text-lg font-bold text-[var(--color-heading)]">
            No Attendance Loaded
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Select a date and subject above, then click Load Attendance.
          </p>
        </div>
      ) : null}
    </section>
  );
}
