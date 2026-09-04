"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { generatedPlacedStudents } from "@/lib/placed-students-data";

const HIGHLIGHTS = [
  {
    name: "SmartIQ Institute",
    result: "",
    exam: "",
    image: "/Smart-institue-logo.jpeg",
    type: "branding",
  },
  ...generatedPlacedStudents.map((student) => ({
    name: student.name,
result: student.rank
  ? student.rank.toLowerCase().startsWith("rank")
    ? student.rank
    : `Rank ${student.rank}`
  : student.marks
    ? `${student.marks} Percentile`
    : "",
    exam: student.examName,
    image: student.image,
    type: student.rank ? "rank" : "percentile",
  })),
];

export function CampusHighlightsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
      }
    };

    const startTimer = () => {
      stopTimer();

      timer = setInterval(() => {
        setIndex((previousIndex) => (previousIndex + 1) % HIGHLIGHTS.length);
      }, 8000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    startTimer();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="flex w-full flex-col">
      <div className="relative mx-auto flex w-full max-w-[430px] flex-col items-center rounded-[2.5rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-6">
        {/* Student / Branding Image */}
        <div className="relative mb-5 h-[220px] w-[220px] shrink-0 overflow-hidden rounded-[2rem] border-[5px] border-white bg-gradient-to-b from-[#eef0ff] to-white shadow-xl sm:h-[250px] sm:w-[250px]">
          {HIGHLIGHTS.map((highlight, slideIndex) => (
            <div
              key={`${highlight.name}-${slideIndex}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                slideIndex === index
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <Image
                src={highlight.image || "/Smart-institue-logo.jpeg"}
                alt={highlight.name}
                fill
                sizes="250px"
                priority={slideIndex === 0}
                className="object-contain object-bottom"
              />
            </div>
          ))}
        </div>

        {/* Result Details */}
        <div className="flex w-full flex-col items-center text-center">
          {HIGHLIGHTS.map((highlight, slideIndex) => (
            <div
              key={`data-${highlight.name}-${slideIndex}`}
              className={`w-full transition-opacity duration-500 ${
                slideIndex === index
                  ? "relative opacity-100"
                  : "pointer-events-none absolute opacity-0"
              }`}
            >
              {highlight.exam && (
                <div className="mb-3 flex flex-wrap justify-center gap-3">
                  <div className="flex min-h-[64px] flex-col items-center justify-center gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Examination
                    </span>

                    <span className="rounded-lg border-2 border-blue-400/30 bg-blue-600 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow-xl">
                      {highlight.exam}
                    </span>
                  </div>

                  {highlight.result && (
                    <div className="flex min-h-[64px] flex-col items-center justify-center gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                        {highlight.type === "rank"
                          ? "Official Rank"
                          : "Score Achieved"}
                      </span>

                      <span className="rounded-lg border-2 border-emerald-400/30 bg-emerald-600 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow-xl">
                        {highlight.result}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex min-h-[64px] flex-col items-center justify-center gap-1">
                <h3
                  className={`${
                    highlight.name === "SmartIQ Institute"
                      ? "text-3xl sm:text-4xl"
                      : "text-2xl sm:text-4xl"
                  } font-black leading-tight tracking-tight text-slate-900`}
                >
                  {highlight.name}
                </h3>


              </div>
            </div>
          ))}

          {/* Progress Indicators */}
          <div className="mt-5 flex justify-center gap-2">
            {HIGHLIGHTS.map((highlight, slideIndex) => (
              <button
                key={`indicator-${highlight.name}-${slideIndex}`}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className={`h-1.5 rounded-full transition-colors duration-200 ${
                  slideIndex === index
                    ? "w-10 bg-blue-600"
                    : "w-1.5 bg-slate-200 hover:bg-blue-300"
                }`}
                aria-label={`Go to slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}