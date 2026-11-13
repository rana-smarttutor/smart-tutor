import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { isValidQuizBoardTopic } from "@/lib/quiz-board-syllabus";
import { getActiveQuizArenaDraft } from "@/lib/quiz-arena-drafts";
import { getQuizArenaAccess } from "@/lib/quiz-arena-access-guard";
import { getQuizArenaExamScope } from "@/lib/quiz-arena-exam-scope";
import { getQuizArenaFreeTrialState } from "@/lib/quiz-arena-free-trial";

import {
  getGovernmentExamSyllabus,
  isValidGovernmentExamTopic,
} from "@/lib/government-exam-topics";

import {
  getCompetitiveExamSyllabus,
  isValidCompetitiveExamTopic,
} from "@/lib/competitive-exam-topics";

import { getMbaExamSyllabus, isValidMbaExamTopic } from "@/lib/mba-exam-topics";

import {
  getQuizArenaProgress,
  saveQuizArenaRoundProgress,
} from "@/lib/data-store";

import {
  competitiveExams,
  getQuizSchoolClasses,
  levelOptions,
  quizBoardOptions,
  requiresQuizBoard,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
  type QuizBoard,
  type QuizJourneyLevel,
  type QuizRound,
  type QuizSchoolClass,
} from "@/lib/quiz-arena-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];

type QuizSource = "quiz-arena" | "mock-test";

type ProgressBody = {
  source?: QuizSource;
  level?: EducationLevel;
  exam?: CompetitiveExam;
  schoolClass?: QuizSchoolClass | null;
  board?: QuizBoard | null;
  subject?: string;
  topicId?: string | null;
  difficulty?: Difficulty;
  progressionLevel?: QuizJourneyLevel;
  round?: QuizRound;
  correctAnswers?: number;
  incorrectAnswers?: number;
  score?: number;
};

