"use client";

import { useMemo, useState } from "react";
import type { LectureItem } from "@/lib/types";
import { CalendarDays, Download, BookOpen, CheckCircle2, XCircle, Clock3 } from "lucide-react";

type Props = { lectures: LectureItem[] };
const dayKey = (value: string) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(d); };
const todayKey = () => dayKey(new Date().toISOString());
const fmt = (value?: string) => { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", {timeZone:"Asia/Kolkata",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); };
function escapeCsv(value: unknown) { return '"' + String(value ?? "").replace(/"/g, '""') + '"'; }
export function StaffLectureOverview({lectures}: Props) {
  const [search, setSearch] = useState("");
  const today = todayKey();
  const summary = useMemo(() => ({
    today: lectures.filter(x => dayKey(x.startsAt) === today).length,
    scheduled: lectures.filter(x => x.status === "scheduled").length,
    completed: lectures.filter(x => x.status === "completed").length,
    cancelled: lectures.filter(x => x.status === "cancelled").length,
  }), [lectures, today]);
  const visible = useMemo(() => lectures.filter(x => [x.title,x.subject,x.teacherName].some(v => (v || "").toLowerCase().includes(search.toLowerCase()))).sort((a,b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()), [lectures,search]);
  function exportCsv() {
    const headers = ["Title","Subject","Faculty","Start","End","Status"];
    const rows = visible.map(x => [x.title,x.subject,x.teacherName,x.startsAt,x.endsAt,x.status]);
    const csv = [headers,...rows].map(r=>r.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href=url; a.download="smartiq-lectures.csv"; a.click(); URL.revokeObjectURL(url);
  }
  const cards = [
    {label:"Lectures Today",value:summary.today,icon:CalendarDays},
    {label:"Scheduled",value:summary.scheduled,icon:Clock3},
    {label:"Completed",value:summary.completed,icon:CheckCircle2},
    {label:"Cancelled",value:summary.cancelled,icon:XCircle},
  ];
  return <section className="space-y-5 text-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Academic Management</p><h2 className="mt-1 text-2xl font-extrabold">Lecture Management</h2><p className="mt-1 text-sm text-slate-500">Available lecture records and timetable at a glance.</p></div><button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><Download size={16}/> Export CSV</button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(c=><div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><c.icon className="mb-3 text-blue-600" size={22}/><p className="text-2xl font-extrabold">{c.value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{c.label}</p></div>)}</div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><h3 className="font-bold">Lecture timetable</h3><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search lectures or faculty" className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"/></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Lecture","Faculty","Start","End","Status"].map(h=><th key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visible.map(x=><tr key={x.id}><td className="px-5 py-4"><div className="font-semibold">{x.title}</div><div className="text-xs text-slate-500">{x.subject || "General"}</div></td><td className="px-5 py-4">{x.teacherName || "—"}</td><td className="whitespace-nowrap px-5 py-4">{fmt(x.startsAt)}</td><td className="whitespace-nowrap px-5 py-4">{fmt(x.endsAt)}</td><td className="px-5 py-4 capitalize">{x.status}</td></tr>)}</tbody></table>{!visible.length && <div className="p-10 text-center text-sm text-slate-500"><BookOpen className="mx-auto mb-3"/>No lectures are available to your staff account. Branch-specific access must be configured before additional records can be shown.</div>}</div></div>
  </section>;
}