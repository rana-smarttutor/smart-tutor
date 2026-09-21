"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ElementType } from "react";

import {
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  Landmark,
  ListFilter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import type {
  ExamCategory,
  ExamUpdate,
  ExamUpdateType,
} from "@/lib/exam-updates";

type Source = {
  key: string;
  name: string;
  url: string;
  category?: ExamCategory;
};

type Props = {
  updates: ExamUpdate[];
  sources: Source[];
  checkedAt: string;
};

type CategoryFilter = "All" | ExamCategory;

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

const CATEGORY_CARDS: Array<{
  name: ExamCategory;
  title: string;
  examples: string;
  description: string;
  icon: ElementType;
}> = [
  {
    name: "Board Exams",
    title: "Board Exams",
    examples: "CBSE, CISCE, Maharashtra Board",
    description:
      "Timetables, circulars, admit cards, results and official board notices.",
    icon: GraduationCap,
  },
  {
    name: "Government Exams",
    title: "Government Exams",
    examples: "UPSC, SSC, IBPS, MPSC",
    description:
      "Civil services, banking, state exams and government recruitment updates.",
    icon: Landmark,
  },
  {
    name: "Competitive Exams",
    title: "Competitive Exams",
    examples: "JEE, NEET, CUET, MHT-CET",
    description:
      "Entrance exam registrations, schedules, answer keys and results.",
    icon: Target,
  },
];

const QUICK_ACCESS: Array<{
  label: string;
  type: ExamUpdateType;
  icon: ElementType;
}> = [
  {
    label: "Latest Notifications",
    type: "Notification",
    icon: BellRing,
  },
  {
    label: "Admit Cards",
    type: "Admit Card",
    icon: GraduationCap,
  },
  {
    label: "Results",
    type: "Result",
    icon: Trophy,
  },
  {
    label: "Exam Dates",
    type: "Exam Date",
    icon: CalendarDays,
  },
  {
    label: "Answer Keys",
    type: "Answer Key",
    icon: FileCheck2,
  },
  {
    label: "Applications",
    type: "Application",
    icon: FileText,
  },
  {
    label: "Recruitment",
    type: "Recruitment",
    icon: Landmark,
  },
];

function scrollToSection(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 50);
}

function getTypeIcon(type: ExamUpdateType) {
  switch (type) {
    case "Result":
      return CheckCircle2;

    case "Admit Card":
      return GraduationCap;

    case "Answer Key":
      return FileCheck2;

    case "Exam Date":
      return CalendarDays;

    case "Application":
    case "Recruitment":
      return FileText;

    default:
      return BellRing;
  }
}

function getButtonLabel(type: ExamUpdateType) {
  switch (type) {
    case "Result":
      return "View Result";

    case "Admit Card":
      return "View Admit Card";

    case "Answer Key":
      return "View Answer Key";

    case "Application":
      return "Apply Now";

    case "Exam Date":
      return "View Schedule";

    case "Recruitment":
      return "View Recruitment";

    default:
      return "View Notice";
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

    case "Exam Date":
      return "bg-pink-50 text-pink-700 border-pink-100";

    case "Recruitment":
      return "bg-orange-50 text-orange-700 border-orange-100";

    default:
      return "bg-blue-50 text-blue-700 border-blue-100";
  }
}

