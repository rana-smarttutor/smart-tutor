"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const successImages = [
  "/hof/result-1.jpeg",
  "/hof/result-2.jpeg",
  "/hof/result-3.jpeg",
  "/hof/student-15.jpg",
];

export function GrandSuccessCarousel() {
  const [activeIndex, setActiveState] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveState((prev) => (prev + 1) % successImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <RevealOnScroll className="section-shell py-14">
      <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden rounded-[3rem] shadow-2xl border-8 border-white dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 group">
        {successImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === activeIndex ? "opacity-100 scale-100 z-10" : "opacity-0 scale-110 z-0"
            }`}
          >
            <Image
              src={src}
              alt={`Smart Tutors Success Highlight ${index + 1}`}
              fill
              className="object-contain object-center"
              priority={index === 0}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/40 to-transparent" />
            </div>
            ))}

            {/* Navigation Dots */}
            <div className="absolute bottom-6 right-8 flex gap-2 z-20">
            {successImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveState(index)}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === activeIndex ? "bg-white w-8" : "bg-white/30 w-2 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
            ))}
            </div>

            <div className="absolute bottom-8 left-8 text-white z-20 max-w-md">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300 mb-2 drop-shadow-lg">Recent Results</p>
            <h3 className="text-2xl md:text-3xl font-black mb-3 leading-tight drop-shadow-xl">
            Celebrating Excellence, <br />
            <span className="text-blue-400">Our Proven Track Record.</span>
            </h3>
            <p className="text-xs md:text-sm font-medium text-slate-100 opacity-90 leading-relaxed drop-shadow-lg">
            Witness the achievements of our dedicated students who have excelled in their academic journeys with Smart Tutors.
            </p>
            </div>      </div>
    </RevealOnScroll>
  );
}
