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

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
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
    const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500", "bg-rose-500", "bg-indigo-500"];
    return colors[index % colors.length];
  };

  return (
    <div className="relative group w-full max-w-full overflow-hidden">
      {/* Navigation Buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur dark:bg-slate-800/90 p-4 rounded-full shadow-2xl border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block hover:scale-110 active:scale-95"
        aria-label="Scroll left"
      >
        <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur dark:bg-slate-800/90 p-4 rounded-full shadow-2xl border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block hover:scale-110 active:scale-95"
        aria-label="Scroll right"
      >
        <svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-8 pb-12 pt-4 px-4 no-scrollbar scroll-smooth snap-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {programs.map((program, i) => {
          const colorStyles = getCardColor(i).split(" ");
          const borderColor = colorStyles[0];
          const textColor = colorStyles[1];
          const bgColor = colorStyles[2];
          
          return (
            <div
              key={i}
              className="flex-shrink-0 w-[300px] sm:w-[350px] snap-center first:ml-auto last:mr-auto"
            >
              <article className={`surface h-full rounded-[2.5rem] p-8 hover:shadow-2xl hover:translate-y-[-10px] transition-all duration-500 border-b-8 border-transparent hover:${borderColor} flex flex-col bg-white dark:bg-slate-950 relative overflow-hidden group/card`}>
                <div className={`absolute top-0 right-0 w-24 h-24 ${bgColor} rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover/card:scale-150 duration-700 opacity-50 dark:opacity-20`} />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className={`${bgColor} ${textColor} text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.15em] border border-transparent shadow-sm`}>
                    {program.duration}
                  </span>
                  <div className={`h-10 w-10 rounded-xl ${getBulletColor(i)} flex items-center justify-center text-white text-sm font-black shadow-lg`}>
                    0{i + 1}
                  </div>
                </div>
                
                <p className={`text-[10px] font-black ${textColor} uppercase tracking-[0.25em] mb-3 relative z-10`}>
                  {program.category}
                </p>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-[1.2] min-h-[4rem] flex items-start relative z-10">
                  {program.title}
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-8 line-clamp-4 flex-grow relative z-10">
                  {program.description}
                </p>
                
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 relative z-10">
                  <div className="flex flex-wrap gap-2">
                    {program.focus.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <Link 
                  href="/courses" 
                  className={`mt-8 inline-flex items-center justify-center py-4 px-6 ${getBulletColor(i)} text-white rounded-2xl font-black text-xs hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-blue-500/10 relative z-10 uppercase tracking-widest`}
                >
                  Explore Program
                </Link>
              </article>
            </div>
          );
        })}
      </div>

      {/* Mobile Indicator */}
      <div className="flex justify-center gap-3 mt-2 lg:hidden">
        {programs.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === 0 ? `w-8 ${getBulletColor(i)}` : "w-2 bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}
