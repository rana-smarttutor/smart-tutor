"use client";

import React, { useEffect, useMemo, useState } from "react";

import type { LectureItem, ManagedUser, Role, SessionUser } from "@/lib/types";

type TimetableManagerProps = {
  role: Role;
  lectures: LectureItem[];
  managedUsers: ManagedUser[];
  session: SessionUser | null;
  onCreateLecture: () => void;
};

const SLOTS = [
  { startHour: 8, startMin: 30 },
  { startHour: 10, startMin: 0 },
  { startHour: 11, startMin: 30 },
  { startHour: 13, startMin: 0 },
  { startHour: 14, startMin: 30 },
  { startHour: 16, startMin: 0 },
  { startHour: 17, startMin: 30 },
  { startHour: 19, startMin: 0 },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function slotLabel(slot: { startHour: number; startMin: number }) {
  return `${String(slot.startHour).padStart(2, "0")}:${String(slot.startMin).padStart(2, "0")}`;
}

function slotEndLabel(slot: { startHour: number; startMin: number }) {
  const total = slot.startHour * 60 + slot.startMin + 90;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  lecture: { bg: "rgba(79,70,229,0.12)", color: "var(--color-primary)" },
  lab: { bg: "#F0F9FF", color: "#0EA5E9" },
  doubt: { bg: "#FFFBEB", color: "#F59E0B" },
  test: { bg: "#FEF2F2", color: "#EF4444" },
  special: { bg: "rgba(139,92,246,0.12)", color: "#8B5CF6" },
};

function getStartOfWeek(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function getDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLectureDay(startsAt?: string): number {
  if (!startsAt) return -1;
  const date = new Date(startsAt);
  if (isNaN(date.getTime())) return -1;
  return (date.getDay() + 6) % 7; // Mon=0, Sun=6
}

function getLectureSlotIndex(startsAt?: string): number {
  if (!startsAt) return -1;
  const date = new Date(startsAt);
  if (isNaN(date.getTime())) return -1;
  const totalMins = date.getHours() * 60 + date.getMinutes();
  for (let i = 0; i < SLOTS.length; i++) {
    const s = SLOTS[i];
    const startMins = s.startHour * 60 + s.startMin;
    const endMins = startMins + 90;
    if (totalMins >= startMins && totalMins < endMins) return i;
  }
  return -1;
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
function formatDateRange(value: Date) {
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatLectureDate(value?: string) {
  if (!value) {
    return "Date not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function TimetableManager({
  role,
  lectures,
  managedUsers,
  session,
  onCreateLecture,
}: TimetableManagerProps) {
  const [items, setItems] = useState<LectureItem[]>(lectures);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedLecture, setSelectedLecture] = useState<LectureItem | null>(
    null,
  );

  useEffect(() => {
    setItems(lectures);
  }, [lectures]);

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>();
    managedUsers.forEach((user) => {
      if (user.role === "educator") map.set(user.id, user.name);
    });
    if (session?.id && session?.name) map.set(session.id, session.name);
    return map;
  }, [managedUsers, session]);
  const facultyById = useMemo(() => {
    const map = new Map<string, ManagedUser>();

    managedUsers.forEach((user) => {
      if (user.role === "educator") {
        map.set(user.id, user);
      }
    });

    return map;
  }, [managedUsers]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const teacherOptions = useMemo(() => {
    const ids = [
      ...new Set(items.map((l) => l.teacherId).filter(Boolean)),
    ] as string[];
    return ids.map((id) => ({
      id,
      name: facultyNameById.get(id) || "Unknown",
    }));
  }, [items, facultyNameById]);

  const visibleLectures = useMemo(() => {
    const weekStartKey = getDateKey(weekDays[0]);
    const weekEndKey = getDateKey(weekDays[6]);
    return items
      .filter((l) => l.status !== "cancelled")
      .filter((l) => {
        if (!l.startsAt) return false;
        const lk = getDateKey(new Date(l.startsAt));
        return lk >= weekStartKey && lk <= weekEndKey;
      })
      .filter(
        (l) => selectedTeacherId === "all" || l.teacherId === selectedTeacherId,
      );
  }, [items, selectedTeacherId, weekDays]);

  const todayLectures = useMemo(() => {
    const todayKey = getDateKey(new Date());
    return visibleLectures
      .filter((l) => {
        if (!l.startsAt) return false;
        return getDateKey(new Date(l.startsAt)) === todayKey;
      })
      .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""));
  }, [visibleLectures]);

  const todayIndex = (new Date().getDay() + 6) % 7;

  function getLectureForCell(
    dayIndex: number,
    slotIndex: number,
  ): LectureItem | undefined {
    return visibleLectures.find((l) => {
      if (!l.startsAt) return false;
      return (
        getLectureDay(l.startsAt) === dayIndex &&
        getLectureSlotIndex(l.startsAt) === slotIndex
      );
    });
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Academic Schedule</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-heading)]">
              {role === "admin" ? "Institute Timetable" : "My Timetable"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Manage class schedules — conflicts are automatically prevented
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === "admin" || role === "educator" ? (
              <button
                type="button"
                onClick={onCreateLecture}
                className="btn-action btn-md font-bold"
              >
                + Add Class
              </button>
            ) : null}
          </div>
        </div>

        {/* Week navigation */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              className="btn-surface btn-sm"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(getStartOfWeek(new Date()))}
              className="btn-action btn-sm"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              className="btn-surface btn-sm"
            >
              Next →
            </button>
          </div>
          <span className="text-xs font-bold text-[var(--color-muted)]">
            {formatDateRange(weekDays[0])} — {formatDateRange(weekDays[6])}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="surface rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-muted)]">
              Teacher:
            </span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] outline-none"
            >
              <option value="all">— All Teachers —</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Today banner */}
      {todayLectures.length > 0 ? (
        <div className="surface rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white">
              TODAY
            </span>
            <span className="text-sm font-bold text-[var(--color-heading)]">
              {DAYS[todayIndex]}
            </span>
            <div className="flex flex-wrap gap-2">
              {todayLectures.map((l) => (
                <span
                  key={l.id}
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    background: "var(--color-primary-soft)",
                    color: "var(--color-primary)",
                  }}
                >
                  {l.subject || "Class"} · {formatTime(l.startsAt)}–
                  {formatTime(l.endsAt)}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Type legend */}
      <div className="flex flex-wrap gap-3 text-xs font-bold">
        <span
          className="rounded-full px-3 py-1"
          style={{
            background: TYPE_COLORS.lecture.bg,
            color: TYPE_COLORS.lecture.color,
          }}
        >
          Lecture
        </span>
        <span
          className="rounded-full px-3 py-1"
          style={{
            background: TYPE_COLORS.lab.bg,
            color: TYPE_COLORS.lab.color,
          }}
        >
          Lab
        </span>
        <span
          className="rounded-full px-3 py-1"
          style={{
            background: TYPE_COLORS.doubt.bg,
            color: TYPE_COLORS.doubt.color,
          }}
        >
          Doubt
        </span>
        <span
          className="rounded-full px-3 py-1"
          style={{
            background: TYPE_COLORS.test.bg,
            color: TYPE_COLORS.test.color,
          }}
        >
          Test
        </span>
        <span
          className="rounded-full px-3 py-1"
          style={{
            background: TYPE_COLORS.special.bg,
            color: TYPE_COLORS.special.color,
          }}
        >
          Special
        </span>
      </div>

      {/* Weekly grid */}
      <div className="surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className="tt-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `60px repeat(7, minmax(130px, 1fr))`,
              minWidth: "750px",
            }}
          >
            {/* Header row */}
            <div className="bg-[var(--color-background-strong)] p-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]" />
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={`p-2 text-center text-xs font-bold ${
                  i === todayIndex
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "bg-[var(--color-background-strong)] text-[var(--color-muted)]"
                }`}
              >
                {day}
                <br />
                <span style={{ fontSize: "10px", fontWeight: 400 }}>
                  {formatDateRange(weekDays[i])}
                </span>
              </div>
            ))}

            {/* Time rows */}
            {SLOTS.map((slot, slotIndex) => (
              <React.Fragment key={`slot-${slotIndex}`}>
                <div className="border-t border-[var(--color-border)] p-2 text-[11px] font-bold leading-tight text-[var(--color-muted)]">
                  <span className="block">{slotLabel(slot)}</span>

                  <span className="block text-[9px] opacity-60">
                    – {slotEndLabel(slot)}
                  </span>
                </div>

                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                  const lecture = getLectureForCell(dayIndex, slotIndex);

                  const isToday = dayIndex === todayIndex;

                  return (
                    <div
                      key={`cell-${slotIndex}-${dayIndex}`}
                      className={`relative min-h-[125px] border-l border-t border-[var(--color-border)] p-1 ${
                        isToday ? "bg-[var(--color-highlight)]" : ""
                      }`}
                    >
                      {lecture ? (
                        <div
                          className="tt-slot flex h-full flex-col rounded-xl p-2 text-xs transition hover:-translate-y-0.5 hover:shadow-md"
                          style={{
                            background:
                              TYPE_COLORS[
                                lecture.status === "completed"
                                  ? "lab"
                                  : "lecture"
                              ].bg,

                            borderLeft: `3px solid ${
                              TYPE_COLORS[
                                lecture.status === "completed"
                                  ? "lab"
                                  : "lecture"
                              ].color
                            }`,
                          }}
                        >
                          <p
                            className="truncate font-black"
                            style={{
                              color:
                                TYPE_COLORS[
                                  lecture.status === "completed"
                                    ? "lab"
                                    : "lecture"
                                ].color,
                            }}
                          >
                            {lecture.subject || "Class"}
                          </p>

                          <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-[var(--color-heading)]">
                            {lecture.topicCovered || lecture.title}
                          </p>

                          <p className="mt-1 truncate text-[9px] text-[var(--color-muted)]">
                            {facultyNameById.get(lecture.teacherId ?? "") ||
                              lecture.teacherName ||
                              "Faculty"}
                          </p>

                          <p className="mt-0.5 truncate text-[9px] text-[var(--color-muted)]">
                            {formatTime(lecture.startsAt)}

                            {" – "}

                            {formatTime(lecture.endsAt)}
                          </p>

                          <button
                            type="button"
                            onClick={() => setSelectedLecture(lecture)}
                            className="mt-auto w-full rounded-lg bg-white/90 px-2 py-1.5 text-[9px] font-black text-[var(--color-primary)] shadow-sm transition hover:bg-white"
                          >
                            View Lecture
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-[10px] text-[var(--color-muted)] opacity-30">
                            +
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {selectedLecture ? (
        <LectureDetailsModal
          lecture={selectedLecture}
          facultyById={facultyById}
          facultyNameById={facultyNameById}
          onClose={() => setSelectedLecture(null)}
        />
      ) : null}
      {/* Summary */}
      <div className="surface rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-[var(--color-heading)]">
            {visibleLectures.length} lecture
            {visibleLectures.length === 1 ? "" : "s"} this week
          </p>
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-bold text-[var(--color-primary)]">
            {formatDateRange(weekDays[0])} – {formatDateRange(weekDays[6])}
          </span>
        </div>
      </div>
    </section>
  );
}
function LectureDetailsModal({
  lecture,
  facultyById,
  facultyNameById,
  onClose,
}: {
  lecture: LectureItem;

  facultyById: Map<string, ManagedUser>;

  facultyNameById: Map<string, string>;

  onClose: () => void;
}) {
  const faculty = facultyById.get(lecture.teacherId ?? "");

  const facultyName =
    faculty?.name ||
    lecture.teacherName ||
    facultyNameById.get(lecture.teacherId ?? "") ||
    "Faculty";

  const facultyPhoto = faculty?.profilePhoto || faculty?.profile?.profilePhoto;

  const statusLabel =
    lecture.status === "completed"
      ? "Completed"
      : lecture.status === "cancelled"
        ? "Cancelled"
        : "Scheduled";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lecture-popup-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/20 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              {facultyPhoto ? (
                <img
                  src={facultyPhoto}
                  alt={facultyName}
                  className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white object-cover object-top shadow-md"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-md">
                  {getInitials(facultyName) || "F"}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                  Faculty
                </p>

                <h2
                  id="lecture-popup-title"
                  className="mt-1 truncate text-xl font-black text-slate-900"
                >
                  {facultyName}
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {lecture.subject || "General"} Faculty
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close lecture details"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-bold text-slate-500 transition hover:bg-slate-100"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
              Lecture
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {lecture.title}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {lecture.subject || "General"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LectureDetailBox
              label="Date"
              value={formatLectureDate(lecture.startsAt)}
            />

            <LectureDetailBox
              label="Start Time"
              value={formatTime(lecture.startsAt) || "Not available"}
            />

            <LectureDetailBox
              label="End Time"
              value={formatTime(lecture.endsAt) || "Not available"}
            />

            <LectureDetailBox label="Status" value={statusLabel} />
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">
              Topic of Lecture
            </p>

            <p className="mt-2 text-lg font-black text-indigo-950">
              {lecture.topicCovered || lecture.title}
            </p>
          </div>

          {lecture.description ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Lecture Details
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {lecture.description}
              </p>
            </div>
          ) : null}

          {lecture.status === "completed" ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Lecture Report
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <PopupReportItem
                  label="Topic Covered"
                  value={lecture.topicCovered}
                />

                <PopupReportItem
                  label="Doubts Solved"
                  value={lecture.doubtsSolved}
                />

                <PopupReportItem
                  label="Homework"
                  value={lecture.homeworkGiven}
                />

                <PopupReportItem
                  label="Assignment"
                  value={lecture.assignmentGiven}
                />

                <PopupReportItem
                  label="Revision Task"
                  value={lecture.revisionTask}
                />

                <PopupReportItem label="Next Topic" value={lecture.nextTopic} />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
            {lecture.status === "scheduled" && lecture.meetingLink ? (
              <a
                href={lecture.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="action-button px-6 py-3 text-sm"
              >
                Join Lecture
              </a>
            ) : null}

            {lecture.recordingLink ? (
              <a
                href={lecture.recordingLink}
                target="_blank"
                rel="noreferrer"
                className="action-button px-6 py-3 text-sm"
              >
                Watch Recording
              </a>
            ) : null}

            {lecture.materialLink ? (
              <a
                href={lecture.materialLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Open Material
              </a>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function LectureDetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function PopupReportItem({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-600">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
        {value}
      </p>
    </div>
  );
}
