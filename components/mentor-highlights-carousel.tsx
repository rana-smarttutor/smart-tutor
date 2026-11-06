"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { mentorHighlights } from "@/lib/mentor-highlights-data";

// Display only mentors.
// The SmartIQ Institute branding/logo slide has been removed.
const HIGHLIGHTS = mentorHighlights.filter((mentor) => Boolean(mentor.image));

export function MentorHighlightsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (HIGHLIGHTS.length <= 1) {
      return;
    }

    let timer: ReturnType<typeof setInterval> | undefined;

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
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

  if (HIGHLIGHTS.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col">
      <div className="relative mx-auto flex w-full max-w-[430px] flex-col items-center rounded-[2.5rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-6">
        {/* MENTOR IMAGES */}
        <div className="relative mb-5 h-[220px] w-[220px] shrink-0 overflow-hidden rounded-[2rem] border-[5px] border-white bg-gradient-to-b from-[#eef0ff] to-white shadow-xl sm:h-[250px] sm:w-[250px]">
          {HIGHLIGHTS.map((mentor, slideIndex) => (
            <div
              key={`${mentor.name}-${slideIndex}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                slideIndex === index
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <Image
                src={mentor.image}
                alt={mentor.name}
                fill
                sizes="250px"
                priority={slideIndex === 0}
                className="object-contain object-center"
              />
            </div>
          ))}
        </div>

        {/* MENTOR DETAILS */}
        <div className="flex w-full flex-col items-center text-center">
          {HIGHLIGHTS.map((mentor, slideIndex) => (
            <div
              key={`mentor-data-${mentor.name}-${slideIndex}`}
              className={`w-full transition-opacity duration-500 ${
                slideIndex === index
                  ? "relative opacity-100"
                  : "pointer-events-none absolute opacity-0"
              }`}
            >
              <div className="mb-3 flex justify-center">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  SmartIQ Mentor
                </span>
              </div>

              <div className="flex min-h-[76px] flex-col items-center justify-center">
                <h3 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
                  {mentor.name}
                </h3>

                {mentor.role && (
                  <p className="mt-2 text-sm font-bold text-blue-600">
                    {mentor.role}
                  </p>
                )}

                {mentor.specialization && (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {mentor.specialization}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* SLIDESHOW INDICATORS */}
          {HIGHLIGHTS.length > 1 && (
            <div className="mt-5 flex justify-center gap-2">
              {HIGHLIGHTS.map((mentor, slideIndex) => (
                <button
                  key={`mentor-indicator-${mentor.name}-${slideIndex}`}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    slideIndex === index
                      ? "w-10 bg-blue-600"
                      : "w-1.5 bg-slate-200 hover:bg-blue-300"
                  }`}
                  aria-label={`Go to mentor slide ${slideIndex + 1}`}
                  aria-current={slideIndex === index ? "true" : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MentorHighlightsCarousel;
