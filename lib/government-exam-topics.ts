import type {
  CompetitiveExam,
} from "@/lib/quiz-arena-config";

export type GovernmentExamTopic = {
  id: string;
  title: string;
};

export type GovernmentExamSubject = {
  subject: string;
  topics: GovernmentExamTopic[];
};

export type GovernmentExamSyllabus = {
  exam: CompetitiveExam;
  title: string;
  syllabusYear: number;
  sourceUrl: string;
  subjects: GovernmentExamSubject[];
};

/*
 * SmartIQ Institute
 *
 * Government Examination Topic Catalog
 *
 * Every examination has its own
 * subject and topic configuration.
 *
 * No generic subject fallback.
 * No shared question-bank mappings.
 */

function makeTopics(
  names: string[],
): GovernmentExamTopic[] {
  return names.map((title) => ({
    id: title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),

    title,
  }));
}

export const governmentExamSyllabuses: Partial<
  Record<CompetitiveExam, GovernmentExamSyllabus>
> = {
  "ssc-cgl": {
    exam: "ssc-cgl",

    title: "SSC CGL",

    syllabusYear: 2026,

    sourceUrl:
      "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf",

    subjects: [
      {
        subject: "Quantitative Aptitude",

        topics: makeTopics([
          "Number System",
          "Whole Numbers",
          "Decimals and Fractions",
          "Simplification",
          "Percentage",
          "Ratio and Proportion",
          "Square Roots",
          "Average",
          "Simple Interest",
          "Compound Interest",
          "Profit and Loss",
          "Discount",
          "Partnership",
          "Mixture and Alligation",
          "Time and Distance",
          "Time and Work",
          "Algebraic Identities",
          "Surds",
          "Linear Equations",
          "Geometry - Triangles",
          "Geometry - Circles",
          "Geometry - Quadrilaterals",
          "Geometry - Polygons",
          "Mensuration - Two Dimensional",
          "Mensuration - Three Dimensional",
          "Trigonometric Ratios",
          "Trigonometric Identities",
          "Heights and Distances",
          "Data Interpretation - Tables",
          "Data Interpretation - Bar Graphs",
          "Data Interpretation - Pie Charts",
          "Data Interpretation - Histograms",
          "Data Interpretation - Frequency Polygons",
          "Statistics - Mean Median and Mode",
          "Statistics - Standard Deviation",
          "Basic Probability",
        ]),
      },

      {
        subject: "General Intelligence and Reasoning",

        topics: makeTopics([
          "Semantic Analogy",
          "Number Analogy",
          "Figural Analogy",
          "Semantic Classification",
          "Number Classification",
          "Figural Classification",
          "Semantic Series",
          "Number Series",
          "Figural Series",
          "Coding and Decoding",
          "Word Building",
          "Numerical Operations",
          "Symbolic Operations",
          "Venn Diagrams",
          "Drawing Inferences",
          "Problem Solving",
          "Critical Thinking",
          "Space Orientation",
          "Space Visualization",
          "Embedded Figures",
          "Figure Completion",
          "Pattern Folding and Unfolding",
          "Punched Hole Patterns",
          "Relationship Concepts",
          "Decision Making",
          "Visual Memory",
          "Observation and Discrimination",
          "Statement and Conclusion",
          "Syllogistic Reasoning",
          "Emotional Intelligence",
          "Social Intelligence",
        ]),
      },

      {
        subject: "English Language",

        topics: makeTopics([
          "Vocabulary",
          "Synonyms",
          "Antonyms",
          "Homonyms",
          "One Word Substitution",
          "Idioms and Phrases",
          "Spelling Correction",
          "Spotting Errors",
          "Fill in the Blanks",
          "Sentence Improvement",
          "Grammar",
          "Sentence Structure",
          "Active and Passive Voice",
          "Direct and Indirect Speech",
          "Sentence Rearrangement",
          "Para Jumbles",
          "Cloze Test",
          "Reading Comprehension",
        ]),
      },

      {
        subject: "General Awareness",

        topics: makeTopics([
          "Indian History - Ancient",
          "Indian History - Medieval",
          "Indian History - Modern",
          "Indian National Movement",
          "Indian Art and Culture",
          "Indian Geography",
          "World Geography",
          "Physical Geography",
          "Indian Constitution",
          "Indian Polity",
          "Governance",
          "Indian Economy",
          "Economic Development",
          "General Physics",
          "General Chemistry",
          "General Biology",
          "Scientific Research",
          "Environmental Awareness",
          "Current Affairs - National",
          "Current Affairs - International",
          "Government Schemes",
          "Static General Knowledge",
        ]),
      },

      {
        subject: "Computer Knowledge",

        topics: makeTopics([
          "Computer Fundamentals",
          "Computer Organisation",
          "Central Processing Unit",
          "Input and Output Devices",
          "Computer Memory",
          "Storage and Backup Devices",
          "Computer Ports",
          "Operating Systems",
          "Windows Explorer",
          "Keyboard Shortcuts",
          "Microsoft Word",
          "Microsoft Excel",
          "Microsoft PowerPoint",
          "Internet Fundamentals",
          "Web Browsing and Searching",
          "Email",
          "Downloading and Uploading",
          "Electronic Banking",
          "Computer Networking",
          "Networking Devices",
          "Networking Protocols",
          "Cyber Security",
          "Computer Viruses and Malware",
          "Information Security",
        ]),
      },

      {
        subject: "Statistics",

        topics: makeTopics([
          "Collection of Statistical Data",
          "Classification and Presentation of Data",
          "Frequency Distribution",
          "Measures of Central Tendency",
          "Measures of Dispersion",
          "Moments",
          "Skewness",
          "Kurtosis",
          "Correlation",
          "Regression",
          "Probability Theory",
          "Random Variables",
          "Probability Distributions",
          "Sampling Theory",
          "Statistical Inference",
          "Hypothesis Testing",
          "Analysis of Variance",
          "Time Series",
          "Index Numbers",
        ]),
      },
    ],
  },
};

/*
 * Get the complete topic catalog
 * for one Government Examination.
 */

export function getGovernmentExamSyllabus(
  exam: CompetitiveExam | null,
): GovernmentExamSyllabus | null {
  if (!exam) {
    return null;
  }

  return governmentExamSyllabuses[exam] ?? null;
}

/*
 * Get topics belonging to one
 * examination and subject.
 */

export function getGovernmentExamTopics(
  exam: CompetitiveExam | null,
  subject: string | null,
): GovernmentExamTopic[] {
  if (!exam || !subject) {
    return [];
  }

  const syllabus = getGovernmentExamSyllabus(exam);

  if (!syllabus) {
    return [];
  }

  const selectedSubject = syllabus.subjects.find(
    (item) => item.subject === subject,
  );

  return selectedSubject?.topics ?? [];
}

/*
 * Validate a topic before accepting
 * it in a question-generation request.
 */

export function isValidGovernmentExamTopic(
  exam: CompetitiveExam,
  subject: string,
  topicId: string,
): boolean {
  return getGovernmentExamTopics(
    exam,
    subject,
  ).some((topic) => topic.id === topicId);
}