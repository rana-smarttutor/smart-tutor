"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  School,
  FileText,
  Award,
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  FlaskConical,
  Coins,
  History
} from "@/components/ui-icons";
import { motion, AnimatePresence } from "motion/react";
import { CourseItem } from "@/lib/types";
import LocalGraphic from "@/components/local-graphic";

interface SpotlightSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectCourse: (course: CourseItem) => void;
  allCourses: CourseItem[];
}

type StreamFilter = "Science" | "Commerce" | "Arts" | "All";

function normaliseValue(value?: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function matchesActiveTab(course: CourseItem, activeTab: string) {
  const activeTabKey = normaliseValue(activeTab);

  return (course.sections ?? []).some((section) => {
    const sectionKey = normaliseValue(section);

    return (
      sectionKey === activeTabKey ||
      sectionKey.startsWith(activeTabKey)
    );
  });
}

function matchesSelectedStream(course: CourseItem, stream: StreamFilter) {
  if (stream === "All") {
    return true;
  }

  const selectedStreamKey = normaliseValue(stream);
  const courseStreamKey = normaliseValue(course.stream);

  // First priority: exact stream field matching.
  if (courseStreamKey === selectedStreamKey) {
    return true;
  }

  // Backup matching for old / differently named course entries.
  const searchableText = normaliseValue(
    [
      course.stream,
      course.title,
      course.summary,
      course.description,
      course.audienceLabel,
      ...(course.subjectsCovered ?? []),
      ...(course.branchesIncluded ?? []),
      ...(course.courseNamesIncluded ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );

  const keywords: Record<Exclude<StreamFilter, "All">, string[]> = {
    Science: [
      "science",
      "pcm",
      "pcb",
      "jee",
      "neet",
      "physics",
      "chemistry",
      "biology",
      "mathematics",
      "computerscience",
    ],
    Commerce: [
      "commerce",
      "accountancy",
      "accounts",
      "economics",
      "businessstudies",
      "cafoundation",
      "csfoundation",
      "cseet",
      "businessmath",
    ],
    Arts: [
      "arts",
      "humanities",
      "clat",
      "literature",
      "history",
      "psychology",
      "sociology",
      "politicalscience",
      "finearts",
      "visualarts",
    ],
  };

  return keywords[stream].some((keyword) =>
    searchableText.includes(keyword),
  );
}

export default function SpotlightSection({
  activeTab,
  setActiveTab,
  onSelectCourse,
  allCourses
}: SpotlightSectionProps) {
  // Tabs representing different educational groups
  const tabs = [
    { id: "Class 6-8", label: "Class 6-8", icon: BookOpen },
    { id: "Class 9-10", label: "Class 9-10", icon: School },
    { id: "Class 11-12", label: "Class 11-12", icon: FlaskConical },
    { id: "Graduation", label: "Graduation / UG", icon: Layers },
    { id: "Post Grad", label: "Post Graduate", icon: Award },
    { id: "Govt Exams", label: "Govt Exams", icon: FileText },
    { id: "Skills", label: "Skills Section", icon: Brain },
  ];

  // Map to track image errors
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // List of courses matching active tab
  const [tabCourses, setTabCourses] = useState<CourseItem[]>([]);
  // Index of currently spotlighted course in that section list
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Active stream filter state (specifically for Class 11-12)
  const [activeStream, setActiveStream] = useState<"Science" | "Commerce" | "Arts" | "All">("All");

console.log(
  "Commerce courses received:",
  allCourses.filter(
    (course) =>
      course.sections?.includes("Class 11-12") &&
      course.stream === "Commerce",
  ),
);

useEffect(() => {
  const filteredCourses = allCourses.filter((course) => {
    const belongsToSelectedTab = matchesActiveTab(course, activeTab);

    if (!belongsToSelectedTab) {
      return false;
    }

    if (activeTab !== "Class 11-12") {
      return true;
    }

    return matchesSelectedStream(course, activeStream);
  });

  setTabCourses(filteredCourses);
  setSpotlightIndex(0);
}, [activeTab, activeStream, allCourses]);
  // Handle changing stream
const handleStreamClick = (
  stream: Exclude<StreamFilter, "All">,
) => {
  setActiveStream((currentStream) =>
    currentStream === stream ? "All" : stream,
  );
};

  const currentSpotlight = tabCourses[spotlightIndex];

  // Rotate spotlight index
  const nextSpotlight = () => {
    if (tabCourses.length > 1) {
      setSpotlightIndex((prev) => (prev + 1) % tabCourses.length);
    }
  };

  const prevSpotlight = () => {
    if (tabCourses.length > 1) {
      setSpotlightIndex((prev) => (prev - 1 + tabCourses.length) % tabCourses.length);
    }
  };

  // Get illustrative section metadata based on active tab
  const getSectionMetadata = () => {
    switch (activeTab) {
      case "Class 6-8":
        return {
          title: "Class 6-8 Programs",
          desc: "Build a strong foundation for future success.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: BookOpen,
        };
      case "Class 9-10":
        return {
          title: "Class 9-10 Programs",
          desc: "Master key concepts and excel in board exams.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: School,
        };
      case "Class 11-12":
        return {
          title: "Class 11-12 Programs",
          desc: "Advanced preparation for boards and professional entrances.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: FlaskConical,
        };
      case "Graduation":
        return {
          title: "Graduation Programs",
          desc: "Empowering undergraduates with elite career pathways.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: Layers,
        };
      case "Post Grad":
        return {
          title: "Postgraduate Programs",
          desc: "Advance your expertise with customized administrative paths.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: Award,
        };
      case "Govt Exams":
        return {
          title: "Government Exam Targets",
          desc: "Your secure and rewarding path to public service roles.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: FileText,
        };
      default:
        return {
          title: "Professional Skills Development",
          desc: "Learn from top corporate experts and earn valid certifications.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: Brain,
        };
    }
  };

  const sectionMeta = getSectionMetadata();
  const SectionLogo = sectionMeta.logo;

  // Selected preset Unsplash premium images matching typical courses in library
  const getSuggestedImage = (course: CourseItem) => {
    if (!course) return "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600";
    const title = course.title.toLowerCase();
    if (title.includes("scientist") || title.includes("robotics") || title.includes("coding") || title.includes("tech")) {
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600";
    }
    if (title.includes("financial") || title.includes("accounting") || title.includes("ledger") || title.includes("budgeting")) {
      return "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600";
    }
    if (title.includes("chemistry") || title.includes("science") || title.includes("boards") || title.includes("neet")) {
      return "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600";
    }
    if (title.includes("upsc") || title.includes("govt") || title.includes("mpsc")) {
      return "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600";
    }
    if (title.includes("speaking") || title.includes("personality") || title.includes("english")) {
      return "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600";
    }
    return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600";
  };

  return (
    <div className="space-y-8">
      {/* 1. Category Tabs Navigation - exactly as per specifications */}
      <div className="bg-white border border-slate-200 p-2 rounded-xl shadow-sm overflow-x-auto no-scrollbar scroll-smooth flex space-x-2">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActiveStream("All");
              }}
              style={{ height: "42px" }}
              className={`flex items-center space-x-2 px-5 rounded-lg cursor-pointer whitespace-nowrap text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Section Header and Carousel Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`${sectionMeta.logoBg} p-3.5 rounded-2xl shadow-sm flex items-center justify-center`}>
            <SectionLogo className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight leading-tight">
              {sectionMeta.title}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              {sectionMeta.desc}
            </p>
          </div>
        </div>

        {/* Dynamic horizontal separator line */}
        <div className="hidden lg:block flex-1 h-[2px] bg-slate-100 mx-6" />

        {/* Action Carousel navigation buttons */}
        <div className="flex items-center space-x-3 self-end md:self-center">
          <span className="text-[10px] text-slate-400 font-bold font-mono">
            {tabCourses.length > 0 ? `${spotlightIndex + 1} / ${tabCourses.length}` : "No Programs"}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={prevSpotlight}
              disabled={tabCourses.length <= 1}
              className={`w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer ${
                tabCourses.length <= 1 ? "opacity-45 cursor-not-allowed" : ""
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSpotlight}
              disabled={tabCourses.length <= 1}
              className={`w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer ${
                tabCourses.length <= 1 ? "opacity-45 cursor-not-allowed" : ""
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Featured Program Spotlight Card */}
      <AnimatePresence mode="wait">
        {currentSpotlight ? (
          <motion.div
            key={currentSpotlight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12"
          >
            {/* Image Box */}
            <div className="md:col-span-5 relative h-64 md:h-full bg-slate-50 min-h-[280px]">
              {!imageErrors[currentSpotlight.id] ? (
                <img
                  src={getSuggestedImage(currentSpotlight)}
                  alt={currentSpotlight.title}
                  onError={() => {
                    setImageErrors((prev) => ({ ...prev, [currentSpotlight.id]: true }));
                  }}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <LocalGraphic title={currentSpotlight.title} className="w-full h-full" />
              )}
              <div className="absolute inset-0 bg-linear-to-r from-slate-900/40 via-transparent to-transparent hidden md:block" />
              <div className="absolute top-4 left-4">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  {currentSpotlight.statusLabel}
                </span>
              </div>
            </div>

            {/* Program Details Area */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                    {activeTab} SPOTLIGHT
                  </span>
                  {currentSpotlight.stream !== "General" && (
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                      {currentSpotlight.stream} STREAM
                    </span>
                  )}
                  <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200 uppercase tracking-wider">
                    {currentSpotlight.duration}
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">
                  {currentSpotlight.title}
                </h3>

                <p className="text-slate-500 text-xs sm:text-xs font-semibold leading-relaxed">
                  {currentSpotlight.description}
                </p>

                {/* Sub feature tags exactly mapping Image Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center space-x-3">
                    <div className="bg-white text-blue-600 p-1.5 rounded border border-slate-200 flex-shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block leading-none uppercase">STREAM COURSES</span>
                      <span className="text-[11px] text-slate-700 font-semibold block leading-tight truncate mt-0.5 max-w-[200px]">
                        {currentSpotlight.courseNamesIncluded.slice(0, 2).join(" & ")}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center space-x-3">
                    <div className="bg-white text-blue-600 p-1.5 rounded border border-slate-200 flex-shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block leading-none uppercase">TEST & TRACKING</span>
                      <span className="text-[11px] text-slate-700 font-semibold block leading-tight truncate mt-0.5">
                        Weekly Concept Mocks
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row with main button */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-[9px] text-slate-400 font-bold block leading-none uppercase">FORMAT</span>
                  <span className="text-xs text-slate-700 font-bold block mt-0.5">{currentSpotlight.mode}</span>
                </div>

                <div className="flex w-full sm:w-auto justify-end">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectCourse(currentSpotlight)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2.5 px-5 rounded-md flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>View Full Selector</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 p-12 text-center rounded-xl">
            <p className="text-slate-400 text-xs font-semibold">No featured programs available for this selection.</p>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Stream Cards Selection (Specifically for Class 11-12) as per specifications */}
      {activeTab === "Class 11-12" && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-slate-800 text-xs font-bold tracking-tight">Browse Stream Majors:</span>
            <span className="text-[9px] bg-slate-100 text-slate-500 font-bold uppercase py-0.5 px-2 rounded-md">
              Click to Filter Spotlight
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Science Major */}
            <motion.div
              whileHover={{ y: -3, border: "1px solid #6366f1" }}
              onClick={() => handleStreamClick("Science")}
              className={`border p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                activeStream === "Science" ? "bg-blue-50/40 border-blue-500" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg flex items-center justify-center">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900">Science Stream</h4>
                    <span className="text-[9px] text-slate-400 block leading-none mt-0.5">IIT-JEE / NEET / Boards</span>
                  </div>
                </div>
                <div className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded">HSC/CBSE</div>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                Physics, Chemistry, Mathematics, Biology & Specialized Computer Science labs.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-blue-600 font-bold text-[9px] uppercase">Highly Popular</span>
                <div className={`w-6 h-6 rounded-md text-white flex items-center justify-center shadow-xs transition-colors ${
                  activeStream === "Science" ? "bg-blue-600" : "bg-slate-200 text-slate-400"
                }`}>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>

            {/* Commerce Major */}
            <motion.div
              whileHover={{ y: -3, border: "1px solid #6366f1" }}
              onClick={() => handleStreamClick("Commerce")}
              className={`border p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                activeStream === "Commerce" ? "bg-blue-50/40 border-blue-500" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900">Commerce Stream</h4>
                    <span className="text-[9px] text-slate-400 block leading-none mt-0.5">CA/CS Base & Audit</span>
                  </div>
                </div>
                <div className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded">HSC/CBSE</div>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                Advanced Accountancy, Business Studies, Economics & Professional Math tracks.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-blue-600 font-bold text-[9px] uppercase">Corporate Path</span>
                <div className={`w-6 h-6 rounded-md text-white flex items-center justify-center shadow-xs transition-colors ${
                  activeStream === "Commerce" ? "bg-blue-600" : "bg-slate-200 text-slate-400"
                }`}>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>

            {/* Arts Major */}
            <motion.div
              whileHover={{ y: -3, border: "1px solid #6366f1" }}
              onClick={() => handleStreamClick("Arts")}
              className={`border p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                activeStream === "Arts" ? "bg-blue-50/40 border-blue-500" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900">Arts Stream</h4>
                    <span className="text-[9px] text-slate-400 block leading-none mt-0.5">CLAT & Administrative</span>
                  </div>
                </div>
                <div className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded">HSC/State</div>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
                Drawing, Applied Arts, Fine Arts, Design sensitivity & Literature foundations.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-blue-600 font-bold text-[9px] uppercase">Creative Lead</span>
                <div className={`w-6 h-6 rounded-md text-white flex items-center justify-center shadow-xs transition-colors ${
                  activeStream === "Arts" ? "bg-blue-600" : "bg-slate-200 text-slate-400"
                }`}>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* 5. Sub grid of other courses targeting this active tab section */}
      {tabCourses.length > 1 && (
        <div className="space-y-4 pt-4">
          <h4 className="font-display font-semibold text-xs text-slate-900 tracking-tight uppercase">
            Additional Programs in {activeTab}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tabCourses.map((course, idx) => {
              if (idx === spotlightIndex) return null; // skip current highlighted
              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)" }}
                  className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-slate-50 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                        {course.stream} Stream
                      </span>
                      <span className="text-slate-400 text-[9px] font-bold">{course.duration}</span>
                    </div>

                    <h5 className="font-display font-bold text-[14px] text-slate-800 leading-tight">
                      {course.title}
                    </h5>

                    <p className="text-slate-500 text-[11px] font-medium leading-relaxed line-clamp-2">
                      {course.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                      {course.mode}
                    </span>
                    <button
                      onClick={() => onSelectCourse(course)}
                      className="text-xs text-blue-600 font-bold flex items-center space-x-1 hover:text-blue-700 cursor-pointer"
                    >
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
