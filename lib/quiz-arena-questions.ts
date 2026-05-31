import type {
  CompetitiveExam,
  Difficulty,
  EducationLevel,
  Stream,
} from './quiz-arena-config';

export type QuizQuestion = {
  id: string;
  level: EducationLevel;
  stream?: Stream;
  exam?: CompetitiveExam;
  subject: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};