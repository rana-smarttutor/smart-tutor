import type {
  ContactAction,
  ContactMethod,
  CourseItem,
  DashboardMetric,
  DetailedCourse,
  DemoUserRecord,
  ManagedUser,
  MessageItem,
  PermissionItem,
  QuizQuestion,
  Role,
  SessionUser,
  SocialLink,
  TestQuestion,
  TestSubmission,
  TestItem,
} from "@/lib/types";
import { courseLibrary } from "@/lib/course-library";
import { generatedPlacedStudents } from "./placed-students-data";

const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91 88504 47887";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "admissions@smarttutor.in";
const CONTACT_ADDRESS = process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Sector 17, Vashi, Navi Mumbai";
const WHATSAPP_LINK = process.env.NEXT_PUBLIC_WHATSAPP_LINK || "https://wa.me/918850447887?text=Hello%20Smart%20Tutor";
const INSTAGRAM_LINK = process.env.NEXT_PUBLIC_INSTAGRAM_LINK || "https://www.instagram.com/smart_tutor_no1?igsh=MmVnZDllb3h4Y3I3&utm_source=qr";

export const demoCredentials = [
  {
    role: "student" as const,
    label: "Student Workspace",
    email: "riya@smarttutor.in",
    password: "Student@123",
  },
  {
    role: "educator" as const,
    label: "Educator Desk",
    email: "amit@smarttutor.in",
    password: "Educator@123",
  },
  {
    role: "admin" as const,
    label: "Admin Console",
    email: "admin@smarttutor.in",
    password: "Admin@123",
  },
];

const demoUsers: DemoUserRecord[] = [
  {
    id: "student-1",
    name: "Riya Sharma",
    email: "riya@smarttutor.in",
    password: "Student@123",
    role: "student",
    label: "Student Workspace",
    program: "Class 10 Board Preparation",
  },
  {
    id: "student-2",
    name: "Aarav Patil",
    email: "aarav@smarttutor.in",
    password: "Student@123",
    role: "student",
    label: "Student Workspace",
    program: "Civil Services Foundation",
  },
  {
    id: "student-3",
    name: "Sneha Kulkarni",
    email: "sneha@smarttutor.in",
    password: "Student@123",
    role: "student",
    label: "Student Workspace",
    program: "Class 12 Commerce and Science",
  },
  {
    id: "educator-1",
    name: "Amit Deshmukh",
    email: "amit@smarttutor.in",
    password: "Educator@123",
    role: "educator",
    label: "Educator Desk",
    program: "Competitive Exams Faculty",
  },
  {
    id: "educator-2",
    name: "Neha Joshi",
    email: "neha@smarttutor.in",
    password: "Educator@123",
    role: "educator",
    label: "Educator Desk",
    program: "School and Board Faculty",
  },
  {
    id: "admin-1",
    name: "Ankit Mali",
    email: "admin@smarttutor.in",
    password: "Admin@123",
    role: "admin",
    label: "Admin Console",
    program: "Operations Leadership",
  },
];

const rolePermissions: Record<Role, PermissionItem[]> = {
  student: [
    {
      title: "Personal dashboard",
      description:
        "See announcements, tests, and study progress.",
    },
    {
      title: "Message boards and materials",
      description:
        "Open notices, course updates, and materials.",
    },
  ],
  educator: [
    {
      title: "Teaching operations",
      description:
        "Create tests, grade work, and message batches.",
    },
    {
      title: "Delivery oversight",
      description:
        "Track batches, attendance, and follow-ups.",
    },
  ],
  admin: [
    {
      title: "User and permission control",
      description:
        "Create accounts and assign access.",
    },
    {
      title: "Institute management",
      description:
        "Monitor operations, admissions, and alerts.",
    },
  ],
};

const courses: CourseItem[] = courseLibrary.map((course, index) => ({
  id: `course-${index + 1}`,
  ...course,
}));

