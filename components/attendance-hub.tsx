"use client";

import { useState } from "react";
import {
  Clock3,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react";

import { AttendanceManager } from "@/components/attendance-manager";
import { StaffAttendanceManager } from "@/components/staff-attendance-manager";

import type {
  AttendanceSheet,
  ManagedUser,
  Role,
} from "@/lib/types";

type AttendanceHubProps = {
  role: Role;
  attendanceSheets: AttendanceSheet[];
  studentDirectory: ManagedUser[];
  managedUsers: ManagedUser[];
  userId?: string;
  userName?: string;
};

type AttendanceHubTab =
  | "staff"
  | "students";

export function AttendanceHub({
  role,
  attendanceSheets,
  studentDirectory,
  managedUsers,
  userId,
  userName,
}: AttendanceHubProps) {
  const [activeTab, setActiveTab] =
    useState<AttendanceHubTab>("staff");

  const staffTabLabel =
    role === "admin"
      ? "Staff Attendance"
      : "My Attendance";

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#071A45] via-[#0B40A1] to-[#315EDB] p-6 text-white shadow-[0_20px_55px_rgba(11,64,161,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur">
              <UserCheck size={27} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                Attendance Workspace
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Attendance Hub
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                {role === "admin"
                  ? "Manage staff attendance and student attendance from one organised workspace."
                  : "Check in for the day, review your attendance history, and manage student attendance without switching dashboard sections."}
              </p>
            </div>
          </div>

          <div className="inline-flex w-full rounded-2xl border border-white/15 bg-white/10 p-1.5 backdrop-blur sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setActiveTab("staff")
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition sm:min-w-44 ${
                activeTab === "staff"
                  ? "bg-white text-[#0B40A1] shadow-lg"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <Clock3 size={17} />

              {staffTabLabel}
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("students")
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition sm:min-w-44 ${
                activeTab === "students"
                  ? "bg-white text-[#0B40A1] shadow-lg"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <GraduationCap size={18} />

              Student Attendance
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() =>
            setActiveTab("staff")
          }
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === "staff"
              ? "border-blue-300 bg-blue-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-[#0B40A1]">
              <Users size={20} />
            </div>

            <div>
              <p className="text-sm font-black text-slate-900">
                {staffTabLabel}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {role === "admin"
                  ? "Check staff records, times and regularisation requests."
                  : "Check in, check out and review your attendance history."}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab("students")
          }
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === "students"
              ? "border-violet-300 bg-violet-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <GraduationCap size={21} />
            </div>

            <div>
              <p className="text-sm font-black text-slate-900">
                Student Attendance
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Load a date, mark students and save the attendance sheet.
              </p>
            </div>
          </div>
        </button>
      </div>

      {activeTab === "staff" ? (
        <StaffAttendanceManager
          role={role}
          managedUsers={managedUsers}
          userId={userId}
          userName={userName}
          embedded
        />
      ) : (
        <AttendanceManager
          role={role}
          attendanceSheets={
            attendanceSheets
          }
          studentDirectory={
            studentDirectory
          }
          managedUsers={managedUsers}
          userId={userId}
          embedded
        />
      )}
    </section>
  );
}