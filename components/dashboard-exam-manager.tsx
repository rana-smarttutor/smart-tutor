"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Archive,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Send,
} from "lucide-react";

import type {
  ExamType,
  ManagedUser,
  MessageItem,
  Role,
  SessionUser,
  TestItem,
  TestSubmission,
} from "@/lib/types";

type DashboardExamManagerProps = {
  session: SessionUser | null;
  role: Role;
  initialTests: TestItem[];
  submissions: TestSubmission[];
  studentDirectory: ManagedUser[];

  onSubmissionsChange: (
    submissions: TestSubmission[],
  ) => void;

  onMessagePublished: (
    message: MessageItem,
  ) => void;

  onDashboardRefresh?: () => void;
};

type DraftQuestion = {
  id: string;
  prompt: string;
  options: string[];
  optionCount: 2 | 4;
};

const EXAM_TYPE_OPTIONS: {
  id: ExamType;
  label: string;
}[] = [
  {
    id: "unit-1",
    label: "Unit 1",
  },
  {
    id: "semester-1",
    label: "Semester 1",
  },
  {
    id: "unit-2",
    label: "Unit 2",
  },
  {
    id: "semester-2",
    label: "Semester 2",
  },
];

function createQuestion(
  index: number,
  optionCount: 2 | 4 = 4,
): DraftQuestion {
  return {
    id: `draft-question-${index + 1}`,
    prompt: "",
    options: [
      "",
      "",
      "",
      "",
    ],
    optionCount,
  };
}

function getExamType(
  test: TestItem,
): ExamType {
  return (
    test.examType ??
    "unit-1"
  );
}

function getExamTypeLabel(
  examType: ExamType,
) {
  return (
    EXAM_TYPE_OPTIONS.find(
      (option) =>
        option.id ===
        examType,
    )?.label ??
    "Unit 1"
  );
}

function getExamStatus(
  test: TestItem,
):
  | "live"
  | "upcoming"
  | "draft"
  | "completed" {
  if (
    test.status ===
    "Assigned"
  ) {
    return "live";
  }

  if (
    test.status ===
    "Draft"
  ) {
    return "draft";
  }

  if (
    test.status ===
      "Completed" ||
    test.status ===
      "Graded"
  ) {
    return "completed";
  }

  return "draft";
}

