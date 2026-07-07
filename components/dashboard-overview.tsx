"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  MessageSquare,
  UserCheck,
  Bell,
  FileText,
  Activity,
  Award,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  GraduationCap,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import type {
  DashboardBundle,
  SessionUser,
  Role,
  MessageItem,
} from "@/lib/types";

type Props = {
  session: SessionUser | null;
  role: Role;
  dashboard: DashboardBundle;
  messages: MessageItem[];
  supportContact: string;
  onSetActiveSection: (section: string) => void;
};

const ACCENT = "#0B40A1";

export function DashboardOverview({
  session,
  role,
  dashboard,
  messages,
  supportContact,
  onSetActiveSection,
}: Props) {
  if (role === "student") {
    return (
      <StudentOverview
        session={session}
        dashboard={dashboard}
        messages={messages}
        supportContact={supportContact}
        onSetActiveSection={onSetActiveSection}
      />
    );
  }
  if (role === "educator") {
    return (
      <EducatorOverview
        session={session}
        dashboard={dashboard}
        messages={messages}
        supportContact={supportContact}
        onSetActiveSection={onSetActiveSection}
      />
    );
  }
  return (
    <GenericOverview
      session={session}
      role={role}
      dashboard={dashboard}
      messages={messages}
      supportContact={supportContact}
      onSetActiveSection={onSetActiveSection}
    />
  );
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─────────── STUDENT OVERVIEW ───────────

function StudentOverview({
  session,
  dashboard,
  messages,
  onSetActiveSection,
}: {
  session: SessionUser | null;
  dashboard: DashboardBundle;
  messages: MessageItem[];
  supportContact: string;
  onSetActiveSection: (section: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const stats = [
    {
      title: "Attendance",
      value: dashboard.analytics?.attendance?.rate != null
        ? `${Math.round(dashboard.analytics.attendance.rate)}%`
        : dashboard.stats[0]?.value ?? "—",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Test Average",
      value: dashboard.analytics?.assessments?.averageScore != null
        ? `${Math.round(dashboard.analytics.assessments.averageScore)}%`
        : dashboard.stats[1]?.value ?? "—",
      icon: Award,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
    {
      title: "Learning Completed",
      value: dashboard.analytics?.learning?.completionRate != null
        ? `${Math.round(dashboard.analytics.learning.completionRate)}%`
        : dashboard.stats[2]?.value ?? "—",
      icon: Activity,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
    {
      title: "Fee Pending",
      value: dashboard.stats[3]?.value ?? "₹0",
      icon: IndianRupee,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
  ];

  const subjectScores =
    dashboard.analytics?.assessments?.subjectPerformance?.length
      ? dashboard.analytics.assessments.subjectPerformance.slice(0, 4).map((sp) => ({
          subject: sp.subject,
          score: sp.percentage ?? 75,
        }))
      : dashboard.tests.length
        ? dashboard.tests.slice(0, 4).map((t) => ({
            subject: t.title,
            score: t.total ? Math.round(((t.total ?? 0) / 100) * 100) : 75,
          }))
        : [];

  const pendingTasks = dashboard.weeklyTests?.filter(
    (t) => t.status === "published" || t.status === "pending",
  ) ?? [];

  const todayLectures = dashboard.lectures?.filter(
    (l) => l.date?.slice(0, 10) === new Date().toISOString().slice(0, 10),
  ) ?? [];

  // Chart data from attendance
  const chartData = dashboard.analytics?.attendance?.dailyRecords?.slice(0, 7) ?? [];
  const chartLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hasChartData = chartData.length === 7;
  const chartValues = hasChartData
    ? chartData.map((d) => d.rate ?? 80)
    : [];
  const maxVal = 100;

  const points = chartValues.map((v, i) => ({
    x: 10 + (i * ((790 - 10) / (chartValues.length - 1 || 1))),
    y: 280 - (v / maxVal) * 240,
  }));

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Welcome back, {session?.name?.split(" ")[0] ?? "Student"}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              {dashboard.heroDescription}
            </p>
            {dashboard.assignedFacultyNames && dashboard.assignedFacultyNames.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-semibold text-slate-400">Faculty:</span>
                {dashboard.assignedFacultyNames.map((name, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF1FA] px-3 py-1 text-xs font-bold text-[#0B40A1]">
                    <div className="h-4 w-4 rounded-full bg-[#0B40A1] text-white flex items-center justify-center text-[8px] font-bold">
                      {name.charAt(0)}
                    </div>
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{session?.name ?? "Student"}</p>
            <p className="text-xs text-slate-500">
              ID: {session?.id?.slice(0, 8).toUpperCase() ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <Icon size={22} strokeWidth={2.5} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Main Content */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Left */}
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 w-full overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Attendance Overview</h2>
              {hasChartData && (
                <button
                  onClick={() => onSetActiveSection("attendance")}
                  className="text-xs font-bold text-[#0B40A1] hover:underline"
                >
                  View Full Report
                </button>
              )}
            </div>
            {hasChartData ? (
              <div className="w-full h-[220px] relative">
                <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {[0, 25, 50, 75, 100].map((val, i) => {
                    const y = 220 - (val * 2);
                    return (
                      <g key={i}>
                        <text x="-8" y={y + 3} className="text-[10px] fill-slate-400" textAnchor="end">{val}%</text>
                        <line x1="10" y1={y} x2="800" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      </g>
                    );
                  })}
                  <polyline
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                  {points.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r="5" fill={ACCENT} stroke="white" strokeWidth="2.5" />
                  ))}
                </svg>
                <div className="absolute -bottom-6 left-[10px] right-0 flex justify-between text-xs text-slate-400 font-medium">
                  {chartLabels.map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-slate-400">
                <div className="text-center">
                  <i className="bi bi-bar-chart-line text-3xl block mb-2 text-slate-300" />
                  <p>No attendance data available yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Subject Performance */}
          {subjectScores.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Subject Performance</h2>
                <button
                  onClick={() => onSetActiveSection("performance")}
                  className="text-xs font-bold text-[#0B40A1] hover:underline"
                >
                  Detailed Report
                </button>
              </div>
              <div className="space-y-5">
                {subjectScores.map((item, idx) => {
                  const s = typeof item === "object" && "subject" in item
                    ? (item as { subject: string; score: number })
                    : { subject: (item as any).title ?? `Subject ${idx + 1}`, score: (item as any).score ?? 75 };
                  const colors = ["#0B40A1", "#059669", "#D97706", "#7C3AED"];
                  const c = colors[idx % colors.length];
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-semibold text-slate-700">{s.subject}</span>
                        <span className="font-bold text-slate-900">{s.score}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: mounted ? `${s.score}%` : "0%", backgroundColor: c }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Profile Card */}
          <StudentProfileCard session={session} dashboard={dashboard} />

          {/* Notice Board */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Notice Board</h2>
              {(messages.length > 0) && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold">
                  {messages.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {messages.length > 0 ? (
                messages.slice(0, 3).map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${msg.channel === "important" || msg.channel === "notice" ? "bg-[#EBF1FA] text-[#0B40A1]" : "bg-slate-100 text-slate-500"}`}>
                        {msg.channel === "important" || msg.channel === "notice" ? <Bell size={14} /> : <MessageSquare size={14} />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{msg.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{msg.body}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">No notices yet.</p>
              )}
            </div>
            <button
              onClick={() => onSetActiveSection("messages")}
              className="w-full mt-4 py-2.5 text-sm font-bold text-white bg-[#0B40A1] hover:bg-[#092e7a] rounded-xl transition-colors"
            >
              View All Messages
            </button>
          </div>

          {/* Study Plan */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {todayLectures.length > 0 ? "Today's Schedule" : "Study Plan"}
              </h2>
              <span className="text-xs font-bold text-[#0B40A1] bg-[#EBF1FA] px-2.5 py-1 rounded-full">
                {(pendingTasks.length + todayLectures.length)} Items
              </span>
            </div>
            <div className="space-y-3">
              {todayLectures.slice(0, 2).map((lecture, idx) => (
                <div key={lecture.id ?? idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#0B40A1] text-white flex items-center justify-center">
                        <PlayCircle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{lecture.title ?? "Lecture"}</p>
                        <p className="text-xs text-slate-500">{lecture.subject ?? ""}{lecture.duration ? ` • ${lecture.duration} mins` : ""}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lecture.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-[#EBF1FA] text-[#0B40A1]"}`}>
                      {lecture.status === "completed" ? "Done" : "Upcoming"}
                    </span>
                  </div>
                </div>
              ))}
              {pendingTasks.slice(0, 1).map((task, idx) => (
                <div key={task.id ?? idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{task.title ?? "Weekly Test"}</p>
                        <p className="text-xs text-slate-500">{task.subject ?? ""}{task.duration ? ` • ${task.duration} mins` : ""}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSetActiveSection("weekly-tests")}
                      className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {task.status === "published" ? "Start" : "View"}
                    </button>
                  </div>
                </div>
              ))}
              {todayLectures.length === 0 && pendingTasks.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No items scheduled. Enjoy your day!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── EDUCATOR OVERVIEW ───────────

function EducatorOverview({
  session,
  dashboard,
  messages,
  onSetActiveSection,
}: {
  session: SessionUser | null;
  dashboard: DashboardBundle;
  messages: MessageItem[];
  supportContact: string;
  onSetActiveSection: (section: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const stats = [
    {
      title: "Active Batches",
      value: dashboard.batches?.length ? String(dashboard.batches.length) : dashboard.stats[0]?.value ?? "0",
      icon: Users,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
    {
      title: "Total Learners",
      value: dashboard.analytics?.activeStudents != null ? String(dashboard.analytics.activeStudents) : dashboard.stats[1]?.value ?? "—",
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Lectures Conducted",
      value: dashboard.attendanceSheets?.length
        ? `${new Set(dashboard.attendanceSheets.map((s) => s.date?.slice(0, 10)).filter(Boolean)).size} / ${dashboard.attendanceSheets.length}`
        : dashboard.stats[2]?.value ?? "—",
      icon: BarChart3,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
    {
      title: "Pending Earnings",
      value: dashboard.stats[3]?.value ?? "—",
      icon: IndianRupee,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
  ];

  const todayLectures = dashboard.lectures?.filter(
    (l) => l.date?.slice(0, 10) === new Date().toISOString().slice(0, 10),
  ) ?? [];

  const upcomingTests = dashboard.tests?.filter((t) => t.status !== "archived") ?? [];

  // Chart data
  const eChartData = dashboard.analytics?.attendance?.dailyRecords?.slice(0, 7) ?? [];
  const chartLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const eHasChartData = eChartData.length === 7;
  const chartValues = eHasChartData ? eChartData.map((d) => d.rate ?? 80) : [];
  const maxVal = 100;
  const points = chartValues.map((v, i) => ({
    x: 10 + (i * ((790 - 10) / 6)),
    y: 220 - (v / maxVal) * 180,
  }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {session?.name?.split(" ")[0] ?? "Educator"}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              {dashboard.heroDescription}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{session?.name ?? "Educator"}</p>
            <p className="text-xs text-slate-500">{session?.email ?? ""}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <Icon size={22} strokeWidth={2.5} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 w-full overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Weekly Attendance Trend</h2>
              {eHasChartData && (
                <button onClick={() => onSetActiveSection("attendance")} className="text-xs font-bold text-[#0B40A1] hover:underline">
                  View All
                </button>
              )}
            </div>
            {eHasChartData ? (
              <div className="w-full h-[220px] relative">
                <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {[0, 25, 50, 75, 100].map((val, i) => {
                    const y = 220 - (val * 2);
                    return (
                      <g key={i}>
                        <text x="-8" y={y + 3} className="text-[10px] fill-slate-400" textAnchor="end">{val}%</text>
                        <line x1="10" y1={y} x2="800" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      </g>
                    );
                  })}
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                  {points.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r="5" fill="#059669" stroke="white" strokeWidth="2.5" />
                  ))}
                </svg>
                <div className="absolute -bottom-6 left-[10px] right-0 flex justify-between text-xs text-slate-400 font-medium">
                  {chartLabels.map((l, i) => (<span key={i}>{l}</span>))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-slate-400">
                <div className="text-center">
                  <i className="bi bi-bar-chart-line text-3xl block mb-2 text-slate-300" />
                  <p>No attendance data available yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Teaching Overview */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Teaching Overview</h2>
              <button onClick={() => onSetActiveSection("lectures")} className="text-xs font-bold text-[#0B40A1] hover:underline">
                Manage Lectures
              </button>
            </div>
            <div className="space-y-3">
              {dashboard.batches && dashboard.batches.length > 0 ? (
                dashboard.batches.slice(0, 3).map((batch, idx) => (
                  <div key={batch.id ?? idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#0B40A1] text-white flex items-center justify-center font-bold">
                        {batch.name?.charAt(0) ?? `B${idx + 1}`}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{batch.name ?? `Batch ${idx + 1}`}</p>
                        <p className="text-xs text-slate-500">
                          {(batch as any).subject ?? ""}
                          {(batch as any).studentCount ? ` • ${(batch as any).studentCount} students` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">Active</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">No batches assigned yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Profile */}
          <EducatorProfileCard session={session} dashboard={dashboard} />

          {/* Notice Board */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Notice Board</h2>
              {(messages.length > 0) && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold">
                  {messages.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {messages.length > 0 ? (
                messages.slice(0, 3).map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${msg.channel === "important" || msg.channel === "notice" ? "bg-[#EBF1FA] text-[#0B40A1]" : "bg-slate-100 text-slate-500"}`}>
                        {msg.channel === "important" || msg.channel === "notice" ? <Bell size={14} /> : <MessageSquare size={14} />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{msg.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{msg.body}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">No notices yet.</p>
              )}
            </div>
            <button
              onClick={() => onSetActiveSection("messages")}
              className="w-full mt-4 py-2.5 text-sm font-bold text-white bg-[#0B40A1] hover:bg-[#092e7a] rounded-xl transition-colors"
            >
              View All Messages
            </button>
          </div>

          {/* Schedule */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {todayLectures.length > 0 ? "Today's Schedule" : "Upcoming Tests"}
              </h2>
              <span className="text-xs font-bold text-[#0B40A1] bg-[#EBF1FA] px-2.5 py-1 rounded-full">
                {(todayLectures.length || upcomingTests.length)} Items
              </span>
            </div>
            <div className="space-y-3">
              {todayLectures.slice(0, 2).map((lecture, idx) => (
                <div key={lecture.id ?? idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#0B40A1] text-white flex items-center justify-center">
                        <PlayCircle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{lecture.title ?? "Lecture"}</p>
                        <p className="text-xs text-slate-500">{lecture.subject ?? ""}{lecture.duration ? ` • ${lecture.duration} mins` : ""}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lecture.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-[#EBF1FA] text-[#0B40A1]"}`}>
                      {lecture.status === "completed" ? "Done" : "Scheduled"}
                    </span>
                  </div>
                </div>
              ))}
              {upcomingTests.slice(0, 1).map((test, idx) => (
                <div key={test.id ?? idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{test.title ?? "Test"}</p>
                        <p className="text-xs text-slate-500">{test.subject ?? ""}{test.total ? ` • ${test.total} marks` : ""}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSetActiveSection("tests")}
                      className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {test.status === "published" ? "Grade" : "Edit"}
                    </button>
                  </div>
                </div>
              ))}
              {todayLectures.length === 0 && upcomingTests.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No upcoming items.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── GENERIC (admin/parent/counsellor) OVERVIEW ───────────

function GenericOverview({
  session,
  role,
  dashboard,
  messages,
  onSetActiveSection,
}: {
  session: SessionUser | null;
  role: Role;
  dashboard: DashboardBundle;
  messages: MessageItem[];
  supportContact: string;
  onSetActiveSection: (section: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const stats = [
    {
      title: role === "admin" ? "Active Learners" : "Students",
      value: dashboard.analytics?.activeStudents != null ? String(dashboard.analytics.activeStudents) : dashboard.stats[0]?.value ?? "—",
      icon: Users,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
    {
      title: role === "admin" ? "Active Batches" : "Attendance",
      value: dashboard.batches?.length ? String(dashboard.batches.length) : dashboard.stats[1]?.value ?? "—",
      icon: BarChart3,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: role === "admin" ? "Attendance Rate" : "Progress",
      value: dashboard.analytics?.attendance?.rate != null ? `${Math.round(dashboard.analytics.attendance.rate)}%` : dashboard.stats[2]?.value ?? "—",
      icon: CheckCircle2,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
    {
      title: role === "admin" ? "Fee Pending" : "Messages",
      value: dashboard.stats[3]?.value ?? "—",
      icon: IndianRupee,
      color: `text-[${ACCENT}]`,
      bg: "bg-[#EBF1FA]",
    },
  ];

  // Chart data
  const gChartData = dashboard.analytics?.attendance?.dailyRecords?.slice(0, 7) ?? [];
  const chartLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const gHasChartData = gChartData.length === 7;
  const chartValues = gHasChartData ? gChartData.map((d) => d.rate ?? 80) : [];
  const maxVal = 100;
  const points = chartValues.map((v, i) => ({
    x: 10 + (i * ((790 - 10) / 6)),
    y: 220 - (v / maxVal) * 180,
  }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              {dashboard.heroTitle}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              {dashboard.heroDescription}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{session?.name ?? role}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <Icon size={22} strokeWidth={2.5} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Notice */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 w-full overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Attendance Overview</h2>
              {gHasChartData && (
                <button onClick={() => onSetActiveSection("attendance")} className="text-xs font-bold text-[#0B40A1] hover:underline">
                  View All
                </button>
              )}
            </div>
            {gHasChartData ? (
              <div className="w-full h-[220px] relative">
                <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {[0, 25, 50, 75, 100].map((val, i) => {
                    const y = 220 - (val * 2);
                    return (
                      <g key={i}>
                        <text x="-8" y={y + 3} className="text-[10px] fill-slate-400" textAnchor="end">{val}%</text>
                        <line x1="10" y1={y} x2="800" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      </g>
                    );
                  })}
                  <polyline
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                  {points.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y} r="5" fill={ACCENT} stroke="white" strokeWidth="2.5" />
                  ))}
                </svg>
                <div className="absolute -bottom-6 left-[10px] right-0 flex justify-between text-xs text-slate-400 font-medium">
                  {chartLabels.map((l, i) => (<span key={i}>{l}</span>))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-slate-400">
                <div className="text-center">
                  <i className="bi bi-bar-chart-line text-3xl block mb-2 text-slate-300" />
                  <p>No attendance data available yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <GenericProfileCard session={session} role={role} dashboard={dashboard} />

          {/* Notice Board */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Notice Board</h2>
              {(messages.length > 0) && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold">
                  {messages.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {messages.length > 0 ? (
                messages.slice(0, 3).map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${msg.channel === "important" || msg.channel === "notice" ? "bg-[#EBF1FA] text-[#0B40A1]" : "bg-slate-100 text-slate-500"}`}>
                        {msg.channel === "important" || msg.channel === "notice" ? <Bell size={14} /> : <MessageSquare size={14} />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{msg.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{msg.body}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">No notices yet.</p>
              )}
            </div>
            <button
              onClick={() => onSetActiveSection("messages")}
              className="w-full mt-4 py-2.5 text-sm font-bold text-white bg-[#0B40A1] hover:bg-[#092e7a] rounded-xl transition-colors"
            >
              View All Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── PROFILE CARD HELPERS ───────────

function PField({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null;
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-900 mt-0.5 break-words">{value}</p>
    </div>
  );
}

function PTags({ label, values }: { label: string; values: string[] | undefined | null }) {
  if (!values || values.length === 0) return null;
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="rounded-lg bg-[#EBF1FA] text-[#0B40A1] px-2.5 py-1 text-xs font-bold border border-[#EBF1FA]">{v}</span>
        ))}
      </div>
    </div>
  );
}

function StudentProfileCard({ session, dashboard }: { session: SessionUser | null; dashboard: DashboardBundle }) {
  const [showAll, setShowAll] = useState(false);
  const p = dashboard.profile;
  const basicFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <PField label="Batch" value={p?.courseWantedTitle?.split("|")[0]?.trim()} />
        <PField label="Type" value={p?.studentType === "on-campus" ? "On Campus" : p?.studentType} />
      </div>
      <PField label="Gender" value={p?.gender} />
      <PField label="Date of Birth" value={p?.dob || p?.dateOfBirth} />
      <PField label="Father's Name" value={p?.fatherName} />
      <PField label="Guardian Phone" value={p?.guardianPhone} />
      {dashboard.assignedFacultyNames && dashboard.assignedFacultyNames.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Faculty</p>
          {dashboard.assignedFacultyNames.map((name, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <div className="h-6 w-6 rounded-full bg-[#0B40A1] text-white flex items-center justify-center text-[9px] font-bold">{name.charAt(0)}</div>
              <span className="text-sm font-semibold text-slate-800">{name}</span>
            </div>
          ))}
        </div>
      )}
      <PTags label="Focus Areas" values={p?.weakSubjects} />
    </>
  );
  const extraFields = (
    <>
      <PTags label="Strong Subjects" values={p?.strongSubjects} />
      <PField label="Parent Name" value={p?.parentName} />
      <PField label="Parent Email" value={p?.parentEmail} />
      <PField label="Parent Mobile" value={p?.parentMobile} />
      <PField label="Latest Qualification" value={p?.latestQualification} />
      <PField label="Latest Academic Score" value={p?.latestAcademicScore} />
      <PField label="Address" value={[p?.addressLine1, p?.addressLine2, p?.city, p?.state, p?.pincode].filter(Boolean).join(", ")} />
    </>
  );
  const hasExtra = !!(p?.strongSubjects?.length || p?.parentName || p?.parentEmail || p?.parentMobile || p?.latestQualification || p?.latestAcademicScore || p?.addressLine1);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="h-20 bg-[#0B40A1] relative" />
      <div className="px-6 pb-6 relative">
        <div className="flex -mt-10 mb-4">
          <div className="h-20 w-20 rounded-xl bg-white p-1 shadow-md">
            <div className="h-full w-full rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {p?.profilePhoto ? <img src={p.profilePhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-black text-slate-500">{getInitials(session?.name)}</span>}
            </div>
          </div>
          <div className="ml-4 mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
              <CheckCircle2 size={10} />
              {session?.status === "active" ? "Active" : "Pending"}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900">{session?.name ?? "Student"}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{session?.email ?? ""}</p>
        <div className="mt-5 space-y-3">
          {basicFields}
          {showAll && hasExtra && extraFields}
        </div>
        {hasExtra && (
          <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-4 w-full rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-[#0B40A1] border border-slate-100 hover:bg-slate-100 transition-colors">
            {showAll ? "View Less ↑" : "View More ↓"}
          </button>
        )}
      </div>
    </div>
  );
}

function EducatorProfileCard({ session, dashboard }: { session: SessionUser | null; dashboard: DashboardBundle }) {
  const [showAll, setShowAll] = useState(false);
  const p = dashboard.profile;
  const basicFields = (
    <>
      <PField label="Qualification" value={p?.qualification} />
      <PField label="Experience" value={p?.experience} />
      <PField label="Gender" value={p?.gender} />
      <PTags label="Subjects" values={p?.subjects} />
    </>
  );
  const extraFields = (
    <>
      <PField label="Date of Birth" value={p?.dob || p?.dateOfBirth} />
      <PField label="Address" value={[p?.addressLine1, p?.addressLine2, p?.city, p?.state, p?.pincode].filter(Boolean).join(", ")} />
      {p?.examQualifications && p.examQualifications.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Exam Qualifications</p>
          <div className="space-y-2">
            {p.examQualifications.map((eq, i) => (
              <div key={i} className="text-sm font-semibold text-slate-800">
                {eq.examName}{eq.score ? ` – ${eq.score}` : ""}{eq.year ? ` (${eq.year})` : ""}{eq.rank ? ` • Rank: ${eq.rank}` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
  const hasExtra = !!(p?.dob || p?.dateOfBirth || p?.addressLine1 || (p?.examQualifications && p.examQualifications.length > 0));
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="h-20 bg-[#0B40A1] relative" />
      <div className="px-6 pb-6 relative">
        <div className="flex -mt-10 mb-4">
          <div className="h-20 w-20 rounded-xl bg-white p-1 shadow-md">
            <div className="h-full w-full rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {p?.profilePhoto ? <img src={p.profilePhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-black text-slate-500">{getInitials(session?.name)}</span>}
            </div>
          </div>
          <div className="ml-4 mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
              <CheckCircle2 size={10} />
              {session?.verified ? "Verified" : "Faculty"}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900">{session?.name ?? "Educator"}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{session?.email ?? ""}</p>
        <div className="mt-5 space-y-3">
          {basicFields}
          {showAll && hasExtra && extraFields}
        </div>
        {hasExtra && (
          <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-4 w-full rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-[#0B40A1] border border-slate-100 hover:bg-slate-100 transition-colors">
            {showAll ? "View Less ↑" : "View More ↓"}
          </button>
        )}
      </div>
    </div>
  );
}

function GenericProfileCard({ session, role, dashboard }: { session: SessionUser | null; role: Role; dashboard: DashboardBundle }) {
  const [showAll, setShowAll] = useState(false);
  const p = dashboard.profile;
  const basicFields = (
    <>
      <PField label="Gender" value={p?.gender} />
      <PField label="Date of Birth" value={p?.dob || p?.dateOfBirth} />
      {role === "parent" && (
        <>
          <PField label="Student" value={dashboard.linkedStudentId ? `Linked (${dashboard.linkedStudentId.slice(0, 8).toUpperCase()})` : "—"} />
        </>
      )}
    </>
  );
  const extraFields = (
    <>
      <PField label="Address" value={[p?.addressLine1, p?.addressLine2, p?.city, p?.state, p?.pincode].filter(Boolean).join(", ")} />
    </>
  );
  const hasExtra = !!(p?.addressLine1);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="h-16 bg-[#0B40A1]" />
      <div className="px-6 pb-6 relative">
        <div className="flex -mt-8 mb-3">
          <div className="h-16 w-16 rounded-xl bg-white p-1 shadow-md">
            <div className="h-full w-full rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {p?.profilePhoto ? <img src={p.profilePhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-black text-slate-500">{getInitials(session?.name)}</span>}
            </div>
          </div>
        </div>
        <h2 className="text-lg font-bold text-slate-900">{session?.name ?? role}</h2>
        <p className="text-xs text-slate-500 mt-0.5 capitalize">{role} • {session?.email ?? ""}</p>
        <div className="mt-4 space-y-3">
          {basicFields}
          {showAll && hasExtra && extraFields}
        </div>
        {hasExtra && (
          <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-4 w-full rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-[#0B40A1] border border-slate-100 hover:bg-slate-100 transition-colors">
            {showAll ? "View Less ↑" : "View More ↓"}
          </button>
        )}
      </div>
    </div>
  );
}
