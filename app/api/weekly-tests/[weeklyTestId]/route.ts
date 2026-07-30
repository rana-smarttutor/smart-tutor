import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import {
  deleteWeeklyTest,
  getWeeklyTestsForRole,
  updateWeeklyTest,
} from "@/lib/data-store";
import type { WeeklyTestResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    weeklyTestId: string;
  }>;
};

const RESULT_STATUSES = new Set([
  "present",
  "absent",
  "not-submitted",
]);

function hasField(body: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

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

function getValidTotalMarks(value: unknown) {
  const totalMarks = Number(value);

  if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
    throw new Error("Total marks must be greater than zero.");
  }

  return totalMarks;
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

      const marks = Number(result.obtainedMarks);

      if (!Number.isFinite(marks) || marks < 0 || marks > totalMarks) {
        throw new Error(
          `Marks for ${studentName} must be between 0 and ${totalMarks}.`,
        );
      }

      obtainedMarks = marks;
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

async function getAllowedWeeklyTest(
  weeklyTestId: string,
  role: "admin" | "educator",
  userId: string,
) {
  const weeklyTests = await getWeeklyTestsForRole(role, userId);

  return weeklyTests.find((test) => test.id === weeklyTestId) ?? null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { weeklyTestId } = await context.params;

    const existingTest = await getAllowedWeeklyTest(
      weeklyTestId,
      session.role,
      session.id,
    );

    if (!existingTest) {
      return NextResponse.json(
        {
          error:
            "Weekly test not found or you do not have permission to edit it.",
        },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const nextTotalMarks = hasField(body, "totalMarks")
      ? getValidTotalMarks(body.totalMarks)
      : existingTest.totalMarks;

    const updates: {
      title?: string;
      subject?: string;
      testDate?: string;
      totalMarks?: number;
      published?: boolean;
      results?: WeeklyTestResult[];
    } = {};

    if (hasField(body, "title")) {
      updates.title = getRequiredText(body.title, "Test title");
    }

    if (hasField(body, "subject")) {
      updates.subject = getRequiredText(body.subject, "Subject");
    }

    if (hasField(body, "testDate")) {
      updates.testDate = getRequiredText(body.testDate, "Test date");
    }

    if (hasField(body, "totalMarks")) {
      updates.totalMarks = nextTotalMarks;
    }

    if (hasField(body, "published")) {
      if (typeof body.published !== "boolean") {
        return NextResponse.json(
          { error: "Published value must be true or false." },
          { status: 400 },
        );
      }

      updates.published = body.published;
    }

    if (hasField(body, "results")) {
      updates.results = parseResults(body.results, nextTotalMarks);
    } else if (
      nextTotalMarks !== existingTest.totalMarks &&
      existingTest.results.some(
        (result) =>
          result.status === "present" &&
          typeof result.obtainedMarks === "number" &&
          result.obtainedMarks > nextTotalMarks,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Total marks cannot be lower than already entered student marks.",
        },
        { status: 400 },
      );
    }

    const weeklyTest = await updateWeeklyTest(weeklyTestId, updates);

    if (!weeklyTest) {
      return NextResponse.json(
        { error: "Weekly test not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "update",
      category: "exams",
      details: `Weekly test updated: ${weeklyTest.title}`,
      path: `/api/weekly-tests/${weeklyTestId}`,
      method: "PATCH",
      request,
      session,
      metadata: { weeklyTestId, title: weeklyTest.title },
    });

    return NextResponse.json({ weeklyTest });
  } catch (error) {
    console.error("Update weekly test error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update weekly test.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { weeklyTestId } = await context.params;

    const existingTest = await getAllowedWeeklyTest(
      weeklyTestId,
      session.role,
      session.id,
    );

    if (!existingTest) {
      return NextResponse.json(
        {
          error:
            "Weekly test not found or you do not have permission to delete it.",
        },
        { status: 404 },
      );
    }

    const deleted = await deleteWeeklyTest(weeklyTestId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Weekly test not found." },
        { status: 404 },
      );
    }

    await logAction({
      action: "delete",
      category: "exams",
      details: `Weekly test deleted: ${weeklyTestId}`,
      path: `/api/weekly-tests/${weeklyTestId}`,
      method: "DELETE",
      request: _request,
      session,
      metadata: { weeklyTestId, title: existingTest.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete weekly test error:", error);

    return NextResponse.json(
      { error: "Unable to delete weekly test." },
      { status: 500 },
    );
  }
}