import type { CompetitiveExam } from "@/lib/quiz-arena-config";

export type CompetitiveExamTopic = {
  id: string;
  title: string;
};

export type CompetitiveExamSubject = {
  subject: string;
  topics: CompetitiveExamTopic[];
};

export type CompetitiveExamSyllabus = {
  exam: CompetitiveExam;
  title: string;
  catalogVersion: string;
  verification: "editorial-outline-needs-review";
  subjects: CompetitiveExamSubject[];
};

/*
 * SmartIQ Competitive Exam Topic Catalog
 *
 * This file is an internal topic allowlist for AI practice generation.
 * It is NOT an official syllabus transcription and must not be presented
 * to students as an official/previous-year question source.
 *
 * The generator is restricted to:
 * exam -> subject -> selected topic -> level -> round.
 */

function makeTopics(names: string[]): CompetitiveExamTopic[] {
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
): CompetitiveExamSubject {
  return {
    subject,
    topics: makeTopics(topics),
  };
}

const physics = [
  "Units and Measurements",
  "Kinematics",
  "Laws of Motion",
  "Work Energy and Power",
  "System of Particles and Rotational Motion",
  "Gravitation",
  "Properties of Bulk Matter",
  "Thermodynamics",
  "Kinetic Theory",
  "Oscillations and Waves",
  "Electrostatics",
  "Current Electricity",
  "Magnetic Effects of Current",
  "Electromagnetic Induction",
  "Alternating Current",
  "Electromagnetic Waves",
  "Ray Optics",
  "Wave Optics",
  "Dual Nature of Matter",
  "Atoms and Nuclei",
  "Semiconductor Electronics",
];

const chemistry = [
  "Some Basic Concepts of Chemistry",
  "Atomic Structure",
  "Chemical Bonding",
  "States of Matter",
  "Thermodynamics",
  "Equilibrium",
  "Redox Reactions",
  "Solutions",
  "Electrochemistry",
  "Chemical Kinetics",
  "Periodic Classification",
  "Coordination Compounds",
  "Organic Chemistry Basics",
  "Hydrocarbons",
  "Haloalkanes and Haloarenes",
  "Alcohols Phenols and Ethers",
  "Aldehydes Ketones and Carboxylic Acids",
  "Amines",
  "Biomolecules",
  "Polymers and Everyday Chemistry",
];

const mathematics = [
  "Sets Relations and Functions",
  "Complex Numbers",
  "Quadratic Equations",
  "Sequences and Series",
  "Permutations and Combinations",
  "Binomial Theorem",
  "Matrices and Determinants",
  "Straight Lines",
  "Circles",
  "Conic Sections",
  "Three Dimensional Geometry",
  "Limits and Continuity",
  "Differentiation",
  "Applications of Derivatives",
  "Integration",
  "Differential Equations",
  "Vector Algebra",
  "Probability",
  "Statistics",
  "Trigonometry",
];

const biology = [
  "Diversity in Living World",
  "Structural Organisation in Plants and Animals",
  "Cell Structure and Function",
  "Plant Physiology",
  "Human Physiology",
  "Reproduction",
  "Genetics and Evolution",
  "Biology and Human Welfare",
  "Biotechnology",
  "Ecology and Environment",
];

const englishLanguage = [
  "Vocabulary in Context",
  "Grammar and Usage",
  "Sentence Correction",
  "Para Jumbles",
  "Reading Comprehension",
  "Inference and Tone",
  "Synonyms and Antonyms",
  "Idioms and Phrases",
  "Fill in the Blanks",
  "Error Detection",
];

const logicalReasoning = [
  "Analogy",
  "Classification",
  "Series",
  "Coding and Decoding",
  "Blood Relations",
  "Direction Sense",
  "Syllogisms",
  "Statement and Conclusion",
  "Assumptions and Arguments",
  "Puzzles",
  "Seating Arrangement",
  "Data Sufficiency",
];

const generalKnowledge = [
  "Indian History",
  "Indian Geography",
  "Indian Polity",
  "Indian Economy",
  "General Science",
  "Environment",
  "Art and Culture",
  "Sports",
  "Awards and Honours",
  "Important Organisations",
  "Static General Knowledge",
  "Stable Current Affairs Concepts",
];

