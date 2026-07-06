"use client";

import { useEffect, useState } from "react";

import type {
  HomeworkItem,
  HomeworkSubmission,
  HomeworkType,
  ManagedUser,
  Role,
  SessionUser,
} from "@/lib/types";

type EnrichedHomework = HomeworkItem & {
  submissions?: HomeworkSubmission[];
  mySubmission?: HomeworkSubmission | null;
};

type Props = {
  session: SessionUser | null;
  role: Role;
  studentDirectory: ManagedUser[];
};

const HW_TYPE_ICONS: Record<HomeworkType, string> = {
  homework: "bi-book",
  assignment: "bi-file-text",
  classwork: "bi-easel",
  project: "bi-diagram-3",
  test: "bi-pencil-square",
};

const HW_TYPE_LABELS: Record<HomeworkType, string> = {
  homework: "Homework",
  assignment: "Assignment",
  classwork: "Classwork",
  project: "Project",
  test: "Test",
};

export function HomeworkSection({ session, role, studentDirectory }: Props) {
  const [homework, setHomework] = useState<EnrichedHomework[]>([]);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignSubject, setAssignSubject] = useState("");
  const [assignType, setAssignType] = useState<HomeworkType>("homework");
  const [assignMaxMarks, setAssignMaxMarks] = useState(10);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [assignAllowLate, setAssignAllowLate] = useState(false);
  const [assignBatchId, setAssignBatchId] = useState("");
  const [assignBatchName, setAssignBatchName] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [submitContent, setSubmitContent] = useState("");
  const [submittingId, setSubmittingId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [gradeModal, setGradeModal] = useState<{
    homeworkTitle: string;
    submission: HomeworkSubmission;
  } | null>(null);
  const [gradeMarks, setGradeMarks] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEducator = role === "educator";
  const isStudent = role === "student";

  const educatorBatches = isEducator
    ? [...new Set(studentDirectory.map((s) => s.program).filter(Boolean))]
    : [];

  async function loadHomework() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/homework", { credentials: "same-origin" });
      if (!res.ok) {
        setError("Failed to load homework.");
        return;
      }
      const data = await res.json();
      setHomework(data.homework ?? []);
      if (data.batchIds) setBatchIds(data.batchIds);
    } catch {
      setError("Network error loading homework.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHomework();
  }, []);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTitle.trim() || !assignDueDate || !assignBatchId) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: assignTitle.trim(),
          subject: assignSubject.trim() || undefined,
          description: assignDescription.trim() || undefined,
          hwType: assignType,
          maxMarks: assignMaxMarks,
          dueDate: assignDueDate,
          batchId: assignBatchId,
          batchName: assignBatchName || undefined,
          allowLateSubmission: assignAllowLate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to assign homework.");
        return;
      }
      setShowAssignModal(false);
      resetAssignForm();
      await loadHomework();
    } catch {
      setError("Network error.");
    } finally {
      setAssigning(false);
    }
  }

  function resetAssignForm() {
    setAssignTitle("");
    setAssignSubject("");
    setAssignType("homework");
    setAssignMaxMarks(10);
    setAssignDueDate("");
    setAssignDescription("");
    setAssignAllowLate(false);
    setAssignBatchId("");
    setAssignBatchName("");
  }

  async function handleSubmit(homeworkId: string) {
    if (!submitContent.trim()) return;
    setSubmitting(true);
    setSubmittingId(homeworkId);
    try {
      const res = await fetch("/api/homework/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          homeworkId,
          content: submitContent.trim(),
        }),
      });
      if (!res.ok) return;
      setSubmitContent("");
      setSubmittingId("");
      await loadHomework();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
      setSubmittingId("");
    }
  }

  async function handleGrade() {
    if (!gradeModal || gradeMarks < 0) return;
    setGrading(true);
    try {
      const res = await fetch("/api/homework/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          submissionId: gradeModal.submission.id,
          marks: gradeMarks,
          feedback: gradeFeedback.trim() || undefined,
        }),
      });
      if (!res.ok) return;
      setGradeModal(null);
      setGradeMarks(0);
      setGradeFeedback("");
      await loadHomework();
    } catch {
      // ignore
    } finally {
      setGrading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/homework/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Delete failed.");
        setDeleteConfirmId(null);
        return;
      }
      setDeleteConfirmId(null);
      await loadHomework();
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
    }
  }

  const now = new Date();

  const filtered = homework.filter((hw) => {
    if (search && !hw.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && hw.hwType !== filterType) return false;
    if (filterStatus === "overdue" && new Date(hw.dueDate) >= now) return false;
    if (filterStatus === "upcoming" && new Date(hw.dueDate) < now) return false;
    return true;
  });

  const totalAssigned = homework.length;
  const overdueCount = homework.filter((hw) => new Date(hw.dueDate) < now).length;
  const activeCount = totalAssigned - overdueCount;
  const submissionCount = isEducator
    ? homework.reduce((sum, hw) => sum + (hw.submissions?.length ?? 0), 0)
    : homework.filter((hw) => hw.mySubmission).length;

  const typeCounts = homework.reduce(
    (acc, hw) => {
      acc[hw.hwType] = (acc[hw.hwType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            Homework &amp; Assignments
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {totalAssigned} total · {overdueCount} overdue · {submissionCount} submissions received
          </p>
        </div>
        {isEducator && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            <i className="bi bi-plus-lg" />
            Assign Homework
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total Assigned", value: totalAssigned, icon: "bi-book-fill", color: "var(--color-primary)" },
          { label: "Overdue", value: overdueCount, icon: "bi-clock-history", color: "#EF4444" },
          { label: "Active / Upcoming", value: activeCount, icon: "bi-calendar-check-fill", color: "#10B981" },
          { label: "Total Submissions", value: submissionCount, icon: "bi-send-check-fill", color: "#0EA5E9" },
          { label: "Top Type", value: topType ? HW_TYPE_LABELS[topType as HomeworkType] ?? topType : "—", icon: "bi-pie-chart-fill", color: "#8B5CF6" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4"
          >
            <div className="text-2xl font-black text-[var(--color-heading)]">
              {stat.value}
            </div>
            <div className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
              {stat.label}
            </div>
            <i
              className={`bi ${stat.icon} absolute bottom-2 right-2 text-2xl opacity-10`}
              style={{ color: stat.color }}
            />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Search title, subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          style={{ minWidth: 140 }}
        >
          <option value="">All Types</option>
          {Object.entries(HW_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          style={{ minWidth: 140 }}
        >
          <option value="">All Status</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Active / Upcoming</option>
        </select>
        {filterType || filterStatus || search ? (
          <button
            onClick={() => { setSearch(""); setFilterType(""); setFilterStatus(""); }}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
            <i className="bi bi-book text-3xl text-[var(--color-primary)]/40" />
          </div>
          <p className="text-lg font-bold text-[var(--color-heading)]">
            {isEducator ? "No homework assigned yet" : "No homework assigned"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {isEducator
              ? "Create assignments and track submissions across your batches"
              : "Your instructors haven't assigned any homework yet"}
          </p>
          {isEducator && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              <i className="bi bi-plus-lg" />
              Assign First Homework
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((hw) => {
            const isOverdue = new Date(hw.dueDate) < now;
            const sub = hw.mySubmission;
            const subs = hw.submissions ?? [];
            const gradedSubs = subs.filter((s) => s.status === "graded");
            const ungradedSubs = subs.filter((s) => s.status !== "graded");
            const canDelete = subs.length === 0 || subs.every((s) => s.status === "graded");
            const submission = sub;

            return (
              <div
                key={hw.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 transition hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: "var(--color-primary-3, rgba(79,70,229,0.1))" }}
                    >
                      <i
                        className={`bi ${HW_TYPE_ICONS[hw.hwType] ?? "bi-book"} text-lg`}
                        style={{ color: "var(--color-primary)" }}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--color-heading)]">
                        {hw.title}
                      </h3>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                        {hw.subject ? <span>{hw.subject}</span> : null}
                        {hw.batchName ? <span>· {hw.batchName}</span> : null}
                        <span>· {HW_TYPE_LABELS[hw.hwType] ?? hw.hwType}</span>
                        <span>· Max {hw.maxMarks} marks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        isOverdue
                          ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      }`}
                    >
                      <i className={`bi ${isOverdue ? "bi-exclamation-circle" : "bi-check-circle"}`} />
                      {isOverdue ? "Overdue" : "Active"}
                    </span>
                    <span className="whitespace-nowrap text-xs text-[var(--color-muted)]">
                      Due {new Date(hw.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {hw.description ? (
                  <p className="mt-2 text-sm text-[var(--color-muted)] line-clamp-2">
                    {hw.description}
                  </p>
                ) : null}

                {/* Student submission area */}
                {isStudent && (
                  <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                    {submission ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            submission.status === "graded"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                          }`}
                        >
                          <i className={`bi ${submission.status === "graded" ? "bi-check-circle-fill" : "bi-hourglass-split"}`} />
                          {submission.status === "graded" ? `Graded: ${submission.marks}/${hw.maxMarks}` : "Submitted (pending grade)"}
                        </span>
                        {submission.feedback ? (
                          <span className="text-xs text-[var(--color-muted)]">
                            Feedback: {submission.feedback}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Your answer / submission text…"
                          value={submittingId === hw.id ? submitContent : ""}
                          onChange={(e) => {
                            setSubmitContent(e.target.value);
                            setSubmittingId(hw.id);
                          }}
                          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <button
                          onClick={() => {
                            setSubmitContent(
                              submittingId === hw.id ? submitContent : "",
                            );
                            setSubmittingId(hw.id);
                            handleSubmit(hw.id);
                          }}
                          disabled={submitting && submittingId === hw.id}
                          className="inline-flex items-center gap-1 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {submitting && submittingId === hw.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <i className="bi bi-send-fill" />
                          )}
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Educator: submissions summary */}
                {isEducator && subs.length > 0 && (
                  <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--color-muted)]">
                        {gradedSubs.length}/{subs.length} graded
                      </span>
                      {ungradedSubs.length > 0 && (
                        <button
                          onClick={() => {
                            const firstUngraded = ungradedSubs[0];
                            setGradeModal({
                              homeworkTitle: hw.title,
                              submission: firstUngraded,
                            });
                            setGradeMarks(firstUngraded.marks ?? 0);
                            setGradeFeedback(firstUngraded.feedback ?? "");
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                        >
                          <i className="bi bi-pencil-fill" />
                          Grade ({ungradedSubs.length})
                        </button>
                      )}
                      <span className="text-xs text-[var(--color-muted)]">
                          Avg:{" "}
                          {gradedSubs.length > 0
                            ? (
                                gradedSubs.reduce(
                                  (sum, s) => sum + (s.marks ?? 0),
                                  0,
                                ) / gradedSubs.length
                              ).toFixed(1)
                            : "—"}
                          /{hw.maxMarks}
                      </span>
                    </div>
                    {/* submission list */}
                    <div className="mt-2 space-y-1">
                      {subs.slice(0, 5).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg bg-[var(--color-card)] px-3 py-1.5 text-xs"
                        >
                          <span className="font-medium text-[var(--color-heading)]">
                            {s.studentName}
                          </span>
                          <div className="flex items-center gap-2">
                            {s.status === "graded" ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {s.marks}/{hw.maxMarks}
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setGradeModal({
                                    homeworkTitle: hw.title,
                                    submission: s,
                                  });
                                  setGradeMarks(s.marks ?? 0);
                                  setGradeFeedback(s.feedback ?? "");
                                }}
                                className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                              >
                                Grade
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {subs.length > 5 ? (
                        <p className="text-xs text-[var(--color-muted)]">+{subs.length - 5} more</p>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Educator: actions */}
                {isEducator && (
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-3">
                    <button
                      onClick={() => {
                        setDeleteConfirmId(hw.id);
                      }}
                      disabled={!canDelete}
                      className="inline-flex items-center gap-1 rounded-full border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/10 disabled:opacity-40"
                      title={
                        !canDelete
                          ? "Grade all submissions before deleting"
                          : "Delete homework"
                      }
                    >
                      <i className="bi bi-trash3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
            <div
              className="flex-shrink-0 rounded-t-[1.5rem] px-6 py-5 text-white"
              style={{
                background: "linear-gradient(135deg,#1E1B4B,var(--color-primary),#6D28D9)",
              }}
            >
              <h3 className="text-lg font-black">
                <i className="bi bi-plus-circle-fill me-2" />
                Assign New Homework
              </h3>
              <p className="mt-1 text-sm text-white/65">
                Create an assignment and notify students instantly
              </p>
            </div>
            <form
              onSubmit={handleAssign}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={assignTitle}
                      onChange={(e) => setAssignTitle(e.target.value)}
                      placeholder="e.g. Laws of Motion Practice Problems"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                      Batch <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={assignBatchId}
                      onChange={(e) => {
                        const batchId = e.target.value;
                        setAssignBatchId(batchId);
                        const match = educatorBatches.find((b) => b === batchId);
                        setAssignBatchName(match ?? "");
                      }}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">— Select Batch —</option>
                      {educatorBatches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={assignSubject}
                      onChange={(e) => setAssignSubject(e.target.value)}
                      placeholder="e.g. Physics"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                      Type
                    </label>
                    <select
                      value={assignType}
                      onChange={(e) =>
                        setAssignType(e.target.value as HomeworkType)
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      {Object.entries(HW_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                      Max Marks
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={assignMaxMarks}
                      onChange={(e) =>
                        setAssignMaxMarks(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={assignDescription}
                      onChange={(e) => setAssignDescription(e.target.value)}
                      placeholder="Describe the homework in detail…"
                      className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-heading)]">
                      <input
                        type="checkbox"
                        checked={assignAllowLate}
                        onChange={(e) => setAssignAllowLate(e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      Allow Late Submissions
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 border-t border-[var(--color-border)] px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      resetAssignForm();
                    }}
                    className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {assigning ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <i className="bi bi-check-circle-fill" />
                    )}
                    Assign Homework
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Grade Modal */}
      {gradeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
            <h3 className="text-lg font-black text-[var(--color-heading)]">
              Grade Submission
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {gradeModal.homeworkTitle} — {gradeModal.submission.studentName}
            </p>
            {gradeModal.submission.content ? (
              <div className="mt-3 rounded-xl bg-[var(--color-panel)] p-3 text-sm text-[var(--color-muted)]">
                {gradeModal.submission.content}
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                  Marks
                </label>
                <input
                  type="number"
                  min={0}
                  value={gradeMarks}
                  onChange={(e) =>
                    setGradeMarks(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-heading)]">
                  Feedback
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Optional feedback…"
                  className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setGradeModal(null);
                  setGradeMarks(0);
                  setGradeFeedback("");
                }}
                className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
              >
                Cancel
              </button>
              <button
                onClick={handleGrade}
                disabled={grading}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {grading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <i className="bi bi-check-circle-fill" />
                )}
                Save Grade
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirm Modal */}
      {deleteConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
            <h3 className="text-lg font-black text-[var(--color-heading)]">
              Delete homework?
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              All graded submissions will be permanently removed. This action
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <i className="bi bi-trash3-fill" />
                )}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
