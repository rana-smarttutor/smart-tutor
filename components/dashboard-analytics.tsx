"use client";

import type {
  DashboardAnalytics as DashboardAnalyticsData,
  Role,
} from "@/lib/types";

type DashboardAnalyticsProps = {
  role: Role;
  analytics: DashboardAnalyticsData;
};

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function clampPercent(value: number | null) {
  if (value === null) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function getHeading(role: Role) {
  if (role === "admin") {
    return {
      label: "Institute Analytics",
      title: "Operational performance snapshot",
      description:
        "Live totals calculated from attendance, assessments, learning activity, lectures, and fees.",
    };
  }

  if (role === "educator") {
    return {
      label: "Teaching Analytics",
      title: "Your learner progress",
      description:
        "Use these signals to identify attendance gaps, weak assessment results, and incomplete learning work.",
    };
  }

  if (role === "parent") {
    return {
      label: "Child Progress",
      title: "Academic activity at a glance",
      description:
        "A combined view of attendance, tests, learning completion, and fees for your linked child.",
    };
  }

  return {
    label: "Learning Analytics",
    title: "Your academic progress snapshot",
    description:
      "Track attendance, weekly-test results, daily learning completion, and pending fee status.",
  };
}

function ProgressRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | null;
  detail: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[var(--color-heading)]">
          {label}
        </p>
        <p className="text-xs font-bold text-[var(--color-heading)]">
          {formatPercent(value)}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full bg-[var(--color-primary)] transition-all"
          style={{
            width: `${clampPercent(value)}%`,
            borderRadius: clampPercent(value) >= 100 ? "0" : "9999px",
          }}
        />
      </div>

      <p className="mt-2 text-[11px] leading-5 text-[var(--color-muted)]">
        {detail}
      </p>
    </div>
  );
}

export function DashboardAnalytics({
  role,
  analytics,
}: DashboardAnalyticsProps) {
  const heading = getHeading(role);
  const showOperations = role === "admin" || role === "educator";

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="section-label">{heading.label}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            {heading.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            {heading.description}
          </p>
        </div>

        <span className="pill shrink-0">
          Updated {new Date(analytics.refreshedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.metrics.map((metric) => (
          <article
            key={metric.label}
            className="surface-soft rounded-[1.35rem] p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              {metric.label}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
              {metric.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
              {metric.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="surface-soft rounded-[1.6rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Attendance</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--color-heading)]">
                {formatPercent(analytics.attendance.rate)} attendance rate
              </h3>
            </div>

            <span className="pill">
              {analytics.attendance.totalRecords} records
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ProgressRow
              label="Present / Late"
              value={analytics.attendance.rate}
              detail={`${analytics.attendance.present} present · ${analytics.attendance.late} late`}
            />

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Attendance Breakdown
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-bold text-[var(--color-heading)]">
                    {analytics.attendance.absent}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">Absent</p>
                </div>

                <div>
                  <p className="text-lg font-bold text-[var(--color-heading)]">
                    {analytics.attendance.excused}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">Excused</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="surface-soft rounded-[1.6rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Assessment Performance</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--color-heading)]">
                {formatPercent(analytics.assessments.averageScore)} average score
              </h3>
            </div>

            <span className="pill">
              {analytics.assessments.publishedTests} published tests
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {analytics.assessments.subjectPerformance.length ? (
              analytics.assessments.subjectPerformance.map((subject) => (
                <ProgressRow
                  key={subject.subject}
                  label={subject.subject}
                  value={subject.percentage}
                  detail={`${subject.resultCount} result${
                    subject.resultCount === 1 ? "" : "s"
                  } recorded`}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                <p className="text-sm text-[var(--color-muted)]">
                  No marked weekly-test results are available yet.
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="surface-soft rounded-[1.6rem] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Daily Learning</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--color-heading)]">
                {formatPercent(analytics.learning.completionRate)} completion
              </h3>
            </div>

            <span className="pill">
              {analytics.learning.activitiesRecorded} activities
            </span>
          </div>

          <div className="mt-6 grid gap-5">
            <ProgressRow
              label="Homework Completion"
              value={analytics.learning.homeworkRate}
              detail="Based on recorded daily learning activities"
            />

            <ProgressRow
              label="Assignment Completion"
              value={analytics.learning.assignmentRate}
              detail="Based on recorded daily learning activities"
            />

            <ProgressRow
              label="Revision Completion"
              value={analytics.learning.revisionRate}
              detail={
                analytics.learning.averageStudyMinutes === null
                  ? "Study duration has not been recorded yet"
                  : `Average study time: ${analytics.learning.averageStudyMinutes} minutes`
              }
            />
          </div>
        </article>

        {analytics.finance ? (
          <article className="surface-soft rounded-[1.6rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Fee Position</p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--color-heading)]">
                  {formatCurrency(analytics.finance.pending)} pending
                </h3>
              </div>

              <span className="pill">
                {analytics.finance.overdueCount} overdue
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Billed
                </p>
                <p className="mt-2 text-base font-bold text-[var(--color-heading)]">
                  {formatCurrency(analytics.finance.billed)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Collected
                </p>
                <p className="mt-2 text-base font-bold text-[var(--color-heading)]">
                  {formatCurrency(analytics.finance.collected)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Pending
                </p>
                <p className="mt-2 text-base font-bold text-[var(--color-heading)]">
                  {formatCurrency(analytics.finance.pending)}
                </p>
              </div>
            </div>
          </article>
        ) : null}

        {showOperations ? (
          <article className="surface-soft rounded-[1.6rem] p-5">
            <p className="section-label">Teaching Operations</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--color-heading)]">
              Lecture activity
            </h3>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Learners
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--color-heading)]">
                  {analytics.operations.learners}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Completed Classes
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--color-heading)]">
                  {analytics.operations.completedLectures}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Scheduled Classes
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--color-heading)]">
                  {analytics.operations.scheduledLectures}
                </p>
              </div>
            </div>
          </article>
        ) : null}

        <article className="surface-soft rounded-[1.6rem] p-5">
          <p className="section-label">Recommended Actions</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--color-heading)]">
            What needs attention
          </h3>

          <div className="mt-6 grid gap-3">
            {analytics.insights.map((insight) => (
              <div
                key={insight.title}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4"
              >
                <p className="text-sm font-bold text-[var(--color-heading)]">
                  {insight.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}