import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  createNotifications,
  createTeacherFeedback,
  getNotificationRecipientIdsForStudents,
  getStudentDirectory,
  getTeacherFeedbackForRole,
} from "@/lib/data-store";

import type {
  TeacherFeedback,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEEDBACK_CATEGORIES =
  new Set<
    TeacherFeedback["category"]
  >([
    "academic",
    "homework",
    "attendance",
    "improvement",
  ]);

function canManageFeedback(
  role: string,
) {
  return (
    role === "admin" ||
    role === "educator"
  );
}

function getRequiredText(
  value: unknown,
  label: string,
  maxLength = 2000,
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return value
    .trim()
    .slice(
      0,
      maxLength,
    );
}

function getOptionalText(
  value: unknown,
  maxLength = 2000,
) {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const cleaned =
    value
      .trim()
      .slice(
        0,
        maxLength,
      );

  return (
    cleaned ||
    undefined
  );
}

function getBoolean(
  value: unknown,
  fallback: boolean,
) {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}

/*
 * Load teacher feedback
 * according to the logged-in
 * user's role.
 */
export async function GET() {
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

    const teacherFeedback =
      await getTeacherFeedbackForRole(
        session.role,
        session.id,
      );

    return NextResponse.json({
      teacherFeedback,
    });
  } catch (error) {
    console.error(
      "Get teacher feedback error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load teacher feedback.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * Create teacher feedback.
 *
 * Only admin and educator
 * accounts can create records.
 */
export async function POST(
  request: Request,
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
      !canManageFeedback(
        session.role,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only admins and educators can create teacher feedback.",
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

    /*
     * Reject any old Behaviour
     * request that may still be
     * sent from cached frontend code.
     */
    if (
      body.type !==
        undefined &&
      body.type !==
        "feedback"
    ) {
      return NextResponse.json(
        {
          error:
            "Only teacher feedback records are supported.",
        },
        {
          status: 400,
        },
      );
    }

    const studentId =
      getRequiredText(
        body.studentId,
        "Student",
        150,
      );

    const studentDirectory =
      await getStudentDirectory(
        session.role ===
          "educator"
          ? session.id
          : undefined,
      );

    const selectedStudent =
      studentDirectory.find(
        (student) =>
          student.id ===
            studentId &&
          student.role ===
            "student",
      );

    if (
      !selectedStudent
    ) {
      return NextResponse.json(
        {
          error:
            "Selected student was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const rawCategory =
      getRequiredText(
        body.category,
        "Feedback category",
        50,
      );

    if (
      !FEEDBACK_CATEGORIES.has(
        rawCategory as TeacherFeedback["category"],
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Choose a valid feedback category.",
        },
        {
          status: 400,
        },
      );
    }

    const visibleToParent =
      getBoolean(
        body.visibleToParent,
        true,
      );

    const feedback =
      await createTeacherFeedback(
        {
          studentId:
            selectedStudent.id,

          studentName:
            selectedStudent.name,

          teacherId:
            session.id,

          teacherName:
            session.name,

          subject:
            getOptionalText(
              body.subject,
              150,
            ),

          category:
            rawCategory as TeacherFeedback["category"],

          strengths:
            getOptionalText(
              body.strengths,
              1500,
            ),

          areasToImprove:
            getOptionalText(
              body.areasToImprove,
              1500,
            ),

          feedback:
            getRequiredText(
              body.feedback,
              "Teacher feedback",
              3000,
            ),

          visibleToParent,
        },
      );

    /*
     * Notify the student and
     * linked parent only when
     * the feedback is marked
     * visible to them.
     */
    let recipientIds:
      string[] = [];

    if (
      feedback.visibleToParent
    ) {
      recipientIds =
        await getNotificationRecipientIdsForStudents(
          [
            feedback.studentId,
          ],
          {
            includeLinkedParents:
              true,
          },
        );

      if (
        recipientIds.length >
        0
      ) {
        await createNotifications(
          {
            userIds:
              recipientIds,

            title:
              "New teacher feedback",

            message:
              `New teacher feedback has been added for ${feedback.studentName}.`,

            type:
              "feedback",

            link:
              "/dashboard",
          },
        );
      }
    }

    return NextResponse.json(
      {
        feedback,

        notified:
          recipientIds.length >
          0,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create teacher feedback error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to create teacher feedback.",
      },
      {
        status: 400,
      },
    );
  }
}