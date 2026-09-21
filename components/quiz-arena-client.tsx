"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  getDifficultyForJourneyLevel,
  getExamDetails,
  getExamTitle,
  getExamsByCategory,
  getLevelTitle,
  getQuizSchoolClasses,
  levelOptions,
  quizBoardOptions,
  quizJourneyLevels,
  requiresQuizBoard,
  QUIZ_ROUNDS_PER_LEVEL,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
  type QuizBoard,
  type QuizJourneyLevel,
  type QuizRound,
  type QuizSchoolClass,
} from "@/lib/quiz-arena-config";
import type { QuizQuestion } from "@/lib/quiz-arena-questions";
import { getBoardSubjects } from "@/lib/quiz-board-subjects";
import type { QuizArenaDraft } from "@/lib/quiz-arena-drafts";

type Step =
  | "welcome"
  | "level"
  | "exam"
  | "class"
  | "board"
  | "subject"
  | "journey"
  | "round"
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
export default function QuizArenaClient({
  startAtCategory = false,
}: {
  startAtCategory?: boolean;
}) {
  const [step, setStep] = useState<Step>(startAtCategory ? "level" : "welcome");

  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | null>(
    null,
  );
  const [selectedExam, setSelectedExam] = useState<CompetitiveExam | null>(
    null,
  );

  const [selectedSchoolClass, setSelectedSchoolClass] =
    useState<QuizSchoolClass | null>(null);

  const [selectedBoard, setSelectedBoard] = useState<QuizBoard | null>(null);

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
  const [unfinishedDraft, setUnfinishedDraft] = useState<QuizArenaDraft | null>(
    null,
  );

  const [activeDraft, setActiveDraft] = useState<QuizArenaDraft | null>(null);

  const [showResumeChoice, setShowResumeChoice] = useState(false);

  const [confirmedReplacementDraftId, setConfirmedReplacementDraftId] =
    useState<string | null>(null);

  const [isCheckingDraft, setIsCheckingDraft] = useState(true);
  const flushQuizSaveRef = useRef<(() => Promise<boolean>) | null>(null);

  const [isExitingQuiz, setIsExitingQuiz] = useState(false);

  const [isCompletingQuiz, setIsCompletingQuiz] = useState(false);

  const [exitSaveError, setExitSaveError] = useState("");

  const registerQuizSave = useCallback(
    (save: (() => Promise<boolean>) | null) => {
      flushQuizSaveRef.current = save;
    },
    [],
  );

  const selectedExamDetails = useMemo(() => {
    return getExamDetails(selectedExam);
  }, [selectedExam]);

  const currentExamOptions = useMemo(() => {
    return getExamsByCategory(selectedLevel);
  }, [selectedLevel]);

  const currentClassOptions = useMemo(() => {
    return getQuizSchoolClasses(selectedExam);
  }, [selectedExam]);

  const subjects = useMemo(() => {
    if (!selectedExamDetails) return [];
    if (requiresQuizBoard(selectedExam)) {
      return getBoardSubjects(selectedExam, selectedSchoolClass, selectedBoard);
    }
    return selectedExamDetails.subjects;
  }, [selectedExamDetails, selectedExam, selectedSchoolClass, selectedBoard]);

  const playfulMode =
    selectedExam === "class-6-8" || selectedExam === "class-9-10";

  useEffect(() => {
    let cancelled = false;

    async function checkUnfinishedQuiz() {
      try {
        const response = await fetch("/api/quiz-arena/draft", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          draft: QuizArenaDraft | null;
        };

        if (cancelled) {
          return;
        }

        if (data.draft) {
          setUnfinishedDraft(data.draft);

          setShowResumeChoice(true);
        }
      } catch (error) {
        console.warn("Unable to check unfinished quiz:", error);
      } finally {
        if (!cancelled) {
          setIsCheckingDraft(false);
        }
      }
    }

    void checkUnfinishedQuiz();

    return () => {
      cancelled = true;
    };
  }, []);

  function resumePreviousQuiz() {
    if (!unfinishedDraft) {
      return;
    }

    const draft = unfinishedDraft;

    setSelectedLevel(draft.level);

    setSelectedExam(draft.exam);

    setSelectedSchoolClass(draft.schoolClass);

    setSelectedBoard(draft.board);

    setSelectedSubject(draft.subject);

    setSelectedJourneyLevel(draft.progressionLevel);

    setSelectedRound(draft.round);

    setActiveQuestions(draft.questions);

    setActiveDraft(draft);

    setConfirmedReplacementDraftId(null);

    setResult(null);

    setMessage("");

    setShowResumeChoice(false);

    // Open course category selection directly.
    setStep("level");
  }

  function startFreshQuiz() {
    if (!unfinishedDraft) {
      return;
    }

    const confirmed = window.confirm(
      "Start a new quiz? Your previous unfinished quiz will be replaced when you successfully start the new one.",
    );

    if (!confirmed) {
      return;
    }

    setConfirmedReplacementDraftId(unfinishedDraft.id);

    setActiveDraft(null);

    setActiveQuestions([]);

    setResult(null);

    setSelectedLevel(null);

    setSelectedExam(null);

    setSelectedSchoolClass(null);

    setSelectedBoard(null);

    setSelectedSubject(null);

    setSelectedJourneyLevel(null);

    setSelectedRound(null);

    setMessage("");

    setShowResumeChoice(false);

    // Skip the Quiz Arena welcome screen.
    setStep("level");
  }

  function selectLevel(level: EducationLevel) {
    setSelectedLevel(level);

    setSelectedExam(null);
    setSelectedSchoolClass(null);
    setSelectedBoard(null);
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
    setSelectedSchoolClass(null);
    setSelectedBoard(null);
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
      setSelectedSchoolClass(null);
      setSelectedBoard(null);
      setSelectedSubject(null);

      setStep("level");
      return;
    }

    if (step === "class") {
      setSelectedSchoolClass(null);
      setSelectedBoard(null);
      setSelectedSubject(null);

      setStep("exam");
      return;
    }

    if (step === "board") {
      setSelectedBoard(null);
      setSelectedSubject(null);

      setStep("class");
      return;
    }

    if (step === "subject") {
      setSelectedSubject(null);

      if (requiresQuizBoard(selectedExam)) {
        setStep("board");
        return;
      }

      if (currentClassOptions.length > 0) {
        setStep("class");
        return;
      }

      setStep("exam");
      return;
    }

    if (step === "journey") {
      setSelectedJourneyLevel(null);
      setSelectedRound(null);

      setStep("subject");
      return;
    }

    if (step === "round") {
      setSelectedRound(null);

      setStep("journey");
      return;
    }

    if (step === "result") {
      setResult(null);
      setActiveQuestions([]);

      setStep("round");
    }
  }
  function requestExitQuiz() {
    setExitSaveError("");
    setShowExitModal(true);
  }

  function cancelExitQuiz() {
    if (isExitingQuiz) {
      return;
    }

    setExitSaveError("");
    setShowExitModal(false);
  }

  async function confirmExitQuiz() {
    if (isExitingQuiz) {
      return;
    }

    setIsExitingQuiz(true);
    setExitSaveError("");

    try {
      if (!activeDraft || !flushQuizSaveRef.current) {
        throw new Error(
          "The current quiz is not ready to save. Please try again.",
        );
      }

      /*
       * Wait for all pending autosaves and
       * save the latest quiz state.
       */

      const saved = await flushQuizSaveRef.current();

      if (!saved) {
        throw new Error(
          "Unable to save your latest progress. Please check your connection and try again.",
        );
      }

      /*
       * Retrieve the latest saved version
       * before leaving the question interface.
       */

      const response = await fetch("/api/quiz-arena/draft", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          "Your progress was saved, but we could not verify it. Please try again.",
        );
      }

      const data = (await response.json()) as {
        draft: QuizArenaDraft | null;
      };

      if (!data.draft || data.draft.id !== activeDraft.id) {
        throw new Error("Unable to verify the saved quiz. Please try again.");
      }

      /*
       * Keep the unfinished draft available
       * for Continue Previous Quiz.
       */

      setUnfinishedDraft(data.draft);

      setActiveDraft(null);

      setShowExitModal(false);

      setActiveQuestions([]);

      setResult(null);

      setMessage("");

      setStep("round");
    } catch (error) {
      setExitSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save your quiz. Please try again.",
      );
    } finally {
      setIsExitingQuiz(false);
    }
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

    const source = window.location.pathname.startsWith("/mock-test")
      ? "mock-test"
      : "quiz-arena";

    try {
      setIsGenerating(true);
      setShowExitModal(false);
      setMessage("");
      setResult(null);

      if (isCheckingDraft) {
        throw new Error("Please wait while we check your previous quiz.");
      }

      if (
        unfinishedDraft &&
        confirmedReplacementDraftId !== unfinishedDraft.id
      ) {
        setShowResumeChoice(true);
        return;
      }

      const response = await fetch("/api/quiz-arena/generate", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          source,
          level: selectedLevel,

          exam: selectedExam,
          schoolClass: selectedSchoolClass,

          board: selectedBoard,

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

      const draftResponse = await fetch("/api/quiz-arena/draft", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          source,

          level: selectedLevel,

          exam: selectedExam,

          schoolClass: selectedSchoolClass,

          board: selectedBoard,

          subject: selectedSubject,

          progressionLevel,

          round,

          difficulty: effectiveDifficulty,

          questions: data.questions,

          replaceDraftId: confirmedReplacementDraftId ?? undefined,
        }),
      });

      const draftData = (await draftResponse.json()) as {
        draft?: QuizArenaDraft;

        error?: string;
      };

      if (!draftResponse.ok || !draftData.draft) {
        if (draftResponse.status === 409) {
          const latestResponse = await fetch("/api/quiz-arena/draft", {
            cache: "no-store",
          });

          if (latestResponse.ok) {
            const latestData = (await latestResponse.json()) as {
              draft: QuizArenaDraft | null;
            };

            if (latestData.draft) {
              setUnfinishedDraft(latestData.draft);

              setConfirmedReplacementDraftId(null);

              setShowResumeChoice(true);
            }
          }
        }

        throw new Error(draftData.error ?? "Unable to save your new quiz.");
      }

      setActiveDraft(draftData.draft);

      setUnfinishedDraft(null);

      setConfirmedReplacementDraftId(null);

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
        source: window.location.pathname.startsWith("/mock-test")
          ? "mock-test"
          : "quiz-arena",
      });
      if (selectedSchoolClass) {
        params.set("schoolClass", selectedSchoolClass);
      }

      if (selectedBoard) {
        params.set("board", selectedBoard);
      }

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
  async function persistRoundProgress(
    finalResult: QuizResult,
  ): Promise<boolean> {
    if (
      !selectedLevel ||
      !selectedExam ||
      !selectedSubject ||
      !selectedJourneyLevel ||
      !selectedRound
    ) {
      return false;
    }

    if (finalResult.attemptedQuestions !== activeQuestions.length) {
      return false;
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

          schoolClass: selectedSchoolClass,

          board: selectedBoard,

          subject: selectedSubject,

          difficulty: "easy",

          source: window.location.pathname.startsWith("/mock-test")
            ? "mock-test"
            : "quiz-arena",

          progressionLevel: selectedJourneyLevel,

          round: selectedRound,

          correctAnswers: finalResult.correctAnswers,

          incorrectAnswers: finalResult.incorrectAnswers,

          score: finalResult.score,
        }),
      });

      if (!response.ok) {
        console.warn("Quiz Arena progression was not saved.");

        return false;
      }

      const data = (await response.json()) as {
        progress?: {
          unlockedLevel?: QuizJourneyLevel;

          completedRounds?: Record<number, QuizRound[]>;
        } | null;
      };

      if (data.progress?.unlockedLevel) {
        setUnlockedJourneyLevel(data.progress.unlockedLevel);
      }

      if (data.progress?.completedRounds) {
        setCompletedRounds(data.progress.completedRounds);
      }

      return Boolean(data.progress);
    } catch (error) {
      console.warn("Unable to save Quiz Arena progress:", error);

      return false;
    }
  }
  async function persistRoundAttempt(
    finalResult: QuizResult,
  ): Promise<boolean> {
    if (
      !activeDraft ||
      !selectedLevel ||
      !selectedExam ||
      !selectedSubject ||
      !selectedJourneyLevel ||
      !selectedRound
    ) {
      return false;
    }

    const difficulty = getDifficultyForJourneyLevel(selectedJourneyLevel);

    try {
      const response = await fetch("/api/quiz-arena/attempts", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          draftId: activeDraft.id,

          level: selectedLevel,

          exam: selectedExam,

          schoolClass: selectedSchoolClass,

          board: selectedBoard,

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
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        console.warn("Quiz Arena attempt was not saved:", payload?.error);

        return false;
      }

      return true;
    } catch (error) {
      console.warn("Unable to save Quiz Arena attempt:", error);

      return false;
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

  async function finishQuiz(finalResult: QuizResult): Promise<boolean> {
    if (isCompletingQuiz || !activeDraft || !flushQuizSaveRef.current) {
      return false;
    }

    setIsCompletingQuiz(true);

    try {
      /*
       * Save the latest question state first.
       */

      const saved = await flushQuizSaveRef.current();

      if (!saved) {
        throw new Error("Unable to save your final answers.");
      }

      /*
       * Save the completed attempt.
       */

      const attemptSaved = await persistRoundAttempt(finalResult);

      if (!attemptSaved) {
        throw new Error("Unable to save the completed attempt.");
      }

      /*
       * Save the student's level and round progress.
       */

      const progressSaved = await persistRoundProgress(finalResult);

      if (!progressSaved) {
        throw new Error("Unable to save Quiz Arena progression.");
      }

      /*
       * Mark the unfinished draft as completed.
       */

      const completionResponse = await fetch("/api/quiz-arena/draft", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: activeDraft.id,

          status: "completed",
        }),
      });

      if (!completionResponse.ok) {
        const payload = (await completionResponse.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(
          payload?.error ?? "Unable to finalise the completed quiz.",
        );
      }

      /*
       * Only show results after saving succeeds.
       */

      setActiveDraft(null);

      setUnfinishedDraft(null);

      setConfirmedReplacementDraftId(null);

      setShowResumeChoice(false);

      setResult(finalResult);

      setShowExitModal(false);

      setStep("result");

      return true;
    } catch (error) {
      console.warn("Unable to complete Quiz Arena round:", error);

      return false;
    } finally {
      setIsCompletingQuiz(false);
    }
  }
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-5 py-8 text-white">
      {showResumeChoice && unfinishedDraft && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-quiz-title"
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-7 text-center text-white shadow-2xl sm:p-9"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/15 text-3xl">
              📚
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              SmartIQ Institute
            </p>

            <h2 id="resume-quiz-title" className="mt-3 text-3xl font-black">
              Welcome Back!
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              You have an unfinished quiz from your previous session.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
              <p className="text-lg font-bold text-white">
                {unfinishedDraft.subject}
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {getExamTitle(unfinishedDraft.exam)}

                {unfinishedDraft.schoolClass
                  ? ` • Class ${unfinishedDraft.schoolClass}`
                  : ""}

                {unfinishedDraft.board ? ` • ${unfinishedDraft.board}` : ""}
              </p>

              <p className="mt-3 text-sm font-semibold text-cyan-200">
                Level {unfinishedDraft.progressionLevel}
                {" • "}
                Round {unfinishedDraft.round}
              </p>

              <div className="mt-4 rounded-xl bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-200">
                {Object.keys(unfinishedDraft.answersByIndex).length} of{" "}
                {unfinishedDraft.questions.length} questions answered
              </div>
            </div>

            <div className="mt-7 grid gap-3">
              <button
                type="button"
                onClick={resumePreviousQuiz}
                className="rounded-xl bg-cyan-400 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Continue Previous Quiz
              </button>

              <button
                type="button"
                onClick={startFreshQuiz}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10"
              >
                Start New Quiz
              </button>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-400">
              Your saved quiz is associated with your account.
            </p>
          </div>
        </div>
      )}
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
          disabled={isCompletingQuiz}
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
              Your saved progress will be kept. You can return later and
              continue your unfinished quiz.
            </p>

            {exitSaveError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100"
              >
                {exitSaveError}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cancelExitQuiz}
                disabled={isExitingQuiz}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue Quiz
              </button>

              <button
                type="button"
                onClick={() => void confirmExitQuiz()}
                disabled={isExitingQuiz}
                className="flex-1 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExitingQuiz ? "Saving Quiz..." : "Save & Exit"}
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

                      setSelectedSchoolClass(null);
                      setSelectedBoard(null);
                      setSelectedSubject(null);

                      setSelectedJourneyLevel(null);
                      setSelectedRound(null);

                      setMessage("");

                      const classes = getQuizSchoolClasses(exam.id);

                      if (classes.length > 0) {
                        setStep("class");
                      } else {
                        setStep("subject");
                      }
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

        {step === "class" && (
          <section>
            <Header
              title="Choose your class"
              subtitle={`${
                selectedExamDetails?.title ?? "Selected course"
              } - Select your exact class.`}
            />

            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentClassOptions.map((schoolClass) => (
                <button
                  type="button"
                  key={schoolClass}
                  onClick={() => {
                    setSelectedSchoolClass(schoolClass);

                    setSelectedBoard(null);
                    setSelectedSubject(null);

                    setSelectedJourneyLevel(null);

                    setSelectedRound(null);
                    setMessage("");

                    if (requiresQuizBoard(selectedExam)) {
                      setStep("board");
                    } else {
                      setStep("subject");
                    }
                  }}
                  className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center transition hover:-translate-y-1 hover:border-cyan-300 hover:bg-white/15"
                >
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                    School Class
                  </p>

                  <h2 className="mt-4 text-3xl font-black">
                    Class {schoolClass}
                  </h2>

                  <p className="mt-3 text-sm text-slate-300">
                    Questions will be generated for Class {schoolClass}.
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "board" && (
          <section>
            <Header
              title="Choose your board"
              subtitle={`Class ${
                selectedSchoolClass ?? ""
              } - Select Maharashtra State Board or CBSE.`}
            />

            <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
              {quizBoardOptions.map((board) => (
                <button
                  type="button"
                  key={board.id}
                  onClick={() => {
                    setSelectedBoard(board.id);

                    setSelectedSubject(null);

                    setSelectedJourneyLevel(null);

                    setSelectedRound(null);

                    setMessage("");

                    setStep("subject");
                  }}
                  className="rounded-3xl border border-white/10 bg-white/10 p-8 text-left transition hover:-translate-y-1 hover:border-cyan-300 hover:bg-white/15"
                >
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Board
                  </p>

                  <h2 className="mt-4 text-3xl font-black">{board.title}</h2>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {board.description}
                  </p>
                </button>
              ))}
            </div>
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
              title="Choose your Quiz Journey Level"
              subtitle={`${selectedSubject ?? ""} - Select a level to continue.`}
            />

            <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {quizJourneyLevels.map((journeyLevel) => {
                const locked = journeyLevel.id > unlockedJourneyLevel;

                const roundsCompleted =
                  completedRounds[journeyLevel.id]?.length ?? 0;

                const completed = roundsCompleted >= QUIZ_ROUNDS_PER_LEVEL;

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

                      setStep("round");
                    }}
                    className={`rounded-3xl border p-5 text-left transition ${
                      locked
                        ? "cursor-not-allowed border-white/5 bg-white/5 opacity-40"
                        : completed
                          ? "border-emerald-400/40 bg-emerald-400/10 hover:-translate-y-1"
                          : "border-white/10 bg-white/10 hover:-translate-y-1 hover:border-cyan-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                        Level {journeyLevel.id}
                      </span>

                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-300">
                        {roundsCompleted}/{QUIZ_ROUNDS_PER_LEVEL}
                      </span>
                    </div>

                    <h2 className="mt-4 text-lg font-black">
                      {journeyLevel.title}
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-cyan-100">
                      {journeyLevel.subtitle}
                    </p>

                    <p className="mt-4 text-xs leading-5 text-slate-400">
                      {locked
                        ? "Complete the previous level to unlock."
                        : completed
                          ? "Level completed."
                          : `${journeyLevel.questionCapacity} questions available.`}
                    </p>
                  </button>
                );
              })}
            </div>

            {message && (
              <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-center text-sm text-red-100">
                {message}
              </div>
            )}
          </section>
        )}

        {step === "round" && selectedJourneyLevel && (
          <section>
            <Header
              title={`Level ${selectedJourneyLevel} - Choose your round`}
              subtitle="Each round contains 10 questions."
            />

            <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-5">
                {Array.from(
                  {
                    length: QUIZ_ROUNDS_PER_LEVEL,
                  },
                  (_, index) => (index + 1) as QuizRound,
                ).map((round) => {
                  const completedForLevel =
                    completedRounds[selectedJourneyLevel] ?? [];

                  const completed = completedForLevel.includes(round);

                  const previousRound =
                    round > 1 ? ((round - 1) as QuizRound) : null;

                  const locked =
                    previousRound !== null &&
                    !completedForLevel.includes(previousRound);

                  const selected = selectedRound === round;

                  return (
                    <button
                      type="button"
                      key={round}
                      disabled={locked}
                      onClick={() => {
                        if (locked) {
                          return;
                        }

                        setSelectedRound(round);

                        setMessage("");
                      }}
                      className={`rounded-2xl border p-5 text-center transition ${
                        locked
                          ? "cursor-not-allowed border-white/5 bg-white/5 opacity-40"
                          : selected
                            ? "border-cyan-300 bg-cyan-300/20"
                            : completed
                              ? "border-emerald-400/40 bg-emerald-400/10"
                              : "border-white/10 bg-white/5 hover:-translate-y-1 hover:border-cyan-300"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        Round
                      </p>

                      <p className="mt-2 text-3xl font-black">{round}</p>

                      <p className="mt-2 text-xs text-slate-400">
                        {locked
                          ? "Locked"
                          : completed
                            ? "Completed"
                            : "10 Questions"}
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
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void startChallenge()}
                    disabled={isGenerating}
                    className="rounded-2xl bg-cyan-400 px-8 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating
                      ? "Creating Quiz..."
                      : `Start Round ${selectedRound}`}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {step === "quiz" && activeQuestions.length > 0 && activeDraft && (
          <QuizGame
            key={activeDraft.id}
            draft={activeDraft}
            questions={activeQuestions}
            levelTitle={getLevelTitle(selectedLevel)}
            examTitle={getExamTitle(selectedExam)}
            subject={selectedSubject ?? ""}
            difficulty={getDifficultyForJourneyLevel(selectedJourneyLevel ?? 1)}
            playfulMode={playfulMode}
            onComplete={finishQuiz}
            onRegisterSave={registerQuizSave}
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
  draft,
  questions,
  levelTitle,
  examTitle,
  subject,
  difficulty,
  playfulMode: _playfulMode,
  onComplete,
  onRegisterSave,
}: {
  draft: QuizArenaDraft;
  questions: QuizQuestion[];
  levelTitle: string;
  examTitle: string;
  subject: string;
  difficulty: Difficulty;
  playfulMode: boolean;
  onComplete: (result: QuizResult) => Promise<boolean>;

  onRegisterSave: (save: (() => Promise<boolean>) | null) => void;
}) {
  /*
   * Restore the previous quiz state when
   * the student resumes an unfinished attempt.
   */

  const [questionIndex, setQuestionIndex] = useState(draft.questionIndex);

  const [answersByIndex, setAnswersByIndex] = useState<Record<number, string>>(
    () => ({
      ...draft.answersByIndex,
    }),
  );

  const [timeByIndex, setTimeByIndex] = useState<Record<number, number>>(
    () => ({
      ...draft.timeByIndex,
    }),
  );

  const [markedForReview, setMarkedForReview] = useState<Set<number>>(
    () => new Set(draft.markedForReview),
  );

  const [questionElapsedMs, setQuestionElapsedMs] = useState(
    draft.timeByIndex[draft.questionIndex] ?? 0,
  );

  const [roundElapsedMs, setRoundElapsedMs] = useState(draft.elapsedMs);

  const questionStartedAtRef = useRef(
    Date.now() - (draft.timeByIndex[draft.questionIndex] ?? 0),
  );

  const roundStartedAtRef = useRef(Date.now() - draft.elapsedMs);

  /*
   * MongoDB autosave state.
   */

  const revisionRef = useRef(draft.revision);

  const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));

  const [saveError, setSaveError] = useState<string | null>(null);

  const [finishError, setFinishError] = useState<string | null>(null);

  const [isFinishingQuiz, setIsFinishingQuiz] = useState(false);

  const finishInFlightRef = useRef(false);

  const currentQuestion = questions[questionIndex];

  const selectedAnswer = answersByIndex[questionIndex] ?? null;

  const answered = selectedAnswer !== null;

  const isMarkedForReview = markedForReview.has(questionIndex);
  /*
   * Maintain the latest quiz state for autosaving.
   *
   * React state remains responsible for the interface.
   * MongoDB remains responsible for permanent recovery.
   */

  const latestSnapshotRef = useRef({
    answersByIndex,
    timeByIndex,
    markedForReview: [...markedForReview],
    questionIndex,
  });

  useEffect(() => {
    latestSnapshotRef.current = {
      answersByIndex,
      timeByIndex,
      markedForReview: [...markedForReview],
      questionIndex,
    };
  }, [answersByIndex, timeByIndex, markedForReview, questionIndex]);

  /*
   * Save requests are executed sequentially.
   *
   * This prevents an older request from
   * overwriting a newer answer or question position.
   */

  const queueDraftSave = useCallback((): Promise<boolean> => {
    const operation = saveQueueRef.current
      .catch(() => false)
      .then(async () => {
        const snapshot = latestSnapshotRef.current;

        const now = Date.now();

        const nextRevision = revisionRef.current + 1;

        revisionRef.current = nextRevision;

        const updatedTimeByIndex = {
          ...snapshot.timeByIndex,
        };

        /*
         * Preserve time spent on the current question,
         * including when it has not been answered yet.
         */

        const currentIndex = snapshot.questionIndex;

        if (snapshot.answersByIndex[currentIndex] === undefined) {
          updatedTimeByIndex[currentIndex] = Math.max(
            updatedTimeByIndex[currentIndex] ?? 0,
            now - questionStartedAtRef.current,
          );
        }

        const response = await fetch("/api/quiz-arena/draft", {
          method: "PATCH",

          keepalive: true,

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id: draft.id,

            answersByIndex: snapshot.answersByIndex,

            timeByIndex: updatedTimeByIndex,

            markedForReview: snapshot.markedForReview,

            questionIndex: snapshot.questionIndex,

            elapsedMs: Math.max(0, now - roundStartedAtRef.current),

            revision: nextRevision,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          throw new Error(
            payload?.error ?? "Unable to save your quiz progress.",
          );
        }

        setSaveError(null);

        return true;
      })
      .catch((error) => {
        console.warn("Quiz Arena autosave error:", error);

        setSaveError(
          "Your latest changes could not be saved. Please check your connection.",
        );

        return false;
      });

    saveQueueRef.current = operation;

    return operation;
  }, [draft.id]);
  /*
   * Allow the parent component to request
   * a final save before exiting the quiz.
   */

  useEffect(() => {
    onRegisterSave(queueDraftSave);

    return () => {
      onRegisterSave(null);
    };
  }, [onRegisterSave, queueDraftSave]);

  /*
   * Autosave shortly after an answer,
   * review marking, or question change.
   */

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void queueDraftSave();
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    answersByIndex,
    timeByIndex,
    markedForReview,
    questionIndex,
    queueDraftSave,
  ]);

  /*
   * Periodic autosave also preserves elapsed time
   * when the student is reading a question.
   */

  useEffect(() => {
    const interval = window.setInterval(() => {
      void queueDraftSave();
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [queueDraftSave]);
  /*
   * Request a save when the student leaves
   * the browser tab or switches away.
   */

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        void queueDraftSave();
      }
    }

    function handlePageHide() {
      void queueDraftSave();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [queueDraftSave]);

  useEffect(() => {
    const existingTime = timeByIndex[questionIndex] ?? 0;

    questionStartedAtRef.current = Date.now() - existingTime;

    setQuestionElapsedMs(existingTime);

    // Time is reset only when navigating to another question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      const now = Date.now();

      setRoundElapsedMs(now - roundStartedAtRef.current);

      if (!answered) {
        setQuestionElapsedMs(now - questionStartedAtRef.current);
      }
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, [answered, questionIndex]);

  function chooseAnswer(answer: string) {
    if (!answered) {
      const answeredAt = Date.now();

      const timeTakenMs = answeredAt - questionStartedAtRef.current;

      setQuestionElapsedMs(timeTakenMs);

      setTimeByIndex((previous) => ({
        ...previous,
        [questionIndex]: timeTakenMs,
      }));
    }

    // Save the selected answer.
    setAnswersByIndex((previous) => ({
      ...previous,
      [questionIndex]: answer,
    }));

    // Automatically remove Mark for Review once answered.
    setMarkedForReview((previous) => {
      if (!previous.has(questionIndex)) {
        return previous;
      }

      const next = new Set(previous);
      next.delete(questionIndex);

      return next;
    });
  }

  function toggleMarkForReview() {
    const alreadyMarked = markedForReview.has(questionIndex);

    setMarkedForReview((previous) => {
      const next = new Set(previous);

      if (alreadyMarked) {
        next.delete(questionIndex);
      } else {
        next.add(questionIndex);
      }

      return next;
    });

    /*
     * When marking a question for review,
     * preserve its time and automatically
     * move to the next question.
     */

    if (!alreadyMarked && questionIndex < questions.length - 1) {
      if (!answered) {
        const elapsed = Math.max(0, Date.now() - questionStartedAtRef.current);

        setTimeByIndex((previous) => ({
          ...previous,
          [questionIndex]: elapsed,
        }));
      }

      setQuestionIndex((previous) => previous + 1);
    }
  }
  function goToQuestion(index: number) {
    if (
      index === questionIndex ||
      index < 0 ||
      index >= questions.length ||
      isFinishingQuiz
    ) {
      return;
    }

    // Preserve time spent on the current question.
    if (!answered) {
      const elapsed = Math.max(0, Date.now() - questionStartedAtRef.current);

      setTimeByIndex((previous) => ({
        ...previous,
        [questionIndex]: elapsed,
      }));
    }

    // Open the selected question.
    setQuestionIndex(index);
  }
  function previousQuestion() {
    if (questionIndex === 0) {
      return;
    }

    if (!answered) {
      const elapsed = Math.max(0, Date.now() - questionStartedAtRef.current);

      setTimeByIndex((previous) => ({
        ...previous,
        [questionIndex]: elapsed,
      }));
    }

    setQuestionIndex((previous) => previous - 1);
  }

  async function nextQuestion() {
    if (finishInFlightRef.current) {
      return;
    }
    if (!answered && !isMarkedForReview) {
      return;
    }

    const finished = questionIndex === questions.length - 1;

    if (!finished) {
      if (!answered) {
        const elapsed = Math.max(0, Date.now() - questionStartedAtRef.current);

        setTimeByIndex((previous) => ({
          ...previous,
          [questionIndex]: elapsed,
        }));
      }

      setQuestionIndex((previous) => previous + 1);

      return;
    }

    const attempts: QuestionAttempt[] = questions.map((question, index) => {
      const answer = answersByIndex[index] ?? "";

      return {
        questionId: question.id,

        question: question.question,

        options: question.options,

        selectedAnswer: answer,

        correctAnswer: question.correctAnswer,

        isCorrect: answer === question.correctAnswer,

        explanation: question.explanation,

        timeTakenMs: timeByIndex[index] ?? 0,
      };
    });

    const correctAnswers = attempts.filter(
      (attempt) => attempt.isCorrect,
    ).length;

    const incorrectAnswers = attempts.length - correctAnswers;

    let score = 0;
    let currentStreak = 0;
    let bestStreak = 0;

    for (const attempt of attempts) {
      if (attempt.isCorrect) {
        currentStreak += 1;

        const bonus = currentStreak % 3 === 0 ? 5 : 0;

        score += 10 + bonus;

        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const finishedAt = Date.now();

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

    finishInFlightRef.current = true;

    setIsFinishingQuiz(true);

    setFinishError(null);

    try {
      const completed = await onComplete({
        score,
        correctAnswers,
        incorrectAnswers,
        bestStreak,
        attemptedQuestions: attempts.length,
        totalTimeMs,
        averageQuestionTimeMs,
        attempts,
      });

      if (!completed) {
        setFinishError(
          "We could not finalise your round. Your quiz is still open. Please check your connection and try Finish Round again.",
        );
      }
    } catch (error) {
      console.warn("Quiz completion error:", error);

      setFinishError("Unable to complete your round. Please try again.");
    } finally {
      finishInFlightRef.current = false;

      setIsFinishingQuiz(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      {saveError && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-4 text-sm font-semibold text-amber-100"
        >
          ⚠️ {saveError}
        </div>
      )}

      {finishError && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-red-400/40 bg-red-400/10 px-5 py-4 text-sm font-semibold text-red-100"
        >
          ⚠️ {finishError}
        </div>
      )}

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
            {markedForReview.size > 0 && (
              <span className="rounded-full bg-amber-400/20 px-4 py-2 text-amber-100">
                Marked: {markedForReview.size}
              </span>
            )}

            <span className="rounded-full bg-violet-400/20 px-4 py-2 text-violet-100">
              Question Time: {formatLiveQuizDuration(questionElapsedMs)}
            </span>

            <span className="rounded-full bg-amber-400/20 px-4 py-2 text-amber-100">
              Round Time: {formatLiveQuizDuration(roundElapsedMs)}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-10 gap-2">
          {questions.map((question, index) => {
            const isCurrent = index === questionIndex;

            const isAnswered = Boolean(answersByIndex[index]);

            const isMarked = markedForReview.has(index);

            return (
              <button
                key={question.id ?? index}
                type="button"
                onClick={() => goToQuestion(index)}
                disabled={isFinishingQuiz}
                aria-label={`Go to question ${index + 1}${
                  isMarked
                    ? ", marked for review"
                    : isAnswered
                      ? ", answered"
                      : ""
                }`}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex h-10 items-center justify-center rounded-xl border text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed ${
                  isMarked
                    ? "border-orange-400 bg-orange-500 text-white"
                    : isAnswered
                      ? "border-emerald-400 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-cyan-300"
                } ${
                  isCurrent
                    ? "ring-2 ring-white ring-offset-2 ring-offset-indigo-950"
                    : ""
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
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
                aria-pressed={selected}
                className={`rounded-2xl border p-5 text-left text-lg font-semibold transition ${
                  selected
                    ? "border-cyan-300 bg-cyan-300/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300 hover:bg-white/10"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={previousQuestion}
              disabled={questionIndex === 0}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-white transition hover:border-cyan-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Previous Question
            </button>

            <button
              type="button"
              onClick={toggleMarkForReview}
              className={`rounded-xl border px-5 py-3 font-bold transition ${
                isMarkedForReview
                  ? "border-amber-300 bg-amber-300/20 text-amber-100"
                  : "border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20"
              }`}
            >
              {isMarkedForReview ? "Marked for Review" : "Mark for Review"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => void nextQuestion()}
            disabled={isFinishingQuiz || (!answered && !isMarkedForReview)}
            className="rounded-xl bg-cyan-400 px-7 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cyan-400"
          >
            {isFinishingQuiz
              ? "Saving Round..."
              : questionIndex === questions.length - 1
                ? "Finish Round"
                : "Next Question"}
          </button>
        </div>
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
