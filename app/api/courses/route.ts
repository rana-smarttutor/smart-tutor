import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createCourse,
  getCoursesForRole,
  getStandardizedCourseOptions,
  updateCourse,
} from "@/lib/data-store";
import { sanitizeTextInput, sanitizeTextareaInput } from "@/lib/validation";

export async function GET() {
  const session = await getSessionUser();
  const role = session?.role ?? "student";

  return NextResponse.json({
    role,
    courses: await getCoursesForRole(role),
    courseOptions: getStandardizedCourseOptions(),
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session || !["educator", "admin"].includes(session.role)) {
    return NextResponse.json(
      { error: "Only educators and admins can create courses." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    standardKey?: string;
    tagline?: string;
    schedule?: string;
    summary?: string;
    description?: string;
    duration?: string;
    mode?: string;
    audienceLabel?: string;
    courseNamesIncluded?: string[];
    branchesIncluded?: string[];
    subjectsCovered?: string[];
    points?: string[];
  };

  const standardKey = sanitizeTextInput(body.standardKey, 80);
  const tagline = sanitizeTextInput(body.tagline, 60);
  const schedule = sanitizeTextInput(body.schedule, 50);
  const summary = sanitizeTextareaInput(body.summary, 220);
  const description = sanitizeTextareaInput(body.description, 520);
  const duration = sanitizeTextInput(body.duration, 80);
  const mode = sanitizeTextInput(body.mode, 80);
  const audienceLabel = sanitizeTextInput(body.audienceLabel, 120);
  const courseNamesIncluded = (body.courseNamesIncluded ?? [])
    .map((item) => sanitizeTextInput(item, 120))
    .filter(Boolean)
    .slice(0, 8);
  const branchesIncluded = (body.branchesIncluded ?? [])
    .map((item) => sanitizeTextInput(item, 120))
    .filter(Boolean)
    .slice(0, 8);
  const subjectsCovered = (body.subjectsCovered ?? [])
    .map((item) => sanitizeTextInput(item, 120))
    .filter(Boolean)
    .slice(0, 10);
  const points = (body.points ?? [])
    .map((item) => sanitizeTextInput(item, 120))
    .filter(Boolean)
    .slice(0, 6);

  if (!standardKey) {
    return NextResponse.json(
      { error: "Course name must be selected from the standard list." },
      { status: 400 },
    );
  }

  try {
    const draft = await createCourse({
      standardKey,
      tagline,
      schedule,
      summary,
      description,
      duration,
      mode,
      audienceLabel,
      courseNamesIncluded,
      branchesIncluded,
      subjectsCovered,
      points,
      createdBy: session.name,
    });

    return NextResponse.json({ course: draft }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Course could not be created.";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Only admins can edit courses." }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    standardKey?: string;
    tagline?: string;
    schedule?: string;
    summary?: string;
    description?: string;
    duration?: string;
    mode?: string;
    audienceLabel?: string;
    courseNamesIncluded?: string[];
    branchesIncluded?: string[];
    subjectsCovered?: string[];
    points?: string[];
  };

  const id = sanitizeTextInput(body.id, 80);
  const standardKey = sanitizeTextInput(body.standardKey, 80);

  if (!id || !standardKey) {
    return NextResponse.json(
      { error: "Course id and standard name are required." },
      { status: 400 },
    );
  }

  try {
    const course = await updateCourse({
      id,
      standardKey,
      tagline: sanitizeTextInput(body.tagline, 60),
      schedule: sanitizeTextInput(body.schedule, 50),
      summary: sanitizeTextareaInput(body.summary, 220),
      description: sanitizeTextareaInput(body.description, 520),
      duration: sanitizeTextInput(body.duration, 80),
      mode: sanitizeTextInput(body.mode, 80),
      audienceLabel: sanitizeTextInput(body.audienceLabel, 120),
      courseNamesIncluded: (body.courseNamesIncluded ?? [])
        .map((item) => sanitizeTextInput(item, 120))
        .filter(Boolean)
        .slice(0, 8),
      branchesIncluded: (body.branchesIncluded ?? [])
        .map((item) => sanitizeTextInput(item, 120))
        .filter(Boolean)
        .slice(0, 8),
      subjectsCovered: (body.subjectsCovered ?? [])
        .map((item) => sanitizeTextInput(item, 120))
        .filter(Boolean)
        .slice(0, 10),
      points: (body.points ?? [])
        .map((item) => sanitizeTextInput(item, 120))
        .filter(Boolean)
        .slice(0, 6),
    });

    return NextResponse.json({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Course could not be updated.";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
