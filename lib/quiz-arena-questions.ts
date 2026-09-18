import type {
  CompetitiveExam,
  Difficulty,
  EducationLevel,
  QuizJourneyLevel,
  QuizRound,
  Stream,
} from "./quiz-arena-config";

export type QuizQuestion = {
  id: string;

  level: EducationLevel;

  stream?: Stream;

  exam?: CompetitiveExam;

  subject: string;

  difficulty: Difficulty;

  /*
   * Quiz Arena progression metadata.
   *
   * Optional temporarily so the current generator
   * continues working until Step 2 is applied.
   */
  progressionLevel?: QuizJourneyLevel;

  round?: QuizRound;

  question: string;

  options: string[];

  correctAnswer: string;

  explanation: string;
};
