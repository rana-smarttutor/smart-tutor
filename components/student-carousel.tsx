"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

const studentData = [
  { name: "Mr. Kanade", exam: "MAH MBA CET", result: "99.37", image: "/student-photos/Mr.Kanade.png" },
  { name: "Mr. Ranjeet", exam: "NABARD", result: "Rank 1st", image: "/student-photos/Mr. Ranjeet.png" },
  { name: "Ms. Ritamvara", exam: "SBI PO", result: "Rank 1st", image: "/student-photos/Ms.  Ritamvara.png" },
  { name: "Ms. Priyanka", exam: "SBI PO", result: "Rank 1st", image: "/student-photos/Ms. Priyanka.png" },
  { name: "Ms. Darshit", exam: "SBI PO", result: "Rank 1st", image: "/student-photos/Ms.Darshit.png" },
  { name: "Mr. Vishal", exam: "SSC GD", result: "Rank 1st", image: "/student-photos/Mr.Vishal.png" },
  { name: "Omkar Paturkar", exam: "MAH MBA CET", result: "95+", image: "/student-photos/Omkar Paturkar.png" },
  { name: "Mr. Vaibhava", exam: "CLAT (NLU)", result: "Rank 1st", image: "/student-photos/Mr.Vaibhava.png" },
  { name: "Mr. Aadesh", exam: "MAH MBA CET", result: "99+", image: "/student-photos/Mr.AadeshGaigawali.png" },
];

export function StudentCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

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
      className="relative w-full overflow-hidden py-14 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner"
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
            <div className="h-44 w-44 overflow-hidden rounded-[2.5rem] border-4 border-white dark:border-slate-800 shadow-2xl relative">
              <Image
                src={student.image}
                alt={student.name}
                width={176}
                height={176}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="mt-5 flex flex-col items-center gap-1.5">
               <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                {student.exam}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white leading-none">
                {student.name}
              </span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                {student.result}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
