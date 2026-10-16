"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  RefreshCw,
  Save,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import type { LectureItem, ManagedUser } from "@/lib/types";

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
  if (!checkIn || !checkOut) return null;

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

function durationLabel(minutes: number | null): string {
  if (minutes === null) return "—";

  const safe = Math.max(0, Math.floor(minutes));

  return `${Math.floor(safe / 60)}h ${String(safe % 60).padStart(2, "0")}m`;
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

function sameDraft(a: TimeDraft, b: TimeDraft) {
  return (
    a.attendanceStatus === b.attendanceStatus &&
    a.checkIn === b.checkIn &&
    a.checkOut === b.checkOut
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

function facultyScore(teacher: ManagedUser, query: string) {
  const search = normalize(query);
  const name = normalize(teacher.name);
  const code = normalize(teacher.employeeCode ?? "");
  const email = normalize(teacher.email ?? "");

  if (!search) return 0;

  if (name === search || code === search) {
    return 0;
  }

  if (name.startsWith(search) || code.startsWith(search)) {
    return 1;
  }

  if (name.split(" ").some((word) => word.startsWith(search))) {
    return 2;
  }

  if (name.includes(search) || code.includes(search)) {
    return 3;
  }

  const compactQuery = search.replace(/[^a-z0-9]/g, "");

  const compactCode = code.replace(/[^a-z0-9]/g, "");

  if (compactQuery && compactCode.includes(compactQuery)) {
    return 4;
  }

  if (email.includes(search)) {
    return 5;
  }

  return Number.POSITIVE_INFINITY;
}

const ATTENDANCE_OPTIONS = [
  {
    value: "present",
    label: "Present",
    description: "Faculty taught the lecture",
    selected: "border-emerald-400 bg-emerald-50",
    labelColor: "text-emerald-700",
    radioColor: "accent-emerald-600",
  },
  {
    value: "absent",
    label: "Absent",
    description: "Faculty did not take the lecture",
    selected: "border-red-400 bg-red-50",
    labelColor: "text-red-600",
    radioColor: "accent-red-600",
  },
  {
    value: "late",
    label: "Late",
    description: "Faculty came late for the lecture",
    selected: "border-amber-400 bg-amber-50",
    labelColor: "text-amber-600",
    radioColor: "accent-amber-600",
  },
] as const;

function AttendanceTimeInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (!value) {
      setHour("");
      setMinute("");
      setPeriod("AM");
      return;
    }

    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

    if (!match) return;

    const hours24 = Number(match[1]);

    setHour(String(hours24 % 12 || 12).padStart(2, "0"));
    setMinute(match[2]);
    setPeriod(hours24 >= 12 ? "PM" : "AM");
  }, [value]);

  function updateTime(
    nextHour: string,
    nextMinute: string,
    nextPeriod: "AM" | "PM",
  ) {
    setHour(nextHour);
    setMinute(nextMinute);
    setPeriod(nextPeriod);

    const hours = Number(nextHour);
    const minutes = Number(nextMinute);

    if (
      !/^\d{1,2}$/.test(nextHour) ||
      !/^\d{1,2}$/.test(nextMinute) ||
      hours < 1 ||
      hours > 12 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return;
    }

    const hours24 = (hours % 12) + (nextPeriod === "PM" ? 12 : 0);

    onChange(
      `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    );
  }

  const inputClass =
    "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-center text-sm font-semibold text-[#0A193A] outline-none focus:border-[#0A54B7] disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_84px] items-center gap-2"
    >
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="HH"
        aria-label={`${label} hour`}
        disabled={disabled}
        value={hour}
        onChange={(event) =>
          updateTime(event.target.value.replace(/\D/g, ""), minute, period)
        }
        className={inputClass}
      />

      <span className="font-semibold text-slate-400">:</span>

      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="MM"
        aria-label={`${label} minute`}
        disabled={disabled}
        value={minute}
        onChange={(event) =>
          updateTime(hour, event.target.value.replace(/\D/g, ""), period)
        }
        className={inputClass}
      />

      <select
        aria-label={`${label} AM or PM`}
        disabled={disabled}
        value={period}
        onChange={(event) =>
          updateTime(hour, minute, event.target.value as "AM" | "PM")
        }
        className={inputClass}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
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

  const searchRef = useRef<HTMLDivElement>(null);

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
        const current = previous[lecture.id];

        next[lecture.id] =
          current && !sameDraft(current, saved) ? current : saved;
      }

      return next;
    });
  }, [lectures]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const rankedFaculty = useMemo(() => {
    return teachers
      .map((teacher) => ({
        teacher,
        score: facultyScore(teacher, facultyQuery),
      }))
      .filter((item) => Number.isFinite(item.score))
      .sort(
        (a, b) =>
          a.score - b.score || a.teacher.name.localeCompare(b.teacher.name),
      )
      .slice(0, 8)
      .map((item) => item.teacher);
  }, [teachers, facultyQuery]);

  function selectFaculty(teacher: ManagedUser) {
    setFacultyQuery(facultyLabel(teacher));
    setSuggestionsOpen(false);
    setActiveSuggestion(0);

    setError("");
    setMessage("");

    onTeacherChange(teacher.id);
  }

  function handleFacultyKeyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      return;
    }

    if (!suggestionsOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveSuggestion((previous) =>
        Math.min(previous + 1, Math.max(0, rankedFaculty.length - 1)),
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveSuggestion((previous) => Math.max(0, previous - 1));

      return;
    }

    if (event.key === "Enter" && rankedFaculty.length) {
      event.preventDefault();

      selectFaculty(rankedFaculty[activeSuggestion] ?? rankedFaculty[0]);
    }
  }

  const hasValidFacultySelection = Boolean(
    selectedTeacher && facultyQuery === facultyLabel(selectedTeacher),
  );

  const visible = useMemo(() => {
    if (!selectedTeacherId || !hasValidFacultySelection) {
      return [];
    }

    return items
      .filter(
        (lecture) =>
          istDate(lecture.startsAt) === date &&
          lecture.teacherId === selectedTeacherId,
      )
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }, [items, date, selectedTeacherId, hasValidFacultySelection]);

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
        setError("Enter the actual Check In time.");
        return;
      }

      if (checkOut && minutesBetween(checkIn, checkOut) === null) {
        setError("Check Out must be later than Check In.");
        return;
      }

      if (lecture.status === "completed" && !checkOut) {
        setError("Completed lectures must retain both attendance times.");
        return;
      }
    }

    if (attendanceStatus === "absent" && lecture.status === "completed") {
      const confirmed = window.confirm(
        "This lecture is completed. Marking the faculty Absent will clear its saved times and reset completion. Continue?",
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
        // Keep the confirmed saved result visible.
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
      setError("Save your attendance changes before completing the lecture.");
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
        throw new Error(result.error || "Unable to complete the lecture.");
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
        // Keep the confirmed saved result visible.
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to complete the lecture.",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="space-y-3">
      {/* FACULTY SEARCH */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0A193A]">
              Lecture-wise Attendance
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Search teaching faculty, record attendance and manage actual
              lecture timings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={loading || !!busyId}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-[#0A54B7] hover:bg-blue-50 disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* SEARCH INPUT */}

        <div ref={searchRef} className="relative mt-3 max-w-xl">
          <label
            htmlFor="lecture-faculty-search"
            className="mb-1.5 block text-xs font-bold text-[#0A193A]"
          >
            Search Faculty Name / Employee ID
          </label>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="lecture-faculty-search"
              type="text"
              value={facultyQuery}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen}
              aria-controls="faculty-search-suggestions"
              aria-activedescendant={
                suggestionsOpen && rankedFaculty.length
                  ? `faculty-option-${rankedFaculty[activeSuggestion]?.id}`
                  : undefined
              }
              onFocus={() => {
                setSuggestionsOpen(true);
                setActiveSuggestion(0);
              }}
              onChange={(event) => {
                setFacultyQuery(event.target.value);
                setSuggestionsOpen(true);
                setActiveSuggestion(0);
              }}
              onKeyDown={handleFacultyKeyboard}
              placeholder="Type faculty name or employee ID..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-[#0A193A] outline-none focus:border-[#0A54B7]"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0A193A]"
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
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
            >
              {rankedFaculty.length ? (
                rankedFaculty.map((teacher, index) => (
                  <button
                    key={teacher.id}
                    id={`faculty-option-${teacher.id}`}
                    type="button"
                    role="option"
                    aria-selected={teacher.id === selectedTeacherId}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectFaculty(teacher)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left ${
                      index === activeSuggestion
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0A54B7]">
                        <UserRound size={15} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#0A193A]">
                          {teacher.name}
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {teacher.employeeCode || "No employee code"}
                        </p>
                      </div>
                    </div>

                    {teacher.id === selectedTeacherId ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <span className="text-xs text-[#0A54B7]">Select</span>
                    )}
                  </button>
                ))
              ) : (
                <p className="px-4 py-5 text-center text-xs text-slate-500">
                  No matching teaching faculty found.
                </p>
              )}
            </div>
          )}

          {hasValidFacultySelection && !suggestionsOpen && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 size={13} />
              Faculty selected successfully
            </div>
          )}
        </div>
      </div>

      {/* FEEDBACK */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700"
        >
          {message}
        </div>
      )}

      {/* EMPTY STATES */}

      {loading ? (
        <div className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Loading lectures...
        </div>
      ) : !hasValidFacultySelection ? (
        <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center">
          <Search size={23} className="text-[#0A54B7]" />

          <p className="mt-3 text-xs text-slate-500">
            Search and select a teaching faculty member to view their lectures.
          </p>
        </div>
      ) : !visible.length ? (
        <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center">
          <BookOpen size={23} className="text-[#0A54B7]" />

          <p className="mt-3 text-xs text-slate-500">
            No lectures scheduled for this faculty and date.
          </p>
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

            const state = stateOf(lecture);

            return (
              <article
                key={lecture.id}
                id={`lecture-attendance-${lecture.id}`}
                className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                  selected
                    ? "border-blue-400 ring-2 ring-blue-50"
                    : "border-slate-200"
                }`}
              >
                {/* COMPACT LECTURE HEADER */}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <BookOpen size={20} strokeWidth={2} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-bold tracking-tight text-[#0A193A]">
                        {lecture.teacherName || "Faculty not assigned"}
                      </h3>

                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {lecture.title}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Topic: {lecture.subject || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                      state === "Completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : state === "Not Taken" || state === "Cancelled"
                          ? "bg-red-50 text-red-700"
                          : state === "In Progress"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-indigo-50 text-indigo-700"
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    {state}
                  </span>
                </div>

                {/* FACULTY / SCHEDULE / DURATION */}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                  <span className="hidden h-4 w-px bg-slate-200 sm:block" />

                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={15} className="text-[#0A193A]" />
                    Scheduled:
                    <strong className="font-medium text-[#0A193A]">
                      {timeLabel(lecture.startsAt)}
                      {" – "}
                      {timeLabel(lecture.endsAt)}
                    </strong>
                  </span>

                  <span className="hidden h-4 w-px bg-slate-200 sm:block" />

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1">
                    <GraduationCap size={14} className="text-indigo-600" />
                    Actual Duration:
                    <strong className="text-indigo-700">
                      {durationLabel(duration)}
                    </strong>
                  </span>
                </div>

                {/* COMPACT ATTENDANCE OPTIONS */}

                <div className="mt-4 rounded-xl bg-[#F7F9FD] p-3 sm:p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <UsersRound size={17} />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#0A193A]">
                        Faculty Attendance Status
                      </h4>

                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Mark the attendance status for this lecture
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {ATTENDANCE_OPTIONS.map((option) => {
                      const checked = draft.attendanceStatus === option.value;

                      return (
                        <label
                          key={option.value}
                          className={`flex min-h-[60px] items-center gap-3 rounded-lg border px-3 py-2 transition ${
                            checked
                              ? option.selected
                              : "border-slate-200 bg-white hover:border-slate-300"
                          } ${
                            canEdit
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`attendance-${lecture.id}`}
                            checked={checked}
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
                            className={`h-4 w-4 shrink-0 ${option.radioColor}`}
                          />

                          <div className="min-w-0">
                            <p
                              className={`text-sm font-bold ${
                                checked ? option.labelColor : "text-[#0A193A]"
                              }`}
                            >
                              {option.label}
                            </p>

                            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {draft.attendanceStatus === "absent" && (
                    <p className="mt-2 text-[11px] font-medium text-red-600">
                      Check In and Check Out are disabled. Teaching duration is
                      zero.
                    </p>
                  )}

                  {draft.attendanceStatus === "late" && (
                    <p className="mt-2 text-[11px] font-medium text-amber-700">
                      Enter actual arrival and departure times. Late attendance
                      counts toward teaching duration.
                    </p>
                  )}
                </div>

                {/* COMPACT TIME PANELS */}

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {/* CHECK IN */}

                  <div className="min-w-0 rounded-xl bg-emerald-50/60 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Clock3 size={16} />
                      </div>

                      <div>
                        <label
                          htmlFor={`lecture-in-${lecture.id}`}
                          className="block text-xs font-bold text-[#0A193A]"
                        >
                          Actual Check In
                        </label>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Enter actual check-in time
                        </p>
                      </div>
                    </div>

                    <AttendanceTimeInput
                      id={`lecture-in-${lecture.id}`}
                      label="Actual Check In"
                      value={
                        draft.attendanceStatus === "absent" ? "" : draft.checkIn
                      }
                      disabled={!canEditTimes}
                      onChange={(value) =>
                        updateDraft(lecture.id, {
                          checkIn: value,
                        })
                      }
                    />
                  </div>

                  {/* CHECK OUT */}

                  <div className="min-w-0 rounded-xl bg-rose-50/60 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <Clock3 size={16} />
                      </div>

                      <div>
                        <label
                          htmlFor={`lecture-out-${lecture.id}`}
                          className="block text-xs font-bold text-[#0A193A]"
                        >
                          Actual Check Out
                        </label>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Enter actual check-out time
                        </p>
                      </div>
                    </div>

                    <AttendanceTimeInput
                      id={`lecture-out-${lecture.id}`}
                      label="Actual Check Out"
                      value={
                        draft.attendanceStatus === "absent"
                          ? ""
                          : draft.checkOut
                      }
                      disabled={!canEditTimes}
                      onChange={(value) =>
                        updateDraft(lecture.id, {
                          checkOut: value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* COMPACT FOOTER */}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
                  <div
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      isDirty
                        ? "bg-amber-50 text-amber-700"
                        : draft.attendanceStatus === "absent"
                          ? "bg-red-50 text-red-700"
                          : draft.attendanceStatus === "late"
                            ? "bg-amber-50 text-amber-700"
                            : draft.attendanceStatus === "present"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 size={15} />

                    {isDirty
                      ? "Unsaved attendance changes"
                      : draft.attendanceStatus === "absent"
                        ? "Faculty marked Absent"
                        : draft.attendanceStatus === "late"
                          ? "Late attendance is up to date"
                          : draft.attendanceStatus === "present"
                            ? "Present attendance is up to date"
                            : "Attendance not recorded"}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!canEdit || !isDirty}
                      onClick={() => void saveTimes(lecture)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#0A54B7] bg-white px-4 py-2 text-xs font-bold text-[#0A54B7] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isBusy ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      Save Attendance
                    </button>

                    <button
                      type="button"
                      disabled={!canComplete}
                      onClick={() => void markCompleted(lecture)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 size={15} />

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
