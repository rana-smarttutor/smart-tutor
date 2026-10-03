import { redirect } from "next/navigation";

import {
  StudentPerformanceReportPrintActions,
} from "@/components/student-performance-report-print-actions";

import {
  getSessionUser,
} from "@/lib/auth";

import {
  getAccessibleStudentPerformanceReport,
} from "@/lib/student-performance-report-access";

import StudentPerformanceReport from "../../StudentPerformanceReport";

import "../../student-performance.css";

export const dynamic =
  "force-dynamic";

type PageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

export default async function StudentPerformanceReportPage({
  params,
}: PageProps) {
  const session =
    await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  const {
    reportId,
  } =
    await params;

  const result =
    await getAccessibleStudentPerformanceReport(
      reportId,
      session,
    );

  if (
    result.status !==
    "ok"
  ) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-900 p-8">
          <h1 className="text-3xl font-black">
            Report unavailable
          </h1>

          <p className="mt-3 text-slate-300">
            This report does not
            exist or is not
            available for your
            account.
          </p>
        </section>
      </main>
    );
  }

  const report =
    result.report as Record<
      string,
      any
    >;

  /*
   * New performance reports save
   * student information inside
   * report.student.
   *
   * Older reports may still have
   * report.studentName, so keep
   * that as a fallback.
   */
  const studentName =
    typeof report.student
      ?.name ===
      "string" &&
    report.student.name.trim()
      ? report.student.name.trim()
      : typeof report.studentName ===
            "string" &&
          report.studentName.trim()
        ? report.studentName.trim()
        : "Student";

  const reportType =
    typeof report.reportType ===
      "string" &&
    report.reportType.trim()
      ? `${report.reportType
          .charAt(0)
          .toUpperCase()}${report.reportType.slice(
          1,
        )}`
      : "Performance";

  const period =
    typeof report.period ===
      "string" &&
    report.period.trim()
      ? report.period.trim()
      : typeof report.periodLabel ===
            "string" &&
          report.periodLabel.trim()
        ? report.periodLabel.trim()
        : "Academic Report";

  return (
    <>
      <StudentPerformanceReportPrintActions
        studentName={
          studentName
        }
        reportType={
          reportType
        }
        period={
          period
        }
      />

      <StudentPerformanceReport
        report={
          report as any
        }
      />
    </>
  );
}