import type { CourseItem } from "@/lib/types";

export const DEFAULT_COURSE_TEMPLATE_KEY = "class-6-12-school-support";

export const courseLibrary: Omit<CourseItem, "id">[] = [
  // --- School & Junior College ---
  {
    category: "School & Junior College",
    standardKey: "class-6-12-school-support",
    title: "Class 6th to 12th Academic Support",
    tagline: "State, CBSE, ICSE, IGCSE, IB",
    schedule: "Mon to Fri | After-school batches",
    summary: "Comprehensive academic support for all boards including State, CBSE, ICSE, IGCSE, and IB.",
    description: "We provide personalized coaching for students from 6th to 12th standard across all major boards. Our focus is on concept clarity, habit building, and academic excellence in Science, Commerce, and Arts streams.",
    duration: "Full academic year",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Class 6 to 12 students",
    courseNamesIncluded: ["6th to 10th All Subjects", "11th-12th Science", "11th-12th Commerce", "11th-12th Arts"],
    branchesIncluded: ["Academic Excellence", "Board Exam Prep", "Concept Building"],
    subjectsCovered: ["Mathematics", "Science", "English", "Social Studies", "Accounts", "Economics", "Physics", "Chemistry", "Biology"],
    points: ["All Boards Covered (CBSE, ICSE, State, IB, IGCSE)", "Subject-specific expert tutors", "Regular tests and parent-teacher meetings"],
    audience: ["student", "educator", "admin"],
  },

  // --- Top Competitive Exams ---
  {
    category: "Top Competitive Exams",
    standardKey: "jee-neet-cet-prep",
    title: "JEE, NEET, and CET Preparation",
    tagline: "Engineering & Medical Entrance",
    schedule: "Weekday and weekend intensive batches",
    summary: "Focused preparation for top engineering and medical entrance exams.",
    description: "Our entrance exam track prepares students for JEE, NEET, and CET with advanced problem-solving techniques, mock tests, and personalized mentoring to ensure high scores in competitive admissions.",
    duration: "1 or 2 year programs",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Entrance exam aspirants",
    courseNamesIncluded: ["JEE Main & Advanced", "NEET-UG", "MHT-CET / State CET", "Olympiads & NTSE"],
    branchesIncluded: ["Engineering Entrance", "Medical Entrance", "National Level Exams"],
    subjectsCovered: ["Physics", "Chemistry", "Mathematics", "Biology", "Aptitude"],
    points: ["Advanced problem-solving modules", "Comprehensive mock test series", "Individual performance tracking"],
    audience: ["student", "educator", "admin"],
  },
  {
    category: "Top Competitive Exams",
    standardKey: "study-abroad-exams",
    title: "SAT, IELTS, and TOEFL Training",
    tagline: "International Admissions",
    schedule: "Flexible timing | Weekend batches available",
    summary: "Training for international admission tests and language proficiency.",
    description: "Expert guidance for SAT, IELTS, and TOEFL. We help students master the test formats and improve their scores for admissions to top universities worldwide.",
    duration: "3 to 6 months intensive",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Study abroad aspirants",
    courseNamesIncluded: ["SAT Preparation", "IELTS Academic/General", "TOEFL iBT"],
    branchesIncluded: ["International Education", "Language Proficiency"],
    subjectsCovered: ["Verbal Reasoning", "Quantitative Reasoning", "English Proficiency", "Writing Skills"],
    points: ["Personalized feedback on writing and speaking", "Actual test simulations", "University admission guidance"],
    audience: ["student", "educator", "admin"],
  },
  {
    category: "Top Competitive Exams",
    standardKey: "professional-law-mgmt-exams",
    title: "Law, Mgmt, and Professional Exams",
    tagline: "CLAT, CA, CS, and more",
    schedule: "Morning and evening batches",
    summary: "Preparation for specialized professional and entrance exams like CLAT, CA, and CS.",
    description: "Comprehensive coaching for CLAT, AILET, CA, CS, CMA, and ACCA. Our professional track ensures students are ready for the rigorous demands of these specialized careers.",
    duration: "Modular programs based on exam dates",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Professional course aspirants",
    courseNamesIncluded: ["CLAT / Law Entrance", "CA Foundation / Intermediate", "CS Foundation", "NCHMCT-JEE"],
    branchesIncluded: ["Law Entrance", "Chartered Accountancy", "Hotel Management"],
    subjectsCovered: ["Legal Reasoning", "Logical Reasoning", "Accounting", "Mercantile Law", "Business Economics"],
    points: ["Expert faculty from industry", "Case-study based learning", "Intensive revision and paper solving"],
    audience: ["student", "educator", "admin"],
  },

  // --- Top Government Exams ---
  {
    category: "Top Government Exams",
    standardKey: "civil-services-upsc-mpsc",
    title: "UPSC and MPSC Preparation",
    tagline: "Civil Services Excellence",
    schedule: "Morning and evening dedicated batches",
    summary: "Strategic coaching for UPSC and State PSC (MPSC) exams.",
    description: "Master the General Studies, CSAT, and Optional subjects for UPSC and MPSC. Our structured approach includes current affairs analysis, answer writing practice, and interview preparation.",
    duration: "1 year foundation / 2 year integrated",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Civil service aspirants",
    courseNamesIncluded: ["UPSC GS Foundation", "MPSC State Services", "Current Affairs Special"],
    branchesIncluded: ["Central Services", "State Administration"],
    subjectsCovered: ["History", "Geography", "Polity", "Economy", "Ethics", "CSAT"],
    points: ["Daily current affairs analysis", "Answer writing and feedback cycles", "Personalized mentorship by experts"],
    audience: ["student", "educator", "admin"],
  },
  {
    category: "Top Government Exams",
    standardKey: "ssc-banking-railway-exams",
    title: "SSC, Banking, and Railway Exams",
    tagline: "Central Government Jobs",
    schedule: "Daily practice sessions | Weekend batches",
    summary: "Comprehensive training for SSC CGL, IBPS, SBI, and Railway recruitment.",
    description: "Prepare for a career in central government with our focused track for SSC, Banking, and Railways. We emphasize speed, accuracy, and shortcut techniques for competitive edge.",
    duration: "6 months to 1 year",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Govt job aspirants",
    courseNamesIncluded: ["SSC CGL / CHSL", "Banking (IBPS/SBI PO & Clerk)", "Railway Recruitment (RRB)"],
    branchesIncluded: ["Banking Careers", "Staff Selection", "Railway Services"],
    subjectsCovered: ["Quantitative Aptitude", "Reasoning", "General Awareness", "English for Competitive Exams"],
    points: ["Speed-building shortcut techniques", "Weekly full-length mock tests", "Previous year paper analysis"],
    audience: ["student", "educator", "admin"],
  },
  {
    category: "Top Government Exams",
    standardKey: "defense-police-state-exams",
    title: "Defense, Police, and State Exams",
    tagline: "NDA, CDS, and State Jobs",
    schedule: "Morning physical + Evening academic batches",
    summary: "Coaching for Defense (NDA/CDS) and State Government jobs like Police Bharti, Talathi, etc.",
    description: "A specialized program for NDA, CDS, AFCAT, Police Bharti, and State exams like Talathi and ZP Bharti. We cover both written exam preparation and physical training guidance.",
    duration: "4 months intensive to 1 year integrated",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Defense and State job aspirants",
    courseNamesIncluded: ["NDA / CDS / AFCAT", "Police Bharti / Talathi", "ZP Bharti / Teaching Exams (CTET)"],
    branchesIncluded: ["Defense Services", "State Police", "Government Administration"],
    subjectsCovered: ["Mathematics", "General Studies", "Intelligence & Personality", "Marathi/Local Language"],
    points: ["SSB interview guidance for Defense", "State-specific syllabus coverage", "Physical fitness mentoring"],
    audience: ["student", "educator", "admin"],
  },

  // --- Top Digital & Future Skills ---
  {
    category: "Top Digital & Future Skills",
    standardKey: "ai-data-science-mastery",
    title: "AI, GenAI, and Data Science",
    tagline: "Master Future Tech",
    schedule: "Evening workshops | Weekend projects",
    summary: "Cutting-edge training in Artificial Intelligence, Generative AI, and Data Analytics.",
    description: "Learn to build and leverage AI models. This course covers everything from basic Prompt Engineering to advanced Data Science, preparing you for the most in-demand tech roles.",
    duration: "4 to 8 months certification",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Tech aspirants and professionals",
    courseNamesIncluded: ["Generative AI & Prompt Engineering", "Data Science & Analytics", "Machine Learning Fundamentals"],
    branchesIncluded: ["Artificial Intelligence", "Data Engineering", "Future Tech"],
    subjectsCovered: ["Python", "Prompt Design", "Statistical Modeling", "Data Visualization", "AI Ethics"],
    points: ["Hands-on project-based learning", "Portfolio building with real-world AI cases", "Certification from industry experts"],
    audience: ["student", "educator", "admin"],
  },
  {
    category: "Top Digital & Future Skills",
    standardKey: "coding-web-app-dev",
    title: "Coding and Full Stack Development",
    tagline: "Build Real Products",
    schedule: "Daily coding labs | Hybrid format",
    summary: "Master Full Stack Web Development and App Development from scratch.",
    description: "Become a proficient developer by mastering Frontend, Backend, and App development. Learn to build scalable applications using modern stacks and industry best practices.",
    duration: "6 months comprehensive",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Aspiring developers",
    courseNamesIncluded: ["Full Stack Web Dev", "App Development (React Native/Flutter)", "Coding & Programming Basics"],
    branchesIncluded: ["Software Engineering", "Web Technology", "Mobile Apps"],
    subjectsCovered: ["HTML/CSS/JS", "React/Next.js", "Node.js", "Databases", "Cloud Computing"],
    points: ["Build and deploy live applications", "Git & GitHub mastery", "Resume building and interview prep"],
    audience: ["student", "educator", "admin"],
  },
  {
    category: "Top Digital & Future Skills",
    standardKey: "design-video-animation",
    title: "UI/UX, Graphic Design, and Animation",
    tagline: "Creative Digital Arts",
    schedule: "Creative studio hours | Flexible",
    summary: "Learn UI/UX design, Graphic Designing, and Video Editing/Animation.",
    description: "Unlock your creativity with our design track. Master UI/UX principles, Graphic Design tools, and professional Video Editing to excel in the creative industry.",
    duration: "3 to 5 months modular",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Creative enthusiasts",
    courseNamesIncluded: ["UI/UX Designing", "Graphic Designing", "Video Editing & Animation"],
    branchesIncluded: ["Product Design", "Digital Marketing Visuals", "Motion Graphics"],
    subjectsCovered: ["Figma", "Adobe Photoshop/Illustrator", "Premiere Pro", "After Effects", "Design Theory"],
    points: ["Creative portfolio development", "Live client project simulations", "Mastering industry-standard design tools"],
    audience: ["student", "educator", "admin"],
  },
  {
    category: "Top Digital & Future Skills",
    standardKey: "marketing-stock-trading",
    title: "Digital Marketing and Stock Market",
    tagline: "Growth & Wealth Skills",
    schedule: "Weekend masterclasses | Live trading sessions",
    summary: "Master Digital Marketing, SEO, and Stock Market/Trading strategies.",
    description: "Learn to grow brands and manage wealth. This course covers comprehensive Digital Marketing strategies and disciplined Stock Market trading and investment techniques.",
    duration: "2 to 4 months",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Marketing aspirants and investors",
    courseNamesIncluded: ["Digital Marketing & SEO", "Stock Market & Trading", "Entrepreneurship Training"],
    branchesIncluded: ["Growth Marketing", "Financial Literacy", "Startup Skills"],
    subjectsCovered: ["SEO/SEM", "Social Media Marketing", "Technical Analysis", "Fundamental Analysis", "E-commerce"],
    points: ["Live trading room experience", "Real-world marketing campaigns", "Freelancing and Startup guidance"],
    audience: ["student", "educator", "admin"],
  },
  {
    category: "Top Digital & Future Skills",
    standardKey: "soft-skills-interview-prep",
    title: "Spoken English and Personality Dev",
    tagline: "Communication Excellence",
    schedule: "Morning/Evening interaction batches",
    summary: "Enhance Spoken English, Personality, and Interview/Resume skills.",
    description: "Develop the confidence to communicate effectively in any professional setting. We focus on Spoken English, public speaking, and specialized preparation for interviews and resumes.",
    duration: "2 to 3 months",
    mode: "Personal Home Tutoring / Online Tutoring",
    audienceLabel: "Students and job seekers",
    courseNamesIncluded: ["Spoken English", "Personality Development", "Resume & Interview Prep"],
    branchesIncluded: ["Communication Skills", "Soft Skills", "Career Readiness"],
    subjectsCovered: ["English Fluency", "Public Speaking", "Corporate Etiquette", "Resume Designing"],
    points: ["Mock interview sessions with feedback", "Daily speaking practice", "Confidence building workshops"],
    audience: ["student", "educator", "admin"],
  },
];

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
    "class 6th to 12th academic support": "class-6-12-school-support",
    "jee, neet, and cet preparation": "jee-neet-cet-prep",
    "sat, ielts, and toefl training": "study-abroad-exams",
    "law, mgmt, and professional exams": "professional-law-mgmt-exams",
    "upsc and mpsc preparation": "civil-services-upsc-mpsc",
    "ssc, banking, and railway exams": "ssc-banking-railway-exams",
    "defense, police, and state exams": "defense-police-state-exams",
    "ai, genai, and data science": "ai-data-science-mastery",
    "coding and full stack development": "coding-web-app-dev",
    "ui/ux, graphic design, and animation": "design-video-animation",
    "digital marketing and stock market": "marketing-stock-trading",
    "spoken english and personality dev": "soft-skills-interview-prep",
  };

  return aliasMap[normalized] ?? null;
}
