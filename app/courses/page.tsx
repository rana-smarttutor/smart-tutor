import { Metadata } from "next";

import { CoursesHero } from "@/components/courses-hero";
import CoursesRedesignClient from "@/components/courses-redesign-client";
import { getAllDetailedCourses } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Our Courses | Smart Tutors",
  description: "Explore our wide range of courses from primary school foundation to professional and government exam preparation. Structured roadmaps designed for success.",
  alternates: {
    canonical: "https://smarttutors.co.in/courses",
  },
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getAllDetailedCourses();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://smarttutors.co.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Courses",
        "item": "https://smarttutors.co.in/courses"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CoursesHero />
      <CoursesRedesignClient allCourses={courses} />
    </>
  );
}