const placementMcq: TestQuestion[] = [
  {
    id: "pt-q1",
    prompt: "Which data structure works on First In First Out principle?",
    options: ["Stack", "Queue", "Tree", "Graph"],
  },
  {
    id: "pt-q2",
    prompt: "Which communication skill is most important during HR interviews?",
    options: ["Memorizing scripts", "Clarity and confidence", "Speaking very fast", "Avoiding examples"],
  },
];

const polityMcq: TestQuestion[] = [
  {
    id: "gk-q1",
    prompt: "Who appoints the Prime Minister of India?",
    options: ["Lok Sabha Speaker", "President", "Chief Justice of India", "Cabinet Secretary"],
  },
  {
    id: "gk-q2",
    prompt: "Which house of Parliament is called the Upper House?",
    options: ["Lok Sabha", "Rajya Sabha", "Vidhan Sabha", "Legislative Council"],
  },
];

const tests: TestItem[] = [
  {
    id: "test-1",
    title: "Class 10 Maths Precision Test",
    status: "Scheduled",
    summary:
      "Board-style chapter test with speed and accuracy review.",
    audience: ["student", "educator", "admin"],
    assignedUserIds: ["student-1", "student-3"],
    createdBy: "Neha Joshi",
    questions: placementMcq,
  },
  {
    id: "test-2",
    title: "Civil Services Polity Evaluation",
    status: "Ready To Issue",
    summary:
      "Polity-focused revision paper with concept and current-affairs recall.",
    audience: ["educator", "admin"],
    assignedUserIds: ["student-2"],
    createdBy: "Amit Deshmukh",
    questions: polityMcq,
  },
  {
    id: "test-3",
    title: "Senior Secondary Weekly Concept Check",
    status: "Result Published",
    summary:
      "Weekly learning review with corrective mentoring notes.",
    audience: ["student", "educator", "admin"],
    assignedUserIds: ["student-3"],
    createdBy: "Neha Joshi",
    questions: placementMcq,
  },
];

const messages: MessageItem[] = [
  {
    id: "message-1",
    title: "Class 10 revision plan update",
    body:
      "Science and maths revision worksheets will be discussed in the 6:00 PM batch today.",
    channel: "Batch Board",
    audience: ["student", "educator", "admin"],
    userIds: ["student-1", "educator-2", "admin-1"],
  },
  {
    id: "message-2",
    title: "Civil services faculty planning note",
    body:
      "Sunday answer-writing review must include ethics and polity copy checks.",
    channel: "Faculty Desk",
    audience: ["educator", "admin"],
  },
  {
    id: "message-3",
    title: "Admissions counselling window open",
    body:
      "Parents for class 6 to 10 enquiries can request a call-back for batch guidance this week.",
    channel: "Admissions",
    audience: ["student", "admin"],
  },
  {
    id: "message-4",
    title: "Batch capacity review",
    body:
      "Two evening school batches are nearing full capacity and need schedule confirmation.",
    channel: "Admin",
    audience: ["admin"],
  },
  {
    id: "message-5",
    title: "Senior secondary concept check result published",
    body:
      "The weekly concept check is now available with faculty remarks for the batch.",
    channel: "Results",
    audience: ["student", "educator", "admin"],
    userIds: ["student-3", "educator-2", "admin-1"],
    author: "Neha Joshi",
  },
];

const testSubmissions: TestSubmission[] = [
  {
    id: "submission-1",
    testId: "test-3",
    studentId: "student-3",
    studentName: "Sneha Kulkarni",
    answers: [1, 1],
    score: 2,
    total: 2,
    status: "published",
    submittedAt: "2026-03-22T08:30:00.000Z",
    publishedMessageTitle: "Senior secondary concept check result published",
    feedback: "Strong conceptual clarity. Continue daily answer practice for consistent board scores.",
    gradedBy: "Neha Joshi",
  },
];

