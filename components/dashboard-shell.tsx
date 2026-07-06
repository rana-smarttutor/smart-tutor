"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Menu, X } from "lucide-react";
import { LiveClock } from "@/components/live-clock";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AttendanceManager } from "@/components/attendance-manager";
import { InvoiceManager } from "@/components/invoice-manager";
import { LectureManager } from "@/components/lecture-manager";
import { DailyLearningActivityManager } from "./daily-learning-activity-manager";
import { FeeInstallmentManager } from "./fee-installment-manager";
import { TeacherPayoutManager } from "./teacher-payout-manager";
import { NotificationCenter } from "./notification-center";
import { NotificationBell } from "./notification-bell";
import { DashboardAnalytics } from "./dashboard-analytics";
import type {
  DashboardBundle,
  LibraryBook,
  ManagedUser,
  MessageItem,
  PerformanceHeuristics,
  PerformanceReport,
  Role,
  SessionUser,
  TestSubmission,
} from "@/lib/types";
import { DEFAULT_HEURISTICS } from "@/lib/data-store";
import { StudentFeedbackManager } from "./student-feedback-manager";
function SectionLoading() {
  return (
    <div
      className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-6"
      aria-label="Loading section"
    >
      <div className="mb-4 h-6 w-44 animate-pulse rounded-lg bg-[var(--color-border)]" />
      <div className="mb-3 h-14 animate-pulse rounded-xl bg-[var(--color-border)]" />
      <div className="mb-3 h-14 animate-pulse rounded-xl bg-[var(--color-border)]" />
      <div className="h-14 animate-pulse rounded-xl bg-[var(--color-border)]" />
    </div>
  );
}

const DashboardAccountDirectory = dynamic(
  () =>
    import("@/components/dashboard-account-directory").then(
      (module) => module.DashboardAccountDirectory,
    ),
  { loading: () => <SectionLoading /> },
);

const AdminStudentManager = dynamic(
  () => import("@/components/admin-student-manager"),
  { loading: () => <SectionLoading /> },
);

