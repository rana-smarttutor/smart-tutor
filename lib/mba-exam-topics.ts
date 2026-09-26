import type {
  CompetitiveExam,
} from "@/lib/quiz-arena-config";

export type MbaExamTopic = {
  id: string;
  title: string;
};

export type MbaExamSubject = {
  subject: string;
  topics: MbaExamTopic[];
};

export type MbaExamSyllabus = {
  exam: CompetitiveExam;
  title: string;
  catalogVersion: string;
  verification: "editorial-outline-needs-review";
  subjects: MbaExamSubject[];
};

/*
 * SmartIQ Institute
 *
 * MBA Entrance Topic Catalog
 *
 * Used as the topic allowlist for SmartIQ AI practice.
 *
 * This is an editorial practice structure.
 * Do not describe it as an official syllabus transcription
 * unless separately verified against the current examination source.
 */

function makeTopics(
  names: string[],
): MbaExamTopic[] {
  return names.map((title) => ({
    id: title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),

    title,
  }));
}

function subject(
  subject: string,
  topics: string[],
): MbaExamSubject {
  return {
    subject,
    topics: makeTopics(topics),
  };
}


const quantitativeAptitude = [
  "Number System",
  "Arithmetic",
  "Percentages",
  "Ratio and Proportion",
  "Averages",
  "Profit Loss and Discount",
  "Simple and Compound Interest",
  "Time and Work",
  "Time Speed and Distance",
  "Mixtures and Alligation",
  "Algebra",
  "Linear Equations",
  "Quadratic Equations",
  "Inequalities",
  "Geometry",
  "Mensuration",
  "Progressions",
  "Permutations and Combinations",
  "Probability",
  "Set Theory",
];


const varc = [
  "Reading Comprehension - Main Idea",
  "Reading Comprehension - Inference",
  "Reading Comprehension - Author Tone",
  "Reading Comprehension - Argument",
  "Reading Comprehension - Detail",
  "Para Jumbles",
  "Para Summary",
  "Odd Sentence Out",
  "Sentence Completion",
  "Vocabulary in Context",
  "Critical Reasoning",
  "Grammar and Usage",
];


const dilr = [
  "Tables",
  "Bar Graphs",
  "Line Graphs",
  "Pie Charts",
  "Mixed Graphs",
  "Data Caselets",
  "Venn Diagrams",
  "Seating and Arrangement Sets",
  "Scheduling Sets",
  "Games and Tournaments",
  "Routes and Networks",
  "Selection and Distribution",
  "Binary Logic",
  "Data Sufficiency",
];


const logicalReasoning = [
  "Seating Arrangements",
  "Linear Arrangements",
  "Circular Arrangements",
  "Puzzles",
  "Coding and Decoding",
  "Syllogisms",
  "Blood Relations",
  "Direction Sense",
  "Series",
  "Analogies",
  "Statement and Conclusion",
  "Statement and Assumption",
  "Cause and Effect",
  "Critical Reasoning",
  "Data Sufficiency",
];


const abstractReasoning = [
  "Number Patterns",
  "Letter Patterns",
  "Symbol Patterns",
  "Odd One Out",
  "Analogy Patterns",
  "Series Completion",
  "Sequence Logic",
  "Pattern Classification",
  "Embedded Logic",
  "Non-Verbal Logic in Text Form",
];


const verbalAbility = [
  "Vocabulary",
  "Synonyms and Antonyms",
  "Idioms and Phrases",
  "Grammar",
  "Sentence Correction",
  "Error Detection",
  "Fill in the Blanks",
  "Para Jumbles",
  "Para Completion",
  "Critical Reasoning",
];


const readingComprehension = [
  "Main Idea",
  "Supporting Details",
  "Inference",
  "Author Tone",
  "Author Purpose",
  "Fact versus Opinion",
  "Vocabulary in Context",
  "Logical Structure",
  "Strengthen and Weaken",
  "Passage Summary",
];


