"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Trophy,
  BookOpen,
  Star,
  HelpingHand,
  MapPin,
  Phone,
  Mail,
} from "@/components/ui-icons";
import { motion } from "motion/react";

import ToppersSection from "@/components/toppers-section";
import SpotlightSection from "@/components/spotlight-section";
import SkillsGrid from "@/components/skills-grid";
import WhyChooseSmartTutors from "@/components/why-choose-smart-tutors";
import CourseModal from "@/components/course-modal";
import SmartTutorsAIChatbot from "@/components/SmartTutorsAIChatbot";
import WhatsAppFAB from "@/components/whatsapp-fab";

import { CourseItem } from "@/lib/types";

interface CoursesRedesignClientProps {
  allCourses: CourseItem[];
}

const COURSE_TABS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11-12",
  "Govt Exams",
  "Skills",
] as const;

function isCourseTab(tab: string | null): tab is (typeof COURSE_TABS)[number] {
  return tab !== null && COURSE_TABS.includes(tab as (typeof COURSE_TABS)[number]);
}

export default function CoursesRedesignClient({
  allCourses,
}: CoursesRedesignClientProps) {
  const searchParams = useSearchParams();
const requestedTab = searchParams.get("tab");

const [activeTab, setActiveTab] = useState("Class 6");

useEffect(() => {
  if (isCourseTab(requestedTab)) {
    setActiveTab(requestedTab);
  }
}, [requestedTab]);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // Quick stats definitions
  const stats = [
    { value: "10,000+", label: "Success stories" },
    { value: "99.37%", label: "Max percentile" },
    { value: "50+", label: "Academic programs" },
    { value: "1-on-1", label: "Personal mentoring" },
  ];

  return (
    <div
      id="smart-tutors-root"
      className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-950"
    >
      {/* 2. Main Hero Context Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 sm:pb-12 space-y-12 sm:space-y-16">
        {/* Visual Greetings Banner */}
        <section className="bg-white border border-slate-200 p-6 sm:p-8 rounded-xl shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-50/20 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider flex items-center gap-1 w-max">
              <Sparkles className="w-3.5 h-3.5" /> Direct Admissions Open
              2026-2027
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-tight">
              A Legacy of{" "}
              <span className="text-indigo-600">Educational Excellence</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold max-w-xl leading-relaxed">
              Explore dynamic classroom tracks, comprehensive syllabus
              structures, and professional job-ready certification majors
              curated by seasoned faculty boards.
            </p>
          </div>

          {/* Core metrics counters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg relative z-10 w-full md:max-w-xl">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center p-2">
                <span className="font-display font-bold text-indigo-600 text-base sm:text-lg block leading-none">
                  {stat.value}
                </span>
                <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block mt-1.5 leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Interactive Tabbed Navigator & Spotlight Card Section */}
        <section className="space-y-6">
          <div className="text-center md:text-left space-y-1">
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block font-mono">
              program pathways
            </span>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight leading-none">
              Explore Our Academic Catalog
            </h2>
            <p className="text-slate-500 text-xs font-semibold max-w-xl leading-relaxed">
              Select your academic division below to browse targeted preparatory
              programs, syllabus specifications, and toppers' boards.
            </p>
          </div>

          <SpotlightSection
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSelectCourse={setSelectedCourse}
            allCourses={allCourses}
          />
        </section>

        {/* 4. Skills Section Specific Grid Display */}
        <section className="space-y-6">
          <SkillsGrid
            onSelectCourse={setSelectedCourse}
            allCourses={allCourses}
          />
        </section>
        {/* 5. Hall of Fame (Toppers Wall) Section */}
        <section>
          <ToppersSection activeTab={activeTab} />
        </section>

        {/* 6. Bottom CTA Block */}
        <section className="bg-slate-900 text-white rounded-xl p-8 sm:p-10 text-center space-y-5 relative overflow-hidden border border-slate-800 shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded inline-flex items-center gap-1 mx-auto">
              <HelpingHand className="w-3.5 h-3.5" /> Free consultation
            </span>
            <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
              Looking for a Customized Academic Syllabus?
            </h3>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              Book a free counseling session or 1-on-1 assessment with our
              faculty advisors to outline a bespoke routine that suits your
              learning timeline.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  const fallbackCourse =
                    allCourses.find(
                      (c) => c.standardKey === "class-6-regular-academic",
                    ) || allCourses[0];
                  setSelectedCourse(fallbackCourse);
                }}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-6 rounded shadow-sm cursor-pointer transition-all uppercase tracking-wider"
              >
                Register for Free Demo session
              </motion.button>
              <button
                onClick={() => {
                  window.open(
                    "https://api.whatsapp.com/send?phone=918850447887&text=Hi%20Smart%20Tutors,%20I'd%20like%20to%20receive%20the%20admissions%20brochure%20and%20class%20schedules.",
                    "_blank",
                  );
                }}
                className="w-full sm:w-auto bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-semibold text-xs py-2.5 px-6 rounded cursor-pointer transition-all uppercase tracking-wider"
              >
                Download Program Brochure
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Lightbox Modal & Floating Action Assistant */}
      <CourseModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
      />

      <SmartTutorsAIChatbot />
      <WhatsAppFAB currentCourseTitle={selectedCourse?.title} />
    </div>
  );
}