function fail(error: string, status = 400, code?: string) {
  return NextResponse.json(
    { error, ...(code ? { code } : {}) },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function validLevel(value: unknown): value is EducationLevel {
  return levelOptions.some((x) => x.id === value);
}

function validExam(value: unknown): value is CompetitiveExam {
  return competitiveExams.some((x) => x.id === value);
}

function validDifficulty(value: unknown): value is Difficulty {
  return difficulties.includes(value as Difficulty);
}

function validProgressionLevel(value: unknown): value is QuizJourneyLevel {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 10
  );
}

function validRound(value: unknown): value is QuizRound {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

function validSource(value: unknown): value is QuizSource {
  return value === "quiz-arena" || value === "mock-test";
}

function parseContext(
  exam: CompetitiveExam,
  classValue: unknown,
  boardValue: unknown,
):
  | {
      ok: true;
      schoolClass: QuizSchoolClass | null;
      board: QuizBoard | null;
    }
  | { ok: false; error: string } {
  const allowedClasses = getQuizSchoolClasses(exam);

  let schoolClass: QuizSchoolClass | null = null;
  let board: QuizBoard | null = null;

  if (allowedClasses.length > 0) {
    if (
      typeof classValue !== "string" ||
      !allowedClasses.includes(classValue as QuizSchoolClass)
    ) {
      return { ok: false, error: "Please select a valid class." };
    }

    schoolClass = classValue as QuizSchoolClass;
  } else if (
    classValue !== null &&
    classValue !== undefined &&
    classValue !== ""
  ) {
    return { ok: false, error: "Unexpected school class." };
  }

  if (requiresQuizBoard(exam)) {
    if (!quizBoardOptions.some((x) => x.id === boardValue)) {
      return { ok: false, error: "Please select HSC or CBSE." };
    }

    board = boardValue as QuizBoard;
  } else if (
    boardValue !== null &&
    boardValue !== undefined &&
    boardValue !== ""
  ) {
    return { ok: false, error: "Unexpected school board." };
  }

  return { ok: true, schoolClass, board };
}

function validateTopic(input: {
  source: QuizSource;
  level: EducationLevel;
  exam: CompetitiveExam;
  schoolClass: QuizSchoolClass | null;
  board: QuizBoard | null;
  subject: string;
  topicId: string | null;
}): string | null {
  const {
    level,
    exam,
    schoolClass,
    board,
    subject,
    topicId,
  } = input;

  const school = requiresQuizBoard(exam);

  const government =
    level === "government-exam" &&
    Boolean(getGovernmentExamSyllabus(exam));

  const competitive =
    level === "competitive-exam" &&
    Boolean(getCompetitiveExamSyllabus(exam));

  const mba =
    level === "mba-entrance" &&
    Boolean(getMbaExamSyllabus(exam));

  const requiresTopic =
    school || government || competitive || mba;

  if (!requiresTopic) {
    return topicId
      ? "Topic selection is not available for this examination."
      : null;
  }

  if (!topicId) {
    return "Please select a topic before continuing.";
  }

  if (school) {
    if (!schoolClass || !board) {
      return "Please select a valid class and board.";
    }

    return isValidQuizBoardTopic(
      exam,
      schoolClass,
      board,
      subject,
      topicId,
    )
      ? null
      : "Invalid topic for the selected class, board and subject.";
  }

  const valid =
    (government &&
      isValidGovernmentExamTopic(exam, subject, topicId)) ||
    (competitive &&
      isValidCompetitiveExamTopic(exam, subject, topicId)) ||
    (mba &&
      isValidMbaExamTopic(exam, subject, topicId));

  return valid
    ? null
    : "Invalid topic for the selected examination.";
}
/**
 * Progress lookup:
 *
 * The selection must match a validated
 * individual exam scope.
 *
 * Reading past progress does not unlock
 * or generate new paid quiz questions.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();

    if (
      !session ||
      !["student", "admin"].includes(session.role) ||
      (session.status && session.status !== "active")
    ) {
      return fail("Student login is required.", 401);
    }

    const p = request.nextUrl.searchParams;

    const source = p.get("source") ?? "quiz-arena";
    const level = p.get("level");
    const exam = p.get("exam");
    const subject = p.get("subject")?.trim() ?? "";
    const difficulty = p.get("difficulty");
    const topicId = p.get("topicId")?.trim() || null;

    if (!validSource(source)) {
      return fail("Invalid quiz source.");
    }

    if (!validLevel(level) || !validExam(exam)) {
      return fail("Invalid category or exam.");
    }

    if (!subject || !validDifficulty(difficulty)) {
      return fail("Invalid subject or difficulty.");
    }

    const context = parseContext(exam, p.get("schoolClass"), p.get("board"));

    if (!context.ok) {
      return fail(context.error);
    }

    const scope = getQuizArenaExamScope({
      exam,
      level,
      schoolClass: context.schoolClass,
      board: context.board,
    });

    if (!scope) {
      return fail("Invalid individual exam selection.");
    }

    const topicError = validateTopic({
      source,
      level,
      exam,
      schoolClass: context.schoolClass,
      board: context.board,
      subject,
      topicId,
    });

    if (topicError) {
      return fail(topicError);
    }

    const progress = await getQuizArenaProgress({
      userId: session.id,
      learningCategory: level,
      exam,
      schoolClass: context.schoolClass,
      board: context.board,
      subject,
      topicId,
      difficulty,
    });

    return NextResponse.json(
      { progress, examScopeKey: scope.key },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Quiz Arena progress GET:", error);
    return fail("Unable to load Quiz Arena progress.", 500);
  }
}

/**
 * Progress update:
 *
 * A student must have:
 *
 * - A purchased entitlement for this exam; OR
 * - A verified completed one-time free trial.
 *
 * Every result is recalculated using the
 * server's saved questions and answers.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();

    if (
      !session ||
      !["student", "admin"].includes(session.role) ||
      (session.status && session.status !== "active")
    ) {
      return fail("Student login is required.", 401);
    }

    const body = (await request
      .json()
      .catch(() => null)) as ProgressBody | null;

    if (!body) {
      return fail("Invalid progress request.");
    }

    if (!validSource(body.source)) {
      return fail("Invalid quiz source.");
    }

    if (!validLevel(body.level) || !validExam(body.exam)) {
      return fail("Invalid category or exam.");
    }

    if (
      !body.subject?.trim() ||
      !validDifficulty(body.difficulty) ||
      !validProgressionLevel(body.progressionLevel) ||
      !validRound(body.round)
    ) {
      return fail("Invalid quiz progression details.");
    }

    const context = parseContext(body.exam, body.schoolClass, body.board);

    if (!context.ok) {
      return fail(context.error);
    }

    const scope = getQuizArenaExamScope({
      exam: body.exam,
      level: body.level,
      schoolClass: context.schoolClass,
      board: context.board,
    });

    if (!scope) {
      return fail("Invalid individual exam selection.");
    }

    const subject = body.subject.trim();
    const topicId = body.topicId?.trim() || null;

    const topicError = validateTopic({
      source: body.source,
      level: body.level,
      exam: body.exam,
      schoolClass: context.schoolClass,
      board: context.board,
      subject,
      topicId,
    });

    if (topicError) {
      return fail(topicError);
    }

    /**
     * Find the actual saved quiz before
     * checking its entitlement.
     *
     * Never authorise progress for an exam
     * that does not match the saved draft.
     */
    const draft = await getActiveQuizArenaDraft(session.id);

    if (
      !draft ||
      draft.source !== body.source ||
      draft.level !== body.level ||
      draft.exam !== body.exam ||
      draft.schoolClass !== context.schoolClass ||
      draft.board !== context.board ||
      draft.subject !== subject ||
      (draft.topicId ?? null) !== topicId ||
      draft.progressionLevel !== body.progressionLevel ||
      draft.round !== body.round
    ) {
      return fail("Progress does not match the active saved quiz.", 409);
    }

    if (session.role === "student") {
      const access = await getQuizArenaAccess(
        session.id,
        session.role,
        scope.key,
      );

      /**
       * Paid access is valid for this exact
       * exam only.
       *
       * The free trial is handled separately.
       */
      if (!access.subscription.active) {
        const trial = await getQuizArenaFreeTrialState(session.id);

        if (
          trial?.consumed !== true ||
          trial.draftId !== draft.id ||
          !trial.completedAttemptId ||
          draft.progressionLevel !== 1 ||
          draft.round !== 1
        ) {
          return fail(
            "A verified quiz attempt or an active subscription is required.",
            403,
            "QUIZ_SUBSCRIPTION_REQUIRED",
          );
        }
      }
    }

    const questions = draft.questions;
    const answers = draft.answersByIndex;

    if (
      questions.length === 0 ||
      Object.keys(answers).some((key) => {
        const i = Number(key);
        return !Number.isInteger(i) || i < 0 || i >= questions.length;
      })
    ) {
      return fail("Invalid saved quiz answers.", 409);
    }

    let correct = 0;
    let score = 0;
    let streak = 0;

    for (let i = 0; i < questions.length; i += 1) {
      const question = questions[i];
      const answer = answers[i] ?? "";

      if (answer && !question.options.includes(answer)) {
        return fail("Invalid saved quiz answer.", 409);
      }

      if (answer === question.correctAnswer) {
        correct++;
        streak++;
        score += 10 + (streak % 3 === 0 ? 5 : 0);
      } else {
        streak = 0;
      }
    }

    const incorrect = questions.length - correct;

    if (
      body.correctAnswers !== correct ||
      body.incorrectAnswers !== incorrect ||
      body.score !== score
    ) {
      return fail("Quiz scores do not match the saved answers.", 409);
    }

    const progress = await saveQuizArenaRoundProgress({
      userId: session.id,
      learningCategory: body.level,
      exam: body.exam,
      schoolClass: context.schoolClass,
      board: context.board,
      subject,
      topicId,
      difficulty: body.difficulty,
      progressionLevel: body.progressionLevel,
      round: body.round,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      score,
    });

    return NextResponse.json(
      { progress, examScopeKey: scope.key },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Quiz Arena progress POST:", error);
    return fail("Unable to save Quiz Arena progress.", 500);
  }
}
