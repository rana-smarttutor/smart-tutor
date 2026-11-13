import type {
  CompetitiveExam,
  QuizBoard,
  QuizSchoolClass,
} from "@/lib/quiz-arena-config";

import catalog from "@/data/quiz-syllabus-2026-27.json";

export type CurriculumRow = {
  board: QuizBoard;
  schoolClass: QuizSchoolClass;
  exam: CompetitiveExam;
  subject: string;
  units: string[];
  sourceUrl: string;
  verification: "official-pdf-checked" | "editorial-outline-needs-review";
};

export type QuizBoardTopic = {
  id: string;
  title: string;
};

const curriculum = catalog.entries as CurriculumRow[];

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getQuizBoardSyllabus(
  exam: CompetitiveExam,
  schoolClass: QuizSchoolClass,
  board: QuizBoard,
  subject: string,
): (CurriculumRow & { academicYear: string }) | null {
  const row = curriculum.find(
    (item) =>
      item.exam === exam &&
      item.schoolClass === schoolClass &&
      item.board === board &&
      item.subject === subject &&
      item.units.length > 0 &&
      item.units.every(
        (topic) => typeof topic === "string" && topic.trim().length > 0,
      ),
  );

  return row ? { ...row, academicYear: catalog.academicYear } : null;
}

export function getQuizBoardSubjects(
  exam: CompetitiveExam,
  schoolClass: QuizSchoolClass,
  board: QuizBoard,
): string[] {
  return [
    ...new Set(
      curriculum
        .filter(
          (item) =>
            item.exam === exam &&
            item.schoolClass === schoolClass &&
            item.board === board &&
            item.units.length > 0,
        )
        .map((item) => item.subject),
    ),
  ];
}

export function getQuizBoardTopics(
  exam: CompetitiveExam,
  schoolClass: QuizSchoolClass,
  board: QuizBoard,
  subject: string,
): QuizBoardTopic[] {
  const syllabus = getQuizBoardSyllabus(exam, schoolClass, board, subject);

  if (!syllabus) {
    return [];
  }

  return syllabus.units.map((title, index) => ({
    id: `topic-${index + 1}-${slugify(title)}`,
    title,
  }));
}

export function isValidQuizBoardTopic(
  exam: CompetitiveExam,
  schoolClass: QuizSchoolClass,
  board: QuizBoard,
  subject: string,
  topicId: string,
): boolean {
  return getQuizBoardTopics(exam, schoolClass, board, subject).some(
    (topic) => topic.id === topicId,
  );
}
