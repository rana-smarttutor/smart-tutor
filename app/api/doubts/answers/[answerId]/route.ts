import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  deleteDoubtAnswer,
  getDoubts,
} from "@/lib/data-store";
import { sanitizeTextInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    answerId: string;
  }>;
};

export async function DELETE(
  _request: Request,
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
          error:
            "You do not have permission to delete doubt answers.",
        },
        {
          status: 403,
        },
      );
    }

    const { answerId: routeAnswerId } =
      await params;

    const answerId = sanitizeTextInput(
      routeAnswerId,
      160,
    );

    if (!answerId) {
      return NextResponse.json(
        {
          error:
            "A valid answer ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const doubts = await getDoubts();

    let selectedAnswer:
      | NonNullable<
          (typeof doubts)[number]["answers"]
        >[number]
      | null = null;

    for (const doubt of doubts) {
      const answer =
        doubt.answers?.find(
          (item) =>
            item.id === answerId,
        );

      if (answer) {
        selectedAnswer = answer;
        break;
      }
    }

    if (!selectedAnswer) {
      return NextResponse.json(
        {
          error:
            "This doubt answer could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    const isAnswerAuthor =
      selectedAnswer.authorId ===
      session.id;

    const isModerator =
      session.role === "educator" ||
      session.role === "admin";

    if (
      !isAnswerAuthor &&
      !isModerator
    ) {
      return NextResponse.json(
        {
          error:
            "You can delete only your own answer.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      selectedAnswer.authorRole ===
        "ai" &&
      !isModerator
    ) {
      return NextResponse.json(
        {
          error:
            "Only an educator or admin can remove an AI answer.",
        },
        {
          status: 403,
        },
      );
    }

    const deletedAnswer =
      await deleteDoubtAnswer(
        answerId,
      );

    if (!deletedAnswer) {
      return NextResponse.json(
        {
          error:
            "The answer could not be deleted.",
        },
        {
          status: 404,
        },
      );
    }

    await logAction({
      action: "delete",
      category: "other",
      details: `Doubt answer ${answerId} deleted by ${session.name}`,
      path: "/api/doubts/answers/[answerId]",
      method: "DELETE",
      request: _request,
      session,
      metadata: { answerId },
    });

    return NextResponse.json({
      deleted: true,
      answer: deletedAnswer,
      message:
        "The answer was deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete doubt answer error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete the answer.",
      },
      {
        status: 500,
      },
    );
  }
}