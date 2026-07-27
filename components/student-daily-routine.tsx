"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  AlarmClock,
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  ListChecks,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Save,
  Smartphone,
  Smile,
  Target,
  Trash2,
  X,
} from "lucide-react";

import type { DailyRoutineMood, StudentDailyRoutine } from "@/lib/types";

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-heading)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

const textareaClass =
  "min-h-28 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-heading)] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

const MOOD_OPTIONS: Array<{
  value: DailyRoutineMood;
  emoji: string;
  label: string;
  description: string;
}> = [
  {
    value: "difficult",
    emoji: "😞",
    label: "Difficult",
    description: "It was a hard day",
  },
  {
    value: "okay",
    emoji: "😐",
    label: "Okay",
    description: "An average day",
  },
  {
    value: "good",
    emoji: "🙂",
    label: "Good",
    description: "Things went well",
  },
  {
    value: "great",
    emoji: "😄",
    label: "Great",
    description: "I had a great day",
  },
];

type GoalTask = {
  text: string;
  completed: boolean;
};

const MAX_GOAL_TASKS = 10;
const MAX_GOAL_TASK_LENGTH = 160;

function createEmptyGoalTask(): GoalTask {
  return {
    text: "",
    completed: false,
  };
}

function parseGoalTasks(value?: string | null): GoalTask[] {
  if (!value?.trim()) {
    return [];
  }

  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_GOAL_TASKS);

  const checklistTasks = lines
    .map((line) => {
      const match = line.match(/^\[([xX ])\]\s*(.+)$/);

      if (!match) {
        return null;
      }

      return {
        text: match[2].slice(0, MAX_GOAL_TASK_LENGTH),
        completed: match[1].toLowerCase() === "x",
      };
    })
    .filter((task): task is GoalTask => task !== null);

  if (checklistTasks.length > 0) {
    return checklistTasks;
  }

  // Older entries stored Main Goal as ordinary text.
  return [
    {
      text: value.slice(0, MAX_GOAL_TASK_LENGTH),
      completed: false,
    },
  ];
}

function serializeGoalTasks(tasks: GoalTask[]) {
  return tasks
    .map((task) => ({
      text: task.text.trim().slice(0, MAX_GOAL_TASK_LENGTH),
      completed: task.completed,
    }))
    .filter((task) => task.text.length > 0)
    .slice(0, MAX_GOAL_TASKS)
    .map((task) => `${task.completed ? "[x]" : "[ ]"} ${task.text}`)
    .join("\n");
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMinutes(totalMinutes: number) {
  const safeMinutes = Number.isFinite(totalMinutes)
    ? Math.max(0, Math.round(totalMinutes))
    : 0;

  const hours = Math.floor(safeMinutes / 60);

  const minutes = safeMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function splitMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));

  return {
    hours: String(Math.floor(safeMinutes / 60)),

    minutes: String(safeMinutes % 60),
  };
}

function getDurationMinutes(
  hoursValue: string,
  minutesValue: string,
  label: string,
) {
  const hours = hoursValue.trim() === "" ? 0 : Number(hoursValue);

  const minutes = minutesValue.trim() === "" ? 0 : Number(minutesValue);

  if (!Number.isInteger(hours) || hours < 0) {
    throw new Error(`${label} hours must be zero or greater.`);
  }

  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    throw new Error(`${label} minutes must be between 0 and 59.`);
  }

  return hours * 60 + minutes;
}

function getSleepPreview(bedTime: string, wakeUpTime: string) {
  if (!bedTime || !wakeUpTime) {
    return null;
  }

  const [bedHour, bedMinute] = bedTime.split(":").map(Number);

  const [wakeHour, wakeMinute] = wakeUpTime.split(":").map(Number);

  const bedTotal = bedHour * 60 + bedMinute;

  const wakeTotal = wakeHour * 60 + wakeMinute;

  if (bedTotal === wakeTotal) {
    return null;
  }

  let sleepMinutes = wakeTotal - bedTotal;

  if (sleepMinutes < 0) {
    sleepMinutes += 24 * 60;
  }

  return sleepMinutes;
}

