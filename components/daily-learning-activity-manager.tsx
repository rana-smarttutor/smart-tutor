"use client";

import { useEffect, useMemo, useState } from "react";
import { StudentRoutineViewer } from "@/components/student-routine-viewer";
import { StudentDailyRoutine } from "@/components/student-daily-routine";
import type {
  ManagedUser,
  Role,
  StudentDailyActivity,
} from "@/lib/types";

type DailyLearningActivityManagerProps = {
  role: Role;
  studentDirectory: ManagedUser[];
};

type Participation = StudentDailyActivity["participation"];

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const textareaClass =
  "min-h-24 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const PARTICIPATION_OPTIONS: Array<{
  value: Participation;
  label: string;
}> = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "needs-improvement", label: "Needs Improvement" },
  { value: "not-recorded", label: "Not Recorded" },
];

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getParticipationLabel(value: Participation) {
  return (
    PARTICIPATION_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

function getParticipationClass(value: Participation) {
  if (value === "excellent") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (value === "good") {
    return "bg-blue-100 text-blue-700";
  }

  if (value === "needs-improvement") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-200 text-slate-700";
}

function getCompletedTasks(activity: StudentDailyActivity) {
  return [
    activity.homeworkCompleted,
    activity.assignmentCompleted,
    activity.revisionCompleted,
  ].filter(Boolean).length;
}

function TeacherDailyLearningActivityManager({
  role,
  studentDirectory,
}: DailyLearningActivityManagerProps) {
  const canManage = role === "admin" || role === "educator";

  const [activities, setActivities] = useState<StudentDailyActivity[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [date, setDate] = useState(getToday());
  const [subject, setSubject] = useState("");
  const [topicStudied, setTopicStudied] = useState("");

  const [homeworkCompleted, setHomeworkCompleted] = useState(false);
  const [assignmentCompleted, setAssignmentCompleted] = useState(false);
  const [revisionCompleted, setRevisionCompleted] = useState(false);

  const [doubtsRaised, setDoubtsRaised] = useState("");
  const [participation, setParticipation] =
    useState<Participation>("good");
  const [studyMinutes, setStudyMinutes] = useState("");

  const [teacherVerified, setTeacherVerified] = useState(true);
  const [teacherNote, setTeacherNote] = useState("");
  const [visibleToParent, setVisibleToParent] = useState(true);

  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const allStudents = useMemo(() => {
    return studentDirectory.filter(
      (student) => student.role === "student",
    );
  }, [studentDirectory]);

  const selectedStudent = useMemo(
    () => allStudents.find((student) => student.id === selectedStudentId),
    [allStudents, selectedStudentId],
  );

  const isEditing = Boolean(editingActivityId);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);

      try {
        const activitiesResponse = await fetch("/api/daily-activities", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const activitiesPayload = (await activitiesResponse.json()) as {
          activities?: StudentDailyActivity[];
          error?: string;
        };

        if (!activitiesResponse.ok) {
          throw new Error(
            activitiesPayload.error ?? "Unable to load daily activities.",
          );
        }

        if (!cancelled) {
          setActivities(activitiesPayload.activities ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load daily activities.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [canManage]);

  function resetForm() {
    setEditingActivityId(null);
    setSelectedStudentId("");

    setDate(getToday());
    setSubject("");
    setTopicStudied("");

    setHomeworkCompleted(false);
    setAssignmentCompleted(false);
    setRevisionCompleted(false);

    setDoubtsRaised("");
    setParticipation("good");
    setStudyMinutes("");

    setTeacherVerified(true);
    setTeacherNote("");
    setVisibleToParent(true);
  }

  function openEditor(activity: StudentDailyActivity) {
    setEditingActivityId(activity.id);
    setSelectedStudentId(activity.studentId);

    setDate(activity.date);
    setSubject(activity.subject ?? "");
    setTopicStudied(activity.topicStudied ?? "");

    setHomeworkCompleted(activity.homeworkCompleted);
    setAssignmentCompleted(activity.assignmentCompleted);
    setRevisionCompleted(activity.revisionCompleted);

    setDoubtsRaised(activity.doubtsRaised ?? "");
    setParticipation(activity.participation);
    setStudyMinutes(
      typeof activity.studyMinutes === "number"
        ? String(activity.studyMinutes)
        : "",
    );

    setTeacherVerified(activity.teacherVerified);
    setTeacherNote(activity.teacherNote ?? "");
    setVisibleToParent(activity.visibleToParent);

    setMessage("");
  }

  function cancelEditing() {
    resetForm();
    setMessage("");
  }

  async function saveActivity() {
    if (!canManage) {
      return;
    }

    if (!editingActivityId && !selectedStudent) {
      setMessage("Select a student.");
      return;
    }

    if (!date) {
      setMessage("Activity date is required.");
      return;
    }

    const parsedStudyMinutes =
      studyMinutes.trim() === "" ? undefined : Number(studyMinutes);

    if (
      parsedStudyMinutes !== undefined &&
      (!Number.isFinite(parsedStudyMinutes) || parsedStudyMinutes < 0)
    ) {
      setMessage("Study minutes must be zero or greater.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const isEditingActivity = Boolean(editingActivityId);

      const updatePayload: Record<string, unknown> = {
        date,
        subject,
        topicStudied,
        homeworkCompleted,
        assignmentCompleted,
        revisionCompleted,
        doubtsRaised,
        participation,
        teacherVerified,
        teacherNote,
        visibleToParent,
      };

      if (parsedStudyMinutes !== undefined) {
        updatePayload.studyMinutes = Math.round(parsedStudyMinutes);
      }

      const response = await fetch(
        isEditingActivity
          ? `/api/daily-activities/${editingActivityId}`
          : "/api/daily-activities",
        {
          method: isEditingActivity ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditingActivity
              ? updatePayload
              : {
                  ...updatePayload,
                  studentId: selectedStudent!.id,
                  studentName: selectedStudent!.name,
                },
          ),
        },
      );

      const payload = (await response.json()) as {
        activity?: StudentDailyActivity;
        error?: string;
      };

      if (!response.ok || !payload.activity) {
        setMessage(payload.error ?? "Unable to save daily activity.");
        return;
      }

      setActivities((current) =>
        isEditingActivity
          ? current.map((activity) =>
              activity.id === payload.activity!.id ? payload.activity! : activity,
            )
          : [payload.activity!, ...current],
      );

      setMessage(
        isEditingActivity
          ? "Daily activity updated."
          : "Daily activity saved successfully.",
      );

      resetForm();
    } catch {
      setMessage("Unable to save daily activity.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteActivity(activityId: string) {
    if (!canManage) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this daily learning activity? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(activityId);

    try {
      const response = await fetch(`/api/daily-activities/${activityId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setMessage(payload.error ?? "Unable to delete daily activity.");
        return;
      }

      setActivities((current) =>
        current.filter((activity) => activity.id !== activityId),
      );

      if (editingActivityId === activityId) {
        resetForm();
      }

      setMessage("Daily activity deleted.");
    } catch {
      setMessage("Unable to delete daily activity.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="surface rounded-[2rem] p-6">
        <p className="section-label">Daily Learning Log</p>

        <h2 className="mt-2 text-2xl font-black text-[var(--color-heading)]">
          {canManage
            ? "Student Daily Learning Activity"
            : "Daily Learning Activity"}
        </h2>

        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {canManage
            ? "Record the student’s daily classroom participation, work completion, revision, and teacher guidance."
            : "Track daily study progress, completed work, participation, and teacher guidance."}
        </p>

        {message ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        ) : null}

        {canManage ? (
          <div className="mt-6 space-y-5">
            {isEditing ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                You are editing an existing record. Student cannot be
                changed after creation.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Student
                </span>

                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  disabled={isEditing}
                  className={fieldClass}
                >
                  <option value="">
                    Select student
                  </option>

                  {allStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Activity Date
                </span>

                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={fieldClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Subject
                </span>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. Mathematics"
                  className={fieldClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Participation
                </span>

                <select
                  value={participation}
                  onChange={(event) =>
                    setParticipation(event.target.value as Participation)
                  }
                  className={fieldClass}
                >
                  {PARTICIPATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Study Minutes
                </span>

                <input
                  type="number"
                  min="0"
                  value={studyMinutes}
                  onChange={(event) => setStudyMinutes(event.target.value)}
                  placeholder="Optional"
                  className={fieldClass}
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                Topic Studied
              </span>

              <textarea
                value={topicStudied}
                onChange={(event) => setTopicStudied(event.target.value)}
                placeholder="What topic, chapter, or concept was studied today?"
                className={textareaClass}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-4 text-sm font-black text-[var(--color-heading)]">
                <input
                  type="checkbox"
                  checked={homeworkCompleted}
                  onChange={(event) =>
                    setHomeworkCompleted(event.target.checked)
                  }
                  className="h-5 w-5 accent-blue-600"
                />
                Homework Completed
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-4 text-sm font-black text-[var(--color-heading)]">
                <input
                  type="checkbox"
                  checked={assignmentCompleted}
                  onChange={(event) =>
                    setAssignmentCompleted(event.target.checked)
                  }
                  className="h-5 w-5 accent-blue-600"
                />
                Assignment Completed
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-4 text-sm font-black text-[var(--color-heading)]">
                <input
                  type="checkbox"
                  checked={revisionCompleted}
                  onChange={(event) =>
                    setRevisionCompleted(event.target.checked)
                  }
                  className="h-5 w-5 accent-blue-600"
                />
                Revision Completed
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Doubts Raised
                </span>

                <textarea
                  value={doubtsRaised}
                  onChange={(event) => setDoubtsRaised(event.target.value)}
                  placeholder="Mention doubts raised or write none."
                  className={textareaClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Teacher Note
                </span>

                <textarea
                  value={teacherNote}
                  onChange={(event) => setTeacherNote(event.target.value)}
                  placeholder="Guidance, follow-up, or study recommendation."
                  className={textareaClass}
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <label className="flex items-center gap-3 text-sm font-black text-[var(--color-heading)]">
                  <input
                    type="checkbox"
                    checked={teacherVerified}
                    onChange={(event) =>
                      setTeacherVerified(event.target.checked)
                    }
                    className="h-5 w-5 accent-blue-600"
                  />
                  Teacher Verified
                </label>

                <label className="flex items-center gap-3 text-sm font-black text-[var(--color-heading)]">
                  <input
                    type="checkbox"
                    checked={visibleToParent}
                    onChange={(event) =>
                      setVisibleToParent(event.target.checked)
                    }
                    className="h-5 w-5 accent-blue-600"
                  />
                  Visible to Student & Parent
                </label>
              </div>

              <span className="text-xs font-semibold text-[var(--color-muted)]">
                Only parent-visible entries appear in the student and parent
                dashboards.
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void saveActivity()}
                disabled={isSaving}
                className="action-button px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : editingActivityId
                    ? "Update Daily Activity"
                    : "Save Daily Activity"}
              </button>

              {editingActivityId ? (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="surface rounded-[2rem] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Activity Timeline</p>

            <h3 className="text-xl font-black text-[var(--color-heading)]">
              {canManage ? "Recorded Daily Activities" : "Your Daily Progress"}
            </h3>
          </div>

          <span className="pill w-fit">
            {activities.length} Activit{activities.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-[var(--color-muted)]">
            Loading daily activities...
          </p>
        ) : null}

        {!isLoading && !activities.length ? (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-10 text-center">
            <h4 className="font-black text-[var(--color-heading)]">
              No activity records available
            </h4>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canManage
                ? "Record the first daily activity above."
                : "Your teacher’s daily learning updates will appear here."}
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {activities.map((activity) => {
            const completedTasks = getCompletedTasks(activity);

            return (
              <article
                key={activity.id}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-black text-[var(--color-heading)]">
                      {canManage ? activity.studentName : activity.subject || "Daily Learning"}
                    </h4>

                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {canManage ? activity.subject || "General" : ""}
                      {` • ${formatDate(activity.date)}`}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getParticipationClass(
                      activity.participation,
                    )}`}
                  >
                    {getParticipationLabel(activity.participation)}
                  </span>
                </div>

                {activity.topicStudied ? (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                      Topic Studied
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-blue-900">
                      {activity.topicStudied}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div
                    className={`rounded-xl p-3 text-center text-xs font-black ${
                      activity.homeworkCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Homework
                    <span className="mt-1 block">
                      {activity.homeworkCompleted ? "Done" : "Pending"}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl p-3 text-center text-xs font-black ${
                      activity.assignmentCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Assignment
                    <span className="mt-1 block">
                      {activity.assignmentCompleted ? "Done" : "Pending"}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl p-3 text-center text-xs font-black ${
                      activity.revisionCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Revision
                    <span className="mt-1 block">
                      {activity.revisionCompleted ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-[var(--color-panel)] px-3 py-2 text-xs font-black text-[var(--color-heading)]">
                    {completedTasks}/3 Tasks Completed
                  </span>

                  {typeof activity.studyMinutes === "number" ? (
                    <span className="rounded-full bg-[var(--color-panel)] px-3 py-2 text-xs font-black text-[var(--color-heading)]">
                      {activity.studyMinutes} Study Minutes
                    </span>
                  ) : null}

                  {activity.teacherVerified ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">
                      Teacher Verified
                    </span>
                  ) : null}
                </div>

                {activity.doubtsRaised ? (
                  <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Doubts Raised
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-heading)]">
                      {activity.doubtsRaised}
                    </p>
                  </div>
                ) : null}

                {activity.teacherNote ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                      Teacher Guidance
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">
                      {activity.teacherNote}
                    </p>
                  </div>
                ) : null}

                {canManage ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openEditor(activity)}
                      className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === activity.id}
                      onClick={() => void deleteActivity(activity.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-100 disabled:opacity-60"
                    >
                      {deletingId === activity.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function DailyLearningActivityManager(
  props: DailyLearningActivityManagerProps,
) {
  /*
   * Students fill and manage
   * their own daily routines.
   */
  if (props.role === "student") {
    return <StudentDailyRoutine />;
  }

  /*
   * Parents automatically see
   * the routine records of their
   * linked child.
   */
  if (props.role === "parent") {
    return (
      <StudentRoutineViewer
        role={props.role}
        studentDirectory={props.studentDirectory}
      />
    );
  }

  /*
   * Admins and educators keep
   * the existing learning activity
   * system and also receive the
   * student routine viewer below it.
   */
  if (
    props.role === "admin" ||
    props.role === "educator"
  ) {
    return (
      <div className="space-y-8">
        <TeacherDailyLearningActivityManager
          {...props}
        />

        <StudentRoutineViewer
          role={props.role}
          studentDirectory={props.studentDirectory}
        />
      </div>
    );
  }

  /*
   * Keep the existing behavior
   * for any other supported role.
   */
  return (
    <TeacherDailyLearningActivityManager
      {...props}
    />
  );
}