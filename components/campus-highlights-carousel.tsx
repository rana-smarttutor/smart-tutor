"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const IMAGES = [
  "/image4.jpeg",
  "/image3.png",
  "/images/students/student-1.jpg",
  "/images/students/student-2.jpg",
  "/images/students/student-3.jpg",
  "/images/students/student-5.jpg",
  "/images/students/student-10.jpg",
];

export function CampusHighlightsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const startTimer = () => {
      timer = setInterval(() => {
        setIndex((prev) => (prev + 1) % IMAGES.length);
      }, 5000);
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
    <div className="relative mx-auto mt-6 h-64 w-64 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900/50 shadow-2xl group">
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
        >
          <Image
            src={src}
            alt="Campus Highlight"
            fill
            className="object-cover transition-transform duration-[5000ms] ease-linear group-hover:scale-110"
            sizes="256px"
            priority={i === 0}
          />
        </div>
      ))}
      
      {/* Subtle overlay for better depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      
      {/* Corner badge */}
      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black text-blue-600 shadow-sm border border-blue-100/50">
        LIVE
      </div>
    </div>
  );
}
