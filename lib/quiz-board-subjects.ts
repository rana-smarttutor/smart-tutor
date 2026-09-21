import type {
  CompetitiveExam,
  QuizBoard,
  QuizSchoolClass,
} from "@/lib/quiz-arena-config";

/**
 * Supported core and commonly offered elective subjects, English-medium
 * labels. A school's actual offered language/elective combination can vary.
 * Subject availability is not proof of topic-level syllabus coverage.
 * Refresh this catalog when the official board publishes revisions.
 * CBSE 2026-27: https://cbseacademic.nic.in/curriculum_2027.html
 * Maharashtra textbooks: https://ebooks.ebalbharati.in/
 */
const subjects: Record<
  QuizBoard,
  Partial<Record<QuizSchoolClass, Partial<Record<CompetitiveExam, readonly string[]>>>>
> = {
  "Maharashtra State Board": {
    "9": {
      "class-9-10": [
        "Mathematics", "Science and Technology",
        "History and Political Science", "Geography",
        "English", "Marathi", "Hindi",
      ],
    },
    "10": {
      "class-9-10": [
        "Mathematics Part 1", "Mathematics Part 2",
        "Science and Technology Part 1", "Science and Technology Part 2",
        "History and Political Science", "Geography",
        "English", "Marathi", "Hindi",
      ],
    },
    "11": {
      "class-11-12-science": [
        "English", "Physics", "Chemistry", "Mathematics and Statistics",
        "Biology", "Information Technology", "Computer Science",
        "Marathi", "Hindi",
      ],
      "class-11-12-commerce": [
        "English", "Book-Keeping and Accountancy",
        "Organisation of Commerce and Management", "Economics",
        "Mathematics and Statistics", "Secretarial Practice",
        "Information Technology", "Marathi", "Hindi",
      ],
      "class-11-12-arts": [
        "English", "History", "Political Science", "Geography",
        "Economics", "Sociology", "Psychology", "Marathi", "Hindi",
      ],
    },
    "12": {
      "class-11-12-science": [
        "English", "Physics", "Chemistry", "Mathematics and Statistics",
        "Biology", "Information Technology", "Computer Science",
        "Marathi", "Hindi",
      ],
      "class-11-12-commerce": [
        "English", "Book-Keeping and Accountancy",
        "Organisation of Commerce and Management", "Economics",
        "Mathematics and Statistics", "Secretarial Practice",
        "Information Technology", "Marathi", "Hindi",
      ],
      "class-11-12-arts": [
        "English", "History", "Political Science", "Geography",
        "Economics", "Sociology", "Psychology", "Marathi", "Hindi",
      ],
    },
  },
  CBSE: {
    "9": {
      "class-9-10": [
        "Mathematics", "Science", "Social Science", "English",
        "Hindi", "Marathi", "Sanskrit", "Computer Applications",
        "Artificial Intelligence",
      ],
    },
    "10": {
      "class-9-10": [
        "Mathematics", "Science", "Social Science", "English",
        "Hindi", "Marathi", "Sanskrit", "Computer Applications",
        "Artificial Intelligence",
      ],
    },
    "11": {
      "class-11-12-science": [
        "English Core", "Physics", "Chemistry", "Mathematics", "Biology",
        "Computer Science", "Informatics Practices", "Physical Education",
      ],
      "class-11-12-commerce": [
        "English Core", "Accountancy", "Business Studies", "Economics",
        "Mathematics", "Applied Mathematics", "Entrepreneurship",
        "Informatics Practices", "Physical Education",
      ],
      "class-11-12-arts": [
        "English Core", "History", "Political Science", "Geography",
        "Economics", "Sociology", "Psychology", "Legal Studies",
        "Physical Education",
      ],
    },
    "12": {
      "class-11-12-science": [
        "English Core", "Physics", "Chemistry", "Mathematics", "Biology",
        "Computer Science", "Informatics Practices", "Physical Education",
      ],
      "class-11-12-commerce": [
        "English Core", "Accountancy", "Business Studies", "Economics",
        "Mathematics", "Applied Mathematics", "Entrepreneurship",
        "Informatics Practices", "Physical Education",
      ],
      "class-11-12-arts": [
        "English Core", "History", "Political Science", "Geography",
        "Economics", "Sociology", "Psychology", "Legal Studies",
        "Physical Education",
      ],
    },
  },
};

export function getBoardSubjects(
  exam: CompetitiveExam | null,
  schoolClass: QuizSchoolClass | null,
  board: QuizBoard | null,
): string[] {
  if (!exam || !schoolClass || !board) return [];
  return [...(subjects[board]?.[schoolClass]?.[exam] ?? [])];
}
