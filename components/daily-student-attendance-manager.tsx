"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  Loader2,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";

import type {
  AttendanceSheet,
  AttendanceStatus,
  ManagedUser,
} from "@/lib/types";

// ======================================================
// TYPES
// ======================================================

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

type ProgramCategory =
  | "Government Exams"
  | "Competitive Exams"
  | "Skill Programs";

type StudentGroup = {
  label: string;
  members: ManagedUser[];
};

type CategoryGroup = {
  category: ProgramCategory;
  members: ManagedUser[];
  courses: string[];
};

// ======================================================
// CONSTANTS
// ======================================================

const DAILY_KEY = "student:daily:v1";

const SCHOOL_CLASSES = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const PROGRAM_CATEGORIES: ProgramCategory[] = [
  "Government Exams",
  "Competitive Exams",
  "Skill Programs",
];

const ATTENDANCE_OPTIONS: AttendanceStatus[] = ["present", "absent", "excused"];

const MARK_CONFIG: Record<
  Mark,
  {
    label: string;
    active: string;
    inactive: string;
  }
> = {
  present: {
    label: "Present",
    active: "border-emerald-600 bg-emerald-600 text-white",
    inactive:
      "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50",
  },
  absent: {
    label: "Absent",
    active: "border-red-600 bg-red-600 text-white",
    inactive:
      "border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50",
  },
  late: {
    label: "Late",
    active: "border-amber-500 bg-amber-500 text-white",
    inactive: "border-slate-200 bg-white text-slate-600",
  },
  excused: {
    label: "Leave",
    active: "border-blue-600 bg-blue-600 text-white",
    inactive:
      "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50",
  },
  unmarked: {
    label: "Not marked",
    active: "border-slate-300 bg-slate-100 text-slate-700",
    inactive: "border-slate-200 bg-white text-slate-600",
  },
};

// ======================================================
// DATE HELPERS
// ======================================================

function localDate() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ======================================================
// STUDENT COURSE HELPERS
// ======================================================

function courseOf(student: ManagedUser) {
  return (
    student.profile?.courseWantedTitle?.trim() ||
    student.profile?.courseWanted?.trim() ||
    student.program?.trim() ||
    "Unassigned"
  );
}

function coursesOf(student: ManagedUser) {
  const possibleCourses = [
    student.profile?.courseWantedTitle,
    student.profile?.courseWanted,
    student.program,
  ];

  const courses = new Map<string, string>();

  for (const value of possibleCourses) {
    const course = value?.trim();

    if (!course) continue;

    // Treat different separators and spacing as the same course.
    // Example:
    // "Class 6 — State Board / SSC"
    // "Class 6 | State Board / SSC"
    // Both generate the same comparison key.
    const key = course
      .toLowerCase()
      .replace(/[|–—-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!courses.has(key)) {
      courses.set(key, course);
    }
  }

  return Array.from(courses.values());
}

function classRank(value: string) {
  const match = value.match(
    /(?:class|grade|standard|std\.?)\s*[-:]?\s*(\d{1,2})(?:st|nd|rd|th)?\b/i,
  );

  if (!match) return 40;

  const number = Number(match[1]);

  if (number >= 1 && number <= 12) {
    return number;
  }

  return 40;
}

function classLabel(student: ManagedUser) {
  const rank = classRank(courseOf(student));

  return rank <= 12 ? `Class ${rank}` : courseOf(student);
}

function programCategory(course: string): ProgramCategory {
  const name = course.toLowerCase();

  if (
    /neet|jee|mht.?cet|\bcat\b|ugc.?net|\bset\b|entrance|foundation|cuet|clat/.test(
      name,
    )
  ) {
    return "Competitive Exams";
  }

  if (
    /ssc|upsc|mpsc|bank|ibps|sbi|railway|rrb|rbi|regulatory|insurance|government|police|constable|defence/.test(
      name,
    )
  ) {
    return "Government Exams";
  }

  return "Skill Programs";
}

function isSchoolStudent(student: ManagedUser) {
  const rank = classRank(courseOf(student));

  return rank >= 6 && rank <= 12;
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

    if (status === "present") counts.present++;
    else if (status === "absent") counts.absent++;
    else if (status === "late") counts.late++;
    else if (status === "excused") counts.excused++;
    else counts.unmarked++;
  }

  return counts;
}