const quantitativeAptitude = [
  "Number System",
  "Simplification",
  "Percentage",
  "Ratio and Proportion",
  "Average",
  "Profit Loss and Discount",
  "Simple and Compound Interest",
  "Time and Work",
  "Time Speed and Distance",
  "Mixture and Alligation",
  "Algebra",
  "Geometry",
  "Mensuration",
  "Data Interpretation",
  "Probability",
];

const legalAptitude = [
  "Legal Principles and Facts",
  "Constitutional Principles",
  "Law of Torts Basics",
  "Contract Law Basics",
  "Criminal Law Basics",
  "Family Law Basics",
  "Legal Maxims",
  "Rights and Duties",
  "Legal Current Context",
  "Principle Fact Application",
];

const businessEconomics = [
  "Demand and Supply",
  "Elasticity",
  "Consumer Behaviour",
  "Production and Cost",
  "Market Structures",
  "National Income",
  "Money and Banking",
  "Inflation",
  "Public Finance",
  "International Trade",
  "Indian Economy",
  "Business Cycles",
];

const accounting = [
  "Accounting Principles",
  "Journal Entries",
  "Ledger and Trial Balance",
  "Bank Reconciliation",
  "Depreciation",
  "Inventory Valuation",
  "Bills of Exchange",
  "Final Accounts",
  "Partnership Accounts",
  "Company Accounts Basics",
  "Rectification of Errors",
  "Financial Statements",
];

const businessMath = [
  "Ratio and Proportion",
  "Indices and Logarithms",
  "Equations",
  "Linear Inequalities",
  "Mathematics of Finance",
  "Permutations and Combinations",
  "Sequences and Series",
  "Sets Relations and Functions",
  "Basic Calculus",
  "Statistics",
  "Probability",
  "Data Interpretation",
];

export const competitiveExamSyllabuses: Partial<
  Record<CompetitiveExam, CompetitiveExamSyllabus>
