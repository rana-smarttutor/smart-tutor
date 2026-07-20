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
    points: [
      "Spoken English — Fluency, Pronunciation, Vocabulary, Daily Communication",
      "Public Speaking — Speech Writing, Voice Modulation, Stage Confidence",
      "Body Language — Posture, Eye Contact, Gestures, Non-Verbal Cues",
      "Group Discussion — Argumentation, Active Listening, Leadership in GD",
      "Interview Skills — Resume Building, Mock Interviews, HR & Technical Prep",
      "Personality Development — Self-Awareness, Confidence, Grooming, Etiquette",
      "Presentation Skills — Slide Design, Delivery, Audience Engagement",
      "Leadership — Decision Making, Team Building, Motivation Techniques",
      "Assertive Communication — Saying No, Conflict Resolution, Empathy",
      "Real-World Practice — Debates, Extempore, Role-Plays, Simulations",
    ],
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
    points: [
      "German — Greetings, Numbers, Grammar, Conversational Phrases",
      "French — Alphabet, Pronunciation, Basic Grammar, Daily Phrases",
      "Japanese — Hiragana, Katakana, Basic Kanji, Polite Expressions",
      "Spanish — Greetings, Verb Conjugation, Everyday Conversation",
      "Basic Sign Language — Alphabet, Numbers, Common Gestures",
      "Cross-Cultural Communication — Etiquette, Traditions, Global Norms",
      "Reading & Writing in Foreign Languages",
      "Listening Comprehension & Audio Practice",
      "Travel & Study Abroad Communication",
      "Certificate-Oriented Language Proficiency",
    ],
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
    points: [
      "Entrepreneurship — Idea Validation, Business Model Canvas, Lean Startup",
      "Financial Literacy — Budgeting, Saving, Investing, Tax Basics",
      "Business Fundamentals — Marketing, Sales, Operations, Management",
      "Startup & Innovation — Pitching, Fundraising, MVP Development",
      "Market Research — Target Audience, Competitor Analysis, Surveys",
      "Money Management — Banking, UPI, Digital Payments, Credit Awareness",
      "Communication for Business — Emails, Reports, Negotiation",
      "Personal Finance — Insurance, Mutual Funds, FDs, Goal Planning",
      "Stock Market Basics — How Markets Work, Investing Principles",
      "Capstone: Build Your Own Business Plan",
    ],
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
    points: [
      "Drawing & Sketching — Pencil Techniques, Shading, Perspective, Portraits",
      "Painting — Watercolours, Acrylics, Oil Painting, Colour Theory",
      "Calligraphy — Hand Lettering, Modern Calligraphy, Brush Pen Art",
      "Vocal Music — Pitch, Rhythm, Raags, Breathing Techniques, Ear Training",
      "Guitar — Chords, Strumming, Fingerstyle, Song Accompaniment",
      "Dance — Classical (Kathak/Bharatanatyam), Contemporary, Hip-Hop Basics",
      "Art History & Appreciation — Indian & Western Art Movements",
      "Performance & Stage Presence",
      "Creative Expression & Emotional Outlet",
      "Portfolio & Showcase Preparation",
    ],
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
    points: [
      "Graphic Design — Canva, Photoshop, Illustrator, Logo & Banner Creation",
      "Video Editing — Premiere Pro, CapCut, Colour Grading, Transitions",
      "Animation — 2D Animation Principles, Motion Graphics, After Effects",
      "Game Design — Scratch to Unity, 2D & 3D Game Development",
      "Game Dev with AI — NPC Behaviour, Procedural Generation, Game AI",
      "UI Design — Figma, Wireframing, Prototyping, User-Centred Design",
      "Motion Graphics — Title Animations, Explainer Videos, Kinetic Typography",
      "Photography — Composition, Lighting, Camera Settings, Photo Editing",
      "Videography — Shooting Techniques, Stabilisation, Storytelling",
      "Content Creation — YouTube, Instagram, Reels, Social Media Strategy",
    ],
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
    points: [
      "Artificial Intelligence — AI Domains, Python Basics, Computer Vision, NLP",
      "Robotics — Sensors, Motors, Arduino Programming, Robot Assembly",
      "Coding for Kids — Scratch, Block-Based Coding, Logic Building, Game Making",
      "Internet & Digital Literacy — How the Internet Works, Online Safety, Digital Footprint",
      "Cyber Safety — Password Security, Phishing, Privacy, Safe Browsing",
      "STEM Innovation — Science Experiments, Engineering Challenges, Math Applications",
      "Drone Technology — Aerodynamics, Flight Controls, DGCA Rules, Drone Assembly",
      "3D Printing — CAD Design (Tinkercad/Fusion 360), Slicing, Material Science",
      "Electronics & IoT — Circuits, Arduino, Sensors, Cloud Connectivity",
      "Hands-On Projects — Build Robots, Code Apps, Create IoT Systems",
    ],
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
    title: "UPSC",
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
  stream: "Arts",
  statusLabel: "Enroll Now",
  standardKey: "state-psc-exams",
  title: "State PSC Exam Preparation",
  tagline: "State Civil Services Career",
  schedule: "Daily Practice + Weekend Tests",
  summary:
    "Complete preparation for major State Public Service Commission examinations.",
  description:
    "Structured preparation for state civil services examinations covering prelims, mains, current affairs, aptitude, state-specific general knowledge, answer writing, and interview guidance.",
  duration: "10-15 Months",
  mode: "Home / Online Tutoring",
  audienceLabel: "State Civil Services Aspirants",
  courseNamesIncluded: [
    "MPSC",
    "UPPSC",
    "BPSC",
    "RPSC",
    "MPPSC",
    "GPSC",
    "WBPSC",
    "KPSC",
    "TNPSC",
    "Other State PSC Exams",
  ],
  branchesIncluded: [
    "State Administration",
    "Civil Services",
    "Government Services",
  ],
  subjectsCovered: [
    "Indian Polity",
    "History",
    "Geography",
    "Economy",
    "State General Knowledge",
    "Current Affairs",
    "Aptitude",
    "Essay & Answer Writing",
  ],
  points: [
    "Prelims and mains preparation",
    "State-specific GK coverage",
    "Current affairs analysis",
    "Answer-writing practice",
    "Interview preparation",
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
      "IBPS PO",
      "IBPS Clerk",
      "SBI PO",
      "SBI Clerk",
      "RBI Assistant",
      "RBI Grade B",
      "RRB PO",
      "RRB Clerk",
      "NABARD Grade A",
      "SEBI Grade A",
    ],

    subjectsCovered: [
      "Quantitative Aptitude",
      "Reasoning Ability",
      "English Language",
      "Banking Awareness",
      "General Awareness",
      "Computer Knowledge",
    ],
    branchesIncluded: ["Finance", "Govt Jobs"],
    points: ["Speed-building mocks", "Pattern analysis", "Interview prep"],
    audience: ["student", "parent", "admin"],
  },
  {
  category: "Top Government Exams",
  sections: ["govtexams"],
  stream: "Commerce",
  statusLabel: "Enroll Now",
  standardKey: "regulatory-insurance-exams",
  title: "Regulatory & Insurance Exam Preparation",
  tagline: "Finance and Regulatory Careers",
  schedule: "Daily Practice + Weekly Mocks",
  summary:
    "Focused preparation for regulatory bodies, insurance companies, and financial-sector recruitment examinations.",
  description:
    "Prepare for RBI, NABARD, SEBI, IRDAI, LIC, NIACL, and other regulatory and insurance examinations through aptitude, finance, economics, reasoning, English, general awareness, and mock-test practice.",
  duration: "6-10 Months",
  mode: "Home / Online Tutoring",
  audienceLabel: "Finance & Insurance Aspirants",
  courseNamesIncluded: [
    "RBI Grade B",
    "RBI Assistant",
    "NABARD Grade A",
    "SEBI Grade A",
    "IRDAI Assistant Manager",
    "LIC AAO",
    "LIC ADO",
    "NIACL AO",
    "GIC Assistant Manager",
  ],
  branchesIncluded: [
    "Regulatory Bodies",
    "Insurance Sector",
    "Financial Institutions",
  ],
  subjectsCovered: [
    "Quantitative Aptitude",
    "Reasoning Ability",
    "English Language",
    "Economics",
    "Finance",
    "Insurance Awareness",
    "General Awareness",
    "Current Affairs",
  ],
  points: [
    "Exam-specific preparation",
    "Finance and economics coverage",
    "Insurance and regulatory awareness",
    "Sectional and full-length mocks",
    "Interview preparation",
  ],
  audience: ["student", "parent", "admin"],
},
  {
    category: "Top Government Exams",
    sections: ["govtexams"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "ssc",
    title: "SSC Preparation",
    tagline: "Top Government Jobs",
    schedule: "Daily Practice + Weekend Tests",
    summary: "Comprehensive coaching for SSC exams.",
    description:
      "Master Quantitative Aptitude, General Intelligence, English, and General Awareness at the advanced level needed for SSC CGL Tier I & II and CPO exams. Includes descriptive writing practice for Tier III.",
    duration: "8 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "SSC Aspirants",
    courseNamesIncluded: [
      "SSC CGL",
      "SSC CHSL",
      "SSC MTS",
      "SSC CPO",
      "SSC GD Constable",
      "SSC Stenographer",
      "SSC JE",
      "SSC Selection Post",
    ],

    subjectsCovered: [
      "Quantitative Aptitude",
      "General Intelligence & Reasoning",
      "English Language",
      "General Awareness",
    ],
    branchesIncluded: ["Central Govt Jobs", "Staff Selection"],
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
  standardKey: "teaching-academic-exams",
  title: "Teaching & Academic Eligibility Exams",
  tagline: "Build a Career in Education",
  schedule: "Daily Practice + Weekend Tests",
  summary:
    "Preparation for teaching eligibility, school recruitment, and academic eligibility examinations.",
  description:
    "Complete preparation for CTET, State TET, DSSSB, KVS, NVS, UGC NET, CSIR NET, and SET examinations with subject knowledge, teaching aptitude, reasoning, language, research aptitude, and mock tests.",
  duration: "6-10 Months",
  mode: "Home / Online Tutoring",
  audienceLabel: "Teaching & Academic Aspirants",
  courseNamesIncluded: [
    "CTET",
    "State TET",
    "DSSSB",
    "KVS",
    "NVS",
    "UGC NET",
    "CSIR NET",
    "SET",
  ],
  branchesIncluded: [
    "School Teaching",
    "Government Teaching",
    "Higher Education",
    "Academic Research",
  ],
  subjectsCovered: [
    "Child Development & Pedagogy",
    "Teaching Aptitude",
    "Reasoning",
    "Language Proficiency",
    "General Awareness",
    "Research Aptitude",
    "Subject-Specific Preparation",
  ],
  points: [
    "Paper-wise preparation",
    "Teaching and research aptitude",
    "Subject-specific guidance",
    "Previous-year question practice",
    "Full-length mock tests",
  ],
  audience: ["student", "parent", "admin"],
},
  {
    category: "Top Government Exams",
    sections: ["govtexams"],
    stream: "General",
    statusLabel: "Enroll Now",
    standardKey: "police-army-bharti",
    title: "Police / Army Bharti Exam Preparation",
    tagline: "Defence & Uniformed Services Career",
    schedule: "Daily Practice + Physical Guidance",
    summary:
      "Focused coaching for Police Bharti, Army Bharti, and defence recruitment exams.",
    description:
      "Prepare for Police Bharti and Army Bharti exams with complete support for written exam subjects, general knowledge, reasoning, mathematics, current affairs, and basic physical-readiness guidance. Includes practice tests, previous-year question support, fitness awareness, and selection strategy.",
    duration: "6-8 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "Police & Army Aspirants",
    courseNamesIncluded: [
      "Police Bharti",
      "Army Bharti",
      "Written Exam Preparation",
      "Physical Test Guidance",
      "Reasoning & Aptitude",
      "General Knowledge",
    ],
    branchesIncluded: [
      "Police Recruitment",
      "Army Recruitment",
      "Defence Services",
      "Uniformed Services",
    ],
    subjectsCovered: [
      "Mathematics",
      "Reasoning",
      "General Knowledge",
      "Current Affairs",
      "English / Marathi Basics",
      "Physical Test Awareness",
    ],
    points: [
      "Written exam preparation",
      "Physical test guidance",
      "Previous-year question practice",
      "Daily aptitude and GK drills",
      "Selection process guidance",
    ],
    audience: ["student", "parent", "admin"],
  },
  {
    category: "Competitive Exams",
    sections: ["govtexams"],
    stream: "Arts",
    statusLabel: "Enroll Now",
    standardKey: "llb-exams",
    title: "LLB Entrance Exam Preparation",
    tagline: "Law Entrance Career Pathway",
    schedule: "Daily Practice + Weekend Tests",
    summary:
      "Complete preparation for LLB entrance exams with legal aptitude, reasoning, English, GK, and mock tests.",
    description:
      "Prepare for LLB entrance exams with focused coaching for legal aptitude, logical reasoning, English, general knowledge, current affairs, and analytical ability. Includes support for 3-year and 5-year law entrance pathways, mock tests, previous-year questions, and exam strategy.",
    duration: "6-8 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "Law Aspirants",
    courseNamesIncluded: [
      "MH CET Law 3 Year",
      "MH CET Law 5 Year",
      "CLAT",
      "AILET",
      "LSAT India",
      "Legal Aptitude",
      "Logical Reasoning",
      "English",
      "General Knowledge",
      "Current Affairs",
    ],
    branchesIncluded: [
      "Law Entrance",
      "LLB Admissions",
      "Integrated Law Programs",
      "Legal Studies",
    ],
    subjectsCovered: [
      "Legal Aptitude",
      "Logical Reasoning",
      "English",
      "General Knowledge",
      "Current Affairs",
      "Analytical Ability",
    ],
    points: [
      "3-year and 5-year LLB entrance support",
      "Legal aptitude concept practice",
      "Daily reasoning and GK drills",
      "Mock tests and PYQ practice",
      "Law admission guidance",
    ],
    audience: ["student", "parent", "admin"],
  },
  {
    category: "Competitive Exams",
    sections: ["govtexams"],
    stream: "Commerce",
    statusLabel: "Enroll Now",
    standardKey: "mba-exams",
    title: "MBA Entrance Exam Preparation",
    tagline: "Management Career Pathway",
    schedule: "Daily Practice + Weekend Tests",
    summary:
      "Focused preparation for MBA entrance exams with aptitude, reasoning, English, and mock test practice.",
    description:
      "Prepare for MBA entrance exams with structured coaching for quantitative aptitude, logical reasoning, verbal ability, data interpretation, general awareness, and interview readiness. Includes mock tests, exam strategy, previous-year question practice, and guidance for management entrance pathways.",
    duration: "6-8 Months",
    mode: "Home / Online Tutoring",
    audienceLabel: "MBA Aspirants",
    courseNamesIncluded: [
      "MBA CET",
      "CAT",
      "CMAT",
      "MAT",
      "XAT",
      "SNAP",
      "NMAT",
      "ATMA",
      "Quantitative Aptitude",
      "Logical Reasoning",
      "Verbal Ability",
      "Data Interpretation",
    ],
    branchesIncluded: [
      "Management Entrance",
      "Business Schools",
      "MBA Admissions",
      "PG Management Programs",
    ],
    subjectsCovered: [
      "Quantitative Aptitude",
      "Logical Reasoning",
      "Verbal Ability",
      "Data Interpretation",
      "General Awareness",
      "Interview Preparation",
    ],
    points: [
      "MBA entrance exam preparation",
      "Aptitude and reasoning practice",
      "Mock tests and performance analysis",
      "Previous-year question practice",
      "GD, PI, and interview guidance",
    ],
    audience: ["student", "parent", "admin"],
  },
  {
  category: "Competitive Exams",
  sections: ["govtexams"],
  stream: "Science",
  statusLabel: "Enroll Now",
  standardKey: "gate-postgraduate-technical-exams",
  title: "GATE & Postgraduate Technical Exams",
  tagline: "Engineering and Research Career Pathway",
  schedule: "Daily Practice + Weekend Tests",
  summary:
    "Focused preparation for GATE, postgraduate technical entrances, design entrances, and PSU opportunities.",
  description:
    "Prepare for GATE and related postgraduate technical examinations with branch-specific subject preparation, engineering mathematics, aptitude, previous-year questions, mock tests, postgraduate admission guidance, and PSU recruitment awareness.",
  duration: "8-12 Months",
  mode: "Home / Online Tutoring",
  audienceLabel: "Engineering Graduates & Final-Year Students",
  courseNamesIncluded: [
    "GATE",
    "IIT JAM",
    "CEED",
    "PGCET",
    "PSU Recruitment through GATE",
  ],
  branchesIncluded: [
    "Computer Science Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Electronics & Communication",
    "Chemical Engineering",
    "Science & Research",
    "Design",
  ],
  subjectsCovered: [
    "Engineering Mathematics",
    "General Aptitude",
    "Branch-Specific Technical Subjects",
    "Previous-Year Questions",
    "Mock Tests",
    "Interview Preparation",
  ],
  points: [
    "Branch-wise technical preparation",
    "Engineering mathematics and aptitude",
    "Previous-year GATE paper practice",
    "Full-length mock tests",
    "Postgraduate and PSU guidance",
  ],
  audience: ["student", "parent", "admin"],
},
  {
  category: "Top Government Exams",
  sections: ["govtexams"],
  stream: "General",
  statusLabel: "Enroll Now",
  standardKey: "railways-exams",
  title: "Railway Recruitment Exam Preparation",
  tagline: "Build a Career with Indian Railways",
  schedule: "Daily Practice + Weekly Mocks",
  summary:
    "Complete preparation for major Railway Recruitment Board and Railway Protection Force examinations.",
  description:
    "Prepare for RRB NTPC, Group D, ALP, Technician, Junior Engineer, RPF Constable, and RPF Sub Inspector examinations with maths, reasoning, general science, general awareness, technical preparation, and mock tests.",
  duration: "6-8 Months",
  mode: "Home / Online Tutoring",
  audienceLabel: "Railway Aspirants",
  courseNamesIncluded: [
    "RRB NTPC",
    "RRB Group D",
    "RRB ALP",
    "RRB Technician",
    "RRB Junior Engineer",
    "RPF Constable",
    "RPF Sub Inspector",
  ],
  branchesIncluded: [
    "Indian Railways",
    "Railway Recruitment Board",
    "Railway Protection Force",
  ],
  subjectsCovered: [
    "Mathematics",
    "Reasoning",
    "General Science",
    "General Awareness",
    "Current Affairs",
    "Technical Subjects",
  ],
  points: [
    "Previous-year question practice",
    "Speed and accuracy development",
    "Technical and non-technical preparation",
    "Sectional mock tests",
    "Full-length railway exam mocks",
  ],
  audience: ["student", "parent", "admin"],
},
 {
  category: "Top Government Exams",
  sections: ["govtexams"],
  stream: "General",
  statusLabel: "Enroll Now",
  standardKey: "defence-paramilitary-exams",
  title: "Defence & Paramilitary Exam Preparation",
  tagline: "Serve the Nation with Pride",
  schedule: "Morning / Evening Batches",
  summary:
    "Complete preparation for defence, armed forces, Coast Guard, and paramilitary recruitment examinations.",
  description:
    "Prepare for NDA, CDS, AFCAT, CAPF, Agniveer, Coast Guard, and other defence recruitment pathways through written examination coaching, current affairs, physical-readiness guidance, personality development, and SSB preparation.",
  duration: "6-12 Months",
  mode: "Home / Online Tutoring",
  audienceLabel: "Defence & Paramilitary Aspirants",
  courseNamesIncluded: [
    "NDA",
    "CDS",
    "AFCAT",
    "CAPF Assistant Commandant",
    "Army Agniveer",
    "Navy Agniveer",
    "Air Force Agniveer",
    "Indian Coast Guard",
    "SSB Interview",
  ],
  branchesIncluded: [
    "Indian Army",
    "Indian Navy",
    "Indian Air Force",
    "Coast Guard",
    "Paramilitary Forces",
  ],
  subjectsCovered: [
    "Mathematics",
    "English",
    "General Knowledge",
    "General Science",
    "Current Affairs",
    "Defence Awareness",
    "SSB Preparation",
    "Physical Readiness",
  ],
  points: [
    "Written examination preparation",
    "SSB interview guidance",
    "Physical-readiness planning",
    "Defence current affairs",
    "Mock tests and personality development",
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
