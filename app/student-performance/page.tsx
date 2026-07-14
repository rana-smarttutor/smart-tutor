"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedReport = {
  id: string;
  title: string;
  period: string;
  periodLabel: string;
  reportType: "weekly" | "monthly" | string;
  studentName: string;
  createdAt?: string | null;
};

function formatCreatedAt(value?: string | null) {
  if (!value) {
    return "Recently created";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently created";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function StudentPerformancePage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function loadReports() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/student-performance/reports", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        success?: boolean;
        reports?: Array<{
          id?: string;
          _id?: string;
          title?: string;
          period?: string;
          periodLabel?: string;
          reportType?: string;
          student?: {
            name?: string;
          };
          studentName?: string;
          createdAt?: string | null;
        }>;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load reports.");
      }

      const formattedReports: SavedReport[] = (payload.reports || []).map(
        (report) => ({
          id: report.id || report._id || "",
          title:
            report.title ||
            report.periodLabel ||
            report.period ||
            "Performance Report",
          period: report.period || "",
          periodLabel: report.periodLabel || report.period || "",
          reportType: report.reportType || "weekly",
          studentName:
            report.student?.name ||
            report.studentName ||
            "Student Performance Report",
          createdAt: report.createdAt || null,
        }),
      );

      setReports(formattedReports.filter((report) => report.id));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load performance reports.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  async function deleteReport(report: SavedReport) {
    const confirmed = window.confirm(
      `Delete the report "${report.title}" for ${report.studentName}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingReportId(report.id);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/student-performance/reports?id=${encodeURIComponent(report.id)}`,
        {
          method: "DELETE",
        },
      );

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to delete report.");
      }

      setReports((currentReports) =>
        currentReports.filter((item) => item.id !== report.id),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete the report.",
      );
    } finally {
      setDeletingReportId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#071124] px-4 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-white/15 bg-[#0f1a2e] p-6 shadow-2xl sm:p-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-blue-400">
          Analytics Hub
        </p>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              Student Performance Reports
            </h1>
          </div>

          <span className="w-fit rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300">
            {reports.length} Saved Reports
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/student-performance/create"
            className="rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-blue-400"
          >
            Create New Report
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => void loadReports()}
            className="rounded-full border border-blue-400/40 px-6 py-3 text-sm font-black text-blue-200 transition hover:bg-blue-500/10"
          >
            Refresh Reports
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
                Saved Reports
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Report History
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-52 items-center justify-center rounded-3xl border border-white/10 bg-[#0a1427]">
              <span className="h-9 w-9 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
            </div>
          ) : reports.length ? (
            <div className="grid gap-4">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-3xl border border-white/10 bg-[#0a1427] p-5 transition hover:border-blue-400/40"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                        {report.reportType === "monthly"
                          ? "Monthly Performance Report"
                          : "Weekly Performance Report"}
                      </p>

                      <h3 className="mt-2 break-words text-2xl font-black text-white">
                        {report.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                        <span>
                          Student:{" "}
                          <strong className="text-white">
                            {report.studentName}
                          </strong>
                        </span>

                        <span>Created: {formatCreatedAt(report.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/student-performance/report/${report.id}`}
                        className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-400"
                      >
                        View Report
                      </Link>

                      <button
                        type="button"
                        onClick={() => void deleteReport(report)}
                        disabled={deletingReportId === report.id}
                        className="rounded-full border border-red-400/40 px-5 py-2.5 text-sm font-black text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingReportId === report.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/20 bg-[#0a1427] px-6 py-16 text-center">
              <p className="text-lg font-bold text-white">
                No reports created yet.
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Create a student performance report and it will appear here.
              </p>

              <Link
                href="/student-performance/create"
                className="mt-6 inline-flex rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-400"
              >
                Create First Report
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}