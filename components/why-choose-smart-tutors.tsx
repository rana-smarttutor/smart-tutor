"use client";

import {
  Users,
  MessageCircle,
  ClipboardList,
  LineChart,
  BookOpen,
  FileCheck,
  Tv,
  Award,
  RefreshCw,
  Briefcase
} from "@/components/ui-icons";
import { motion } from "motion/react";

export default function WhyChooseSmartTutors() {
  const points = [
    {
      title: "Personal Mentorship (One to One)",
      desc: "Dedicated personal mentoring tailored to each student's learning pace, strengths, and improvement areas.",
      icon: Users,
      highlight: "One to One",
    },
    {
      title: "24x7 Doubt Support",
      desc: "Get academic assistance whenever needed through continuous, round-the-clock doubt-solving support and guidance.",
      icon: MessageCircle,
      highlight: "24x7 Support",
    },
    {
      title: "Weekly Test System",
      desc: "Regular assessments designed to monitor progress, identify gaps, and maintain syllabus revision checks.",
      icon: ClipboardList,
      highlight: "assessments",
    },
    {
      title: "Student Performance Report",
      desc: "Detailed performance tracking with insights shared with students and parents for continuous improvement.",
      icon: LineChart,
      highlight: "performance tracking",
    },
    {
      title: "Digital Learning Resources",
      desc: "Access comprehensive study materials, notes, worksheets, and e-books anytime via student accounts.",
      icon: BookOpen,
      highlight: "anytime",
    },
    {
      title: "100+ Mock Tests",
      desc: "Extensive mock test series designed to simulate real exam environments and boost peak performance.",
      icon: FileCheck,
      highlight: "Mocks",
    },
    {
      title: "Interactive White Board Learning",
      desc: "Modern teaching using interactive white boards that make learning more engaging, visual, and effective.",
      icon: Tv,
      highlight: "white boards",
    },
    {
      title: "Interview Training & Personality Development",
      desc: "Build communication skills, confidence, leadership qualities, logical reasoning, and overall personality metrics.",
      icon: Award,
      highlight: "leadership",
    },
    {
      title: "7 Days Replacement Guarantee",
      desc: "If a student is not satisfied with the teaching method, we provide a replacement within 7 days.",
      icon: RefreshCw,
      highlight: "7 days",
    },
    {
      title: "100% Job Placement Commitment",
      desc: "Our commitment is your career — we ensure 100% job placement support with training, guidance, and interview prep.",
      icon: Briefcase,
      highlight: "100% job placement",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-10">
      {/* Visual Title Block */}
      <div className="text-center space-y-3">
        <center>
          <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded inline-block shadow-xs">
            WHY CHOOSE SMART IQ INSTITUTE
          </span>
        </center>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-none mt-2">
          A Legacy of <span className="text-indigo-600">Academic Growth</span>
        </h2>
        <p className="max-w-xl mx-auto text-slate-500 text-xs font-semibold leading-relaxed">
          From classrooms to career goals — we combine proven teaching methods with personalized guidance to help every learner achieve their goals.
        </p>
      </div>

      {/* Grid of Legacy features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {points.map((point, index) => {
          const Icon = point.icon;
          // Dynamically highlight key target phrase inside descriptive body
          const highlightIndex = point.desc.toLowerCase().indexOf(point.highlight.toLowerCase());
          const hasHighlight = highlightIndex !== -1;

          return (
            <motion.div
              key={point.title}
              whileHover={{ y: -2, backgroundColor: "#fafafa" }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className="bg-white border border-slate-200 p-4 rounded-lg flex items-start space-x-4 shadow-sm hover:border-slate-300 transition-all group"
            >
              {/* Left-side Icon Circle specs exactly mapping Image 10 */}
              <div className="w-11 h-11 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100/50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 transition-transform group-hover:scale-105 duration-200" />
              </div>

              {/* Text Blocks */}
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  {point.title}
                </h4>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  {hasHighlight ? (
                    <>
                      {point.desc.substring(0, highlightIndex)}
                      <span className="text-indigo-600 font-semibold underline decoration-indigo-200 underline-offset-2">
                        {point.desc.substring(highlightIndex, highlightIndex + point.highlight.length)}
                      </span>
                      {point.desc.substring(highlightIndex + point.highlight.length)}
                    </>
                  ) : (
                    point.desc
                  )}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
