import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  getMentorshipProfileByFacultyId,
  saveFacultyMentorshipProfile,
} from "@/lib/data-store";
import type { MentorshipMode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_MODES: MentorshipMode[] = [
  "online",
  "vashi-campus",
  "panvel-campus",
];

function getStringArray(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a list.`);
  }

  return [
    ...new Set(
      value
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function getMentorshipModes(value: unknown) {
  const modes = getStringArray(
    value,
    "Mentorship modes",
  );

  const validModes = modes.filter(
    (mode): mode is MentorshipMode =>
      VALID_MODES.includes(mode as MentorshipMode),
  );

  if (!validModes.length) {
    throw new Error(
      "Select at least one valid mentorship mode.",
    );
  }

  return validModes;
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function getBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be true or false.`);
  }

  return value;
}

function getMaximumActiveStudents(value: unknown) {
  const maximumActiveStudents = Number(value);

  if (
    !Number.isInteger(maximumActiveStudents) ||
    maximumActiveStudents < 1 ||
    maximumActiveStudents > 100
  ) {
    throw new Error(
      "Maximum active students must be between 1 and 100.",
    );
  }

  return maximumActiveStudents;
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

    if (session.role !== "educator") {
      return NextResponse.json(
        {
          error:
            "Only educators can access mentorship profiles.",
        },
        { status: 403 },
      );
    }

    const profile =
      await getMentorshipProfileByFacultyId(
        session.id,
      );

    return NextResponse.json({ profile });
  } catch (error) {
    console.error(
      "Get mentorship profile error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load mentorship profile.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.role !== "educator") {
      return NextResponse.json(
        {
          error:
            "Only educators can update mentorship profiles.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const subjects = getStringArray(
      body.subjects,
      "Mentorship subjects",
    );

    if (!subjects.length) {
      throw new Error(
        "Add at least one mentorship subject.",
      );
    }

    const availableDays = getStringArray(
      body.availableDays,
      "Available days",
    );

    if (!availableDays.length) {
      throw new Error(
        "Select at least one available day.",
      );
    }

    const profile =
      await saveFacultyMentorshipProfile({
        facultyId: session.id,
        facultyName: session.name,

        isAvailable: getBoolean(
          body.isAvailable,
          "Mentorship availability",
        ),

        subjects,

        modes: getMentorshipModes(body.modes),

        availableDays,

        availableFrom: getOptionalText(
          body.availableFrom,
        ),

        availableTo: getOptionalText(
          body.availableTo,
        ),

        maximumActiveStudents:
          getMaximumActiveStudents(
            body.maximumActiveStudents,
          ),

        bio: getOptionalText(body.bio),

        languages: Array.isArray(body.languages)
          ? getStringArray(body.languages, "Languages")
          : [],
      });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error(
      "Save mentorship profile error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save mentorship profile.",
      },
      { status: 400 },
    );
  }
}