function getDayNumber(date: string) {
  return Math.floor(new Date(`${date}T12:00:00`).getTime() / 86_400_000);
}

function calculateRoutineStreak(routines: StudentDailyRoutine[]) {
  const uniqueDates = [
    ...new Set(routines.map((routine) => routine.date)),
  ].sort((left, right) => right.localeCompare(left));

  if (uniqueDates.length === 0) {
    return 0;
  }

  const todayNumber = getDayNumber(getToday());

  const latestNumber = getDayNumber(uniqueDates[0]);

  if (todayNumber - latestNumber > 1) {
    return 0;
  }

  let expectedDay = latestNumber;

  let streak = 0;

  for (const date of uniqueDates) {
    const dayNumber = getDayNumber(date);

    if (dayNumber === expectedDay) {
      streak += 1;

      expectedDay -= 1;

      continue;
    }

    if (dayNumber < expectedDay) {
      break;
    }
  }

  return streak;
}

function getMoodDetails(mood: DailyRoutineMood) {
  return (
    MOOD_OPTIONS.find((option) => option.value === mood) ?? MOOD_OPTIONS[2]
  );
}

export function StudentDailyRoutine() {
  const today = getToday();

  const [routines, setRoutines] = useState<StudentDailyRoutine[]>([]);

  const [loading, setLoading] = useState(true);

const [saving, setSaving] = useState(false);

const [deletingId, setDeletingId] = useState<string | null>(null);

const [updatingTaskKey, setUpdatingTaskKey] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  const [date, setDate] = useState(today);

  const [wakeUpTime, setWakeUpTime] = useState("");

  const [bedTime, setBedTime] = useState("");

  const [studyHours, setStudyHours] = useState("");

  const [studyMinutePart, setStudyMinutePart] = useState("");

  const [screenHours, setScreenHours] = useState("");

  const [screenMinutePart, setScreenMinutePart] = useState("");

  const [exerciseMinutes, setExerciseMinutes] = useState("");

  const [mood, setMood] = useState<DailyRoutineMood>("good");

  const [goalTasks, setGoalTasks] = useState<GoalTask[]>([
    createEmptyGoalTask(),
  ]);

  const [reflection, setReflection] = useState("");

  async function loadRoutines() {
    setLoading(true);

    try {
      const response = await fetch("/api/daily-routines", {
        method: "GET",

        credentials: "same-origin",

        cache: "no-store",
      });

      const payload = (await response.json()) as {
        routines?: StudentDailyRoutine[];

        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load daily routines.");
      }

      setRoutines(payload.routines ?? []);
    } catch (error) {
      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load daily routines.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoutines();
  }, []);

  const todayRoutine = useMemo(
    () => routines.find((routine) => routine.date === today) ?? null,
    [routines, today],
  );

  const routineStreak = useMemo(
    () => calculateRoutineStreak(routines),
    [routines],
  );

  const sleepPreview = useMemo(
    () => getSleepPreview(bedTime, wakeUpTime),
    [bedTime, wakeUpTime],
  );

  const completedGoalTaskCount = useMemo(
    () =>
      goalTasks.filter((task) => task.text.trim().length > 0 && task.completed)
        .length,
    [goalTasks],
  );

  function updateGoalTask(index: number, value: string) {
    setGoalTasks((current) =>
      current.map((task, taskIndex) =>
        taskIndex === index
          ? {
              text: value.slice(0, MAX_GOAL_TASK_LENGTH),
              completed: value.trim().length > 0 ? task.completed : false,
            }
          : task,
      ),
    );
  }

function removeGoalTask(index: number) {
  setGoalTasks((current) => {
    if (current.length === 1) {
      return [createEmptyGoalTask()];
    }

    return current.filter((_, taskIndex) => taskIndex !== index);
  });
}

  function addGoalTask() {
    setGoalTasks((current) =>
      current.length >= MAX_GOAL_TASKS
        ? current
        : [...current, createEmptyGoalTask()],
    );
  }



  function resetForm() {
    setEditingId(null);

    setDate(today);

    setWakeUpTime("");

    setBedTime("");

    setStudyHours("");

    setStudyMinutePart("");

    setScreenHours("");

    setScreenMinutePart("");

    setExerciseMinutes("");

    setMood("good");

    setGoalTasks([createEmptyGoalTask()]);

    setReflection("");
  }

  function startEditing(routine: StudentDailyRoutine) {
    const study = splitMinutes(routine.studyMinutes);

    const screen = splitMinutes(routine.screenMinutes);

    setEditingId(routine.id);

    setDate(routine.date);

    setWakeUpTime(routine.wakeUpTime);

    setBedTime(routine.bedTime);

    setStudyHours(study.hours);

    setStudyMinutePart(study.minutes);

    setScreenHours(screen.hours);

    setScreenMinutePart(screen.minutes);

    setExerciseMinutes(String(routine.exerciseMinutes));

    setMood(routine.mood);

    const savedGoalTasks = parseGoalTasks(routine.mainGoal);

    setGoalTasks(
      savedGoalTasks.length > 0 ? savedGoalTasks : [createEmptyGoalTask()],
    );

    setReflection(routine.reflection ?? "");

    setMessage("");

    window.scrollTo({
      top: 0,

      behavior: "smooth",
    });
  }

  async function saveRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    let studyMinutes = 0;

    let screenMinutes = 0;

    try {
      studyMinutes = getDurationMinutes(
        studyHours,
        studyMinutePart,
        "Study time",
      );

      screenMinutes = getDurationMinutes(
        screenHours,
        screenMinutePart,
        "Screen time",
      );
    } catch (error) {
      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Check the entered time values.",
      );

      return;
    }

    if (!wakeUpTime || !bedTime) {
      setMessageType("error");

      setMessage("Enter both wake-up time and bedtime.");

      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingId ? `/api/daily-routines/${editingId}` : "/api/daily-routines",
        {
          method: editingId ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            date,

            wakeUpTime,

            bedTime,

            studyMinutes,

            screenMinutes,

            exerciseMinutes:
              exerciseMinutes.trim() === "" ? 0 : Number(exerciseMinutes),

            tasksCompleted: completedGoalTaskCount,

            mood,

            mainGoal: serializeGoalTasks(goalTasks),

            reflection,
          }),
        },
      );

      const payload = (await response.json()) as {
        routine?: StudentDailyRoutine;

        error?: string;
      };

      if (!response.ok || !payload.routine) {
        throw new Error(payload.error ?? "Unable to save daily routine.");
      }

      if (editingId) {
        setRoutines((current) =>
          current
            .map((routine) =>
              routine.id === payload.routine!.id ? payload.routine! : routine,
            )
            .sort((left, right) => right.date.localeCompare(left.date)),
        );
      } else {
        setRoutines((current) =>
          [payload.routine!, ...current].sort((left, right) =>
            right.date.localeCompare(left.date),
          ),
        );
      }

      setMessageType("success");

      setMessage(
        editingId
          ? "Daily routine updated successfully."
          : "Today's routine saved successfully.",
      );

      resetForm();
    } catch (error) {
      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save daily routine.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function updateSavedTaskStatus(
    routine: StudentDailyRoutine,
    taskIndex: number,
    completed: boolean,
  ) {
    const savedTasks = parseGoalTasks(routine.mainGoal);

    if (!savedTasks[taskIndex]) {
      return;
    }

    const updatedTasks = savedTasks.map((task, index) =>
      index === taskIndex
        ? {
            ...task,
            completed,
          }
        : task,
    );

    const taskKey = `${routine.id}-${taskIndex}`;

    setUpdatingTaskKey(taskKey);
    setMessage("");

    try {
      const response = await fetch(`/api/daily-routines/${routine.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          date: routine.date,
          wakeUpTime: routine.wakeUpTime,
          bedTime: routine.bedTime,
          studyMinutes: routine.studyMinutes,
          screenMinutes: routine.screenMinutes,
          exerciseMinutes: routine.exerciseMinutes,
          mood: routine.mood,
          mainGoal: serializeGoalTasks(updatedTasks),
          tasksCompleted: updatedTasks.filter(
            (task) => task.text.trim() && task.completed,
          ).length,
          reflection: routine.reflection ?? "",
        }),
      });

      const payload = (await response.json()) as {
        routine?: StudentDailyRoutine;
        error?: string;
      };

      if (!response.ok || !payload.routine) {
        throw new Error(payload.error ?? "Unable to update task status.");
      }

      setRoutines((current) =>
        current.map((item) =>
          item.id === payload.routine!.id ? payload.routine! : item,
        ),
      );

      setMessageType("success");
      setMessage(
        completed ? "Task marked as completed." : "Task marked as incomplete.",
      );
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update task status.",
      );
    } finally {
      setUpdatingTaskKey(null);
    }
  }
  async function deleteRoutine(routineId: string) {
    const confirmed = window.confirm(
      "Delete this daily routine? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(routineId);

    setMessage("");

    try {
      const response = await fetch(`/api/daily-routines/${routineId}`, {
        method: "DELETE",

        credentials: "same-origin",
      });

      const payload = (await response.json()) as {
        success?: boolean;

        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Unable to delete daily routine.");
      }

      setRoutines((current) =>
        current.filter((routine) => routine.id !== routineId),
      );

      if (editingId === routineId) {
        resetForm();
      }

      setMessageType("success");

      setMessage("Daily routine deleted.");
    } catch (error) {
      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete daily routine.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-label">Personal Routine Tracker</p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-heading)] sm:text-3xl">
              My Daily Routine
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Record your sleep, study, screen time, exercise, daily tasks,
              mood, and personal progress.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Flame size={20} />
            </div>

            <div>
              <p className="text-xl font-black text-orange-700">
                {routineStreak}
              </p>

              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
                Day Streak
              </p>
            </div>
          </div>
        </div>

        {message ? (
          <div
            className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
            )}

            <span>{message}</span>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Sleep Today"
            value={
              todayRoutine ? formatMinutes(todayRoutine.sleepMinutes) : "—"
            }
            icon={<Moon size={18} />}
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            label="Study Today"
            value={
              todayRoutine ? formatMinutes(todayRoutine.studyMinutes) : "—"
            }
            icon={<BookOpen size={18} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            label="Screen Today"
            value={
              todayRoutine ? formatMinutes(todayRoutine.screenMinutes) : "—"
            }
            icon={<Smartphone size={18} />}
            iconClass="bg-sky-50 text-sky-600"
          />

          <SummaryCard
            label="Tasks Today"
            value={todayRoutine ? String(todayRoutine.tasksCompleted) : "—"}
            icon={<ListChecks size={18} />}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>
      </div>

      <div className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Daily Form</p>

            <h3 className="mt-1 text-xl font-black text-[var(--color-heading)]">
              {editingId ? "Edit Daily Routine" : "Fill Today’s Routine"}
            </h3>
          </div>

          {editingId ? (
            <button
              type="button"
              onClick={() => {
                resetForm();

                setMessage("");
              }}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-black text-[var(--color-heading)] transition hover:bg-slate-50"
            >
              <X size={14} />
              Cancel Edit
            </button>
          ) : null}
        </div>

        <form onSubmit={saveRoutine} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Routine Date" icon={<CalendarDays size={14} />}>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(event) => setDate(event.target.value)}
                required
                className={fieldClass}
              />
            </FormField>

            <FormField label="Wake-up Time" icon={<AlarmClock size={14} />}>
              <input
                type="time"
                value={wakeUpTime}
                onChange={(event) => setWakeUpTime(event.target.value)}
                required
                className={fieldClass}
              />
            </FormField>

            <FormField label="Bedtime" icon={<Moon size={14} />}>
              <input
                type="time"
                value={bedTime}
                onChange={(event) => setBedTime(event.target.value)}
                required
                className={fieldClass}
              />
            </FormField>
          </div>

          <div className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <Clock size={18} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-500">
                  Estimated Sleep
                </p>

                <p className="mt-0.5 text-lg font-black text-indigo-900">
                  {sleepPreview !== null
                    ? formatMinutes(sleepPreview)
                    : "Enter wake-up time and bedtime"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DurationField
              label="Study Time"
              description="Total time spent studying today"
              icon={<BookOpen size={18} />}
              hours={studyHours}
              minutes={studyMinutePart}
              onHoursChange={setStudyHours}
              onMinutesChange={setStudyMinutePart}
            />

            <DurationField
              label="Screen Time"
              description="Phone, social media, games, and entertainment"
              icon={<Smartphone size={18} />}
              hours={screenHours}
              minutes={screenMinutePart}
              onHoursChange={setScreenHours}
              onMinutesChange={setScreenMinutePart}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Smile size={15} className="text-blue-500" />

              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-500">
                How Was Your Day?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {MOOD_OPTIONS.map((option) => {
                const selected = mood === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMood(option.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                        : "border-[var(--color-border)] bg-white hover:border-blue-200 hover:bg-blue-50/40"
                    }`}
                  >
                    <span className="text-3xl">{option.emoji}</span>

                    <p className="mt-2 text-sm font-black text-[var(--color-heading)]">
                      {option.label}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <GoalChecklist
              tasks={goalTasks}
              onTextChange={updateGoalTask}
              onAdd={addGoalTask}
            />

            <FormField
              label="Task for Tomorrow"
              icon={<FileText size={14} />}
              hint="Optional"
            >
              <textarea
                value={reflection}
                onChange={(event) =>
                  setReflection(event.target.value.slice(0, 1000))
                }
                placeholder="Write the task you want to complete tomorrow."
                className={textareaClass}
              />
            </FormField>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="action-button inline-flex min-w-52 items-center justify-center gap-2 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />

                {editingId ? "Update Daily Routine" : "Save Today’s Routine"}
              </>
            )}
          </button>
        </form>
      </div>

      <div className="surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Routine History</p>

            <h3 className="mt-1 text-xl font-black text-[var(--color-heading)]">
              My Previous Entries
            </h3>
          </div>

          <span className="pill w-fit">
            {routines.length} {routines.length === 1 ? "Entry" : "Entries"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-[var(--color-muted)]">
            <Loader2 size={20} className="animate-spin" />
            Loading routines...
          </div>
        ) : null}

        {!loading && routines.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--color-border)] px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarDays size={28} />
            </div>

            <h4 className="mt-4 font-black text-[var(--color-heading)]">
              No routine entries yet
            </h4>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">
              Fill the daily form above to start building a healthy and
              consistent routine.
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {routines.map((routine) => {
            const moodDetails = getMoodDetails(routine.mood);

            const routineGoalTasks = parseGoalTasks(routine.mainGoal);

            return (
              <article
                key={routine.id}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} className="text-blue-500" />

                      <h4 className="font-black text-[var(--color-heading)]">
                        {formatDate(routine.date)}
                      </h4>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-[var(--color-muted)]">
                      Wake {routine.wakeUpTime} • Bed {routine.bedTime}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
                    <span className="text-2xl">{moodDetails.emoji}</span>

                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {moodDetails.label}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <RoutineMetric
                    label="Sleep"
                    value={formatMinutes(routine.sleepMinutes)}
                  />

                  <RoutineMetric
                    label="Study"
                    value={formatMinutes(routine.studyMinutes)}
                  />

                  <RoutineMetric
                    label="Screen"
                    value={formatMinutes(routine.screenMinutes)}
                  />

                  <RoutineMetric
                    label="Exercise"
                    value={formatMinutes(routine.exerciseMinutes)}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
                  <ListChecks size={15} />
                  {routine.tasksCompleted} Tasks Completed
                </div>

                {routineGoalTasks.length > 0 ? (
                  <div className="mt-4">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">
                      <ListChecks size={12} />
                      Today’s Tasks
                    </p>

                    <div className="mt-3 space-y-2">
                      {routineGoalTasks.map((task, taskIndex) => {
                        const taskKey = `${routine.id}-${taskIndex}`;
                        const isUpdating = updatingTaskKey === taskKey;

                        return (
                          <div
                            key={`${routine.id}-goal-${taskIndex}`}
                            className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                              task.completed
                                ? "border-emerald-200 bg-emerald-50/70"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <p
                              className={`min-w-0 flex-1 text-sm leading-5 ${
                                task.completed
                                  ? "text-slate-400 line-through"
                                  : "font-semibold text-[var(--color-heading)]"
                              }`}
                            >
                              {task.text}
                            </p>

                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  void updateSavedTaskStatus(
                                    routine,
                                    taskIndex,
                                    true,
                                  )
                                }
                                aria-label={`Mark ${task.text} completed`}
                                title="Mark completed"
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
                                  task.completed
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {isUpdating ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={17} />
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  void updateSavedTaskStatus(
                                    routine,
                                    taskIndex,
                                    false,
                                  )
                                }
                                aria-label={`Mark ${task.text} incomplete`}
                                title="Mark incomplete"
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
                                  !task.completed
                                    ? "border-red-500 bg-red-500 text-white"
                                    : "border-red-200 bg-white text-red-500 hover:bg-red-50"
                                }`}
                              >
                                <X size={17} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {routine.reflection ? (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Task for Tomorrow
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {routine.reflection}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => startEditing(routine)}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === routine.id}
                    onClick={() => void deleteRoutine(routine.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    {deletingId === routine.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}

                    {deletingId === routine.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;

  value: string;

  icon: React.ReactNode;

  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-lg font-black text-[var(--color-heading)]">
            {value}
          </p>

          <p className="text-[10px] font-black uppercase tracking-[0.11em] text-slate-400">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  hint,
  children,
}: {
  label: string;

  icon: React.ReactNode;

  hint?: string;

  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-blue-500">
          {icon}

          {label}
        </span>

        {hint ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {hint}
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

function GoalChecklist({
  tasks,
  onTextChange,
  onAdd,
}: {
  tasks: GoalTask[];
  onTextChange: (index: number, value: string) => void;
  onAdd: () => void;
}) {
  const writtenTaskCount = tasks.filter(
    (task) => task.text.trim().length > 0,
  ).length;

  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-slate-50/70 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-blue-500">
            <ListChecks size={14} />
            Today’s Tasks
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
            Write your tasks first and save the routine. You can mark them
            completed or incomplete after saving.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-500 shadow-sm">
          {writtenTaskCount}/{MAX_GOAL_TASKS} Tasks
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-600">
              {index + 1}
            </span>

            <input
              type="text"
              value={task.text}
              maxLength={MAX_GOAL_TASK_LENGTH}
              onChange={(event) => onTextChange(index, event.target.value)}
              placeholder={`Write task ${index + 1}`}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--color-heading)] outline-none placeholder:text-slate-400"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={tasks.length >= MAX_GOAL_TASKS}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-3 text-xs font-black text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <Plus size={15} />

        {tasks.length >= MAX_GOAL_TASKS ? "Task limit reached" : "Add New Task"}
      </button>

      <p className="mt-2 text-right text-[10px] font-bold text-slate-400">
        {tasks.length}/{MAX_GOAL_TASKS} task fields
      </p>
    </div>
  );
}

function DurationField({
  label,
  description,
  icon,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
}: {
  label: string;

  description: string;

  icon: React.ReactNode;

  hours: string;

  minutes: string;

  onHoursChange: (value: string) => void;

  onMinutesChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-slate-50/70 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
          {icon}
        </div>

        <div>
          <h4 className="font-black text-[var(--color-heading)]">{label}</h4>

          <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Hours
          </span>

          <input
            type="number"
            min="0"
            max="24"
            step="1"
            value={hours}
            onChange={(event) => onHoursChange(event.target.value)}
            placeholder="0"
            className={fieldClass}
          />
        </label>

        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Minutes
          </span>

          <input
            type="number"
            min="0"
            max="59"
            step="1"
            value={minutes}
            onChange={(event) => onMinutesChange(event.target.value)}
            placeholder="0"
            className={fieldClass}
          />
        </label>
      </div>
    </div>
  );
}

function RoutineMetric({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
      <p className="text-sm font-black text-[var(--color-heading)]">{value}</p>

      <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}
