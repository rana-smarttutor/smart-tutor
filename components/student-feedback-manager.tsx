"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  Batch,
  BehaviourNote,
  ManagedUser,
  Role,
  TeacherFeedback,
} from "@/lib/types";

type StudentFeedbackManagerProps = {
  role: Role;
  studentDirectory: ManagedUser[];
};

type ActiveForm = "feedback" | "behaviour";
type HistoryFilter = "all" | "feedback" | "behaviour";

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const textareaClass =
  "min-h-24 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const FEEDBACK_CATEGORIES: Array<{
  value: TeacherFeedback["category"];
  label: string;
}> = [
  { value: "academic", label: "Academic Progress" },
  { value: "homework", label: "Homework & Assignments" },
  { value: "attendance", label: "Attendance" },
  { value: "improvement", label: "Improvement Plan" },
];

const BEHAVIOUR_RATINGS: Array<{
  value: BehaviourNote["rating"];
  label: string;
}> = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "needs-improvement", label: "Needs Improvement" },
  { value: "concern", label: "Concern" },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getFeedbackCategoryLabel(category: TeacherFeedback["category"]) {
  return (
    FEEDBACK_CATEGORIES.find((item) => item.value === category)?.label ??
    category
  );
}

function getBehaviourRatingLabel(rating: BehaviourNote["rating"]) {
  return (
    BEHAVIOUR_RATINGS.find((item) => item.value === rating)?.label ?? rating
  );
}

function getBehaviourRatingClass(rating: BehaviourNote["rating"]) {
  if (rating === "excellent") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (rating === "good") {
    return "bg-blue-100 text-blue-700";
  }

  if (rating === "needs-improvement") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-rose-100 text-rose-700";
}