function StatusPill({ status }: { status: Mark }) {
  const styles: Record<Mark, string> = {
    present: "bg-emerald-50 text-emerald-700",
    absent: "bg-red-50 text-red-700",
    late: "bg-amber-50 text-amber-700",
    excused: "bg-blue-50 text-blue-700",
    unmarked: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold ${styles[status]}`}
    >
      {MARK_CONFIG[status].label}
    </span>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export function DailyStudentAttendanceManager({
  studentDirectory,
}: {
  studentDirectory: ManagedUser[];
}) {
  const [date, setDate] = useState(localDate);
  const [search, setSearch] = useState("");

  const [selectedClass, setSelectedClass] = useState("Class 6");

  const [selectedCategory, setSelectedCategory] =
    useState<ProgramCategory | null>(null);

  const [entries, setEntries] = useState<Entry[]>([]);

  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [feedback, setFeedback] = useState<Feedback>(null);

  const [tab, setTab] = useState<AttendanceTab>("daily");

  // ====================================================
  // STUDENT DIRECTORY
  // ====================================================

  const students = useMemo(() => {
    const unique = new Map<string, ManagedUser>();

    for (const student of studentDirectory) {
      if (student.role !== "student") continue;

      const existing = unique.get(student.id);

      if (!existing) {
        unique.set(student.id, student);
      }
    }

    return Array.from(unique.values()).sort(
      (a, b) =>
        classRank(courseOf(a)) - classRank(courseOf(b)) ||
        a.name.localeCompare(b.name),
    );
  }, [studentDirectory]);

  // ====================================================
  // SCHOOL CLASS GROUPS
  // ====================================================

  const schoolClasses = useMemo<StudentGroup[]>(() => {
    return SCHOOL_CLASSES.map((label) => ({
      label,
      members: students.filter(
        (student) => isSchoolStudent(student) && classLabel(student) === label,
      ),
    }));
  }, [students]);

  // ====================================================
  // COMBINED PROGRAM CATEGORY GROUPS
  // ====================================================

  const courseGroups = useMemo<CategoryGroup[]>(() => {
    return PROGRAM_CATEGORIES.map((category) => {
      const uniqueStudents = new Map<string, ManagedUser>();

      const uniqueCourses = new Map<string, string>();

      for (const student of students) {
        if (isSchoolStudent(student)) {
          continue;
        }

        const matchingCourses = coursesOf(student).filter(
          (course) =>
            programCategory(course) === category && classRank(course) > 12,
        );

        if (!matchingCourses.length) {
          continue;
        }

        uniqueStudents.set(student.id, student);

        for (const course of matchingCourses) {
          const key = course.toLowerCase();

          if (!uniqueCourses.has(key)) {
            uniqueCourses.set(key, course);
          }
        }
      }

      return {
        category,
        members: Array.from(uniqueStudents.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        courses: Array.from(uniqueCourses.values()).sort(),
      };
    });
  }, [students]);

  // ====================================================
  // ACTIVE STUDENT GROUP
  // ====================================================

  const selectedGroup = useMemo(() => {
    if (!selectedCategory) return null;

    return (
      courseGroups.find((group) => group.category === selectedCategory) ?? null
    );
  }, [courseGroups, selectedCategory]);

  const activeClass = useMemo<StudentGroup>(() => {
    if (selectedCategory) {
      return {
        label: selectedCategory,
        members: selectedGroup?.members ?? [],
      };
    }

    return (
      schoolClasses.find((group) => group.label === selectedClass) ?? {
        label: selectedClass,
        members: [],
      }
    );
  }, [selectedCategory, selectedGroup, schoolClasses, selectedClass]);

  const activeClassName = activeClass.label;

  const classStudents = activeClass.members;

  const categoryStudents = selectedGroup?.members ?? [];

  // ====================================================
  // ATTENDANCE COUNTS
  // ====================================================

  const entryById = useMemo(
    () =>
      new Map<string, Mark>(
        entries.map((entry) => [entry.studentId, entry.status]),
      ),
    [entries],
  );

  const classStats = getCounts(classStudents, entryById);

  const allStats = getCounts(students, entryById);

  // ====================================================
  // SEARCH WITHIN SELECTED CATEGORY / CLASS
  // ====================================================

  const query = search.trim().toLowerCase();

  const visibleStudents = useMemo(() => {
    if (!query) return classStudents;

    return classStudents.filter((student) => {
      const values = [
        student.name,
        student.id,
        student.employeeCode ?? "",
        student.batchName ?? "",
        ...coursesOf(student),
      ];

      return values.some((value) => value.toLowerCase().includes(query));
    });
  }, [classStudents, query]);

  const controlsDisabled = loading || saving || loadError;

  // ====================================================
  // LOAD DAILY ATTENDANCE
  // ====================================================

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

  // ====================================================
  // UNSAVED CHANGES PROTECTION
  // ====================================================

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;

      event.preventDefault();
    }

    window.addEventListener("beforeunload", beforeUnload);

    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function confirmDiscard() {
    if (!dirty) return true;

    return window.confirm("Discard unsaved attendance changes?");
  }

  // ====================================================
  // DATE NAVIGATION
  // ====================================================

  function changeDate(next: string) {
    if (!next || next === date) return;

    if (!confirmDiscard()) return;

    setDate(next);
    setSearch("");
    setFeedback(null);
  }

  function moveDate(days: number) {
    const [year, month, day] = date.split("-").map(Number);

    const next = new Date(year, month - 1, day);

    next.setDate(next.getDate() + days);

    changeDate(
      [
        next.getFullYear(),
        String(next.getMonth() + 1).padStart(2, "0"),
        String(next.getDate()).padStart(2, "0"),
      ].join("-"),
    );
  }

  // ====================================================
  // SELECT SCHOOL CLASS / CATEGORY
  // ====================================================

  function chooseSchoolClass(label: string) {
    setSelectedCategory(null);
    setSelectedClass(label);
    setSearch("");
    setFeedback(null);
  }

  function chooseCategory(category: ProgramCategory) {
    setSelectedCategory(category);
    setSelectedClass("");
    setSearch("");
    setFeedback(null);
  }

  // ====================================================
  // MARK ATTENDANCE
  // ====================================================

  function setOne(id: string, status: Mark) {
    if (controlsDisabled) return;

    setEntries((previous) =>
      previous.map((entry) =>
        entry.studentId === id ? { ...entry, status } : entry,
      ),
    );

    setDirty(true);
    setFeedback(null);
  }

  function setMany(ids: string[], status: Mark) {
    if (controlsDisabled || ids.length === 0) {
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

  function markClassPresent() {
    setMany(
      classStudents.map((student) => student.id),
      "present",
    );
  }

  function clearClass() {
    if (!classStudents.length) return;

    const confirmed = window.confirm(
      `Clear attendance marks for ${activeClassName}? Changes will not be saved until you click Save Attendance.`,
    );

    if (!confirmed) return;

    setMany(
      classStudents.map((student) => student.id),
      "unmarked",
    );
  }

  // ====================================================
  // SAVE ATTENDANCE — EXISTING API
  // ====================================================

  async function save() {
    if (controlsDisabled || !dirty) {
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

      // Keep records that are outside the
      // currently loaded student directory.
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

  // ====================================================
  // TABS
  // ====================================================

  const attendanceTabs: {
    key: AttendanceTab;
    label: string;
  }[] = [
    {
      key: "daily",
      label: "Daily Attendance",
    },
    {
      key: "lecture",
      label: "Lecture Attendance",
    },
    {
      key: "history",
      label: "History",
    },
  ];

  // ====================================================
  // STUDENT ATTENDANCE TABLE
  // ====================================================

  function renderStudentTable() {
    if (loading) {
      return (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Loading attendance...
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <CircleAlert size={28} className="text-red-600" />

          <p className="text-sm font-semibold text-red-700">
            Attendance could not be loaded. Editing is disabled to protect
            existing records.
          </p>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold"
          >
            <RotateCcw size={15} />
            Try Again
          </button>
        </div>
      );
    }

    if (!visibleStudents.length) {
      return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
          <GraduationCap size={28} />

          <p className="text-sm font-semibold">
            {search
              ? "No students match your search."
              : "No students enrolled in this category or class."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full min-w-[1000px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <th className="w-14 rounded-l-lg bg-[#F2F6FD] px-3 py-3">#</th>

              <th className="min-w-[220px] bg-[#F2F6FD] px-3 py-3">
                Student Name / ID
              </th>

              <th className="min-w-[190px] bg-[#F2F6FD] px-3 py-3">
                Enrolled Course
              </th>

              {ATTENDANCE_OPTIONS.map((status) => (
                <th
                  key={status}
                  className="w-28 bg-[#F2F6FD] px-3 py-3 text-center"
                >
                  {MARK_CONFIG[status].label}
                </th>
              ))}

              <th className="w-32 rounded-r-lg bg-[#F2F6FD] px-3 py-3 text-center">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleStudents.map((student, index) => {
              const current = entryById.get(student.id) ?? "unmarked";

              const displayCourses = selectedCategory
                ? coursesOf(student).filter(
                    (course) => programCategory(course) === selectedCategory,
                  )
                : coursesOf(student);

              return (
                <tr
                  key={student.id}
                  className={`hover:bg-blue-50/40 ${
                    current === "absent" ? "bg-red-50/40" : ""
                  }`}
                >
                  <td className="border-b border-slate-100 px-3 py-3 text-xs font-semibold text-slate-500">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="border-b border-slate-100 px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0A193A]">
                        {student.name}
                      </p>

                      <p className="mt-1 max-w-[220px] break-all text-[10px] text-slate-500">
                        ID: {student.id}
                      </p>
                    </div>
                  </td>

                  <td className="border-b border-slate-100 px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(displayCourses.length
                        ? displayCourses
                        : [courseOf(student)]
                      ).map((course) => (
                        <span
                          key={course}
                          className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>

                  {ATTENDANCE_OPTIONS.map((status) => {
                    const config = MARK_CONFIG[status];

                    const selected = current === status;

                    return (
                      <td
                        key={status}
                        className="border-b border-slate-100 px-2 py-3 text-center"
                      >
                        <button
                          type="button"
                          disabled={controlsDisabled}
                          aria-pressed={selected}
                          aria-label={`${student.name}: ${config.label}`}
                          onClick={() => setOne(student.id, status)}
                          className={`min-h-9 w-full min-w-[75px] rounded-lg border px-3 py-2 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            selected ? config.active : config.inactive
                          }`}
                        >
                          {config.label}
                        </button>
                      </td>
                    );
                  })}

                  <td className="border-b border-slate-100 px-3 py-3 text-center">
                    <StatusPill status={current} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ====================================================
  // DIRECT ATTENDANCE DETAILS
  // ====================================================

  function renderAttendanceDetails() {
    return (
      <div className="space-y-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h3 className="text-sm font-bold text-[#0A193A]">
              {activeClassName}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {classStats.total} unique enrolled student(s)
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={controlsDisabled || classStudents.length === 0}
              onClick={markClassPresent}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={14} />
              Mark All Present
            </button>

            <button
              type="button"
              disabled={controlsDisabled || classStudents.length === 0}
              onClick={clearClass}
              className="h-10 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 lg:grid-cols-4">
          {[
            {
              label: "Present",
              value: classStats.present,
              color: "text-emerald-600",
            },
            {
              label: "Absent",
              value: classStats.absent,
              color: "text-red-600",
            },
            {
              label: "Leave",
              value: classStats.excused,
              color: "text-blue-600",
            },
            {
              label: "Not Marked",
              value: classStats.unmarked,
              color: "text-slate-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="text-[11px] font-semibold text-slate-500">
                {item.label}
              </p>

              <p className={`mt-1 text-xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4">{renderStudentTable()}</div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span>
            Showing {visibleStudents.length} of {classStudents.length} students
          </span>

          <span>
            {classStats.present} Present · {classStats.absent} Absent ·{" "}
            {classStats.excused} Leave · {classStats.unmarked} Not Marked
          </span>
        </div>
      </div>
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="min-w-0 space-y-4 pb-6">
      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Attendance / Students
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0A193A]">
            Student Attendance
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => moveDate(-1)}
              disabled={saving}
              aria-label="Previous date"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="whitespace-nowrap px-2 text-xs font-semibold text-[#0A193A]">
              {formatDate(date)}
            </span>

            <button
              type="button"
              onClick={() => moveDate(1)}
              disabled={saving}
              aria-label="Next date"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <input
            type="date"
            value={date}
            disabled={saving}
            onChange={(event) => changeDate(event.target.value)}
            aria-label="Select attendance date"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#0A54B7]"
          />

          <button
            type="button"
            disabled={controlsDisabled || !dirty}
            onClick={() => void save()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0A54B7] px-4 text-xs font-bold text-white hover:bg-[#084899] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}

            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* MAIN TABS */}

      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-2">
        {attendanceTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`border-b-2 px-4 py-3 text-xs font-bold transition ${
              tab === item.key
                ? "border-[#0A54B7] text-[#0A54B7]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.label}
          </button>
        ))}

        {dirty && (
          <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
            Unsaved changes
          </span>
        )}
      </div>

      {tab === "daily" ? (
        <>
          {/* STEP 1 — SELECT CLASS OR CATEGORY */}

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#0A193A]">
                   Select Class / Program
                </h2>

                <p className="mt-1 text-[11px] text-slate-500">
                  Select a school class or program category to view all enrolled
                  students.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#0A54B7]">
                {allStats.total} Students
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {/* CLASS 6–12 */}

              {schoolClasses.map((item) => {
                const selected =
                  !selectedCategory && selectedClass === item.label;

                const counts = getCounts(item.members, entryById);

                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseSchoolClass(item.label)}
                    className={`flex min-h-[60px] items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left text-xs font-bold transition ${
                      selected
                        ? "border-[#0A54B7] bg-[#0A54B7] text-white"
                        : "border-slate-200 bg-white text-[#0A193A] hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <span>{item.label}</span>

                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] ${
                        selected ? "bg-white/20" : "bg-blue-50 text-[#0A54B7]"
                      }`}
                    >
                      {counts.total - counts.unmarked}/{counts.total}
                    </span>
                  </button>
                );
              })}

              {/* PROGRAM CATEGORIES — NO COURSE DROPDOWNS */}

              {courseGroups.map(({ category, members }) => {
                const selected = selectedCategory === category;

                const counts = getCounts(members, entryById);

                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseCategory(category)}
                    className={`flex min-h-[60px] items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left text-xs font-bold transition ${
                      selected
                        ? "border-[#0A54B7] bg-[#0A54B7] text-white"
                        : "border-slate-200 bg-white text-[#0A193A] hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <span className="break-words">{category}</span>

                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] ${
                        selected ? "bg-white/20" : "bg-blue-50 text-[#0A54B7]"
                      }`}
                    >
                      {counts.total - counts.unmarked}/{counts.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2 — COMBINED STUDENT LIST */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h2 className="text-sm font-bold text-[#0A193A]">
                  {activeClassName || "Student Attendance"}
                </h2>

                <p className="mt-1 text-[11px] text-slate-500">
                  {selectedCategory
                    ? `${categoryStudents.length} unique students across ${selectedGroup?.courses.length ?? 0} identified courses`
                    : `${classStats.total} students in this class`}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, ID or course"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#0A54B7]"
                />
              </div>
            </div>

            {/* FEEDBACK */}

            {feedback && (
              <div
                role="status"
                className={`m-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-xs font-semibold ${
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
                  <X size={15} />
                </button>
              </div>
            )}

            {/* DIRECT TABLE FOR ALL CATEGORIES */}

            {renderAttendanceDetails()}
          </div>
        </>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
          <CalendarDays size={32} className="text-[#0A54B7]" />

          <h3 className="text-base font-bold text-[#0A193A]">
            {tab === "lecture" ? "Lecture Attendance" : "Attendance History"}
          </h3>

          <p className="max-w-md text-sm text-slate-500">
            {tab === "lecture"
              ? "Lecture-wise attendance remains managed through the existing lecture attendance module."
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
    </section>
  );
}
