import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  assignTeacherToBatch,
  createBatch,
  deleteBatch,
  getBatchesForRole,
  removeTeacherFromBatch,
  updateBatch,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOptionalText(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batches = await getBatchesForRole(session.role, session.id);

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("Get batches error:", error);

    return NextResponse.json(
      { error: "Unable to load batches." },
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

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create batches." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const batch = await createBatch({
      name: String(body.name ?? ""),
      code: getOptionalText(body.code),
      courseId: getOptionalText(body.courseId),
      courseName: getOptionalText(body.courseName),
      subject: getOptionalText(body.subject),
      capacity: typeof body.capacity === "number" ? body.capacity : undefined,
      schedule: getOptionalText(body.schedule),
      studentIds: getStringArray(body.studentIds),
      teacherIds: getStringArray(body.teacherIds),
      startDate: getOptionalText(body.startDate),
      endDate: getOptionalText(body.endDate),
      createdBy: session.id,
    });

    return NextResponse.json({ batch }, { status: 201 });
  } catch (error) {
    console.error("Create batch error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create batch.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update batches." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const batchId = getOptionalText(body.batchId);

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required." },
        { status: 400 },
      );
    }

    const action = getOptionalText(body.action);

    if (action === "assign-teacher") {
      const teacherId = getOptionalText(body.teacherId);

      if (!teacherId) {
        return NextResponse.json(
          { error: "Teacher ID is required." },
          { status: 400 },
        );
      }

      const batch = await assignTeacherToBatch({
        batchId,
        teacherId,
        subject: getOptionalText(body.subject),
        assignedBy: session.id,
      });

      return NextResponse.json({ batch });
    }

    if (action === "remove-teacher") {
      const teacherId = getOptionalText(body.teacherId);

      if (!teacherId) {
        return NextResponse.json(
          { error: "Teacher ID is required." },
          { status: 400 },
        );
      }

      const batch = await removeTeacherFromBatch({
        batchId,
        teacherId,
      });

      return NextResponse.json({ batch });
    }

    const batch = await updateBatch(batchId, {
      name: getOptionalText(body.name),
      courseId: getOptionalText(body.courseId),
      courseName: getOptionalText(body.courseName),
      subject: getOptionalText(body.subject),
      schedule: getOptionalText(body.schedule),
      studentIds: Array.isArray(body.studentIds)
        ? getStringArray(body.studentIds)
        : undefined,
      teacherIds: Array.isArray(body.teacherIds)
        ? getStringArray(body.teacherIds)
        : undefined,
      status:
        body.status === "active" || body.status === "archived"
          ? body.status
          : undefined,
    });

    return NextResponse.json({ batch });
  } catch (error) {
    console.error("Update batch error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update batch.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete batches." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { batchId?: string };
    const batchId = body.batchId;

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required." },
        { status: 400 },
      );
    }

    await deleteBatch(batchId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete batch error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete batch.",
      },
      { status: 500 },
    );
  }
}
