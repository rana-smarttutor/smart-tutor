import { NextResponse } from "next/server";

import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

import {
  createTest,
  getTestsForRole,
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

export async function GET() {
  const session =
    await getSessionUser();

  if (!session) {
    return NextResponse.json(
      {
        error:
          "Login is required to access tests.",
      },
      {
        status: 401,
      },
    );
  }

  return NextResponse.json({
    tests:
      await getTestsForRole(
        session.role,
        session.id,
      ),
  });
}

export async function POST(
  request: Request,
) {
  const session =
    await getSessionUser();

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
          "Only educators and admins can issue tests.",
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
          "Invalid test payload.",
      },
      {
        status: 400,
      },
    );
  }

  const title =
    sanitizeTextInput(
      body.title,
      80,
    );

  const summary =
    sanitizeTextareaInput(
      body.summary,
      220,
    );

  const examType =
    sanitizeTextInput(
      body.examType,
      30,
    );

  const assignedUserIds =
    sanitizeIdList(
      body.assignedUserIds,
      50,
    );

  const questions =
    body.questions?.map(
      (
        question,
        index,
      ) => ({
        id:
          sanitizeTextInput(
            question.id,
            40,
          ) ||
          `draft-question-${index + 1}`,

        prompt:
          sanitizeTextInput(
            question.prompt,
            120,
          ) ||
          `Draft question ${index + 1}`,

        options:
          sanitizeOptions(
            question.options,
          ),
      }),
    ) ?? [];

  if (
    !title ||
    !summary ||
    !examType ||
    !assignedUserIds.length ||
    !questions.length
  ) {
    return NextResponse.json(
      {
        error:
          "Exam type, title, summary, students, and at least one question are required.",
      },
      {
        status: 400,
      },
    );
  }

  if (
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
          "Each question must contain exactly 2 or 4 options.",
      },
      {
        status: 400,
      },
    );
  }

  const test =
    await createTest({
      title,

      status:
        sanitizeTextInput(
          body.status,
          30,
        ) ||
        "Assigned",

      summary,

      examType:
        examType as ExamType,

      createdBy:
        session.name,

      assignedUserIds,

      questions,
    });

  return NextResponse.json(
    {
      test,
    },
    {
      status: 201,
    },
  );
}