const dashboardStats: Record<Role, DashboardMetric[]> = {
  student: [
    {
      label: "Active subjects",
      value: "04",
      detail: "Track core subjects, revision, and assigned learning goals.",
    },
    {
      label: "Tests this week",
      value: "03",
      detail: "Scheduled unit tests, mock papers, and review checkpoints.",
    },
    {
      label: "Mentor notices",
      value: "08",
      detail: "Batch updates, reminders, and study follow-ups in one place.",
    },
    {
      label: "Study materials",
      value: "26",
      detail: "Notes, practice sheets, recorded revision, and doubt support.",
    },
  ],
  educator: [
    {
      label: "Active batches",
      value: "12",
      detail: "School, college, and competitive cohorts in one teaching console.",
    },
    {
      label: "Tests to grade",
      value: "18",
      detail: "Pending checking across boards, aptitude, and competitive programs.",
    },
    {
      label: "Parent updates",
      value: "09",
      detail: "Performance reporting and counselling follow-ups to review.",
    },
    {
      label: "Mentoring load",
      value: "34",
      detail: "Doubt solving, answer review, and improvement planning in progress.",
    },
  ],
  admin: [
    {
      label: "Managed accounts",
      value: "286",
      detail: "Student, parent-facing support, and staff account oversight.",
    },
    {
      label: "Open enquiries",
      value: "42",
      detail: "New admissions, counselling requests, and programme follow-ups.",
    },
    {
      label: "Institute batches",
      value: "24",
      detail: "Academic and competitive batch planning across the week.",
    },
    {
      label: "Faculty teams",
      value: "09",
      detail: "School, board, and exam-specialist faculty coordination.",
    },
  ],
};

const socialLinks: SocialLink[] = [
  {
    label: "WhatsApp",
    href: WHATSAPP_LINK,
    color: "#25D366",
    glow: "rgba(37, 211, 102, 0.32)",
  },
  {
    label: "Instagram",
    href: INSTAGRAM_LINK,
    color: "#E4405F",
    glow: "rgba(228, 64, 95, 0.28)",
  },
];

const contactMethods: ContactMethod[] = [
  {
    label: "Admissions Hotline",
    value: CONTACT_PHONE,
    href: `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`,
    description: "Primary counselling, admissions, and student support line.",
    color: "#3b82f6",
    icon: "Phone",
  },
  {
    label: "WhatsApp Support",
    value: CONTACT_PHONE,
    href: WHATSAPP_LINK,
    description: "Chat directly for quick counselling and batch guidance.",
    color: "#25D366",
    icon: "WhatsApp",
  },
  {
    label: "Instagram",
    value: "@smart_tutor_no1",
    href: INSTAGRAM_LINK,
    description: "Official Smart Tutor announcements and updates.",
    color: "#E4405F",
    icon: "Instagram",
  },
  {
    label: "Email Admissions",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    description: "Send your documents and official queries here.",
    color: "#ea4335",
    icon: "Email",
  },
  {
    label: "Director & Founder",
    value: "Prof. Ravi Rana",
    href: `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`,
    description: "Leadership contact for SmartIQ Academy, Smart Tutor, and Prime Digital School.",
    color: "#1e293b",
    icon: "User",
  },
  {
    label: "Visit The Academy",
    value: CONTACT_ADDRESS,
    href: "https://maps.google.com/?q=Vashi+Navi+Mumbai",
    description: "Visit for counselling and admissions guidance.",
    color: "#0f172a",
    icon: "Map",
  },
];

const contactActions: ContactAction[] = [
  {
    label: "Call Admissions",
    href: `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`,
    style: "primary",
  },
  {
    label: "WhatsApp Counselling",
    href: WHATSAPP_LINK,
    style: "primary",
  },
  {
    label: "Open Instagram",
    href: INSTAGRAM_LINK,
    style: "secondary",
  },
  {
    label: "Campus Visit Request",
    href: `${WHATSAPP_LINK}&text=Hello%20Smart%20Tutor%2C%20I%20want%20to%20visit%20the%20campus.`,
    style: "secondary",
  },
];

const detailedCourses: DetailedCourse[] = courses;

const mockQuizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is the capital city of India?",
    options: ["Mumbai", "Kolkata", "New Delhi", "Chennai"],
    answer: 2,
    difficulty: "easy",
    explanation: "New Delhi is the capital of India and the seat of the central government.",
    category: "Indian Polity",
  },
  {
    id: "q2",
    question: "Who wrote India's national anthem, 'Jana Gana Mana'?",
    options: ["Bankim Chandra Chattopadhyay", "Rabindranath Tagore", "Sarojini Naidu", "Subramania Bharati"],
    answer: 1,
    difficulty: "easy",
    explanation: "Rabindranath Tagore composed the national anthem of India.",
    category: "Culture",
  },
  {
    id: "q3",
    question: "Which Article of the Constitution guarantees equality before law?",
    options: ["Article 14", "Article 19", "Article 21", "Article 32"],
    answer: 0,
    difficulty: "medium",
    explanation: "Article 14 guarantees equality before law and equal protection of laws.",
    category: "Constitution",
  },
  {
    id: "q4",
    question: "The Battle of Plassey was fought in which year?",
    options: ["1757", "1764", "1857", "1748"],
    answer: 0,
    difficulty: "medium",
    explanation: "The Battle of Plassey took place in 1757 and marked a major turning point in Indian history.",
    category: "History",
  },
  {
    id: "q5",
    question: "Which river is often called the 'Sorrow of Bihar' because of frequent floods?",
    options: ["Damodar", "Kosi", "Mahanadi", "Gandak"],
    answer: 1,
    difficulty: "medium",
    explanation: "The Kosi River is called the Sorrow of Bihar due to its changing course and floods.",
    category: "Geography",
  },
  {
    id: "q6",
    question: "The Right to Constitutional Remedies is included in which part of the Indian Constitution?",
    options: ["Part II", "Part III", "Part IV", "Part IVA"],
    answer: 1,
    difficulty: "hard",
    explanation: "The Right to Constitutional Remedies under Article 32 is part of Fundamental Rights in Part III.",
    category: "Constitution",
  },
  {
    id: "q7",
    question: "Which of the following is the major greenhouse gas emitted by human activities?",
    options: ["Helium", "Carbon Dioxide", "Argon", "Neon"],
    answer: 1,
    difficulty: "hard",
    explanation: "Carbon dioxide is the major greenhouse gas released through fossil fuel use and industrial activity.",
    category: "Science",
  },
  {
    id: "q8",
    question: "Who was the first woman Governor of an Indian state?",
    options: ["Vijaya Lakshmi Pandit", "Sarojini Naidu", "Sucheta Kripalani", "Aruna Asaf Ali"],
    answer: 1,
    difficulty: "hard",
    explanation: "Sarojini Naidu became the first woman Governor of an Indian state, Uttar Pradesh.",
    category: "Modern India",
  },
  {
    id: "q9",
    question: "The subjects of Union, State, and Concurrent Lists are given in which Schedule of the Constitution?",
    options: ["Fifth Schedule", "Sixth Schedule", "Seventh Schedule", "Eighth Schedule"],
    answer: 2,
    difficulty: "hard",
    explanation: "The Seventh Schedule distributes legislative subjects across the Union, State, and Concurrent Lists.",
    category: "Polity",
  },
  {
    id: "q10",
    question: "GDP stands for which of the following?",
    options: ["Gross Domestic Product", "General Development Plan", "Growth Distribution Process", "Gross Demand Projection"],
    answer: 0,
    difficulty: "hard",
    explanation: "GDP means Gross Domestic Product, a common measure of economic output.",
    category: "Economics",
  },
];

