import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  competitiveExams,
  getExamDetails,
  getLevelTitle,
  QUIZ_QUESTIONS_PER_ROUND,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
  type QuizJourneyLevel,
  type QuizRound,
  type Stream,
} from "@/lib/quiz-arena-config";
import type { QuizQuestion } from "@/lib/quiz-arena-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateQuizRequest = {
  level?: EducationLevel;
  stream?: Stream | null;
  exam?: CompetitiveExam | null;
  subject?: string;
  difficulty?: Difficulty;
  progressionLevel?: QuizJourneyLevel;
  round?: QuizRound;
};

type GeneratedQuestion = {
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

function getAllowedSubjects(exam: CompetitiveExam | null): string[] {
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

    const {
      level,
      exam,
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

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "Please select a subject." },
        { status: 400 },
      );
    }

    const allowedSubjects = getAllowedSubjects(exam);

    if (!allowedSubjects.includes(subject)) {
      return NextResponse.json(
        { error: "This subject is not available for the selected course." },
        { status: 400 },
      );
    }

    const questionCount = QUIZ_QUESTIONS_PER_ROUND;
    const studentCategory = getStudentCategory(level, exam);
    const attemptId = randomUUID();

    const prompt = `
You are the quiz generation engine for Smart Tutor.

Create a fresh multiple-choice quiz for this learner.

Course category: ${getLevelTitle(level)}
Selected course/exam: ${selectedExamDetails.title}
Student category: ${studentCategory}
Subject: ${subject}
Difficulty: ${difficulty}

Quiz Arena progression level: ${progressionLevel} of 10
Round: ${round} of 5
Progression guidance: ${getJourneyDifficultyGuidance(progressionLevel)}

Number of questions: ${questionCount}
Attempt reference: ${attemptId}

Strict rules:
- Generate exactly ${questionCount} unique questions.
- Every question must match the selected course/exam and subject.
- Every question must have exactly 4 distinct options.
- Exactly one option must be correct.
- The correctAnswer must exactly match one option string.
- Include a short and clear explanation after each answer.
- Do not repeat a question.
- Do not mention AI or generated content.
- Do not use ambiguous wording.
- For school and junior college, match board-style academic level.
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
      const uniqueOptions = new Set(question.options);

      return (
        !question.question ||
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
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      }),
    );

    return NextResponse.json({
      questions,
      generatedByAI: true,
      provider: "gemini",
      attemptId,
    });
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