"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardAccountDirectory } from "@/components/dashboard-account-directory";
import { DashboardCourseManager } from "@/components/dashboard-course-manager";
import { DashboardMessageCenter } from "@/components/dashboard-message-center";
import { DashboardTestStudio } from "@/components/dashboard-test-studio";
import { DigitalLibraryClient } from "@/components/digital-library-client";
import { PerformanceReportCreator } from "@/components/performance-report-creator";
import { PerformanceDashboard } from "@/components/performance-dashboard";
import { LiveClock } from "@/components/live-clock";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type {
  CourseItem,
  LibraryBook,
  ManagedUser,
  MessageItem,
  PerformanceHeuristics,
  PerformanceReport,
  Role,
  SessionUser,
  TestItem,
  TestSubmission,
} from "@/lib/types";
import { DEFAULT_HEURISTICS } from "@/lib/data-store";

type DashboardBundle = {
  roleLabel: string;
  heroTitle: string;
  heroDescription: string;
  stats: { label: string; value: string; detail: string }[];
  primaryPanel: {
    title: string;
    badge: string;
    items: { title: string; description: string; meta: string }[];
  };
  permissions: { title: string; description: string }[];
  courses: CourseItem[];
  tests: TestItem[];
  messages: any[];
  submissions: TestSubmission[];
};

type Props = {
  session: SessionUser | null;
  role: Role;
  dashboard: DashboardBundle;
  studentDirectory: ManagedUser[];
  managedUsers: ManagedUser[];
  courseOptions: { standardKey: string; title: string }[];
  supportContact: string;
};

const sidebarByRole = {
  student: [
    { id: "overview", label: "Overview" },
    { id: "messages", label: "Messages" },
    { id: "tests", label: "Tests" },
    { id: "performance", label: "Performance" },
    { id: "results", label: "Results" },
    { id: "library", label: "Library" },
  ],
  educator: [
    { id: "overview", label: "Overview" },
    { id: "messages", label: "Messages" },
    { id: "tests", label: "Test Studio" },
    { id: "performance", label: "Analytics Hub" },
    { id: "results", label: "Results" },
    { id: "library", label: "Library" },
  ],
  admin: [
    { id: "overview", label: "Overview" },
    { id: "messages", label: "Messages" },
    { id: "tests", label: "Test Studio" },
    { id: "performance", label: "Analytics Hub" },
    { id: "courses", label: "Courses" },
    { id: "accounts", label: "Accounts" },
    { id: "library", label: "Library" },
  ],
} as const;

function getRoleFocus(role: Role) {
  if (role === "admin") {
    return "Access control, institute governance, and approvals.";
  }

  if (role === "educator") {
    return "Batch delivery, assessment review, and learner coordination.";
  }

  return "Study progress, notices, assessments, and learning support.";
}

