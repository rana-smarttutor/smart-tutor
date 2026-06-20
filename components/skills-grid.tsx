"use client";

import { useState } from "react";
import {
  Code,
  Volume2,
  Brush,
  Briefcase,
  MessageSquare,
  Calculator,
  Award,
  Palette,
  ArrowRight,
  BrainCircuit
} from "@/components/ui-icons";
import { motion } from "motion/react";
import { CourseItem } from "@/lib/types";
import LocalGraphic from "@/components/local-graphic";

export interface SkillDomain {
  title: string;
  desc: string;
  icon: any;
  color: string;
  image: string;
  techTags: string[];
  courseIdFilters: string[]; // actual courses standard keys
}

interface SkillsGridProps {
  onSelectCourse: (course: CourseItem) => void;
  allCourses: CourseItem[];
}

export default function SkillsGrid({ onSelectCourse, allCourses }: SkillsGridProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const domains: SkillDomain[] = [
    {
      title: "Computer & IT Skills",
      desc: "Programming, Web Development, Advanced Apps, Code Logic & more.",
      icon: Code,
      color: "bg-blue-50 text-blue-600 border border-blue-100/50",
      image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400",
      techTags: ["MERN Stack", "React.js", "Java / Spring", "Python"],
      courseIdFilters: [
        "full-stack-mern",
        "full-stack-mean-java",
        "advanced-coding-app-dev",
        "junior-coding-robotics",
        "foundation-it-software-11-12"
      ],
    },
    {
      title: "Digital Marketing & Brand",
      desc: "SEO, Social Media Marketing, Performance Ads, Google Campaigns & more.",
      icon: Volume2,
      color: "bg-blue-50 text-blue-600 border border-blue-100/50",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400",
      techTags: ["SEO/SEM", "Content Strategy", "E-Commerce", "Shopify"],
      courseIdFilters: ["digital-marketing-ecommerce"],
    },
    {
      title: "Business & Management",
      desc: "Entrepreneurship, Strategic Planning, Change Management & Operations.",
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600 border border-blue-100/50",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400",
      techTags: ["Digital Strategy", "SAP ERP FICO/MM", "Lean Operations"],
      courseIdFilters: ["digital-transformation-ind-4", "sap-erp-essentials"],
    },
    {
      title: "Communication & Spoken English",
      desc: "Vocabulary Mastery, Public Speaking, Body Language & Debating Tools.",
      icon: MessageSquare,
      color: "bg-blue-50 text-blue-600 border border-blue-100/50",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400",
      techTags: ["Presentation Skill", "Confidence Club", "Speech Delivery"],
      courseIdFilters: ["public-speaking-comm"],
    },
    {
      title: "Finance & Accounting",
      desc: "Tally Prime, GST filing, Taxation, Banking and Compound Investments.",
      icon: Calculator,
      color: "bg-blue-50 text-blue-600 border border-blue-100/50",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400",
      techTags: ["Financial Literacy", "Tax Systems", "Budgeting Labs"],
      courseIdFilters: ["financial-literacy-budgeting", "junior-financial-literacy-6-8", "bcom-bba-professional-track"],
    },
    {
      title: "Professional Certifications",
      desc: "AWS Cloud Operations, Database Systems (PL/SQL, NoSQL MongoDB) & more.",
      icon: Award,
      color: "bg-blue-50 text-blue-600 border border-blue-100/50",
      image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=400",
      techTags: ["AWS SolArch", "PL/SQL", "NoSQL MongoDB", "Big Data"],
      courseIdFilters: [
        "database-mastery-sql-mongodb",
        "cloud-computing-data-science-grad",
        "big-data-analytics-pg",
        "diploma-comp-hw-networking"
      ],
    },
    {
      title: "Creative & Design Thinking",
      desc: "Advanced Visualization, Tableau, PowerBI reporting, D3.js & logic.",
      icon: Palette,
      color: "bg-blue-50 text-blue-600 border border-blue-100/50",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400",
      techTags: ["Tableau Reporting", "PowerBI Dashboards", "D3.js Storytelling"],
      courseIdFilters: ["data-vis-advanced-pg", "data-analysis-statistics-grad"],
    },
  ];

  const handleDomainClick = (domain: SkillDomain) => {
    // Find the primary/first available course matching this domain
    const filtered = allCourses.filter((course) =>
      domain.courseIdFilters.includes(course.standardKey)
    );

    if (filtered.length > 0) {
      onSelectCourse(filtered[0]);
    } else {
      // Fallback search in all courses matching category "Skills"
      const skillsCourses = allCourses.filter((course) => course.sections.includes("Skills"));
      if (skillsCourses.length > 0) {
        onSelectCourse(skillsCourses[0]);
      }
    }
  };

  return (
    <div className="space-y-8 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
      {/* Dynamic Header exactly resembling Image 1 & 11 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg border border-blue-100/40">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded">
                BOOST CAREER
              </span>
            </div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900 tracking-tight mt-1">
              Skills Development Programs
            </h2>
            <p className="text-slate-500 text-xs font-semibold">
              Build in-demand skills for career growth and future opportunities.
            </p>
          </div>
        </div>

        {/* Horizontal Divider Line Accent */}
        <div className="hidden lg:block flex-1 max-w-xs h-[1px] bg-blue-100 mx-6" />

        {/* Highlight Pills */}
        <div className="flex flex-wrap gap-2">
          {["Expert Trainers", "Hands-on Projects", "Industry Certifications", "Job Placement"].map((tag) => (
            <span
              key={tag}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded flex items-center shadow-3xs"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Grid of Domain Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {domains.map((domain, index) => {
          const IconComponent = domain.icon;
          return (
            <motion.div
              key={index}
              whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(37, 99, 235, 0.05)" }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="bg-slate-50/50 border border-slate-200 rounded-xl overflow-hidden hover:bg-white transition-all cursor-pointer flex flex-col group"
              onClick={() => handleDomainClick(domain)}
            >
              {/* Domain Image Block with subtle gradient overlay */}
              <div className="h-44 relative overflow-hidden bg-slate-200">
                {!imageErrors[domain.title] ? (
                  <img
                    src={domain.image}
                    alt={domain.title}
                    onError={() => {
                      setImageErrors((prev) => ({ ...prev, [domain.title]: true }));
                    }}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <LocalGraphic title={domain.title} className="w-full h-full" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/40 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/95 backdrop-blur-xs text-[10px] text-slate-800 font-bold px-2 py-0.5 rounded shadow-sm">
                    {domain.techTags[0]}
                  </span>
                </div>
              </div>

              {/* Card Contents */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-display font-medium text-xs text-slate-950 group-hover:text-blue-600 transition-colors leading-tight">
                      {domain.title}
                    </h3>
                  </div>

                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    {domain.desc}
                  </p>
                </div>

                {/* Sub Tech tags list & Action Button row */}
                <div className="pt-4 mt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1 max-w-[70%]">
                    {domain.techTags.slice(1, 4).map((tech, tIdx) => (
                      <span key={tIdx} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center shadow-sm select-none group-hover:bg-blue-500"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

