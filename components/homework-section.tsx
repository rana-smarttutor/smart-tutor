"use client";

import { useEffect, useState } from "react";
import {
  AlignLeft,
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  FileUp,
  Hourglass,
  ListChecks,
  Loader2,
  MessageSquareText,
  Paperclip,
  Plus,
  Search,
  Send,
  Target,
  Trash2,
  UploadCloud,
  Users,
  X,
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
  studentDirectory: _studentDirectory,
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
  const [assigning, setAssigning] = useState(false);

  const [submitContent, setSubmitContent] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submittingId, setSubmittingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

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
    if (!assignTitle.trim() || !assignDueDate) return;
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
  }

  function handleSubmissionFile(
    homeworkId: string,
    file: File | null,
  ) {
    if (!file) {
      setSubmitFile(null);
      return;
    }

    const allowedExtensions =
      /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|png|jpg|jpeg|webp|txt)$/i;

    if (!allowedExtensions.test(file.name)) {
      setError(
        "Upload a PDF, Word, PowerPoint, Excel, image, or text file.",
      );
      setSubmitFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The homework file must be 10 MB or smaller.");
      setSubmitFile(null);
      return;
    }

    setError("");
    setSubmittingId(homeworkId);
    setSubmitFile(file);
  }

  async function uploadSubmissionFile(file: File) {
    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/homework/submissions/upload",
        {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        },
      );

      const payload = (await response.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.url) {
        throw new Error(payload.error ?? "Unable to upload homework file.");
      }

      return payload.url;
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit(hwId: string) {
    const content = submittingId === hwId ? submitContent.trim() : "";
    const file = submittingId === hwId ? submitFile : null;

    if (!content && !file) {
      setError("Write a short note or choose a file before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmittingId(hwId);
    setError("");

    try {
      const attachmentUrl = file
        ? await uploadSubmissionFile(file)
        : undefined;

      const res = await fetch("/api/homework/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          homeworkId: hwId,
          content: content || undefined,
          attachmentUrl,
        }),
      });

      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(payload.error ?? "Unable to submit homework.");
      }

      setSubmitContent("");
      setSubmitFile(null);
      await loadHomework();
      onDashboardRefresh?.();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit homework.",
      );
    } finally {
      setSubmitting(false);
      setUploadingFile(false);
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

  const submissionCount = isEducator
    ? homework.reduce((sum, hw) => sum + (hw.submissions?.length ?? 0), 0)
    : homework.filter((hw) => Boolean(hw.mySubmission)).length;

  const pendingCount = isEducator
    ? homework.reduce(
        (sum, hw) =>
          sum +
          (hw.submissions?.filter(
            (submission) => submission.status !== "graded",
          ).length ?? 0),
        0,
      )
    : homework.filter((hw) => !hw.mySubmission).length;

  const feedbackCount = isEducator
    ? homework.reduce(
        (sum, hw) =>
          sum +
          (hw.submissions?.filter(
            (submission) => submission.status === "graded",
          ).length ?? 0),
        0,
      )
    : homework.filter(
        (hw) =>
          hw.mySubmission?.status === "graded" &&
          Boolean(hw.mySubmission.feedback?.trim()),
      ).length;

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
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Total Tasks"
          value={totalAssigned}
          icon={<BookOpen size={18} style={{ color: "#4F46E5" }} />}
          color="#4F46E5"
        />

        <StatCard
          label="Submitted"
          value={submissionCount}
          icon={<CheckCircle2 size={18} style={{ color: "#10B981" }} />}
          color="#10B981"
        />

        <StatCard
          label={isEducator ? "Pending Review" : "Pending"}
          value={pendingCount}
          icon={<Hourglass size={18} style={{ color: "#F59E0B" }} />}
          color="#F59E0B"
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
          {filtered.map((hw, index) => {
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
                    <span className="inline-flex min-w-[88px] shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#0B40A1] shadow-sm">
                      {hw.hwType === "assignment" ? "Assignment" : "Task"}{" "}
                      {hw.taskNumber ?? index + 1}
                    </span>
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
                    <div className="border-t border-[var(--color-border)] pt-4">
                      {submission ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                                submission.status === "graded"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {submission.status === "graded" ? (
                                <>
                                  <CheckCircle2 size={12} /> Checked by teacher
                                </>
                              ) : (
                                <>
                                  <Hourglass size={12} /> Submitted for review
                                </>
                              )}
                            </span>

                            {submission.status === "graded" ? (
                              <span className="text-sm font-black text-emerald-700">
                                {submission.marks ?? 0}/{hw.maxMarks} marks
                              </span>
                            ) : null}
                          </div>

                          {(submission.content || submission.attachmentUrl) && (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                Your Submission
                              </p>

                              {submission.content ? (
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                  {submission.content}
                                </p>
                              ) : null}

                              {submission.attachmentUrl ? (
                                <a
                                  href={submission.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-[#0B40A1] transition hover:bg-blue-50"
                                >
                                  <Paperclip size={14} />
                                  Open uploaded homework
                                  <ExternalLink size={13} />
                                </a>
                              ) : null}
                            </div>
                          )}

                          {submission.status === "graded" ? (
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                              <div className="flex items-center gap-2 text-[#0B40A1]">
                                <MessageSquareText size={16} />
                                <p className="text-xs font-black uppercase tracking-[0.12em]">
                                  Teacher&apos;s Feedback
                                </p>
                              </div>

                              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                                {submission.feedback?.trim() ||
                                  "Your teacher checked this task but did not add written feedback."}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-slate-500">
                              Your teacher will review the file and publish marks and feedback here.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0B40A1] shadow-sm">
                              <UploadCloud size={19} />
                            </div>

                            <div>
                              <p className="text-sm font-black text-slate-800">
                                Upload your completed work
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Add an optional note and upload one file up to 10 MB.
                              </p>
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            placeholder="Write a note for your teacher (optional)..."
                            value={submittingId === hw.id ? submitContent : ""}
                            onChange={(event) => {
                              setSubmitContent(event.target.value.slice(0, 1000));
                              setSubmittingId(hw.id);
                              if (submittingId !== hw.id) {
                                setSubmitFile(null);
                              }
                            }}
                            className="mt-4 w-full resize-y rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
                          />

                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-black text-[#0B40A1] transition hover:bg-blue-50">
                              <FileUp size={15} />
                              {submittingId === hw.id && submitFile
                                ? "Change File"
                                : "Choose File"}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                                className="hidden"
                                onChange={(event) =>
                                  handleSubmissionFile(
                                    hw.id,
                                    event.target.files?.[0] ?? null,
                                  )
                                }
                              />
                            </label>

                            {submittingId === hw.id && submitFile ? (
                              <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                                <Paperclip size={14} className="shrink-0 text-blue-500" />
                                <span className="max-w-[220px] truncate">
                                  {submitFile.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSubmitFile(null)}
                                  className="shrink-0 text-slate-400 transition hover:text-red-500"
                                  aria-label="Remove selected file"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => void handleSubmit(hw.id)}
                              disabled={
                                submitting && submittingId === hw.id
                              }
                              className="btn-action btn-md inline-flex items-center justify-center font-bold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {submitting && submittingId === hw.id ? (
                                <>
                                  <Loader2 size={15} className="mr-2 animate-spin" />
                                  {uploadingFile ? "Uploading..." : "Submitting..."}
                                </>
                              ) : (
                                <>
                                  <Send size={14} className="mr-2" />
                                  Submit Task
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Educator: submissions */}
                  {isEducator && subs.length > 0 && (
                    <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            Student Submissions
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {ungradedSubs.length} waiting for review · {gradedSubs.length} checked
                          </p>
                        </div>

                        {ungradedSubs.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const submissionToReview = ungradedSubs[0];
                              setGradeModal({
                                homeworkTitle: hw.title,
                                submission: submissionToReview,
                              });
                              setGradeMarks(submissionToReview.marks ?? 0);
                              setGradeFeedback(submissionToReview.feedback ?? "");
                            }}
                            className="btn-surface btn-sm font-bold text-xs"
                          >
                            Review Next
                          </button>
                        ) : null}
                      </div>

                      {subs.slice(0, 5).map((submissionItem) => (
                        <article
                          key={submissionItem.id}
                          className="rounded-2xl border border-[#E8EDF2] bg-[#F8FAFC] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-600">
                                {submissionItem.studentName.charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-[var(--color-heading)]">
                                  {submissionItem.studentName}
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  Submitted {new Date(submissionItem.submittedAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>

                                {submissionItem.content ? (
                                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                                    {submissionItem.content}
                                  </p>
                                ) : null}

                                {submissionItem.attachmentUrl ? (
                                  <a
                                    href={submissionItem.attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-[#0B40A1] hover:underline"
                                  >
                                    <Paperclip size={13} />
                                    Open submitted file
                                    <ExternalLink size={12} />
                                  </a>
                                ) : null}

                                {submissionItem.status === "graded" && submissionItem.feedback ? (
                                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-700">
                                    <span className="font-black text-[#0B40A1]">Feedback: </span>
                                    {submissionItem.feedback}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {submissionItem.status === "graded" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                  <FileCheck2 size={13} />
                                  {submissionItem.marks ?? 0}/{hw.maxMarks}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGradeModal({
                                      homeworkTitle: hw.title,
                                      submission: submissionItem,
                                    });
                                    setGradeMarks(submissionItem.marks ?? 0);
                                    setGradeFeedback(submissionItem.feedback ?? "");
                                  }}
                                  className="btn-action btn-sm font-bold text-xs"
                                >
                                  Check &amp; Give Feedback
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}

                      {subs.length > 5 ? (
                        <p className="text-center text-xs text-slate-400">
                          +{subs.length - 5} more submissions
                        </p>
                      ) : null}
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
              Check Homework & Give Feedback
            </h3>
            <p className="text-sm text-[var(--color-muted)] mb-4">
              {gradeModal.homeworkTitle} — {gradeModal.submission.studentName}
            </p>

            {gradeModal.submission.content && (
              <div className="surface-soft rounded-xl p-3 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Student Response
                </p>
                <p className="whitespace-pre-wrap text-sm text-[var(--color-heading)]">
                  {gradeModal.submission.content}
                </p>
              </div>
            )}

            {gradeModal.submission.attachmentUrl ? (
              <a
                href={gradeModal.submission.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-[#0B40A1] transition hover:bg-blue-100"
              >
                <span className="flex items-center gap-2">
                  <Paperclip size={15} />
                  Open student&apos;s uploaded file
                </span>
                <ExternalLink size={14} />
              </a>
            ) : null}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Marks Awarded
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
                  Teacher&apos;s Feedback
                </label>
                <textarea
                  value={gradeFeedback}
                  onChange={(e) =>
                    setGradeFeedback(e.target.value.slice(0, 500))
                  }
                  placeholder="Write clear feedback for the student..."
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
                    Publish Marks & Feedback
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
