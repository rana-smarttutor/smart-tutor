"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  difficultyOptions,
  getExamDetails,
  getExamTitle,
  getExamsByCategory,
  getLevelTitle,
  levelOptions,
  type CompetitiveExam,
  type Difficulty,
  type EducationLevel,
} from "@/lib/quiz-arena-config";
import type { QuizQuestion } from "@/lib/quiz-arena-questions";

type Step =
  | "welcome"
  | "level"
  | "exam"
  | "subject"
  | "difficulty"
  | "quiz"
  | "result";

type QuizResult = {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  bestStreak: number;
  attemptedQuestions: number;
  gameOver: boolean;
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
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);

  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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
    setSelectedDifficulty(null);
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
    setSelectedDifficulty(null);
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
      setSelectedDifficulty(null);
      setStep("level");
      return;
    }

    if (step === "subject") {
      setSelectedSubject(null);
      setSelectedDifficulty(null);
      setStep("exam");
      return;
    }

    if (step === "difficulty") {
      setSelectedDifficulty(null);
      setStep("subject");
      return;
    }

    if (step === "result") {
      setResult(null);
      setActiveQuestions([]);
      setStep("difficulty");
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
    setStep("difficulty");
  }

  async function startChallenge() {
    if (!selectedLevel || !selectedExam || !selectedSubject || !selectedDifficulty) {
      setMessage("Please complete your quiz selection first.");
      return;
    }

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
          difficulty: selectedDifficulty,
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

  function finishQuiz(finalResult: QuizResult) {
    setResult(finalResult);
    setShowExitModal(false);
    setStep("result");
  }

  function playAgain() {
    setResult(null);
    setMessage("");
    void startChallenge();
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
                Smart Tutor
              </p>

              <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
                Quiz Arena
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
                Fresh AI-powered quizzes for school, junior college,
                competitive exams, government exams and MBA entrance
                preparation.
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
                      setSelectedDifficulty(null);
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
                    setSelectedDifficulty(null);
                    setMessage("");
                    setStep("difficulty");
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

        {step === "difficulty" && (
          <section>
            <Header
              title="Choose your challenge"
              subtitle={`${selectedSubject ?? ""} • AI will create a fresh quiz for this attempt.`}
            />

            <div className="grid gap-6 md:grid-cols-3">
              {difficultyOptions.map((difficulty) => (
                <button
                  type="button"
                  key={difficulty.id}
                  onClick={() => {
                    setSelectedDifficulty(difficulty.id);
                    setMessage("");
                  }}
                  className={`rounded-3xl border p-8 text-left transition ${
                    selectedDifficulty === difficulty.id
                      ? "border-cyan-300 bg-cyan-300/20 shadow-lg shadow-cyan-400/10"
                      : "border-white/10 bg-white/10 hover:-translate-y-1 hover:border-cyan-300"
                  }`}
                >
                  <span className="text-4xl">{difficulty.icon}</span>

                  <h2 className="mt-5 text-3xl font-bold">
                    {difficulty.title}
                  </h2>

                  <p className="mt-4 font-semibold text-cyan-300">
                    {difficulty.questions} fresh questions
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {difficulty.description}
                  </p>
                </button>
              ))}
            </div>

            {message && (
              <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-center text-sm text-red-100">
                {message}
              </div>
            )}

            {selectedDifficulty && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => void startChallenge()}
                  disabled={isGenerating}
                  className="rounded-2xl bg-cyan-400 px-12 py-4 text-lg font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating
                    ? "Creating Your Quiz..."
                    : "Start Challenge"}
                </button>

                {isGenerating && (
                  <p className="mt-4 text-sm text-slate-300">
                    AI is preparing fresh questions for your selected course.
                  </p>
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
            difficulty={selectedDifficulty ?? "easy"}
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
            totalQuestions={activeQuestions.length}
            playfulMode={playfulMode}
            isGenerating={isGenerating}
            onPlayAgain={playAgain}
            onChangeLevel={changeLevel}
          />
        )}
      </div>
    </main>
  );
}

function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-10 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
        Smart Tutor Quiz Arena
      </p>

      <h1 className="text-3xl font-bold sm:text-5xl">{title}</h1>

      <p className="mx-auto mt-4 max-w-2xl text-slate-300">{subtitle}</p>
    </header>
  );
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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);

  const currentQuestion = questions[questionIndex];
  const progress = ((questionIndex + 1) / questions.length) * 100;
  const answered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  function chooseAnswer(answer: string) {
    if (answered) {
      return;
    }

    setSelectedAnswer(answer);

    if (answer === currentQuestion.correctAnswer) {
      const nextStreak = streak + 1;
      const bonus = nextStreak > 0 && nextStreak % 3 === 0 ? 5 : 0;

      setScore((previousScore) => previousScore + 10 + bonus);
      setStreak(nextStreak);
      setBestStreak((previousBest) => Math.max(previousBest, nextStreak));
      setCorrectAnswers((previous) => previous + 1);
      return;
    }

    if (!playfulMode) {
      setHearts((previous) => Math.max(previous - 1, 0));
    }

    setStreak(0);
    setIncorrectAnswers((previous) => previous + 1);
  }

  function nextQuestion() {
    const finished = questionIndex === questions.length - 1;
    const gameOver = !playfulMode && hearts <= 0;

    if (finished || gameOver) {
      onComplete({
        score,
        correctAnswers,
        incorrectAnswers,
        bestStreak,
        attemptedQuestions: correctAnswers + incorrectAnswers,
        gameOver,
      });
      return;
    }

    setSelectedAnswer(null);
    setQuestionIndex((previous) => previous + 1);
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300">
              {levelTitle}
              {examTitle ? ` • ${examTitle}` : ""} • {subject} •{" "}
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

            {!playfulMode && (
              <>
                <span className="rounded-full bg-orange-400/20 px-4 py-2 text-orange-200">
                  🔥 {streak}
                </span>

                <span className="rounded-full bg-red-400/20 px-4 py-2 text-red-100">
                  {hearts > 0 ? "❤️".repeat(hearts) : "No Lives Left"}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Choose the correct answer
        </p>

        <h2 className="mt-5 text-2xl font-bold leading-relaxed sm:text-3xl">
          {currentQuestion.question}
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {currentQuestion.options.map((option) => {
            const selected = selectedAnswer === option;
            const correctOption =
              answered && option === currentQuestion.correctAnswer;
            const wrongOption = answered && selected && !isCorrect;

            return (
              <button
                type="button"
                key={option}
                onClick={() => chooseAnswer(option)}
                disabled={answered}
                className={`rounded-2xl border p-5 text-left text-lg font-semibold transition ${
                  correctOption
                    ? "border-green-400 bg-green-400/20 text-green-100"
                    : wrongOption
                      ? "border-red-400 bg-red-400/20 text-red-100"
                      : "border-white/10 bg-white/5 hover:border-cyan-300 hover:bg-white/10"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`mt-8 rounded-2xl border p-5 ${
              isCorrect
                ? "border-green-400/30 bg-green-400/10"
                : "border-red-400/30 bg-red-400/10"
            }`}
          >
            <h3 className="text-lg font-bold">
              {isCorrect
                ? playfulMode
                  ? "Amazing! You earned a star ⭐"
                  : "Correct! Great job."
                : playfulMode
                  ? "Great try! Let's learn this together."
                  : "Incorrect answer."}
            </h3>

            {!isCorrect && (
              <p className="mt-2 text-sm font-semibold text-slate-100">
                Correct answer: {currentQuestion.correctAnswer}
              </p>
            )}

            <p className="mt-2 text-sm text-slate-200">
              {currentQuestion.explanation}
            </p>

            <button
              type="button"
              onClick={nextQuestion}
              className="mt-5 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              {questionIndex === questions.length - 1 ||
              (!playfulMode && hearts <= 0)
                ? "View Result"
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
  totalQuestions,
  playfulMode,
  isGenerating,
  onPlayAgain,
  onChangeLevel,
}: {
  result: QuizResult;
  levelTitle: string;
  examTitle: string;
  subject: string;
  totalQuestions: number;
  playfulMode: boolean;
  isGenerating: boolean;
  onPlayAgain: () => void;
  onChangeLevel: () => void;
}) {
  const accuracy =
    result.attemptedQuestions === 0
      ? 0
      : Math.round((result.correctAnswers / result.attemptedQuestions) * 100);

  function getPerformanceMessage() {
    if (result.gameOver) {
      return "Game Over. Try again and improve your score.";
    }

    if (accuracy >= 90) {
      return playfulMode
        ? "Superstar! You did an amazing job! 🌟"
        : "Outstanding! You are a Quiz Champion.";
    }

    if (accuracy >= 70) {
      return "Great job! Keep pushing.";
    }

    if (accuracy >= 50) {
      return "Good attempt. Practice more to level up.";
    }

    return "Keep learning. You can do better next time.";
  }

  return (
    <section className="mx-auto max-w-4xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
        Results
      </p>

      <h1 className="mt-4 text-4xl font-black sm:text-6xl">
        {result.gameOver ? "Game Over" : "Challenge Completed!"}
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
        {getPerformanceMessage()}
      </p>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/10 p-8">
        <div className="mb-8">
          <p className="text-sm text-slate-300">
            {levelTitle}
            {examTitle ? ` • ${examTitle}` : ""} • {subject}
          </p>

          <p className="mt-3 text-6xl font-black text-cyan-300">
            {result.score}
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {playfulMode ? "Stars Score" : "Final Score"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-5">
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
            title="Best Streak"
            value={String(result.bestStreak)}
            icon="🔥"
          />

          <ResultCard
            title="Attempted"
            value={`${result.attemptedQuestions}/${totalQuestions}`}
            icon="📝"
          />
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onPlayAgain}
          disabled={isGenerating}
          className="rounded-2xl bg-cyan-400 px-8 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Creating New Quiz..." : "Play Again"}
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
          className="rounded-2xl border border-white/20 px-8 py-4 font-bold text-white transition hover:bg-white/10"
        >
          Go to Dashboard
        </Link>
      </div>

      <p className="mt-6 text-sm text-slate-400">
        Play Again creates a new set of questions for the same selection.
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