export function getPublicInstituteData() {
  return {
    profile: {
      name: "Smart Tutor",
      city: "Vashi",
      address: "Sector 17, Vashi, Navi Mumbai",
      phone: "+91 88504 47887",
      email: "admissions@smarttutoracademy.in",
      hours: "Mon - Sat | 08:00 AM - 08:30 PM",
      specialties: ["School Coaching", "Competitive Exams", "Civil Services"],
      directorName: "Prof. Ravi Rana",
      directorTitle: "Director & Founder",
      affiliatedInstitutes: ["SmartIQ Academy", "Smart Tutor", "Prime Digital School"],
    },
    socialLinks,
    contactMethods,
    contactActions,
    whatsappHref:
      "https://wa.me/918850447887?text=Hello%20Smart%20Tutor",
    headlineLines: [
      "From primary classrooms to civil services preparation, every learner follows a clear academic plan.",
      "Small-batch mentoring, disciplined testing, and parent communication stay central to the learning journey.",
      "Board performance, junior college support, entrance readiness, government exams, and spoken English live under one reliable academy roof.",
      "While we primarily serve the Vashi, Navi Mumbai, and Thane regions, we are actively preparing to bring our specialized mentoring to more cities across India soon.",
      "Vashi families choose Smart Tutor for consistency, attention, and visible academic growth.",
    ],
    metrics: [
      { label: "Success Rate", value: "94%" },
      { label: "App Support", value: "Android & Desktop" },
      { label: "Active Students", value: "500+" },
      { label: "Expert Mentors", value: "25+" },
    ],
    operationsHighlights: [
      {
        title: "Foundation to advanced continuity",
        description:
          "Students can begin with school support and continue into competitive and career-focused programs.",
        tag: "Academics",
      },
      {
        title: "Mentor-led review system",
        description:
          "Regular testing, doubt support, and feedback cycles keep progress measurable.",
        tag: "Delivery",
      },
      {
        title: "Parent and admissions guidance",
        description:
          "New enquiries receive counselling, pathway planning, and batch matching support.",
        tag: "Admissions",
      },
    ],
    programs: [
      {
        category: "Primary School",
        title: "Class 1 to 5 Foundation",
        duration: "Academic Year",
        description:
          "Build reading, numeracy, study habits, and confidence early with close mentoring and guided practice.",
        focus: ["Maths", "English", "EVS", "Homework Support"],
      },
      {
        category: "School Foundation",
        title: "Class 6 to 8 Foundation",
        duration: "Academic Year",
        description:
          "Build subject clarity, stronger habits, and exam confidence early with close mentoring and worksheet practice.",
        focus: ["Maths", "Science", "English", "Study Skills"],
      },
      {
        category: "Boards",
        title: "Class 9 to Junior College Success",
        duration: "Year-round",
        description:
          "Academic coaching for secondary, senior secondary, and junior college learners with paper practice, revision, and milestone reviews.",
        focus: ["Board Revision", "Concept Clarity", "Weekly Tests", "Stream Guidance"],
      },
      {
        category: "College Support",
        title: "Diploma and Graduation Guidance",
        duration: "Semester-based",
        description:
          "Structured academic support for diploma, polytechnic, and degree-college students who need stronger semester execution and career readiness.",
        focus: ["Semester Support", "Aptitude", "Communication", "Placement Readiness"],
      },
      {
        category: "Entrance Exams",
        title: "JEE, NEET, CET, and CUET",
        duration: "Batch-based",
        description:
          "Targeted entrance programs for engineering, medical, and university aspirants with disciplined mock-test review.",
        focus: ["Physics", "Chemistry", "Biology", "Mathematics"],
      },
      {
        category: "Civil Services",
        title: "UPSC and State PSC Foundation",
        duration: "Long-term",
        description:
          "Integrated civil services preparation with core subjects, current affairs, answer writing, and mentor review.",
        focus: ["Polity", "History", "Economy", "Answer Writing"],
      },
    ],
    roles: [
      {
        role: "student" as const,
        title: "Learner workspace",
        summary:
          "Students track classes, materials, tests, notices, and their day-to-day study priorities from one workspace.",
        features: [
          "Revision schedule and study status",
          "Batch notices and faculty messages",
          "Tests, results, and learning resources",
        ],
      },
      {
        role: "educator" as const,
        title: "Faculty operations",
        summary:
          "Educators manage batches across school, competitive, and civil services preparation with clear operational visibility.",
        features: [
          "Create tests and publish review notes",
          "Manage course delivery and batch updates",
          "Coordinate student and parent communication",
        ],
      },
      {
        role: "admin" as const,
        title: "Institute control",
        summary:
          "Admins oversee admissions flow, access control, course structure, and institute-wide coordination.",
        features: [
          "Create and manage user records",
          "Track programme and access structure",
          "Oversee institute-wide activity",
        ],
      },
    ],
    mediaFeatures: [
      {
        title: "Toppers and result storytelling",
        description:
          "Highlight toppers, board achievers, and selection stories in a credible, parent-friendly format.",
      },
      {
        title: "Notes and worksheet delivery",
        description:
          "Support class notes, revision sheets, answer-writing work, and practice resources across batches.",
      },
      {
        title: "Counselling and parent confidence",
        description:
          "Make admissions, mentoring process, and batch discipline visible to families before enrolment.",
      },
      {
        title: "Production-ready academy content",
        description:
          "Keep the institute website ready for future updates without falling back to placeholder copy.",
      },
    ],
    designPrinciples: [
      {
        title: "Trust-first presentation",
        description:
          "Parents and aspirants should understand the academy's seriousness within the first few seconds.",
        metric: "01",
      },
      {
        title: "Mobile-safe clarity",
        description:
          "Each section stays readable across desktop and mobile without visual clutter or overflow.",
        metric: "02",
      },
      {
        title: "Professional energy",
        description:
          "Color supports confidence and warmth, but the academy still reads as disciplined and credible.",
        metric: "03",
      },
    ],
    detailedCourses,
    placedStudents: generatedPlacedStudents,
  };
}