> = {
  jee: {
    exam: "jee",
    title: "JEE",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Physics", physics),
      subject("Chemistry", chemistry),
      subject("Mathematics", mathematics),
    ],
  },

  neet: {
    exam: "neet",
    title: "NEET",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Physics", physics),
      subject("Chemistry", chemistry),
      subject("Biology", biology),
    ],
  },

  "mht-cet": {
    exam: "mht-cet",
    title: "MHT-CET",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Physics", physics),
      subject("Chemistry", chemistry),
      subject("Mathematics", mathematics),
      subject("Biology", biology),
    ],
  },

  olympiads: {
    exam: "olympiads",
    title: "Olympiads",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Mathematics", [
        "Number Sense",
        "Arithmetic Reasoning",
        "Fractions and Decimals",
        "Ratio and Percentage",
        "Algebraic Thinking",
        "Geometry",
        "Mensuration",
        "Patterns and Sequences",
        "Data Handling",
        "Combinatorial Thinking",
      ]),
      subject("Science", [
        "Physics Concepts",
        "Chemistry Concepts",
        "Biology Concepts",
        "Earth and Space Science",
        "Environment",
        "Scientific Reasoning",
        "Experimental Observation",
        "Everyday Science",
      ]),
      subject("English", englishLanguage),
      subject("Logical Reasoning", logicalReasoning),
      subject("General Knowledge", generalKnowledge),
    ],
  },

  sat: {
    exam: "sat",
    title: "SAT",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Reading and Writing", [
        "Information and Ideas",
        "Craft and Structure",
        "Expression of Ideas",
        "Standard English Conventions",
        "Central Ideas and Details",
        "Command of Evidence",
        "Words in Context",
        "Text Structure and Purpose",
        "Transitions",
        "Grammar and Punctuation",
      ]),
      subject("Mathematics", [
        "Linear Equations",
        "Systems of Equations",
        "Linear Functions",
        "Nonlinear Equations",
        "Quadratic Functions",
        "Ratios Rates and Proportions",
        "Percentages",
        "Data Analysis",
        "Probability",
        "Geometry",
        "Trigonometry",
      ]),
    ],
  },

  ielts: {
    exam: "ielts",
    title: "IELTS",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Listening", [
        "Main Idea Recognition",
        "Specific Information",
        "Speaker Purpose",
        "Attitude and Opinion",
        "Form and Note Completion",
        "Map and Diagram Language",
      ]),
      subject("Reading", [
        "Skimming",
        "Scanning",
        "Main Ideas",
        "Supporting Details",
        "Inference",
        "Matching Headings",
        "True False Not Given",
        "Vocabulary in Context",
      ]),
      subject("Writing", [
        "Task Response",
        "Coherence and Cohesion",
        "Paragraph Organisation",
        "Argument Development",
        "Data Description",
        "Academic Vocabulary",
      ]),
      subject("Speaking", [
        "Fluency and Coherence",
        "Lexical Resource",
        "Grammatical Range",
        "Pronunciation Awareness",
        "Part 1 Responses",
        "Cue Card Organisation",
        "Discussion Development",
      ]),
      subject("Vocabulary", [
        "Academic Vocabulary",
        "Collocations",
        "Synonyms and Paraphrasing",
        "Word Formation",
        "Contextual Meaning",
        "Topic Vocabulary",
      ]),
      subject("Grammar", [
        "Tenses",
        "Subject Verb Agreement",
        "Articles",
        "Prepositions",
        "Complex Sentences",
        "Conditionals",
        "Relative Clauses",
        "Punctuation",
      ]),
    ],
  },

  toefl: {
    exam: "toefl",
    title: "TOEFL",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Reading", [
        "Factual Information",
        "Negative Factual Information",
        "Inference",
        "Rhetorical Purpose",
        "Vocabulary in Context",
        "Sentence Simplification",
        "Insert Text",
        "Prose Summary",
      ]),
      subject("Listening", [
        "Main Idea",
        "Detail",
        "Function",
        "Attitude",
        "Organisation",
        "Connecting Content",
        "Inference",
      ]),
      subject("Speaking", [
        "Independent Speaking",
        "Integrated Campus Task",
        "Integrated Academic Task",
        "Organisation",
        "Language Use",
        "Delivery",
      ]),
      subject("Writing", [
        "Integrated Writing",
        "Academic Discussion",
        "Source Integration",
        "Organisation",
        "Grammar and Vocabulary",
        "Argument Support",
      ]),
    ],
  },

  "imu-cet": {
    exam: "imu-cet",
    title: "IMU-CET",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Physics", physics),
      subject("Chemistry", chemistry),
      subject("Mathematics", mathematics),
      subject("English", englishLanguage),
      subject("General Aptitude", [
        ...quantitativeAptitude,
        ...logicalReasoning.slice(0, 8),
      ]),
    ],
  },

  "nchmct-jee": {
    exam: "nchmct-jee",
    title: "NCHMCT-JEE",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Numerical Ability", quantitativeAptitude),
      subject("Reasoning", logicalReasoning),
      subject("English", englishLanguage),
      subject("General Knowledge", generalKnowledge),
      subject("Service Aptitude", [
        "Hospitality Orientation",
        "Customer Service",
        "Professional Etiquette",
        "Communication in Service",
        "Guest Handling",
        "Teamwork",
        "Service Situations",
        "Decision Making",
      ]),
    ],
  },

  clat: {
    exam: "clat",
    title: "CLAT",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("English", [
        "Reading Comprehension",
        "Central Idea",
        "Inference",
        "Vocabulary in Context",
        "Author Tone",
        "Argument Structure",
      ]),
      subject("Current Affairs", [
        "National Events",
        "International Events",
        "Legal Developments",
        "Government and Policy",
        "Economy and Business",
        "Science and Technology",
        "Awards Sports and Culture",
      ]),
      subject("Legal Reasoning", legalAptitude),
      subject("Logical Reasoning", [
        "Arguments",
        "Premises and Conclusions",
        "Strengthen and Weaken",
        "Assumptions",
        "Inference",
        "Analogy",
        "Cause and Effect",
        "Principle Application",
      ]),
      subject("Quantitative Techniques", [
        "Ratios",
        "Percentages",
        "Averages",
        "Profit and Loss",
        "Basic Algebra",
        "Mensuration",
        "Data Interpretation",
        "Tables and Graphs",
      ]),
    ],
  },

  ailet: {
    exam: "ailet",
    title: "AILET",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("English", englishLanguage),
      subject("Current Affairs", [
        "National Events",
        "International Events",
        "Legal Developments",
        "Economy",
        "Science and Technology",
        "Awards and Sports",
      ]),
      subject("Legal Reasoning", legalAptitude),
      subject("Logical Reasoning", logicalReasoning),
    ],
  },

  law: {
    exam: "law",
    title: "LAW Entrance",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Legal Aptitude", legalAptitude),
      subject("English", englishLanguage),
      subject("Current Affairs", [
        "National Events",
        "International Events",
        "Legal Developments",
        "Government Policy",
        "Economy",
        "Science and Technology",
      ]),
      subject("Logical Reasoning", logicalReasoning),
      subject("General Knowledge", generalKnowledge),
    ],
  },

  "mht-cet-llb": {
    exam: "mht-cet-llb",
    title: "MHT CET LLB",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Legal Aptitude", legalAptitude),
      subject("General Knowledge", generalKnowledge),
      subject("Logical Reasoning", logicalReasoning),
      subject("English", englishLanguage),
      subject("Basic Mathematics", [
        "Number System",
        "Fractions and Decimals",
        "Percentage",
        "Ratio and Proportion",
        "Average",
        "Profit and Loss",
        "Simple Interest",
        "Time and Work",
        "Time Speed and Distance",
        "Basic Algebra",
        "Basic Geometry",
        "Data Interpretation",
      ]),
    ],
  },

  ca: {
    exam: "ca",
    title: "CA",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Accounting", accounting),
      subject("Business Laws", [
        "Indian Contract Act",
        "Sale of Goods",
        "Partnership",
        "Limited Liability Partnership",
        "Companies Act Basics",
        "Negotiable Instruments Basics",
        "Legal Terminology",
        "Case Based Application",
      ]),
      subject("Economics", businessEconomics),
      subject("Quantitative Aptitude", [
        ...businessMath,
        "Logical Reasoning",
        "Data Interpretation",
      ]),
    ],
  },

  cs: {
    exam: "cs",
    title: "CS",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Business Communication", [
        "Communication Process",
        "Business Correspondence",
        "Business Vocabulary",
        "Grammar and Usage",
        "Report Writing Concepts",
        "Presentation Skills",
        "Interpersonal Communication",
        "Digital Communication",
      ]),
      subject("Legal Aptitude", legalAptitude),
      subject("Economics", businessEconomics),
      subject("Business Environment", [
        "Business Environment",
        "Forms of Business Organisation",
        "Entrepreneurship",
        "Government and Business",
        "Financial Markets Basics",
        "Banking Basics",
        "Global Business Environment",
        "Business Ethics",
      ]),
    ],
  },

  cma: {
    exam: "cma",
    title: "CMA",
    catalogVersion: "2026-09",
    verification: "editorial-outline-needs-review",
    subjects: [
      subject("Accounting", accounting),
      subject("Economics", businessEconomics),
      subject("Business Mathematics", businessMath),
      subject("Commercial Laws", [
        "Contract Law Basics",
        "Sale of Goods",
        "Negotiable Instruments",
        "Partnership Basics",
        "Company Law Basics",
        "Business Regulations",
        "Legal Terminology",
        "Case Based Application",
      ]),
    ],
  },
};

export function getCompetitiveExamSyllabus(
  exam: CompetitiveExam | null,
): CompetitiveExamSyllabus | null {
  if (!exam) {
    return null;
  }

  return competitiveExamSyllabuses[exam] ?? null;
}

export function getCompetitiveExamTopics(
  exam: CompetitiveExam | null,
  subjectName: string | null,
): CompetitiveExamTopic[] {
  if (!exam || !subjectName) {
    return [];
  }

  const syllabus = getCompetitiveExamSyllabus(exam);
  if (!syllabus) {
    return [];
  }

  return (
    syllabus.subjects.find((item) => item.subject === subjectName)?.topics ?? []
  );
}

export function isValidCompetitiveExamTopic(
  exam: CompetitiveExam,
  subjectName: string,
  topicId: string,
): boolean {
  return getCompetitiveExamTopics(exam, subjectName).some(
    (topic) => topic.id === topicId,
  );
}