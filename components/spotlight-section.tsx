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

type SeniorClassSelection = "Class 11" | "Class 12";

interface SpotlightSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectCourse: (course: CourseItem) => void;
  allCourses: CourseItem[];
  onSeniorClassChange?: (seniorClass: SeniorClassSelection) => void;
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

  const TAB_SECTION_MAP: Record<string, string[]> = {
    class6: ["class6"],
    class7: ["class7"],
    class8: ["class8"],
    class9: ["class9", "class910"],
    class10: ["class10", "class910"],
    class11: ["class11", "class1112"],
    class12: ["class12", "class1112"],
  };

  const allowedSections = TAB_SECTION_MAP[activeTabKey] ?? [activeTabKey];

  return sections.some((section) => {
    const sectionKey = normaliseValue(section);
    return allowedSections.includes(sectionKey);
  });
}

function matchesSelectedStream(course: CourseItem, stream: StreamFilter) {
  if (stream === "All") {
    return true;
  }
function isPreferredCommerceSpotlight(course: CourseItem) {
  const title = normaliseValue(course.title);
  const stream = normaliseValue(course.stream);

  return (
    stream === "commerce" &&
    title.includes("foundationforcacscma")
  );
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

function isPreferredCommerceSpotlight(course: CourseItem) {
  const title = normaliseValue(course.title);
  const stream = normaliseValue(course.stream);

  return (
    stream === "commerce" &&
    title.includes("foundationforcacscma")
  );
}

const SECTION_SPOTLIGHT_IMAGES: Record<string, string> = {
  "Class 6": "/spotlight/class 6 new.png",
  "Class 7": "/spotlight/class 7 new.png",
  "Class 8": "/spotlight/class 8 new.png",
  "Class 9": "/spotlight/class 9 new.png",
  "Class 10": "/spotlight/class 10 new.png",
  "Class 11": "/spotlight/class 11.png",
  "Class 12": "/spotlight/class 12 new.png",
  Skills: "/spotlight/skills.png",
  "Govt Exams": "/spotlight/govt-exams.jpeg",
};

export default function SpotlightSection({
  activeTab,
  setActiveTab,
  onSelectCourse,
  allCourses,
  onSeniorClassChange,
}: SpotlightSectionProps) {
  const tabs = [
    { id: "Class 6", label: "Class 6", icon: BookOpen },
    { id: "Class 7", label: "Class 7", icon: BookOpen },
    { id: "Class 8", label: "Class 8", icon: BookOpen },
    { id: "Class 9", label: "Class 9", icon: School },
    { id: "Class 10", label: "Class 10", icon: School },
    { id: "Class 11", label: "Class 11", icon: FlaskConical },
    { id: "Class 12", label: "Class 12", icon: FlaskConical },
    { id: "Govt Exams", label: "Govt Exams", icon: FileText },
    { id: "Skills", label: "Skills Section", icon: Brain },
  ];

  const [tabCourses, setTabCourses] = useState<CourseItem[]>([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [activeStream, setActiveStream] = useState<StreamFilter>("All");
  const [showAllCourses, setShowAllCourses] = useState(false);

  useEffect(() => {
    setShowAllCourses(false);
  }, [activeTab]);

  useEffect(() => {
    const filteredCourses = allCourses.filter((course) => {
      if (!matchesActiveTab(course, activeTab)) {
        return false;
      }

      if (activeTab !== "Class 11" && activeTab !== "Class 12") {
        return true;
      }

      return matchesSelectedStream(course, activeStream);
    });

    const priorityKeys: Record<string, string> = {
      "Class 6": "class-6-academic",
      "Class 7": "class-7-regular-academic",
      "Class 8": "class-8-regular-academic",
      "Class 9": "class-9-regular-academic",
      "Class 10": "class-10-regular-academic",
      "Class 11": "class-11-boards",
      "Class 12": "class-12-boards",
    };

    const priorityStandardKey = priorityKeys[activeTab] ?? null;

if (priorityStandardKey) {
  filteredCourses.sort((firstCourse, secondCourse) => {
    const isFirstPriority =
      firstCourse.standardKey === priorityStandardKey;

    const isSecondPriority =
      secondCourse.standardKey === priorityStandardKey;

    if (isFirstPriority && !isSecondPriority) {
      return -1;
    }

    if (!isFirstPriority && isSecondPriority) {
      return 1;
    }

    return 0;
  });
}

if ((activeTab === "Class 11" || activeTab === "Class 12") && activeStream === "Commerce") {
  filteredCourses.sort((firstCourse, secondCourse) => {
    const firstIsPreferred =
      isPreferredCommerceSpotlight(firstCourse);

    const secondIsPreferred =
      isPreferredCommerceSpotlight(secondCourse);

    if (firstIsPreferred && !secondIsPreferred) {
      return -1;
    }

    if (!firstIsPreferred && secondIsPreferred) {
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
  useEffect(() => {
  if (activeTab !== "Class 11-12" || !currentSpotlight) {
    return;
  }

  const text = [
    currentSpotlight.standardKey,
    currentSpotlight.title,
    currentSpotlight.audienceLabel,
    ...(currentSpotlight.sections ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const isClass12 =
    text.includes("class-12") ||
    text.includes("class 12") ||
    text.includes("class12");

  onSeniorClassChange?.(isClass12 ? "Class 12" : "Class 11");
}, [activeTab, currentSpotlight, onSeniorClassChange]);

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
      case "Class 6":
        return {
          title: "Class 6 Programs",
          desc: "Build a strong foundation for future success.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: BookOpen,
        };

      case "Class 7":
        return {
          title: "Class 7 Programs",
          desc: "Build a strong foundation for future success.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: BookOpen,
        };

      case "Class 8":
        return {
          title: "Class 8 Programs",
          desc: "Build a strong foundation for future success.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: BookOpen,
        };

      case "Class 9":
        return {
          title: "Class 9 Programs",
          desc: "Master key concepts and excel in board exams.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: School,
        };

      case "Class 10":
        return {
          title: "Class 10 Programs",
          desc: "Master key concepts and excel in board exams.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: School,
        };

      case "Class 11":
        return {
          title: "Class 11 Programs",
          desc: "Build a strong foundation for Class 11 board exams and competitive entrances.",
          logoBg: "bg-blue-50 text-blue-600",
          logo: FlaskConical,
        };

      case "Class 12":
        return {
          title: "Class 12 Programs",
          desc: "Final year prep for boards, entrances, and career pathways.",
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
                    {activeTab} Programs
                  </span>

                  <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {currentSpotlight.duration}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold leading-tight text-slate-900">
                  {currentSpotlight.title}
                </h3>

                <p className="text-xs font-semibold leading-relaxed text-slate-500">
                  {currentSpotlight.summary}
                </p>

                {/* Course names as clickable buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentSpotlight.courseNamesIncluded.map((name) => (
                    <motion.button
                      key={name}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSelectCourse(currentSpotlight)}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm"
                    >
                      {name}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-4 sm:flex-row">
                <div className="w-full text-left sm:w-auto">
                  <span className="block text-[9px] font-bold uppercase leading-none text-slate-400">
                    Mode
                  </span>

                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {currentSpotlight.mode.split("/").map((m) => (
                      <span key={m.trim()} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {m.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex w-full justify-end sm:w-auto">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectCourse(currentSpotlight)}
                    className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-md bg-blue-600 px-5 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-500 sm:w-auto"
                  >
                    <span>Enroll Now</span>
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

      {activeTab === "Skills" && tabCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tabCourses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ y: -2 }}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  {course.duration}
                </span>
                <span className="rounded bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {course.mode.split("/")[0]}
                </span>
              </div>

              <h5 className="font-display text-sm font-bold leading-snug text-slate-900">
                {course.title}
              </h5>

              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                {course.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {course.courseNamesIncluded.map((name) => (
                  <motion.button
                    key={name}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelectCourse(course)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-100 hover:border-blue-300"
                  >
                    {name}
                  </motion.button>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                  {course.mode}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectCourse(course)}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-800"
                >
                  Enroll Now
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

 

      {activeTab !== "Class 11-12" && tabCourses.length > 1 && (
        <div className="space-y-4 pt-4">
          <h4 className="font-display text-xs font-semibold uppercase tracking-tight text-slate-900">
            Additional Programs in {activeTab}
          </h4>

          {(() => {
            const threshold = activeTab === "Skills" ? 4 : 6;
            const otherCourses = tabCourses.filter(
              (_, i) => i !== spotlightIndex,
            );
            const visibleCourses = showAllCourses
              ? otherCourses
              : otherCourses.slice(0, threshold);
            const hiddenCount = otherCourses.length - visibleCourses.length;

            return (
              <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => {
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
                    <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {course.duration}
                    </span>

                    <h5 className="font-display text-[14px] font-bold leading-tight text-slate-800">
                      {course.title}
                    </h5>

                    <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
                      {course.summary}
                    </p>

                    {/* Course names as buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {course.courseNamesIncluded.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => onSelectCourse(course)}
                          className="rounded-md border border-blue-100 bg-blue-50/50 px-2.5 py-1 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap gap-1">
                      {course.mode.split("/").map((m) => (
                        <span key={m.trim()} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500">
                          {m.trim()}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectCourse(course)}
                      className="flex cursor-pointer items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      <span>Enroll</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

                {hiddenCount > 0 && activeTab !== "Skills" && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllCourses(!showAllCourses)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-200"
                    >
                      {showAllCourses ? (
                        <>Show Less</>
                      ) : (
                        <>Show All {otherCourses.length} Courses</>
                      )}
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          showAllCourses ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

    </div>
  );
}
