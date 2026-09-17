"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { mentorHighlights } from "@/lib/mentor-highlights-data";

const HIGHLIGHTS = [
  {
    name: "SmartIQ Institute",
    role: "",
    specialization: "",
    image: "/Smart-institue-logo.jpeg",
    type: "branding",
  },

  ...mentorHighlights.map((mentor) => ({
    name: mentor.name,
    role: mentor.role,
    specialization: mentor.specialization,
    image: mentor.image,
    type: "mentor",
  })),
];

export function MentorHighlightsCarousel() {
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
        setIndex(
          (previousIndex) =>
            (previousIndex + 1) % HIGHLIGHTS.length,
        );
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

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      stopTimer();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);

  return (
    <div className="flex w-full flex-col">
      <div className="relative mx-auto flex w-full max-w-[430px] flex-col items-center rounded-[2.5rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-6">
        {/* IMAGE */}
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
                src={
                  highlight.image ||
                  "/Smart-institue-logo.jpeg"
                }
                alt={highlight.name}
                fill
                sizes="250px"
                priority={slideIndex === 0}
                className={
                  highlight.type === "branding"
                    ? "object-contain p-3"
                    : "object-contain object-center"
                }
              />
            </div>
          ))}
        </div>

        {/* DETAILS */}
        <div className="flex w-full flex-col items-center text-center">
          {HIGHLIGHTS.map((highlight, slideIndex) => (
            <div
              key={`mentor-data-${highlight.name}-${slideIndex}`}
              className={`w-full transition-opacity duration-500 ${
                slideIndex === index
                  ? "relative opacity-100"
                  : "pointer-events-none absolute opacity-0"
              }`}
            >
              {highlight.type === "mentor" && (
                <div className="mb-3 flex justify-center">
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                    SmartIQ Mentor
                  </span>
                </div>
              )}

              <div className="flex min-h-[76px] flex-col items-center justify-center">
                <h3
                  className={`font-black leading-tight tracking-tight text-slate-900 ${
                    highlight.type === "branding"
                      ? "text-3xl sm:text-4xl"
                      : "text-2xl sm:text-3xl"
                  }`}
                >
                  {highlight.name}
                </h3>

                {highlight.role && (
                  <p className="mt-2 text-sm font-bold text-blue-600">
                    {highlight.role}
                  </p>
                )}

                {highlight.specialization && (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {highlight.specialization}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* PROGRESS INDICATORS */}
          <div className="mt-5 flex justify-center gap-2">
            {HIGHLIGHTS.map((highlight, slideIndex) => (
              <button
                key={`mentor-indicator-${highlight.name}-${slideIndex}`}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === index
                    ? "w-10 bg-blue-600"
                    : "w-1.5 bg-slate-200 hover:bg-blue-300"
                }`}
                aria-label={`Go to mentor slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MentorHighlightsCarousel;