"use client";

import { useState } from "react";
import Image from "next/image";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const RESULT_CATEGORIES = [
  {
    id: "all",
    label: "All Results",
    image: "/hof/result-1.jpeg",
    title: "Celebrating Excellence",
    subtitle: "Our Proven Track Record",
    description: "Witness the achievements of our dedicated students across all categories."
  },
  {
    id: "mba",
    label: "MBA CET",
    image: "/result-4.jpeg",
    title: "MBA Entrance Mastery",
    subtitle: "Top Percentiles in CET",
    description: "Our students consistently secure 99+ percentiles in MAH MBA CET exams."
  },
  {
    id: "banking",
    label: "Banking & PO",
    image: "/result-5.jpeg",
    title: "Banking Success",
    subtitle: "SBI & IBPS Achievers",
    description: "Exceptional results in SBI PO, IBPS, and other major banking recruitment exams."
  },
  {
    id: "civil",
    label: "Civil Services",
    image: "/hof/student-15.jpg",
    title: "Civil Services",
    subtitle: "UPSC & MPSC Journey",
    description: "Dedicated preparation and guidance for future administrative leaders."
  }
];

export function GrandSuccessCarousel() {
  const [activeCategory, setActiveCategory] = useState(RESULT_CATEGORIES[0]);

  return (
    <RevealOnScroll className="section-shell py-8 sm:py-14">
      {/* Category Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10">
        {RESULT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 border-2 ${
              activeCategory.id === cat.id
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:text-blue-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Display Area */}
      <div className="flex flex-col gap-6 lg:gap-8">
        {/* Image Container */}
        <div className="relative aspect-[4/3] sm:aspect-[21/9] w-full overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-4 sm:border-8 border-white bg-slate-100 group transition-all duration-500">
          <Image
            src={activeCategory.image}
            alt={activeCategory.title}
            fill
            className="object-contain object-center transition-all duration-700 ease-in-out"
            priority
            key={activeCategory.image}
          />
          
          {/* Subtle Desktop-only Gradient Overlay for depth, reduced opacity */}
          <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Content Area - Positioned below image on all screens, but styled for clarity */}
        <div className="w-full bg-white rounded-[2rem] p-6 sm:p-10 border border-slate-100 shadow-xl sm:shadow-none sm:border-none sm:bg-transparent text-center sm:text-left">
          <div className="max-w-3xl">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-blue-600 mb-2">
              Success Highlight
            </p>
            <h3 className="text-2xl sm:text-4xl font-black text-slate-900 mb-3 leading-tight tracking-tight">
              {activeCategory.title}, <br className="hidden sm:block" />
              <span className="text-blue-600">{activeCategory.subtitle}</span>
            </h3>
            <p className="text-sm sm:text-lg font-medium text-slate-600 leading-relaxed">
              {activeCategory.description}
            </p>
            
            {/* Action link for desktop */}
            <div className="mt-6 hidden sm:block">
               <span className="inline-flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-widest group cursor-pointer">
                 View Full Gallery <span className="group-hover:translate-x-1 transition-transform">→</span>
               </span>
            </div>
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
