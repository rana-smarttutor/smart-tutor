"use client";

import { useEffect, useMemo, useState } from "react";

import type { LectureItem, ManagedUser, Role, SessionUser } from "@/lib/types";

type TimetableManagerProps = {
  role: Role;
  lectures: LectureItem[];
  managedUsers: ManagedUser[];
  session: SessionUser | null;
  onCreateLecture: () => void;
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

function getLectureDateKey(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return getDateKey(date);
}

function formatDay(value: Date) {
  return value.toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(value?: string) {
  if (!value) {
    return "Time not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not set";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRange(lecture: LectureItem) {
  if (!lecture.startsAt) {
    return "Time not set";
  }

  const start = formatTime(lecture.startsAt);
  const end = lecture.endsAt ? formatTime(lecture.endsAt) : "";

  return end ? `${start} – ${end}` : start;
}

function getStatusClass(status?: string) {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-blue-100 text-blue-700";
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
  const [selectedFacultyId, setSelectedFacultyId] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setItems(lectures);
  }, [lectures]);

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>();

    managedUsers.forEach((user) => {
      if (user.role === "educator") {
        map.set(user.id, user.name);
      }
    });

    if (session?.id && session?.name) {
      map.set(session.id, session.name);
    }

    return map;
  }, [managedUsers, session]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const facultyOptions = useMemo(() => {
    const ids = [
      ...new Set(
        items
          .map((lecture) => lecture.teacherId)
          .filter((teacherId): teacherId is string => Boolean(teacherId)),
      ),
    ];

    return ids.map((teacherId) => ({
      id: teacherId,
      name:
        facultyNameById.get(teacherId) ||
        (teacherId === session?.id ? session.name : "Assigned Faculty"),
    }));
  }, [facultyNameById, items, session]);

  const visibleLectures = useMemo(() => {
    const weekStartKey = getDateKey(weekDays[0]);
    const weekEndKey = getDateKey(weekDays[6]);

    return items
      .filter((lecture) => lecture.status !== "cancelled")
      .filter((lecture) => {
        const lectureDate = getLectureDateKey(lecture.startsAt);

        return lectureDate >= weekStartKey && lectureDate <= weekEndKey;
      })
      .filter((lecture) =>
        selectedFacultyId === "all"
          ? true
          : lecture.teacherId === selectedFacultyId,
      )
      .sort((firstLecture, secondLecture) =>
        (firstLecture.startsAt || "").localeCompare(
          secondLecture.startsAt || "",
        ),
      );
  }, [items, selectedFacultyId, weekDays]);

  async function refreshTimetable() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/lectures", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        lectures?: LectureItem[];
      };

      if (response.ok) {
        setItems(payload.lectures || []);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <section className="space-y-6">
      <article className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="section-label">Academic Schedule</p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-heading)]">
              {role === "admin" ? "Institute Timetable" : "My Timetable"}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
              View faculty-wise lectures with class timing, subject, topic, and
              batch details.
            </p>
          </div>

<div className="flex flex-wrap gap-3">
  {role === "admin" || role === "educator" ? (
    <button
      type="button"
      onClick={onCreateLecture}
      className="action-button px-5 py-3"
    >
      + Create Lecture
    </button>
  ) : null}

  <button
    type="button"
    onClick={() => void refreshTimetable()}
    disabled={isRefreshing}
    className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-blue-500/10 disabled:opacity-60"
  >
    {isRefreshing ? "Refreshing..." : "Refresh Timetable"}
  </button>
</div>
        </div>

        <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)]"
            >
              ← Previous Week
            </button>

            <button
              type="button"
              onClick={() => setWeekStart(getStartOfWeek(new Date()))}
              className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
            >
              This Week
            </button>

            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)]"
            >
              Next Week →
            </button>
          </div>

          {role === "admin" ? (
            <select
              value={selectedFacultyId}
              onChange={(event) => setSelectedFacultyId(event.target.value)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)] outline-none"
            >
              <option value="all">All Faculty</option>

              {facultyOptions.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {weekDays.map((day) => {
          const dayKey = getDateKey(day);

          const dayLectures = visibleLectures.filter(
            (lecture) => getLectureDateKey(lecture.startsAt) === dayKey,
          );

          const isToday = dayKey === getDateKey(new Date());

          return (
            <article
              key={dayKey}
              className={`surface min-h-72 rounded-[1.75rem] p-4 ${
                isToday ? "ring-2 ring-blue-500/30" : ""
              }`}
            >
              <div className="border-b border-[var(--color-border)] pb-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                  {formatDay(day)}
                </p>

                <p className="mt-1 text-lg font-semibold text-[var(--color-heading)]">
                  {formatDate(day)}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {dayLectures.length ? (
                  dayLectures.map((lecture) => {
                    const facultyName =
                      lecture.teacherName ||
                      facultyNameById.get(lecture.teacherId ?? "") ||
                      (lecture.teacherId === session?.id
                        ? session?.name ?? "Assigned Faculty"
                        : "Assigned Faculty");

                    const topic =
                      lecture.topicCovered?.trim() ||
                      lecture.title?.trim() ||
                      "Topic not added";

                    return (
                      <div
                        key={lecture.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-black text-blue-600">
                            {formatTimeRange(lecture)}
                          </p>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${getStatusClass(
                              lecture.status,
                            )}`}
                          >
                            {lecture.status}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-black text-[var(--color-heading)]">
                          {lecture.subject || "General Subject"}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                          {topic}
                        </p>

                        <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                          <p className="text-xs font-bold text-[var(--color-heading)]">
                            {facultyName}
                          </p>

                          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                            {lecture.batchName || "No batch assigned"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-3 py-5 text-center text-xs leading-5 text-[var(--color-muted)]">
                    No lectures scheduled.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <article className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label">Schedule Summary</p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--color-heading)]">
              {visibleLectures.length} lecture
              {visibleLectures.length === 1 ? "" : "s"} this week
            </h3>
          </div>

          <span className="pill">
            {formatDate(weekDays[0])} – {formatDate(weekDays[6])}
          </span>
        </div>
      </article>
    </section>
  );
}
