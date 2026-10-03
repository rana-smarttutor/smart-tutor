"use client";

import Link from "next/link";

type StudentPerformanceReportPrintActionsProps = {
  studentName: string;
  reportType: string;
  period: string;
};

export function StudentPerformanceReportPrintActions({
  studentName,
  reportType,
  period,
}: StudentPerformanceReportPrintActionsProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="report-print-actions no-print fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur print:hidden">
      <div className="min-w-0 px-2">
        <p className="truncate text-sm font-bold text-slate-900">
          {studentName}
        </p>

        <p className="truncate text-xs text-slate-500">
          {reportType} Report
          {period ? ` • ${period}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/student-performance"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Back
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}