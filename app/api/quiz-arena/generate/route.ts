import { randomUUID, randomInt } from "crypto";
import type { Document } from "mongodb";
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
import type {
  QuizQuestion,
  QuizQuestionVisual,
  QuizVisualType,
} from "@/lib/quiz-arena-questions";
import { getGovernmentExamSyllabus, isValidGovernmentExamTopic } from "@/lib/government-exam-topics";
import {
  getCompetitiveExamSyllabus,
  getCompetitiveExamTopics,
  isValidCompetitiveExamTopic,
} from "@/lib/competitive-exam-topics";

import {
  getMbaExamSyllabus,
  getMbaExamTopics,
  isValidMbaExamTopic,
} from "@/lib/mba-exam-topics";
import {
  createGovernmentQuestionFingerprint,
  ensureGovernmentQuestionBankIndexes,
  getGovernmentTopicQuestions,
  type GovernmentQuestion,
} from "@/lib/government-question-bank";
import { COLLECTIONS, getCollection } from "@/lib/data-store";
import { getBoardSubjects } from "@/lib/quiz-board-subjects";
import { getQuizBoardSyllabus } from "@/lib/quiz-board-syllabus";
import {
  auditSchoolBoardQuiz,
  findLikelyRepeatedQuizQuestion,
} from "@/lib/quiz-question-audit";
import {
  getPreviouslySeenQuizQuestions,
  questionHash,
  reserveQuizQuestions,
} from "@/lib/quiz-seen-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// On-demand generation can require multiple Gemini calls; actual hosting limits still apply.
export const maxDuration = 300;

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
  topicId?: string | null;
};

type GeneratedQuestion = {
  syllabusUnit?: string;

  question: string;

  /*
   * Gemini returns visual data as a JSON-encoded string.
   *
   * We parse it into `visual` after receiving the response.
   * This keeps Gemini's structured-output schema shallow.
   */
  visualJson?: string;

  visual?: QuizQuestionVisual;

  options: string[];

  correctAnswer: string;

  explanation: string;
};

function getRequiredVisualType(
  topicTitle: string | null | undefined,
): QuizVisualType | null {
  const topic =
    (topicTitle ?? "")
      .trim()
      .toLowerCase();

  if (!topic) {
    return null;
  }

  if (
    topic.includes("bar graph") ||
    topic.includes("bar chart")
  ) {
    return "bar-chart";
  }

  if (
    topic.includes("line graph") ||
    topic.includes("line chart")
  ) {
    return "line-chart";
  }

  if (
    topic.includes("pie chart") ||
    topic.includes("pie graph")
  ) {
    return "pie-chart";
  }

  if (
    topic.includes("mixed graph") ||
    topic.includes("mixed chart") ||
    topic.includes("graphics interpretation")
  ) {
    return "mixed-chart";
  }

  if (
    topic === "tables" ||
    topic.includes("table analysis") ||
    topic.includes("data table")
  ) {
    return "table";
  }

  return null;
}

