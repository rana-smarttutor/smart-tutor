"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AttendanceSheet, AttendanceStatus, ManagedUser } from "@/lib/types";

type Mark = AttendanceStatus | "unmarked";
type Entry = { studentId: string; studentName: string; status: Mark };
const DAILY_KEY = "student:daily:v1";
const OPTIONS: { value: Mark; label: string }[] = [
  { value: "unmarked", label: "Mark attendance" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "On Leave" },
];
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function courseOf(s: ManagedUser) {
  return s.profile?.courseWantedTitle?.trim() || s.profile?.courseWanted?.trim() || s.program?.trim() || "Unassigned";
}
function classRank(value: string) {
  const v = value.toLowerCase().trim();
  const match = v.match(/(?:class|grade|standard|std\.?|^)(?:\s*[-:]?\s*)(\d{1,2})(?:\b|th\b|st\b|nd\b|rd\b)/);
  if (match) {
    const number = Number(match[1]);
    if (number >= 1 && number <= 12) return number;
  }
  if (/nursery|pre.?primary|play.?group/.test(v)) return -2;
  if (/kindergarten|\bkg\b|lkg|ukg/.test(v)) return -1;
  if (/college|bsc|b\.sc|bcom|b\.com|bba|bca|ba\b|undergrad/.test(v)) return 20;
  if (/competitive|ssc|upsc|neet|jee|bank|government/.test(v)) return 30;
  return 40;
}
function classLabel(s: ManagedUser) {
  const course = courseOf(s);
  const rank = classRank(course);
  if (rank >= 1 && rank <= 12) return `Class ${rank}`;
  return course;
}
export function DailyStudentAttendanceManager({ studentDirectory }: { studentDirectory: ManagedUser[] }) {
  const [date, setDate] = useState(localDate);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");

  const students = useMemo(() => studentDirectory
    .filter((u) => u.role === "student")
    .sort((a, b) => classRank(courseOf(a)) - classRank(courseOf(b)) ||
      classLabel(a).localeCompare(classLabel(b), undefined, { numeric: true }) ||
      a.name.localeCompare(b.name)), [studentDirectory]);

  const load = useCallback(async (cancelled?: () => boolean) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/attendance", { credentials: "same-origin", cache: "no-store" });
      const result = await response.json() as { attendanceSheets?: AttendanceSheet[]; error?: string };
      if (!response.ok || !Array.isArray(result.attendanceSheets)) throw new Error(result.error || "Unable to load attendance.");
      if (cancelled?.()) return;
      const found = result.attendanceSheets.filter((s) => s.date === date && s.lectureId === DAILY_KEY).at(-1) ?? null;
      const byId = new Map(found?.records.map((r) => [r.studentId, r.status]) ?? []);
      setSheet(found);
      setEntries(students.map((s) => ({ studentId: s.id, studentName: s.name, status: byId.get(s.id) ?? "unmarked" })));
      setDirty(false);
    } catch (error) {
      if (cancelled?.()) return;
      setEntries(students.map((s) => ({ studentId: s.id, studentName: s.name, status: "unmarked" })));
      setMessage(error instanceof Error ? error.message : "Unable to load attendance.");
    } finally {
      if (!cancelled?.()) setLoading(false);
    }
  }, [date, students]);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => { cancelled = true; };
  }, [load]);

  function changeDate(next: string) {
    if (dirty && !window.confirm("Discard unsaved attendance changes?")) return;
    setDate(next);
  }
  function setOne(id: string, status: Mark) {
    setEntries((prev) => prev.map((r) => r.studentId === id ? { ...r, status } : r));
    setDirty(true);
    setMessage("");
  }
  function setAll(status: AttendanceStatus) {
    if (!students.length) return;
    setEntries(students.map((s) => ({ studentId: s.id, studentName: s.name, status })));
    setDirty(true);
    setMessage("");
  }
  async function save() {
    if (saving || loading || !dirty) return;
    const marked = entries.filter((r) => r.status !== "unmarked")
      .map((r) => ({ studentId: r.studentId, studentName: r.studentName, status: r.status as AttendanceStatus }));
    if (!marked.length) { setMessage("Mark at least one student before saving."); return; }
    setSaving(true);
    setMessage("");
    try {
      const knownIds = new Set(students.map((s) => s.id));
      const preserved = (sheet?.records ?? []).filter((r) => !knownIds.has(r.studentId));
      const records = [...preserved, ...marked];
      const response = await fetch(sheet ? `/api/attendance/${sheet.id}` : "/api/attendance", {
        method: sheet ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheet
          ? { records, subject: "Daily Attendance" }
          : { title: `Daily Student Attendance - ${date}`, date, lectureId: DAILY_KEY, subject: "Daily Attendance", records }),
      });
      const result = await response.json() as { attendanceSheet?: AttendanceSheet; error?: string };
      if (!response.ok || !result.attendanceSheet) throw new Error(result.error || "Save failed.");
      setSheet(result.attendanceSheet);
      setDirty(false);
      setMessage("Daily attendance saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save attendance.");
    } finally { setSaving(false); }
  }

  const query = search.trim().toLowerCase();
  const visible = students.filter((s) => !query || [s.name, s.id, courseOf(s), s.batchName ?? ""].some((v) => v.toLowerCase().includes(query)));
  const entryById = new Map(entries.map((r) => [r.studentId, r.status]));
  const groups = new Map<string, ManagedUser[]>();
  for (const s of visible) {
    const label = classLabel(s);
    const list = groups.get(label) ?? [];
    list.push(s);
    groups.set(label, list);
  }
  const present = entries.filter((r) => r.status === "present").length;
  const absent = entries.filter((r) => r.status === "absent").length;
  const late = entries.filter((r) => r.status === "late").length;
  const leave = entries.filter((r) => r.status === "excused").length;
  return (
    <section className="space-y-5">
      <div className="surface rounded-[2rem] p-5 sm:p-6">
        <p className="section-label">Attendance Management</p>
        <h2 className="mt-1 text-2xl font-bold text-[var(--color-heading)]">Student Attendance</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">One attendance entry per student, per day. All classes listed in ascending order.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {([ ["Total", students.length, "#4F46E5"], ["Present", present, "#059669"], ["Absent", absent, "#EF4444"], ["Late", late, "#D97706"], ["On Leave", leave, "#2563EB"] ] as const).map(([label, value, color]) => (
          <div key={label} className="surface rounded-2xl p-4"><div className="text-2xl font-black" style={{color}}>{value}</div><div className="text-xs font-semibold text-[var(--color-muted)]">{label}</div></div>
        ))}
      </div>
      <div className="surface overflow-hidden rounded-[2rem]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <strong className="text-sm text-[var(--color-heading)]">Attendance for {date}</strong>
            <input type="date" value={date} onChange={(e) => changeDate(e.target.value)} className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-800" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={loading || saving || !students.length} onClick={() => setAll("present")} className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 disabled:opacity-50">All Present</button>
            <button type="button" disabled={loading || saving || !students.length} onClick={() => setAll("absent")} className="rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-600 disabled:opacity-50">All Absent</button>
            <button type="button" disabled={loading || saving || !dirty} onClick={() => void save()} className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Attendance"}</button>
          </div>
        </div>
        <div className="border-b border-[var(--color-border)] p-4">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student name, ID, class or batch" className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-slate-800 sm:max-w-md" />
        </div>
        {message && <p role="status" className="border-b border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-heading)]">{message}</p>}
        {loading ? <p className="p-8 text-sm text-[var(--color-muted)]">Loading daily attendance...</p> : groups.size === 0 ? <p className="p-8 text-sm text-[var(--color-muted)]">No student accounts available for this dashboard.</p> : Array.from(groups.entries()).map(([label, members]) => (
          <div key={label}>
            <div className="bg-[#EEF2FF] px-5 py-3 text-sm font-black text-[#3730A3]">{label} <span className="ml-2 text-xs font-medium">({members.length} students)</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm">
              <thead><tr className="bg-slate-50 text-slate-500"><th className="px-5 py-3">Student Name</th><th className="px-5 py-3">Class / Course</th><th className="px-5 py-3">Batch</th><th className="px-5 py-3">Status</th></tr></thead>
              <tbody>{members.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3"><span className="font-semibold text-slate-800">{s.name}</span><span className="block text-xs text-slate-500">{s.id}</span></td>
                  <td className="px-5 py-3 text-slate-700">{courseOf(s)}</td>
                  <td className="px-5 py-3 text-slate-600">{s.batchName || "Unassigned"}</td>
                  <td className="px-5 py-3"><select disabled={saving} value={entryById.get(s.id) ?? "unmarked"} onChange={(e) => setOne(s.id, e.target.value as Mark)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">{OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
        ))}
        <p className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">{visible.length} students shown. {entries.filter((r) => r.status === "unmarked").length} unmarked. Save attendance to record changes.</p>
      </div>
    </section>
  );
}
