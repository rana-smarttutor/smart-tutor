
"use client";

import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  Clock3,
  IndianRupee,
  ShieldCheck,
  Users,
  UserRound,
  Sparkles,
} from "lucide-react";

import type {
  DashboardBundle,
  MessageItem,
  SessionUser,
} from "@/lib/types";

type Props = {
  session: SessionUser | null;
  dashboard: DashboardBundle;
  messages: MessageItem[];
  onSetActiveSection: (id: string) => void;
};

export function StaffOperationsOverview({
  session,
  dashboard,
  messages,
  onSetActiveSection,
}: Props) {
  const lectures = dashboard.lectures ?? [];
  const tests = dashboard.weeklyTests ?? [];
  const attendance = dashboard.attendanceSheets ?? [];
  const invoices = dashboard.feeInvoices ?? [];

  const staffName = session?.name?.trim() || "Team Member";
  const firstName = staffName.split(/\s+/)[0];

  const initials = staffName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const employeeId =
    session?.employeeCode ||
    session?.facultyCode ||
    "Not assigned";

  const scheduledLectures = lectures.filter(
    (lecture) => lecture.status === "scheduled"
  );

  const pendingFees = invoices.reduce(
    (total, invoice) =>
      total +
      Math.max(
        0,
        Number(invoice.amount || 0) -
          Number(invoice.paidAmount || 0)
      ),
    0
  );

  const cards = [
    {
      title: "Scheduled lectures",
      value: String(scheduledLectures.length),
      icon: BookOpen,
      section: "lectures",
      detail: "Available scheduled lectures",
    },
    {
      title: "Attendance sessions",
      value: String(attendance.length),
      icon: CalendarCheck2,
      section: "attendance",
      detail: "Accessible attendance sheets",
    },
    {
      title: "Unpublished weekly tests",
      value: String(
        tests.filter((test) => !test.published).length
      ),
      icon: ClipboardList,
      section: "weekly-tests",
      detail: "Available unpublished tests",
    },
    {
      title: "Outstanding fees",
      value: `₹${pendingFees.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      section: "fees",
      detail: "Outstanding invoice balances",
    },
  ];

  const links = [
    ["Lecture Management", "lectures"],
    ["Student Attendance", "attendance"],
    ["Test Management", "weekly-tests"],
    ["Admission Form", "new-admission-form"],
    ["Career Counselling", "career-counselling"],
    ["Staff Tasks", "staff-tasks"],
    ["Branch Expenses", "branch-expenses"],
    ["Daily Report", "daily-branch-report"],
    ["Notices & Announcements", "messages"],
  ] as const;

  return (
    <div className="space-y-6">
      {/* PREMIUM STAFF HERO */}
      <header className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-r from-[#081A41] via-[#123E85] to-[#2469C3] p-6 text-white shadow-[0_18px_45px_rgba(8,26,65,0.18)] sm:p-8">
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-sky-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="pointer-events-none absolute right-12 top-8 h-40 w-40 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-20 top-16 h-24 w-24 rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Identity and greeting */}
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black shadow-lg backdrop-blur-sm sm:flex">
              {initials || <UserRound size={28} />}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100">
                  <Sparkles size={12} />
                  SmartIQ Institute / Staff Workspace
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Welcome back, {firstName}!
              </h1>

              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-blue-100">
                Your workspace for academic operations,
                admissions, student support and daily branch
                activities.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold backdrop-blur-sm">
                  <Users size={15} />
                  Staff Workspace
                </span>

                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold backdrop-blur-sm">
                  <ShieldCheck size={15} />
                  Employee ID:
                  <strong className="font-black">
                    {employeeId}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Functional shortcuts */}
          <div className="flex shrink-0 flex-wrap gap-3 lg:w-56 lg:flex-col">
            <button
              type="button"
              onClick={() =>
                onSetActiveSection("attendance")
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#123E85] shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-50 lg:flex-none"
            >
              <CalendarCheck2 size={17} />
              Student Attendance
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.title}
              type="button"
              onClick={() =>
                onSetActiveSection(card.section)
              }
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon size={22} />
                </div>

                <ArrowRight
                  size={17}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </div>

              <p className="mt-4 text-xs font-semibold text-slate-500">
                {card.title}
              </p>

              <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                {card.value}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {card.detail}
              </p>
            </button>
          );
        })}
      </div>

      {/* WORKSPACE CONTENT */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Quick actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Quick actions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Access your day-to-day staff tools.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {links.map(([label, id]) => (
              <button
                key={id}
                type="button"
                onClick={() => onSetActiveSection(id)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-800 transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <span>{label}</span>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </button>
            ))}
          </div>
        </section>

        {/* Upcoming lectures */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Clock3 size={19} />
              Upcoming lectures
            </h2>

            <button
              type="button"
              onClick={() =>
                onSetActiveSection("lectures")
              }
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {scheduledLectures.slice(0, 5).map((lecture) => (
              <div
                key={lecture.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-900">
                  {lecture.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {lecture.subject || "General"}
                </p>
              </div>
            ))}

            {scheduledLectures.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <BookOpen
                  size={26}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  No scheduled lectures available.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* Notices */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Bell size={19} />
            Notices and messages
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {messages.length
              ? `${messages.length} available messages. Open notices to read them.`
              : "No messages available."}
          </p>

          <button
            type="button"
            onClick={() =>
              onSetActiveSection("messages")
            }
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
          >
            Open notices
            <ArrowRight size={15} />
          </button>
        </section>

        {/* Staff work log */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Users size={19} />
            Staff work log
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Record tasks, expenses, and daily activity with
            your staff account.
          </p>

          <button
            type="button"
            onClick={() =>
              onSetActiveSection("staff-tasks")
            }
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
          >
            Open task register
            <ArrowRight size={15} />
          </button>
        </section>
      </div>

      <p className="text-xs text-slate-500">
        The metrics above reflect records accessible to your
        account. Financial and institutional data visibility
        depends on API permissions.
      </p>
    </div>
  );
}
