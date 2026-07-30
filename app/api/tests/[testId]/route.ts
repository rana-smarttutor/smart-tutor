import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";

import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

import {
  deleteTest,
  updateTest,
} from "@/lib/data-store";

import type {
  ExamType,
} from "@/lib/types";

import {
  sanitizeIdList,
  sanitizeOptions,
  sanitizeTextInput,
  sanitizeTextareaInput,
} from "@/lib/validation";

const EXAM_TYPES =
  new Set<ExamType>([
    "unit-1",
    "semester-1",
    "unit-2",
    "semester-2",
  ]);

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      testId: string;
    }>;
  },
) {
  const session =
    await getSessionUser();

  const {
    testId,
  } = await params;

  if (
    !hasAnyRole(
      session,
      [
        "educator",
        "admin",
      ],
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  let body: {
    title?: string;

    status?: string;

    summary?: string;

    examType?: string;

    assignedUserIds?:
      string[];

    questions?: {
      id?: string;
      prompt?: string;
      options?: string[];
    }[];
  };

  try {
    body =
      (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid payload.",
      },
      {
        status: 400,
      },
    );
  }

  const title =
    body.title !==
    undefined
      ? sanitizeTextInput(
          body.title,
          80,
        )
      : undefined;

  const summary =
    body.summary !==
    undefined
      ? sanitizeTextareaInput(
          body.summary,
          220,
        )
      : undefined;

  const status =
    body.status !==
    undefined
      ? sanitizeTextInput(
          body.status,
          30,
        )
      : undefined;

  const examType =
    body.examType !==
    undefined
      ? sanitizeTextInput(
          body.examType,
          30,
        )
      : undefined;

  const assignedUserIds =
    body.assignedUserIds !==
    undefined
      ? sanitizeIdList(
          body.assignedUserIds,
          50,
        )
      : undefined;

  const questions =
    body.questions !==
    undefined
      ? body.questions.map(
          (
            question,
            index,
          ) => ({
            id:
              sanitizeTextInput(
                question.id,
                40,
              ) ||
              `q-${index + 1}`,

            prompt:
              sanitizeTextInput(
                question.prompt,
                120,
              ) ||
              `Question ${index + 1}`,

            options:
              sanitizeOptions(
                question.options,
              ),
          }),
        )
      : undefined;

  if (
    examType !==
      undefined &&
    !EXAM_TYPES.has(
      examType as ExamType,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Choose a valid exam type.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    questions &&
    questions.some(
      (question) =>
        ![2, 4].includes(
          question.options.length,
        ),
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Each question must have 2 or 4 options.",
      },
      {
        status: 400,
      },
    );
  }

  const updated =
    await updateTest(
      testId,
      {
        title,

        summary,

        status,

        examType:
          examType as
            | ExamType
            | undefined,

        assignedUserIds,

        questions,
      },
    );

  if (!updated) {
    return NextResponse.json(
      {
        error:
          "Test not found.",
      },
      {
        status: 404,
      },
    );
  }

  await logAction({
    action: "update",
    category: "exams",
    details: `Test updated: ${updated.title}`,
    path: `/api/tests/${testId}`,
    method: "PUT",
    request,
    session,
    metadata: { testId, title: updated.title },
  });

  return NextResponse.json({
    test: updated,
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      testId: string;
    }>;
  },
) {
  const session =
    await getSessionUser();

  const {
    testId,
  } = await params;

  if (
    !hasAnyRole(
      session,
      [
        "educator",
        "admin",
      ],
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  const deleted =
    await deleteTest(
      testId,
    );

  if (!deleted) {
    return NextResponse.json(
      {
        error:
          "Test not found.",
      },
      {
        status: 404,
      },
    );
  }

  await logAction({
    action: "delete",
    category: "exams",
    details: `Test deleted: ${testId}`,
    path: `/api/tests/${testId}`,
    method: "DELETE",
    request: _request,
    session,
    metadata: { testId },
  });

  return NextResponse.json({
    deleted: true,
  });
}