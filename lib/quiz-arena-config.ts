/**
 * SmartIQ Institute — Quiz Arena Configuration
 *
 * Complete examination catalogue.
 *
 * Includes:
 * - School and Junior College
 * - Competitive Entrance Examinations
 * - Government Recruitment Examinations
 * - MBA Entrance Examinations
 * - Individual examinations under each group
 *
 * Existing examination IDs must not be renamed because they
 * are used in saved quizzes, progress and attempts.
 *
 * Note: Newly added examinations use preliminary subject lists.
 * Dedicated official syllabus and topic-bank configuration is
 * maintained separately.
 */

// ============================================================
// BASIC TYPES
// ============================================================

export type EducationLevel =
  | "school-junior-college"
  | "competitive-exam"
  | "government-exam"
  | "mba-entrance";

export type Stream =
  | "school"
  | "science"
  | "commerce"
  | "arts"
  | "law"
  | "management"
  | "medical"
  | "engineering"
  | "defence"
  | "government";

export type CompetitiveExam =
  // School
  | "class-6-8"
  | "class-9-10"
  | "class-11-12-science"
  | "class-11-12-commerce"
  | "class-11-12-arts"

  // Existing competitive examinations
  | "jee"
  | "neet"
  | "mht-cet"
  | "olympiads"
  | "sat"
  | "ielts"
  | "toefl"
  | "imu-cet"
  | "nchmct-jee"
  | "clat"
  | "ailet"
  | "law"
  | "ca"
  | "cs"
  | "cma"
  | "mht-cet-llb"

  // Existing government examinations
  | "upsc"
  | "mpsc"
  | "ssc"
  | "ssc-cgl"
  | "ssc-cpo"
  | "ssc-chsl"
  | "ssc-gd"
  | "banking"
  | "railway"
  | "nda"
  | "cds"
  | "afcat"
  | "capf"
  | "ctet-tet"
  | "maharashtra-police-bharti"
  | "maharashtra-state-government"

  // Existing MBA examinations
  | "cat"
  | "mah-mba-cet"
  | "xat"
  | "snap"
  | "nmat"
  | "cmat"
  | "mat"
  | "atma"
  | "gmat"
  | "tissnet-cuet-pg"

  // Phase 1 — SSC
  | "ssc-mts"
  | "ssc-stenographer"
  | "ssc-je"
  | "ssc-selection-post"

  // Phase 1 — Banking
  | "sbi-po"
  | "sbi-clerk"
  | "ibps-po"
  | "ibps-clerk"
  | "ibps-rrb-officer"
  | "ibps-rrb-assistant"
  | "rbi-grade-b"
  | "rbi-assistant"

  // Phase 1 — Railways
  | "rrb-ntpc"
  | "rrb-group-d"
  | "rrb-je"
  | "rrb-alp"
  | "rpf-si"
  | "rpf-constable"

  // Phase 1 — UPSC
  | "upsc-cse"
  | "upsc-ies"
  | "upsc-cms"

  // Phase 1 — MPSC
  | "mpsc-rajyaseva"
  | "mpsc-group-b"
  | "mpsc-group-c"

  // Phase 1 — Teaching
  | "ctet"
  | "maharashtra-tet"
  | "ugc-net"
  | "csir-net"

  // Phase 1 — Maharashtra
  | "maharashtra-talathi"
  | "maharashtra-gramsevak"

  // Phase 1 — Engineering and Medical
  | "jee-main"
  | "jee-advanced"
  | "neet-ug"
  | "neet-pg"

  // Phase 1 — Law
  | "clat-ug"
  | "clat-pg"
  | "ailet-ug"
  | "ailet-pg"

  // Additional parent groups
  | "defence-exams"
  | "other-entrance"
  | "mba-more"

  // Additional SSC exams
  | "ssc-jht"
  | "ssc-delhi-police-constable"

  // Additional banking and financial recruitment
  | "ibps-so"
  | "sbi-so"
  | "ibps-rrb-scale-ii"
  | "ibps-rrb-scale-iii"
  | "nabard-grade-a"
  | "nabard-grade-b"
  | "sebi-grade-a"
  | "sidbi-grade-a"
  | "lic-aao"
  | "lic-ado"
  | "niacl-ao"

  // Additional railway recruitment
  | "rrb-technician"
  | "rrb-section-controller"
  | "rrb-paramedical"
  | "rrb-ministerial-isolated"
  | "rrb-ntpc-graduate"
  | "rrb-ntpc-undergraduate"

  // Additional UPSC
  | "upsc-ifos"
  | "upsc-economic-service"
  | "upsc-statistical-service"
  | "upsc-geoscientist"
  | "upsc-epfo-eo-ao"
  | "upsc-epfo-apfc"

  // Additional Maharashtra recruitment
  | "mpsc-engineering"
  | "mpsc-agriculture"
  | "mpsc-forest"
  | "maharashtra-police-si"
  | "maharashtra-police-constable"
  | "maharashtra-excise-constable"

  // Defence recruitment
  | "army-agniveer-gd"
  | "army-agniveer-technical"
  | "army-agniveer-clerk"
  | "navy-agniveer-ssr"
  | "navy-agniveer-mr"
  | "airforce-agniveervayu"
  | "coast-guard-navik-gd"
  | "coast-guard-navik-db"
  | "coast-guard-yantrik"

  // Teaching recruitment
  | "kvs-prt"
  | "kvs-tgt"
  | "kvs-pgt"
  | "nvs-tgt"
  | "nvs-pgt"
  | "dsssb-teaching"
  | "emrs-tgt"
  | "emrs-pgt"

  // Engineering entrances
  | "bitsat"
  | "viteee"
  | "srmjeee"
  | "wbjee"
  | "comedk-uget"
  | "kcet"
  | "ap-eapcet"
  | "ts-eapcet"

  // Medical and nursing entrances
  | "ini-cet"
  | "fmge"
  | "aiims-bsc-nursing"
  | "aiims-msc-nursing"
  | "neet-mds"

  // Law entrances
  | "slat"
  | "mh-law-3-year"
  | "mh-law-5-year"

  // Chartered Accountancy
  | "ca-foundation"
  | "ca-intermediate"
  | "ca-final"

  // Company Secretary
  | "cseet"
  | "cs-executive"
  | "cs-professional"

  // Cost and Management Accountancy
  | "cma-foundation"
  | "cma-intermediate"
  | "cma-final"

  // Other competitive entrances
  | "cuet-ug"
  | "cuet-pg"
  | "nift-entrance"
  | "nid-dat"
  | "uceed"
  | "ceed"
  | "nata"
  | "ipmat"
  | "nimcet"
  | "mah-mca-cet"

  // Additional MBA examinations
  | "micat"
  | "ibsat"
  | "kiitee-management";

