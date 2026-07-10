"use client";

import { useMemo, useState } from "react";
import { FileText, Plus, Archive, Send, BookOpen, CheckCircle, Clock, AlertCircle } from "lucide-react";

import type { ManagedUser, MessageItem, Role, SessionUser, TestItem, TestSubmission } from "@/lib/types";

type DashboardExamManagerProps = {
  session: SessionUser | null;
  role: Role;
  initialTests: TestItem[];
  submissions: TestSubmission[];
  studentDirectory: ManagedUser[];
  onSubmissionsChange: (submissions: TestSubmission[]) => void;
  onMessagePublished: (message: MessageItem) => void;
  onDashboardRefresh?: () => void;
};

type DraftQuestion = {
  id: string;
  prompt: string;
  options: string[];
  optionCount: 2 | 4;
};

function createQuestion(index: number, optionCount: 2 | 4 = 4): DraftQuestion {
  return {
    id: `draft-question-${index + 1}`,
    prompt: "",
    options: ["", "", "", ""],
    optionCount,
  };
}

function getExamStatus(test: TestItem): "live" | "upcoming" | "draft" | "completed" {
  if (test.status === "Assigned") return "live";
  if (test.status === "Draft") return "draft";
  if (test.status === "Completed" || test.status === "Graded") return "completed";
  return "draft";
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "live": return "status-badge-live";
    case "upcoming": return "status-badge-upcoming";
    case "draft": return "status-badge-draft";
    case "completed": return "status-badge-completed";
    default: return "status-badge-draft";
  }
}

