"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Download,
  RefreshCw,
} from "lucide-react";

type WeeklyRecord = {
  date: string;
  subject: string;
  attendanceSheetId: string;
  status: string;
  remarks: string;
};

type StudentWeeklyReport = {
  studentId: string;
  studentName: string;
  course: string;
  branch: string;
  batch: string;
  startDate: string;
  endDate: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
  attendancePercentage: number | null;
  records: WeeklyRecord[];
};

type WeeklyResponse = {
  success: boolean;
  startDate: string;
  endDate: string;
  summary: {
    totalStudents: number;
    studentsWithAttendance: number;
    studentsWithoutAttendance: number;
    totalAttendanceSessions: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalLeave: number;
  };
  reports: StudentWeeklyReport[];
  source?: "saved";
  generatedAt?: string;
};

type SavedWeek = {
  startDate: string;
  endDate: string;
  reportCount: number;
  generatedAt: string;
};

function todayInIndia() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00Z`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}

function csvCell(value: string | number | null | undefined) {
  let text = String(value ?? "");

  // Prevent spreadsheet formula execution from imported text.
  if (/^[=+\-@]/.test(text)) {
    text = `\t${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function WeeklyAttendanceReports() {
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<WeeklyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"live" | "saved">("live");
  const [savedWeeks, setSavedWeeks] = useState<SavedWeek[]>([]);
  const [savedEndDate, setSavedEndDate] = useState("");
  const [loadingWeeks, setLoadingWeeks] = useState(false);

  useEffect(() => {
    setEndDate(todayInIndia());
  }, []);

  async function loadSavedWeeks() {
    setLoadingWeeks(true);
    setError("");

    try {
      const response = await fetch("/api/attendance/weekly/history", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to list saved weekly reports.");
      }

      const weeks = (payload.weeks ?? []) as SavedWeek[];
      setSavedWeeks(weeks);
      setSavedEndDate((previous) =>
        weeks.some((week) => week.endDate === previous)
          ? previous
          : weeks[0]?.endDate ?? "",
      );
      if (weeks.length === 0) setData(null);
    } catch (cause) {
      setSavedWeeks([]);
      setSavedEndDate("");
      setData(null);
      setError(
        cause instanceof Error ? cause.message : "Unable to list saved weekly reports.",
      );
    } finally {
      setLoadingWeeks(false);
    }
  }

  async function loadReport() {
    const selectedEndDate = mode === "saved" ? savedEndDate : endDate;
    if (!selectedEndDate) return;

    setLoading(true);
    setError("");

    try {
      const url = mode === "saved"
        ? `/api/attendance/weekly/history?endDate=${encodeURIComponent(selectedEndDate)}`
        : `/api/attendance/weekly?endDate=${encodeURIComponent(selectedEndDate)}`;
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "same-origin",
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error || "Unable to load weekly reports.",
        );
      }

      setData(payload as WeeklyResponse);
    } catch (cause) {
      setData(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load weekly reports.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "saved") void loadSavedWeeks();
    // Fetch available saved weeks when switching to history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if ((mode === "live" && endDate) || (mode === "saved" && savedEndDate)) {
      void loadReport();
    }
    // Load the selected report when its source/date changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, endDate, savedEndDate]);

  const reports = (data?.reports ?? []).filter((report) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      report.studentName,
      report.studentId,
      report.course,
      report.branch,
      report.batch,
    ].some((value) => value.toLowerCase().includes(query));
  });

  function exportCsv() {
    if (!data) return;

    const header = [
      "Student ID",
      "Student Name",
      "Course",
      "Batch",
      "Branch",
      "Week Start",
      "Week End",
      "Present",
      "Absent",
      "Late",
      "Leave",
      "Total Sessions",
      "Attendance Percentage",
    ];

    const rows = [
      header,
      ...reports.map((report) => [
        report.studentId,
        report.studentName,
        report.course,
        report.batch,
        report.branch,
        report.startDate,
        report.endDate,
        report.present,
        report.absent,
        report.late,
        report.leave,
        report.total,
        report.attendancePercentage === null
          ? ""
          : `${report.attendancePercentage}%`,
      ]),
    ];

    const content = rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF", content],
      { type: "text/csv;charset=utf-8;" },
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      `smartiq-weekly-attendance-${data.startDate}-to-${data.endDate}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Weekly report source">
          <button
            type="button"
            onClick={() => { setMode("live"); setData(null); setError(""); }}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === "live" ? "bg-[#0B40A1] text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Live seven-day view
          </button>
          <button
            type="button"
            onClick={() => { setMode("saved"); setData(null); setError(""); }}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === "saved" ? "bg-[#0B40A1] text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Saved Monday–Sunday history
          </button>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              Student Attendance
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-900">
              Weekly Attendance Reports
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {mode === "live"
                ? "Review any seven-day period using current attendance data."
                : "Review permanent weekly snapshots stored by the scheduled report job."}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {mode === "live" ? (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">
                  Seven-day period ending
                </span>
                <input
                  type="date"
                  value={endDate}
                  max={todayInIndia()}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                />
              </label>
            ) : (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">
                  Saved week
                </span>
                <select
                  value={savedEndDate}
                  onChange={(event) => { setSavedEndDate(event.target.value); setData(null); }}
                  disabled={loadingWeeks || savedWeeks.length === 0}
                  className="max-w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 disabled:opacity-50"
                >
                  {savedWeeks.length === 0 && <option value="">No saved weeks yet</option>}
                  {savedWeeks.map((week) => (
                    <option key={week.endDate} value={week.endDate}>
                      {formatDate(week.startDate)} – {formatDate(week.endDate)} ({week.reportCount} students)
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={() => {
                if (mode === "saved") void loadSavedWeeks();
                void loadReport();
              }}
              disabled={loading || loadingWeeks || (mode === "live" ? !endDate : !savedEndDate)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={!data || loading || loadingWeeks}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B40A1] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {data && (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarDays size={16} />
            {formatDate(data.startDate)} – {formatDate(data.endDate)}
            {mode === "saved" && data.generatedAt && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                · Saved {new Date(data.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
              </span>
            )}
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {(loading || loadingWeeks) && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm font-semibold text-blue-700">
          Loading weekly attendance...
        </div>
      )}

      {mode === "saved" && !loading && !loadingWeeks && !error && savedWeeks.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          No permanent weekly reports have been saved yet. They will appear after the
          weekly cron job completes successfully in production; live reports remain available.
        </div>
      )}

      {data && !loading && !loadingWeeks && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total Students", data.summary.totalStudents],
              [
                "Students With Attendance",
                data.summary.studentsWithAttendance,
              ],
              [
                "Attendance Sessions",
                data.summary.totalAttendanceSessions,
              ],
              ["Absent Records", data.summary.totalAbsent],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="text-2xl font-black text-slate-900">
                  {value}
                </p>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
              <h3 className="text-lg font-black text-slate-900">
                Student Reports
              </h3>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, course or branch"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm sm:w-72"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {[
                      "Student",
                      "Course / Branch",
                      "Present",
                      "Absent",
                      "Late",
                      "Leave",
                      "Sessions",
                      "Attendance %",
                    ].map((heading) => (
                      <th key={heading} className="px-4 py-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr key={report.studentId}>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">
                          {report.studentName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {report.studentId}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {report.course}
                        </p>
                        <p className="text-xs text-slate-500">
                          {report.branch}
                        </p>
                      </td>

                      <td className="px-4 py-4">{report.present}</td>
                      <td className="px-4 py-4">{report.absent}</td>
                      <td className="px-4 py-4">{report.late}</td>
                      <td className="px-4 py-4">{report.leave}</td>
                      <td className="px-4 py-4">{report.total}</td>

                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1 font-black text-blue-700">
                          {report.attendancePercentage === null
                            ? "—"
                            : `${report.attendancePercentage}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {reports.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  No matching student reports.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

