"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  FileUp,
  Hourglass,
  Loader2,
  MessageSquareText,
  Paperclip,
  Plus,
  Send,
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
  batchId?: string;
  batchName?: string;
  submissions?: HomeworkSubmission[];
  mySubmission?: HomeworkSubmission | null;
};

type Props = {
  session: SessionUser | null;
  role: Role;
  studentDirectory: ManagedUser[];
  managedUsers?: ManagedUser[];
  onDashboardRefresh?: () => void;
};

const HW_TYPE_LABELS: Record<HomeworkType, string> = {
  homework: "Homework",
  assignment: "Assignment",
  classwork: "Classwork",
  project: "Project",
  test: "Test",
};

const DEMO_HOMEWORK_ID = "demo-homework-task-1";
type AssignTargetMode = "individual" | "class-section";
function getStudentClassLabel(student: ManagedUser) {
  const courseKey = student.profile?.courseWanted?.trim() ?? "";

  const courseTitle = student.profile?.courseWantedTitle?.trim() ?? "";

  const program = student.program?.trim() ?? "";

  const combinedText = `${courseKey} ${courseTitle} ${program}`;

  const classMatch = combinedText.match(
    /\bclass[\s-]*(6|7|8|9|10|11|12)(?:st|nd|rd|th)?\b/i,
  );

  if (classMatch?.[1]) {
    return `Class ${classMatch[1]}`;
  }

  if (
    courseKey.toLowerCase().startsWith("govt exams |") ||
    /\b(govt|government)\s*exams?\b/i.test(combinedText)
  ) {
    return "Government Exams";
  }

  if (courseKey.toLowerCase().startsWith("competitive exams |")) {
    return "Competitive Exams";
  }

  if (
    courseKey.toLowerCase().startsWith("skills |") ||
    /\bskills?\b/i.test(combinedText)
  ) {
    return "Skills";
  }

  return program || courseTitle || "Other Programs";
}

