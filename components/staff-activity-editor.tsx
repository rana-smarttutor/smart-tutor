"use client";

import { useEffect, useState } from "react";
import type { ManagedUser, Role } from "@/lib/types";

type Activity = {
  classTaken: string;
  subjectTopic: string;
  homeworkGiven: string;
  workCompleted: string;
  remarks: string;
};

type Props = {
  role: Role;
  managedUsers: ManagedUser[];
  userId?: string;
};

const blank: Activity = {
  classTaken: "",
  subjectTopic: "",
  homeworkGiven: "",
  workCompleted: "",
  remarks: "",
};

function indiaToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function StaffActivityEditor({ role, managedUsers, userId }: Props) {
  const [date, setDate] = useState("");
  const [selectedId, setSelectedId] = useState(userId ?? "");
  const [values, setValues] = useState<Activity>(blank);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [staffInfo, setStaffInfo] = useState<{
    name?: string;
    employeeCode?: string;
    staffType?: string;
    branch?: string;
    department?: string;
    designation?: string;
  } | null>(null);

  useEffect(() => setDate(indiaToday()), []);

  const staff = managedUsers.filter((item) =>
    ["educator", "staff", "admin", "counsellor"].includes(item.role),
  );
  const selected = staff.find((item) => item.id === selectedId);
  const teaching = (staffInfo?.staffType === "teaching") ||
    (!staffInfo && selected?.role === "educator");

  useEffect(() => {
    if (!selectedId || !date) return;
    const controller = new AbortController();
    setLoading(true);
    setMessage("");
    setValues(blank);
    setHasAttendance(false);
    setStaffInfo(null);
    fetch(
      `/api/staff-attendance/activities?date=${encodeURIComponent(date)}&userId=${encodeURIComponent(selectedId)}`,
      { credentials: "same-origin", cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load activities.");
        setValues({ ...blank, ...payload.activity });
        setStaffInfo(payload.staff ?? null);
        setHasAttendance(Boolean(payload.hasAttendance));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "Unable to load activities.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, selectedId]);

  const setField = (key: keyof Activity, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  async function save() {
    if (!selectedId || !date || !hasAttendance) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/staff-attendance/activities", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, userId: selectedId, ...values }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save activities.");
      setMessage("Activities saved with an audit record.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save activities.");
    } finally {
      setSaving(false);
    }
  }

  const fields: { key: keyof Activity; label: string; placeholder: string }[] = teaching
    ? [
        { key: "classTaken", label: "Batch / class taken", placeholder: "e.g. CAT – Evening batch" },
        { key: "subjectTopic", label: "Subject / topic taught", placeholder: "e.g. Quants – Percentages" },
        { key: "homeworkGiven", label: "Homework given", placeholder: "e.g. Exercise 3, questions 1–20" },
      ]
    : [
        { key: "workCompleted", label: "Work / tasks completed", placeholder: "Describe the work completed today" },
      ];

  if (!["admin", "educator", "staff", "counsellor"].includes(role)) return null;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-widest text-[#0B40A1]">Staff Attendance</p>
        <h3 className="mt-2 text-xl font-black text-slate-900">Daily Teaching / Work Activities</h3>
        <p className="mt-1 text-sm text-slate-500">
          Add activities to an existing attendance record. Changes are saved with an audit history.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {role === "admin" && (
          <label className="text-sm font-bold text-slate-700">
            Employee
            <select className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"
              value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">Select employee</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.employeeCode || "ID pending"}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm font-bold text-slate-700">
          Attendance date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" />
        </label>
      </div>
      {staffInfo && (
        <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
          {staffInfo.name} · {staffInfo.employeeCode || "Employee ID pending"} ·
          {" "}{teaching ? "Teaching" : "Non-Teaching / Administration"} ·
          {" "}{staffInfo.department || "Department not assigned"} ·
          {" "}{staffInfo.branch || "Branch not assigned"}
        </p>
      )}
      {loading && <p className="mt-4 text-sm text-slate-500">Loading activity record…</p>}
      {selectedId && !loading && !hasAttendance && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          No staff attendance record exists for this date. Mark attendance first, then return here.
        </p>
      )}
      {selectedId && hasAttendance && !loading && (
        <div className="mt-5 grid gap-4">
          {fields.map((field) => (
            <label key={field.key} className="text-sm font-bold text-slate-700">
              {field.label}
              <textarea rows={2} maxLength={2000} placeholder={field.placeholder}
                value={values[field.key]} onChange={(event) => setField(field.key, event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-[#0B40A1]" />
            </label>
          ))}
          <label className="text-sm font-bold text-slate-700">
            Remarks
            <textarea rows={2} maxLength={2000} placeholder="Optional attendance / activity remarks"
              value={values.remarks} onChange={(event) => setField("remarks", event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-[#0B40A1]" />
          </label>
          <button type="button" onClick={() => void save()} disabled={saving}
            className="w-fit rounded-xl bg-[#0B40A1] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save Activities"}
          </button>
        </div>
      )}
      {message && <p role="status" className="mt-4 text-sm font-semibold text-slate-700">{message}</p>}
    </section>
  );
}
