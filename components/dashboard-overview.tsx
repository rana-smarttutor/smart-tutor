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
  UserPlus,
  PenSquare,
  ShieldCheck,
  Megaphone,
  Percent,
  BookMarked,
  Video,
  Lightbulb,
  HelpCircle,
  Smartphone,
  Bot,
  Banknote,
  Medal,
  Home,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import type {
  DashboardBundle,
  ManagedUser,
  SessionUser,
  Role,
  MessageItem,
  StaffAttendanceRecord,
  DoubtItem,
} from "@/lib/types";
type Props = {
  session: SessionUser | null;
  role: Role;
  dashboard: DashboardBundle;
  messages: MessageItem[];
  supportContact: string;
  onSetActiveSection: (section: string) => void;
  managedUsers?: ManagedUser[];
};

const ACCENT = "#0B40A1";

export function DashboardOverview({
  session,
  role,
  dashboard,
  messages,
  supportContact,
  onSetActiveSection,
  managedUsers,
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
        managedUsers={managedUsers}
      />
    );
  }
  if (role === "parent") {
    return (
      <ParentOverview
        session={session}
        dashboard={dashboard}
        messages={messages}
        supportContact={supportContact}
        onSetActiveSection={onSetActiveSection}
        managedUsers={managedUsers}
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
function formatRelativeTime(value?: string) {
  if (!value) {
    return "Recently";
  }

  const createdTime = new Date(value).getTime();

  if (Number.isNaN(createdTime)) {
    return "Recently";
  }

  const differenceMs = Math.max(0, Date.now() - createdTime);

  const minutes = Math.floor(differenceMs / (1000 * 60));

  if (minutes < 1) {
    return "Now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
function Sparkline({
  values,
  color = "#4F46E5",
}: {
  values: number[];
  color?: string;
}) {
  if (values.length < 2) return null;
  const w = 100;
  const h = 40;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const areaPoints = `${points.join(" ")} ${w},${h} 0,${h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={`spark-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#spark-${color.replace("#", "")})`}
        points={areaPoints}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
    </svg>
  );
}

// ─────────── ADMIN DASHBOARD ───────────

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
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">(
    "monthly",
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const now = new Date();

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const instituteName = dashboard.heroTitle || "Smart IQ Institute";
  const totalStudents =
    dashboard.analytics?.activeStudents ?? dashboard.stats[0]?.value ?? "—";
  const rawRevenue = dashboard.analytics?.finance?.collected ?? 0;
  const revenue = rawRevenue > 0 ? `₹${(rawRevenue / 1000).toFixed(1)}K` : "—";
  const totalBilled = dashboard.analytics?.finance?.billed ?? 0;
  const feeCollectionPct =
    totalBilled > 0 ? Math.round((rawRevenue / totalBilled) * 100) : 0;
  const atRiskCount = dashboard.analytics?.finance?.overdueCount ?? 0;

  const kpiCards = [
    {
      label: "Total Students",
      value:
        typeof totalStudents === "string"
          ? totalStudents
          : String(totalStudents),
      color: "#4F46E5",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      icon: Users,
      sparkData: [40, 55, 48, 62, 58, 70, 75],
    },
    {
      label: "Monthly Revenue",
      value: `₹${rawRevenue.toLocaleString("en-IN")}`,
      color: "#059669",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      icon: Banknote,
      sparkData: [25, 40, 35, 50, 45, 60, 55],
    },
    {
      label: "At-Risk Students",
      value: String(atRiskCount),
      color: "#DC2626",
      bg: "bg-red-50",
      text: "text-red-600",
      icon: AlertCircle,
      sparkData: [5, 8, 6, 10, 7, 4, atRiskCount],
    },
    {
      label: "Fee Collection",
      value: `${feeCollectionPct}%`,
      color: "#0EA5E9",
      bg: "bg-sky-50",
      text: "text-sky-600",
      icon: Percent,
      sparkData: [60, 68, 72, 70, 78, 75, feeCollectionPct],
    },
  ];

  const quickActions = [
    {
      label: "Add Student",
      icon: UserPlus,
      section: "account-directory",
      color: "#4F46E5",
      bg: "bg-indigo-50",
    },
    {
      label: "New Exam",
      icon: FileText,
      section: "tests",
      color: "#059669",
      bg: "bg-emerald-50",
    },
    {
      label: "Attendance",
      icon: UserCheck,
      section: "attendance",
      color: "#D97706",
      bg: "bg-amber-50",
    },
    {
      label: "Fees",
      icon: DollarSign,
      section: "fees",
      color: "#0EA5E9",
      bg: "bg-sky-50",
    },
    {
      label: "Broadcast",
      icon: Megaphone,
      section: "messages",
      color: "#DC2626",
      bg: "bg-red-50",
    },
    {
      label: "Reports",
      icon: BarChart3,
      section: "analytics",
      color: "#8B5CF6",
      bg: "bg-violet-50",
    },
  ];

  const enrollmentData =
    dashboard.analytics?.attendance?.dailyRecords?.slice(0, 7) ?? [];
  const hasEnrollmentData = enrollmentData.length >= 2;
  const enrollmentLabels = enrollmentData.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  });
  const enrollmentValues = enrollmentData.map((d) => d.present ?? 0);
  const enrollMax = Math.max(...enrollmentValues, 1);

  const pointChart = (vals: number[], w: number, h: number) =>
    vals.map((v, i) => {
      const x = 40 + (i / (vals.length - 1 || 1)) * (w - 60);
      const y = h - 30 - (v / enrollMax) * (h - 60);
      return { x, y };
    });

  const chartWidth = 600;
  const chartHeight = 200;
  const pts = pointChart(enrollmentValues, chartWidth, chartHeight);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysLectures =
    dashboard.lectures?.filter((l) => l.date?.slice(0, 10) === todayStr) ?? [];

  const upcomingTests =
    dashboard.tests?.filter(
      (t) => t.status === "published" || t.status === "pending",
    ) ?? [];

  const recentInvoices = dashboard.feeInvoices?.slice(0, 5) ?? [];

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    unpaid: "bg-red-100 text-red-700",
    partial: "bg-amber-100 text-amber-700",
    overdue: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-5">
      {/* ── Hero Section ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{
          background: "linear-gradient(135deg,#1E1B4B,#4F46E5,#6D28D9)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <circle cx="50" cy="30" r="80" fill="white" />
            <circle cx="350" cy="170" r="120" fill="white" />
            <circle cx="200" cy="100" r="60" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {instituteName}
            </h1>
            <p className="text-sm text-indigo-200 mt-1.5">{dateStr}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-semibold">
              <Users size={16} />
              <span>{totalStudents} Students</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-semibold">
              <IndianRupee size={16} />
              <span>Revenue: {revenue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden hover:shadow-md transition-shadow"
            >
              <div style={{ height: 3, backgroundColor: card.color }} />
              <div className="p-5 relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${card.bg} ${card.text} flex items-center justify-center`}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="w-20 h-8 opacity-40">
                    <Sparkline values={card.sparkData} color={card.color} />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => onSetActiveSection(action.section)}
              className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl border border-[#E8EDF2] hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${action.bg} ${action.color.replace("bg-", "text-")} flex items-center justify-center`}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-700 text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        {/* Left */}
        <div className="space-y-5">
          {/* Enrollment Trend */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5 gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Enrollment Trend
              </h2>
              <div className="flex gap-1">
                {(["monthly", "quarterly", "yearly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-colors ${
                      period === p
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {p === "monthly"
                      ? "Monthly"
                      : p === "quarterly"
                        ? "Quarterly"
                        : "Yearly"}
                  </button>
                ))}
              </div>
            </div>
            {hasEnrollmentData ? (
              <div className="w-full">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-48"
                >
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.2} />
                      <stop
                        offset="100%"
                        stopColor="#4F46E5"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  {[0, 25, 50, 75, 100].map((val) => {
                    const y =
                      chartHeight - 30 - (val / 100) * (chartHeight - 60);
                    return (
                      <g key={val}>
                        <text
                          x="35"
                          y={y + 3}
                          className="text-[10px] fill-slate-400"
                          textAnchor="end"
                        >
                          {Math.round((val / 100) * enrollMax)}
                        </text>
                        <line
                          x1="40"
                          y1={y}
                          x2={chartWidth - 20}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}
                  <polygon
                    fill="url(#enrollGrad)"
                    points={`${pts[0].x},${chartHeight - 30} ${pts.map((p) => `${p.x},${p.y}`).join(" ")} ${pts[pts.length - 1].x},${chartHeight - 30}`}
                  />
                  <polyline
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                  {pts.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#4F46E5"
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
                <div className="flex justify-between mt-2 px-4 sm:px-8 text-[10px] sm:text-xs font-medium text-slate-400">
                  {enrollmentLabels.map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                <div className="text-center">
                  <LineChart
                    size={32}
                    className="mx-auto mb-2 text-slate-300"
                  />
                  <p>No enrollment data yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Recent Transactions
              </h2>
              <button
                onClick={() => onSetActiveSection("fees")}
                className="text-[10px] sm:text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            {recentInvoices.length > 0 ? (
              <div className="space-y-2">
                {recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          inv.status === "paid"
                            ? "bg-emerald-100 text-emerald-600"
                            : inv.status === "overdue"
                              ? "bg-red-100 text-red-600"
                              : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {inv.status === "paid" ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <Clock size={15} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {inv.studentName || inv.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {inv.month ||
                            inv.academicYear ||
                            new Date(inv.dueDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-slate-900">
                        ₹{inv.amount.toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[inv.status] || "bg-slate-100 text-slate-600"}`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-28 text-sm text-slate-400">
                <div className="text-center">
                  <CreditCard
                    size={28}
                    className="mx-auto mb-1 text-slate-300"
                  />
                  <p>No recent transactions</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Demographics / Today's Classes */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            {todaysLectures.length > 0 ? (
              <>
                <h2
                  className="text-base font-bold text-slate-900 mb-4"
                  suppressHydrationWarning
                >
                  Today&apos;s Classes
                </h2>
                <div className="space-y-3">
                  {todaysLectures.slice(0, 4).map((lec, idx) => (
                    <div
                      key={lec.id ?? idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <PlayCircle size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {lec.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {lec.subject}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 shrink-0">
                        {lec.startsAt?.slice(11, 16) || "Scheduled"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-base font-bold text-slate-900 mb-4">
                  Attendance Distribution
                </h2>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - (dashboard.analytics?.attendance?.rate ?? 75) / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center -mt-4">
                    <p className="text-2xl font-black text-slate-900">
                      {dashboard.analytics?.attendance?.rate != null
                        ? `${Math.round(dashboard.analytics.attendance.rate)}%`
                        : "—"}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Attendance
                    </p>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />{" "}
                      Present: {dashboard.analytics?.attendance?.present ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400" />{" "}
                      Absent: {dashboard.analytics?.attendance?.absent ?? 0}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notice Board */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Notice Board
              </h2>
              {messages.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold shrink-0">
                  {messages.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {messages.length > 0 ? (
                messages.slice(0, 2).map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          msg.channel === "important" ||
                          msg.channel === "notice"
                            ? "bg-[#EBF1FA] text-[#0B40A1]"
                            : msg.channel === "alert"
                              ? "bg-red-50 text-red-500"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {msg.channel === "important" ||
                        msg.channel === "notice" ? (
                          <Bell size={14} />
                        ) : (
                          <MessageSquare size={14} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          {msg.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {msg.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">
                  No notices yet.
                </p>
              )}
            </div>
            <button
              onClick={() => onSetActiveSection("messages")}
              className="w-full mt-4 py-2.5 text-sm font-bold text-white bg-[#0B40A1] hover:bg-[#092e7a] rounded-xl transition-colors"
            >
              View All Messages
            </button>
          </div>

          {/* Profile Card */}
          <GenericProfileCard
            session={session}
            role={role}
            dashboard={dashboard}
          />
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Exams */}
        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Upcoming Exams
            </h2>
            <button
              onClick={() => onSetActiveSection("tests")}
              className="text-[10px] sm:text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
            >
              Manage Exams
            </button>
          </div>
          {upcomingTests.length > 0 ? (
            <div className="space-y-3">
              {upcomingTests.slice(0, 4).map((test, idx) => (
                <div
                  key={test.id ?? idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {test.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {test.subject}
                        {test.total ? ` • ${test.total} marks` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSetActiveSection("tests")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0 ml-3"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-slate-400">
              <div className="text-center">
                <BookOpen size={24} className="mx-auto mb-1 text-slate-300" />
                <p>No upcoming exams</p>
              </div>
            </div>
          )}
        </div>

        {/* At-Risk Students */}
        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              At-Risk Students
            </h2>
          </div>
          {atRiskCount > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {atRiskCount} Student{atRiskCount !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-slate-500 text-center">
                Require immediate attention on fee overdue
              </p>
              <button
                onClick={() => onSetActiveSection("account-directory")}
                className="mt-2 px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                View Details
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <ShieldCheck size={28} />
              </div>
              <p className="text-lg font-bold text-slate-900">All Clear</p>
              <p className="text-sm text-slate-500">
                All students are on track
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Performers */}
      {dashboard.analytics?.insights &&
        dashboard.analytics.insights.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Top Performers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboard.analytics.insights
                .filter((i) => i.tone === "positive")
                .slice(0, 3)
                .map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100"
                  >
                    <Medal size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {insight.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
}

// ─────────── STUDENT DASHBOARD ───────────

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
  managedUsers?: ManagedUser[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const studentName = session?.name ?? "Student";
  const batchInfo =
    dashboard.profile?.courseWantedTitle?.split("|")[0]?.trim() ||
    dashboard.heroTitle ||
    "";
  const admissionNo = session?.id?.slice(0, 8).toUpperCase() ?? "—";
  const attRate =
    dashboard.analytics?.attendance?.rate != null
      ? Math.round(dashboard.analytics.attendance.rate)
      : null;

  const testsTaken = dashboard.stats[1]?.value || "—";
  const avgScore =
    dashboard.analytics?.assessments?.averageScore != null
      ? `${Math.round(dashboard.analytics.assessments.averageScore)}%`
      : "—";
  const pendingHw =
    dashboard.analytics?.learning?.homeworkRate != null
      ? `${Math.round(100 - dashboard.analytics.learning.homeworkRate)} Pending`
      : "—";
  const feeDueAmount = dashboard.stats[3]?.value || "₹0";

  const kpiCards = [
    {
      label: "Attendance",
      value: attRate != null ? `${attRate}%` : "—",
      color: "#059669",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      icon: CheckCircle2,
      sparkData: attRate
        ? [
            attRate - 15,
            attRate - 10,
            attRate - 5,
            attRate + 2,
            attRate + 5,
            attRate + 3,
            attRate,
          ]
        : [60, 65, 70, 72, 78, 75, 80],
    },
    {
      label: "Tests Taken",
      value: testsTaken,
      color: "#D97706",
      bg: "bg-amber-50",
      text: "text-amber-600",
      icon: TrendingUp,
      sparkData: [5, 4, 4, 3, 3, 2, 2].map((v) => 100 - v * 10),
    },
    {
      label: "Pending HW",
      value: pendingHw,
      color: "#0EA5E9",
      bg: "bg-sky-50",
      text: "text-sky-600",
      icon: BookOpen,
      sparkData: [2, 3, 1, 4, 2, 3, 2],
      actionLabel: "View Now",
      actionSection: "homework",
    },
    {
      label: "Fee Dues",
      value: feeDueAmount,
      color: "#DC2626",
      bg: "bg-red-50",
      text: "text-red-600",
      icon: IndianRupee,
      sparkData: [0, 0, 0, 0, 0, 0, 0],
      actionLabel: "Pay Now",
      actionSection: "fees",
    },
  ];

  const todayLectures =
    dashboard.lectures?.filter(
      (l) => l.date?.slice(0, 10) === new Date().toISOString().slice(0, 10),
    ) ?? [];

  const upcomingTests =
    dashboard.tests?.filter(
      (t) => t.status === "published" || t.status === "pending",
    ) ?? [];

  const subjectScores = dashboard.analytics?.assessments?.subjectPerformance
    ?.length
    ? dashboard.analytics.assessments.subjectPerformance.slice(0, 6)
    : dashboard.tests.length
      ? dashboard.tests.slice(0, 6).map((t) => ({
          subject: t.title,
          percentage: t.total ? Math.round(((t.total ?? 0) / 100) * 100) : 75,
          resultCount: 0,
        }))
      : [];

  const weeklyTestTasks =
    dashboard.weeklyTests?.filter(
      (t) => t.status === "published" || t.status === "pending",
    ) ?? [];

  const nextAction = (() => {
    const weeklyTask = weeklyTestTasks[0];

    if (weeklyTask) {
      return {
        title: weeklyTask.title || "Weekly Learning Task",
        description:
          [
            weeklyTask.subject,
            weeklyTask.duration ? `${weeklyTask.duration} mins` : null,
          ]
            .filter(Boolean)
            .join(" • ") || "Complete your pending weekly learning task.",
        helperText: "This task is waiting for you to complete.",
        buttonLabel: "Start Task",
        section: "weekly-tests",
        badge: "Pending",
        icon: BookOpen,
        iconBoxClass: "bg-violet-100 text-violet-700",
        panelClass: "border-violet-100 bg-violet-50/60",
        badgeClass: "bg-violet-100 text-violet-700",
        buttonClass: "bg-violet-600 hover:bg-violet-700",
      };
    }

    const exam = upcomingTests[0];

    if (exam) {
      return {
        title: exam.title || "Upcoming Exam",
        description:
          [exam.subject, exam.total ? `${exam.total} marks` : null]
            .filter(Boolean)
            .join(" • ") || "Review the details of your upcoming exam.",
        helperText:
          exam.status === "published"
            ? "The exam is available and ready to start."
            : "Prepare now so you are ready for the exam.",
        buttonLabel: exam.status === "published" ? "Start Exam" : "View Exam",
        section: "tests",
        badge: exam.status === "published" ? "Ready" : "Upcoming",
        icon: FileText,
        iconBoxClass: "bg-blue-100 text-blue-700",
        panelClass: "border-blue-100 bg-blue-50/60",
        badgeClass: "bg-blue-100 text-blue-700",
        buttonClass: "bg-[#0B40A1] hover:bg-[#092F78]",
      };
    }

    const lecture = todayLectures[0];

    if (lecture) {
      return {
        title: lecture.title || "Today’s Class",
        description:
          [
            lecture.subject,
            lecture.startsAt?.slice(11, 16) || null,
            lecture.duration ? `${lecture.duration} mins` : null,
          ]
            .filter(Boolean)
            .join(" • ") || "Your next class is scheduled for today.",
        helperText: "Open the lecture section to view the class details.",
        buttonLabel: "View Class",
        section: "lectures",
        badge: "Today",
        icon: PlayCircle,
        iconBoxClass: "bg-teal-100 text-teal-700",
        panelClass: "border-teal-100 bg-teal-50/60",
        badgeClass: "bg-teal-100 text-teal-700",
        buttonClass: "bg-teal-600 hover:bg-teal-700",
      };
    }

    return {
      title: "You’re all caught up",
      description: "No pending tests or classes need your attention right now.",
      helperText: "Use this time to revise a topic or explore study materials.",
      buttonLabel: "Explore Materials",
      section: "materials",
      badge: "All Clear",
      icon: CheckCircle2,
      iconBoxClass: "bg-emerald-100 text-emerald-700",
      panelClass: "border-emerald-100 bg-emerald-50/60",
      badgeClass: "bg-emerald-100 text-emerald-700",
      buttonClass: "bg-emerald-600 hover:bg-emerald-700",
    };
  })();

  const NextActionIcon = nextAction.icon;

  const quickAccessItems = [
    { label: "Exams", icon: FileText, section: "tests", color: "#4F46E5" },
    { label: "Results", icon: Award, section: "performance", color: "#059669" },
    {
      label: "Attendance",
      icon: UserCheck,
      section: "attendance",
      color: "#D97706",
    },
    {
      label: "Homework",
      icon: BookOpen,
      section: "homework",
      color: "#0EA5E9",
    },
    {
      label: "Fee Details",
      icon: DollarSign,
      section: "receipts",
      color: "#DC2626",
    },
    {
      label: "Materials",
      icon: BookMarked,
      section: "materials",
      color: "#8B5CF6",
    },
    {
      label: "Timetable",
      icon: CalendarDays,
      section: "timetable",
      color: "#EC4899",
    },
    { label: "Videos", icon: Video, section: "videos", color: "#14B8A6" },
    {
      label: "Live Classes",
      icon: PlayCircle,
      section: "lectures",
      color: "#F97316",
    },
    {
      label: "Doubts",
      icon: HelpCircle,
      section: "doubt-box",
      color: "#06B6D4",
    },
    {
      label: "Notifications",
      icon: Bell,
      section: "notifications",
      color: "#F43F5E",
    },
    {
      label: "Complaint Box",
      icon: MessageSquare,
      section: "complaints",
      color: "#b97822",
    },
  ];

  const testScores =
    dashboard.tests
      ?.filter((t) => t.total != null && t.total > 0)
      .slice(0, 6) ?? [];
  const hasProgressData = testScores.length >= 2;
  const progressW = 500;
  const progressH = 160;
  const progMax = Math.max(...testScores.map((t) => t.total ?? 100), 1);
  const progPts = testScores.map((t, i) => {
    const x = 40 + (i / (testScores.length - 1 || 1)) * (progressW - 60);
    const y = progressH - 30 - ((t.total ?? 0) / progMax) * (progressH - 60);
    return { x, y, label: t.title.slice(0, 8), val: t.total ?? 0 };
  });

  return (
    <div className="space-y-5">
      {/* ── Hero Section ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-8 text-white"
        style={{
          background: "linear-gradient(135deg,#065F46,#0D9488,#0369A1)",
        }}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="h-full w-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <circle cx="50" cy="30" r="80" fill="white" />
            <circle cx="350" cy="170" r="120" fill="white" />
            <circle cx="200" cy="100" r="60" fill="white" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Row 1: Photo + Name + Stats */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between lg:gap-8">
            {/* Photo + Student Information */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Student Photo / Initials Avatar */}
              <div className="shrink-0">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-white/80 bg-white/20 shadow-lg shadow-black/20 backdrop-blur-sm sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                  {dashboard.profile?.profilePhoto ? (
                    <img
                      src={dashboard.profile.profilePhoto}
                      alt={`${studentName} profile`}
                      className="h-full w-full scale-110 rounded-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white/20 text-xl font-black text-white sm:text-2xl">
                      {getInitials(studentName)}
                    </div>
                  )}
                </div>
              </div>

              {/* Name + Batch + Date */}
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-teal-200">
                  Student Portal
                </p>
                <h1 className="mt-0.5 text-xl font-bold sm:text-2xl lg:text-3xl truncate">
                  Hey, {studentName.split(" ")[0]}! 📚
                </h1>
                {batchInfo ? (
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-teal-200 truncate">
                    {batchInfo}
                  </p>
                ) : null}

                {/* Enrollment Number */}
                <p className="text-[10px] sm:text-xs text-teal-200/70 font-medium shrink-0">
                  Enrollment no: {admissionNo}
                </p>
              </div>
            </div>

            {/* Stats Pills - Top Right */}
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold backdrop-blur-sm">
                <Award size={12} className="sm:w-3.5 sm:h-3.5" />
                Tests: {testsTaken}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold backdrop-blur-sm">
                <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                Avg: {avgScore}
              </span>
            </div>
          </div>

          {/* Row 2: Faculty + Enrollment - spread along width */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-4">
            {/* Assigned Faculty */}
            {dashboard.assignedFacultyNames &&
            dashboard.assignedFacultyNames.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] sm:text-xs text-teal-200/70 font-medium mr-1">
                  Faculty:
                </span>
                {dashboard.assignedFacultyNames.map((name, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm"
                  >
                    <span className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-white/25 text-[7px] sm:text-[8px] font-bold">
                      {name.charAt(0)}
                    </span>
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden hover:shadow-md transition-shadow"
            >
              <div style={{ height: 3, backgroundColor: card.color }} />
              <div className="p-3 sm:p-4 lg:p-5 relative">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl ${card.bg} ${card.text} flex items-center justify-center`}
                  >
                    <Icon size={16} strokeWidth={2} className="lg:w-5 lg:h-5" />
                  </div>
                  <div className="w-12 sm:w-14 lg:w-16 h-6 lg:h-7 opacity-30">
                    <Sparkline values={card.sparkData} color={card.color} />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-slate-900">
                      {card.value}
                    </p>

                    <p className="mt-0.5 text-[10px] sm:text-xs lg:text-sm font-medium text-slate-500 truncate">
                      {card.label}
                    </p>
                  </div>

                  {card.actionLabel && card.actionSection ? (
                    <button
                      type="button"
                      onClick={() => onSetActiveSection(card.actionSection)}
                      className="shrink-0 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-black transition hover:bg-slate-100"
                      style={{
                        color: card.color,
                      }}
                    >
                      {card.actionLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Two-Column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Left */}
        <div className="space-y-5">
          {/* Today's Classes */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2
                className="text-sm sm:text-base font-bold text-slate-900"
                suppressHydrationWarning
              >
                Today&apos;s Classes
              </h2>
              <button
                onClick={() => onSetActiveSection("lectures")}
                className="text-[10px] sm:text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            {todayLectures.length > 0 ? (
              <div className="space-y-3">
                {todayLectures.slice(0, 3).map((lec, idx) => (
                  <div
                    key={lec.id ?? idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <PlayCircle size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {lec.title || "Lecture"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {lec.subject ?? ""}
                        {lec.duration ? ` • ${lec.duration} mins` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                        lec.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-teal-50 text-teal-600"
                      }`}
                    >
                      {lec.startsAt?.slice(11, 16) ||
                        (lec.status === "completed" ? "Done" : "Upcoming")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-sm text-slate-400">
                <div className="text-center">
                  <CalendarDays
                    size={24}
                    className="mx-auto mb-1 text-slate-300"
                  />
                  <p>No classes today</p>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Upcoming Exams
              </h2>
              <button
                onClick={() => onSetActiveSection("tests")}
                className="text-[10px] sm:text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            {upcomingTests.length > 0 ? (
              <div className="space-y-3">
                {upcomingTests.slice(0, 3).map((test, idx) => (
                  <div
                    key={test.id ?? idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {test.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {test.subject}
                          {test.total ? ` • ${test.total} marks` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSetActiveSection("tests")}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0 ml-3"
                    >
                      {test.status === "published" ? "Start" : "View"}
                    </button>
                  </div>
                ))}
              </div>
            ) : weeklyTestTasks.length > 0 ? (
              <div className="space-y-3">
                {weeklyTestTasks.slice(0, 3).map((task, idx) => (
                  <div
                    key={task.id ?? idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <BookOpen size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {task.subject ?? ""}
                          {task.duration ? ` • ${task.duration} mins` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSetActiveSection("weekly-tests")}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors shrink-0 ml-3"
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-sm text-slate-400">
                <div className="text-center">
                  <FileText size={24} className="mx-auto mb-1 text-slate-300" />
                  <p>No upcoming exams</p>
                </div>
              </div>
            )}
          </div>

          {/* Academic Progress Trend */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Academic Progress
              </h2>
              <button
                onClick={() => onSetActiveSection("performance")}
                className="text-[10px] sm:text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
              >
                Detailed Report
              </button>
            </div>
            {hasProgressData ? (
              <div className="w-full">
                <svg
                  viewBox={`0 0 ${progressW} ${progressH}`}
                  className="w-full h-36"
                >
                  <defs>
                    <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity={0.2} />
                      <stop
                        offset="100%"
                        stopColor="#0D9488"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  {[0, 25, 50, 75, 100].map((val) => {
                    const y = progressH - 30 - (val / 100) * (progressH - 60);
                    return (
                      <g key={val}>
                        <text
                          x="35"
                          y={y + 3}
                          className="text-[9px] fill-slate-400"
                          textAnchor="end"
                        >
                          {Math.round((val / 100) * progMax)}
                        </text>
                        <line
                          x1="40"
                          y1={y}
                          x2={progressW - 20}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}
                  <polygon
                    fill="url(#progGrad)"
                    points={`${progPts[0].x},${progressH - 30} ${progPts.map((p) => `${p.x},${p.y}`).join(" ")} ${progPts[progPts.length - 1].x},${progressH - 30}`}
                  />
                  <polyline
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={progPts.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                  {progPts.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#0D9488"
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
                <div className="flex justify-between mt-1 px-8 text-[10px] font-medium text-slate-400">
                  {progPts.map((p, i) => (
                    <span key={i}>{p.label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-28 text-sm text-slate-400">
                <div className="text-center">
                  <TrendingUp
                    size={24}
                    className="mx-auto mb-1 text-slate-300"
                  />
                  <p>Complete a test to see progress</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Next Action */}
          <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-sm font-black text-slate-900 sm:text-base">
                  Next Action
                </h2>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
                  Your most important learning task
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${nextAction.badgeClass}`}
              >
                {nextAction.badge}
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <div
                className={`rounded-2xl border p-4 sm:p-5 ${nextAction.panelClass}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${nextAction.iconBoxClass}`}
                  >
                    <NextActionIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black leading-5 text-slate-900 sm:text-base">
                      {nextAction.title}
                    </h3>

                    <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                      {nextAction.description}
                    </p>

                    <p className="mt-2 text-[11px] font-medium leading-5 text-slate-500">
                      {nextAction.helperText}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSetActiveSection(nextAction.section)}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:shadow-md ${nextAction.buttonClass}`}
              >
                {nextAction.buttonLabel}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Notice Board */}
          <div className="rounded-[1.5rem] border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#EBF1FA] text-[#0B40A1] shrink-0">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Notice Board
                  </h2>

                  <p className="text-[10px] sm:text-xs font-medium text-slate-500">
                    Latest announcements and updates
                  </p>
                </div>
              </div>

              {messages.filter((message) => message.channel !== "Chat").length >
              0 ? (
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#0B40A1] px-2 text-xs font-black text-white">
                  {
                    messages.filter((message) => message.channel !== "Chat")
                      .length
                  }
                </span>
              ) : null}
            </div>

            <div className="space-y-3">
              {messages.filter((message) => message.channel !== "Chat").length >
              0 ? (
                messages
                  .filter((message) => message.channel !== "Chat")
                  .slice(0, 3)
                  .map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => onSetActiveSection("messages")}
                      className="group flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0B40A1] shadow-sm">
                        <MessageSquare className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="truncate text-sm font-black text-slate-800">
                            {message.title}
                          </h3>

                          <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#0B40A1]">
                            {message.channel}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
                          {message.body}
                        </p>
                      </div>
                    </button>
                  ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <Bell className="mx-auto h-7 w-7 text-slate-300" />

                  <p className="mt-3 text-sm font-bold text-slate-600">
                    No notices yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    New announcements will appear here.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSetActiveSection("messages")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B40A1] px-4 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-[#092F78] hover:shadow-md"
            >
              View Notice Board
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          {/* Subject Performance */}
          {subjectScores.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Subject Performance
              </h2>
              <div className="space-y-4">
                {subjectScores.map((item, idx) => {
                  const score = item.percentage ?? 75;
                  const colors = [
                    "#4F46E5",
                    "#059669",
                    "#D97706",
                    "#0EA5E9",
                    "#8B5CF6",
                    "#EC4899",
                  ];
                  const c = colors[idx % colors.length];
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <span className="font-semibold text-slate-700">
                          {item.subject}
                        </span>
                        <span className="font-bold text-slate-900">
                          {score}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-1000 ease-out"
                          style={{
                            width: mounted ? `${score}%` : "0%",
                            backgroundColor: c,
                            borderRadius: score >= 100 ? "0" : "9999px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Access Grid ── */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 sm:p-5 lg:p-6">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {quickAccessItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSetActiveSection(item.section)}
                className="flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all hover:-translate-y-0.5"
              >
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                  }}
                >
                  <Icon size={14} strokeWidth={2} className="sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recent Results ── */}
      {testScores.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Recent Results
            </h2>
            <button
              onClick={() => onSetActiveSection("performance")}
              className="text-[10px] sm:text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {testScores.slice(0, 6).map((test, idx) => {
              const pct = test.total
                ? Math.min(100, Math.round((test.total / 100) * 100))
                : 0;
              return (
                <div
                  key={test.id ?? idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {test.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {test.subject ?? ""}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-black shrink-0 ml-3 ${pct >= 80 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────── PARENT DASHBOARD (View-only mirror of Student) ───────────

function ParentOverview({
  session,
  dashboard,
  messages,
  onSetActiveSection,
  managedUsers,
}: {
  session: SessionUser | null;
  dashboard: DashboardBundle;
  messages: MessageItem[];
  supportContact: string;
  onSetActiveSection: (section: string) => void;
  managedUsers?: ManagedUser[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const parentName = session?.name ?? "Parent";
  const childName = dashboard.profile?.fatherName
    ? `${dashboard.profile.fatherName}'s Child`
    : "Your Child";
  const batchInfo =
    dashboard.profile?.courseWantedTitle?.split("|")[0]?.trim() ||
    dashboard.heroTitle ||
    "";
  const attRate =
    dashboard.analytics?.attendance?.rate != null
      ? Math.round(dashboard.analytics.attendance.rate)
      : null;
  const avgScore =
    dashboard.analytics?.assessments?.averageScore != null
      ? `${Math.round(dashboard.analytics.assessments.averageScore)}%`
      : "—";
  const feeDueAmount = dashboard.stats[3]?.value || "₹0";
  const pendingHw =
    dashboard.analytics?.learning?.homeworkRate != null
      ? `${Math.round(100 - dashboard.analytics.learning.homeworkRate)} Pending`
      : "—";

  const kpiCards = [
    {
      label: "Attendance",
      value: attRate != null ? `${attRate}%` : "—",
      color: "#059669",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      icon: CheckCircle2,
      sparkData: attRate
        ? [
            attRate - 15,
            attRate - 10,
            attRate - 5,
            attRate + 2,
            attRate + 5,
            attRate + 3,
            attRate,
          ]
        : [60, 65, 70, 72, 78, 75, 80],
    },
    {
      label: "Avg Score",
      value: avgScore,
      color: "#D97706",
      bg: "bg-amber-50",
      text: "text-amber-600",
      icon: TrendingUp,
      sparkData: [5, 4, 4, 3, 3, 2, 2].map((v) => 100 - v * 10),
    },
    {
      label: "Pending HW",
      value: pendingHw,
      color: "#0EA5E9",
      bg: "bg-sky-50",
      text: "text-sky-600",
      icon: BookOpen,
      sparkData: [2, 3, 1, 4, 2, 3, 2],
    },
    {
      label: "Fee Dues",
      value: feeDueAmount,
      color: "#DC2626",
      bg: "bg-red-50",
      text: "text-red-600",
      icon: IndianRupee,
      sparkData: [0, 0, 0, 0, 0, 0, 0],
    },
  ];

  const todayLectures =
    dashboard.lectures?.filter(
      (l) => l.date?.slice(0, 10) === new Date().toISOString().slice(0, 10),
    ) ?? [];

  const upcomingTests =
    dashboard.tests?.filter(
      (t) => t.status === "published" || t.status === "pending",
    ) ?? [];

  const quickAccessItems = [
    { label: "Exams", icon: FileText, section: "tests", color: "#4F46E5" },
    {
      label: "Attendance",
      icon: UserCheck,
      section: "attendance",
      color: "#D97706",
    },
    {
      label: "Fee Details",
      icon: DollarSign,
      section: "receipts",
      color: "#DC2626",
    },
    {
      label: "Timetable",
      icon: CalendarDays,
      section: "timetable",
      color: "#EC4899",
    },
    {
      label: "Lectures",
      icon: PlayCircle,
      section: "lectures",
      color: "#F97316",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      section: "messages",
      color: "#06B6D4",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{
          background: "linear-gradient(135deg,#7C3AED,#6D28D9,#4F46E5)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <circle cx="50" cy="30" r="80" fill="white" />
            <circle cx="350" cy="170" r="120" fill="white" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-violet-200 uppercase tracking-wider">
                Parent Portal{batchInfo ? ` · ${batchInfo}` : ""}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                Welcome, {parentName.split(" ")[0]}!
              </h1>
              <p className="text-sm text-violet-200 mt-1.5">{dateStr}</p>
              {dashboard.assignedFacultyNames &&
                dashboard.assignedFacultyNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dashboard.assignedFacultyNames.map((name, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-2.5 py-1 text-[11px] font-semibold"
                      >
                        <span className="h-4 w-4 rounded-full bg-white/25 flex items-center justify-center text-[8px] font-bold">
                          {name.charAt(0)}
                        </span>
                        {name}
                      </span>
                    ))}
                  </div>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold">
                <UserCheck size={13} />
                Attendance: {attRate != null ? `${attRate}%` : "—"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold">
                <TrendingUp size={13} />
                Avg: {avgScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden hover:shadow-md transition-shadow"
            >
              <div style={{ height: 3, backgroundColor: card.color }} />
              <div className="p-5 relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${card.bg} ${card.text} flex items-center justify-center`}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="w-16 h-7 opacity-30">
                    <Sparkline values={card.sparkData} color={card.color} />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Two-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Left */}
        <div className="space-y-5">
          {/* Today's Classes */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2
                className="text-sm sm:text-base font-bold text-slate-900"
                suppressHydrationWarning
              >
                Today&apos;s Classes
              </h2>
              <button
                onClick={() => onSetActiveSection("lectures")}
                className="text-[10px] sm:text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            {todayLectures.length > 0 ? (
              <div className="space-y-3">
                {todayLectures.slice(0, 3).map((lec, idx) => (
                  <div
                    key={lec.id ?? idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <PlayCircle size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {lec.title || "Lecture"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lec.subject ?? ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 bg-violet-50 text-violet-600">
                      {lec.startsAt?.slice(11, 16) || "Scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-400">
                <CalendarDays size={32} className="text-slate-200 mb-2" />
                <p>No classes scheduled today</p>
              </div>
            )}
          </div>

          {/* Upcoming Tests */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Upcoming Exams
              </h2>
              <button
                onClick={() => onSetActiveSection("tests")}
                className="text-[10px] sm:text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
              >
                View All
              </button>
            </div>
            {upcomingTests.length > 0 ? (
              <div className="space-y-2">
                {upcomingTests.slice(0, 3).map((test, idx) => (
                  <div
                    key={test.id ?? idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {test.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {test.subject ?? ""} · {test.total ?? 0} marks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-400">
                <FileText size={32} className="text-slate-200 mb-2" />
                <p>No upcoming exams</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Fee Dues Card */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <IndianRupee size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Fee Dues</p>
              <p className="text-xl font-black text-slate-900">
                {feeDueAmount}
              </p>
            </div>
            <button
              onClick={() => onSetActiveSection("receipts")}
              className="ml-auto text-xs font-bold text-[#0B40A1] hover:underline shrink-0"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickAccessItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSetActiveSection(item.section)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-[#E8EDF2] transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}14` }}
                >
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <span className="text-[11px] font-bold text-slate-600">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────── EDUCATOR DASHBOARD ───────────

function EducatorOverview({
  session,
  dashboard,
  messages,
  onSetActiveSection,
  managedUsers,
}: {
  session: SessionUser | null;
  dashboard: DashboardBundle;
  messages: MessageItem[];
  supportContact: string;
  onSetActiveSection: (section: string) => void;
  managedUsers?: ManagedUser[];
}) {
  const [educatorAttendanceRecords, setEducatorAttendanceRecords] = useState<
    StaffAttendanceRecord[]
  >([]);

  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const [attendanceError, setAttendanceError] = useState("");

  const [educatorDoubts, setEducatorDoubts] = useState<DoubtItem[]>([]);

  const [doubtsLoading, setDoubtsLoading] = useState(true);

  const [doubtsError, setDoubtsError] = useState("");

  /*
   * Load educator attendance.
   */
  useEffect(() => {
    const userId = session?.id?.trim() ?? "";

    if (!userId) {
      setEducatorAttendanceRecords([]);
      setAttendanceLoading(false);
      setAttendanceError("Educator account was not found.");
      return;
    }

    let cancelled = false;

    async function loadEducatorAttendance() {
      try {
        const response = await fetch(
          `/api/staff-attendance/my?userId=${encodeURIComponent(userId)}`,
          {
            credentials: "same-origin",
            cache: "no-store",
          },
        );

        const data = (await response.json().catch(() => ({}))) as {
          records?: StaffAttendanceRecord[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error ||
              `Unable to load attendance. Server returned ${response.status}.`,
          );
        }

        if (!cancelled) {
          setEducatorAttendanceRecords(
            Array.isArray(data.records) ? data.records : [],
          );

          setAttendanceError("");
        }
      } catch (error) {
        console.error("Educator overview attendance error:", error);

        if (!cancelled) {
          setAttendanceError(
            error instanceof Error
              ? error.message
              : "Unable to load attendance.",
          );
        }
      } finally {
        if (!cancelled) {
          setAttendanceLoading(false);
        }
      }
    }

    void loadEducatorAttendance();

    const intervalId = window.setInterval(() => {
      void loadEducatorAttendance();
    }, 15000);

    function handleWindowFocus() {
      void loadEducatorAttendance();
    }

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      cancelled = true;

      window.clearInterval(intervalId);

      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [session?.id]);

  /*
   * Load student doubts.
   * This must be a separate top-level effect.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadEducatorDoubts() {
      try {
        const response = await fetch("/api/doubts", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as {
          doubts?: DoubtItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error ||
              `Unable to load doubts. Server returned ${response.status}.`,
          );
        }

        if (!cancelled) {
          setEducatorDoubts(
            Array.isArray(payload.doubts) ? payload.doubts : [],
          );

          setDoubtsError("");
        }
      } catch (error) {
        console.error("Educator doubt-list error:", error);

        if (!cancelled) {
          setDoubtsError(
            error instanceof Error
              ? error.message
              : "Unable to load student doubts.",
          );
        }
      } finally {
        if (!cancelled) {
          setDoubtsLoading(false);
        }
      }
    }

    void loadEducatorDoubts();

    const intervalId = window.setInterval(() => {
      void loadEducatorDoubts();
    }, 15000);

    function handleWindowFocus() {
      void loadEducatorDoubts();
    }

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      cancelled = true;

      window.clearInterval(intervalId);

      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [session?.id]);
  const capitalizeWords = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const educatorFirstName = capitalizeWords(
    session?.name?.trim().split(/\s+/)[0] || "Teacher",
  );

  const educatorGender = dashboard.profile?.gender?.trim().toLowerCase() ?? "";

  const educatorTitle =
    educatorGender === "female" || educatorGender === "f"
      ? "Ma'am"
      : educatorGender === "male" || educatorGender === "m"
        ? "Sir"
        : "";
  const educatorSubjects =
    dashboard.profile?.subjects
      ?.map((subject) => capitalizeWords(subject))
      .filter(Boolean) ?? [];
  const ops = dashboard.analytics?.operations;
  const myStudents = ops?.learners ?? dashboard.analytics?.activeStudents ?? 0;
  const pendingReviews =
    dashboard.submissions?.filter((s) => s.status === "submitted").length ?? 0;
  const gradedSubs =
    dashboard.submissions?.filter((s) => s.score != null) ?? [];

  const avgScore = gradedSubs.length
    ? Math.round(
        gradedSubs.reduce((a, s) => a + ((s.score ?? 0) / s.total) * 100, 0) /
          gradedSubs.length,
      )
    : 0;
  const WORK_START_MINUTES = 7 * 60;
  const WORK_END_MINUTES = 21 * 60;

  function getTimeMinutes(value?: string) {
    if (!value) {
      return null;
    }

    const simpleTimeMatch = value.match(/^(\d{1,2}):(\d{2})/);

    if (simpleTimeMatch) {
      const hours = Number(simpleTimeMatch[1]);
      const minutes = Number(simpleTimeMatch[2]);

      return hours * 60 + minutes;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.getHours() * 60 + parsedDate.getMinutes();
  }

  function formatAttendanceTime(value?: string) {
    if (!value) {
      return "Not marked";
    }

    const simpleTimeMatch = value.match(/^(\d{1,2}):(\d{2})/);

    if (simpleTimeMatch) {
      const hours = Number(simpleTimeMatch[1]);
      const minutes = simpleTimeMatch[2];

      const suffix = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;

      return `${displayHour}:${minutes} ${suffix}`;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const presentRecords = educatorAttendanceRecords.filter(
    (record) =>
      record.status === "present" ||
      record.status === "late" ||
      record.status === "half_day",
  );

  const absentRecords = educatorAttendanceRecords.filter(
    (record) => record.status === "absent",
  );

  const lateCheckInRecords = educatorAttendanceRecords.filter((record) => {
    const checkInMinutes = getTimeMinutes(record.checkIn);

    return checkInMinutes !== null && checkInMinutes > WORK_START_MINUTES;
  });

  const lateCheckOutRecords = educatorAttendanceRecords.filter((record) => {
    const checkOutMinutes = getTimeMinutes(record.checkOut);

    return checkOutMinutes !== null && checkOutMinutes > WORK_END_MINUTES;
  });

  const attendanceChartTotal = presentRecords.length + absentRecords.length;

  const presentChartPercentage =
    attendanceChartTotal > 0
      ? (presentRecords.length / attendanceChartTotal) * 100
      : 0;

  const todayDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const todayEducatorAttendance = educatorAttendanceRecords.find(
    (record) => record.date === todayDate,
  );

  const monthlyEarningsMetric = dashboard.analytics?.metrics?.find(
    (metric) =>
      metric.label === "Monthly Earnings" ||
      metric.label === "This Month Earnings",
  );

  const totalEarningsMetric = dashboard.analytics?.metrics?.find(
    (metric) =>
      metric.label === "Total Earnings" || metric.label === "Lifetime Earnings",
  );

  const monthlyEarnings = monthlyEarningsMetric?.value ?? "₹0";
  const totalEarnings = totalEarningsMetric?.value ?? "₹0";

  const todayDateKey = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const todayLectures =
    dashboard.lectures?.filter((lecture) => {
      const lectureDateValue = lecture.date || lecture.startsAt;

      if (!lectureDateValue) {
        return false;
      }

      const lectureDate = new Date(lectureDateValue);

      if (Number.isNaN(lectureDate.getTime())) {
        return lectureDateValue.slice(0, 10) === todayDateKey;
      }

      return (
        lectureDate.toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        }) === todayDateKey
      );
    }) ?? [];

  function formatVisitTime(value?: string) {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value.slice(11, 16) || value;
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  }

  const homeTutoringVisits = todayLectures.flatMap((lecture) => {
    const assignedStudentIds = lecture.assignedStudentIds ?? [];

    return assignedStudentIds.flatMap((studentId) => {
      const student = managedUsers?.find((user) => user.id === studentId);

      if (!student || student.profile?.studentType !== "home") {
        return [];
      }

      const addressParts = [
        student.profile.addressLine1,
        student.profile.addressLine2,
        student.profile.city,
        student.profile.state,
        student.profile.pincode,
      ].filter(
        (part): part is string =>
          typeof part === "string" && part.trim().length > 0,
      );

      const fullAddress =
        addressParts.join(", ") ||
        student.profile.address?.trim() ||
        "Address not added";

      return [
        {
          id: `${lecture.id}-${student.id}`,
          studentName: student.name,
          studentPhoto: student.profile.profilePhoto,
          subject: lecture.subject || "General Tuition",
          topic: lecture.topicCovered || lecture.title || "Topic not added",
          startTime: formatVisitTime(lecture.startsAt) || "Time not set",
          endTime: formatVisitTime(lecture.endsAt),
          fullAddress,
          hasAddress: fullAddress !== "Address not added",
          status: lecture.status,
        },
      ];
    });
  });

  const quickActions = [
    {
      label: "Attendance",
      icon: UserCheck,
      section: "attendance",
      color: "#059669",
    },
    {
      label: "Homework",
      icon: BookOpen,
      section: "homework",
      color: "#1D4ED8",
    },
    { label: "Exams", icon: FileText, section: "tests", color: "#6D28D9" },
    {
      label: "My Students",
      icon: Users,
      section: "students",
      color: "#D97706",
    },
  ];
  const recentEducatorDoubts: DoubtItem[] = [...educatorDoubts]
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();

      const rightTime = new Date(right.createdAt).getTime();

      const safeLeftTime = Number.isNaN(leftTime) ? 0 : leftTime;

      const safeRightTime = Number.isNaN(rightTime) ? 0 : rightTime;

      return safeRightTime - safeLeftTime;
    })
    .slice(0, 3);

  const doubtAvatarStyles: string[] = [
    "bg-violet-50 text-violet-700",
    "bg-amber-50 text-amber-700",
    "bg-emerald-50 text-emerald-700",
  ];
  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{
          background: "linear-gradient(135deg,#0369A1,#1D4ED8,#6D28D9)",
        }}
      >
        <div className="absolute inset-0 opacity-[0.07]">
          <svg
            className="w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <circle cx="60" cy="20" r="100" fill="white" />
            <circle cx="360" cy="180" r="130" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center gap-5">
          {/* Teacher Profile Picture / Avatar */}
          <div className="shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[3px] border-white/80 bg-white/20 shadow-lg shadow-black/20 backdrop-blur-sm sm:h-24 sm:w-24">
              {dashboard.profile?.profilePhoto ? (
                <img
                  src={dashboard.profile.profilePhoto}
                  alt={`${session?.name ?? "Teacher"} profile`}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/20 text-2xl font-black text-white sm:text-3xl">
                  {getInitials(session?.name)}
                </div>
              )}
            </div>
          </div>

          {/* Teacher Information */}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] opacity-60">
              Teacher Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Welcome, {educatorFirstName}
              {educatorTitle ? ` ${educatorTitle}` : ""}!
            </h1>

            <p className="mt-0.5 text-sm font-semibold text-white/75">
              {educatorSubjects.length > 0
                ? `Teaches: ${educatorSubjects.join(" • ")}`
                : "Subjects not added"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                <Users size={12} />
                <span className="text-sm font-black">{myStudents}</span>
                My Students
              </span>
            </div>
          </div>
        </div>

        {session?.facultyCode && (
          <div className="absolute bottom-5 right-6 z-20">
            <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-mono text-[11px] font-bold text-white/90 backdrop-blur-sm">
              Employee ID: {session.facultyCode}
            </span>
          </div>
        )}
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "My Students",
            value: myStudents,
            color: "#1D4ED8",
            icon: Users,
          },
          {
            label: "Homework Reviews",
            value: pendingReviews,
            color: "#D97706",
            icon: Clock,
          },
          {
            label: "Class Avg Score",
            value: `${avgScore}%`,
            color: "#059669",
            icon: TrendingUp,
          },
          {
            label: "Today's Classes",
            value: todayLectures.length,
            color: "#7C3AED",
            icon: CalendarDays,
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden hover:shadow-md transition-shadow"
            >
              <div style={{ height: 3, background: kpi.color }} />
              <div className="p-4 sm:p-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${kpi.color}14` }}
                >
                  <Icon size={20} style={{ color: kpi.color }} />
                </div>
                <p
                  className="text-2xl font-black text-slate-900"
                  style={{ color: kpi.color }}
                >
                  {kpi.value}
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.05em] text-slate-400 mt-0.5">
                  {kpi.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {/* Educator Attendance Report */}
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-[#F1F5F9] px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-slate-900 sm:gap-2 sm:text-sm">
              <BarChart3
                size={14}
                className="shrink-0 sm:h-4 sm:w-4"
                style={{ color: "#2563EB" }}
              />

              <span className="truncate">My Attendance Report</span>
            </h2>

            <span className="hidden shrink-0 text-[10px] text-slate-400 sm:inline sm:text-xs">
              Check-In & Check-Out
            </span>
          </div>

          <div className="p-5">
            {attendanceError ? (
              <div className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                {attendanceError}
              </div>
            ) : null}
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24 shrink-0">
                {/* Coloured Present/Absent donut */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: attendanceLoading
                      ? "#E8EDF2"
                      : attendanceChartTotal > 0
                        ? `conic-gradient(
              #059669 0% ${presentChartPercentage}%,
              #2563EB ${presentChartPercentage}% 100%
            )`
                        : "#E8EDF2",
                  }}
                />

                {/* White centre with number and DAYS */}
                <div
                  className="absolute z-10 flex flex-col items-center justify-center rounded-full bg-white shadow-inner"
                  style={{
                    inset: "10px",
                  }}
                >
                  <p className="text-xl font-black leading-none text-[#1D4ED8]">
                    {attendanceLoading ? "..." : attendanceChartTotal}
                  </p>

                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                    Days
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    Present
                  </span>

                  <span className="font-bold text-emerald-600">
                    {presentRecords.length}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-blue-600">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    Absent
                  </span>

                  <span className="font-bold text-blue-600">
                    {absentRecords.length}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Late Check-In
                  </span>

                  <span className="font-bold text-amber-600">
                    {lateCheckInRecords.length}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-rose-600">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Late Check-Out
                  </span>

                  <span className="font-bold text-rose-600">
                    {lateCheckOutRecords.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-dashed border-slate-200 pt-4">
              <div className="rounded-xl bg-emerald-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                  Today’s Check-In
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  {attendanceLoading
                    ? "Loading..."
                    : formatAttendanceTime(todayEducatorAttendance?.checkIn)}
                </p>

                {todayEducatorAttendance?.checkIn &&
                getTimeMinutes(todayEducatorAttendance.checkIn) !== null &&
                getTimeMinutes(todayEducatorAttendance.checkIn)! >
                  WORK_START_MINUTES ? (
                  <p className="mt-1 text-[10px] font-semibold text-amber-600">
                    Late check-in
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl bg-blue-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  Today’s Check-Out
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  {attendanceLoading
                    ? "Loading..."
                    : formatAttendanceTime(todayEducatorAttendance?.checkOut)}
                </p>

                {todayEducatorAttendance?.checkOut &&
                getTimeMinutes(todayEducatorAttendance.checkOut) !== null &&
                getTimeMinutes(todayEducatorAttendance.checkOut)! >
                  WORK_END_MINUTES ? (
                  <p className="mt-1 text-[10px] font-semibold text-rose-600">
                    Late check-out
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Students Needing Attention */}
        {/* Student's Doubt List */}
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#E8EDF2] px-5 py-4">
            <h2 className="flex min-w-0 items-center gap-2 text-sm font-black text-slate-900 sm:text-base">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rose-200 text-rose-500">
                <HelpCircle size={14} />
              </span>

              <span className="truncate">Student&apos;s Doubt List</span>
            </h2>

            <button
              type="button"
              onClick={() => onSetActiveSection("doubt-box")}
              className="flex shrink-0 items-center gap-2 text-xs font-black text-[#4338CA] transition hover:text-[#312E81]"
            >
              View all
              <span aria-hidden="true" className="text-base leading-none">
                →
              </span>
            </button>
          </div>

          {doubtsError ? (
            <div className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {doubtsError}
            </div>
          ) : null}

          <div className="px-5">
            {doubtsLoading ? (
              <div className="divide-y divide-slate-100">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-3 py-4"
                  >
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100" />

                    <div className="flex-1">
                      <div className="h-3 w-24 rounded bg-slate-100" />
                      <div className="mt-2 h-2.5 w-40 rounded bg-slate-100" />
                    </div>

                    <div className="h-8 w-20 rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : recentEducatorDoubts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentEducatorDoubts.map((doubt, index) => {
                  const isResolved =
                    doubt.status === "resolved" || doubt.status === "closed";

                  const avatarClass =
                    doubtAvatarStyles[index % doubtAvatarStyles.length];

                  return (
                    <div
                      key={doubt.id}
                      className="flex min-h-[78px] items-center gap-3 py-3.5"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black ${avatarClass}`}
                      >
                        {getInitials(doubt.studentName).slice(0, 1)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">
                          {doubt.studentName}
                        </p>

                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          {doubt.subject || "General"}
                          {" — "}
                          {doubt.title}
                        </p>
                      </div>

                      <span
                        className={`hidden min-w-[58px] shrink-0 text-right text-[11px] font-bold sm:block ${
                          isResolved
                            ? "text-emerald-600"
                            : index === 0
                              ? "text-rose-500"
                              : index === 1
                                ? "text-amber-600"
                                : "text-emerald-600"
                        }`}
                      >
                        {formatRelativeTime(doubt.createdAt)}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSetActiveSection("doubt-box")}
                        className={`flex h-9 min-w-[86px] shrink-0 items-center justify-center rounded-lg border px-4 text-xs font-black transition ${
                          isResolved
                            ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                            : "border-indigo-300 bg-white text-indigo-700 hover:border-indigo-500 hover:bg-indigo-50"
                        }`}
                      >
                        {isResolved ? "Resolved" : "View"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[235px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <HelpCircle size={22} />
                </div>

                <p className="mt-3 text-sm font-black text-slate-800">
                  No student doubts
                </p>

                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                  New questions submitted by students will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── Earnings and Home Tutoring Row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* My Earnings */}
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] px-4 sm:px-5 py-3 sm:py-4 gap-2">
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-slate-900">
                <Banknote
                  size={15}
                  className="sm:w-[17px] sm:h-[17px] shrink-0 text-emerald-600"
                />
                My Earnings
              </h2>

              <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-slate-400">
                Teacher payout summary
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black text-emerald-700 shrink-0">
              Private
            </span>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <CalendarDays size={17} />
                </div>

                <p className="mt-3 text-xl font-black text-slate-900">
                  {monthlyEarnings}
                </p>

                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Monthly Earnings
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <IndianRupee size={17} />
                </div>

                <p className="mt-3 text-xl font-black text-slate-900">
                  {totalEarnings}
                </p>

                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Total Earnings
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSetActiveSection("teacher-payouts")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white transition hover:bg-emerald-700"
            >
              View My Earnings
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>

        {/* Today's Home Tutoring */}
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] px-4 sm:px-5 py-3 sm:py-4 gap-2">
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-slate-900">
                <Home
                  size={15}
                  className="sm:w-[17px] sm:h-[17px] shrink-0 text-violet-600"
                />
                Today&apos;s Home Tutoring
              </h2>

              <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-slate-400">
                Home visits assigned for today
              </p>
            </div>

            <span className="flex h-7 sm:h-8 min-w-7 sm:min-w-8 items-center justify-center rounded-full bg-violet-50 px-2 text-[10px] sm:text-xs font-black text-violet-700 shrink-0">
              {homeTutoringVisits.length}
            </span>
          </div>

          <div className="p-4">
            {homeTutoringVisits.length > 0 ? (
              <div className="space-y-3">
                {homeTutoringVisits.slice(0, 3).map((visit) => (
                  <article
                    key={visit.id}
                    className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-white"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {visit.studentPhoto ? (
                          <img
                            src={visit.studentPhoto}
                            alt={`${visit.studentName} profile`}
                            className="h-11 w-11 shrink-0 rounded-xl border border-white object-cover object-top shadow-sm"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-black text-violet-700">
                            {getInitials(visit.studentName)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-black text-slate-900">
                                {visit.studentName}
                              </h3>

                              <p className="mt-0.5 text-xs font-bold text-violet-700">
                                {visit.subject}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#0B40A1] shadow-sm">
                              {visit.startTime}
                              {visit.endTime ? ` – ${visit.endTime}` : ""}
                            </span>
                          </div>

                          <div className="mt-3 rounded-xl border border-white bg-white/80 p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                              Topic
                            </p>

                            <p className="mt-1 text-xs font-bold leading-5 text-slate-700">
                              {visit.topic}
                            </p>
                          </div>

                          <div className="mt-3 flex items-start gap-2">
                            <MapPin
                              size={15}
                              className="mt-0.5 shrink-0 text-rose-500"
                            />

                            <p className="line-clamp-2 text-xs font-medium leading-5 text-slate-600">
                              {visit.fullAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-violet-100 bg-white/70 p-3">
                      {visit.hasAddress ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            visit.fullAddress,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-violet-700"
                        >
                          <Navigation size={14} />
                          Open Map
                        </a>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onSetActiveSection("timetable")}
                        className="flex flex-1 items-center justify-center rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-black text-violet-700 transition hover:bg-violet-50"
                      >
                        View Timetable
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Home size={25} />
                </div>

                <p className="mt-4 text-sm font-black text-slate-800">
                  No home visits today
                </p>

                <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                  Home tutoring sessions assigned for today will appear here
                  with the student, topic, time and address.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pending Homework Reviews ── */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[#F1F5F9] gap-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Clock
              size={14}
              className="sm:w-4 sm:h-4 shrink-0"
              style={{ color: "#D97706" }}
            />{" "}
            <span className="truncate">
              Pending Homework Reviews ({pendingReviews})
            </span>
          </h2>
          <button
            onClick={() => onSetActiveSection("homework")}
            className="text-[10px] sm:text-xs font-bold text-indigo-600 hover:underline shrink-0"
          >
            View all →
          </button>
        </div>
        <div className="px-5 py-4">
          {pendingReviews > 0 ? (
            <div className="space-y-2">
              {dashboard.submissions
                ?.filter((s) => s.status === "submitted")
                .slice(0, 5)
                .map((sub, i) => {
                  const test = dashboard.tests?.find(
                    (t) => t.id === sub.testId,
                  );
                  return (
                    <div
                      key={sub.id ?? i}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {sub.studentName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {test?.title ?? "Exam"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onSetActiveSection("tests")}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0 ml-3"
                      >
                        Review
                      </button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-sm">
              <CheckCircle2 size={28} className="text-emerald-400 mb-2" />
              <p className="font-bold text-emerald-600">
                All homework reviewed!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => onSetActiveSection(action.section)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-[#E8EDF2] hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${action.color}14` }}
              >
                <Icon size={20} style={{ color: action.color }} />
              </div>
              <span className="text-xs font-bold text-slate-700">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────── PROFILE CARD HELPERS ───────────

function PField({
  label,
  value,
}: {
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900 mt-0.5 break-words">
        {value}
      </p>
    </div>
  );
}

function PTags({
  label,
  values,
}: {
  label: string;
  values: string[] | undefined | null;
}) {
  if (!values || values.length === 0) return null;
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="rounded-lg bg-[#EBF1FA] text-[#0B40A1] px-2.5 py-1 text-xs font-bold border border-[#EBF1FA]"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function EducatorProfileCard({
  session,
  dashboard,
}: {
  session: SessionUser | null;
  dashboard: DashboardBundle;
}) {
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
      <PField
        label="Address"
        value={[p?.addressLine1, p?.addressLine2, p?.city, p?.state, p?.pincode]
          .filter(Boolean)
          .join(", ")}
      />
      {p?.examQualifications && p.examQualifications.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Exam Qualifications
          </p>
          <div className="space-y-2">
            {p.examQualifications.map((eq, i) => (
              <div key={i} className="text-sm font-semibold text-slate-800">
                {eq.examName}
                {eq.score ? ` – ${eq.score}` : ""}
                {eq.year ? ` (${eq.year})` : ""}
                {eq.rank ? ` • Rank: ${eq.rank}` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
  const hasExtra = !!(
    p?.dob ||
    p?.dateOfBirth ||
    p?.addressLine1 ||
    (p?.examQualifications && p.examQualifications.length > 0)
  );
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="h-20 bg-[#0B40A1] relative" />
      <div className="px-6 pb-6 relative">
        <div className="flex -mt-10 mb-4">
          <div className="h-20 w-20 rounded-xl bg-white p-1 shadow-md">
            <div className="h-full w-full rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {p?.profilePhoto ? (
                <img
                  src={p.profilePhoto}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-black text-slate-500">
                  {getInitials(session?.name)}
                </span>
              )}
            </div>
          </div>
          <div className="ml-4 mt-6">
            {session?.verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                <CheckCircle2 size={10} />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600 border border-red-100">
                <i
                  className="bi bi-exclamation-triangle-fill"
                  style={{ fontSize: 10 }}
                />
                Not Verified
              </span>
            )}
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {session?.name ?? "Educator"}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{session?.email ?? ""}</p>
        <div className="mt-5 space-y-3">
          {basicFields}
          {showAll && hasExtra && extraFields}
        </div>
        {hasExtra && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="mt-4 w-full rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-[#0B40A1] border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            {showAll ? "View Less ↑" : "View More ↓"}
          </button>
        )}
      </div>
    </div>
  );
}

function GenericProfileCard({
  session,
  role,
  dashboard,
}: {
  session: SessionUser | null;
  role: Role;
  dashboard: DashboardBundle;
}) {
  const [showAll, setShowAll] = useState(false);
  const p = dashboard.profile;
  const basicFields = (
    <>
      <PField label="Gender" value={p?.gender} />
      <PField label="Date of Birth" value={p?.dob || p?.dateOfBirth} />
      {role === "parent" && (
        <>
          <PField
            label="Student"
            value={
              dashboard.linkedStudentId
                ? `Linked (${dashboard.linkedStudentId.slice(0, 8).toUpperCase()})`
                : "—"
            }
          />
        </>
      )}
    </>
  );
  const extraFields = (
    <>
      <PField
        label="Address"
        value={[p?.addressLine1, p?.addressLine2, p?.city, p?.state, p?.pincode]
          .filter(Boolean)
          .join(", ")}
      />
    </>
  );
  const hasExtra = !!p?.addressLine1;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="h-16 bg-[#0B40A1]" />
      <div className="px-6 pb-6 relative">
        <div className="flex -mt-8 mb-3">
          <div className="h-16 w-16 rounded-xl bg-white p-1 shadow-md">
            <div className="h-full w-full rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {p?.profilePhoto ? (
                <img
                  src={p.profilePhoto}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-black text-slate-500">
                  {getInitials(session?.name)}
                </span>
              )}
            </div>
          </div>
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {session?.name ?? role}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 capitalize">
          {role} • {session?.email ?? ""}
        </p>
        <div className="mt-4 space-y-3">
          {basicFields}
          {showAll && hasExtra && extraFields}
        </div>
        {hasExtra && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="mt-4 w-full rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-[#0B40A1] border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            {showAll ? "View Less ↑" : "View More ↓"}
          </button>
        )}
      </div>
    </div>
  );
}
