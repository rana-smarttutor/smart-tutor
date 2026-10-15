"use client";

import { useEffect, useMemo, useState } from "react";
import type { LectureItem, ManagedUser } from "@/lib/types";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";

type Action = "checkin" | "checkout" | "complete";

type Props = {
  date: string;
  lectures: LectureItem[];
  teachers: ManagedUser[];
  selectedTeacherId: string;
  onTeacherChange: (id: string) => void;
  onRefresh: () => Promise<void>;
  loading?: boolean;
  canManage?: boolean;
};

function istDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function timeLabel(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function durationLabel(start?: string, end?: string) {
  if (!start || !end) return "—";

  const minutes = Math.max(
    0,
    Math.floor((Date.parse(end) - Date.parse(start)) / 60000),
  );

  if (!Number.isFinite(minutes)) return "—";

  return `${Math.floor(minutes / 60)}h ${String(
    minutes % 60,
  ).padStart(2, "0")}m`;
}

function stateOf(lecture: LectureItem): string {
  if (lecture.status === "completed") return "Completed";
  if (lecture.status === "cancelled") return "Cancelled";
  if (lecture.lectureCheckOutAt) return "Checked Out";
  if (lecture.lectureCheckInAt) return "In Progress";
  return "Scheduled";
}

export function StaffLectureAttendance({
  date,
  lectures,
  teachers,
  selectedTeacherId,
  onTeacherChange,
  onRefresh,
  loading = false,
  canManage = true,
}: Props) {
  const [items, setItems] = useState<LectureItem[]>(lectures);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setItems(lectures);
  }, [lectures]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const visible = useMemo(
    () =>
      items
        .filter(
          (lecture) =>
            istDate(lecture.startsAt) === date &&
            (!selectedTeacherId ||
              lecture.teacherId === selectedTeacherId),
        )
        .sort(
          (a, b) =>
            Date.parse(a.startsAt) - Date.parse(b.startsAt),
        ),
    [items, date, selectedTeacherId],
  );

  async function perform(lecture: LectureItem, action: Action) {
    if (busyId) return;

    if (
      action === "complete" &&
      !window.confirm(`Mark "${lecture.title}" completed?`)
    ) {
      return;
    }

    setBusyId(lecture.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/lectures/${encodeURIComponent(lecture.id)}/attendance`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        lecture?: LectureItem;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.lecture) {
        throw new Error(result.error || "Lecture action failed.");
      }

      const updated = result.lecture;

      setItems((previous) =>
        previous.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      setMessage(result.message || "Lecture updated.");

      try {
        await onRefresh();
      } catch {
        // The successful API response already contains the saved lecture.
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update lecture.",
      );
    } finally {
      setBusyId("");
    }
  }

  const total = visible.length;
  const completed = visible.filter(
    (item) => item.status === "completed",
  ).length;
  const inProgress = visible.filter(
    (item) =>
      item.status === "scheduled" &&
      !!item.lectureCheckInAt &&
      !item.lectureCheckOutAt,
  ).length;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0A193A]">
              Lecture-wise Attendance
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Scheduled by time, with individual lecture check-in,
              check-out and completion.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={loading || !!busyId}
            className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="mt-4 max-w-sm">
          <label className="mb-1 block text-xs font-bold text-slate-600">
            Faculty Filter
          </label>
          <select
            value={selectedTeacherId}
            onChange={(event) => onTeacherChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Teaching Faculty</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
                {teacher.employeeCode ? ` - ${teacher.employeeCode}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["Lectures", total],
            ["In Progress", inProgress],
            ["Completed", completed],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg bg-slate-50 p-3"
            >
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">
          Loading lectures...
        </div>
      ) : !visible.length ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <BookOpen className="mx-auto mb-3" />
          No lectures scheduled for this date and faculty.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((lecture) => {
            const checkedIn = !!lecture.lectureCheckInAt;
            const checkedOut = !!lecture.lectureCheckOutAt;
            const scheduled = lecture.status === "scheduled";
            const isToday = date === istDate(new Date(now).toISOString());
            const earlyLimit = Date.parse(lecture.startsAt) - 15 * 60000;

            const canCheckIn =
              canManage &&
              scheduled &&
              !busyId &&
              !checkedIn &&
              isToday &&
              now >= earlyLimit;

            const canCheckOut =
              canManage &&
              scheduled &&
              !busyId &&
              checkedIn &&
              !checkedOut &&
              isToday;

            const canComplete =
              canManage &&
              scheduled &&
              !busyId &&
              checkedIn &&
              checkedOut;

            return (
              <article
                key={lecture.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#0A193A]">
                      {lecture.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {lecture.subject || "General"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Faculty: {lecture.teacherName || "—"}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {stateOf(lecture)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={14} />
                    {timeLabel(lecture.startsAt)} – {timeLabel(lecture.endsAt)}
                  </span>
                  <span>
                    Actual duration: {durationLabel(
                      lecture.lectureCheckInAt,
                      lecture.lectureCheckOutAt,
                    )}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">
                      Check In: {timeLabel(lecture.lectureCheckInAt)}
                    </p>
                    <button
                      type="button"
                      disabled={!canCheckIn}
                      onClick={() => void perform(lecture, "checkin")}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {busyId === lecture.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                      {checkedIn ? "Checked In" : "Check In"}
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">
                      Check Out: {timeLabel(lecture.lectureCheckOutAt)}
                    </p>
                    <button
                      type="button"
                      disabled={!canCheckOut}
                      onClick={() => void perform(lecture, "checkout")}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      <LogOut size={14} />
                      {checkedOut ? "Checked Out" : "Check Out"}
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">
                      Status: {stateOf(lecture)}
                    </p>
                    <button
                      type="button"
                      disabled={!canComplete}
                      onClick={() => void perform(lecture, "complete")}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      <CheckCircle2 size={14} />
                      {lecture.status === "completed" ? "Completed" : "Mark Completed"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
