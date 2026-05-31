import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

import {
  competitiveExams,
  levelSubjects,
  streamSubjects,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
  type Stream,
} from '@/lib/quiz-arena-config';
import type { QuizQuestion } from '@/lib/quiz-arena-questions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenerateQuizRequest = {
  level?: EducationLevel;
  stream?: Stream | null;
  exam?: CompetitiveExam | null;
  subject?: string;
  difficulty?: Difficulty;
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
  'class-1-2',
  'class-3-5',
  'class-6-8',
  'class-9-10',
  'class-11-12',
  'undergraduate',
  'graduate',
  'competitive-exam',
];

const validStreams: Stream[] = ['science', 'commerce', 'humanities'];

const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];

const questionCountByDifficulty: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

function isEducationLevel(value: unknown): value is EducationLevel {
  return validLevels.includes(value as EducationLevel);
}

function isStream(value: unknown): value is Stream {
  return validStreams.includes(value as Stream);
}

function isDifficulty(value: unknown): value is Difficulty {
  return validDifficulties.includes(value as Difficulty);
}

function isCompetitiveExam(value: unknown): value is CompetitiveExam {
  return competitiveExams.some((exam) => exam.id === value);
}

function getAllowedSubjects(
  level: EducationLevel,
  stream?: Stream | null,
  exam?: CompetitiveExam | null
): string[] {
  if (level === 'class-11-12') {
    return stream ? streamSubjects[stream] : [];
  }

  if (level === 'competitive-exam') {
    return competitiveExams.find((option) => option.id === exam)?.subjects ?? [];
  }

  return levelSubjects[level] ?? [];
}

function getStudentCategory(
  level: EducationLevel,
  stream?: Stream | null,
  exam?: CompetitiveExam | null
): string {
  if (level === 'class-11-12') {
    return `Class 11–12 ${stream ?? ''} stream student`;
  }

  if (level === 'competitive-exam') {
    const examTitle =
      competitiveExams.find((option) => option.id === exam)?.title ??
      'Competitive Exam';

    return `${examTitle} competitive examination aspirant`;
  }

  const labels: Record<EducationLevel, string> = {
    'class-1-2': 'Class 1–2 student',
    'class-3-5': 'Class 3–5 student',
    'class-6-8': 'Class 6–8 student',
    'class-9-10': 'Class 9–10 student',
    'class-11-12': 'Class 11–12 student',
    undergraduate: 'Undergraduate student',
    graduate: 'Graduate student',
    'competitive-exam': 'Competitive examination aspirant',
  };

  return labels[level];
}

function extractGeminiText(data: GeminiResponse): string | null {
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  const text = parts
    .map((part) => part.text ?? '')
    .join('')
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
            'GEMINI_API_KEY is missing. Add it in .env or .env.local and restart the server.',
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as GenerateQuizRequest;
    const { level, stream, exam, subject, difficulty } = body;

    if (!isEducationLevel(level)) {
      return NextResponse.json(
        { error: 'Invalid learning level selected.' },
        { status: 400 }
      );
    }

    if (!isDifficulty(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty selected.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { error: 'Please select a subject.' },
        { status: 400 }
      );
    }

    if (level === 'class-11-12' && !isStream(stream)) {
      return NextResponse.json(
        { error: 'Please select a valid stream.' },
        { status: 400 }
      );
    }

    if (level === 'competitive-exam' && !isCompetitiveExam(exam)) {
      return NextResponse.json(
        { error: 'Please select a valid competitive exam.' },
        { status: 400 }
      );
    }

    const allowedSubjects = getAllowedSubjects(level, stream, exam);

    if (!allowedSubjects.includes(subject)) {
      return NextResponse.json(
        { error: 'This subject is not available for the selected level.' },
        { status: 400 }
      );
    }

    const questionCount = questionCountByDifficulty[difficulty];
    const studentCategory = getStudentCategory(level, stream, exam);
    const attemptId = randomUUID();

    const prompt = `
You are the quiz generation engine for Smart Tutor.

Create a fresh multiple-choice quiz for this learner.

Student category: ${studentCategory}
Subject: ${subject}
Difficulty: ${difficulty}
Number of questions: ${questionCount}
Attempt reference: ${attemptId}

Strict rules:
- Generate exactly ${questionCount} unique questions.
- Every question must match the student's level and selected subject.
- Every question must have exactly 4 distinct options.
- Exactly one option must be correct.
- The correctAnswer must exactly match one option string.
- Include a short and clear explanation after each answer.
- Do not repeat a question.
- Do not mention AI or generated content.
- Do not use ambiguous wording.
- For Class 1–5, keep language friendly, simple and age-appropriate.
- For Class 6–10, use school-level concept and practice questions.
- For Class 11–12, match the selected stream.
- For competitive exams, create exam-style questions appropriate for the selected exam.
- For Current Affairs, avoid live/latest claims and use stable general-awareness questions only.
`;

const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
  {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
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
        maxOutputTokens: difficulty === 'hard' ? 8192 : 5000,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            questions: {
              type: 'ARRAY',
              minItems: questionCount,
              maxItems: questionCount,
              items: {
                type: 'OBJECT',
                properties: {
                  question: {
                    type: 'STRING',
                    description: 'The quiz question.',
                  },
                  options: {
                    type: 'ARRAY',
                    minItems: 4,
                    maxItems: 4,
                    items: {
                      type: 'STRING',
                    },
                    description: 'Exactly four distinct answer choices.',
                  },
                  correctAnswer: {
                    type: 'STRING',
                    description:
                      'The exact correct option text from the options array.',
                  },
                  explanation: {
                    type: 'STRING',
                    description:
                      'A short learner-friendly explanation of the answer.',
                  },
                },
                required: [
                  'question',
                  'options',
                  'correctAnswer',
                  'explanation',
                ],
              },
            },
          },
          required: ['questions'],
        },
      },
    }),
  }
);
    if (!response.ok) {
      const errorBody = await response.text();

      console.error('Gemini quiz generation error:', errorBody);

      let readableError = 'Unable to generate your quiz right now.';

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
        { status: response.status }
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractGeminiText(data);

    if (!text) {
      return NextResponse.json(
        {
          error: 'Gemini returned an empty quiz response. Please try again.',
        },
        { status: 502 }
      );
    }

    let parsed: { questions?: GeneratedQuestion[] };

    try {
      parsed = JSON.parse(text) as { questions?: GeneratedQuestion[] };
    } catch {
      console.error('Gemini returned non-JSON text:', text);

      return NextResponse.json(
        {
          error: 'Gemini returned invalid quiz data. Please try again.',
        },
        { status: 502 }
      );
    }

    if (
      !Array.isArray(parsed.questions) ||
      parsed.questions.length !== questionCount
    ) {
      return NextResponse.json(
        {
          error: 'The generated quiz is incomplete. Please try again.',
        },
        { status: 502 }
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
          error: 'The generated question data is invalid. Please try again.',
        },
        { status: 502 }
      );
    }

    const questions: QuizQuestion[] = parsed.questions.map(
      (question, index) => ({
        id: `${attemptId}-${index + 1}`,
        level,
        ...(level === 'class-11-12' && stream ? { stream } : {}),
        ...(level === 'competitive-exam' && exam ? { exam } : {}),
        subject,
        difficulty,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      })
    );

    return NextResponse.json({
      questions,
      generatedByAI: true,
      provider: 'gemini',
      attemptId,
    });
  } catch (error) {
    console.error('Quiz Arena generation route error:', error);

    return NextResponse.json(
      {
        error:
          'Something went wrong while creating your quiz. Please try again.',
      },
      { status: 500 }
    );
  }
}