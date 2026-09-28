import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { createEnquiry, deleteEnquiry, getAllEnquiries, updateEnquiryStatus } from "@/lib/data-store";
import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

const VALID_STATUSES = new Set([
  "new",
  "contacted",
  "enrolled",
  "closed",
]);

const VALID_REQUEST_TYPES = new Set([
  "general",
  "consultation",
  "demo",
]);

export async function GET() {
  const session = await getSessionUser();

  if (
    !session ||
    !hasAnyRole(session, ["admin"])
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 403,
      },
    );
  }

  const enquiries = await getAllEnquiries();

  return NextResponse.json({
    enquiries,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
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
      suggestedCourses,
    } = body;

    const normalizedName =
      typeof name === "string"
        ? name.trim()
        : "";

    const normalizedContact =
      typeof contact === "string"
        ? contact.trim()
        : "";

    if (!normalizedName || !normalizedContact) {
      return NextResponse.json(
        {
          error:
            "Name and contact are required.",
        },
        {
          status: 400,
        },
      );
    }

    const contactDigits =
      normalizedContact.replace(/\D/g, "");

    if (contactDigits.length < 7) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid contact number.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedRequestType =
      typeof requestType === "string" &&
      VALID_REQUEST_TYPES.has(requestType)
        ? requestType
        : "general";

    const validatedSuggested =
      Array.isArray(suggestedCourses)
        ? suggestedCourses
            .filter(
              (suggestion: unknown) =>
                suggestion &&
                typeof suggestion === "object",
            )
            .slice(0, 10)
            .map((suggestion: any) => ({
              standardKey: String(
                suggestion.standardKey ?? "",
              ).slice(0, 80),

              title: String(
                suggestion.title ?? "",
              ).slice(0, 120),
            }))
            .filter(
              (suggestion) =>
                suggestion.standardKey &&
                suggestion.title,
            )
        : [];

    const enquiry = await createEnquiry({
      name: normalizedName.slice(0, 100),

      contact:
        normalizedContact.slice(0, 100),

      email:
        normalizedEmail.slice(0, 150),

      role: String(
        role ?? "student",
      ).slice(0, 30),

      courseTitle: String(
        courseTitle ?? "",
      ).slice(0, 200),

      courseKey: String(
        courseKey ?? "",
      ).slice(0, 80),

      branch: String(
        branch ?? "",
      ).slice(0, 100),

      preferredDate: String(
        preferredDate ?? "",
      ).slice(0, 30),

      preferredTime: String(
        preferredTime ?? "",
      ).slice(0, 30),

      requestType:
        normalizedRequestType as
          | "general"
          | "consultation"
          | "demo",

      source: String(
        source ?? "",
      ).slice(0, 100),

      message: String(
        message ?? "",
      ).slice(0, 500),

      suggestedCourses:
        validatedSuggested,
    });

    await logAction({
      action: "create",
      category: "enquiries",

      details: `Enquiry submitted by ${normalizedName}`,

      path: "/api/enquiries",
      method: "POST",
      request,

      metadata: {
        name: normalizedName,
        contact: normalizedContact,
        role: role ?? "student",
        courseTitle:
          courseTitle ?? "",
        courseKey:
          courseKey ?? "",
        requestType:
          normalizedRequestType,
        source:
          source ?? "",
        createdAt:
          enquiry.createdAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        enquiry,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Enquiry submission error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to submit enquiry",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();

  if (
    !session ||
    !hasAnyRole(session, ["admin"])
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status =
      typeof body.status === "string"
        ? body.status.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Enquiry ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid enquiry status.",
        },
        {
          status: 400,
        },
      );
    }

    const updated =
      await updateEnquiryStatus(
        id,
        status,
      );

    if (!updated) {
      return NextResponse.json(
        {
          error:
            "Enquiry could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    await logAction({
      action: "update",
      category: "enquiries",

      details:
        `Enquiry ${id} marked as ${status}`,

      path: "/api/enquiries",
      method: "PATCH",
      request,
      session,

      metadata: {
        enquiryId: id,
        status,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Enquiry update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update enquiry.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionUser();

  if (
    !session ||
    !hasAnyRole(session, ["admin"])
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const body = await request.json();

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          error: "Enquiry ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const deleted =
      await deleteEnquiry(id);

    if (!deleted) {
      return NextResponse.json(
        {
          error: "Enquiry not found.",
        },
        {
          status: 404,
        },
      );
    }

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

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Delete enquiry error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to delete enquiry.",
      },
      {
        status: 500,
      },
    );
  }
}

