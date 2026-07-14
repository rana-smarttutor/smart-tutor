"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ManagedUser,
  Role,
  WeeklyTest,
  WeeklyTestResult,
} from "@/lib/types";

type WeeklyTestManagerProps = {
  role: Role;
  studentDirectory: ManagedUser[];
  userId?: string;
  linkedStudentId?: string;
  initialWeeklyTests?: WeeklyTest[];
};

type ResultDraft = {
  studentId: string;
  studentName: string;
  status: WeeklyTestResult["status"];
  obtainedMarks: string;
  remarks: string;
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const selectClass =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatTestDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPercentage(
  obtainedMarks: number | undefined,
  totalMarks: number,
) {
  if (
    typeof obtainedMarks !== "number" ||
    !Number.isFinite(obtainedMarks) ||
    totalMarks <= 0
  ) {
    return null;
  }

  return Math.round((obtainedMarks / totalMarks) * 100);
}

function createDraftResults(students: ManagedUser[]): ResultDraft[] {
  return students.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    status: "present",
    obtainedMarks: "",
    remarks: "",
  }));
}

export function WeeklyTestManager({
  role,
  studentDirectory,
  userId,
  linkedStudentId,
  initialWeeklyTests = [],
}: WeeklyTestManagerProps) {
  const canManage = role === "admin" || role === "educator";

  const [weeklyTests, setWeeklyTests] =
    useState<WeeklyTest[]>(initialWeeklyTests);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [testDate, setTestDate] = useState(getToday());
  const [totalMarks, setTotalMarks] = useState("100");
  const [publishNow, setPublishNow] = useState(false);
  const [results, setResults] = useState<ResultDraft[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const allStudents = useMemo(() => {
    return studentDirectory.filter(
      (student) => student.role === "student",
    );
  }, [studentDirectory]);

  const viewerStudentId =
    linkedStudentId ?? (role === "student" ? userId : undefined);

  const visibleWeeklyTests = useMemo(() => {
    if (canManage) {
      return weeklyTests;
    }

    if (!viewerStudentId) {
      return [];
    }

    return weeklyTests.filter((test) =>
      test.results.some((result) => result.studentId === viewerStudentId),
    );
  }, [canManage, viewerStudentId, weeklyTests]);



  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);

      try {
        const testsResponse = await fetch("/api/weekly-tests", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const testsPayload = (await testsResponse.json()) as {
          weeklyTests?: WeeklyTest[];
          error?: string;
        };

        if (!testsResponse.ok) {
          throw new Error(testsPayload.error ?? "Unable to load weekly tests.");
        }

        if (!cancelled) {
          setWeeklyTests(testsPayload.weeklyTests ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load weekly test information.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [canManage]);

  function updateResult(
    studentId: string,
    updates: Partial<ResultDraft>,
  ) {
    setResults((current) =>
      current.map((result) =>
        result.studentId === studentId
          ? {
              ...result,
              ...updates,
            }
          : result,
      ),
    );
  }

  function updateResultStatus(
    studentId: string,
    status: WeeklyTestResult["status"],
  ) {
    setResults((current) =>
      current.map((result) => {
        if (result.studentId !== studentId) {
          return result;
        }

        return {
          ...result,
          status,
          obtainedMarks: status === "present" ? result.obtainedMarks : "",
        };
      }),
    );
  }

  function resetForm() {
    setTitle("");
    setTestDate(getToday());
    setTotalMarks("100");
    setPublishNow(false);
    setResults(createDraftResults(allStudents));
  }

  async function saveWeeklyTest() {
    if (!canManage) {
      return;
    }

    if (!title.trim()) {
      setMessage("Test title is required.");
      return;
    }

    if (!subject.trim()) {
      setMessage("Subject is required.");
      return;
    }

    const parsedTotalMarks = Number(totalMarks);

    if (!Number.isFinite(parsedTotalMarks) || parsedTotalMarks <= 0) {
      setMessage("Total marks must be greater than zero.");
      return;
    }

    if (!results.length) {
      setMessage("No students available to create the test.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/weekly-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          testDate,
          totalMarks: parsedTotalMarks,
          published: publishNow,
          results: results.map((result) => ({
            studentId: result.studentId,
            studentName: result.studentName,
            status: result.status,
            obtainedMarks:
              result.status === "present" && result.obtainedMarks !== ""
                ? Number(result.obtainedMarks)
                : undefined,
            remarks: result.remarks.trim() || undefined,
          })),
        }),
      });

      const payload = (await response.json()) as {
        weeklyTest?: WeeklyTest;
        error?: string;
      };

      if (!response.ok || !payload.weeklyTest) {
        setMessage(payload.error ?? "Unable to save weekly test.");
        return;
      }

      setWeeklyTests((current) => [payload.weeklyTest!, ...current]);

      setMessage(
        publishNow
          ? "Weekly test published for students and parents."
          : "Weekly test saved as a faculty draft.",
      );

      resetForm();
    } catch {
      setMessage("Unable to save weekly test.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="surface rounded-[2rem] p-6">
        <div>
          <p className="section-label">Weekly Tests</p>

          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            {canManage ? "Create Weekly Test Results" : "Weekly Test Results"}
          </h2>

          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {canManage
              ? "Add marks for each student, then save or publish the result."
              : "Track test scores, percentage, subject-wise progress, and teacher remarks."}
          </p>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        ) : null}

        {canManage ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Test Title
                </span>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Algebra Weekly Test"
                  className={fieldClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Subject
                </span>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                  className={fieldClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Test Date
                </span>

                <input
                  type="date"
                  value={testDate}
                  onChange={(event) => setTestDate(event.target.value)}
                  className={fieldClass}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                  Total Marks
                </span>

                <input
                  type="number"
                  min="1"
                  value={totalMarks}
                  onChange={(event) => setTotalMarks(event.target.value)}
                  className={fieldClass}
                />
              </label>
            </div>

            {results.length > 0 ? (
              <div className="overflow-x-auto rounded-[1.5rem] border border-[var(--color-border)]">
                <table className="w-full min-w-[840px] text-left text-sm">
                  <thead className="bg-[var(--color-panel)]">
                    <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      <th className="px-4 py-4">Student</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Marks</th>
                      <th className="px-4 py-4">Remarks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((result) => (
                      <tr
                        key={result.studentId}
                        className="border-b border-[var(--color-border)] last:border-0"
                      >
                        <td className="px-4 py-4 font-black text-[var(--color-heading)]">
                          {result.studentName}
                        </td>

                        <td className="px-4 py-4">
                          <select
                            value={result.status}
                            onChange={(event) =>
                              updateResultStatus(
                                result.studentId,
                                event.target
                                  .value as WeeklyTestResult["status"],
                              )
                            }
                            className={selectClass}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="not-submitted">
                              Not Submitted
                            </option>
                          </select>
                        </td>

                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            max={totalMarks || undefined}
                            disabled={result.status !== "present"}
                            value={result.obtainedMarks}
                            onChange={(event) =>
                              updateResult(result.studentId, {
                                obtainedMarks: event.target.value,
                              })
                            }
                            placeholder="Marks"
                            className={`${selectClass} w-28 disabled:cursor-not-allowed disabled:opacity-50`}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <input
                            value={result.remarks}
                            onChange={(event) =>
                              updateResult(result.studentId, {
                                remarks: event.target.value,
                              })
                            }
                            placeholder="Optional teacher remark"
                            className={`${selectClass} min-w-64`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
                No students available. Add students to the system first.
              </div>
            )}

            <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-[var(--color-heading)]">
                  Publish result now
                </p>

                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Published results are visible to students and linked parents.
                </p>
              </div>

              <label className="flex items-center gap-3 text-sm font-black text-[var(--color-heading)]">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(event) => setPublishNow(event.target.checked)}
                  className="h-5 w-5 accent-blue-600"
                />
                Publish Now
              </label>
            </div>

            <button
              type="button"
              onClick={() => void saveWeeklyTest()}
              disabled={isSaving || !results.length}
              className="action-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : publishNow
                  ? "Save & Publish Weekly Test"
                  : "Save Weekly Test Draft"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="surface rounded-[2rem] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label">Test History</p>

            <h3 className="text-xl font-black text-[var(--color-heading)]">
              {canManage ? "Test Results" : "Your Test Performance"}
            </h3>
          </div>

          <span className="pill w-fit">
            {visibleWeeklyTests.length} Test
            {visibleWeeklyTests.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-[var(--color-muted)]">
            Loading weekly tests...
          </p>
        ) : null}

        {!isLoading && !visibleWeeklyTests.length ? (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--color-border)] p-10 text-center">
            <h4 className="font-black text-[var(--color-heading)]">
              No weekly tests available
            </h4>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canManage
                ? "Create the first test result above."
                : "Published weekly test results will appear here."}
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleWeeklyTests.map((test) => {
            const ownResult = viewerStudentId
              ? test.results.find(
                  (result) => result.studentId === viewerStudentId,
                )
              : undefined;

            const ownPercentage = ownResult
              ? getPercentage(ownResult.obtainedMarks, test.totalMarks)
              : null;

            const presentResults = test.results.filter(
              (result) =>
                result.status === "present" &&
                typeof result.obtainedMarks === "number",
            );

            const batchAverage = presentResults.length
              ? Math.round(
                  presentResults.reduce(
                    (sum, result) => sum + (result.obtainedMarks ?? 0),
                    0,
                  ) / presentResults.length,
                )
              : null;

            return (
              <article
                key={test.id}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-black text-[var(--color-heading)]">
                      {test.title}
                    </h4>

                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {test.subject} •{" "}
                      {formatTestDate(test.testDate)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      test.published
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {test.published ? "Published" : "Draft"}
                  </span>
                </div>

                {canManage ? (
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-[var(--color-panel)] px-4 py-3 text-sm">
                      <span className="font-bold text-[var(--color-muted)]">
                        Students evaluated
                      </span>
                      <span className="font-black text-[var(--color-heading)]">
                        {presentResults.length} / {test.results.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-[var(--color-panel)] px-4 py-3 text-sm">
                      <span className="font-bold text-[var(--color-muted)]">
                        Class average
                      </span>
                      <span className="font-black text-[var(--color-heading)]">
                        {batchAverage === null
                          ? "—"
                          : `${batchAverage} / ${test.totalMarks}`}
                      </span>
                    </div>
                  </div>
                ) : ownResult ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-[var(--color-panel)] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Score
                      </p>

                      <p className="mt-2 text-xl font-black text-[var(--color-heading)]">
                        {ownResult.status === "present"
                          ? `${ownResult.obtainedMarks ?? 0} / ${test.totalMarks}`
                          : "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[var(--color-panel)] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Percentage
                      </p>

                      <p className="mt-2 text-xl font-black text-[var(--color-heading)]">
                        {ownPercentage === null ? "—" : `${ownPercentage}%`}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[var(--color-panel)] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Status
                      </p>

                      <p className="mt-2 text-sm font-black capitalize text-[var(--color-heading)]">
                        {ownResult.status.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                ) : null}

                {!canManage && ownResult?.remarks ? (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                      Teacher Remark
                    </p>

                    <p className="mt-2 text-sm font-medium text-blue-900">
                      {ownResult.remarks}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}