export function getMockQuizQuestions() {
  return mockQuizQuestions;
}

export function findDemoUser(email: string, password: string): SessionUser | null {
  const user = demoUsers.find(
    (item) => item.email.toLowerCase() === email && item.password === password,
  );

  if (!user) {
    return null;
  }

  return sanitizeUser(user);
}

export function findDemoUserById(id: string) {
  const user = demoUsers.find((item) => item.id === id);
  return user ? sanitizeUser(user) : null;
}

export function getCoursesForRole(role: Role) {
  return courses.filter((item) => item.audience.includes(role));
}

export function getTestsForRole(role: Role, userId?: string) {
  return tests.filter((item) => {
    if (!item.audience.includes(role)) {
      return false;
    }

    if (role === "student") {
      return item.assignedUserIds?.includes(userId ?? "") ?? false;
    }

    return true;
  });
}

export function getMessagesForRole(role: Role, userId?: string) {
  return messages.filter((item) => {
    if (!item.audience.includes(role)) {
      return false;
    }

    if (!item.userIds) {
      return true;
    }

    return userId ? item.userIds.includes(userId) : false;
  });
}

export function getUsersForAdmin() {
  return demoUsers.map(toManagedUser);
}

export function getStudentDirectory() {
  return demoUsers.filter((item) => item.role === "student").map(toManagedUser);
}

export function getTestSubmissionsForRole(role: Role, userId?: string) {
  if (role === "student") {
    return testSubmissions.filter((item) => item.studentId === userId);
  }

  if (role === "educator" || role === "admin") {
    return testSubmissions;
  }

  return [];
}

export function getTestById(id: string) {
  return tests.find((item) => item.id === id) ?? null;
}

