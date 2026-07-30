import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  getMentorshipRequestById,
  updateMentorshipRequest,
} from "@/lib/data-store";
import type {
  MentorshipRequestStatus,
  Role,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

const VALID_STATUSES: MentorshipRequestStatus[] = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "completed",
];

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function getRequestStatus(
  value: unknown,
): MentorshipRequestStatus {
  if (
    typeof value !== "string" ||
    !VALID_STATUSES.includes(
      value as MentorshipRequestStatus,
    )
  ) {
    throw new Error(
      "Select a valid mentorship request status.",
    );
  }

  return value as MentorshipRequestStatus;
}

function canUseMentorship(role: Role) {
  return (
    role === "student" ||
    role === "educator" ||
    role === "admin"
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!canUseMentorship(session.role)) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to update mentorship requests.",
        },
        { status: 403 },
      );
    }

    const { requestId } = await context.params;

    const normalizedRequestId = requestId.trim();

    if (!normalizedRequestId) {
      return NextResponse.json(
        {
          error: "Mentorship request is required.",
        },
        { status: 400 },
      );
    }

    const existingRequest =
      await getMentorshipRequestById(
        normalizedRequestId,
      );

    if (!existingRequest) {
      return NextResponse.json(
        {
          error: "Mentorship request not found.",
        },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const status = getRequestStatus(body.status);

    if (
      session.role === "student" &&
      status !== "cancelled"
    ) {
      return NextResponse.json(
        {
          error:
            "Students can only cancel mentorship requests.",
        },
        { status: 403 },
      );
    }

    if (
      session.role === "educator" &&
      status !== "accepted" &&
      status !== "declined" &&
      status !== "completed"
    ) {
      return NextResponse.json(
        {
          error:
            "Faculty can only accept, decline, or complete mentorship requests.",
        },
        { status: 403 },
      );
    }

    const mentorshipRequest =
      await updateMentorshipRequest({
        requestId: normalizedRequestId,

        actorId: session.id,
        actorRole: session.role,

        status,

        facultyResponse: getOptionalText(
          body.facultyResponse,
        ),

        scheduledAt: getOptionalText(
          body.scheduledAt,
        ),

        meetingLink: getOptionalText(
          body.meetingLink,
        ),

        location: getOptionalText(body.location),
      });

    if (!mentorshipRequest) {
      return NextResponse.json(
        {
          error: "Mentorship request not found.",
        },
        { status: 404 },
      );
    }

    await logAction({
      action: "update",
      category: "other",
      details: `Mentorship request ${requestId} ${status} by ${session.name}`,
      path: "/api/mentorship/requests/[requestId]",
      method: "PATCH",
      request,
      session,
      metadata: { requestId, status },
    });

    return NextResponse.json({
      mentorshipRequest,
    });
  } catch (error) {
    console.error(
      "Update mentorship request error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update mentorship request.",
      },
      { status: 400 },
    );
  }
}