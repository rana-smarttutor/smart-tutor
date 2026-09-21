import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

import {
  competitiveExams,
  getExamDetails,
  getLevelTitle,
    getQuizSchoolClasses,
  quizBoardOptions,
  requiresQuizBoard,QUIZ_QUESTIONS_PER_ROUND,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
    type QuizBoard,type QuizJourneyLevel,
  type QuizRound,
    type QuizSchoolClass,type Stream,
} from "@/lib/quiz-arena-config";
import type { QuizQuestion } from "@/lib/quiz-arena-questions";
import { getBoardSubjects } from "@/lib/quiz-board-subjects";
import { getQuizBoardSyllabus } from "@/lib/quiz-board-syllabus";
import {
  getPreviouslySeenQuizQuestions,
  questionHash,
  reserveQuizQuestions,
} from "@/lib/quiz-seen-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateQuizRequest = {
  source?: "quiz-arena" | "mock-test";
  level?: EducationLevel;
  stream?: Stream | null;
  exam?: CompetitiveExam | null;
    schoolClass?: QuizSchoolClass | null;
  board?: QuizBoard | null;subject?: string;
  difficulty?: Difficulty;
  progressionLevel?: QuizJourneyLevel;
  round?: QuizRound;
};

type GeneratedQuestion = {
  syllabusUnit?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const validLevels: EducationLevel[] = [
  "school-junior-college",
  "competitive-exam",
  "government-exam",
  "mba-entrance",
];

const validDifficulties: Difficulty[] = ["easy", "medium", "hard"];



function isEducationLevel(value: unknown): value is EducationLevel {
  return validLevels.includes(value as EducationLevel);
}

function isDifficulty(value: unknown): value is Difficulty {
  return validDifficulties.includes(value as Difficulty);
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

function isCompetitiveExam(value: unknown): value is CompetitiveExam {
  return competitiveExams.some((exam) => exam.id === value);
}

function isQuizBoard(
  value: unknown,
): value is QuizBoard {
  return quizBoardOptions.some(
    (board) => board.id === value,
  );
}

function getAllowedSubjects(
  exam: CompetitiveExam | null,
  schoolClass: QuizSchoolClass | null,
  board: QuizBoard | null,
): string[] {
  if (requiresQuizBoard(exam)) {
    return getBoardSubjects(exam, schoolClass, board);
  }
  return getExamDetails(exam)?.subjects ?? [];
}

function getStudentCategory(
  level: EducationLevel,
  exam: CompetitiveExam | null,
): string {
  const examDetails = getExamDetails(exam);

  if (examDetails) {
    return `${examDetails.title} preparation under ${getLevelTitle(
      level,
    )}. Eligibility guidance: ${examDetails.eligibility}. Trend note: ${
      examDetails.trendNote
    }.`;
  }

  return getLevelTitle(level);
}

function getJourneyDifficultyGuidance(
  progressionLevel: QuizJourneyLevel,
): string {
  const guidance: Record<QuizJourneyLevel, string> = {
    1: "Fundamental recall and simple concept recognition.",
    2: "Core concepts with straightforward understanding checks.",
    3: "Applied basics using simple reasoning and practical application.",
    4: "Intermediate questions requiring multiple concepts or steps.",
    5: "Strong conceptual questions with closer distractors.",
    6: "Application-focused questions requiring deeper reasoning.",
    7: "Realistic exam-practice questions matching the selected exam.",
    8: "Advanced exam-style questions with challenging distractors.",
    9: "Expert-level reasoning and high-precision subject knowledge.",
    10: "Master-level challenge using the toughest appropriate exam-style questions.",
  };

  return guidance[progressionLevel];
}
function extractGeminiText(data: GeminiResponse): string | null {
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  const text = parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  return text || null;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Student login is required." }, { status: 401 });
    }
    if (
      (session.role !== "student" && session.role !== "admin") ||
      (session.status && session.status !== "active")
    ) {
      return NextResponse.json(
        { error: "Only active students and admins can generate mock tests." },
        { status: 403 },
      );
    }
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing. Add it in .env or .env.local and restart the server.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GenerateQuizRequest;

    if (session.role === "admin" && body.source !== "mock-test") {
      return NextResponse.json(
        { error: "Admins may generate Mock Tests only." },
        { status: 403 },
      );
    }

    const {
      level,
      exam,
      schoolClass,
      board,
      subject,
      difficulty,
      progressionLevel,
      round,
    } = body;

    if (!isEducationLevel(level)) {
      return NextResponse.json(
        { error: "Invalid learning category selected." },
        { status: 400 },
      );
    }

    if (!isDifficulty(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty selected." },
        { status: 400 },
      );
    }

    if (!isQuizJourneyLevel(progressionLevel)) {
      return NextResponse.json(
        { error: "Please select a valid Quiz Arena level." },
        { status: 400 },
      );
    }

    if (!isQuizRound(round)) {
      return NextResponse.json(
        { error: "Please select a valid Quiz Arena round." },
        { status: 400 },
      );
    }

    if (!isCompetitiveExam(exam)) {
      return NextResponse.json(
        { error: "Please select a valid course or exam." },
        { status: 400 },
      );
    }

    const selectedExamDetails = getExamDetails(exam);

    if (!selectedExamDetails || selectedExamDetails.category !== level) {
      return NextResponse.json(
        { error: "This course does not belong to the selected category." },
        { status: 400 },
      );
    }
    const allowedClasses =
      getQuizSchoolClasses(exam);

    let normalizedSchoolClass:
      QuizSchoolClass | null = null;

    let normalizedBoard:
      QuizBoard | null = null;

    if (allowedClasses.length > 0) {
      if (
        !schoolClass ||
        !allowedClasses.includes(
          schoolClass,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Please select a valid class for this course.",
          },
          {
            status: 400,
          },
        );
      }

      normalizedSchoolClass =
        schoolClass;
    }

    if (requiresQuizBoard(exam)) {
      if (!isQuizBoard(board)) {
        return NextResponse.json(
          {
            error:
              "Please select HSC or CBSE.",
          },
          {
            status: 400,
          },
        );
      }

      normalizedBoard = board;
    }

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "Please select a subject." },
        { status: 400 },
      );
    }

    const allowedSubjects = getAllowedSubjects(exam, normalizedSchoolClass, normalizedBoard);

    if (!allowedSubjects.includes(subject)) {
      return NextResponse.json(
        { error: "This subject is not available for the selected course." },
        { status: 400 },
      );
    }

    // Board syllabi are enforced only for school courses in classes 9-12.
    // Missing catalog entries fail closed, never silently switch board or class.
    const syllabus = normalizedBoard && normalizedSchoolClass
      ? getQuizBoardSyllabus(exam, normalizedSchoolClass, normalizedBoard, subject)
      : null;
    if (requiresQuizBoard(exam) && !syllabus) {
      return NextResponse.json(
        { error: "Syllabus outline is not configured for this board, class and subject. Please contact SmartIQ support." },
        { status: 422 },
      );
    }

    const syllabusUnits = syllabus?.units ?? [];
    const questionCount = QUIZ_QUESTIONS_PER_ROUND;
    const studentCategory = getStudentCategory(level, exam);
    const previouslySeen = await getPreviouslySeenQuizQuestions(session.id);
    const seenHashes = new Set(previouslySeen.map(questionHash));
    const examplesToAvoid = previouslySeen.slice(-35)
      .map((text, index) => `${index + 1}. ${text}`)
      .join("\n");

    for (let generationAttempt = 0; generationAttempt < 3; generationAttempt += 1) {
    const attemptId = randomUUID();

    const prompt = `
You are the quiz generation engine for Smart Tutor.

Create a fresh multiple-choice quiz for this learner.

Course category: ${getLevelTitle(level)}
Selected course/exam: ${selectedExamDetails.title}
Selected class: ${
  normalizedSchoolClass
    ? `Class ${normalizedSchoolClass}`
    : "Not applicable"
}
Selected board: ${normalizedBoard ?? "Not applicable"}
Selected stream: ${selectedExamDetails.stream}
Student category: ${studentCategory}
Subject: ${subject}
Difficulty: ${difficulty}

${syllabus ? `CURRICULUM RESTRICTIONS (school board course):
Academic year: ${syllabus.academicYear}
Board: ${syllabus.board}
Class: ${syllabus.schoolClass}
Subject: ${syllabus.subject}
Permitted curriculum units ONLY (use their names verbatim):
${syllabus.units.map((unit, index) => `${index + 1}. ${unit}`).join("\n")}
Reference: ${syllabus.sourceUrl}
These are editable topical outlines, not an exhaustive official chapter transcription. Do NOT invent textbook chapters or claim that the question was verified from a document you cannot access.
Attach a syllabusUnit to EVERY question, and it MUST exactly equal a permitted unit above.
Use only subtopics demonstrably appropriate to the named unit, class and board. No higher-class or entrance-only material.` : ""}

Quiz Arena progression level: ${progressionLevel} of 10
Round: ${round} of 5
Progression guidance: ${getJourneyDifficultyGuidance(progressionLevel)}

Number of questions: ${questionCount}
Attempt reference: ${attemptId}

Questions this user has already seen (DO NOT reuse or simply paraphrase these):
${examplesToAvoid || "None recorded yet."}

Board curriculum source (when applicable): ${normalizedBoard === "CBSE" ? "CBSE 2026-27, https://cbseacademic.nic.in/curriculum_2027.html" : normalizedBoard ? "Maharashtra official Balbharati textbooks, https://ebooks.ebalbharati.in/" : "Selected entrance examination syllabus"}
Selected subject must be taught in the exact selected class and board.
The current subject list is a subject catalog, not a verified chapter allowlist;
do not claim source verification or invent official chapter names.

Strict rules:
- Generate exactly ${questionCount} unique questions.
- Every question must match the selected course/exam and subject.
- For a school-board question, syllabusUnit must be selected verbatim from the permitted curriculum units. For other examinations, use syllabusUnit = "Not applicable".
- Every question must have exactly 4 distinct options.
- Exactly one option must be correct.
- The correctAnswer must exactly match one option string.
- Include a short and clear explanation after each answer.
- Do not repeat a question.
- Do not mention AI or generated content.
- Do not use ambiguous wording.
- If a school class is selected, every question must stay inside that exact class syllabus level.
- Never mix Class 6, Class 7, Class 8, Class 9 or Class 10 syllabus levels.
- Never mix Class 11 and Class 12 syllabus levels.
- If Maharashtra State Board is selected, use Maharashtra State Board syllabus scope only.
- If Maharashtra State Board is selected, do not use CBSE-specific syllabus content.
- If CBSE is selected, use CBSE / NCERT-aligned syllabus scope only.
- If CBSE is selected, do not use Maharashtra HSC-specific syllabus content.
- For Class 11 or Class 12, stay inside the selected stream and selected subject.
- Do not introduce JEE, NEET, CET or other entrance-exam-only content when a school-board course is selected.
- For Classes 6 to 10, stay strictly at the selected class academic level.
- For competitive exams, create exam-style questions appropriate for the selected exam.
- For government exams, use syllabus-style aptitude, reasoning, GK or subject questions according to the selected exam.
- For MBA entrance exams, use exam-style VARC, DILR, Quant, Reasoning or relevant section questions.
- For Current Affairs, avoid live/latest claims and use stable general-awareness questions only.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: difficulty === "hard" ? 8192 : 5000,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                questions: {
                  type: "ARRAY",
                  minItems: questionCount,
                  maxItems: questionCount,
                  items: {
                    type: "OBJECT",
                    properties: {
                      syllabusUnit: {
                        type: "STRING",
                        description: "Exact selected curriculum unit for school courses; Not applicable for other exams.",
                      },
                      question: {
                        type: "STRING",
                        description: "The quiz question.",
                      },
                      options: {
                        type: "ARRAY",
                        minItems: 4,
                        maxItems: 4,
                        items: {
                          type: "STRING",
                        },
                        description: "Exactly four distinct answer choices.",
                      },
                      correctAnswer: {
                        type: "STRING",
                        description:
                          "The exact correct option text from the options array.",
                      },
                      explanation: {
                        type: "STRING",
                        description:
                          "A short learner-friendly explanation of the answer.",
                      },
                    },
                    required: [
                      "syllabusUnit",
                      "question",
                      "options",
                      "correctAnswer",
                      "explanation",
                    ],
                  },
                },
              },
              required: ["questions"],
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error("Gemini quiz generation error:", errorBody);

      let readableError = "Unable to generate your quiz right now.";

      try {
        const parsedError = JSON.parse(errorBody) as {
          error?: {
            message?: string;
          };
        };

        readableError = parsedError.error?.message ?? readableError;
      } catch {
        readableError = errorBody || readableError;
      }

      return NextResponse.json(
        {
          error: readableError,
        },
        { status: response.status },
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractGeminiText(data);

    if (!text) {
      return NextResponse.json(
        {
          error: "Gemini returned an empty quiz response. Please try again.",
        },
        { status: 502 },
      );
    }

    let parsed: { questions?: GeneratedQuestion[] };

    try {
      parsed = JSON.parse(text) as { questions?: GeneratedQuestion[] };
    } catch {
      console.error("Gemini returned non-JSON text:", text);

      return NextResponse.json(
        {
          error: "Gemini returned invalid quiz data. Please try again.",
        },
        { status: 502 },
      );
    }

    if (
      !Array.isArray(parsed.questions) ||
      parsed.questions.length !== questionCount
    ) {
      return NextResponse.json(
        {
          error: "The generated quiz is incomplete. Please try again.",
        },
        { status: 502 },
      );
    }

    const invalidQuestion = parsed.questions.some((question) => {
      const uniqueOptions = new Set(Array.isArray(question.options) ? question.options : []);

      return (
        !question.question ||
        (syllabus ? !syllabusUnits.includes(question.syllabusUnit ?? "") : false) ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        uniqueOptions.size !== 4 ||
        !question.correctAnswer ||
        !question.options.includes(question.correctAnswer) ||
        !question.explanation
      );
    });

    if (invalidQuestion) {
      return NextResponse.json(
        {
          error: "The generated question data is invalid. Please try again.",
        },
        { status: 502 },
      );
    }

    const questions: QuizQuestion[] = parsed.questions.map(
      (question, index) => ({
        id: `${attemptId}-${index + 1}`,
        level,
        stream: selectedExamDetails.stream,
        exam,
        subject,
        difficulty,
        progressionLevel,
        round,
        question: question.question,
        ...(syllabus ? {
          syllabusUnit: question.syllabusUnit,
          syllabusAcademicYear: syllabus.academicYear,
          syllabusVerification: syllabus.verification,
        } : {}),
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      }),
    );

    const generatedHashes = questions.map((item) => questionHash(item.question));
    if (
      new Set(generatedHashes).size !== questions.length ||
      generatedHashes.some((hash) => seenHashes.has(hash))
    ) {
      continue;
    }

    const reserved = await reserveQuizQuestions(
      session.id,
      questions.map((item) => item.question),
    );
    if (!reserved) {
      // Another request may have reserved an overlapping question.
      for (const item of questions) seenHashes.add(questionHash(item.question));
      continue;
    }

    return NextResponse.json({
      questions,
      generatedByAI: true,
      provider: "gemini",
      attemptId,
    });
    }

    return NextResponse.json(
      { error: "Unable to generate ten new questions without repeats. Please try again." },
      { status: 409 },
    );
  } catch (error) {
    console.error("Quiz Arena generation route error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating your quiz. Please try again.",
      },
      { status: 500 },
    );
  }
}