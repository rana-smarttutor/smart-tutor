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
  DashboardBundle,
  HomeworkItem,
  HomeworkSubmission,
  HomeworkType,
  ManagedUser,
  Role,
  SessionUser,
} from "@/lib/types";

type EnrichedHomework = HomeworkItem & {
  batchId?: string;
  batchName?: string;
  submissions?: HomeworkSubmission[];
  mySubmission?: HomeworkSubmission | null;
};

type Props = {
  session: SessionUser | null;
  role: Role;
  dashboard: DashboardBundle;
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

const DEMO_HOMEWORK_ID = "demo-homework-task-1";
function removeDuplicateSubjects(values: Array<string | null | undefined>) {
  const subjects: string[] = [];
  const addedSubjects = new Set<string>();

  for (const value of values) {
    const subject = value?.trim();

    if (!subject) {
      continue;
    }

    const normalizedSubject = subject.toLowerCase();

    if (addedSubjects.has(normalizedSubject)) {
      continue;
    }

    addedSubjects.add(normalizedSubject);
    subjects.push(subject);
  }

  return subjects;
}

function getStudentAcademicSubjects(dashboard: DashboardBundle) {
  const profile = dashboard.profile;

  const wantedCourseKey = profile?.courseWanted?.trim().toLowerCase() ?? "";

  const wantedCourseTitle =
    profile?.courseWantedTitle?.trim().toLowerCase() ?? "";

  const matchedCourse = dashboard.courses.find((course) => {
    const courseId = course.id.trim().toLowerCase();
    const standardKey = course.standardKey.trim().toLowerCase();
    const courseTitle = course.title.trim().toLowerCase();

    const keyMatches =
      Boolean(wantedCourseKey) &&
      (courseId === wantedCourseKey || standardKey === wantedCourseKey);

    const titleMatches =
      Boolean(wantedCourseTitle) &&
      (courseTitle === wantedCourseTitle ||
        courseTitle.includes(wantedCourseTitle) ||
        wantedCourseTitle.includes(courseTitle));

    return keyMatches || titleMatches;
  });

  const profileMentionedSubjects = removeDuplicateSubjects([
    ...(profile?.strongSubjects ?? []),
    ...(profile?.weakSubjects ?? []),
  ]);

  /*
   * The subjects stored against the selected course are the
   * primary and most accurate source.
   */
  const courseSubjects = removeDuplicateSubjects(
    matchedCourse?.subjectsCovered ?? [],
  );

  if (courseSubjects.length > 0) {
    return removeDuplicateSubjects([
      ...courseSubjects,
      ...profileMentionedSubjects,
    ]);
  }

  /*
   * Fallback when the selected course does not yet contain
   * subjectsCovered in the database.
   */
  const studentCourseText = [
    profile?.courseWanted,
    profile?.courseWantedTitle,
    dashboard.heroTitle,
    matchedCourse?.title,
    matchedCourse?.stream,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let fallbackSubjects: string[] = [];

  const isSeniorSecondary = /\b(11|12|11th|12th|xi|xii)\b/.test(
    studentCourseText,
  );

  if (isSeniorSecondary && studentCourseText.includes("science")) {
    fallbackSubjects = [
      "English",
      "Physics",
      "Chemistry",
      "Mathematics",
      "Biology",
      "Computer Science",
    ];
  } else if (isSeniorSecondary && studentCourseText.includes("commerce")) {
    fallbackSubjects = [
      "English",
      "Accountancy",
      "Business Studies",
      "Economics",
      "Mathematics",
    ];
  } else if (
    isSeniorSecondary &&
    (studentCourseText.includes("arts") ||
      studentCourseText.includes("humanities"))
  ) {
    fallbackSubjects = [
      "English",
      "History",
      "Political Science",
      "Geography",
      "Economics",
      "Sociology",
      "Psychology",
    ];
  } else if (/\b(9|10|9th|10th|ix|x)\b/.test(studentCourseText)) {
    fallbackSubjects = [
      "English",
      "Hindi",
      "Mathematics",
      "Science",
      "Social Science",
      "Computer Science",
    ];
  } else if (/\b(6|7|8|6th|7th|8th|vi|vii|viii)\b/.test(studentCourseText)) {
    fallbackSubjects = [
      "English",
      "Hindi",
      "Mathematics",
      "Science",
      "Social Science",
      "Computer Science",
    ];
  }

  return removeDuplicateSubjects([
    ...fallbackSubjects,
    ...profileMentionedSubjects,
  ]);
}
function getDemoDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const year = dueDate.getFullYear();
  const month = String(dueDate.getMonth() + 1).padStart(2, "0");
  const day = String(dueDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function getDueDateState(value?: string) {
  if (!value) {
    return {
      daysRemaining: null,
      isNear: false,
      isOverdue: false,
    };
  }

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) {
    return {
      daysRemaining: null,
      isNear: false,
      isOverdue: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(year, month - 1, day);
  dueDate.setHours(0, 0, 0, 0);

  const daysRemaining = Math.round(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    daysRemaining,
    isOverdue: daysRemaining < 0,
    isNear: daysRemaining >= 0 && daysRemaining <= 3,
  };
}
function createDemoHomework(): EnrichedHomework {
  return {
    id: DEMO_HOMEWORK_ID,
    title: "Assignment 1",
    description:
      "Complete the assigned work and upload it as a PDF or Word document. Your assigned faculty will review it and publish marks and feedback here.",
    objective:
      "Test the complete homework submission, faculty review, marks, and feedback workflow.",
    keySteps: [
      "Complete the homework in a PDF or Word document.",
      "Use the Choose File button below to select the file.",
      "Submit the task and wait for your assigned faculty to review it.",
    ],
    deliverables: "One PDF, DOC, or DOCX file.",
    evaluationCriteria: "Completion, clarity, accuracy, and presentation.",
    estimatedHours: 1,
    taskNumber: 1,
    subject: "General",
    hwType: "assignment",
    maxMarks: 10,
    dueDate: getDemoDueDate(),
    batchId: "demo-homework-batch",
    batchName: "Demo Task",
    allowLateSubmission: true,
    createdBy: "assigned-faculty",
    createdByName: "Assigned Faculty",
    createdAt: new Date().toISOString(),
    submissions: [],
    mySubmission: null,
  };
}
export function HomeworkSection({
  session,
  role,
  dashboard,
  studentDirectory,
  onDashboardRefresh,
}: Props) {
  const [homework, setHomework] = useState<EnrichedHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

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

      const res = await fetch("/api/homework", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!res.ok) {
        setError("Failed to load homework.");
        return;
      }

      const data = (await res.json()) as {
        homework?: EnrichedHomework[];
      };

      const loadedHomework = data.homework ?? [];

      if (loadedHomework.length > 0) {
        setHomework(loadedHomework);
        return;
      }

      // A real backend-backed demo task is shown only while no actual task
      // has been assigned. Its submission is saved in MongoDB using the
      // normal homework-submission API.
      if (!isStudent && !isEducator) {
        setHomework([]);
        return;
      }

      let demoSubmissions: HomeworkSubmission[] = [];

      try {
        const submissionResponse = await fetch(
          `/api/homework/submissions?homeworkId=${encodeURIComponent(
            DEMO_HOMEWORK_ID,
          )}`,
          {
            credentials: "same-origin",
            cache: "no-store",
          },
        );

        if (submissionResponse.ok) {
          const submissionPayload = (await submissionResponse.json()) as {
            submissions?: HomeworkSubmission[];
          };

          demoSubmissions = submissionPayload.submissions ?? [];
        }
      } catch {
        // The demo task can still be displayed even before any submission exists.
      }

      const demoHomework = createDemoHomework();

      if (isStudent) {
        demoHomework.mySubmission =
          demoSubmissions.find(
            (submission) => submission.studentId === session?.id,
          ) ?? null;
      } else {
        const assignedStudentIds = new Set(
          studentDirectory.map((student) => student.id),
        );

        demoHomework.submissions =
          role === "admin"
            ? demoSubmissions
            : demoSubmissions.filter((submission) =>
                assignedStudentIds.has(submission.studentId),
              );
      }

      setHomework([demoHomework]);
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

  function handleSubmissionFile(homeworkId: string, file: File | null) {
    if (!file) {
      setSubmitFile(null);
      return;
    }

    const allowedExtensions =
      /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|png|jpg|jpeg|webp|txt)$/i;

    if (!allowedExtensions.test(file.name)) {
      setError("Upload a PDF, Word, PowerPoint, Excel, image, or text file.");
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

      const response = await fetch("/api/homework/submissions/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

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
      const attachmentUrl = file ? await uploadSubmissionFile(file) : undefined;

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

  const homeworkSubjects = removeDuplicateSubjects(
    homework.map((item) => item.subject),
  );

  const studentAcademicSubjects = isStudent
    ? getStudentAcademicSubjects(dashboard)
    : [];

  const visibleHomeworkSubjects =
    studentAcademicSubjects.length > 0
      ? homeworkSubjects.filter(
          (subject) => subject.toLowerCase() !== "general",
        )
      : homeworkSubjects;

  const subjectOptions = isStudent
    ? removeDuplicateSubjects([
        ...studentAcademicSubjects,
        ...visibleHomeworkSubjects,
      ])
    : [...homeworkSubjects].sort((left, right) => left.localeCompare(right));
  const filtered = homework.filter((hw) => {
    if (search && !hw.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterType && hw.hwType !== filterType) return false;
    if (filterSubject && hw.subject?.trim() !== filterSubject) {
      return false;
    }
    return true;
  });
  const detailsTask =
    homework.find((item) => item.id === expandedTaskId) ?? null;

  const detailsDueDateState = detailsTask
    ? getDueDateState(detailsTask.dueDate)
    : null;

  const selectedStudentFile =
    detailsTask && submittingId === detailsTask.id ? submitFile : null;
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
    description,
  }: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    description?: string;
  }) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: `${color}28`,
          background: `linear-gradient(135deg, ${color}0D, #FFFFFF 72%)`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `${color}14` }}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-2xl font-black leading-none text-slate-900">
              {value}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-700">{label}</p>
            {description ? (
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function formatHomeworkDate(value?: string, includeYear = true) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      ...(includeYear ? { year: "numeric" as const } : {}),
    });
  }

  function getAttachmentName(url?: string) {
    if (!url) return "Uploaded homework";

    try {
      const pathName = new URL(url).pathname;
      const name = decodeURIComponent(pathName.split("/").pop() || "");

      return name || "Uploaded homework";
    } catch {
      const name = decodeURIComponent(url.split("/").pop() || "");
      return name || "Uploaded homework";
    }
  }

  function selectStudentTask(homeworkItem: EnrichedHomework) {
    setExpandedTaskId(homeworkItem.id);
    setSubmittingId(homeworkItem.id);
    setSubmitFile(null);
    setSubmitContent("");
    setError("");
  }

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isEducator ? (
            <p className="section-label">Homework &amp; Assignments</p>
          ) : null}

          <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-900">
            {isEducator ? "Task Management" : "Homework & Assignments"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {isEducator
              ? "Create structured weekly tasks, track submissions, and grade work."
              : "View, complete and submit assignments given by your teachers."}
          </p>
        </div>

        {isEducator ? (
          <button
            type="button"
            onClick={() => setShowAssign(true)}
            className="btn-action btn-md font-bold"
          >
            <Plus size={15} className="mr-2" />
            Create Task
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <AlertCircle size={14} />
          {error}
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Tasks"
          value={totalAssigned}
          icon={<BookOpen size={22} style={{ color: "#2563EB" }} />}
          color="#2563EB"
          description={
            isEducator ? "Tasks created by you" : "All assignments given to you"
          }
        />

        <StatCard
          label="Submitted"
          value={submissionCount}
          icon={<CheckCircle2 size={22} style={{ color: "#059669" }} />}
          color="#059669"
          description={
            isEducator
              ? "Student submissions received"
              : "Assignments you have submitted"
          }
        />

        <StatCard
          label={isEducator ? "Pending Review" : "Pending"}
          value={pendingCount}
          icon={<Hourglass size={22} style={{ color: "#EA8A00" }} />}
          color="#EA8A00"
          description={
            isEducator
              ? "Submissions waiting for review"
              : "Assignments pending submission"
          }
        />
      </div>

      {isStudent ? (
        <>
          {/* Subject tabs */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setFilterSubject("")}
                className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
                  !filterSubject
                    ? "bg-[#0B40A1] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Subjects
              </button>

              {subjectOptions
                .filter((subject) => subject.toLowerCase() !== "other")
                .map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setFilterSubject(subject)}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      filterSubject === subject
                        ? "bg-[#0B40A1] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {subject}
                  </button>
                ))}

              <button
                type="button"
                onClick={() => setFilterSubject("Other")}
                className={`rounded-xl border border-dashed px-4 py-2.5 text-xs font-black transition sm:ml-auto ${
                  filterSubject === "Other"
                    ? "border-[#0B40A1] bg-blue-50 text-[#0B40A1]"
                    : "border-blue-300 bg-white text-[#0B40A1] hover:bg-blue-50"
                }`}
              >
                <Plus size={14} className="mr-1 inline" />
                Other Subject
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B40A1]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ClipboardList size={28} />
              </div>

              <h3 className="mt-5 text-base font-black text-slate-900">
                No Assignments Found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No assignments are available for this subject.
              </p>
            </div>
          ) : (
            <>
              {/* Assignment table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                        {[
                          "#",
                          "Assignment Title",
                          "Subject",
                          "Assigned By",
                          "Assigned On",
                          "Due Date",
                          "Status",
                          "Action",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.05em] text-slate-600"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((hw) => {
                        const submission = hw.mySubmission;
                        const rowNumber =
                          homework.findIndex((item) => item.id === hw.id) + 1;
                        const status =
                          submission?.status === "graded"
                            ? "Reviewed"
                            : submission
                              ? "Submitted"
                              : "Pending";
                        const isSelected = detailsTask?.id === hw.id;
                        const dueDateState = getDueDateState(hw.dueDate);
                        return (
                          <tr
                            key={hw.id}
                            className={`border-b border-slate-100 transition last:border-b-0 ${
                              isSelected ? "bg-blue-50/35" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                              {rowNumber}
                            </td>

                            <td className="max-w-[260px] px-4 py-4">
                              <button
                                type="button"
                                onClick={() => selectStudentTask(hw)}
                                className="block max-w-full truncate text-left text-xs font-bold text-slate-800 hover:text-[#0B40A1]"
                              >
                                {hw.title}
                              </button>
                            </td>

                            <td className="px-4 py-4">
                              <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                {hw.subject || "General"}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                              {hw.createdByName || "Assigned Faculty"}
                            </td>

                            <td className="px-4 py-4 text-xs text-slate-600">
                              {formatHomeworkDate(hw.createdAt)}
                            </td>

                            <td
                              className={`px-4 py-4 text-xs font-bold ${
                                dueDateState.isNear || dueDateState.isOverdue
                                  ? "text-rose-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatHomeworkDate(hw.dueDate)}

                              {dueDateState.isNear &&
                              !dueDateState.isOverdue ? (
                                <span className="ml-2 rounded-md bg-rose-50 px-2 py-1 text-[9px] font-black uppercase text-rose-600">
                                  Due soon
                                </span>
                              ) : null}

                              {dueDateState.isOverdue ? (
                                <span className="ml-2 rounded-md bg-rose-50 px-2 py-1 text-[9px] font-black uppercase text-rose-600">
                                  Overdue
                                </span>
                              ) : null}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black ${
                                  status === "Reviewed"
                                    ? "bg-violet-50 text-violet-700"
                                    : status === "Submitted"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {status}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() => selectStudentTask(hw)}
                                className={`inline-flex min-w-[82px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black transition ${
                                  submission
                                    ? "border border-blue-200 bg-white text-[#0B40A1] hover:bg-blue-50"
                                    : "bg-[#0B40A1] text-white hover:bg-[#092F78]"
                                }`}
                              >
                                {submission ? (
                                  <ExternalLink size={13} />
                                ) : (
                                  <FileUp size={13} />
                                )}
                                {submission ? "View" : "Upload"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {detailsTask ? (
                <div className="mt-6 space-y-5">
                  {/* Assignment details and upload */}
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                      <div>
                        <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                          {detailsTask.subject || "General"}
                        </span>

                        <h3 className="mt-3 text-xl font-black text-slate-900">
                          {detailsTask.title}
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Assigned by{" "}
                          {detailsTask.createdByName || "Assigned Faculty"}
                        </p>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Due Date
                          </p>

                          <p
                            className={`mt-1 text-sm font-black ${
                              detailsDueDateState?.isNear ||
                              detailsDueDateState?.isOverdue
                                ? "text-rose-600"
                                : "text-slate-700"
                            }`}
                          >
                            {formatHomeworkDate(detailsTask.dueDate)}
                          </p>

                          {detailsDueDateState?.isNear &&
                          !detailsDueDateState.isOverdue ? (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                              Due soon
                            </p>
                          ) : null}

                          {detailsDueDateState?.isOverdue ? (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                              Overdue
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setExpandedTaskId(null);
                            setSubmittingId("");
                            setSubmitFile(null);
                            setSubmitContent("");
                            setError("");
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                          aria-label="Close assignment details"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="px-5 py-5 sm:px-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.08em] text-slate-700">
                        Instructions
                      </h4>

                      {detailsTask.keySteps?.length ? (
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                          {detailsTask.keySteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {detailsTask.description ||
                            "Complete the assignment carefully and upload the final file in a supported format."}
                        </p>
                      )}

                      {detailsTask.description &&
                      detailsTask.keySteps?.length ? (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {detailsTask.description}
                        </p>
                      ) : null}

                      <div className="mt-6 grid gap-4 lg:grid-cols-[1.55fr_0.85fr]">
                        <div className="rounded-xl border border-slate-200 p-4">
                          <h4 className="text-xs font-black text-slate-900">
                            Upload Your Answer
                          </h4>

                          <div
                            className="mt-4 flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/25 px-5 py-6 text-center"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              handleSubmissionFile(
                                detailsTask.id,
                                event.dataTransfer.files?.[0] ?? null,
                              );
                            }}
                          >
                            <UploadCloud size={28} className="text-slate-500" />

                            <p className="mt-3 text-sm font-semibold text-slate-600">
                              Drag &amp; drop your file here or
                            </p>

                            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-xs font-black text-[#0B40A1] hover:bg-blue-50">
                              <FileUp size={14} />
                              {selectedStudentFile
                                ? "Change File"
                                : "Browse File"}

                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                                className="hidden"
                                onChange={(event) =>
                                  handleSubmissionFile(
                                    detailsTask.id,
                                    event.target.files?.[0] ?? null,
                                  )
                                }
                              />
                            </label>
                          </div>

                          <p className="mt-2 text-[10px] text-slate-500">
                            Accepted formats: PDF, DOC, DOCX, PPT, XLS, JPG, PNG
                            and TXT. Maximum size: 10 MB.
                          </p>

                          {selectedStudentFile ? (
                            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                              <div className="flex min-w-0 items-center gap-2">
                                <Paperclip
                                  size={14}
                                  className="shrink-0 text-[#0B40A1]"
                                />
                                <span className="truncate text-xs font-bold text-slate-700">
                                  {selectedStudentFile.name}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSubmitFile(null)}
                                className="shrink-0 text-slate-400 hover:text-rose-600"
                                aria-label="Remove selected homework file"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : null}

                          <textarea
                            rows={2}
                            value={
                              submittingId === detailsTask.id
                                ? submitContent
                                : ""
                            }
                            onChange={(event) => {
                              setSubmittingId(detailsTask.id);
                              setSubmitContent(
                                event.target.value.slice(0, 1000),
                              );
                            }}
                            placeholder="Add a note for your teacher (optional)"
                            className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-[#0B40A1]"
                          />

                          <button
                            type="button"
                            onClick={() => void handleSubmit(detailsTask.id)}
                            disabled={
                              (submitting && submittingId === detailsTask.id) ||
                              (!selectedStudentFile &&
                                !(
                                  submittingId === detailsTask.id &&
                                  submitContent.trim()
                                ))
                            }
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-4 py-3 text-xs font-black text-white hover:bg-[#092F78] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {submitting && submittingId === detailsTask.id ? (
                              <>
                                <Loader2 size={15} className="animate-spin" />
                                {uploadingFile
                                  ? "Uploading..."
                                  : "Submitting..."}
                              </>
                            ) : (
                              <>
                                <Send size={14} />
                                {detailsTask.mySubmission
                                  ? "Replace Submission"
                                  : "Submit Assignment"}
                              </>
                            )}
                          </button>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                          <h4 className="text-xs font-black text-slate-900">
                            Your Submission
                          </h4>

                          {detailsTask.mySubmission ? (
                            <div className="mt-4">
                              <p className="text-[11px] text-slate-600">
                                Submitted on:{" "}
                                <span className="font-bold text-slate-800">
                                  {new Date(
                                    detailsTask.mySubmission.submittedAt,
                                  ).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </p>

                              {detailsTask.mySubmission.attachmentUrl ? (
                                <a
                                  href={detailsTask.mySubmission.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
                                >
                                  <span className="flex min-w-0 items-center gap-2">
                                    <Paperclip
                                      size={15}
                                      className="shrink-0 text-slate-500"
                                    />
                                    <span className="truncate">
                                      {getAttachmentName(
                                        detailsTask.mySubmission.attachmentUrl,
                                      )}
                                    </span>
                                  </span>

                                  <ExternalLink
                                    size={14}
                                    className="shrink-0 text-[#0B40A1]"
                                  />
                                </a>
                              ) : null}

                              {detailsTask.mySubmission.content ? (
                                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
                                  {detailsTask.mySubmission.content}
                                </p>
                              ) : null}

                              <div className="mt-4 border-t border-slate-200 pt-3">
                                <p className="text-xs font-bold text-slate-700">
                                  Status:{" "}
                                  <span
                                    className={
                                      detailsTask.mySubmission.status ===
                                      "graded"
                                        ? "text-violet-700"
                                        : "text-emerald-700"
                                    }
                                  >
                                    {detailsTask.mySubmission.status ===
                                    "graded"
                                      ? "Reviewed"
                                      : "Submitted"}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                              <FileUp
                                size={24}
                                className="mx-auto text-slate-300"
                              />
                              <p className="mt-3 text-xs font-bold text-slate-600">
                                Not submitted yet
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                Your uploaded file and status will appear here.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Teacher feedback */}
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-emerald-100 bg-emerald-50/65 px-5 py-4 sm:px-6">
                      <h3 className="text-sm font-black text-emerald-800">
                        Teacher Feedback
                      </h3>
                    </div>

                    {detailsTask.mySubmission?.status === "graded" ? (
                      <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                          {(detailsTask.createdByName || "T")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {detailsTask.createdByName || "Your Teacher"}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-500">
                                Feedback published after review
                              </p>
                            </div>

                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                              <Award size={13} />
                              {detailsTask.mySubmission.marks ?? 0}/
                              {detailsTask.maxMarks}
                            </span>
                          </div>

                          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {detailsTask.mySubmission.feedback?.trim() ||
                              "Your teacher reviewed this assignment but did not add written feedback."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 py-8 text-center sm:px-6">
                        <MessageSquareText
                          size={26}
                          className="mx-auto text-slate-300"
                        />
                        <p className="mt-3 text-sm font-bold text-slate-600">
                          Feedback is not available yet
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Your teacher&apos;s comments and marks will appear
                          here after the assignment is reviewed.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          {/* Educator filters */}
          <div className="surface-soft mb-5 rounded-[1.75rem] p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-9 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className="min-w-[130px] rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm outline-none"
              >
                <option value="">All Types</option>
                {Object.entries(HW_TYPE_LABELS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
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

              {search || filterType || filterSubject ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilterType("");
                    setFilterSubject("");
                  }}
                  className="btn-surface btn-sm font-bold"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface-soft rounded-[1.75rem] py-16 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--primary-3)]">
                <BookOpen size={36} style={{ color: "var(--primary)" }} />
              </div>
              <h5 className="mb-2 text-lg font-bold text-[var(--color-heading)]">
                No tasks created yet
              </h5>
              <p className="mx-auto mb-4 max-w-md text-sm text-[var(--color-muted)]">
                Create structured assignments with objectives, key steps, and
                evaluation criteria.
              </p>
              <button
                type="button"
                onClick={() => setShowAssign(true)}
                className="btn-action btn-md font-bold"
              >
                <Plus size={15} className="mr-2" />
                Create First Task
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((hw, index) => {
                const isOverdue = hw.dueDate < todayDate;
                const subs = hw.submissions ?? [];
                const gradedSubs = subs.filter(
                  (submission) => submission.status === "graded",
                );
                const ungradedSubs = subs.filter(
                  (submission) => submission.status !== "graded",
                );
                const isDemoTask = hw.id === DEMO_HOMEWORK_ID;
                const canDelete = !isDemoTask;
                const submission = hw.mySubmission ?? null;

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
                            <Users size={11} /> {gradedSubs.length}/
                            {subs.length} graded
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
                                      <CheckCircle2 size={12} /> Checked by
                                      teacher
                                    </>
                                  ) : (
                                    <>
                                      <Hourglass size={12} /> Submitted for
                                      review
                                    </>
                                  )}
                                </span>

                                {submission.status === "graded" ? (
                                  <span className="text-sm font-black text-emerald-700">
                                    {submission.marks ?? 0}/{hw.maxMarks} marks
                                  </span>
                                ) : null}
                              </div>

                              {(submission.content ||
                                submission.attachmentUrl) && (
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
                                  Your teacher will review the file and publish
                                  marks and feedback here.
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
                                    Add an optional note and upload one file up
                                    to 10 MB.
                                  </p>
                                </div>
                              </div>

                              <textarea
                                rows={3}
                                placeholder="Write a note for your teacher (optional)..."
                                value={
                                  submittingId === hw.id ? submitContent : ""
                                }
                                onChange={(event) => {
                                  setSubmitContent(
                                    event.target.value.slice(0, 1000),
                                  );
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
                                    <Paperclip
                                      size={14}
                                      className="shrink-0 text-blue-500"
                                    />
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
                                      <Loader2
                                        size={15}
                                        className="mr-2 animate-spin"
                                      />
                                      {uploadingFile
                                        ? "Uploading..."
                                        : "Submitting..."}
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
                                {ungradedSubs.length} waiting for review ·{" "}
                                {gradedSubs.length} checked
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
                                  setGradeFeedback(
                                    submissionToReview.feedback ?? "",
                                  );
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
                                    {submissionItem.studentName
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-[var(--color-heading)]">
                                      {submissionItem.studentName}
                                    </p>

                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                      Submitted{" "}
                                      {new Date(
                                        submissionItem.submittedAt,
                                      ).toLocaleDateString("en-IN", {
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

                                    {submissionItem.status === "graded" &&
                                    submissionItem.feedback ? (
                                      <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-700">
                                        <span className="font-black text-[#0B40A1]">
                                          Feedback:{" "}
                                        </span>
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
                                        setGradeMarks(
                                          submissionItem.marks ?? 0,
                                        );
                                        setGradeFeedback(
                                          submissionItem.feedback ?? "",
                                        );
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
                                isDemoTask
                                  ? "The demo task cannot be deleted."
                                  : !canDelete
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
        </>
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
