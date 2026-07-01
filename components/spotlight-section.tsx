"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  FlaskConical,
  History,
  School,
  Sparkles,
  TrendingUp,
} from "@/components/ui-icons";
import { AnimatePresence, motion } from "motion/react";

import type { CourseItem } from "@/lib/types";
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
  const sections = course.sections ?? [];
  const hasSkillsSection = sections.some((s) => normaliseValue(s) === "skills");

  // Skills courses only show under the "Skills" tab, not under class tabs
  if (hasSkillsSection && activeTabKey !== "skills") {
    return false;
  }

  return sections.some((section) => {
    const sectionKey = normaliseValue(section);

    return sectionKey === activeTabKey || sectionKey.startsWith(activeTabKey);
  });
}

function matchesSelectedStream(course: CourseItem, stream: StreamFilter) {
  if (stream === "All") {
    return true;
  }

  const selectedStreamKey = normaliseValue(stream);
  const courseStreamKey = normaliseValue(course.stream);

  if (courseStreamKey === selectedStreamKey) {
    return true;
  }

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

  return keywords[stream].some((keyword) => searchableText.includes(keyword));
}

const SECTION_SPOTLIGHT_IMAGES: Record<string, string> = {
  "Class 6-8": "/spotlight/class-6-8.jpeg",
  "Class 9-10": "/spotlight/class-9-10.jpeg",
  "Class 11-12": "/spotlight/class-11-12.jpeg",
  Skills: "/spotlight/skills.png",
  "Govt Exams": "/spotlight/govt-exams.jpeg",
};

