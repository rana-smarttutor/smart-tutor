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
  levelOptions,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
  type QuizJourneyLevel,
  type QuizRound,
} from "@/lib/quiz-arena-config";


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
      session.role !== "student"
    ) {
      return NextResponse.json(
        {
          error:
            "Student login is required.",
        },
        {
          status: 401,
        },
      );
    }


    const body =
      (await request.json()) as {
        level?: EducationLevel;

        exam?: CompetitiveExam;

        subject?: string;

        progressionLevel?: QuizJourneyLevel;

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


    const attempt =
      await createQuizArenaRoundAttempt({
        userId:
          session.id,

        learningCategory:
          body.level,

        exam:
          body.exam,

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