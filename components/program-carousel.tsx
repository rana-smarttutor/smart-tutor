"use client";

import React, { useRef } from "react";
import Link from "next/link";

interface Program {
  category: string;
  title: string;
  duration: string;
  description: string;
  focus: string[];
  stage?: string;
  color?: string;
}

interface ProgramCarouselProps {
  programs: Program[];
}

export function ProgramCarousel({ programs }: ProgramCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const visiblePrograms = programs.filter(
    (program) => program.title !== "Class 1 to 5 Foundation",
  );

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo =
        direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const getBulletColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-emerald-500",
      "bg-orange-500",
      "bg-rose-500",
      "bg-indigo-500",
    ];
    return colors[index % colors.length];
  };

  const getBorderColor = (index: number) => {
    const colors = [
      "hover:border-blue-500",
      "hover:border-purple-500",
      "hover:border-emerald-500",
      "hover:border-orange-500",
      "hover:border-rose-500",
      "hover:border-indigo-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="group relative w-full max-w-full overflow-hidden">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-100 bg-white/90 p-3 opacity-0 shadow-lg backdrop-blur transition-opacity hover:scale-110 active:scale-95 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800/90 lg:block"
        aria-label="Scroll left"
      >
        <svg className="h-4 w-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-100 bg-white/90 p-3 opacity-0 shadow-lg backdrop-blur transition-opacity hover:scale-110 active:scale-95 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800/90 lg:block"
        aria-label="Scroll right"
      >
        <svg className="h-4 w-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-2 pb-8 pt-2 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {visiblePrograms.map((program, index) => {
          const dotColor = getBulletColor(index);
          const borderHover = getBorderColor(index);

          return (
            <div
              key={`${program.title}-${index}`}
              className="w-[220px] flex-shrink-0 snap-start sm:w-[240px]"
            >
              <article
                className={`surface group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${borderHover} dark:bg-slate-950 dark:border-slate-800`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                    {program.duration}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                </div>

                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {program.category}
                </p>

                <h3 className="mb-2 text-sm font-bold leading-snug text-slate-900 dark:text-white line-clamp-2">
                  {program.title}
                </h3>

                <p className="mb-3 line-clamp-2 flex-grow text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {program.description}
                </p>

                <div className="mb-3 flex flex-wrap gap-1">
                  {program.focus.slice(0, 2).map((focus) => (
                    <span
                      key={focus}
                      className="rounded-md bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {focus}
                    </span>
                  ))}
                </div>

                <Link
                  href="/courses"
                  className={`mt-auto inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 ${dotColor.replace("bg-", "bg-").replace("500", "600")} text-[9px] font-black uppercase tracking-wider text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95`}
                >
                  View Program
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}
