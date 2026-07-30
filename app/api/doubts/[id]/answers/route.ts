import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  createDoubtAnswer,
  createNotifications,
  getDoubtById,
} from "@/lib/data-store";
import {
  sanitizeTextInput,
  sanitizeTextareaInput,
} from "@/lib/validation";
import { validateChatContent } from "@/lib/chat-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreateAnswerRequest = {
  content?: string;
  attachmentUrl?: string;
};

const allowedRoles = new Set([
  "student",
  "educator",
  "admin",
]);

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Login is required to answer a doubt.",
        },
        {
          status: 401,
        },
      );
    }

    if (!allowedRoles.has(session.role)) {
      return NextResponse.json(
        {
          error: "You do not have permission to answer doubts.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const doubtId = sanitizeTextInput(
      id,
      100,
    );

    if (!doubtId) {
      return NextResponse.json(
        {
          error: "A valid doubt ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const doubt = await getDoubtById(
      doubtId,
    );

    if (!doubt) {
      return NextResponse.json(
        {
          error: "This doubt could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      doubt.isLocked ||
      doubt.status === "closed"
    ) {
      return NextResponse.json(
        {
          error: "This discussion has been closed.",
        },
        {
          status: 409,
        },
      );
    }

    let body: CreateAnswerRequest;

    try {
      body =
        (await request.json()) as CreateAnswerRequest;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid answer data.",
        },
        {
          status: 400,
        },
      );
    }

    const content =
      sanitizeTextareaInput(
        body.content,
        5000,
      );

    const attachmentUrl =
      sanitizeTextInput(
        body.attachmentUrl,
        1000,
      );

    if (!content && !attachmentUrl) {
      return NextResponse.json(
        {
          error:
            "Write an answer or attach a supporting file.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      content &&
      content.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Please write a more complete answer.",
        },
        {
          status: 400,
        },
      );
    }

    if (content) {
      const validation =
        validateChatContent(content);

      if (
        validation.hasSensitiveContent
      ) {
        return NextResponse.json(
          {
            error:
              "Your answer contains personal contact information or a restricted link. Remove it before posting.",
            reasons:
              validation.reasons.map(
                (reason) =>
                  `${reason.type}: ${reason.detail}`,
              ),
          },
          {
            status: 400,
          },
        );
      }
    }

    const authorRole =
      session.role as
        | "student"
        | "educator"
        | "admin";

    const answer =
      await createDoubtAnswer({
        doubtId,
        authorId: session.id,
        authorName:
          session.name || "Smart Tutor User",
        authorRole,
        content:
          content ||
          "A supporting file has been attached.",
        attachmentUrl:
          attachmentUrl || undefined,
      });

    /*
     * Notify the student who posted the doubt.
     * Notification failure should not block the answer.
     */
    if (
      doubt.studentId !== session.id
    ) {
      try {
        await createNotifications({
          userIds: [
            doubt.studentId,
          ],
          title: "New answer to your doubt",
          message: `${session.name} answered your doubt: ${doubt.title}`,
          type: "doubt",
          link: "/dashboard",
        });
      } catch (notificationError) {
        console.error(
          "Doubt answer notification error:",
          notificationError,
        );
      }
    }

    await logAction({
      action: "create",
      category: "other",
      details: `Answer posted by ${session.name} on doubt ${id}`,
      path: "/api/doubts/[id]/answers",
      method: "POST",
      request,
      session,
      metadata: { doubtId: id, answerId: answer.id },
    });

    return NextResponse.json(
      {
        answer,
        message:
          "Your answer has been posted successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create doubt answer error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to post your answer.",
      },
      {
        status: 500,
      },
    );
  }
}