
"use client";

import {
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Receipt,
  Wallet,
} from "lucide-react";

import type {
  FeeInvoice,
  FeeInstallmentPlan,
  ManagedUser,
  Role,
} from "@/lib/types";

import { InvoiceManager } from "@/components/invoice-manager";
import { FeeInstallmentManager } from "@/components/fee-installment-manager";

type Props = {
  role: Role;
  feeInvoices: FeeInvoice[];
  feeInstallmentPlans: FeeInstallmentPlan[];
  studentDirectory: ManagedUser[];
};

function fmtCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function AdminFeeHub({
  role,
  feeInvoices,
  feeInstallmentPlans,
  studentDirectory,
}: Props) {
  const invoices = feeInvoices ?? [];
  const plans = feeInstallmentPlans ?? [];

  // Invoice totals only to avoid double-counting EMI plans.
  const totalBilled = invoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  );

  const totalCollected = invoices.reduce(
    (sum, invoice) => sum + (invoice.paidAmount ?? 0),
    0,
  );

  const totalDue = invoices.reduce(
    (sum, invoice) =>
      sum +
      Math.max(
        invoice.amount - (invoice.paidAmount ?? 0),
        0,
      ),
    0,
  );

  const overdueCount = invoices.filter(
    (invoice) => invoice.status === "overdue",
  ).length;

  const activePlans = plans.filter(
    (plan) => plan.status === "active",
  ).length;

  const stats = [
    {
      label: "Total Billed",
      value: fmtCurrency(totalBilled),
      color: "#4F46E5",
      bg: "bg-indigo-50",
      icon: Receipt,
    },
    {
      label: "Collected",
      value: fmtCurrency(totalCollected),
      color: "#059669",
      bg: "bg-emerald-50",
      icon: CheckCircle2,
    },
    {
      label: "Outstanding",
      value: fmtCurrency(totalDue),
      color: totalDue > 0 ? "#DC2626" : "#059669",
      bg: totalDue > 0 ? "bg-red-50" : "bg-emerald-50",
      icon: IndianRupee,
    },
    {
      label: "Active EMI Plans",
      value: String(activePlans),
      color: "#7C3AED",
      bg: "bg-violet-50",
      icon: CalendarCheck2,
    },
  ];

  return (
    <article className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <header
        className="p-5 text-white sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                <Wallet size={25} strokeWidth={2.2} />
              </span>

              Smart Billing Hub
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
              Manage invoices, fee collections, outstanding dues
              and EMI installment schedules in one workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-bold text-white">
              <Receipt size={14} strokeWidth={2.3} />
              {invoices.length} Invoices
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-bold text-white">
              <CalendarDays size={14} strokeWidth={2.3} />
              {plans.length} EMI Plans
            </span>

            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-2 text-[11px] font-bold text-red-300">
                <AlertTriangle size={14} strokeWidth={2.3} />
                {overdueCount} Overdue Invoices
              </span>
            )}
          </div>
        </div>
      </header>

      {/* FINANCIAL SUMMARY */}
      <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:border-blue-100 hover:shadow-sm"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}
                  style={{ color: stat.color }}
                >
                  <Icon
                    size={23}
                    strokeWidth={2.2}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>

                  <p
                    className="mt-1 break-words text-lg font-black"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Financial amounts above reflect invoices. EMI plans
          are tracked separately to avoid double-counting fees.
        </p>
      </div>

      {/* SINGLE UNIFIED WORKSPACE */}
      <section className="min-w-0 bg-white p-4 sm:p-5">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">
              Unified Fee Management
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Dues, Collections &amp; EMI Installments
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage student invoices, record fee payments,
              monitor outstanding balances and maintain
              installment schedules in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="#billing-invoices"
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
            >
              <Receipt size={15} strokeWidth={2.3} />
              Invoices
            </a>

            <a
              href="#billing-installments"
              className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
            >
              <CalendarDays size={15} strokeWidth={2.3} />
              EMI Schedules
            </a>
          </div>
        </div>

        <div className="space-y-8">
          {/* INVOICES AND COLLECTIONS */}
          <div
            id="billing-invoices"
            className="min-w-0 scroll-mt-24"
          >
            <InvoiceManager
              role={role}
              feeInvoices={feeInvoices}
              studentDirectory={studentDirectory}
            />
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-violet-700">
              <CalendarCheck2
                size={15}
                strokeWidth={2.3}
              />
              Installment Schedules
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* EMI AND INSTALLMENT MANAGEMENT */}
          <div
            id="billing-installments"
            className="min-w-0 scroll-mt-24"
          >
            <FeeInstallmentManager
              role={role}
              studentDirectory={studentDirectory}
            />
          </div>
        </div>
      </section>
    </article>
  );
}