const generalAwareness = [
  "Business and Economy",
  "Indian Economy",
  "Indian Polity",
  "Indian History",
  "Indian Geography",
  "Science and Technology",
  "Environment",
  "International Organisations",
  "Awards and Honours",
  "Sports",
  "Books and Authors",
  "Stable Current Affairs Concepts",
];


const decisionMaking = [
  "Business Decision Making",
  "Ethical Dilemmas",
  "Stakeholder Management",
  "Resource Allocation",
  "Workplace Conflicts",
  "Managerial Situations",
  "Prioritisation",
  "Risk and Consequence Analysis",
  "Team Management",
  "Social and Ethical Decisions",
];


const languageSkills = [
  "Reading Comprehension",
  "Vocabulary",
  "Grammar",
  "Para Jumbles",
  "Sentence Completion",
  "Error Detection",
  "Analogies",
  "Critical Reasoning",
  "Contextual Usage",
  "Inference",
];


const dataAnalysis = [
  "Tables",
  "Bar Charts",
  "Line Charts",
  "Pie Charts",
  "Caselet Data",
  "Data Comparison",
  "Data Sufficiency",
  "Percent Change",
  "Ratios in Data",
  "Averages in Data",
];


const innovationEntrepreneurship = [
  "Entrepreneurship Fundamentals",
  "Idea Generation",
  "Opportunity Recognition",
  "Business Models",
  "Startup Ecosystem",
  "Startup Funding",
  "Innovation Management",
  "Intellectual Property Basics",
  "Marketing for Startups",
  "Scaling a Business",
  "Social Entrepreneurship",
  "Government Startup Initiatives",
];


export const mbaExamSyllabuses: Partial<
  Record<
    CompetitiveExam,
    MbaExamSyllabus
  >