function getStudentSectionLabel(student: ManagedUser) {
  const courseKey = student.profile?.courseWanted?.trim() ?? "";

  const courseTitle = student.profile?.courseWantedTitle?.trim() ?? "";

  const program = student.program?.trim() ?? "";

  const classLabel = getStudentClassLabel(student);

  if (classLabel.startsWith("Class ")) {
    const classNumber = classLabel.replace("Class ", "");

    const remainingTitle = courseTitle
      .replace(
        new RegExp(`class[\\s-]*${classNumber}(?:st|nd|rd|th)?`, "i"),
        "",
      )
      .replace(/^[\s|:—–-]+/, "")
      .trim();

    if (remainingTitle) {
      return remainingTitle;
    }

    if (program && !program.toLowerCase().includes(`class ${classNumber}`)) {
      return program;
    }

    return "General";
  }

  if (
    classLabel === "Government Exams" ||
    classLabel === "Competitive Exams" ||
    classLabel === "Skills"
  ) {
    const cleanedTitle = courseTitle
      .replace(/^(government|govt|competitive)?\s*exams?\s*[|:—–-]*/i, "")
      .trim();

    return (
      cleanedTitle || program || courseKey.split("|")[1]?.trim() || "General"
    );
  }

  return courseTitle || program || "General";
}
function getDemoDueDate() {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const year = dueDate.getFullYear();
  const month = String(dueDate.getMonth() + 1).padStart(2, "0");
  const day = String(dueDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createDemoHomework(): EnrichedHomework {
  return {
    id: DEMO_HOMEWORK_ID,

    assignedStudentIds: [],
    assignedStudentNames: [],

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
  studentDirectory,
  managedUsers,
  onDashboardRefresh,
}: Props) {
  const [homework, setHomework] = useState<EnrichedHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const [assignAttachmentFile, setAssignAttachmentFile] = useState<File | null>(
    null,
  );

  const [assignUploadingDocument, setAssignUploadingDocument] = useState(false);
  const [assignTargetMode, setAssignTargetMode] =
    useState<AssignTargetMode>("individual");

  const [assignClassFilter, setAssignClassFilter] = useState("");

  const [assignSectionFilter, setAssignSectionFilter] = useState("");

  const [assignStudentSearch, setAssignStudentSearch] = useState("");

  const [assignStudentIds, setAssignStudentIds] = useState<string[]>([]);

  const [submitContent, setSubmitContent] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submittingId, setSubmittingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [gradeModal, setGradeModal] = useState<{
    homeworkTitle: string;
    maxMarks: number;
    submission: HomeworkSubmission;
  } | null>(null);

  const [gradeMarks, setGradeMarks] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  const isEducator = role === "educator" || role === "admin";

  const isStudent = role === "student";

  const canAssignHomework = role === "educator";

  /*
   * This must be declared before any other memo
   * that uses assignableStudents.
   */
  const assignableStudents = useMemo(() => {
    const combinedStudents = [...(managedUsers ?? []), ...studentDirectory];

    return [
      ...new Map(
        combinedStudents
          .filter(
            (user) =>
              user.role === "student" &&
              user.status !== "rejected" &&
              user.status !== "pending" &&
              user.verified !== false,
          )
          .map((student) => [student.id, student]),
      ).values(),
    ].sort((left, right) => (left.name ?? "").localeCompare(right.name ?? ""));
  }, [managedUsers, studentDirectory]);

  const assignmentClassOptions = useMemo(() => {
    return [
      ...new Set(
        assignableStudents.map((student) => getStudentClassLabel(student)),
      ),
    ].sort((left, right) =>
      left.localeCompare(right, undefined, {
        numeric: true,
      }),
    );
  }, [assignableStudents]);

  const assignmentSectionOptions = useMemo(() => {
    if (!assignClassFilter) {
      return [];
    }

    return [
      ...new Set(
        assignableStudents
          .filter(
            (student) => getStudentClassLabel(student) === assignClassFilter,
          )
          .map((student) => getStudentSectionLabel(student)),
      ),
    ].sort((left, right) =>
      left.localeCompare(right, undefined, {
        numeric: true,
      }),
    );
  }, [assignableStudents, assignClassFilter]);

  const studentsInSelectedSection = useMemo(() => {
    if (!assignClassFilter || !assignSectionFilter) {
      return [];
    }

    return assignableStudents.filter(
      (student) =>
        getStudentClassLabel(student) === assignClassFilter &&
        getStudentSectionLabel(student) === assignSectionFilter,
    );
  }, [assignableStudents, assignClassFilter, assignSectionFilter]);

  const visibleAssignableStudents = useMemo(() => {
    const sourceStudents =
      assignTargetMode === "class-section"
        ? studentsInSelectedSection
        : assignableStudents;

    const query = assignStudentSearch.trim().toLowerCase();

    if (!query) {
      return sourceStudents;
    }

    return sourceStudents.filter((student) => {
      const searchableText = [
        student.name,
        student.email,
        student.program,
        student.profile?.courseWanted,
        student.profile?.courseWantedTitle,
        getStudentClassLabel(student),
        getStudentSectionLabel(student),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    assignTargetMode,
    assignStudentSearch,
    assignableStudents,
    studentsInSelectedSection,
  ]);

  const selectedAssignStudents = assignableStudents.filter((student) =>
    assignStudentIds.includes(student.id),
  );

  function toggleAssignedStudent(studentId: string) {
    setAssignStudentIds((currentIds) =>
      currentIds.includes(studentId)
        ? currentIds.filter((id) => id !== studentId)
        : [...currentIds, studentId],
    );
  }

  function selectAllVisibleStudents() {
    setAssignStudentIds((currentIds) => [
      ...new Set([
        ...currentIds,
        ...visibleAssignableStudents.map((student) => student.id),
      ]),
    ]);
  }
  function assignWholeSection() {
    if (!assignClassFilter || !assignSectionFilter) {
      setError("Choose a class and section first.");
      return;
    }

    if (studentsInSelectedSection.length === 0) {
      setError("No students are available in this section.");
      return;
    }

    setError("");

    setAssignStudentIds(studentsInSelectedSection.map((student) => student.id));
  }

  function resetAssignmentTarget() {
    setAssignStudentIds([]);
    setAssignStudentSearch("");
    setAssignClassFilter("");
    setAssignSectionFilter("");
    setError("");
  }

  function changeAssignmentTargetMode(nextMode: AssignTargetMode) {
    setAssignTargetMode(nextMode);
    resetAssignmentTarget();
  }
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
  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleAssignAttachmentFile(file: File | null) {
    if (!file) {
      setAssignAttachmentFile(null);
      return;
    }

    const allowedExtensions =
      /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|png|jpg|jpeg|webp|txt)$/i;

    if (!allowedExtensions.test(file.name)) {
      setError("Upload a PDF, Word, PowerPoint, Excel, image, or text file.");

      setAssignAttachmentFile(null);
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("The homework document must be 10 MB or smaller.");

      setAssignAttachmentFile(null);
      return;
    }

    setError("");
    setAssignAttachmentFile(file);
  }

  async function uploadFacultyHomeworkDocument(file: File) {
    setAssignUploadingDocument(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/homework/upload", {
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
        throw new Error(
          payload.error ?? "Unable to upload the homework document.",
        );
      }

      return payload.url;
    } finally {
      setAssignUploadingDocument(false);
    }
  }
  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTitle.trim() || !assignDueDate) {
      setError("Title and due date are required.");
      return;
    }

    if (assignStudentIds.length === 0) {
      setError("Select at least one student before creating the task.");
      return;
    }
    setAssigning(true);
    setError("");

    try {
      const attachmentUrl = assignAttachmentFile
        ? await uploadFacultyHomeworkDocument(assignAttachmentFile)
        : undefined;

      const keyStepsArr = assignKeySteps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          assignedStudentIds: assignStudentIds,
          assignedStudentNames: selectedAssignStudents.map(
            (student) => student.name,
          ),
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
          attachmentUrl,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed.");
        return;
      }
      closeAssignModal();
      await loadHomework();
      onDashboardRefresh?.();
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : "Unable to create the homework task.",
      );
    } finally {
      setAssigning(false);
      setAssignUploadingDocument(false);
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
    setAssignAttachmentFile(null);
    setAssignUploadingDocument(false);
    setAssignStudentSearch("");
    setAssignStudentIds([]);
    setAssignTargetMode("individual");
    setAssignClassFilter("");
    setAssignSectionFilter("");
  }
  function openAssignModal() {
    resetForm();
    setError("");
    setShowAssign(true);
  }

  function closeAssignModal() {
    resetForm();
    setError("");
    setShowAssign(false);
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
    if (!gradeModal || grading) {
      return;
    }

    if (gradeMarks < 0 || gradeMarks > gradeModal.maxMarks) {
      setError(`Marks must be between 0 and ${gradeModal.maxMarks}.`);
      return;
    }

    setGrading(true);
    setError("");

    try {
      const res = await fetch("/api/homework/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          submissionId: gradeModal.submission.id,
          marks: gradeMarks,
          feedback: gradeFeedback.trim() || undefined,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(
          payload.error ?? "Unable to publish marks and feedback.",
        );
      }

      setGradeModal(null);
      setGradeMarks(0);
      setGradeFeedback("");

      await loadHomework();
      onDashboardRefresh?.();
    } catch (gradeError) {
      setError(
        gradeError instanceof Error
          ? gradeError.message
          : "Unable to publish marks and feedback.",
      );
    } finally {
      setGrading(false);
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
    if (
      filterSubject &&
      hw.subject?.trim().toLowerCase() !== filterSubject.trim().toLowerCase()
    ) {
      return false;
    }

    return true;
  });
  const detailsTask = isStudent
    ? (filtered.find((item) => item.id === expandedTaskId) ?? null)
    : null;
  const selectedEducatorTask = isEducator
    ? (homework.find((item) => item.id === expandedTaskId) ?? null)
    : null;

  function toggleEducatorTask(homeworkId: string) {
    setExpandedTaskId((currentId) =>
      currentId === homeworkId ? null : homeworkId,
    );
  }
  const selectedStudentFile =
    detailsTask && submittingId === detailsTask.id ? submitFile : null;

  const totalAssigned = homework.length;

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
  const educatorSubmissionRows = homework
    .flatMap((homeworkItem) =>
      (homeworkItem.submissions ?? []).map((submission) => ({
        homeworkItem,
        submission,
      })),
    )
    .sort((left, right) => {
      const leftTime = new Date(left.submission.submittedAt).getTime();

      const rightTime = new Date(right.submission.submittedAt).getTime();

      return (
        (Number.isNaN(rightTime) ? 0 : rightTime) -
        (Number.isNaN(leftTime) ? 0 : leftTime)
      );
    });

  const downloadableSubmissionRows = educatorSubmissionRows.filter(
    ({ submission }) => Boolean(submission.attachmentUrl),
  );

  function openSubmissionReview(
    homeworkItem: EnrichedHomework,
    submission: HomeworkSubmission,
  ) {
    setGradeModal({
      homeworkTitle: homeworkItem.title,
      maxMarks: homeworkItem.maxMarks,
      submission,
    });

    setGradeMarks(submission.marks ?? 0);
    setGradeFeedback(submission.feedback ?? "");
    setError("");
  }
  function handleDownloadAllSubmissions() {
    if (downloadableSubmissionRows.length === 0) {
      setError("No submitted files are available to download.");
      return;
    }

    downloadableSubmissionRows.forEach(
      ({ homeworkItem, submission }, index) => {
        window.setTimeout(() => {
          const attachmentUrl = submission.attachmentUrl;

          if (!attachmentUrl) {
            return;
          }

          const link = document.createElement("a");

          link.href = attachmentUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";

          link.download =
            `${submission.studentName}-${homeworkItem.title}`
              .replace(/[^a-zA-Z0-9-_ ]/g, "")
              .trim() || "homework-submission";

          document.body.appendChild(link);

          link.click();
          link.remove();
        }, index * 250);
      },
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
  function getHomeworkStatus(dueDate?: string) {
    if (!dueDate) {
      return {
        label: "Active",
        isExpired: false,
      };
    }

    const normalizedDueDate = dueDate.includes("T")
      ? dueDate
      : `${dueDate}T23:59:59`;

    const date = new Date(normalizedDueDate);

    if (Number.isNaN(date.getTime())) {
      return {
        label: "Active",
        isExpired: false,
      };
    }

    const isExpired = date.getTime() < Date.now();

    return {
      label: isExpired ? "Expired" : "Active",
      isExpired,
    };
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
          {canAssignHomework ? (
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

        {canAssignHomework ? (
          <button
            type="button"
            onClick={openAssignModal}
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

      {isStudent ? (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Tasks"
            value={totalAssigned}
            icon={<BookOpen size={22} style={{ color: "#2563EB" }} />}
            color="#2563EB"
            description="All assignments given to you"
          />

          <StatCard
            label="Submitted"
            value={submissionCount}
            icon={<CheckCircle2 size={22} style={{ color: "#059669" }} />}
            color="#059669"
            description="Assignments you have submitted"
          />

          <StatCard
            label="Pending"
            value={pendingCount}
            icon={<Hourglass size={22} style={{ color: "#EA8A00" }} />}
            color="#EA8A00"
            description="Assignments pending submission"
          />
        </div>
      ) : null}

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

                            <td className="px-4 py-4 text-xs font-bold text-rose-600">
                              {formatHomeworkDate(hw.dueDate)}
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

                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Due Date
                        </p>
                        <p className="mt-1 text-sm font-black text-rose-600">
                          {formatHomeworkDate(detailsTask.dueDate)}
                        </p>
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
                      {detailsTask.attachmentUrl ? (
                        <a
                          href={detailsTask.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-[#0B40A1] transition hover:bg-blue-100"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                              <Paperclip size={16} />
                            </span>

                            <span className="min-w-0">
                              <span className="block text-[10px] font-bold uppercase tracking-wide text-blue-600">
                                Homework Document
                              </span>

                              <span className="block truncate">
                                Open document uploaded by faculty
                              </span>
                            </span>
                          </span>

                          <ExternalLink size={16} className="shrink-0" />
                        </a>
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
      ) : isEducator ? (
        <div className="space-y-6">
          {/* Assigned Tasks */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B40A1]">
                <BookOpen size={22} />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 sm:text-xl">
                  Assigned Tasks
                </h3>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Click a task to view its complete details.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[140px] items-center justify-center">
                <Loader2 size={26} className="animate-spin text-[#0B40A1]" />
              </div>
            ) : homework.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <ClipboardList size={27} className="mx-auto text-slate-300" />

                <p className="mt-3 text-sm font-bold text-slate-600">
                  No tasks created yet
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 sm:p-5">
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] border-collapse bg-white">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-left">
                            {[
                              "Task Title",
                              "Subject",
                              "Due Date",
                              "Status",
                            ].map((heading, index, headings) => (
                              <th
                                key={heading}
                                className={`px-4 py-3 text-xs font-black text-slate-800 ${
                                  index !== headings.length - 1
                                    ? "border-r border-slate-200"
                                    : ""
                                }`}
                              >
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {homework.map((homeworkItem) => {
                            const taskStatus = getHomeworkStatus(
                              homeworkItem.dueDate,
                            );

                            const isSelected =
                              selectedEducatorTask?.id === homeworkItem.id;

                            return (
                              <tr
                                key={homeworkItem.id}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  toggleEducatorTask(homeworkItem.id)
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    toggleEducatorTask(homeworkItem.id);
                                  }
                                }}
                                className={`cursor-pointer border-b border-slate-200 transition last:border-b-0 ${
                                  isSelected
                                    ? "bg-blue-50/60"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="border-r border-slate-200 px-4 py-3">
                                  <p className="text-sm font-black text-slate-900">
                                    {homeworkItem.title}
                                  </p>

                                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                    {HW_TYPE_LABELS[homeworkItem.hwType] ??
                                      "Assignment"}
                                    {homeworkItem.taskNumber
                                      ? ` ${homeworkItem.taskNumber}`
                                      : ""}
                                  </p>
                                </td>

                                <td className="border-r border-slate-200 px-4 py-3">
                                  <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                    {homeworkItem.subject || "General"}
                                  </span>
                                </td>

                                <td className="border-r border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                                  {formatHomeworkDate(homeworkItem.dueDate)}
                                </td>

                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex min-w-[76px] items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-black ${
                                      taskStatus.isExpired
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {taskStatus.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {selectedEducatorTask ? (
                  <div className="border-t border-slate-200 bg-slate-50/40 px-4 py-4 sm:px-5">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#0B40A1]">
                            Assignment Details
                          </p>

                          <h4 className="mt-1 text-lg font-black text-slate-900">
                            {selectedEducatorTask.title}
                          </h4>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                              {selectedEducatorTask.subject || "General"}
                            </span>

                            <span className="text-xs font-semibold text-slate-500">
                              Maximum marks: {selectedEducatorTask.maxMarks}
                            </span>

                            {selectedEducatorTask.estimatedHours ? (
                              <span className="text-xs font-semibold text-slate-500">
                                Estimated time:{" "}
                                {selectedEducatorTask.estimatedHours}h
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedTaskId(null)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Close assignment details"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Due Date
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {formatHomeworkDate(selectedEducatorTask.dueDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Status
                          </p>

                          {(() => {
                            const status = getHomeworkStatus(
                              selectedEducatorTask.dueDate,
                            );

                            return (
                              <span
                                className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                                  status.isExpired
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {status.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {selectedEducatorTask.objective ? (
                        <div className="mt-4">
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Objective
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {selectedEducatorTask.objective}
                          </p>
                        </div>
                      ) : null}

                      {selectedEducatorTask.description ? (
                        <div className="mt-4">
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Description
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {selectedEducatorTask.description}
                          </p>
                        </div>
                      ) : null}

                      {selectedEducatorTask.keySteps?.length ? (
                        <div className="mt-4">
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Key Steps
                          </p>

                          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
                            {selectedEducatorTask.keySteps.map(
                              (step, index) => (
                                <li key={`${selectedEducatorTask.id}-${index}`}>
                                  {step}
                                </li>
                              ),
                            )}
                          </ol>
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {selectedEducatorTask.deliverables ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                              Deliverables
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-700">
                              {selectedEducatorTask.deliverables}
                            </p>
                          </div>
                        ) : null}

                        {selectedEducatorTask.evaluationCriteria ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                              Evaluation Criteria
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-700">
                              {selectedEducatorTask.evaluationCriteria}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>

          {/* Student Submissions */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Users size={28} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                    Student Submissions
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Track and review student submissions for this assignment.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadAllSubmissions}
                disabled={downloadableSubmissionRows.length === 0}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={18} />
                Download All
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center border-t border-slate-200">
                <Loader2 size={30} className="animate-spin text-indigo-600" />
              </div>
            ) : educatorSubmissionRows.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center border-t border-slate-200 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Users size={30} />
                </div>

                <h4 className="mt-5 text-base font-black text-slate-800">
                  No student submissions
                </h4>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Student submissions will appear here after students upload
                  their completed assignments.
                </p>
              </div>
            ) : (
              <div className="border-t border-slate-200 px-5 pb-5 pt-5 sm:px-7 sm:pb-7">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] border-collapse bg-white">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                          {[
                            "Student Name",
                            "Subject",
                            "Assignment",
                            "Submitted On",
                            "Status",
                          ].map((heading, index, headings) => (
                            <th
                              key={heading}
                              className={`px-6 py-5 text-sm font-black text-slate-900 ${
                                index !== headings.length - 1
                                  ? "border-r border-slate-200"
                                  : ""
                              }`}
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {educatorSubmissionRows.map(
                          ({ homeworkItem, submission }) => {
                            const isReviewed = submission.status === "graded";

                            return (
                              <tr
                                key={`${homeworkItem.id}-${submission.id}`}
                                className="border-b border-slate-200 transition last:border-b-0 hover:bg-slate-50/70"
                              >
                                <td className="border-r border-slate-200 px-6 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-black text-indigo-700">
                                      {(submission.studentName || "S")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>

                                    <span className="text-sm font-bold text-slate-800">
                                      {submission.studentName || "Student"}
                                    </span>
                                  </div>
                                </td>

                                <td className="border-r border-slate-200 px-6 py-5 text-sm text-slate-700">
                                  {homeworkItem.subject || "General"}
                                </td>

                                <td className="border-r border-slate-200 px-6 py-5 text-sm font-semibold text-slate-800">
                                  {homeworkItem.title}
                                </td>

                                <td className="border-r border-slate-200 px-6 py-5 text-sm text-slate-700">
                                  {formatHomeworkDate(submission.submittedAt)}
                                </td>

                                <td className="px-6 py-5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openSubmissionReview(
                                        homeworkItem,
                                        submission,
                                      )
                                    }
                                    className={`inline-flex min-w-[108px] items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-black transition ${
                                      isReviewed
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        : "border-indigo-500 bg-white text-indigo-700 hover:bg-indigo-50"
                                    }`}
                                  >
                                    {isReviewed ? "Reviewed" : "Review"}
                                  </button>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Homework is not available for this account.
          </p>
        </div>
      )}

      {/* ── Assign Modal ── */}
      {showAssign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeAssignModal}
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
                type="button"
                onClick={closeAssignModal}
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
                <div className="sm:col-span-2">
                  <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40">
                    <div className="flex flex-col gap-3 border-b border-blue-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B40A1] text-white shadow-sm">
                            <Users size={17} />
                          </div>

                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-700">
                              Assign To *
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Select one or multiple students
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[10px] font-black text-[#0B40A1]">
                          {assignStudentIds.length} selected
                        </span>

                        {assignStudentIds.length > 0 ? (
                          <button
                            type="button"
                            onClick={resetAssignmentTarget}
                            className="text-[10px] font-black text-rose-600 hover:underline"
                          >
                            Clear Selection
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Assignment mode */}
                      <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() =>
                            changeAssignmentTargetMode("individual")
                          }
                          className={`rounded-lg px-3 py-2.5 text-xs font-black transition ${
                            assignTargetMode === "individual"
                              ? "bg-[#0B40A1] text-white shadow-sm"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          Individual Students
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            changeAssignmentTargetMode("class-section")
                          }
                          className={`rounded-lg px-3 py-2.5 text-xs font-black transition ${
                            assignTargetMode === "class-section"
                              ? "bg-[#0B40A1] text-white shadow-sm"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          Class / Section
                        </button>
                      </div>

                      {assignTargetMode === "class-section" ? (
                        <>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Select Class / Program
                              </label>

                              <select
                                value={assignClassFilter}
                                onChange={(event) => {
                                  setAssignClassFilter(event.target.value);
                                  setAssignSectionFilter("");
                                  setAssignStudentIds([]);
                                  setAssignStudentSearch("");
                                }}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#0B40A1]"
                              >
                                <option value="">
                                  Choose class or program
                                </option>

                                {assignmentClassOptions.map((classLabel) => (
                                  <option key={classLabel} value={classLabel}>
                                    {classLabel}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Select Section
                              </label>

                              <select
                                value={assignSectionFilter}
                                disabled={!assignClassFilter}
                                onChange={(event) => {
                                  setAssignSectionFilter(event.target.value);
                                  setAssignStudentIds([]);
                                  setAssignStudentSearch("");
                                }}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#0B40A1] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                <option value="">Choose section</option>

                                {assignmentSectionOptions.map(
                                  (sectionLabel) => (
                                    <option
                                      key={sectionLabel}
                                      value={sectionLabel}
                                    >
                                      {sectionLabel}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-blue-100 bg-white px-3 py-3">
                            <div>
                              <p className="text-xs font-black text-slate-800">
                                {assignClassFilter && assignSectionFilter
                                  ? `${assignClassFilter} — ${assignSectionFilter}`
                                  : "Choose a class and section"}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-500">
                                {studentsInSelectedSection.length}{" "}
                                {studentsInSelectedSection.length === 1
                                  ? "student"
                                  : "students"}{" "}
                                available
                              </p>
                            </div>
                            {assignClassFilter || assignSectionFilter ? (
                              <button
                                type="button"
                                onClick={resetAssignmentTarget}
                                className="h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50 hover:text-[#0B40A1]"
                              >
                                Back to All Classes
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={assignWholeSection}
                              disabled={studentsInSelectedSection.length === 0}
                              className="h-10 shrink-0 rounded-xl bg-[#0B40A1] px-4 text-xs font-black text-white transition hover:bg-[#092F78] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Assign Whole Section
                            </button>
                          </div>
                        </>
                      ) : null}

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input
                          type="search"
                          value={assignStudentSearch}
                          onChange={(event) =>
                            setAssignStudentSearch(
                              event.target.value.slice(0, 100),
                            )
                          }
                          disabled={
                            assignTargetMode === "class-section" &&
                            (!assignClassFilter || !assignSectionFilter)
                          }
                          placeholder={
                            assignTargetMode === "class-section"
                              ? "Search within this section..."
                              : "Search by student name, class or program..."
                          }
                          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#0B40A1] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />

                        <button
                          type="button"
                          onClick={selectAllVisibleStudents}
                          disabled={visibleAssignableStudents.length === 0}
                          className="h-11 shrink-0 rounded-xl border border-blue-200 bg-white px-4 text-xs font-black text-[#0B40A1] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Select Shown
                        </button>
                      </div>

                      {selectedAssignStudents.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedAssignStudents.map((student) => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => toggleAssignedStudent(student.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B40A1] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm"
                              title={`Remove ${student.name}`}
                            >
                              <span className="max-w-[150px] truncate">
                                {student.name}
                              </span>

                              <X size={11} />
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                        {visibleAssignableStudents.length > 0 ? (
                          visibleAssignableStudents.map((student) => {
                            const isSelected = assignStudentIds.includes(
                              student.id,
                            );

                            const classLabel = getStudentClassLabel(student);

                            const sectionLabel =
                              getStudentSectionLabel(student);

                            return (
                              <label
                                key={student.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                                  isSelected
                                    ? "border-blue-300 bg-blue-50"
                                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleAssignedStudent(student.id)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 accent-[#0B40A1]"
                                />

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                                  {(student.name || "S")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-black text-slate-800">
                                    {student.name || "Student"}
                                  </p>

                                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                                    {classLabel} — {sectionLabel}
                                  </p>
                                </div>

                                {isSelected ? (
                                  <CheckCircle2
                                    size={17}
                                    className="shrink-0 text-[#0B40A1]"
                                  />
                                ) : null}
                              </label>
                            );
                          })
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
                            <Users
                              size={24}
                              className="mx-auto text-slate-300"
                            />

                            <p className="mt-2 text-xs font-bold text-slate-600">
                              {assignTargetMode === "class-section" &&
                              (!assignClassFilter || !assignSectionFilter)
                                ? "Choose a class and section"
                                : "No students found"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Homework Document
                </label>

                <div
                  className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50/30 px-5 py-6 text-center transition hover:bg-blue-50/60"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();

                    handleAssignAttachmentFile(
                      event.dataTransfer.files?.[0] ?? null,
                    );
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B40A1] text-white shadow-sm">
                    <UploadCloud size={22} />
                  </div>

                  <p className="mt-3 text-sm font-black text-slate-800">
                    Upload Homework Document
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Add a question paper, worksheet, instructions, notes or
                    reference file
                  </p>

                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-black text-[#0B40A1] shadow-sm transition hover:bg-blue-50">
                    <FileUp size={15} />

                    {assignAttachmentFile
                      ? "Change Document"
                      : "Choose Document"}

                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                      className="hidden"
                      onChange={(event) => {
                        handleAssignAttachmentFile(
                          event.target.files?.[0] ?? null,
                        );

                        event.target.value = "";
                      }}
                    />
                  </label>

                  <p className="mt-3 text-[10px] text-slate-400">
                    PDF, DOC, DOCX, PPT, XLS, images and TXT · Maximum 4 MB
                  </p>
                </div>

                {assignAttachmentFile ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0B40A1] shadow-sm">
                        <Paperclip size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-slate-800">
                          {assignAttachmentFile.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {formatFileSize(assignAttachmentFile.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAssignAttachmentFile(null)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove homework document"
                      title="Remove document"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : null}
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
                  disabled={
                    assigning ||
                    assignUploadingDocument ||
                    assignStudentIds.length === 0 ||
                    !assignTitle.trim() ||
                    !assignDueDate
                  }
                  className="btn-action btn-md font-bold flex-1"
                >
                  {assigning ? (
                    <>
                      <Loader2 size={15} className="mr-2 animate-spin" />

                      {assignUploadingDocument
                        ? "Uploading Document..."
                        : "Creating Task..."}
                    </>
                  ) : (
                    <>
                      <Plus size={15} className="mr-2" />
                      Assign to {assignStudentIds.length}{" "}
                      {assignStudentIds.length === 1 ? "Student" : "Students"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeAssignModal}
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
                  Marks Awarded — Maximum {gradeModal.maxMarks}
                </label>

                <input
                  type="number"
                  min={0}
                  max={gradeModal.maxMarks}
                  value={gradeMarks}
                  onChange={(event) =>
                    setGradeMarks(
                      Math.max(
                        0,
                        Math.min(
                          gradeModal.maxMarks,
                          Number(event.target.value) || 0,
                        ),
                      ),
                    )
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
    </section>
  );
}
