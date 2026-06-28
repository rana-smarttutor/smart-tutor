"use client";

import { useState } from "react";

import type { AttendanceSheet, ManagedUser, Role } from "@/lib/types";

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

  const [sheets, setSheets] = useState(attendanceSheets);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [sheetToDelete, setSheetToDelete] = useState<AttendanceSheet | null>(
    null,
  );

  const [title, setTitle] = useState("Daily Attendance");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchName, setBatchName] = useState("");
  const [subject, setSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeSheet = sheets.find((sheet) => sheet.id === activeSheetId);

  async function createSheet() {
    if (!canEdit || !studentDirectory.length) return;

    setIsSaving(true);

    const records = studentDirectory.map((student) => ({
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
          title,
          date,
          batchName,
          subject,
          records,
        }),
      });

      const payload = await response.json();

      if (response.ok && payload.attendanceSheet) {
        setSheets((current) => [payload.attendanceSheet, ...current]);
        setActiveSheetId(payload.attendanceSheet.id);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(
    sheetId: string,
    studentId: string,
    status: AttendanceStatus,
  ) {
    if (!canEdit) return;

    const sheet = sheets.find((item) => item.id === sheetId);

    if (!sheet) return;

    const updatedRecords = sheet.records.map((record) =>
      record.studentId === studentId ? { ...record, status } : record,
    );

    const optimisticSheet = { ...sheet, records: updatedRecords };

    setSheets((current) =>
      current.map((item) => (item.id === sheetId ? optimisticSheet : item)),
    );

    await fetch(`/api/attendance/${sheetId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: updatedRecords,
      }),
    });
  }

  async function deleteSheet(sheetId: string) {
    if (!canEdit) return;

    setDeletingId(sheetId);

    try {
      const response = await fetch(`/api/attendance/${sheetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSheets((current) => current.filter((sheet) => sheet.id !== sheetId));

        if (activeSheetId === sheetId) {
          setActiveSheetId(null);
        }

        setSheetToDelete(null);
      }
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
    if (canEdit || !sheets.length) return null;

    // For student role: use userId (their own ID)
    // For parent role: find the student ID that appears in every sheet (the linked child)
    const viewerStudentId = role === "student"
      ? userId
      : sheets.every((sheet) =>
          sheet.records.some((r) => r.studentId === sheets[0].records[0]?.studentId),
        )
        ? sheets[0].records[0]?.studentId
        : null;

    if (!viewerStudentId) return null;

    let totalPresent = 0;
    for (const sheet of sheets) {
      const record = sheet.records.find((r) => r.studentId === viewerStudentId);
      if (record && (record.status === "present" || record.status === "late")) {
        totalPresent++;
      }
    }

    return { totalConducted: sheets.length, totalPresent };
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
              {Math.round((attendanceSummary.totalPresent / attendanceSummary.totalConducted) * 100)}%
            </p>
          </div>
        </div>
      ) : null}

      <div className="surface rounded-[2rem] p-6">
        <div className="flex flex-col gap-2">
          <p className="section-label">Attendance</p>
          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            Attendance Sheet
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            {canEdit
              ? "Create, open, edit, and delete attendance sheets."
              : "View attendance sheets shared by faculty."}
          </p>
        </div>

        {canEdit ? (
          <div className="mt-6 grid gap-4 md:grid-cols-5">
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
              <input
                value={batchName}
                onChange={(event) => setBatchName(event.target.value)}
                placeholder="Batch name"
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

            <div className="flex items-end">
              <button
                type="button"
                onClick={createSheet}
                disabled={isSaving || !studentDirectory.length}
                className="action-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Creating..." : "Create Sheet"}
              </button>
            </div>
          </div>
        ) : null}

        {canEdit && !studentDirectory.length ? (
          <p className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm font-semibold text-[var(--color-heading)]">
            No students found. Add students first, then create attendance
            sheets.
          </p>
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
                      <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-xs font-black text-green-600 ">
                        Present {summary.present}
                      </span>
                      <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-black text-red-600 ">
                        Absent {summary.absent}
                      </span>
                      <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-700 ">
                        Late {summary.late}
                      </span>

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
                          className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-500/20 disabled:opacity-60 "
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
                  ? "Create your first attendance sheet above."
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
              {activeSheet.records.length} Students
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
                {activeSheet.records.map((record) => (
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
                            updateStatus(
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
                onClick={() => deleteSheet(sheetToDelete.id)}
                disabled={deletingId === sheetToDelete.id}
                className="flex-1 rounded-full border border-red-400/30 bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === sheetToDelete.id ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}