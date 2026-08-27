"use client";

import React, { useState } from "react";
import type { Role } from "@/lib/types";

type Props = {
  role: Role;
};

type DemoDevice = {
  id: string;
  name: string;
  location: string;
  serialNumber: string;
  webhookToken: string;
  isOnline: boolean;
  autoMarkAttendance: boolean;
  parentSms: boolean;
  staffSms: boolean;
  totalPunches: number;
  mappedStudents: number;
  mappedStaff: number;
  lastSeen?: string;
};

type DemoPunchLog = {
  id: string;
  personName: string;
  personType: "Student" | "Staff";
  biometricId: string;
  deviceName: string;
  punchType: "CheckIn" | "CheckOut";
  inputType: string;
  temperature?: string;
  status: "marked" | "pending" | "skipped";
  punchedAt: string;
};

const DEMO_DEVICES: DemoDevice[] = [
  {
    id: "1",
    name: "Main Gate",
    location: "Ground Floor Entrance",
    serialNumber: "MR110-SUCCESS",
    webhookToken: "adfd2041-21a7-40cc-b5cc-b594fefc40fb",
    isOnline: false,
    autoMarkAttendance: true,
    parentSms: true,
    staffSms: true,
    totalPunches: 21,
    mappedStudents: 6,
    mappedStaff: 1,
    lastSeen: "1 week ago",
  },
];

const DEMO_PUNCHES: DemoPunchLog[] = [
  { id: "p1", personName: "Santu Ram", personType: "Student", biometricId: "119", deviceName: "Main Gate", punchType: "CheckOut", inputType: "Other", status: "marked", punchedAt: "2026-07-06T09:05:39" },
  { id: "p2", personName: "Santu Ram", personType: "Student", biometricId: "119", deviceName: "Main Gate", punchType: "CheckIn", inputType: "Other", status: "marked", punchedAt: "2026-07-06T09:05:38" },
  { id: "p3", personName: "Santu Ram", personType: "Student", biometricId: "119", deviceName: "Main Gate", punchType: "CheckIn", inputType: "Other", status: "marked", punchedAt: "2026-07-05T11:35:38" },
  { id: "p4", personName: "Santu Ram", personType: "Student", biometricId: "119", deviceName: "Main Gate", punchType: "CheckIn", inputType: "Other", status: "marked", punchedAt: "2026-07-04T11:35:38" },
  { id: "p5", personName: "Santu Ram", personType: "Student", biometricId: "119", deviceName: "Main Gate", punchType: "CheckIn", inputType: "Other", status: "marked", punchedAt: "2026-07-03T11:35:38" },
  { id: "p6", personName: "Santu Ram", personType: "Student", biometricId: "119", deviceName: "Main Gate", punchType: "CheckIn", inputType: "Other", status: "marked", punchedAt: "2026-07-02T15:35:38" },
  { id: "p7", personName: "Santu Nlet", personType: "Staff", biometricId: "118", deviceName: "Main Gate", punchType: "CheckOut", inputType: "Other", status: "marked", punchedAt: "2026-06-29T13:23:37" },
  { id: "p8", personName: "Santu Nlet", personType: "Staff", biometricId: "118", deviceName: "Main Gate", punchType: "CheckIn", inputType: "Other", status: "marked", punchedAt: "2026-06-29T13:23:36" },
];

function formatPunchDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return `${day} ${mon} ${time}`;
}

