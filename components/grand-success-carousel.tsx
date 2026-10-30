"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const RESULT_CATEGORIES = [
  {
    id: "10-ssc",
    label: "10TH SSC",
    image: "/hof/10 th SSC.png",
  },
  {
    id: "10-cbsc",
    label: "10TH CBSE",
    image: "/hof/10th-CBSE-new.jpeg",
  },
  {
    id: "12-hsc Science",
    label: "12TH HSC SCIENCE",
    image: "/hof/12th-Sci-new.jpeg",
  },
  {
    id: "12-hsc Commerce",
    label: "12TH HSC COMMERCE",
    image: "/hof/12th-commerce-new.png",
  },
  {
    id: "12-hsc Arts",
    label: "12TH HSC ARTS",
    image: "/hof/12th-arts-new.jpeg",
  },
  {
    id: "12-CBSE Science",
    label: "12TH CBSE SCIENCE",
    image: "/hof/12th-CBSE-sci-new.jpeg",
  },
  {
    id: "jee",
    label: "JEE Main",
    image: "/hof/JEE 2.jpg",
  },
  {
    id: "NEET",
    label: "NEET",
    image: "/hof/neet-new.jpeg",
  },
  {
    id: "cet",
    label: "CET",
    image: "/hof/CET.png",
  },
  {
    id: "MBA",
    label: "MBA",
    image: "/hof/MBA.jpg",
  },
  {
    id: "IMU CET",
    label: "IMU CET",
    image: "/hof/IMU CET new.jpg",
  },
  {
    id: "banking",
    label: "Banking Exam",
    image: "/hof/banking-exam-new.jpeg",
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
    id: "ssc cgl",
    label: "SSC CGL",
    image: "/hof/ssc-clg-new-2.png",
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
    <RevealOnScroll>
      <div className="flex w-full flex-col items-center px-4 sm:px-6">
        <div className="mb-7 flex w-full max-w-5xl flex-wrap items-center justify-center gap-2 sm:mb-10 sm:gap-2.5">
          {RESULT_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`inline-flex min-h-10 max-w-full items-center justify-center rounded-full border px-4 py-2.5 text-center text-xs font-bold leading-5 tracking-normal transition-all duration-200 sm:min-h-11 sm:px-5 sm:text-sm ${
                activeCategory.id === category.id
                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200/60"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              }`}
              aria-pressed={activeCategory.id === category.id}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col items-center">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg sm:rounded-3xl">
            <div className="relative mx-auto aspect-video w-full bg-white">
              <Image
                key={activeCategory.image}
                src={activeCategory.image}
                alt={activeCategory.label}
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 1100px"
                className="object-contain object-center transition-opacity duration-500 ease-in-out"
              />
            </div>
          </div>

          <div className="mt-6 text-center sm:mt-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--color-heading)] transition-colors sm:text-lg">
              {activeCategory.label} Results
            </p>
            <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-blue-600 shadow-sm" />
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
