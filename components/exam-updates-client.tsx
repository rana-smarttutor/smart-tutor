"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type {
  ExamUpdate,
  ExamUpdateType,
} from "@/lib/exam-updates";

type Source = {
  key: string;
  name: string;
  url: string;
};

type Props = {
  updates: ExamUpdate[];
  sources: Source[];
  checkedAt: string;
};

const UPDATE_TYPES: Array<"All" | ExamUpdateType> = [
  "All",
  "Notification",
  "Application",
  "Admit Card",
  "Exam Date",
  "Answer Key",
  "Result",
  "Recruitment",
];

function getButtonLabel(type: ExamUpdateType) {
  switch (type) {
    case "Result":
      return "Check Official Result";

    case "Admit Card":
      return "View Admit Card";

    case "Answer Key":
      return "View Answer Key";

    case "Application":
      return "Apply Officially";

    case "Exam Date":
      return "View Schedule";

    case "Recruitment":
      return "View Recruitment";

    default:
      return "View Official Notice";
  }
}

function getTypeIcon(type: ExamUpdateType) {
  switch (type) {
    case "Result":
      return CheckCircle2;

    case "Admit Card":
      return GraduationCap;

    case "Answer Key":
      return FileCheck2;

    case "Application":
    case "Recruitment":
      return FileText;

    default:
      return BellRing;
  }
}

function getTypeClasses(type: ExamUpdateType) {
  switch (type) {
    case "Result":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "Admit Card":
      return "bg-violet-50 text-violet-700 border-violet-100";

    case "Answer Key":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "Application":
      return "bg-cyan-50 text-cyan-700 border-cyan-100";

    case "Recruitment":
      return "bg-orange-50 text-orange-700 border-orange-100";

    case "Exam Date":
      return "bg-pink-50 text-pink-700 border-pink-100";

    default:
      return "bg-blue-50 text-blue-700 border-blue-100";
  }
}

export function ExamUpdatesClient({
  updates,
  sources,
  checkedAt,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState("All");
  const [activeType, setActiveType] =
    useState<"All" | ExamUpdateType>("All");

  const filteredUpdates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return updates.filter((update) => {
      const matchesSearch =
        !normalizedQuery ||
        update.title.toLowerCase().includes(normalizedQuery) ||
        update.source.toLowerCase().includes(normalizedQuery) ||
        update.category.toLowerCase().includes(normalizedQuery) ||
        update.type.toLowerCase().includes(normalizedQuery);

      const matchesSource =
        activeSource === "All" ||
        update.source === activeSource;

      const matchesType =
        activeType === "All" ||
        update.type === activeType;

      return matchesSearch && matchesSource && matchesType;
    });
  }, [updates, query, activeSource, activeType]);

  const resultCount = updates.filter(
    (item) => item.type === "Result",
  ).length;

  const applicationCount = updates.filter(
    (item) =>
      item.type === "Application" ||
      item.type === "Recruitment",
  ).length;

  const admitCardCount = updates.filter(
    (item) => item.type === "Admit Card",
  ).length;

  return (
    <section className="relative z-10 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SUMMARY STATS */}
        <div className="-mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Updates"
            value={updates.length}
            icon={BellRing}
          />

          <StatCard
            label="Applications"
            value={applicationCount}
            icon={FileText}
          />

          <StatCard
            label="Admit Cards"
            value={admitCardCount}
            icon={GraduationCap}
          />

          <StatCard
            label="Results"
            value={resultCount}
            icon={CheckCircle2}
          />
        </div>

        {/* FILTER PANEL */}
        <div className="mt-6 rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_60px_rgba(15,35,80,0.08)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search SSC, UPSC, NEET, CUET, result, admit card..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-[#f8faff] pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Checked {checkedAt}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <FilterGroup label="Exam Authority">
              {["All", ...sources.map((source) => source.name)].map(
                (source) => (
                  <FilterButton
                    key={source}
                    active={activeSource === source}
                    onClick={() => setActiveSource(source)}
                  >
                    {source}
                  </FilterButton>
                ),
              )}
            </FilterGroup>

            <FilterGroup label="Update Type">
              {UPDATE_TYPES.map((type) => (
                <FilterButton
                  key={type}
                  active={activeType === type}
                  onClick={() => setActiveType(type)}
                  dark
                >
                  {type}
                </FilterButton>
              ))}
            </FilterGroup>
          </div>
        </div>

        {/* SECTION TITLE */}
        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              <Sparkles className="h-4 w-4" />
              Latest Updates
            </div>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Official Exam Notices
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Latest verified links from official examination
              authorities.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
            {filteredUpdates.length}
            <span className="ml-1.5 font-semibold text-slate-400">
              updates
            </span>
          </div>
        </div>

        {/* UPDATE CARDS */}
        {filteredUpdates.length > 0 ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {filteredUpdates.map((update, index) => {
              const TypeIcon = getTypeIcon(update.type);

              return (
                <article
                  key={update.id}
                  className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,35,80,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_20px_50px_rgba(30,91,255,0.12)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#eaf2ff] px-3 py-1 text-[11px] font-black text-[#1456c9]">
                          {update.source}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${getTypeClasses(
                            update.type,
                          )}`}
                        >
                          <TypeIcon className="h-3.5 w-3.5" />
                          {update.type}
                        </span>
                      </div>

                      {index < 3 && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-600">
                          New
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 line-clamp-3 text-[18px] font-black leading-[1.35] tracking-[-0.01em] text-slate-950 transition-colors group-hover:text-blue-700 sm:text-[20px]">
                      {update.title}
                    </h3>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {update.source} official website
                      </div>

                      {update.publishedLabel && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                          {update.publishedLabel}
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <a
                        href={update.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1557e8] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition-all hover:bg-[#0e49cb] hover:shadow-blue-600/25"
                      >
                        {getButtonLabel(update.type)}

                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <Search className="h-6 w-6 text-blue-600" />
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900">
              No matching updates found
            </h3>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Try changing the authority, update type or search
              term.
            </p>
          </div>
        )}

        {/* TRUST PANEL */}
        <div className="mt-14 overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-r from-[#eef5ff] to-[#f7fbff] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-950">
                  You always leave through the official website.
                </h3>

                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                  SmartIQ Institute organises exam information for
                  convenience. Applications, notifications, admit
                  cards, answer keys and results open directly on
                  the respective official authority website.
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm">
              ✓ Official Sources
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  dark = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-xs font-black transition-all ${
        active
          ? dark
            ? "bg-slate-950 text-white shadow-md"
            : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="group rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_35px_rgba(15,35,80,0.08)] transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 transition group-hover:bg-blue-600">
          <Icon className="h-5 w-5 text-blue-600 transition group-hover:text-white" />
        </div>

        <div>
          <p className="text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          <p className="text-xs font-bold text-slate-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}