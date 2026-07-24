import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createMentorshipRequest,
  getMentorshipRequestsForRole,
} from "@/lib/data-store";
import type { MentorshipMode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_MODES: MentorshipMode[] = [
  "online",
  "vashi-campus",
  "panvel-campus",
];

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

function getMentorshipMode(value: unknown): MentorshipMode {
  if (
    typeof value !== "string" ||
    !VALID_MODES.includes(value as MentorshipMode)
  ) {
    throw new Error("Select a valid mentorship mode.");
  }

  return value as MentorshipMode;
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      session.role !== "student" &&
      session.role !== "educator" &&
      session.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view mentorship requests.",
        },
        { status: 403 },
      );
    }

    const requests = await getMentorshipRequestsForRole(
      session.role,
      session.id,
    );

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get mentorship requests error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load mentorship requests.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.role !== "student") {
      return NextResponse.json(
        {
          error:
            "Only students can submit mentorship requests.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const mentorshipRequest =
      await createMentorshipRequest({
        studentId: session.id,

        facultyId: getRequiredText(
          body.facultyId,
          "Faculty mentor",
        ),

        subject: getRequiredText(
          body.subject,
          "Mentorship subject",
        ),

        goal: getRequiredText(
          body.goal,
          "Mentorship goal",
        ),

        message: getOptionalText(body.message),

        preferredMode: getMentorshipMode(
          body.preferredMode,
        ),

        preferredDate: getOptionalText(
          body.preferredDate,
        ),

        preferredTime: getOptionalText(
          body.preferredTime,
        ),
      });

    return NextResponse.json(
      {
        mentorshipRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create mentorship request error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create mentorship request.",
      },
      { status: 400 },
    );
  }
}