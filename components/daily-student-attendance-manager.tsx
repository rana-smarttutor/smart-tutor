"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  GraduationCap,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Users,
  X,
} from "lucide-react";

import type {
  AttendanceSheet,
  AttendanceStatus,
  ManagedUser,
} from "@/lib/types";

type Mark = AttendanceStatus | "unmarked";

type Entry = {
  studentId: string;
  studentName: string;
  status: Mark;
};

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

type AttendanceTab = "daily" | "lecture" | "history";

const DAILY_KEY = "student:daily:v1";

const MARKS: Mark[] = ["present", "absent", "late", "excused", "unmarked"];

const MARK_CONFIG: Record<
  string,
  {
    label: string;
    short: string;
    active: string;
    inactive: string;
    dot: string;
  }
> = {
  present: {
    label: "Present",
    short: "P",
    active: "border-emerald-500 bg-emerald-500 text-white",
    inactive:
      "border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-300",
    dot: "bg-emerald-500",
  },
  absent: {
    label: "Absent",
    short: "A",
    active: "border-red-500 bg-red-500 text-white",
    inactive: "border-red-100 bg-red-50 text-red-600 hover:border-red-300",
    dot: "bg-red-500",
  },
  late: {
    label: "Late",
    short: "L",
    active: "border-amber-500 bg-amber-500 text-white",
    inactive:
      "border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-300",
    dot: "bg-amber-500",
  },
  excused: {
    label: "Leave",
    short: "LV",
    active: "border-blue-500 bg-blue-500 text-white",
    inactive: "border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-300",
    dot: "bg-blue-500",
  },
  unmarked: {
    label: "Unmarked",
    short: "—",
    active: "border-slate-500 bg-slate-600 text-white",
    inactive:
      "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300",
    dot: "bg-slate-400",
  },
};

function localDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function courseOf(student: ManagedUser) {
  return (
    student.profile?.courseWantedTitle?.trim() ||
    student.profile?.courseWanted?.trim() ||
    student.program?.trim() ||
    "Unassigned"
  );
}

function classRank(value: string) {
  const text = value.toLowerCase().trim();

  const match = text.match(
    /(?:class|grade|standard|std\.?)?\s*[-:]?\s*(\d{1,2})(?:st|nd|rd|th)?\b/i,
  );

  if (match) {
    const number = Number(match[1]);

    if (number >= 1 && number <= 12) {
      return number;
    }
  }

  if (/nursery|pre.?primary|play.?group/.test(text)) {
    return -2;
  }

  if (/kindergarten|\bkg\b|lkg|ukg/.test(text)) {
    return -1;
  }

  if (/college|b\.?sc|b\.?com|bba|bca|undergrad|university/.test(text)) {
    return 20;
  }

  if (/postgraduate|post.?grad|m\.?sc|mca|mba/.test(text)) {
    return 25;
  }

  if (/competitive|ssc|upsc|neet|jee|bank|government|mht.?cet/.test(text)) {
    return 30;
  }

  return 40;
}

