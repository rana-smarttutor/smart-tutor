"use client";

import { useEffect, useState } from "react";

import { CourseCatalog } from "@/components/course-catalog";
import type { CourseItem } from "@/lib/types";

const COURSE_CACHE_KEY = "smart-tutor-course-cache-v2";

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

  return (
    <div className="mt-8">
      <div className="mb-5 flex justify-start">
        <div className="surface-soft inline-flex items-center gap-3 rounded-full px-4 py-2.5">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
          <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-heading)]">
            {isRefreshing ? "Refreshing courses..." : "Live course catalog"}
          </p>
        </div>
      </div>
      <CourseCatalog courses={courses} />
    </div>
  );
}
