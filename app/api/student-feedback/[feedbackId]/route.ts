import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";

import {
  deleteTeacherFeedback,
  getTeacherFeedbackForRole,
  updateTeacherFeedback,
} from "@/lib/data-store";

import type {
  TeacherFeedback,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    feedbackId: string;
  }>;
};

const FEEDBACK_CATEGORIES =
  new Set<
    TeacherFeedback["category"]
  >([
    "academic",
    "homework",
    "attendance",
    "improvement",
  ]);

function hasField(
  body: Record<string, unknown>,
  field: string,
) {
  return Object.prototype.hasOwnProperty.call(
    body,
    field,
  );
}

function getRequiredText(
  value: unknown,
  label: string,
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return value.trim();
}

function getOptionalText(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

async function getAllowedFeedback(
  feedbackId: string,
  role:
    | "admin"
    | "educator",
  userId: string,
) {
  const feedbackItems =
    await getTeacherFeedbackForRole(
      role,
      userId,
    );

  return (
    feedbackItems.find(
      (item) =>
        item.id ===
        feedbackId,
    ) ?? null
  );
}

export async function PATCH(
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

    if (
      session.role !==
        "admin" &&
      session.role !==
        "educator"
    ) {
      return NextResponse.json(
        {
          error:
            "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    const {
      feedbackId,
    } =
      await context.params;

    /*
     * Behaviour IDs are no
     * longer supported.
     */
    if (
      !feedbackId.startsWith(
        "feedback-",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid teacher feedback ID.",
        },
        {
          status: 400,
        },
      );
    }

    const existingFeedback =
      await getAllowedFeedback(
        feedbackId,
        session.role,
        session.id,
      );

    if (
      !existingFeedback
    ) {
      return NextResponse.json(
        {
          error:
            "Teacher feedback was not found or you do not have permission to edit it.",
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

    const updates: Partial<{
      category:
        TeacherFeedback["category"];

      strengths:
        string;

      areasToImprove:
        string;

      feedback:
        string;

      visibleToParent:
        boolean;

      subject:
        string;
    }> = {};

    if (
      hasField(
        body,
        "category",
      )
    ) {
      const category =
        getRequiredText(
          body.category,
          "Feedback category",
        );

      if (
        !FEEDBACK_CATEGORIES.has(
          category as TeacherFeedback["category"],
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid feedback category.",
          },
          {
            status: 400,
          },
        );
      }

      updates.category =
        category as TeacherFeedback["category"];
    }

    if (
      hasField(
        body,
        "strengths",
      )
    ) {
      updates.strengths =
        getOptionalText(
          body.strengths,
        );
    }

    if (
      hasField(
        body,
        "areasToImprove",
      )
    ) {
      updates.areasToImprove =
        getOptionalText(
          body.areasToImprove,
        );
    }

    if (
      hasField(
        body,
        "feedback",
      )
    ) {
      updates.feedback =
        getRequiredText(
          body.feedback,
          "Teacher feedback",
        );
    }

    if (
      hasField(
        body,
        "subject",
      )
    ) {
      updates.subject =
        getOptionalText(
          body.subject,
        );
    }

    if (
      hasField(
        body,
        "visibleToParent",
      )
    ) {
      if (
        typeof body.visibleToParent !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "visibleToParent must be true or false.",
          },
          {
            status: 400,
          },
        );
      }

      updates.visibleToParent =
        body.visibleToParent;
    }

    const feedback =
      await updateTeacherFeedback(
        feedbackId,
        updates,
      );

    if (!feedback) {
      return NextResponse.json(
        {
          error:
            "Teacher feedback was not found.",
        },
        {
          status: 404,
        },
      );
    }

    await logAction({
      action: "update",
      category: "feedback",
      details: `Teacher feedback updated: ${feedbackId}`,
      path: `/api/student-feedback/${feedbackId}`,
      method: "PATCH",
      request,
      session,
      metadata: { feedbackId, studentId: existingFeedback.studentId, studentName: existingFeedback.studentName },
    });

    return NextResponse.json({
      feedback,
    });
  } catch (error) {
    console.error(
      "Update teacher feedback error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update teacher feedback.",
      },
      {
        status: 400,
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

    if (
      session.role !==
        "admin" &&
      session.role !==
        "educator"
    ) {
      return NextResponse.json(
        {
          error:
            "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    const {
      feedbackId,
    } =
      await context.params;

    if (
      !feedbackId.startsWith(
        "feedback-",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid teacher feedback ID.",
        },
        {
          status: 400,
        },
      );
    }

    const existingFeedback =
      await getAllowedFeedback(
        feedbackId,
        session.role,
        session.id,
      );

    if (
      !existingFeedback
    ) {
      return NextResponse.json(
        {
          error:
            "Teacher feedback was not found or you do not have permission to delete it.",
        },
        {
          status: 404,
        },
      );
    }

    const deleted =
      await deleteTeacherFeedback(
        feedbackId,
      );

    if (!deleted) {
      return NextResponse.json(
        {
          error:
            "Teacher feedback was not found.",
        },
        {
          status: 404,
        },
      );
    }

    await logAction({
      action: "delete",
      category: "feedback",
      details: `Teacher feedback deleted: ${feedbackId}`,
      path: `/api/student-feedback/${feedbackId}`,
      method: "DELETE",
      request: _request,
      session,
      metadata: { feedbackId, studentId: existingFeedback.studentId, studentName: existingFeedback.studentName },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Delete teacher feedback error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete teacher feedback.",
      },
      {
        status: 500,
      },
    );
  }
}