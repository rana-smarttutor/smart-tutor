import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  competitiveExams,
  getDifficultyForJourneyLevel,
  getExamDetails,
  getQuizSchoolClasses,
  levelOptions,
  quizBoardOptions,
  requiresQuizBoard,
  QUIZ_QUESTIONS_PER_ROUND,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
  type QuizBoard,
  type QuizJourneyLevel,
  type QuizRound,
  type QuizSchoolClass,
} from "@/lib/quiz-arena-config";

import type { QuizQuestion } from "@/lib/quiz-arena-questions";

import {
  getActiveQuizArenaDraft,
  startQuizArenaDraft,
  saveQuizArenaDraft,
  setQuizArenaDraftStatus,
  type QuizArenaDraftSource,
  type StartQuizArenaDraftInput,
  type SaveQuizArenaDraftInput,
} from "@/lib/quiz-arena-drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    { error: message },
    { status },
  );
}

function isEducationLevel(
  value: unknown,
): value is EducationLevel {
  return levelOptions.some(
    (option) => option.id === value,
  );
}

function isCompetitiveExam(
  value: unknown,
): value is CompetitiveExam {
  return competitiveExams.some(
    (option) => option.id === value,
  );
}

function isQuizBoard(
  value: unknown,
): value is QuizBoard {
  return quizBoardOptions.some(
    (option) => option.id === value,
  );
}

function isDifficulty(
  value: unknown,
): value is Difficulty {
  return (
    value === "easy" ||
    value === "medium" ||
    value === "hard"
  );
}

function isJourneyLevel(
  value: unknown,
): value is QuizJourneyLevel {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 10
  );
}

function isRound(
  value: unknown,
): value is QuizRound {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

function isSource(
  value: unknown,
): value is QuizArenaDraftSource {
  return (
    value === "quiz-arena" ||
    value === "mock-test"
  );
}

function isValidQuestion(
  value: unknown,
): value is QuizQuestion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const question = value as Partial<QuizQuestion>;

  return (
    typeof question.id === "string" &&
    question.id.length > 0 &&
    typeof question.question === "string" &&
    question.question.length > 0 &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every(
      (option) => typeof option === "string",
    ) &&
    new Set(question.options).size === 4 &&
    typeof question.correctAnswer === "string" &&
    question.options.includes(
      question.correctAnswer,
    ) &&
    typeof question.explanation === "string" &&
    typeof question.subject === "string"
  );
}

/*
 * GET
 *
 * Find the student's unfinished quiz.
 *
 * The user ID is obtained from the session,
 * never from a client-supplied userId.
 */
export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Login is required.", 401);
    }

    if (
      (session.role !== "student" && session.role !== "admin") ||
      (session.status && session.status !== "active")
    ) {
      return errorResponse("This quiz is not available for your account.", 403);
    }

    const draft = await getActiveQuizArenaDraft(
      session.id,
    );

    return NextResponse.json(
      { draft: session.role === "admin" && draft?.source !== "mock-test" ? null : draft },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Quiz draft GET error:",
      error,
    );

    return errorResponse(
      "Unable to load unfinished quiz.",
      500,
    );
  }
}

/*
 * POST
 *
 * Create a new unfinished quiz.
 *
 * If an unfinished quiz already exists,
 * the caller must explicitly supply its
 * ID as replaceDraftId.
 */
