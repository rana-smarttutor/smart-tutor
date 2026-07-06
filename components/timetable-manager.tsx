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

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00–21:00
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function getLectureHour(startsAt?: string): number {
  if (!startsAt) return -1;
  const date = new Date(startsAt);
  if (isNaN(date.getTime())) return -1;
  return date.getHours();
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function formatDateRange(value: Date) {
  return value.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
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
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");

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

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const batchOptions = useMemo(() => {
    const ids = [...new Set(items.map((l) => l.batchId).filter(Boolean))] as string[];
    const names = [...new Set(items.map((l) => l.batchName).filter(Boolean))] as string[];
    return ids.map((id, i) => ({ id, name: names[i] || id }));
  }, [items]);

  const teacherOptions = useMemo(() => {
    const ids = [...new Set(items.map((l) => l.teacherId).filter(Boolean))] as string[];
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
      .filter((l) => selectedBatchId === "all" || l.batchId === selectedBatchId)
      .filter((l) => selectedTeacherId === "all" || l.teacherId === selectedTeacherId);
  }, [items, selectedBatchId, selectedTeacherId, weekDays]);

  const todayLectures = useMemo(() => {
    const todayKey = getDateKey(new Date());
    return visibleLectures.filter((l) => {
      if (!l.startsAt) return false;
      return getDateKey(new Date(l.startsAt)) === todayKey;
    }).sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""));
  }, [visibleLectures]);

  const todayIndex = (new Date().getDay() + 6) % 7;

  function getLectureForCell(dayIndex: number, hour: number): LectureItem | undefined {
    return visibleLectures.find((l) => {
      if (!l.startsAt) return false;
      const lDay = getLectureDay(l.startsAt);
      const lHour = getLectureHour(l.startsAt);
      return lDay === dayIndex && lHour === hour;
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
              <button type="button" onClick={onCreateLecture} className="btn-action btn-md font-bold">
                + Add Class
              </button>
            ) : null}
          </div>
        </div>

        {/* Week navigation */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setWeekStart((d) => addDays(d, -7))} className="btn-surface btn-sm">
              ← Previous
            </button>
            <button type="button" onClick={() => setWeekStart(getStartOfWeek(new Date()))} className="btn-action btn-sm">
              This Week
            </button>
            <button type="button" onClick={() => setWeekStart((d) => addDays(d, 7))} className="btn-surface btn-sm">
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
          <span className="text-xs font-bold text-[var(--color-muted)]">Batch:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedBatchId("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                selectedBatchId === "all"
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-background-strong)] text-[var(--color-muted)] hover:text-[var(--color-heading)]"
              }`}
            >
              All
            </button>
            {batchOptions.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBatchId(b.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  selectedBatchId === b.id
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-background-strong)] text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-muted)]">Teacher:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] outline-none"
            >
              <option value="all">— All Teachers —</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
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
                  {l.subject || "Class"} · {formatTime(l.startsAt)}–{formatTime(l.endsAt)}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Type legend */}
      <div className="flex flex-wrap gap-3 text-xs font-bold">
        <span className="rounded-full px-3 py-1" style={{ background: TYPE_COLORS.lecture.bg, color: TYPE_COLORS.lecture.color }}>Lecture</span>
        <span className="rounded-full px-3 py-1" style={{ background: TYPE_COLORS.lab.bg, color: TYPE_COLORS.lab.color }}>Lab</span>
        <span className="rounded-full px-3 py-1" style={{ background: TYPE_COLORS.doubt.bg, color: TYPE_COLORS.doubt.color }}>Doubt</span>
        <span className="rounded-full px-3 py-1" style={{ background: TYPE_COLORS.test.bg, color: TYPE_COLORS.test.color }}>Test</span>
        <span className="rounded-full px-3 py-1" style={{ background: TYPE_COLORS.special.bg, color: TYPE_COLORS.special.color }}>Special</span>
      </div>

      {/* Weekly grid */}
      <div className="surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="tt-grid" style={{
            display: "grid",
            gridTemplateColumns: `60px repeat(7, minmax(130px, 1fr))`,
            minWidth: "750px",
          }}>
            {/* Header row */}
            <div className="bg-[var(--color-background-strong)] p-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]" />
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={`p-2 text-center text-xs font-bold ${
                  i === todayIndex ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "bg-[var(--color-background-strong)] text-[var(--color-muted)]"
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
            {HOURS.map((hour) => (
              <React.Fragment key={`h-${hour}`}>
                <div className="border-t border-[var(--color-border)] p-2 text-[11px] font-bold text-[var(--color-muted)]">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                  const lecture = getLectureForCell(dayIndex, hour);
                  const isToday = dayIndex === todayIndex;
                  return (
                    <div
                      key={`c-${hour}-${dayIndex}`}
                      className={`border-t border-[var(--color-border)] border-l border-[var(--color-border)] p-1 min-h-[52px] relative ${
                        isToday ? "bg-[var(--color-highlight)]" : ""
                      }`}
                    >
                      {lecture ? (
                        <div
                          className="tt-slot rounded-lg p-2 h-full text-xs cursor-pointer transition hover:shadow-md"
                          style={{
                            background: TYPE_COLORS[lecture.status === "completed" ? "lab" : "lecture"].bg,
                            borderLeft: `3px solid ${TYPE_COLORS[lecture.status === "completed" ? "lab" : "lecture"].color}`,
                          }}
                          title={`${lecture.subject || "Class"} · ${facultyNameById.get(lecture.teacherId ?? "") || "Teacher"} · ${formatTime(lecture.startsAt)}–${formatTime(lecture.endsAt)}`}
                        >
                          <p className="font-bold truncate" style={{ color: TYPE_COLORS[lecture.status === "completed" ? "lab" : "lecture"].color }}>
                            {lecture.subject || "Class"}
                          </p>
                          <p className="text-[10px] text-[var(--color-muted)] truncate mt-0.5">
                            {formatTime(lecture.startsAt)}–{formatTime(lecture.endsAt)}
                          </p>
                          <p className="text-[10px] text-[var(--color-muted)] truncate">
                            {facultyNameById.get(lecture.teacherId ?? "") || "Teacher"}
                          </p>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-[10px] text-[var(--color-muted)] opacity-30">+</span>
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

      {/* Summary */}
      <div className="surface rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-[var(--color-heading)]">
            {visibleLectures.length} lecture{visibleLectures.length === 1 ? "" : "s"} this week
          </p>
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-bold text-[var(--color-primary)]">
            {formatDateRange(weekDays[0])} – {formatDateRange(weekDays[6])}
          </span>
        </div>
      </div>
    </section>
  );
}
