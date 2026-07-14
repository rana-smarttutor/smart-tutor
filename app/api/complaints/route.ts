import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  createComplaint,
  getComplaintsForAdmin,
} from "@/lib/data-store";

import type {
  ComplaintCategory,
  ComplaintPriority,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  "academic",
  "faculty",
  "fees",
  "attendance",
  "technical",
  "facilities",
  "safety",
  "other",
];

const COMPLAINT_PRIORITIES: ComplaintPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

function getRequiredText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getComplaintCategory(
  value: unknown,
): ComplaintCategory | null {
  if (
    typeof value === "string" &&
    COMPLAINT_CATEGORIES.includes(
      value as ComplaintCategory,
    )
  ) {
    return value as ComplaintCategory;
  }

  return null;
}

function getComplaintPriority(
  value: unknown,
): ComplaintPriority | null {
  if (
    typeof value === "string" &&
    COMPLAINT_PRIORITIES.includes(
      value as ComplaintPriority,
    )
  ) {
    return value as ComplaintPriority;
  }

  return null;
}

export async function GET() {
  try {
    const session =
      await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Complaint records are private.
     * Only admins can retrieve the complaint list.
     */
    if (
      session.role !==
      "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only administrators can view complaints.",
        },
        {
          status: 403,
        },
      );
    }

    const complaints =
      await getComplaintsForAdmin();

    return NextResponse.json({
      complaints,
    });
  } catch (error) {
    console.error(
      "Get complaints error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load complaints.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const session =
      await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Only students, parents,
     * and educators can submit complaints.
     */
    if (
      session.role !==
        "student" &&
      session.role !==
        "parent" &&
      session.role !==
        "educator"
    ) {
      return NextResponse.json(
        {
          error:
            "Only students, parents, and educators can submit complaints.",
        },
        {
          status: 403,
        },
      );
    }

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const category =
      getComplaintCategory(
        body.category,
      );

    const subject =
      getRequiredText(
        body.subject,
      );

    const description =
      getRequiredText(
        body.description,
      );

    const priority =
      getComplaintPriority(
        body.priority,
      );

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Choose a valid complaint category.",
        },
        {
          status: 400,
        },
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          error:
            "Complaint subject is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      subject.length >
      150
    ) {
      return NextResponse.json(
        {
          error:
            "Complaint subject cannot exceed 150 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          error:
            "Complaint details are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      description.length <
      10
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide at least 10 characters in the complaint details.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      description.length >
      3000
    ) {
      return NextResponse.json(
        {
          error:
            "Complaint details cannot exceed 3000 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (!priority) {
      return NextResponse.json(
        {
          error:
            "Choose a valid complaint priority.",
        },
        {
          status: 400,
        },
      );
    }

    const complaint =
      await createComplaint({
        submittedById:
          session.id,

        submittedByName:
          session.name,

        submittedByRole:
          session.role,

        category,

        subject,

        description,

        priority,
      });

    /*
     * Do not return the full complaint.
     * The complaint record remains visible
     * only inside the admin complaint dashboard.
     */
    return NextResponse.json(
      {
        submitted:
          true,

        complaintId:
          complaint.id,

        message:
          "Your complaint has been submitted privately to the administration.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create complaint error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit complaint.",
      },
      {
        status: 500,
      },
    );
  }
}