export function BiometricIntegration({ role }: Props) {
  const isAdmin = role === "admin";
  const [showAddModal, setShowAddModal] = useState(false);
  const [devices, setDevices] = useState<DemoDevice[]>(DEMO_DEVICES);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceLocation, setNewDeviceLocation] = useState("");
  const [editDevice, setEditDevice] = useState<DemoDevice | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);

  const totalPunches = devices.reduce((s, d) => s + d.totalPunches, 0);
  const totalMappedStudents = devices.reduce((s, d) => s + d.mappedStudents, 0);
  const totalMappedStaff = devices.reduce((s, d) => s + d.mappedStaff, 0);
  const onlineCount = devices.filter((d) => d.isOnline).length;

  function handleAddDevice() {
    if (!newDeviceName.trim()) return;
    const token = crypto.randomUUID();
    const newDev: DemoDevice = {
      id: String(Date.now()),
      name: newDeviceName.trim(),
      location: newDeviceLocation.trim(),
      serialNumber: "NEW-DEVICE",
      webhookToken: token,
      isOnline: false,
      autoMarkAttendance: true,
      parentSms: true,
      staffSms: true,
      totalPunches: 0,
      mappedStudents: 0,
      mappedStaff: 0,
    };
    setDevices((prev) => [...prev, newDev]);
    setNewDeviceName("");
    setNewDeviceLocation("");
    setShowAddModal(false);
  }

  function handleEditDevice() {
    if (!editDevice || !editName.trim()) return;
    setDevices((prev) =>
      prev.map((d) =>
        d.id === editDevice.id ? { ...d, name: editName.trim(), location: editLocation.trim() } : d
      )
    );
    setEditDevice(null);
  }

  function handleDeleteDevice(id: string) {
    if (!confirm("Delete device and all punch logs?")) return;
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  function handleRegenToken(id: string) {
    if (!confirm("Regenerate auth token? You will need to update the webhook URL in BioCloud.")) return;
    const newToken = crypto.randomUUID();
    setDevices((prev) => prev.map((d) => d.id === id ? { ...d, webhookToken: newToken } : d));
  }

  function copyWebhook(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    });
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <p className="section-label">Settings</p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-heading)]">
            Biometric Integration
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Fingerprint and face-scan based attendance.
          </p>
        </div>
        <div className="surface rounded-[2rem] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF]">
            <svg className="h-8 w-8" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[var(--color-heading)]">Admin Access Required</h3>
          <p className="mt-2 text-sm text-[var(--color-muted)] max-w-md mx-auto">
            Biometric device management is only available to administrators.
            Contact your admin to set up biometric devices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label">Settings</p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-heading)]">
            Biometric Integration
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            BioCloud biometric device integration — automatic attendance from fingerprint / face scan.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] transition-colors">
            Rules
          </button>
          <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] transition-colors">
            Punch Logs
          </button>
          <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] transition-colors">
            Process Pending
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition"
          >
            + Add Device
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {[
          { label: "Total Devices", value: devices.length, color: "#4F46E5", bg: "#EEF2FF", icon: "M9 3v2m6-2v2M9 7h6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { label: "Online Now", value: onlineCount, color: "#10B981", bg: "#ECFDF5", icon: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" },
          { label: "Total Punches", value: totalPunches, color: "#4F46E5", bg: "#EEF2FF", icon: "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3" },
          { label: "Mapped Students", value: totalMappedStudents, color: "#0EA5E9", bg: "#F0F9FF", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
          { label: "Mapped Staff", value: totalMappedStaff, color: "#F59E0B", bg: "#FFFBEB", icon: "M12 4.354a4 4 0 110 7.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
        ].map((s) => (
          <div key={s.label} className="surface rounded-2xl p-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg }}>
              <svg className="h-5 w-5" fill="none" stroke={s.color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
            </div>
            <div>
              <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="surface rounded-[2rem] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF]">
            <svg className="h-5 w-5" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-heading)]">How It Works</h3>
            <p className="text-xs text-[var(--color-muted)]">Real-time biometric attendance workflow</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { step: "01", title: "Biometric Scan", desc: "Student verifies identity using fingerprint or face recognition." },
            { step: "02", title: "Instant Data Push", desc: "BioCloud sends attendance data to your webhook instantly." },
            { step: "03", title: "Student Matching", desc: "User ID is mapped with the corresponding student profile." },
            { step: "04", title: "Attendance & SMS", desc: "Attendance is recorded automatically and parents receive SMS alerts." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <div className="text-2xl font-bold text-[var(--color-primary)]">{s.step}</div>
              <div className="mt-2 text-sm font-semibold text-[var(--color-heading)]">{s.title}</div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Device Cards */}
      <div className="space-y-4">
        {devices.map((device) => {
          const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://smarttutors.co.in";
          const webhookUrl = `${baseUrl}/api/biometric/webhook/${device.webhookToken}`;
          return (
            <div key={device.id} className="surface rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-2xl">
                      🖐️
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-[var(--color-heading)]">{device.name}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        <svg className="inline h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {device.location}
                      </div>
                    </div>
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${device.isOnline ? "bg-[#10B981]" : "bg-[#CBD5E1]"}`}
                      title={device.isOnline ? "Online" : "Offline"}
                    />
                    <span className="text-[11px] text-[var(--color-muted)] font-bold">
                      {device.lastSeen ? `Last seen ${device.lastSeen}` : "Never"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition">
                    Map Students
                  </button>
                  <button className="rounded-xl bg-[#F59E0B] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition">
                    Map Staff
                  </button>
                  <button
                    onClick={() => { setEditDevice(device); setEditName(device.name); setEditLocation(device.location); }}
                    className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRegenToken(device.id)}
                    className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 transition"
                  >
                    Regen Token
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="mt-4 rounded-xl bg-[#F8FAFC] border border-[var(--color-border)] p-3">
                <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">
                  BioCloud Webhook URL (paste in BioCloud dashboard)
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">POST</span>
                  <code className="text-[11px] text-[var(--color-heading)] font-mono break-all">{webhookUrl}</code>
                  <button
                    onClick={() => copyWebhook(webhookUrl)}
                    className="shrink-0 rounded bg-[#334155] px-2 py-0.5 text-[10px] font-bold text-[#94A3B8] hover:text-white transition"
                  >
                    {copiedToken ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Device stats */}
              <div className="mt-3 flex gap-4 flex-wrap text-[12px] text-[var(--color-muted)]">
                <span>
                  <svg className="inline h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3" />
                  </svg>
                  {device.totalPunches} punches
                </span>
                <span>
                  <svg className="inline h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {device.mappedStudents} students mapped
                </span>
                <span>
                  <svg className="inline h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 7.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {device.mappedStaff} staff mapped
                </span>
                {device.autoMarkAttendance && (
                  <span className="text-[#10B981] font-semibold">
                    <svg className="inline h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Auto attendance ON
                  </span>
                )}
                {device.parentSms && (
                  <span className="text-[#0EA5E9] font-semibold">
                    <svg className="inline h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Parent SMS ON
                  </span>
                )}
                {device.staffSms && (
                  <span className="text-[#F59E0B] font-semibold">
                    <svg className="inline h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Staff SMS ON
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {devices.length === 0 && (
          <div className="surface rounded-[2rem] p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F5F9]">
              <svg className="h-7 w-7" fill="none" stroke="#94A3B8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-heading)]">No Devices Connected</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Add a BioCloud biometric device to auto-mark student and staff attendance.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition"
            >
              + Add First Device
            </button>
          </div>
        )}
      </div>

      {/* Live Activity Feed */}
      <div className="surface rounded-[2rem] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-bold text-[var(--color-heading)] flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="#4F46E5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Live Activity Feed
          </h3>
          <button className="text-xs font-bold text-[var(--color-primary)] hover:underline">
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--color-background-strong)]">
                <th className="px-4 py-2.5 font-bold text-[var(--color-muted)]">Time</th>
                <th className="px-4 py-2.5 font-bold text-[var(--color-muted)]">Person</th>
                <th className="px-4 py-2.5 font-bold text-[var(--color-muted)]">Biometric ID</th>
                <th className="px-4 py-2.5 font-bold text-[var(--color-muted)]">Device</th>
                <th className="px-4 py-2.5 font-bold text-[var(--color-muted)]">Type</th>
                <th className="px-4 py-2.5 font-bold text-[var(--color-muted)]">Input</th>
                <th className="px-4 py-2.5 font-bold text-[var(--color-muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_PUNCHES.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background-strong)]/50">
                  <td className="px-4 py-2.5 text-[var(--color-muted)] whitespace-nowrap">
                    {formatPunchDate(p.punchedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-[var(--color-heading)]">{p.personName}</span>
                    <span
                      className={`ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        p.personType === "Student"
                          ? "bg-[#0EA5E9]/10 text-[#0EA5E9]"
                          : "bg-[#F59E0B]/10 text-[#F59E0B]"
                      }`}
                    >
                      {p.personType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] text-[var(--color-heading)]">
                      {p.biometricId}
                    </code>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)]">{p.deviceName}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.punchType === "CheckIn"
                          ? "bg-[#10B981]/10 text-[#10B981]"
                          : "bg-[#0EA5E9]/10 text-[#0EA5E9]"
                      }`}
                    >
                      {p.punchType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)]">{p.inputType}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                      ✓ Marked
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 text-white" style={{ background: "linear-gradient(135deg,#1E1B4B,#4C1D95)" }}>
              <h3 className="text-lg font-extrabold">
                <svg className="inline h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3" />
                </svg>
                Add Biometric Device
              </h3>
              <p className="text-xs text-white/50 mt-1">Connect a BioCloud biometric device to auto-mark attendance</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Device Name *</label>
                <input
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="e.g. Main Gate, Lab Block, Classroom 1"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Location</label>
                <input
                  value={newDeviceLocation}
                  onChange={(e) => setNewDeviceLocation(e.target.value)}
                  placeholder="e.g. Ground Floor Entrance"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div className="rounded-xl bg-[#F0FDF4] border border-[#A7F3D0] p-3 text-xs text-[#065F46]">
                <strong>Setup Steps:</strong><br />
                1. Add this device → copy the webhook URL shown<br />
                2. Log in to BioCloud dashboard → Device → Callback URL → paste the webhook URL<br />
                3. Map your students BioCloud UserIDs to Smart IQ Institute students<br />
                4. Students can now tap in and attendance is auto-marked!
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-1.5 font-bold text-[var(--color-heading)]">
                  <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" />
                  Auto attendance
                </label>
                <label className="flex items-center gap-1.5 font-bold text-[var(--color-heading)]">
                  <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" />
                  Parent SMS
                </label>
                <label className="flex items-center gap-1.5 font-bold text-[var(--color-heading)]">
                  <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" />
                  Staff SMS
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDevice}
                disabled={!newDeviceName.trim()}
                className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-50"
              >
                Add Device
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {editDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setEditDevice(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[var(--color-heading)]">
                <svg className="inline h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Device
              </h3>
              <button onClick={() => setEditDevice(null)} className="text-[var(--color-muted)] hover:text-[var(--color-heading)]">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">Location</label>
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-1.5 font-bold text-[var(--color-heading)]">
                  <input type="checkbox" defaultChecked={editDevice.autoMarkAttendance} className="accent-[var(--color-primary)]" />
                  Auto attendance
                </label>
                <label className="flex items-center gap-1.5 font-bold text-[var(--color-heading)]">
                  <input type="checkbox" defaultChecked={editDevice.parentSms} className="accent-[var(--color-primary)]" />
                  Parent SMS
                </label>
                <label className="flex items-center gap-1.5 font-bold text-[var(--color-heading)]">
                  <input type="checkbox" defaultChecked={editDevice.staffSms} className="accent-[var(--color-primary)]" />
                  Staff SMS
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditDevice(null)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:bg-[var(--color-background-strong)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditDevice}
                className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
