import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import {
  deletePlacementJob,
  getPlacementJobById,
  updatePlacementJob,
} from "@/lib/data-store";
import type {
  PlacementApplicationQuestion,
  PlacementJobStatus,
  PlacementJobType,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

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
      const id = getText(record.id, 160);
      const label = getText(record.label, 180);

      if (!id || !label) {
        return null;
      }

      return {
        id,
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

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const { jobId } = await params;
  const job = await getPlacementJobById(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "Placement job not found." },
      { status: 404 },
    );
  }

  if (job.status !== "published") {
    const session = await getSessionUser();

    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { error: "Placement job not found." },
        { status: 404 },
      );
    }
  }

  return NextResponse.json({ job });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { error: "Only admins can update placement jobs." },
        { status: 403 },
      );
    }

    const { jobId } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const updates: Parameters<typeof updatePlacementJob>[1] = {};

    if ("company" in body) {
      const company = getText(body.company, 120);

      if (!company) {
        return NextResponse.json(
          { error: "Company name cannot be empty." },
          { status: 400 },
        );
      }

      updates.company = company;
    }

    if ("role" in body) {
      const role = getText(body.role, 140);

      if (!role) {
        return NextResponse.json(
          { error: "Job role cannot be empty." },
          { status: 400 },
        );
      }

      updates.role = role;
    }

    if ("location" in body) {
      const location = getText(body.location, 140);

      if (!location) {
        return NextResponse.json(
          { error: "Location cannot be empty." },
          { status: 400 },
        );
      }

      updates.location = location;
    }

    if ("salary" in body) {
      updates.salary = getText(body.salary, 120);
    }

    if ("eligibility" in body) {
      updates.eligibility = getText(body.eligibility, 1000);
    }

    if ("description" in body) {
      const description = getText(body.description, 8000);

      if (!description) {
        return NextResponse.json(
          { error: "Description cannot be empty." },
          { status: 400 },
        );
      }

      updates.description = description;
    }

    if ("deadline" in body) {
      const deadline = getDate(body.deadline);

      if (!deadline) {
        return NextResponse.json(
          { error: "Enter a valid deadline." },
          { status: 400 },
        );
      }

      updates.deadline = deadline;
    }

    if ("jobType" in body) {
      if (!jobTypes.has(body.jobType as PlacementJobType)) {
        return NextResponse.json(
          { error: "Choose a valid job type." },
          { status: 400 },
        );
      }

      updates.jobType = body.jobType as PlacementJobType;
    }

    if ("status" in body) {
      if (!jobStatuses.has(body.status as PlacementJobStatus)) {
        return NextResponse.json(
          { error: "Choose a valid job status." },
          { status: 400 },
        );
      }

      updates.status = body.status as PlacementJobStatus;
    }

    if ("skills" in body) {
      updates.skills = getSkills(body.skills);
    }

    if ("applicationQuestions" in body) {
      updates.applicationQuestions = getQuestions(body.applicationQuestions);
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { error: "No valid placement job changes were provided." },
        { status: 400 },
      );
    }

    const job = await updatePlacementJob(jobId, updates);

    if (!job) {
      return NextResponse.json(
        { error: "Placement job not found." },
        { status: 404 },
      );
    }

    revalidatePath("/placements");

    await logAction({
      action: "update",
      category: "placement",
      details: `Updated placement job: ${job.role} at ${job.company} (${jobId})`,
      path: `/api/placement-jobs/${jobId}`,
      method: "PATCH",
      request,
      session,
      metadata: { jobId, updates: Object.keys(updates) },
    });

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update placement job.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { error: "Only admins can delete placement jobs." },
        { status: 403 },
      );
    }

    const { jobId } = await params;
    const deleted = await deletePlacementJob(jobId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Placement job not found." },
        { status: 404 },
      );
    }

    revalidatePath("/placements");

    await logAction({
      action: "delete",
      category: "placement",
      details: `Deleted placement job: ${jobId}`,
      path: `/api/placement-jobs/${jobId}`,
      method: "DELETE",
      request,
      session,
      metadata: { jobId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete placement job." },
      { status: 500 },
    );
  }
}
