import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  deleteCrmLead,
  getCrmCounsellorStaff,
  getCrmLeadById,
  updateCrmLead,
} from "@/lib/data-store";
import type {
  CrmLeadInterest,
  CrmLeadPriority,
  CrmLeadSource,
  CrmLeadStatus,
} from "@/lib/crm-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

const sources = new Set<CrmLeadSource>([
  "website",
  "whatsapp",
  "instagram",
  "google",
  "referral",
  "walk-in",
  "other",
]);

const priorities = new Set<CrmLeadPriority>([
  "high",
  "medium",
  "low",
]);

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

function hasField(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function getText(value: unknown, maxLength = 250) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function getDateTime(value: unknown) {
  const text = getText(value, 80);

  if (!text) {
    return undefined;
  }

  const parsed = new Date(text);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function getMoney(value: unknown, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? Math.round(number)
    : fallback;
}

function getEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
) {
  return typeof value === "string" && allowed.has(value as T)
    ? (value as T)
    : undefined;
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
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
    { error: "Only admins and counsellors can update CRM leads." },
    { status: 403 },
  );
}

const { leadId } = await context.params;
const existingLead = await getCrmLeadById(leadId);

if (!existingLead) {
  return NextResponse.json(
    { error: "CRM lead not found." },
    { status: 404 },
  );
}

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

  if (existingLead.assignedStaffId !== counsellorStaff.id) {
    return NextResponse.json(
      { error: "You can update only leads assigned to you." },
      { status: 403 },
    );
  }
}

const body = (await request.json()) as Record<string, unknown>;
const action = getText(body.action, 40) || "update";

if (
  session.role === "counsellor" &&
  (hasField(body, "assignedStaffId") ||
    hasField(body, "assignedStaffName"))
) {
  return NextResponse.json(
    { error: "Counsellors cannot reassign CRM leads." },
    { status: 403 },
  );
}