const DashboardCourseManager = dynamic(
  () =>
    import("@/components/dashboard-course-manager").then(
      (module) => module.DashboardCourseManager,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const DashboardMessageCenter = dynamic(
  () =>
    import("@/components/dashboard-message-center").then(
      (module) => module.DashboardMessageCenter,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const DashboardTestStudio = dynamic(
  () =>
    import("@/components/dashboard-test-studio").then(
      (module) => module.DashboardTestStudio,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const DigitalLibraryClient = dynamic(
  () =>
    import("@/components/digital-library-client").then(
      (module) => module.DigitalLibraryClient,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const PerformanceReportCreator = dynamic(
  () =>
    import("@/components/performance-report-creator").then(
      (module) => module.PerformanceReportCreator,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const PerformanceDashboard = dynamic(
  () =>
    import("@/components/performance-dashboard").then(
      (module) => module.PerformanceDashboard,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const DashboardEnquiryManager = dynamic(
  () =>
    import("@/components/dashboard-enquiry-manager").then(
      (module) => module.DashboardEnquiryManager,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const PasswordResetRequestManager = dynamic(
  () =>
    import("@/components/password-reset-request-manager").then(
      (module) => module.PasswordResetRequestManager,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const SalesCrmManager = dynamic(
  () =>
    import("@/components/sales-crm-manager").then(
      (module) => module.SalesCrmManager,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const PlacementJobsManager = dynamic(
  () =>
    import("@/components/placement-jobs-manager").then(
      (module) => module.PlacementJobsManager,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const WeeklyTestManager = dynamic(
  () =>
    import("@/components/weekly-test-manager").then(
      (module) => module.WeeklyTestManager,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const BatchManager = dynamic(
  () =>
    import("@/components/batch-manager").then((module) => module.BatchManager),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const HomeworkSection = dynamic(
  () =>
    import("@/components/homework-section").then(
      (module) => module.HomeworkSection,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

const TimetableManager = dynamic(
  () =>
    import("@/components/timetable-manager").then(
      (module) => module.TimetableManager,
    ),
  {
    loading: () => <SectionLoading />,
    ssr: false,
  },
);

type StandaloneStudentReport = {
  id: string;
  title: string;
  period: string;
  periodLabel: string;
  reportType: "weekly" | "monthly" | string;
  createdAt?: string | null;
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
    { id: "lectures", label: "Lectures" },
    { id: "timetable", label: "Timetable" },
    { id: "messages", label: "Messages" },
    { id: "homework", label: "Homework" },
    { id: "attendance", label: "Attendance" },
    { id: "notifications", label: "Notifications" },
    { id: "tests", label: "My Tests" },
    { id: "weekly-tests", label: "Weekly Tests" },
    { id: "student-feedback", label: "Feedback & Behaviour" },
    { id: "daily-activities", label: "Daily Learning" },
    { id: "performance", label: "Performance Reports" },
    { id: "fees", label: "Fees" },
    { id: "fee-installments", label: "Fees & Installments" },
    { id: "library", label: "Library" },
  ],

  educator: [
    { id: "overview", label: "Overview" },
    { id: "lectures", label: "Lectures" },
    { id: "timetable", label: "Timetable" },
    { id: "messages", label: "Messages" },
    { id: "homework", label: "Homework" },
    { id: "attendance", label: "Attendance" },
    { id: "notifications", label: "Notifications" },
    { id: "tests", label: "Test Studio" },
    { id: "weekly-tests", label: "Weekly Tests" },
    { id: "student-feedback", label: "Feedback & Behaviour" },
    { id: "daily-activities", label: "Daily Activities" },
    { id: "results", label: "Results" },
    { id: "fees", label: "Invoices" },
    { id: "teacher-payouts", label: "My Earnings" },
    { id: "library", label: "Library" },
  ],

  counsellor: [
    { id: "overview", label: "Overview" },
    { id: "messages", label: "Messages" },
    { id: "fees", label: "Invoices" },
    { id: "fee-installments", label: "Fee Plans" },
    { id: "notifications", label: "Notifications" },
    { id: "sales-crm", label: "Sales CRM" },
  ],

  admin: [
    { id: "overview", label: "Overview" },
    { id: "messages", label: "Messages" },
    { id: "notifications", label: "Notifications" },
    { id: "enquiries", label: "Enquiries" },
    { id: "password-reset-requests", label: "Password Reset Requests" },
    { id: "sales-crm", label: "Sales CRM" },
    { id: "placement-jobs", label: "Placement Jobs" },
    { id: "tests", label: "Test Studio" },
    { id: "weekly-tests", label: "Weekly Tests" },
    { id: "student-feedback", label: "Feedback & Behaviour" },
    { id: "daily-activities", label: "Daily Activities" },
    { id: "performance", label: "Analytics Hub" },
    { id: "courses", label: "Courses" },
    { id: "students", label: "Students" },
    { id: "accounts", label: "Accounts" },
    { id: "attendance", label: "Attendance" },
    { id: "fees", label: "Invoices" },
    { id: "fee-installments", label: "Fee Plans" },
    { id: "teacher-payouts", label: "Teacher Payouts" },
    { id: "batches", label: "Batch Management" },
    { id: "lectures", label: "Lectures" },
    { id: "timetable", label: "Timetable" },
    { id: "library", label: "Library" },
  ],

  parent: [
    { id: "overview", label: "Overview" },
    { id: "messages", label: "Messages" },
    { id: "notifications", label: "Notifications" },
    { id: "weekly-tests", label: "Weekly Tests" },
    { id: "student-feedback", label: "Feedback & Behaviour" },
    { id: "attendance", label: "Attendance" },
    { id: "fees", label: "Fees" },
    { id: "fee-installments", label: "Fees & Installments" },
    { id: "lectures", label: "Lectures" },
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

  if (role === "parent") {
    return "Monitor academic progress, attendance, and mentor feedback.";
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

const menuSections = [
  { label: "Overview", items: ["overview", "lectures", "timetable", "messages", "attendance", "notifications"] },
  { label: "Academics", items: ["tests", "weekly-tests", "results", "daily-activities", "student-feedback"] },
  { label: "People", items: ["accounts", "enquiries", "password-reset-requests", "sales-crm", "placement-jobs"] },
  { label: "Curriculum", items: ["courses", "batches", "library", "performance"] },
  { label: "Finance", items: ["fees", "fee-installments", "teacher-payouts"] },
];

const navIcons: Record<string, React.ReactNode> = {
  overview: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  lectures: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  timetable: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  messages: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  attendance: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  notifications: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  tests: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  "weekly-tests": <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  results: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  "daily-activities": <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  accounts: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  enquiries: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  "password-reset-requests": <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  "student-feedback": <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>,
  "sales-crm": <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  "placement-jobs": <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  courses: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  batches: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  library: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  performance: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  fees: <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  "fee-installments": <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  "teacher-payouts": <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

export function DashboardShell({
  session,
  role,
  dashboard,
  studentDirectory,
  managedUsers,
  courseOptions,
  supportContact,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(
    sidebarByRole[role][0]?.id ?? "overview",
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeSection]);
  const [messages, setMessages] = useState<MessageItem[]>(dashboard.messages);
  const [submissions, setSubmissions] = useState<TestSubmission[]>(
    dashboard.submissions,
  );
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [performanceReports, setPerformanceReports] = useState<
    PerformanceReport[]
  >([]);
  const [heuristics, setHeuristics] =
    useState<PerformanceHeuristics>(DEFAULT_HEURISTICS);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [standaloneStudentReports, setStandaloneStudentReports] = useState<
    StandaloneStudentReport[]
  >([]);
  const [isStandaloneReportsLoading, setIsStandaloneReportsLoading] =
    useState(false);

  const showOverview = activeSection === "overview";
  const showMessages = activeSection === "messages";
  const showHomework = activeSection === "homework";
  const showNotifications = activeSection === "notifications";
  const showEnquiries = activeSection === "enquiries";
  const showPasswordResetRequests = activeSection === "password-reset-requests";
  const showSalesCrm = activeSection === "sales-crm";
  const showPlacementJobs = activeSection === "placement-jobs";
  const showTests = activeSection === "tests";
  const showResults = activeSection === "results";
  const showCourses = activeSection === "courses";
  const showStudents = activeSection === "students";
  const showAccounts = activeSection === "accounts";
  const showBatches = activeSection === "batches";
  const showLibrary = activeSection === "library";
  const showPerformance = activeSection === "performance";
  const showAttendance = activeSection === "attendance";
  const showFees = activeSection === "fees";
  const showLectures = activeSection === "lectures";
  const showTimetable = activeSection === "timetable";
  const showWeeklyTests = activeSection === "weekly-tests";
  const showStudentFeedback = activeSection === "student-feedback";
  const showDailyActivities = activeSection === "daily-activities";
  const showFeeInstallments = activeSection === "fee-installments";
  const showTeacherPayouts = activeSection === "teacher-payouts";

  const profileHighlights = [
    { label: "Role", value: dashboard.roleLabel },
    ...(role === "student" || role === "parent"
      ? [{ label: "Student ID", value: session?.id ?? "—" }]
      : []),
    ...(role === "student" || role === "parent"
      ? [{ label: "Assigned Faculty", value: (dashboard.assignedFacultyNames ?? []).length > 0 ? dashboard.assignedFacultyNames!.join(", ") : "To be assigned soon" }]
      : []),
    ...(role === "educator"
      ? [{ label: "Assigned Students", value: `${studentDirectory.length}` }]
      : []),
    { label: "Messages", value: `${messages.length}` },
    { label: "Tests", value: `${dashboard.tests.length}` },
  ];

  useEffect(() => {
    if (
      showPerformance &&
      performanceReports.length === 0 &&
      !isPerformanceLoading
    ) {
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
      const educatorId =
        role === "student" ? performanceReports[0]?.createdBy : session?.id;
      if (educatorId) {
        const heuristicsRes = await fetch(
          `/api/performance?educatorId=${educatorId}`,
          {
            method: "GET",
            credentials: "same-origin",
          },
        );
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
    if (!showPerformance || role !== "student") {
      return;
    }

    let isMounted = true;

    async function loadStandaloneStudentReports() {
      setIsStandaloneReportsLoading(true);

      try {
        const response = await fetch("/api/student-performance/reports/mine", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const payload = (await response.json()) as {
          reports?: StandaloneStudentReport[];
        };

        if (!isMounted) {
          return;
        }

        setStandaloneStudentReports(response.ok ? payload.reports || [] : []);
      } catch {
        if (isMounted) {
          setStandaloneStudentReports([]);
        }
      } finally {
        if (isMounted) {
          setIsStandaloneReportsLoading(false);
        }
      }
    }

    void loadStandaloneStudentReports();

    return () => {
      isMounted = false;
    };
  }, [role, showPerformance]);

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
  const workspaceChecklist =
    role === "student"
      ? [
          "Complete pending tests and review graded results",
          "Check today's lecture schedule and study materials",
          "Track attendance and fee status regularly",
        ]
      : role === "parent"
        ? [
            "Review your child's academic progress and test reports",
            "Check attendance regularity and fee invoices",
            "Read institute notices and mentor messages",
          ]
        : [
            "Profile identity and current access level",
            "Live notices from the message center",
            "Current tests, results, and role-specific workflow status",
          ];

  useEffect(() => {
    if (!showMessages) {
      return;
    }

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
      if (document.visibilityState === "visible") {
        void refreshMessages();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [showMessages, session?.id]);

  return (
    <main className="section-shell min-h-screen overflow-x-hidden pb-10 pt-8">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="xl:grid xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-6">
        {/* Sidebar - fixed drawer on mobile, static column on desktop */}
        <aside
          className={`fixed top-0 left-0 z-50 flex h-full w-[280px] flex-col overflow-y-auto dashboard-sidebar transition-transform duration-300 xl:static xl:z-auto xl:h-fit xl:rounded-[2rem] xl:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
          }`}
        >

          {/* Brand + close */}
          <div className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
            <Link
              href="/"
              className="truncate text-2xl font-bold tracking-[-0.04em] text-[var(--color-heading)]"
            >
              Smart Tutors
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] xl:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-5 sm:px-6 mt-5">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search menu..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-xs text-[var(--color-heading)] outline-none transition focus:border-[var(--color-primary)]"
                onInput={(e) => {
                  const q = (e.target as HTMLInputElement).value.toLowerCase();
                  document.querySelectorAll(".sb-nav-item").forEach((el) => {
                    const parent = el.closest(".sb-group");
                    const label = el.getAttribute("data-label") || "";
                    const match = label.includes(q);
                    (el as HTMLElement).style.display = match || !q ? "" : "none";
                    if (parent) (parent as HTMLElement).style.display = match || !q ? "" : "none";
                  });
                }}
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="mt-4 flex-1 overflow-y-auto px-3 sm:px-4 space-y-1">
            {menuSections.map((section) => {
              const sectionItems = sidebarByRole[role].filter((item) =>
                section.items.includes(item.id),
              );
              if (!sectionItems.length) return null;
              return (
                <div key={section.label} className="sb-group">
                  <div className="sb-section-label">
                    {section.label}
                  </div>
                  {sectionItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      data-label={item.label.toLowerCase()}
                      className={`sb-nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        activeSection === item.id
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold"
                          : "text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] hover:text-[var(--color-heading)]"
                      }`}
                      onClick={() => setActiveSection(item.id)}
                    >
                      {navIcons[item.id] || (
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--color-border)] px-4 sm:px-5 py-4">
            <div className="flex items-center gap-3">
              {dashboard.profile?.profilePhoto ? (
                <img
                  src={dashboard.profile.profilePhoto}
                  alt={session?.name ?? "User"}
                  className="h-9 w-9 shrink-0 rounded-full border border-[var(--color-border)] object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]">
                  {getInitials(session?.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--color-heading)]">
                  {session?.name ?? "Smart Tutors"}
                  {session?.verified ? (
                    <span className="ml-1 text-[10px] text-[var(--color-success)]">✓</span>
                  ) : null}
                </p>
                <p className="truncate text-[11px] text-[var(--color-muted)]">
                  {dashboard.roleLabel}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="surface flex items-center justify-between gap-4 rounded-[1.5rem] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] xl:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {dashboard.roleLabel}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[var(--color-heading)]">
                  {session?.name ?? "Smart Tutors"}
                </p>
              </div>
            </div>

            <NotificationBell
              onOpenNotifications={() => setActiveSection("notifications")}
            />
          </header>

          {showOverview ? (
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
                {role === "student" || role === "parent" ? (
                  <div className="grid gap-3 sm:grid-cols-1 min-w-[200px]">
                    <div className="surface-soft rounded-3xl p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--color-primary-soft)]">
                          <svg className="h-3.5 w-3.5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Assigned Faculty
                        </p>
                      </div>
                      <div className="mt-3">
                        {dashboard.assignedFacultyNames && dashboard.assignedFacultyNames.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {dashboard.assignedFacultyNames.map((name, i) => (
                              <div key={i} className="flex items-center gap-2.5 rounded-xl bg-[var(--color-panel)] px-3 py-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[10px] font-bold text-[var(--color-primary)]">
                                  {name.charAt(0)}
                                </div>
                                <span className="text-sm font-semibold text-[var(--color-heading)]">{name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm leading-6 text-[var(--color-muted)]">To be assigned soon</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <LiveClock label="Campus Time" />
                    <div className="surface-soft rounded-3xl p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        API Scope
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-heading)]">
                        Auth, dashboard, courses, users, tests, and messages are
                        wired.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </header>
          ) : null}

          {showOverview ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.stats.map((item) => (
                  <article
                    key={item.label}
                    className="surface overflow-hidden rounded-[1.25rem] p-4 sm:p-5"
                  >
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

              {dashboard.analytics ? (
                <DashboardAnalytics
                  role={role}
                  analytics={dashboard.analytics}
                />
              ) : null}

              <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <article className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="section-label">Message Board</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                        Recent Updates
                      </h2>
                    </div>
                    <span className="pill">{messages.length} messages</span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    {messages.length ? (
                      messages.slice(0, 4).map((message) => (
                        <div
                          key={message.id}
                          className="surface-soft rounded-3xl p-5"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-lg font-semibold text-[var(--color-heading)]">
                                {message.title}
                              </p>
                              <span className="pill shrink-0">
                                {message.channel}
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-[var(--color-muted)]">
                              {message.body}
                            </p>
                            {message.author ? (
                              <p className="text-xs font-medium text-[var(--color-muted)] opacity-60">
                                — {message.author}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="surface-soft rounded-3xl p-5">
                        <p className="text-sm leading-6 text-[var(--color-muted)]">
                          No messages yet.
                        </p>
                      </div>
                    )}
                  </div>
                </article>

                <div className="grid gap-6">
                  <article className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      {dashboard.profile?.profilePhoto ? (
                        <img
                          src={dashboard.profile.profilePhoto}
                          alt={session?.name ?? "User"}
                          className="h-20 w-20 shrink-0 rounded-[1.6rem] border-2 border-[var(--color-border)] object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-strong)] text-2xl font-bold text-white shadow-md">
                          {getInitials(session?.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="section-label" style={{ marginBottom: 0 }}>Profile</p>
                          {session?.verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] text-[10px] font-bold leading-none">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-muted)]/10 text-[var(--color-muted)] text-[10px] font-bold leading-none">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="mt-2 break-words text-xl font-bold tracking-tight text-[var(--color-heading)]">
                          {session ? session.name : "Smart Tutors User"}
                        </p>
                        <p className="mt-1.5 break-all text-sm leading-6 text-[var(--color-muted)]">
                          {session ? session.email : "Login required"}
                        </p>
                        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary)]">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {getRoleFocus(role)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2.5">
                      {profileHighlights.map((item, idx) => {
                        const accentColor = idx === 0
                          ? "var(--color-primary)"
                          : idx === 1
                            ? "var(--color-secondary)"
                            : idx === 2
                              ? "var(--color-purple)"
                              : idx === 3
                                ? "var(--color-amber)"
                                : "var(--color-muted)";
                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 transition hover:shadow-sm"
                          >
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                              style={{ background: accentColor }}
                            >
                              {item.label.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                                {item.label}
                              </p>
                              <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-heading)]">
                                {item.value}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {role === "student" && dashboard.profile ? (
                      <div className="mt-5">
                        <div className="surface-soft rounded-[1.5rem] p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--color-primary-soft)]">
                              <svg className="h-3.5 w-3.5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <p className="text-sm font-bold text-[var(--color-heading)]">
                              Academic Profile
                            </p>
                          </div>
                          <div className="grid gap-3">
                            {dashboard.profile.courseWantedTitle ? (
                              <div className="flex items-center gap-3 rounded-xl bg-[var(--color-panel)] px-4 py-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary)]">
                                  C
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Course</p>
                                  <p className="text-sm font-semibold text-[var(--color-heading)]">{dashboard.profile.courseWantedTitle}</p>
                                </div>
                              </div>
                            ) : null}
                            {dashboard.profile.studentType ? (
                              <div className="flex items-center gap-3 rounded-xl bg-[var(--color-panel)] px-4 py-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-secondary-soft)] text-xs font-bold text-[var(--color-secondary)]">
                                  T
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Type</p>
                                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                                    {dashboard.profile.studentType === "on-campus"
                                      ? "On Campus"
                                      : "Home Student"}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                            {dashboard.profile.weakSubjects &&
                            dashboard.profile.weakSubjects.length > 0 ? (
                              <div className="flex items-center gap-3 rounded-xl bg-[var(--color-panel)] px-4 py-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-purple-soft)] text-xs font-bold text-[var(--color-purple)]">
                                  F
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Focus Areas</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {dashboard.profile.weakSubjects.map((s) => (
                                      <span key={s} className="rounded-md bg-[var(--color-amber-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-amber-strong)]">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                            {dashboard.profile.latestQualification ? (
                              <div className="flex items-center gap-3 rounded-xl bg-[var(--color-panel)] px-4 py-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary)]">
                                  Q
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Qualification</p>
                                  <p className="text-sm font-semibold text-[var(--color-heading)]">{dashboard.profile.latestQualification}</p>
                                </div>
                              </div>
                            ) : null}
                            {dashboard.profile.latestAcademicScore ? (
                              <div className="flex items-center gap-3 rounded-xl bg-[var(--color-panel)] px-4 py-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-success)]/10 text-xs font-bold text-[var(--color-success)]">
                                  S
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Latest Score</p>
                                  <p className="text-sm font-semibold text-[var(--color-heading)]">{dashboard.profile.latestAcademicScore}</p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {role === "educator" && dashboard.profile ? (
                      <div className="mt-5">
                        <div className="surface-soft rounded-3xl p-5">
                          <p className="text-sm font-semibold text-[var(--color-heading)]">
                            Professional Profile
                          </p>
                          <div className="mt-3 grid gap-2">
                            {dashboard.profile.qualification ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] w-20 shrink-0">
                                  Qualification
                                </span>
                                <span className="font-medium text-[var(--color-heading)]">
                                  {dashboard.profile.qualification}
                                </span>
                              </div>
                            ) : null}
                            {dashboard.profile.experience ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] w-20 shrink-0">
                                  Experience
                                </span>
                                <span className="font-medium text-[var(--color-heading)]">
                                  {dashboard.profile.experience}
                                </span>
                              </div>
                            ) : null}
                            {dashboard.profile.subjects &&
                            dashboard.profile.subjects.length > 0 ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] w-20 shrink-0">
                                  Subjects
                                </span>
                                <span className="font-medium text-[var(--color-heading)]">
                                  {dashboard.profile.subjects.join(", ")}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-5 grid gap-3">
                      <div className="surface-soft rounded-3xl p-5">
                        <p className="text-sm font-semibold text-[var(--color-heading)]">
                          Workspace checklist
                        </p>
                        <div className="mt-4 grid gap-3">
                          {workspaceChecklist.map((item) => (
                            <div key={item} className="flex items-start gap-3">
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                              <p className="min-w-0 text-sm leading-6 text-[var(--color-muted)]">
                                {item}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="surface-soft rounded-3xl p-5">
                        <p className="text-sm font-semibold text-[var(--color-heading)]">
                          Support contact
                        </p>
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
                        <p className="text-lg font-semibold text-[var(--color-heading)]">
                          Permissions
                        </p>
                        <div className="mt-4 space-y-3">
                          {dashboard.permissions.map((group) => (
                            <div key={group.title}>
                              <p className="text-sm font-semibold text-[var(--color-heading)]">
                                {group.title}
                              </p>
                              <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
                                {group.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {messages.length ? (
                        <div className="surface-soft rounded-3xl p-5">
                          <p className="text-lg font-semibold text-[var(--color-heading)]">
                            Recent notices
                          </p>
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
              managedUsers={managedUsers}
              assignedFacultyIds={dashboard.assignedFacultyIds}
              assignedFacultyNames={dashboard.assignedFacultyNames}
            />
          ) : null}

          {showHomework && (role === "student" || role === "educator") ? (
            <HomeworkSection
              session={session}
              role={role}
              studentDirectory={studentDirectory}
            />
          ) : null}

          {showNotifications ? (
            <NotificationCenter role={role} managedUsers={managedUsers} />
          ) : null}

          {showEnquiries && role === "admin" ? (
            <DashboardEnquiryManager />
          ) : null}

          {showPasswordResetRequests && role === "admin" ? (
            <PasswordResetRequestManager />
          ) : null}

          {showSalesCrm && (role === "admin" || role === "counsellor") ? (
            <SalesCrmManager role={role} />
          ) : null}

          {showPlacementJobs && role === "admin" ? (
            <PlacementJobsManager />
          ) : null}

          {showTests ? (
            <>
              <DashboardTestStudio
                session={session}
                role={role}
                initialTests={dashboard.tests}
                submissions={submissions}
                studentDirectory={studentDirectory}
                onSubmissionsChange={setSubmissions}
                onMessagePublished={(message) =>
                  setMessages((current) => [message, ...current])
                }
              />

              {role === "student" && submissions.length > 0 ? (
                <article className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="section-label">Graded Results</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                        Your Test Results
                      </h2>
                    </div>
                    <span className="pill">{submissions.length} entries</span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="surface-soft rounded-3xl p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-[var(--color-heading)]">
                              {submission.publishedMessageTitle}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                              Score {submission.score ?? "Pending"}/
                              {submission.total}
                            </p>
                            {submission.feedback ? (
                              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                                {submission.feedback}
                              </p>
                            ) : null}
                          </div>
                          <span className="pill">{submission.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </>
          ) : null}

          {showStudents && role === "admin" ? (
            <AdminStudentManager initialStudents={studentDirectory} />
          ) : null}

          {showAccounts && role === "admin" ? (
            <DashboardAccountDirectory initialUsers={managedUsers} />
          ) : null}

          {showBatches && role === "admin" ? (
            <BatchManager managedUsers={managedUsers} />
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
                  <p className="section-label">Course / Program Master</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                    Top-level hierarchy: Course → Subject → Topic
                  </h2>
                </div>
                <span className="pill">{dashboard.courses.length} courses</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {dashboard.courses.map((course) => (
                  <div
                    key={course.id}
                    className="surface-soft rounded-2xl border border-[var(--color-border)] p-5 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-bold text-[var(--color-heading)]">{course.title}</p>
                      <span className="shrink-0 rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
                        Active
                      </span>
                    </div>
                    {course.courseNamesIncluded.length > 0 ? (
                      <code className="mt-2 inline-block rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                        {course.courseNamesIncluded[0]}
                      </code>
                    ) : null}
                    {course.summary ? (
                      <p className="mt-2 text-xs leading-5 text-[var(--color-muted)] line-clamp-2">
                        {course.summary}
                      </p>
                    ) : null}
                    <div className="mt-4 flex gap-3">
                      <div className="text-center">
                        <p className="text-lg font-extrabold text-[var(--color-primary)]">{course.subjectsCovered.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Subjects</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-extrabold text-[var(--color-success)]">1</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Batches</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-extrabold text-[var(--color-warning)]">{course.duration}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Months</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {(role === "educator" || role === "admin") && showResults ? (
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
                  <div
                    key={submission.id}
                    className="surface-soft rounded-3xl p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p
                          className="truncate text-lg font-semibold text-[var(--color-heading)]"
                          title={submission.studentName}
                        >
                          {submission.studentName}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          Score {submission.score ?? "Pending"}/
                          {submission.total} |{" "}
                          {submission.publishedMessageTitle}
                        </p>
                        {submission.feedback ? (
                          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                            {submission.feedback}
                          </p>
                        ) : null}
                      </div>
                      <span className="pill">{submission.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {showWeeklyTests ? (
            <WeeklyTestManager
              role={role}
              studentDirectory={studentDirectory}
              userId={session?.id}
              linkedStudentId={dashboard.linkedStudentId}
            />
          ) : null}

          {showStudentFeedback ? (
            <StudentFeedbackManager
              role={role}
              studentDirectory={studentDirectory}
            />
          ) : null}

          {showDailyActivities ? (
            <DailyLearningActivityManager
              role={role}
              studentDirectory={studentDirectory}
            />
          ) : null}

          {showAttendance ? (
            <AttendanceManager
              role={role}
              attendanceSheets={dashboard.attendanceSheets}
              studentDirectory={studentDirectory}
              managedUsers={managedUsers}
              userId={session?.id}
            />
          ) : null}

          {showFeeInstallments ? (
            <FeeInstallmentManager
              role={role}
              studentDirectory={studentDirectory}
            />
          ) : null}

          {showTeacherPayouts && (role === "admin" || role === "educator") ? (
            <TeacherPayoutManager role={role} managedUsers={managedUsers} />
          ) : null}

          {showFees ? (
            <InvoiceManager
              role={role}
              feeInvoices={dashboard.feeInvoices}
              studentDirectory={studentDirectory}
            />
          ) : null}

          {showLectures ? (
            <LectureManager
              role={role}
              lectures={dashboard.lectures}
              studentDirectory={studentDirectory}
            />
          ) : null}

          {showTimetable &&
          (role === "admin" || role === "educator" || role === "student") ? (
            <TimetableManager
              role={role}
              lectures={dashboard.lectures}
              managedUsers={managedUsers}
              session={session}
              onCreateLecture={() => setActiveSection("lectures")}
            />
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
                  {role === "student"
                    ? "Your Performance"
                    : "Student Analytics"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {role === "student"
                    ? "Track your academic progress, strengths, and areas for improvement."
                    : role === "parent"
                      ? "View your child's academic progress, strengths, and areas that need support."
                      : "Manage and create detailed performance reports for your students."}
                </p>
              </div>

              {isPerformanceLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-12">
                  {role === "student" ? (
                    <section className="surface-soft rounded-[2rem] p-5 sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="section-label">Performance Reports</p>
                          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
                            Your Published Reports
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                            Open your detailed academic performance reports.
                          </p>
                        </div>
                        <span className="pill">
                          {standaloneStudentReports.length} reports
                        </span>
                      </div>

                      <div className="mt-6 grid gap-4">
                        {isStandaloneReportsLoading ? (
                          <div className="flex h-28 items-center justify-center">
                            <span className="h-7 w-7 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
                          </div>
                        ) : standaloneStudentReports.length ? (
                          standaloneStudentReports.map((report) => (
                            <div
                              key={report.id}
                              className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-lg font-semibold text-[var(--color-heading)]">
                                    {report.title ||
                                      report.periodLabel ||
                                      report.period}
                                  </p>
                                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                                    {report.reportType === "monthly"
                                      ? "Monthly Performance Report"
                                      : "Weekly Performance Report"}
                                  </p>
                                </div>

                                <Link
                                  href={`/student-performance/report/${report.id}`}
                                  className="inline-flex w-fit items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                                >
                                  View Report
                                </Link>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-3xl border border-dashed border-[var(--color-border)] p-6 text-center">
                            <p className="text-sm text-[var(--color-muted)]">
                              No performance reports have been published for you
                              yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  ) : null}

                  {(role === "educator" || role === "admin") && (
                    <PerformanceReportCreator
                      session={session}
                      studentDirectory={studentDirectory}
                      onReportCreated={(newReport) => {
                        setPerformanceReports([
                          newReport,
                          ...performanceReports,
                        ]);
                        // Optionally switch to a view mode or show success
                      }}
                    />
                  )}

                  {performanceReports.length > 0 && (
                    <div
                      className={
                        role !== "student"
                          ? "pt-12 border-t border-[var(--color-border)]"
                          : ""
                      }
                    >
                      <PerformanceDashboard
                        reports={performanceReports}
                        heuristics={heuristics}
                        studentName={session?.name}
                      />
                    </div>
                  )}

                  {performanceReports.length === 0 &&
                    standaloneStudentReports.length === 0 &&
                    !isStandaloneReportsLoading &&
                    role === "student" && (
                      <div className="text-center py-12">
                        <p className="text-[var(--color-muted)]">
                          No performance reports have been published for you
                          yet.
                        </p>
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
