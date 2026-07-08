"use client";

import { useRef } from "react";
import Link from "next/link";

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
    description:
      "JEE, NEET, CET, CUET, CLAT, IPMAT, CA Foundation.",
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

export function ProgramCarousel({ programs }: ProgramCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const visiblePrograms =
    HOME_PROGRAMS.length > 0 ? HOME_PROGRAMS : programs;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const { scrollLeft, clientWidth } = scrollRef.current;

    scrollRef.current.scrollTo({
      left:
        direction === "left"
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth,
      behavior: "smooth",
    });
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

  const getButtonColor = (index: number) => {
    const colors = [
      "bg-blue-600 hover:bg-blue-700",
      "bg-purple-600 hover:bg-purple-700",
      "bg-emerald-600 hover:bg-emerald-700",
      "bg-orange-600 hover:bg-orange-700",
      "bg-rose-600 hover:bg-rose-700",
      "bg-indigo-600 hover:bg-indigo-700",
    ];

    return colors[index % colors.length];
  };

  return (
    <div className="group relative w-full max-w-full overflow-hidden">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-100 bg-white/90 p-3 opacity-0 shadow-lg backdrop-blur transition-opacity hover:scale-110 active:scale-95 group-hover:opacity-100 lg:block"
        aria-label="Scroll left"
      >
        <svg
          className="h-4 w-4 text-slate-900"
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
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-100 bg-white/90 p-3 opacity-0 shadow-lg backdrop-blur transition-opacity hover:scale-110 active:scale-95 group-hover:opacity-100 lg:block"
        aria-label="Scroll right"
      >
        <svg
          className="h-4 w-4 text-slate-900"
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
        className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-2 pb-8 pt-2 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {visiblePrograms.map((program, index) => {
          const dotColor = getBulletColor(index);
          const borderHover = getBorderColor(index);
          const buttonColor = getButtonColor(index);

          return (
            <div
              key={program.title}
              className="w-[220px] flex-shrink-0 snap-start sm:w-[240px]"
            >
              <article
                className={`surface group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${borderHover}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${dotColor}`}
                    />
                    {program.duration}
                  </span>

                  <span className="text-[9px] font-bold text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {program.category}
                </p>

                <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                  {program.title}
                </h3>

                <p className="mb-3 line-clamp-3 flex-grow text-[11px] font-medium leading-relaxed text-slate-500">
                  {program.description}
                </p>

                <div className="mb-3 flex flex-wrap gap-1">
                  {program.focus.map((focus) => (
                    <span
                      key={focus}
                      className="rounded-md bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-600"
                    >
                      {focus}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/courses?tab=${encodeURIComponent(program.targetTab)}`}
                  className={`mt-auto inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 ${buttonColor}`}
                >
                  View Courses
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 5l7 7-7 7"
                    />
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