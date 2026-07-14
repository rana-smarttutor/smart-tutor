"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ManagedUser,
  Role,
  TeacherFeedback,
} from "@/lib/types";

type StudentFeedbackManagerProps = {
  role: Role;
  studentDirectory: ManagedUser[];
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const textareaClass =
  "min-h-24 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const FEEDBACK_CATEGORIES: Array<{
  value: TeacherFeedback["category"];
  label: string;
}> = [
  {
    value: "academic",
    label: "Academic Progress",
  },
  {
    value: "homework",
    label: "Homework & Assignments",
  },
  {
    value: "attendance",
    label: "Attendance",
  },
  {
    value: "improvement",
    label: "Improvement Plan",
  },
];

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

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
      month: "short",
      year: "numeric",
    },
  );
}

function getFeedbackCategoryLabel(
  category: TeacherFeedback["category"],
) {
  return (
    FEEDBACK_CATEGORIES.find(
      (item) =>
        item.value ===
        category,
    )?.label ??
    category
  );
}

export function StudentFeedbackManager({
  role,
  studentDirectory,
}: StudentFeedbackManagerProps) {
  const canManage =
    role === "admin" ||
    role === "educator";

  const [
    teacherFeedback,
    setTeacherFeedback,
  ] = useState<
    TeacherFeedback[]
  >([]);

  const [allStudents] = useState<ManagedUser[]>(() =>
    studentDirectory.filter((s) => s.role === "student"),
  );

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [
    subject,
    setSubject,
  ] = useState("");

  const [
    category,
    setCategory,
  ] =
    useState<
      TeacherFeedback["category"]
    >("academic");

  const [
    strengths,
    setStrengths,
  ] = useState("");

  const [
    areasToImprove,
    setAreasToImprove,
  ] = useState("");

  const [
    feedbackText,
    setFeedbackText,
  ] = useState("");

  const [
    feedbackVisibleToParent,
    setFeedbackVisibleToParent,
  ] = useState(true);

  const [
    editingFeedbackId,
    setEditingFeedbackId,
  ] = useState<
    string | null
  >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const selectedStudent =
    useMemo(
      () =>
        allStudents.find(
          (student) =>
            student.id ===
            selectedStudentId,
        ),
      [
        allStudents,
        selectedStudentId,
      ],
    );

  const isEditing =
    Boolean(
      editingFeedbackId,
    );

  useEffect(() => {
    let cancelled =
      false;

    async function loadFeedbackData() {
      setIsLoading(true);

      try {
        const feedbackResponse =
          await fetch(
            "/api/student-feedback",
            {
              method:
                "GET",

              credentials:
                "same-origin",

              cache:
                "no-store",
            },
          );

        const feedbackPayload =
          (await feedbackResponse.json()) as {
            teacherFeedback?: TeacherFeedback[];

            error?: string;
          };

        if (
          !feedbackResponse.ok
        ) {
          throw new Error(
            feedbackPayload.error ??
              "Unable to load teacher feedback.",
          );
        }

        if (
          !cancelled
        ) {
          setTeacherFeedback(
            feedbackPayload.teacherFeedback ??
              [],
          );
        }
      } catch (error) {
        if (
          !cancelled
        ) {
          setMessage(
            error instanceof
              Error
              ? error.message
              : "Unable to load teacher feedback.",
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setIsLoading(
            false,
          );
        }
      }
    }

    void loadFeedbackData();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetFeedbackForm() {
    setEditingFeedbackId(
      null,
    );

    setCategory(
      "academic",
    );

    setStrengths("");

    setAreasToImprove(
      "",
    );

    setFeedbackText("");

    setFeedbackVisibleToParent(
      true,
    );
  }

  function cancelEditing() {
    resetFeedbackForm();

    setMessage("");
  }

  function openFeedbackEditor(
    item: TeacherFeedback,
  ) {
    setEditingFeedbackId(
      item.id,
    );

    setSelectedStudentId(
      item.studentId,
    );

    setSubject(
      item.subject ??
        "",
    );

    setCategory(
      item.category,
    );

    setStrengths(
      item.strengths ??
        "",
    );

    setAreasToImprove(
      item.areasToImprove ??
        "",
    );

    setFeedbackText(
      item.feedback,
    );

    setFeedbackVisibleToParent(
      item.visibleToParent,
    );

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  async function saveFeedback() {
    if (
      !canManage
    ) {
      return;
    }

    if (
      !editingFeedbackId &&
      !selectedStudent
    ) {
      setMessage(
        "Select a student.",
      );

      return;
    }

    if (
      !feedbackText.trim()
    ) {
      setMessage(
        "Teacher feedback is required.",
      );

      return;
    }

    setIsSaving(true);

    setMessage("");

    try {
      const isEditingFeedback =
        Boolean(
          editingFeedbackId,
        );

      const response =
        await fetch(
          isEditingFeedback
            ? `/api/student-feedback/${editingFeedbackId}`
            : "/api/student-feedback",
          {
            method:
              isEditingFeedback
                ? "PATCH"
                : "POST",

            credentials:
              "same-origin",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                isEditingFeedback
                  ? {
                      category,

                      subject,

                      strengths,

                      areasToImprove,

                      feedback:
                        feedbackText,

                      visibleToParent:
                        feedbackVisibleToParent,
                    }
                    : {
                      type:
                        "feedback",

                      studentId:
                        selectedStudent!
                          .id,

                      studentName:
                        selectedStudent!
                          .name,

                      subject,

                      category,

                      strengths,

                      areasToImprove,

                      feedback:
                        feedbackText,

                      visibleToParent:
                        feedbackVisibleToParent,
                    },
              ),
          },
        );

      const payload =
        (await response.json()) as {
          feedback?: TeacherFeedback;

          error?: string;
        };

      if (
        !response.ok ||
        !payload.feedback
      ) {
        setMessage(
          payload.error ??
            "Unable to save teacher feedback.",
        );

        return;
      }

      setTeacherFeedback(
        (current) =>
          isEditingFeedback
            ? current.map(
                (item) =>
                  item.id ===
                  payload
                    .feedback!
                    .id
                    ? payload
                        .feedback!
                    : item,
              )
            : [
                payload
                  .feedback!,
                ...current,
              ],
      );

      setMessage(
        isEditingFeedback
          ? "Teacher feedback updated."
          : "Teacher feedback saved successfully.",
      );

      resetFeedbackForm();
    } catch {
      setMessage(
        "Unable to save teacher feedback.",
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function deleteFeedback(
    feedbackId: string,
  ) {
    if (
      !canManage
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this teacher feedback? This action cannot be undone.",
      );

    if (
      !confirmed
    ) {
      return;
    }

    setDeletingId(
      feedbackId,
    );

    setMessage("");

    try {
      const response =
        await fetch(
          `/api/student-feedback/${feedbackId}`,
          {
            method:
              "DELETE",

            credentials:
              "same-origin",
          },
        );

      const payload =
        (await response.json()) as {
          success?: boolean;

          error?: string;
        };

      if (
        !response.ok ||
        !payload.success
      ) {
        setMessage(
          payload.error ??
            "Unable to delete teacher feedback.",
        );

        return;
      }

      setTeacherFeedback(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              feedbackId,
          ),
      );

      if (
        editingFeedbackId ===
        feedbackId
      ) {
        resetFeedbackForm();
      }

      setMessage(
        "Teacher feedback deleted.",
      );
    } catch {
      setMessage(
        "Unable to delete teacher feedback.",
      );
    } finally {
      setDeletingId(
        null,
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="surface rounded-[2rem] p-6">
        <p className="section-label">
          Student Development
        </p>

        <h2 className="mt-2 text-2xl font-black text-[var(--color-heading)]">
          {canManage
            ? "Teacher Feedback Management"
            : "Teacher Feedback"}
        </h2>

        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {canManage
            ? "Create academic feedback, highlight strengths, and provide clear improvement guidance for students."
            : "View teacher feedback and academic development guidance."}
        </p>

        {message ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        ) : null}

        {canManage ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Student
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
                  disabled={
                    isEditing
                  }
                  className={
                    fieldClass
                  }
                >
                  <option value="">
                    {allStudents.length
                      ? "Select student"
                      : "No students available"}
                  </option>

                  {allStudents.map(
                    (
                      student,
                    ) => (
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
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            {isEditing ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                You are editing an existing
                feedback record. Batch and
                student cannot be changed
                after creation.
              </p>
            ) : null}

            <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50/40 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-black text-blue-800">
                    {editingFeedbackId
                      ? "Edit Teacher Feedback"
                      : "Create Teacher Feedback"}
                  </h3>

                  <p className="mt-1 text-sm text-blue-700/80">
                    Record clear strengths,
                    improvement areas, and
                    useful academic guidance.
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                  Feedback
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                    Category
                  </span>

                  <select
                    value={
                      category
                    }
                    onChange={(
                      event,
                    ) =>
                      setCategory(
                        event.target
                          .value as TeacherFeedback["category"],
                      )
                    }
                    className={
                      fieldClass
                    }
                  >
                    {FEEDBACK_CATEGORIES.map(
                      (
                        item,
                      ) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                    Subject
                  </span>

                  <input
                    value={
                      subject
                    }
                    onChange={(
                      event,
                    ) =>
                      setSubject(
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. Mathematics"
                    className={
                      fieldClass
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                    Student Strengths
                  </span>

                  <textarea
                    value={
                      strengths
                    }
                    onChange={(
                      event,
                    ) =>
                      setStrengths(
                        event.target
                          .value,
                      )
                    }
                    placeholder="What is the student doing well?"
                    className={
                      textareaClass
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                    Areas to Improve
                  </span>

                  <textarea
                    value={
                      areasToImprove
                    }
                    onChange={(
                      event,
                    ) =>
                      setAreasToImprove(
                        event.target
                          .value,
                      )
                    }
                    placeholder="What should the student focus on next?"
                    className={
                      textareaClass
                    }
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Teacher Feedback
                </span>

                <textarea
                  value={
                    feedbackText
                  }
                  onChange={(
                    event,
                  ) =>
                    setFeedbackText(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Write clear and helpful feedback for the student and parent."
                  className={
                    textareaClass
                  }
                />
              </label>

              <label className="mt-5 flex items-center gap-3 text-sm font-black text-[var(--color-heading)]">
                <input
                  type="checkbox"
                  checked={
                    feedbackVisibleToParent
                  }
                  onChange={(
                    event,
                  ) =>
                    setFeedbackVisibleToParent(
                      event.target
                        .checked,
                    )
                  }
                  className="h-5 w-5 accent-blue-600"
                />

                Make this feedback visible to
                student and parent
              </label>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void saveFeedback()
                  }
                  disabled={
                    isSaving
                  }
                  className="action-button px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingFeedbackId
                      ? "Update Feedback"
                      : "Save Feedback"}
                </button>

                {editingFeedbackId ? (
                  <button
                    type="button"
                    onClick={
                      cancelEditing
                    }
                    className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="surface rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">
              History
            </p>

            <h3 className="text-xl font-black text-[var(--color-heading)]">
              Teacher Feedback Timeline
            </h3>
          </div>

          <span className="pill w-fit">
            {
              teacherFeedback.length
            }{" "}
            {teacherFeedback.length ===
            1
              ? "Record"
              : "Records"}
          </span>
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-[var(--color-muted)]">
            Loading feedback records...
          </p>
        ) : null}

        {!isLoading &&
        teacherFeedback.length ===
          0 ? (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-10 text-center">
            <h4 className="font-black text-[var(--color-heading)]">
              No feedback available
            </h4>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canManage
                ? "Create the first teacher feedback above."
                : "Teacher feedback will appear here."}
            </p>
          </div>
        ) : null}

        {teacherFeedback.length >
        0 ? (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-[var(--color-heading)]">
                Academic Feedback
              </h4>

              <span className="pill">
                {
                  teacherFeedback.length
                }
              </span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {teacherFeedback.map(
                (item) => (
                  <article
                    key={
                      item.id
                    }
                    className="rounded-[1.5rem] border border-blue-200 bg-blue-50/30 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h5 className="font-black text-[var(--color-heading)]">
                          {
                            item.studentName
                          }
                        </h5>

                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {item.subject
                            ? item.subject
                            : ""}

                          {` • ${formatDate(
                            item.createdAt,
                          )}`}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                        {getFeedbackCategoryLabel(
                          item.category,
                        )}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-heading)]">
                      {
                        item.feedback
                      }
                    </p>

                    {item.strengths ? (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                          Strengths
                        </p>

                        <p className="mt-2 text-sm text-emerald-900">
                          {
                            item.strengths
                          }
                        </p>
                      </div>
                    ) : null}

                    {item.areasToImprove ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                          Improvement Focus
                        </p>

                        <p className="mt-2 text-sm text-amber-900">
                          {
                            item.areasToImprove
                          }
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-2 text-xs font-black ${
                          item.visibleToParent
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item.visibleToParent
                          ? "Student / Parent Visible"
                          : "Internal Record"}
                      </span>

                      {canManage ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              openFeedbackEditor(
                                item,
                              )
                            }
                            className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              item.id
                            }
                            onClick={() =>
                              void deleteFeedback(
                                item.id,
                              )
                            }
                            className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                          >
                            {deletingId ===
                            item.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}