"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  RefreshCw,
  Save,
  Search,
  XCircle,
} from "lucide-react";
import { StaffActivityEditor } from "@/components/staff-activity-editor";
import type {
  ManagedUser,
  Role,
  LectureItem,
  StaffAttendanceRecord,
  StaffAttendanceStatus,
  StaffCategory,
  EmploymentType,
  RegularisationRequest,
} from "@/lib/types";

type Props = {
  role: Role;
  managedUsers: ManagedUser[];
  userId?: string;
  userName?: string;
  embedded?: boolean;
};

type MainTab = "overview" | "teaching" | "nonTeaching" | "history" | "reports";

type TeachingTab = "today" | "timetable" | "lectureHistory";
type NonTeachingTab = "register" | "activities";

type EditValue = {
  status: StaffAttendanceStatus | "";
  checkIn: string;
  checkOut: string;
};

const TIMEZONE = "Asia/Kolkata";

type StaffTimeInputProps = {
  value: string;
  disabled?: boolean;
  label: string;
  inputId: string;
  onChange: (nextValue: string) => void;
  onEnter?: () => void;
};

// Show 12-hour time and a separate AM/PM dropdown, while storing HH:MM.
function StaffTimeInput({
  value,
  disabled = false,
  label,
  inputId,
  onChange,
  onEnter,
}: StaffTimeInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [emptyPeriod, setEmptyPeriod] = useState<"AM" | "PM">("AM");

  const parsed = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  const hour24 = parsed ? Number(parsed[1]) : null;
  const period: "AM" | "PM" =
    hour24 === null ? emptyPeriod : hour24 >= 12 ? "PM" : "AM";
  const shown =
    hour24 === null
      ? ""
      : `${String(hour24 % 12 || 12).padStart(2, "0")}:${parsed?.[2]}`;

  function as24(text: string, nextPeriod: "AM" | "PM") {
    const trimmed = text.trim();
    if (!trimmed) return "";

    // Also accept 0846, 8:46 and 08:46.
    const found =
      /^(\d{1,2}):([0-5]\d)$/.exec(trimmed) ??
      /^(\d{1,2})([0-5]\d)$/.exec(trimmed);
    if (!found) return null;

    const hour = Number(found[1]);
    if (hour < 1 || hour > 12) return null;

    const nextHour = (hour % 12) + (nextPeriod === "PM" ? 12 : 0);
    return `${String(nextHour).padStart(2, "0")}:${found[2]}`;
  }

  function commit() {
    if (draft === null) return true;
    const converted = as24(draft, period);
    if (converted === null) return false;
    onChange(converted);
    setDraft(null);
    return true;
  }

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder="hh:mm"
        value={draft ?? shown}
        disabled={disabled}
        aria-label={`${label} time`}
        onChange={(event) => {
          const next = event.target.value.replace(/[^0-9:]/g, "");
          setDraft(next);
          event.target.setCustomValidity("");
          if (!next) onChange("");
        }}
        onBlur={() => {
          if (!commit()) setDraft(null);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          if (!commit()) {
            event.currentTarget.setCustomValidity(
              "Enter a valid time between 01:00 and 12:59.",
            );
            event.currentTarget.reportValidity();
            return;
          }
          event.currentTarget.setCustomValidity("");
          if (onEnter) onEnter();
          else event.currentTarget.blur();
        }}
        className="h-9 w-[70px] rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-semibold text-[#0A193A] outline-none focus:border-[#0A54B7] disabled:bg-slate-50"
      />
      <select
        aria-label={`${label} AM or PM`}
        value={period}
        disabled={disabled}
        onChange={(event) => {
          const nextPeriod = event.target.value as "AM" | "PM";
          setEmptyPeriod(nextPeriod);
          const text = draft ?? shown;
          if (!text) return;
          const converted = as24(text, nextPeriod);
          if (converted !== null) {
            onChange(converted);
            setDraft(null);
          }
        }}
        className="h-9 w-[56px] rounded-lg border border-slate-200 bg-white px-1 text-[11px] font-semibold text-[#0A193A] outline-none focus:border-[#0A54B7] disabled:bg-slate-50"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

function istDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function todayIST() {
  return istDate(new Date().toISOString());
}

function displayDate(value: string) {
  if (!value) return "—";

  const d = new Date(`${value}T12:00:00+05:30`);

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

function displayTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE,
  });
}

function durationMinutes(lecture: LectureItem) {
  if (!lecture.endsAt) return 0;

  const start = new Date(lecture.startsAt).getTime();
  const end = new Date(lecture.endsAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;

  return Math.max(0, (end - start) / 60000);
}

function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));

  return `${Math.floor(safe / 60)}h ${String(safe % 60).padStart(2, "0")}m`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function department(user: ManagedUser) {
  return (
    user.profile?.department?.trim() ||
    user.profile?.designation?.trim() ||
    (user.role === "educator"
      ? "Teaching Faculty"
      : user.role === "admin"
        ? "Administration"
        : user.role === "counsellor"
          ? "Counselling"
          : "Staff")
  );
}

