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

  const getCardColor = (index: number) => {
    const colors = [
      "border-blue-500 text-blue-600 bg-blue-50/50",
      "border-purple-500 text-purple-600 bg-purple-50/50",
      "border-emerald-500 text-emerald-600 bg-emerald-50/50",
      "border-orange-500 text-orange-600 bg-orange-50/50",
      "border-rose-500 text-rose-600 bg-rose-50/50",
      "border-indigo-500 text-indigo-600 bg-indigo-50/50",
    ];

    return colors[index % colors.length];
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

  return (
    <div className="group relative w-full max-w-full overflow-hidden">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-100 bg-white/90 p-4 opacity-0 shadow-2xl backdrop-blur transition-opacity hover:scale-110 active:scale-95 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800/90 lg:block"
        aria-label="Scroll left"
      >
        <svg
          className="h-6 w-6 text-slate-900 dark:text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-100 bg-white/90 p-4 opacity-0 shadow-2xl backdrop-blur transition-opacity hover:scale-110 active:scale-95 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800/90 lg:block"
        aria-label="Scroll right"
      >
        <svg
          className="h-6 w-6 text-slate-900 dark:text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x gap-8 overflow-x-auto px-4 pb-12 pt-4 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {visiblePrograms.map((program, index) => {
          const colorStyles = getCardColor(index).split(" ");
          const borderColor = colorStyles[0];
          const textColor = colorStyles[1];
          const bgColor = colorStyles[2];

          return (
            <div
              key={`${program.title}-${index}`}
              className="w-[300px] flex-shrink-0 snap-center first:ml-auto last:mr-auto sm:w-[350px]"
            >
              <article
                className={`surface group/card relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border-b-8 border-transparent bg-white p-8 transition-all duration-500 hover:-translate-y-[10px] hover:shadow-2xl hover:${borderColor} dark:bg-slate-950`}
              >
                <div
                  className={`absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-bl-[5rem] ${bgColor} opacity-50 transition-transform duration-700 group-hover/card:scale-150 dark:opacity-20`}
                />

                <div className="relative z-10 mb-6 flex items-start justify-between">
                  <span
                    className={`${bgColor} ${textColor} rounded-full border border-transparent px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm`}
                  >
                    {program.duration}
                  </span>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${getBulletColor(
                      index,
                    )} text-sm font-black text-white shadow-lg`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                <p
                  className={`relative z-10 mb-3 text-[10px] font-black uppercase tracking-[0.25em] ${textColor}`}
                >
                  {program.category}
                </p>

                <h3 className="relative z-10 mb-4 flex min-h-[4rem] items-start text-2xl font-black leading-[1.2] text-slate-900 dark:text-white">
                  {program.title}
                </h3>

                <p className="relative z-10 mb-8 line-clamp-4 flex-grow text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                  {program.description}
                </p>

                <div className="relative z-10 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {program.focus.slice(0, 3).map((focus) => (
                      <span
                        key={focus}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/courses"
                  className={`relative z-10 mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-4 ${getBulletColor(
                    index,
                  )} text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/10 transition-all hover:scale-[1.03] active:scale-95`}
                >
                  Explore Program
                </Link>
              </article>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-center gap-3 lg:hidden">
        {visiblePrograms.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === 0 ? `w-8 ${getBulletColor(index)}` : "w-2 bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}