export async function POST(
  request: Request,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Login is required.", 401);
    }

    if (
      (session.role !== "student" && session.role !== "admin") ||
      (session.status && session.status !== "active")
    ) {
      return errorResponse("This quiz is not available for your account.", 403);
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | Partial<StartQuizArenaDraftInput>
      | null;

    if (!body) {
      return errorResponse(
        "Invalid quiz draft payload.",
        400,
      );
    }

    if (!isSource(body.source)) {
      return errorResponse(
        "Invalid quiz source.",
        400,
      );
    }

    if (session.role === "admin" && body.source !== "mock-test") {
      return errorResponse("Admins may start Mock Tests only.", 403);
    }

    if (!isEducationLevel(body.level)) {
      return errorResponse(
        "Invalid course category.",
        400,
      );
    }

    if (!isCompetitiveExam(body.exam)) {
      return errorResponse(
        "Invalid course or exam.",
        400,
      );
    }

    const examDetails = getExamDetails(body.exam);

    if (
      !examDetails ||
      examDetails.category !== body.level
    ) {
      return errorResponse(
        "The selected course does not belong to this category.",
        400,
      );
    }

    const allowedClasses =
      getQuizSchoolClasses(body.exam);

    let schoolClass: QuizSchoolClass | null =
      null;

    if (allowedClasses.length > 0) {
      if (
        !body.schoolClass ||
        !allowedClasses.includes(
          body.schoolClass,
        )
      ) {
        return errorResponse(
          "Please select a valid class.",
          400,
        );
      }

      schoolClass = body.schoolClass;
    }

    let board: QuizBoard | null = null;

    if (requiresQuizBoard(body.exam)) {
      if (!isQuizBoard(body.board)) {
        return errorResponse(
          "Please select Maharashtra State Board or CBSE.",
          400,
        );
      }

      board = body.board;
    }

    const subject =
      typeof body.subject === "string"
        ? body.subject.trim()
        : "";

    if (
      !subject ||
      !examDetails.subjects.includes(subject)
    ) {
      return errorResponse(
        "Invalid quiz subject.",
        400,
      );
    }

    if (
      !isJourneyLevel(body.progressionLevel)
    ) {
      return errorResponse(
        "Invalid Quiz Arena level.",
        400,
      );
    }

    if (!isRound(body.round)) {
      return errorResponse(
        "Invalid Quiz Arena round.",
        400,
      );
    }

    if (!isDifficulty(body.difficulty)) {
      return errorResponse(
        "Invalid quiz difficulty.",
        400,
      );
    }

    if (
      body.difficulty !==
      getDifficultyForJourneyLevel(
        body.progressionLevel,
      )
    ) {
      return errorResponse(
        "Difficulty does not match the selected level.",
        400,
      );
    }

    if (
      !Array.isArray(body.questions) ||
      body.questions.length !==
        QUIZ_QUESTIONS_PER_ROUND ||
      !body.questions.every(isValidQuestion)
    ) {
      return errorResponse(
        "A complete set of valid quiz questions is required.",
        400,
      );
    }

    const questions = body.questions;

    const validQuestionContext =
      questions.every((question) => {
        return (
          question.level === body.level &&
          question.exam === body.exam &&
          question.subject === subject &&
          question.difficulty ===
            body.difficulty &&
          question.progressionLevel ===
            body.progressionLevel &&
          question.round === body.round &&
          question.stream ===
            examDetails.stream
        );
      });

    if (!validQuestionContext) {
      return errorResponse(
        "Questions do not match the selected quiz.",
        400,
      );
    }

    const existing =
      await getActiveQuizArenaDraft(
        session.id,
      );

    if (
      existing &&
      existing.id !== body.replaceDraftId
    ) {
      return errorResponse(
        "An unfinished quiz already exists. Continue it or confirm that you want to start a new quiz.",
        409,
      );
    }

    const draft = await startQuizArenaDraft({
      userId: session.id,

      source: body.source,

      level: body.level,

      exam: body.exam,

      schoolClass,

      board,

      subject,

      progressionLevel:
        body.progressionLevel,

      round: body.round,

      difficulty: body.difficulty,

      questions,

      answersByIndex: {},

      timeByIndex: {},

      markedForReview: [],

      questionIndex: 0,

      elapsedMs: 0,

      replaceDraftId:
        typeof body.replaceDraftId ===
        "string"
          ? body.replaceDraftId
          : undefined,
    });

    return NextResponse.json(
      { draft },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Quiz draft POST error:",
      error,
    );

    return errorResponse(
      "Unable to create quiz draft.",
      500,
    );
  }
}

/*
 * PATCH
 *
 * Save answers, review markings,
 * question position and timing.
 *
 * A revision number prevents older
 * autosave requests from overwriting
 * newer answers.
 */
