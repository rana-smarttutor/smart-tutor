import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  deleteBehaviourNote,
  deleteTeacherFeedback,
  getBehaviourNotesForRole,
  getTeacherFeedbackForRole,
  updateBehaviourNote,
  updateTeacherFeedback,
} from "@/lib/data-store";
import type { BehaviourNote, TeacherFeedback } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    feedbackId: string;
  }>;
};

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

function hasField(body: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

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

function getRecordType(feedbackId: string) {
  if (feedbackId.startsWith("feedback-")) {
    return "feedback";
  }

  if (feedbackId.startsWith("behaviour-")) {
    return "behaviour";
  }

  return null;
}

async function getAllowedFeedback(
  feedbackId: string,
  role: "admin" | "educator",
  userId: string,
) {
  const feedbackItems = await getTeacherFeedbackForRole(role, userId);

  return feedbackItems.find((item) => item.id === feedbackId) ?? null;
}

async function getAllowedBehaviourNote(
  behaviourNoteId: string,
  role: "admin" | "educator",
  userId: string,
) {
  const behaviourNotes = await getBehaviourNotesForRole(role, userId);

  return behaviourNotes.find((item) => item.id === behaviourNoteId) ?? null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { feedbackId } = await context.params;
    const recordType = getRecordType(feedbackId);

    if (!recordType) {
      return NextResponse.json(
        { error: "Invalid feedback record ID." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (recordType === "feedback") {
      const existingFeedback = await getAllowedFeedback(
        feedbackId,
        session.role,
        session.id,
      );

      if (!existingFeedback) {
        return NextResponse.json(
          {
            error:
              "Feedback not found or you do not have permission to edit it.",
          },
          { status: 404 },
        );
      }

      const updates: Partial<{
        category: TeacherFeedback["category"];
        strengths: string;
        areasToImprove: string;
        feedback: string;
        visibleToParent: boolean;
        subject: string;
      }> = {};

      if (hasField(body, "category")) {
        const category = getRequiredText(body.category, "Feedback category");

        if (!FEEDBACK_CATEGORIES.has(category)) {
          return NextResponse.json(
            { error: "Invalid feedback category." },
            { status: 400 },
          );
        }

        updates.category = category as TeacherFeedback["category"];
      }

      if (hasField(body, "strengths")) {
        updates.strengths = getOptionalText(body.strengths) ?? "";
      }

      if (hasField(body, "areasToImprove")) {
        updates.areasToImprove =
          getOptionalText(body.areasToImprove) ?? "";
      }

      if (hasField(body, "feedback")) {
        updates.feedback = getRequiredText(body.feedback, "Feedback");
      }

      if (hasField(body, "subject")) {
        updates.subject = getOptionalText(body.subject) ?? "";
      }

      if (hasField(body, "visibleToParent")) {
        if (typeof body.visibleToParent !== "boolean") {
          return NextResponse.json(
            { error: "visibleToParent must be true or false." },
            { status: 400 },
          );
        }

        updates.visibleToParent = body.visibleToParent;
      }

      const feedback = await updateTeacherFeedback(feedbackId, updates);

      if (!feedback) {
        return NextResponse.json(
          { error: "Feedback not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({
        type: "feedback",
        feedback,
      });
    }

    const existingBehaviourNote = await getAllowedBehaviourNote(
      feedbackId,
      session.role,
      session.id,
    );

    if (!existingBehaviourNote) {
      return NextResponse.json(
        {
          error:
            "Behaviour note not found or you do not have permission to edit it.",
        },
        { status: 404 },
      );
    }

    const updates: Partial<{
      rating: BehaviourNote["rating"];
      note: string;
      actionTaken: string;
      visibleToParent: boolean;
      resolved: boolean;
    }> = {};

    if (hasField(body, "rating")) {
      const rating = getRequiredText(body.rating, "Behaviour rating");

      if (!BEHAVIOUR_RATINGS.has(rating)) {
        return NextResponse.json(
          { error: "Invalid behaviour rating." },
          { status: 400 },
        );
      }

      updates.rating = rating as BehaviourNote["rating"];
    }

    if (hasField(body, "note")) {
      updates.note = getRequiredText(body.note, "Behaviour note");
    }

    if (hasField(body, "actionTaken")) {
      updates.actionTaken = getOptionalText(body.actionTaken) ?? "";
    }

    if (hasField(body, "visibleToParent")) {
      if (typeof body.visibleToParent !== "boolean") {
        return NextResponse.json(
          { error: "visibleToParent must be true or false." },
          { status: 400 },
        );
      }

      updates.visibleToParent = body.visibleToParent;
    }

    if (hasField(body, "resolved")) {
      if (typeof body.resolved !== "boolean") {
        return NextResponse.json(
          { error: "resolved must be true or false." },
          { status: 400 },
        );
      }

      updates.resolved = body.resolved;
    }

    const behaviourNote = await updateBehaviourNote(feedbackId, updates);

    if (!behaviourNote) {
      return NextResponse.json(
        { error: "Behaviour note not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      type: "behaviour",
      behaviourNote,
    });
  } catch (error) {
    console.error("Update student feedback error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update student feedback.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin" && session.role !== "educator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { feedbackId } = await context.params;
    const recordType = getRecordType(feedbackId);

    if (!recordType) {
      return NextResponse.json(
        { error: "Invalid feedback record ID." },
        { status: 400 },
      );
    }

    if (recordType === "feedback") {
      const existingFeedback = await getAllowedFeedback(
        feedbackId,
        session.role,
        session.id,
      );

      if (!existingFeedback) {
        return NextResponse.json(
          {
            error:
              "Feedback not found or you do not have permission to delete it.",
          },
          { status: 404 },
        );
      }

      const deleted = await deleteTeacherFeedback(feedbackId);

      if (!deleted) {
        return NextResponse.json(
          { error: "Feedback not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        type: "feedback",
      });
    }

    const existingBehaviourNote = await getAllowedBehaviourNote(
      feedbackId,
      session.role,
      session.id,
    );

    if (!existingBehaviourNote) {
      return NextResponse.json(
        {
          error:
            "Behaviour note not found or you do not have permission to delete it.",
        },
        { status: 404 },
      );
    }

    const deleted = await deleteBehaviourNote(feedbackId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Behaviour note not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      type: "behaviour",
    });
  } catch (error) {
    console.error("Delete student feedback error:", error);

    return NextResponse.json(
      { error: "Unable to delete student feedback." },
      { status: 500 },
    );
  }
}