function employment(user: ManagedUser) {
  switch (user.profile?.employmentType) {
    case "part_time":
      return "Part-time";
    case "contractual":
      return "Contractual";
    case "hourly":
      return "Hourly";
    default:
      return "Full-time";
  }
}

function statusColor(status?: string) {
  switch (status) {
    case "present":
    case "completed":
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "absent":
    case "cancelled":
    case "rejected":
      return "bg-red-50 text-red-700";
    case "late":
    case "half_day":
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "on_leave":
      return "bg-violet-50 text-violet-700";
    case "scheduled":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor(status)}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function getWorkingMinutes(record: StaffAttendanceRecord): number {
  const value = record.hoursWorked;

  if (value === undefined || value === null) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value * 60);
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function StaffAttendanceManager({
  role,
  managedUsers,
  userId,
  userName,
  embedded = false,
}: Props) {
  const [date, setDate] = useState(todayIST);
  const [tab, setTab] = useState<MainTab>("overview");
  const [teachingTab, setTeachingTab] = useState<TeachingTab>("today");
  const [nonTeachingTab, setNonTeachingTab] =
    useState<NonTeachingTab>("register");

  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [myHistory, setMyHistory] = useState<StaffAttendanceRecord[]>([]);
  const [requests, setRequests] = useState<RegularisationRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [lectureLoading, setLectureLoading] = useState(false);
  const [lectureError, setLectureError] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [creatingLecture, setCreatingLecture] = useState(false);
  const [lectureForm, setLectureForm] = useState({
    title: "",
    subject: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    meetingLink: "",
    materialLink: "",
  });

  const [editMap, setEditMap] = useState<Record<string, EditValue>>({});

  const [showRegularise, setShowRegularise] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [regulariseDate, setRegulariseDate] = useState("");
  const [regulariseReason, setRegulariseReason] = useState("");
  const [regulariseIn, setRegulariseIn] = useState("");
  const [regulariseOut, setRegulariseOut] = useState("");
  const [regulariseStatus, setRegulariseStatus] =
    useState<StaffAttendanceStatus>("present");

  const canManage =
    role === "admin" || role === "staff" || role === "counsellor";


const allStaff = useMemo(
  () =>
    managedUsers.filter(
      (user) =>
        user.role === "educator" ||
        user.role === "staff" ||
        user.role === "counsellor",
    ),
  [managedUsers],
);


  const teachers = useMemo(
    () => allStaff.filter((user) => user.role === "educator"),
    [allStaff],
  );

  const nonTeachers = useMemo(
    () => allStaff.filter((user) => user.role !== "educator"),
    [allStaff],
  );

  const selectedTeacher = teachers.find(
    (teacher) => teacher.id === selectedTeacherId,
  );

  useEffect(() => {
    if (role === "educator" && userId) {
      setSelectedTeacherId(userId);
      return;
    }

    if (!teachers.some((teacher) => teacher.id === selectedTeacherId)) {
      setSelectedTeacherId(teachers[0]?.id || "");
    }
  }, [role, userId, teachers, selectedTeacherId]);

  const loadAttendance = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/staff-attendance?date=${encodeURIComponent(date)}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load staff attendance.");
      }

      const data = await response.json();
      const nextRecords: StaffAttendanceRecord[] = data.records || [];

      setRecords(nextRecords);

      const nextEdit: Record<string, EditValue> = {};

      for (const record of nextRecords) {
        nextEdit[record.userId] = {
          status: record.status,
          checkIn: record.checkIn || "",
          checkOut: record.checkOut || "",
        };
      }

      setEditMap(nextEdit);
    } catch (error) {
      console.error("Attendance load failed:", error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const loadLectures = useCallback(async () => {
    setLectureLoading(true);
    setLectureError("");

    try {
      const response = await fetch("/api/lectures", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !Array.isArray(data.lectures)) {
        throw new Error(data.error || "Unable to load scheduled lectures.");
      }

      setLectures(data.lectures as LectureItem[]);
    } catch (error) {
      setLectureError(
        error instanceof Error
          ? error.message
          : "Unable to load scheduled lectures.",
      );
      setLectures([]);
    } finally {
      setLectureLoading(false);
    }
  }, []);

  const loadMine = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `/api/staff-attendance/my?userId=${encodeURIComponent(userId)}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      if (response.ok) {
        const data = await response.json();
        setMyHistory(data.records || []);
      }
    } catch (error) {
      console.error("Attendance history load failed:", error);
    }
  }, [userId]);

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "list-regularisations",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Regularisation requests load failed:", error);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    void loadLectures();
    void loadMine();
    void loadRequests();
  }, [loadLectures, loadMine, loadRequests]);

  const teacherLectures = useMemo(() => {
    if (!selectedTeacher) return [];

    return lectures
      .filter((lecture) => lecture.teacherId === selectedTeacher.id)
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [lectures, selectedTeacher]);

  const dailyLectures = useMemo(
    () =>
      teacherLectures.filter((lecture) => istDate(lecture.startsAt) === date),
    [teacherLectures, date],
  );

  const weeklyLectures = useMemo(() => {
    const [year, month, day] = date.split("-").map(Number);

    const selected = new Date(Date.UTC(year, month - 1, day));
    const weekday = (selected.getUTCDay() + 6) % 7;

    const monday = new Date(selected);
    monday.setUTCDate(selected.getUTCDate() - weekday);

    const startKey = monday.toISOString().slice(0, 10);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const endKey = sunday.toISOString().slice(0, 10);

    return teacherLectures.filter((lecture) => {
      const lectureDay = istDate(lecture.startsAt);
      return lectureDay >= startKey && lectureDay <= endKey;
    });
  }, [teacherLectures, date]);

  const previousLectures = useMemo(
    () =>
      teacherLectures
        .filter((lecture) => istDate(lecture.startsAt) < date)
        .sort(
          (a, b) =>
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
        ),
    [teacherLectures, date],
  );

  useEffect(() => {
    if (!dailyLectures.some((lecture) => lecture.id === selectedLectureId)) {
      setSelectedLectureId(dailyLectures[0]?.id || "");
    }
  }, [dailyLectures, selectedLectureId]);

  const selectedLecture = dailyLectures.find(
    (lecture) => lecture.id === selectedLectureId,
  );

  const lectureStats = useMemo(() => {
    const completed = dailyLectures.filter(
      (lecture) => lecture.status === "completed",
    );

    return {
      total: dailyLectures.length,
      completed: completed.length,
      pending: dailyLectures.filter((lecture) => lecture.status === "scheduled")
        .length,
      cancelled: dailyLectures.filter(
        (lecture) => lecture.status === "cancelled",
      ).length,
      hours: formatMinutes(
        completed.reduce(
          (total, lecture) => total + durationMinutes(lecture),
          0,
        ),
      ),
    };
  }, [dailyLectures]);

  const recordMap = useMemo(
    () => new Map(records.map((record) => [record.userId, record])),
    [records],
  );

  const getRecord = (id: string) => recordMap.get(id);

  const myRecord = userId ? getRecord(userId) : undefined;

  function updateEdit(targetId: string, change: Partial<EditValue>) {
    if (!canManage) return;

    setEditMap((previous) => {
      const existing = previous[targetId];
      const saved = recordMap.get(targetId);

      const next: EditValue = {
        status: existing?.status || saved?.status || "",
        checkIn: existing?.checkIn ?? saved?.checkIn ?? "",
        checkOut: existing?.checkOut ?? saved?.checkOut ?? "",
        ...change,
      };

      // Entering a check-in for an unmarked employee
      // automatically marks the employee present.
      if (!next.status && (next.checkIn || next.checkOut)) {
        next.status = "present";
      }

      return {
        ...previous,
        [targetId]: next,
      };
    });
  }

  function markAll(users: ManagedUser[], status: StaffAttendanceStatus) {
    if (!canManage) return;

    setEditMap((previous) => {
      const updated = { ...previous };

      for (const user of users) {
        const saved = recordMap.get(user.id);

        updated[user.id] = {
          status,
          checkIn: previous[user.id]?.checkIn ?? saved?.checkIn ?? "",
          checkOut: previous[user.id]?.checkOut ?? saved?.checkOut ?? "",
        };
      }

      return updated;
    });
  }

  function validateManualTime(edit: EditValue, name: string) {
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (edit.checkIn && !validTime.test(edit.checkIn)) {
      return `Invalid check-in time for ${name}.`;
    }

    if (edit.checkOut && !validTime.test(edit.checkOut)) {
      return `Invalid check-out time for ${name}.`;
    }

    if (edit.checkOut && !edit.checkIn) {
      return `Enter check-in time before check-out for ${name}.`;
    }

    if (edit.checkIn && edit.checkOut && edit.checkOut < edit.checkIn) {
      return `Check-out must be after check-in for ${name}.`;
    }

    if (
      (edit.status === "absent" ||
        edit.status === "on_leave" ||
        edit.status === "holiday") &&
      (edit.checkIn || edit.checkOut)
    ) {
      return `Remove check-in/out times or select a working status for ${name}.`;
    }

    return "";
  }

  async function saveAttendance(users: ManagedUser[]) {
    if (!canManage || saving) return;

    const items: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      category: StaffCategory;
      employmentType: EmploymentType;
      status: StaffAttendanceStatus;
      checkIn?: string;
      checkOut?: string;
    }> = [];

    for (const user of users) {
      const edit = editMap[user.id];
      if (!edit?.status) continue;

      const error = validateManualTime(edit, user.name);

      if (error) {
        alert(error);
        return;
      }

      const category: StaffCategory =
        user.role === "educator"
          ? "Teacher"
          : user.role === "admin"
            ? "Admin"
            : user.role === "counsellor"
              ? "Counsellor"
              : "Staff";

      const employmentType: EmploymentType =
        user.profile?.employmentType ?? "full_time";

      items.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        category,
        employmentType,
        status: edit.status,
        checkIn: edit.checkIn || undefined,
        checkOut: edit.checkOut || undefined,
      });
    }

    if (!items.length) {
      alert("Enter attendance status or check-in time before saving.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "bulk-mark",
          date,
          records: items,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Attendance save failed.");
      }

      await loadAttendance();
      alert(`Attendance saved for ${items.length} employee(s).`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCheck(action: "checkin" | "checkout") {
    if (checking) return;

    if (date !== todayIST()) {
      alert("Self check-in/out is only available for today.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to ${action === "checkin" ? "check in" : "check out"}?`,
      )
    ) {
      return;
    }

    setChecking(true);

    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action, date }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Attendance action failed.");
      }

      await loadAttendance();
      await loadMine();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setChecking(false);
    }
  }

  async function submitRegularisation() {
    if (!regulariseDate || !regulariseReason.trim()) {
      alert("Date and reason are required.");
      return;
    }

    setSubmittingRequest(true);

    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "regularise",
          date: regulariseDate,
          reason: regulariseReason,
          requestedCheckIn: regulariseIn || undefined,
          requestedCheckOut: regulariseOut || undefined,
          requestedStatus: regulariseStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Request failed.");
      }

      setShowRegularise(false);
      setRegulariseReason("");
      setRegulariseIn("");
      setRegulariseOut("");
      await loadRequests();
      alert("Regularisation request submitted.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function reviewRequest(
    requestId: string,
    reviewStatus: "approved" | "rejected",
  ) {
    if (role !== "admin") return;

    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "review",
          requestId,
          reviewStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Unable to review request.");
      }

      await loadRequests();
      await loadAttendance();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Review failed.");
    }
  }

  function openAddLecture() {
    if (!selectedTeacher || !canManage) return;
    setLectureForm({
      title: "",
      subject: "",
      date,
      startTime: "",
      endTime: "",
      description: "",
      meetingLink: "",
      materialLink: "",
    });
    setShowAddLecture(true);
  }

  async function submitNewLecture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTeacher || !canManage || creatingLecture) return;
    if (
      !lectureForm.title.trim() ||
      !lectureForm.date ||
      !lectureForm.startTime ||
      !lectureForm.endTime
    ) {
      alert("Enter the lecture title, date and start/end times.");
      return;
    }
    const startsAt = new Date(
      `${lectureForm.date}T${lectureForm.startTime}:00+05:30`,
    );
    const endsAt = new Date(
      `${lectureForm.date}T${lectureForm.endTime}:00+05:30`,
    );
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      endsAt <= startsAt
    ) {
      alert("End time must be later than start time on the selected date.");
      return;
    }
    setCreatingLecture(true);
    try {
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          title: lectureForm.title.trim(),
          subject: lectureForm.subject.trim(),
          description: lectureForm.description.trim(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          meetingLink: lectureForm.meetingLink.trim(),
          materialLink: lectureForm.materialLink.trim(),
          status: "scheduled",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.lecture) {
        throw new Error(result.error || "Unable to create lecture.");
      }
      setShowAddLecture(false);
      setDate(lectureForm.date);
      setSelectedLectureId(result.lecture.id);
      setTeachingTab("today");
      await loadLectures();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Unable to create lecture.",
      );
    } finally {
      setCreatingLecture(false);
    }
  }

  function exportCsv() {
    const rows = [
      [
        "Employee ID",
        "Name",
        "Role",
        "Department",
        "Date",
        "Status",
        "Check In",
        "Check Out",
        "Working Hours",
      ],
      ...allStaff.map((user) => {
        const record = getRecord(user.id);

        return [
          user.employeeCode || user.id,
          user.name,
          user.role,
          department(user),
          date,
          record?.status || "unmarked",
          record?.checkIn || "",
          record?.checkOut || "",
          record?.hoursWorked ?? "",
        ];
      }),
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8",
      }),
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `smartiq-staff-attendance-${date}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const filteredNonTeachers = nonTeachers.filter((user) =>
    [user.name, user.email, user.employeeCode || "", department(user)]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function renderLectureTable(items: LectureItem[]) {
    if (lectureLoading) {
      return (
        <div className="p-8 text-center text-slate-500">
          Loading scheduled lectures...
        </div>
      );
    }

    if (lectureError) {
      return <div className="p-8 text-center text-red-600">{lectureError}</div>;
    }

    if (!items.length) {
      return (
        <div className="p-10 text-center">
          <BookOpen className="mx-auto mb-3 text-slate-400" size={28} />
          <p className="font-semibold text-slate-700">
            No lectures scheduled for this faculty in this period.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Select another date or faculty member.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Lecture</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Faculty</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>

          <tbody>
            {items.map((lecture) => (
              <tr
                key={lecture.id}
                className={`border-t border-slate-100 ${
                  selectedLectureId === lecture.id
                    ? "bg-blue-50/50"
                    : "hover:bg-slate-50"
                }`}
              >
                <td className="whitespace-nowrap px-4 py-4">
                  <p className="font-semibold text-[#0A193A]">
                    {displayTime(lecture.startsAt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {displayTime(lecture.endsAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {displayDate(istDate(lecture.startsAt))}
                  </p>
                </td>

                <td className="px-4 py-4 font-semibold text-[#0A193A]">
                  {lecture.title}
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {lecture.subject || "General"}
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {lecture.teacherName || selectedTeacher?.name || "—"}
                </td>

                <td className="px-4 py-4">
                  <StatusBadge status={lecture.status} />
                </td>

                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLectureId(lecture.id);

                      if (teachingTab !== "today") {
                        setTeachingTab("today");
                        setDate(istDate(lecture.startsAt));
                      }
                    }}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#0A54B7] hover:bg-blue-50"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const selectClass =
    "min-w-[112px] rounded-lg border border-transparent px-2 py-2 text-xs font-bold outline-none focus:border-blue-500 disabled:opacity-70";

  function effectiveStatus(user: ManagedUser): StaffAttendanceStatus | "" {
    return editMap[user.id]?.status ?? getRecord(user.id)?.status ?? "";
  }

  function effectiveTime(user: ManagedUser, key: "checkIn" | "checkOut") {
    return editMap[user.id]?.[key] ?? getRecord(user.id)?.[key] ?? "";
  }

  function duration(user: ManagedUser) {
    const a = effectiveTime(user, "checkIn");
    const b = effectiveTime(user, "checkOut");
    if (a && b) {
      const [h1, m1] = a.split(":").map(Number);
      const [h2, m2] = b.split(":").map(Number);
      const minutes = h2 * 60 + m2 - h1 * 60 - m1;
      if (Number.isFinite(minutes) && minutes >= 0)
        return formatMinutes(minutes);
    }
    // Only show saved duration when the displayed times match saved data.
    const saved = getRecord(user.id);
    if (
      saved &&
      saved.checkIn === a &&
      saved.checkOut === b &&
      saved.hoursWorked != null
    )
      return formatMinutes(getWorkingMinutes(saved));
    return "—";
  }

  function currentStats(users: ManagedUser[]) {
    let present = 0,
      absent = 0,
      leave = 0,
      pending = 0,
      checkedIn = 0,
      checkedOut = 0;
    for (const user of users) {
      const status = effectiveStatus(user);
      if (status === "present" || status === "late" || status === "half_day")
        present++;
      if (status === "absent") absent++;
      if (status === "on_leave") leave++;
      if (!status) pending++;
      if (effectiveTime(user, "checkIn")) checkedIn++;
      if (effectiveTime(user, "checkOut")) checkedOut++;
    }
    return { present, absent, leave, pending, checkedIn, checkedOut };
  }

  const activeTeachers = currentStats(teachers);
  const activeNonTeachers = currentStats(nonTeachers);
  const activeAll = currentStats(allStaff);
  const searchedTeachers = teachers.filter((user) =>
    [user.name, user.employeeCode ?? "", user.email, department(user)]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function moveDate(days: number) {
    const [year, month, day] = date.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, day + days));
    setDate(next.toISOString().slice(0, 10));
  }

  function renderStats(
    items: Array<{ label: string; value: number | string; color?: string }>,
  ) {
    return (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] font-medium text-slate-500">
              {item.label}
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${item.color ?? "text-[#0A193A]"}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    );
  }

  function renderRegister(
    users: ManagedUser[],
    editable: boolean,
    teaching: boolean,
  ) {
    const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-xs">
          <thead className="bg-[#F2F6FD] text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">SR</th>
              <th className="min-w-[180px] px-3 py-3">Employee Name</th>
              <th className="px-3 py-3">Employee ID</th>
              <th className="px-3 py-3">
                {teaching ? "Subject / Department" : "Department"}
              </th>
              {!teaching && <th className="px-3 py-3">Employment</th>}
              <th className="px-3 py-3">Check-In</th>
              <th className="px-3 py-3">Check-Out</th>
              <th className="px-3 py-3">Total Duration</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((user, index) => {
              const status = effectiveStatus(user);
              const checkIn = effectiveTime(user, "checkIn");
              const checkOut = effectiveTime(user, "checkOut");
              const canEdit = editable && canManage && !saving;
              return (
                <tr key={user.id} className="hover:bg-[#F6F9FF]">
                  <td className="px-3 py-3 font-semibold text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[#0A54B7]">
                        {initials(user.name)}
                      </span>
                      <span className="font-semibold text-[#0A193A]">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {user.employeeCode || user.id}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {department(user)}
                  </td>
                  {!teaching && (
                    <td className="px-3 py-3 text-slate-600">
                      {employment(user)}
                    </td>
                  )}
                  <td className="px-3 py-3">
                    {editable ? (
                      <StaffTimeInput
                        inputId={`checkin-${user.id}`}
                        value={checkIn}
                        disabled={!canEdit}
                        label={`${user.name} check-in`}
                        onChange={(nextValue) =>
                          updateEdit(user.id, { checkIn: nextValue })
                        }
                        onEnter={() => {
                          const checkout = document.getElementById(
                            `checkout-${user.id}`,
                          ) as HTMLInputElement | null;
                          checkout?.focus();
                        }}
                      />
                    ) : (
                      <span className="font-medium text-slate-600">
                        {checkIn || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editable ? (
                      <StaffTimeInput
                        inputId={`checkout-${user.id}`}
                        value={checkOut}
                        disabled={!canEdit}
                        label={`${user.name} check-out`}
                        onChange={(nextValue) =>
                          updateEdit(user.id, { checkOut: nextValue })
                        }
                      />
                    ) : (
                      <span className="font-medium text-slate-600">
                        {checkOut || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[#0A193A]">
                    {duration(user)}
                  </td>
                  <td className="px-3 py-3">
                    {editable ? (
                      <select
                        value={status}
                        disabled={!canEdit}
                        onChange={(event) =>
                          updateEdit(user.id, {
                            status: event.target.value as StaffAttendanceStatus,
                          })
                        }
                        className={`${selectClass} ${statusColor(status)}`}
                        aria-label={`${user.name} attendance status`}
                      >
                        <option value="">Not marked</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="half_day">Half Day</option>
                        <option value="on_leave">Leave</option>
                        <option value="holiday">Holiday</option>
                      </select>
                    ) : (
                      <StatusBadge status={status || "unmarked"} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!sorted.length && (
          <p className="p-8 text-center text-sm text-slate-500">
            No staff records match your search.
          </p>
        )}
      </div>
    );
  }

  function registerPanel(
    title: string,
    users: ManagedUser[],
    editable: boolean,
    teaching: boolean,
  ) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-[#0A193A]">{title}</h3>
          {!editable && (
            <button
              type="button"
              onClick={() => {
                setTab(teaching ? "teaching" : "nonTeaching");
                setSearch("");
              }}
              className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#0A54B7]"
            >
              Open {teaching ? "teaching" : "non-teaching"} register
            </button>
          )}
          {editable && canManage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => markAll(users, "present")}
                className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-50"
              >
                Mark All Present
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveAttendance(users)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0A54B7] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          )}
        </div>
        {renderRegister(users, editable, teaching)}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500">
        <RefreshCw size={19} className="animate-spin" />
        Loading staff attendance...
      </div>
    );
  }

  return (
    <section
      className={embedded ? "min-w-0 space-y-4 pb-6" : "min-w-0 space-y-4 pb-8"}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            Attendance /{" "}
            {tab === "teaching"
              ? "Teaching Staff"
              : tab === "nonTeaching"
                ? "Non-Teaching Staff"
                : tab === "reports"
                  ? "Reports"
                  : tab === "history"
                    ? "History"
                    : "Staff"}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0A193A]">
            {tab === "teaching"
              ? "Teaching Staff Attendance"
              : tab === "nonTeaching"
                ? "Non-Teaching Staff Attendance"
                : tab === "reports"
                  ? "Reports & History"
                  : tab === "history"
                    ? "Attendance History"
                    : "Staff Attendance Overview"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => moveDate(-1)}
              className="p-2 text-slate-500 hover:bg-slate-50"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <CalendarDays size={15} className="text-[#0A54B7]" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="max-w-[155px] bg-transparent px-2 py-2 text-xs font-semibold text-slate-700"
              aria-label="Attendance date"
            />
            <button
              type="button"
              onClick={() => moveDate(1)}
              className="p-2 text-slate-500 hover:bg-slate-50"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0A193A]"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {userId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
              {initials(userName || "Staff")}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {userName || "My Attendance"}
              </p>
              <p className="text-xs text-slate-500">
                Check-In: {myRecord?.checkIn || "—"} · Check-Out:{" "}
                {myRecord?.checkOut || "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={checking || date !== todayIST() || !!myRecord?.checkIn}
              onClick={() => void handleCheck("checkin")}
              className="rounded-lg bg-[#0A54B7] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              Check In
            </button>
            <button
              type="button"
              disabled={
                checking ||
                date !== todayIST() ||
                !myRecord?.checkIn ||
                !!myRecord?.checkOut
              }
              onClick={() => void handleCheck("checkout")}
              className="rounded-lg border border-blue-300 px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-40"
            >
              Check Out
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {(
          [
            ["overview", "Overview"],
            ["teaching", "Teaching Staff"],
            ["nonTeaching", "Non-Teaching Staff"],
            ["history", "History"],
            ["reports", "Reports"],
          ] as const
        ).map(([key, label]) => (
          <button
            type="button"
            key={key}
            onClick={() => {
              setTab(key);
              setSearch("");
            }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === key ? "bg-[#0A54B7] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {renderStats([
            { label: "Total staff", value: allStaff.length },
            {
              label: "Teaching staff",
              value: teachers.length,
              color: "text-blue-700",
            },
            {
              label: "Non-teaching staff",
              value: nonTeachers.length,
              color: "text-blue-700",
            },
            {
              label: "Checked in",
              value: activeAll.checkedIn,
              color: "text-emerald-600",
            },
            {
              label: "Not checked in",
              value: allStaff.length - activeAll.checkedIn,
              color: "text-amber-600",
            },
            {
              label: "Absent / leave",
              value: activeAll.absent + activeAll.leave,
              color: "text-red-600",
            },
          ])}
          {registerPanel("Teaching staff today", teachers, false, true)}
          {registerPanel("Non-teaching staff today", nonTeachers, false, false)}
        </div>
      )}

      {tab === "teaching" && (
        <div className="space-y-4">
          {renderStats([
            { label: "Teaching staff", value: teachers.length },
            {
              label: "Checked in",
              value: activeTeachers.checkedIn,
              color: "text-emerald-600",
            },
            {
              label: "Lectures today",
              value: dailyLectures.length,
              color: "text-blue-700",
            },
            {
              label: "Not checked in",
              value: teachers.length - activeTeachers.checkedIn,
              color: "text-amber-600",
            },
            {
              label: "Absent / leave",
              value: activeTeachers.absent + activeTeachers.leave,
              color: "text-red-600",
            },
          ])}
          <div className="relative max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search faculty name or employee ID"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs"
            />
          </div>
          {registerPanel(
            "Teaching Staff Attendance Register",
            searchedTeachers,
            true,
            true,
          )}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#0A193A]">
                Faculty Lecture Management
              </h3>
              <select
                value={selectedTeacherId}
                disabled={role === "educator" || !teachers.length}
                onChange={(event) => setSelectedTeacherId(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
              {[
                ["Total lectures", lectureStats.total],
                ["Completed", lectureStats.completed],
                ["Pending", lectureStats.pending],
                ["Cancelled", lectureStats.cancelled],
                ["Teaching hours", lectureStats.hours],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-bold text-[#0A193A]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                {(
                  [
                    ["today", "Today's Lectures"],
                    ["timetable", "Weekly Timetable"],
                    ["lectureHistory", "Lecture History"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setTeachingTab(key)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${teachingTab === key ? "bg-[#0A54B7] text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {canManage && selectedTeacher && (
                <button
                  type="button"
                  onClick={openAddLecture}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700"
                >
                  <Plus size={14} />
                  Add Lecture
                </button>
              )}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-[#0A193A]">
              {teachingTab === "today"
                ? "Today's Lecture Schedule"
                : teachingTab === "timetable"
                  ? "Weekly Timetable"
                  : "Lecture History"}
            </div>
            {renderLectureTable(
              teachingTab === "today"
                ? dailyLectures
                : teachingTab === "timetable"
                  ? weeklyLectures
                  : previousLectures,
            )}
          </div>
          {selectedLecture && teachingTab === "today" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-bold text-[#0A193A]">
                {selectedLecture.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {selectedLecture.subject} ·{" "}
                {displayTime(selectedLecture.startsAt)} –{" "}
                {displayTime(selectedLecture.endsAt)}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["Topic Covered", selectedLecture.topicCovered],
                    ["Homework", selectedLecture.homeworkGiven],
                    ["Assignment", selectedLecture.assignmentGiven],
                    ["Revision Task", selectedLecture.revisionTask],
                    ["Doubts Solved", selectedLecture.doubtsSolved],
                    ["Next Topic", selectedLecture.nextTopic],
                    ["Description", selectedLecture.description],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-xs text-slate-700">
                      {value || "Not recorded"}
                    </p>
                  </div>
                ))}
              </div>
              {selectedLecture.materialLink && (
                <a
                  href={selectedLecture.materialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs font-bold text-blue-700"
                >
                  Open teaching materials
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "nonTeaching" && (
        <div className="space-y-4">
          {renderStats([
            { label: "Non-teaching staff", value: nonTeachers.length },
            {
              label: "Checked in",
              value: activeNonTeachers.checkedIn,
              color: "text-emerald-600",
            },
            {
              label: "Checked out",
              value: activeNonTeachers.checkedOut,
              color: "text-blue-700",
            },
            {
              label: "Not checked in",
              value: nonTeachers.length - activeNonTeachers.checkedIn,
              color: "text-amber-600",
            },
            {
              label: "Absent / leave",
              value: activeNonTeachers.absent + activeNonTeachers.leave,
              color: "text-red-600",
            },
          ])}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNonTeachingTab("register")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${nonTeachingTab === "register" ? "bg-[#0A54B7] text-white" : "bg-white text-slate-600"}`}
            >
              Attendance Register
            </button>
            <button
              type="button"
              onClick={() => setNonTeachingTab("activities")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${nonTeachingTab === "activities" ? "bg-[#0A54B7] text-white" : "bg-white text-slate-600"}`}
            >
              Daily Activities
            </button>
          </div>
          {nonTeachingTab === "register" ? (
            <>
              <div className="relative max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or employee ID"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs"
                />
              </div>
              {registerPanel(
                "Non-Teaching Staff Attendance Register",
                filteredNonTeachers,
                true,
                false,
              )}
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <StaffActivityEditor
                role={role}
                managedUsers={managedUsers}
                userId={userId}
              />
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#0A193A]">
              My Attendance History
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRequests((old) => !old)}
                className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"
              >
                Requests ({requests.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegulariseDate(date);
                  setShowRegularise(true);
                }}
                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
              >
                + Regularise
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-xs">
              <thead className="bg-[#F2F6FD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Check-In</th>
                  <th className="px-3 py-3">Check-Out</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {myHistory.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">{record.date}</td>
                    <td className="px-3 py-3">{record.checkIn || "—"}</td>
                    <td className="px-3 py-3">{record.checkOut || "—"}</td>
                    <td className="px-3 py-3">
                      {formatMinutes(getWorkingMinutes(record))}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!myHistory.length && (
              <p className="p-6 text-center text-slate-500">
                No personal attendance history available.
              </p>
            )}
          </div>
          {showRequests && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold">Regularisation Requests</h4>
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div>
                    <p className="text-xs font-semibold">
                      {request.userName} — {request.date}
                    </p>
                    <p className="text-xs text-slate-500">{request.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={request.status} />
                    {role === "admin" && request.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void reviewRequest(request.id, "approved")
                          }
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void reviewRequest(request.id, "rejected")
                          }
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
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

      {tab === "reports" && (
        <div className="space-y-4">
          {renderStats([
            { label: "Total staff", value: allStaff.length },
            {
              label: "Teaching staff",
              value: teachers.length,
              color: "text-blue-700",
            },
            {
              label: "Non-teaching staff",
              value: nonTeachers.length,
              color: "text-blue-700",
            },
            {
              label: "Checked in",
              value: activeAll.checkedIn,
              color: "text-emerald-600",
            },
            {
              label: "Absent / leave",
              value: activeAll.absent + activeAll.leave,
              color: "text-red-600",
            },
          ])}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-[#0A193A]">
              Selected Date — {displayDate(date)}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Figures below use records for the selected date. Historical
              institution-wide trends require a separate date-range reporting
              API.
            </p>
          </div>
          {registerPanel("Teaching staff", teachers, false, true)}
          {registerPanel("Non-teaching staff", nonTeachers, false, false)}
        </div>
      )}

      {showAddLecture && selectedTeacher && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={(event) => void submitNewLecture(event)}
            role="dialog"
            aria-modal="true"
            aria-label="Add lecture"
            className="my-auto w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#0A193A]">Add Lecture</h3>
              <button
                type="button"
                onClick={() => setShowAddLecture(false)}
                aria-label="Close"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Faculty: <strong>{selectedTeacher.name}</strong> ·{" "}
              {selectedTeacher.employeeCode || selectedTeacher.id}
            </div>
            <label className="block text-sm font-semibold">
              Lecture title *
              <input
                required
                value={lectureForm.title}
                onChange={(e) =>
                  setLectureForm((v) => ({ ...v, title: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="e.g. Mathematics - Algebra"
              />
            </label>
            <label className="block text-sm font-semibold">
              Subject
              <input
                value={lectureForm.subject}
                onChange={(e) =>
                  setLectureForm((v) => ({ ...v, subject: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-semibold">
                Date *
                <input
                  required
                  type="date"
                  value={lectureForm.date}
                  onChange={(e) =>
                    setLectureForm((v) => ({ ...v, date: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold">
                Start time *
                <input
                  required
                  type="time"
                  value={lectureForm.startTime}
                  onChange={(e) =>
                    setLectureForm((v) => ({ ...v, startTime: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold">
                End time *
                <input
                  required
                  type="time"
                  value={lectureForm.endTime}
                  onChange={(e) =>
                    setLectureForm((v) => ({ ...v, endTime: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Description / class or batch details
              <textarea
                rows={3}
                value={lectureForm.description}
                onChange={(e) =>
                  setLectureForm((v) => ({ ...v, description: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Class, batch, room or teaching details"
              />
            </label>
            <label className="block text-sm font-semibold">
              Meeting link
              <input
                type="url"
                value={lectureForm.meetingLink}
                onChange={(e) =>
                  setLectureForm((v) => ({ ...v, meetingLink: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-semibold">
              Teaching material link
              <input
                type="url"
                value={lectureForm.materialLink}
                onChange={(e) =>
                  setLectureForm((v) => ({
                    ...v,
                    materialLink: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setShowAddLecture(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingLecture}
                className="rounded-lg bg-[#0A54B7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {creatingLecture ? "Saving..." : "Save Lecture"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showRegularise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Attendance regularisation"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Request Regularisation</h3>

              <button
                type="button"
                onClick={() => setShowRegularise(false)}
                aria-label="Close"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="date"
                value={regulariseDate}
                max={todayIST()}
                onChange={(event) => setRegulariseDate(event.target.value)}
                className="w-full rounded-lg border p-3"
              />

              <textarea
                value={regulariseReason}
                onChange={(event) => setRegulariseReason(event.target.value)}
                placeholder="Reason"
                className="w-full rounded-lg border p-3"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={regulariseIn}
                  onChange={(event) => setRegulariseIn(event.target.value)}
                  className="rounded-lg border p-3"
                />

                <input
                  type="time"
                  value={regulariseOut}
                  onChange={(event) => setRegulariseOut(event.target.value)}
                  className="rounded-lg border p-3"
                />
              </div>

              <select
                value={regulariseStatus}
                onChange={(event) =>
                  setRegulariseStatus(
                    event.target.value as StaffAttendanceStatus,
                  )
                }
                className="w-full rounded-lg border p-3"
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
              </select>

              <button
                type="button"
                disabled={submittingRequest}
                onClick={() => void submitRegularisation()}
                className="w-full rounded-lg bg-blue-700 p-3 font-bold text-white disabled:opacity-50"
              >
                {submittingRequest ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
