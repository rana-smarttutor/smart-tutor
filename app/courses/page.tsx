import type { Metadata } from "next";
import CourseArtifactHero from "@/components/course-artifact-hero";
import CoursesRedesignClient from "@/components/courses-redesign-client";
import { getAllDetailedCourses } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Our Courses | SmartIQ Institute",
  description:
    "Explore our courses from school tuition to professional and government exam preparation.",
  alternates: { canonical: "https://smartiqinstitute.in/courses" },
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getAllDetailedCourses();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://smartiqinstitute.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Courses",
        item: "https://smartiqinstitute.in/courses",
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <CourseArtifactHero />
      <CoursesRedesignClient allCourses={courses} />
    </>
  );
}
