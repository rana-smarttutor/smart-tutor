import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createPlacementJob,
  getPlacementJobs,
} from "@/lib/data-store";
import type {
  PlacementApplicationQuestion,
  PlacementJobStatus,
  PlacementJobType,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jobTypes = new Set<PlacementJobType>([
  "full-time",
  "internship",
  "part-time",
  "contract",
]);

const jobStatuses = new Set<PlacementJobStatus>([
  "draft",
  "published",
  "closed",
]);

function getText(value: unknown, maxLength = 300) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function getDate(value: unknown) {
  const text = getText(value, 20);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const date = new Date(`${text}T12:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
  ) {
    return null;
  }

  return text;
}

function getSkills(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 80))
        .filter(Boolean),
    ),
  ].slice(0, 30);
}

function getQuestions(value: unknown): PlacementApplicationQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const label = getText(record.label, 180);

      if (!label) {
        return null;
      }

      return {
        id: `placement-question-${randomUUID()}`,
        label,
        required: record.required === true,
      };
    })
    .filter(
      (question): question is PlacementApplicationQuestion =>
        question !== null,
    )
    .slice(0, 10);
}

function isAdmin(role?: string) {
  return role === "admin";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeAll = url.searchParams.get("scope") === "admin";

  if (includeAll) {
    const session = await getSessionUser();

    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { error: "Admin access is required." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      jobs: await getPlacementJobs({
        includeUnpublished: true,
      }),
    });
  }

 const session = await getSessionUser();

return NextResponse.json({
  jobs: await getPlacementJobs(),
  viewerRole: session?.role ?? null,
});
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { error: "Only admins can create placement jobs." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const company = getText(body.company, 120);
    const role = getText(body.role, 140);
    const location = getText(body.location, 140);
    const salary = getText(body.salary, 120);
    const eligibility = getText(body.eligibility, 1000);
    const deadline = getDate(body.deadline);
    const description = getText(body.description, 8000);
    const skills = getSkills(body.skills);
    const applicationQuestions = getQuestions(body.applicationQuestions);

    const jobType = jobTypes.has(body.jobType as PlacementJobType)
      ? (body.jobType as PlacementJobType)
      : null;

    const status = jobStatuses.has(body.status as PlacementJobStatus)
      ? (body.status as PlacementJobStatus)
      : "draft";

    if (
      !company ||
      !role ||
      !location ||
      !jobType ||
      !deadline ||
      !description
    ) {
      return NextResponse.json(
        {
          error:
            "Company, role, location, job type, deadline, and description are required.",
        },
        { status: 400 },
      );
    }

    const job = await createPlacementJob({
      company,
      role,
      location,
      salary: salary || undefined,
      eligibility: eligibility || undefined,
      jobType,
      deadline,
      description,
      skills,
      applicationQuestions,
      status,
      createdBy: session.id,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create placement job.",
      },
      { status: 500 },
    );
  }
}