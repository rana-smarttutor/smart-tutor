import { Metadata } from "next";
import QuizArenaClient from '@/components/quiz-arena-client';

export const metadata: Metadata = {
  title: "Quiz Arena | Smart Tutors",
  description: "Challenge yourself in our Quiz Arena. Competitive tests and practice sessions to sharpen your skills.",
  alternates: {
    canonical: "https://smarttutors.co.in/quiz-arena",
  },
};

export default function QuizArenaPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smarttutors.co.in" },
      { "@type": "ListItem", "position": 2, "name": "Quiz Arena", "item": "https://smarttutors.co.in/quiz-arena" },
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
