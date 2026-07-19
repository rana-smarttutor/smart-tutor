import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  acceptDoubtAnswer,
  createNotifications,
  getDoubtById,
  updateDoubtState,
} from "@/lib/data-store";
import { sanitizeTextInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type DoubtStatusAction =
  | "accept-answer"
  | "resolve"
  | "reopen"
  | "close"
  | "lock"
  | "unlock";

type UpdateDoubtRequest = {
  action?: DoubtStatusAction;
  answerId?: string;
};

const validActions: DoubtStatusAction[] = [
  "accept-answer",
  "resolve",
  "reopen",
  "close",
  "lock",
  "unlock",
];

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Login is required.",
        },
        {
          status: 401,
        },
      );
    }

    if (
      session.role !== "student" &&
      session.role !== "educator" &&
      session.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error: "You do not have access to manage doubt discussions.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const doubtId = sanitizeTextInput(
      id,
      120,
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

    let body: UpdateDoubtRequest;

    try {
      body =
        (await request.json()) as UpdateDoubtRequest;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request data.",
        },
        {
          status: 400,
        },
      );
    }

    const action = body.action;

    if (
      !action ||
      !validActions.includes(action)
    ) {
      return NextResponse.json(
        {
          error: "Choose a valid doubt action.",
        },
        {
          status: 400,
        },
      );
    }

    const isOwner =
      doubt.studentId === session.id;

    const isModerator =
      session.role === "educator" ||
      session.role === "admin";

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        {
          error:
            "Only the student who posted this doubt, an educator, or an admin can manage it.",
        },
        {
          status: 403,
        },
      );
    }

    if (action === "accept-answer") {
      if (!isOwner && !isModerator) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to accept an answer.",
          },
          {
            status: 403,
          },
        );
      }

      if (
        doubt.status === "closed" ||
        doubt.isLocked
      ) {
        return NextResponse.json(
          {
            error:
              "A closed or locked discussion cannot accept an answer.",
          },
          {
            status: 409,
          },
        );
      }

      const answerId =
        sanitizeTextInput(
          body.answerId,
          150,
        );

      if (!answerId) {
        return NextResponse.json(
          {
            error:
              "Choose the answer you want to accept.",
          },
          {
            status: 400,
          },
        );
      }

      const selectedAnswer =
        doubt.answers?.find(
          (answer) =>
            answer.id === answerId,
        );

      if (!selectedAnswer) {
        return NextResponse.json(
          {
            error:
              "The selected answer could not be found.",
          },
          {
            status: 404,
          },
        );
      }

      const updatedDoubt =
        await acceptDoubtAnswer(
          doubtId,
          answerId,
        );

      /*
       * Notify the person whose answer was accepted.
       * AI answers do not need a notification.
       */
      if (
        selectedAnswer.authorRole !== "ai" &&
        selectedAnswer.authorId !== session.id
      ) {
        try {
          await createNotifications({
            userIds: [
              selectedAnswer.authorId,
            ],
            title:
              "Your answer was accepted",
            message: `Your answer to "${doubt.title}" was marked as the accepted solution.`,
            type:
              "doubt",
            link:
              "/dashboard",
          });
        } catch (
          notificationError
        ) {
          console.error(
            "Accepted doubt answer notification error:",
            notificationError,
          );
        }
      }

      return NextResponse.json({
        doubt: updatedDoubt,
        message:
          "The answer was accepted and the doubt was marked as resolved.",
      });
    }

    if (action === "resolve") {
      if (!isOwner && !isModerator) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to resolve this doubt.",
          },
          {
            status: 403,
          },
        );
      }

      if (doubt.status === "closed") {
        return NextResponse.json(
          {
            error:
              "A closed doubt cannot be resolved.",
          },
          {
            status: 409,
          },
        );
      }

      const updatedDoubt =
        await updateDoubtState(
          doubtId,
          {
            status: "resolved",
          },
        );

      return NextResponse.json({
        doubt: updatedDoubt,
        message:
          "The doubt was marked as resolved.",
      });
    }

    if (action === "reopen") {
      if (!isOwner && !isModerator) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to reopen this doubt.",
          },
          {
            status: 403,
          },
        );
      }

      if (doubt.status === "closed" && !isModerator) {
        return NextResponse.json(
          {
            error:
              "Only an educator or admin can reopen a closed doubt.",
          },
          {
            status: 403,
          },
        );
      }

      const nextStatus =
        (doubt.answers?.length ?? 0) > 0
          ? "answered"
          : "open";

      const updatedDoubt =
        await updateDoubtState(
          doubtId,
          {
            status: nextStatus,
            isLocked: false,
          },
        );

      return NextResponse.json({
        doubt: updatedDoubt,
        message:
          "The doubt discussion was reopened.",
      });
    }

    /*
     * Only educators and admins can close, lock,
     * or unlock discussions.
     */
    if (!isModerator) {
      return NextResponse.json(
        {
          error:
            "Only an educator or admin can close or lock a discussion.",
        },
        {
          status: 403,
        },
      );
    }

    if (action === "close") {
      const updatedDoubt =
        await updateDoubtState(
          doubtId,
          {
            status: "closed",
            isLocked: true,
          },
        );

      return NextResponse.json({
        doubt: updatedDoubt,
        message:
          "The doubt discussion was closed.",
      });
    }

    if (action === "lock") {
      const updatedDoubt =
        await updateDoubtState(
          doubtId,
          {
            isLocked: true,
          },
        );

      return NextResponse.json({
        doubt: updatedDoubt,
        message:
          "The doubt discussion was locked.",
      });
    }

    const updatedDoubt =
      await updateDoubtState(
        doubtId,
        {
          isLocked: false,
        },
      );

    return NextResponse.json({
      doubt: updatedDoubt,
      message:
        "The doubt discussion was unlocked.",
    });
  } catch (error) {
    console.error(
      "Update doubt status error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update this doubt.",
      },
      {
        status: 500,
      },
    );
  }
}