export default function SpotlightSection({
  activeTab,
  setActiveTab,
  onSelectCourse,
  allCourses,
}: SpotlightSectionProps) {
  const tabs = [
    { id: "Class 6-8", label: "Class 6-8", icon: BookOpen },
    { id: "Class 9-10", label: "Class 9-10", icon: School },
    { id: "Class 11-12", label: "Class 11-12", icon: FlaskConical },
    { id: "Govt Exams", label: "Govt Exams", icon: FileText },
    { id: "Skills", label: "Skills Section", icon: Brain },
  ];

  const [tabCourses, setTabCourses] = useState<CourseItem[]>([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [activeStream, setActiveStream] = useState<StreamFilter>("All");

  useEffect(() => {
    const filteredCourses = allCourses.filter((course) => {
      if (!matchesActiveTab(course, activeTab)) {
        return false;
      }

      if (activeTab !== "Class 11-12") {
        return true;
      }

      return matchesSelectedStream(course, activeStream);
    });

    const priorityStandardKey =
      activeTab === "Class 6-8" ? "class-6-8-regular-academic" : null;

    if (priorityStandardKey) {
      filteredCourses.sort((firstCourse, secondCourse) => {
        const isFirstPriority =
          firstCourse.standardKey === priorityStandardKey ||
          firstCourse.title === "Class 6th-8th Regular Academic (State/CBSE)";

        const isSecondPriority =
          secondCourse.standardKey === priorityStandardKey ||
          secondCourse.title === "Class 6th-8th Regular Academic (State/CBSE)";

        if (isFirstPriority && !isSecondPriority) {
          return -1;
        }

        if (!isFirstPriority && isSecondPriority) {
          return 1;
        }

        return 0;
      });
    }

    setTabCourses(filteredCourses);
    setSpotlightIndex(0);
  }, [activeTab, activeStream, allCourses]);

  const handleStreamClick = (stream: Exclude<StreamFilter, "All">) => {
    setActiveStream((currentStream) =>
      currentStream === stream ? "All" : stream,
    );
  };

  const currentSpotlight = tabCourses[spotlightIndex];

  const nextSpotlight = () => {
    if (tabCourses.length > 1) {
      setSpotlightIndex(
        (previousIndex) => (previousIndex + 1) % tabCourses.length,
      );
    }
  };

  const prevSpotlight = () => {
    if (tabCourses.length > 1) {
      setSpotlightIndex(
        (previousIndex) =>
          (previousIndex - 1 + tabCourses.length) % tabCourses.length,
      );
    }
  };

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

  const getSuggestedImage = (course: CourseItem) => {
    if (!course) {
      return "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600";
    }

    const title = course.title.toLowerCase();

    if (
      title.includes("scientist") ||
      title.includes("robotics") ||
      title.includes("coding") ||
      title.includes("tech")
    ) {
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600";
    }

    if (
      title.includes("financial") ||
      title.includes("accounting") ||
      title.includes("ledger") ||
      title.includes("budgeting")
    ) {
      return "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600";
    }

    if (
      title.includes("chemistry") ||
      title.includes("science") ||
      title.includes("boards") ||
      title.includes("neet")
    ) {
      return "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600";
    }

    if (
      title.includes("upsc") ||
      title.includes("govt") ||
      title.includes("mpsc")
    ) {
      return "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600";
    }

    if (
      title.includes("speaking") ||
      title.includes("personality") ||
      title.includes("english")
    ) {
      return "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600";
    }

    return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600";
  };

  return (
    <div className="space-y-8">
      <div className="no-scrollbar flex space-x-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setActiveStream("All");
              }}
              style={{ height: "42px" }}
              className={`flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-lg px-5 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={`${sectionMeta.logoBg} flex items-center justify-center rounded-2xl p-3.5 shadow-sm`}
          >
            <SectionLogo className="h-7 w-7" />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-slate-900">
              {sectionMeta.title}
            </h2>

            <p className="text-xs font-medium text-slate-500 md:text-sm">
              {sectionMeta.desc}
            </p>
          </div>
        </div>

        <div className="mx-6 hidden h-[2px] flex-1 bg-slate-100 lg:block" />

        <div className="flex self-end space-x-3 md:self-center">
          <span className="font-mono text-[10px] font-bold text-slate-400">
            {tabCourses.length > 0
              ? `${spotlightIndex + 1} / ${tabCourses.length}`
              : "No Programs"}
          </span>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={prevSpotlight}
              disabled={tabCourses.length <= 1}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white transition-all hover:bg-slate-50 hover:text-blue-600 ${
                tabCourses.length <= 1 ? "cursor-not-allowed opacity-45" : ""
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={nextSpotlight}
              disabled={tabCourses.length <= 1}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white transition-all hover:bg-slate-50 hover:text-blue-600 ${
                tabCourses.length <= 1 ? "cursor-not-allowed opacity-45" : ""
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentSpotlight ? (
          <motion.div
            key={currentSpotlight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-12"
          >
            <div className="relative min-h-[280px] h-64 bg-slate-50 md:col-span-5 md:h-full">
              <Image
                src={
                  SECTION_SPOTLIGHT_IMAGES[activeTab] ||
                  "/spotlight/class-6-8.jpg"
                }
                alt={`${activeTab} programs`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover object-center"
              />

              <div className="absolute inset-0 hidden bg-linear-to-r from-slate-900/40 via-transparent to-transparent md:block" />

              <div className="absolute left-4 top-4">
                <span className="flex items-center gap-1.5 rounded bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  {currentSpotlight.statusLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-6 p-6 md:col-span-7 sm:p-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    {activeTab} Spotlight
                  </span>

                  {currentSpotlight.stream !== "General" && (
                    <span className="rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {currentSpotlight.stream} Stream
                    </span>
                  )}

                  <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {currentSpotlight.duration}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold leading-tight text-slate-900">
                  {currentSpotlight.title}
                </h3>

                <p className="text-xs font-semibold leading-relaxed text-slate-500">
                  {currentSpotlight.description}
                </p>

                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                  <div className="flex items-center space-x-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="shrink-0 rounded border border-slate-200 bg-white p-1.5 text-blue-600">
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold uppercase leading-none text-slate-400">
                        Stream Courses
                      </span>

                      <span className="mt-0.5 block max-w-[200px] truncate text-[11px] font-semibold leading-tight text-slate-700">
                        {currentSpotlight.courseNamesIncluded
                          .slice(0, 2)
                          .join(" & ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="shrink-0 rounded border border-slate-200 bg-white p-1.5 text-blue-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold uppercase leading-none text-slate-400">
                        Test & Tracking
                      </span>

                      <span className="mt-0.5 block text-[11px] font-semibold leading-tight text-slate-700">
                        Weekly Concept Mocks
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-4 sm:flex-row">
                <div className="w-full text-left sm:w-auto">
                  <span className="block text-[9px] font-bold uppercase leading-none text-slate-400">
                    Format
                  </span>

                  <span className="mt-0.5 block text-xs font-bold text-slate-700">
                    {currentSpotlight.mode}
                  </span>
                </div>

                <div className="flex w-full justify-end sm:w-auto">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectCourse(currentSpotlight)}
                    className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-md bg-blue-600 px-5 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-500 sm:w-auto"
                  >
                    <span>View Full Selector</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <p className="text-xs font-semibold text-slate-400">
              No featured programs available for this selection.
            </p>
          </div>
        )}
      </AnimatePresence>

      {activeTab === "Class 11-12" && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold tracking-tight text-slate-800">
              Browse Stream Majors:
            </span>

            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">
              Click to Filter Spotlight
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <motion.div
              whileHover={{ y: -3, border: "1px solid #6366f1" }}
              onClick={() => handleStreamClick("Science")}
              className={`flex cursor-pointer flex-col justify-between space-y-4 rounded-xl border p-4 shadow-xs transition-all ${
                activeStream === "Science"
                  ? "border-blue-500 bg-blue-50/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600">
                    <FlaskConical className="h-4 w-4" />
                  </div>

                  <div>
                    <h4 className="font-display text-xs font-bold text-slate-900">
                      Science Stream
                    </h4>

                    <span className="mt-0.5 block text-[9px] leading-none text-slate-400">
                      IIT-JEE / NEET / Boards
                    </span>
                  </div>
                </div>

                <div className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                  HSC/CBSE
                </div>
              </div>

              <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                Physics, Chemistry, Mathematics, Biology & Specialized Computer
                Science labs.
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] font-bold uppercase text-blue-600">
                  Highly Popular
                </span>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md shadow-xs transition-colors ${
                    activeStream === "Science"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, border: "1px solid #6366f1" }}
              onClick={() => handleStreamClick("Commerce")}
              className={`flex cursor-pointer flex-col justify-between space-y-4 rounded-xl border p-4 shadow-xs transition-all ${
                activeStream === "Commerce"
                  ? "border-blue-500 bg-blue-50/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Coins className="h-4 w-4" />
                  </div>

                  <div>
                    <h4 className="font-display text-xs font-bold text-slate-900">
                      Commerce Stream
                    </h4>

                    <span className="mt-0.5 block text-[9px] leading-none text-slate-400">
                      CA/CS Base & Audit
                    </span>
                  </div>
                </div>

                <div className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                  HSC/CBSE
                </div>
              </div>

              <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                Advanced Accountancy, Business Studies, Economics & Professional
                Math tracks.
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] font-bold uppercase text-blue-600">
                  Corporate Path
                </span>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md shadow-xs transition-colors ${
                    activeStream === "Commerce"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, border: "1px solid #6366f1" }}
              onClick={() => handleStreamClick("Arts")}
              className={`flex cursor-pointer flex-col justify-between space-y-4 rounded-xl border p-4 shadow-xs transition-all ${
                activeStream === "Arts"
                  ? "border-blue-500 bg-blue-50/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600">
                    <History className="h-4 w-4" />
                  </div>

                  <div>
                    <h4 className="font-display text-xs font-bold text-slate-900">
                      Arts Stream
                    </h4>

                    <span className="mt-0.5 block text-[9px] leading-none text-slate-400">
                      CLAT & Administrative
                    </span>
                  </div>
                </div>

                <div className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                  HSC/State
                </div>
              </div>

              <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                Drawing, Applied Arts, Fine Arts, Design sensitivity &
                Literature foundations.
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] font-bold uppercase text-blue-600">
                  Creative Lead
                </span>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md shadow-xs transition-colors ${
                    activeStream === "Arts"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {tabCourses.length > 1 && (
        <div className="space-y-4 pt-4">
          <h4 className="font-display text-xs font-semibold uppercase tracking-tight text-slate-900">
            Additional Programs in {activeTab}
          </h4>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tabCourses.map((course, courseIndex) => {
              if (courseIndex === spotlightIndex) {
                return null;
              }

              return (
                <motion.div
                  key={course.id}
                  whileHover={{
                    y: -3,
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
                  }}
                  className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        {course.stream} Stream
                      </span>

                      <span className="text-[9px] font-bold text-slate-400">
                        {course.duration}
                      </span>
                    </div>

                    <h5 className="font-display text-[14px] font-bold leading-tight text-slate-800">
                      {course.title}
                    </h5>

                    <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
                      {course.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {course.mode}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectCourse(course)}
                      className="flex cursor-pointer items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      <span>Explore</span>
                      <ChevronRight className="h-3.5 w-3.5" />
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