function getStatusBadgeClass(
  status: string,
) {
  switch (status) {
    case "live":
      return "status-badge-live";

    case "upcoming":
      return "status-badge-upcoming";

    case "draft":
      return "status-badge-draft";

    case "completed":
      return "status-badge-completed";

    default:
      return "status-badge-draft";
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
  const [
    tests,
    setTests,
  ] =
    useState<TestItem[]>(
      initialTests,
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    summary,
    setSummary,
  ] =
    useState("");

  const [
    examType,
    setExamType,
  ] =
    useState<ExamType>(
      "unit-1",
    );

  const [
    selectedExamType,
    setSelectedExamType,
  ] =
    useState<ExamType>(
      "unit-1",
    );

  const [
    selectedStudents,
    setSelectedStudents,
  ] =
    useState<string[]>(
      [],
    );

  const [
    questions,
    setQuestions,
  ] =
    useState<
      DraftQuestion[]
    >([
      createQuestion(
        0,
        4,
      ),
    ]);

  const [
    activeTestId,
    setActiveTestId,
  ] =
    useState<
      string | null
    >(null);

  const [
    answers,
    setAnswers,
  ] =
    useState<number[]>(
      [],
    );

  const [
    gradingSubmissionId,
    setGradingSubmissionId,
  ] =
    useState<
      string | null
    >(null);

  const [
    gradeScore,
    setGradeScore,
  ] =
    useState("");

  const [
    gradeFeedback,
    setGradeFeedback,
  ] =
    useState("");

  const [
    statusMsg,
    setStatusMsg,
  ] =
    useState("");

  const [
    statusTab,
    setStatusTab,
  ] =
    useState("all");

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const [
    showCreateForm,
    setShowCreateForm,
  ] =
    useState(false);

  const [
    showQuestionBank,
    setShowQuestionBank,
  ] =
    useState(false);

  const [
    editingTestId,
    setEditingTestId,
  ] =
    useState<
      string | null
    >(null);

  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] =
    useState<
      string | null
    >(null);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      string | null
    >(null);

  const isFaculty =
    role ===
      "educator" ||
    role ===
      "admin";

  const assignedTests =
    useMemo(() => {
      if (
        role !==
          "student" ||
        !session
      ) {
        return [];
      }

      return tests.filter(
        (test) =>
          test.assignedUserIds?.includes(
            session.id,
          ),
      );
    }, [
      role,
      session,
      tests,
    ]);

  const selectedStudentTests =
    useMemo(
      () =>
        assignedTests.filter(
          (test) =>
            getExamType(
              test,
            ) ===
            selectedExamType,
        ),
      [
        assignedTests,
        selectedExamType,
      ],
    );

  const selectedStudentTestIds =
    useMemo(
      () =>
        new Set(
          selectedStudentTests.map(
            (test) =>
              test.id,
          ),
        ),
      [
        selectedStudentTests,
      ],
    );

  const selectedStudentSubmissions =
    useMemo(
      () =>
        submissions.filter(
          (submission) =>
            selectedStudentTestIds.has(
              submission.testId,
            ),
        ),
      [
        submissions,
        selectedStudentTestIds,
      ],
    );

  const studentExamStats =
    useMemo(() => {
      const completed =
        selectedStudentTests.filter(
          (test) =>
            selectedStudentSubmissions.some(
              (submission) =>
                submission.testId ===
                  test.id &&
                (
                  submission.status ===
                    "graded" ||
                  submission.status ===
                    "published"
                ),
            ),
        ).length;

      const pending =
        Math.max(
          0,
          selectedStudentTests.length -
            completed,
        );

      const graded =
        selectedStudentSubmissions.filter(
          (submission) =>
            submission.score !==
            null,
        );

      const average =
        graded.length >
        0
          ? Math.round(
              graded.reduce(
                (
                  total,
                  submission,
                ) =>
                  total +
                  ((submission.score ??
                    0) /
                    submission.total) *
                    100,
                0,
              ) /
                graded.length,
            )
          : null;

      return {
        total:
          selectedStudentTests.length,

        completed,

        pending,

        average,
      };
    }, [
      selectedStudentTests,
      selectedStudentSubmissions,
    ]);

  const activeTest =
    tests.find(
      (test) =>
        test.id ===
        activeTestId,
    ) ?? null;

  const pendingSubmissions =
    submissions.filter(
      (submission) =>
        submission.status ===
        "submitted",
    );

  const gradingSubmission =
    submissions.find(
      (submission) =>
        submission.id ===
        gradingSubmissionId,
    ) ?? null;

  const gradingTest =
    tests.find(
      (test) =>
        test.id ===
        gradingSubmission
          ?.testId,
    ) ?? null;

  const filteredTests =
    useMemo(() => {
      let list =
        isFaculty
          ? tests
          : selectedStudentTests;

      if (
        statusTab !==
        "all"
      ) {
        list =
          list.filter(
            (test) =>
              getExamStatus(
                test,
              ) ===
              statusTab,
          );
      }

      if (
        searchQuery.trim()
      ) {
        const query =
          searchQuery
            .trim()
            .toLowerCase();

        list =
          list.filter(
            (test) =>
              test.title
                .toLowerCase()
                .includes(
                  query,
                ) ||
              test.summary
                ?.toLowerCase()
                .includes(
                  query,
                ),
          );
      }

      return list;
    }, [
      tests,
      selectedStudentTests,
      statusTab,
      searchQuery,
      isFaculty,
    ]);

  const stats =
    useMemo(() => {
      const total =
        tests.length;

      const draft =
        tests.filter(
          (test) =>
            getExamStatus(
              test,
            ) ===
            "draft",
        ).length;

      const live =
        tests.filter(
          (test) =>
            getExamStatus(
              test,
            ) ===
            "live",
        ).length;

      const upcoming =
        tests.filter(
          (test) =>
            getExamStatus(
              test,
            ) ===
            "upcoming",
        ).length;

      const completed =
        tests.filter(
          (test) =>
            getExamStatus(
              test,
            ) ===
            "completed",
        ).length;

      return {
        total,
        draft,
        live,
        upcoming,
        completed,
      };
    }, [
      tests,
    ]);

  function resetExamForm() {
    setEditingTestId(
      null,
    );

    setTitle("");

    setSummary("");

    setExamType(
      "unit-1",
    );

    setSelectedStudents(
      [],
    );

    setQuestions([
      createQuestion(
        0,
        4,
      ),
    ]);
  }

  function handleOpenCreateForm() {
    resetExamForm();

    setStatusMsg("");

    setShowCreateForm(
      true,
    );
  }

  async function handleCreateTest() {
    const response =
      await fetch(
        "/api/tests",
        {
          method:
            "POST",

          credentials:
            "same-origin",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              title,

              summary,

              examType,

              status:
                "Assigned",

              assignedUserIds:
                selectedStudents,

              questions:
                questions.map(
                  (
                    question,
                  ) => ({
                    id:
                      question.id,

                    prompt:
                      question.prompt,

                    options:
                      question.options.slice(
                        0,
                        question.optionCount,
                      ),
                  }),
                ),
            }),
        },
      );

    if (
      !response.ok
    ) {
      const data =
        (await response
          .json()
          .catch(
            () => null,
          )) as
          | {
              error?: string;
            }
          | null;

      setStatusMsg(
        data?.error ||
          "Exam could not be created.",
      );

      return;
    }

    const data =
      (await response.json()) as {
        test: TestItem;
      };

    setTests(
      (current) => [
        data.test,
        ...current,
      ],
    );

    resetExamForm();

    setShowCreateForm(
      false,
    );

    setStatusMsg(
      "Exam created and assigned successfully.",
    );

    onDashboardRefresh?.();
  }

  async function handleSubmitTest() {
    if (
      !activeTest
    ) {
      return;
    }

    const response =
      await fetch(
        "/api/test-submissions",
        {
          method:
            "POST",

          credentials:
            "same-origin",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              testId:
                activeTest.id,

              answers,
            }),
        },
      );

    if (
      !response.ok
    ) {
      setStatusMsg(
        "Submission failed.",
      );

      return;
    }

    const data =
      (await response.json()) as {
        submission:
          TestSubmission;
      };

    onSubmissionsChange([
      data.submission,
      ...submissions,
    ]);

    setActiveTestId(
      null,
    );

    setAnswers([]);

    setStatusMsg(
      "Exam submitted for review.",
    );

    onDashboardRefresh?.();
  }

  async function handleGradeSubmission() {
    if (
      !gradingSubmissionId
    ) {
      return;
    }

    const response =
      await fetch(
        "/api/test-submissions",
        {
          method:
            "PATCH",

          credentials:
            "same-origin",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              submissionId:
                gradingSubmissionId,

              score:
                Number(
                  gradeScore,
                ),

              feedback:
                gradeFeedback,
            }),
        },
      );

    if (
      !response.ok
    ) {
      setStatusMsg(
        "Grading failed.",
      );

      return;
    }

    const data =
      (await response.json()) as {
        submission:
          TestSubmission;

        message:
          MessageItem;
      };

    onSubmissionsChange(
      submissions.map(
        (
          submission,
        ) =>
          submission.id ===
          gradingSubmissionId
            ? data.submission
            : submission,
      ),
    );

    onMessagePublished(
      data.message,
    );

    setGradingSubmissionId(
      null,
    );

    setGradeScore("");

    setGradeFeedback("");

    setStatusMsg(
      "Result graded and published.",
    );
  }

  function handleStartEdit(
    test: TestItem,
  ) {
    setEditingTestId(
      test.id,
    );

    setTitle(
      test.title,
    );

    setSummary(
      test.summary ??
        "",
    );

    setExamType(
      getExamType(
        test,
      ),
    );

    setSelectedStudents(
      test.assignedUserIds ??
        [],
    );

    setQuestions(
      test.questions?.map(
        (
          question,
        ) => ({
          id:
            question.id,

          prompt:
            question.prompt,

          options:
            question.options
              .length ===
            2
              ? [
                  ...question.options,
                  "",
                  "",
                ]
              : [
                  ...question.options,
                ],

          optionCount:
            question.options
              .length ===
            2
              ? 2
              : 4,
        }),
      ) ?? [
        createQuestion(
          0,
          4,
        ),
      ],
    );

    setShowCreateForm(
      true,
    );

    setStatusMsg("");
  }

  function handleCancelEdit() {
    resetExamForm();

    setShowCreateForm(
      false,
    );

    setStatusMsg("");
  }

  async function handleUpdateTest() {
    if (
      !editingTestId
    ) {
      return;
    }

    const response =
      await fetch(
        `/api/tests/${editingTestId}`,
        {
          method:
            "PUT",

          credentials:
            "same-origin",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              title,

              summary,

              examType,

              assignedUserIds:
                selectedStudents,

              questions:
                questions.map(
                  (
                    question,
                  ) => ({
                    id:
                      question.id,

                    prompt:
                      question.prompt,

                    options:
                      question.options.slice(
                        0,
                        question.optionCount,
                      ),
                  }),
                ),
            }),
        },
      );

    if (
      !response.ok
    ) {
      const data =
        (await response
          .json()
          .catch(
            () => null,
          )) as
          | {
              error?: string;
            }
          | null;

      setStatusMsg(
        data?.error ||
          "Exam could not be updated.",
      );

      return;
    }

    const data =
      (await response.json()) as {
        test: TestItem;
      };

    setTests(
      (current) =>
        current.map(
          (test) =>
            test.id ===
            editingTestId
              ? data.test
              : test,
        ),
    );

    resetExamForm();

    setShowCreateForm(
      false,
    );

    setStatusMsg(
      "Exam updated successfully.",
    );

    onDashboardRefresh?.();
  }

  async function handleDeleteTest(
    testId: string,
  ) {
    setDeletingId(
      testId,
    );

    try {
      const response =
        await fetch(
          `/api/tests/${testId}`,
          {
            method:
              "DELETE",

            credentials:
              "same-origin",
          },
        );

      if (
        !response.ok
      ) {
        setStatusMsg(
          "Exam could not be deleted.",
        );

        return;
      }

      setTests(
        (current) =>
          current.filter(
            (test) =>
              test.id !==
              testId,
          ),
      );

      setShowDeleteConfirm(
        null,
      );

      setStatusMsg(
        "Exam deleted.",
      );

      onDashboardRefresh?.();
    } finally {
      setDeletingId(
        null,
      );
    }
  }

  const statusTabs = [
    {
      id: "all",
      label: "All",
    },
    {
      id: "live",
      label: "Live",
    },
    {
      id: "upcoming",
      label:
        "Upcoming",
    },
    {
      id: "draft",
      label: "Draft",
    },
    {
      id: "completed",
      label:
        "Completed",
    },
  ];

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">
            Exams
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            {isFaculty
              ? "Exam Management"
              : "My Exams"}
          </h2>

          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {isFaculty
              ? "Create, manage and analyse all assessments"
              : "Choose an exam and complete your assigned assessments"}
          </p>
        </div>
      </div>

      {/* Student View */}
      {role ===
        "student" && (
        <div className="grid gap-6">
          {/* Exam Type Selector */}
          <div className="surface-soft rounded-[1.75rem] border border-[var(--color-border)] p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Select Exam
              </p>

              <h3 className="mt-1 text-base font-bold text-[var(--color-heading)]">
                Choose your examination
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {EXAM_TYPE_OPTIONS.map(
                (
                  option,
                ) => {
                  const isSelected =
                    selectedExamType ===
                    option.id;

                  return (
                    <button
                      key={
                        option.id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedExamType(
                          option.id,
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-heading)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      }`}
                    >
                      {
                        option.label
                      }
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Student Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "var(--primary-grad-12-3)",

                  color:
                    "var(--primary)",
                }}
              >
                <FileText
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Total Exams
                </div>

                <div className="exam-stat-value">
                  {
                    studentExamStats.total
                  }
                </div>
              </div>
            </div>

            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "#ECFDF5",

                  color:
                    "#10B981",
                }}
              >
                <CheckCircle
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Completed
                </div>

                <div className="exam-stat-value">
                  {
                    studentExamStats.completed
                  }
                </div>
              </div>
            </div>

            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "#EFF6FF",

                  color:
                    "#1D4ED8",
                }}
              >
                <Clock
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Pending
                </div>

                <div className="exam-stat-value">
                  {
                    studentExamStats.pending
                  }
                </div>
              </div>
            </div>

            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "#F5F3FF",

                  color:
                    "#5B21B6",
                }}
              >
                <BookOpen
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Avg. Score
                </div>

                <div className="exam-stat-value">
                  {studentExamStats.average ===
                  null
                    ? "—"
                    : `${studentExamStats.average}%`}
                </div>
              </div>
            </div>
          </div>

          {/* Student Exam List */}
          {selectedStudentTests.length ===
          0 ? (
            <div className="surface-soft rounded-[1.75rem] py-12 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--primary-3)]">
                <FileText
                  size={36}
                  style={{
                    color:
                      "var(--primary)",
                  }}
                />
              </div>

              <h5 className="mb-2 text-lg font-bold text-[var(--color-heading)]">
                No{" "}
                {getExamTypeLabel(
                  selectedExamType,
                )}{" "}
                exams assigned yet
              </h5>

              <p className="text-sm text-[var(--color-muted)]">
                {getExamTypeLabel(
                  selectedExamType,
                )}{" "}
                exams will appear here once assigned by faculty.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTests.map(
                (
                  test,
                ) => {
                  const submission =
                    submissions.find(
                      (
                        item,
                      ) =>
                        item.testId ===
                        test.id,
                    );

                  const isSubmitted =
                    submission?.status ===
                    "submitted";

                  const isGraded =
                    submission?.status ===
                      "graded" ||
                    submission?.status ===
                      "published";

                  return (
                    <div
                      key={
                        test.id
                      }
                      className="exam-card p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-primary)]">
                              {getExamTypeLabel(
                                getExamType(
                                  test,
                                ),
                              )}
                            </span>
                          </div>

                          <h4 className="truncate text-base font-bold text-[var(--color-heading)]">
                            {
                              test.title
                            }
                          </h4>

                          <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted)]">
                            {
                              test.summary
                            }
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="meta-chip">
                              <FileText
                                size={12}
                              />

                              {test.questions
                                ?.length ??
                                0}{" "}
                              questions
                            </span>

                            {test.subject ? (
                              <span className="meta-chip">
                                <BookOpen
                                  size={12}
                                />

                                {
                                  test.subject
                                }
                              </span>
                            ) : null}

                            {test.duration ? (
                              <span className="meta-chip">
                                <Clock
                                  size={12}
                                />

                                {
                                  test.duration
                                }{" "}
                                min
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {isGraded ? (
                            <span className="status-badge-completed rounded-full px-3 py-1 text-xs font-bold">
                              <CheckCircle
                                size={10}
                                className="mr-1 inline"
                              />

                              Graded
                            </span>
                          ) : isSubmitted ? (
                            <span className="status-badge-upcoming rounded-full px-3 py-1 text-xs font-bold">
                              <Send
                                size={10}
                                className="mr-1 inline"
                              />

                              Submitted
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTestId(
                                  test.id,
                                );

                                setAnswers(
                                  new Array(
                                    test.questions
                                      ?.length ??
                                      0,
                                  ).fill(
                                    -1,
                                  ),
                                );
                              }}
                              className="btn-action btn-sm font-bold"
                            >
                              Start Exam
                            </button>
                          )}
                        </div>
                      </div>

                      {isGraded &&
                      submission ? (
                        <div className="mt-3 flex items-center gap-4 border-t border-[var(--color-border)] pt-3 text-sm">
                          <span className="font-bold text-[var(--color-heading)]">
                            Score:{" "}

                            <span className="text-emerald-600">
                              {
                                submission.score
                              }
                              /
                              {
                                submission.total
                              }
                            </span>
                          </span>

                          {submission.feedback ? (
                            <span className="text-[var(--color-muted)]">
                              “
                              {
                                submission.feedback
                              }
                              ”
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                },
              )}
            </div>
          )}

          {/* Graded Results */}
          {selectedStudentSubmissions.filter(
            (
              submission,
            ) =>
              submission.score !==
              null,
          ).length >
          0 ? (
            <div className="surface-soft rounded-[1.75rem] p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                {getExamTypeLabel(
                  selectedExamType,
                )}{" "}
                Results
              </h3>

              <div className="grid gap-3">
                {selectedStudentSubmissions
                  .filter(
                    (
                      submission,
                    ) =>
                      submission.score !==
                      null,
                  )
                  .map(
                    (
                      submission,
                    ) => {
                      const test =
                        tests.find(
                          (
                            item,
                          ) =>
                            item.id ===
                            submission.testId,
                        );

                      return (
                        <div
                          key={
                            submission.id
                          }
                          className="exam-card p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-[var(--color-heading)]">
                                {test?.title ??
                                  "Unknown Exam"}
                              </p>

                              <p className="mt-1 text-xs text-[var(--color-muted)]">
                                {
                                  submission.studentName
                                }
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-black text-emerald-600">
                                {
                                  submission.score
                                }
                                /
                                {
                                  submission.total
                                }
                              </p>

                              {submission.feedback ? (
                                <p className="mt-1 text-xs text-[var(--color-muted)]">
                                  {
                                    submission.feedback
                                  }
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
              </div>
            </div>
          ) : null}

          {/* Active Exam Modal */}
          {activeTest ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() =>
                setActiveTestId(
                  null,
                )
              }
            >
              <div
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(
                  event,
                ) =>
                  event.stopPropagation()
                }
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-bold text-[var(--color-primary)]">
                      {getExamTypeLabel(
                        getExamType(
                          activeTest,
                        ),
                      )}
                    </span>

                    <h3 className="mt-3 text-xl font-bold text-[var(--color-heading)]">
                      {
                        activeTest.title
                      }
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTestId(
                        null,
                      )
                    }
                    className="text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                  >
                    ×
                  </button>
                </div>

                <div className="grid gap-5">
                  {activeTest.questions?.map(
                    (
                      question,
                      questionIndex,
                    ) => (
                      <div
                        key={
                          question.id
                        }
                        className="surface-soft rounded-2xl p-4"
                      >
                        <p className="mb-3 text-sm font-bold text-[var(--color-heading)]">
                          <span className="mr-2 text-[var(--color-muted)]">
                            Q
                            {questionIndex +
                              1}
                            .
                          </span>

                          {
                            question.prompt
                          }
                        </p>

                        <div className="grid gap-2">
                          {question.options.map(
                            (
                              option,
                              optionIndex,
                            ) => (
                              <button
                                key={`${question.id}-${optionIndex}`}
                                type="button"
                                onClick={() =>
                                  setAnswers(
                                    (
                                      current,
                                    ) =>
                                      current.map(
                                        (
                                          answer,
                                          index,
                                        ) =>
                                          index ===
                                          questionIndex
                                            ? optionIndex
                                            : answer,
                                      ),
                                  )
                                }
                                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                                  answers[
                                    questionIndex
                                  ] ===
                                  optionIndex
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                                    : "border-[var(--color-border)] bg-white/60 text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                                }`}
                              >
                                <span className="mr-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
                                  {String.fromCharCode(
                                    65 +
                                      optionIndex,
                                  )}
                                </span>

                                {
                                  option
                                }
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={
                      handleSubmitTest
                    }
                    className="btn-action btn-md flex-1 font-bold"
                  >
                    <Send
                      size={14}
                      className="mr-2"
                    />

                    Submit Exam
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTestId(
                        null,
                      )
                    }
                    className="btn-surface btn-md font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {statusMsg ? (
                  <p className="mt-4 text-sm font-semibold text-[var(--color-heading)]">
                    {
                      statusMsg
                    }
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Faculty / Admin View */}
      {isFaculty ? (
        <div className="grid gap-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "var(--primary-grad-12-3)",

                  color:
                    "var(--primary)",
                }}
              >
                <FileText
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Total Exams
                </div>

                <div className="exam-stat-value">
                  {
                    stats.total
                  }
                </div>
              </div>
            </div>

            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "#F8FAFC",

                  color:
                    "#64748B",
                }}
              >
                <Archive
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Drafts
                </div>

                <div className="exam-stat-value">
                  {
                    stats.draft
                  }
                </div>
              </div>
            </div>

            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "#EFF6FF",

                  color:
                    "#1D4ED8",
                }}
              >
                <Clock
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Upcoming
                </div>

                <div className="exam-stat-value">
                  {
                    stats.upcoming
                  }
                </div>
              </div>
            </div>

            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "#ECFDF5",

                  color:
                    "#10B981",
                }}
              >
                <CheckCircle
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Live
                </div>

                <div className="exam-stat-value">
                  {
                    stats.live
                  }
                </div>
              </div>
            </div>

            <div className="exam-stat">
              <div
                className="exam-stat-icon"
                style={{
                  background:
                    "#F5F3FF",

                  color:
                    "#5B21B6",
                }}
              >
                <BookOpen
                  size={18}
                />
              </div>

              <div>
                <div className="exam-stat-label">
                  Completed
                </div>

                <div className="exam-stat-value">
                  {
                    stats.completed
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  handleOpenCreateForm
                }
                className="btn-action btn-md font-bold"
              >
                <Plus
                  size={15}
                  className="mr-2"
                />

                Create Exam
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowQuestionBank(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
                className="btn-surface btn-md font-bold"
              >
                <Archive
                  size={15}
                  className="mr-2"
                />

                Question Bank
              </button>
            </div>

            {statusMsg ? (
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {
                  statusMsg
                }
              </p>
            ) : null}
          </div>

          {/* Filter Bar */}
          <div className="surface-soft rounded-[1.75rem] p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={
                  searchQuery
                }
                onChange={(
                  event,
                ) =>
                  setSearchQuery(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Search exams..."
                className="surface flex-1 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />

              <select className="surface min-w-[140px] rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none">
                <option value="">
                  All Batches
                </option>
              </select>

              <select className="surface min-w-[140px] rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none">
                <option value="">
                  All Subjects
                </option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="tab-pills flex flex-wrap gap-2">
            {statusTabs.map(
              (
                tab,
              ) => (
                <button
                  key={
                    tab.id
                  }
                  type="button"
                  onClick={() =>
                    setStatusTab(
                      tab.id,
                    )
                  }
                  className={`tab-pill ${
                    statusTab ===
                    tab.id
                      ? "active"
                      : ""
                  }`}
                >
                  {
                    tab.label
                  }
                </button>
              ),
            )}
          </div>

          {/* Create / Edit Form */}
          {showCreateForm ? (
            <div className="surface-soft rounded-[1.75rem] border border-[var(--color-border)] p-5">
              <h3 className="mb-4 text-base font-bold text-[var(--color-heading)]">
                {editingTestId
                  ? "Edit Exam"
                  : "Create New Exam"}
              </h3>

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--color-heading)]">
                    Exam Type
                  </span>

                  <select
                    value={
                      examType
                    }
                    onChange={(
                      event,
                    ) =>
                      setExamType(
                        event
                          .target
                          .value as ExamType,
                      )
                    }
                    className="surface rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  >
                    {EXAM_TYPE_OPTIONS.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.id
                          }
                          value={
                            option.id
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <input
                  value={
                    title
                  }
                  onChange={(
                    event,
                  ) =>
                    setTitle(
                      event.target.value.slice(
                        0,
                        80,
                      ),
                    )
                  }
                  placeholder="Exam title"
                  className="surface rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
                />

                <textarea
                  value={
                    summary
                  }
                  onChange={(
                    event,
                  ) =>
                    setSummary(
                      event.target.value.slice(
                        0,
                        220,
                      ),
                    )
                  }
                  placeholder="Exam description / summary"
                  rows={2}
                  className="surface rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
                />

                <div className="rounded-2xl border border-[var(--color-border)] p-4">
                  <p className="mb-3 text-sm font-semibold text-[var(--color-heading)]">
                    Assign to students
                  </p>

                  <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                    {studentDirectory.map(
                      (
                        student,
                      ) => (
                        <label
                          key={
                            student.id
                          }
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-[var(--color-surface-soft)]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(
                              student.id,
                            )}
                            onChange={(
                              event,
                            ) =>
                              setSelectedStudents(
                                (
                                  current,
                                ) =>
                                  event
                                    .target
                                    .checked
                                    ? [
                                        ...current,
                                        student.id,
                                      ]
                                    : current.filter(
                                        (
                                          id,
                                        ) =>
                                          id !==
                                          student.id,
                                      ),
                              )
                            }
                            className="rounded"
                          />

                          {
                            student.name
                          }
                        </label>
                      ),
                    )}
                  </div>
                </div>

                {/* Questions */}
                {questions.map(
                  (
                    question,
                    questionIndex,
                  ) => (
                    <div
                      key={
                        question.id
                      }
                      className="rounded-2xl border border-[var(--color-border)] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[var(--color-heading)]">
                          Question{" "}
                          {questionIndex +
                            1}
                        </p>

                        <select
                          value={
                            question.optionCount
                          }
                          onChange={(
                            event,
                          ) =>
                            setQuestions(
                              (
                                current,
                              ) =>
                                current.map(
                                  (
                                    item,
                                    index,
                                  ) =>
                                    index ===
                                    questionIndex
                                      ? {
                                          ...item,

                                          optionCount:
                                            Number(
                                              event
                                                .target
                                                .value,
                                            ) as
                                              | 2
                                              | 4,
                                        }
                                      : item,
                                ),
                            )
                          }
                          className="surface rounded-xl px-3 py-1.5 text-xs outline-none"
                        >
                          <option value={2}>
                            2 Options
                          </option>

                          <option value={4}>
                            4 Options
                          </option>
                        </select>
                      </div>

                      <input
                        value={
                          question.prompt
                        }
                        onChange={(
                          event,
                        ) =>
                          setQuestions(
                            (
                              current,
                            ) =>
                              current.map(
                                (
                                  item,
                                  index,
                                ) =>
                                  index ===
                                  questionIndex
                                    ? {
                                        ...item,

                                        prompt:
                                          event.target.value.slice(
                                            0,
                                            120,
                                          ),
                                      }
                                    : item,
                              ),
                          )
                        }
                        placeholder="Enter question"
                        className="surface w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
                      />

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {question.options
                          .slice(
                            0,
                            question.optionCount,
                          )
                          .map(
                            (
                              option,
                              optionIndex,
                            ) => (
                              <input
                                key={`${question.id}-${optionIndex}`}
                                value={
                                  option
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setQuestions(
                                    (
                                      current,
                                    ) =>
                                      current.map(
                                        (
                                          item,
                                          index,
                                        ) =>
                                          index ===
                                          questionIndex
                                            ? {
                                                ...item,

                                                options:
                                                  item.options.map(
                                                    (
                                                      currentOption,
                                                      currentOptionIndex,
                                                    ) =>
                                                      currentOptionIndex ===
                                                      optionIndex
                                                        ? event.target.value.slice(
                                                            0,
                                                            60,
                                                          )
                                                        : currentOption,
                                                  ),
                                              }
                                            : item,
                                      ),
                                  )
                                }
                                placeholder={`Option ${String.fromCharCode(
                                  65 +
                                    optionIndex,
                                )}`}
                                className="surface rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
                              />
                            ),
                          )}
                      </div>
                    </div>
                  ),
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions(
                        (
                          current,
                        ) => [
                          ...current,

                          createQuestion(
                            current.length,
                            4,
                          ),
                        ],
                      )
                    }
                    className="btn-surface btn-sm font-bold"
                  >
                    + Add Question
                  </button>

                  <button
                    type="button"
                    onClick={
                      editingTestId
                        ? handleUpdateTest
                        : handleCreateTest
                    }
                    className="btn-action btn-md font-bold"
                  >
                    <Send
                      size={14}
                      className="mr-2"
                    />

                    {editingTestId
                      ? "Save Changes"
                      : "Create & Assign"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleCancelEdit
                    }
                    className="btn-surface btn-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Exam Grid */}
          {filteredTests.length ===
          0 ? (
            <div className="surface-soft rounded-[1.75rem] py-12 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--primary-3)]">
                <FileText
                  size={36}
                  style={{
                    color:
                      "var(--primary)",
                  }}
                />
              </div>

              <h5 className="mb-2 text-lg font-bold text-[var(--color-heading)]">
                No exams yet
              </h5>

              <p className="mb-4 text-sm text-[var(--color-muted)]">
                Create your first exam to get started
              </p>

              <button
                type="button"
                onClick={
                  handleOpenCreateForm
                }
                className="btn-action btn-md font-bold"
              >
                <Plus
                  size={15}
                  className="mr-2"
                />

                Create First Exam
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredTests.map(
                (
                  test,
                ) => {
                  const status =
                    getExamStatus(
                      test,
                    );

                  const statusLabels: Record<
                    string,
                    string
                  > = {
                    live:
                      "● Live",

                    upcoming:
                      "Upcoming",

                    draft:
                      "Draft",

                    completed:
                      "Completed",
                  };

                  return (
                    <div
                      key={
                        test.id
                      }
                      className="exam-card p-0"
                    >
                      <div
                        className="exam-card-header"
                        style={{
                          background:
                            status ===
                            "live"
                              ? "#ECFDF5"
                              : status ===
                                  "upcoming"
                                ? "#EFF6FF"
                                : status ===
                                    "draft"
                                  ? "#F8FAFC"
                                  : "#F5F3FF",

                          borderBottom:
                            "1px solid var(--color-border)",

                          padding:
                            "18px 20px 14px",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={getStatusBadgeClass(
                              status,
                            )}
                          >
                            {
                              statusLabels[
                                status
                              ]
                            }
                          </span>

                          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-[var(--color-primary)]">
                            {getExamTypeLabel(
                              getExamType(
                                test,
                              ),
                            )}
                          </span>
                        </div>

                        <h4 className="mt-2 truncate text-base font-bold text-[var(--color-heading)]">
                          {
                            test.title
                          }
                        </h4>
                      </div>

                      <div className="p-4">
                        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
                          {
                            test.summary
                          }
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                          <span className="meta-chip">
                            <FileText
                              size={11}
                            />

                            {test.questions
                              ?.length ??
                              0}{" "}
                            Q
                          </span>

                          {test.duration ? (
                            <span className="meta-chip">
                              <Clock
                                size={11}
                              />

                              {
                                test.duration
                              }{" "}
                              min
                            </span>
                          ) : null}

                          <span className="meta-chip">
                            <CheckCircle
                              size={11}
                            />

                            {
                              submissions.filter(
                                (
                                  submission,
                                ) =>
                                  submission.testId ===
                                  test.id,
                              ).length
                            }{" "}
                            submissions
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleStartEdit(
                                test,
                              )
                            }
                            className="btn-surface btn-sm text-xs font-bold"
                          >
                            Edit
                          </button>

                          {showDeleteConfirm ===
                          test.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-red-600">
                                Delete this exam?
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteTest(
                                    test.id,
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  test.id
                                }
                                className="btn-action btn-sm bg-red-600 text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingId ===
                                test.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setShowDeleteConfirm(
                                    null,
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  test.id
                                }
                                className="btn-surface btn-sm text-xs font-bold disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setShowDeleteConfirm(
                                  test.id,
                                )
                              }
                              className="btn-surface btn-sm border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          )}

                          {pendingSubmissions.some(
                            (
                              submission,
                            ) =>
                              submission.testId ===
                              test.id,
                          ) ? (
                            <button
                              type="button"
                              onClick={() => {
                                const submission =
                                  pendingSubmissions.find(
                                    (
                                      item,
                                    ) =>
                                      item.testId ===
                                      test.id,
                                  );

                                if (
                                  submission
                                ) {
                                  setGradingSubmissionId(
                                    submission.id,
                                  );
                                }
                              }}
                              className="btn-action btn-sm text-xs font-bold"
                            >
                              Grade
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}

          {/* Pending Grading */}
          {pendingSubmissions.length >
          0 ? (
            <div className="surface-soft rounded-[1.75rem] p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--color-secondary)]">
                Pending Grading (
                {
                  pendingSubmissions.length
                }
                )
              </h3>

              <div className="grid gap-3">
                {pendingSubmissions.map(
                  (
                    submission,
                  ) => {
                    const test =
                      tests.find(
                        (
                          item,
                        ) =>
                          item.id ===
                          submission.testId,
                      );

                    const isSelected =
                      gradingSubmissionId ===
                      submission.id;

                    return (
                      <button
                        key={
                          submission.id
                        }
                        type="button"
                        onClick={() =>
                          setGradingSubmissionId(
                            submission.id,
                          )
                        }
                        className={`exam-card p-4 text-left transition-all ${
                          isSelected
                            ? "ring-2 ring-[var(--color-secondary)]"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-[var(--color-heading)]">
                              {
                                submission.studentName
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                              {
                                test?.title
                              }
                            </p>
                          </div>

                          <AlertCircle
                            size={16}
                            className="text-amber-500"
                          />
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          ) : null}

          {/* Grading Window */}
          {gradingSubmission &&
          gradingTest ? (
            <div className="surface-soft rounded-[1.75rem] border border-[var(--color-secondary)] p-5">
              <h3 className="mb-4 text-base font-bold text-[var(--color-heading)]">
                Grading:{" "}
                {
                  gradingSubmission.studentName
                }
              </h3>

              <div className="grid gap-4">
                {gradingTest.questions?.map(
                  (
                    question,
                    questionIndex,
                  ) => (
                    <div
                      key={
                        question.id
                      }
                      className="surface rounded-2xl bg-white/40 p-4"
                    >
                      <p className="text-sm font-bold text-[var(--color-heading)]">
                        {
                          question.prompt
                        }
                      </p>

                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        Answer:{" "}

                        <span className="font-bold text-[var(--color-secondary)]">
                          {typeof gradingSubmission
                            .answers[
                            questionIndex
                          ] ===
                            "number" &&
                          gradingSubmission
                            .answers[
                            questionIndex
                          ] >=
                            0
                            ? question.options[
                                gradingSubmission
                                  .answers[
                                  questionIndex
                                ]
                              ]
                            : "No answer"}
                        </span>
                      </p>
                    </div>
                  ),
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={
                      gradeScore
                    }
                    onChange={(
                      event,
                    ) =>
                      setGradeScore(
                        event.target.value
                          .replace(
                            /[^0-9]/g,
                            "",
                          )
                          .slice(
                            0,
                            3,
                          ),
                      )
                    }
                    placeholder={`Score out of ${gradingSubmission.total}`}
                    className="surface flex-1 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
                  />

                  <input
                    value={
                      gradeFeedback
                    }
                    onChange={(
                      event,
                    ) =>
                      setGradeFeedback(
                        event.target.value.slice(
                          0,
                          200,
                        ),
                      )
                    }
                    placeholder="Feedback for student"
                    className="surface flex-[2] rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={
                      handleGradeSubmission
                    }
                    className="btn-action btn-md font-bold"
                  >
                    <CheckCircle
                      size={14}
                      className="mr-2"
                    />

                    Grade & Publish
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setGradingSubmissionId(
                        null,
                      )
                    }
                    className="btn-surface btn-md font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

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