const updates: Parameters<typeof updateCrmLead>[0]["updates"] = {};

    if (hasField(body, "studentName")) {
      const value = getText(body.studentName, 100);

      if (!value) {
        return NextResponse.json(
          { error: "Student name cannot be empty." },
          { status: 400 },
        );
      }

      updates.studentName = value;
    }

    if (hasField(body, "studentPhone")) {
      const value = getText(body.studentPhone, 25);

      if (!value) {
        return NextResponse.json(
          { error: "Student contact number cannot be empty." },
          { status: 400 },
        );
      }

      updates.studentPhone = value;
    }

    if (hasField(body, "studentEmail")) {
      updates.studentEmail = getText(body.studentEmail, 120) || undefined;
    }

    if (hasField(body, "parentName")) {
      updates.parentName = getText(body.parentName, 100) || undefined;
    }

    if (hasField(body, "parentPhone")) {
      updates.parentPhone = getText(body.parentPhone, 25) || undefined;
    }

    if (hasField(body, "parentEmail")) {
      updates.parentEmail = getText(body.parentEmail, 120) || undefined;
    }

    if (hasField(body, "courseInterested")) {
      const value = getText(body.courseInterested, 150);

      if (!value) {
        return NextResponse.json(
          { error: "Course interested cannot be empty." },
          { status: 400 },
        );
      }

      updates.courseInterested = value;
    }

    if (hasField(body, "branch")) {
      updates.branch = getText(body.branch, 100) || undefined;
    }

    if (hasField(body, "source")) {
      const source = getEnum(body.source, sources);

      if (!source) {
        return NextResponse.json(
          { error: "Invalid lead source." },
          { status: 400 },
        );
      }

      updates.source = source;
    }

    if (hasField(body, "priority")) {
      const priority = getEnum(body.priority, priorities);

      if (!priority) {
        return NextResponse.json(
          { error: "Invalid lead priority." },
          { status: 400 },
        );
      }

      updates.priority = priority;
    }

    if (hasField(body, "interest")) {
      const interest = getEnum(body.interest, interests);

      if (!interest) {
        return NextResponse.json(
          { error: "Invalid interest value." },
          { status: 400 },
        );
      }

      updates.interest = interest;
    }

    if (hasField(body, "status")) {
      const status = getEnum(body.status, statuses);

      if (!status) {
        return NextResponse.json(
          { error: "Invalid lead status." },
          { status: 400 },
        );
      }

      updates.status = status;
    }

    if (hasField(body, "assignedStaffId")) {
      updates.assignedStaffId =
        getText(body.assignedStaffId, 120) || undefined;
    }

    if (hasField(body, "assignedStaffName")) {
      updates.assignedStaffName =
        getText(body.assignedStaffName, 100) || undefined;
    }

    if (hasField(body, "nextFollowUpAt")) {
      updates.nextFollowUpAt = getDateTime(body.nextFollowUpAt);
    }

    let activityType: Parameters<typeof updateCrmLead>[0]["activityType"] =
      "updated";

    let activityMessage = "Lead details updated.";

    if (action === "note") {
      const note = getText(body.note, 2000);

      if (!note) {
        return NextResponse.json(
          { error: "Write a note before saving." },
          { status: 400 },
        );
      }

      activityType = "note";
      activityMessage = note;
    }

    if (action === "call") {
      activityType = "call";
      activityMessage =
        getText(body.note, 2000) || "Call activity recorded.";

      updates.lastContactedAt = new Date().toISOString();

      if (!updates.status) {
        updates.status = "follow-up";
      }
    }

    if (action === "demo") {
      const demoStatus =
        getText(body.demoStatus, 40) || "scheduled";

      if (
        ![
          "not-scheduled",
          "scheduled",
          "attended",
          "missed",
          "rescheduled",
        ].includes(demoStatus)
      ) {
        return NextResponse.json(
          { error: "Invalid demo status." },
          { status: 400 },
        );
      }

      updates.demo = {
        status: demoStatus as typeof existingLead.demo.status,
        scheduledAt: getDateTime(body.demoScheduledAt),
        educatorName:
          getText(body.demoEducatorName, 100) || undefined,
        mode:
          body.demoMode === "online" || body.demoMode === "offline"
            ? body.demoMode
            : undefined,
        notes: getText(body.note, 2000) || undefined,
      };

      if (
        demoStatus === "scheduled" ||
        demoStatus === "rescheduled"
      ) {
        updates.status = "demo-scheduled";
      }

      activityType = "demo";
      activityMessage =
        getText(body.note, 2000) ||
        `Demo class marked as ${demoStatus}.`;
    }

    if (action === "admission") {
      const totalFee = getMoney(body.totalFee);
      const paidAmount = getMoney(body.paidAmount);

      if (paidAmount > totalFee) {
        return NextResponse.json(
          { error: "Paid amount cannot be higher than total fee." },
          { status: 400 },
        );
      }

      const pendingAmount = Math.max(0, totalFee - paidAmount);

      updates.status = "admitted";
      updates.interest = "interested";
      updates.admission = {
        convertedAt: new Date().toISOString(),
        totalFee,
        paidAmount,
        pendingAmount,
        paymentStatus:
          pendingAmount === 0
            ? "paid"
            : paidAmount > 0
              ? "partial"
              : "pending",
        notes: getText(body.note, 2000) || undefined,
      };

      activityType = "admission";
      activityMessage =
        getText(body.note, 2000) ||
        "Lead converted into an admission.";
    }

    if (action === "lost") {
      updates.status = "lost";
      updates.interest = "not-interested";

      activityType = "lost";
      activityMessage =
        getText(body.note, 2000) ||
        "Lead marked as not interested.";
    }

    if (
      action === "update" &&
      updates.assignedStaffId !== existingLead.assignedStaffId
    ) {
      activityType = "assignment";
      activityMessage = updates.assignedStaffName
        ? `Lead assigned to ${updates.assignedStaffName}.`
        : "Lead assignment removed.";
    }

    const lead = await updateCrmLead({
      leadId,
      actorId: session.id,
      actorName: session.name,
      activityType,
      activityMessage,
      updates,
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Update CRM lead error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update CRM lead.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const session = await getSessionUser();

  if (session?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can delete CRM leads." },
      { status: 403 },
    );
  }

  const { leadId } = await context.params;
  const deletedLead = await deleteCrmLead(leadId);

  if (!deletedLead) {
    return NextResponse.json(
      { error: "CRM lead not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}