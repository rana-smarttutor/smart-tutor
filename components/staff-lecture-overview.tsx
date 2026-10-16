"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type { LectureItem, ManagedUser } from "@/lib/types";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";

type Props = {
  lectures: LectureItem[];
  faculty: ManagedUser[];
};

type LectureForm = {
  teacherId: string;
  subject: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  homework: string;
  assignment: string;
  meetingLink: string;
  materialLink: string;
};

const INDIA_TIMEZONE = "Asia/Kolkata";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0A193A] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function dayKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function todayKey() {
  return dayKey(new Date().toISOString());
}

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    timeZone: INDIA_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeCsv(value: unknown) {
  return '"' + String(value ?? "").replace(/"/g, '""') + '"';
}

// Convert a selected Indian date/time to a UTC ISO timestamp.
// Indian Standard Time is UTC+05:30.
function indiaDateTimeToISO(date: string, time: string) {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!pattern.test(date) || !timePattern.test(time)) {
    throw new Error("Select a valid date and time.");
  }

  const parsed = new Date(`${date}T${time}:00+05:30`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid lecture date or time.");
  }

  // Reject invalid calendar dates, for example February 30.
  if (dayKey(parsed.toISOString()) !== date) {
    throw new Error("Invalid lecture date.");
  }

  return parsed.toISOString();
}

function emptyForm(teacherId = ""): LectureForm {
  return {
    teacherId,
    subject: "",
    topic: "",
    date: todayKey(),
    startTime: "",
    endTime: "",
    homework: "",
    assignment: "",
    meetingLink: "",
    materialLink: "",
  };
}

function statusStyle(status: LectureItem["status"]) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  return "bg-blue-50 text-blue-700";
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-xs font-bold text-[#0A193A]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {children}
    </label>
  );
}

