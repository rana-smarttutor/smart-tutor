/**
 * Course-page examination facts. Update only from official notices.
 * Leave missing fields undefined; the UI will not invent them.
 * The generic 132-exam supplemental syllabus remains PROVISIONAL.
 */
export type ExamPatternRow = {
  stage: string;
  subject: string;
  questions?: number;
  marks?: number;
  duration?: string;
  notes?: string;
};

export type ExamGuideFacts = {
  cycle: string;
  examDate?: string;
  dateNote?: string;
  totalMarks?: number;
  totalQuestions?: number;
  duration?: string;
  mode?: string;
  marking?: string;
  stages: string[];
  pattern: ExamPatternRow[];
  officialUrl?: string;
  sourceLabel?: string;
  sourceReviewed?: boolean;
};

export const examGuideFacts: Record<string, ExamGuideFacts> = {
  "jee-main": {
    cycle: "2027",
    dateNote:
      "Dates are subject to NTA updates; individual shift and centre appear on the admit card.",
    totalMarks: 300,
    totalQuestions: 75,
    duration: "3 hours",
    mode: "Computer-based test (Paper 1: B.E./B.Tech.)",
    marking:
      "+4 correct, −1 incorrect, 0 unanswered (MCQ and numerical sections).",
    stages: [
      "Read the NTA 2027 information bulletin and check eligibility for your intended programme.",
      "Register and submit the online application during the official application window.",
      "Download the examination-city information and admit card when released.",
      "Appear for Paper 1 at the allotted shift and exam centre.",
      "Review the provisional answer key and challenge window, if applicable.",
      "Check the scorecard and participate in the applicable admission counselling process.",
    ],
    pattern: [
      {
        stage: "Paper 1",
        subject: "Mathematics",
        questions: 25,
        marks: 100,
        notes: "20 MCQs + 5 numerical-answer questions",
      },
      {
        stage: "Paper 1",
        subject: "Physics",
        questions: 25,
        marks: 100,
        notes: "20 MCQs + 5 numerical-answer questions",
      },
      {
        stage: "Paper 1",
        subject: "Chemistry",
        questions: 25,
        marks: 100,
        notes: "20 MCQs + 5 numerical-answer questions",
      },
    ],
    officialUrl: "https://jeemain.nta.nic.in/documents/",
    sourceLabel: "NTA JEE Main 2027 information bulletin and syllabus",
  },
};

export const defaultExamStages = [
  "Review the examination authority’s latest notification and eligibility criteria.",
  "Confirm the applicable exam cycle, application dates, fees and required documents.",
  "Complete the official application and retain the registration confirmation.",
  "Download the admit card and verify centre, reporting time and instructions.",
  "Appear for each required written, computer-based, practical or interview stage.",
  "Check official answer keys, results, cut-offs and further selection notices.",
  "Complete document verification, counselling or final admission as applicable.",
];