export function StudentFeedbackManager({
  role,
  studentDirectory,
}: StudentFeedbackManagerProps) {
  const canManage = role === "admin" || role === "educator";

  const [teacherFeedback, setTeacherFeedback] = useState<TeacherFeedback[]>(
    [],
  );
  const [behaviourNotes, setBehaviourNotes] = useState<BehaviourNote[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [activeForm, setActiveForm] = useState<ActiveForm>("feedback");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [subject, setSubject] = useState("");
  const [category, setCategory] =
    useState<TeacherFeedback["category"]>("academic");
  const [strengths, setStrengths] = useState("");
  const [areasToImprove, setAreasToImprove] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackVisibleToParent, setFeedbackVisibleToParent] =
    useState(true);

  const [rating, setRating] =
    useState<BehaviourNote["rating"]>("good");
  const [behaviourText, setBehaviourText] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [behaviourVisibleToParent, setBehaviourVisibleToParent] =
    useState(false);
  const [resolved, setResolved] = useState(false);

  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(
    null,
  );
  const [editingBehaviourId, setEditingBehaviourId] = useState<string | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId),
    [batches, selectedBatchId],
  );

  const batchStudents = useMemo(() => {
    if (!selectedBatch) {
      return [];
    }

    return selectedBatch.studentIds
      .map((studentId) =>
        studentDirectory.find(
          (student) =>
            student.id === studentId && student.role === "student",
        ),
      )
      .filter((student): student is ManagedUser => Boolean(student));
  }, [selectedBatch, studentDirectory]);

  const selectedStudent = useMemo(
    () => batchStudents.find((student) => student.id === selectedStudentId),
    [batchStudents, selectedStudentId],
  );

  const isEditing = Boolean(editingFeedbackId || editingBehaviourId);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedbackData() {
      setIsLoading(true);

      try {
        const feedbackResponse = await fetch("/api/student-feedback", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const feedbackPayload = (await feedbackResponse.json()) as {
          teacherFeedback?: TeacherFeedback[];
          behaviourNotes?: BehaviourNote[];
          error?: string;
        };

        if (!feedbackResponse.ok) {
          throw new Error(
            feedbackPayload.error ?? "Unable to load student feedback.",
          );
        }

        if (!cancelled) {
          setTeacherFeedback(feedbackPayload.teacherFeedback ?? []);
          setBehaviourNotes(feedbackPayload.behaviourNotes ?? []);
        }

        if (canManage) {
          const batchResponse = await fetch("/api/batches", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          });

          const batchPayload = (await batchResponse.json()) as {
            batches?: Batch[];
            error?: string;
          };

          if (!batchResponse.ok) {
            throw new Error(
              batchPayload.error ?? "Unable to load assigned batches.",
            );
          }

          if (!cancelled) {
            setBatches(batchPayload.batches ?? []);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load student feedback.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFeedbackData();

    return () => {
      cancelled = true;
    };
  }, [canManage]);

  function handleBatchChange(nextBatchId: string) {
    setSelectedBatchId(nextBatchId);
    setSelectedStudentId("");

    const batch = batches.find((item) => item.id === nextBatchId);

    setSubject(batch?.subject ?? "");
  }

  function resetFeedbackForm() {
    setEditingFeedbackId(null);
    setCategory("academic");
    setStrengths("");
    setAreasToImprove("");
    setFeedbackText("");
    setFeedbackVisibleToParent(true);
  }

  function resetBehaviourForm() {
    setEditingBehaviourId(null);
    setRating("good");
    setBehaviourText("");
    setActionTaken("");
    setBehaviourVisibleToParent(false);
    setResolved(false);
  }

  function cancelEditing() {
    resetFeedbackForm();
    resetBehaviourForm();
    setMessage("");
  }

  function openFeedbackEditor(item: TeacherFeedback) {
    setActiveForm("feedback");
    setEditingBehaviourId(null);
    setEditingFeedbackId(item.id);

    setSelectedBatchId(item.batchId ?? "");
    setSelectedStudentId(item.studentId);
    setSubject(item.subject ?? "");
    setCategory(item.category);
    setStrengths(item.strengths ?? "");
    setAreasToImprove(item.areasToImprove ?? "");
    setFeedbackText(item.feedback);
    setFeedbackVisibleToParent(item.visibleToParent);

    setMessage("");
  }

  function openBehaviourEditor(item: BehaviourNote) {
    setActiveForm("behaviour");
    setEditingFeedbackId(null);
    setEditingBehaviourId(item.id);

    setSelectedBatchId(item.batchId ?? "");
    setSelectedStudentId(item.studentId);
    setRating(item.rating);
    setBehaviourText(item.note);
    setActionTaken(item.actionTaken ?? "");
    setBehaviourVisibleToParent(item.visibleToParent);
    setResolved(item.resolved ?? false);

    setMessage("");
  }

  async function saveFeedback() {
    if (!canManage) {
      return;
    }

    if (!editingFeedbackId && !selectedBatch) {
      setMessage("Select a batch.");
      return;
    }

    if (!editingFeedbackId && !selectedStudent) {
      setMessage("Select a student.");
      return;
    }

    if (!feedbackText.trim()) {
      setMessage("Feedback is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const isEditingFeedback = Boolean(editingFeedbackId);

      const response = await fetch(
        isEditingFeedback
          ? `/api/student-feedback/${editingFeedbackId}`
          : "/api/student-feedback",
        {
          method: isEditingFeedback ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditingFeedback
              ? {
                  category,
                  subject,
                  strengths,
                  areasToImprove,
                  feedback: feedbackText,
                  visibleToParent: feedbackVisibleToParent,
                }
              : {
                  type: "feedback",
                  batchId: selectedBatch!.id,
                  studentId: selectedStudent!.id,
                  studentName: selectedStudent!.name,
                  subject,
                  category,
                  strengths,
                  areasToImprove,
                  feedback: feedbackText,
                  visibleToParent: feedbackVisibleToParent,
                },
          ),
        },
      );

      const payload = (await response.json()) as {
        feedback?: TeacherFeedback;
        error?: string;
      };

      if (!response.ok || !payload.feedback) {
        setMessage(payload.error ?? "Unable to save feedback.");
        return;
      }

      setTeacherFeedback((current) =>
        isEditingFeedback
          ? current.map((item) =>
              item.id === payload.feedback!.id ? payload.feedback! : item,
            )
          : [payload.feedback!, ...current],
      );

      setMessage(
        isEditingFeedback
          ? "Student feedback updated."
          : "Student feedback saved successfully.",
      );

      resetFeedbackForm();
    } catch {
      setMessage("Unable to save feedback.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveBehaviourNote() {
    if (!canManage) {
      return;
    }

    if (!editingBehaviourId && !selectedBatch) {
      setMessage("Select a batch.");
      return;
    }

    if (!editingBehaviourId && !selectedStudent) {
      setMessage("Select a student.");
      return;
    }

    if (!behaviourText.trim()) {
      setMessage("Behaviour note is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const isEditingBehaviour = Boolean(editingBehaviourId);

      const response = await fetch(
        isEditingBehaviour
          ? `/api/student-feedback/${editingBehaviourId}`
          : "/api/student-feedback",
        {
          method: isEditingBehaviour ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditingBehaviour
              ? {
                  rating,
                  note: behaviourText,
                  actionTaken,
                  visibleToParent: behaviourVisibleToParent,
                  resolved,
                }
              : {
                  type: "behaviour",
                  batchId: selectedBatch!.id,
                  studentId: selectedStudent!.id,
                  studentName: selectedStudent!.name,
                  rating,
                  note: behaviourText,
                  actionTaken,
                  visibleToParent: behaviourVisibleToParent,
                  resolved,
                },
          ),
        },
      );

      const payload = (await response.json()) as {
        behaviourNote?: BehaviourNote;
        error?: string;
      };

      if (!response.ok || !payload.behaviourNote) {
        setMessage(payload.error ?? "Unable to save behaviour note.");
        return;
      }

      setBehaviourNotes((current) =>
        isEditingBehaviour
          ? current.map((item) =>
              item.id === payload.behaviourNote!.id
                ? payload.behaviourNote!
                : item,
            )
          : [payload.behaviourNote!, ...current],
      );

      setMessage(
        isEditingBehaviour
          ? "Behaviour note updated."
          : "Behaviour note saved successfully.",
      );

      resetBehaviourForm();
    } catch {
      setMessage("Unable to save behaviour note.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleResolved(item: BehaviourNote) {
    if (!canManage) {
      return;
    }

    try {
      const response = await fetch(`/api/student-feedback/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolved: !item.resolved,
        }),
      });

      const payload = (await response.json()) as {
        behaviourNote?: BehaviourNote;
        error?: string;
      };

      if (!response.ok || !payload.behaviourNote) {
        setMessage(payload.error ?? "Unable to update note status.");
        return;
      }

      setBehaviourNotes((current) =>
        current.map((note) =>
          note.id === payload.behaviourNote!.id
            ? payload.behaviourNote!
            : note,
        ),
      );

      setMessage(
        payload.behaviourNote.resolved
          ? "Behaviour note marked resolved."
          : "Behaviour note marked open.",
      );
    } catch {
      setMessage("Unable to update note status.");
    }
  }

  async function deleteRecord(
    id: string,
    recordLabel: "feedback" | "behaviour note",
  ) {
    if (!canManage) {
      return;
    }

    const confirmed = window.confirm(
      `Delete this ${recordLabel}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/student-feedback/${id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setMessage(payload.error ?? `Unable to delete ${recordLabel}.`);
        return;
      }

      if (id.startsWith("feedback-")) {
        setTeacherFeedback((current) =>
          current.filter((item) => item.id !== id),
        );

        if (editingFeedbackId === id) {
          resetFeedbackForm();
        }
      } else {
        setBehaviourNotes((current) =>
          current.filter((item) => item.id !== id),
        );

        if (editingBehaviourId === id) {
          resetBehaviourForm();
        }
      }

      setMessage(
        recordLabel === "feedback"
          ? "Feedback deleted."
          : "Behaviour note deleted.",
      );
    } catch {
      setMessage(`Unable to delete ${recordLabel}.`);
    } finally {
      setDeletingId(null);
    }
  }

  const showFeedback =
    historyFilter === "all" || historyFilter === "feedback";

  const showBehaviour =
    historyFilter === "all" || historyFilter === "behaviour";

  return (
    <section className="space-y-6">
      <div className="surface rounded-[2rem] p-6">
        <p className="section-label">Student Development</p>

        <h2 className="mt-2 text-2xl font-black text-[var(--color-heading)]">
          {canManage
            ? "Feedback & Behaviour Management"
            : "Teacher Feedback & Development Notes"}
        </h2>

        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {canManage
            ? "Create academic feedback, improvement guidance, and behaviour records for students in your assigned batches."
            : "View teacher feedback and parent-visible behaviour notes for academic growth."}
        </p>

        {message ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        ) : null}

        {canManage ? (
          <div className="mt-6 space-y-5">
            {!isLoading && !batches.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                No active batches are assigned. Create a batch and add students
                before recording feedback.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveForm("feedback");
                  resetBehaviourForm();
                }}
                className={`rounded-full px-5 py-3 text-sm font-black transition ${
                  activeForm === "feedback"
                    ? "bg-blue-600 text-white"
                    : "border border-[var(--color-border)] text-[var(--color-heading)] hover:bg-blue-500/10"
                }`}
              >
                Academic Feedback
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveForm("behaviour");
                  resetFeedbackForm();
                }}
                className={`rounded-full px-5 py-3 text-sm font-black transition ${
                  activeForm === "behaviour"
                    ? "bg-blue-600 text-white"
                    : "border border-[var(--color-border)] text-[var(--color-heading)] hover:bg-blue-500/10"
                }`}
              >
                Behaviour & Discipline
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Batch
                </span>

                <select
                  value={selectedBatchId}
                  onChange={(event) => handleBatchChange(event.target.value)}
                  disabled={isLoading || isEditing}
                  className={fieldClass}
                >
                  <option value="">
                    {isLoading ? "Loading batches..." : "Select assigned batch"}
                  </option>

                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Student
                </span>

                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  disabled={!selectedBatchId || isEditing}
                  className={fieldClass}
                >
                  <option value="">
                    {selectedBatchId
                      ? "Select student"
                      : "Select batch first"}
                  </option>

                  {batchStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isEditing ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                You are editing an existing record. Batch and student cannot be
                changed after creation.
              </p>
            ) : null}

            {activeForm === "feedback" ? (
              <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50/40 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-black text-blue-800">
                      {editingFeedbackId
                        ? "Edit Academic Feedback"
                        : "Create Academic Feedback"}
                    </h3>

                    <p className="mt-1 text-sm text-blue-700/80">
                      Record clear strengths, improvement areas, and actionable
                      guidance.
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
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target.value as TeacherFeedback["category"],
                        )
                      }
                      className={fieldClass}
                    >
                      {FEEDBACK_CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
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
                      Student Strengths
                    </span>

                    <textarea
                      value={strengths}
                      onChange={(event) => setStrengths(event.target.value)}
                      placeholder="What is the student doing well?"
                      className={textareaClass}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                      Areas to Improve
                    </span>

                    <textarea
                      value={areasToImprove}
                      onChange={(event) =>
                        setAreasToImprove(event.target.value)
                      }
                      placeholder="What should the student focus on next?"
                      className={textareaClass}
                    />
                  </label>
                </div>

                <label className="mt-4 block space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                    Teacher Feedback
                  </span>

                  <textarea
                    value={feedbackText}
                    onChange={(event) => setFeedbackText(event.target.value)}
                    placeholder="Write clear, helpful feedback for the student and parent."
                    className={textareaClass}
                  />
                </label>

                <label className="mt-5 flex items-center gap-3 text-sm font-black text-[var(--color-heading)]">
                  <input
                    type="checkbox"
                    checked={feedbackVisibleToParent}
                    onChange={(event) =>
                      setFeedbackVisibleToParent(event.target.checked)
                    }
                    className="h-5 w-5 accent-blue-600"
                  />
                  Make this feedback visible to student and parent
                </label>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void saveFeedback()}
                    disabled={isSaving}
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
                      onClick={cancelEditing}
                      className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/40 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-black text-amber-800">
                      {editingBehaviourId
                        ? "Edit Behaviour Note"
                        : "Create Behaviour Note"}
                    </h3>

                    <p className="mt-1 text-sm text-amber-700/80">
                      Use factual, respectful notes. Keep parent visibility off
                      for internal observations.
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                    Behaviour
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                      Rating
                    </span>

                    <select
                      value={rating}
                      onChange={(event) =>
                        setRating(
                          event.target.value as BehaviourNote["rating"],
                        )
                      }
                      className={fieldClass}
                    >
                      {BEHAVIOUR_RATINGS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                      Action Taken
                    </span>

                    <input
                      value={actionTaken}
                      onChange={(event) => setActionTaken(event.target.value)}
                      placeholder="Optional action or follow-up"
                      className={fieldClass}
                    />
                  </label>
                </div>

                <label className="mt-4 block space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                    Behaviour / Discipline Note
                  </span>

                  <textarea
                    value={behaviourText}
                    onChange={(event) => setBehaviourText(event.target.value)}
                    placeholder="Write an objective behaviour note."
                    className={textareaClass}
                  />
                </label>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-3 text-sm font-black text-[var(--color-heading)]">
                      <input
                        type="checkbox"
                        checked={behaviourVisibleToParent}
                        onChange={(event) =>
                          setBehaviourVisibleToParent(event.target.checked)
                        }
                        className="h-5 w-5 accent-blue-600"
                      />
                      Visible to student and parent
                    </label>

                    <label className="flex items-center gap-3 text-sm font-black text-[var(--color-heading)]">
                      <input
                        type="checkbox"
                        checked={resolved}
                        onChange={(event) => setResolved(event.target.checked)}
                        className="h-5 w-5 accent-blue-600"
                      />
                      Mark as resolved
                    </label>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void saveBehaviourNote()}
                    disabled={isSaving}
                    className="action-button px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingBehaviourId
                        ? "Update Behaviour Note"
                        : "Save Behaviour Note"}
                  </button>

                  {editingBehaviourId ? (
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
            )}
          </div>
        ) : null}
      </div>

      <div className="surface rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">History</p>

            <h3 className="text-xl font-black text-[var(--color-heading)]">
              Feedback & Behaviour Timeline
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All Records"],
                ["feedback", "Feedback"],
                ["behaviour", "Behaviour"],
              ] as Array<[HistoryFilter, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setHistoryFilter(value)}
                className={`rounded-full px-4 py-2 text-xs font-black transition ${
                  historyFilter === value
                    ? "bg-blue-600 text-white"
                    : "border border-[var(--color-border)] text-[var(--color-heading)] hover:bg-blue-500/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-[var(--color-muted)]">
            Loading feedback records...
          </p>
        ) : null}

        {!isLoading &&
        (!showFeedback || teacherFeedback.length === 0) &&
        (!showBehaviour || behaviourNotes.length === 0) ? (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-10 text-center">
            <h4 className="font-black text-[var(--color-heading)]">
              No records available
            </h4>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canManage
                ? "Create the first feedback or behaviour note above."
                : "Parent-visible feedback and teacher notes will appear here."}
            </p>
          </div>
        ) : null}

        {showFeedback && teacherFeedback.length ? (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-[var(--color-heading)]">
                Academic Feedback
              </h4>

              <span className="pill">{teacherFeedback.length}</span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {teacherFeedback.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.5rem] border border-blue-200 bg-blue-50/30 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="font-black text-[var(--color-heading)]">
                        {item.studentName}
                      </h5>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {item.batchName ?? "Batch not specified"}
                        {item.subject ? ` • ${item.subject}` : ""}
                        {` • ${formatDate(item.createdAt)}`}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                      {getFeedbackCategoryLabel(item.category)}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-heading)]">
                    {item.feedback}
                  </p>

                  {item.strengths ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                        Strengths
                      </p>

                      <p className="mt-2 text-sm text-emerald-900">
                        {item.strengths}
                      </p>
                    </div>
                  ) : null}

                  {item.areasToImprove ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                        Improvement Focus
                      </p>

                      <p className="mt-2 text-sm text-amber-900">
                        {item.areasToImprove}
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
                          onClick={() => openFeedbackEditor(item)}
                          className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() =>
                            void deleteRecord(item.id, "feedback")
                          }
                          className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {showBehaviour && behaviourNotes.length ? (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-[var(--color-heading)]">
                Behaviour & Discipline Notes
              </h4>

              <span className="pill">{behaviourNotes.length}</span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {behaviourNotes.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="font-black text-[var(--color-heading)]">
                        {item.studentName}
                      </h5>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {item.batchName ?? "Batch not specified"}
                        {` • ${formatDate(item.createdAt)}`}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getBehaviourRatingClass(
                        item.rating,
                      )}`}
                    >
                      {getBehaviourRatingLabel(item.rating)}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-heading)]">
                    {item.note}
                  </p>

                  {item.actionTaken ? (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                        Action Taken
                      </p>

                      <p className="mt-2 text-sm text-blue-900">
                        {item.actionTaken}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-2 text-xs font-black ${
                        item.resolved
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.resolved ? "Resolved" : "Open"}
                    </span>

                    {canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void toggleResolved(item)}
                          className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-black text-[var(--color-heading)] hover:bg-blue-50"
                        >
                          Mark {item.resolved ? "Open" : "Resolved"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openBehaviourEditor(item)}
                          className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() =>
                            void deleteRecord(item.id, "behaviour note")
                          }
                          className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}