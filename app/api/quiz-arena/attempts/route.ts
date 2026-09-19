import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSessionUser,
} from "@/lib/auth";

import {
  createQuizArenaRoundAttempt,
  type QuizArenaAttemptQuestion,
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


import { getActiveQuizArenaDraft } from "@/lib/quiz-arena-drafts";

const validDifficulties: Difficulty[] = [
  "easy",
  "medium",
  "hard",
];


function isEducationLevel(
  value: unknown,
): value is EducationLevel {
  return levelOptions.some(
    (option) =>
      option.id === value,
  );
}


function isCompetitiveExam(
  value: unknown,
): value is CompetitiveExam {
  return competitiveExams.some(
    (option) =>
      option.id === value,
  );
}


function isDifficulty(
  value: unknown,
): value is Difficulty {
  return validDifficulties.includes(
    value as Difficulty,
  );
}


function isQuizJourneyLevel(
  value: unknown,
): value is QuizJourneyLevel {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 10
  );
}


function isQuizRound(
  value: unknown,
): value is QuizRound {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}


function isQuizBoard(
  value: unknown,
): value is QuizBoard {
  return quizBoardOptions.some(
    (board) => board.id === value,
  );
}


type SchoolContext =
  | {
      ok: true;
      schoolClass: QuizSchoolClass | null;
      board: QuizBoard | null;
    }
  | {
      ok: false;
      error: string;
    };


function parseSchoolContext(
  exam: CompetitiveExam,
  schoolClassValue: unknown,
  boardValue: unknown,
): SchoolContext {
  const allowedClasses =
    getQuizSchoolClasses(exam);

  let schoolClass:
    QuizSchoolClass | null = null;

  let board:
    QuizBoard | null = null;

  if (allowedClasses.length > 0) {
    if (
      typeof schoolClassValue !== "string" ||
      !allowedClasses.includes(
        schoolClassValue as QuizSchoolClass,
      )
    ) {
      return {
        ok: false,
        error:
          "Please select a valid class.",
      };
    }

    schoolClass =
      schoolClassValue as QuizSchoolClass;
  }

  if (requiresQuizBoard(exam)) {
    if (!isQuizBoard(boardValue)) {
      return {
        ok: false,
        error:
          "Please select HSC or CBSE.",
      };
    }

    board = boardValue;
  }

  return {
    ok: true,
    schoolClass,
    board,
  };
}


function normalizeAttemptQuestion(
  value: unknown,
):
  | QuizArenaAttemptQuestion
  | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const question =
    value as Partial<
      QuizArenaAttemptQuestion
    >;

  if (
    typeof question.questionId !==
      "string" ||
    typeof question.question !==
      "string" ||
    !Array.isArray(
      question.options,
    ) ||
    typeof question.selectedAnswer !==
      "string" ||
    typeof question.correctAnswer !==
      "string" ||
    typeof question.isCorrect !==
      "boolean" ||
    typeof question.explanation !==
      "string"
  ) {
    return null;
  }

  return {
    questionId:
      question.questionId,

    question:
      question.question,

    options:
      question.options.filter(
        (
          option,
        ): option is string =>
          typeof option ===
          "string",
      ),

    selectedAnswer:
      question.selectedAnswer,

    correctAnswer:
      question.correctAnswer,

    isCorrect:
      question.isCorrect,

    explanation:
      question.explanation,

    timeTakenMs:
      Math.max(
        0,
        Number(
          question.timeTakenMs,
        ) || 0,
      ),
  };
}