export function DashboardExamManager({
  session,
  role,
  initialTests,
  submissions,
  studentDirectory,
  onSubmissionsChange,
  onMessagePublished,
  onDashboardRefresh,
}: DashboardExamManagerProps) {
  const [tests, setTests] = useState(initialTests);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [questions, setQuestions] = useState<DraftQuestion[]>([createQuestion(0, 4)]);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const assignedTests = useMemo(() => {
    if (role !== "student" || !session) return [];
    return tests.filter((item) => item.assignedUserIds?.includes(session.id));
  }, [role, session, tests]);

  const activeTest = tests.find((item) => item.id === activeTestId) ?? null;
  const pendingSubmissions = submissions.filter((item) => item.status === "submitted");
  const gradingSubmission = submissions.find((item) => item.id === gradingSubmissionId) ?? null;
  const gradingTest = tests.find((item) => item.id === gradingSubmission?.testId) ?? null;

  const isFaculty = role === "educator" || role === "admin";

  const filteredTests = useMemo(() => {
    let list = isFaculty ? tests : assignedTests;
    if (statusTab !== "all") {
      list = list.filter((t) => getExamStatus(t) === statusTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.summary?.toLowerCase().includes(q));
    }
    return list;
  }, [tests, assignedTests, statusTab, searchQuery, isFaculty]);

  const stats = useMemo(() => {
    const total = tests.length;
    const draft = tests.filter((t) => getExamStatus(t) === "draft").length;
    const live = tests.filter((t) => getExamStatus(t) === "live").length;
    const upcoming = tests.filter((t) => getExamStatus(t) === "upcoming").length;
    const completed = tests.filter((t) => getExamStatus(t) === "completed").length;
    return { total, draft, live, upcoming, completed };
  }, [tests]);

  async function handleCreateTest() {
    const response = await fetch("/api/tests", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        status: "Assigned",
        assignedUserIds: selectedStudents,
        questions: questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options.slice(0, q.optionCount),
        })),
      }),
    });

    if (!response.ok) {
      setStatusMsg("Exam could not be created.");
      return;
    }

    const data = (await response.json()) as { test: TestItem };
    setTests((current) => [data.test, ...current]);
    setTitle("");
    setSummary("");
    setSelectedStudents([]);
    setQuestions([createQuestion(0, 4)]);
    setShowCreateForm(false);
    setStatusMsg("Exam created and assigned successfully.");
    onDashboardRefresh?.();
  }

  async function handleSubmitTest() {
    if (!activeTest) return;

    const response = await fetch("/api/test-submissions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId: activeTest.id, answers }),
    });

    if (!response.ok) {
      setStatusMsg("Submission failed.");
      return;
    }

    const data = (await response.json()) as { submission: TestSubmission };
    onSubmissionsChange([data.submission, ...submissions]);
    setActiveTestId(null);
    setAnswers([]);
    setStatusMsg("Exam submitted for review.");
    onDashboardRefresh?.();
  }

  async function handleGradeSubmission() {
    if (!gradingSubmissionId) return;

    const response = await fetch("/api/test-submissions", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: gradingSubmissionId,
        score: Number(gradeScore),
        feedback: gradeFeedback,
      }),
    });

    if (!response.ok) {
      setStatusMsg("Grading failed.");
      return;
    }

    const data = (await response.json()) as { submission: TestSubmission; message: MessageItem };
    onSubmissionsChange(
      submissions.map((item) => (item.id === gradingSubmissionId ? data.submission : item)),
    );
    onMessagePublished(data.message);
    setGradingSubmissionId(null);
    setGradeScore("");
    setGradeFeedback("");
    setStatusMsg("Result graded and published.");
  }

  function handleStartEdit(test: TestItem) {
    setEditingTestId(test.id);
    setTitle(test.title);
    setSummary(test.summary ?? "");
    setSelectedStudents(test.assignedUserIds ?? []);
    setQuestions(
      test.questions?.map((q, i) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options.length === 2 ? [...q.options, "", ""] : [...q.options],
        optionCount: q.options.length === 2 ? 2 : 4 as 2 | 4,
      })) ?? [createQuestion(0, 4)],
    );
    setShowCreateForm(true);
    setStatusMsg("");
  }

  function handleCancelEdit() {
    setEditingTestId(null);
    setTitle("");
    setSummary("");
    setSelectedStudents([]);
    setQuestions([createQuestion(0, 4)]);
    setShowCreateForm(false);
  }

  async function handleUpdateTest() {
    if (!editingTestId) return;

    const response = await fetch(`/api/tests/${editingTestId}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        assignedUserIds: selectedStudents,
        questions: questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options.slice(0, q.optionCount),
        })),
      }),
    });

    if (!response.ok) {
      setStatusMsg("Exam could not be updated.");
      return;
    }

    const data = (await response.json()) as { test: TestItem };
    setTests((current) => current.map((t) => (t.id === editingTestId ? data.test : t)));
    handleCancelEdit();
    setStatusMsg("Exam updated successfully.");
    onDashboardRefresh?.();
  }

  async function handleDeleteTest(testId: string) {
    setDeletingId(testId);
    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        setStatusMsg("Exam could not be deleted.");
        return;
      }

      setTests((current) => current.filter((t) => t.id !== testId));
      setShowDeleteConfirm(null);
      setStatusMsg("Exam deleted.");
      onDashboardRefresh?.();
    } finally {
      setDeletingId(null);
    }
  }

  const statusTabs = [
    { id: "all", label: "All" },
    { id: "live", label: "Live" },
    { id: "upcoming", label: "Upcoming" },
    { id: "draft", label: "Draft" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      {/* ────────────── HEADER ────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <p className="section-label">Exams</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            {isFaculty ? "Exam Management" : "My Exams"}
          </h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {isFaculty ? "Create, manage and analyse all assessments" : "Complete and review your assessments"}
          </p>
        </div>
      </div>

      {/* ────────────── STUDENT VIEW ────────────── */}
      {role === "student" && (
        <div className="grid gap-6">
          {/* Student Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "var(--primary-grad-12-3)", color: "var(--primary)" }}>
                <FileText size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Total Exams</div>
                <div className="exam-stat-value">{assignedTests.length}</div>
              </div>
            </div>
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "#ECFDF5", color: "#10B981" }}>
                <CheckCircle size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Completed</div>
                <div className="exam-stat-value">{submissions.filter(s => s.status === "graded" || s.status === "published").length}</div>
              </div>
            </div>
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                <Clock size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Pending</div>
                <div className="exam-stat-value">{submissions.filter(s => s.status === "submitted").length}</div>
              </div>
            </div>
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "#F5F3FF", color: "#5B21B6" }}>
                <BookOpen size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Avg. Score</div>
                <div className="exam-stat-value">
                  {(() => {
                    const graded = submissions.filter(s => s.score != null);
                    if (!graded.length) return "—";
                    const avg = graded.reduce((a, s) => a + ((s.score ?? 0) / s.total) * 100, 0) / graded.length;
                    return `${Math.round(avg)}%`;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Student Exam List */}
          {assignedTests.length === 0 ? (
            <div className="text-center py-12 surface-soft rounded-[1.75rem]">
              <div className="w-20 h-20 bg-[var(--primary-3)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={36} style={{ color: "var(--primary)" }} />
              </div>
              <h5 className="text-lg font-bold mb-2 text-[var(--color-heading)]">No exams assigned yet</h5>
              <p className="text-sm text-[var(--color-muted)]">Your exams will appear here once assigned by faculty.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTests.map((test) => {
                const sub = submissions.find(s => s.testId === test.id);
                const isSubmitted = sub && sub.status === "submitted";
                const isGraded = sub && (sub.status === "graded" || sub.status === "published");
                return (
                  <div key={test.id} className="exam-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-[var(--color-heading)] truncate">{test.title}</h4>
                        <p className="text-sm text-[var(--color-muted)] mt-1 line-clamp-2">{test.summary}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="meta-chip">
                            <FileText size={12} />
                            {test.questions?.length ?? 0} questions
                          </span>
                          {test.subject && (
                            <span className="meta-chip">
                              <BookOpen size={12} />
                              {test.subject}
                            </span>
                          )}
                          {test.duration && (
                            <span className="meta-chip">
                              <Clock size={12} />
                              {test.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isGraded ? (
                          <span className="status-badge-completed text-xs px-3 py-1 rounded-full font-bold">
                            <CheckCircle size={10} className="inline mr-1" />Graded
                          </span>
                        ) : isSubmitted ? (
                          <span className="status-badge-upcoming text-xs px-3 py-1 rounded-full font-bold">
                            <Send size={10} className="inline mr-1" />Submitted
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTestId(test.id);
                              setAnswers(new Array(test.questions?.length ?? 0).fill(-1));
                            }}
                            className="btn-action btn-sm font-bold"
                          >
                            Start Exam
                          </button>
                        )}
                      </div>
                    </div>
                    {isGraded && sub && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-4 text-sm">
                        <span className="font-bold text-[var(--color-heading)]">
                          Score: <span className="text-emerald-600">{sub.score}/{sub.total}</span>
                        </span>
                        {sub.feedback && (
                          <span className="text-[var(--color-muted)]">"{sub.feedback}"</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Graded Results */}
          {submissions.filter(s => s.score != null).length > 0 && (
            <div className="surface-soft rounded-[1.75rem] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-secondary)] mb-4">Graded Results</h3>
              <div className="grid gap-3">
                {submissions.filter(s => s.score != null).map((sub) => {
                  const test = tests.find(t => t.id === sub.testId);
                  return (
                    <div key={sub.id} className="exam-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[var(--color-heading)]">{test?.title ?? "Unknown Exam"}</p>
                          <p className="text-xs text-[var(--color-muted)] mt-1">{sub.studentName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600">{sub.score}/{sub.total}</p>
                          {sub.feedback && <p className="text-xs text-[var(--color-muted)] mt-1">{sub.feedback}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active test-taking modal */}
          {activeTest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setActiveTestId(null)}>
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[var(--color-heading)]">{activeTest.title}</h3>
                  <button onClick={() => setActiveTestId(null)} className="text-[var(--color-muted)] hover:text-[var(--color-heading)]">&times;</button>
                </div>
                <div className="grid gap-5">
                  {activeTest.questions?.map((question, qi) => (
                    <div key={question.id} className="surface-soft rounded-2xl p-4">
                      <p className="text-sm font-bold text-[var(--color-heading)] mb-3">
                        <span className="text-[var(--color-muted)] mr-2">Q{qi + 1}.</span>
                        {question.prompt}
                      </p>
                      <div className="grid gap-2">
                        {question.options.map((option, oi) => (
                          <button
                            key={`${question.id}-${oi}`}
                            type="button"
                            onClick={() => setAnswers((curr) => curr.map((a, i) => i === qi ? oi : a))}
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold text-left transition-all ${
                              answers[qi] === oi
                                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                                : "border-[var(--color-border)] bg-white/60 text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                            }`}
                          >
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs font-bold mr-3 shrink-0">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={handleSubmitTest} className="btn-action btn-md font-bold flex-1">
                    <Send size={14} className="mr-2" />Submit Exam
                  </button>
                  <button type="button" onClick={() => setActiveTestId(null)} className="btn-surface btn-md font-bold">
                    Cancel
                  </button>
                </div>
                {statusMsg && <p className="mt-4 text-sm font-semibold text-[var(--color-heading)]">{statusMsg}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────── FACULTY / ADMIN VIEW ────────────── */}
      {isFaculty && (
        <div className="grid gap-6">
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "var(--primary-grad-12-3)", color: "var(--primary)" }}>
                <FileText size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Total Exams</div>
                <div className="exam-stat-value">{stats.total}</div>
              </div>
            </div>
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "#F8FAFC", color: "#64748B" }}>
                <Archive size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Drafts</div>
                <div className="exam-stat-value">{stats.draft}</div>
              </div>
            </div>
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                <Clock size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Upcoming</div>
                <div className="exam-stat-value">{stats.upcoming}</div>
              </div>
            </div>
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "#ECFDF5", color: "#10B981" }}>
                <CheckCircle size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Live</div>
                <div className="exam-stat-value">{stats.live}</div>
              </div>
            </div>
            <div className="exam-stat">
              <div className="exam-stat-icon" style={{ background: "#F5F3FF", color: "#5B21B6" }}>
                <BookOpen size={18} />
              </div>
              <div>
                <div className="exam-stat-label">Completed</div>
                <div className="exam-stat-value">{stats.completed}</div>
              </div>
            </div>
          </div>

          {/* ── Action Bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => setShowCreateForm(true)} className="btn-action btn-md font-bold">
                <Plus size={15} className="mr-2" />Create Exam
              </button>
              <button type="button" onClick={() => setShowQuestionBank(!showQuestionBank)} className="btn-surface btn-md font-bold">
                <Archive size={15} className="mr-2" />Question Bank
              </button>
            </div>
            {statusMsg && <p className="text-sm font-semibold text-[var(--color-primary)]">{statusMsg}</p>}
          </div>

          {/* ── Filter Bar ── */}
          <div className="surface-soft rounded-[1.75rem] p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams..."
                className="flex-1 surface rounded-xl px-4 py-2.5 text-sm outline-none border border-[var(--color-border)] focus:border-[var(--color-primary)]"
              />
              <select className="surface rounded-xl px-4 py-2.5 text-sm outline-none border border-[var(--color-border)] min-w-[140px]">
                <option value="">All Batches</option>
              </select>
              <select className="surface rounded-xl px-4 py-2.5 text-sm outline-none border border-[var(--color-border)] min-w-[140px]">
                <option value="">All Subjects</option>
              </select>
            </div>
          </div>

          {/* ── Tab Pills ── */}
          <div className="flex gap-2 flex-wrap tab-pills">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id)}
                className={`tab-pill ${statusTab === tab.id ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Create Exam Form ── */}
          {showCreateForm && (
            <div className="surface-soft rounded-[1.75rem] p-5 border border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-heading)] mb-4">Create New Exam</h3>
              <div className="grid gap-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  placeholder="Exam title"
                  className="surface rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border)]"
                />
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value.slice(0, 220))}
                  placeholder="Exam description / summary"
                  rows={2}
                  className="surface rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border)]"
                />
                <div className="rounded-2xl border border-[var(--color-border)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-heading)] mb-3">Assign to students</p>
                  <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
                    {studentDirectory.map((student) => (
                      <label key={student.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-soft)] cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) =>
                            setSelectedStudents((curr) =>
                              e.target.checked ? [...curr, student.id] : curr.filter((id) => id !== student.id),
                            )
                          }
                          className="rounded"
                        />
                        {student.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Questions */}
                {questions.map((question, qi) => (
                  <div key={question.id} className="rounded-2xl border border-[var(--color-border)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-[var(--color-heading)]">Question {qi + 1}</p>
                      <select
                        value={question.optionCount}
                        onChange={(e) =>
                          setQuestions((curr) =>
                            curr.map((q, i) => i === qi ? { ...q, optionCount: Number(e.target.value) as 2 | 4 } : q),
                          )
                        }
                        className="surface rounded-xl px-3 py-1.5 text-xs outline-none"
                      >
                        <option value={2}>2 Options</option>
                        <option value={4}>4 Options</option>
                      </select>
                    </div>
                    <input
                      value={question.prompt}
                      onChange={(e) =>
                        setQuestions((curr) =>
                          curr.map((q, i) => i === qi ? { ...q, prompt: e.target.value.slice(0, 120) } : q),
                        )
                      }
                      placeholder="Enter question"
                      className="w-full surface rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border)]"
                    />
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {question.options.slice(0, question.optionCount).map((opt, oi) => (
                        <input
                          key={`${question.id}-${oi}`}
                          value={opt}
                          onChange={(e) =>
                            setQuestions((curr) =>
                              curr.map((q, i) =>
                                i === qi
                                  ? { ...q, options: q.options.map((o, j) => j === oi ? e.target.value.slice(0, 60) : o) }
                                  : q,
                              ),
                            )
                          }
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          className="surface rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border)]"
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setQuestions((curr) => [...curr, createQuestion(curr.length, 4)])}
                    className="btn-surface btn-sm font-bold"
                  >
                    + Add Question
                  </button>
                  <button type="button" onClick={handleCreateTest} className="btn-action btn-md font-bold">
                    <Send size={14} className="mr-2" />Create & Assign
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="btn-surface btn-sm font-bold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Exam Grid ── */}
          {filteredTests.length === 0 ? (
            <div className="text-center py-12 surface-soft rounded-[1.75rem]">
              <div className="w-20 h-20 bg-[var(--primary-3)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={36} style={{ color: "var(--primary)" }} />
              </div>
              <h5 className="text-lg font-bold mb-2 text-[var(--color-heading)]">No exams yet</h5>
              <p className="text-sm text-[var(--color-muted)] mb-4">Create your first exam to get started</p>
              <button type="button" onClick={() => setShowCreateForm(true)} className="btn-action btn-md font-bold">
                <Plus size={15} className="mr-2" />Create First Exam
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredTests.map((test) => {
                const status = getExamStatus(test);
                const statusLabels: Record<string, string> = {
                  live: "● Live",
                  upcoming: "Upcoming",
                  draft: "Draft",
                  completed: "Completed",
                };
                return (
                  <div key={test.id} className="exam-card p-0">
                    <div className="exam-card-header" style={{
                      background: status === "live" ? "#ECFDF5" : status === "upcoming" ? "#EFF6FF" : status === "draft" ? "#F8FAFC" : "#F5F3FF",
                      borderBottom: "1px solid var(--color-border)",
                      padding: "18px 20px 14px",
                    }}>
                      <div className="flex items-center justify-between">
                        <span className={getStatusBadgeClass(status)}>
                          {statusLabels[status]}
                        </span>
                        {test.subject && (
                          <span className="meta-chip text-xs">{test.subject}</span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-[var(--color-heading)] mt-2 truncate">{test.title}</h4>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-[var(--color-muted)] line-clamp-2 leading-relaxed">{test.summary}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[var(--color-muted)]">
                        <span className="meta-chip">
                          <FileText size={11} />
                          {test.questions?.length ?? 0} Q
                        </span>
                        {test.duration && (
                          <span className="meta-chip">
                            <Clock size={11} />
                            {test.duration} min
                          </span>
                        )}
                        <span className="meta-chip">
                          <CheckCircle size={11} />
                          {submissions.filter(s => s.testId === test.id).length} submissions
                        </span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(test)}
                          className="btn-surface btn-sm font-bold text-xs"
                        >
                          Edit
                        </button>
                        {showDeleteConfirm === test.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-red-600">Delete this exam?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteTest(test.id)}
                              disabled={deletingId === test.id}
                              className="btn-action btn-sm font-bold text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletingId === test.id ? "Deleting..." : "Delete"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(null)}
                              disabled={deletingId === test.id}
                              className="btn-surface btn-sm font-bold text-xs disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(test.id)}
                            className="btn-surface btn-sm font-bold text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                        {pendingSubmissions.some(s => s.testId === test.id) && (
                          <button
                            type="button"
                            onClick={() => {
                              const sub = pendingSubmissions.find(s => s.testId === test.id);
                              if (sub) setGradingSubmissionId(sub.id);
                            }}
                            className="btn-action btn-sm font-bold text-xs"
                          >
                            Grade
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pending Grading ── */}
          {pendingSubmissions.length > 0 && (
            <div className="surface-soft rounded-[1.75rem] p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-secondary)] mb-4">
                Pending Grading ({pendingSubmissions.length})
              </h3>
              <div className="grid gap-3">
                {pendingSubmissions.map((sub) => {
                  const test = tests.find(t => t.id === sub.testId);
                  const isSelected = gradingSubmissionId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setGradingSubmissionId(sub.id)}
                      className={`exam-card p-4 text-left transition-all ${isSelected ? "ring-2 ring-[var(--color-secondary)]" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[var(--color-heading)]">{sub.studentName}</p>
                          <p className="text-xs text-[var(--color-muted)] mt-0.5">{test?.title}</p>
                        </div>
                        <AlertCircle size={16} className="text-amber-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Grading Window ── */}
          {gradingSubmission && gradingTest && (
            <div className="surface-soft rounded-[1.75rem] p-5 border border-[var(--color-secondary)]">
              <h3 className="text-base font-bold text-[var(--color-heading)] mb-4">
                Grading: {gradingSubmission.studentName}
              </h3>
              <div className="grid gap-4">
                {gradingTest.questions?.map((question, qi) => (
                  <div key={question.id} className="surface rounded-2xl p-4 bg-white/40">
                    <p className="text-sm font-bold text-[var(--color-heading)]">{question.prompt}</p>
                    <p className="text-sm text-[var(--color-muted)] mt-2">
                      Answer:{" "}
                      <span className="font-bold text-[var(--color-secondary)]">
                        {typeof gradingSubmission.answers[qi] === "number" && gradingSubmission.answers[qi] >= 0
                          ? question.options[gradingSubmission.answers[qi]]
                          : "No answer"}
                      </span>
                    </p>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                    placeholder={`Score out of ${gradingSubmission.total}`}
                    className="flex-1 surface rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border)]"
                  />
                  <input
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value.slice(0, 200))}
                    placeholder="Feedback for student"
                    className="flex-[2] surface rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border)]"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={handleGradeSubmission} className="btn-action btn-md font-bold">
                    <CheckCircle size={14} className="mr-2" />Grade & Publish
                  </button>
                  <button type="button" onClick={() => setGradingSubmissionId(null)} className="btn-surface btn-md font-bold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
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
        .exam-stat {
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .exam-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .exam-stat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .exam-stat-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--color-heading);
          line-height: 1.2;
        }
        .status-badge-live {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .status-badge-upcoming {
          background: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 20px;
        }
        .status-badge-draft {
          background: #F8FAFC;
          color: #64748B;
          border: 1px solid #E2E8F0;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 20px;
        }
        .status-badge-completed {
          background: #F5F3FF;
          color: #5B21B6;
          border: 1px solid #DDD6FE;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 20px;
        }
        .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-muted);
          font-weight: 500;
        }
        .tab-pills .tab-pill {
          padding: 7px 18px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          background: transparent;
          color: #64748B;
          cursor: pointer;
          transition: .15s;
        }
        .tab-pills .tab-pill.active {
          background: #4F46E5;
          color: #fff;
        }
        .tab-pills .tab-pill:hover:not(.active) {
          background: #F1F5F9;
        }
      `}</style>
    </section>
  );
}
