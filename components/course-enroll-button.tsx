"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { CourseItem } from "@/lib/types";
import CourseModal from "@/components/course-modal";

type CourseEnrollButtonProps = {
  course: CourseItem;
  courseSlug: string;
  courseTitle: string;
  className?: string;
  children?: ReactNode;
};

const programmeNames: Record<string, string> = {
  "jee-main": "JEE Main",
  "jee-advanced": "JEE Advanced",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function CourseEnrollButton({
  course,
  courseSlug,
  courseTitle,
  className = "",
  children = "Enroll Now",
}: CourseEnrollButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { modalCourse, selectedProgramme } = useMemo(() => {
    const options = course.courseNamesIncluded ?? [];

    const expectedName = programmeNames[courseSlug] ?? courseTitle;

    const matchedOption = options.find(
      (option) => normalize(option) === normalize(expectedName),
    );

    const selection = matchedOption ?? expectedName;

    // Retain all existing options. If the individual course
    // is missing from the parent list, include it so that
    // the existing modal can correctly preselect it.
    const updatedOptions = matchedOption ? options : [selection, ...options];

    return {
      selectedProgramme: selection,
      modalCourse: {
        ...course,
        courseNamesIncluded: updatedOptions,
      } satisfies CourseItem,
    };
  }, [course, courseSlug, courseTitle]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {children}
      </button>

      {isOpen && (
        <CourseModal
          key={`${courseSlug}-${selectedProgramme}`}
          course={modalCourse}
          initialAdditionalCourse={selectedProgramme}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