function getInitials(name?: string) {
  if (!name) {
    return "ST";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardShell({
  session,
  role,
  dashboard,
  studentDirectory,
  managedUsers,
  courseOptions,
  supportContact,
}: Props) {
  const [activeSection, setActiveSection] = useState<string>(
    sidebarByRole[role][0]?.id ?? "overview",
  );
  const [messages, setMessages] = useState<MessageItem[]>(dashboard.messages);
  const [submissions, setSubmissions] = useState<TestSubmission[]>(dashboard.submissions);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [performanceReports, setPerformanceReports] = useState<PerformanceReport[]>([]);
  const [heuristics, setHeuristics] = useState<PerformanceHeuristics>(DEFAULT_HEURISTICS);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);

  const showOverview = activeSection === "overview";
  const showMessages = activeSection === "messages";
  const showTests = activeSection === "tests";
  const showResults = activeSection === "results";
  const showCourses = activeSection === "courses";
  const showAccounts = activeSection === "accounts";
  const showLibrary = activeSection === "library";
  const showPerformance = activeSection === "performance";

  const profileHighlights = [
    { label: "Role", value: dashboard.roleLabel },
    { label: "Messages", value: `${messages.length}` },
    { label: "Tests", value: `${dashboard.tests.length}` },
    { label: "Results", value: `${submissions.length}` },
  ];

  useEffect(() => {
    if (showPerformance && performanceReports.length === 0 && !isPerformanceLoading) {
      void refreshPerformance();
    }
  }, [showPerformance]);

  async function refreshPerformance() {
    setIsPerformanceLoading(true);
    try {
      // Fetch Reports
      const reportRes = await fetch("/api/performance", {
        method: "GET",
        credentials: "same-origin",
      });
      if (reportRes.ok) {
        const payload = await reportRes.json();
        if (payload.reports) setPerformanceReports(payload.reports);
      }

      // Fetch Heuristics (Always fetch for educator to allow editing, or default for student)
      const educatorId = role === "student" ? performanceReports[0]?.createdBy : session?.id;
      if (educatorId) {
        const heuristicsRes = await fetch(`/api/performance?educatorId=${educatorId}`, {
          method: "GET",
          credentials: "same-origin",
        });
        if (heuristicsRes.ok) {
          const payload = await heuristicsRes.json();
          if (payload.heuristics) setHeuristics(payload.heuristics);
        }
      }
    } catch {
      // Keep existing state
    } finally {
      setIsPerformanceLoading(false);
    }
  }

  useEffect(() => {
    if (showLibrary && libraryBooks.length === 0 && !isLibraryLoading) {
      void refreshLibrary();
    }
  }, [showLibrary]);

  async function refreshLibrary() {
    setIsLibraryLoading(true);
    try {
      const response = await fetch("/api/digital-library", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (response.ok) {
        const payload = (await response.json()) as { books?: LibraryBook[] };
        if (payload.books) {
          setLibraryBooks(payload.books);
        }
      }
    } catch {
      // Keep existing library state if refresh fails.
    } finally {
      setIsLibraryLoading(false);
    }
  }
  const workspaceChecklist = [
    "Profile identity and current access level",
    "Live notices from the message center",
    "Current tests, results, and role-specific workflow status",
  ];

  useEffect(() => {
    let isMounted = true;

    async function refreshMessages() {
      try {
        const response = await fetch("/api/messages", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (response.status === 401) {
          return;
        }

        const payload = (await response.json()) as { messages?: MessageItem[] };

        if (!response.ok || !payload.messages || !isMounted) {
          return;
        }

        setMessages(payload.messages);
      } catch {
        // Keep existing message state if refresh fails.
      }
    }

    void refreshMessages();

    const interval = window.setInterval(() => {
      void refreshMessages();
    }, 12000);

    const handleFocus = () => {
      void refreshMessages();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [session?.id]);

  return (
    <main className="section-shell min-h-screen overflow-x-hidden pb-10 pt-8">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="dashboard-sidebar overflow-hidden rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="truncate text-3xl font-semibold tracking-[-0.06em] text-[var(--color-heading)]">
              Smart Tutors
            </Link>
            <ThemeToggle />
          </div>

          <div className="surface-soft mt-8 rounded-[1.75rem] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Active Session
            </p>
            <p className="mt-3 truncate text-lg font-bold text-[var(--color-heading)] sm:text-xl" title={session?.name}>
              {session ? session.name : "Smart Tutors"}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-[var(--color-muted)]" title={session?.email}>
              {session ? session.email : "Login required"}
            </p>
            <span className="mt-4 inline-flex max-w-full truncate rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-heading)]">
              {dashboard.roleLabel}
            </span>
            {session ? (
              <div className="mt-5">
                <LogoutButton />
              </div>
            ) : null}
          </div>

          <nav className="mt-8 grid gap-2.5">
            {sidebarByRole[role].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`rounded-[1.25rem] px-4 py-3 text-left text-sm font-bold transition-all ${
                  activeSection === item.id
                    ? "bg-[var(--color-primary)] text-white shadow-md shadow-blue-500/20"
                    : "border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-heading)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 grid gap-4">
            <LiveClock label="Workspace Clock" />
            <div className="surface-soft rounded-[1.75rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-strong)]">
                Support
              </p>
              <p className="mt-3 break-words text-sm leading-6 text-[var(--color-muted)]">{supportContact}</p>
            </div>
          </div>
        </aside>

        <section className="grid min-w-0 gap-6">
          <header className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-4xl">
                <p className="section-label">Post-Login Workspace</p>
                <h1 className="mt-3 break-words text-3xl font-semibold tracking-[-0.05em] text-[var(--color-heading)] sm:text-4xl">
                  {dashboard.heroTitle}
                </h1>
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                  {dashboard.heroDescription}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <LiveClock label="Campus Time" />
                <div className="surface-soft rounded-3xl p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    API Scope
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-heading)]">
                    Auth, dashboard, courses, users, tests, and messages are wired.
                  </p>
                </div>
              </div>
            </div>
          </header>

          {showOverview ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.stats.map((item) => (
                  <article key={item.label} className="surface overflow-hidden rounded-[1.25rem] p-4 sm:p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      {item.label}
                    </p>
                    <p className="mt-3 break-words text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)] sm:text-3xl">
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <article className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="section-label">Priority Board</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                        {dashboard.primaryPanel.title}
                      </h2>
                    </div>
                    <span className="pill">{dashboard.primaryPanel.badge}</span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    {dashboard.primaryPanel.items.map((item) => (
                      <div key={item.title} className="surface-soft rounded-3xl p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-[var(--color-heading)]">{item.title}</p>
                            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{item.description}</p>
                          </div>
                          <span className="pill">{item.meta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <div className="grid gap-6">
                  <article className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-[var(--color-highlight)] text-xl font-semibold text-[var(--color-accent)]">
                        {getInitials(session?.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="section-label">Profile</p>
                        <p className="mt-3 break-words text-xl font-semibold text-[var(--color-heading)]">
                          {session ? session.name : "Smart Tutors User"}
                        </p>
                        <p className="mt-2 break-all text-sm leading-6 text-[var(--color-muted)]">
                          {session ? session.email : "Login required"}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          {getRoleFocus(role)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {profileHighlights.map((item) => (
                        <div key={item.label} className="surface-soft rounded-3xl p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            {item.label}
                          </p>
                          <p className="mt-2 break-words text-base font-semibold text-[var(--color-heading)]">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="surface-soft rounded-3xl p-5">
                        <p className="text-sm font-semibold text-[var(--color-heading)]">Workspace checklist</p>
                        <div className="mt-4 grid gap-3">
                          {workspaceChecklist.map((item) => (
                            <div key={item} className="flex items-start gap-3">
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                              <p className="min-w-0 text-sm leading-6 text-[var(--color-muted)]">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="surface-soft rounded-3xl p-5">
                        <p className="text-sm font-semibold text-[var(--color-heading)]">Support contact</p>
                        <p className="mt-3 break-words text-sm leading-6 text-[var(--color-muted)]">
                          {supportContact}
                        </p>
                      </div>
                    </div>
                  </article>

                  <article className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
                    <p className="section-label">Permissions + Notices</p>
                    <div className="mt-5 grid gap-4">
                      <div className="surface-soft rounded-3xl p-5">
                        <p className="text-lg font-semibold text-[var(--color-heading)]">Permissions</p>
                        <div className="mt-4 space-y-3">
                          {dashboard.permissions.map((group) => (
                            <div key={group.title}>
                              <p className="text-sm font-semibold text-[var(--color-heading)]">{group.title}</p>
                              <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">{group.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {messages.length ? (
                        <div className="surface-soft rounded-3xl p-5">
                          <p className="text-lg font-semibold text-[var(--color-heading)]">Recent notices</p>
                          <div className="mt-4 space-y-3">
                            {messages.slice(0, 3).map((message) => (
                              <div key={message.id}>
                                <p className="text-sm font-semibold text-[var(--color-heading)]">
                                  {message.title}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                                  {message.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                </div>
              </section>
            </>
          ) : null}

          {showMessages ? (
            <DashboardMessageCenter
              session={session}
              role={role}
              messages={messages}
              studentDirectory={studentDirectory}
              onMessagesChange={setMessages}
            />
          ) : null}

          {showTests ? (
            <DashboardTestStudio
              session={session}
              role={role}
              initialTests={dashboard.tests}
              submissions={submissions}
              studentDirectory={studentDirectory}
              onSubmissionsChange={setSubmissions}
              onMessagePublished={(message) => setMessages((current) => [message, ...current])}
            />
          ) : null}

          {showAccounts && role === "admin" ? (
            <DashboardAccountDirectory initialUsers={managedUsers} />
          ) : null}

          {showCourses && role === "admin" ? (
            <DashboardCourseManager
              initialCourses={dashboard.courses}
              courseOptions={courseOptions}
            />
          ) : null}

          {role !== "admin" && showCourses ? (
            <article className="surface rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-label">Courses</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                    Active tracks
                  </h2>
                </div>
                <span className="pill">{dashboard.courses.length} items</span>
              </div>
              <div className="mt-6 grid gap-4">
                {dashboard.courses.map((course) => (
                  <div key={course.id} className="surface-soft rounded-3xl p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[var(--color-heading)]">{course.title}</p>
                        <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{course.summary}</p>
                      </div>
                      <span className="pill">{course.schedule}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {showResults ? (
            <article className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-label">Results</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                    Results
                  </h2>
                </div>
                <span className="pill">{submissions.length} entries</span>
              </div>
              <div className="mt-6 grid gap-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="surface-soft rounded-3xl p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="truncate text-lg font-semibold text-[var(--color-heading)]" title={submission.studentName}>
                          {submission.studentName}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          Score {submission.score ?? "Pending"}/{submission.total} | {submission.publishedMessageTitle}
                        </p>
                        {submission.feedback ? (
                          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{submission.feedback}</p>
                        ) : null}
                      </div>
                      <span className="pill">{submission.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {showLibrary ? (
            <article className="surface rounded-[2rem] p-5 sm:p-6">
              <div className="mb-8">
                <p className="section-label">Resource Center</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-heading)]">
                  Digital Library
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Access and manage curated study materials and revision guides.
                </p>
              </div>

              {isLibraryLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
                </div>
              ) : (
                <DigitalLibraryClient
                  initialBooks={libraryBooks}
                  canManage={role === "admin" || role === "educator"}
                />
              )}
            </article>
          ) : null}

          {showPerformance ? (
            <article className="surface rounded-[2rem] p-5 sm:p-6">
              <div className="mb-8">
                <p className="section-label">Analytics Hub</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-heading)]">
                  {role === "student" ? "Your Performance" : "Student Analytics"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {role === "student" 
                    ? "Track your academic progress, strengths, and areas for improvement."
                    : "Manage and create detailed performance reports for your students."}
                </p>
              </div>

              {isPerformanceLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-12">
                  {role !== "student" && (
                    <PerformanceReportCreator
                      session={session}
                      studentDirectory={studentDirectory}
                      onReportCreated={(newReport) => {
                        setPerformanceReports([newReport, ...performanceReports]);
                        // Optionally switch to a view mode or show success
                      }}
                    />
                  )}
                  
                  {(performanceReports.length > 0) && (
                    <div className={role !== "student" ? "pt-12 border-t border-[var(--color-border)]" : ""}>
                      <PerformanceDashboard
                        reports={performanceReports}
                        heuristics={heuristics}
                        studentName={session?.name}
                      />
                    </div>
                  )}

                  {performanceReports.length === 0 && role === "student" && (
                    <div className="text-center py-12">
                      <p className="text-[var(--color-muted)]">No performance reports have been published for you yet.</p>
                    </div>
                  )}
                </div>
              )}
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
