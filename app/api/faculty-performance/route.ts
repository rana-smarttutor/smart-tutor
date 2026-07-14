import { NextRequest, NextResponse } from "next/server";
import {
  getEducators,
  getLecturesForRole,
  getWeeklyTestsForRole,
  getTeacherFeedbackForRole,
  getAllHomeworkForAdmin,
  getSubmissionsForHomeworkBatch,
} from "@/lib/data-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "";

    const educators = await getEducators();
    const allLectures = await getLecturesForRole("admin");
    const allWeeklyTests = await getWeeklyTestsForRole("admin");
    const allFeedback = await getTeacherFeedbackForRole("admin");
    const allHomework = await getAllHomeworkForAdmin();

    const hwIds = allHomework.map((h) => h.id);
    const allSubmissions = await getSubmissionsForHomeworkBatch(hwIds);

    let filteredLectures = allLectures;
    let filteredTests = allWeeklyTests;
    let filteredFeedback = allFeedback;
    let filteredHomework = allHomework;
    let filteredSubmissions = allSubmissions;

    if (period) {
      const now = new Date();
      let startDate: Date | null = null;

      if (period === "this-week") {
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "this-month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === "last-month") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodStart = startDate;
        filteredLectures = filteredLectures.filter((l) => {
          const d = new Date(l.startsAt);
          return d >= periodStart! && d < endDate;
        });
        filteredTests = filteredTests.filter((t) => {
          const d = new Date(t.createdAt || t.id);
          return d >= periodStart! && d < endDate;
        });
        filteredFeedback = filteredFeedback.filter((f) => {
          const d = new Date(f.createdAt || f.id);
          return d >= periodStart! && d < endDate;
        });
        filteredHomework = filteredHomework.filter((h) => {
          const d = new Date(h.createdAt);
          return d >= periodStart! && d < endDate;
        });
        const fHwIds = filteredHomework.map((h) => h.id);
        filteredSubmissions = allSubmissions.filter((s) => fHwIds.includes(s.homeworkId));
        startDate = null;
      }

      if (startDate) {
        filteredLectures = filteredLectures.filter(
          (l) => new Date(l.startsAt) >= startDate!,
        );
        filteredTests = filteredTests.filter((t) => {
          const d = new Date(t.createdAt || t.id);
          return d >= startDate!;
        });
        filteredFeedback = filteredFeedback.filter((f) => {
          const d = new Date(f.createdAt || f.id);
          return d >= startDate!;
        });
        filteredHomework = filteredHomework.filter(
          (h) => new Date(h.createdAt) >= startDate!,
        );
        const fHwIds = filteredHomework.map((h) => h.id);
        filteredSubmissions = allSubmissions.filter((s) =>
          fHwIds.includes(s.homeworkId),
        );
      }
    }

    const facultyPerformance = educators.map((edu) => {
      const facultyId = edu.id;

      const facultyLectures = filteredLectures.filter(
        (l) =>
          l.teacherId === facultyId ||
          l.createdBy === facultyId,
      );
      const completedClasses = facultyLectures.filter(
        (l) => l.status === "completed",
      ).length;

      const facultyTests = filteredTests.filter(
        (t) => t.teacherId === facultyId,
      );
      let avgScore: number | null = null;
      if (facultyTests.length > 0) {
        let totalObtained = 0;
        let totalMax = 0;
        for (const test of facultyTests) {
          for (const result of test.results || []) {
            if (
              result.status === "present" &&
              typeof result.obtainedMarks === "number"
            ) {
              totalObtained += result.obtainedMarks;
              totalMax += test.totalMarks || 100;
            }
          }
        }
        if (totalMax > 0) {
          avgScore = Math.round((totalObtained / totalMax) * 100);
        }
      }

      const facultyHomework = filteredHomework.filter(
        (h) => h.createdBy === facultyId,
      );
      const hwAssigned = facultyHomework.length;

      let hwCompletion = 0;
      if (hwAssigned > 0) {
        const hwIds = facultyHomework.map((h) => h.id);
        const facultySubmissions = filteredSubmissions.filter((s) =>
          hwIds.includes(s.homeworkId),
        );
        const gradedCount = facultySubmissions.filter(
          (s) => s.status === "graded",
        ).length;
        if (facultySubmissions.length > 0) {
          hwCompletion = Math.min(
            100,
            Math.round((gradedCount / facultySubmissions.length) * 100),
          );
        }
      }

      const facultyFeedback = filteredFeedback.filter(
        (f) => f.teacherId === facultyId,
      );
      const uniqueStudentsHelped = new Set(
        facultyFeedback.map((f) => f.studentId),
      ).size;

      const classesScore = Math.min(100, Math.round((completedClasses / 30) * 100));
      const engagementScore = Math.min(100, uniqueStudentsHelped * 2);
      const scoreComponents = [
        (avgScore ?? 0) * 0.4,
        classesScore * 0.3,
        engagementScore * 0.3,
      ];
      const performanceScore =
        hwAssigned === 0 && completedClasses === 0
          ? 0
          : Math.round(scoreComponents.reduce((a, b) => a + b, 0));

      return {
        facultyId,
        facultyName: edu.name,
        profilePhoto: edu.profilePhoto,
        qualification: edu.profile?.qualification,
        subjects: edu.profile?.subjects,
        avgScore,
        classes: completedClasses,
        hwAssigned,
        hwCompletion,
        doubtsAnswered: uniqueStudentsHelped,
        performanceScore: Math.min(100, Math.max(0, performanceScore)),
      };
    });

    facultyPerformance.sort((a, b) => b.performanceScore - a.performanceScore);

    const enriched = facultyPerformance.map((fp, idx) => ({
      ...fp,
      rank: idx + 1,
    }));

    return NextResponse.json({
      ok: true,
      faculty: enriched,
      periods: [
        { value: "", label: "All Time" },
        { value: "this-week", label: "This Week" },
        { value: "this-month", label: "This Month" },
        { value: "last-month", label: "Last Month" },
      ],
    });
  } catch (error) {
    console.error("Faculty performance API error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load faculty performance data." },
      { status: 500 },
    );
  }
}
