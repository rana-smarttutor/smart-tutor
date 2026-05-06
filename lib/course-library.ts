import type { CourseItem } from "@/lib/types";

export const DEFAULT_COURSE_TEMPLATE_KEY = "class-6-8-complete";

export const courseLibrary = [
  {
    standardKey: "class-1-5-foundation",
    title: "Class 1 to 5 Foundation Program",
    tagline: "Primary Learning Base",
    schedule: "Mon to Fri | Early and after-school batches",
    summary: "A structured primary-school program for class 1 to 5 students who need habit-building, concept clarity, and close academic support.",
    description:
      "This primary foundation track builds reading, writing, numeracy, and study discipline through small-batch coaching, guided practice, and regular parent updates so younger learners develop confidence before middle school.",
    duration: "Full academic year",
    mode: "Offline classroom with guided home practice",
    audienceLabel: "Class 1 to 5 students",
    courseNamesIncluded: [
      "Class 1 Early Learning Support",
      "Class 2 Skill Builder Batch",
      "Class 3 Core Subjects Support",
      "Class 4 Progress Batch",
      "Class 5 Foundation Strength Batch",
    ],
    branchesIncluded: ["Primary School Coaching", "Homework Support", "Reading and Writing Development"],
    subjectsCovered: ["Mathematics", "English", "EVS", "Reading Skills", "Writing Practice"],
    points: [
      "Concept teaching designed for younger learners with repetition and guided revision",
      "Homework support and parent communication to maintain daily discipline",
      "Assessment checkpoints that focus on confidence, comprehension, and improvement",
    ],
    audience: ["student", "educator", "admin"],
  },
  {
    standardKey: "class-6-8-complete",
    title: "Class 6 to 8 Complete Foundation",
    tagline: "Middle School Growth",
    schedule: "Mon to Fri | After-school batches",
    summary: "One structured program for class 6, 7, and 8 learners who need strong basics, discipline, and regular testing.",
    description:
      "This grouped school program supports class 6 to 8 students with daily concept teaching, worksheet follow-up, revision cycles, and parent communication so the academic base stays strong before secondary school.",
    duration: "Full academic year",
    mode: "Offline classroom with guided homework support",
    audienceLabel: "Class 6, 7, and 8 students",
    courseNamesIncluded: [
      "Class 6 Academic Support",
      "Class 7 Concept Builder",
      "Class 8 School Excellence Batch",
    ],
    branchesIncluded: ["General School Coaching", "Foundation Learning", "Olympiad Readiness Support"],
    subjectsCovered: ["Mathematics", "Science", "English", "Social Studies"],
    points: [
      "Daily concept teaching with notebook and worksheet practice",
      "Homework tracking and doubt-clearing support",
      "Monthly assessments with parent performance updates",
    ],
    audience: ["student", "educator", "admin"],
  },
  {
    standardKey: "class-9-10-complete",
    title: "Class 9 and 10 Board Preparation",
    tagline: "Secondary Board Focus",
    schedule: "Mon to Sat | Core academic batches",
    summary: "One combined secondary-school ladder for class 9 and class 10 students preparing for school exams and board performance.",
    description:
      "This grouped track helps students move from class 9 concept strength into class 10 board readiness with timed papers, revision plans, and careful subject-by-subject performance review.",
    duration: "Academic year plus board revision phase",
    mode: "Offline classroom with tests and paper discussion",
    audienceLabel: "Class 9 and 10 students",
    courseNamesIncluded: [
      "Class 9 Academic Strength Batch",
      "Class 10 Board Score Batch",
      "Board Revision Crash Support",
    ],
    branchesIncluded: ["School Coaching", "Board Examination Support", "Scholarship Readiness"],
    subjectsCovered: ["Mathematics", "Science", "English", "Social Studies"],
    points: [
      "Chapter-wise completion and unit test planning",
      "Prelim paper solving and answer-writing guidance",
      "Revision structure for stronger board confidence",
    ],
    audience: ["student", "educator", "admin"],
  },
  {
    standardKey: "class-11-12-complete",
    title: "Senior Secondary and Junior College Support",
    tagline: "11th, 12th, and JC Success",
    schedule: "Morning, afternoon, and evening stream batches",
    summary: "One grouped higher-secondary track for class 11, class 12, and junior college learners across commerce, science, and arts study plans.",
    description:
      "This program supports senior secondary and junior college learners through stream-wise academic coaching, board preparation, doubt sessions, and disciplined tests across commerce, science, and arts subjects.",
    duration: "Academic year and revision formats",
    mode: "Offline concept classes with stream-wise mentoring",
    audienceLabel: "Class 11, 12, and junior college students",
    courseNamesIncluded: [
      "Class 11 Commerce Batch",
      "Class 11 Science Batch",
      "Class 11 Arts and Humanities Batch",
      "Class 12 Commerce Board Batch",
      "Class 12 Science Board Batch",
      "Class 12 Arts and Humanities Board Batch",
      "Junior College Commerce Batch",
      "Junior College Science Batch",
    ],
    branchesIncluded: ["Commerce", "Science", "Arts and Humanities", "Junior College", "Board Preparation"],
    subjectsCovered: [
      "Accounts",
      "Economics",
      "Business Studies",
      "Physics",
      "Chemistry",
      "Biology",
      "Mathematics",
      "History",
      "Political Science",
      "Sociology",
    ],
    points: [
      "Stream-based concept teaching and board planning",
      "Weekly testing with chapter and paper review",
      "Mentor guidance for consistency, junior college workload, and score improvement",
    ],
    audience: ["student", "educator", "admin"],
  },
  {
    standardKey: "diploma-graduation-support",
    title: "Diploma, Polytechnic, and Graduation Support",
    tagline: "College and Career Support",
    schedule: "Flexible weekday and weekend batches",
    summary: "One combined support track for diploma, polytechnic, and graduation learners who need academic reinforcement and skill readiness.",
    description:
      "This program is designed for diploma, polytechnic, and degree-college learners who need help with semester preparation, technical understanding, communication, aptitude, and progression into jobs or higher studies.",
    duration: "Semester-based and fast-track support",
    mode: "Hybrid mentoring with classroom problem-solving",
    audienceLabel: "Diploma, polytechnic, and graduation students",
    courseNamesIncluded: [
      "Diploma Semester Support",
      "Polytechnic Subject Support",
      "B.Com Academic Support",
      "B.Sc Concept Support",
      "B.A. and Arts Academic Support",
      "BMS and Management Support",
      "Graduation Skill and Aptitude Support",
    ],
    branchesIncluded: ["Diploma", "Polytechnic", "Commerce", "Science", "Arts", "Management", "Career Skills"],
    subjectsCovered: [
      "Semester Subjects",
      "Technical Problem Solving",
      "Aptitude",
      "Spoken English",
      "Presentation Skills",
      "Interview Readiness",
    ],
    points: [
      "Semester and assignment support with structured mentoring",
      "Aptitude and communication development for progression",
      "Bridging support for placements and higher education planning",
    ],
    audience: ["student", "educator", "admin"],
  },
  {
    standardKey: "entrance-exam-preparation",
    title: "Entrance Exam Preparation",
    tagline: "Career Entrance Focus",
    schedule: "Weekday and weekend target batches",
    summary: "A focused entrance-preparation track for students targeting engineering, medical, college, and state-level admission exams.",
    description:
      "This entrance track supports aspirants preparing for JEE, NEET, MHT-CET, CUET, and related entrance pathways through concept classes, timed practice, doubt sessions, and exam-strategy reviews.",
    duration: "Long-term and crash-course formats",
    mode: "Offline classroom with mock tests and mentoring",
    audienceLabel: "Entrance exam aspirants",
    courseNamesIncluded: [
      "JEE Foundation Batch",
      "NEET Preparation Batch",
      "MHT-CET Target Batch",
      "CUET Readiness Batch",
      "Engineering and Medical Entrance Crash Support",
    ],
    branchesIncluded: ["Engineering Entrance", "Medical Entrance", "Central University Entrance", "State CET"],
    subjectsCovered: ["Physics", "Chemistry", "Biology", "Mathematics", "Aptitude", "Mock Test Strategy"],
    points: [
      "Targeted entrance preparation with syllabus planning and test discipline",
      "Mock paper analysis with speed, accuracy, and concept correction",
      "Mentor tracking for serious exam preparation across long-term and crash formats",
    ],
    audience: ["student", "educator", "admin"],
  },
  {
    standardKey: "government-exam-preparation",
    title: "Government Exam Preparation",
    tagline: "Competitive Career Track",
    schedule: "Morning, evening, and weekend batches",
    summary: "A complete government-exam ladder covering banking, SSC, railway, and civil-services preparation under one umbrella.",
    description:
      "This grouped competitive track serves aspirants preparing for banking, SSC, railway, and long-term civil-services pathways with test practice, current affairs, reasoning, and faculty review.",
    duration: "Fast-track, long-term, and mains-focused formats",
    mode: "Offline classroom + mock test + mentoring review",
    audienceLabel: "Government exam aspirants",
    courseNamesIncluded: [
      "Banking Exams Batch",
      "SSC Competitive Batch",
      "Railway Recruitment Batch",
      "UPSC Foundation Batch",
      "State PSC Support Batch",
    ],
    branchesIncluded: ["Banking", "SSC", "Railway", "UPSC", "State PSC"],
    subjectsCovered: ["Quantitative Aptitude", "Reasoning", "English", "General Awareness", "Current Affairs", "Polity", "History", "Geography", "Economy"],
    points: [
      "Topic-wise teaching with weekly mock analysis",
      "Separate planning for prelims, mains, and interview stages",
      "Long-term strategy support for serious civil-services aspirants",
    ],
    audience: ["student", "educator", "admin"],
  },
  {
    standardKey: "admissions-counselling",
    title: "Admissions and Academic Counselling",
    tagline: "Parent Guidance",
    schedule: "Open through the week",
    summary: "Counselling support for parents and students to choose the right stage, batch, and academic direction.",
    description:
      "This guidance track helps families choose the right coaching path based on class level, stream, academic needs, and long-term goals before starting a batch.",
    duration: "Open all year",
    mode: "Campus counselling + phone support",
    audienceLabel: "Parents and new admissions enquiries",
    courseNamesIncluded: [
      "Academic Counselling Session",
      "Batch Selection Guidance",
      "Parent Orientation Support",
    ],
    branchesIncluded: ["School", "Senior Secondary", "Diploma", "Graduation", "Competitive Exams"],
    subjectsCovered: ["Pathway Planning", "Batch Selection", "Schedule Guidance", "Goal Mapping"],
    points: [
      "Course selection based on class, goals, and readiness",
      "Batch timing, fees, and roadmap explanation",
      "Clear onboarding support for new admissions",
    ],
    audience: ["student", "educator", "admin"],
  },
] satisfies Omit<CourseItem, "id">[];