export type Difficulty = "easy" | "medium" | "hard";

export type QuizSchoolClass = "6" | "7" | "8" | "9" | "10" | "11" | "12";

export type QuizBoard = "Maharashtra State Board" | "CBSE";

export type QuizJourneyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type QuizRound = 1 | 2 | 3 | 4 | 5;

// ============================================================
// INTERFACES
// ============================================================

export type LevelOption = {
  id: EducationLevel;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
};

export type ExamOption = {
  id: CompetitiveExam;
  title: string;
  category: EducationLevel;
  stream: Stream;
  eligibility: string;
  trendNote: string;
  subjects: string[];
};

export type DifficultyOption = {
  id: Difficulty;
  title: string;
  questions: number;
  description: string;
  icon: string;
};

export type QuizJourneyLevelOption = {
  id: QuizJourneyLevel;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  rounds: number;
  questionsPerRound: number;
  questionCapacity: number;
};

// ============================================================
// SCHOOL BOARDS AND CLASSES
// ============================================================

export const quizBoardOptions: Array<{
  id: QuizBoard;
  title: string;
  description: string;
}> = [
  {
    id: "Maharashtra State Board",
    title: "Maharashtra State Board",
    description: "Maharashtra State Board syllabus",
  },
  {
    id: "CBSE",
    title: "CBSE",
    description: "CBSE / NCERT-aligned syllabus",
  },
];

export const quizSchoolClassOptions: Partial<
  Record<CompetitiveExam, QuizSchoolClass[]>
> = {
  "class-6-8": ["6", "7", "8"],
  "class-9-10": ["9", "10"],
  "class-11-12-science": ["11", "12"],
  "class-11-12-commerce": ["11", "12"],
  "class-11-12-arts": ["11", "12"],
};

export function getQuizSchoolClasses(
  exam: CompetitiveExam | null,
): QuizSchoolClass[] {
  if (!exam) return [];
  return quizSchoolClassOptions[exam] ?? [];
}

export function requiresQuizBoard(exam: CompetitiveExam | null): boolean {
  return (
    exam === "class-9-10" ||
    exam === "class-11-12-science" ||
    exam === "class-11-12-commerce" ||
    exam === "class-11-12-arts"
  );
}

// ============================================================
// JOURNEY CONFIGURATION
// ============================================================

export const QUIZ_TOTAL_LEVELS = 10;
export const QUIZ_ROUNDS_PER_LEVEL = 5;
export const QUIZ_QUESTIONS_PER_ROUND = 10;

export const QUIZ_QUESTIONS_PER_LEVEL =
  QUIZ_ROUNDS_PER_LEVEL * QUIZ_QUESTIONS_PER_ROUND;

export const QUIZ_MAX_QUESTIONS = QUIZ_TOTAL_LEVELS * QUIZ_QUESTIONS_PER_LEVEL;

const journeyDefinitions = [
  ["Fundamentals", "Build confidence with essential concepts.", "🌱"],
  ["Core Concepts", "Strengthen important concepts.", "📘"],
  ["Applied Basics", "Apply foundational knowledge.", "🧠"],
  ["Intermediate", "Develop stronger reasoning skills.", "⚡"],
  ["Strong Concepts", "Test deeper conceptual understanding.", "🎯"],
  ["Application", "Solve demanding application questions.", "🚀"],
  ["Exam Practice", "Practise examination-style questions.", "📝"],
  ["Advanced Practice", "Handle advanced problems.", "🔥"],
  ["Expert Challenge", "Solve high-level questions.", "🏆"],
  ["Master Challenge", "Complete the toughest stage.", "👑"],
] as const;

export const quizJourneyLevels: QuizJourneyLevelOption[] =
  journeyDefinitions.map(([subtitle, description, icon], index) => ({
    id: (index + 1) as QuizJourneyLevel,
    title: `Level ${index + 1}`,
    subtitle,
    description,
    icon,
    rounds: QUIZ_ROUNDS_PER_LEVEL,
    questionsPerRound: QUIZ_QUESTIONS_PER_ROUND,
    questionCapacity: QUIZ_QUESTIONS_PER_LEVEL,
  }));

export function getDifficultyForJourneyLevel(
  level: QuizJourneyLevel,
): Difficulty {
  if (level <= 3) return "easy";
  if (level <= 6) return "medium";
  return "hard";
}

export function getQuizJourneyLevel(
  level: QuizJourneyLevel | null,
): QuizJourneyLevelOption | undefined {
  return quizJourneyLevels.find((option) => option.id === level);
}

export function getQuizJourneyLevelTitle(
  level: QuizJourneyLevel | null,
): string {
  const option = getQuizJourneyLevel(level);
  return option ? `${option.title} • ${option.subtitle}` : "";
}

// ============================================================
// MAIN CATEGORIES
// ============================================================

export const levelOptions: LevelOption[] = [
  {
    id: "school-junior-college",
    title: "School & Junior College Courses",
    subtitle: "6th to 12th • Boards & Streams",
    description: "State Board, CBSE, Science, Commerce and Arts.",
    icon: "📘",
  },
  {
    id: "competitive-exam",
    title: "Top Competitive Exam Courses",
    subtitle: "Engineering, Medical, Law, Commerce & More",
    description:
      "Engineering, medical, law, professional and university entrance examinations.",
    icon: "🎯",
  },
  {
    id: "government-exam",
    title: "Top Government Exam Courses",
    subtitle: "UPSC, MPSC, SSC, Banking, Railways & Defence",
    description:
      "Central, state, railway, teaching, banking and defence recruitment.",
    icon: "🏛️",
  },
  {
    id: "mba-entrance",
    title: "MBA Entrance Exams",
    subtitle: "CAT, CET, XAT, SNAP, NMAT & More",
    description: "Indian and international management entrance preparation.",
    icon: "📊",
  },
];

