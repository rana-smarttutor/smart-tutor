"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LectureItem, ManagedUser } from "@/lib/types";

import {
  BookOpen,
  CheckCircle2,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
  Search,
  X,
} from "lucide-react";

type AttendanceStatus = "" | "present" | "absent" | "late";

type LectureWithAttendance = LectureItem & {
  lectureAttendanceStatus?: "present" | "absent" | "late";
};

type Props = {
  date: string;
  lectures: LectureItem[];
  teachers: ManagedUser[];
  selectedTeacherId: string;
  selectedLectureId?: string;
  onTeacherChange: (id: string) => void;
  onRefresh: () => Promise<void>;
  loading?: boolean;
  canManage?: boolean;
};

type TimeDraft = {
  attendanceStatus: AttendanceStatus;
  checkIn: string;
  checkOut: string;
};

const TIMEZONE = "Asia/Kolkata";

function istDate(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function timeLabel(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function timeInputValue(value?: string): string {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "";

  const minute = parts.find((part) => part.type === "minute")?.value ?? "";

  return `${hour}:${minute}`;
}

function minutesBetween(checkIn: string, checkOut: string): number | null {
  if (!checkIn || !checkOut) {
    return null;
  }

  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const start = pattern.exec(checkIn);
  const end = pattern.exec(checkOut);

  if (!start || !end) return null;

  const startMinutes = Number(start[1]) * 60 + Number(start[2]);

  const endMinutes = Number(end[1]) * 60 + Number(end[2]);

  if (endMinutes <= startMinutes) {
    return null;
  }

  return endMinutes - startMinutes;
}

function durationLabel(minutes: number | null) {
  if (minutes === null) return "—";

  const safeMinutes = Math.max(0, Math.floor(minutes));

  return `${Math.floor(safeMinutes / 60)}h ${String(safeMinutes % 60).padStart(
    2,
    "0",
  )}m`;
}

function savedDurationMinutes(lecture: LectureWithAttendance) {
  if (
    lecture.lectureAttendanceStatus === "absent" ||
    !lecture.lectureCheckInAt ||
    !lecture.lectureCheckOutAt
  ) {
    return 0;
  }

  const start = Date.parse(lecture.lectureCheckInAt);

  const end = Date.parse(lecture.lectureCheckOutAt);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return Math.floor((end - start) / 60000);
}

function stateOf(lecture: LectureWithAttendance) {
  if (lecture.lectureAttendanceStatus === "absent") {
    return "Not Taken";
  }

  if (lecture.status === "cancelled") {
    return "Cancelled";
  }

  if (lecture.status === "completed") {
    return "Completed";
  }

  if (lecture.lectureCheckOutAt) {
    return "Checked Out";
  }

  if (lecture.lectureCheckInAt) {
    return "In Progress";
  }

  return "Scheduled";
}

function savedDraft(lecture: LectureWithAttendance): TimeDraft {
  return {
    attendanceStatus:
      lecture.lectureAttendanceStatus ??
      (lecture.lectureCheckInAt ? "present" : ""),
    checkIn: timeInputValue(lecture.lectureCheckInAt),
    checkOut: timeInputValue(lecture.lectureCheckOutAt),
  };
}

function sameDraft(first: TimeDraft, second: TimeDraft) {
  return (
    first.attendanceStatus === second.attendanceStatus &&
    first.checkIn === second.checkIn &&
    first.checkOut === second.checkOut
  );
}

function facultyLabel(teacher: ManagedUser) {
  return teacher.employeeCode
    ? `${teacher.name} - ${teacher.employeeCode}`
    : teacher.name;
}

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function compact(value: string) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function facultyScore(teacher: ManagedUser, query: string): number {
  const search = normalize(query);
  const name = normalize(teacher.name);
  const code = normalize(teacher.employeeCode || "");
  const email = normalize(teacher.email);

  if (!search) return 100;

  if (name === search || code === search) {
    return 0;
  }

  if (name.startsWith(search) || code.startsWith(search)) {
    return 1;
  }

  const nameWords = name.split(" ");

  if (nameWords.some((word) => word.startsWith(search))) {
    return 2;
  }

  if (name.includes(search) || code.includes(search)) {
    return 3;
  }

  const compactSearch = compact(search);
  const compactName = compact(name);
  const compactCode = compact(code);

  if (
    compactSearch &&
    (compactName.includes(compactSearch) || compactCode.includes(compactSearch))
  ) {
    return 4;
  }

  if (email.includes(search)) {
    return 5;
  }

  const terms = search.split(" ").filter(Boolean);

  if (
    terms.length > 1 &&
    terms.every((term) => name.includes(term) || code.includes(term))
  ) {
    return 6;
  }

  return Number.POSITIVE_INFINITY;
}

export function StaffLectureAttendance({
  date,
  lectures,
  teachers,
  selectedTeacherId,
  selectedLectureId = "",
  onTeacherChange,
  onRefresh,
  loading = false,
  canManage = true,
}: Props) {
  const [items, setItems] = useState<LectureWithAttendance[]>(lectures);

  const [drafts, setDrafts] = useState<Record<string, TimeDraft>>({});

  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [facultyQuery, setFacultyQuery] = useState("");

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId),
    [teachers, selectedTeacherId],
  );

  useEffect(() => {
    setFacultyQuery(selectedTeacher ? facultyLabel(selectedTeacher) : "");
    setSuggestionsOpen(false);
  }, [selectedTeacher]);

  useEffect(() => {
    setItems(lectures);

    setDrafts((previous) => {
      const next: Record<string, TimeDraft> = {};

      for (const lecture of lectures) {
        const saved = savedDraft(lecture);
        const draft = previous[lecture.id];

        next[lecture.id] = draft && !sameDraft(draft, saved) ? draft : saved;
      }

      return next;
    });
  }, [lectures]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const rankedFaculty = useMemo(() => {
    const query = facultyQuery.trim();

    if (!query) {
      return [...teachers].sort((a, b) => a.name.localeCompare(b.name));
    }

    return teachers
      .map((teacher) => ({
        teacher,
        score: facultyScore(teacher, query),
      }))
      .filter((item) => Number.isFinite(item.score))
      .sort(
        (a, b) =>
          a.score - b.score || a.teacher.name.localeCompare(b.teacher.name),
      )
      .map((item) => item.teacher);
  }, [teachers, facultyQuery]);

  const suggestions = rankedFaculty.slice(0, 8);

  function selectFaculty(teacher: ManagedUser) {
    setFacultyQuery(facultyLabel(teacher));
    setSuggestionsOpen(false);
    setActiveSuggestion(0);
    setError("");
    setMessage("");
    onTeacherChange(teacher.id);
  }

  function handleFacultyQuery(value: string) {
    setFacultyQuery(value);
    setSuggestionsOpen(true);
    setActiveSuggestion(0);

    // Prevent stale attendance being shown under
    // a typed name that has not been selected yet.
    if (selectedTeacher && value !== facultyLabel(selectedTeacher)) {
      onTeacherChange("");
    }
  }

  function handleFacultyKeyboard(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestionsOpen) {
      event.preventDefault();
      setActiveSuggestion((previous) =>
        Math.min(previous + 1, suggestions.length - 1),
      );
    }

    if (event.key === "ArrowUp" && suggestionsOpen) {
      event.preventDefault();
      setActiveSuggestion((previous) => Math.max(0, previous - 1));
    }

    if (event.key === "Enter" && suggestionsOpen && suggestions.length) {
      event.preventDefault();
      selectFaculty(suggestions[activeSuggestion] ?? suggestions[0]);
    }

    if (event.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  const visible = useMemo(() => {
    if (!selectedTeacherId) {
      return [];
    }

    return items
      .filter(
        (lecture) =>
          istDate(lecture.startsAt) === date &&
          lecture.teacherId === selectedTeacherId,
      )
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }, [items, date, selectedTeacherId]);

  useEffect(() => {
    if (
      !selectedLectureId ||
      loading ||
      !visible.some((lecture) => lecture.id === selectedLectureId)
    ) {
      return;
    }

    document
      .getElementById(`lecture-attendance-${selectedLectureId}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [selectedLectureId, loading, visible]);

  const updateDraft = useCallback(
    (lectureId: string, changes: Partial<TimeDraft>) => {
      setDrafts((previous) => {
        const lecture = items.find((item) => item.id === lectureId);

        const current =
          previous[lectureId] ??
          (lecture
            ? savedDraft(lecture)
            : {
                attendanceStatus: "" as const,
                checkIn: "",
                checkOut: "",
              });

        return {
          ...previous,
          [lectureId]: {
            ...current,
            ...changes,
          },
        };
      });

      setError("");
      setMessage("");
    },
    [items],
  );

  async function saveTimes(lecture: LectureWithAttendance) {
    if (!canManage || busyId) return;

    const draft = drafts[lecture.id] ?? savedDraft(lecture);

    const attendanceStatus = draft.attendanceStatus;

    if (
      attendanceStatus !== "present" &&
      attendanceStatus !== "absent" &&
      attendanceStatus !== "late"
    ) {
      setError("Select Present, Absent or Late before saving.");
      return;
    }

    const checkIn = attendanceStatus === "absent" ? "" : draft.checkIn;

    const checkOut = attendanceStatus === "absent" ? "" : draft.checkOut;

    if (attendanceStatus !== "absent") {
      if (!checkIn) {
        setError(
          `Enter Check In for ${
            attendanceStatus === "late" ? "Late" : "Present"
          } attendance.`,
        );
        return;
      }

      if (checkOut && minutesBetween(checkIn, checkOut) === null) {
        setError("Check Out must be later than Check In.");
        return;
      }

      if (lecture.status === "completed" && !checkOut) {
        setError("Completed lectures require both attendance times.");
        return;
      }
    }

    if (attendanceStatus === "absent" && lecture.status === "completed") {
      const confirmed = window.confirm(
        "This lecture is completed. Marking the faculty Absent will clear its attendance times and reset lecture completion. Continue?",
      );

      if (!confirmed) return;
    }

    setBusyId(lecture.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/lectures/${encodeURIComponent(lecture.id)}/attendance`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "save",
            attendanceStatus,
            checkIn,
            checkOut,
          }),
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        lecture?: LectureWithAttendance;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.lecture) {
        throw new Error(result.error || "Unable to save lecture attendance.");
      }

      const updated = result.lecture;

      setItems((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );

      setDrafts((previous) => ({
        ...previous,
        [updated.id]: savedDraft(updated),
      }));

      setMessage(result.message || "Lecture attendance saved successfully.");

      try {
        await onRefresh();
      } catch {
        // Retain the confirmed server result.
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save lecture attendance.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function markCompleted(lecture: LectureWithAttendance) {
    if (!canManage || busyId) return;

    const draft = drafts[lecture.id] ?? savedDraft(lecture);

    const saved = savedDraft(lecture);

    if (!sameDraft(draft, saved)) {
      setError("Save attendance changes before completing the lecture.");
      return;
    }

    if (
      draft.attendanceStatus !== "present" &&
      draft.attendanceStatus !== "late"
    ) {
      setError("Only Present or Late faculty can complete a lecture.");
      return;
    }

    if (!lecture.lectureCheckInAt || !lecture.lectureCheckOutAt) {
      setError("Save both Check In and Check Out times first.");
      return;
    }

    if (!window.confirm(`Mark "${lecture.title}" as completed?`)) {
      return;
    }

    setBusyId(lecture.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/lectures/${encodeURIComponent(lecture.id)}/attendance`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "complete",
          }),
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        lecture?: LectureWithAttendance;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.lecture) {
        throw new Error(result.error || "Unable to complete lecture.");
      }

      const updated = result.lecture;

      setItems((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );

      setDrafts((previous) => ({
        ...previous,
        [updated.id]: savedDraft(updated),
      }));

      setMessage(result.message || "Lecture marked completed.");

      try {
        await onRefresh();
      } catch {
        // Retain the confirmed server result.
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to complete lecture.",
      );
    } finally {
      setBusyId("");
    }
  }

  const total = visible.length;

  const completed = visible.filter(
    (lecture) =>
      lecture.status === "completed" &&
      lecture.lectureAttendanceStatus !== "absent",
  ).length;

  const inProgress = visible.filter(
    (lecture) =>
      lecture.status === "scheduled" &&
      lecture.lectureAttendanceStatus !== "absent" &&
      !!lecture.lectureCheckInAt &&
      !lecture.lectureCheckOutAt,
  ).length;

  const present = visible.filter(
    (lecture) =>
      lecture.lectureAttendanceStatus === "present" ||
      (!lecture.lectureAttendanceStatus && !!lecture.lectureCheckInAt),
  ).length;

  const absent = visible.filter(
    (lecture) => lecture.lectureAttendanceStatus === "absent",
  ).length;

  const late = visible.filter(
    (lecture) => lecture.lectureAttendanceStatus === "late",
  ).length;

  const totalDurationMinutes = visible.reduce(
    (sum, lecture) => sum + savedDurationMinutes(lecture),
    0,
  );

  const totalDuration = durationLabel(totalDurationMinutes);

  return (
    <section className="space-y-4">
      {/* HEADER AND FACULTY SEARCH */}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0A193A]">
              Lecture-wise Attendance
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Search teaching faculty, mark Present, Absent or Late, enter
              actual lecture timings, and save attendance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={loading || !!busyId}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* SEARCHABLE FACULTY INPUT */}

        <div ref={searchContainerRef} className="relative mt-4 max-w-lg">
          <label
            htmlFor="lecture-faculty-search"
            className="mb-2 block text-xs font-bold text-slate-600"
          >
            Search Faculty Name / Employee ID
          </label>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="lecture-faculty-search"
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen}
              aria-controls="faculty-search-suggestions"
              aria-activedescendant={
                suggestionsOpen && suggestions.length
                  ? `faculty-option-${suggestions[activeSuggestion]?.id}`
                  : undefined
              }
              value={facultyQuery}
              onFocus={() => {
                setSuggestionsOpen(true);
                setActiveSuggestion(0);
              }}
              onChange={(event) => handleFacultyQuery(event.target.value)}
              onKeyDown={handleFacultyKeyboard}
              autoComplete="off"
              placeholder="Type faculty name or employee ID..."
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-[#0A193A] outline-none focus:border-[#0A54B7]"
            />

            {facultyQuery && (
              <button
                type="button"
                aria-label="Clear faculty search"
                onClick={() => {
                  setFacultyQuery("");
                  setSuggestionsOpen(true);
                  setActiveSuggestion(0);
                  onTeacherChange("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {suggestionsOpen && (
            <div
              id="faculty-search-suggestions"
              role="listbox"
              aria-label="Matching teaching faculty"
              className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              {suggestions.length ? (
                suggestions.map((teacher, index) => (
                  <button
                    key={teacher.id}
                    id={`faculty-option-${teacher.id}`}
                    type="button"
                    role="option"
                    aria-selected={teacher.id === selectedTeacherId}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectFaculty(teacher)}
                    className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 ${
                      index === activeSuggestion
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0A193A]">
                        {teacher.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {teacher.employeeCode || "Employee ID unavailable"}
                      </p>
                    </div>

                    {teacher.id === selectedTeacherId ? (
                      <Check size={17} className="shrink-0 text-emerald-600" />
                    ) : (
                      <span className="shrink-0 text-[11px] text-[#0A54B7]">
                        Select
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-5 text-center text-sm text-slate-500">
                  No matching teaching faculty found.
                </div>
              )}
            </div>
          )}

          {selectedTeacher && !suggestionsOpen && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 size={15} />
              Faculty selected
            </div>
          )}
        </div>

        {/* FACULTY-SPECIFIC KPIs */}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {[
            ["Lectures", total],
            ["Present", present],
            ["Absent", absent],
            ["Late", late],
            ["In Progress", inProgress],
            ["Completed", completed],
            ["Total Duration", totalDuration],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xl font-bold text-[#0A193A]">{value}</p>

              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FEEDBACK */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {message}
        </div>
      )}

      {/* LECTURES */}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin" />
          Loading lectures...
        </div>
      ) : !selectedTeacherId ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <Search className="mx-auto mb-3" />
          Search and select a teaching faculty member to view their lectures.
        </div>
      ) : !visible.length ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <BookOpen className="mx-auto mb-3" />
          No lectures scheduled for the selected faculty and date.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((lecture) => {
            const draft = drafts[lecture.id] ?? savedDraft(lecture);

            const saved = savedDraft(lecture);

            const isDirty = !sameDraft(draft, saved);

            const duration =
              draft.attendanceStatus === "absent"
                ? 0
                : minutesBetween(draft.checkIn, draft.checkOut);

            const cancelled = lecture.status === "cancelled";

            const isCompleted = lecture.status === "completed";

            const isBusy = busyId === lecture.id;

            const canEdit = canManage && !cancelled && !busyId;

            const canEditTimes =
              canEdit &&
              (draft.attendanceStatus === "present" ||
                draft.attendanceStatus === "late");

            const canComplete =
              canManage &&
              !busyId &&
              lecture.status === "scheduled" &&
              (draft.attendanceStatus === "present" ||
                draft.attendanceStatus === "late") &&
              !!lecture.lectureCheckInAt &&
              !!lecture.lectureCheckOutAt &&
              !isDirty;

            const selected = lecture.id === selectedLectureId;

            return (
              <article
                key={lecture.id}
                id={`lecture-attendance-${lecture.id}`}
                className={`scroll-mt-24 rounded-xl bg-white p-4 shadow-sm ${
                  selected
                    ? "border-2 border-[#0A54B7] ring-4 ring-blue-100"
                    : "border border-slate-200"
                }`}
              >
                {/* LECTURE HEADER */}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {selected && (
                      <span className="mb-2 inline-flex rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                        Selected Lecture
                      </span>
                    )}

                    <h4 className="font-bold text-[#0A193A]">
                      {lecture.title}
                    </h4>

                    <p className="mt-1 text-sm text-slate-600">
                      {lecture.subject || "General"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Faculty: {lecture.teacherName || "—"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      draft.attendanceStatus === "absent"
                        ? "bg-red-50 text-red-700"
                        : isCompleted
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {stateOf(lecture)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={14} />
                    Scheduled: {timeLabel(lecture.startsAt)}
                    {" – "}
                    {timeLabel(lecture.endsAt)}
                  </span>

                  <span>
                    Actual Duration:{" "}
                    <strong className="text-[#0A193A]">
                      {durationLabel(duration)}
                    </strong>
                  </span>
                </div>

                {/* PRESENT / ABSENT / LATE */}

                <div className="mt-4 rounded-lg border border-slate-200 p-3">
                  <p className="mb-3 text-xs font-bold text-slate-600">
                    Faculty Attendance Status
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        {
                          value: "present",
                          label: "Present",
                          selected:
                            "border-emerald-300 bg-emerald-50 text-emerald-700",
                          accent: "accent-emerald-600",
                        },
                        {
                          value: "absent",
                          label: "Absent",
                          selected: "border-red-300 bg-red-50 text-red-700",
                          accent: "accent-red-600",
                        },
                        {
                          value: "late",
                          label: "Late",
                          selected:
                            "border-amber-300 bg-amber-50 text-amber-700",
                          accent: "accent-amber-600",
                        },
                      ] as const
                    ).map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
                          draft.attendanceStatus === option.value
                            ? option.selected
                            : "border-slate-200 text-slate-600"
                        } ${
                          canEdit
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`attendance-${lecture.id}`}
                          checked={draft.attendanceStatus === option.value}
                          disabled={!canEdit}
                          onChange={() =>
                            updateDraft(
                              lecture.id,
                              option.value === "absent"
                                ? {
                                    attendanceStatus: "absent",
                                    checkIn: "",
                                    checkOut: "",
                                  }
                                : {
                                    attendanceStatus: option.value,
                                  },
                            )
                          }
                          className={option.accent}
                        />

                        {option.label}
                      </label>
                    ))}
                  </div>

                  {draft.attendanceStatus === "absent" && (
                    <p className="mt-3 text-xs text-red-600">
                      Absent faculty have no Check In or Check Out time.
                      Teaching duration will be 0h 00m.
                    </p>
                  )}

                  {draft.attendanceStatus === "late" && (
                    <p className="mt-3 text-xs text-amber-700">
                      Faculty marked Late. Enter the actual Check In and Check
                      Out times below.
                    </p>
                  )}

                  {!draft.attendanceStatus && (
                    <p className="mt-3 text-xs text-amber-600">
                      Attendance has not been recorded. Select Present, Absent
                      or Late.
                    </p>
                  )}
                </div>

                {/* ACTUAL TIME INPUTS */}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <label
                      htmlFor={`lecture-in-${lecture.id}`}
                      className="mb-2 block text-xs font-bold text-slate-600"
                    >
                      Actual Check In
                    </label>

                    <input
                      id={`lecture-in-${lecture.id}`}
                      type="time"
                      step={60}
                      value={
                        draft.attendanceStatus === "absent" ? "" : draft.checkIn
                      }
                      disabled={!canEditTimes}
                      onChange={(event) =>
                        updateDraft(lecture.id, {
                          checkIn: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#0A193A] outline-none focus:border-[#0A54B7] disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <label
                      htmlFor={`lecture-out-${lecture.id}`}
                      className="mb-2 block text-xs font-bold text-slate-600"
                    >
                      Actual Check Out
                    </label>

                    <input
                      id={`lecture-out-${lecture.id}`}
                      type="time"
                      step={60}
                      value={
                        draft.attendanceStatus === "absent"
                          ? ""
                          : draft.checkOut
                      }
                      disabled={!canEditTimes}
                      onChange={(event) =>
                        updateDraft(lecture.id, {
                          checkOut: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#0A193A] outline-none focus:border-[#0A54B7] disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </div>

                {/* SAVE / COMPLETE */}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">
                    {isDirty
                      ? "Unsaved attendance changes"
                      : draft.attendanceStatus === "absent"
                        ? "Faculty marked Absent"
                        : draft.attendanceStatus === "late"
                          ? "Faculty marked Late"
                          : draft.attendanceStatus === "present"
                            ? "Present attendance is up to date"
                            : "Attendance not recorded"}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!canEdit || !isDirty}
                      onClick={() => void saveTimes(lecture)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0A54B7] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Save Attendance
                    </button>

                    <button
                      type="button"
                      disabled={!canComplete}
                      onClick={() => void markCompleted(lecture)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 size={14} />

                      {isCompleted ? "Completed" : "Mark Completed"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
