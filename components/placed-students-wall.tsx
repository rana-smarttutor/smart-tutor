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

  const filteredStudents = students.filter((s) => {
    if (filter === "all") return true;
    if (filter === "placed") return !!s.company;
    if (filter === "toppers") return !s.company;
    return true;
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
              Celebrating the hard work and achievements of our students. From board toppers to successful career placements, our learners continue to excel across the globe.
            </p>
          </div>
        </RevealOnScroll>

        <div className="flex justify-center gap-4 mb-14 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-10 py-4 rounded-full font-bold transition-all shadow-md hover:scale-105 ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
            }`}
          >
            All Achievements
          </button>
          <button
            onClick={() => setFilter("placed")}
            className={`px-10 py-4 rounded-full font-bold transition-all shadow-md hover:scale-105 ${
              filter === "placed"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
            }`}
          >
            Career Placements
          </button>
          <button
            onClick={() => setFilter("toppers")}
            className={`px-10 py-4 rounded-full font-bold transition-all shadow-md hover:scale-105 ${
              filter === "toppers"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
            }`}
          >
            Academic Toppers
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {visibleStudents.map((student, index) => (
            <RevealOnScroll key={student.id} delayMs={index % 4 * 100}>
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl hover:translate-y-[-12px] transition-all duration-500 border border-slate-100 dark:border-slate-700 group">
                <div className="aspect-[4/5] relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {student.image ? (
                    <Image
                      src={student.image}
                      alt={student.name}
                      fill
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
                  {student.company && (
                    <div className="absolute top-5 right-5 bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-full shadow-2xl z-10 animate-bounce">
                      Placed
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white font-bold text-sm">Success Story <span>→</span></p>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                    {student.name}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-extrabold mb-5 uppercase tracking-widest">
                    {student.course}
                  </p>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center text-slate-600 dark:text-slate-400 font-medium">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      {student.location}
                    </div>
                    {student.company && (
                      <div className="flex items-center text-slate-800 dark:text-slate-200 font-bold">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {student.company}
                      </div>
                    )}
                    {student.salary && (
                      <div className="text-sm text-emerald-700 dark:text-emerald-400 font-black bg-emerald-100 dark:bg-emerald-900/40 px-4 py-2 rounded-xl inline-block shadow-sm">
                        {student.salary} Package
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
