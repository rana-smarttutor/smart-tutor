"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const successImages = [
  "/result-1.jpeg",
  "/result-2.jpeg",
  "/result-3.jpeg",
  "/result-4.jpeg",
  "/result-5.jpeg",
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
      <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden rounded-[3rem] shadow-2xl border-4 border-blue-50/50 bg-slate-50 dark:bg-slate-900/50 group">
        {successImages.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={src}
              alt={`Smart Tutors Success Highlight ${index + 1}`}
              fill
              className="object-contain object-center"
              priority={index === 0}
            />
          </div>
        ))}
        
        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {successImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveState(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === activeIndex ? "bg-blue-600 w-6" : "bg-blue-200/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-8 left-8 text-white z-20">
          <p className="text-sm font-bold uppercase tracking-widest bg-blue-600 px-4 py-1.5 rounded-full inline-block">Grand Success 2026</p>
        </div>
      </div>
    </RevealOnScroll>
  );
}