function isValidQuizVisual(
  value: unknown,
): value is QuizQuestionVisual {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const visual =
    value as Partial<QuizQuestionVisual>;

  const validTypes: QuizVisualType[] = [
    "bar-chart",
    "line-chart",
    "pie-chart",
    "table",
    "mixed-chart",
  ];

  if (
    !visual.type ||
    !validTypes.includes(visual.type)
  ) {
    return false;
  }

  if (
    typeof visual.title !== "string" ||
    visual.title.trim().length < 3
  ) {
    return false;
  }

  if (
    !Array.isArray(visual.labels) ||
    visual.labels.length < 2 ||
    visual.labels.length > 12 ||
    visual.labels.some(
      (label) =>
        typeof label !== "string" ||
        !label.trim(),
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(visual.series) ||
    visual.series.length < 1 ||
    visual.series.length > 4
  ) {
    return false;
  }

  for (const series of visual.series) {

    if (
      !series ||
      typeof series !== "object" ||
      typeof series.name !== "string" ||
      !series.name.trim() ||
      !Array.isArray(series.values) ||
      series.values.length !==
        visual.labels.length ||
      series.values.some(
        (value) =>
          typeof value !== "number" ||
          !Number.isFinite(value),
      )
    ) {
      return false;
    }
  }

  if (visual.type === "pie-chart") {

    if (
      visual.series.length !== 1 ||
      visual.series[0].values.some(
        (value) => value < 0,
      ) ||
      visual.series[0].values.reduce(
        (sum, value) => sum + value,
        0,
      ) <= 0
    ) {
      return false;
    }
  }

  return true;
}

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

/*
 * Topic-wise Government Mock Tests: generate only what the current round needs.
 * The existing approved MongoDB bank is used first. This runs ONLY for a
 * catalogued Government Exam topic; subject-wise, school and MBA flows are unchanged.
 */
const governmentLevelGuidance: Record<QuizJourneyLevel, string> = {
  1: "Basic one-step recognition; easy calculations and definitions.",
  2: "Core understanding and straightforward applications.",
  3: "Applied basics and familiar exam-style contexts.",
  4: "Intermediate multi-step questions.",
  5: "Combined concepts and closer distractors.",
  6: "Demanding applications with careful reasoning.",
  7: "Exam-standard timed-practice reasoning.",
  8: "Advanced multi-step and tricky but fair choices.",
  9: "Expert problems requiring deeper analysis.",
  10: "Most challenging appropriate exam-style problems.",
};

async function askGovernmentGemini(
  apiKey: string,
  prompt: string,
  temperature: number,
): Promise<unknown> {
  const model = process.env.GEMINI_QUESTION_MODEL || "gemini-3.1-flash-lite";
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
          },
        }),
        signal: AbortSignal.timeout(55000),
      });

      if (!response.ok) {
        // Transient service/quota failures should not publish unchecked content.
        if ((response.status === 429 || response.status >= 500) && attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
          continue;
        }
        throw new Error(`Gemini HTTP ${response.status}`);
      }

      const payload = (await response.json()) as GeminiResponse;
      const text = extractGeminiText(payload);
      if (!text) throw new Error("Gemini returned an empty response.");
      return JSON.parse(text) as unknown;
    } catch (error) {
      if (
        attempt < 3 &&
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Gemini could not complete the request.");
}

type GovernmentAIQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

function isValidGovernmentAIQuestion(value: unknown): value is GovernmentAIQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<GovernmentAIQuestion>;
  return (
    typeof q.question === "string" && q.question.trim().length >= 12 &&
    Array.isArray(q.options) && q.options.length === 4 &&
    q.options.every((option) => typeof option === "string" && option.trim().length > 0) &&
    new Set(q.options.map((option) => option.trim().toLowerCase())).size === 4 &&
    typeof q.correctAnswer === "string" && q.options.includes(q.correctAnswer) &&
    typeof q.explanation === "string" && q.explanation.trim().length >= 15
  );
}

