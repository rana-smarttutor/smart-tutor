"use client";

import { useMemo, useState } from "react";
import type { FeeInvoice, FeeInstallmentPlan, ManagedUser, Role } from "@/lib/types";
import { InvoiceManager } from "@/components/invoice-manager";
import { FeeInstallmentManager } from "./fee-installment-manager";

type Props = {
  role: Role;
  feeInvoices: FeeInvoice[];
  feeInstallmentPlans: FeeInstallmentPlan[];
  studentDirectory: ManagedUser[];
};

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const tabs = [
  { id: "collections", label: "Dues & Collections", icon: "bi-cash-stack" },
  { id: "installments", label: "EMI Installments", icon: "bi-calendar-event" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AdminFeeHub({ role, feeInvoices, feeInstallmentPlans, studentDirectory }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("collections");

  const invoices = useMemo(() => feeInvoices ?? [], [feeInvoices]);
  const plans = useMemo(() => feeInstallmentPlans ?? [], [feeInstallmentPlans]);

  const totalBilled = useMemo(() => invoices.reduce((s, i) => s + i.amount, 0), [invoices]);
  const totalCollected = useMemo(() => invoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0), [invoices]);
  const totalDue = Math.max(totalBilled - totalCollected, 0);
  const unpaidCount = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const activePlans = plans.filter((p) => p.status === "active").length;

  const stats = [
    { label: "Total Billed", value: fmtCurrency(totalBilled), color: "#4F46E5", bg: "bg-indigo-50", icon: "bi-receipt" },
    { label: "Collected", value: fmtCurrency(totalCollected), color: "#059669", bg: "bg-emerald-50", icon: "bi-check-circle" },
    { label: "Outstanding", value: fmtCurrency(totalDue), color: totalDue > 0 ? "#DC2626" : "#059669", bg: totalDue > 0 ? "bg-red-50" : "bg-emerald-50", icon: "bi-currency-rupee" },
    { label: "Active Plans", value: String(activePlans), color: "#7C3AED", bg: "bg-violet-50", icon: "bi-calendar-check" },
  ];

  return (
    <article className="rounded-[2rem] overflow-hidden">
      {/* ── Header ── */}
      <div
        className="p-5 sm:p-6 text-white"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-lg">
                <i className="bi bi-wallet2" />
              </span>
              Smart Billing Hub
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 max-w-lg">
              Unify collections, track dues, and manage installment schedules in one workspace
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/10 text-white">
              <i className="bi bi-cash-stack" /> {invoices.length} Invoices
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/10 text-white">
              <i className="bi bi-calendar-event" /> {plans.length} Plans
            </span>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300">
                <i className="bi bi-exclamation-triangle" /> {overdueCount} Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="bg-white p-4 sm:p-5 border-b border-slate-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`} style={{ color: s.color }}>
                <i className={`bi ${s.icon} text-lg`} />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</div>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white px-4 sm:px-5 pt-3 border-b border-slate-100">
        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl w-fit border border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                activeTab === t.id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <i className={`bi ${t.icon} text-sm`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="bg-white p-4 sm:p-5">
        {activeTab === "collections" && (
          <InvoiceManager
            role={role}
            feeInvoices={feeInvoices}
            studentDirectory={studentDirectory}
          />
        )}
        {activeTab === "installments" && (
          <FeeInstallmentManager
            role={role}
            studentDirectory={studentDirectory}
          />
        )}
      </div>
    </article>
  );
}