function Time12HourInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  // Convert stored 24-hour HH:MM to displayed 12-hour time.
  const [hours24 = 0, minutes24 = 0] = value
    ? value.split(":").map(Number)
    : [0, 0];

  const hour12 = value ? String(hours24 % 12 || 12).padStart(2, "0") : "";

  const minute = value ? String(minutes24).padStart(2, "0") : "";

  const period: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";

  const [typedHour, setTypedHour] = useState(hour12);
  const [typedMinute, setTypedMinute] = useState(minute);

  useEffect(() => {
    setTypedHour(hour12);
    setTypedMinute(minute);
  }, [hour12, minute]);

  function saveTime(hourText: string, minuteText: string, ampm: "AM" | "PM") {
    const hour = Number(hourText);
    const minuteValue = Number(minuteText);

    if (
      !/^\d{1,2}$/.test(hourText) ||
      !/^\d{1,2}$/.test(minuteText) ||
      hour < 1 ||
      hour > 12 ||
      minuteValue < 0 ||
      minuteValue > 59
    ) {
      // Incomplete typing is allowed.
      // The value is committed once both fields are valid.
      onChange("");
      return;
    }

    const convertedHour = (hour % 12) + (ampm === "PM" ? 12 : 0);

    onChange(
      `${String(convertedHour).padStart(2, "0")}:${String(minuteValue).padStart(
        2,
        "0",
      )}`,
    );
  }

  const fieldClass =
    "min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-3 text-center text-sm font-semibold text-[#0A193A] outline-none focus:border-[#0A54B7]";
  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_80px] items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="HH"
        aria-label={`${label} hour`}
        value={typedHour}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "");
          setTypedHour(next);
          saveTime(next, typedMinute, period);
        }}
        onBlur={() => {
          if (typedHour) {
            setTypedHour(typedHour.padStart(2, "0"));
          }
        }}
        className={`${fieldClass} w-full`}
      />

      <span className="font-bold text-slate-400">:</span>

      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="MM"
        aria-label={`${label} minute`}
        value={typedMinute}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "");
          setTypedMinute(next);
          saveTime(typedHour, next, period);
        }}
        onBlur={() => {
          if (typedMinute) {
            setTypedMinute(typedMinute.padStart(2, "0"));
          }
        }}
        className={`${fieldClass} w-full`}
      />

      <select
        aria-label={`${label} AM or PM`}
        value={period}
        onChange={(event) =>
          saveTime(typedHour, typedMinute, event.target.value as "AM" | "PM")
        }
        className={`${fieldClass} w-full cursor-pointer`}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export function StaffLectureOverview({ lectures, faculty }: Props) {
  const [items, setItems] = useState<LectureItem[]>(lectures);

  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const teachingFaculty = useMemo(
    () =>
      faculty
        .filter((user) => user.role === "educator")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [faculty],
  );

  const [form, setForm] = useState<LectureForm>(() =>
    emptyForm(teachingFaculty[0]?.id ?? ""),
  );

  useEffect(() => {
    setItems(lectures);
  }, [lectures]);

  const refreshLectures = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch("/api/lectures", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        lectures?: LectureItem[];
        error?: string;
      };

      if (!response.ok || !Array.isArray(payload.lectures)) {
        throw new Error(payload.error ?? "Unable to load lectures.");
      }

      setItems(payload.lectures);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to refresh lectures.",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshLectures();
  }, [refreshLectures]);

  function updateForm<Key extends keyof LectureForm>(
    key: Key,
    value: LectureForm[Key],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError("");
  }

  function openAddLecture() {
    setForm(emptyForm(teachingFaculty[0]?.id ?? ""));

    setError("");
    setSuccess("");
    setShowAddModal(true);
  }

  function closeAddLecture() {
    if (saving) {
      return;
    }

    setShowAddModal(false);
    setError("");
  }

  async function submitLecture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    const teacher = teachingFaculty.find((user) => user.id === form.teacherId);

    if (!teacher) {
      setError("Please select a valid faculty member.");
      return;
    }

    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }

    if (!form.topic.trim()) {
      setError("Topic is required.");
      return;
    }

    if (!form.date || !form.startTime || !form.endTime) {
      setError("Lecture date, start time and end time are required.");
      return;
    }

    let startsAt: string;
    let endsAt: string;

    try {
      startsAt = indiaDateTimeToISO(form.date, form.startTime);

      endsAt = indiaDateTimeToISO(form.date, form.endTime);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Invalid lecture time.",
      );
      return;
    }

    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setError("End time must be later than start time.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/lectures", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher.id,

          // Existing lecture model:
          // title = Subject
          // subject = Topic
          title: form.subject.trim(),
          subject: form.topic.trim(),

          startsAt,
          endsAt,

          description: form.assignment.trim() || undefined,
          homeworkGiven: form.homework.trim() || undefined,
          assignmentGiven: form.assignment.trim() || undefined,

          meetingLink: form.meetingLink.trim() || undefined,
          materialLink: form.materialLink.trim() || undefined,

          status: "scheduled",

          // Do not assign every institute student automatically.
          assignedStudentIds: [],
        }),
      });

      const payload = (await response.json()) as {
        lecture?: LectureItem;
        error?: string;
      };

      if (!response.ok || !payload.lecture) {
        throw new Error(payload.error ?? "Unable to create lecture.");
      }

      const created = payload.lecture;

      // Immediately display the new lecture.
      setItems((previous) => [
        created,
        ...previous.filter((item) => item.id !== created.id),
      ]);

      setShowAddModal(false);
      setForm(emptyForm(teacher.id));

      setSuccess(
        `Lecture "${created.title}" was created successfully for ${teacher.name}.`,
      );

      // Fetch persisted records again after creation.
      void refreshLectures();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to create lecture.",
      );
    } finally {
      setSaving(false);
    }
  }

  const today = todayKey();

  const summary = useMemo(
    () => ({
      today: items.filter((lecture) => dayKey(lecture.startsAt) === today)
        .length,

      scheduled: items.filter(
        (lecture) =>
          lecture.status === "scheduled" && !lecture.lectureCheckInAt,
      ).length,

      inProgress: items.filter(
        (lecture) =>
          lecture.status === "scheduled" &&
          !!lecture.lectureCheckInAt &&
          !lecture.lectureCheckOutAt,
      ).length,

      completed: items.filter((lecture) => lecture.status === "completed")
        .length,

      cancelled: items.filter((lecture) => lecture.status === "cancelled")
        .length,
    }),
    [items, today],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items
      .filter((lecture) =>
        [lecture.title, lecture.subject, lecture.teacherName].some((value) =>
          (value ?? "").toLowerCase().includes(query),
        ),
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [items, search]);

  async function changeLectureStatus(
    lecture: LectureItem,
    nextStatus: "scheduled" | "cancelled",
  ) {
    if (updatingStatusId) return;

    if (lecture.status === nextStatus) return;

    if (
      lecture.status === "completed" ||
      lecture.lectureCheckInAt ||
      lecture.lectureCheckOutAt
    ) {
      setError("A started or completed lecture cannot be changed here.");
      return;
    }

    if (
      nextStatus === "cancelled" &&
      !window.confirm(`Are you sure you want to cancel "${lecture.title}"?`)
    ) {
      return;
    }

    setUpdatingStatusId(lecture.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/lectures/${encodeURIComponent(lecture.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const result = (await response.json()) as {
        lecture?: LectureItem;
        error?: string;
      };

      if (!response.ok || !result.lecture) {
        throw new Error(result.error || "Unable to update lecture status.");
      }

      setItems((previous) =>
        previous.map((item) =>
          item.id === result.lecture!.id ? result.lecture! : item,
        ),
      );

      setSuccess(
        `Lecture status changed to ${
          nextStatus === "cancelled" ? "Cancelled" : "Scheduled"
        }.`,
      );

      await refreshLectures();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update lecture status.",
      );
    } finally {
      setUpdatingStatusId("");
    }
  }

  function exportCsv() {
    const headers = ["Title", "Subject", "Faculty", "Start", "End", "Status"];

    const rows = visible.map((lecture) => [
      lecture.title,
      lecture.subject,
      lecture.teacherName,
      lecture.startsAt,
      lecture.endsAt,
      lecture.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8",
      }),
    );

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "smartiq-lectures.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  const cards = [
    {
      label: "Lectures Today",
      value: summary.today,
      icon: CalendarDays,
    },
    {
      label: "Scheduled",
      value: summary.scheduled,
      icon: Clock3,
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      icon: RefreshCw,
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
    },
    {
      label: "Cancelled",
      value: summary.cancelled,
      icon: XCircle,
    },
  ];

  return (
    <section className="space-y-5 text-slate-900">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Academic Management
          </p>

          <h2 className="mt-1 text-2xl font-extrabold text-[#0A193A]">
            Lecture Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Available lecture records and timetable at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setError("");
              void refreshLectures();
            }}
            disabled={refreshing}
            title="Refresh lectures"
            aria-label="Refresh lectures"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={openAddLecture}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A54B7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084899]"
          >
            <Plus size={17} />
            Add Lecture
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A54B7] transition hover:bg-blue-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ERROR OUTSIDE MODAL */}
      {error && !showAddModal && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <card.icon className="mb-3 text-blue-600" size={22} />

            <p className="text-2xl font-extrabold text-[#0A193A]">
              {card.value}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* LECTURE TIMETABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h3 className="font-bold text-[#0A193A]">Lecture Timetable</h3>

            <p className="mt-1 text-xs text-slate-500">
              {visible.length} lecture record(s)
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search lectures or faculty"
            className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {["Lecture", "Faculty", "Start", "End", "Status"].map(
                  (heading) => (
                    <th key={heading} className="px-5 py-3">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visible.map((lecture) => (
                <tr key={lecture.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#0A193A]">
                      {lecture.title}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {lecture.subject || "General"}
                    </div>
                  </td>

                  <td className="px-5 py-4">{lecture.teacherName || "—"}</td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {formatDateTime(lecture.startsAt)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {formatDateTime(lecture.endsAt)}
                  </td>

                  <td className="px-5 py-4">
                    {lecture.status === "completed" ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Completed
                      </span>
                    ) : lecture.lectureCheckOutAt ? (
                      <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                        Checked Out
                      </span>
                    ) : lecture.lectureCheckInAt ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                        In Progress
                      </span>
                    ) : (
                      <select
                        aria-label={`Status for ${lecture.title}`}
                        value={lecture.status}
                        disabled={!!updatingStatusId || refreshing}
                        onChange={(event) =>
                          void changeLectureStatus(
                            lecture,
                            event.target.value as "scheduled" | "cancelled",
                          )
                        }
                        className={`rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 disabled:opacity-50 ${statusStyle(
                          lecture.status,
                        )}`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!visible.length && (
            <div className="p-10 text-center text-sm text-slate-500">
              <BookOpen className="mx-auto mb-3 text-slate-400" />

              {search
                ? "No lectures match your search."
                : "No lectures are available to your staff account. Please verify faculty assignments and lecture access."}
            </div>
          )}
        </div>
      </div>

      {/* ADD LECTURE MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-add-lecture-heading"
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h3
                  id="staff-add-lecture-heading"
                  className="text-lg font-extrabold text-[#0A193A]"
                >
                  Add New Lecture
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Schedule a lecture for a teaching faculty member.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeAddLecture}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close Add Lecture"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={(event) => void submitLecture(event)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700"
                  >
                    {error}
                  </div>
                )}

                {/* FACULTY */}
                <Field label="Select Faculty" required>
                  <select
                    required
                    value={form.teacherId}
                    onChange={(event) =>
                      updateForm("teacherId", event.target.value)
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="">Select teaching faculty</option>

                    {teachingFaculty.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                        {teacher.employeeCode
                          ? ` (${teacher.employeeCode})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                {teachingFaculty.length === 0 && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    No teaching faculty are available in the current directory.
                    Check faculty accounts and staff access.
                  </p>
                )}

                {/* SUBJECT AND TOPIC */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Subject" required>
                    <input
                      required
                      maxLength={150}
                      value={form.subject}
                      onChange={(event) =>
                        updateForm("subject", event.target.value)
                      }
                      placeholder="e.g. Mathematics"
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field label="Topic" required>
                    <input
                      required
                      maxLength={150}
                      value={form.topic}
                      onChange={(event) =>
                        updateForm("topic", event.target.value)
                      }
                      placeholder="e.g. Quadratic Equations"
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>

                {/* DATE */}
                <Field label="Lecture Date" required>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm("date", event.target.value)}
                    className={INPUT_CLASS}
                  />
                </Field>

                {/* TIME - 12 HOUR AM/PM */}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Start Time" required>
                    <Time12HourInput
                      label="Start Time"
                      value={form.startTime}
                      onChange={(value) => updateForm("startTime", value)}
                    />
                  </Field>

                  <Field label="End Time" required>
                    <Time12HourInput
                      label="End Time"
                      value={form.endTime}
                      onChange={(value) => updateForm("endTime", value)}
                    />
                  </Field>
                </div>

                {/* HOMEWORK */}
                <Field label="Homework Given">
                  <textarea
                    rows={3}
                    value={form.homework}
                    onChange={(event) =>
                      updateForm("homework", event.target.value)
                    }
                    placeholder="Enter homework details (optional)"
                    className={INPUT_CLASS}
                  />
                </Field>

                {/* ASSIGNMENT */}
                <Field label="Assignment">
                  <textarea
                    rows={3}
                    value={form.assignment}
                    onChange={(event) =>
                      updateForm("assignment", event.target.value)
                    }
                    placeholder="Enter assignment details (optional)"
                    className={INPUT_CLASS}
                  />
                </Field>

                {/* LINKS */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Meeting Link">
                    <input
                      type="url"
                      value={form.meetingLink}
                      onChange={(event) =>
                        updateForm("meetingLink", event.target.value)
                      }
                      placeholder="https://meet.google.com/..."
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field label="Material Link">
                    <input
                      type="url"
                      value={form.materialLink}
                      onChange={(event) =>
                        updateForm("materialLink", event.target.value)
                      }
                      placeholder="https://..."
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeAddLecture}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || teachingFaculty.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0A54B7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#084899] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}

                  {saving ? "Saving..." : "Save Lecture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