export function getDashboardBundle(role: Role, userId?: string) {
  const user = userId ? findDemoUserById(userId) : null;

  const heroCopy: Record<Role, { title: string; description: string }> = {
    student: {
      title: `Welcome back${user ? `, ${user.name.split(" ")[0]}` : ""}`,
      description:
        "Tests, materials, and messages in one place.",
    },
    educator: {
      title: `Educator Console${user ? ` | ${user.name}` : ""}`,
      description:
        "Manage tests, batches, and notices from one view.",
    },
    admin: {
      title: `Admin Command Center${user ? ` | ${user.name}` : ""}`,
      description:
        "Manage access, operations, and permissions.",
    },
  };

  return {
    role,
    roleLabel: user?.label ?? `${role.charAt(0).toUpperCase()}${role.slice(1)} Access`,
    heroTitle: heroCopy[role].title,
    heroDescription: heroCopy[role].description,
    stats: dashboardStats[role],
    primaryPanel: {
      title:
        role === "student"
          ? "Today's learner priorities"
          : role === "educator"
            ? "Teaching priorities"
            : "Admin priorities",
      badge:
        role === "admin"
          ? "Operations"
          : role === "educator"
            ? "Delivery"
            : "Learning",
      items: [
        {
          title:
            role === "student"
              ? "Personal study schedule"
              : role === "educator"
                ? "Assessment flow"
                : "Access review",
          description:
            role === "student"
              ? "See daily priorities, revision work, and mentor reminders."
              : role === "educator"
                ? "Issue tests and review pending evaluations."
                : "Approve users and verify permissions.",
          meta:
            role === "student"
              ? "Student"
              : role === "educator"
                ? "Educator"
                : "Admin",
        },
        {
          title:
            role === "student"
              ? "Result and material access"
              : role === "educator"
                ? "Batch communication"
                : "Institute visibility",
          description:
            role === "student"
              ? "Find results, notes, and practice files quickly."
              : role === "educator"
                ? "Send notices and follow-ups to each batch."
                : "Track branch health, faculty loads, and alerts.",
          meta: "Workflow",
        },
      ],
    },
    permissions: rolePermissions[role],
    courses: getCoursesForRole(role).slice(0, 3),
    tests: getTestsForRole(role, userId).slice(0, 4),
    messages: getMessagesForRole(role, userId).slice(0, 6),
    submissions: getTestSubmissionsForRole(role, userId).slice(0, 6),
  };
}

export function createCourseDraft(input: {
  title?: string;
  schedule?: string;
  summary?: string;
  createdBy: string;
}) {
  return {
    id: `course-draft-${Date.now()}`,
    title: input.title?.trim() || "New course draft",
    schedule: input.schedule?.trim() || "Schedule pending",
    summary:
      input.summary?.trim() ||
      `Prepared locally by ${input.createdBy}. This draft is ready to be connected to MongoDB persistence.`,
  };
}

export function createMessageDraft(input: {
  title?: string;
  body?: string;
  channel?: string;
  author: string;
  audience?: Role[];
  userIds?: string[];
}) {
  return {
    id: `message-draft-${Date.now()}`,
    title: input.title?.trim() || "Untitled message",
    body:
      input.body?.trim() ||
      `Draft message created locally by ${input.author}. Replace mock persistence with MongoDB later.`,
    channel: input.channel?.trim() || "General",
    audience: input.audience?.length ? input.audience : ["student", "educator", "admin"],
    userIds: input.userIds,
    author: input.author,
    createdAt: new Date().toISOString(),
  };
}

export function createTestDraft(input: {
  title?: string;
  status?: string;
  summary?: string;
  createdBy: string;
  assignedUserIds?: string[];
  questions?: TestQuestion[];
}) {
  return {
    id: `test-draft-${Date.now()}`,
    title: input.title?.trim() || "New assessment draft",
    status: input.status?.trim() || "Draft",
    summary:
      input.summary?.trim() ||
      `Mock test created by ${input.createdBy}. Persist this route later with MongoDB collections.`,
    assignedUserIds: input.assignedUserIds ?? [],
    createdBy: input.createdBy,
    questions: input.questions ?? [],
  };
}

export function createTestSubmissionDraft(input: {
  testId: string;
  studentId: string;
  studentName: string;
  answers: number[];
}) {
  const test = getTestById(input.testId);

  if (!test || !test.questions?.length) {
    return null;
  }

  return {
    submission: {
      id: `submission-draft-${Date.now()}`,
      testId: test.id,
      studentId: input.studentId,
      studentName: input.studentName,
      answers: input.answers,
      score: null,
      total: test.questions.length,
      status: "submitted" as const,
      submittedAt: new Date().toISOString(),
      publishedMessageTitle: `${test.title} pending review`,
    },
  };
}

