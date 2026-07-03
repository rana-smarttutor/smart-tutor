"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AttendanceSheet,
  Batch,
  LectureItem,
  ManagedUser,
  Role,
} from "@/lib/types";

type AttendanceManagerProps = {
  role: Role;
  attendanceSheets: AttendanceSheet[];
  studentDirectory: ManagedUser[];
  userId?: string;
};

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const selectClass =
  "rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export function AttendanceManager({
  role,
  attendanceSheets,
  studentDirectory,
  userId,
}: AttendanceManagerProps) {
  const canEdit = role === "admin" || role === "educator";

  const [sheets, setSheets] = useState<AttendanceSheet[]>(attendanceSheets);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [lectures, setLectures] = useState<LectureItem[]>([]);

  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [sheetToDelete, setSheetToDelete] = useState<AttendanceSheet | null>(
    null,
  );

  const [title, setTitle] = useState("Daily Attendance");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [lectureId, setLectureId] = useState("");

  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSheets(attendanceSheets);
  }, [attendanceSheets]);

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    let cancelled = false;

    async function loadSetupData() {
      setIsLoadingSetup(true);

      try {
        const [batchResponse, lectureResponse] = await Promise.all([
          fetch("/api/batches", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/lectures", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }),
        ]);

        const batchPayload = (await batchResponse.json()) as {
          batches?: Batch[];
        };

        const lecturePayload = (await lectureResponse.json()) as {
          lectures?: LectureItem[];
        };

        if (!cancelled) {
          setBatches(batchPayload.batches ?? []);
          setLectures(lecturePayload.lectures ?? []);
        }
      } catch {
        if (!cancelled) {
          setMessage("Unable to load batches and lectures.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSetup(false);
        }
      }
    }

    void loadSetupData();

    return () => {
      cancelled = true;
    };
  }, [canEdit]);

  const activeSheet = sheets.find((sheet) => sheet.id === activeSheetId);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === batchId),
    [batches, batchId],
  );

  const batchStudents = useMemo(() => {
    if (!selectedBatch) {
      return [];
    }

    return selectedBatch.studentIds
      .map((studentId) =>
        studentDirectory.find(
          (student) => student.id === studentId && student.role === "student",
        ),
      )
      .filter((student): student is ManagedUser => Boolean(student));
  }, [selectedBatch, studentDirectory]);

  const batchLectures = useMemo(() => {
    if (!selectedBatch) {
      return [];
    }

    return lectures.filter((lecture) => {
      if (lecture.batchId === selectedBatch.id) {
        return true;
      }

      return (
        !lecture.batchId &&
        lecture.batchName?.trim().toLowerCase() ===
          selectedBatch.name.trim().toLowerCase()
      );
    });
  }, [lectures, selectedBatch]);

  const viewerStudentId = useMemo(() => {
    if (role === "student") {
      return userId;
    }

    if (role === "parent") {
      const studentIds = new Set(
        sheets.flatMap((sheet) =>
          sheet.records.map((record) => record.studentId),
        ),
      );

      if (studentIds.size === 1) {
        return Array.from(studentIds)[0];
      }
    }

    return undefined;
  }, [role, sheets, userId]);

  function getVisibleRecords(sheet: AttendanceSheet) {
    if (canEdit) {
      return sheet.records;
    }

    if (!viewerStudentId) {
      return [];
    }

    return sheet.records.filter(
      (record) => record.studentId === viewerStudentId,
    );
  }

  function handleBatchChange(nextBatchId: string) {
    setBatchId(nextBatchId);
    setLectureId("");

    const batch = batches.find((item) => item.id === nextBatchId);

    if (batch?.subject) {
      setSubject(batch.subject);
    }
  }

  async function createSheet() {
    if (!canEdit) {
      return;
    }

    if (!title.trim()) {
      setMessage("Attendance title is required.");
      return;
    }

    if (!batchId || !selectedBatch) {
      setMessage("Select a batch before creating attendance.");
      return;
    }

    if (!batchStudents.length) {
      setMessage("This batch has no students assigned yet.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const records = batchStudents.map((student) => ({
      studentId: student.id,
      studentName: student.name,
      status: "present" as AttendanceStatus,
      remarks: "",
    }));

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          date,
          batchName: selectedBatch.name,
          batchId: selectedBatch.id,
          lectureId: lectureId || undefined,
          subject: subject.trim() || selectedBatch.subject || undefined,
          records,
        }),
      });

      const payload = (await response.json()) as {
        attendanceSheet?: AttendanceSheet;
        error?: string;
      };

      if (!response.ok || !payload.attendanceSheet) {
        setMessage(payload.error ?? "Unable to create attendance sheet.");
        return;
      }

      const createdSheet = payload.attendanceSheet;

      setSheets((current) => [createdSheet, ...current]);
      setActiveSheetId(createdSheet.id);

      if (lectureId) {
        const lectureResponse = await fetch(`/api/lectures/${lectureId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attendanceSheetId: createdSheet.id,
          }),
        });

        const lecturePayload = (await lectureResponse.json()) as {
          lecture?: LectureItem;
        };

        if (lectureResponse.ok && lecturePayload.lecture) {
          setLectures((current) =>
            current.map((lecture) =>
              lecture.id === lectureId ? lecturePayload.lecture! : lecture,
            ),
          );
        }
      }

      setMessage("Attendance sheet created successfully.");
      setTitle("Daily Attendance");
      setLectureId("");
    } catch {
      setMessage("Unable to create attendance sheet.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(
    sheetId: string,
    studentId: string,
    status: AttendanceStatus,
  ) {
    if (!canEdit) {
      return;
    }

    const sheet = sheets.find((item) => item.id === sheetId);

    if (!sheet) {
      return;
    }

    const previousRecords = sheet.records;

    const updatedRecords = sheet.records.map((record) =>
      record.studentId === studentId ? { ...record, status } : record,
    );

    setSheets((current) =>
      current.map((item) =>
        item.id === sheetId ? { ...item, records: updatedRecords } : item,
      ),
    );

    try {
      const response = await fetch(`/api/attendance/${sheetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: updatedRecords,
        }),
      });

      const payload = (await response.json()) as {
        attendanceSheet?: AttendanceSheet;
        error?: string;
      };

      if (!response.ok || !payload.attendanceSheet) {
        setSheets((current) =>
          current.map((item) =>
            item.id === sheetId ? { ...item, records: previousRecords } : item,
          ),
        );

        setMessage(payload.error ?? "Unable to update attendance.");
        return;
      }

      setSheets((current) =>
        current.map((item) =>
          item.id === sheetId ? payload.attendanceSheet! : item,
        ),
      );
    } catch {
      setSheets((current) =>
        current.map((item) =>
          item.id === sheetId ? { ...item, records: previousRecords } : item,
        ),
      );

      setMessage("Unable to update attendance.");
    }
  }

  async function deleteSheet(sheetId: string) {
    if (!canEdit) {
      return;
    }

    setDeletingId(sheetId);

    try {
      const response = await fetch(`/api/attendance/${sheetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setMessage("Unable to delete attendance sheet.");
        return;
      }

      setSheets((current) =>
        current.filter((sheet) => sheet.id !== sheetId),
      );

      if (activeSheetId === sheetId) {
        setActiveSheetId(null);
      }

      setSheetToDelete(null);
      setMessage("Attendance sheet deleted.");
    } catch {
      setMessage("Unable to delete attendance sheet.");
    } finally {
      setDeletingId(null);
    }
  }

  function getSheetSummary(sheet: AttendanceSheet) {
    const present = sheet.records.filter(
      (record) => record.status === "present",
    ).length;

    const absent = sheet.records.filter(
      (record) => record.status === "absent",
    ).length;

    const late = sheet.records.filter(
      (record) => record.status === "late",
    ).length;

    return { present, absent, late };
  }

  function getStudentAttendanceSummary() {
    if (canEdit || !viewerStudentId || !sheets.length) {
      return null;
    }

    let totalPresent = 0;
    let totalConducted = 0;

    for (const sheet of sheets) {
      const record = sheet.records.find(
        (item) => item.studentId === viewerStudentId,
      );

      if (!record) {
        continue;
      }

      totalConducted += 1;

      if (record.status === "present" || record.status === "late") {
        totalPresent += 1;
      }
    }

    if (!totalConducted) {
      return null;
    }

    return { totalConducted, totalPresent };
  }

  const attendanceSummary = getStudentAttendanceSummary();

  return (
    <section className="space-y-6">
      {attendanceSummary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="surface rounded-[2rem] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Lectures Conducted
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              {attendanceSummary.totalConducted}
            </p>
          </div>

          <div className="surface rounded-[2rem] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Lectures Attended
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              {attendanceSummary.totalPresent}
            </p>
          </div>

          <div className="surface rounded-[2rem] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Attendance %
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              {Math.round(
                (attendanceSummary.totalPresent /
                  attendanceSummary.totalConducted) *
                  100,
              )}
              %
            </p>
          </div>
        </div>
      ) : null}

      <div className="surface rounded-[2rem] p-6">
        <div className="flex flex-col gap-2">
          <p className="section-label">Attendance</p>

          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            Batch Attendance
          </h2>

          <p className="text-sm text-[var(--color-muted)]">
            {canEdit
              ? "Select an assigned batch, link a lecture if needed, and mark attendance only for students in that batch."
              : "View attendance records shared for your learning program."}
          </p>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        ) : null}

        {canEdit ? (
          <div className="mt-6">
            {isLoadingSetup ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 text-sm text-[var(--color-muted)]">
                Loading batches and lectures...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                    Title
                  </span>

                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Daily Attendance"
                    className={fieldClass}
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                    Date
                  </span>

                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className={fieldClass}
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
                    Batch
                  </span>

                  <select
                    value={batchId}
                    onChange={(event) =>
                      handleBatchChange(event.target.value)
                    }
                    className={fieldClass}
                  >
                    <option value="">Select batch</option>

                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
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
                    Linked Lecture
                  </span>

                  <select
                    value={lectureId}
                    onChange={(event) => setLectureId(event.target.value)}
                    disabled={!batchId}
                    className={fieldClass}
                  >
                    <option value="">No linked lecture</option>

                    {batchLectures.map((lecture) => (
                      <option key={lecture.id} value={lecture.id}>
                        {lecture.title} —{" "}
                        {new Date(lecture.startsAt).toLocaleDateString(
                          "en-IN",
                        )}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => void createSheet()}
                    disabled={isSaving || !batchId || !batchStudents.length}
                    className="action-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Creating..." : "Create Sheet"}
                  </button>
                </div>
              </div>
            )}

            {!isLoadingSetup && !batches.length ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                No active batches are assigned. Create a batch and assign
                students and faculty first.
              </p>
            ) : null}

            {batchId && !batchStudents.length ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                This batch has no assigned students yet.
              </p>
            ) : null}

            {batchStudents.length ? (
              <p className="mt-4 text-xs font-semibold text-[var(--color-muted)]">
                {batchStudents.length} student
                {batchStudents.length === 1 ? "" : "s"} will be added to this
                attendance sheet.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="surface rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-label">Saved Sheets</p>

            <h3 className="text-xl font-black text-[var(--color-heading)]">
              Attendance Sheet List
            </h3>
          </div>

          <span className="pill">{sheets.length} Sheets</span>
        </div>

        <div className="mt-5 space-y-3">
          {sheets.length ? (
            sheets.map((sheet) => {
              const summary = getSheetSummary(sheet);
              const isActive = activeSheetId === sheet.id;

              return (
                <div
                  key={sheet.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-[var(--color-border)] bg-[var(--color-card)]"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 className="font-black text-[var(--color-heading)]">
                        {sheet.title}
                      </h4>

                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {sheet.date}
                        {sheet.batchName ? ` • ${sheet.batchName}` : ""}
                        {sheet.subject ? ` • ${sheet.subject}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canEdit ? (
                        <>
                          <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-black text-green-600">
                            Present {summary.present}
                          </span>

                          <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-black text-red-600">
                            Absent {summary.absent}
                          </span>

                          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-700">
                            Late {summary.late}
                          </span>
                        </>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          setActiveSheetId(isActive ? null : sheet.id)
                        }
                        className="rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-black text-[var(--color-heading)] hover:bg-blue-500/10"
                      >
                        {isActive ? "Close" : "Open"}
                      </button>

                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => setSheetToDelete(sheet)}
                          disabled={deletingId === sheet.id}
                          className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-500/20 disabled:opacity-60"
                        >
                          {deletingId === sheet.id ? "Deleting..." : "Delete"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="surface-soft rounded-[2rem] border border-[var(--color-border)] p-10 text-center">
              <h3 className="text-lg font-black text-[var(--color-heading)]">
                No attendance sheets yet
              </h3>

              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {canEdit
                  ? "Create attendance from an assigned batch above."
                  : "Attendance records will appear here once faculty updates them."}
              </p>
            </div>
          )}
        </div>
      </div>

      {activeSheet ? (
        <div className="surface rounded-[2rem] p-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-label">Open Sheet</p>

              <h3 className="text-lg font-black text-[var(--color-heading)]">
                {activeSheet.title}
              </h3>

              <p className="text-sm text-[var(--color-muted)]">
                {activeSheet.date}
                {activeSheet.batchName ? ` • ${activeSheet.batchName}` : ""}
                {activeSheet.subject ? ` • ${activeSheet.subject}` : ""}
              </p>
            </div>

            <span className="pill w-fit">
              {getVisibleRecords(activeSheet).length} Student
              {getVisibleRecords(activeSheet).length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  <th className="py-3">Student</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {getVisibleRecords(activeSheet).map((record) => (
                  <tr
                    key={record.studentId}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="py-3 font-bold text-[var(--color-heading)]">
                      {record.studentName}
                    </td>

                    <td className="py-3">
                      {canEdit ? (
                        <select
                          value={record.status}
                          onChange={(event) =>
                            void updateStatus(
                              activeSheet.id,
                              record.studentId,
                              event.target.value as AttendanceStatus,
                            )
                          }
                          className={selectClass}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      ) : (
                        <span className="pill capitalize">
                          {record.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-muted)]">
                      {record.remarks || "—"}
                    </td>
                  </tr>
                ))}

                {!getVisibleRecords(activeSheet).length ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-sm text-[var(--color-muted)]"
                    >
                      No attendance record is available for this account.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {sheetToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-2xl">
              ⚠️
            </div>

            <h3 className="mt-5 text-2xl font-black text-[var(--color-heading)]">
              Delete attendance sheet?
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
              Are you sure you want to delete{" "}
              <span className="font-black text-[var(--color-heading)]">
                {sheetToDelete.title}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-bold text-[var(--color-heading)]">
                {sheetToDelete.date}
                {sheetToDelete.batchName
                  ? ` • ${sheetToDelete.batchName}`
                  : ""}
                {sheetToDelete.subject ? ` • ${sheetToDelete.subject}` : ""}
              </p>

              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {sheetToDelete.records.length} students included
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setSheetToDelete(null)}
                disabled={deletingId === sheetToDelete.id}
                className="flex-1 rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void deleteSheet(sheetToDelete.id)}
                disabled={deletingId === sheetToDelete.id}
                className="flex-1 rounded-full border border-red-400/30 bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === sheetToDelete.id
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}