function classLabel(student: ManagedUser) {
  const course = courseOf(student);
  const rank = classRank(course);

  if (rank >= 1 && rank <= 12) {
    return `Class ${rank}`;
  }

  return course;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getCounts(students: ManagedUser[], statusMap: Map<string, Mark>) {
  const counts = {
    total: students.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    unmarked: 0,
  };

  for (const student of students) {
    const status = statusMap.get(student.id) ?? "unmarked";

    if (status in counts) {
      counts[status as keyof Omit<typeof counts, "total">]++;
    }
  }

  return counts;
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex min-h-[94px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-2xl font-bold tracking-tight text-[#0A193A]">
          {value}
        </p>
      </div>
    </div>
  );
}

export function DailyStudentAttendanceManager({
  studentDirectory,
}: {
  studentDirectory: ManagedUser[];
}) {
  const [date, setDate] = useState(localDate);
  const [search, setSearch] = useState("");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [feedback, setFeedback] = useState<Feedback>(null);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [tab, setTab] = useState<AttendanceTab>("daily");

  const students = useMemo(() => {
    return studentDirectory
      .filter((student) => student.role === "student")
      .sort(
        (a, b) =>
          classRank(courseOf(a)) - classRank(courseOf(b)) ||
          classLabel(a).localeCompare(classLabel(b), undefined, {
            numeric: true,
          }) ||
          a.name.localeCompare(b.name),
      );
  }, [studentDirectory]);

  const load = useCallback(
    async (cancelled?: () => boolean) => {
      setLoading(true);
      setLoadError(false);
      setFeedback(null);

      try {
        const response = await fetch("/api/attendance", {
          credentials: "same-origin",
          cache: "no-store",
        });

        const result = (await response.json()) as {
          attendanceSheets?: AttendanceSheet[];
          error?: string;
        };

        if (!response.ok || !Array.isArray(result.attendanceSheets)) {
          throw new Error(result.error || "Unable to load attendance.");
        }

        if (cancelled?.()) return;

        const found =
          result.attendanceSheets
            .filter(
              (item) => item.date === date && item.lectureId === DAILY_KEY,
            )
            .at(-1) ?? null;

        const byId = new Map(
          found?.records.map((record) => [record.studentId, record.status]) ??
            [],
        );

        setSheet(found);

        setEntries(
          students.map((student) => ({
            studentId: student.id,
            studentName: student.name,
            status: byId.get(student.id) ?? "unmarked",
          })),
        );

        setDirty(false);
      } catch (error) {
        if (cancelled?.()) return;

        setLoadError(true);

        setFeedback({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Unable to load attendance.",
        });
      } finally {
        if (!cancelled?.()) {
          setLoading(false);
        }
      }
    },
    [date, students],
  );

  useEffect(() => {
    let cancelled = false;

    void load(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;

      event.preventDefault();
    }

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [dirty]);

  function changeDate(next: string) {
    if (!next || next === date) return;

    if (dirty && !window.confirm("Discard unsaved attendance changes?")) {
      return;
    }

    setCollapsed({});
    setDate(next);
  }

  function setOne(id: string, status: Mark) {
    if (saving || loading || loadError) return;

    setEntries((previous) =>
      previous.map((entry) =>
        entry.studentId === id ? { ...entry, status } : entry,
      ),
    );

    setDirty(true);
    setFeedback(null);
  }

  function setMany(ids: string[], status: Mark) {
    if (saving || loading || loadError || !ids.length) {
      return;
    }

    const idSet = new Set(ids);

    setEntries((previous) =>
      previous.map((entry) =>
        idSet.has(entry.studentId) ? { ...entry, status } : entry,
      ),
    );

    setDirty(true);
    setFeedback(null);
  }

  function setAll(status: Mark) {
    setMany(
      students.map((student) => student.id),
      status,
    );
  }

  function toggleGroup(label: string) {
    setCollapsed((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  }

  async function save() {
    if (saving || loading || loadError || !dirty) {
      return;
    }

    const marked = entries
      .filter((entry) => entry.status !== "unmarked")
      .map((entry) => ({
        studentId: entry.studentId,
        studentName: entry.studentName,
        status: entry.status as AttendanceStatus,
      }));

    if (!marked.length) {
      setFeedback({
        type: "error",
        text: "Mark at least one student before saving.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const knownIds = new Set(students.map((student) => student.id));

      const preserved = (sheet?.records ?? []).filter(
        (record) => !knownIds.has(record.studentId),
      );

      const records = [...preserved, ...marked];

      const response = await fetch(
        sheet ? `/api/attendance/${sheet.id}` : "/api/attendance",
        {
          method: sheet ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            sheet
              ? {
                  records,
                  subject: "Daily Attendance",
                }
              : {
                  title: `Daily Student Attendance - ${date}`,
                  date,
                  lectureId: DAILY_KEY,
                  subject: "Daily Attendance",
                  records,
                },
          ),
        },
      );

      const result = (await response.json()) as {
        attendanceSheet?: AttendanceSheet;
        error?: string;
      };

      if (!response.ok || !result.attendanceSheet) {
        throw new Error(result.error || "Unable to save attendance.");
      }

      setSheet(result.attendanceSheet);
      setDirty(false);

      setFeedback({
        type: "success",
        text: "Student attendance saved successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error ? error.message : "Unable to save attendance.",
      });
    } finally {
      setSaving(false);
    }
  }

  const entryById = useMemo(
    () => new Map(entries.map((entry) => [entry.studentId, entry.status])),
    [entries],
  );

  const query = search.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!query) return students;

    return students.filter((student) =>
      [
        student.name,
        student.id,
        courseOf(student),
        classLabel(student),
        student.batchName ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [students, query]);

  const groups = useMemo(() => {
    const result = new Map<string, ManagedUser[]>();

    for (const student of visible) {
      const label = classLabel(student);
      const current = result.get(label) ?? [];

      current.push(student);
      result.set(label, current);
    }

    return Array.from(result.entries());
  }, [visible]);

  const stats = getCounts(students, entryById);

  const controlsDisabled = loading || saving || loadError;

  const attendanceTabs: {
    key: AttendanceTab;
    label: string;
  }[] = [
    { key: "daily", label: "Daily Attendance" },
    { key: "lecture", label: "Lecture Attendance" },
    { key: "history", label: "History" },
  ];

  return (
    <section className="min-w-0 space-y-5 pb-24">
      {/* Page heading */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5546E8]">
            Attendance Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0A193A] sm:text-3xl">
            Student Attendance
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage daily attendance for all students, organised from the lowest
            class to the highest.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <CalendarDays size={18} className="text-[#0A54B7]" />

          <div>
            <p className="text-[10px] font-semibold text-slate-400">
              Selected Date
            </p>

            <p className="text-xs font-bold text-slate-800">
              {formatDate(date)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Students"
          value={stats.total}
          icon={<Users size={21} />}
          color="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          label="Present"
          value={stats.present}
          icon={<CheckCheck size={21} />}
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          label="Absent"
          value={stats.absent}
          icon={<X size={21} />}
          color="bg-red-50 text-red-600"
        />

        <StatCard
          label="Late"
          value={stats.late}
          icon={<Clock3 size={21} />}
          color="bg-amber-50 text-amber-600"
        />

        <StatCard
          label="On Leave"
          value={stats.excused}
          icon={<CalendarDays size={21} />}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Unmarked"
          value={stats.unmarked}
          icon={<CircleAlert size={21} />}
          color="bg-slate-100 text-slate-600"
        />
      </div>

      {/* Main attendance panel */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Tabs */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 pt-3 sm:px-5">
          <div className="flex flex-wrap gap-1">
            {attendanceTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`border-b-2 px-4 py-3 text-xs font-bold transition sm:text-sm ${
                  tab === item.key
                    ? "border-[#0A54B7] text-[#0A54B7]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {dirty && (
            <span className="mb-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              Unsaved changes
            </span>
          )}
        </div>

        {tab === "daily" ? (
          <>
            {/* Search and date toolbar */}

            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <div className="relative w-full max-w-lg">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search students by name, ID, class or batch"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0A54B7] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <input
                  type="date"
                  value={date}
                  disabled={saving}
                  onChange={(event) => changeDate(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#0A54B7]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={controlsDisabled || !students.length}
                  onClick={() => setAll("present")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  <Check size={15} />
                  All Present
                </button>

                <button
                  type="button"
                  disabled={controlsDisabled || !students.length}
                  onClick={() => setAll("absent")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <X size={15} />
                  All Absent
                </button>

                <button
                  type="button"
                  disabled={controlsDisabled || !dirty}
                  onClick={() => void save()}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0A54B7] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#084899] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>

            {/* Feedback */}

            {feedback && (
              <div
                role="status"
                className={`mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <span>{feedback.text}</span>

                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  aria-label="Dismiss message"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Student register */}

            <div className="px-3 py-4 sm:px-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[#0A193A]">
                    Class-wise Attendance Register
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    All enrolled students are displayed automatically.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0A54B7]">
                  {visible.length} Students Shown
                </span>
              </div>

              {loading ? (
                <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
                  <Loader2 size={20} className="animate-spin" />
                  Loading attendance...
                </div>
              ) : loadError ? (
                <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                  <CircleAlert size={28} className="text-red-600" />

                  <p className="text-sm font-semibold text-red-700">
                    Attendance could not be loaded. Editing is disabled to
                    protect existing records.
                  </p>

                  <button
                    type="button"
                    onClick={() => void load()}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm"
                  >
                    <RotateCcw size={15} />
                    Try Again
                  </button>
                </div>
              ) : groups.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-500">
                  <GraduationCap size={30} />

                  <p className="text-sm font-semibold">
                    {search
                      ? "No students match your search."
                      : "No student accounts found."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map(([label, members]) => {
                    const counts = getCounts(members, entryById);

                    const isCollapsed = collapsed[label] ?? false;

                    return (
                      <div
                        key={label}
                        className="overflow-hidden rounded-xl border border-slate-200"
                      >
                        {/* Class heading */}

                        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F2F6FD] px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleGroup(label)}
                            className="flex min-w-0 items-center gap-3 text-left"
                            aria-expanded={!isCollapsed}
                          >
                            {isCollapsed ? (
                              <ChevronRight
                                size={17}
                                className="text-[#0A54B7]"
                              />
                            ) : (
                              <ChevronDown
                                size={17}
                                className="text-[#0A54B7]"
                              />
                            )}

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#0A54B7] shadow-sm">
                              <GraduationCap size={18} />
                            </div>

                            <div>
                              <p className="text-sm font-bold text-[#0A193A]">
                                {label}
                              </p>

                              <p className="text-[11px] text-slate-500">
                                {members.length}{" "}
                                {members.length === 1 ? "student" : "students"}
                              </p>
                            </div>
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                              {counts.present} Present
                            </span>

                            <span className="rounded-md bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">
                              {counts.absent} Absent
                            </span>

                            <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700">
                              {counts.late} Late
                            </span>

                            <span className="rounded-md bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700">
                              {counts.excused} Leave
                            </span>

                            <button
                              type="button"
                              disabled={controlsDisabled}
                              onClick={() =>
                                setMany(
                                  members.map((student) => student.id),
                                  "present",
                                )
                              }
                              className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-[#0A54B7] px-3 py-2 text-[11px] font-bold text-white transition hover:bg-[#084899] disabled:opacity-50"
                            >
                              <Check size={14} />
                              Mark Class Present
                            </button>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[780px] text-left">
                              <thead>
                                <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  <th className="w-14 px-4 py-3">#</th>

                                  <th className="min-w-[190px] px-4 py-3">
                                    Student
                                  </th>

                                  <th className="px-4 py-3">Class / Course</th>

                                  <th className="px-4 py-3">Batch</th>

                                  <th className="min-w-[285px] px-4 py-3">
                                    Attendance Status
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {members.map((student, index) => {
                                  const current =
                                    entryById.get(student.id) ?? "unmarked";

                                  return (
                                    <tr
                                      key={student.id}
                                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80"
                                    >
                                      <td className="px-4 py-3 text-xs font-medium text-slate-500">
                                        {index + 1}
                                      </td>

                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#0A54B7]">
                                            {initials(student.name)}
                                          </div>

                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#0A193A]">
                                              {student.name}
                                            </p>

                                            <p className="max-w-[180px] truncate text-[10px] text-slate-400">
                                              ID: {student.id}
                                            </p>
                                          </div>
                                        </div>
                                      </td>

                                      <td className="px-4 py-3 text-xs font-medium text-slate-600">
                                        {courseOf(student)}
                                      </td>

                                      <td className="px-4 py-3 text-xs text-slate-500">
                                        {student.batchName || "Unassigned"}
                                      </td>

                                      <td className="px-4 py-3">
                                        <div
                                          className="flex flex-nowrap items-center gap-1"
                                          role="group"
                                          aria-label={`Attendance for ${student.name}`}
                                        >
                                          {MARKS.map((status) => {
                                            const config = MARK_CONFIG[status];

                                            const selected = current === status;

                                            return (
                                              <button
                                                key={status}
                                                type="button"
                                                disabled={controlsDisabled}
                                                onClick={() =>
                                                  setOne(student.id, status)
                                                }
                                                title={config.label}
                                                aria-label={`${student.name}: ${config.label}`}
                                                aria-pressed={selected}
                                                className={`min-h-9 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                  selected
                                                    ? config.active
                                                    : config.inactive
                                                }`}
                                              >
                                                {config.short}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Register footer */}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
              <span>
                Showing {visible.length} of {students.length} students
              </span>

              <span>
                {stats.unmarked} unmarked · {stats.present} present
              </span>
            </div>
          </>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <CalendarDays size={32} className="text-[#0A54B7]" />

            <h3 className="text-base font-bold text-[#0A193A]">
              {tab === "lecture" ? "Lecture Attendance" : "Attendance History"}
            </h3>

            <p className="max-w-md text-sm text-slate-500">
              {tab === "lecture"
                ? "Lecture-wise attendance remains managed through the existing lecture attendance module. This daily attendance redesign does not change it."
                : "Historical attendance remains available through the existing SmartIQ attendance reporting module."}
            </p>

            <button
              type="button"
              onClick={() => setTab("daily")}
              className="rounded-lg bg-[#0A54B7] px-4 py-2 text-xs font-bold text-white"
            >
              Back to Daily Attendance
            </button>
          </div>
        )}
      </div>

      {/* Sticky save bar */}

      {tab === "daily" && dirty && !loadError && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_25px_rgba(15,23,42,0.10)] backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CircleAlert size={19} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#0A193A]">
                  Unsaved attendance changes
                </p>

                <p className="text-xs text-slate-500">
                  Save to record attendance for {formatDate(date)}.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => void save()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A54B7] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#084899] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
