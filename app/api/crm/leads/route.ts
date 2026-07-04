import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createCrmLead,
  getCrmAdminWorkspace,
  getCrmCounsellorStaff,
  getCrmCounsellorWorkspace,
} from "@/lib/data-store";
import type {
  CrmLeadInterest,
  CrmLeadPriority,
  CrmLeadSource,
  CrmLeadStatus,
} from "@/lib/crm-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sources = new Set<CrmLeadSource>([
  "website",
  "whatsapp",
  "instagram",
  "google",
  "referral",
  "walk-in",
  "other",
]);

const priorities = new Set<CrmLeadPriority>(["high", "medium", "low"]);

const interests = new Set<CrmLeadInterest>([
  "interested",
  "undecided",
  "not-interested",
]);

const statuses = new Set<CrmLeadStatus>([
  "new",
  "contacted",
  "follow-up",
  "counselling",
  "demo-scheduled",
  "admission-pending",
  "admitted",
  "lost",
]);

function getText(value: unknown, maxLength = 250) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getDateTime(value: unknown) {
  const text = getText(value, 80);

  if (!text) {
    return undefined;
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function getEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
  fallback: T,
) {
  return typeof value === "string" && allowed.has(value as T)
    ? (value as T)
    : fallback;
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (session.role === "admin") {
      return NextResponse.json(await getCrmAdminWorkspace());
    }

    if (session.role === "counsellor") {
      return NextResponse.json(await getCrmCounsellorWorkspace(session.id));
    }

    return NextResponse.json(
      { error: "You do not have access to the Sales CRM." },
      { status: 403 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load Sales CRM.",
      },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (session.role !== "admin" && session.role !== "counsellor") {
      return NextResponse.json(
        { error: "Only admins and counsellors can create CRM leads." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    let assignedStaffId = getText(body.assignedStaffId, 120) || undefined;

    let assignedStaffName = getText(body.assignedStaffName, 100) || undefined;

    if (session.role === "counsellor") {
      const counsellorStaff = await getCrmCounsellorStaff(session.id);

      if (!counsellorStaff) {
        return NextResponse.json(
          {
            error:
              "Your counsellor account is not linked to an active CRM staff profile.",
          },
          { status: 403 },
        );
      }

      assignedStaffId = counsellorStaff.id;
      assignedStaffName = counsellorStaff.name;
    }

    const studentName = getText(body.studentName, 100);
    const studentPhone = getText(body.studentPhone, 25);
    const courseInterested = getText(body.courseInterested, 150);

    if (!studentName || !studentPhone || !courseInterested) {
      return NextResponse.json(
        {
          error:
            "Student name, student contact number, and course interested are required.",
        },
        { status: 400 },
      );
    }

    const interest = getEnum(body.interest, interests, "undecided");

    const lead = await createCrmLead({
      studentName,
      studentPhone,
      studentEmail: getText(body.studentEmail, 120) || undefined,

      parentName: getText(body.parentName, 100) || undefined,
      parentPhone: getText(body.parentPhone, 25) || undefined,
      parentEmail: getText(body.parentEmail, 120) || undefined,

      courseInterested,
      branch: getText(body.branch, 100) || undefined,

      source: getEnum(body.source, sources, "website"),
      priority: getEnum(body.priority, priorities, "medium"),
      interest,
      status:
        session.role === "counsellor"
          ? "new"
          : getEnum(body.status, statuses, "new"),

      assignedStaffId,
      assignedStaffName,

      nextFollowUpAt: getDateTime(body.nextFollowUpAt),
      lastContactedAt: undefined,

      demo: {
        status: "not-scheduled",
      },

      admission: {
        totalFee: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paymentStatus: "not-applicable",
      },

      createdBy: session.id,
      createdByName: session.name,
      updatedBy: session.id,
      updatedByName: session.name,
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Create CRM lead error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create CRM lead.",
      },
      { status: 500 },
    );
  }
}