// ============================================================
// EXAM SUBJECT DEFAULTS
// ============================================================

const SCHOOL_BASIC = [
  "Mathematics",
  "Science",
  "English",
  "Social Science",
  "Computer Basics",
  "General Knowledge",
];

const SCIENCE = ["Physics", "Chemistry", "Mathematics"];

const MEDICAL = ["Physics", "Chemistry", "Biology"];

const SSC_GENERAL = [
  "Quantitative Aptitude",
  "Reasoning",
  "English",
  "General Awareness",
];

const BANKING_GENERAL = [
  "Quantitative Aptitude",
  "Reasoning",
  "English",
  "Banking Awareness",
  "Computer Knowledge",
];

const RAILWAY_GENERAL = [
  "Mathematics",
  "Reasoning",
  "General Awareness",
  "General Science",
];

const UPSC_GENERAL = [
  "History",
  "Geography",
  "Polity",
  "Economics",
  "Environment",
  "Current Affairs",
  "CSAT",
];

const MPSC_GENERAL = [
  "Maharashtra GK",
  "History",
  "Geography",
  "Polity",
  "Economics",
  "Current Affairs",
  "CSAT",
];

const TEACHING_GENERAL = [
  "Child Development",
  "Pedagogy",
  "Mathematics",
  "Environmental Studies",
  "Language",
];

const MAHARASHTRA_GENERAL = [
  "Marathi",
  "English",
  "General Knowledge",
  "Reasoning",
  "Mathematics",
  "Current Affairs",
];

const LAW_GENERAL = [
  "English",
  "Current Affairs",
  "Legal Reasoning",
  "Logical Reasoning",
  "Quantitative Techniques",
];

const DEFENCE_GENERAL = [
  "English",
  "General Knowledge",
  "Mathematics",
  "Reasoning",
];

const MBA_GENERAL = [
  "Quantitative Aptitude",
  "Verbal Ability",
  "Logical Reasoning",
  "Data Interpretation",
];

// ============================================================
// ORIGINAL EXAM CATALOGUE
// ============================================================

function defineExam(
  id: CompetitiveExam,
  title: string,
  category: EducationLevel,
  stream: Stream,
  subjects: string[],
  eligibility: string,
  trendNote: string,
): ExamOption {
  return {
    id,
    title,
    category,
    stream,
    subjects: [...subjects],
    eligibility,
    trendNote,
  };
}

const SCHOOL = "school-junior-college";
const COMPETITIVE = "competitive-exam";
const GOVERNMENT = "government-exam";
const MBA = "mba-entrance";

