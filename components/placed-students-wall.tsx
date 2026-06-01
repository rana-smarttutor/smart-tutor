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
    { label: "Corporate", value: "Amazon|Infosys|TCS|Accenture|Wipro|Deloitte" },
    { label: "MBA Entrance", value: "MAH MBA CET" },
    { label: "Banking & PO", value: "SBI PO|NABARD" },
    { label: "Govt & SSC", value: "SSC GD" },
    { label: "Law Entrance", value: "CLAT" },
  ];

  const filteredStudents = students.filter((s) => {
    if (filter === "all") return true;
    const filterRegex = new RegExp(filter, "i");
    return (
      filterRegex.test(s.examName || "") || 
      filterRegex.test(s.company || "")
    );
  });

  // Display all students
  const visibleStudents = filteredStudents;

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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {visibleStudents.map((student, index) => (
            <RevealOnScroll key={student.id} delayMs={index * 50}>
              <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] overflow-hidden shadow-lg hover:shadow-xl hover:translate-y-[-8px] transition-all duration-500 border border-slate-100 dark:border-slate-700 group relative">
                <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {student.image ? (
                    <Image
                      src={student.image}
                      alt={student.name}
                      fill
                      loading="lazy"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                      <svg
                        className="w-12 h-12"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4 text-center border-t border-slate-50 dark:border-slate-800">
                   <div className="flex flex-wrap justify-center gap-1 mb-2">
                    {student.rank && (
                      <div className="bg-blue-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-widest">
                        {student.rank}
                      </div>
                    )}
                    {student.marks && (
                      <div className="bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-widest">
                        {student.marks}
                      </div>
                    )}
                    {student.salary && (
                      <div className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-md uppercase tracking-widest">
                        {student.salary}
                      </div>
                    )}
                  </div>
                   <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black mb-1 uppercase tracking-[0.2em] truncate">
                    {student.company || student.examName}
                  </p>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                    {student.name}
                  </h3>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
