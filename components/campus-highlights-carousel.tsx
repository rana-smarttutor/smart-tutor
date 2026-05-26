"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const HIGHLIGHTS = [
  { name: "Smart Tutors", result: "", exam: "", image: "/image4.jpeg" },
  { name: "Mr. Kanade", result: "99.37 Percentile", exam: "MAH MBA CET 2024", image: "/student-photos/Mr.Kanade.png", type: "percentile" },
  { name: "Mr. Ranjeet", result: "Rank 1st", exam: "NABARD", image: "/student-photos/Mr. Ranjeet.png", type: "rank" },
  { name: "Ms. Ritamvara", result: "Rank 1st", exam: "SBI PO", image: "/student-photos/Ms.  Ritamvara.png", type: "rank" },
  { name: "Mr. Vaibhava", result: "Rank 1st", exam: "CLAT (NLU)", image: "/student-photos/Mr.Vaibhava.png", type: "rank" },
  { name: "Mr. Vishal", result: "Rank 1st", exam: "SSC GD", image: "/student-photos/Mr.Vishal.png", type: "rank" },
  { name: "Mr. Aadesh", result: "99+ Percentile", exam: "MAH MBA CET", image: "/student-photos/Mr.AadeshGaigawali.png", type: "percentile" },
];

export function CampusHighlightsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const startTimer = () => {
      timer = setInterval(() => {
        setIndex((prev) => (prev + 1) % HIGHLIGHTS.length);
      }, 8000); // 8 seconds rotation
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        startTimer();
      }
    };

    startTimer();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center bg-white dark:bg-slate-900/40 rounded-[3.5rem] p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-800">
        {/* Smaller Image Container - Fully Visible */}
        <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] shrink-0 overflow-hidden rounded-[2.5rem] shadow-2xl bg-white dark:bg-slate-950 border-[6px] border-white dark:border-slate-800 mb-4">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                i === index ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={h.image}
                alt={h.name}
                fill
                className="object-cover transition-transform duration-[8000ms] ease-linear"
                sizes="300px"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Data Box - Tighter Margin Below Image */}
        <div className="w-full flex flex-col items-center text-center">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={`data-${i}`}
              className={`w-full transition-all duration-700 transform ${
                i === index ? "translate-y-0 opacity-100 relative" : "translate-y-4 opacity-0 absolute pointer-events-none"
              }`}
            >
               {h.exam && (
                 <div className="flex flex-wrap justify-center gap-3 mb-3">
                    <div className="flex flex-col gap-1">
                       <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Examination</span>
                       <span className="bg-blue-600 text-white text-[11px] font-black px-4 py-1 rounded-lg uppercase tracking-widest shadow-xl border-2 border-blue-400/30">
                        {h.exam}
                       </span>
                    </div>
                    {h.result && (
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{h.type === "rank" ? "Official Rank" : "Score Achieved"}</span>
                          <span className="bg-emerald-600 text-white text-[11px] font-black px-4 py-1 rounded-lg uppercase tracking-widest shadow-xl border-2 border-emerald-400/30">
                            {h.result}
                          </span>
                       </div>
                    )}
                 </div>
               )}
              
              <div className="flex flex-col gap-1">
                <h3 className={`${h.name === "Smart Tutors" ? "text-5xl md:text-6xl" : "text-3xl md:text-5xl"} font-black text-slate-900 dark:text-white leading-tight tracking-tight`}>
                  {h.name}
                </h3>
                {h.name !== "Smart Tutors" && (
                   <p className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.4em] mt-2">
                     Verified Success
                   </p>
                )}
              </div>
            </div>
          ))}

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2.5 mt-8">
            {HIGHLIGHTS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? "bg-blue-600 w-10" : "bg-slate-200 dark:bg-slate-700 w-1.5 hover:bg-blue-300"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