export function getCourseTemplateOptions() {
  return courseLibrary.map((course) => ({
    standardKey: course.standardKey,
    title: course.title,
  }));
}

export function getCourseTemplateByKey(standardKey: string) {
  return courseLibrary.find((course) => course.standardKey === standardKey) ?? null;
}

export function getCourseTemplateOrder(standardKey?: string) {
  if (!standardKey) {
    return Number.MAX_SAFE_INTEGER;
  }

  const index = courseLibrary.findIndex((course) => course.standardKey === standardKey);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function inferCourseTemplateKey(input?: string) {
  if (!input) {
    return null;
  }

  const normalized = input.trim().toLowerCase();
  const aliasMap: Record<string, string> = {
    "class 1 to 5 foundation program": "class-1-5-foundation",
    "primary school foundation": "class-1-5-foundation",
    "primary academic support": "class-1-5-foundation",
    "class 6 to 8 complete foundation": "class-6-8-complete",
    "class 6 to 8 foundation program": "class-6-8-complete",
    "class-6-8-foundation": "class-6-8-complete",
    "class 9 and 10 board preparation": "class-9-10-complete",
    "class-9-10-board-prep": "class-9-10-complete",
    "senior secondary and junior college support": "class-11-12-complete",
    "class 11 and 12 stream support": "class-11-12-complete",
    "class 11 and 12 commerce and science": "class-11-12-complete",
    "class-11-12-commerce-science": "class-11-12-complete",
    "junior college support": "class-11-12-complete",
    "diploma, polytechnic, and graduation support": "diploma-graduation-support",
    "diploma and graduation support": "diploma-graduation-support",
    "cuet and college readiness program": "diploma-graduation-support",
    "neet and jee foundation support": "class-11-12-complete",
    "spoken english and placement skills": "diploma-graduation-support",
    "entrance exam preparation": "entrance-exam-preparation",
    "jee neet and cet preparation": "entrance-exam-preparation",
    "jee foundation batch": "entrance-exam-preparation",
    "neet preparation batch": "entrance-exam-preparation",
    "government exam preparation": "government-exam-preparation",
    "bank, ssc, and railway exams": "government-exam-preparation",
    "civil services foundation": "government-exam-preparation",
    "government exams coaching": "government-exam-preparation",
    "admissions and academic counselling": "admissions-counselling",
    "admissions-showcase": "admissions-counselling",
  };

  return aliasMap[normalized] ?? null;
}
