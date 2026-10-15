import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser, hasAnyRole } from "@/lib/auth";
import {
  createEnquiry,
  deleteEnquiry,
  getAllEnquiries,
  updateEnquiryStatus,
} from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["new", "contacted", "enrolled", "closed"]);

const VALID_REQUEST_TYPES = new Set(["general", "consultation", "demo"]);

function canManageEnquiries(
  session: Awaited<ReturnType<typeof getSessionUser>>,
): boolean {
  return Boolean(
    session && hasAnyRole(session, ["admin", "staff", "counsellor"]),
  );
}

function getText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getSuggestedCourses(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    )
    .slice(0, 10)
    .map((item) => ({
      standardKey: getText(item.standardKey, 80),
      title: getText(item.title, 120),
    }))
    .filter((item) => item.standardKey && item.title);
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!canManageEnquiries(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const enquiries = await getAllEnquiries();

    return NextResponse.json(
      {
        enquiries,
        canDelete: session?.role === "admin",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Get enquiries error:", error);

    return NextResponse.json(
      { error: "Unable to load enquiries." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid enquiry data." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const submissionId = getText(input.submissionId, 100);

    if (submissionId && !/^[a-zA-Z0-9_-]{1,100}$/.test(submissionId)) {
      return NextResponse.json(
        { error: "Invalid submission identifier." },
        { status: 400 },
      );
    }

    const name = getText(input.name, 100);
    const contact = getText(input.contact, 100);
    const email = getText(input.email, 150).toLowerCase();
    const role = getText(input.role, 30) || "student";
    const courseTitle = getText(input.courseTitle, 200);
    const courseKey = getText(input.courseKey, 80);
    const branch = getText(input.branch, 100);
    const preferredDate = getText(input.preferredDate, 30);
    const preferredTime = getText(input.preferredTime, 30);
    const source = getText(input.source, 100);
    const message = getText(input.message, 500);

    const rawRequestType = getText(input.requestType, 30);

    const requestType = VALID_REQUEST_TYPES.has(rawRequestType)
      ? (rawRequestType as "general" | "consultation" | "demo")
      : "general";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const contactDigits = contact.replace(/\D/g, "");

    if (contactDigits.length < 7 || contactDigits.length > 15) {
      return NextResponse.json(
        { error: "Please enter a valid contact number." },
        { status: 400 },
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (["consultation", "demo"].includes(requestType) && !courseTitle) {
      return NextResponse.json(
        { error: "Course or program is required." },
        { status: 400 },
      );
    }

    if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return NextResponse.json(
        { error: "Invalid preferred date format." },
        { status: 400 },
      );
    }

    if (preferredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(preferredTime)) {
      return NextResponse.json(
        { error: "Invalid preferred time format." },
        { status: 400 },
      );
    }

    const enquiry = await createEnquiry({
      name,
      contact,
      email,
      role,
      courseTitle,
      courseKey,
      branch,
      preferredDate,
      preferredTime,
      requestType,
      source,
      message,
      suggestedCourses: getSuggestedCourses(input.suggestedCourses),
      submissionId,
    });

    try {
      await logAction({
        action: "create",
        category: "enquiries",
        details: `Enquiry submitted by ${name}`,
        path: "/api/enquiries",
        method: "POST",
        request,
        metadata: {
          enquiryId: enquiry.id,
          submissionId,
          requestType,
          source,
          createdAt: enquiry.createdAt,
        },
      });
    } catch (auditError) {
      console.error("Enquiry audit logging failed:", auditError);
    }

    return NextResponse.json(
      {
        success: true,
        enquiry,
        message: "Enquiry submitted successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Enquiry submission error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit enquiry.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();

    if (!canManageEnquiries(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const id = getText(body.id, 200);
    const status = getText(body.status, 30);

    if (!id) {
      return NextResponse.json(
        { error: "Enquiry ID is required." },
        { status: 400 },
      );
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid enquiry status." },
        { status: 400 },
      );
    }

    const updated = await updateEnquiryStatus(id, status);

    if (!updated) {
      return NextResponse.json(
        { error: "Enquiry not found." },
        { status: 404 },
      );
    }

    try {
      await logAction({
        action: "update",
        category: "enquiries",
        details: `Enquiry ${id} marked as ${status}`,
        path: "/api/enquiries",
        method: "PATCH",
        request,
        session: session!,
        metadata: {
          enquiryId: id,
          status,
        },
      });
    } catch (auditError) {
      console.error("Enquiry update audit failed:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry status updated successfully.",
    });
  } catch (error) {
    console.error("Enquiry update error:", error);

    return NextResponse.json(
      { error: "Failed to update enquiry." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session || !hasAnyRole(session, ["admin"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const id = getText(body.id, 200);

    if (!id) {
      return NextResponse.json(
        { error: "Enquiry ID is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteEnquiry(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Enquiry not found." },
        { status: 404 },
      );
    }

    try {
      await logAction({
        action: "delete",
        category: "enquiries",
        details: `Enquiry ${id} deleted`,
        path: "/api/enquiries",
        method: "DELETE",
        request,
        session,
        metadata: {
          enquiryId: id,
        },
      });
    } catch (auditError) {
      console.error("Enquiry deletion audit failed:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry deleted successfully.",
    });
  } catch (error) {
    console.error("Delete enquiry error:", error);

    return NextResponse.json(
      { error: "Unable to delete enquiry." },
      { status: 500 },
    );
  }
}
