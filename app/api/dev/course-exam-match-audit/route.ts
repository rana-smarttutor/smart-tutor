import { NextResponse } from "next/server";
import { getExamUpdates } from "@/lib/exam-updates";
import { matchCourseExamUpdates } from "@/lib/course-exam-update-matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COURSE_SLUGS = [
  "jee-main",
  "jee-advanced",
  "neet-coaching",
  "ssc-cgl",
  "ssc-chsl",
  "ssc-mts",
  "ssc-cpo",
  "upsc-coaching",
  "ibps-po",
  "ibps-clerk",
  "sbi-po",
  "sbi-clerk",
  "rbi-grade-b",
  "cat",
] as const;

export async function GET() {
  // Never expose this diagnostic endpoint in production.
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const updates = await getExamUpdates();


    // Build a source-level inventory of the cached feed.
    // This helps identify missing exam notices without
    // guessing course matching keywords.
    const sourceMap = new Map<
      string,
      {
        sourceKey: string;
        source: string;
        count: number;
        sampleTitles: string[];
      }
    >();

    for (const update of updates) {
      const existing = sourceMap.get(update.sourceKey);

      if (existing) {
        existing.count += 1;

        if (existing.sampleTitles.length < 3) {
          existing.sampleTitles.push(update.title);
        }
      } else {
        sourceMap.set(update.sourceKey, {
          sourceKey: update.sourceKey,
          source: update.source,
          count: 1,
          sampleTitles: [update.title],
        });
      }
    }

    const sourceSummary = [...sourceMap.values()].sort(
      (a, b) => a.sourceKey.localeCompare(b.sourceKey),
    );



    // Phase 1E: inspect real notice titles from
    // relevant examination authorities.
    const diagnosticSourceKeys = new Set([
      "upsc",
      "sbi-recruitment",
      "rbi-recruitment",
      "uco-bank",
      "central-bank-india",
      "pnb",
      "bank-of-baroda",
      "union-bank",
    ]);

    const diagnosticNotices = updates
      .filter((update) =>
        diagnosticSourceKeys.has(update.sourceKey),
      )
      .map((update) => ({
        sourceKey: update.sourceKey,
        title: update.title,
        type: update.type,
        publishedLabel: update.publishedLabel ?? null,
        officialUrl: update.officialUrl,
      }));


    const courses = COURSE_SLUGS.map((slug) => {
      const matches = matchCourseExamUpdates(slug, updates);

      return {
        slug,
        matchedCount: matches.length,
        examDateNoticeCount: matches.filter(
          (match) => match.eventType === "Exam Date",
        ).length,
        unknownYearCount: matches.filter((match) => match.examYear === null)
          .length,
        candidates: matches.map((match) => ({
          id: match.update.id,
          title: match.update.title,
          source: match.update.source,
          sourceKey: match.update.sourceKey,
          eventType: match.eventType,
          examYear: match.examYear,
          publishedLabel: match.update.publishedLabel ?? null,
          officialUrl: match.update.officialUrl,
          requiresReview: match.requiresReview,
        })),
      };
    });

    return NextResponse.json({
      phase: "1C",
      mode: "READ_ONLY",
      totalFeedUpdates: updates.length,
      coursesChecked: COURSE_SLUGS.length,
      coursesWithCandidates: courses.filter((course) => course.matchedCount > 0)
        .length,
      totalCandidateMatches: courses.reduce(
        (sum, course) => sum + course.matchedCount,
        0,
      ),
      databaseWrites: 0,
      datesPublished: 0,
      courses,
      sourceSummary,
      diagnosticNotices,
    });
  } catch (error) {
    console.error("[Course Exam Audit] Failed:", error);

    return NextResponse.json(
      { error: "Audit could not complete" },
      { status: 500 },
    );
  }
}
