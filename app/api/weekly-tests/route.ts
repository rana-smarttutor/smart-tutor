import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import {
  createNotifications,
  createWeeklyTest,
  getNotificationRecipientIdsForStudents,
  getWeeklyTestsForRole,
} from "@/lib/data-store";
import type { WeeklyTestResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESULT_STATUSES = new Set([
  "present",
  "absent",
  "not-submitted",
]);

function getRequiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function parseResults(
  value: unknown,
  totalMarks: number,
): WeeklyTestResult[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Add at least one student result.");
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Student result ${index + 1} is invalid.`);
    }

    const result = item as Record<string, unknown>;

    const studentId = getRequiredText(
      result.studentId,
      `Student ID for result ${index + 1}`,
    );

    const studentName = getRequiredText(
      result.studentName,
      `Student name for result ${index + 1}`,
    );

    const rawStatus =
      typeof result.status === "string"
        ? result.status.trim()
        : "present";

    if (!RESULT_STATUSES.has(rawStatus)) {
      throw new Error(`Invalid result status for ${studentName}.`);
    }

    const status = rawStatus as WeeklyTestResult["status"];

    let obtainedMarks: number | undefined;

    if (status === "present") {
      if (
        result.obtainedMarks === undefined ||
        result.obtainedMarks === null ||
        result.obtainedMarks === ""
      ) {
        throw new Error(`Enter marks for ${studentName}.`);
      }

      const parsedMarks = Number(result.obtainedMarks);

      if (
        !Number.isFinite(parsedMarks) ||
        parsedMarks < 0 ||
        parsedMarks > totalMarks
      ) {
        throw new Error(
          `Marks for ${studentName} must be between 0 and ${totalMarks}.`,
        );
      }

      obtainedMarks = parsedMarks;
    }

    return {
      studentId,
      studentName,
      status,
      obtainedMarks,
      remarks: getOptionalText(result.remarks),
    };
  });
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weeklyTests = await getWeeklyTestsForRole(
      session.role,
      session.id,
    );

    return NextResponse.json({ weeklyTests });
  } catch (error) {
    console.error("Get weekly tests error:", error);

    return NextResponse.json(
      { error: "Unable to load weekly tests." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const title = getRequiredText(body.title, "Test title");
    const testDate = getRequiredText(body.testDate, "Test date");
    const totalMarks = Number(body.totalMarks);

    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
      return NextResponse.json(
        { error: "Total marks must be greater than zero." },
        { status: 400 },
      );
    }

    const subject = getOptionalText(body.subject);

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 },
      );
    }

    const results = parseResults(body.results, totalMarks);

const weeklyTest = await createWeeklyTest({
  title,
  teacherId: session.id,
  subject,
  testDate,
  totalMarks,
  published: body.published === true,
  results,
});

let notified = false;

if (weeklyTest.published) {
  const recipientIds = await getNotificationRecipientIdsForStudents(
    weeklyTest.results.map((result) => result.studentId),
  );

  if (recipientIds.length > 0) {
    await createNotifications({
      userIds: recipientIds,
      title: `Weekly test result: ${weeklyTest.title}`,
      message: `The ${weeklyTest.subject} weekly test result for ${weeklyTest.title} is now available.`,
      type: "test",
      link: "/dashboard",
    });

    notified = true;
  }
}

await logAction({
  action: "create",
  category: "exams",
  details: `Weekly test created: ${weeklyTest.title}`,
  path: "/api/weekly-tests",
  method: "POST",
  request,
  session,
  metadata: { weeklyTestId: weeklyTest.id, title: weeklyTest.title, subject: weeklyTest.subject },
});

return NextResponse.json(
  {
    weeklyTest,
    notified,
  },
  { status: 201 },
);
  } catch (error) {
    console.error("Create weekly test error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create weekly test.",
      },
      { status: 500 },
    );
  }
}