"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Search,
  ShieldCheck,
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
      return "View Official Admit Card";

    case "Answer Key":
      return "View Official Answer Key";

    case "Application":
      return "View / Apply Officially";

    case "Exam Date":
      return "View Official Schedule";

    case "Recruitment":
      return "View Official Recruitment";

    default:
      return "View Official Notice";
  }
}

export function ExamUpdatesClient({
  updates,
  sources,
  checkedAt,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState("All");
  const [activeType, setActiveType] = useState<
    "All" | ExamUpdateType
  >("All");

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

  return (
    <section className="pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-8 relative z-10 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search SSC, UPSC, NEET, CUET, banking..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Last checked {checkedAt}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Exam Authority
            </p>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {["All", ...sources.map((source) => source.name)].map(
                (source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setActiveSource(source)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                      activeSource === source
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {source}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Update Type
            </p>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {UPDATE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                    activeType === type
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Latest Updates
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Official Exam Notices
            </h2>
          </div>

          <p className="text-sm font-semibold text-slate-500">
            {filteredUpdates.length} updates
          </p>
        </div>

        {filteredUpdates.length > 0 ? (
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {filteredUpdates.map((update) => (
              <article
                key={update.id}
                className="group flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {update.source}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {update.type}
                  </span>

                  {update.publishedLabel ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {update.publishedLabel}
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-4 text-lg font-black leading-snug text-slate-900 transition-colors group-hover:text-blue-700 sm:text-xl">
                  {update.title}
                </h3>

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Source: {update.source} official website
                </p>

                <div className="mt-auto pt-6">
                  <a
                    href={update.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-700 sm:w-auto"
                  >
                    {getButtonLabel(update.type)}

                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h3 className="text-xl font-black text-slate-900">
              No matching updates found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try another exam authority, update type or search.
            </p>
          </div>
        )}

        <div className="mt-12 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex gap-4">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />

            <div>
              <h3 className="font-black text-emerald-950">
                Official links only
              </h3>

              <p className="mt-1 text-sm font-medium leading-relaxed text-emerald-800">
                Smart IQ Institute collects basic exam update
                information for convenience. Application forms,
                notifications, admit cards and results open directly
                on the respective official authority website.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}