"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Users, X } from "lucide-react";

import type {
  ManagedUser,
  Role,
  WeeklyTest,
  WeeklyTestResult,
} from "@/lib/types";

type WeeklyTestManagerProps = {
  role: Role;
  studentDirectory: ManagedUser[];
  managedUsers?: ManagedUser[];
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
type TestTargetMode = "individual" | "class-section";

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

  if (courseKey.toLowerCase().startsWith("skills |")) {
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
      cleanedTitle || courseKey.split("|")[1]?.trim() || program || "General"
    );
  }

  return courseTitle || program || "General";
}
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

function getPercentage(obtainedMarks: number | undefined, totalMarks: number) {
  if (
    typeof obtainedMarks !== "number" ||
    !Number.isFinite(obtainedMarks) ||
    totalMarks <= 0
  ) {
    return null;
  }

  return Math.round((obtainedMarks / totalMarks) * 100);
}

export function WeeklyTestManager({
  role,
  studentDirectory,
  managedUsers,
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
  const [targetMode, setTargetMode] = useState<TestTargetMode>("individual");

  const [classFilter, setClassFilter] = useState("");

  const [sectionFilter, setSectionFilter] = useState("");

  const [studentSearch, setStudentSearch] = useState("");

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const allStudents = useMemo(() => {
    const combinedStudents = [...(managedUsers ?? []), ...studentDirectory];

    return [
      ...new Map(
        combinedStudents
          .filter(
            (student) =>
              student.role === "student" &&
              student.status !== "pending" &&
              student.status !== "rejected" &&
              student.verified !== false,
          )
          .map((student) => [student.id, student]),
      ).values(),
    ].sort((left, right) => (left.name ?? "").localeCompare(right.name ?? ""));
  }, [managedUsers, studentDirectory]);
  const classOptions = useMemo(() => {
    return [
      ...new Set(allStudents.map((student) => getStudentClassLabel(student))),
    ].sort((left, right) =>
      left.localeCompare(right, undefined, {
        numeric: true,
      }),
    );
  }, [allStudents]);

  const sectionOptions = useMemo(() => {
    if (!classFilter) {
      return [];
    }

    return [
      ...new Set(
        allStudents
          .filter((student) => getStudentClassLabel(student) === classFilter)
          .map((student) => getStudentSectionLabel(student)),
      ),
    ].sort((left, right) =>
      left.localeCompare(right, undefined, {
        numeric: true,
      }),
    );
  }, [allStudents, classFilter]);

  const studentsInSelectedSection = useMemo(() => {
    if (!classFilter || !sectionFilter) {
      return [];
    }

    return allStudents.filter(
      (student) =>
        getStudentClassLabel(student) === classFilter &&
        getStudentSectionLabel(student) === sectionFilter,
    );
  }, [allStudents, classFilter, sectionFilter]);

  const visibleStudents = useMemo(() => {
    const source =
      targetMode === "class-section" ? studentsInSelectedSection : allStudents;

    const query = studentSearch.trim().toLowerCase();

    if (!query) {
      return source;
    }

    return source.filter((student) => {
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
  }, [targetMode, allStudents, studentsInSelectedSection, studentSearch]);

  const selectedStudents = allStudents.filter((student) =>
    selectedStudentIds.includes(student.id),
  );
  useEffect(() => {
    setResults((currentResults) =>
      selectedStudentIds
        .map((studentId) => {
          const student = allStudents.find((item) => item.id === studentId);

          if (!student) {
            return null;
          }

          const existingResult = currentResults.find(
            (result) => result.studentId === studentId,
          );

          return (
            existingResult ?? {
              studentId: student.id,
              studentName: student.name,
              status: "present" as const,
              obtainedMarks: "",
              remarks: "",
            }
          );
        })
        .filter((result): result is ResultDraft => result !== null),
    );
  }, [selectedStudentIds, allStudents]);
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
  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function selectAllVisibleStudents() {
    setSelectedStudentIds((current) => [
      ...new Set([...current, ...visibleStudents.map((student) => student.id)]),
    ]);
  }

  function selectWholeSection() {
    if (!classFilter || !sectionFilter) {
      setMessage("Choose a class and section first.");
      return;
    }

    if (studentsInSelectedSection.length === 0) {
      setMessage("No students are available in this section.");
      return;
    }

    setMessage("");

    setSelectedStudentIds(
      studentsInSelectedSection.map((student) => student.id),
    );
  }

  function resetStudentSelection() {
    setSelectedStudentIds([]);
    setStudentSearch("");
    setClassFilter("");
    setSectionFilter("");
    setMessage("");
  }

  function changeTargetMode(nextMode: TestTargetMode) {
    setTargetMode(nextMode);
    resetStudentSelection();
  }
  function updateResult(studentId: string, updates: Partial<ResultDraft>) {
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
    setSubject("");
    setTestDate(getToday());
    setTotalMarks("100");
    setPublishNow(false);

    setTargetMode("individual");
    setSelectedStudentIds([]);
    setStudentSearch("");
    setClassFilter("");
    setSectionFilter("");
    setResults([]);
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
    if (!testDate) {
      setMessage("Test date is required.");
      return;
    }

    const parsedTotalMarks = Number(totalMarks);

    if (!Number.isFinite(parsedTotalMarks) || parsedTotalMarks <= 0) {
      setMessage("Total marks must be greater than zero.");
      return;
    }

    if (selectedStudentIds.length === 0 || results.length === 0) {
      setMessage(
        "Select at least one student or a whole class before saving the test.",
      );
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
                  Test Title*
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
                  Subject*
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
                  Test Date*
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
                  Total Marks*
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
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40">
              <div className="flex flex-col gap-3 border-b border-blue-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B40A1] text-white">
                    <Users size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-700">
                      Assign Test To <span className="text-red-500">*</span>
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Select individual students or a whole class and section
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[10px] font-black text-[#0B40A1]">
                    {selectedStudentIds.length} selected
                  </span>

                  {selectedStudentIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={resetStudentSelection}
                      className="text-[10px] font-black text-rose-600 hover:underline"
                    >
                      Clear Selection
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => changeTargetMode("individual")}
                    className={`rounded-lg px-3 py-2.5 text-xs font-black transition ${
                      targetMode === "individual"
                        ? "bg-[#0B40A1] text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Individual Students
                  </button>

                  <button
                    type="button"
                    onClick={() => changeTargetMode("class-section")}
                    className={`rounded-lg px-3 py-2.5 text-xs font-black transition ${
                      targetMode === "class-section"
                        ? "bg-[#0B40A1] text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Class / Section
                  </button>
                </div>

                {targetMode === "class-section" ? (
                  <>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Select Class / Program
                        </label>

                        <select
                          value={classFilter}
                          onChange={(event) => {
                            setClassFilter(event.target.value);
                            setSectionFilter("");
                            setSelectedStudentIds([]);
                            setStudentSearch("");
                          }}
                          className={fieldClass}
                        >
                          <option value="">Choose class or program</option>

                          {classOptions.map((classLabel) => (
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
                          value={sectionFilter}
                          disabled={!classFilter}
                          onChange={(event) => {
                            setSectionFilter(event.target.value);
                            setSelectedStudentIds([]);
                            setStudentSearch("");
                          }}
                          className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-slate-100`}
                        >
                          <option value="">Choose section</option>

                          {sectionOptions.map((sectionLabel) => (
                            <option key={sectionLabel} value={sectionLabel}>
                              {sectionLabel}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-blue-100 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-800">
                          {classFilter && sectionFilter
                            ? `${classFilter} — ${sectionFilter}`
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

                      <button
                        type="button"
                        onClick={selectWholeSection}
                        disabled={studentsInSelectedSection.length === 0}
                        className="h-10 rounded-xl bg-[#0B40A1] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Select Whole Section
                      </button>
                    </div>
                  </>
                ) : null}

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(event) =>
                      setStudentSearch(event.target.value.slice(0, 100))
                    }
                    disabled={
                      targetMode === "class-section" &&
                      (!classFilter || !sectionFilter)
                    }
                    placeholder={
                      targetMode === "class-section"
                        ? "Search within this section..."
                        : "Search by student name, class or program..."
                    }
                    className={`${fieldClass} min-w-0 flex-1`}
                  />

                  <button
                    type="button"
                    onClick={selectAllVisibleStudents}
                    disabled={visibleStudents.length === 0}
                    className="h-12 shrink-0 rounded-xl border border-blue-200 bg-white px-4 text-xs font-black text-[#0B40A1] disabled:opacity-40"
                  >
                    Select Shown
                  </button>
                </div>

                {selectedStudents.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B40A1] px-2.5 py-1.5 text-[10px] font-bold text-white"
                      >
                        <span className="max-w-[150px] truncate">
                          {student.name}
                        </span>

                        <X size={11} />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                  {visibleStudents.length > 0 ? (
                    visibleStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(
                        student.id,
                      );

                      return (
                        <label
                          key={student.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                            isSelected
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudent(student.id)}
                            className="h-4 w-4 accent-[#0B40A1]"
                          />

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                            {(student.name || "S").charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-black text-slate-800">
                              {student.name}
                            </p>

                            <p className="mt-0.5 truncate text-[10px] text-slate-500">
                              {getStudentClassLabel(student)} —{" "}
                              {getStudentSectionLabel(student)}
                            </p>
                          </div>

                          {isSelected ? (
                            <CheckCircle2
                              size={17}
                              className="text-[#0B40A1]"
                            />
                          ) : null}
                        </label>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
                      <Users size={24} className="mx-auto text-slate-300" />

                      <p className="mt-2 text-xs font-bold text-slate-600">
                        {targetMode === "class-section" &&
                        (!classFilter || !sectionFilter)
                          ? "Choose a class and section"
                          : "No students found"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
                            <option value="not-submitted">Not Submitted</option>
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
                Select one or more students above to enter their marks.
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
              disabled={isSaving}
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
                      {test.subject} • {formatTestDate(test.testDate)}
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