export const competitiveExams: ExamOption[] = [
  // SCHOOL AND JUNIOR COLLEGE
  defineExam(
    "class-6-8",
    "6th to 8th",
    SCHOOL,
    "school",
    SCHOOL_BASIC,
    "Students studying in Classes 6 to 8.",
    "Foundation and Olympiad-style preparation.",
  ),
  defineExam(
    "class-9-10",
    "9th to 10th",
    SCHOOL,
    "school",
    [
      "Mathematics",
      "Science",
      "English",
      "Social Science",
      "Computer Science",
      "General Knowledge",
    ],
    "Students studying in Classes 9 or 10.",
    "Board preparation and concept strengthening.",
  ),
  defineExam(
    "class-11-12-science",
    "11th to 12th Science",
    SCHOOL,
    "science",
    [
      "Physics",
      "Chemistry",
      "Mathematics",
      "Biology",
      "English",
      "Computer Science",
    ],
    "Class 11 and 12 Science students.",
    "Science stream and board examination preparation.",
  ),
  defineExam(
    "class-11-12-commerce",
    "11th to 12th Commerce",
    SCHOOL,
    "commerce",
    ["Accountancy", "Business Studies", "Economics", "Mathematics", "English"],
    "Class 11 and 12 Commerce students.",
    "Commerce stream and board examination preparation.",
  ),
  defineExam(
    "class-11-12-arts",
    "11th to 12th Arts",
    SCHOOL,
    "arts",
    [
      "History",
      "Political Science",
      "Geography",
      "Economics",
      "English",
      "Sociology",
    ],
    "Class 11 and 12 Arts students.",
    "Humanities and board examination preparation.",
  ),

  // COMPETITIVE EXAMINATIONS
  defineExam(
    "jee",
    "JEE",
    COMPETITIVE,
    "engineering",
    SCIENCE,
    "Class 11 and 12 Science students with PCM.",
    "Engineering entrance preparation.",
  ),
  defineExam(
    "neet",
    "NEET",
    COMPETITIVE,
    "medical",
    MEDICAL,
    "Medical entrance aspirants.",
    "Medical examination preparation.",
  ),
  defineExam(
    "mht-cet",
    "CET",
    COMPETITIVE,
    "science",
    [...SCIENCE, "Biology"],
    "Students preparing for Maharashtra CET.",
    "Maharashtra professional entrance preparation.",
  ),
  defineExam(
    "olympiads",
    "Olympiads",
    COMPETITIVE,
    "school",
    [
      "Mathematics",
      "Science",
      "English",
      "Logical Reasoning",
      "General Knowledge",
    ],
    "School students eligible for Olympiad examinations.",
    "Academic Olympiad preparation.",
  ),
  defineExam(
    "sat",
    "SAT",
    COMPETITIVE,
    "school",
    ["Reading and Writing", "Mathematics"],
    "Undergraduate admission aspirants.",
    "SAT preparation.",
  ),
  defineExam(
    "ielts",
    "IELTS",
    COMPETITIVE,
    "school",
    ["Listening", "Reading", "Writing", "Speaking", "Vocabulary", "Grammar"],
    "English proficiency test aspirants.",
    "IELTS preparation.",
  ),
  defineExam(
    "toefl",
    "TOEFL",
    COMPETITIVE,
    "school",
    ["Reading", "Listening", "Speaking", "Writing"],
    "International education applicants.",
    "TOEFL preparation.",
  ),
  defineExam(
    "imu-cet",
    "IMU-CET",
    COMPETITIVE,
    "science",
    [...SCIENCE, "English", "General Aptitude"],
    "Maritime course aspirants.",
    "Maritime entrance preparation.",
  ),
  defineExam(
    "nchmct-jee",
    "NCHMCT-JEE",
    COMPETITIVE,
    "management",
    [
      "Numerical Ability",
      "Reasoning",
      "English",
      "General Knowledge",
      "Service Aptitude",
    ],
    "Hospitality course aspirants.",
    "Hotel management entrance preparation.",
  ),
  defineExam(
    "clat",
    "CLAT",
    COMPETITIVE,
    "law",
    LAW_GENERAL,
    "Law entrance applicants.",
    "Common Law Admission Test preparation.",
  ),
  defineExam(
    "ailet",
    "AILET",
    COMPETITIVE,
    "law",
    ["English", "Current Affairs", "Legal Reasoning", "Logical Reasoning"],
    "NLU Delhi admission aspirants.",
    "AILET preparation.",
  ),
  defineExam(
    "law",
    "LAW Entrance",
    COMPETITIVE,
    "law",
    [
      "Legal Aptitude",
      "English",
      "Current Affairs",
      "Logical Reasoning",
      "General Knowledge",
    ],
    "Law entrance aspirants.",
    "Law entrance preparation.",
  ),
  defineExam(
    "mht-cet-llb",
    "MHT CET LLB",
    COMPETITIVE,
    "law",
    [
      "Legal Aptitude",
      "General Knowledge",
      "Logical Reasoning",
      "English",
      "Basic Mathematics",
    ],
    "Maharashtra LLB entrance aspirants.",
    "MAH Law CET preparation.",
  ),
  defineExam(
    "ca",
    "CA",
    COMPETITIVE,
    "commerce",
    ["Accounting", "Business Laws", "Economics", "Quantitative Aptitude"],
    "Chartered Accountancy students.",
    "CA examination preparation.",
  ),
  defineExam(
    "cs",
    "CS",
    COMPETITIVE,
    "commerce",
    [
      "Business Communication",
      "Legal Aptitude",
      "Economics",
      "Business Environment",
    ],
    "Company Secretary students.",
    "CS examination preparation.",
  ),
  defineExam(
    "cma",
    "CMA",
    COMPETITIVE,
    "commerce",
    ["Accounting", "Economics", "Business Mathematics", "Commercial Laws"],
    "Cost and Management Accountancy students.",
    "CMA examination preparation.",
  ),

  // GOVERNMENT EXAMINATIONS
  defineExam(
    "upsc",
    "UPSC",
    GOVERNMENT,
    "government",
    UPSC_GENERAL,
    "Eligibility depends on the examination.",
    "UPSC recruitment preparation.",
  ),
  defineExam(
    "mpsc",
    "MPSC",
    GOVERNMENT,
    "government",
    MPSC_GENERAL,
    "Maharashtra Public Service Commission aspirants.",
    "Maharashtra government recruitment preparation.",
  ),
  defineExam(
    "ssc",
    "SSC",
    GOVERNMENT,
    "government",
    SSC_GENERAL,
    "Eligibility varies by examination and post.",
    "Staff Selection Commission preparation.",
  ),
  defineExam(
    "ssc-cgl",
    "SSC CGL",
    GOVERNMENT,
    "government",
    [
      "Quantitative Aptitude",
      "General Intelligence and Reasoning",
      "English Language",
      "General Awareness",
      "Computer Knowledge",
    ],
    "Combined Graduate Level applicants.",
    "SSC CGL-specific preparation.",
  ),
  defineExam(
    "ssc-cpo",
    "SSC CPO",
    GOVERNMENT,
    "government",
    [
      "Quantitative Aptitude",
      "General Intelligence and Reasoning",
      "English Language",
      "General Knowledge and General Awareness",
    ],
    "Sub-Inspector recruitment aspirants.",
    "SSC CPO-specific preparation.",
  ),
  defineExam(
    "ssc-chsl",
    "SSC CHSL",
    GOVERNMENT,
    "government",
    [
      "Quantitative Aptitude",
      "General Intelligence",
      "English Language",
      "General Awareness",
      "Computer Knowledge",
    ],
    "Combined Higher Secondary Level applicants.",
    "SSC CHSL-specific preparation.",
  ),
  defineExam(
    "ssc-gd",
    "SSC GD",
    GOVERNMENT,
    "government",
    [
      "Elementary Mathematics",
      "General Intelligence and Reasoning",
      "English",
      "Hindi",
      "General Knowledge and General Awareness",
    ],
    "Constable GD applicants.",
    "SSC GD-specific preparation.",
  ),
  defineExam(
    "banking",
    "Banking",
    GOVERNMENT,
    "government",
    BANKING_GENERAL,
    "Bank recruitment examination aspirants.",
    "Banking examinations preparation.",
  ),
  defineExam(
    "railway",
    "Railway",
    GOVERNMENT,
    "government",
    RAILWAY_GENERAL,
    "Railway recruitment aspirants.",
    "Railway recruitment examination preparation.",
  ),
  defineExam(
    "nda",
    "NDA",
    GOVERNMENT,
    "defence",
    ["Mathematics", "General Ability Test", "English", "General Knowledge"],
    "National Defence Academy applicants.",
    "NDA examination preparation.",
  ),
  defineExam(
    "cds",
    "CDS",
    GOVERNMENT,
    "defence",
    ["English", "General Knowledge", "Elementary Mathematics"],
    "Combined Defence Services applicants.",
    "CDS examination preparation.",
  ),
  defineExam(
    "afcat",
    "AFCAT",
    GOVERNMENT,
    "defence",
    [
      "English",
      "General Awareness",
      "Numerical Ability",
      "Reasoning",
      "Military Aptitude",
    ],
    "Air Force Common Admission Test aspirants.",
    "AFCAT preparation.",
  ),
  defineExam(
    "capf",
    "CAPF",
    GOVERNMENT,
    "defence",
    ["General Ability", "General Studies", "Essay", "Current Affairs"],
    "CAPF Assistant Commandant aspirants.",
    "CAPF examination preparation.",
  ),
  defineExam(
    "ctet-tet",
    "Teaching Exams (CTET/TET)",
    GOVERNMENT,
    "government",
    TEACHING_GENERAL,
    "Teaching eligibility examination aspirants.",
    "Teacher eligibility and recruitment preparation.",
  ),
  defineExam(
    "maharashtra-police-bharti",
    "Maharashtra Police Bharti",
    GOVERNMENT,
    "government",
    [
      "Marathi",
      "General Knowledge",
      "Mathematics",
      "Reasoning",
      "Current Affairs",
    ],
    "Maharashtra Police recruitment applicants.",
    "Maharashtra Police recruitment preparation.",
  ),
  defineExam(
    "maharashtra-state-government",
    "Maharashtra State Government Exams",
    GOVERNMENT,
    "government",
    MAHARASHTRA_GENERAL,
    "Maharashtra government recruitment aspirants.",
    "State recruitment examinations preparation.",
  ),

  // MBA EXAMINATIONS
  defineExam(
    "cat",
    "CAT",
    MBA,
    "management",
    ["VARC", "DILR", "Quantitative Aptitude"],
    "MBA admission aspirants.",
    "CAT preparation.",
  ),
  defineExam(
    "mah-mba-cet",
    "MAH MBA CET",
    MBA,
    "management",
    [
      "Logical Reasoning",
      "Abstract Reasoning",
      "Quantitative Aptitude",
      "Verbal Ability",
      "Reading Comprehension",
    ],
    "Maharashtra MBA/MMS admission aspirants.",
    "MAH MBA CET preparation.",
  ),
  defineExam(
    "xat",
    "XAT",
    MBA,
    "management",
    [
      "Verbal Ability",
      "Decision Making",
      "Quantitative Aptitude",
      "General Knowledge",
    ],
    "XAT admission aspirants.",
    "XAT preparation.",
  ),
  defineExam(
    "snap",
    "SNAP",
    MBA,
    "management",
    [
      "General English",
      "Analytical Reasoning",
      "Quantitative Aptitude",
      "Data Interpretation",
      "Ethics, Morality and Values",
    ],
    "Symbiosis MBA admission aspirants.",
    "SNAP preparation.",
  ),
  defineExam(
    "nmat",
    "NMAT",
    MBA,
    "management",
    ["Language Skills", "Logical Reasoning", "Quantitative Skills"],
    "NMAT admission aspirants.",
    "NMAT preparation.",
  ),
  defineExam(
    "cmat",
    "CMAT",
    MBA,
    "management",
    [
      "Quantitative Technique",
      "Logical Reasoning",
      "Language Comprehension",
      "General Awareness",
      "Innovation and Entrepreneurship",
    ],
    "CMAT admission aspirants.",
    "CMAT preparation.",
  ),
  defineExam(
    "mat",
    "MAT",
    MBA,
    "management",
    [
      "Language Comprehension",
      "Mathematical Skills",
      "Data Analysis",
      "Intelligence and Critical Reasoning",
      "Indian and Global Environment",
    ],
    "MAT admission aspirants.",
    "MAT preparation.",
  ),
  defineExam(
    "atma",
    "ATMA",
    MBA,
    "management",
    ["Analytical Reasoning", "Verbal Skills", "Quantitative Skills"],
    "ATMA admission aspirants.",
    "ATMA preparation.",
  ),
  defineExam(
    "gmat",
    "GMAT",
    MBA,
    "management",
    ["Quantitative Reasoning", "Verbal Reasoning", "Data Insights"],
    "Graduate management admission aspirants.",
    "GMAT preparation.",
  ),
  defineExam(
    "tissnet-cuet-pg",
    "TISS / CUET PG Management Prep",
    MBA,
    "management",
    [
      "English",
      "Quantitative Aptitude",
      "Logical Reasoning",
      "General Awareness",
    ],
    "Relevant postgraduate admission applicants.",
    "Management and social-sector entrance preparation.",
  ),
];

