"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const RESULT_CATEGORIES = [
  {
    id: "10-ssc",
    label: "10th SSC",
    image: "/hof/10 ssc blue.png",
  },
  {
    id: "10-cbsc",
    label: "10th CBSE",
    image: "/hof/10 cbsc.png",
  },
  {
    id: "hsc-1",
    label: "12th HSC 1",
    image: "/hof/hsc 1.png",
  },
  {
    id: "hsc-2",
    label: "12th HSC 2",
    image: "/hof/hsc 2.png",
  },
  {
    id: "jee",
    label: "JEE Main",
    image: "/hof/jee.png",
  },
  {
    id: "neet-cet",
    label: "NEET / CET",
    image: "/hof/jee.png",
  },
  {
    id: "banking",
    label: "Banking Exam",
    image: "/hof/Banking ex.png",
  },
  {
    id: "law",
    label: "Law Entrance",
    image: "/hof/Law.png",
  },
  {
    id: "railway",
    label: "Railway Exam",
    image: "/hof/Railway.png",
  },
  {
    id: "ssc-cgl",
    label: "SSC CGL",
    image: "/hof/SSC CGL.png",
  },
];

export function GrandSuccessCarousel() {
  const [activeCategory, setActiveCategory] = useState(RESULT_CATEGORIES[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCategory((current) => {
        const currentIndex = RESULT_CATEGORIES.findIndex(
          (category) => category.id === current.id,
        );
        const nextIndex = (currentIndex + 1) % RESULT_CATEGORIES.length;

        return RESULT_CATEGORIES[nextIndex];
      });
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <RevealOnScroll className="section-shell py-4 sm:py-8">
      <div className="mb-8 flex flex-wrap justify-center gap-2 sm:mb-12">
        {RESULT_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full border-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 sm:text-xs ${
              activeCategory.id === category.id
                ? "scale-105 border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col items-center">
        <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[1.5rem] border-2 border-white bg-white shadow-2xl transition-all duration-500 sm:rounded-[2.5rem] sm:border-4">
          <div className="relative aspect-[16/11] w-full sm:aspect-[21/11]">
            <Image
              key={activeCategory.image}
              src={activeCategory.image}
              alt={activeCategory.label}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1100px"
              className="object-contain object-center transition-opacity duration-500 ease-in-out"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 sm:text-lg">
            {activeCategory.label} Results
          </p>
          <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-blue-600 shadow-sm" />
        </div>
      </div>
    </RevealOnScroll>
  );
}
