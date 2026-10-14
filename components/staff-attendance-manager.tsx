"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  Plus,
  Download,
  RefreshCw,
  Save,
  Search,
  Users,
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

function StatCard({
  title,
  value,
  color = "blue",
}: {
  title: string;
  value: string | number;
  color?: "blue" | "green" | "red" | "amber" | "violet";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 inline-flex rounded-xl px-3 py-2 text-xl font-bold ${colors[color]}`}
      >
        {value}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
    </div>
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
          user.role === "admin" ||
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

  const getStats = (users: ManagedUser[]) => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let pending = 0;
    let minutes = 0;

    for (const user of users) {
      const record = recordMap.get(user.id);

      if (!record) {
        pending++;
        continue;
      }

      if (record.status === "present") present++;
      if (record.status === "absent") absent++;
      if (record.status === "late") late++;
      if (record.status === "on_leave") leave++;

      minutes += getWorkingMinutes(record);
    }

    return {
      present,
      absent,
      late,
      leave,
      pending,
      hours: formatMinutes(minutes),
    };
  };

  const allStats = getStats(allStaff);
  const teachingStats = getStats(teachers);
  const nonTeachingStats = getStats(nonTeachers);

  const myRecord = userId ? getRecord(userId) : undefined;
  const selectedTeacherRecord = selectedTeacher
    ? getRecord(selectedTeacher.id)
    : undefined;

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
    if (!lectureForm.title.trim() || !lectureForm.date || !lectureForm.startTime || !lectureForm.endTime) {
      alert("Enter the lecture title, date and start/end times.");
      return;
    }
    const startsAt = new Date(`${lectureForm.date}T${lectureForm.startTime}:00+05:30`);
    const endsAt = new Date(`${lectureForm.date}T${lectureForm.endTime}:00+05:30`);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
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
      alert(error instanceof Error ? error.message : "Unable to create lecture.");
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

  function renderTimeEditor(user: ManagedUser) {
    const saved = getRecord(user.id);
    const edit = editMap[user.id];

    const checkIn = edit?.checkIn ?? saved?.checkIn ?? "";
    const checkOut = edit?.checkOut ?? saved?.checkOut ?? "";

    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-xs font-bold text-slate-600">
            Attendance Status
          </label>
          <select
            value={edit?.status ?? saved?.status ?? ""}
            onChange={(event) =>
              updateEdit(user.id, {
                status: event.target.value as StaffAttendanceStatus,
              })
            }
            disabled={!canManage}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
          >
            <option value="">Unmarked</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="on_leave">On Leave</option>
            <option value="holiday">Holiday</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold text-slate-600">
            Check-In Time
          </label>
          <input
            type="time"
            value={checkIn}
            disabled={!canManage}
            onChange={(event) =>
              updateEdit(user.id, {
                checkIn: event.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold text-slate-600">
            Check-Out Time
          </label>
          <input
            type="time"
            value={checkOut}
            disabled={!canManage}
            onChange={(event) =>
              updateEdit(user.id, {
                checkOut: event.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500">
        <RefreshCw className="mr-3 animate-spin" size={20} />
        Loading staff attendance...
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-10">
      {!embedded && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#5546E8]">
              Attendance Management
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#0A193A]">
              Staff Attendance
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Teaching and Non-Teaching employee attendance management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
            <CalendarDays className="text-blue-600" size={18} />

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => {
                void loadAttendance();
                void loadLectures();
              }}
              className="rounded-lg bg-blue-50 p-2 text-blue-700"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-lg bg-[#0A54B7] px-4 py-2 text-sm font-semibold text-white"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      )}

      {userId && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
              {initials(userName || "Staff")}
            </div>

            <div>
              <p className="font-bold text-[#0A193A]">
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
              className="rounded-lg bg-[#5546E8] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
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
              className="rounded-lg border border-[#5546E8] px-4 py-2.5 text-sm font-bold text-[#5546E8] disabled:opacity-40"
            >
              Check Out
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard title="Teaching Staff" value={teachers.length} />
        <StatCard
          title="Non-Teaching"
          value={nonTeachers.length}
          color="violet"
        />
        <StatCard title="Present" value={allStats.present} color="green" />
        <StatCard title="Absent" value={allStats.absent} color="red" />
        <StatCard title="On Leave" value={allStats.leave} color="amber" />
        <StatCard title="Unmarked" value={allStats.pending} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
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
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
              tab === key
                ? "bg-[#0A193A] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setTab("teaching")}
            className="rounded-2xl border border-blue-200 bg-white p-6 text-left shadow-sm hover:border-blue-500"
          >
            <BookOpen className="mb-4 text-blue-600" size={26} />
            <h2 className="text-xl font-bold text-[#0A193A]">Teaching Staff</h2>
            <p className="mt-2 text-sm text-slate-500">
              Faculty attendance, check-in and check-out, scheduled lectures,
              weekly timetable and history.
            </p>
            <p className="mt-4 font-semibold text-blue-700">
              {teachers.length} Faculty Members →
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTab("nonTeaching")}
            className="rounded-2xl border border-violet-200 bg-white p-6 text-left shadow-sm hover:border-violet-500"
          >
            <Users className="mb-4 text-violet-600" size={26} />
            <h2 className="text-xl font-bold text-[#0A193A]">
              Non-Teaching Staff
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Employee attendance, manual check-in/out, working hours and daily
              activities.
            </p>
            <p className="mt-4 font-semibold text-violet-700">
              {nonTeachers.length} Employees →
            </p>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
            <h3 className="mb-4 font-bold text-[#0A193A]">
              Daily Staff Attendance
            </h3>

            <div className="space-y-2">
              {allStaff.map((user) => {
                const record = getRecord(user.id);

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-slate-500">
                        {user.employeeCode || user.id} · {department(user)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden text-xs text-slate-500 sm:inline">
                        {record?.checkIn || "—"} / {record?.checkOut || "—"}
                      </span>
                      <StatusBadge status={record?.status || "unmarked"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "teaching" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700">
                  {initials(selectedTeacher?.name || "TS")}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#0A193A]">
                    {selectedTeacher?.name || "Select Faculty"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {selectedTeacher
                      ? `${department(selectedTeacher)} · ${
                          selectedTeacher.employeeCode || selectedTeacher.id
                        }`
                      : "No faculty available"}
                  </p>

                  <div className="mt-2">
                    <StatusBadge
                      status={selectedTeacherRecord?.status || "unmarked"}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Check-In: {selectedTeacherRecord?.checkIn || "—"} ·
                    Check-Out: {selectedTeacherRecord?.checkOut || "—"}
                  </p>
                </div>
              </div>

              <select
                value={selectedTeacherId}
                disabled={role === "educator" || teachers.length === 0}
                onChange={(event) => setSelectedTeacherId(event.target.value)}
                className="min-w-[240px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatCard title="Total Lectures" value={lectureStats.total} />
              <StatCard
                title="Completed"
                value={lectureStats.completed}
                color="green"
              />
              <StatCard
                title="Pending"
                value={lectureStats.pending}
                color="amber"
              />
              <StatCard
                title="Cancelled"
                value={lectureStats.cancelled}
                color="red"
              />
              <StatCard
                title="Teaching Hours"
                value={lectureStats.hours}
                color="violet"
              />
            </div>

            {selectedTeacher && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-[#0A193A]">
                    Manual Faculty Attendance
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Date: {displayDate(date)} · Enter the selected faculty's
                    daily attendance, check-in and check-out times.
                  </p>
                </div>

                {renderTimeEditor(selectedTeacher)}

                {canManage && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Staff attendance is separate from lecture completion.
                    </p>

                    <button
                      type="button"
                      onClick={() => void saveAttendance([selectedTeacher])}
                      disabled={saving || !editMap[selectedTeacher.id]?.status}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0A54B7] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      <Save size={16} />
                      {saving ? "Saving..." : "Save Faculty Attendance"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["today", "Today's Lectures"],
                ["timetable", "Weekly Timetable"],
                ["lectureHistory", "Lecture History"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTeachingTab(key)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  teachingTab === key
                    ? "bg-[#0A54B7] text-white"
                    : "bg-white text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {teachingTab === "today" && (
            <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[#0A193A]">Lecture Schedule</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {displayDate(date)} · Faculty-specific lectures
                      </p>
                    </div>
                    {canManage && selectedTeacher && (
                      <button
                        type="button"
                        onClick={openAddLecture}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0A54B7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#084899]"
                      >
                        <Plus size={17} /> Add Lecture
                      </button>
                    )}
                  </div>
                </div>

                {renderLectureTable(dailyLectures)}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-4 font-bold text-[#0A193A]">
                  Lecture Details
                </h3>

                {selectedLecture ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h4 className="font-bold text-[#0A193A]">
                        {selectedLecture.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedLecture.subject || "General"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {displayTime(selectedLecture.startsAt)} –{" "}
                        {displayTime(selectedLecture.endsAt)}
                      </p>
                      <div className="mt-3">
                        <StatusBadge status={selectedLecture.status} />
                      </div>
                    </div>

                    {[
                      ["Topic Covered", selectedLecture.topicCovered],
                      ["Homework", selectedLecture.homeworkGiven],
                      ["Assignment", selectedLecture.assignmentGiven],
                      ["Revision Task", selectedLecture.revisionTask],
                      ["Doubts Solved", selectedLecture.doubtsSolved],
                      ["Next Topic", selectedLecture.nextTopic],
                      ["Description", selectedLecture.description],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs font-bold uppercase text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {value || "Not recorded"}
                        </p>
                      </div>
                    ))}

                    {selectedLecture.materialLink && (
                      <a
                        href={selectedLecture.materialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
                      >
                        Open Teaching Materials
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No lecture selected.
                  </div>
                )}
              </div>
            </div>
          )}

          {teachingTab === "timetable" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <h3 className="font-bold text-[#0A193A]">Weekly Timetable</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Actual lectures for the selected week
                </p>
              </div>
              {renderLectureTable(weeklyLectures)}
            </div>
          )}

          {teachingTab === "lectureHistory" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <h3 className="font-bold text-[#0A193A]">Lecture History</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Past lectures before {displayDate(date)}
                </p>
              </div>
              {renderLectureTable(previousLectures)}
            </div>
          )}
        </div>
      )}

      {tab === "nonTeaching" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <StatCard title="Employees" value={nonTeachers.length} />
            <StatCard
              title="Present"
              value={nonTeachingStats.present}
              color="green"
            />
            <StatCard
              title="Absent"
              value={nonTeachingStats.absent}
              color="red"
            />
            <StatCard
              title="Late"
              value={nonTeachingStats.late}
              color="amber"
            />
            <StatCard
              title="On Leave"
              value={nonTeachingStats.leave}
              color="violet"
            />
            <StatCard title="Working Hours" value={nonTeachingStats.hours} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNonTeachingTab("register")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                nonTeachingTab === "register"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              Attendance Register
            </button>

            <button
              type="button"
              onClick={() => setNonTeachingTab("activities")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                nonTeachingTab === "activities"
                  ? "bg-blue-700 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              Daily Activities
            </button>
          </div>

          {nonTeachingTab === "register" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search employees"
                    className="rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
                  />
                </div>

                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => markAll(filteredNonTeachers, "present")}
                      className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                    >
                      All Present
                    </button>

                    <button
                      type="button"
                      onClick={() => markAll(filteredNonTeachers, "absent")}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                    >
                      All Absent
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveAttendance(filteredNonTeachers)}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Attendance"}
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      {[
                        "Employee",
                        "Employee ID",
                        "Department",
                        "Employment",
                        "Check-In",
                        "Check-Out",
                        "Hours",
                        "Status",
                        "Action",
                      ].map((heading) => (
                        <th key={heading} className="px-4 py-3">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredNonTeachers.map((user) => {
                      const record = getRecord(user.id);
                      const edit = editMap[user.id];

                      return (
                        <tr key={user.id} className="border-t border-slate-100">
                          <td className="px-4 py-3">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-xs text-slate-500">
                              {user.email}
                            </p>
                          </td>

                          <td className="px-4 py-3 text-xs">
                            {user.employeeCode || user.id}
                          </td>

                          <td className="px-4 py-3">{department(user)}</td>

                          <td className="px-4 py-3">{employment(user)}</td>

                          <td className="px-4 py-3">
                            <input
                              type="time"
                              disabled={!canManage}
                              value={edit?.checkIn ?? record?.checkIn ?? ""}
                              onChange={(event) =>
                                updateEdit(user.id, {
                                  checkIn: event.target.value,
                                })
                              }
                              className="w-[135px] rounded-lg border border-slate-200 px-2 py-2 text-xs disabled:bg-slate-50"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="time"
                              disabled={!canManage}
                              value={edit?.checkOut ?? record?.checkOut ?? ""}
                              onChange={(event) =>
                                updateEdit(user.id, {
                                  checkOut: event.target.value,
                                })
                              }
                              className="w-[135px] rounded-lg border border-slate-200 px-2 py-2 text-xs disabled:bg-slate-50"
                            />
                          </td>

                          <td className="px-4 py-3">
                            {record?.hoursWorked ?? "—"}
                          </td>

                          <td className="px-4 py-3">
                            <select
                              disabled={!canManage}
                              value={edit?.status ?? record?.status ?? ""}
                              onChange={(event) =>
                                updateEdit(user.id, {
                                  status: event.target
                                    .value as StaffAttendanceStatus,
                                })
                              }
                              className="rounded-lg border border-slate-200 px-2 py-2 text-xs disabled:bg-slate-50"
                            >
                              <option value="">Unmarked</option>
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                              <option value="half_day">Half Day</option>
                              <option value="on_leave">On Leave</option>
                              <option value="holiday">Holiday</option>
                            </select>
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              disabled={
                                !canManage ||
                                saving ||
                                !editMap[user.id]?.status
                              }
                              onClick={() => void saveAttendance([user])}
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-40"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {!filteredNonTeachers.length && (
                  <p className="p-8 text-center text-sm text-slate-500">
                    No employees found.
                  </p>
                )}
              </div>
            </div>
          )}

          {nonTeachingTab === "activities" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 text-lg font-bold text-[#0A193A]">
                Daily Activities
              </h3>

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
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <h3 className="text-xl font-bold text-[#0A193A]">
              My Attendance History
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRequests(!showRequests)}
                className="rounded-lg bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700"
              >
                Requests ({requests.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegulariseDate(date);
                  setShowRegularise(true);
                }}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
              >
                + Regularise
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {myHistory.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div>
                  <p className="font-semibold">{record.date}</p>
                  <p className="text-xs text-slate-500">
                    {record.checkIn || "—"} – {record.checkOut || "—"}
                  </p>
                </div>

                <StatusBadge status={record.status} />
              </div>
            ))}

            {!myHistory.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                No attendance history available.
              </p>
            )}
          </div>

          {showRequests && (
            <div className="mt-5 space-y-2">
              <h4 className="font-bold">Regularisation Requests</h4>

              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {request.userName} — {request.date}
                      </p>
                      <p className="text-xs text-slate-500">{request.reason}</p>
                    </div>

                    <StatusBadge status={request.status} />
                  </div>

                  {role === "admin" && request.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void reviewRequest(request.id, "approved")
                        }
                        className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void reviewRequest(request.id, "rejected")
                        }
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Teaching Staff</h3>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {teachingStats.present}
            </p>
            <p className="text-xs text-slate-500">
              Present faculty on {displayDate(date)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Non-Teaching Staff</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {nonTeachingStats.present}
            </p>
            <p className="text-xs text-slate-500">
              Present employees on {displayDate(date)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Completed Lectures</h3>
            <p className="mt-2 text-3xl font-bold text-violet-700">
              {
                lectures.filter(
                  (lecture) =>
                    istDate(lecture.startsAt) === date &&
                    lecture.status === "completed",
                ).length
              }
            </p>
            <p className="text-xs text-slate-500">
              Completed lectures visible to your account
            </p>
          </div>
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
              <button type="button" onClick={() => setShowAddLecture(false)} aria-label="Close"><XCircle size={20} /></button>
            </div>
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Faculty: <strong>{selectedTeacher.name}</strong> · {selectedTeacher.employeeCode || selectedTeacher.id}
            </div>
            <label className="block text-sm font-semibold">Lecture title *
              <input required value={lectureForm.title} onChange={(e) => setLectureForm((v) => ({ ...v, title: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="e.g. Mathematics - Algebra" />
            </label>
            <label className="block text-sm font-semibold">Subject
              <input value={lectureForm.subject} onChange={(e) => setLectureForm((v) => ({ ...v, subject: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-semibold">Date *
                <input required type="date" value={lectureForm.date} onChange={(e) => setLectureForm((v) => ({ ...v, date: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">Start time *
                <input required type="time" value={lectureForm.startTime} onChange={(e) => setLectureForm((v) => ({ ...v, startTime: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">End time *
                <input required type="time" value={lectureForm.endTime} onChange={(e) => setLectureForm((v) => ({ ...v, endTime: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
            </div>
            <label className="block text-sm font-semibold">Description / class or batch details
              <textarea rows={3} value={lectureForm.description} onChange={(e) => setLectureForm((v) => ({ ...v, description: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="Class, batch, room or teaching details" />
            </label>
            <label className="block text-sm font-semibold">Meeting link
              <input type="url" value={lectureForm.meetingLink} onChange={(e) => setLectureForm((v) => ({ ...v, meetingLink: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="block text-sm font-semibold">Teaching material link
              <input type="url" value={lectureForm.materialLink} onChange={(e) => setLectureForm((v) => ({ ...v, materialLink: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <div className="flex justify-end gap-2 border-t pt-4">
              <button type="button" onClick={() => setShowAddLecture(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={creatingLecture} className="rounded-lg bg-[#0A54B7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{creatingLecture ? "Saving..." : "Save Lecture"}</button>
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
