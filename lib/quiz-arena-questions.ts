import type {
  CompetitiveExam,
  Difficulty,
  EducationLevel,
  QuizJourneyLevel,
  QuizRound,
  Stream,
} from "./quiz-arena-config";

export type QuizVisualType =
  | "bar-chart"
  | "line-chart"
  | "pie-chart"
  | "table"
  | "mixed-chart";

export type QuizVisualSeries = {
  name: string;
  values: number[];
};

export type QuizQuestionVisual = {
  type: QuizVisualType;

  title: string;

  xLabel?: string;
  yLabel?: string;

  /*
   * Category labels.
   *
   * Examples:
   * ["2022", "2023", "2024", "2025"]
   * ["Company A", "Company B", "Company C"]
   */
  labels: string[];

  /*
   * One or more numerical series.
   *
   * Example:
   *
   * {
   *   name: "Sales",
   *   values: [120, 145, 180, 210]
   * }
   */
  series: QuizVisualSeries[];
};

export type QuizQuestion = {
  id: string;

  level: EducationLevel;

  stream?: Stream;

  exam?: CompetitiveExam;

  subject: string;

  topicId?: string | null;

  difficulty: Difficulty;

  /*
   * Quiz Arena progression metadata.
   */
  progressionLevel?: QuizJourneyLevel;

  round?: QuizRound;

  question: string;

  /*
   * Optional visual used by DILR / DI / chart-based questions.
   *
   * The chart is rendered by SmartIQ from structured data.
   * It is not an externally hosted image.
   */
  visual?: QuizQuestionVisual;

  syllabusUnit?: string;

  syllabusAcademicYear?: string;

  syllabusVerification?:
    | "official-pdf-checked"
    | "editorial-outline-needs-review";

  options: string[];

  correctAnswer: string;

  explanation: string;
};