// ============================================================
// INDIVIDUAL EXAM DEFINITIONS
// ============================================================
//
// Each entry uses:
// ID | Display Name | Parent Group
//
// The parent group determines the display category.
// Existing exam records are never replaced.
//
// ============================================================

type ExamDefinition = {
  id: CompetitiveExam;
  title: string;
  parent: CompetitiveExam;
};

const examRows = [
  // SSC — Phase 1
  "ssc-mts|SSC MTS|ssc",
  "ssc-stenographer|SSC Stenographer|ssc",
  "ssc-je|SSC Junior Engineer|ssc",
  "ssc-selection-post|SSC Selection Post|ssc",

  // Banking — Phase 1
  "sbi-po|SBI PO|banking",
  "sbi-clerk|SBI Clerk|banking",
  "ibps-po|IBPS PO|banking",
  "ibps-clerk|IBPS Clerk|banking",
  "ibps-rrb-officer|IBPS RRB Officer Scale I|banking",
  "ibps-rrb-assistant|IBPS RRB Office Assistant|banking",
  "rbi-grade-b|RBI Grade B|banking",
  "rbi-assistant|RBI Assistant|banking",

  // Railway — Phase 1
  "rrb-ntpc|RRB NTPC|railway",
  "rrb-group-d|RRB Group D|railway",
  "rrb-je|RRB Junior Engineer|railway",
  "rrb-alp|RRB Assistant Loco Pilot|railway",
  "rpf-si|RPF Sub-Inspector|railway",
  "rpf-constable|RPF Constable|railway",

  // UPSC — Phase 1
  "upsc-cse|UPSC Civil Services|upsc",
  "upsc-ies|UPSC Engineering Services|upsc",
  "upsc-cms|UPSC Combined Medical Services|upsc",

  // MPSC — Phase 1
  "mpsc-rajyaseva|MPSC Rajyaseva|mpsc",
  "mpsc-group-b|MPSC Group B|mpsc",
  "mpsc-group-c|MPSC Group C|mpsc",

  // Teaching — Phase 1
  "ctet|CTET|ctet-tet",
  "maharashtra-tet|Maharashtra TET|ctet-tet",
  "ugc-net|UGC NET|ctet-tet",
  "csir-net|CSIR UGC NET|ctet-tet",

  // Maharashtra — Phase 1
  "maharashtra-talathi|Maharashtra Talathi|maharashtra-state-government",
  "maharashtra-gramsevak|Maharashtra Gramsevak|maharashtra-state-government",

  // Engineering — Phase 1
  "jee-main|JEE Main|jee",
  "jee-advanced|JEE Advanced|jee",

  // Medical — Phase 1
  "neet-ug|NEET UG|neet",
  "neet-pg|NEET PG|neet",

  // Law — Phase 1
  "clat-ug|CLAT UG|clat",
  "clat-pg|CLAT PG|clat",
  "ailet-ug|AILET UG|ailet",
  "ailet-pg|AILET PG|ailet",

  // Additional SSC
  "ssc-jht|SSC Junior Hindi Translator / Translator|ssc",
  "ssc-delhi-police-constable|SSC Delhi Police Constable|ssc",

  // Additional Banking and Regulatory
  "ibps-so|IBPS Specialist Officer|banking",
  "sbi-so|SBI Specialist Officer|banking",
  "ibps-rrb-scale-ii|IBPS RRB Officer Scale II|banking",
  "ibps-rrb-scale-iii|IBPS RRB Officer Scale III|banking",
  "nabard-grade-a|NABARD Grade A|banking",
  "nabard-grade-b|NABARD Grade B|banking",
  "sebi-grade-a|SEBI Grade A|banking",
  "sidbi-grade-a|SIDBI Grade A|banking",
  "lic-aao|LIC AAO|banking",
  "lic-ado|LIC ADO|banking",
  "niacl-ao|NIACL Administrative Officer|banking",

  // Additional Railways
  "rrb-technician|RRB Technician|railway",
  "rrb-section-controller|RRB Section Controller|railway",
  "rrb-paramedical|RRB Paramedical|railway",
  "rrb-ministerial-isolated|RRB Ministerial and Isolated Categories|railway",
  "rrb-ntpc-graduate|RRB NTPC Graduate|railway",
  "rrb-ntpc-undergraduate|RRB NTPC Undergraduate|railway",

  // Additional UPSC
  "upsc-ifos|UPSC Indian Forest Service|upsc",
  "upsc-economic-service|UPSC Indian Economic Service|upsc",
  "upsc-statistical-service|UPSC Indian Statistical Service|upsc",
  "upsc-geoscientist|UPSC Combined Geo-Scientist|upsc",
  "upsc-epfo-eo-ao|UPSC EPFO EO/AO|upsc",
  "upsc-epfo-apfc|UPSC EPFO APFC|upsc",

  // Additional MPSC and Maharashtra
  "mpsc-engineering|MPSC Engineering Services|mpsc",
  "mpsc-agriculture|MPSC Agriculture Services|mpsc",
  "mpsc-forest|MPSC Forest Services|mpsc",
  "maharashtra-police-si|Maharashtra Police Sub-Inspector|maharashtra-state-government",
  "maharashtra-police-constable|Maharashtra Police Constable|maharashtra-state-government",
  "maharashtra-excise-constable|Maharashtra Excise Constable|maharashtra-state-government",

  // Defence
  "army-agniveer-gd|Army Agniveer General Duty|defence-exams",
  "army-agniveer-technical|Army Agniveer Technical|defence-exams",
  "army-agniveer-clerk|Army Agniveer Clerk / Store Keeper|defence-exams",
  "navy-agniveer-ssr|Navy Agniveer SSR|defence-exams",
  "navy-agniveer-mr|Navy Agniveer MR|defence-exams",
  "airforce-agniveervayu|Air Force Agniveervayu|defence-exams",
  "coast-guard-navik-gd|Coast Guard Navik GD|defence-exams",
  "coast-guard-navik-db|Coast Guard Navik DB|defence-exams",
  "coast-guard-yantrik|Coast Guard Yantrik|defence-exams",

  // Teaching Recruitment
  "kvs-prt|KVS Primary Teacher|ctet-tet",
  "kvs-tgt|KVS Trained Graduate Teacher|ctet-tet",
  "kvs-pgt|KVS Post Graduate Teacher|ctet-tet",
  "nvs-tgt|NVS Trained Graduate Teacher|ctet-tet",
  "nvs-pgt|NVS Post Graduate Teacher|ctet-tet",
  "dsssb-teaching|DSSSB Teaching Recruitment|ctet-tet",
  "emrs-tgt|EMRS Trained Graduate Teacher|ctet-tet",
  "emrs-pgt|EMRS Post Graduate Teacher|ctet-tet",

  // Engineering Entrances
  "bitsat|BITSAT|jee",
  "viteee|VITEEE|jee",
  "srmjeee|SRMJEEE|jee",
  "wbjee|WBJEE|jee",
  "comedk-uget|COMEDK UGET|jee",
  "kcet|KCET|jee",
  "ap-eapcet|AP EAPCET|jee",
  "ts-eapcet|TG EAPCET|jee",

  // Medical and Nursing
  "ini-cet|INI-CET|neet",
  "fmge|FMGE|neet",
  "aiims-bsc-nursing|AIIMS BSc Nursing Entrance|neet",
  "aiims-msc-nursing|AIIMS MSc Nursing Entrance|neet",
  "neet-mds|NEET MDS|neet",

  // Law
  "slat|Symbiosis Law Admission Test|law",
  "mh-law-3-year|MAH LLB CET 3-Year|mht-cet-llb",
  "mh-law-5-year|MAH LLB CET 5-Year|mht-cet-llb",

  // Chartered Accountancy
  "ca-foundation|CA Foundation|ca",
  "ca-intermediate|CA Intermediate|ca",
  "ca-final|CA Final|ca",

  // Company Secretary
  "cseet|CSEET|cs",
  "cs-executive|CS Executive|cs",
  "cs-professional|CS Professional|cs",

  // Cost and Management Accountancy
  "cma-foundation|CMA Foundation|cma",
  "cma-intermediate|CMA Intermediate|cma",
  "cma-final|CMA Final|cma",

  // Other Competitive Entrances
  "cuet-ug|CUET UG|other-entrance",
  "cuet-pg|CUET PG|other-entrance",
  "nift-entrance|NIFT Entrance Examination|other-entrance",
  "nid-dat|NID Design Aptitude Test|other-entrance",
  "uceed|UCEED|other-entrance",
  "ceed|CEED|other-entrance",
  "nata|NATA|other-entrance",
  "ipmat|IPMAT|other-entrance",
  "nimcet|NIMCET|other-entrance",
  "mah-mca-cet|MAH MCA CET|other-entrance",

  // Additional MBA Entrances
  "micat|MICAT|mba-more",
  "ibsat|IBSAT|mba-more",
  "kiitee-management|KIITEE Management|mba-more",
];