async function fillGovernmentTopicBank(input: {
  exam: CompetitiveExam;
  subject: string;
  topicId: string;
  progressionLevel: QuizJourneyLevel;
  previouslySeen: string[];
}): Promise<number> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing from the server environment.");

  const syllabus = getGovernmentExamSyllabus(input.exam);
  const topic = syllabus?.subjects
    .find((entry) => entry.subject === input.subject)?.topics
    .find((entry) => entry.id === input.topicId);
  if (!syllabus || !topic) throw new Error("Invalid Government Exam topic.");

  await ensureGovernmentQuestionBankIndexes();
  const bank = await getCollection<Document & GovernmentQuestion>(
    COLLECTIONS.governmentQuestionBank,
  );
  const topicScope = {
    exam: input.exam,
    subject: input.subject,
    topicId: input.topicId,
  };
  const levelScope = { ...topicScope, progressionLevel: input.progressionLevel };
  const maxPerLevel = 50;
  const requiredForRound = QUIZ_QUESTIONS_PER_ROUND;
  const seenHashes = new Set(input.previouslySeen.map(questionHash));
  let inserted = 0;

  // A student never has to wait for all 50 questions to be populated.
  // Generate at most the currently missing questions, in small batches.
  for (let batch = 0; batch < 6; batch += 1) {
    const approved = await getGovernmentTopicQuestions(levelScope);
    const unused = approved.filter((q) => !seenHashes.has(questionHash(q.question)));
    if (unused.length >= requiredForRound || approved.length >= maxPerLevel) break;

    const desired = Math.min(
      5,
      requiredForRound - unused.length,
      maxPerLevel - approved.length,
    );
    if (desired <= 0) break;

    const stored = await bank.find(topicScope, {
      projection: { _id: 0, question: 1, fingerprint: 1 },
    }).toArray();
    const knownTexts: string[] = stored
      .map((item) => item.question)
      .filter((question): question is string => typeof question === "string");
    const hashes = new Set(knownTexts.map(createGovernmentQuestionFingerprint));

    const generationPrompt = `Generate EXACTLY ${desired} original multiple-choice questions for SmartIQ Institute.
Exam: ${syllabus.title} (ID: ${input.exam}).
Subject: ${input.subject}. Topic: ${topic.title} (ID: ${input.topicId}).
Difficulty: Level ${input.progressionLevel}/10. ${governmentLevelGuidance[input.progressionLevel]}
STRICT SCOPE: Only this exam, subject, topic and difficulty. Exactly FOUR distinct options,
exactly ONE correct answer matching an option verbatim, and a clear accurate explanation.
Solve quantitative questions BEFORE writing answer choices; avoid ambiguous questions.
For current affairs or changing facts, use stable knowledge rather than unsupported live claims.
This is AI-generated practice, never claim to be an official or previous-year exam question.
Avoid repeated or close-paraphrased questions, including these bank/user examples:
${[...knownTexts.slice(-30), ...input.previouslySeen.slice(-15)].join("\n") || "None"}
Return JSON ONLY: {"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":"exact option text","explanation":"..."}]}`;

    try {
      const generated = await askGovernmentGemini(apiKey, generationPrompt, 0.85) as {
        questions?: unknown;
      };
      if (!Array.isArray(generated?.questions) ||
          generated.questions.length !== desired) {
        throw new Error("Generator did not return the requested number of questions.");
      }

      const candidates: GovernmentAIQuestion[] = [];
      for (const candidate of generated.questions) {
        if (!isValidGovernmentAIQuestion(candidate)) continue;
        const fingerprint = createGovernmentQuestionFingerprint(candidate.question);
        if (hashes.has(fingerprint)) continue;
        if (seenHashes.has(questionHash(candidate.question))) continue;
        if (findLikelyRepeatedQuizQuestion(
          candidate.question,
          [...knownTexts, ...input.previouslySeen, ...candidates.map((q) => q.question)],
        )) continue;
        hashes.add(fingerprint);
        candidates.push(candidate);
      }
      if (candidates.length === 0) continue;

      // Separate independent AI pass. Never store rejected or uncertain answers.
      const reviewPrompt = `Independently solve and review EACH MCQ from scratch.
Exam ${syllabus.title}; subject ${input.subject}; topic ${topic.title}; level ${input.progressionLevel}/10.
Reject inaccurate answers, faulty explanations, off-topic questions, multiple correct
choices, inappropriate difficulty, ambiguous wording and uncertain factual claims.
Return one result per index. Input: ${JSON.stringify(candidates.map((q, i) => ({ index: i, ...q })))}
Return JSON ONLY: {"checks":[{"index":0,"pass":true,"reason":"short mathematical or factual justification"}]}`;
      const reviewed = await askGovernmentGemini(apiKey, reviewPrompt, 0.1) as {
        checks?: Array<{ index?: unknown; pass?: unknown; reason?: unknown }>;
      };
      if (!Array.isArray(reviewed?.checks) ||
          reviewed.checks.length !== candidates.length) {
        throw new Error("Independent review returned an incomplete response.");
      }
      const checks = new Map(reviewed.checks.map((check) => [check.index, check]));
      if (checks.size !== candidates.length) {
        throw new Error("Independent review returned duplicate indexes.");
      }

      for (const [index, question] of candidates.entries()) {
        const check = checks.get(index);
        if (!check || check.pass !== true ||
            typeof check.reason !== "string" || check.reason.trim().length < 6) {
          continue;
        }
        // Preserve the existing 50-per-level bank restriction.
        const count = await bank.countDocuments({ ...levelScope, status: "approved" });
        if (count >= maxPerLevel) break;
        const now = new Date().toISOString();
        const document: GovernmentQuestion = {
          id: `government-question-${randomUUID()}`,
          ...levelScope,
          topicName: topic.title,
          question: question.question.trim(),
          options: question.options.map((option) => option.trim()),
          correctAnswer: question.correctAnswer.trim(),
          explanation: question.explanation.trim(),
          fingerprint: createGovernmentQuestionFingerprint(question.question),
          status: "approved",
          source: "gemini",
          syllabusYear: syllabus.syllabusYear,
          createdAt: now,
          updatedAt: now,
          reviewedAt: now,
          reviewedBy: "automated-gemini-check-NOT-human-verified",
        };
        try {
          await bank.insertOne(document);
          inserted += 1;
        } catch (error) {
          // Another student's request may have created the same question.
          if (!(error && typeof error === "object" && "code" in error &&
                error.code === 11000)) throw error;
        }
      }
    } catch (error) {
      // Malformed JSON and temporary Gemini errors must not poison the bank.
      console.warn("Government round AI batch failed:", error);
    }
  }
  return inserted;
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

    // Government Mock Tests: use approved bank questions first, generate missing
    // questions on demand using the SAME Gemini flow and an independent AI review.
    // All other categories retain the original subject-wise generation below.
    const requiresGovernmentTopic =
      body.source === "mock-test" &&
      level === "government-exam" &&
      Boolean(getGovernmentExamSyllabus(exam));

    const requiresCompetitiveTopic =
      body.source === "mock-test" &&
      level === "competitive-exam" &&
      Boolean(getCompetitiveExamSyllabus(exam));

    const requiresMbaTopic =
      body.source === "mock-test" &&
      level === "mba-entrance" &&
      Boolean(getMbaExamSyllabus(exam));

    const topicId =
      typeof body.topicId === "string"
        ? body.topicId.trim()
        : "";

    if (
      requiresCompetitiveTopic &&
      (
        !topicId ||
        !isValidCompetitiveExamTopic(
          exam,
          subject,
          topicId,
        )
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a valid Competitive Exam topic.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      requiresMbaTopic &&
      (
        !topicId ||
        !isValidMbaExamTopic(
          exam,
          subject,
          topicId,
        )
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a valid MBA Entrance topic.",
        },
        {
          status: 400,
        },
      );
    }

    if (requiresGovernmentTopic) {
      if (!topicId || !isValidGovernmentExamTopic(exam, subject, topicId)) {
        return NextResponse.json(
          { error: "Please select a valid Government Exam topic." },
          { status: 400 },
        );
      }

      const previouslySeen = await getPreviouslySeenQuizQuestions(session.id);
      const seen = new Set(previouslySeen.map(questionHash));
      let bankQuestions = await getGovernmentTopicQuestions({
        exam,
        subject,
        topicId,
        progressionLevel,
      });
      let unused = bankQuestions.filter((q) => !seen.has(questionHash(q.question)));
      let newlyGenerated = 0;

      if (unused.length < QUIZ_QUESTIONS_PER_ROUND && bankQuestions.length < 50) {
        try {
          newlyGenerated = await fillGovernmentTopicBank({
            exam,
            subject,
            topicId,
            progressionLevel,
            previouslySeen,
          });
        } catch (error) {
          console.error("Government Mock Test on-demand generation failed:", error);
          return NextResponse.json(
            { error: "Could not generate this topic round. Check the server Gemini key and try again." },
            { status: 503 },
          );
        }
        bankQuestions = await getGovernmentTopicQuestions({
          exam,
          subject,
          topicId,
          progressionLevel,
        });
        unused = bankQuestions.filter((q) => !seen.has(questionHash(q.question)));
      }

      if (unused.length < QUIZ_QUESTIONS_PER_ROUND) {
        const bankFull = bankQuestions.length >= 50;
        return NextResponse.json(
          {
            error: bankFull
              ? "This level's 50-question bank has no full unused round left for your account. Your five rounds may already be completed."
              : `Only ${unused.length} unused questions are available so far. AI could not complete this round; please try again.`,
          },
          { status: bankFull ? 409 : 503 },
        );
      }

      for (let i = unused.length - 1; i > 0; i -= 1) {
        const j = randomInt(i + 1);
        [unused[i], unused[j]] = [unused[j], unused[i]];
      }
      const picked = unused.slice(0, QUIZ_QUESTIONS_PER_ROUND);
      const questions: QuizQuestion[] = picked.map((question) => ({
        id: question.id,
        level,
        stream: selectedExamDetails.stream,
        exam,
        subject,
        topicId,
        difficulty,
        progressionLevel,
        round,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      }));
      const reserved = await reserveQuizQuestions(
        session.id,
        questions.map((question) => question.question),
      );
      if (!reserved) {
        return NextResponse.json(
          { error: "Another request already selected these questions. Please start the round again." },
          { status: 409 },
        );
      }
      return NextResponse.json({
        questions,
        generatedByAI: newlyGenerated > 0,
        provider: newlyGenerated > 0
          ? "gemini-verified-government-question-bank"
          : "approved-government-question-bank",
      });
    }

    if (
      topicId &&
      !requiresCompetitiveTopic &&
      !requiresMbaTopic
    ) {
      return NextResponse.json(
        {
          error:
            "Topic selection is not supported in this quiz.",
        },
        {
          status: 400,
        },
      );
    }

    const competitiveTopic =
      requiresCompetitiveTopic
        ? getCompetitiveExamTopics(
            exam,
            subject,
          ).find(
            (topic) =>
              topic.id === topicId,
          ) ?? null
        : null;

    const mbaTopic =
      requiresMbaTopic
        ? getMbaExamTopics(
            exam,
            subject,
          ).find(
            (topic) =>
              topic.id === topicId,
          ) ?? null
        : null;

    if (
      requiresCompetitiveTopic &&
      !competitiveTopic
    ) {
      return NextResponse.json(
        {
          error:
            "The selected Competitive Exam topic is not configured.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      requiresMbaTopic &&
      !mbaTopic
    ) {
      return NextResponse.json(
        {
          error:
            "The selected MBA Entrance topic is not configured.",
        },
        {
          status: 400,
        },
      );
    }

    const selectedPracticeTopic =
      competitiveTopic ??
      mbaTopic;

    /*
     * Some entrance-exam topics make no sense without
     * the actual chart/table.
     *
     * Example:
     * CAT -> DILR -> Bar Graphs
     */
    const requiredVisualType =
      getRequiredVisualType(
        selectedPracticeTopic?.title,
      );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing. Add it in .env or .env.local and restart the server." },
        { status: 500 },
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

    let academicAuditRejected = false;
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
Selected topic: ${selectedPracticeTopic ? `${selectedPracticeTopic.title} (ID: ${topicId})` : "Not applicable"}
Difficulty: ${difficulty}

Visual requirement:
${
  requiredVisualType
    ? `MANDATORY. Every question in this round MUST contain a visual object of type "${requiredVisualType}". The student must need to READ the displayed chart/table to answer the question. Never ask generic theory questions such as "What does the height of a bar represent?"`
    : "No mandatory chart/table for this selected topic."
}

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
- If a Competitive Exam or MBA Entrance topic is selected, EVERY question must stay strictly inside that exact selected topic. Do not drift into another chapter, skill, paper or subject.
- When Visual requirement is MANDATORY, EVERY generated question must include visualJson.
- visualJson MUST be a valid JSON-encoded string representing this object shape:
  {"type":"bar-chart | line-chart | pie-chart | table | mixed-chart","title":"...","xLabel":"...","yLabel":"...","labels":["..."],"series":[{"name":"...","values":[1,2,3]}]}
- Do not put markdown around visualJson.
- labels and every series.values array must have exactly the same length.
- A mandatory visual question MUST require the learner to inspect and calculate/read from the chart or table.
- Never replace a mandatory chart question with a definition or theory question about charts.
- The numerical data inside visual.labels and visual.series must contain everything needed to answer the question.
- The correctAnswer and explanation must be mathematically consistent with the displayed visual data.
- Give every chart a clear title, meaningful labels, and series names.
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
            maxOutputTokens:
              requiredVisualType
                ? 8192
                : difficulty === "hard"
                  ? 8192
                  : 5000,
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
                      visualJson: {
                        type: "STRING",
                        description:
                          "For mandatory visual questions, return the chart/table as a JSON-encoded string. The encoded object must contain type, title, labels and series. Example: {\"type\":\"bar-chart\",\"title\":\"Annual Sales\",\"xLabel\":\"Year\",\"yLabel\":\"Sales\",\"labels\":[\"2022\",\"2023\"],\"series\":[{\"name\":\"Sales\",\"values\":[120,160]}]}. For non-visual questions use an empty string.",
                      },
                      question: {
                        type: "STRING",
                        description:
                          "Question the learner answers. For mandatory visual topics this must require reading the visual.",
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
      academicAuditRejected = true;
      continue;
    }

    /*
     * Decode chart/table data after Gemini returns.
     *
     * Keeping this outside responseSchema avoids sending Gemini
     * a deeply nested structured-output schema.
     */
    for (const question of parsed.questions) {
      if (
        typeof question.visualJson === "string" &&
        question.visualJson.trim()
      ) {
        try {
          question.visual =
            JSON.parse(
              question.visualJson,
            ) as QuizQuestionVisual;
        } catch {
          question.visual =
            undefined;
        }
      }
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
        !question.explanation ||
        (
          requiredVisualType
            ? (
                !question.visual ||
                question.visual.type !== requiredVisualType ||
                !isValidQuizVisual(question.visual)
              )
            : (
                question.visual
                  ? !isValidQuizVisual(question.visual)
                  : false
              )
        )
      );
    });

    if (invalidQuestion) {
      academicAuditRejected = true;
      continue;
    }

    const questions: QuizQuestion[] = parsed.questions.map(
      (question, index) => ({
        id: `${attemptId}-${index + 1}`,
        level,
        stream: selectedExamDetails.stream,
        exam,
        subject,
        ...(selectedPracticeTopic
          ? {
              topicId,
            }
          : {}),

        difficulty,
        progressionLevel,
        round,

        ...(question.visual
          ? {
              visual: question.visual,
            }
          : {}),

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

    // Stage 3: best-effort near-duplicate check against ALL saved questions,
    // including earlier Quiz Arena and Mock Test attempts, plus this batch.
    const texts = questions.map((item) => item.question);
    const resemblesSeen = texts.some((text, index) =>
      findLikelyRepeatedQuizQuestion(
        text,
        [...previouslySeen, ...texts.slice(0, index)],
      ) !== null,
    );
    if (resemblesSeen) {
      continue;
    }

    /*
     * Competitive Mock Test review.
     *
     * Questions are still generated ON DEMAND.
     * We do not pre-generate a 500-question Competitive bank.
     *
     * A separate Gemini call checks:
     *
     * - answer correctness
     * - ambiguity
     * - selected topic scope
     * - exam suitability
     */

    if (selectedPracticeTopic) {
      try {
        const reviewed =
          await askGovernmentGemini(
            apiKey,

            `Independently solve and review EACH MCQ from scratch.

Exam: ${selectedExamDetails.title}
Subject: ${subject}
Topic: ${selectedPracticeTopic.title}

Progression Level:
${progressionLevel}/10

Round:
${round}/5

Reject a question if ANY of these apply:

- incorrect answer
- ambiguous wording
- more than one correct option
- no correct option
- incorrect explanation
- outside the exact selected topic
- outside the selected subject
- unsuitable for the selected exam
- unsuitable for the selected progression level
- required chart/table is missing
- question does not actually require reading the visual
- displayed chart/table data does not support the claimed correct answer
- visual labels, values or series are internally inconsistent

Required visual type:
${requiredVisualType ?? "none"}

Questions:

${JSON.stringify(
  questions.map(
    (question, index) => ({
      index,

      visual:
        question.visual ?? null,

      question:
        question.question,

      options:
        question.options,

      correctAnswer:
        question.correctAnswer,

      explanation:
        question.explanation,
    }),
  ),
)}

Return JSON ONLY:

{
  "checks": [
    {
      "index": 0,
      "pass": true,
      "reason": "short factual or mathematical justification"
    }
  ]
}`,

            0.1,
          ) as {
            checks?: Array<{
              index?: unknown;
              pass?: unknown;
              reason?: unknown;
            }>;
          };

        const checks =
          reviewed.checks;

        if (
          !Array.isArray(checks) ||
          checks.length !==
            questions.length ||
          new Set(
            checks.map(
              (check) =>
                check.index,
            ),
          ).size !==
            questions.length ||
          checks.some(
            (
              check,
              index,
            ) =>
              check.index !==
                index ||
              check.pass !==
                true ||
              typeof check.reason !==
                "string" ||
              check.reason
                .trim()
                .length < 6,
          )
        ) {
          academicAuditRejected =
            true;

          continue;
        }
      }
      catch (error) {
        console.warn(
          "Topic-wise entrance exam independent review failed:",
          error,
        );

        academicAuditRejected =
          true;

        continue;
      }
    }


    // Stage 3: a separate academic review screens the COMPLETE board round.
    // This is AI-assisted screening, not certification against official PDFs.
    if (syllabus) {
      const review = await auditSchoolBoardQuiz({
        apiKey,
        board: syllabus.board,
        schoolClass: syllabus.schoolClass,
        subject: syllabus.subject,
        academicYear: syllabus.academicYear,
        allowedUnits: syllabus.units,
        questions: questions.map((item) => ({
          question: item.question,
          options: item.options,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          syllabusUnit: item.syllabusUnit,
        })),
        previouslySeen,
      });
      if (!review.ok) {
        academicAuditRejected = true;
        console.warn("Quiz Arena: academic review rejected round:", review.reason);
        continue;
      }
    }

    const reserved = await reserveQuizQuestions(
      session.id,
      texts,
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
      {
        error: academicAuditRejected
          ? "We could not create ten questions that passed the independent syllabus and answer review. Please try again."
          : "Unable to generate ten sufficiently distinct new questions without repeats. Please try again.",
      },
      { status: academicAuditRejected ? 422 : 409 },
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