"use client";

import { useEffect, useMemo, useState } from "react";

type FacultyMember = {
  facultyId: string;
  facultyName: string;
  profilePhoto?: string;
  qualification?: string;
  subjects?: string[];
  avgScore: number | null;
  classes: number;
  hwAssigned: number;
  hwCompletion: number;
  doubtsAnswered: number;
  performanceScore: number;
  rank: number;
};

type PeriodOption = { value: string; label: string };

export function FacultyPerformanceManager() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedPeriod) params.set("period", selectedPeriod);

    fetch(`/api/faculty-performance?${params}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setFaculty(data.faculty || []);
          if (data.periods?.length) setPeriods(data.periods);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  const stats = useMemo(() => {
    const total = faculty.length;
    const avgPerf = total
      ? Math.round(faculty.reduce((s, f) => s + f.performanceScore, 0) / total)
      : 0;
    const topScorer = faculty.length ? faculty[0] : null;
    const activeCount = faculty.filter((f) => f.classes > 0).length;
    return { total, avgPerf, topScorer, activeCount };
  }, [faculty]);

  function getRankBadge(rank: number) {
    if (rank === 1) return { emoji: "🥇", bg: "#FEF3C7", border: "#F59E0B" };
    if (rank === 2) return { emoji: "🥈", bg: "#E5E7EB", border: "#9CA3AF" };
    if (rank === 3) return { emoji: "🥉", bg: "#FED7AA", border: "#F97316" };
    return { emoji: `#${rank}`, bg: "#F1F5F9", border: "#CBD5E1" };
  }

  function getScoreColor(score: number) {
    if (score >= 80) return { bar: "#10B981", text: "#059669" };
    if (score >= 60) return { bar: "#3B82F6", text: "#2563EB" };
    if (score >= 40) return { bar: "#F59E0B", text: "#D97706" };
    return { bar: "#EF4444", text: "#DC2626" };
  }

  function getAvatarColor(name: string) {
    const colors = [
      "#4F46E5", "#7C3AED", "#EC4899", "#EF4444",
      "#F59E0B", "#10B981", "#06B6D4", "#8B5CF6",
    ];
    let hash = 0;
    for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-heading)] tracking-tight">
              Faculty Performance
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Ranked overview of faculty metrics, teaching quality, and student engagement
            </p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
            style={{ background: "#EEF2FF", color: "#4F46E5" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics Dashboard
          </span>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPeriod(p.value)}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
                style={{
                  background: selectedPeriod === p.value ? "#4F46E5" : "#F1F5F9",
                  color: selectedPeriod === p.value ? "#fff" : "#475569",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Faculty", value: stats.total, icon: "bi-people-fill", color: "#4F46E5" },
            { label: "Avg Performance", value: `${stats.avgPerf}%`, icon: "bi-speedometer2", color: "#10B981" },
            { label: "Active Faculty", value: stats.activeCount, icon: "bi-person-check-fill", color: "#0EA5E9" },
            { label: "Top Performer", value: stats.topScorer?.facultyName?.split(" ")[0] || "—", icon: "bi-trophy-fill", color: "#F59E0B" },
          ].map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: `${s.color}15` }}
                >
                  <i className={`bi ${s.icon} text-lg`} style={{ color: s.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    {s.label}
                  </p>
                  <p className="text-lg font-black text-[var(--color-heading)] truncate">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Faculty List */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : faculty.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-16 text-center">
            <i className="bi bi-person-x text-4xl text-[var(--color-muted)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">No faculty data available</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">Add faculty members and conduct classes to see performance metrics</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {faculty.map((f) => {
              const rankBadge = getRankBadge(f.rank);
              const scoreColor = getScoreColor(f.performanceScore);
              const avatarBg = getAvatarColor(f.facultyName);

              return (
                <div
                  key={f.facultyId}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-all hover:shadow-md"
                >
                  {/* Rank Badge */}
                  <div
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black"
                    style={{
                      background: rankBadge.bg,
                      border: `2px solid ${rankBadge.border}`,
                      color: f.rank <= 3 ? undefined : "#475569",
                    }}
                  >
                    {rankBadge.emoji}
                  </div>

                  {/* Top Accent */}
                  <div className="h-1.5" style={{ background: scoreColor.bar }} />

                  {/* Faculty Info */}
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-center gap-3">
                      {f.profilePhoto ? (
                        <img
                          src={f.profilePhoto}
                          alt={f.facultyName}
                          className="h-14 w-14 rounded-xl object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white shadow-sm"
                          style={{ background: avatarBg }}
                        >
                          {f.facultyName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-[var(--color-heading)] truncate">
                          {f.facultyName}
                        </p>
                        {f.qualification && (
                          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">{f.qualification}</p>
                        )}
                        {f.subjects && f.subjects.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {f.subjects.slice(0, 3).map((s, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600"
                              >
                                {s}
                              </span>
                            ))}
                            {f.subjects.length > 3 && (
                              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                +{f.subjects.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="border-t border-[var(--color-border)] px-5 py-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Avg Score", value: f.avgScore !== null ? `${f.avgScore}%` : "N/A", color: "#4F46E5" },
                        { label: "Classes", value: `${f.classes}`, color: "#10B981" },
                        { label: "HW Assigned", value: `${f.hwAssigned}`, color: "#F59E0B" },
                        { label: "HW Completion", value: `${f.hwCompletion}%`, color: "#EC4899" },
                        { label: "Doubts", value: `${f.doubtsAnswered}`, color: "#8B5CF6" },
                        { label: "Feedback", value: `${f.doubtsAnswered}`, color: "#06B6D4" },
                      ].map((m) => (
                        <div key={m.label} className="rounded-lg bg-[var(--color-panel)] px-2 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            {m.label}
                          </p>
                          <p className="mt-0.5 text-sm font-black" style={{ color: m.color }}>
                            {m.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Score Bar */}
                  <div className="border-t border-[var(--color-border)] px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        Performance Score
                      </span>
                      <span
                        className="text-sm font-black"
                        style={{ color: scoreColor.text }}
                      >
                        {f.performanceScore}/100
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${f.performanceScore}%`,
                          background: `linear-gradient(90deg, ${scoreColor.bar}CC, ${scoreColor.bar})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formula Card */}
      <div className="mx-6 mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          <i className="bi bi-calculator me-1" />
          Performance Score Formula
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { weight: "40%", label: "Avg Student Score", desc: "Average marks in weekly tests" },
            { weight: "30%", label: "Classes Conducted", desc: "Completed lectures (5 pts/class, max 30)" },
            { weight: "30%", label: "Student Engagement", desc: "Doubts answered + feedback (x2)" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5"
            >
              <span className="inline-block rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-black text-[var(--color-primary)]">
                {item.weight}
              </span>
              <p className="mt-1.5 text-xs font-bold text-[var(--color-heading)]">{item.label}</p>
              <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
