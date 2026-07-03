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
    const originalTitle = document.title;

    document.title = `${studentName} - ${reportType} Performance Report`;

    window.print();

    window.setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }

  return (
    <>
      <div className="report-print-actions fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 px-2">
          <p className="truncate text-sm font-bold text-slate-900">
            {studentName}
          </p>
          <p className="truncate text-xs text-slate-500">
            {reportType} report · {period}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Dashboard
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

      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          .report-print-actions {
            display: none !important;
          }

          body {
            background: #ffffff !important;
          }
        }
      `}</style>
    </>
  );
}