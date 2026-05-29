"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const RESULT_CATEGORIES = [
  {
    id: "10-cbsc",
    label: "10th CBSE",
    image: "/hof/10 cbsc.png"
  },
  {
    id: "10-ssc",
    label: "10th SSC",
    image: "/hof/10 ssc blue.png"
  },
  {
    id: "banking",
    label: "Banking Exam",
    image: "/hof/Banking ex.png"
  },
  {
    id: "hsc-1",
    label: "HSC Result 1",
    image: "/hof/hsc 1.png"
  },
  {
    id: "hsc-2",
    label: "HSC Result 2",
    image: "/hof/hsc 2.png"
  },
  {
    id: "jee",
    label: "JEE Main",
    image: "/hof/jee.png"
  },
  {
    id: "law",
    label: "Law Entrance",
    image: "/hof/Law.png"
  },
  {
    id: "railway",
    label: "Railway Exam",
    image: "/hof/Railway.png"
  },
  {
    id: "ssc-cgl",
    label: "SSC CGL",
    image: "/hof/SSC CGL.png"
  }
];

export function GrandSuccessCarousel() {
  const [activeCategory, setActiveCategory] = useState(RESULT_CATEGORIES[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCategory((current) => {
        const currentIndex = RESULT_CATEGORIES.findIndex(cat => cat.id === current.id);
        const nextIndex = (currentIndex + 1) % RESULT_CATEGORIES.length;
        return RESULT_CATEGORIES[nextIndex];
      });
    }, 10000); // 10 seconds

    return () => clearInterval(timer);
  }, [activeCategory.id]);

  return (
    <RevealOnScroll className="section-shell py-4 sm:py-8">
      {/* Category Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-12">
        {RESULT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 ${
              activeCategory.id === cat.id
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                : "bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:text-blue-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Display Area */}
      <div className="flex flex-col items-center">
        {/* Image Container - Adjusted to fit images naturally with smooth transition */}
        <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border-2 sm:border-4 border-white bg-slate-50 transition-all duration-500">
           <div className="aspect-[16/10] sm:aspect-[16/9] relative">
            <Image
                src={activeCategory.image}
                alt={activeCategory.label}
                fill
                className="object-contain object-center transition-opacity duration-500 ease-in-out"
                priority
                key={activeCategory.image}
              />
           </div>
        </div>
        
        {/* Minimal Label below image */}
        <div className="mt-6 text-center">
           <p className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-widest">
             {activeCategory.label} Results
           </p>
           <div className="h-1 w-12 bg-blue-600 mx-auto mt-2 rounded-full" />
        </div>
      </div>
    </RevealOnScroll>
  );
}
