"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  X,
} from "lucide-react";

import { StaffActivityEditor } from "@/components/staff-activity-editor";
import { StaffLectureAttendance } from "@/components/staff-lecture-attendance";

import type {
  EmploymentType,
  LectureItem,
  ManagedUser,
  RegularisationRequest,
  Role,
  StaffAttendanceRecord,
  StaffAttendanceStatus,
  StaffCategory,
} from "@/lib/types";

type Props = {
  role: Role;
  managedUsers: ManagedUser[];
  userId?: string;
  userName?: string;
  embedded?: boolean;
};

type MainTab = "overview" | "teaching" | "nonTeaching" | "history" | "reports";

type EditValue = {
  status: StaffAttendanceStatus | "";
  checkIn: string;
  checkOut: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type LectureWithAttendance = LectureItem & {
  lectureAttendanceStatus?: "present" | "absent" | "late";
};

type FacultyAttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "partially present";

type RecordedFaculty = {
  teacher: ManagedUser;
  lectureCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  checkIn: string;
  checkOut: string;
  durationMinutes: number;
  attendanceStatus: FacultyAttendanceStatus;
  status: string;
};

const TIMEZONE = "Asia/Kolkata";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-[#0A193A] outline-none focus:border-[#0A54B7]";

function istDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function todayIST() {
  return istDate(new Date().toISOString());
}

function displayDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T12:00:00+05:30`);
  if (!Number.isFinite(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMinutes(value: number) {
  const minutes = Math.max(0, Math.round(value));

  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(
    2,
    "0",
  )}m`;
}

function workingMinutes(record?: StaffAttendanceRecord) {
  const hours = record?.hoursWorked;

  return hours !== undefined && hours !== null && Number.isFinite(hours)
    ? Math.max(0, hours * 60)
    : 0;
}

function department(user: ManagedUser) {
  return (
    user.profile?.department?.trim() ||
    user.profile?.designation?.trim() ||
    (user.role === "educator"
      ? "Teaching Faculty"
      : user.role === "counsellor"
        ? "Counselling"
        : "Staff")
  );
}

function employment(user: ManagedUser): EmploymentType {
  return user.profile?.employmentType ?? "full_time";
}

function attendanceCategory(role: Role): StaffCategory {
  if (role === "educator") return "Teacher";
  if (role === "counsellor") return "Counsellor";
  if (role === "admin") return "Admin";
  return "Staff";
}

function statusStyle(status?: string) {
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
    case "partially present":
    case "partially completed":
    case "half_day":
    case "pending":
    case "in progress":
      return "bg-amber-50 text-amber-700";

    case "on_leave":
      return "bg-violet-50 text-violet-700";

    case "scheduled":
    case "checked out":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(
        status,
      )}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function durationFromTimes(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return "—";

  const [inHours, inMinutes] = checkIn.split(":").map(Number);

  const [outHours, outMinutes] = checkOut.split(":").map(Number);

  const minutes = outHours * 60 + outMinutes - inHours * 60 - inMinutes;

  return Number.isFinite(minutes) && minutes >= 0
    ? formatMinutes(minutes)
    : "—";
}

function lectureStatusOf(
  lecture: LectureWithAttendance,
): "present" | "absent" | "late" | null {
  if (lecture.lectureAttendanceStatus === "absent") {
    return "absent";
  }

  if (lecture.lectureAttendanceStatus === "late") {
    return "late";
  }

  if (
    lecture.lectureAttendanceStatus === "present" ||
    lecture.lectureCheckInAt
  ) {
    return "present";
  }

  return null;
}

function validLectureDuration(lecture: LectureWithAttendance) {
  if (
    lectureStatusOf(lecture) === "absent" ||
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

  return (end - start) / 60000;
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

  const [nonTeachingTab, setNonTeachingTab] = useState<
    "register" | "activities"
  >("register");

  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);

  const [lectures, setLectures] = useState<LectureWithAttendance[]>([]);

  const [myHistory, setMyHistory] = useState<StaffAttendanceRecord[]>([]);

  const [requests, setRequests] = useState<RegularisationRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [lectureLoading, setLectureLoading] = useState(false);
  const [lectureError, setLectureError] = useState("");

  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedTeacherId, setSelectedTeacherId] = useState(() =>
    role === "educator" ? (userId ?? "") : "",
  );

  const [selectedLectureId, setSelectedLectureId] = useState("");

  const [showAddAttendance, setShowAddAttendance] = useState(false);

  const [attendanceLectureId, setAttendanceLectureId] = useState("");

  const [editMap, setEditMap] = useState<Record<string, EditValue>>({});

  const [showRegularise, setShowRegularise] = useState(false);

  const [showRequests, setShowRequests] = useState(false);

  const [regulariseDate, setRegulariseDate] = useState("");

  const [regulariseReason, setRegulariseReason] = useState("");

  const [regulariseIn, setRegulariseIn] = useState("");

  const [regulariseOut, setRegulariseOut] = useState("");

  const [regulariseStatus, setRegulariseStatus] =
    useState<StaffAttendanceStatus>("present");

  const [feedback, setFeedback] = useState<Feedback>(null);

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

  useEffect(() => {
    if (role === "educator" && userId) {
      setSelectedTeacherId(userId);
      return;
    }

    setSelectedTeacherId((previous) => {
      if (previous && teachers.some((teacher) => teacher.id === previous)) {
        return previous;
      }

      return teachers[0]?.id ?? "";
    });
  }, [role, userId, teachers]);

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

      const result = (await response.json()) as {
        records?: StaffAttendanceRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to load staff attendance.");
      }

      const nextRecords = result.records ?? [];
      setRecords(nextRecords);

      const edits: Record<string, EditValue> = {};

      for (const record of nextRecords) {
        edits[record.userId] = {
          status: record.status,
          checkIn: record.checkIn || "",
          checkOut: record.checkOut || "",
        };
      }

      setEditMap(edits);
    } catch (error) {
      console.error("Attendance load failed:", error);

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load staff attendance.",
      });
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

      const result = (await response.json()) as {
        lectures?: LectureWithAttendance[];
        error?: string;
      };

      if (!response.ok || !Array.isArray(result.lectures)) {
        throw new Error(result.error || "Unable to load scheduled lectures.");
      }

      setLectures(result.lectures);
    } catch (error) {
      setLectureError(
        error instanceof Error
          ? error.message
          : "Unable to load scheduled lectures.",
      );
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
        const result = (await response.json()) as {
          records?: StaffAttendanceRecord[];
        };

        setMyHistory(result.records ?? []);
      }
    } catch (error) {
      console.error("Attendance history load failed:", error);
    }
  }, [userId]);

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "list-regularisations",
        }),
      });

      if (response.ok) {
        const result = (await response.json()) as {
          requests?: RegularisationRequest[];
        };

        setRequests(result.requests ?? []);
      }
    } catch (error) {
      console.error("Regularisation load failed:", error);
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

  const recordMap = useMemo(
    () => new Map(records.map((record) => [record.userId, record])),
    [records],
  );

  const getRecord = (id: string) => recordMap.get(id);

  const myRecord = userId ? getRecord(userId) : undefined;

  const dailyLectures = useMemo(
    () =>
      lectures.filter(
        (lecture) =>
          istDate(lecture.startsAt) === date &&
          (!selectedTeacherId || lecture.teacherId === selectedTeacherId),
      ),
    [lectures, date, selectedTeacherId],
  );

  const availableAttendanceLectures = useMemo(() => {
    return lectures
      .filter(
        (lecture) =>
          istDate(lecture.startsAt) === date &&
          lecture.status === "scheduled" &&
          !lecture.lectureCheckOutAt &&
          lecture.lectureAttendanceStatus !== "absent" &&
          (role !== "educator" || lecture.teacherId === userId),
      )
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }, [lectures, date, role, userId]);

  function openAddAttendance() {
    const currentTime = Date.now();

    const nextLecture =
      availableAttendanceLectures.find(
        (lecture) => !!lecture.lectureCheckInAt && !lecture.lectureCheckOutAt,
      ) ??
      availableAttendanceLectures.find(
        (lecture) => Date.parse(lecture.startsAt) >= currentTime,
      ) ??
      availableAttendanceLectures[0];

    setAttendanceLectureId(nextLecture?.id ?? "");
    setShowAddAttendance(true);

    void loadLectures();
  }

  function selectLectureForAttendance() {
    const lecture = availableAttendanceLectures.find(
      (item) => item.id === attendanceLectureId,
    );

    if (!lecture) {
      setFeedback({
        type: "error",
        message: "Select an available scheduled lecture.",
      });
      return;
    }

    setSelectedTeacherId(lecture.teacherId ?? "");
    setSelectedLectureId(lecture.id);
    setDate(istDate(lecture.startsAt));
    setTab("teaching");
    setShowAddAttendance(false);
  }

  function updateEdit(targetId: string, changes: Partial<EditValue>) {
    if (!canManage) return;

    setEditMap((previous) => {
      const saved = getRecord(targetId);

      const next: EditValue = {
        status: previous[targetId]?.status ?? saved?.status ?? "",
        checkIn: previous[targetId]?.checkIn ?? saved?.checkIn ?? "",
        checkOut: previous[targetId]?.checkOut ?? saved?.checkOut ?? "",
        ...changes,
      };

      if (!next.status && next.checkIn) {
        next.status = "present";
      }

      return {
        ...previous,
        [targetId]: next,
      };
    });
  }

  function effectiveEdit(user: ManagedUser): EditValue {
    const saved = getRecord(user.id);

    return (
      editMap[user.id] ?? {
        status: saved?.status ?? "",
        checkIn: saved?.checkIn ?? "",
        checkOut: saved?.checkOut ?? "",
      }
    );
  }

  function markAll(users: ManagedUser[], status: StaffAttendanceStatus) {
    if (!canManage) return;

    setEditMap((previous) => {
      const next = { ...previous };

      for (const user of users) {
        const old = next[user.id] ?? effectiveEdit(user);

        next[user.id] = {
          ...old,
          status,
          checkIn:
            status === "absent" || status === "on_leave" || status === "holiday"
              ? ""
              : old.checkIn,
          checkOut:
            status === "absent" || status === "on_leave" || status === "holiday"
              ? ""
              : old.checkOut,
        };
      }

      return next;
    });
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
      const edit = effectiveEdit(user);

      if (!edit.status) continue;

      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

      if (
        (edit.checkIn && !timePattern.test(edit.checkIn)) ||
        (edit.checkOut && !timePattern.test(edit.checkOut))
      ) {
        setFeedback({
          type: "error",
          message: `Invalid check-in/out time for ${user.name}.`,
        });
        return;
      }

      if (
        (edit.checkOut && !edit.checkIn) ||
        (edit.checkIn && edit.checkOut && edit.checkOut < edit.checkIn)
      ) {
        setFeedback({
          type: "error",
          message: `Check-out must follow check-in for ${user.name}.`,
        });
        return;
      }

      if (
        ["absent", "on_leave", "holiday"].includes(edit.status) &&
        (edit.checkIn || edit.checkOut)
      ) {
        setFeedback({
          type: "error",
          message: `Remove working times for ${user.name} or select a working attendance status.`,
        });
        return;
      }

      items.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        category: attendanceCategory(user.role),
        employmentType: employment(user),
        status: edit.status,
        checkIn: edit.checkIn || undefined,
        checkOut: edit.checkOut || undefined,
      });
    }

    if (!items.length) {
      setFeedback({
        type: "error",
        message: "Mark at least one employee before saving.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "bulk-mark",
          date,
          records: items,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to save attendance.");
      }

      await loadAttendance();

      setFeedback({
        type: "success",
        message: `Attendance saved for ${items.length} employees.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to save attendance.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCheck(action: "checkin" | "checkout") {
    if (checking || date !== todayIST()) return;

    if (
      !window.confirm(
        `Are you sure you want to ${
          action === "checkin" ? "check in" : "check out"
        }?`,
      )
    ) {
      return;
    }

    setChecking(true);

    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          date,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Attendance action failed.");
      }

      await loadAttendance();
      await loadMine();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Attendance action failed.",
      });
    } finally {
      setChecking(false);
    }
  }

  async function submitRegularisation() {
    if (!regulariseDate || !regulariseReason.trim()) {
      setFeedback({
        type: "error",
        message: "Date and reason are required.",
      });
      return;
    }

    setSubmittingRequest(true);

    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "regularise",
          date: regulariseDate,
          reason: regulariseReason,
          requestedCheckIn: regulariseIn || undefined,
          requestedCheckOut: regulariseOut || undefined,
          requestedStatus: regulariseStatus,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit regularisation.");
      }

      setShowRegularise(false);
      setRegulariseReason("");
      setRegulariseIn("");
      setRegulariseOut("");

      await loadRequests();

      setFeedback({
        type: "success",
        message: "Regularisation request submitted.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Regularisation request failed.",
      });
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
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "review",
          requestId,
          reviewStatus,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to review request.");
      }

      await loadRequests();
      await loadAttendance();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to review request.",
      });
    }
  }

  function moveDate(days: number) {
    const [year, month, day] = date.split("-").map(Number);

    const next = new Date(Date.UTC(year, month - 1, day + days));

    setDate(next.toISOString().slice(0, 10));
  }

  function getStats(users: ManagedUser[]) {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let checkedIn = 0;
    let checkedOut = 0;

    for (const user of users) {
      const entry = effectiveEdit(user);

      if (
        entry.status === "present" ||
        entry.status === "late" ||
        entry.status === "half_day"
      ) {
        present++;
      }

      if (entry.status === "absent") absent++;
      if (entry.status === "on_leave") leave++;
      if (entry.checkIn) checkedIn++;
      if (entry.checkOut) checkedOut++;
    }

    return {
      present,
      absent,
      leave,
      checkedIn,
      checkedOut,
    };
  }

  const allStats = getStats(allStaff);
  const teachingStats = getStats(teachers);
  const nonTeachingStats = getStats(nonTeachers);

  const filteredNonTeachers = nonTeachers.filter((user) =>
    [user.name, user.email, user.employeeCode || "", department(user)]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  // ==========================================
  // RECORDED TEACHING FACULTY ATTENDANCE
  // ==========================================

  const recordedTeachingAttendance = useMemo<RecordedFaculty[]>(() => {
    const teacherMap = new Map(
      teachers.map((teacher) => [teacher.id, teacher]),
    );

    const grouped = new Map<
      string,
      {
        teacher: ManagedUser;
        lectures: LectureWithAttendance[];
      }
    >();

    for (const lecture of lectures) {
      if (istDate(lecture.startsAt) !== date || !lecture.teacherId) {
        continue;
      }

      const attendanceStatus = lectureStatusOf(lecture);

      if (!attendanceStatus) continue;

      const teacher = teacherMap.get(lecture.teacherId);

      if (!teacher || teacher.role !== "educator") {
        continue;
      }

      const existing = grouped.get(teacher.id);

      if (existing) {
        existing.lectures.push(lecture);
      } else {
        grouped.set(teacher.id, {
          teacher,
          lectures: [lecture],
        });
      }
    }

    const results: RecordedFaculty[] = [];

    for (const group of grouped.values()) {
      const presentLectures = group.lectures.filter(
        (lecture) => lectureStatusOf(lecture) === "present",
      );

      const lateLectures = group.lectures.filter(
        (lecture) => lectureStatusOf(lecture) === "late",
      );

      const absentLectures = group.lectures.filter(
        (lecture) => lectureStatusOf(lecture) === "absent",
      );

      const takenLectures = [...presentLectures, ...lateLectures];

      if (!takenLectures.length && !absentLectures.length) {
        continue;
      }

      const presentCount = presentLectures.length;
      const lateCount = lateLectures.length;
      const absentCount = absentLectures.length;

      let attendanceStatus: FacultyAttendanceStatus;

      if (absentCount > 0 && takenLectures.length > 0) {
        attendanceStatus = "partially present";
      } else if (absentCount > 0) {
        attendanceStatus = "absent";
      } else if (lateCount > 0) {
        attendanceStatus = "late";
      } else {
        attendanceStatus = "present";
      }

      const checkIns = takenLectures
        .map((lecture) => lecture.lectureCheckInAt)
        .filter(
          (value): value is string =>
            typeof value === "string" && Number.isFinite(Date.parse(value)),
        )
        .sort((a, b) => Date.parse(a) - Date.parse(b));

      const checkOuts = takenLectures
        .map((lecture) => lecture.lectureCheckOutAt)
        .filter(
          (value): value is string =>
            typeof value === "string" && Number.isFinite(Date.parse(value)),
        )
        .sort((a, b) => Date.parse(a) - Date.parse(b));

      const durationMinutes = takenLectures.reduce(
        (sum, lecture) => sum + validLectureDuration(lecture),
        0,
      );

      const completedCount = takenLectures.filter(
        (lecture) => lecture.status === "completed",
      ).length;

      const checkedOutCount = takenLectures.filter((lecture) =>
        Boolean(lecture.lectureCheckOutAt),
      ).length;

      let lectureStatus = "in progress";

      if (!takenLectures.length) {
        lectureStatus = "not taken";
      } else if (completedCount === takenLectures.length && absentCount === 0) {
        lectureStatus = "completed";
      } else if (completedCount > 0 || absentCount > 0) {
        lectureStatus = "partially completed";
      } else if (checkedOutCount === takenLectures.length) {
        lectureStatus = "checked out";
      }

      results.push({
        teacher: group.teacher,
        lectureCount: takenLectures.length,
        presentCount,
        absentCount,
        lateCount,
        checkIn: checkIns[0] ?? "",
        checkOut: checkOuts[checkOuts.length - 1] ?? "",
        durationMinutes: Math.floor(durationMinutes),
        attendanceStatus,
        status: lectureStatus,
      });
    }

    return results.sort((a, b) => a.teacher.name.localeCompare(b.teacher.name));
  }, [lectures, teachers, date]);

  const filteredRecordedTeachingAttendance = recordedTeachingAttendance.filter(
    (entry) => {
      const query = search.trim().toLowerCase();

      if (!query) return true;

      return [
        entry.teacher.name,
        entry.teacher.email,
        entry.teacher.employeeCode ?? "",
        department(entry.teacher),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    },
  );

  const recordedFacultyCount = recordedTeachingAttendance.length;

  const recordedPresentFaculty = recordedTeachingAttendance.filter(
    (entry) => entry.attendanceStatus === "present",
  ).length;

  const recordedAbsentFaculty = recordedTeachingAttendance.filter(
    (entry) => entry.attendanceStatus === "absent",
  ).length;

  const recordedLateFaculty = recordedTeachingAttendance.filter(
    (entry) => entry.lateCount > 0,
  ).length;

  const recordedPartiallyPresentFaculty = recordedTeachingAttendance.filter(
    (entry) => entry.attendanceStatus === "partially present",
  ).length;

  const recordedCheckedIn = recordedTeachingAttendance.filter((entry) =>
    Boolean(entry.checkIn),
  ).length;

  const recordedTotalDuration = recordedTeachingAttendance.reduce(
    (total, entry) => total + entry.durationMinutes,
    0,
  );

  function exportCsv() {
    let rows: unknown[][];

    if (tab === "teaching") {
      rows = [
        [
          "Employee ID",
          "Employee Name",
          "Department",
          "Date",
          "Lectures Taken",
          "Present Lectures",
          "Late Lectures",
          "Absent Lectures",
          "First Check In",
          "Last Check Out",
          "Total Duration",
          "Attendance Status",
          "Lecture Status",
        ],
        ...filteredRecordedTeachingAttendance.map((entry) => [
          entry.teacher.employeeCode || entry.teacher.id,
          entry.teacher.name,
          department(entry.teacher),
          date,
          entry.lectureCount,
          entry.presentCount,
          entry.lateCount,
          entry.absentCount,
          displayTime(entry.checkIn),
          displayTime(entry.checkOut),
          formatMinutes(entry.durationMinutes),
          entry.attendanceStatus,
          entry.status,
        ]),
      ];
    } else {
      rows = [
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
    }

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

  // ==========================================
  // SHARED STAFF ATTENDANCE UI
  // ==========================================

  function renderStats(
    stats: Array<{
      label: string;
      value: number | string;
      color?: string;
    }>,
  ) {
    return (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] font-medium text-slate-500">
              {item.label}
            </p>

            <p
              className={`mt-1 text-2xl font-bold ${
                item.color ?? "text-[#0A193A]"
              }`}
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
              <th className="px-3 py-3">Employee Name</th>
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
              const edit = effectiveEdit(user);

              const editableNow = editable && canManage && !saving;

              const duration =
                edit.checkIn && edit.checkOut
                  ? durationFromTimes(edit.checkIn, edit.checkOut)
                  : formatMinutes(workingMinutes(getRecord(user.id)));

              return (
                <tr key={user.id} className="hover:bg-[#F6F9FF]">
                  <td className="px-3 py-3 font-semibold text-slate-500">
                    {index + 1}
                  </td>

                  <td className="px-3 py-3 font-semibold text-[#0A193A]">
                    {user.name}
                  </td>

                  <td className="px-3 py-3 text-slate-600">
                    {user.employeeCode || user.id}
                  </td>

                  <td className="px-3 py-3 text-slate-600">
                    {department(user)}
                  </td>

                  {!teaching && (
                    <td className="px-3 py-3 text-slate-600">
                      {employment(user).replace(/_/g, " ")}
                    </td>
                  )}

                  <td className="px-3 py-3">
                    {editableNow ? (
                      <input
                        type="time"
                        value={edit.checkIn}
                        onChange={(event) =>
                          updateEdit(user.id, {
                            checkIn: event.target.value,
                          })
                        }
                        aria-label={`${user.name} check-in time`}
                        className={INPUT_CLASS}
                      />
                    ) : (
                      <span>{edit.checkIn || "—"}</span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {editableNow ? (
                      <input
                        type="time"
                        value={edit.checkOut}
                        onChange={(event) =>
                          updateEdit(user.id, {
                            checkOut: event.target.value,
                          })
                        }
                        aria-label={`${user.name} check-out time`}
                        className={INPUT_CLASS}
                      />
                    ) : (
                      <span>{edit.checkOut || "—"}</span>
                    )}
                  </td>

                  <td className="px-3 py-3 font-semibold text-[#0A193A]">
                    {duration}
                  </td>

                  <td className="px-3 py-3">
                    {editableNow ? (
                      <select
                        value={edit.status}
                        onChange={(event) =>
                          updateEdit(user.id, {
                            status: event.target.value as
                              | StaffAttendanceStatus
                              | "",
                          })
                        }
                        aria-label={`${user.name} attendance status`}
                        className={`${INPUT_CLASS} ${statusStyle(edit.status)}`}
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
                      <StatusBadge status={edit.status || "unmarked"} />
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

          {editable && canManage ? (
            <div className="flex flex-wrap gap-2">
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
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Attendance
              </button>
            </div>
          ) : !editable ? (
            <button
              type="button"
              onClick={() => setTab(teaching ? "teaching" : "nonTeaching")}
              className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-[#0A54B7]"
            >
              Open {teaching ? "teaching" : "non-teaching"} register
            </button>
          ) : null}
        </div>

        {renderRegister(users, editable, teaching)}
      </div>
    );
  }

  const navTabs: Array<{
    key: MainTab;
    label: string;
  }> = [
    { key: "overview", label: "Overview" },
    { key: "teaching", label: "Teaching Staff" },
    {
      key: "nonTeaching",
      label: "Non-Teaching Staff",
    },
    { key: "history", label: "History" },
    { key: "reports", label: "Reports" },
  ];

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
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            Attendance /{" "}
            {tab === "teaching"
              ? "Teaching Staff"
              : tab === "nonTeaching"
                ? "Non-Teaching Staff"
                : tab === "history"
                  ? "History"
                  : tab === "reports"
                    ? "Reports"
                    : "Staff"}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[#0A193A]">
            {tab === "teaching"
              ? "Teaching Staff Attendance"
              : tab === "nonTeaching"
                ? "Non-Teaching Staff Attendance"
                : tab === "history"
                  ? "Attendance History"
                  : tab === "reports"
                    ? "Reports & History"
                    : "Staff Attendance Overview"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => moveDate(-1)}
              aria-label="Previous day"
              className="p-2 text-slate-500"
            >
              <ChevronLeft size={16} />
            </button>

            <CalendarDays size={15} className="text-[#0A54B7]" />

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Attendance date"
              className="max-w-[155px] bg-transparent px-2 py-2 text-xs font-semibold text-slate-700"
            />

            <button
              type="button"
              onClick={() => moveDate(1)}
              aria-label="Next day"
              className="p-2 text-slate-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* PERSONAL ATTENDANCE */}

      {userId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-[#0A193A]">
              {userName || "My Attendance"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Check-In: {myRecord?.checkIn || "—"}
              {" · "}
              Check-Out: {myRecord?.checkOut || "—"}
            </p>
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

      {/* MAIN NAVIGATION */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {navTabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setTab(item.key);
                setSearch("");
                setFeedback(null);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                tab === item.key
                  ? "bg-[#0A54B7] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "teaching" && canManage && (
          <button
            type="button"
            onClick={openAddAttendance}
            disabled={lectureLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0A54B7] shadow-sm hover:bg-blue-50 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Attendance
          </button>
        )}
      </div>

      {/* NOTIFICATIONS */}

      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{feedback.message}</span>

          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* OVERVIEW */}

      {tab === "overview" && (
        <div className="space-y-4">
          {renderStats([
            {
              label: "Total staff",
              value: allStaff.length,
            },
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
              value: allStats.checkedIn,
              color: "text-emerald-600",
            },
            {
              label: "Not checked in",
              value: allStaff.length - allStats.checkedIn,
              color: "text-amber-600",
            },
            {
              label: "Absent / leave",
              value: allStats.absent + allStats.leave,
              color: "text-red-600",
            },
          ])}

          {registerPanel("Teaching staff today", teachers, false, true)}

          {registerPanel("Non-teaching staff today", nonTeachers, false, false)}
        </div>
      )}

      {/* ==========================================
          TEACHING STAFF
          ========================================== */}

      {tab === "teaching" && (
        <div className="space-y-5">
          {/* KPIs */}

          {renderStats([
            {
              label: "Teaching staff",
              value: teachers.length,
            },
            {
              label: "Present",
              value: recordedPresentFaculty,
              color: "text-emerald-600",
            },
            {
              label: "Absent",
              value: recordedAbsentFaculty,
              color: "text-red-600",
            },
            {
              label: "Late",
              value: recordedLateFaculty,
              color: "text-amber-600",
            },
            {
              label: "Partially present",
              value: recordedPartiallyPresentFaculty,
              color: "text-amber-600",
            },
            {
              label: "Lectures today",
              value: dailyLectures.length,
              color: "text-blue-700",
            },
            {
              label: "Checked in",
              value: recordedCheckedIn,
              color: "text-emerald-600",
            },
            {
              label: "Not checked in",
              value: Math.max(0, teachers.length - recordedCheckedIn),
              color: "text-amber-600",
            },
          ])}

          {/* LECTURE-WISE ATTENDANCE FIRST */}

          {lectureError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {lectureError}
            </div>
          )}

          <StaffLectureAttendance
            date={date}
            lectures={lectures}
            teachers={teachers}
            selectedTeacherId={selectedTeacherId}
            selectedLectureId={selectedLectureId}
            onTeacherChange={setSelectedTeacherId}
            onRefresh={loadLectures}
            loading={lectureLoading}
            canManage={canManage}
          />

          {/* RECORDED TEACHING ATTENDANCE TABLE */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4">
              <div>
                <h3 className="text-sm font-bold text-[#0A193A]">
                  Recorded Teaching Staff Attendance
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Only teaching faculty with saved lecture attendance on{" "}
                  {displayDate(date)} appear here.
                </p>
              </div>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-[#0A54B7]">
                {recordedFacultyCount} Faculty Recorded
              </span>
            </div>

            {/* SEARCH */}

            <div className="border-b border-slate-100 p-4">
              <div className="relative max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search recorded faculty name or employee ID"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#0A54B7]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-left text-xs">
                <thead className="bg-[#F2F6FD] text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-4">SR</th>
                    <th className="px-3 py-4">Employee Name</th>
                    <th className="px-3 py-4">Employee ID</th>
                    <th className="px-3 py-4">Subject / Department</th>
                    <th className="px-3 py-4">Lectures Taken</th>
                    <th className="px-3 py-4">First Check In</th>
                    <th className="px-3 py-4">Last Check Out</th>
                    <th className="px-3 py-4">Total Duration</th>
                    <th className="px-3 py-4">Attendance Status</th>
                    <th className="px-3 py-4">Lecture Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecordedTeachingAttendance.map((entry, index) => (
                    <tr
                      key={entry.teacher.id}
                      className="transition hover:bg-[#F6F9FF]"
                    >
                      <td className="px-3 py-4 font-semibold text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-3 py-4">
                        <p className="font-bold text-[#0A193A]">
                          {entry.teacher.name}
                        </p>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {entry.teacher.employeeCode || entry.teacher.id}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {department(entry.teacher)}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                            {entry.lectureCount}
                          </span>

                          {entry.lateCount > 0 && (
                            <span className="text-[10px] font-semibold text-amber-700">
                              {entry.lateCount} late
                            </span>
                          )}

                          {entry.absentCount > 0 && (
                            <span className="text-[10px] font-semibold text-red-600">
                              {entry.absentCount} absent
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-4 font-medium text-slate-700">
                        {displayTime(entry.checkIn)}
                      </td>

                      <td className="px-3 py-4 font-medium text-slate-700">
                        {displayTime(entry.checkOut)}
                      </td>

                      <td className="px-3 py-4">
                        <span className="font-bold text-[#0A193A]">
                          {formatMinutes(entry.durationMinutes)}
                        </span>
                      </td>

                      {/* ATTENDANCE STATUS */}

                      <td className="px-3 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={entry.attendanceStatus} />

                          {entry.attendanceStatus === "partially present" && (
                            <span className="text-[10px] text-slate-500">
                              {entry.presentCount} present
                              {" · "}
                              {entry.lateCount} late
                              {" · "}
                              {entry.absentCount} absent
                            </span>
                          )}

                          {entry.attendanceStatus === "late" &&
                            entry.presentCount > 0 && (
                              <span className="text-[10px] text-slate-500">
                                {entry.presentCount} present
                                {" · "}
                                {entry.lateCount} late
                              </span>
                            )}
                        </div>
                      </td>

                      {/* LECTURE STATUS */}

                      <td className="px-3 py-4">
                        <StatusBadge status={entry.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!filteredRecordedTeachingAttendance.length && (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-[#0A193A]">
                    {recordedFacultyCount
                      ? "No recorded faculty matches your search."
                      : "No teaching staff attendance recorded for this date."}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Save Present, Absent or Late lecture attendance above to
                    automatically add the faculty to this table.
                  </p>
                </div>
              )}
            </div>

            {filteredRecordedTeachingAttendance.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Showing {filteredRecordedTeachingAttendance.length} faculty
                  attendance records
                </p>

                <p className="text-xs font-bold text-[#0A193A]">
                  Total Lecture Duration:{" "}
                  {formatMinutes(
                    filteredRecordedTeachingAttendance.reduce(
                      (total, entry) => total + entry.durationMinutes,
                      0,
                    ),
                  )}
                </p>
              </div>
            )}
          </div>

          {/* TOTAL SAVED TEACHING DURATION */}

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-[#0A193A]">
                Total Saved Teaching Duration
              </p>

              <p className="text-lg font-bold text-[#0A54B7]">
                {formatMinutes(recordedTotalDuration)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          NON-TEACHING STAFF
          ========================================== */}

      {tab === "nonTeaching" && (
        <div className="space-y-4">
          {renderStats([
            {
              label: "Non-teaching staff",
              value: nonTeachers.length,
            },
            {
              label: "Checked in",
              value: nonTeachingStats.checkedIn,
              color: "text-emerald-600",
            },
            {
              label: "Checked out",
              value: nonTeachingStats.checkedOut,
              color: "text-blue-700",
            },
            {
              label: "Not checked in",
              value: nonTeachers.length - nonTeachingStats.checkedIn,
              color: "text-amber-600",
            },
            {
              label: "Absent / leave",
              value: nonTeachingStats.absent + nonTeachingStats.leave,
              color: "text-red-600",
            },
          ])}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNonTeachingTab("register")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                nonTeachingTab === "register"
                  ? "bg-[#0A54B7] text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              Attendance Register
            </button>

            <button
              type="button"
              onClick={() => setNonTeachingTab("activities")}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                nonTeachingTab === "activities"
                  ? "bg-[#0A54B7] text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
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

      {/* ==========================================
          ATTENDANCE HISTORY
          ========================================== */}

      {tab === "history" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#0A193A]">
              My Attendance History
            </h3>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowRequests((previous) => !previous)}
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
                      {formatMinutes(workingMinutes(record))}
                    </td>

                    <td className="px-3 py-3">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!myHistory.length && (
              <p className="p-6 text-center text-sm text-slate-500">
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

                    <p className="mt-1 text-xs text-slate-500">
                      {request.reason}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
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

      {/* ==========================================
          REPORTS
          ========================================== */}

      {tab === "reports" && (
        <div className="space-y-4">
          {renderStats([
            {
              label: "Total staff",
              value: allStaff.length,
            },
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
              value: allStats.checkedIn,
              color: "text-emerald-600",
            },
            {
              label: "Absent / leave",
              value: allStats.absent + allStats.leave,
              color: "text-red-600",
            },
          ])}

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-[#0A193A]">
              Selected Date — {displayDate(date)}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Figures below use attendance records for the selected date.
            </p>
          </div>

          {registerPanel("Teaching staff", teachers, false, true)}

          {registerPanel("Non-teaching staff", nonTeachers, false, false)}
        </div>
      )}

      {/* ==========================================
          ADD ATTENDANCE MODAL
          ========================================== */}

      {showAddAttendance && canManage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-attendance-title"
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3
                  id="add-attendance-title"
                  className="text-xl font-bold text-[#0A193A]"
                >
                  Add Lecture Attendance
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Select an existing scheduled lecture to record attendance.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close Add Attendance"
                onClick={() => setShowAddAttendance(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#0A193A]">
                  Select Scheduled Lecture
                </span>

                <select
                  required
                  value={attendanceLectureId}
                  onChange={(event) =>
                    setAttendanceLectureId(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#0A54B7]"
                >
                  <option value="">Select a scheduled lecture</option>

                  {availableAttendanceLectures.map((lecture) => (
                    <option key={lecture.id} value={lecture.id}>
                      {displayTime(lecture.startsAt)}
                      {" — "}
                      {lecture.title}
                      {" — "}
                      {lecture.teacherName || "Faculty"}
                      {lecture.lectureCheckInAt ? " (In Progress)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              {!availableAttendanceLectures.length && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  No available scheduled lectures for {displayDate(date)}.
                  Create a lecture in Lecture Management first.
                </div>
              )}

              {attendanceLectureId &&
                availableAttendanceLectures.some(
                  (lecture) => lecture.id === attendanceLectureId,
                ) && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    {availableAttendanceLectures
                      .filter((lecture) => lecture.id === attendanceLectureId)
                      .map((lecture) => (
                        <div key={lecture.id}>
                          <p className="text-sm font-bold text-[#0A193A]">
                            {lecture.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            {lecture.subject || "General"}
                          </p>

                          <p className="mt-2 text-xs text-slate-600">
                            Faculty: {lecture.teacherName || "—"}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            Time: {displayTime(lecture.startsAt)}
                            {" – "}
                            {displayTime(lecture.endsAt)}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAttendance(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!attendanceLectureId || lectureLoading}
                  onClick={selectLectureForAttendance}
                  className="rounded-lg bg-[#0A54B7] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  Continue to Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          REGULARISATION MODAL
          ========================================== */}

      {showRegularise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="regularisation-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                id="regularisation-title"
                className="text-lg font-bold text-[#0A193A]"
              >
                Request Regularisation
              </h3>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowRegularise(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">
                  Attendance Date
                </span>

                <input
                  type="date"
                  value={regulariseDate}
                  max={todayIST()}
                  onChange={(event) => setRegulariseDate(event.target.value)}
                  className={INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">Reason</span>

                <textarea
                  rows={3}
                  value={regulariseReason}
                  onChange={(event) => setRegulariseReason(event.target.value)}
                  placeholder="Explain the correction request"
                  className={INPUT_CLASS}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-600">
                    Check In
                  </span>

                  <input
                    type="time"
                    value={regulariseIn}
                    onChange={(event) => setRegulariseIn(event.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-600">
                    Check Out
                  </span>

                  <input
                    type="time"
                    value={regulariseOut}
                    onChange={(event) => setRegulariseOut(event.target.value)}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>

              <select
                value={regulariseStatus}
                onChange={(event) =>
                  setRegulariseStatus(
                    event.target.value as StaffAttendanceStatus,
                  )
                }
                className={INPUT_CLASS}
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">Leave</option>
              </select>

              <button
                type="button"
                disabled={submittingRequest}
                onClick={() => void submitRegularisation()}
                className="w-full rounded-lg bg-[#0A54B7] p-3 text-sm font-bold text-white disabled:opacity-50"
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
