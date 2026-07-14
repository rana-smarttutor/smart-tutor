"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { LectureItem, ManagedUser, Role } from "@/lib/types";

type LectureManagerProps = {
  role: Role;
  lectures: LectureItem[];
  studentDirectory: ManagedUser[];
};

type LectureStatus = "scheduled" | "completed" | "cancelled";

type ReportDraft = {
  topicCovered: string;
  homeworkGiven: string;
  assignmentGiven: string;
  revisionTask: string;
  doubtsSolved: string;
  nextTopic: string;
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const textareaClass =
  "min-h-24 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const emptyReport: ReportDraft = {
  topicCovered: "",
  homeworkGiven: "",
  assignmentGiven: "",
  revisionTask: "",
  doubtsSolved: "",
  nextTopic: "",
};

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function getStatusClass(status: LectureStatus) {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-blue-100 text-blue-700";
}

export function LectureManager({
  role,
  lectures,
  studentDirectory,
}: LectureManagerProps) {
  const canEdit = role === "admin" || role === "educator";

  const [items, setItems] = useState<LectureItem[]>(lectures);

  const visibleLectures = useMemo(() => {
    /*
     * Admins and educators still need
     * all lectures for management.
     */
    if (canEdit) {
      return items;
    }

    /*
     * Students and parents see only
     * completed lectures that include
     * an actual recording link.
     */
    return items.filter((lecture) => {
      const lectureStatus =
        (lecture.status as LectureStatus | undefined) ?? "scheduled";

      return (
        lectureStatus === "completed" && Boolean(lecture.recordingLink?.trim())
      );
    });
  }, [canEdit, items]);

  const allStudents = useMemo(() => {
    return studentDirectory.filter(
      (student) => student.role === "student",
    );
  }, [studentDirectory]);

  const [title, setTitle] = useState("Live Class");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [materialLink, setMaterialLink] = useState("");
  const [status, setStatus] = useState<LectureStatus>("scheduled");

  const [newLectureReport, setNewLectureReport] =
    useState<ReportDraft>(emptyReport);

  const [reportLectureId, setReportLectureId] = useState<string | null>(null);
  const [reportDraft, setReportDraft] = useState<ReportDraft>(emptyReport);

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(lectures);
  }, [lectures]);

  function updateNewReport<Key extends keyof ReportDraft>(
    key: Key,
    value: ReportDraft[Key],
  ) {
    setNewLectureReport((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateReportDraft<Key extends keyof ReportDraft>(
    key: Key,
    value: ReportDraft[Key],
  ) {
    setReportDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setTitle("Live Class");
    setSubject("");
    setDescription("");
    setStartsAt("");
    setEndsAt("");
    setMeetingLink("");
    setRecordingLink("");
    setMaterialLink("");
    setStatus("scheduled");
    setNewLectureReport(emptyReport);
  }

  async function createLecture() {
    if (!canEdit) {
      return;
    }

    if (!title.trim()) {
      setMessage("Lecture title is required.");
      return;
    }

    if (!startsAt) {
      setMessage("Start time is required.");
      return;
    }

    if (!allStudents.length) {
      setMessage("No students available in the system.");
      return;
    }

    if (status === "completed" && !endsAt) {
      setMessage("End time is required for a completed lecture report.");
      return;
    }

    if (status === "completed" && !newLectureReport.topicCovered.trim()) {
      setMessage("Topic covered is required for a completed lecture report.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          subject,
          description,
          startsAt,
          endsAt,
          meetingLink,
          recordingLink,
          materialLink,
          assignedStudentIds: allStudents.map((student) => student.id),
          status,
          ...newLectureReport,
        }),
      });

      const payload = (await response.json()) as {
        lecture?: LectureItem;
        error?: string;
      };

      if (!response.ok || !payload.lecture) {
        setMessage(payload.error ?? "Unable to save lecture.");
        return;
      }

      setItems((current) => [payload.lecture!, ...current]);

      setMessage(
        status === "completed"
          ? "Daily lecture report submitted successfully."
          : "Lecture created successfully.",
      );

      resetForm();
    } catch {
      setMessage("Unable to save lecture.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchLecture(
    lectureId: string,
    updates: Record<string, unknown>,
  ) {
    const response = await fetch(`/api/lectures/${lectureId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const payload = (await response.json()) as {
      lecture?: LectureItem;
      error?: string;
    };

    if (!response.ok || !payload.lecture) {
      setMessage(payload.error ?? "Unable to update lecture.");
      return null;
    }

    setItems((current) =>
      current.map((item) => (item.id === lectureId ? payload.lecture! : item)),
    );

    return payload.lecture;
  }

  async function changeLectureStatus(
    lecture: LectureItem,
    nextStatus: LectureStatus,
  ) {
    if (!canEdit) {
      return;
    }

    if (nextStatus === "completed") {
      openReportEditor(lecture);
      return;
    }

    setMessage("");

    const updatedLecture = await patchLecture(lecture.id, {
      status: nextStatus,
    });

    if (updatedLecture) {
      setMessage(
        nextStatus === "cancelled"
          ? "Lecture cancelled."
          : "Lecture status updated.",
      );
    }
  }

  function openReportEditor(lecture: LectureItem) {
    setReportLectureId(lecture.id);

    setReportDraft({
      topicCovered: lecture.topicCovered ?? "",
      homeworkGiven: lecture.homeworkGiven ?? "",
      assignmentGiven: lecture.assignmentGiven ?? "",
      revisionTask: lecture.revisionTask ?? "",
      doubtsSolved: lecture.doubtsSolved ?? "",
      nextTopic: lecture.nextTopic ?? "",
    });

    setMessage("");
  }

  function closeReportEditor() {
    setReportLectureId(null);
    setReportDraft(emptyReport);
  }

  async function submitLectureReport(lecture: LectureItem) {
    if (!reportDraft.topicCovered.trim()) {
      setMessage("Topic covered is required.");
      return;
    }

    if (!lecture.endsAt) {
      setMessage(
        "Add an end time to this lecture before submitting the report.",
      );
      return;
    }

    setIsSubmittingReport(true);
    setMessage("");

    try {
      const updatedLecture = await patchLecture(lecture.id, {
        status: "completed",
        ...reportDraft,
      });

      if (updatedLecture) {
        closeReportEditor();
        setMessage("Daily lecture report submitted successfully.");
      }
    } finally {
      setIsSubmittingReport(false);
    }
  }

  function formatDateTime(value?: string) {
    if (!value) {
      return "Not scheduled";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not scheduled";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getDuration(lecture: LectureItem) {
    if (!lecture.startsAt || !lecture.endsAt) {
      return "—";
    }

    const start = new Date(lecture.startsAt).getTime();
    const end = new Date(lecture.endsAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return "—";
    }

    const minutes = Math.round((end - start) / 60000);

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes
      ? `${hours} hr ${remainingMinutes} min`
      : `${hours} hr`;
  }

  return (
    <section className="space-y-6">
      <div className="surface overflow-visible rounded-[2rem] p-6">
        <div className="flex flex-col gap-2">
          <p className="section-label">Lectures</p>

          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            {canEdit ? "Daily Lecture Reports" : "Recorded Lectures"}
          </h2>

          <p className="text-sm text-[var(--color-muted)]">
            {canEdit
              ? "Select an assigned batch to create lectures and daily reports for its students."
              : "Watch completed class recordings and access shared lecture materials."}
          </p>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        ) : null}

        {canEdit ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label="Lecture Title">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Mathematics Live Class"
                  className={fieldClass}
                />
              </FieldLabel>

              <FieldLabel label="Subject">
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                  className={fieldClass}
                />
              </FieldLabel>

              <FieldLabel label="Start Time">
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className={fieldClass}
                />
              </FieldLabel>

              <FieldLabel label="End Time">
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  className={fieldClass}
                />
              </FieldLabel>

              <FieldLabel label="Save As">
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as LectureStatus)
                  }
                  className={fieldClass}
                >
                  <option value="scheduled">Scheduled Lecture</option>
                  <option value="completed">Completed Lecture Report</option>
                  <option value="cancelled">Cancelled Lecture</option>
                </select>
              </FieldLabel>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FieldLabel label="Meeting Link">
                <input
                  value={meetingLink}
                  onChange={(event) => setMeetingLink(event.target.value)}
                  placeholder="Google Meet / Zoom link"
                  className={fieldClass}
                />
              </FieldLabel>

              <FieldLabel label="Recording Link">
                <input
                  value={recordingLink}
                  onChange={(event) => setRecordingLink(event.target.value)}
                  placeholder="Recording link"
                  className={fieldClass}
                />
              </FieldLabel>

              <FieldLabel label="Material Link">
                <input
                  value={materialLink}
                  onChange={(event) => setMaterialLink(event.target.value)}
                  placeholder="Notes / material link"
                  className={fieldClass}
                />
              </FieldLabel>
            </div>

            <FieldLabel label="Lecture Description">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional lecture description"
                className={textareaClass}
              />
            </FieldLabel>

            {status === "completed" ? (
              <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/40 p-5">
                <div>
                  <p className="text-sm font-black text-emerald-700">
                    Daily Lecture Report
                  </p>

                  <p className="mt-1 text-xs text-emerald-700/80">
                    These details will be visible to the selected batch’s
                    students and parents.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <FieldLabel label="Topic Covered">
                    <input
                      value={newLectureReport.topicCovered}
                      onChange={(event) =>
                        updateNewReport("topicCovered", event.target.value)
                      }
                      placeholder="e.g. Quadratic Equations"
                      className={fieldClass}
                    />
                  </FieldLabel>

                  <FieldLabel label="Doubts Solved">
                    <input
                      value={newLectureReport.doubtsSolved}
                      onChange={(event) =>
                        updateNewReport("doubtsSolved", event.target.value)
                      }
                      placeholder="e.g. 8 student doubts solved"
                      className={fieldClass}
                    />
                  </FieldLabel>

                  <FieldLabel label="Homework Given">
                    <textarea
                      value={newLectureReport.homeworkGiven}
                      onChange={(event) =>
                        updateNewReport("homeworkGiven", event.target.value)
                      }
                      placeholder="Homework details"
                      className={textareaClass}
                    />
                  </FieldLabel>

                  <FieldLabel label="Assignment Given">
                    <textarea
                      value={newLectureReport.assignmentGiven}
                      onChange={(event) =>
                        updateNewReport("assignmentGiven", event.target.value)
                      }
                      placeholder="Assignment details"
                      className={textareaClass}
                    />
                  </FieldLabel>

                  <FieldLabel label="Revision Task">
                    <textarea
                      value={newLectureReport.revisionTask}
                      onChange={(event) =>
                        updateNewReport("revisionTask", event.target.value)
                      }
                      placeholder="Topics students should revise"
                      className={textareaClass}
                    />
                  </FieldLabel>

                  <FieldLabel label="Next Topic">
                    <textarea
                      value={newLectureReport.nextTopic}
                      onChange={(event) =>
                        updateNewReport("nextTopic", event.target.value)
                      }
                      placeholder="Topic planned for the next lecture"
                      className={textareaClass}
                    />
                  </FieldLabel>
                </div>
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-[var(--color-heading)]">
                    Batch Students
                  </p>

                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Students are assigned automatically from the selected batch.
                  </p>
                </div>

                <span className="pill w-fit">
                  {allStudents.length} Student
                  {allStudents.length === 1 ? "" : "s"}
                </span>
              </div>

              {allStudents.length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {allStudents.map((student) => (
                    <div
                      key={student.id}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-bold text-[var(--color-heading)] shadow-sm"
                    >
                      <span className="truncate">{student.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-3 text-sm font-semibold text-[var(--color-heading)]">
                  No students available in the system.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => void createLecture()}
              disabled={isSaving || !allStudents.length}
              className="action-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : status === "completed"
                  ? "Submit Daily Lecture Report"
                  : status === "cancelled"
                    ? "Save Cancelled Lecture"
                    : "Create Lecture"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleLectures.length ? (
          visibleLectures.map((lecture) => {
            const lectureStatus =
              (lecture.status as LectureStatus | undefined) ?? "scheduled";

            const isEditingReport = reportLectureId === lecture.id;

            return (
              <article
                key={lecture.id}
                className="surface overflow-visible rounded-[2rem] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-[var(--color-heading)]">
                      {lecture.title}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {lecture.subject || "General"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusClass(
                      lectureStatus,
                    )}`}
                  >
                    {lectureStatus}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="surface-soft rounded-2xl p-4">
                    <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                      Starts
                    </p>

                    <p className="mt-1 text-sm font-black text-[var(--color-heading)]">
                      {formatDateTime(lecture.startsAt)}
                    </p>
                  </div>

                  <div className="surface-soft rounded-2xl p-4">
                    <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                      Ends
                    </p>

                    <p className="mt-1 text-sm font-black text-[var(--color-heading)]">
                      {formatDateTime(lecture.endsAt)}
                    </p>
                  </div>

                  <div className="surface-soft rounded-2xl p-4">
                    <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                      Duration
                    </p>

                    <p className="mt-1 text-sm font-black text-[var(--color-heading)]">
                      {getDuration(lecture)}
                    </p>
                  </div>
                </div>

                {lecture.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
                    {lecture.description}
                  </p>
                ) : null}

                {lectureStatus === "completed" ? (
                  <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                      Daily Lecture Report
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <ReportItem
                        label="Topic Covered"
                        value={lecture.topicCovered}
                      />
                      <ReportItem
                        label="Doubts Solved"
                        value={lecture.doubtsSolved}
                      />
                      <ReportItem
                        label="Homework"
                        value={lecture.homeworkGiven}
                      />
                      <ReportItem
                        label="Assignment"
                        value={lecture.assignmentGiven}
                      />
                      <ReportItem
                        label="Revision Task"
                        value={lecture.revisionTask}
                      />
                      <ReportItem
                        label="Next Topic"
                        value={lecture.nextTopic}
                      />
                    </div>
                  </div>
                ) : null}

                {isEditingReport ? (
                  <div className="mt-5 rounded-[1.5rem] border border-blue-200 bg-blue-50/40 p-4">
                    <p className="text-sm font-black text-blue-700">
                      Complete Daily Lecture Report
                    </p>

                    {!lecture.endsAt ? (
                      <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                        This lecture does not have an end time. Add it before
                        marking it completed.
                      </p>
                    ) : null}

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <FieldLabel label="Topic Covered">
                        <input
                          value={reportDraft.topicCovered ?? ""}
                          onChange={(event) =>
                            updateReportDraft(
                              "topicCovered",
                              event.target.value,
                            )
                          }
                          placeholder="Topic covered"
                          className={fieldClass}
                        />
                      </FieldLabel>

                      <FieldLabel label="Doubts Solved">
                        <input
                          value={reportDraft.doubtsSolved ?? ""}
                          onChange={(event) =>
                            updateReportDraft(
                              "doubtsSolved",
                              event.target.value,
                            )
                          }
                          placeholder="Doubts solved"
                          className={fieldClass}
                        />
                      </FieldLabel>

                      <FieldLabel label="Homework Given">
                        <textarea
                          value={reportDraft.homeworkGiven ?? ""}
                          onChange={(event) =>
                            updateReportDraft(
                              "homeworkGiven",
                              event.target.value,
                            )
                          }
                          placeholder="Homework details"
                          className={textareaClass}
                        />
                      </FieldLabel>

                      <FieldLabel label="Assignment Given">
                        <textarea
                          value={reportDraft.assignmentGiven ?? ""}
                          onChange={(event) =>
                            updateReportDraft(
                              "assignmentGiven",
                              event.target.value,
                            )
                          }
                          placeholder="Assignment details"
                          className={textareaClass}
                        />
                      </FieldLabel>

                      <FieldLabel label="Revision Task">
                        <textarea
                          value={reportDraft.revisionTask ?? ""}
                          onChange={(event) =>
                            updateReportDraft(
                              "revisionTask",
                              event.target.value,
                            )
                          }
                          placeholder="Revision task"
                          className={textareaClass}
                        />
                      </FieldLabel>

                      <FieldLabel label="Next Topic">
                        <textarea
                          value={reportDraft.nextTopic ?? ""}
                          onChange={(event) =>
                            updateReportDraft("nextTopic", event.target.value)
                          }
                          placeholder="Next topic"
                          className={textareaClass}
                        />
                      </FieldLabel>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isSubmittingReport || !lecture.endsAt}
                        onClick={() => void submitLectureReport(lecture)}
                        className="action-button px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmittingReport
                          ? "Submitting..."
                          : "Submit Report & Mark Completed"}
                      </button>

                      <button
                        type="button"
                        onClick={closeReportEditor}
                        className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  {canEdit && lecture.meetingLink ? (
                    <a
                      href={lecture.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="action-button px-5 py-3 text-sm"
                    >
                      Join Lecture
                    </a>
                  ) : null}

                  {lecture.recordingLink ? (
                    <a
                      href={lecture.recordingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                    >
                      Watch Recording
                    </a>
                  ) : null}

                  {lecture.materialLink ? (
                    <a
                      href={lecture.materialLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                    >
                      Open Material
                    </a>
                  ) : null}

                  {canEdit && lectureStatus !== "completed" ? (
                    <button
                      type="button"
                      onClick={() => openReportEditor(lecture)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                    >
                      Submit Report
                    </button>
                  ) : null}

                  {canEdit && lectureStatus === "completed" ? (
                    <button
                      type="button"
                      onClick={() => openReportEditor(lecture)}
                      className="rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
                    >
                      Edit Report
                    </button>
                  ) : null}

                  {canEdit && lectureStatus !== "cancelled" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void changeLectureStatus(lecture, "cancelled")
                      }
                      className="rounded-full border border-rose-200 px-5 py-3 text-sm font-black text-rose-600 hover:bg-rose-50"
                    >
                      Cancel Lecture
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="surface-soft rounded-[2rem] border border-[var(--color-border)] p-10 text-center lg:col-span-2">
            <h3 className="text-lg font-black text-[var(--color-heading)]">
              {canEdit ? "No lectures yet" : "No recorded lectures yet"}
            </h3>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canEdit
                ? "Create your first lecture or daily lecture report above."
                : "Completed class recordings will appear here once they are uploaded."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ReportItem({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700/70">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-[var(--color-heading)]">
        {value}
      </p>
    </div>
  );
}
