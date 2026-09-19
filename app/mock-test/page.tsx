import QuizArenaClient from "@/components/quiz-arena-client";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mock Test Arena | SmartIQ Institute",
  description: "Test your knowledge with our interactive mock tests and quiz arena. Prepare for school, college, and competitive exams with real-time performance analytics.",
  alternates: {
    canonical: "https://smartiqinstitute.in/mock-test",
  },
};

export default async function MockTestPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=%2Fmock-test&reason=login_required");
  if ((session.role !== "student" && session.role !== "admin") || (session.status && session.status !== "active")) {
    redirect("/dashboard");
  }
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smartiqinstitute.in" },
      { "@type": "ListItem", "position": 2, "name": "Mock Tests", "item": "https://smartiqinstitute.in/mock-test" },
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