export async function POST(
  request: NextRequest,
) {
  try {
    const session =
      await getSessionUser();

    if (
      !session ||
      (session.role !== "student" && session.role !== "admin") ||
      (session.status && session.status !== "active")
    ) {
      return NextResponse.json(
        {
          error:
            "An active student or admin account is required.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as {
        draftId?: string;

        level?: EducationLevel;

        exam?: CompetitiveExam;

        schoolClass?:
          QuizSchoolClass | null;

        board?:
          QuizBoard | null;

        subject?: string;

        progressionLevel?:
          QuizJourneyLevel;

        round?: QuizRound;

        difficulty?: Difficulty;

        score?: number;

        correctAnswers?: number;

        incorrectAnswers?: number;

        totalTimeMs?: number;

        averageQuestionTimeMs?: number;

        questions?: unknown[];
      };

    if (
      !isEducationLevel(
        body.level,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Quiz Arena category.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isCompetitiveExam(
        body.exam,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Quiz Arena exam.",
        },
        {
          status: 400,
        },
      );
    }

    const schoolContext =
      parseSchoolContext(
        body.exam,
        body.schoolClass,
        body.board,
      );

    if (!schoolContext.ok) {
      return NextResponse.json(
        {
          error:
            schoolContext.error,
        },
        {
          status: 400,
        },
      );
    }

    const subject =
      body.subject?.trim();

    if (!subject) {
      return NextResponse.json(
        {
          error:
            "Quiz subject is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isQuizJourneyLevel(
        body.progressionLevel,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid progression level.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isQuizRound(
        body.round,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid round.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isDifficulty(
        body.difficulty,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid difficulty.",
        },
        {
          status: 400,
        },
      );
    }

    const questions =
      (body.questions ?? [])
        .map(
          normalizeAttemptQuestion,
        )
        .filter(
          (
            question,
          ): question is QuizArenaAttemptQuestion =>
            question !== null,
        );

    if (
      questions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Question timing data is required.",
        },
        {
          status: 400,
        },
      );
    }

        /*
     * Validate that the completed quiz belongs
     * to the logged-in student's saved draft.
     */

    if (
      typeof body.draftId !== "string" ||
      !body.draftId
    ) {
      return NextResponse.json(
        {
          error: "Quiz draft ID is required.",
        },
        { status: 400 },
      );
    }

    const draft = await getActiveQuizArenaDraft(
      session.id,
    );

    if (!draft || draft.id !== body.draftId) {
      return NextResponse.json(
        {
          error: "The unfinished quiz could not be found.",
        },
        { status: 409 },
      );
    }

    if (session.role === "admin" && draft.source !== "mock-test") {
      return NextResponse.json(
        { error: "Admins may save Mock Test attempts only." },
        { status: 403 },
      );
    }

    if (
      draft.level !== body.level ||
      draft.exam !== body.exam ||
      draft.schoolClass !== schoolContext.schoolClass ||
      draft.board !== schoolContext.board ||
      draft.subject !== subject ||
      draft.progressionLevel !== body.progressionLevel ||
      draft.round !== body.round ||
      draft.difficulty !== body.difficulty
    ) {
      return NextResponse.json(
        {
          error:
            "The completed quiz does not match the saved draft.",
        },
        { status: 400 },
      );
    }

    const questionsMatchDraft =
      questions.length === draft.questions.length &&
      questions.every((question, index) => {
        const original = draft.questions[index];

        const savedAnswer =
          draft.answersByIndex[index] ?? "";

        return (
          question.questionId === original.id &&
          question.question === original.question &&
          JSON.stringify(question.options) ===
            JSON.stringify(original.options) &&
          question.correctAnswer === original.correctAnswer &&
          question.selectedAnswer === savedAnswer &&
          question.isCorrect ===
            (savedAnswer === original.correctAnswer)
        );
      });

    if (!questionsMatchDraft) {
      return NextResponse.json(
        {
          error:
            "Please save your latest quiz answers before completing the round.",
        },
        { status: 409 },
      );
    }
const attempt =
      await createQuizArenaRoundAttempt({
        userId:
          session.id,

        draftId: draft.id,

        learningCategory:
          body.level,

        exam:
          body.exam,

        schoolClass:
          schoolContext.schoolClass,

        board:
          schoolContext.board,

        subject,

        progressionLevel:
          body.progressionLevel,

        round:
          body.round,

        difficulty:
          body.difficulty,

        score:
          Math.max(
            0,
            Number(
              body.score,
            ) || 0,
          ),

        correctAnswers:
          Math.max(
            0,
            Number(
              body.correctAnswers,
            ) || 0,
          ),

        incorrectAnswers:
          Math.max(
            0,
            Number(
              body.incorrectAnswers,
            ) || 0,
          ),

        totalTimeMs:
          Math.max(
            0,
            Number(
              body.totalTimeMs,
            ) || 0,
          ),

        averageQuestionTimeMs:
          Math.max(
            0,
            Number(
              body.averageQuestionTimeMs,
            ) || 0,
          ),

        questions,
      });

    return NextResponse.json({
      attempt,
    });
  }
  catch (error) {
    console.error(
      "Quiz Arena attempt POST error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to save Quiz Arena attempt.",
      },
      {
        status: 500,
      },
    );
  }
}