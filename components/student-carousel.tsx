"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { generatedPlacedStudents } from "@/lib/placed-students-data";

export function StudentCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Map the centralized data to the carousel format
  const studentData = generatedPlacedStudents.map(student => ({
    name: student.name,
    exam: student.examName,
    result: student.rank || student.marks || "Top Result",
    image: student.image
  }));

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;
    let scrollPos = 0;

    const scroll = () => {
      if (!isHovered) {
        scrollPos += 0.5;
        if (scrollPos >= scrollContainer.scrollWidth / 2) {
          scrollPos = 0;
        }
        scrollContainer.scrollLeft = scrollPos;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  return (
    <div 
      className="relative w-full overflow-hidden py-14 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={scrollRef}
        className="flex gap-8 overflow-x-hidden whitespace-nowrap px-8"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Double the images for seamless loop */}
        {[...studentData, ...studentData].map((student, index) => (
          <div 
            key={index}
            className="group relative inline-flex flex-col items-center shrink-0"
          >
            <div className="h-44 w-44 overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl relative">
              <Image
                src={student.image || "/image4.jpeg"}
                alt={student.name}
                width={176}
                height={176}
                loading="lazy"
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="176px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="mt-5 flex flex-col items-center gap-1.5">
               <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {student.exam}
              </span>
              <span className="text-xs font-black text-slate-900 leading-none">
                {student.name}
              </span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {student.result}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
