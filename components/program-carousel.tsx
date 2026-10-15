"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Program {
  category: string;
  title: string;
  duration: string;
  description: string;
  focus: string[];
  targetTab: string;
}

interface ProgramCarouselProps {
  programs: Program[];
}

const HOME_PROGRAMS: Program[] = [
  {
    category: "School Foundation",
    title: "Class 6 to 8 Foundation",
    duration: "Academic Year",
    description:
      "Build strong subject clarity, study habits, and confidence across core school subjects.",
    focus: ["Maths", "Science"],
    targetTab: "Class 6-8",
  },
  {
    category: "Board Preparation",
    title: "Class 9 to 10 Success",
    duration: "Year-Round",
    description:
      "Focused board preparation with concept clarity, revision plans, tests, and expert guidance.",
    focus: ["Board Revision", "Concept Clarity"],
    targetTab: "Class 9-10",
  },
  {
    category: "Senior Secondary",
    title: "Class 11 to 12 Academic Excellence",
    duration: "Semester-Based",
    description:
      "Structured support for Science, Commerce, and Arts streams with board-focused preparation.",
    focus: ["Science", "Commerce & Arts"],
    targetTab: "Class 11-12",
  },
  {
    category: "Entrance Exams",
    title: "COMPETITIVE EXAMS",
    duration: "Batch-Based",
    description: "JEE, NEET, CET, CUET, CLAT, IPMAT, CA Foundation.",
    focus: ["JEE / NEET", "CET / CUET", "CA / CS / CMA"],
    targetTab: "Class 11-12",
  },
  {
    category: "Competitive Exams",
    title: "Government Exam Preparation",
    duration: "Long-Term",
    description:
      "Complete preparation for UPSC, SSC, Banking, Railway, Police, NDA, CDS, and Defence exams.",
    focus: ["UPSC / SSC", "Banking / Defence"],
    targetTab: "Govt Exams",
  },
  {
    category: "Career Skills",
    title: "Skill Development Programs",
    duration: "Career-Ready",
    description:
      "Learn coding, AI, digital marketing, communication, finance, and professional career skills.",
    focus: ["Coding & AI", "Digital Skills"],
    targetTab: "Skills",
  },
];

const DOT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-indigo-500",
];

const BORDER_COLORS = [
  "hover:border-blue-500",
  "hover:border-purple-500",
  "hover:border-emerald-500",
  "hover:border-orange-500",
  "hover:border-rose-500",
  "hover:border-indigo-500",
];

const BUTTON_COLORS = [
  "bg-blue-600 hover:bg-blue-700",
  "bg-purple-600 hover:bg-purple-700",
  "bg-emerald-600 hover:bg-emerald-700",
  "bg-orange-600 hover:bg-orange-700",
  "bg-rose-600 hover:bg-rose-700",
  "bg-indigo-600 hover:bg-indigo-700",
];

export function ProgramCarousel({ programs }: ProgramCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Preserve the existing homepage program selection.
  const visiblePrograms = HOME_PROGRAMS.length > 0 ? HOME_PROGRAMS : programs;

  function updateScrollState() {
    const container = scrollRef.current;

    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }

  useEffect(() => {
    const container = scrollRef.current;

    if (!container) return;

    const frame = requestAnimationFrame(updateScrollState);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScrollState)
        : null;

    observer?.observe(container);

    window.addEventListener("resize", updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  function scroll(direction: "left" | "right") {
    const container = scrollRef.current;

    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>(
      "[data-program-card]",
    );

    const cardWidth = firstCard?.getBoundingClientRect().width ?? 240;

    const containerStyles = getComputedStyle(container);
    const gap = parseFloat(containerStyles.columnGap) || 16;

    const distance = cardWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  }

  return (
    <div className="group relative w-full min-w-0 max-w-full">
      {/* DESKTOP LEFT ARROW */}

      <button
        type="button"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Previous programs"
        className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-900 shadow-lg transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30 lg:flex"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>

      {/* DESKTOP RIGHT ARROW */}

      <button
        type="button"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Next programs"
        className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-900 shadow-lg transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30 lg:flex"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>

      {/* PROGRAM CAROUSEL */}

      <div
        ref={scrollRef}
        role="region"
        aria-label="SmartIQ programs"
        tabIndex={0}
        onScroll={updateScrollState}
        className="no-scrollbar flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 pb-5 pt-2 scroll-smooth sm:gap-4 sm:px-2 sm:pb-8"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {visiblePrograms.map((program, index) => {
          const dotColor = DOT_COLORS[index % DOT_COLORS.length];

          const borderHover = BORDER_COLORS[index % BORDER_COLORS.length];

          const buttonColor = BUTTON_COLORS[index % BUTTON_COLORS.length];

          return (
            <div
              key={`${program.title}-${index}`}
              data-program-card
              className="w-[min(82vw,300px)] min-w-0 shrink-0 snap-start sm:w-[240px]"
            >
              <article
                className={`surface group/card relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5 ${borderHover}`}
              >
                {/* DURATION */}

                <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 sm:text-[9px]">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
                    />
                    <span className="break-words">{program.duration}</span>
                  </span>

                  <span className="shrink-0 text-[11px] font-bold text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* CATEGORY */}

                <p className="mb-2 break-words text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-[9px]">
                  {program.category}
                </p>

                {/* TITLE */}

                <h3 className="mb-3 min-h-[40px] break-words text-[16px] font-extrabold leading-snug text-slate-900 sm:text-sm">
                  {program.title}
                </h3>

                {/* DESCRIPTION */}

                <p className="mb-4 flex-grow text-[13px] font-medium leading-6 text-slate-600 sm:text-[12px] sm:leading-5">
                  {program.description}
                </p>

                {/* FOCUS TAGS */}

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {program.focus.map((focus) => (
                    <span
                      key={focus}
                      className="max-w-full break-words rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                    >
                      {focus}
                    </span>
                  ))}
                </div>

                {/* VIEW COURSES */}

                <Link
                  href={`/courses?tab=${encodeURIComponent(program.targetTab)}`}
                  className={`mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-wide text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 ${buttonColor}`}
                >
                  View Courses
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    strokeWidth={2.5}
                  />
                </Link>
              </article>
            </div>
          );
        })}
      </div>

      {/* MOBILE / TABLET NAVIGATION */}

      <div className="mt-2 flex items-center justify-between gap-3 px-1 lg:hidden">
        <p className="text-[11px] font-semibold text-slate-500">
          Swipe to explore programs
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous programs"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={19} />
          </button>

          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Next programs"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
