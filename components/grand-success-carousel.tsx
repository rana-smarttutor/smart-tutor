"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const RESULT_CATEGORIES = [
  {
    id: "10-ssc",
    label: "10th SSC",
    image: "/hof/10 th SSC.png",
  },
  {
    id: "10-cbsc",
    label: "10th CBSE",
    image: "/hof/10th CBSC.png",
  },
  {
    id: "12-hsc Science",
    label: "12TH HSC SCIENCE",
    image: "/hof/12th Hsc science.png",
  },
  {
    id: "12-hsc Commerce",
    label: "12TH HSC COMMERCE",
    image: "/hof/12th Hsc commerce.png",
  },
    {
    id: "12-hsc Arts",
    label: "12TH HSC ARTS",
    image: "/hof/12th Hsc arts.png",
  },
   {
    id: "12-CBSE Science",
    label: "12TH CBSE SCIENCE",
    image: "/hof/12th  sci cbse new.jpeg",
  },
  {
    id: "jee",
    label: "JEE Main",
    image: "/hof/jee-main.png",
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
    id: "NCHMCT",
    label: "NCHMCT",
    image: "/hof/NCHMCT.jpg",
  },
   {
    id: "IMU CET",
    label: "IMU CET",
    image: "/hof/IMU CET new.jpg",
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
    image: "/hof/SSC CGL UPDATED.png",
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
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border-2 border-white bg-white shadow-2xl transition-all duration-500 sm:rounded-3xl sm:border-4">
            <div className="relative mx-auto aspect-video w-full max-w-5xl bg-white">
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
