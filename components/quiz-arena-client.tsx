"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  getDifficultyForJourneyLevel,
  getExamDetails,
  getExamTitle,
  getExamsByCategory,
  getLevelTitle,
  levelOptions,
  quizJourneyLevels,
  QUIZ_ROUNDS_PER_LEVEL,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
  type QuizJourneyLevel,
  type QuizRound,
} from "@/lib/quiz-arena-config";
import type { QuizQuestion } from "@/lib/quiz-arena-questions";

type Step =
  | "welcome"
  | "level"
  | "exam"
  | "subject"
  | "journey"
  | "quiz"
  | "result";

type QuestionAttempt = {
  questionId: string;
  question: string;
  options: string[];

  selectedAnswer: string;
  correctAnswer: string;

  isCorrect: boolean;

  explanation: string;

  timeTakenMs: number;
};

type QuizResult = {
  score: number;

  correctAnswers: number;
  incorrectAnswers: number;

  bestStreak: number;

  attemptedQuestions: number;

  totalTimeMs: number;

  averageQuestionTimeMs: number;

  attempts: QuestionAttempt[];
};
export default function QuizArenaClient() {
  const [step, setStep] = useState<Step>("welcome");

  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | null>(
    null,
  );
  const [selectedExam, setSelectedExam] = useState<CompetitiveExam | null>(
    null,
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedJourneyLevel, setSelectedJourneyLevel] =
    useState<QuizJourneyLevel | null>(null);

  const [selectedRound, setSelectedRound] = useState<QuizRound | null>(null);

  const [unlockedJourneyLevel, setUnlockedJourneyLevel] =
    useState<QuizJourneyLevel>(1);

  const [completedRounds, setCompletedRounds] = useState<
    Record<number, QuizRound[]>
  >({});

  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [isProgressLoading, setIsProgressLoading] = useState(false);

  const [showExitModal, setShowExitModal] = useState(false);

  const selectedExamDetails = useMemo(() => {
    return getExamDetails(selectedExam);
  }, [selectedExam]);

  const currentExamOptions = useMemo(() => {
    return getExamsByCategory(selectedLevel);
  }, [selectedLevel]);

  const subjects = useMemo(() => {
    if (!selectedExamDetails) {
      return [];
    }

    return selectedExamDetails.subjects;
  }, [selectedExamDetails]);

  const playfulMode =
    selectedExam === "class-6-8" || selectedExam === "class-9-10";

  function selectLevel(level: EducationLevel) {
    setSelectedLevel(level);
    setSelectedExam(null);
    setSelectedSubject(null);
    setSelectedJourneyLevel(null);
    setSelectedRound(null);
    setActiveQuestions([]);
    setResult(null);
    setMessage("");
    setShowExitModal(false);
    setStep("exam");
  }

  function changeLevel() {
    setSelectedLevel(null);
    setSelectedExam(null);
    setSelectedSubject(null);
    setSelectedJourneyLevel(null);
    setSelectedRound(null);
    setActiveQuestions([]);
    setResult(null);
    setMessage("");
    setShowExitModal(false);
    setStep("level");
  }

  function goBack() {
    setMessage("");
    setShowExitModal(false);

    if (step === "level") {
      setStep("welcome");
      return;
    }

    if (step === "exam") {
      setSelectedLevel(null);
      setSelectedExam(null);
      setSelectedSubject(null);
      setStep("level");
      return;
    }

    if (step === "subject") {
      setSelectedSubject(null);
      setStep("exam");
      return;
    }

    if (step === "journey") {
      setSelectedJourneyLevel(null);
      setSelectedRound(null);
      setStep("subject");
      return;
    }

    if (step === "result") {
      setResult(null);
      setActiveQuestions([]);
      setStep("journey");
    }
  }

  function requestExitQuiz() {
    setShowExitModal(true);
  }

  function cancelExitQuiz() {
    setShowExitModal(false);
  }

  function confirmExitQuiz() {
    setShowExitModal(false);
    setActiveQuestions([]);
    setResult(null);
    setMessage("");
    setStep("journey");
  }

  async function generateChallenge(
    progressionLevel: QuizJourneyLevel,
    round: QuizRound,
  ) {
    if (!selectedLevel || !selectedExam || !selectedSubject) {
      setMessage("Please complete your quiz selection first.");
      return;
    }

    const effectiveDifficulty = getDifficultyForJourneyLevel(progressionLevel);

    try {
      setIsGenerating(true);
      setShowExitModal(false);
      setMessage("");
      setResult(null);

      const response = await fetch("/api/quiz-arena/generate", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          level: selectedLevel,

          exam: selectedExam,

          subject: selectedSubject,

          difficulty: effectiveDifficulty,

          progressionLevel,

          round,
        }),
      });

      const data = (await response.json()) as {
        questions?: QuizQuestion[];
        error?: string;
      };

      if (!response.ok || !data.questions || data.questions.length === 0) {
        throw new Error(
          data.error ?? "Unable to generate your quiz. Please try again.",
        );
      }

      setActiveQuestions(data.questions);

      setStep("quiz");
    } catch (error) {
      console.warn("Quiz generation error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate your quiz right now. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function startChallenge() {
    if (!selectedJourneyLevel || !selectedRound) {
      setMessage("Please select a level and round first.");
      return;
    }

    await generateChallenge(selectedJourneyLevel, selectedRound);
  }
  async function openJourney(subjectOverride?: string) {
    const journeySubject = subjectOverride?.trim() || selectedSubject?.trim();

    if (!selectedLevel || !selectedExam || !journeySubject) {
      setMessage("Please complete your quiz selection first.");
      return;
    }

    try {
      setIsProgressLoading(true);
      setMessage("");

      const params = new URLSearchParams({
        level: selectedLevel,
        exam: selectedExam,
        subject: journeySubject,

        // Legacy progress bucket only.
        // User-facing difficulty is now determined by Level 1-10.
        difficulty: "easy",
      });

      const response = await fetch(
        `/api/quiz-arena/progress?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (response.ok) {
        const data = (await response.json()) as {
          progress?: {
            unlockedLevel?: QuizJourneyLevel;
            completedRounds?: Record<number, QuizRound[]>;
            totalQuestionsCompleted?: number;
          } | null;
        };

        if (data.progress) {
          const restoredLevel = data.progress.unlockedLevel ?? 1;

          setUnlockedJourneyLevel(restoredLevel);

          setCompletedRounds(data.progress.completedRounds ?? {});

          setSelectedJourneyLevel(restoredLevel);
        } else {
          setUnlockedJourneyLevel(1);
          setCompletedRounds({});
          setSelectedJourneyLevel(1);
        }
      } else {
        setUnlockedJourneyLevel(1);
        setCompletedRounds({});
        setSelectedJourneyLevel(1);
      }

      setSelectedRound(null);
      setStep("journey");
    } catch (error) {
      console.warn("Unable to load Quiz Arena progress:", error);

      setUnlockedJourneyLevel(1);
      setCompletedRounds({});
      setSelectedJourneyLevel(1);
      setSelectedRound(null);
      setStep("journey");
    } finally {
      setIsProgressLoading(false);
    }
  }
  async function persistRoundProgress(finalResult: QuizResult) {
    if (
      !selectedLevel ||
      !selectedExam ||
      !selectedSubject ||
      !selectedJourneyLevel ||
      !selectedRound
    ) {
      return;
    }

    if (finalResult.attemptedQuestions !== activeQuestions.length) {
      return;
    }

    try {
      const response = await fetch("/api/quiz-arena/progress", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          level: selectedLevel,
          exam: selectedExam,
          subject: selectedSubject,

          // Legacy progress bucket only.
          difficulty: "easy",

          progressionLevel: selectedJourneyLevel,

          round: selectedRound,

          correctAnswers: finalResult.correctAnswers,

          incorrectAnswers: finalResult.incorrectAnswers,

          score: finalResult.score,
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        progress?: {
          unlockedLevel?: QuizJourneyLevel;

          completedRounds?: Record<number, QuizRound[]>;
        };
      };

      if (data.progress?.unlockedLevel) {
        setUnlockedJourneyLevel(data.progress.unlockedLevel);
      }

      if (data.progress?.completedRounds) {
        setCompletedRounds(data.progress.completedRounds);
      }
    } catch (error) {
      console.warn("Unable to save Quiz Arena progress:", error);
    }
  }
  async function persistRoundAttempt(finalResult: QuizResult) {
    if (
      !selectedLevel ||
      !selectedExam ||
      !selectedSubject ||
      !selectedJourneyLevel ||
      !selectedRound
    ) {
      return;
    }

    const difficulty = getDifficultyForJourneyLevel(selectedJourneyLevel);

    try {
      const response = await fetch("/api/quiz-arena/attempts", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          level: selectedLevel,

          exam: selectedExam,

          subject: selectedSubject,

          progressionLevel: selectedJourneyLevel,

          round: selectedRound,

          difficulty,

          score: finalResult.score,

          correctAnswers: finalResult.correctAnswers,

          incorrectAnswers: finalResult.incorrectAnswers,

          totalTimeMs: finalResult.totalTimeMs,

          averageQuestionTimeMs: finalResult.averageQuestionTimeMs,

          questions: finalResult.attempts,
        }),
      });

      if (!response.ok) {
        console.warn("Quiz Arena attempt was not saved.");
      }
    } catch (error) {
      console.warn("Unable to save Quiz Arena attempt:", error);
    }
  }

  async function continueQuizJourney() {
    if (!selectedJourneyLevel || !selectedRound) {
      setStep("journey");
      return;
    }

    // Round 1-4 -> immediately start next round
    if (selectedRound < QUIZ_ROUNDS_PER_LEVEL) {
      const nextRound = (selectedRound + 1) as QuizRound;

      setSelectedRound(nextRound);

      await generateChallenge(selectedJourneyLevel, nextRound);

      return;
    }

    // Round 5 -> immediately start next level
    if (selectedJourneyLevel < 10) {
      const nextLevel = (selectedJourneyLevel + 1) as QuizJourneyLevel;

      const nextRound = 1 as QuizRound;

      setUnlockedJourneyLevel(
        (previous) => Math.max(previous, nextLevel) as QuizJourneyLevel,
      );

      setSelectedJourneyLevel(nextLevel);

      setSelectedRound(nextRound);

      await generateChallenge(nextLevel, nextRound);

      return;
    }

    // Level 10 Round 5 -> journey complete
    setSelectedRound(null);
    setStep("journey");
  }

  function finishQuiz(finalResult: QuizResult) {
    if (
      selectedJourneyLevel &&
      selectedRound &&
      finalResult.attemptedQuestions === activeQuestions.length
    ) {
      const existingRounds = completedRounds[selectedJourneyLevel] ?? [];

      const nextRounds = existingRounds.includes(selectedRound)
        ? existingRounds
        : [...existingRounds, selectedRound].sort(
            (left, right) => left - right,
          );

      setCompletedRounds((previous) => ({
        ...previous,
        [selectedJourneyLevel]: nextRounds,
      }));

      if (
        nextRounds.length >= QUIZ_ROUNDS_PER_LEVEL &&
        selectedJourneyLevel < 10
      ) {
        const nextLevel = (selectedJourneyLevel + 1) as QuizJourneyLevel;

        setUnlockedJourneyLevel(
          (previous) => Math.max(previous, nextLevel) as QuizJourneyLevel,
        );
      }
    }

    void persistRoundProgress(finalResult);
    void persistRoundAttempt(finalResult);

    setResult(finalResult);
    setShowExitModal(false);
    setStep("result");
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-5 py-8 text-white">
      {step !== "welcome" && step !== "quiz" && (
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="absolute left-5 top-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl font-semibold text-white shadow-lg backdrop-blur-md transition hover:-translate-x-1 hover:border-cyan-300 hover:bg-cyan-300/20 sm:left-8 sm:top-8"
        >
          ←
        </button>
      )}

      {step === "quiz" && (
        <button
          type="button"
          onClick={requestExitQuiz}
          className="absolute left-5 top-6 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:border-red-300 hover:bg-red-400/20 sm:left-8 sm:top-8"
        >
          <span className="text-lg">←</span>
          <span>Exit Quiz</span>
        </button>
      )}

      {step === "quiz" && showExitModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-5 backdrop-blur-[2px]"
          role="presentation"
          onClick={cancelExitQuiz}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-quiz-title"
            aria-describedby="exit-quiz-description"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-7 text-center shadow-2xl shadow-black/40 sm:p-9"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-400/15 text-3xl">
              🚪
            </div>

            <h2
              id="exit-quiz-title"
              className="mt-5 text-2xl font-bold text-white"
            >
              Exit Quiz?
            </h2>

            <p
              id="exit-quiz-description"
              className="mt-3 text-sm leading-6 text-slate-300"
            >
              Are you sure you want to leave this quiz? Your progress will be
              lost.
            </p>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cancelExitQuiz}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Continue Quiz
              </button>

              <button
                type="button"
                onClick={confirmExitQuiz}
                className="flex-1 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400"
              >
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`mx-auto max-w-6xl ${
          step === "welcome" ? "" : "pt-16 sm:pt-14"
        }`}
      >
        {step === "welcome" && (
          <section className="flex min-h-[88vh] items-center justify-center">
            <div className="max-w-3xl text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
                SmartIQ Institute
              </p>

              <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
                Quiz Arena
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
                Fresh quizzes for school, junior college, competitive exams,
                government exams and MBA entrance preparation.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  📘 School Courses
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  🎯 Competitive Exams
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  🏛️ Government Exams
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  📊 MBA Entrances
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep("level")}
                className="mt-12 rounded-2xl bg-cyan-400 px-12 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:-translate-y-1 hover:bg-cyan-300"
              >
                Start Quiz
              </button>
            </div>
          </section>
        )}

        {step === "level" && (
          <section>
            <Header
              title="Choose your course category"
              subtitle="Select the type of course or exam you want to practise."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {levelOptions.map((level) => (
                <button
                  type="button"
                  key={level.id}
                  onClick={() => selectLevel(level.id)}
                  className="rounded-3xl border border-white/10 bg-white/10 p-6 text-left backdrop-blur-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:bg-white/15"
                >
                  <div className="mb-5 text-4xl">{level.icon}</div>

                  <h2 className="text-xl font-bold">{level.title}</h2>

                  <p className="mt-2 text-sm font-semibold text-cyan-200">
                    {level.subtitle}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {level.description}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "exam" && (
          <section>
            <Header
              title="Choose your course or exam"
              subtitle="Pick the exact board, stream or entrance exam you want to practise."
            />

            {currentExamOptions.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center">
                <p className="font-semibold text-slate-300">
                  No courses found for this category.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {currentExamOptions.map((exam) => (
                  <button
                    type="button"
                    key={exam.id}
                    onClick={() => {
                      setSelectedExam(exam.id);
                      setSelectedSubject(null);
                      setStep("subject");
                    }}
                    className="rounded-2xl border border-white/10 bg-white/10 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300"
                  >
                    <span className="text-2xl">🎯</span>

                    <h2 className="mt-4 text-lg font-bold">{exam.title}</h2>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {exam.eligibility}
                    </p>

                    <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-cyan-200">
                      {exam.trendNote}
                    </p>

                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {exam.subjects.length} subjects
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === "subject" && (
          <section>
            <Header
              title="Choose your subject"
              subtitle={`${
                selectedExamDetails?.title ?? "Selected course"
              } • What would you like to practise today?`}
            />

            {selectedExamDetails && (
              <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-white/10 bg-white/10 p-5 text-center">
                <p className="text-sm font-semibold text-cyan-200">
                  {selectedExamDetails.eligibility}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {selectedExamDetails.trendNote}
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {subjects.map((subject) => (
                <button
                  type="button"
                  key={subject}
                  onClick={() => {
                    setSelectedSubject(subject);
                    setMessage("");
                    void openJourney(subject);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/10 p-6 text-left transition hover:-translate-y-1 hover:border-cyan-300"
                >
                  <span className="text-3xl">📚</span>
                  <h2 className="mt-4 text-lg font-bold">{subject}</h2>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "journey" && (
          <section>
            <Header
              title="Your Quiz Journey"
              subtitle={`${selectedSubject ?? ""} • Complete 10 levels and up to 500 questions.`}
            />

            <div className="mx-auto mb-8 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {quizJourneyLevels.map((journeyLevel) => {
                const locked = journeyLevel.id > unlockedJourneyLevel;

                const roundsCompleted =
                  completedRounds[journeyLevel.id]?.length ?? 0;

                const completed = roundsCompleted >= QUIZ_ROUNDS_PER_LEVEL;

                const active = selectedJourneyLevel === journeyLevel.id;

                return (
                  <button
                    type="button"
                    key={journeyLevel.id}
                    disabled={locked}
                    onClick={() => {
                      if (locked) {
                        return;
                      }

                      setSelectedJourneyLevel(journeyLevel.id);
                      setSelectedRound(null);
                      setMessage("");
                    }}
                    className={`relative rounded-3xl border p-5 text-left transition ${
                      locked
                        ? "cursor-not-allowed border-white/5 bg-white/5 opacity-45"
                        : active
                          ? "border-cyan-300 bg-cyan-300/20 shadow-lg shadow-cyan-400/10"
                          : completed
                            ? "border-emerald-400/40 bg-emerald-400/10"
                            : "border-white/10 bg-white/10 hover:-translate-y-1 hover:border-cyan-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-3xl">
                        {locked ? "🔒" : completed ? "✅" : journeyLevel.icon}
                      </span>

                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-300">
                        {roundsCompleted}/{QUIZ_ROUNDS_PER_LEVEL}
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-black">
                      {journeyLevel.title}
                    </h2>

                    <p className="mt-1 text-sm font-bold text-cyan-200">
                      {journeyLevel.subtitle}
                    </p>

                    <p className="mt-3 text-xs leading-5 text-slate-300">
                      {journeyLevel.questionCapacity} questions
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedJourneyLevel && (
              <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-8">
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Level {selectedJourneyLevel}
                  </p>

                  <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                    Choose your round
                  </h2>

                  <p className="mt-3 text-sm text-slate-300">
                    Each round contains 10 questions. Complete all 5 rounds to
                    unlock the next level.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-5">
                  {Array.from(
                    { length: QUIZ_ROUNDS_PER_LEVEL },
                    (_, index) => (index + 1) as QuizRound,
                  ).map((round) => {
                    const levelRounds =
                      completedRounds[selectedJourneyLevel] ?? [];

                    const completed = levelRounds.includes(round);

                    const previousRound =
                      round > 1 ? ((round - 1) as QuizRound) : null;

                    const locked =
                      previousRound !== null &&
                      !levelRounds.includes(previousRound);

                    const active = selectedRound === round;

                    return (
                      <button
                        type="button"
                        key={round}
                        disabled={locked}
                        onClick={() => {
                          if (!locked) {
                            setSelectedRound(round);
                            setMessage("");
                          }
                        }}
                        className={`rounded-2xl border p-4 text-center transition ${
                          locked
                            ? "cursor-not-allowed border-white/5 bg-white/5 opacity-40"
                            : active
                              ? "border-cyan-300 bg-cyan-300/20"
                              : completed
                                ? "border-emerald-400/40 bg-emerald-400/10"
                                : "border-white/10 bg-white/5 hover:border-cyan-300"
                        }`}
                      >
                        <div className="text-xl">
                          {locked ? "🔒" : completed ? "✅" : "🎯"}
                        </div>

                        <p className="mt-2 text-sm font-black">Round {round}</p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          10 Questions
                        </p>
                      </button>
                    );
                  })}
                </div>

                {message && (
                  <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-center text-sm text-red-100">
                    {message}
                  </div>
                )}

                {selectedRound && (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => void startChallenge()}
                      disabled={isGenerating}
                      className="rounded-2xl bg-cyan-400 px-10 py-4 text-base font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGenerating
                        ? "Creating Your Quiz..."
                        : `Start Level ${selectedJourneyLevel} • Round ${selectedRound}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
        {step === "quiz" && activeQuestions.length > 0 && (
          <QuizGame
            questions={activeQuestions}
            levelTitle={getLevelTitle(selectedLevel)}
            examTitle={getExamTitle(selectedExam)}
            subject={selectedSubject ?? ""}
            difficulty={getDifficultyForJourneyLevel(selectedJourneyLevel ?? 1)}
            playfulMode={playfulMode}
            onComplete={finishQuiz}
          />
        )}

        {step === "result" && result && (
          <ResultScreen
            result={result}
            levelTitle={getLevelTitle(selectedLevel)}
            examTitle={getExamTitle(selectedExam)}
            subject={selectedSubject ?? ""}
            difficulty={getDifficultyForJourneyLevel(selectedJourneyLevel ?? 1)}
            journeyLevel={selectedJourneyLevel ?? 1}
            round={selectedRound ?? 1}
            totalQuestions={activeQuestions.length}
            playfulMode={playfulMode}
            isGenerating={isGenerating}
            onContinue={() => void continueQuizJourney()}
            onChangeLevel={changeLevel}
          />
        )}
      </div>
    </main>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-10 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
        SmartIQ Institute Quiz Arena
      </p>

      <h1 className="text-3xl font-bold sm:text-5xl">{title}</h1>

      <p className="mx-auto mt-4 max-w-2xl text-slate-300">{subtitle}</p>
    </header>
  );
}

function formatQuizDuration(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);

  const totalSeconds = safeMilliseconds / 1000;

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = Math.floor(totalSeconds % 60);

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function formatLiveQuizDuration(milliseconds: number) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);

  const minutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

function QuizGame({
  questions,
  levelTitle,
  examTitle,
  subject,
  difficulty,
  playfulMode,
  onComplete,
}: {
  questions: QuizQuestion[];
  levelTitle: string;
  examTitle: string;
  subject: string;
  difficulty: Difficulty;
  playfulMode: boolean;
  onComplete: (result: QuizResult) => void;
}) {
  const quizCardRef = useRef<HTMLElement | null>(null);

  const [questionIndex, setQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const [score, setScore] = useState(0);

  const [streak, setStreak] = useState(0);

  const [bestStreak, setBestStreak] = useState(0);

  const [questionElapsedMs, setQuestionElapsedMs] = useState(0);

  const [roundElapsedMs, setRoundElapsedMs] = useState(0);

  const questionStartedAtRef = useRef(Date.now());

  const roundStartedAtRef = useRef(Date.now());

  const roundFinishedAtRef = useRef<number | null>(null);

  const attemptsRef = useRef<QuestionAttempt[]>([]);

  const currentQuestion = questions[questionIndex];

  const progress = ((questionIndex + 1) / questions.length) * 100;

  const answered = selectedAnswer !== null;

  useEffect(() => {
    questionStartedAtRef.current = Date.now();

    setQuestionElapsedMs(0);

    quizCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [questionIndex]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      const now = roundFinishedAtRef.current ?? Date.now();

      setRoundElapsedMs(now - roundStartedAtRef.current);

      if (!answered) {
        setQuestionElapsedMs(Date.now() - questionStartedAtRef.current);
      }
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, [answered]);

  function chooseAnswer(answer: string) {
    if (answered) {
      return;
    }

    const answeredAt = Date.now();

    const timeTakenMs = answeredAt - questionStartedAtRef.current;

    const isCorrect = answer === currentQuestion.correctAnswer;

    setQuestionElapsedMs(timeTakenMs);

    setSelectedAnswer(answer);

    const attempt: QuestionAttempt = {
      questionId: currentQuestion.id,

      question: currentQuestion.question,

      options: currentQuestion.options,

      selectedAnswer: answer,

      correctAnswer: currentQuestion.correctAnswer,

      isCorrect,

      explanation: currentQuestion.explanation,

      timeTakenMs,
    };

    attemptsRef.current = [...attemptsRef.current, attempt];

    if (questionIndex === questions.length - 1) {
      roundFinishedAtRef.current = answeredAt;

      setRoundElapsedMs(answeredAt - roundStartedAtRef.current);
    }

    if (isCorrect) {
      const nextStreak = streak + 1;

      const bonus = nextStreak > 0 && nextStreak % 3 === 0 ? 5 : 0;

      setScore((previousScore) => previousScore + 10 + bonus);

      setStreak(nextStreak);

      setBestStreak((previousBest) => Math.max(previousBest, nextStreak));

      return;
    }

    setStreak(0);
  }

  function nextQuestion() {
    const finished = questionIndex === questions.length - 1;

    if (finished) {
      const attempts = attemptsRef.current;

      const correctAnswers = attempts.filter(
        (attempt) => attempt.isCorrect,
      ).length;

      const incorrectAnswers = attempts.length - correctAnswers;

      const finishedAt = roundFinishedAtRef.current ?? Date.now();

      const totalTimeMs = finishedAt - roundStartedAtRef.current;

      const averageQuestionTimeMs =
        attempts.length > 0
          ? Math.round(
              attempts.reduce(
                (total, attempt) => total + attempt.timeTakenMs,
                0,
              ) / attempts.length,
            )
          : 0;

      onComplete({
        score,
        correctAnswers,
        incorrectAnswers,
        bestStreak,
        attemptedQuestions: attempts.length,
        totalTimeMs,
        averageQuestionTimeMs,
        attempts,
      });

      return;
    }

    setSelectedAnswer(null);

    setQuestionIndex((previous) => previous + 1);
  }

  return (
    <section ref={quizCardRef} className="mx-auto max-w-4xl scroll-mt-28">
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300">
              {levelTitle}

              {examTitle ? ` • ${examTitle}` : ""}

              {" • "}
              {subject}

              {" • "}

              <span className="capitalize">{difficulty}</span>
            </p>

            <p className="mt-1 font-bold">
              Question {questionIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-full bg-cyan-400/20 px-4 py-2 text-cyan-200">
              {playfulMode ? "⭐ Stars" : "Score"}: {score}
            </span>

            <span className="rounded-full bg-violet-400/20 px-4 py-2 text-violet-100">
              Question Time: {formatLiveQuizDuration(questionElapsedMs)}
            </span>

            <span className="rounded-full bg-amber-400/20 px-4 py-2 text-amber-100">
              Round Time: {formatLiveQuizDuration(roundElapsedMs)}
            </span>

            {!playfulMode && (
              <span className="rounded-full bg-orange-400/20 px-4 py-2 text-orange-200">
                🔥 {streak}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Choose your answer
        </p>

        <h2 className="mt-5 text-2xl font-bold leading-relaxed sm:text-3xl">
          {currentQuestion.question}
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {currentQuestion.options.map((option) => {
            const selected = selectedAnswer === option;

            return (
              <button
                type="button"
                key={option}
                onClick={() => chooseAnswer(option)}
                disabled={answered}
                className={`rounded-2xl border p-5 text-left text-lg font-semibold transition ${
                  selected
                    ? "border-cyan-300 bg-cyan-300/15 text-white"
                    : answered
                      ? "border-white/10 bg-white/5 text-slate-300"
                      : "border-white/10 bg-white/5 hover:border-cyan-300 hover:bg-white/10"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-8 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <h3 className="text-lg font-bold text-cyan-100">
              Answer recorded.
            </h3>

            <p className="mt-2 text-sm text-slate-300">
              Your answer and the correct solution will be shown after you
              complete the round.
            </p>

            <p className="mt-3 text-xs font-semibold text-slate-400">
              Time taken: {formatQuizDuration(questionElapsedMs)}
            </p>

            <button
              type="button"
              onClick={nextQuestion}
              className="mt-5 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              {questionIndex === questions.length - 1
                ? "Finish Round"
                : "Next Question"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ResultScreen({
  result,
  levelTitle,
  examTitle,
  subject,
  difficulty,
  journeyLevel,
  round,
  totalQuestions,
  playfulMode,
  isGenerating,
  onContinue,
  onChangeLevel,
}: {
  result: QuizResult;

  levelTitle: string;

  examTitle: string;

  subject: string;

  difficulty: Difficulty;

  journeyLevel: QuizJourneyLevel;

  round: QuizRound;

  totalQuestions: number;

  playfulMode: boolean;

  isGenerating: boolean;

  onContinue: () => void;

  onChangeLevel: () => void;
}) {
  const accuracy =
    result.attemptedQuestions === 0
      ? 0
      : Math.round((result.correctAnswers / result.attemptedQuestions) * 100);

  return (
    <section className="mx-auto max-w-5xl">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Round Completed
        </p>

        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
          Review Your Answers
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
          Level {journeyLevel}
          {" • "}
          Round {round}
          {" • "}
          <span className="capitalize">{difficulty}</span>
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-8">
        <p className="text-center text-sm text-slate-300">
          {levelTitle}

          {examTitle ? ` • ${examTitle}` : ""}

          {" • "}
          {subject}
        </p>

        <div className="mt-6 text-center">
          <p className="text-6xl font-black text-cyan-300">{result.score}</p>

          <p className="mt-2 text-sm text-slate-300">
            {playfulMode ? "Stars Score" : "Final Score"}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-5">
          <ResultCard
            title="Correct"
            value={String(result.correctAnswers)}
            icon="✅"
          />

          <ResultCard
            title="Incorrect"
            value={String(result.incorrectAnswers)}
            icon="❌"
          />

          <ResultCard title="Accuracy" value={`${accuracy}%`} icon="🎯" />

          <ResultCard
            title="Round Time"
            value={formatQuizDuration(result.totalTimeMs)}
            icon="⏱️"
          />

          <ResultCard
            title="Avg / Question"
            value={formatQuizDuration(result.averageQuestionTimeMs)}
            icon="📊"
          />
        </div>
      </div>

      <div className="mt-10 space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Question Review
          </p>

          <h2 className="mt-2 text-3xl font-black">
            See what you got right and wrong
          </h2>
        </div>

        {result.attempts.map((attempt, index) => (
          <div
            key={`${attempt.questionId}-${index}`}
            className={`rounded-3xl border p-6 sm:p-7 ${
              attempt.isCorrect
                ? "border-emerald-400/30 bg-emerald-400/10"
                : "border-red-400/30 bg-red-400/10"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">
                Question {index + 1}
              </p>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    attempt.isCorrect
                      ? "bg-emerald-400/20 text-emerald-200"
                      : "bg-red-400/20 text-red-100"
                  }`}
                >
                  {attempt.isCorrect ? "Correct" : "Incorrect"}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                  {formatQuizDuration(attempt.timeTakenMs)}
                </span>
              </div>
            </div>

            <h3 className="mt-5 text-xl font-bold leading-relaxed text-white sm:text-2xl">
              {attempt.question}
            </h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Your Answer
                </p>

                <p
                  className={`mt-2 font-bold ${
                    attempt.isCorrect ? "text-emerald-200" : "text-red-100"
                  }`}
                >
                  {attempt.selectedAnswer}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Correct Answer
                </p>

                <p className="mt-2 font-bold text-emerald-200">
                  {attempt.correctAnswer}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                Explanation
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-200">
                {attempt.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onContinue}
          disabled={isGenerating}
          className="rounded-2xl bg-cyan-400 px-8 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating
            ? "Preparing Next Round..."
            : round < QUIZ_ROUNDS_PER_LEVEL
              ? `Start Round ${round + 1}`
              : journeyLevel < 10
                ? `Start Level ${journeyLevel + 1} • Round 1`
                : "View Completed Journey"}
        </button>

        <button
          type="button"
          onClick={onChangeLevel}
          className="rounded-2xl border border-white/20 px-8 py-4 font-bold text-white transition hover:bg-white/10"
        >
          Change Category
        </button>

        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/20 px-8 py-4 text-center font-bold text-white transition hover:bg-white/10"
        >
          Go to Dashboard
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        Attempted {result.attemptedQuestions}/{totalQuestions} questions.
      </p>
    </section>
  );
}

function ResultCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-5">
      <p className="text-2xl">{icon}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{title}</p>
    </div>
  );
}
