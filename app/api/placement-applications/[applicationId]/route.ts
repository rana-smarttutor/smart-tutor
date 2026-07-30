import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import {
  createNotifications,
  updatePlacementApplicationStatus,
} from "@/lib/data-store";
import type { PlacementApplicationStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    applicationId: string;
  }>;
};

const applicationStatuses = new Set<PlacementApplicationStatus>([
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
]);

function getText(value: unknown, maxLength = 1000) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update application status." },
        { status: 403 },
      );
    }

    const { applicationId } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const status = body.status as PlacementApplicationStatus;
    const statusNote = getText(body.statusNote, 1000);

    if (!applicationStatuses.has(status)) {
      return NextResponse.json(
        { error: "Choose a valid application status." },
        { status: 400 },
      );
    }

    const application = await updatePlacementApplicationStatus(applicationId, {
      status,
      statusNote: statusNote || undefined,
      updatedBy: session.id,
    });

    if (!application) {
      return NextResponse.json(
        { error: "Placement application not found." },
        { status: 404 },
      );
    }

    await createNotifications({
      userIds: [application.studentId],
      title: `Placement update: ${application.jobRole}`,
      message: `Your application for ${application.jobRole} at ${application.company} is now marked ${status}.`,
      type: "placement",
      link: "/placements",
    });

    await logAction({
      action: "update",
      category: "placement",
      details: `Updated placement application ${applicationId} status to ${status}`,
      path: `/api/placement-applications/${applicationId}`,
      method: "PATCH",
      request,
      session,
      metadata: { applicationId, status, studentId: application.studentId },
    });

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update application status.",
      },
      { status: 500 },
    );
  }
}