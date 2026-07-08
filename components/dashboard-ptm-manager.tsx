"use client";

import { useState } from "react";
import { Calendar, Plus, Users, CheckCircle, Clock, ListChecks } from "lucide-react";

import type { Role, SessionUser } from "@/lib/types";

type DashboardPtmManagerProps = {
  session: SessionUser | null;
  role: Role;
};

export function DashboardPtmManager({ session, role }: DashboardPtmManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isFaculty = role === "educator" || role === "admin";

  const stats = [
    {
      label: "Total Sessions",
      value: 0,
      icon: <Calendar size={20} />,
      accent: "#0D9488",
    },
    {
      label: "Upcoming",
      value: 0,
      icon: <Clock size={20} />,
      accent: "#3B82F6",
    },
    {
      label: "Slots Booked",
      value: 0,
      icon: <Users size={20} />,
      accent: "#10B981",
    },
    {
      label: isFaculty ? "Scheduled" : "My Slots",
      value: 0,
      icon: <ListChecks size={20} />,
      accent: "#8B5CF6",
    },
    {
      label: "Completed",
      value: 0,
      icon: <CheckCircle size={20} />,
      accent: "#F59E0B",
    },
  ];

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <p className="section-label">Communication</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            Parent-Teacher Meetings
          </h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {isFaculty
              ? "Schedule PTM sessions, manage slots, and notify parents"
              : "View and book slots for upcoming PTM sessions"}
          </p>
        </div>
        {isFaculty && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="btn-action btn-md font-bold"
          >
            <Plus size={16} className="mr-2" />New PTM Session
          </button>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="ptm-stat">
            <div className="ptm-stat-icon" style={{ background: `${stat.accent}14`, color: stat.accent }}>
              {stat.icon}
            </div>
            <div className="ptm-stat-body">
              <div className="ptm-stat-val">{stat.value}</div>
              <div className="ptm-stat-lbl">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="text-center py-16 surface-soft rounded-[1.75rem]">
        <div
          className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mx-auto mb-4"
          style={{ background: "#F0FDFA", color: "#5EEAD4" }}
        >
          <Calendar size={32} />
        </div>
        <h5 className="text-lg font-bold mb-2 text-[var(--color-heading)]">No PTM sessions yet</h5>
        <p className="text-sm text-[var(--color-muted)] mb-6 max-w-md mx-auto">
          {isFaculty
            ? "Schedule parent-teacher meetings to strengthen communication and track student progress"
            : "No PTM sessions have been scheduled yet. Check back later."}
        </p>
        {isFaculty && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="btn-action btn-md font-bold"
          >
            <Plus size={16} className="mr-2" />Schedule First PTM
          </button>
        )}
      </div>

      {/* ── Embedded Styles ── */}
      <style>{`
        .ptm-stat {
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ptm-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ptm-stat-body {
          flex: 1;
          min-width: 0;
        }
        .ptm-stat-val {
          font-size: 22px;
          font-weight: 800;
          color: var(--color-heading);
          line-height: 1.2;
        }
        .ptm-stat-lbl {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 1px;
        }
        @keyframes ptm-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .6; transform: scale(1.3); }
        }
      `}</style>
    </section>
  );
}
