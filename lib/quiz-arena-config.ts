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
  | "class-6-8"
  | "class-9-10"
  | "class-11-12-science"
  | "class-11-12-commerce"
  | "class-11-12-arts"
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
  | "upsc"
  | "mpsc"
  | "ssc"
  | "banking"
  | "railway"
  | "nda"
  | "cds"
  | "afcat"
  | "capf"
  | "ctet-tet"
  | "maharashtra-police-bharti"
  | "maharashtra-state-government"
  | "cat"
  | "mah-mba-cet"
  | "xat"
  | "snap"
  | "nmat"
  | "cmat"
  | "mat"
  | "atma"
  | "gmat"
  | "tissnet-cuet-pg";

export type Difficulty = "easy" | "medium" | "hard";

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

export const levelOptions: LevelOption[] = [
  {
    id: "school-junior-college",
    title: "School & Junior College Courses",
    subtitle: "6th to 12th • Boards & Streams",
    description:
      "State Board, CBSE, ICSE, IGCSE, IB, Science, Commerce and Arts.",
    icon: "📘",
  },
  {
    id: "competitive-exam",
    title: "Top Competitive Exam Courses",
    subtitle: "Engineering, Medical, Law, Hotel, CA/CS/CMA",
    description:
      "JEE, NEET, CET, Olympiads, SAT, IELTS, TOEFL, IMU-CET, NCHMCT-JEE, CLAT, AILET, LAW, CA, CS, CMA and MHT CET LLB.",
    icon: "🎯",
  },
  {
    id: "government-exam",
    title: "Top Government Exam Courses",
    subtitle: "UPSC, MPSC, SSC, Banking, Defence",
    description:
      "UPSC, MPSC, SSC, Banking, Railway, NDA, CDS, AFCAT, CAPF, Teaching Exams and Maharashtra State Government Exams.",
    icon: "🏛️",
  },
  {
    id: "mba-entrance",
    title: "MBA Entrance Exams",
    subtitle: "CAT, CET, XAT, SNAP, NMAT and more",
    description:
      "CAT, MAH MBA CET, XAT, SNAP, NMAT, CMAT, MAT, ATMA, GMAT and other popular MBA entrance exams.",
    icon: "📊",
  },
];

