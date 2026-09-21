import type { CompetitiveExam, QuizBoard, QuizSchoolClass } from "@/lib/quiz-arena-config";
import catalog from "@/data/quiz-syllabus-2026-27.json";

type CurriculumRow = {
  board: QuizBoard;
  schoolClass: QuizSchoolClass;
  exam: CompetitiveExam;
  subject: string;
  units: string[];
  sourceUrl: string;
  verification: "official-pdf-checked" | "editorial-outline-needs-review";
};

export function getQuizBoardSyllabus(
  exam: CompetitiveExam,
  schoolClass: QuizSchoolClass,
  board: QuizBoard,
  subject: string,
): (CurriculumRow & { academicYear: string }) | null {
  const row = (catalog.entries as CurriculumRow[]).find(
    (item) => item.exam === exam && item.schoolClass === schoolClass &&
      item.board === board && item.subject === subject &&
      item.units.length > 0 && item.units.every((topic) => topic.trim().length > 0),
  );
  return row ? { ...row, academicYear: catalog.academicYear } : null;
}
