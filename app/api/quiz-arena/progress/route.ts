import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSessionUser,
} from "@/lib/auth";

import { getActiveQuizArenaDraft } from "@/lib/quiz-arena-drafts";

import {
  getGovernmentExamSyllabus,
  isValidGovernmentExamTopic,
} from "@/lib/government-exam-topics";

import {
  getCompetitiveExamSyllabus,
  isValidCompetitiveExamTopic,
} from "@/lib/competitive-exam-topics";

import {
  getMbaExamSyllabus,
  isValidMbaExamTopic,
} from "@/lib/mba-exam-topics";

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
        error: "Please select a valid class.",
      };
    }

    schoolClass =
      schoolClassValue as QuizSchoolClass;
  }

  if (requiresQuizBoard(exam)) {
    if (!isQuizBoard(boardValue)) {
      return {
        ok: false,
        error: "Please select HSC or CBSE.",
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


export async function GET(
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
            "Student login is required to load Quiz Arena progress.",
        },
        {
          status: 401,
        },
      );
    }

    const searchParams =
      request.nextUrl.searchParams;

    if (session.role === "admin" && searchParams.get("source") !== "mock-test") {
      return NextResponse.json(
        { error: "Admins may load Mock Test progress only." },
        { status: 403 },
      );
    }

    const learningCategory =
      searchParams.get("level");

    const exam =
      searchParams.get("exam");

    const schoolClass =
      searchParams.get("schoolClass");

    const board =
      searchParams.get("board");

    const subject =
      searchParams
        .get("subject")
        ?.trim();

    const topicId =
      searchParams.get("topicId")?.trim() || null;

    const difficulty =
      searchParams.get("difficulty");

    if (
      !isEducationLevel(
        learningCategory,
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
        exam,
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
        exam,
        schoolClass,
        board,
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

    if (
      !isDifficulty(
        difficulty,
      )
    ) {
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

    const requiresGovernmentTopic =
      searchParams.get("source") ===
        "mock-test" &&
      learningCategory ===
        "government-exam" &&
      Boolean(
        getGovernmentExamSyllabus(
          exam,
        ),
      );

    const requiresCompetitiveTopic =
      searchParams.get("source") ===
        "mock-test" &&
      learningCategory ===
        "competitive-exam" &&
      Boolean(
        getCompetitiveExamSyllabus(
          exam,
        ),
      );

    const requiresMbaTopic =
      searchParams.get("source") ===
        "mock-test" &&
      learningCategory ===
        "mba-entrance" &&
      Boolean(
        getMbaExamSyllabus(
          exam,
        ),
      );

    const requiresTopic =
      requiresGovernmentTopic ||
      requiresCompetitiveTopic ||
      requiresMbaTopic;

    const validTopic =
      topicId !== null &&
      (
        (
          requiresGovernmentTopic &&
          isValidGovernmentExamTopic(
            exam,
            subject,
            topicId,
          )
        ) ||
        (
          requiresCompetitiveTopic &&
          isValidCompetitiveExamTopic(
            exam,
            subject,
            topicId,
          )
        ) ||
        (
          requiresMbaTopic &&
          isValidMbaExamTopic(
            exam,
            subject,
            topicId,
          )
        )
      );

    if (
      requiresTopic &&
      !validTopic
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a valid Mock Test topic.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !requiresTopic &&
      topicId
    ) {
      return NextResponse.json(
        {
          error:
            "Topic selection is not available for this examination.",
        },
        {
          status: 400,
        },
      );
    }
    const progress =
      await getQuizArenaProgress({
        userId:
          session.id,

        learningCategory,

        exam,

        schoolClass:
          schoolContext.schoolClass,

        board:
          schoolContext.board,

        subject,

        topicId,

        difficulty,
      });

    return NextResponse.json({
      progress,
    });
  }
  catch (error) {
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
            "Student login is required to save Quiz Arena progress.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as {
        source?: "quiz-arena" | "mock-test";
        level?: EducationLevel;

        exam?: CompetitiveExam;

        schoolClass?:
          QuizSchoolClass | null;

        board?:
          QuizBoard | null;

        subject?: string;

        topicId?: string | null;

        difficulty?: Difficulty;

        progressionLevel?:
          QuizJourneyLevel;

        round?: QuizRound;

        correctAnswers?: number;

        incorrectAnswers?: number;

        score?: number;
      };

    if (session.role === "admin") {
      const draft = await getActiveQuizArenaDraft(session.id);

      if (
        body.source !== "mock-test" ||
        !draft ||
        draft.source !== "mock-test" ||
        draft.level !== body.level ||
        draft.exam !== body.exam ||
        draft.subject !== body.subject ||
        draft.progressionLevel !== body.progressionLevel ||
        draft.round !== body.round
      ) {
        return NextResponse.json(
          { error: "Admin progress must match an active Mock Test." },
          { status: 403 },
        );
      }
    }

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

    const topicId =
      body.topicId?.trim() || null;

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

    if (
      !isDifficulty(
        body.difficulty,
      )
    ) {
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

    if (
      !isQuizRound(
        body.round,
      )
    ) {
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

    const requiresGovernmentTopic =
      body.source === "mock-test" &&
      body.level ===
        "government-exam" &&
      Boolean(
        getGovernmentExamSyllabus(
          body.exam,
        ),
      );

    const requiresCompetitiveTopic =
      body.source === "mock-test" &&
      body.level ===
        "competitive-exam" &&
      Boolean(
        getCompetitiveExamSyllabus(
          body.exam,
        ),
      );

    const requiresMbaTopic =
      body.source === "mock-test" &&
      body.level ===
        "mba-entrance" &&
      Boolean(
        getMbaExamSyllabus(
          body.exam,
        ),
      );

    const requiresTopic =
      requiresGovernmentTopic ||
      requiresCompetitiveTopic ||
      requiresMbaTopic;

    const validTopic =
      topicId !== null &&
      (
        (
          requiresGovernmentTopic &&
          isValidGovernmentExamTopic(
            body.exam,
            subject,
            topicId,
          )
        ) ||
        (
          requiresCompetitiveTopic &&
          isValidCompetitiveExamTopic(
            body.exam,
            subject,
            topicId,
          )
        ) ||
        (
          requiresMbaTopic &&
          isValidMbaExamTopic(
            body.exam,
            subject,
            topicId,
          )
        )
      );

    if (
      requiresTopic &&
      !validTopic
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a valid Mock Test topic.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !requiresTopic &&
      topicId
    ) {
      return NextResponse.json(
        {
          error:
            "Topic selection is not available for this examination.",
        },
        {
          status: 400,
        },
      );
    }
    if (requiresTopic) {
      const draft = await getActiveQuizArenaDraft(session.id);
      if (
        !draft || draft.source !== "mock-test" ||
        draft.level !== body.level || draft.exam !== body.exam ||
        draft.subject !== subject || (draft.topicId ?? null) !== topicId ||
        draft.progressionLevel !== body.progressionLevel ||
        draft.round !== body.round
      ) {
        return NextResponse.json(
          { error: "The topic progress does not match the active saved mock test." },
          { status: 409 },
        );
      }
    }

    const progress =
      await saveQuizArenaRoundProgress({
        userId:
          session.id,

        learningCategory:
          body.level,

        exam:
          body.exam,

        schoolClass:
          schoolContext.schoolClass,

        board:
          schoolContext.board,

        subject,

        topicId,

        difficulty:
          body.difficulty,

        progressionLevel:
          body.progressionLevel,

        round:
          body.round,

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

        score:
          Math.max(
            0,
            Number(
              body.score,
            ) || 0,
          ),
      });

    return NextResponse.json({
      progress,
    });
  }
  catch (error) {
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