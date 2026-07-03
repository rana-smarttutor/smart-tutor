import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  createBehaviourNote,
  createNotifications,
  createTeacherFeedback,
  getBatchesForRole,
  getBehaviourNotesForRole,
  getNotificationRecipientIdsForStudents,
  getTeacherFeedbackForRole,
} from "@/lib/data-store";
import type { BehaviourNote, TeacherFeedback } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEEDBACK_CATEGORIES = new Set([
  "academic",
  "homework",
  "attendance",
  "improvement",
]);

const BEHAVIOUR_RATINGS = new Set([
  "excellent",
  "good",
  "needs-improvement",
  "concern",
]);

function getRequiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function getBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [teacherFeedback, behaviourNotes] = await Promise.all([
      getTeacherFeedbackForRole(session.role, session.id),
      getBehaviourNotesForRole(session.role, session.id),
    ]);

    return NextResponse.json({
      teacherFeedback,
      behaviourNotes,
    });
  } catch (error) {
    console.error("Get student feedback error:", error);

    return NextResponse.json(
      { error: "Unable to load student feedback." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const type =
      typeof body.type === "string" ? body.type.trim().toLowerCase() : "";

    if (type !== "feedback" && type !== "behaviour") {
      return NextResponse.json(
        { error: "Choose feedback or behaviour note." },
        { status: 400 },
      );
    }

    const batchId = getRequiredText(body.batchId, "Batch");
    const studentId = getRequiredText(body.studentId, "Student ID");
    const studentName = getRequiredText(body.studentName, "Student name");

    const allowedBatches = await getBatchesForRole(
      session.role,
      session.id,
    );

    const batch = allowedBatches.find(
      (item) => item.id === batchId && item.status === "active",
    );

    if (!batch) {
      return NextResponse.json(
        {
          error:
            "This batch is unavailable or is not assigned to your account.",
        },
        { status: 403 },
      );
    }

    if (!batch.studentIds.includes(studentId)) {
      return NextResponse.json(
        {
          error:
            "This student is not assigned to the selected batch.",
        },
        { status: 403 },
      );
    }

    if (type === "feedback") {
      const rawCategory =
        typeof body.category === "string"
          ? body.category.trim()
          : "academic";

      if (!FEEDBACK_CATEGORIES.has(rawCategory)) {
        return NextResponse.json(
          { error: "Invalid feedback category." },
          { status: 400 },
        );
      }

      const feedbackVisibleToParent = getBoolean(
        body.visibleToParent,
        true,
      );

      const feedback = await createTeacherFeedback({
        studentId,
        studentName,
        teacherId: session.id,
        batchId: batch.id,
        batchName: batch.name,
        subject: getOptionalText(body.subject) ?? batch.subject,
        category: rawCategory as TeacherFeedback["category"],
        strengths: getOptionalText(body.strengths),
        areasToImprove: getOptionalText(body.areasToImprove),
        feedback: getRequiredText(body.feedback, "Feedback"),
        visibleToParent: feedbackVisibleToParent,
      });

      const feedbackRecipientIds =
        await getNotificationRecipientIdsForStudents(
          [feedback.studentId],
          {
            includeLinkedParents: feedback.visibleToParent,
          },
        );

      if (feedbackRecipientIds.length > 0) {
        await createNotifications({
          userIds: feedbackRecipientIds,
          title: `New feedback: ${feedback.category}`,
          message: `New teacher feedback has been added for ${feedback.studentName}.`,
          type: "feedback",
          link: "/dashboard",
        });
      }

      return NextResponse.json(
        {
          type: "feedback",
          feedback,
          notified: feedbackRecipientIds.length > 0,
        },
        { status: 201 },
      );
    }

    const rawRating =
      typeof body.rating === "string" ? body.rating.trim() : "good";

    if (!BEHAVIOUR_RATINGS.has(rawRating)) {
      return NextResponse.json(
        { error: "Invalid behaviour rating." },
        { status: 400 },
      );
    }

    const behaviourVisibleToParent = getBoolean(
      body.visibleToParent,
      false,
    );

    const behaviourNote = await createBehaviourNote({
      studentId,
      studentName,
      teacherId: session.id,
      batchId: batch.id,
      batchName: batch.name,
      rating: rawRating as BehaviourNote["rating"],
      note: getRequiredText(body.note, "Behaviour note"),
      actionTaken: getOptionalText(body.actionTaken),
      visibleToParent: behaviourVisibleToParent,
      resolved: getBoolean(body.resolved, false),
    });

    const behaviourRecipientIds =
      await getNotificationRecipientIdsForStudents(
        [behaviourNote.studentId],
        {
          includeLinkedParents: behaviourNote.visibleToParent,
        },
      );

    if (behaviourRecipientIds.length > 0) {
      await createNotifications({
        userIds: behaviourRecipientIds,
        title: "Behaviour update",
        message: `A behaviour update has been added for ${behaviourNote.studentName}.`,
        type: "feedback",
        link: "/dashboard",
      });
    }

    return NextResponse.json(
      {
        type: "behaviour",
        behaviourNote,
        notified: behaviourRecipientIds.length > 0,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create student feedback error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save student feedback.",
      },
      { status: 500 },
    );
  }
}