export const competitiveExams: ExamOption[] = [
  {
    id: "class-6-8",
    title: "6th to 8th",
    category: "school-junior-college",
    stream: "school",
    eligibility:
      "Students studying in Classes 6, 7 or 8 from State Board, CBSE, ICSE, IGCSE or IB.",
    trendNote: "Best for foundation building and Olympiad-style basics.",
    subjects: [
      "Mathematics",
      "Science",
      "English",
      "Social Science",
      "Computer Basics",
      "General Knowledge",
    ],
  },
  {
    id: "class-9-10",
    title: "9th to 10th",
    category: "school-junior-college",
    stream: "school",
    eligibility:
      "Students studying in Classes 9 or 10 from State Board, CBSE, ICSE, IGCSE or IB.",
    trendNote: "Best for board preparation and concept strengthening.",
    subjects: [
      "Mathematics",
      "Science",
      "English",
      "Social Science",
      "Computer Science",
      "General Knowledge",
    ],
  },
  {
    id: "class-11-12-science",
    title: "11th to 12th Science",
    category: "school-junior-college",
    stream: "science",
    eligibility:
      "Class 11–12 Science students preparing for boards, CET, JEE, NEET or foundation tests.",
    trendNote: "Best for PCM/PCB students targeting boards plus entrance exams.",
    subjects: [
      "Physics",
      "Chemistry",
      "Mathematics",
      "Biology",
      "English",
      "Computer Science",
    ],
  },
  {
    id: "class-11-12-commerce",
    title: "11th to 12th Commerce",
    category: "school-junior-college",
    stream: "commerce",
    eligibility:
      "Class 11–12 Commerce students preparing for boards, CA foundation, CS foundation or business courses.",
    trendNote:
      "Best for accounts, business, economics and finance-oriented students.",
    subjects: [
      "Accountancy",
      "Business Studies",
      "Economics",
      "Mathematics",
      "English",
    ],
  },
  {
    id: "class-11-12-arts",
    title: "11th to 12th Arts",
    category: "school-junior-college",
    stream: "arts",
    eligibility:
      "Class 11–12 Arts/Humanities students preparing for boards, law, UPSC foundation or social science paths.",
    trendNote:
      "Best for humanities, law, civil services and communication-oriented students.",
    subjects: [
      "History",
      "Political Science",
      "Geography",
      "Economics",
      "English",
      "Sociology",
    ],
  },

  {
    id: "jee",
    title: "JEE",
    category: "competitive-exam",
    stream: "engineering",
    eligibility:
      "Class 11–12 Science students with Physics, Chemistry and Mathematics.",
    trendNote: "Best for engineering aspirants.",
    subjects: ["Physics", "Chemistry", "Mathematics"],
  },
  {
    id: "neet",
    title: "NEET",
    category: "competitive-exam",
    stream: "medical",
    eligibility:
      "Class 11–12 Science students with Physics, Chemistry and Biology.",
    trendNote: "Best for medical aspirants.",
    subjects: ["Physics", "Chemistry", "Biology"],
  },
  {
    id: "mht-cet",
    title: "CET",
    category: "competitive-exam",
    stream: "science",
    eligibility:
      "Class 11–12 Science students, usually PCM or PCB depending on course.",
    trendNote: "Important for Maharashtra professional courses.",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
  },
  {
    id: "olympiads",
    title: "Olympiads",
    category: "competitive-exam",
    stream: "school",
    eligibility: "School students from different classes depending on Olympiad type.",
    trendNote: "Best for concept depth, speed and academic confidence.",
    subjects: [
      "Mathematics",
      "Science",
      "English",
      "Logical Reasoning",
      "General Knowledge",
    ],
  },
  {
    id: "sat",
    title: "SAT",
    category: "competitive-exam",
    stream: "school",
    eligibility:
      "Students aiming for undergraduate admissions abroad or selected Indian universities.",
    trendNote: "Useful for global admissions profile building.",
    subjects: ["Reading and Writing", "Mathematics"],
  },
  {
    id: "ielts",
    title: "IELTS",
    category: "competitive-exam",
    stream: "school",
    eligibility: "Students or professionals planning study, work or migration abroad.",
    trendNote: "Useful for English proficiency requirements.",
    subjects: ["Listening", "Reading", "Writing", "Speaking", "Vocabulary", "Grammar"],
  },
  {
    id: "toefl",
    title: "TOEFL",
    category: "competitive-exam",
    stream: "school",
    eligibility: "Students planning international education where TOEFL is accepted.",
    trendNote: "Useful for English academic communication.",
    subjects: ["Reading", "Listening", "Speaking", "Writing"],
  },
  {
    id: "imu-cet",
    title: "IMU-CET",
    category: "competitive-exam",
    stream: "science",
    eligibility: "Students aiming for maritime and marine-related undergraduate courses.",
    trendNote: "Best for merchant navy and maritime career aspirants.",
    subjects: ["Physics", "Chemistry", "Mathematics", "English", "General Aptitude"],
  },
  {
    id: "nchmct-jee",
    title: "NCHMCT-JEE",
    category: "competitive-exam",
    stream: "management",
    eligibility: "Students aiming for hotel management and hospitality courses.",
    trendNote: "Best for hospitality and hotel management aspirants.",
    subjects: [
      "Numerical Ability",
      "Reasoning",
      "English",
      "General Knowledge",
      "Service Aptitude",
    ],
  },
  {
    id: "clat",
    title: "CLAT",
    category: "competitive-exam",
    stream: "law",
    eligibility:
      "Class 12 students or graduates depending on UG/PG law admission.",
    trendNote: "Top law entrance pathway.",
    subjects: [
      "English",
      "Current Affairs",
      "Legal Reasoning",
      "Logical Reasoning",
      "Quantitative Techniques",
    ],
  },
  {
    id: "ailet",
    title: "AILET",
    category: "competitive-exam",
    stream: "law",
    eligibility: "Students targeting National Law University Delhi.",
    trendNote: "Important for top law aspirants.",
    subjects: ["English", "Current Affairs", "Legal Reasoning", "Logical Reasoning"],
  },
  {
    id: "law",
    title: "LAW Entrance",
    category: "competitive-exam",
    stream: "law",
    eligibility:
      "Students interested in law entrance exams after Class 12 or graduation.",
    trendNote: "Good for general law entrance preparation.",
    subjects: [
      "Legal Aptitude",
      "English",
      "Current Affairs",
      "Logical Reasoning",
      "General Knowledge",
    ],
  },
  {
    id: "mht-cet-llb",
    title: "MHT CET LLB",
    category: "competitive-exam",
    stream: "law",
    eligibility:
      "Students preparing for Maharashtra 3-year or 5-year LLB admission.",
    trendNote: "Important for Maharashtra law admissions.",
    subjects: [
      "Legal Aptitude",
      "General Knowledge",
      "Logical Reasoning",
      "English",
      "Basic Mathematics",
    ],
  },
  {
    id: "ca",
    title: "CA",
    category: "competitive-exam",
    stream: "commerce",
    eligibility:
      "Commerce students or graduates preparing for CA Foundation/Intermediate path.",
    trendNote: "Best for accounting, audit and finance careers.",
    subjects: ["Accounting", "Business Laws", "Economics", "Quantitative Aptitude"],
  },
  {
    id: "cs",
    title: "CS",
    category: "competitive-exam",
    stream: "commerce",
    eligibility:
      "Students interested in company law, compliance and corporate governance.",
    trendNote: "Best for legal-compliance and corporate governance careers.",
    subjects: [
      "Business Communication",
      "Legal Aptitude",
      "Economics",
      "Business Environment",
    ],
  },
  {
    id: "cma",
    title: "CMA",
    category: "competitive-exam",
    stream: "commerce",
    eligibility:
      "Students interested in cost accounting, finance and management accounting.",
    trendNote: "Best for cost accounting and financial management careers.",
    subjects: ["Accounting", "Economics", "Business Mathematics", "Commercial Laws"],
  },

  {
    id: "upsc",
    title: "UPSC",
    category: "government-exam",
    stream: "government",
    eligibility: "Graduates from any stream can generally prepare for civil services.",
    trendNote: "Best for national civil services aspirants.",
    subjects: [
      "History",
      "Geography",
      "Polity",
      "Economics",
      "Environment",
      "Current Affairs",
      "CSAT",
    ],
  },
  {
    id: "mpsc",
    title: "MPSC",
    category: "government-exam",
    stream: "government",
    eligibility:
      "Graduates from any stream can generally prepare for Maharashtra civil services.",
    trendNote: "Best for Maharashtra state services aspirants.",
    subjects: [
      "Maharashtra GK",
      "History",
      "Geography",
      "Polity",
      "Economics",
      "Current Affairs",
      "CSAT",
    ],
  },
  {
    id: "ssc",
    title: "SSC",
    category: "government-exam",
    stream: "government",
    eligibility:
      "Eligibility varies by post; many exams are open to 10th, 12th or graduates.",
    trendNote: "Popular for central government jobs.",
    subjects: ["Quantitative Aptitude", "Reasoning", "English", "General Awareness"],
  },
  {
    id: "banking",
    title: "Banking",
    category: "government-exam",
    stream: "government",
    eligibility: "Usually graduates from any stream, depending on the banking exam.",
    trendNote: "Popular for bank PO, clerk and officer roles.",
    subjects: [
      "Quantitative Aptitude",
      "Reasoning",
      "English",
      "Banking Awareness",
      "Computer Knowledge",
    ],
  },
  {
    id: "railway",
    title: "Railway",
    category: "government-exam",
    stream: "government",
    eligibility:
      "Eligibility varies by post; many railway exams accept 10th, 12th, ITI, diploma or graduates.",
    trendNote: "Popular for technical and non-technical government railway posts.",
    subjects: ["Mathematics", "Reasoning", "General Awareness", "General Science"],
  },
  {
    id: "nda",
    title: "NDA",
    category: "government-exam",
    stream: "defence",
    eligibility:
      "Class 12 students; Air Force and Navy generally require Physics and Mathematics.",
    trendNote: "Best for defence aspirants after Class 12.",
    subjects: ["Mathematics", "General Ability Test", "English", "General Knowledge"],
  },
  {
    id: "cds",
    title: "CDS",
    category: "government-exam",
    stream: "defence",
    eligibility: "Graduates; technical branches may need specific qualifications.",
    trendNote: "Best for graduate defence aspirants.",
    subjects: ["English", "General Knowledge", "Elementary Mathematics"],
  },
  {
    id: "afcat",
    title: "AFCAT",
    category: "government-exam",
    stream: "defence",
    eligibility:
      "Graduates; flying/technical branches may require specific subjects and eligibility.",
    trendNote: "Best for Indian Air Force officer aspirants.",
    subjects: [
      "English",
      "General Awareness",
      "Numerical Ability",
      "Reasoning",
      "Military Aptitude",
    ],
  },
  {
    id: "capf",
    title: "CAPF",
    category: "government-exam",
    stream: "defence",
    eligibility:
      "Graduates from any stream can generally prepare for CAPF Assistant Commandant.",
    trendNote: "Best for paramilitary officer aspirants.",
    subjects: ["General Ability", "General Studies", "Essay", "Current Affairs"],
  },
  {
    id: "ctet-tet",
    title: "Teaching Exams (CTET/TET)",
    category: "government-exam",
    stream: "government",
    eligibility:
      "Teacher eligibility depends on class level and required teaching qualification.",
    trendNote: "Best for teaching career aspirants.",
    subjects: [
      "Child Development",
      "Pedagogy",
      "Mathematics",
      "Environmental Studies",
      "Language",
    ],
  },
  {
    id: "maharashtra-police-bharti",
    title: "Maharashtra Police Bharti",
    category: "government-exam",
    stream: "government",
    eligibility:
      "Eligibility depends on Maharashtra police recruitment post and official notification.",
    trendNote: "Popular Maharashtra state recruitment exam.",
    subjects: ["Marathi", "General Knowledge", "Mathematics", "Reasoning", "Current Affairs"],
  },
  {
    id: "maharashtra-state-government",
    title: "Maharashtra State Government Exams",
    category: "government-exam",
    stream: "government",
    eligibility: "Eligibility varies by department and post.",
    trendNote: "Best for Maharashtra state-level government exam preparation.",
    subjects: [
      "Marathi",
      "English",
      "General Knowledge",
      "Reasoning",
      "Mathematics",
      "Current Affairs",
    ],
  },

  {
    id: "cat",
    title: "CAT",
    category: "mba-entrance",
    stream: "management",
    eligibility: "Graduates and final-year students usually prepare for CAT.",
    trendNote: "Top MBA entrance for IIMs and many leading B-schools.",
    subjects: ["VARC", "DILR", "Quantitative Aptitude"],
  },
  {
    id: "mah-mba-cet",
    title: "MAH MBA CET",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Graduates and final-year students targeting MBA/MMS colleges in Maharashtra.",
    trendNote: "Important for Maharashtra MBA/MMS admissions.",
    subjects: [
      "Logical Reasoning",
      "Abstract Reasoning",
      "Quantitative Aptitude",
      "Verbal Ability",
      "Reading Comprehension",
    ],
  },
  {
    id: "xat",
    title: "XAT",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Graduates and final-year students targeting XLRI and other XAT-accepting institutes.",
    trendNote: "Known for decision-making and management aptitude.",
    subjects: [
      "Verbal Ability",
      "Decision Making",
      "Quantitative Aptitude",
      "General Knowledge",
    ],
  },
  {
    id: "snap",
    title: "SNAP",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Graduates and final-year students targeting Symbiosis institutes.",
    trendNote: "Popular for Symbiosis MBA admissions.",
    subjects: [
      "General English",
      "Analytical Reasoning",
      "Quantitative Aptitude",
      "Data Interpretation",
    ],
  },
  {
    id: "nmat",
    title: "NMAT",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Graduates and final-year students targeting NMIMS and other NMAT-accepting institutes.",
    trendNote: "Known for speed, adaptive style and multiple-attempt strategy.",
    subjects: ["Language Skills", "Logical Reasoning", "Quantitative Skills"],
  },
  {
    id: "cmat",
    title: "CMAT",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Graduates and final-year students targeting AICTE-approved management institutes.",
    trendNote: "Popular national-level MBA entrance option.",
    subjects: [
      "Quantitative Technique",
      "Logical Reasoning",
      "Language Comprehension",
      "General Awareness",
      "Innovation and Entrepreneurship",
    ],
  },
  {
    id: "mat",
    title: "MAT",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Graduates and final-year students targeting MAT-accepting B-schools.",
    trendNote: "Popular because it is conducted multiple times a year.",
    subjects: [
      "Language Comprehension",
      "Mathematical Skills",
      "Data Analysis",
      "Intelligence and Critical Reasoning",
      "Indian and Global Environment",
    ],
  },
  {
    id: "atma",
    title: "ATMA",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Graduates and final-year students targeting ATMA-accepting management institutes.",
    trendNote: "Useful additional MBA entrance option.",
    subjects: ["Analytical Reasoning", "Verbal Skills", "Quantitative Skills"],
  },
  {
    id: "gmat",
    title: "GMAT",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Students and professionals targeting selected Indian and global business schools.",
    trendNote: "Useful for global MBA and some Indian B-school admissions.",
    subjects: ["Quantitative Reasoning", "Verbal Reasoning", "Data Insights"],
  },
  {
    id: "tissnet-cuet-pg",
    title: "TISS / CUET PG Management Prep",
    category: "mba-entrance",
    stream: "management",
    eligibility:
      "Graduates targeting selected postgraduate management or social-sector programmes.",
    trendNote: "Good additional option for management and social-sector aspirants.",
    subjects: ["English", "Quantitative Aptitude", "Logical Reasoning", "General Awareness"],
  },
];

export const difficultyOptions: DifficultyOption[] = [
  {
    id: "easy",
    title: "Easy",
    questions: 5,
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
    questions: 15,
    description: "Take the serious exam challenge",
    icon: "🔥",
  },
];

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