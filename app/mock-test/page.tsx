import QuizArenaClient from "@/components/quiz-arena-client";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Mock Test Arena | Smart IQ Institute",
  description: "Test your knowledge with our interactive mock tests and quiz arena. Prepare for school, college, and competitive exams with real-time performance analytics.",
  alternates: {
    canonical: "https://smarttutors.co.in/mock-test",
  },
};

export default function MockTestPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smarttutors.co.in" },
      { "@type": "ListItem", "position": 2, "name": "Mock Tests", "item": "https://smarttutors.co.in/mock-test" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <QuizArenaClient />
    </>
  );
}