// ============================================================
// EXAM-SPECIFIC SUBJECT OVERRIDES
// ============================================================
//
// These are preliminary subject menus, not a certified
// reproduction of every stage of each official examination.
//

const examSubjectOverrides: Partial<Record<CompetitiveExam, string[]>> = {
  "ssc-mts": [
    "Numerical and Mathematical Ability",
    "Reasoning Ability and Problem Solving",
    "General Awareness",
    "English Language",
  ],
  "ssc-stenographer": [
    "General Intelligence and Reasoning",
    "General Awareness",
    "English Language and Comprehension",
  ],
  "ssc-je": [
    "General Intelligence and Reasoning",
    "General Awareness",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
  ],
  "ssc-jht": [
    "General Hindi",
    "General English",
    "Translation",
    "Essay Writing",
  ],

  "sbi-po": [
    "English Language",
    "Quantitative Aptitude",
    "Reasoning Ability",
    "Data Analysis and Interpretation",
    "General and Banking Awareness",
    "Descriptive English",
  ],
  "sbi-clerk": [
    "English Language",
    "Numerical Ability",
    "Reasoning Ability",
    "General and Financial Awareness",
  ],
  "ibps-po": [
    "English Language",
    "Quantitative Aptitude",
    "Reasoning Ability",
    "Data Analysis and Interpretation",
    "General and Banking Awareness",
  ],
  "ibps-clerk": [
    "English Language",
    "Numerical Ability",
    "Reasoning Ability",
    "General and Financial Awareness",
  ],
  "rbi-grade-b": [
    "General Awareness",
    "Quantitative Aptitude",
    "Reasoning",
    "English",
    "Economic and Social Issues",
    "Finance and Management",
  ],
  "nabard-grade-a": [
    "Reasoning",
    "English",
    "Computer Knowledge",
    "Quantitative Aptitude",
    "General Awareness",
    "Economic and Social Issues",
    "Agriculture and Rural Development",
  ],
  "sebi-grade-a": [
    "General Awareness",
    "English Language",
    "Quantitative Aptitude",
    "Reasoning",
    "Commerce and Accountancy",
    "Economics",
    "Finance",
    "Management",
  ],

  "rrb-alp": [
    "Mathematics",
    "Mental Ability",
    "General Science",
    "General Awareness",
    "Basic Science and Engineering",
    "Trade Knowledge",
  ],
  "rrb-je": [
    "Mathematics",
    "General Intelligence and Reasoning",
    "General Awareness",
    "General Science",
    "Technical Ability",
  ],
  "rrb-technician": [
    "Mathematics",
    "General Intelligence and Reasoning",
    "General Science",
    "General Awareness",
    "Computer Applications",
  ],
  "rrb-ntpc": RAILWAY_GENERAL,

  "upsc-ies": [
    "General Studies",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Electronics and Telecommunication Engineering",
  ],
  "upsc-cms": [
    "General Medicine",
    "Paediatrics",
    "Surgery",
    "Gynaecology and Obstetrics",
    "Preventive and Social Medicine",
  ],
  "upsc-economic-service": [
    "General English",
    "General Studies",
    "General Economics",
    "Indian Economics",
  ],
  "upsc-statistical-service": [
    "General English",
    "General Studies",
    "Statistics",
    "Probability",
    "Statistical Inference",
  ],

  ctet: [
    "Child Development and Pedagogy",
    "Language I",
    "Language II",
    "Mathematics",
    "Environmental Studies",
    "Science",
    "Social Studies",
  ],
  "maharashtra-tet": [
    "Child Development and Pedagogy",
    "Language I",
    "Language II",
    "Mathematics",
    "Environmental Studies",
    "Science",
    "Social Studies",
  ],
  "ugc-net": [
    "Teaching Aptitude",
    "Research Aptitude",
    "Comprehension",
    "Communication",
    "Reasoning",
    "Data Interpretation",
    "Information and Communication Technology",
    "People and Environment",
    "Higher Education System",
    "Subject Knowledge",
  ],
  "csir-net": [
    "General Aptitude",
    "Life Sciences",
    "Chemical Sciences",
    "Physical Sciences",
    "Mathematical Sciences",
    "Earth Sciences",
  ],

  "jee-main": SCIENCE,
  "jee-advanced": SCIENCE,
  "neet-ug": MEDICAL,
  "neet-pg": [
    "Anatomy",
    "Physiology",
    "Biochemistry",
    "Pathology",
    "Pharmacology",
    "Microbiology",
    "Medicine",
    "Surgery",
    "Obstetrics and Gynaecology",
    "Community Medicine",
  ],
  "neet-mds": [
    "Dental Anatomy",
    "Oral Pathology",
    "Oral Medicine",
    "Oral Surgery",
    "Periodontology",
    "Orthodontics",
    "Prosthodontics",
    "Conservative Dentistry",
    "Pedodontics",
  ],
  fmge: [
    "Anatomy",
    "Physiology",
    "Biochemistry",
    "Pathology",
    "Pharmacology",
    "Microbiology",
    "Medicine",
    "Surgery",
    "Community Medicine",
  ],

  "clat-ug": LAW_GENERAL,
  "clat-pg": [
    "Constitutional Law",
    "Jurisprudence",
    "Contract Law",
    "Criminal Law",
    "Administrative Law",
    "Family Law",
  ],
  "ailet-ug": [
    "English Language",
    "Current Affairs",
    "General Knowledge",
    "Logical Reasoning",
  ],
  "ailet-pg": [
    "Constitutional Law",
    "Jurisprudence",
    "Contract Law",
    "Criminal Law",
    "International Law",
  ],

  "ca-foundation": [
    "Accounting",
    "Business Laws",
    "Quantitative Aptitude",
    "Business Economics",
  ],
  cseet: [
    "Business Communication",
    "Fundamentals of Accounting",
    "Economic and Business Environment",
    "Business Laws and Management",
  ],
  "cma-foundation": [
    "Business Laws and Business Communication",
    "Financial and Cost Accounting",
    "Business Mathematics and Statistics",
    "Business Economics and Management",
  ],
};

