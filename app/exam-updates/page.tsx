import type { Metadata } from "next";

import { ExamUpdatesClient } from "@/components/exam-updates-client";
import {
  getExamUpdates,
  OFFICIAL_EXAM_SOURCES,
} from "@/lib/exam-updates";

export const runtime = "nodejs";
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Exam Updates | SmartIQ Institute",
  description:
    "Latest board exam, government exam and competitive exam notifications, applications, admit cards, exam dates, answer keys and results from official sources.",
  alternates: {
    canonical: "https://smartiqinstitute.in/exam-updates",
  },
  openGraph: {
    title: "Exam Updates | SmartIQ Institute",
    description:
      "Stay updated with official board, government and competitive exam notifications, results, admit cards and exam dates.",
    url: "https://smartiqinstitute.in/exam-updates",
    type: "website",
  },
};

export default async function ExamUpdatesPage() {
  const updates = await getExamUpdates();

  const checkedAt = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <ExamUpdatesClient
      updates={updates}
      sources={OFFICIAL_EXAM_SOURCES}
      checkedAt={checkedAt}
    />
  );
}