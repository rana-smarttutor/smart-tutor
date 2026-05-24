"use client";

import { useEffect, useState, useMemo } from "react";

import { CourseCatalog } from "@/components/course-catalog";
import type { CourseItem } from "@/lib/types";

const COURSE_CACHE_KEY = "smart-tutor-course-cache-v4";

const TABS = [
  "Class 6-8",
  "Class 9-10",
  "Class 11-12",
  "Graduation",
  "Post Grad",
  "Govt Exams",
  "Skills"
];

type CourseCatalogClientProps = {
  initialCourses: CourseItem[];
};

export function CourseCatalogClient({ initialCourses }: CourseCatalogClientProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(COURSE_CACHE_KEY);

      if (cached) {
        const parsed = JSON.parse(cached) as CourseItem[];

        if (Array.isArray(parsed) && parsed.length) {
          setCourses(parsed);
        }
      }
    } catch {
      // Ignore malformed cache and refetch fresh data.
    }

    let isMounted = true;

    async function refreshCourses() {
      setIsRefreshing(true);

      try {
        const response = await fetch("/api/courses/details", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        const payload = (await response.json()) as { courses?: CourseItem[] };

        if (!response.ok || !payload.courses || !isMounted) {
          return;
        }

        setCourses(payload.courses);
        window.localStorage.setItem(COURSE_CACHE_KEY, JSON.stringify(payload.courses));
      } catch {
        // Keep current or cached catalog if refresh fails.
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    }

    void refreshCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        course.title.toLowerCase().includes(query) ||
        course.summary.toLowerCase().includes(query) ||
        course.subjectsCovered.some(s => s.toLowerCase().includes(query)) ||
        course.courseNamesIncluded.some(c => c.toLowerCase().includes(query))
      );

      if (searchQuery) return matchesSearch;
      return course.sections && course.sections.includes(activeTab);
    });
  }, [courses, activeTab, searchQuery]);

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="surface-soft inline-flex items-center gap-3 rounded-full px-4 py-2.5 w-fit">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
            <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-heading)]">
              {isRefreshing ? "Refreshing courses..." : "Live course catalog"}
            </p>
          </div>

          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search skills, exams, or boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border-2 border-blue-100 bg-white px-6 py-2.5 pl-12 text-sm font-medium transition-all focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-50"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <nav 
          className="flex overflow-x-auto pb-4 lg:pb-0 no-scrollbar gap-2 sm:gap-3 -mx-6 px-6 lg:mx-0 lg:px-0 lg:flex-wrap items-center" 
          aria-label="Course Categories"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                  : "surface-soft text-[var(--color-muted)] hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {filteredCourses.length > 0 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!searchQuery && (
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black tracking-tight text-[var(--color-heading)] sm:text-3xl">
                  {activeTab} Programs
                </h2>
                <div className="h-px flex-grow bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-900/50" />
              </div>
            )}
            <CourseCatalog courses={filteredCourses} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center surface-soft rounded-[2rem] border-2 border-dashed border-blue-100">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-[var(--color-heading)]">New Courses Coming Soon</h3>
            <p className="mt-2 text-[var(--color-muted)] max-w-sm">
              We are currently finalizing our premium curriculum for {activeTab}. Please check back in a few days or contact us for early enrollment.
            </p>
          </div>
        )}
      </div>

      <div className="surface-soft rounded-[2rem] p-8 border-2 border-blue-50">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="bg-blue-600 text-white h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-200 shrink-0">
            💡
          </div>
          <div>
            <h4 className="text-lg font-bold text-[var(--color-heading)]">Can&apos;t find what you&apos;re looking for?</h4>
            <p className="mt-1 text-sm text-[var(--color-muted)] leading-relaxed">
              Our mentorship extends beyond these listed courses. We specialize in personalized learning paths tailored to your specific academic goals and career aspirations. Connect with our expert counselors to design your custom learning roadmap.
            </p>
          </div>
          <a
            href="/contact"
            className="lg:ml-auto shrink-0 action-button px-8 py-3.5 whitespace-nowrap"
          >
            Request Custom Program
          </a>
        </div>
      </div>
    </div>
  );
}
