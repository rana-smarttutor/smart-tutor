"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  GamificationBadge,
  GamificationLeaderboardEntry,
  GamificationAutoAwardRule,
  GamificationStats,
  SessionUser,
} from "@/lib/types";
import { DEFAULT_GAMIFICATION_LEVELS } from "@/lib/gamification-constants";

type Props = {
  session: SessionUser | null;
};

export function GamificationManager({ session }: Props) {
  const [leaderboard, setLeaderboard] = useState<GamificationLeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<GamificationBadge[]>([]);
  const [rules, setRules] = useState<GamificationAutoAwardRule[]>([]);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showAwardBadgeModal, setShowAwardBadgeModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const [awardStudentId, setAwardStudentId] = useState("");
  const [awardPoints, setAwardPoints] = useState(10);
  const [awardActivity, setAwardActivity] = useState<string>("manual");
  const [awardDescription, setAwardDescription] = useState("");

  const [badgeName, setBadgeName] = useState("");
  const [badgeIcon, setBadgeIcon] = useState("🏆");
  const [badgeDesc, setBadgeDesc] = useState("");
  const [badgeCriteriaType, setBadgeCriteriaType] = useState<string>("points_threshold");
  const [badgeCriteriaValue, setBadgeCriteriaValue] = useState(100);
  const [badgeColor, setBadgeColor] = useState("#F59E0B");

  const [awardBadgeStudentId, setAwardBadgeStudentId] = useState("");
  const [awardBadgeId, setAwardBadgeId] = useState("");
  const [awardBadgeReason, setAwardBadgeReason] = useState("");

  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState<string>("attendance_100_week");
  const [rulePoints, setRulePoints] = useState(10);
  const [ruleBadgeId, setRuleBadgeId] = useState("");

  const [status, setStatus] = useState("");

  const [studentMap, setStudentMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/users", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (data.users) {
          const map: Record<string, string> = {};
          for (const u of data.users) {
            if (u.role === "student") map[u.id] = u.name;
          }
          setStudentMap(map);
        }
      })
      .catch(() => {});
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [lbRes, badgeRes, ruleRes, statsRes] = await Promise.all([
        fetch("/api/gamification", { credentials: "same-origin" }),
        fetch("/api/gamification/badges", { credentials: "same-origin" }),
        fetch("/api/gamification/rules", { credentials: "same-origin" }),
        fetch("/api/gamification?type=stats", { credentials: "same-origin" }),
      ]);
      const lbData = await lbRes.json();
      const badgeData = await badgeRes.json();
      const ruleData = await ruleRes.json();
      const statsData = await statsRes.json();
      if (lbData.leaderboard) setLeaderboard(lbData.leaderboard);
      if (badgeData.badges) setBadges(badgeData.badges);
      if (ruleData.rules) setRules(ruleData.rules);
      if (statsData.stats) setStats(statsData.stats);
    } catch {
      setStatus("Failed to load gamification data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const studentOptions = useMemo(
    () =>
      Object.entries(studentMap)
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [studentMap],
  );

  const badgeOptions = useMemo(
    () => badges.map((b) => ({ id: b.id, name: b.name, icon: b.icon })),
    [badges],
  );

  const top3 = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const rest = useMemo(() => leaderboard.slice(3), [leaderboard]);

  async function handleAwardPoints() {
    if (!awardStudentId) {
      setStatus("Select a student.");
      return;
    }
    const res = await fetch("/api/gamification/points", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: awardStudentId,
        points: awardPoints,
        activity: awardActivity,
        description: awardDescription,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(`Awarded ${awardPoints} points!`);
      setShowAwardModal(false);
      setAwardStudentId("");
      setAwardPoints(10);
      setAwardActivity("manual");
      setAwardDescription("");
      loadData();
    } else {
      setStatus(data.error ?? "Failed to award points.");
    }
  }

  async function handleCreateBadge() {
    if (!badgeName) {
      setStatus("Badge name is required.");
      return;
    }
    const res = await fetch("/api/gamification/badges", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: badgeName,
        icon: badgeIcon,
        description: badgeDesc,
        criteriaType: badgeCriteriaType,
        criteriaValue: badgeCriteriaValue,
        color: badgeColor,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(`Badge "${badgeName}" created!`);
      setShowBadgeModal(false);
      setBadgeName("");
      setBadgeIcon("🏆");
      setBadgeDesc("");
      setBadgeCriteriaType("points_threshold");
      setBadgeCriteriaValue(100);
      setBadgeColor("#F59E0B");
      loadData();
    } else {
      setStatus(data.error ?? "Failed to create badge.");
    }
  }

  async function handleAwardBadge() {
    if (!awardBadgeStudentId || !awardBadgeId) {
      setStatus("Select a student and badge.");
      return;
    }
    const res = await fetch("/api/gamification/badges/award", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: awardBadgeStudentId,
        badgeId: awardBadgeId,
        reason: awardBadgeReason,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("Badge awarded!");
      setShowAwardBadgeModal(false);
      setAwardBadgeStudentId("");
      setAwardBadgeId("");
      setAwardBadgeReason("");
      loadData();
    } else {
      setStatus(data.error ?? "Failed to award badge.");
    }
  }

  async function handleCreateRule() {
    if (!ruleName) {
      setStatus("Rule name is required.");
      return;
    }
    const res = await fetch("/api/gamification/rules", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ruleName,
        trigger: ruleTrigger,
        points: rulePoints,
        badgeId: ruleBadgeId || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(`Rule "${ruleName}" created!`);
      setShowRuleModal(false);
      setRuleName("");
      setRuleTrigger("attendance_100_week");
      setRulePoints(10);
      setRuleBadgeId("");
      loadData();
    } else {
      setStatus(data.error ?? "Failed to create rule.");
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 pb-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-heading)] m-0">
            Gamification &amp; Leaderboard
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Motivate students with points, badges and rankings
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowBadgeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
          >
            <i className="bi bi-award" />
            New Badge
          </button>
          <button
            onClick={() => setShowAwardModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
          >
            <i className="bi bi-plus-lg" />
            Award Points
          </button>
        </div>
      </div>

      {status ? (
        <div className="mx-6 mt-4 rounded-xl bg-[var(--color-panel)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] border border-[var(--color-border)]">
          {status}
        </div>
      ) : null}

      {/* Stats Row */}
      <div className="px-6 pt-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="stat flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-500 text-xl">
              <i className="bi bi-star-fill" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-muted)]">Points Awarded</div>
              <div className="text-2xl font-extrabold text-[var(--color-heading)]">
                {stats?.totalPointsAwarded ?? 0}
              </div>
            </div>
          </div>
          <div className="stat flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 text-xl">
              <i className="bi bi-people-fill" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-muted)]">Active Students</div>
              <div className="text-2xl font-extrabold text-[var(--color-heading)]">
                {stats?.activeStudents ?? 0}
              </div>
            </div>
          </div>
          <div className="stat flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-500 text-xl">
              <i className="bi bi-award-fill" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--color-muted)]">Badges Given</div>
              <div className="text-2xl font-extrabold text-[var(--color-heading)]">
                {stats?.totalBadgesGiven ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
            {/* Leaderboard */}
            <div>
              <h6 className="mb-3 text-sm font-bold text-[var(--color-heading)]">
                Full Leaderboard
              </h6>
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white py-12">
                  <i className="bi bi-trophy text-5xl text-[var(--color-muted)] mb-3" />
                  <h6 className="font-bold text-[var(--color-heading)]">No points awarded yet</h6>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Use &quot;Award Points&quot; to start motivating students!
                  </p>
                </div>
              ) : (
                <>
                  {/* Podium */}
                  {top3.length > 0 && (
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      {top3.map((entry, i) => {
                        const podium = ["podium-1", "podium-2", "podium-3"][i];
                        const crown = i === 0 ? "👑" : i === 1 ? "🥈" : "🥉";
                        return (
                          <div
                            key={entry.studentId}
                            className={`rounded-2xl border-2 p-5 text-center ${
                              i === 0
                                ? "border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-100"
                                : i === 1
                                  ? "border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100"
                                  : "border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100"
                            }`}
                          >
                            <span className="block text-2xl mb-1">{crown}</span>
                            <div
                              className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                              style={{ background: i === 0 ? "#F59E0B" : i === 1 ? "#64748B" : "#F97316" }}
                            >
                              {entry.studentName.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-xs font-bold text-[var(--color-heading)] truncate">
                              {entry.studentName}
                            </p>
                            <p className="text-lg font-extrabold text-[var(--color-heading)]">{entry.points}</p>
                            <p className="text-[10px] font-semibold text-[var(--color-muted)]">points</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Leaderboard Rows */}
                  {rest.map((entry) => (
                    <div
                      key={entry.studentId}
                      className="mb-2 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 transition-colors hover:border-violet-200"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-extrabold text-violet-600">
                        {entry.rank}
                      </div>
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: entry.level >= 5 ? "#F59E0B" : entry.level >= 3 ? "#8B5CF6" : "#64748B" }}
                      >
                        {entry.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--color-heading)] truncate">
                          {entry.studentName}
                        </p>
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            background:
                              entry.level >= 5
                                ? "#FEF3C7"
                                : entry.level >= 3
                                  ? "#F0F9FF"
                                  : "#F1F5F9",
                            color:
                              entry.level >= 5
                                ? "#D97706"
                                : entry.level >= 3
                                  ? "#0284C7"
                                  : "#64748B",
                          }}
                        >
                          Lvl {entry.level} · {entry.levelName}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-[var(--color-heading)]">{entry.points}</p>
                        <p className="text-[10px] text-[var(--color-muted)]">{entry.badges} badges</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Badges & Levels */}
            <div>
              <h6 className="mb-3 text-sm font-bold text-[var(--color-heading)]">Badges</h6>
              {badges.length === 0 ? (
                <p className="py-4 text-center text-xs text-[var(--color-muted)]">No badges created yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm"
                    >
                      <span className="text-2xl block mb-1">{b.icon}</span>
                      <p className="text-xs font-bold text-[var(--color-heading)]">{b.name}</p>
                      <p className="text-[10px] text-[var(--color-muted)]">{b.criteriaType.replace(/_/g, " ")}: {b.criteriaValue}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowAwardBadgeModal(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
                >
                  <i className="bi bi-award" />
                  Award Badge
                </button>
              </div>

              {/* Level System */}
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <span className="text-xs font-bold text-[var(--color-heading)]">
                    <i className="bi bi-bar-chart-steps me-2" />
                    Level System
                  </span>
                </div>
                <div>
                  {DEFAULT_GAMIFICATION_LEVELS.map((lvl) => {
                    const colors = [
                      "bg-slate-100 text-slate-500",
                      "bg-sky-100 text-sky-600",
                      "bg-violet-100 text-violet-600",
                      "bg-violet-100 text-violet-600",
                      "bg-amber-100 text-amber-600",
                    ];
                    return (
                      <div
                        key={lvl.level}
                        className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${colors[lvl.level - 1]}`}
                        >
                          {lvl.level}
                        </div>
                        <span className="flex-1 text-xs font-semibold text-[var(--color-heading)]">
                          {lvl.name}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)]">
                          {lvl.pointsRequired.toLocaleString()} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Award Rules */}
        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <span className="text-xs font-bold text-[var(--color-heading)]">
              <i className="bi bi-robot me-2" />
              Auto-Award Rules
            </span>
            <button
              onClick={() => setShowRuleModal(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
            >
              <i className="bi bi-plus" />
              Add Rule
            </button>
          </div>
          {rules.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-[var(--color-muted)]">
              <i className="bi bi-robot text-3xl opacity-20 mb-2" />
              <p className="text-xs">No auto-award rules yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-3 px-5 py-3">
                  <i className="bi bi-lightning-fill text-amber-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--color-heading)]">{rule.name}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">
                      Trigger: {rule.trigger.replace(/_/g, " ")} · +{rule.points} pts
                      {rule.badgeId ? " · + Badge" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Award Points Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-4">
              <h3 className="text-lg font-black text-white">
                <i className="bi bi-star-fill me-2" />
                Award Points
              </h3>
            </div>
            <div className="p-6 grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Student *</label>
                <select
                  value={awardStudentId}
                  onChange={(e) => setAwardStudentId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Select student</option>
                  {studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Points *</label>
                  <input
                    type="number"
                    value={awardPoints}
                    onChange={(e) => setAwardPoints(Number(e.target.value))}
                    min={1}
                    max={1000}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Activity</label>
                  <select
                    value={awardActivity}
                    onChange={(e) => setAwardActivity(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="exam_pass">Exam Pass</option>
                    <option value="full_attendance">Full Attendance</option>
                    <option value="homework_submit">Homework Submit</option>
                    <option value="top_performer">Top Performer</option>
                    <option value="good_conduct">Good Conduct</option>
                    <option value="participation">Participation</option>
                    <option value="manual">Manual Award</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Note</label>
                <input
                  type="text"
                  value={awardDescription}
                  onChange={(e) => setAwardDescription(e.target.value.slice(0, 200))}
                  placeholder="Reason for awarding…"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button
                onClick={() => setShowAwardModal(false)}
                className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAwardPoints}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
              >
                ⭐ Award Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-black text-white">
                <i className="bi bi-award me-2" />
                Create Badge
              </h3>
            </div>
            <div className="p-6 grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Badge Name *</label>
                  <input
                    type="text"
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value.slice(0, 60))}
                    placeholder="e.g. Math Wizard"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Icon (emoji)</label>
                  <input
                    type="text"
                    value={badgeIcon}
                    onChange={(e) => setBadgeIcon(e.target.value.slice(0, 10))}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Description</label>
                <input
                  type="text"
                  value={badgeDesc}
                  onChange={(e) => setBadgeDesc(e.target.value.slice(0, 200))}
                  placeholder="What does this badge mean?"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Criteria Type</label>
                  <select
                    value={badgeCriteriaType}
                    onChange={(e) => setBadgeCriteriaType(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="points_threshold">Points Threshold</option>
                    <option value="exam_score">Exam Score %</option>
                    <option value="attendance_streak">Attendance Streak (days)</option>
                    <option value="homework_count">Homework Submitted</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Value *</label>
                  <input
                    type="number"
                    value={badgeCriteriaValue}
                    onChange={(e) => setBadgeCriteriaValue(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Color</label>
                <input
                  type="color"
                  value={badgeColor}
                  onChange={(e) => setBadgeColor(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button
                onClick={() => setShowBadgeModal(false)}
                className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBadge}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                Create Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award Badge Modal */}
      {showAwardBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-4">
              <h3 className="text-lg font-black text-white">
                <i className="bi bi-award me-2" />
                Award Badge to Student
              </h3>
            </div>
            <div className="p-6 grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Student *</label>
                <select
                  value={awardBadgeStudentId}
                  onChange={(e) => setAwardBadgeStudentId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Select student…</option>
                  {studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Badge *</label>
                <select
                  value={awardBadgeId}
                  onChange={(e) => setAwardBadgeId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Select badge…</option>
                  {badgeOptions.map((b) => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Reason</label>
                <input
                  type="text"
                  value={awardBadgeReason}
                  onChange={(e) => setAwardBadgeReason(e.target.value.slice(0, 200))}
                  placeholder="Why are you awarding this badge?"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button
                onClick={() => setShowAwardBadgeModal(false)}
                className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAwardBadge}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
              >
                Award Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Auto-Award Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-violet-700 px-6 py-4">
              <h3 className="text-lg font-black text-white">
                <i className="bi bi-robot me-2" />
                Create Auto-Award Rule
              </h3>
            </div>
            <div className="p-6 grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Rule Name *</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value.slice(0, 60))}
                  placeholder="e.g. Perfect Attendance Week"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Trigger Event *</label>
                  <select
                    value={ruleTrigger}
                    onChange={(e) => setRuleTrigger(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="attendance_100_week">100% Attendance This Week</option>
                    <option value="attendance_above_90">Attendance &gt; 90% (monthly)</option>
                    <option value="exam_score_above_90">Exam Score ≥ 90%</option>
                    <option value="exam_score_above_75">Exam Score ≥ 75%</option>
                    <option value="homework_submitted">Homework Submitted Today</option>
                    <option value="homework_on_time">Homework On Time</option>
                    <option value="rank_1_class">Rank #1 in Class</option>
                    <option value="rank_top3_class">Top 3 in Class</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Points *</label>
                  <input
                    type="number"
                    value={rulePoints}
                    onChange={(e) => setRulePoints(Number(e.target.value))}
                    min={1}
                    max={500}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-heading)]">Award Badge (optional)</label>
                <select
                  value={ruleBadgeId}
                  onChange={(e) => setRuleBadgeId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">No badge</option>
                  {badgeOptions.map((b) => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <button
                onClick={() => setShowRuleModal(false)}
                className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)] hover:bg-[var(--color-panel)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