// ============================================================
// GROUP REGISTRY
// ============================================================
//
// The existing client uses these functions to show:
// Category -> Group -> Individual Exam -> Subject.
//
// Do not rename these exported functions.
// ============================================================

export const quizExamGroups: Partial<
  Record<CompetitiveExam, CompetitiveExam[]>
> = {
  ssc: ["ssc-cgl", "ssc-cpo", "ssc-chsl", "ssc-gd"],
  banking: [],
  railway: [],
  upsc: [],
  mpsc: [],
  "ctet-tet": [],
  "maharashtra-state-government": [],
  jee: [],
  neet: [],
  clat: [],
  ailet: [],
  law: [],
  "mht-cet-llb": [],
  ca: [],
  cs: [],
  cma: [],
  "defence-exams": ["nda", "cds", "afcat", "capf"],
  "other-entrance": [],
  "mba-more": [],
};

// Three additional groups.

const additionalRoots: Array<{
  id: CompetitiveExam;
  title: string;
  category: EducationLevel;
  stream: Stream;
  subjects: string[];
}> = [
  {
    id: "defence-exams",
    title: "Defence Recruitment Exams",
    category: GOVERNMENT,
    stream: "defence",
    subjects: DEFENCE_GENERAL,
  },
  {
    id: "other-entrance",
    title: "Other Entrance Examinations",
    category: COMPETITIVE,
    stream: "school",
    subjects: ["General Aptitude", "English", "Reasoning"],
  },
  {
    id: "mba-more",
    title: "Additional MBA Entrance Exams",
    category: MBA,
    stream: "management",
    subjects: MBA_GENERAL,
  },
];