> = {

  cat: {
    exam: "cat",
    title: "CAT",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "VARC",
        varc,
      ),

      subject(
        "DILR",
        dilr,
      ),

      subject(
        "Quantitative Aptitude",
        quantitativeAptitude,
      ),
    ],
  },


  "mah-mba-cet": {
    exam: "mah-mba-cet",
    title: "MAH MBA CET",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "Logical Reasoning",
        logicalReasoning,
      ),

      subject(
        "Abstract Reasoning",
        abstractReasoning,
      ),

      subject(
        "Quantitative Aptitude",
        quantitativeAptitude,
      ),

      subject(
        "Verbal Ability",
        verbalAbility,
      ),

      subject(
        "Reading Comprehension",
        readingComprehension,
      ),
    ],
  },


  xat: {
    exam: "xat",
    title: "XAT",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "Verbal Ability",
        [
          ...varc,
          "Poem Based Comprehension",
        ],
      ),

      subject(
        "Decision Making",
        decisionMaking,
      ),

      subject(
        "Quantitative Aptitude",
        [
          ...quantitativeAptitude,
          "Data Interpretation",
        ],
      ),

      subject(
        "General Knowledge",
        generalAwareness,
      ),
    ],
  },


  snap: {
    exam: "snap",
    title: "SNAP",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "General English",
        verbalAbility,
      ),

      subject(
        "Analytical Reasoning",
        logicalReasoning,
      ),

      subject(
        "Quantitative Aptitude",
        quantitativeAptitude,
      ),

      subject(
        "Data Interpretation",
        dataAnalysis,
      ),
    ],
  },


  nmat: {
    exam: "nmat",
    title: "NMAT",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "Language Skills",
        languageSkills,
      ),

      subject(
        "Logical Reasoning",
        logicalReasoning,
      ),

      subject(
        "Quantitative Skills",
        [
          ...quantitativeAptitude,
          ...dataAnalysis,
        ],
      ),
    ],
  },


  cmat: {
    exam: "cmat",
    title: "CMAT",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "Quantitative Technique",
        [
          ...quantitativeAptitude,
          ...dataAnalysis,
        ],
      ),

      subject(
        "Logical Reasoning",
        logicalReasoning,
      ),

      subject(
        "Language Comprehension",
        languageSkills,
      ),

      subject(
        "General Awareness",
        generalAwareness,
      ),

      subject(
        "Innovation and Entrepreneurship",
        innovationEntrepreneurship,
      ),
    ],
  },


  mat: {
    exam: "mat",
    title: "MAT",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "Language Comprehension",
        languageSkills,
      ),

      subject(
        "Mathematical Skills",
        quantitativeAptitude,
      ),

      subject(
        "Data Analysis",
        dataAnalysis,
      ),

      subject(
        "Intelligence and Critical Reasoning",
        logicalReasoning,
      ),

      subject(
        "Indian and Global Environment",
        generalAwareness,
      ),
    ],
  },


  atma: {
    exam: "atma",
    title: "ATMA",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "Analytical Reasoning",
        logicalReasoning,
      ),

      subject(
        "Verbal Skills",
        languageSkills,
      ),

      subject(
        "Quantitative Skills",
        quantitativeAptitude,
      ),
    ],
  },


  gmat: {
    exam: "gmat",
    title: "GMAT",
    catalogVersion: "2026-09",
    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "Quantitative Reasoning",
        [
          "Arithmetic",
          "Fractions Decimals and Percentages",
          "Ratio and Proportion",
          "Algebra",
          "Linear Equations",
          "Inequalities",
          "Word Problems",
          "Rates and Work",
          "Statistics",
          "Probability",
          "Problem Solving",
        ],
      ),

      subject(
        "Verbal Reasoning",
        [
          "Reading Comprehension",
          "Critical Reasoning",
          "Main Idea",
          "Inference",
          "Author Purpose",
          "Argument Evaluation",
          "Assumptions",
          "Strengthen the Argument",
          "Weaken the Argument",
          "Resolve the Paradox",
        ],
      ),

      subject(
        "Data Insights",
        [
          "Data Sufficiency",
          "Table Analysis",
          "Graphics Interpretation",
          "Two Part Analysis",
          "Multi Source Reasoning",
          "Data Comparison",
          "Rates and Percentages",
          "Statistics",
          "Probability",
          "Integrated Data Reasoning",
        ],
      ),
    ],
  },


  "tissnet-cuet-pg": {
    exam: "tissnet-cuet-pg",
    title:
      "TISS / CUET PG Management Prep",

    catalogVersion: "2026-09",

    verification:
      "editorial-outline-needs-review",

    subjects: [
      subject(
        "English",
        languageSkills,
      ),

      subject(
        "Quantitative Aptitude",
        quantitativeAptitude,
      ),

      subject(
        "Logical Reasoning",
        logicalReasoning,
      ),

      subject(
        "General Awareness",
        generalAwareness,
      ),
    ],
  },
};


export function getMbaExamSyllabus(
  exam: CompetitiveExam | null,
): MbaExamSyllabus | null {

  if (!exam) {
    return null;
  }

  return (
    mbaExamSyllabuses[exam] ??
    null
  );
}


export function getMbaExamTopics(
  exam: CompetitiveExam | null,
  subjectName: string | null,
): MbaExamTopic[] {

  if (
    !exam ||
    !subjectName
  ) {
    return [];
  }

  const syllabus =
    getMbaExamSyllabus(exam);

  if (!syllabus) {
    return [];
  }

  return (
    syllabus.subjects.find(
      (item) =>
        item.subject ===
        subjectName,
    )?.topics ??
    []
  );
}


export function isValidMbaExamTopic(
  exam: CompetitiveExam,
  subjectName: string,
  topicId: string,
): boolean {

  return getMbaExamTopics(
    exam,
    subjectName,
  ).some(
    (topic) =>
      topic.id === topicId,
  );
}