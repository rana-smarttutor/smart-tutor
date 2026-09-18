import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  getQuizArenaProgress,
  saveQuizArenaRoundProgress,
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
    (option) => option.id === value,
  );
}


function isCompetitiveExam(
  value: unknown,
): value is CompetitiveExam {
  return competitiveExams.some(
    (exam) => exam.id === value,
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


export async function GET(
  request: NextRequest,
) {
  try {
    const session = await getSessionUser();

    if (
      !session ||
      session.role !== "student"
    ) {
      return NextResponse.json(
        {
          error:
            "Student login is required to load Quiz Arena progress.",
        },
        {
          status: 401,
        },
      );
    }

    const searchParams =
      request.nextUrl.searchParams;

    const learningCategory =
      searchParams.get("level");

    const exam =
      searchParams.get("exam");

    const subject =
      searchParams.get("subject")?.trim();

    const difficulty =
      searchParams.get("difficulty");

    if (!isEducationLevel(learningCategory)) {
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

    if (!isCompetitiveExam(exam)) {
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

    if (!subject) {
      return NextResponse.json(
        {
          error:
            "Quiz Arena subject is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isDifficulty(difficulty)) {
      return NextResponse.json(
        {
          error:
            "Invalid Quiz Arena difficulty.",
        },
        {
          status: 400,
        },
      );
    }

    const progress =
      await getQuizArenaProgress({
        userId: session.id,

        learningCategory,

        exam,

        subject,

        difficulty,
      });

    return NextResponse.json({
      progress,
    });
  } catch (error) {
    console.error(
      "Quiz Arena progress GET error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load Quiz Arena progress.",
      },
      {
        status: 500,
      },
    );
  }
}


export async function POST(
  request: NextRequest,
) {
  try {
    const session = await getSessionUser();

    if (
      !session ||
      session.role !== "student"
    ) {
      return NextResponse.json(
        {
          error:
            "Student login is required to save Quiz Arena progress.",
        },
        {
          status: 401,
        },
      );
    }

    const body = (await request.json()) as {
      level?: EducationLevel;

      exam?: CompetitiveExam;

      subject?: string;

      difficulty?: Difficulty;

      progressionLevel?: QuizJourneyLevel;

      round?: QuizRound;

      correctAnswers?: number;

      incorrectAnswers?: number;

      score?: number;
    };

    if (!isEducationLevel(body.level)) {
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

    if (!isCompetitiveExam(body.exam)) {
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
            "Quiz Arena subject is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isDifficulty(body.difficulty)) {
      return NextResponse.json(
        {
          error:
            "Invalid Quiz Arena difficulty.",
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
            "Invalid Quiz Arena progression level.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isQuizRound(body.round)) {
      return NextResponse.json(
        {
          error:
            "Invalid Quiz Arena round.",
        },
        {
          status: 400,
        },
      );
    }

    const progress =
      await saveQuizArenaRoundProgress({
        userId: session.id,

        learningCategory:
          body.level,

        exam:
          body.exam,

        subject,

        difficulty:
          body.difficulty,

        progressionLevel:
          body.progressionLevel,

        round:
          body.round,

        correctAnswers:
          Number(body.correctAnswers) || 0,

        incorrectAnswers:
          Number(body.incorrectAnswers) || 0,

        score:
          Number(body.score) || 0,
      });

    return NextResponse.json({
      progress,
    });
  } catch (error) {
    console.error(
      "Quiz Arena progress POST error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to save Quiz Arena progress.",
      },
      {
        status: 500,
      },
    );
  }
}