export function createGradedSubmissionDraft(input: {
  submissionId: string;
  score: number;
  feedback?: string;
  gradedBy: string;
}) {
  const submission = testSubmissions.find((item) => item.id === input.submissionId);

  if (!submission) {
    return null;
  }

  return {
    submission: {
      ...submission,
      score: input.score,
      status: "published" as const,
      feedback:
        input.feedback?.trim() ||
        `Result reviewed and published by ${input.gradedBy}.`,
      gradedBy: input.gradedBy,
      publishedMessageTitle: `${submission.studentName} result published`,
    },
    message: {
      id: `result-message-${Date.now()}`,
      title: `${submission.studentName} result published`,
      body: `${submission.studentName}'s test review has been completed and the result is now available on the board.`,
      channel: "Results",
      audience: ["student", "educator", "admin"] as Role[],
      userIds: [submission.studentId],
      author: input.gradedBy,
    },
  };
}

export function createUserDraft(input: {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  program?: string;
  status?: "active" | "pending";
}) {
  const role = normalizeRole(input.role);
  const defaultPassword =
    input.password?.trim() ||
    (role === "admin"
      ? "Admin@123"
      : role === "educator"
        ? "Educator@123"
        : "Student@123");

  return {
    id: `user-draft-${Date.now()}`,
    name: input.name?.trim() || "New Smart Tutor User",
    email: input.email?.trim().toLowerCase() || "new-user@smarttutor.in",
    role,
    label:
      role === "admin"
        ? "Admin Console"
        : role === "educator"
          ? "Educator Desk"
        : "Student Workspace",
    program: input.program?.trim() || "New Registration",
    passwordHint: defaultPassword,
    status: input.status ?? "active",
    permissions: rolePermissions[role],
    createdAt: new Date().toISOString(),
  };
}

function sanitizeUser(user: DemoUserRecord): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    label: user.label,
  };
}

function toManagedUser(user: DemoUserRecord): ManagedUser {
  return {
    ...sanitizeUser(user),
    program: user.program,
    status: "active",
    passwordHint: user.password,
  };
}

function normalizeRole(input?: string): Role {
  if (input === "student" || input === "educator" || input === "admin") {
    return input;
  }

  return "student";
}

export function getTemplateSeedData() {
  return {
    content: [
      {
        _id: "public-site",
        ...getPublicInstituteData(),
      },
      {
        _id: "dashboard-config",
        templates: {
          student: {
            roleLabel: "Student Workspace",
            heroTitle: "Welcome back",
            heroDescription:
              "Tests, materials, and messages in one place.",
            stats: dashboardStats.student,
            primaryPanel: getDashboardBundle("student").primaryPanel,
            permissions: rolePermissions.student,
          },
          educator: {
            roleLabel: "Educator Desk",
            heroTitle: "Educator Console",
            heroDescription:
              "Manage tests, batches, and notices from one view.",
            stats: dashboardStats.educator,
            primaryPanel: getDashboardBundle("educator").primaryPanel,
            permissions: rolePermissions.educator,
          },
          admin: {
            roleLabel: "Admin Console",
            heroTitle: "Admin Command Center",
            heroDescription:
              "Manage access, operations, and permissions.",
            stats: dashboardStats.admin,
            primaryPanel: getDashboardBundle("admin").primaryPanel,
            permissions: rolePermissions.admin,
          },
        },
      },
    ],
    users: demoUsers.map((user) => ({
      ...user,
      status: "active",
      permissions: rolePermissions[user.role],
      createdAt: "2026-03-24T00:00:00.000Z",
      updatedAt: "2026-03-24T00:00:00.000Z",
    })),
    courses,
    tests,
    messages,
    submissions: testSubmissions,
    quizQuestions: mockQuizQuestions,
  };
}