export async function PATCH(
  request: Request,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Login is required.", 401);
    }

    if (
      (session.role !== "student" && session.role !== "admin") ||
      (session.status && session.status !== "active")
    ) {
      return errorResponse("This quiz is not available for your account.", 403);
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | Partial<SaveQuizArenaDraftInput>
      | null;

    if (
      !body ||
      typeof body.id !== "string"
    ) {
      return errorResponse(
        "Invalid quiz draft ID.",
        400,
      );
    }

    const draft =
      await getActiveQuizArenaDraft(
        session.id,
      );

    if (
      !draft ||
      draft.id !== body.id
    ) {
      return errorResponse(
        "This unfinished quiz could not be found.",
        404,
      );
    }

    if (session.role === "admin" && draft.source !== "mock-test") {
      return errorResponse("Admins may save Mock Tests only.", 403);
    }

    if (
      typeof body.revision !== "number" ||
      !Number.isInteger(body.revision) ||
      body.revision <= draft.revision
    ) {
      return errorResponse(
        "A newer version of this quiz has already been saved.",
        409,
      );
    }

    if (
      typeof body.questionIndex !==
        "number" ||
      !Number.isInteger(
        body.questionIndex,
      ) ||
      body.questionIndex < 0 ||
      body.questionIndex >=
        draft.questions.length
    ) {
      return errorResponse(
        "Invalid question position.",
        400,
      );
    }

    if (
      typeof body.elapsedMs !== "number" ||
      !Number.isFinite(body.elapsedMs) ||
      body.elapsedMs < 0
    ) {
      return errorResponse(
        "Invalid quiz timing.",
        400,
      );
    }

    if (
      !body.answersByIndex ||
      typeof body.answersByIndex !==
        "object" ||
      Array.isArray(
        body.answersByIndex,
      )
    ) {
      return errorResponse(
        "Invalid saved answers.",
        400,
      );
    }

    const answersAreValid =
      Object.entries(
        body.answersByIndex,
      ).every(([key, answer]) => {
        const index = Number(key);

        return (
          Number.isInteger(index) &&
          String(index) === key &&
          index >= 0 &&
          index < draft.questions.length &&
          typeof answer === "string" &&
          draft.questions[
            index
          ].options.includes(answer)
        );
      });

    if (!answersAreValid) {
      return errorResponse(
        "One or more saved answers are invalid.",
        400,
      );
    }

    if (
      !body.timeByIndex ||
      typeof body.timeByIndex !==
        "object" ||
      Array.isArray(
        body.timeByIndex,
      )
    ) {
      return errorResponse(
        "Invalid question timing data.",
        400,
      );
    }

    const timesAreValid =
      Object.entries(
        body.timeByIndex,
      ).every(([key, time]) => {
        const index = Number(key);

        return (
          Number.isInteger(index) &&
          String(index) === key &&
          index >= 0 &&
          index < draft.questions.length &&
          typeof time === "number" &&
          Number.isFinite(time) &&
          time >= 0
        );
      });

    if (!timesAreValid) {
      return errorResponse(
        "Invalid question timing data.",
        400,
      );
    }

    if (
      !Array.isArray(
        body.markedForReview,
      ) ||
      !body.markedForReview.every(
        (index) =>
          typeof index === "number" &&
          Number.isInteger(index) &&
          index >= 0 &&
          index <
            draft.questions.length,
      )
    ) {
      return errorResponse(
        "Invalid review markings.",
        400,
      );
    }

    const saved =
      await saveQuizArenaDraft({
        id: draft.id,

        userId: session.id,

        answersByIndex:
          body.answersByIndex,

        timeByIndex:
          body.timeByIndex,

        markedForReview: [
          ...new Set(
            body.markedForReview,
          ),
        ],

        questionIndex:
          body.questionIndex,

        elapsedMs:
          body.elapsedMs,

        revision:
          body.revision,
      });

    if (!saved) {
      return errorResponse(
        "This save was superseded by another update.",
        409,
      );
    }

    return NextResponse.json({
      saved: true,

      revision: body.revision,
    });
  } catch (error) {
    console.error(
      "Quiz draft PATCH error:",
      error,
    );

    return errorResponse(
      "Unable to save quiz progress.",
      500,
    );
  }
}

/*
 * DELETE
 *
 * Close an unfinished draft.
 *
 * Despite the HTTP method name,
 * the database record is retained
 * with a completed or abandoned status.
 */
export async function DELETE(
  request: Request,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Login is required.", 401);
    }

    if (
      (session.role !== "student" && session.role !== "admin") ||
      (session.status && session.status !== "active")
    ) {
      return errorResponse("This quiz is not available for your account.", 403);
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | {
          id?: string;

          status?:
            | "completed"
            | "abandoned";
        }
      | null;

    if (
      !body ||
      typeof body.id !== "string" ||
      (
        body.status !== "completed" &&
        body.status !== "abandoned"
      )
    ) {
      return errorResponse(
        "Invalid quiz completion request.",
        400,
      );
    }

    const draft = await getActiveQuizArenaDraft(session.id);

    if (
      !draft ||
      draft.id !== body.id ||
      (session.role === "admin" && draft.source !== "mock-test")
    ) {
      return errorResponse("This unfinished Mock Test could not be found.", 404);
    }

    const updated =
      await setQuizArenaDraftStatus({
        id: body.id,

        userId: session.id,

        status: body.status,
      });

    if (!updated) {
      return errorResponse(
        "This unfinished quiz could not be found.",
        404,
      );
    }

    return NextResponse.json({
      ok: true,

      status: body.status,
    });
  } catch (error) {
    console.error(
      "Quiz draft DELETE error:",
      error,
    );

    return errorResponse(
      "Unable to update quiz status.",
      500,
    );
  }
}