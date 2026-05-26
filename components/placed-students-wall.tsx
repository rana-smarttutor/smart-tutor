"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PlacedStudent } from "@/lib/types";
import { RevealOnScroll } from "./reveal-on-scroll";

interface PlacedStudentsWallProps {
  students: PlacedStudent[];
}

export function PlacedStudentsWall({ students }: PlacedStudentsWallProps) {
  const [filter, setFilter] = useState<string>("all");

  const categories = [
    { label: "All Results", value: "all" },
    { label: "MBA Entrance", value: "MAH MBA CET" },
    { label: "Banking & PO", value: "SBI PO|NABARD" },
    { label: "Govt & SSC", value: "SSC GD" },
    { label: "Law Entrance", value: "CLAT" },
  ];

  const filteredStudents = students.filter((s) => {
    if (filter === "all") return true;
    const filterRegex = new RegExp(filter, "i");
    return filterRegex.test(s.examName || "");
  });

  // Limit display to a reasonable number for the initial view, maybe with a "Load More"
  const [displayCount, setDisplayCount] = useState(12);
  const visibleStudents = filteredStudents.slice(0, displayCount);

  return (
    <section className="py-24 bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <p className="section-label mb-4">Achievements</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">
              Our Wall of Success
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              Celebrating the exceptional performance of our students in competitive examinations. Their success is a testament to our focused mentoring and their dedication.
            </p>
          </div>
        </RevealOnScroll>

        <div className="flex justify-center gap-4 mb-14 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-md hover:scale-105 ${
                filter === cat.value
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {visibleStudents.map((student, index) => (
            <RevealOnScroll key={student.id} delayMs={index % 4 * 100}>
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl hover:translate-y-[-12px] transition-all duration-500 border border-slate-100 dark:border-slate-700 group relative">
                <div className="aspect-[4/5] relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {student.image ? (
                    <Image
                      src={student.image}
                      alt={student.name}
                      fill
                      loading="lazy"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                      <svg
                        className="w-20 h-20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Separate Result Badges - Always Visible */}
                  <div className="absolute top-5 left-5 flex flex-col gap-2 z-10 pointer-events-none">
                    {student.rank && (
                      <div className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-lg shadow-xl uppercase tracking-widest border border-blue-400/50">
                        Rank: {student.rank}
                      </div>
                    )}
                    {student.marks && (
                      <div className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-lg shadow-xl uppercase tracking-widest border border-emerald-400/50">
                        Score: {student.marks}
                      </div>
                    )}
                  </div>

                  {/* Achievement Overlay - Visible on Hover */}
                  <div className="absolute inset-0 bg-blue-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-8 text-center text-white z-20 backdrop-blur-md">
                    <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Official Result</p>
                    <h4 className="text-2xl font-black mb-1 leading-tight">{student.name}</h4>
                    <div className="h-1 w-12 bg-white/20 my-4 rounded-full"></div>
                    
                    <div className="space-y-3 w-full">
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest mb-1">Examination</span>
                          <span className="text-sm font-bold">{student.examName}</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3 mt-3">
                          {student.marks && (
                            <div className="flex flex-col items-center">
                               <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mb-1">Marks/Percentile</span>
                               <span className="text-base font-black text-emerald-100">{student.marks}</span>
                            </div>
                          )}
                          {student.rank && (
                            <div className="flex flex-col items-center">
                               <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest mb-1">Final Rank</span>
                               <span className="text-base font-black text-blue-100">{student.rank}</span>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="mt-8 inline-flex items-center gap-2 text-[10px] font-black bg-white text-blue-900 px-6 py-3 rounded-2xl shadow-2xl hover:scale-105 transition-transform">
                      VIEW SUCCESS STORY <span>→</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 text-center border-t border-slate-50 dark:border-slate-800">
                   <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black mb-2 uppercase tracking-[0.25em]">
                    {student.examName}
                  </p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {student.name}
                  </h3>
                  <div className="mt-4 flex justify-center gap-4">
                     {student.rank && (
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rank</span>
                           <span className="text-xs font-black text-blue-600">{student.rank}</span>
                        </div>
                     )}
                     {student.marks && (
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Result</span>
                           <span className="text-xs font-black text-emerald-600">{student.marks}</span>
                        </div>
                     )}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {displayCount < filteredStudents.length && (
          <div className="mt-16 text-center">
            <button
              onClick={() => setDisplayCount((prev) => prev + 12)}
              className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              View More Success Stories
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
