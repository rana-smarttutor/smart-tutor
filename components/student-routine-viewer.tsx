"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlarmClock,
  BookOpen,
  CalendarDays,
  Clock,
  Dumbbell,
  FileText,
  ListChecks,
  Loader2,
  Moon,
  Smartphone,
  Smile,
  Target,
  UserRound,
} from "lucide-react";

import type {
  DailyRoutineMood,
  ManagedUser,
  Role,
  StudentDailyRoutine,
} from "@/lib/types";

type StudentRoutineViewerProps = {
  role: Role;
  studentDirectory: ManagedUser[];
};

const selectClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-heading)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

const MOOD_DETAILS: Record<
  DailyRoutineMood,
  {
    emoji: string;
    label: string;
    className: string;
  }
> = {
  difficult: {
    emoji: "😞",
    label: "Difficult",
    className:
      "border-red-200 bg-red-50 text-red-700",
  },

  okay: {
    emoji: "😐",
    label: "Okay",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  },

  good: {
    emoji: "🙂",
    label: "Good",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
  },

  great: {
    emoji: "😄",
    label: "Great",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

function formatDate(
  value: string,
) {
  const date = new Date(
    `${value}T12:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

function formatMinutes(
  totalMinutes: number,
) {
  const safeMinutes =
    Number.isFinite(totalMinutes)
      ? Math.max(
          0,
          Math.round(totalMinutes),
        )
      : 0;

  const hours =
    Math.floor(
      safeMinutes / 60,
    );

  const minutes =
    safeMinutes % 60;

  if (
    hours > 0 &&
    minutes > 0
  ) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function formatTime(
  value: string,
) {
  const [
    hours,
    minutes,
  ] = value
    .split(":")
    .map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return value;
  }

  const date =
    new Date(
      2000,
      0,
      1,
      hours,
      minutes,
    );

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  );
}

export function StudentRoutineViewer({
  role,
  studentDirectory,
}: StudentRoutineViewerProps) {
  const canSelectStudent =
    role === "admin" ||
    role === "educator";

  const isParent =
    role === "parent";

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [
    selectedStudentName,
    setSelectedStudentName,
  ] = useState("");

  const [
    routines,
    setRoutines,
  ] = useState<
    StudentDailyRoutine[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const studentOptions =
    useMemo(() => {
      const byId =
        new Map<
          string,
          ManagedUser
        >();

      for (
        const student of
        studentDirectory
      ) {
        if (
          student.role !==
          "student"
        ) {
          continue;
        }

        byId.set(
          student.id,
          student,
        );
      }

      return [
        ...byId.values(),
      ].sort(
        (
          left,
          right,
        ) =>
          left.name.localeCompare(
            right.name,
          ),
      );
    }, [
      studentDirectory,
    ]);

  useEffect(() => {
    if (
      canSelectStudent &&
      !selectedStudentId
    ) {
      setRoutines([]);

      setSelectedStudentName("");

      setError("");

      return;
    }

    let cancelled =
      false;

    async function loadRoutines() {
      setLoading(true);

      setError("");

      try {
        const endpoint =
          canSelectStudent
            ? `/api/daily-routines?studentId=${encodeURIComponent(
                selectedStudentId,
              )}`
            : "/api/daily-routines";

        const response =
          await fetch(
            endpoint,
            {
              method: "GET",

              credentials:
                "same-origin",

              cache:
                "no-store",
            },
          );

        const payload =
          (await response.json()) as {
            routines?: StudentDailyRoutine[];

            studentId?:
              | string
              | null;

            studentName?:
              | string
              | null;

            error?: string;
          };

        if (
          !response.ok
        ) {
          throw new Error(
            payload.error ??
              "Unable to load daily routines.",
          );
        }

        if (cancelled) {
          return;
        }

        const sortedRoutines =
          [
            ...(
              payload.routines ??
              []
            ),
          ].sort(
            (
              left,
              right,
            ) => {
              const dateOrder =
                right.date.localeCompare(
                  left.date,
                );

              if (
                dateOrder !== 0
              ) {
                return dateOrder;
              }

              return right.createdAt.localeCompare(
                left.createdAt,
              );
            },
          );

        setRoutines(
          sortedRoutines,
        );

        setSelectedStudentName(
          payload.studentName ??
            "",
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setRoutines([]);

        setSelectedStudentName("");

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load daily routines.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(false);
        }
      }
    }

    void loadRoutines();

    return () => {
      cancelled = true;
    };
  }, [
    canSelectStudent,
    selectedStudentId,
  ]);

  const heading =
    role === "admin"
      ? "Student Daily Routine Records"
      : role === "educator"
        ? "Assigned Student Routine Records"
        : "My Child’s Daily Routine";

  const description =
    role === "admin"
      ? "Select a student to review the daily routine forms submitted by that student."
      : role === "educator"
        ? "Select an assigned student to review sleep, study time, screen time, exercise, tasks, mood, and daily reflections."
        : "View the latest daily routine forms submitted by your linked child.";

  return (
    <section className="surface rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-label">
            My Daily Routine
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-heading)]">
            {heading}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        </div>

        {selectedStudentName ? (
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
              <UserRound
                size={19}
              />
            </div>

            <div>
              <p className="text-sm font-black text-blue-900">
                {
                  selectedStudentName
                }
              </p>

              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">
                Selected Student
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {canSelectStudent ? (
        <div className="mt-6 max-w-xl">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-blue-500">
              <UserRound
                size={14}
              />

              Select Student
            </span>

            <select
              value={
                selectedStudentId
              }
              onChange={(
                event,
              ) =>
                setSelectedStudentId(
                  event.target
                    .value,
                )
              }
              className={
                selectClass
              }
            >
              <option value="">
                Select a student to view routines
              </option>

              {studentOptions.map(
                (student) => (
                  <option
                    key={
                      student.id
                    }
                    value={
                      student.id
                    }
                  >
                    {
                      student.name
                    }
                    {student.program
                      ? ` — ${student.program}`
                      : ""}
                  </option>
                ),
              )}
            </select>
          </label>

          {!studentOptions.length ? (
            <p className="mt-3 text-sm font-semibold text-amber-600">
              No students are available in your assigned student list.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {canSelectStudent &&
      !selectedStudentId ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--color-border)] px-5 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <UserRound
              size={28}
            />
          </div>

          <h3 className="mt-4 font-black text-[var(--color-heading)]">
            Select a Student
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">
            Choose a student from
            the dropdown above to
            see all submitted daily
            routine forms.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-[var(--color-muted)]">
          <Loader2
            size={21}
            className="animate-spin"
          />

          Loading routine records...
        </div>
      ) : null}

      {!loading &&
      (
        selectedStudentId ||
        isParent
      ) &&
      !error &&
      routines.length ===
        0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--color-border)] px-5 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <CalendarDays
              size={28}
            />
          </div>

          <h3 className="mt-4 font-black text-[var(--color-heading)]">
            No Routine Forms Yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">
            No daily routine has
            been submitted by this
            student yet.
          </p>
        </div>
      ) : null}

      {!loading &&
      routines.length >
        0 ? (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[var(--color-heading)]">
                Submitted Routine
                Forms
              </p>

              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Latest routine is
                shown first.
              </p>
            </div>

            <span className="pill">
              {routines.length}{" "}
              {routines.length ===
              1
                ? "Entry"
                : "Entries"}
            </span>
          </div>

          <div className="mt-5 grid gap-5">
            {routines.map(
              (
                routine,
                index,
              ) => (
                <RoutineFormCard
                  key={
                    routine.id
                  }
                  routine={
                    routine
                  }
                  latest={
                    index === 0
                  }
                />
              ),
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function RoutineFormCard({
  routine,
  latest,
}: {
  routine: StudentDailyRoutine;

  latest: boolean;
}) {
  const mood =
    MOOD_DETAILS[
      routine.mood
    ];

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays
              size={16}
              className="text-blue-500"
            />

            <h3 className="font-black text-[var(--color-heading)]">
              {formatDate(
                routine.date,
              )}
            </h3>

            {latest ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-600">
                Latest
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Submitted daily routine
            form
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${mood.className}`}
        >
          <span className="text-lg">
            {mood.emoji}
          </span>

          {mood.label}
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InformationBox
            label="Wake-up Time"
            value={formatTime(
              routine.wakeUpTime,
            )}
            icon={
              <AlarmClock
                size={17}
              />
            }
          />

          <InformationBox
            label="Bedtime"
            value={formatTime(
              routine.bedTime,
            )}
            icon={
              <Moon
                size={17}
              />
            }
          />

          <InformationBox
            label="Total Sleep"
            value={formatMinutes(
              routine.sleepMinutes,
            )}
            icon={
              <Clock
                size={17}
              />
            }
          />

          <InformationBox
            label="Day Mood"
            value={mood.label}
            icon={
              <Smile
                size={17}
              />
            }
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <RoutineMetric
            label="Study Time"
            value={formatMinutes(
              routine.studyMinutes,
            )}
            icon={
              <BookOpen
                size={17}
              />
            }
          />

          <RoutineMetric
            label="Screen Time"
            value={formatMinutes(
              routine.screenMinutes,
            )}
            icon={
              <Smartphone
                size={17}
              />
            }
          />

          <RoutineMetric
            label="Exercise"
            value={formatMinutes(
              routine.exerciseMinutes,
            )}
            icon={
              <Dumbbell
                size={17}
              />
            }
          />

          <RoutineMetric
            label="Tasks Done"
            value={String(
              routine.tasksCompleted,
            )}
            icon={
              <ListChecks
                size={17}
              />
            }
          />
        </div>

        {routine.mainGoal ? (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
              <Target
                size={13}
              />

              Main Goal
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">
              {
                routine.mainGoal
              }
            </p>
          </div>
        ) : null}

        {routine.reflection ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
              <FileText
                size={13}
              />

              Daily Reflection
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {
                routine.reflection
              }
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function InformationBox({
  label,
  value,
  icon,
}: {
  label: string;

  value: string;

  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[var(--color-heading)]">
            {value}
          </p>

          <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoutineMetric({
  label,
  value,
  icon,
}: {
  label: string;

  value: string;

  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-[9px] font-black uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-3 text-lg font-black text-[var(--color-heading)]">
        {value}
      </p>
    </div>
  );
}