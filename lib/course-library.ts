import type { CourseItem } from "@/lib/types";

export const DEFAULT_COURSE_TEMPLATE_KEY = "class-6-additional";

export const courseLibrary: Omit<CourseItem, "id">[] = [
  // --- SECTION: Class 6 Regular Academic ---
  {
    category: "Regular Academic",
    sections: ["class6"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "class-6-additional",
    title: "Class 6 Regular Academic",
    tagline: "Board-Aligned Academic Support",
    schedule: "Flexible Weekday / Weekend Slots",
    summary:
      "Personalised academic support for Class 6 students across State Board, CBSE, ICSE, IGCSE, and IB.",
    description:
      "Choose your board and required school subjects for personalised tutoring through home tutors or online sessions. Optional future-skill courses can also be selected during registration.",
    duration: "Full Academic Year",
    mode: "Home / Online Tutoring",
    audienceLabel: "Class 6 Students",
    courseNamesIncluded: [
      "Mathematics",
      "Science",
      "English",
      "Social Science",
      "Languages",
    ],
    branchesIncluded: [],
    subjectsCovered: [
      "Board-Aligned Curriculum",
      "Concept Clarity",
      "Homework Support",
      "Regular Unit Tests",
    ],
    points: [
      "Choose one or more school subjects",
      "Personalised board-aligned teaching plan",
      "Home tutor or online learning options",
      "Regular parent progress updates",
    ],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Class 7 Regular Academic ---
  {
    category: "Regular Academic",
    sections: ["class7"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "class-7-additional",
    title: "Class 7 Regular Academic",
    tagline: "Board-Aligned Academic Support",
    schedule: "Flexible Weekday / Weekend Slots",
    summary:
      "Structured academic support for Class 7 learners across all major school boards.",
    description:
      "Choose your board and subjects for personalised academic support, concept clarity, regular revision, and better confidence in school.",
    duration: "Full Academic Year",
    mode: "Home / Online Tutoring",
    audienceLabel: "Class 7 Students",
    courseNamesIncluded: [
      "Mathematics",
      "Science",
      "English",
      "Social Science",
      "Languages",
    ],
    branchesIncluded: [],
    subjectsCovered: [
      "Board-Aligned Curriculum",
      "Concept Clarity",
      "Homework Support",
      "Regular Unit Tests",
    ],
    points: [
      "Choose one or more school subjects",
      "Personalised tutor matching",
      "Revision and doubt-solving support",
      "Regular parent progress updates",
    ],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Class 8 Regular Academic ---
  {
    category: "Regular Academic",
    sections: ["class8"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "class-8-additional",
    title: "Class 8 Regular Academic",
    tagline: "Strong Concepts for Future Success",
    schedule: "Flexible Weekday / Weekend Slots",
    summary:
      "Build strong academic fundamentals before secondary school with board-aligned subject support.",
    description:
      "Choose your board and subjects for structured academic tutoring, concept development, homework support, and regular assessment preparation.",
    duration: "Full Academic Year",
    mode: "Home / Online Tutoring",
    audienceLabel: "Class 8 Students",
    courseNamesIncluded: [
      "Mathematics",
      "Science",
      "English",
      "Social Science",
      "Languages",
    ],
    branchesIncluded: [],
    subjectsCovered: [
      "Board-Aligned Curriculum",
      "Concept Building",
      "Revision Strategy",
      "Regular Assessments",
    ],
    points: [
      "Choose one or more school subjects",
      "Board-focused structured learning",
      "Weekly revision and doubt-solving",
      "Regular parent progress updates",
    ],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Class 9 Regular Academic ---
  {
    category: "Regular Academic",
    sections: ["class9"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "class-9-additional",
    title: "Class 9 Regular Academic",
    tagline: "Build a Strong Secondary Foundation",
    schedule: "Flexible Weekday / Weekend Slots",
    summary:
      "Board-aligned Class 9 tuition with personalised support in selected school subjects.",
    description:
      "Class 9 is a major foundation year. Select your board and required subjects for targeted tutoring, revision, tests, and doubt-solving.",
    duration: "Full Academic Year",
    mode: "Home / Online Tutoring",
    audienceLabel: "Class 9 Students",
    courseNamesIncluded: [
      "Mathematics",
      "Science",
      "English",
      "Social Science",
      "Languages",
      "Computer / AI",
    ],
    branchesIncluded: [],
    subjectsCovered: [
      "Board Syllabus Coverage",
      "Chapter-Wise Revision",
      "Test Preparation",
      "Doubt-Solving Sessions",
    ],
    points: [
      "Choose one or more school subjects",
      "Personalised academic planning",
      "Regular tests and performance review",
      "Optional future-skill add-on courses",
    ],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Class 10 Regular Academic ---
  {
    category: "Regular Academic",
    sections: ["class10"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "class-10-additional",
    title: "Class 10 Regular Academic",
    tagline: "Board Exam Focused Academic Support",
    schedule: "Flexible Weekday / Weekend Slots",
    summary:
      "Focused Class 10 board preparation with flexible multiple-subject selection.",
    description:
      "Get structured tuition, chapter completion, revision, doubt-solving, and practice support for the school subjects you select.",
    duration: "Full Academic Year",
    mode: "Home / Online Tutoring",
    audienceLabel: "Class 10 Students",
    courseNamesIncluded: [
      "Mathematics",
      "Science",
      "English",
      "Social Science",
      "Languages",
      "Computer / AI",
    ],
    branchesIncluded: [],
    subjectsCovered: [
      "Board Exam Preparation",
      "Chapter Completion",
      "Mock Tests",
      "Revision & Doubt-Solving",
    ],
    points: [
      "Choose one or more board subjects",
      "Board exam-focused teaching plan",
      "Regular tests and revision support",
      "Optional future-skill add-on courses",
    ],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Class 11 Regular Academic ---
  {
    category: "Regular Academic",
    sections: ["class11"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "class-11-additional",
    title: "Class 11 Regular Academic",
    tagline: "Stream-Based Academic Guidance",
    schedule: "Flexible Weekday / Weekend Slots",
    summary:
      "Personalised Class 11 academic tuition for Science, Commerce, Arts, and Computer Science learners.",
    description:
      "Choose your board and multiple subjects for academic support, concept clarity, regular revision, and exam readiness.",
    duration: "Full Academic Year",
    mode: "Home / Online Tutoring",
    audienceLabel: "Class 11 Students",
    courseNamesIncluded: [
      "Science Stream",
      "Commerce Stream",
      "Arts Stream",
      "Computer Science",
    ],
    branchesIncluded: [],
    subjectsCovered: [
      "Stream-Specific Subjects",
      "Board Syllabus Coverage",
      "Revision & Test Strategy",
      "Academic Mentoring",
    ],
    points: [
      "Choose multiple subjects as needed",
      "Science, Commerce, Arts, and Computer support",
      "Board-aligned teaching and revision",
      "Optional entrance and skill add-ons",
    ],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Class 12 Regular Academic ---
  {
    category: "Regular Academic",
    sections: ["class12"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "class-12-additional",
    title: "Class 12 Regular Academic",
    tagline: "Board Exam Focused Academic Guidance",
    schedule: "Flexible Weekday / Weekend Slots",
    summary:
      "Focused Class 12 tuition for board exams with flexible multiple-subject selection.",
    description:
      "Students receive structured support for selected Science, Commerce, Arts, and Computer Science subjects with consistent revision and board-exam practice.",
    duration: "Full Academic Year",
    mode: "Home / Online Tutoring",
    audienceLabel: "Class 12 Students",
    courseNamesIncluded: [
      "Science Stream",
      "Commerce Stream",
      "Arts Stream",
      "Computer Science",
    ],
    branchesIncluded: [],
    subjectsCovered: [
      "Board Exam Preparation",
      "Stream-Specific Subjects",
      "Mock Tests & Revision",
      "Academic Mentoring",
    ],
    points: [
      "Choose multiple subjects as needed",
      "Board exam-focused teaching plan",
      "Revision, tests, and doubt-solving",
      "Optional entrance and skill add-ons",
    ],
    audience: ["student", "parent", "admin"],
  },
  // --- SECTION: Skills - Communication & Personality ---
  {
    category: "Skills Development",
    sections: ["skills"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "skills-communication",
    title: "Communication & Personality",
    tagline: "Master the Art of Expression",
    schedule: "Flexible Timing",
    summary:
      "Build confidence, improve communication, and develop a winning personality.",
    description:
      "Comprehensive courses designed to enhance spoken and written communication, build leadership qualities, and develop interpersonal skills for personal and professional success.",
    duration: "3-6 Months",
    mode: "Online / Home Tutors",
    audienceLabel: "All Ages",
    courseNamesIncluded: [
      "Spoken English",
      "Public Speaking",
      "Communication Skills",
      "Personality Development",
      "Leadership Skills",
      "Interview Skills",
      "Group Discussion (GD)",
      "Presentation Skills",
      "Confidence Building",
      "Body Language & Etiquette",
    ],
    branchesIncluded: [],
    subjectsCovered: [],
    points: [],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Skills - Global Skills ---
  {
    category: "Skills Development",
    sections: ["skills"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "skills-global",
    title: "Global Skills",
    tagline: "Think Global, Act Global",
    schedule: "Flexible Timing",
    summary:
      "Learn new languages and develop cross-cultural communication skills.",
    description:
      "Open doors to global opportunities by learning foreign languages and understanding diverse cultures. Perfect for students planning to study or work abroad.",
    duration: "3-6 Months",
    mode: "Online / Home Tutors",
    audienceLabel: "All Ages",
    courseNamesIncluded: [
      "Foreign Language (German)",
      "Foreign Language (French)",
      "Foreign Language (Japanese)",
      "Foreign Language (Spanish)",
      "Basic Sign Language",
    ],
    branchesIncluded: [],
    subjectsCovered: [],
    points: [],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Skills - Career Readiness ---
  {
    category: "Skills Development",
    sections: ["skills"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "skills-career",
    title: "Career Readiness",
    tagline: "Prepare for Professional Success",
    schedule: "Flexible Timing",
    summary:
      "Develop business acumen and entrepreneurial skills for future careers.",
    description:
      "Equip yourself with practical knowledge of business, finance, and entrepreneurship. Ideal for students who want to build a strong foundation for their professional journey.",
    duration: "3-6 Months",
    mode: "Online / Home Tutors",
    audienceLabel: "Teens & Adults",
    courseNamesIncluded: [
      "Entrepreneurship",
      "Financial Literacy",
      "Business Fundamentals",
      "Startup & Innovation",
    ],
    branchesIncluded: [],
    subjectsCovered: [],
    points: [],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Skills - Performing Arts & Hobby Skills ---
  {
    category: "Skills Development",
    sections: ["skills"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "skills-arts-hobby",
    title: "Performing Arts & Hobby Skills",
    tagline: "Unleash Your Creative Side",
    schedule: "Flexible Timing",
    summary: "Explore creative arts and hobbies to express yourself and relax.",
    description:
      "Discover your artistic potential through visual arts, music, and dance. These courses provide a creative outlet while building discipline and self-expression.",
    duration: "3-6 Months",
    mode: "Online / Home Tutors",
    audienceLabel: "All Ages",
    courseNamesIncluded: [
      "Drawing & Sketching",
      "Painting",
      "Calligraphy",
      "Music (Vocal)",
      "Guitar",
      "Dance",
    ],
    branchesIncluded: [],
    subjectsCovered: [],
    points: [],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Skills - Creative & Digital Skills ---
  {
    category: "Skills Development",
    sections: ["skills"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "skills-creative-digital",
    title: "Creative & Digital Skills",
    tagline: "Create, Design, Innovate",
    schedule: "Flexible Timing",
    summary:
      "Master digital tools and creative technologies for modern careers.",
    description:
      "Learn industry-relevant creative and digital skills including graphic design, video production, animation, game development, and content creation. Build a portfolio that stands out.",
    duration: "3-6 Months",
    mode: "Online / Home Tutors",
    audienceLabel: "Teens & Adults",
    courseNamesIncluded: [
      "Graphic Designing",
      "Video Editing",
      "Animation",
      "Game Design & Development",
      "Game Development with AI",
      "UI Design Basics",
      "Motion Graphics",
      "Photography",
      "Videography",
      "Content Creation (YouTube & Social Media)",
    ],
    branchesIncluded: [],
    subjectsCovered: [],
    points: [],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Skills - Technology & Future Skills ---
  {
    category: "Skills Development",
    sections: ["skills"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "skills-tech-future",
    title: "Technology & Future Skills",
    tagline: "Build Tomorrow's World",
    schedule: "Flexible Timing",
    summary:
      "Get future-ready with AI, robotics, coding, digital literacy, STEM innovation, and modern technology skills.",
    description:
      "Practical technology courses for school students and young learners. Students can explore AI basics, robotics, coding, cyber safety, drones, 3D printing, electronics, and IoT through guided learning.",
    duration: "3-6 Months",
    mode: "Online / Home Tutors",
    audienceLabel: "All Ages",
    courseNamesIncluded: [
      "Artificial Intelligence (AI Basics)",
      "Robotics",
      "Coding for Kids",
      "Internet & Digital Literacy",
      "Cyber Safety & Digital Citizenship",
      "STEM Innovation",
      "Drone Technology",
      "3D Printing",
      "Electronics & IoT Basics",
    ],
    branchesIncluded: [],
    subjectsCovered: [],
    points: [],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: MHT CET Data ---
  {
    category: "Competitive Exams",
    sections: ["mhtcet"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "mht-cet-exams",
    title: "MHT CET Exam Categories",
    tagline: "Maharashtra State Entrance Exams",
    schedule: "Flexible Timing",
    summary:
      "Comprehensive preparation for all MHT CET examination categories.",
    description:
      "Covers all MHT CET entrance exams for engineering, pharmacy, management, law, design, hotel management, nursing, and education programs across Maharashtra.",
    duration: "3-6 Months",
    mode: "Online / Home Tutors",
    audienceLabel: "Class 12 Aspirants",
    courseNamesIncluded: [
      "Engineering (B.E./B.Tech)",
      "Pharmacy (B.Pharm)",
      "BBA / BCA / BMS",
      "Law (LLB - 3 year / 5 year)",
      "Design (B.Des)",
      "Hotel Management (B.HMCT)",
      "Nursing",
      "B.Ed / B.P.Ed",
    ],
    branchesIncluded: [],
    subjectsCovered: [],
    points: [],
    audience: ["student", "parent", "admin"],
  },

  // --- SECTION: Govt Exams ---
  {
    category: "Top Government Exams",
    sections: ["govtexams"],
    stream: "Arts",
    statusLabel: "Enroll Now",
    standardKey: "upsc-civil-services",
    title: "Government Exam",
    tagline: "Nation's Most Prestigious",
    schedule: "Full-time",
    summary: "Comprehensive strategy for Prelims, Mains, and Interview.",
    description:
      "Deep GS coverage, Optional subject support, and current affairs analysis. We focus on answer writing and strategic syllabus completion.",
    duration: "12-18 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "Aspirants",
    courseNamesIncluded: [
      "UPSC Civil Services",
      "GS Foundation",
      "Current Affairs",
      "Mains Writing",
    ],
    branchesIncluded: ["Administration", "Govt"],
    subjectsCovered: ["History", "Polity", "Economy", "Ethics", "Geography"],
    points: [
      "Daily feedback",
      "Personalized mentorship",
      "Mock interview rounds",
    ],
    audience: ["student", "parent", "admin"],
  },
  {
    category: "Top Government Exams",
    sections: ["govtexams"],
    stream: "Commerce",
    statusLabel: "Enroll Now",
    standardKey: "banking-exams",
    title: "Banking Exams (PO & Clerk)",
    tagline: "Secure Bank Career",
    schedule: "Daily Practice",
    summary: "Speed and accuracy training for IBPS, SBI, and RBI exams.",
    description:
      "Master logical puzzles, fast quant calculations, and banking awareness. Regular mock tests to improve your percentile. Special focus on SBI PO and NABARD tracks.",
    duration: "6 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "Bank Aspirants",
    courseNamesIncluded: [
      "Quant Specialist",
      "Reasoning Puzzles",
      "Banking GK",
    ],
    branchesIncluded: ["Finance", "Govt Jobs"],
    subjectsCovered: ["Maths", "Logic", "English", "Financial Awareness"],
    points: ["Speed-building mocks", "Pattern analysis", "Interview prep"],
    audience: ["student", "parent", "admin"],
  },
  {
    category: "Top Government Exams",
    sections: ["govtexams"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "ssc-cgl-cpo",
    title: "SSC CGL & CPO Preparation",
    tagline: "Top Government Jobs",
    schedule: "Daily Practice + Weekend Tests",
    summary:
      "Comprehensive coaching for SSC CGL (Graduate Level) and CPO (Central Police Org) exams.",
    description:
      "Master Quantitative Aptitude, General Intelligence, English, and General Awareness at the advanced level needed for SSC CGL Tier I & II and CPO exams. Includes descriptive writing practice for Tier III.",
    duration: "8 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "SSC Aspirants",
    courseNamesIncluded: [
      "Quant Advanced",
      "Reasoning Mastery",
      "English Pro",
      "GK Express",
    ],
    branchesIncluded: ["Central Govt Jobs", "Staff Selection"],
    subjectsCovered: ["Maths", "Reasoning", "English", "GK", "Computer Basics"],
    points: [
      "Tier-wise strategy",
      "Descriptive writing practice",
      "Sectional & full mocks",
    ],
    audience: ["student", "parent", "admin"],
  },
  {
    category: "Top Government Exams",
    sections: ["govtexams"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "railways-exams",
    title: "Railways Exams (NTPC & Group D)",
    tagline: "Indian Railways Job",
    schedule: "Daily Batches",
    summary:
      "Focused preparation for RRB NTPC (Non-Technical) and Group D exams.",
    description:
      "Targeted coaching for Railway Recruitment Board exams covering General Awareness, Mathematics, General Intelligence, and relevant technical subjects for Group D posts.",
    duration: "6 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "Railway Aspirants",
    courseNamesIncluded: ["Railway GK", "Quant Speed", "Reasoning Express"],
    branchesIncluded: ["Indian Railways", "PSU Jobs"],
    subjectsCovered: ["Maths", "Reasoning", "GK", "General Science"],
    points: [
      "PYQ-focused syllabus",
      "Speed-building drills",
      "Sectional analysis",
    ],
    audience: ["student", "parent", "admin"],
  },
  {
    category: "Top Government Exams",
    sections: ["govtexams"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "nda-cds",
    title: "NDA & CDS Entrance Preparation",
    tagline: "Defence Services Career",
    schedule: "Morning / Evening Batches",
    summary:
      "Dedicated coaching for NDA (National Defence Academy) and CDS (Combined Defence Services) exams.",
    description:
      "Comprehensive prep for Mathematics, General Ability, and English for NDA & CDS. Includes SSB interview coaching, physical fitness guidance, and personality development.",
    duration: "6-12 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "Defence Aspirants",
    courseNamesIncluded: [
      "Maths for Defence",
      "GK & Current Affairs",
      "SSB Interview Prep",
    ],
    branchesIncluded: ["Armed Forces", "Defence Services"],
    subjectsCovered: ["Mathematics", "English", "GK", "Physics", "Chemistry"],
    points: [
      "SSB coaching included",
      "Physical fitness tracking",
      "Mock SSB interviews",
    ],
    audience: ["student", "parent", "admin"],
  },
];

export function getCourseTemplateOptions() {
  return [
    { standardKey: "class6", title: "Class 6 (Additional Courses)" },
    { standardKey: "class7", title: "Class 7 (Additional Courses)" },
    { standardKey: "class8", title: "Class 8 (Additional Courses)" },
    { standardKey: "class9", title: "Class 9 (Additional Courses)" },
    { standardKey: "class10", title: "Class 10 (Additional Courses)" },
    { standardKey: "class1112", title: "Class 11-12 (Additional Courses)" },
    { standardKey: "skills", title: "Skills" },
    { standardKey: "mhtcet", title: "MHT CET" },
    { standardKey: "govtexams", title: "Government Exams" },
  ];
}

export function getCourseTemplateByKey(standardKey: string) {
  const directMatch = courseLibrary.find(
    (course) => course.standardKey === standardKey,
  );

  if (directMatch) {
    return directMatch;
  }

  if (standardKey === "Class 11-12 Science") {
    return (
      courseLibrary.find(
        (course) =>
          course.sections.includes("Class 1112") && course.stream === "Science",
      ) ?? null
    );
  }

  if (standardKey === "Class 11-12 Commerce") {
    return (
      courseLibrary.find(
        (course) =>
          course.sections.includes("Class 1112") &&
          course.stream === "Commerce",
      ) ?? null
    );
  }

  if (standardKey === "Class 11-12 Arts") {
    return (
      courseLibrary.find(
        (course) =>
          course.sections.includes("Class 1112") && course.stream === "Arts",
      ) ?? null
    );
  }

  return (
    courseLibrary.find((course) => course.sections.includes(standardKey)) ??
    null
  );
}

export function getCourseTemplateOrder(standardKey?: string) {
  if (!standardKey) {
    return Number.MAX_SAFE_INTEGER;
  }

  const directIndex = courseLibrary.findIndex(
    (course) => course.standardKey === standardKey,
  );

  if (directIndex !== -1) {
    return directIndex;
  }

  const sectionIndex = getCourseTemplateOptions().findIndex(
    (option) => option.standardKey === standardKey,
  );

  return sectionIndex === -1 ? Number.MAX_SAFE_INTEGER : sectionIndex;
}

export function getSuggestibleCourseKeys(): string[] {
  const shortTermKeys = new Set<string>();
  for (const course of courseLibrary) {
    const isShortTerm = course.duration !== "Full Academic Year";
    const hasStudentAudience = course.audience.includes("student");
    if (isShortTerm && hasStudentAudience) {
      shortTermKeys.add(course.standardKey);
    }
  }
  return Array.from(shortTermKeys);
}

export function getSuggestibleCourses(): Omit<CourseItem, "id">[] {
  const keys = getSuggestibleCourseKeys();
  return courseLibrary.filter((c) => keys.includes(c.standardKey));
}

export function inferCourseTemplateKey(input?: string) {
  if (!input) {
    return null;
  }

  const normalized = input.trim().toLowerCase();

  const sectionMap: Record<string, string> = {
    "class 6-8": "Class 6-8",
    "class 6": "Class 6",
    "class 7": "Class 7",
    "class 8": "Class 8",
    "class 9-10": "Class 9-10",
    "class 11-12 science": "Class 11-12 Science",
    "class 11-12 commerce": "Class 11-12 Commerce",
    "class 11-12 arts": "Class 11-12 Arts",
    graduation: "Graduation",
    "post grad": "Post Grad",
    "govt exams": "Govt Exams",
    skills: "Skills",
  };

  if (sectionMap[normalized]) {
    return sectionMap[normalized];
  }

  const titleMap: Record<string, string> = {};

  courseLibrary.forEach((course) => {
    titleMap[course.title.toLowerCase()] = course.standardKey;
  });

  return titleMap[normalized] ?? null;
}