export function ExamUpdatesClient({ updates, sources, checkedAt }: Props) {
  const [query, setQuery] = useState("");

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const [activeSource, setActiveSource] = useState("All");

  const [activeType, setActiveType] = useState<"All" | ExamUpdateType>("All");

  const filteredUpdates = useMemo(() => {
    const search = query.trim().toLowerCase();

    return updates.filter((update) => {
      const matchesSearch =
        !search ||
        update.title.toLowerCase().includes(search) ||
        update.source.toLowerCase().includes(search) ||
        update.category.toLowerCase().includes(search) ||
        update.type.toLowerCase().includes(search);

      const matchesCategory =
        activeCategory === "All" || update.category === activeCategory;

      const matchesSource =
        activeSource === "All" || update.source === activeSource;

      const matchesType = activeType === "All" || update.type === activeType;

      return matchesSearch && matchesCategory && matchesSource && matchesType;
    });
  }, [updates, query, activeCategory, activeSource, activeType]);

  const counts = useMemo(
    () => ({
      "Board Exams": updates.filter((item) => item.category === "Board Exams")
        .length,

      "Government Exams": updates.filter(
        (item) => item.category === "Government Exams",
      ).length,

      "Competitive Exams": updates.filter(
        (item) => item.category === "Competitive Exams",
      ).length,
    }),
    [updates],
  );

  const tickerUpdates = updates.slice(0, 4);

  const featuredUpdate = filteredUpdates[0] ?? updates[0];

  const importantUpdates = updates
    .filter((item) => item.publishedLabel)
    .slice(0, 5);

  function selectCategory(category: ExamCategory) {
    setActiveCategory(category);
    setActiveSource("All");
    setActiveType("All");
    setQuery("");

    scrollToSection("latest-exam-updates");
  }

  function selectQuickAccess(type: ExamUpdateType) {
    setActiveType(type);
    setActiveCategory("All");
    setActiveSource("All");
    setQuery("");

    scrollToSection("latest-exam-updates");
  }

  function clearFilters() {
    setQuery("");
    setActiveCategory("All");
    setActiveSource("All");
    setActiveType("All");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <style>{`
      @keyframes exam-news-scroll {
        from {
          transform: translateX(0);
        }

        to {
          transform: translateX(-50%);
        }
      }

      .exam-news-ticker {
        animation: exam-news-scroll 40s linear infinite;
        will-change: transform;
      }

      .exam-news-ticker:hover {
        animation-play-state: paused;
      }

      @media (prefers-reduced-motion: reduce) {
        .exam-news-ticker {
          animation-duration: 80s;
        }
      }
    `}</style>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            TOP DASHBOARD
        ================================================== */}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {/* HERO */}
            <section className="relative min-h-[260px] overflow-hidden rounded-[22px] border border-blue-100 bg-gradient-to-br from-[#edf4ff] via-[#f8fbff] to-[#e6f0ff] p-6 shadow-sm sm:p-7">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

              <div className="relative grid h-full items-center gap-6 lg:grid-cols-[1.05fr_.75fr]">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    SmartIQ Exam Centre
                  </div>

                  <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#102447] sm:text-4xl">
                    Exam Updates
                  </h1>

                  <p className="mt-1.5 text-sm font-black text-blue-600">
                    Stay Ahead. Stay Updated.
                  </p>

                  <p className="mt-3 max-w-[520px] text-xs font-medium leading-5 text-slate-600 sm:text-sm">
                    Get the latest official exam dates, applications, admit
                    cards, results, answer keys and notifications â€” all
                    organised in one place.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => scrollToSection("latest-exam-updates")}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
                    >
                      Explore Updates
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToSection("exam-categories")}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                    >
                      Browse Exams
                      <ListFilter className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-4 text-[10px] font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Official sources only
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                      Checked {checkedAt}
                    </span>
                  </div>
                </div>

                {/* COMPACT CALENDAR VISUAL */}
                <div className="hidden items-center justify-center lg:flex">
                  <div className="relative h-[190px] w-[240px]">
                    <div className="absolute bottom-5 left-1/2 h-24 w-52 -translate-x-1/2 rounded-full bg-blue-400/20 blur-2xl" />

                    <div className="absolute left-6 top-4 rotate-[-5deg] rounded-[20px] border-[5px] border-blue-700 bg-white p-4 shadow-xl">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="h-3 w-20 rounded-full bg-blue-600" />
                        <CalendarDays className="h-5 w-5 text-blue-500" />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({
                          length: 12,
                        }).map((_, index) => (
                          <span
                            key={index}
                            className={`h-6 w-7 rounded-md ${
                              index === 5 || index === 10
                                ? "bg-blue-500"
                                : "bg-blue-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-0 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                      <BellRing className="h-6 w-6" />
                    </div>

                    <div className="absolute bottom-6 right-0 flex h-14 w-20 items-center justify-center rounded-xl bg-[#173a78] text-white shadow-lg">
                      <BookOpen className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* LIVE UPDATES TICKER */}
            <section className="mt-3 flex min-h-[44px] items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* FIXED LABEL */}
              <div className="relative z-10 flex min-h-[44px] shrink-0 items-center gap-2.5 bg-red-600 px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[4px_0_14px_rgba(220,38,38,0.12)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </span>

                <span className="whitespace-nowrap">LIVE UPDATES</span>
              </div>

              {/* RUNNING NEWS */}
              <div className="relative min-w-0 flex-1 overflow-hidden">
                {tickerUpdates.length > 0 ? (
                  <div className="exam-news-ticker flex w-max items-center">
                    {[...tickerUpdates, ...tickerUpdates].map(
                      (update, index) => (
                        <a
                          key={`${update.id}-${index}`}
                          href={update.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex shrink-0 items-center gap-4 whitespace-nowrap px-5 py-3 text-[10px] font-bold text-slate-600 transition hover:text-blue-700"
                        >
                          <span>{update.title}</span>

                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                          />
                        </a>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-[10px] font-semibold text-slate-500">
                    Official updates will appear here.
                  </p>
                )}
              </div>
            </section>

            {/* CATEGORIES */}
            <section id="exam-categories" className="mt-7 scroll-mt-28">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">
                Explore Exam Categories
              </p>

              <h2 className="mt-1.5 text-2xl font-black text-slate-950">
                Find updates by exam category
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {CATEGORY_CARDS.map((category) => {
                  const Icon = category.icon;
                  const active = activeCategory === category.name;

                  return (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => selectCategory(category.name)}
                      className={`rounded-[22px] border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        active
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                            active
                              ? "bg-blue-600 text-white"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-600">
                          {counts[category.name]}
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-black text-slate-950">
                        {category.title}
                      </h3>

                      <p className="mt-1.5 text-xs font-bold text-blue-600">
                        {category.examples}
                      </p>

                      <p className="mt-3 min-h-[48px] text-xs font-medium leading-5 text-slate-500">
                        {category.description}
                      </p>

                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-blue-600">
                        View Updates
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ==================================================
              RIGHT SIDEBAR
          ================================================== */}

          <aside className="space-y-4">
            {/* QUICK ACCESS */}
            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-[13px] font-black uppercase tracking-[0.12em] text-slate-900">
                Quick Access
              </h2>

              <div className="mt-3 divide-y divide-slate-100">
                {QUICK_ACCESS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => selectQuickAccess(item.type)}
                      className="group flex w-full items-center justify-between gap-3 py-3.5 text-left"
                    >
                      <span className="flex items-center gap-3.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                          <Icon className="h-[18px] w-[18px]" />
                        </span>

                        <span className="text-[12px] font-bold text-slate-700 transition group-hover:text-blue-700">
                          {item.label}
                        </span>
                      </span>

                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>

        {/* ==================================================
            FEATURED UPDATE + IMPORTANT DATES
            FULL-WIDTH SECTION
        ================================================== */}

        <div className="mt-5 grid w-full gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <FeaturedUpdate update={featuredUpdate} />

          <ImportantDates updates={importantUpdates} />
        </div>

        {/* ==================================================
            LATEST UPDATES TABLE
        ================================================== */}

        <section
          id="latest-exam-updates"
          className="mt-5 scroll-mt-28 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-blue-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  Latest Exam Updates
                </div>

                <h2 className="mt-1.5 text-2xl font-black text-slate-950">
                  Official notices
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Search and filter official examination updates.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative sm:w-[320px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search exams..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
                  />
                </div>

                <select
                  value={activeSource}
                  onChange={(event) => setActiveSource(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="All">All Authorities</option>

                  {sources.map((source) => (
                    <option key={source.key} value={source.name}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {UPDATE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`rounded-full px-4 py-2 text-[11px] font-black transition ${
                    activeType === type
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {type}
                </button>
              ))}

              {(query ||
                activeSource !== "All" ||
                activeType !== "All" ||
                activeCategory !== "All") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-black text-slate-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {filteredUpdates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="bg-[#f8faff] text-left">
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Exam / Update
                    </th>

                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Type
                    </th>

                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Date
                    </th>

                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Authority
                    </th>

                    <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUpdates.map((update, index) => {
                    const Icon = getTypeIcon(update.type);

                    return (
                      <tr key={update.id} className="group hover:bg-blue-50/40">
                        <td className="px-6 py-5">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <Icon className="h-[18px] w-[18px]" />
                            </span>

                            <div>
                              <p className="max-w-[560px] text-xs font-black leading-5 text-slate-800 group-hover:text-blue-700">
                                {update.title}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />

                                <span className="text-[11px] font-semibold text-slate-400">
                                  {update.category}
                                </span>

                                {index < 3 && (
                                  <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                                    NEW
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black ${getTypeClasses(
                              update.type,
                            )}`}
                          >
                            {update.type}
                          </span>
                        </td>

                        <td className="px-4 py-5 text-xs font-semibold text-slate-500">
                          {update.publishedLabel ?? "â€”"}
                        </td>

                        <td className="px-4 py-5 text-xs font-black text-slate-700">
                          {update.source}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <a
                            href={update.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-black text-blue-600 hover:text-blue-800"
                          >
                            {getButtonLabel(update.type)}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Search className="mx-auto h-6 w-6 text-blue-600" />

              <h3 className="mt-3 text-base font-black text-slate-900">
                No matching updates found
              </h3>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Try another category, authority or update type.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-[10px] font-black text-white"
              >
                Show All Updates
              </button>
            </div>
          )}
        </section>

        {/* TRUST */}
        <section className="mt-5 rounded-[20px] border border-blue-100 bg-[#eef5ff] p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-950">
                Verified official exam links
              </h3>

              <p className="mt-1 text-[10px] font-medium leading-4 text-slate-600">
                SmartIQ Institute organises examination information for
                convenience. Applications, notices, admit cards, answer keys and
                results open directly on the relevant official authority
                website.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeaturedUpdate({ update }: { update?: ExamUpdate }) {
  if (!update) {
    return (
      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-blue-600">
          Featured Update
        </p>

        <h3 className="mt-4 text-lg font-black text-slate-900">
          Waiting for official updates
        </h3>
      </section>
    );
  }

  const Icon = getTypeIcon(update.type);

  return (
    <section className="relative min-h-[270px] overflow-hidden rounded-[22px] border border-blue-100 bg-gradient-to-br from-white to-[#edf4ff] p-6 shadow-sm">
      <span className="absolute right-0 top-0 rounded-bl-xl bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white">
        Featured Update
      </span>

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-black text-white">
          {update.source}
        </span>

        <span
          className={`rounded-full border px-3 py-1.5 text-[10px] font-black ${getTypeClasses(
            update.type,
          )}`}
        >
          {update.type}
        </span>
      </div>

      <h3 className="mt-4 max-w-[720px] text-xl font-black leading-7 text-[#102447] sm:text-2xl">
        {update.title}
      </h3>

      <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-bold text-slate-500">
        <span>{update.category}</span>

        {update.publishedLabel && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            {update.publishedLabel}
          </span>
        )}
      </div>

      <a
        href={update.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700"
      >
        {getButtonLabel(update.type)}
        <ExternalLink className="h-4 w-4" />
      </a>
    </section>
  );
}

function ImportantDates({ updates }: { updates: ExamUpdate[] }) {
  return (
    <section className="min-h-[270px] rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <CalendarDays className="h-5 w-5 text-blue-600" />

        <h3 className="text-xs font-black uppercase tracking-[0.12em] text-slate-900">
          Important Dates
        </h3>
      </div>

      {updates.length > 0 ? (
        <div className="mt-5 space-y-4">
          {updates.map((update) => (
            <a
              key={update.id}
              href={update.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3"
            >
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />

              <div className="min-w-0">
                <p className="line-clamp-1 text-[11px] font-black leading-5 text-slate-700 group-hover:text-blue-700">
                  {update.title}
                </p>

                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  {update.source}
                  {" â€¢ "}
                  {update.publishedLabel}
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-xs font-medium text-slate-500">
          Official dates will appear here when available.
        </p>
      )}
    </section>
  );
}