for (const root of additionalRoots) {
  if (!competitiveExams.some((exam) => exam.id === root.id)) {
    competitiveExams.push(
      defineExam(
        root.id,
        root.title,
        root.category,
        root.stream,
        root.subjects,
        "Eligibility depends on the selected examination.",
        "Choose an individual examination.",
      ),
    );
  }
}

// Parse and register all individual exams.

const examDefinitions: ExamDefinition[] = examRows.map((row) => {
  const [id, title, parent] = row.split("|");

  return {
    id: id as CompetitiveExam,
    title,
    parent: parent as CompetitiveExam,
  };
});

for (const definition of examDefinitions) {
  const parent = competitiveExams.find((exam) => exam.id === definition.parent);

  if (!parent) {
    throw new Error(`Quiz Arena parent missing: ${definition.parent}`);
  }

  const existing = competitiveExams.find((exam) => exam.id === definition.id);

  if (!existing) {
    competitiveExams.push(
      defineExam(
        definition.id,
        definition.title,
        parent.category,
        parent.stream,
        examSubjectOverrides[definition.id] ?? parent.subjects,
        `Check official eligibility for ${definition.title}.`,
        `Individual exam preparation for ${definition.title}.`,
      ),
    );
  }

  const children = quizExamGroups[definition.parent];

  if (!children) {
    throw new Error(`Quiz Arena group missing: ${definition.parent}`);
  }

  if (!children.includes(definition.id)) {
    children.push(definition.id);
  }
}

// ============================================================
// GROUP HELPER FUNCTIONS
// ============================================================

export function isQuizExamGroup(exam: CompetitiveExam): boolean {
  return Object.prototype.hasOwnProperty.call(quizExamGroups, exam);
}

export function getQuizExamGroupChildren(
  group: CompetitiveExam,
): CompetitiveExam[] {
  return quizExamGroups[group] ?? [];
}

export function getQuizExamParent(
  exam: CompetitiveExam,
): CompetitiveExam | null {
  for (const [parent, children] of Object.entries(quizExamGroups)) {
    if (children.includes(exam)) {
      return parent as CompetitiveExam;
    }
  }

  return null;
}

// ============================================================
// DIFFICULTY OPTIONS
// ============================================================

export const difficultyOptions: DifficultyOption[] = [
  {
    id: "easy",
    title: "Easy",
    questions: 10,
    description: "Warm up and build confidence",
    icon: "🌱",
  },
  {
    id: "medium",
    title: "Medium",
    questions: 10,
    description: "Test your preparation level",
    icon: "⚡",
  },
  {
    id: "hard",
    title: "Hard",
    questions: 10,
    description: "Take the serious exam challenge",
    icon: "🔥",
  },
];

// ============================================================
// LOOKUP HELPERS
// ============================================================

export function getLevelTitle(level: EducationLevel | null): string {
  return levelOptions.find((option) => option.id === level)?.title ?? "";
}

export function getExamTitle(exam: CompetitiveExam | null): string {
  return competitiveExams.find((option) => option.id === exam)?.title ?? "";
}

export function getExamDetails(
  exam: CompetitiveExam | null,
): ExamOption | undefined {
  return competitiveExams.find((option) => option.id === exam);
}

export function getExamsByCategory(
  category: EducationLevel | null,
): ExamOption[] {
  if (!category) return [];

  return competitiveExams.filter((exam) => exam.category === category);
}
