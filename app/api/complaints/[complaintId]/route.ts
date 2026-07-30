import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";

import {
  deleteComplaint,
  getComplaintById,
  updateComplaint,
} from "@/lib/data-store";

import type {
  ComplaintStatus,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    complaintId: string;
  }>;
};

const COMPLAINT_STATUSES: ComplaintStatus[] = [
  "submitted",
  "under-review",
  "resolved",
  "closed",
];

function getComplaintStatus(
  value: unknown,
): ComplaintStatus | undefined {
  if (
    typeof value === "string" &&
    COMPLAINT_STATUSES.includes(
      value as ComplaintStatus,
    )
  ) {
    return value as ComplaintStatus;
  }

  return undefined;
}

function getAdminNote(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : undefined;
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const session =
      await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Complaint records and management
     * are available only to administrators.
     */
    if (
      session.role !==
      "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only administrators can manage complaints.",
        },
        {
          status: 403,
        },
      );
    }

    const {
      complaintId,
    } = await context.params;

    const existingComplaint =
      await getComplaintById(
        complaintId,
      );

    if (
      !existingComplaint
    ) {
      return NextResponse.json(
        {
          error:
            "Complaint not found.",
        },
        {
          status: 404,
        },
      );
    }

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const status =
      getComplaintStatus(
        body.status,
      );

    const adminNote =
      getAdminNote(
        body.adminNote,
      );

    if (
      body.status !==
        undefined &&
      !status
    ) {
      return NextResponse.json(
        {
          error:
            "Choose a valid complaint status.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      adminNote &&
      adminNote.length >
        3000
    ) {
      return NextResponse.json(
        {
          error:
            "Admin note cannot exceed 3000 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.status ===
        undefined &&
      body.adminNote ===
        undefined
    ) {
      return NextResponse.json(
        {
          error:
            "No complaint changes were provided.",
        },
        {
          status: 400,
        },
      );
    }

    const updatedComplaint =
      await updateComplaint(
        complaintId,
        {
          status,

          adminNote:
            body.adminNote !==
            undefined
              ? adminNote ?? ""
              : undefined,

          reviewedBy:
            session.id,

          reviewedByName:
            session.name,
        },
      );

    if (
      !updatedComplaint
    ) {
      return NextResponse.json(
        {
          error:
            "Complaint could not be updated.",
        },
        {
          status: 404,
        },
      );
    }

    await logAction({
      action: "update",
      category: "complaints",
      details: `Complaint ${complaintId} updated by ${session.name}`,
      path: "/api/complaints/[complaintId]",
      method: "PUT",
      request,
      session,
      metadata: { complaintId, status, adminNote },
    });

    return NextResponse.json({
      complaint:
        updatedComplaint,

      message:
        "Complaint updated successfully.",
    });
  } catch (error) {
    console.error(
      "Update complaint error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to update complaint.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session =
      await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Only administrators are allowed
     * to permanently delete complaints.
     */
    if (
      session.role !==
      "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only administrators can delete complaints.",
        },
        {
          status: 403,
        },
      );
    }

    const {
      complaintId,
    } = await context.params;

    const existingComplaint =
      await getComplaintById(
        complaintId,
      );

    if (
      !existingComplaint
    ) {
      return NextResponse.json(
        {
          error:
            "Complaint not found.",
        },
        {
          status: 404,
        },
      );
    }

    const deleted =
      await deleteComplaint(
        complaintId,
      );

    if (!deleted) {
      return NextResponse.json(
        {
          error:
            "Complaint could not be deleted.",
        },
        {
          status: 404,
        },
      );
    }

    await logAction({
      action: "delete",
      category: "complaints",
      details: `Complaint ${complaintId} deleted by ${session.name}`,
      path: "/api/complaints/[complaintId]",
      method: "DELETE",
      request: _request,
      session,
      metadata: { complaintId },
    });

    return NextResponse.json({
      deleted:
        true,

      message:
        "Complaint deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete complaint error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to delete complaint.",
      },
      {
        status: 500,
      },
    );
  }
}