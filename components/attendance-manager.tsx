"use client";

import { useEffect, useMemo, useState } from "react";
import { DailyStudentAttendanceManager } from "@/components/daily-student-attendance-manager";

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

  "excused",
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

  excused: {
    label: "Leave",

    bg: "bg-blue-50",

    color: "text-blue-700",

    dot: "bg-blue-500",
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

function getStudentCourse(student: ManagedUser): string {
  return (
    student.profile?.courseWantedTitle?.trim() ||
    student.profile?.courseWanted?.trim() ||
    student.program?.trim() ||
    "Not assigned"
  );
}

function getStudentBranch(student: ManagedUser): string {
  return (
    student.profile?.branch?.trim() ||
    student.profile?.campusLocationTitle?.trim() ||
    student.profile?.campusLocation?.trim() ||
    "Not assigned"
  );
}

const ALL_BATCHES = "__all__";

const UNASSIGNED_BATCH = "__unassigned__";

function getStudentBatch(student: ManagedUser): string {
  return student.batchName?.trim() || "";
}

function getBatchLabel(batch: string): string {
  if (batch === ALL_BATCHES) return "All Students";

  if (batch === UNASSIGNED_BATCH) return "Unassigned";

  return batch;
}

function studentSessionKey(
  course: string,

  branch: string,

  batch: string,

  subject: string,
): string {
  const subjectKey = encodeURIComponent(subject.trim().toLowerCase());

  const baseKey = `student:v2:${encodeURIComponent(course)}:${encodeURIComponent(branch)}:${subjectKey}`;

  // Keep the existing v2 key for All Students so previously saved attendance
  // continues to load exactly as before.
  if (batch === ALL_BATCHES) {
    return baseKey;
  }

  const batchKey = batch === UNASSIGNED_BATCH ? "unassigned" : batch;

  return `student:v3:${encodeURIComponent(course)}:${encodeURIComponent(branch)}:${encodeURIComponent(batchKey)}:${subjectKey}`;
}

export function AttendanceManager({
  role,

  attendanceSheets,

  studentDirectory,

  managedUsers,

  userId,

  embedded = false,
}: AttendanceManagerProps) {
  const canEdit = role === "admin" || role === "educator" || (role === "staff" || role === "counsellor");

  const isAdmin = role === "admin" || role === "educator";

  const [selectedDate, setSelectedDate] = useState(
    toLocalDateString(new Date()),
  );

  const [subject, setSubject] = useState("");

  const [selectedCourse, setSelectedCourse] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("");

  const [selectedBatch, setSelectedBatch] = useState(ALL_BATCHES);

  const [loadedSessionKey, setLoadedSessionKey] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");

  const [viewMode, setViewMode] = useState<"students" | "faculty">("students");

  const [localRecords, setLocalRecords] = useState<
    {
      personId: string;

      personName: string;

      status: AttendanceStatus | "unmarked";
    }[]
  >([]);

  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);

  const [preservedRecords, setPreservedRecords] = useState<
    AttendanceSheet["records"]
  >([]);

  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [hasUnsaved, setHasUnsaved] = useState(false);

  const [lastSaved, setLastSaved] = useState("");

  const allStudents = useMemo(() => {
    return studentDirectory.filter((student) => student.role === "student");
  }, [studentDirectory]);

  const courseOptions = useMemo(
    () => [...new Set(allStudents.map(getStudentCourse))].sort(),

    [allStudents],
  );

  const branchOptions = useMemo(
    () =>
      [
        ...new Set(
          allStudents

            .filter((student) => getStudentCourse(student) === selectedCourse)

            .map(getStudentBranch),
        ),
      ].sort(),

    [allStudents, selectedCourse],
  );

  const batchOptions = useMemo(
    () =>
      [
        ...new Set(
          allStudents

            .filter(
              (student) =>
                !!selectedCourse &&
                !!selectedBranch &&
                getStudentCourse(student) === selectedCourse &&
                getStudentBranch(student) === selectedBranch,
            )

            .map(getStudentBatch)

            .filter((batch): batch is string => Boolean(batch)),
        ),
      ].sort(),

    [allStudents, selectedCourse, selectedBranch],
  );

  const selectedBatchLabel = getBatchLabel(selectedBatch);

  const scopedStudents = useMemo(
    () =>
      allStudents.filter((student) => {
        if (!selectedCourse || !selectedBranch) return false;

        if (getStudentCourse(student) !== selectedCourse) return false;

        if (getStudentBranch(student) !== selectedBranch) return false;

        const batch = getStudentBatch(student);

        if (selectedBatch === ALL_BATCHES) return true;

        if (selectedBatch === UNASSIGNED_BATCH) return !batch;

        return batch === selectedBatch;
      }),

    [allStudents, selectedCourse, selectedBranch, selectedBatch],
  );

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();

    return scopedStudents.filter(
      (student) =>
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query),
    );
  }, [scopedStudents, search]);

  function resetLoadedAttendance() {
    if (hasUnsaved && !window.confirm("Discard unsaved attendance changes?")) {
      return false;
    }

    setLocalRecords([]);

    setActiveSheetId(null);

    setPreservedRecords([]);

    setLoadedSessionKey("");

    setHasUnsaved(false);

    setLastSaved("");

    setMessage("");

    return true;
  }

  async function loadAttendance() {
    if (
      !selectedDate ||
      !selectedCourse ||
      !selectedBranch ||
      !subject.trim()
    ) {
      setMessage("Select date, course, branch and subject first.");

      return;
    }

    if (
      selectedCourse === "Not assigned" ||
      selectedBranch === "Not assigned"
    ) {
      setMessage(
        "Assign a course and branch to these student accounts before marking attendance.",
      );

      return;
    }

    if (!scopedStudents.length) {
      setMessage(
        "No students match the selected course, branch and batch filter.",
      );

      return;
    }

    if (hasUnsaved && !window.confirm("Discard unsaved attendance changes?")) {
      return;
    }

    setIsLoading(true);

    setMessage("");

    try {
      // Always read current records from the database, not the initial

      // dashboard snapshot. Legacy sheets keep their original IDs untouched.

      const response = await fetch("/api/attendance", {
        cache: "no-store",

        credentials: "same-origin",
      });

      const payload = (await response.json()) as {
        attendanceSheets?: AttendanceSheet[];

        error?: string;
      };

      if (!response.ok || !payload.attendanceSheets) {
        throw new Error(payload.error || "Could not load attendance.");
      }

      const sessionKey = studentSessionKey(
        selectedCourse,

        selectedBranch,

        selectedBatch,

        subject,
      );

      const existing = payload.attendanceSheets.find(
        (sheet) =>
          sheet.date === selectedDate && sheet.lectureId === sessionKey,
      );

      const recordsByStudent = new Map(
        existing?.records.map((record) => [record.studentId, record]) ?? [],
      );

      const scopedStudentIds = new Set(
        scopedStudents.map((student) => student.id),
      );

      setActiveSheetId(existing?.id ?? null);

      setPreservedRecords(
        (existing?.records ?? []).filter(
          (record) => !scopedStudentIds.has(record.studentId),
        ),
      );

      setLoadedSessionKey(sessionKey);

      setLocalRecords(
        scopedStudents.map((student) => ({
          personId: student.id,

          personName: student.name,

          status: recordsByStudent.get(student.id)?.status ?? "unmarked",
        })),
      );

      setHasUnsaved(false);

      setLastSaved("");
    } catch (cause) {
      setLocalRecords([]);

      setActiveSheetId(null);

      setPreservedRecords([]);

      setLoadedSessionKey("");

      setMessage(
        cause instanceof Error ? cause.message : "Unable to load attendance.",
      );
    } finally {
      setIsLoading(false);
    }
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
    const present = localRecords.filter(
      (record) => record.status === "present",
    ).length;

    const absent = localRecords.filter(
      (record) => record.status === "absent",
    ).length;

    const late = localRecords.filter(
      (record) => record.status === "late",
    ).length;

    const leave = localRecords.filter(
      (record) => record.status === "excused",
    ).length;

    const unmarked = localRecords.filter(
      (record) => record.status === "unmarked",
    ).length;

    const eligible = present + absent + late;

    const pct =
      eligible > 0 ? Math.round(((present + late) / eligible) * 100) : null;

    return {
      present,
      absent,
      late,
      leave,
      unmarked,
      total: localRecords.length,
      pct,
    };
  }, [localRecords]);

  async function saveAttendance() {
    if (!canEdit || !selectedDate) return;

    if (viewMode === "faculty" && !isAdmin) return;

    const expectedKey = studentSessionKey(
      selectedCourse,

      selectedBranch,

      selectedBatch,

      subject,
    );

    if (!loadedSessionKey || expectedKey !== loadedSessionKey) {
      setMessage("Filters changed. Load attendance again before saving.");

      return;
    }

    if (!localRecords.some((record) => record.status !== "unmarked")) {
      setMessage("Mark at least one student before saving.");

      return;
    }

    setIsSaving(true);

    setMessage("");

    const editedRecords = localRecords

      .filter((r) => r.status !== "unmarked")

      .map((r) => ({
        studentId: r.personId,

        studentName: r.personName,

        status: r.status as AttendanceStatus,
      }));

    // PATCH replaces the complete records array, so keep any historical
    // records that are no longer inside the currently selected batch scope.
    const records = [...preservedRecords, ...editedRecords];

    const sheetType = loadedSessionKey;

    try {
      if (activeSheetId) {
        const res = await fetch(`/api/attendance/${activeSheetId}`, {
          method: "PATCH",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ records, subject: subject.trim() }),
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
            title: `Student Attendance - ${selectedCourse} - ${selectedBranch} - ${selectedBatchLabel} - ${subject.trim()} - ${selectedDate}`,

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

  if (canEdit) {
    return (
      <DailyStudentAttendanceManager
        studentDirectory={studentDirectory}
      />
    );
  }

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

                  excused: { bg: "#DBEAFE", text: "#2563EB", label: "Lv" },
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

            {/* Complete student directory for attendance managers */}
      {canEdit ? (
        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0B40A1]">
                Student Directory
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-900">
                All Registered Students
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {allStudents.length} students in the available directory.
                Select a course, branch and subject below to mark attendance.
              </p>
            </div>

            <input
              type="search"
              value={directorySearch}
              onChange={(event) => setDirectorySearch(event.target.value)}
              placeholder="Search name, ID, course or branch"
              aria-label="Search all students"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 sm:max-w-xs"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {allStudents
              .filter((student) => {
                const query = directorySearch.trim().toLowerCase();

                return (
                  !query ||
                  student.name.toLowerCase().includes(query) ||
                  student.id.toLowerCase().includes(query) ||
                  getStudentCourse(student).toLowerCase().includes(query) ||
                  getStudentBranch(student).toLowerCase().includes(query)
                );
              })
              .map((student) => (
                <div
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {student.id}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold text-[#0B40A1]">
                      {getStudentCourse(student)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getStudentBranch(student)}
                      {getStudentBatch(student)
                        ? ` / ${getStudentBatch(student)}`
                        : ""}
                    </p>
                  </div>
                </div>
              ))}

            {allStudents.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No students were supplied to this dashboard.
                Student directory access needs to be checked.
              </div>
            ) : null}

            {allStudents.length > 0 &&
            !allStudents.some((student) => {
              const query = directorySearch.trim().toLowerCase();

              return (
                !query ||
                student.name.toLowerCase().includes(query) ||
                student.id.toLowerCase().includes(query) ||
                getStudentCourse(student).toLowerCase().includes(query) ||
                getStudentBranch(student).toLowerCase().includes(query)
              );
            }) ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No students match your search.
              </div>
            ) : null}
          </div>
        </section>
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
                onChange={(e) => {
                  if (resetLoadedAttendance()) setSelectedDate(e.target.value);
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Course
              </p>

              <select
                value={selectedCourse}
                onChange={(event) => {
                  if (resetLoadedAttendance()) {
                    setSelectedCourse(event.target.value);

                    setSelectedBranch("");

                    setSelectedBatch(ALL_BATCHES);
                  }
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)]"
              >
                <option value="">Select course</option>

                {courseOptions.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[180px] flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Branch
              </p>

              <select
                value={selectedBranch}
                disabled={!selectedCourse}
                onChange={(event) => {
                  if (resetLoadedAttendance()) {
                    setSelectedBranch(event.target.value);

                    setSelectedBatch(ALL_BATCHES);
                  }
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] disabled:opacity-50"
              >
                <option value="">Select branch</option>

                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[180px] flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Batch
              </p>

              <select
                value={selectedBatch}
                disabled={!selectedCourse || !selectedBranch}
                onChange={(event) => {
                  if (resetLoadedAttendance())
                    setSelectedBatch(event.target.value);
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] disabled:opacity-50"
              >
                <option value={ALL_BATCHES}>All Students</option>

                {batchOptions.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}

                <option value={UNASSIGNED_BATCH}>Unassigned</option>
              </select>
            </div>

            <div className="min-w-[140px] flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Subject
              </p>

              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  if (resetLoadedAttendance()) setSubject(e.target.value);
                }}
                placeholder="e.g. Mathematics"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)]"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadAttendance()}
              disabled={
                isLoading ||
                !selectedCourse ||
                !selectedBranch ||
                selectedCourse === "Not assigned" ||
                selectedBranch === "Not assigned" ||
                !subject.trim()
              }
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

              {isLoading ? "Loading..." : "Load Attendance"}
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
              {stats.pct === null ? "—" : `${stats.pct}%`}
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
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 3h8l4 4v14H4V3h4zm0 8h8m-8 4h8"
                  />
                </svg>
              </div>

              <h3 className="text-base font-bold text-slate-800">
                Attendance for {selectedDate}
              </h3>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  if (resetLoadedAttendance()) {
                    setSelectedDate(event.target.value);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => markAll("present")}
                disabled={!canEdit || isSaving}
                className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                All Present
              </button>

              <button
                type="button"
                onClick={() => markAll("absent")}
                disabled={!canEdit || isSaving}
                className="rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
              >
                All Absent
              </button>

              <button
                type="button"
                onClick={() => void saveAttendance()}
                disabled={!canEdit || isSaving || !hasUnsaved}
                className="rounded-full bg-[#4F46E5] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>

          {/* Filters summary and search */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-3">
            <div className="text-xs font-medium text-slate-600">
              {selectedCourse} / {selectedBranch} / {selectedBatchLabel}
              {" / "}
              {subject}
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student name or ID"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 sm:w-64"
            />
          </div>

          {/* Student table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#F1F5F9] text-slate-500">
                  <th className="px-5 py-4 font-bold">
                    Student Name
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Course
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Batch
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPeople.map((person) => {
                  const record = localRecords.find(
                    (item) => item.personId === person.id
                  );

                  const status = record?.status ?? "unmarked";

                  const initials = person.name
                    .split(" ")
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={person.id}
                      className="border-b border-slate-200 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600">
                            {initials}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-800">
                              {person.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {person.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">
                          {getStudentCourse(person)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                          {getStudentBatch(person) || "Unassigned"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={status}
                          disabled={!canEdit || isSaving}
                          onChange={(event) => {
                            const nextStatus = event.target.value as AttendanceStatus | "unmarked";

                            setLocalRecords((current) =>
                              current.map((item) =>
                                item.personId === person.id
                                  ? { ...item, status: nextStatus }
                                  : item
                              )
                            );

                            setHasUnsaved(true);
                          }}
                          className={`min-w-[175px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 ${
                            status === "present"
                              ? "bg-emerald-50 text-emerald-700"
                              : status === "absent"
                                ? "bg-red-50 text-red-600"
                                : status === "late"
                                  ? "bg-amber-50 text-amber-700"
                                  : status === "excused"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-white text-slate-700"
                          }`}
                        >
                          <option value="unmarked">
                            Mark attendance
                          </option>
                          <option value="present">
                            Present
                          </option>
                          <option value="absent">
                            Absent
                          </option>
                          <option value="late">
                            Late
                          </option>
                          <option value="excused">
                            On Leave
                          </option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredPeople.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No students match your search.
            </div>
          ) : null}

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold text-slate-600">
              {filteredPeople.length} students shown
              {" | "}
              {stats.present} present
              {" | "}
              {stats.absent} absent
              {" | "}
              {stats.unmarked} unmarked
            </p>

            {lastSaved ? (
              <p className="text-xs font-semibold text-emerald-600">
                Last saved: {lastSaved}
              </p>
            ) : null}
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
            Select a date, course, branch, batch filter and subject above, then
            click Load Attendance. Batch is optional: choose “All Students” for
            everyone or “Unassigned” for students without a batch. Students
            without an assigned course or branch still appear under “Not
            assigned”.
          </p>
        </div>
      ) : null}
    </section>
  );
}
