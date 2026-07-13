"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  PlayCircle,
  Award,
  Plus,
  Search,
  Trash2,
  Send,
  X,
  ListChecks,
  Target,
  ClipboardList,
  AlignLeft,
  Hourglass,
  MessageSquareText,
} from "lucide-react";

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
  onDashboardRefresh?: () => void;
};

const HW_TYPE_LABELS: Record<HomeworkType, string> = {
  homework: "Homework",
  assignment: "Assignment",
  classwork: "Classwork",
  project: "Project",
  test: "Test",
};

const HW_TYPE_COLORS: Record<string, string> = {
  homework: "#4F46E5",
  assignment: "#059669",
  classwork: "#D97706",
  project: "#6D28D9",
  test: "#DC2626",
};

export function HomeworkSection({
  role,
  studentDirectory,
  onDashboardRefresh,
}: Props) {
  const [homework, setHomework] = useState<EnrichedHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [showAssign, setShowAssign] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignSubject, setAssignSubject] = useState("");
  const [assignType, setAssignType] = useState<HomeworkType>("homework");
  const [assignMaxMarks, setAssignMaxMarks] = useState(10);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [assignObjective, setAssignObjective] = useState("");
  const [assignKeySteps, setAssignKeySteps] = useState("");
  const [assignDeliverables, setAssignDeliverables] = useState("");
  const [assignCriteria, setAssignCriteria] = useState("");
  const [assignHours, setAssignHours] = useState("");
  const [assignTaskNum, setAssignTaskNum] = useState("");
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

  const isEducator = role === "educator" || role === "admin";
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
      const keyStepsArr = assignKeySteps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: assignTitle.trim(),
          subject: assignSubject.trim() || undefined,
          description: assignDescription.trim() || undefined,
          objective: assignObjective.trim() || undefined,
          keySteps: keyStepsArr.length > 0 ? keyStepsArr : undefined,
          deliverables: assignDeliverables.trim() || undefined,
          evaluationCriteria: assignCriteria.trim() || undefined,
          estimatedHours: assignHours ? Number(assignHours) : undefined,
          taskNumber: assignTaskNum ? Number(assignTaskNum) : undefined,
          hwType: assignType,
          maxMarks: assignMaxMarks,
          dueDate: assignDueDate,
          batchId: assignBatchId,
          batchName: assignBatchName || undefined,
          allowLateSubmission: assignAllowLate,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed.");
        return;
      }
      setShowAssign(false);
      resetForm();
      await loadHomework();
      onDashboardRefresh?.();
    } catch {
      setError("Network error.");
    } finally {
      setAssigning(false);
    }
  }

  function resetForm() {
    setAssignTitle("");
    setAssignSubject("");
    setAssignType("homework");
    setAssignMaxMarks(10);
    setAssignDueDate("");
    setAssignDescription("");
    setAssignObjective("");
    setAssignKeySteps("");
    setAssignDeliverables("");
    setAssignCriteria("");
    setAssignHours("");
    setAssignTaskNum("");
    setAssignAllowLate(false);
    setAssignBatchId("");
    setAssignBatchName("");
  }

  async function handleSubmit(hwId: string) {
    if (!submitContent.trim()) return;
    setSubmitting(true);
    setSubmittingId(hwId);
    try {
      const res = await fetch("/api/homework/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          homeworkId: hwId,
          content: submitContent.trim(),
        }),
      });
      if (!res.ok) return;
      setSubmitContent("");
      setSubmittingId("");
      await loadHomework();
    } catch {
      /* ignore */
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
      /* ignore */
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
        const d = await res.json();
        setError(d.error ?? "Delete failed.");
        setDeleteConfirmId(null);
        return;
      }
      setDeleteConfirmId(null);
      await loadHomework();
      onDashboardRefresh?.();
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
    }
  }

  const subjectOptions = [
    ...new Set(
      homework
        .map((item) => item.subject?.trim())
        .filter((subject): subject is string => Boolean(subject)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const filtered = homework.filter((hw) => {
    if (search && !hw.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterType && hw.hwType !== filterType) return false;
    if (filterSubject && hw.subject?.trim() !== filterSubject) {
      return false;
    }
    return true;
  });

  const totalAssigned = homework.length;

  const today = new Date();

  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const overdueCount = homework.filter((hw) => hw.dueDate < todayDate).length;
  const activeCount = totalAssigned - overdueCount;
  const submissionCount = isEducator
    ? homework.reduce((sum, hw) => sum + (hw.submissions?.length ?? 0), 0)
    : homework.filter((hw) => hw.mySubmission).length;

  function HWTypeBadge({ hwType }: { hwType: string }) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
        style={{
          background: `${HW_TYPE_COLORS[hwType] ?? "#64748B"}14`,
          color: HW_TYPE_COLORS[hwType] ?? "#64748B",
          border: `1px solid ${HW_TYPE_COLORS[hwType] ?? "#64748B"}30`,
        }}
      >
        {HW_TYPE_LABELS[hwType as HomeworkType] ?? hwType}
      </span>
    );
  }

  function StatCard({
    label,
    value,
    icon,
    color,
  }: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
  }) {
    return (
      <div className="bg-white rounded-xl border border-[#E8EDF2] p-4 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}14` }}
          >
            {icon}
          </div>
          <div>
            <p className="text-xl font-black text-[var(--color-heading)]">
              {value}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-400">
              {label}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="section-label">Homework & Assignments</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            {isEducator ? "Task Management" : "My Tasks"}
          </h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {isEducator
              ? "Create structured weekly tasks, track submissions, and grade work"
              : "Complete and submit your weekly assignments"}
          </p>
        </div>
        {isEducator && (
          <button
            onClick={() => setShowAssign(true)}
            className="btn-action btn-md font-bold"
          >
            <Plus size={15} className="mr-2" />
            Create Task
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm font-semibold text-red-700">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Total Tasks"
          value={totalAssigned}
          icon={<BookOpen size={18} style={{ color: "#4F46E5" }} />}
          color="#4F46E5"
        />

        <StatCard
          label="Submitted"
          value={activeCount}
          icon={<CheckCircle2 size={18} style={{ color: "#10B981" }} />}
          color="#10B981"
        />

        <StatCard
          label="Pending"
          value={overdueCount}
          icon={<Hourglass size={18} style={{ color: "#F59E0B" }} />}
          color="#F59E0B"
        />

        <StatCard
          label="Teacher Feedback"
          value={submissionCount}
          icon={<MessageSquareText size={18} style={{ color: "#0EA5E9" }} />}
          color="#0EA5E9"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="surface-soft rounded-[1.75rem] p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-9 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none min-w-[130px]"
          >
            <option value="">All Types</option>
            {Object.entries(HW_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={filterSubject}
            onChange={(event) => setFilterSubject(event.target.value)}
            className="min-w-[150px] rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="">All Subjects</option>

            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {(search || filterType || filterSubject) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterType("");
                setFilterSubject("");
              }}
              className="btn-surface btn-sm font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Loading / Empty / List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 surface-soft rounded-[1.75rem]">
          <div className="w-20 h-20 bg-[var(--primary-3)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={36} style={{ color: "var(--primary)" }} />
          </div>
          <h5 className="text-lg font-bold mb-2 text-[var(--color-heading)]">
            {isEducator ? "No tasks created yet" : "No tasks assigned"}
          </h5>
          <p className="text-sm text-[var(--color-muted)] mb-4 max-w-md mx-auto">
            {isEducator
              ? "Create structured assignments with objectives, key steps, and evaluation criteria"
              : "Your instructors haven't assigned any tasks yet"}
          </p>
          {isEducator && (
            <button
              onClick={() => setShowAssign(true)}
              className="btn-action btn-md font-bold"
            >
              <Plus size={15} className="mr-2" />
              Create First Task
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((hw) => {
            const isOverdue = hw.dueDate < todayDate;
            const subs = hw.submissions ?? [];
            const gradedSubs = subs.filter((s) => s.status === "graded");
            const ungradedSubs = subs.filter((s) => s.status !== "graded");
            const canDelete = true;
            const submission = hw.mySubmission;

            return (
              <div key={hw.id} className="exam-card p-0">
                {/* Card Header */}
                <div
                  className="exam-card-header flex items-center justify-between"
                  style={{
                    background: isOverdue ? "#FEF2F2" : "#F8FAFC",
                    padding: "16px 20px 12px",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {hw.taskNumber && (
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-[var(--color-border)] text-sm font-black text-[var(--color-heading)] shrink-0">
                        {hw.taskNumber}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[var(--color-heading)] truncate">
                        {hw.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <HWTypeBadge hwType={hw.hwType} />
                        {hw.subject && (
                          <span className="text-xs text-slate-500">
                            {hw.subject}
                          </span>
                        )}
                        {hw.batchName && (
                          <span className="text-xs text-slate-400">
                            · {hw.batchName}
                          </span>
                        )}
                        {hw.estimatedHours && (
                          <span className="text-xs text-slate-400">
                            · {hw.estimatedHours}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        isOverdue
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isOverdue ? (
                        <AlertCircle size={10} />
                      ) : (
                        <CheckCircle2 size={10} />
                      )}
                      {isOverdue ? "Overdue" : "Active"}
                    </span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      Due{" "}
                      {new Date(hw.dueDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {hw.objective && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                        <Target size={11} /> Objective
                      </p>
                      <p className="text-sm text-[var(--color-heading)]">
                        {hw.objective}
                      </p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    {hw.keySteps && hw.keySteps.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                          <ListChecks size={11} /> Key Steps
                        </p>
                        <ol className="list-decimal list-inside text-sm text-[var(--color-muted)] space-y-0.5">
                          {hw.keySteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <div className="space-y-2">
                      {hw.deliverables && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 flex items-center gap-1">
                            <ClipboardList size={11} /> Deliverables
                          </p>
                          <p className="text-sm text-[var(--color-muted)]">
                            {hw.deliverables}
                          </p>
                        </div>
                      )}
                      {hw.evaluationCriteria && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5 flex items-center gap-1">
                            <Award size={11} /> Evaluation Criteria
                          </p>
                          <p className="text-sm text-[var(--color-muted)]">
                            {hw.evaluationCriteria}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {hw.description && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                        <AlignLeft size={11} /> Description
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {hw.description}
                      </p>
                    </div>
                  )}

                  {/* Meta chips */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="meta-chip">
                      <Award size={11} /> Max {hw.maxMarks} marks
                    </span>
                    {hw.estimatedHours && (
                      <span className="meta-chip">
                        <Hourglass size={11} /> ~{hw.estimatedHours}h
                      </span>
                    )}
                    {subs.length > 0 && (
                      <span className="meta-chip">
                        <Users size={11} /> {gradedSubs.length}/{subs.length}{" "}
                        graded
                      </span>
                    )}
                  </div>

                  {/* Student: submission area */}
                  {isStudent && (
                    <div className="border-t border-[var(--color-border)] pt-3">
                      {submission ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                              submission.status === "graded"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {submission.status === "graded" ? (
                              <>
                                <CheckCircle2 size={11} /> Graded:{" "}
                                {submission.marks}/{hw.maxMarks}
                              </>
                            ) : (
                              <>
                                <Hourglass size={11} /> Submitted (pending
                                grade)
                              </>
                            )}
                          </span>
                          {submission.feedback && (
                            <span className="text-xs text-[var(--color-muted)]">
                              Feedback: {submission.feedback}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Your submission text..."
                            value={submittingId === hw.id ? submitContent : ""}
                            onChange={(e) => {
                              setSubmitContent(e.target.value);
                              setSubmittingId(hw.id);
                            }}
                            className="flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
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
                            className="btn-action btn-sm font-bold"
                          >
                            {submitting && submittingId === hw.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Send size={13} className="mr-1" />
                            )}
                            Submit
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Educator: submissions */}
                  {isEducator && subs.length > 0 && (
                    <div className="border-t border-[var(--color-border)] pt-3 space-y-2">
                      {ungradedSubs.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-amber-600">
                            {ungradedSubs.length} pending review
                          </span>
                          <button
                            onClick={() => {
                              const s = ungradedSubs[0];
                              setGradeModal({
                                homeworkTitle: hw.title,
                                submission: s,
                              });
                              setGradeMarks(s.marks ?? 0);
                              setGradeFeedback(s.feedback ?? "");
                            }}
                            className="btn-surface btn-sm font-bold text-xs"
                          >
                            Grade All
                          </button>
                        </div>
                      )}
                      {subs.slice(0, 5).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl bg-[#F8FAFC] border border-[#E8EDF2] px-4 py-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {s.studentName.charAt(0)}
                            </div>
                            <span className="text-sm font-semibold text-[var(--color-heading)] truncate">
                              {s.studentName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {s.status === "graded" ? (
                              <span className="text-sm font-bold text-emerald-600">
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
                                className="btn-action btn-sm font-bold text-xs"
                              >
                                Grade
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {subs.length > 5 && (
                        <p className="text-xs text-slate-400 text-center">
                          +{subs.length - 5} more submissions
                        </p>
                      )}
                    </div>
                  )}

                  {/* Educator: actions */}
                  {isEducator && (
                    <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
                      {deleteConfirmId === hw.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-red-600">
                            Delete this task?
                          </span>
                          <button
                            onClick={() => handleDelete(hw.id)}
                            disabled={deleting}
                            className="btn-action btn-sm font-bold text-xs bg-red-600 hover:bg-red-700"
                          >
                            {deleting ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="btn-surface btn-sm font-bold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(hw.id)}
                          disabled={!canDelete}
                          className="btn-surface btn-sm font-bold text-xs text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-40"
                          title={
                            !canDelete
                              ? "Grade all submissions first"
                              : "Delete"
                          }
                        >
                          <Trash2 size={12} className="mr-1" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Assign Modal ── */}
      {showAssign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowAssign(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--color-heading)]">
                Create Task
              </h3>
              <button
                onClick={() => setShowAssign(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Title *
                  </label>
                  <input
                    value={assignTitle}
                    onChange={(e) =>
                      setAssignTitle(e.target.value.slice(0, 120))
                    }
                    placeholder="e.g. Week 1: Strategic Communication Roadmap"
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Type
                  </label>
                  <select
                    value={assignType}
                    onChange={(e) =>
                      setAssignType(e.target.value as HomeworkType)
                    }
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
                  >
                    {Object.entries(HW_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Batch *
                  </label>
                  <select
                    value={assignBatchId}
                    onChange={(e) => {
                      const idx = e.target.selectedIndex;
                      const name = e.target.options[idx]?.text ?? "";
                      setAssignBatchId(e.target.value);
                      setAssignBatchName(name);
                    }}
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Select batch</option>
                    {educatorBatches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Subject
                  </label>
                  <input
                    value={assignSubject}
                    onChange={(e) =>
                      setAssignSubject(e.target.value.slice(0, 60))
                    }
                    placeholder="e.g. English Communication"
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Task/Week #
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={assignTaskNum}
                    onChange={(e) => setAssignTaskNum(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={assignMaxMarks}
                    onChange={(e) =>
                      setAssignMaxMarks(
                        Math.max(
                          1,
                          Math.min(1000, Number(e.target.value) || 10),
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={assignHours}
                    onChange={(e) => setAssignHours(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Objective
                </label>
                <textarea
                  value={assignObjective}
                  onChange={(e) =>
                    setAssignObjective(e.target.value.slice(0, 2000))
                  }
                  placeholder="The aim of this task is to..."
                  rows={2}
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Key Steps (one per line)
                </label>
                <textarea
                  value={assignKeySteps}
                  onChange={(e) =>
                    setAssignKeySteps(e.target.value.slice(0, 2000))
                  }
                  placeholder="Step 1: Research...
Step 2: Outline...
Step 3: Write..."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Deliverables
                  </label>
                  <textarea
                    value={assignDeliverables}
                    onChange={(e) =>
                      setAssignDeliverables(e.target.value.slice(0, 2000))
                    }
                    placeholder="Submit a DOC file containing..."
                    rows={2}
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Evaluation Criteria
                  </label>
                  <textarea
                    value={assignCriteria}
                    onChange={(e) =>
                      setAssignCriteria(e.target.value.slice(0, 2000))
                    }
                    placeholder="Depth of research...
Clarity of presentation..."
                    rows={2}
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Full Description
                </label>
                <textarea
                  value={assignDescription}
                  onChange={(e) =>
                    setAssignDescription(e.target.value.slice(0, 5000))
                  }
                  placeholder="Detailed task description..."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--color-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignAllowLate}
                  onChange={(e) => setAssignAllowLate(e.target.checked)}
                  className="rounded"
                />
                Allow late submissions
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={assigning}
                  className="btn-action btn-md font-bold flex-1"
                >
                  {assigning ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus size={15} className="mr-2" />
                      Create Task
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssign(false)}
                  className="btn-surface btn-md font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Grade Modal ── */}
      {gradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setGradeModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--color-heading)] mb-1">
              Grade Submission
            </h3>
            <p className="text-sm text-[var(--color-muted)] mb-4">
              {gradeModal.homeworkTitle} — {gradeModal.submission.studentName}
            </p>

            {gradeModal.submission.content && (
              <div className="surface-soft rounded-xl p-3 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Student Response
                </p>
                <p className="text-sm text-[var(--color-heading)]">
                  {gradeModal.submission.content}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Marks
                </label>
                <input
                  type="number"
                  min={0}
                  value={gradeMarks}
                  onChange={(e) =>
                    setGradeMarks(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Feedback
                </label>
                <textarea
                  value={gradeFeedback}
                  onChange={(e) =>
                    setGradeFeedback(e.target.value.slice(0, 500))
                  }
                  placeholder="Feedback for the student..."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleGrade}
                disabled={grading}
                className="btn-action btn-md font-bold flex-1"
              >
                {grading ? (
                  "Saving..."
                ) : (
                  <>
                    <Award size={14} className="mr-2" />
                    Save Grade
                  </>
                )}
              </button>
              <button
                onClick={() => setGradeModal(null)}
                className="btn-surface btn-md font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Embedded Styles ── */}
      <style>{`
        .exam-card {
          border-radius: 14px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          transition: box-shadow .2s, transform .2s;
        }
        .exam-card:hover {
          box-shadow: 0 8px 28px rgba(79,70,229,.10);
          transform: translateY(-2px);
        }
        .exam-card-header {
          border-radius: 14px 14px 0 0;
        }
        .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-muted);
          font-weight: 500;
        }
      `}</style>
    </section>
  );
}
