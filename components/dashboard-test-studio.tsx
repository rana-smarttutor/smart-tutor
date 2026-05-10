"use client";

import { useMemo, useState } from "react";

import type { ManagedUser, MessageItem, Role, SessionUser, TestItem, TestSubmission } from "@/lib/types";

type DashboardTestStudioProps = {
  session: SessionUser | null;
  role: Role;
  initialTests: TestItem[];
  submissions: TestSubmission[];
  studentDirectory: ManagedUser[];
  onSubmissionsChange: (submissions: TestSubmission[]) => void;
  onMessagePublished: (message: MessageItem) => void;
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

export function DashboardTestStudio({
  session,
  role,
  initialTests,
  submissions,
  studentDirectory,
  onSubmissionsChange,
  onMessagePublished,
}: DashboardTestStudioProps) {
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
  const [status, setStatus] = useState("");

  const assignedTests = useMemo(() => {
    if (role !== "student" || !session) {
      return [];
    }

    return tests.filter((item) => item.assignedUserIds?.includes(session.id));
  }, [role, session, tests]);

  const activeTest = tests.find((item) => item.id === activeTestId) ?? null;
  const pendingSubmissions = submissions.filter((item) => item.status === "submitted");
  const gradingSubmission = submissions.find((item) => item.id === gradingSubmissionId) ?? null;
  const gradingTest = tests.find((item) => item.id === gradingSubmission?.testId) ?? null;

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
        questions: questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          options: question.options.slice(0, question.optionCount),
        })),
      }),
    });

    if (!response.ok) {
      setStatus("Test could not be created.");
      return;
    }

    const data = (await response.json()) as { test: TestItem };
    setTests((current) => [data.test, ...current]);
    setTitle("");
    setSummary("");
    setSelectedStudents([]);
    setQuestions([createQuestion(0, 4)]);
    setStatus("Targeted MCQ test created.");
  }

  async function handleSubmitTest() {
    if (!activeTest) {
      return;
    }

    const response = await fetch("/api/test-submissions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testId: activeTest.id,
        answers,
      }),
    });

    if (!response.ok) {
      setStatus("Submission could not be completed.");
      return;
    }

    const data = (await response.json()) as { submission: TestSubmission };
    onSubmissionsChange([data.submission, ...submissions]);
    setActiveTestId(null);
    setAnswers([]);
    setStatus("Submission sent for faculty review.");
  }

  async function handleGradeSubmission() {
    if (!gradingSubmissionId) {
      return;
    }

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
      setStatus("Submission could not be graded.");
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
    setStatus("Result graded and published to the student board.");
  }

  if (role === "student") {
    return (
      <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Assigned Tests</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              Complete and return assigned MCQs
            </h2>
          </div>
          <span className="pill">{assignedTests.length} assigned</span>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            {assignedTests.map((test) => (
              <div key={test.id} className="surface-soft rounded-3xl p-5">
                <p className="truncate text-lg font-semibold text-[var(--color-heading)]" title={test.title}>
                  {test.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{test.summary}</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTestId(test.id);
                    setAnswers(new Array(test.questions?.length ?? 0).fill(-1));
                  }}
                  className="btn-action btn-sm mt-4"
                >
                  Start Test
                </button>
              </div>
            ))}
          </div>

          <div className="surface-soft rounded-[1.75rem] p-5">
            {activeTest ? (
              <div className="grid gap-4">
                <p className="text-lg font-bold text-[var(--color-heading)]">{activeTest.title}</p>
                {activeTest.questions?.map((question, questionIndex) => (
                  <div key={question.id} className="surface rounded-3xl p-4 bg-white/40">
                    <p className="text-sm font-bold text-[var(--color-heading)]">{question.prompt}</p>
                    <div className="mt-3 grid gap-3">
                      {question.options.map((option, optionIndex) => (
                        <button
                          key={`${question.id}-${optionIndex}`}
                          type="button"
                          onClick={() =>
                            setAnswers((current) =>
                              current.map((item, index) => (index === questionIndex ? optionIndex : item)),
                            )
                          }
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                            answers[questionIndex] === optionIndex
                              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm"
                              : "border-[var(--color-border)] bg-white/60 text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button type="button" onClick={handleSubmitTest} className="btn-action btn-md w-full sm:w-auto font-bold">
                    Submit Test for Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTestId(null)}
                    className="btn-surface btn-md w-full sm:w-auto font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                Open any assigned test to answer 2-option or 4-option MCQs and send the response back for manual faculty review.
              </p>
            )}
            {status ? <p className="mt-4 text-sm font-semibold text-[var(--color-heading)]">{status}</p> : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">Test Studio</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            Create MCQ tests and grade manually
          </h2>
        </div>
        <span className="pill">{studentDirectory.length} students</span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="surface-soft rounded-[1.75rem] p-5">
          <div className="grid gap-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 80))}
              placeholder="Assessment title"
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            />
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value.slice(0, 220))}
              placeholder="Short summary for selected students"
              rows={3}
              className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
            />
            <div className="rounded-3xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-semibold text-[var(--color-heading)]">Assign to students</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {studentDirectory.map((student) => (
                  <label key={student.id} className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)]">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(event) =>
                        setSelectedStudents((current) =>
                          event.target.checked
                            ? [...current, student.id]
                            : current.filter((item) => item !== student.id),
                        )
                      }
                      className="mr-3"
                    />
                    {student.name}
                  </label>
                ))}
              </div>
            </div>

            {questions.map((question, index) => (
              <div key={question.id} className="rounded-3xl border border-[var(--color-border)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">Question {index + 1}</p>
                  <select
                    value={question.optionCount}
                    onChange={(event) =>
                      setQuestions((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, optionCount: Number(event.target.value) as 2 | 4 }
                            : item,
                        ),
                      )
                    }
                    className="surface-soft rounded-2xl px-4 py-2 text-sm text-[var(--color-heading)] outline-none"
                  >
                    <option value={2}>2 options</option>
                    <option value={4}>4 options</option>
                  </select>
                </div>
                <input
                  value={question.prompt}
                  onChange={(event) =>
                    setQuestions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, prompt: event.target.value.slice(0, 120) } : item,
                      ),
                    )
                  }
                  placeholder="Question prompt"
                  className="surface-soft mt-3 w-full rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {question.options.slice(0, question.optionCount).map((option, optionIndex) => (
                    <input
                      key={`${question.id}-${optionIndex}`}
                      value={option}
                      onChange={(event) =>
                        setQuestions((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  options: item.options.map((entry, entryIndex) =>
                                    entryIndex === optionIndex ? event.target.value.slice(0, 60) : entry,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setQuestions((current) => [...current, createQuestion(current.length, 4)])}
                className="btn-surface btn-sm text-[var(--color-primary)] font-bold"
              >
                + Add Next Question
              </button>
              <button type="button" onClick={handleCreateTest} className="btn-action btn-md w-full sm:w-auto font-bold">
                Create Targeted Test
              </button>
            </div>
            {status ? <p className="text-sm font-bold text-[var(--color-primary)]">{status}</p> : null}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="surface-soft rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)] mb-3">Pending manual grading</p>
            <div className="mt-4 grid gap-3">
              {pendingSubmissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setGradingSubmissionId(submission.id)}
                  className={`surface rounded-3xl p-4 text-left transition-all ${
                    gradingSubmissionId === submission.id 
                      ? "border-[var(--color-secondary)] bg-[var(--color-secondary-soft)]" 
                      : "hover:border-[var(--color-secondary)]"
                  }`}
                >
                  <p className="text-sm font-bold text-[var(--color-heading)]">{submission.studentName}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                    Awaiting faculty review and result publication.
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="surface-soft rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)] mb-3">Grading window</p>
            {gradingSubmission ? (
              <div className="mt-4 grid gap-3">
                <p className="text-sm font-bold text-[var(--color-heading)]">
                  {gradingSubmission.studentName}
                </p>
                {gradingTest ? (
                  <div className="grid gap-3">
                    {gradingTest.questions?.map((question, index) => (
                      <div key={question.id} className="surface rounded-3xl p-4 bg-white/40">
                        <p className="text-sm font-bold text-[var(--color-heading)]">{question.prompt}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          Selected answer:{" "}
                          <span className="font-bold text-[var(--color-secondary)]">
                            {typeof gradingSubmission.answers[index] === "number" &&
                            gradingSubmission.answers[index] >= 0
                              ? question.options[gradingSubmission.answers[index]]
                              : "No answer submitted"}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <input
                  value={gradeScore}
                  onChange={(event) => setGradeScore(event.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                  placeholder={`Score out of ${gradingSubmission.total}`}
                  className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-secondary)]"
                />
                <textarea
                  value={gradeFeedback}
                  onChange={(event) => setGradeFeedback(event.target.value.slice(0, 200))}
                  placeholder="Feedback for the student board"
                  rows={4}
                  className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] border border-[var(--color-border)] outline-none focus:border-[var(--color-secondary)]"
                />
                <button type="button" onClick={handleGradeSubmission} className="btn-action btn-secondary btn-md w-full font-bold">
                  Grade And Publish Result
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
                Select a submitted response to grade it manually and publish the result back to the student.
              </p>
            )}
          </div>

          <div className="surface-soft rounded-[1.75rem] p-5">
            <p className="text-sm font-semibold text-[var(--color-heading)]">Latest tests</p>
            <div className="mt-4 grid gap-3">
              {tests.slice(0, 4).map((test) => (
                <div key={test.id} className="surface rounded-3xl p-4">
                  <p className="truncate text-sm font-semibold text-[var(--color-heading)]" title={test.title}>
                    {test.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{test.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
