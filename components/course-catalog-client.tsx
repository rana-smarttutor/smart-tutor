"use client";

import { useEffect, useState, useMemo } from "react";

import { CourseCatalog } from "@/components/course-catalog";
import type { CourseItem } from "@/lib/types";

const COURSE_CACHE_KEY = "smart-tutor-course-cache-v3";

type CourseCatalogClientProps = {
  initialCourses: CourseItem[];
};

export function CourseCatalogClient({ initialCourses }: CourseCatalogClientProps) {
  const [courses, setCourses] = useState(initialCourses);
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

  const categorizedCourses = useMemo(() => {
    const categories = [
      "School & Junior College",
      "Top Competitive Exams",
      "Top Government Exams",
      "Top Digital & Future Skills"
    ];

    const grouped: Record<string, CourseItem[]> = {};
    
    // Initialize groups in preferred order
    categories.forEach(cat => { grouped[cat] = []; });

    courses.forEach(course => {
      const cat = course.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(course);
    });

    return Object.entries(grouped).filter(([_, items]) => items.length > 0);
  }, [courses]);

  return (
    <div className="mt-8 space-y-16">
      <div className="mb-5 flex justify-start">
        <div className="surface-soft inline-flex items-center gap-3 rounded-full px-4 py-2.5">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
          <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-heading)]">
            {isRefreshing ? "Refreshing courses..." : "Live course catalog"}
          </p>
        </div>
      </div>

      {categorizedCourses.map(([category, items]) => (
        <div key={category} className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black tracking-tight text-[var(--color-heading)] sm:text-3xl">
              {category}
            </h2>
            <div className="h-px flex-grow bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-900/50" />
          </div>
          <CourseCatalog courses={items} />
        </div>
      ))}
    </div>
  );
}
