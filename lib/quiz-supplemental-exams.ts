import type { CompetitiveExam } from "@/lib/quiz-arena-config";
import data from "@/data/quiz-exam-syllabus-supplement-2026.json";

type SupplementalRow = {
  exam: string;
  title: string;
  category: string;
  sourceUrl: string;
  subjects: { subject: string; topics: string[] }[];
};

const rows = data.entries as SupplementalRow[];

function findRow(exam: CompetitiveExam | null, category: string) {
  if (!exam) return null;
  return rows.find((r) => r.exam === exam && r.category === category) ?? null;
}

function slug(title: string, index: number): string {
  const text = title.normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `topic-${index + 1}-${text || "localized"}`;
}

function makeSubjects(row: SupplementalRow) {
  return row.subjects.map((s) => ({
    subject: s.subject,
    topics: s.topics.map((title, i) => ({ id: slug(title, i), title })),
  }));
}

export function getSupplementalGovernmentExamSyllabus(exam: CompetitiveExam | null) {
  const row = findRow(exam, "government-exam");
  return row && exam ? {
    exam, title: row.title, syllabusYear: 2026,
    sourceUrl: row.sourceUrl, subjects: makeSubjects(row),
  } : null;
}

export function getSupplementalCompetitiveExamSyllabus(exam: CompetitiveExam | null) {
  const row = findRow(exam, "competitive-exam");
  return row && exam ? {
    exam, title: row.title, catalogVersion: data.catalogVersion,
    verification: "editorial-outline-needs-review" as const,
    subjects: makeSubjects(row),
  } : null;
}

export function getSupplementalMbaExamSyllabus(exam: CompetitiveExam | null) {
  const row = findRow(exam, "mba-entrance");
  return row && exam ? {
    exam, title: row.title, catalogVersion: data.catalogVersion,
    verification: "editorial-outline-needs-review",
    subjects: makeSubjects(row),
  } : null;
}