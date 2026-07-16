"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HelpingHand } from "@/components/ui-icons";
import { motion } from "motion/react";

import ToppersSection from "@/components/toppers-section";
import SpotlightSection from "@/components/spotlight-section";
import WhyChooseSmartTutors from "@/components/why-choose-smart-tutors";
import CourseModal from "@/components/course-modal";
import SmartTutorsAIChatbot from "@/components/SmartTutorsAIChatbot";
import WhatsAppFAB from "@/components/whatsapp-fab";

import type { CourseItem } from "@/lib/types";

interface CoursesRedesignClientProps {
  allCourses: CourseItem[];
}

interface AdditionalProgram {
  title: string;
  streamLabel: string;
  duration: string;
  summary: string;
  topics: string[];
  mode: string;
}

interface AdditionalProgramGroup {
  heading: string;
  standardKey: string;
  programs: AdditionalProgram[];
}

const COURSE_TABS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Govt Exams",
  "Skills",
] as const;

const TECHNOLOGY_FUTURE_SKILLS_COURSE: CourseItem = {
  id: "fallback-skills-tech-future",
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
};

const CREATIVE_DIGITAL_SKILLS_COURSE: CourseItem = {
  id: "fallback-skills-creative-digital",
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
    "Learn industry-relevant creative and digital skills including graphic design, video production, animation, game development, UI design, motion graphics, photography, videography, and content creation.",
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
    "Web Designing & Development",
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
};

const CLASS_6_ADDITIONAL_PROGRAMS: AdditionalProgram[] = [
  {
    title: "Spoken English",
    streamLabel: "Communication",
    duration: "3 Months",
    summary:
      "Build speaking confidence, pronunciation, vocabulary, and everyday communication skills.",
    topics: [
      "Greetings & Introductions",
      "Everyday Conversations & Phrases",
      "Pronunciation & Accent Training",
      "Vocabulary Building (Synonyms, Antonyms)",
      "Tenses in Speech",
      "Picture Composition & Describing",
      "Listening & Comprehension",
      "Confidence Building in Speaking",
      "Basic Grammar in Conversation",
      "Role-Play & Situational Dialogues",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Abacus",
    streamLabel: "Math Skills",
    duration: "3 Months",
    summary:
      "Improve calculation speed, focus, memory, and number confidence through abacus practice.",
    topics: [
      "Introduction to Abacus & Bead Values",
      "Single Digit Addition & Subtraction",
      "Double Digit Addition & Subtraction",
      "Mental Visualization Techniques",
      "Finger Movement & Speed Drills",
      "Number Recognition & Place Value",
      "Small Friend & Big Friend Concepts",
      "Carrying & Borrowing Techniques",
      "Basic Multiplication Introduction",
      "Memory & Concentration Exercises",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Robotics",
    streamLabel: "Technology",
    duration: "3-6 Months",
    summary:
      "Introduce basic robotics, logic building, sensors, and hands-on STEM activities.",
    topics: [
      "What is a Robot? — Types & Uses",
      "Basic Robotics Components (Motors, Sensors)",
      "Introduction to Logic & Sequencing",
      "Building Simple Circuits",
      "Understanding Sensors (IR, Ultrasonic)",
      "Basic Block-Based Coding for Robots",
      "Line Follower & Obstacle Avoidance Bots",
      "Hands-On Robot Assembly Projects",
      "STEM Innovation Challenges",
      "Introduction to AI & Smart Devices",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Olympiad Preparation",
    streamLabel: "Competitive Foundation",
    duration: "3-6 Months",
    summary:
      "Prepare for school-level Olympiads with reasoning, science, maths, and practice tests.",
    topics: [
      "Verbal & Non-Verbal Reasoning",
      "Number Sense & Place Value",
      "Patterns & Sequences",
      "Basic Geometry & Mensuration",
      "Science Fundamentals (Physics, Chemistry, Biology)",
      "Data Handling & Graphs",
      "Logical Puzzles & Coding-Decoding",
      "Everyday Mathematics Application",
      "Achievers Section (HOTS Questions)",
      "Mock Tests & Previous Year Papers",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "UPSC Foundation",
    streamLabel: "General Awareness",
    duration: "3-6 Months",
    summary:
      "Develop early awareness of history, geography, current affairs, civics, and India knowledge.",
    topics: [
      "Indian History — Ancient, Medieval, Modern",
      "Indian Geography — Physical & Political",
      "Indian Polity — Constitution Basics",
      "Current Affairs & News Awareness",
      "Civics & Governance",
      "Indian Culture & Heritage",
      "World Geography Introduction",
      "Map Reading & Identification",
      "Thinking & Analytical Skills",
      "Communication & Expression",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Personality Development",
    streamLabel: "Confidence",
    duration: "3 Months",
    summary:
      "Improve confidence, behaviour, communication, manners, and classroom participation.",
    topics: [
      "Self-Awareness & SWOT Analysis",
      "Building Self-Confidence",
      "Body Language & Posture",
      "Positive Thinking & Attitude",
      "Time Management & Discipline",
      "Social Etiquette & Manners",
      "Goal Setting & Motivation",
      "Stress Management Basics",
      "Interpersonal Skills",
      "Leadership Qualities for Students",
    ],
    mode: "Home / Online Tutoring",
  },
];

const CLASS_7_ADDITIONAL_PROGRAMS: AdditionalProgram[] = [
  ...CLASS_6_ADDITIONAL_PROGRAMS,
  {
    title: "Public Speaking",
    streamLabel: "Communication",
    duration: "3 Months",
    summary:
      "Train students to speak clearly, present ideas, and participate confidently in school activities.",
    topics: [
      "Overcoming Stage Fear",
      "Speech Structure — Opening, Body, Conclusion",
      "Voice Modulation & Projection",
      "Impromptu Speaking Techniques",
      "Storytelling & Narrative Skills",
      "Debate Fundamentals",
      "Persuasive Speaking",
      "Using Visual Aids in Presentations",
      "Audience Engagement Methods",
      "Group Discussion & Exchange of Ideas",
    ],
    mode: "Home / Online Tutoring",
  },
];

const CLASS_8_ADDITIONAL_PROGRAMS: AdditionalProgram[] = [
  {
    title: "Robotics",
    streamLabel: "Technology",
    duration: "3-6 Months",
    summary:
      "Learn robotics basics, logic, sensors, and practical STEM-based project activities.",
    topics: [
      "Robot Classification & Applications",
      "Mechanical & Electrical Systems",
      "Sensors & Actuators (IR, Ultrasonic, Servo)",
      "Microcontroller Programming (Arduino Basics)",
      "Logic Gates & Decision Making",
      "Autonomous Navigation Concepts",
      "Robot Arm & Manipulator Basics",
      "3D Modelling for Robot Parts",
      "IoT & Connected Robots Introduction",
      "Hands-On Project: Build a Smart Robot",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Abacus",
    streamLabel: "Math Skills",
    duration: "3 Months",
    summary:
      "Improve calculation speed, concentration, memory, and numerical confidence.",
    topics: [
      "Triple Digit Addition & Subtraction",
      "Multiplication on Abacus",
      "Division Basics on Abacus",
      "Mental Math Visualization",
      "Speed & Accuracy Drills",
      "BODMAS / Order of Operations",
      "Decimal Introduction",
      "Fraction Basics",
      "Competitive Exam Math Patterns",
      "Mixed Operation Speed Challenges",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Artificial Intelligence (Basics)",
    streamLabel: "Future Skills",
    duration: "3-6 Months",
    summary:
      "Introduce AI concepts, smart tools, basic automation ideas, and future technology awareness.",
    topics: [
      "What is AI? — Real-World Applications",
      "AI vs Machine Learning vs Deep Learning",
      "AI Project Cycle — Problem to Solution",
      "Data Collection & Data Types",
      "Introduction to Python Programming",
      "Variables, Loops & Conditions in Python",
      "Decision Trees & Rule-Based Systems",
      "Neural Networks — Simple Concepts",
      "Computer Vision Basics",
      "Natural Language Processing Introduction",
      "AI Ethics, Bias & Responsible AI",
      "Hands-On: Build a Simple AI Model",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Olympiad Preparation",
    streamLabel: "Competitive Foundation",
    duration: "3-6 Months",
    summary:
      "Practice maths, science, reasoning, and Olympiad-style questions with structured guidance.",
    topics: [
      "Advanced Logical Reasoning",
      "Integers, Fractions & Decimals",
      "Ratio & Proportion",
      "Basic Algebra & Simple Equations",
      "Geometry — Lines, Angles, Triangles",
      "Mensuration — Perimeter & Area",
      "Science: Force, Energy, Cells, Environment",
      "Data Handling — Mean, Median, Mode",
      "Blood Relations & Venn Diagrams",
      "Previous Year Olympiad Paper Practice",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "UPSC Foundation",
    streamLabel: "General Awareness",
    duration: "3-6 Months",
    summary:
      "Build early knowledge of history, polity, geography, current affairs, and civic awareness.",
    topics: [
      "Indian History — Mughal to Freedom Struggle",
      "Indian Polity — Fundamental Rights & Duties",
      "Indian Geography — Rivers, Mountains, Climate",
      "Economic Basics — GDP, Inflation, Budget",
      "Current Affairs (Weekly Updates)",
      "Indian Constitution — Preamble & Parts",
      "World History Overview",
      "Environment & Ecology Basics",
      "Map-Based Questions Practice",
      "Answer Writing & Expression Skills",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Public Speaking",
    streamLabel: "Communication",
    duration: "3 Months",
    summary:
      "Develop stage confidence, speech delivery, presentation skills, and clear expression.",
    topics: [
      "Public Speaking Anxiety Management",
      "Speech Writing & Structuring",
      "Voice Modulation & Pace Control",
      "Debate Format & Argumentation",
      "Extempore Speaking Practice",
      "Mock Press Conference & Panel Discussion",
      "Presentation Design & Delivery",
      "Media Training Basics",
      "Confidence Building Exercises",
      "Peer Feedback & Improvement",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Personality Development",
    streamLabel: "Confidence",
    duration: "3 Months",
    summary:
      "Improve self-confidence, social behaviour, discipline, and personal presentation.",
    topics: [
      "Self-Confidence Building Exercises",
      "Assertive Communication",
      "Grooming & Personal Hygiene",
      "Time Management & Productivity",
      "Goal Setting — Short & Long Term",
      "Emotional Intelligence Basics",
      "Public Manners & Social Graces",
      "Teamwork & Collaboration",
      "Decision Making & Problem Solving",
      "Interview Preparation Basics",
    ],
    mode: "Home / Online Tutoring",
  },
];

const CLASS_9_ADDITIONAL_PROGRAMS: AdditionalProgram[] = [
  {
    title: "JEE Foundation",
    streamLabel: "Science Stream",
    duration: "3-6 Months",
    summary:
      "Start early preparation for engineering entrance concepts through maths and science foundations.",
    topics: [
      "Algebra — Polynomials, Quadratic Equations",
      "Trigonometry — Ratios, Identities, Heights & Distances",
      "Coordinate Geometry — Distance & Section Formula",
      "Physics — Force, Motion, Laws of Newton",
      "Work, Energy & Power",
      "Current Electricity & Ohm's Law",
      "Chemistry — Atoms, Molecules, Periodic Table",
      "Acids, Bases & Salts",
      "Geometry — Triangles, Circles, Area",
      "Problem Solving & Logical Thinking",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "NEET Foundation",
    streamLabel: "Medical Stream",
    duration: "3-6 Months",
    summary:
      "Build early biology, chemistry, and science fundamentals for future medical entrance preparation.",
    topics: [
      "Cell Biology — Structure & Function",
      "Tissues & Organ Systems",
      "Diversity in Living Organisms",
      "Heredity & Evolution Basics",
      "Physics — Motion, Force, Gravitation",
      "Work, Energy & Sound",
      "Chemistry — Matter, Atoms, Elements",
      "Periodic Classification of Elements",
      "Environmental Science & Ecology",
      "NCERT-Based Concept Building",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "UPSC Foundation",
    streamLabel: "General Awareness",
    duration: "3-6 Months",
    summary:
      "Develop early understanding of history, geography, civics, current affairs, and India studies.",
    topics: [
      "Ancient India — Indus Valley, Vedic Period",
      "Medieval India — Sultanate, Mughals",
      "Modern India — Colonial Rule & Freedom Struggle",
      "Indian Geography — Physiography & Climate",
      "Indian Polity — Parliament, Judiciary, Executive",
      "Economic Concepts — Sectors, Banking, Taxation",
      "Current Affairs Analysis",
      "Environment & Biodiversity",
      "International Organizations & Events",
      "Answer Writing & Critical Thinking",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Police / Army Bharti",
    streamLabel: "Defence Foundation",
    duration: "3-6 Months",
    summary:
      "Introduce defence career awareness, basic aptitude, discipline, and fitness guidance.",
    topics: [
      "Defence Career Awareness & Structure",
      "Physical Fitness & Training Basics",
      "Running, Endurance & Stamina Drills",
      "Basic Arithmetic & Numerical Ability",
      "General Knowledge — India & World",
      "Current Affairs for Defence Exams",
      "Reasoning & Mental Ability",
      "English & Hindi Grammar Basics",
      "Map Reading & Direction Sense",
      "Discipline, Values & Motivation",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Robotics",
    streamLabel: "Technology",
    duration: "3-6 Months",
    summary:
      "Learn robotics concepts, logic building, electronics basics, and project-based STEM skills.",
    topics: [
      "Robot Types, Classification & Applications",
      "Mechanical Systems — Gears, Linkages, Joints",
      "Electronics — Resistors, LEDs, Circuits",
      "Arduino Programming (C/C++ Basics)",
      "Sensor Integration — IR, Ultrasonic, LDR",
      "Motor Control — DC, Servo, Stepper",
      "Degree of Freedom & Motion Planning",
      "Robot Kinematics Introduction",
      "Autonomous Robot Design",
      "Capstone Project: Smart Robot Build",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Artificial Intelligence (Basics)",
    streamLabel: "Future Skills",
    duration: "3-6 Months",
    summary:
      "Understand AI fundamentals, smart tools, automation, and future digital opportunities.",
    topics: [
      "AI Domains — Data, Computer Vision, NLP",
      "AI Project Cycle — Problem to Deployment",
      "Data Collection, Cleaning & Visualization",
      "Python Programming — Variables, Lists, Loops",
      "Decision Trees & Model Building",
      "Introduction to Neural Networks",
      "Computer Vision — Image Recognition",
      "NLP — Chatbots & Text Analysis",
      "AI in Healthcare, Transport & Agriculture",
      "AI Ethics, Bias & Social Impact",
      "No-Code AI Tools (Teachable Machine)",
      "Hands-On: Build & Train a Model",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Video/Graphic Editing",
    streamLabel: "Creative Digital",
    duration: "3 Months",
    summary:
      "Learn basic design, editing, visual storytelling, and beginner-friendly digital creation tools.",
    topics: [
      "Introduction to Canva & Design Basics",
      "Colour Theory & Typography",
      "Image Editing — Cropping, Filters, Retouching",
      "Logo & Banner Design",
      "Social Media Post Design",
      "Video Editing — Cuts, Transitions, Effects",
      "Audio Syncing & Background Music",
      "Typography in Video & Graphics",
      "Content Creation for Instagram & YouTube",
      "Building a Design Portfolio",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Spoken English",
    streamLabel: "Communication",
    duration: "3 Months",
    summary:
      "Improve fluency, vocabulary, pronunciation, and confidence in spoken communication.",
    topics: [
      "Grammar in Speech — Tenses & Agreement",
      "Pronunciation & Stress Patterns",
      "Vocabulary Building — Root Words & Idioms",
      "Daily Conversation & Situational English",
      "Picture Description & Narration",
      "Debate & Group Discussion",
      "Interview Skills & Mock Interviews",
      "Presentation Speaking",
      "News Reading & Comprehension",
      "Exam Viva & Oral Communication",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Personality Development",
    streamLabel: "Confidence",
    duration: "3 Months",
    summary:
      "Build confidence, communication, behaviour, presentation, and personal discipline.",
    topics: [
      "Self-Discovery & Strength Identification",
      "Growth Mindset Development",
      "Body Language & Eye Contact",
      "Effective Communication Skills",
      "Time Management & Prioritization",
      "Emotional Intelligence & Empathy",
      "Conflict Resolution & Negotiation",
      "Personal Branding for Students",
      "Interview & Group Discussion Skills",
      "Career Awareness & Goal Planning",
    ],
    mode: "Home / Online Tutoring",
  },
];

const CLASS_10_ADDITIONAL_PROGRAMS: AdditionalProgram[] = [
  {
    title: "JEE Foundation",
    streamLabel: "Science Stream",
    duration: "3-6 Months",
    summary:
      "Prepare early for engineering entrance concepts while balancing Class 10 board studies.",
    topics: [
      "Quadratic Equations & Arithmetic Progressions",
      "Trigonometry — Heights & Distances",
      "Coordinate Geometry — Lines & Slopes",
      "Physics — Light, Reflection, Refraction",
      "Electricity & Magnetic Effects",
      "Chemistry — Chemical Reactions, Acids & Bases",
      "Metals & Non-Metals",
      "Periodic Table & Periodicity",
      "Surface Area & Volume (Mensuration)",
      "Board + Entrance Integrated Problem Practice",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "NEET Foundation",
    streamLabel: "Medical Stream",
    duration: "3-6 Months",
    summary:
      "Strengthen science concepts for future medical entrance preparation and stream planning.",
    topics: [
      "Life Processes — Nutrition, Circulation, Respiration",
      "Control & Coordination — Nervous System",
      "Reproduction & Heredity",
      "Evolution & Classification",
      "Light — Reflection & Refraction",
      "Electricity & Its Effects",
      "Chemical Reactions & Equations",
      "Carbon & Its Compounds",
      "Our Environment & Ecosystem",
      "NCERT-Based Deep Dive & MCQ Practice",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "UPSC Foundation",
    streamLabel: "General Awareness",
    duration: "3-6 Months",
    summary:
      "Build early awareness of history, geography, polity, current affairs, and civic studies.",
    topics: [
      "Indian Freedom Movement — Complete",
      "Post-Independence India",
      "Indian Geography — Resources & Industries",
      "Indian Polity — Constitution in Detail",
      "Economic Development — Five Year Plans",
      "Current Affairs — National & International",
      "Environment & Climate Change",
      "Science & Technology Developments",
      "Ethics & Human Values",
      "Map Practice & Answer Writing",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Police / Army Bharti",
    streamLabel: "Defence Foundation",
    duration: "3-6 Months",
    summary:
      "Introduce aptitude, defence career awareness, discipline, and basic physical-readiness guidance.",
    topics: [
      "Written Exam Syllabus Overview",
      "Numerical Ability — Speed, Distance, Ratio",
      "Reasoning — Series, Coding, Analogies",
      "General Knowledge — India & World",
      "Current Affairs (Defence & Security Focus)",
      "English Comprehension & Grammar",
      "Physical Fitness — Running, Push-Ups, Planks",
      "Obstacle Course Awareness",
      "Map Reading & Direction Sense",
      "Previous Year Question Practice",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Robotics",
    streamLabel: "Technology",
    duration: "3-6 Months",
    summary:
      "Learn robotics, electronics basics, logical thinking, and practical project work.",
    topics: [
      "Robot Anatomy — Mechanical, Electrical, Computing",
      "Microcontroller Programming (Arduino / ESP32)",
      "Sensor Arrays — Multi-Sensor Integration",
      "Motor Drivers & H-Bridge Circuits",
      "PID Control & Feedback Systems",
      "Bluetooth & WiFi Controlled Robots",
      "Line Follower to Maze Solver Progression",
      "Drone Basics & Aerodynamics Intro",
      "IoT — Connecting Robots to Cloud",
      "Final Project: Autonomous Robot Competition",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Artificial Intelligence (Basics)",
    streamLabel: "Future Skills",
    duration: "3-6 Months",
    summary:
      "Explore AI concepts, digital tools, automation thinking, and future technology careers.",
    topics: [
      "AI Project Cycle — Advanced Problem Scoping",
      "Statistical Data & No-Code AI Tools",
      "Supervised, Unsupervised & Reinforcement Learning",
      "Python — Functions, Lists, Dictionaries",
      "Model Evaluation & Accuracy Metrics",
      "Computer Vision — Face & Object Detection",
      "NLP — Sentiment Analysis & Chatbots",
      "AI in Real World — Healthcare, Transport, Finance",
      "AI Bias, Fairness & Ethics",
      "Capstone: Build an End-to-End AI Project",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Video Editing",
    streamLabel: "Creative Digital",
    duration: "3 Months",
    summary:
      "Learn beginner-friendly video editing, content creation, visual cuts, and storytelling.",
    topics: [
      "Introduction to Video Editing Software",
      "Timeline, Cuts & Transitions",
      "Colour Correction & Grading Basics",
      "Audio Editing & Background Music",
      "Text Overlays & Subtitles",
      "Motion Graphics Introduction",
      "Green Screen & Chroma Key",
      "YouTube & Reels Editing Workflow",
      "Export Settings for Different Platforms",
      "Portfolio: Create a Short Film or Vlog",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Spoken English",
    streamLabel: "Communication",
    duration: "3 Months",
    summary:
      "Improve fluency, pronunciation, vocabulary, and confidence for school and interviews.",
    topics: [
      "Advanced Grammar in Use",
      "Pronunciation & Fluency Drills",
      "Vocabulary Expansion — Academic & Professional",
      "Essay & Paragraph Speaking",
      "Group Discussion & Debate",
      "Mock Interview — School & College",
      "Phone & Email Communication",
      "Presentation Skills",
      "Reading Comprehension & Retelling",
      "Board Viva & Oral Exam Preparation",
    ],
    mode: "Home / Online Tutoring",
  },
  {
    title: "Career Counselling",
    streamLabel: "Career Planning",
    duration: "Short Term",
    summary:
      "Get guidance for stream selection, career options, entrance exams, and future planning.",
    topics: [
      "Stream Selection — Science, Commerce, Arts",
      "Career Assessment & Aptitude Testing",
      "Top Career Paths — Engineering, Medical, Law, Management",
      "Entrance Exam Roadmap (JEE, NEET, CET, CUET)",
      "Professional Courses — BBA, BCA, BCom, Design",
      "Study in India vs Study Abroad",
      "Scholarship & Financial Aid Guidance",
      "Resume & Profile Building",
      "Parent-Student Career Discussion",
      "Action Plan & Goal Setting",
    ],
    mode: "Online / Counselling Session",
  },
];

function getAdditionalProgramDuration(title: string) {
  const fullYearPrograms = [
    "JEE",
    "NEET",
    "All MHT CET Exam",
    "CUET",
    "NDA",
    "CLAT",
    "CA Foundation",
    "CS Foundation",
    "CMA Foundation",
    "IPMAT",
    "NPAT",
    "UPSC Foundation",
  ];

  const sixToTwelveMonthPrograms = [
    "Police/Army Bharti",
    "IMU CET",
    "NCHMCT JEE",
    "SSC CHSL",
    "Railway",
  ];

  const shortSkillPrograms = [
    "Video Editing",
    "Spoken English",
    "Interview & Personality Development",
  ];

  if (fullYearPrograms.includes(title)) {
    return "12 Months";
  }

  if (sixToTwelveMonthPrograms.includes(title)) {
    return "6-12 Months";
  }

  if (shortSkillPrograms.includes(title)) {
    return "3-6 Months";
  }

  return "6-12 Months";
}

const CLASS_11_ADDITIONAL_PROGRAMS: AdditionalProgram[] = [
  "JEE",
  "NEET",
  "All MHT CET Exam",
  "CUET",
  "NDA",
  "Police/Army Bharti",
  "IMU CET",
  "NCHMCT JEE",
  "CLAT",
  "CA Foundation",
  "CS Foundation",
  "CMA Foundation",
  "IPMAT",
  "NPAT",
  "UPSC Foundation",
  "SSC CHSL",
  "Railway",
  "Video Editing",
  "Spoken English",
  "Interview & Personality Development",
].map((title) => ({
  title,
  streamLabel: getProgramStreamLabel(title),
  duration: getAdditionalProgramDuration(title),
  summary: getProgramSummary(title),
  topics: getProgramTopics(title),
  mode: "Home / Online Tutoring",
}));

const CLASS_12_ADDITIONAL_PROGRAMS: AdditionalProgram[] = [
  "JEE",
  "NEET",
  "All MHT CET Exam",
  "CUET",
  "NDA",
  "Police/Army Bharti",
  "IMU CET",
  "NCHMCT JEE",
  "CLAT",
  "CA Foundation",
  "CS Foundation",
  "CMA Foundation",
  "IPMAT",
  "NPAT",
  "UPSC Foundation",
  "Railway",
  "SSC CHSL",
  "Video Editing",
  "Spoken English",
  "Interview & Personality Development",
].map((title) => ({
  title,
  streamLabel: getProgramStreamLabel(title),
  duration: getAdditionalProgramDuration(title),
  summary: getProgramSummary(title),
  topics: getProgramTopics(title),
  mode: "Home / Online Tutoring",
}));

function isCourseTab(tab: string | null): tab is (typeof COURSE_TABS)[number] {
  return (
    tab !== null && COURSE_TABS.includes(tab as (typeof COURSE_TABS)[number])
  );
}

function getProgramStreamLabel(title: string) {
  if (["JEE", "NEET", "All MHT CET Exam"].includes(title)) {
    return "Science Stream";
  }

  if (
    [
      "CA Foundation",
      "CS Foundation",
      "CMA Foundation",
      "IPMAT",
      "NPAT",
    ].includes(title)
  ) {
    return "Commerce / Management";
  }

  if (["CLAT", "CUET", "NCHMCT JEE", "IMU CET"].includes(title)) {
    return "Entrance Exam";
  }

  if (
    [
      "NDA",
      "Police/Army Bharti",
      "UPSC Foundation",
      "SSC",
      "Railway",
    ].includes(title)
  ) {
    return "Govt / Defence";
  }

  if (
    [
      "Video Editing",
      "Spoken English",
      "Interview & Personality Development",
    ].includes(title)
  ) {
    return "Skills";
  }

  return "Additional Program";
}

function getProgramSummary(title: string) {
  const summaries: Record<string, string> = {
    JEE: "Focused preparation for engineering entrance concepts, problem solving, and practice strategy.",
    NEET: "Medical entrance foundation with biology, chemistry, physics, revision, and test practice.",
    "All MHT CET Exam":
      "Preparation support for Maharashtra entrance exam categories based on the chosen career path.",
    CUET: "Subject-focused CUET preparation with concept revision, practice, and mock tests.",
    NDA: "Defence entrance preparation with maths, general ability, discipline, and interview readiness.",
    "Police/Army Bharti":
      "Aptitude, general awareness, and fitness guidance for police and army recruitment paths.",
    "IMU CET":
      "Preparation for maritime and merchant navy entrance pathway through IMU CET.",
    "NCHMCT JEE":
      "Hotel management entrance preparation with aptitude, reasoning, English, and awareness.",
    CLAT: "Law entrance preparation with legal aptitude, reasoning, English, and current affairs.",
    "CA Foundation":
      "Foundation support for accountancy, business law, economics, and quantitative aptitude.",
    "CS Foundation":
      "Company secretary foundation guidance with business, law, economics, and communication basics.",
    "CMA Foundation":
      "Cost and management accountancy foundation support with commerce and quantitative concepts.",
    IPMAT:
      "Integrated management entrance preparation with aptitude, reasoning, and communication.",
    NPAT: "Management and commerce entrance preparation with aptitude, English, and reasoning.",
    "UPSC Foundation":
      "Early UPSC foundation with history, polity, geography, economics, and current affairs.",
    "SSC":
      "Government exam preparation with reasoning, maths, English, and general awareness.",
    Railway:
      "Railway exam foundation with maths, reasoning, general science, and general awareness.",
    "Video Editing":
      "Learn beginner-friendly video editing, visual storytelling, reels, and content creation.",
    "Spoken English":
      "Improve speaking fluency, vocabulary, pronunciation, confidence, and daily communication.",
    "Interview & Personality Development":
      "Build interview confidence, presentation, communication, grooming, and personality skills.",
  };

  return (
    summaries[title] ??
    "Focused additional programme with structured mentoring, practice, and progress tracking."
  );
}

function getProgramTopics(title: string): string[] {
  const topicMap: Record<string, string[]> = {
    JEE: [
      "Mathematics — Algebra, Calculus, Coordinate Geometry",
      "Physics — Mechanics, Thermodynamics, Optics",
      "Chemistry — Organic, Inorganic, Physical Chemistry",
      "Problem Solving & Speed Techniques",
      "Previous Year JEE Question Practice",
      "Mock Tests & Performance Analysis",
    ],
    NEET: [
      "Biology — Cell, Genetics, Ecology, Human Physiology",
      "Physics — Mechanics, Electricity, Magnetism",
      "Chemistry — Organic, Inorganic, Physical",
      "NCERT-Based Concept Mastery",
      "MCQ Practice & Time Management",
      "Mock Tests & Revision Strategy",
    ],
    "All MHT CET Exam": [
      "Physics — Mechanics, Waves, Electricity, Magnetism",
      "Chemistry — Physical, Organic, Inorganic",
      "Mathematics — Algebra, Calculus, Trigonometry",
      "State Board Syllabus Focus",
      "Practice Papers & Mock Tests",
      "Exam Strategy & Time Management",
    ],
    CUET: [
      "Domain-Specific Subjects (Science, Commerce, Arts)",
      "General Test — Reasoning, GK, Quant",
      "Language Proficiency (English / Hindi)",
      "Subject-Wise Concept Revision",
      "Mock Tests & Previous Year Papers",
      "University Admission Guidance",
    ],
    NDA: [
      "Mathematics — Algebra, Trigonometry, Calculus",
      "General Ability — English, GK, Science",
      "Current Affairs & Defence Awareness",
      "Physical Fitness Preparation",
      "SSB Interview & Personality Test",
      "Previous Year Paper Practice",
    ],
    "Police/Army Bharti": [
      "Numerical Ability — Arithmetic, Mensuration",
      "Reasoning — Series, Coding, Analogies",
      "General Knowledge — India & World",
      "English / Marathi Grammar",
      "Physical Fitness — Running, Endurance",
      "Previous Year Question Practice",
    ],
    "IMU CET": [
      "English — Grammar, Comprehension, Vocabulary",
      "General Knowledge — Maritime & Current Affairs",
      "Mathematics — Algebra, Trigonometry, Calculus",
      "Physics — Mechanics, Waves, Optics",
      "Chemistry — Elements, Compounds, Reactions",
      "Maritime Awareness & Career Guidance",
    ],
    "NCHMCT JEE": [
      "English Language — Grammar & Comprehension",
      "Numerical Ability — Arithmetic & Reasoning",
      "Logical Reasoning & Analytical Ability",
      "General Knowledge — Tourism & Hospitality",
      "Service Aptitude & Personality Traits",
      "Hotel Management Career Awareness",
    ],
    CLAT: [
      "Legal Aptitude — Principles & Application",
      "Logical Reasoning — Patterns & Arguments",
      "English — Comprehension & Grammar",
      "General Knowledge — Current Affairs",
      "Mathematics — Basic Numerical Ability",
      "Constitutional Law & Legal Awareness",
    ],
    "CA Foundation": [
      "Accounting — Principles & Practice",
      "Business Laws — Indian Contract, Sale of Goods",
      "Economics — Micro & Macro Basics",
      "Quantitative Aptitude — Maths & Statistics",
      "Mercantile Laws & Ethics",
      "Mock Tests & ICAI Pattern Practice",
    ],
    "CS Foundation": [
      "Business Environment & Management",
      "Business Laws — Company Law Basics",
      "Economic & Commercial Laws",
      "Tax Laws — Income Tax & GST Introduction",
      "Auditing Basics",
      "Communication & Business Correspondence",
    ],
    "CMA Foundation": [
      "Cost Accounting — Basics & Fundamentals",
      "Management Accounting Introduction",
      "Financial Accounting — Journal, Ledger, Trial Balance",
      "Business Mathematics & Statistics",
      "Economics — Micro & Macro Basics",
      "Business Laws & Ethics",
    ],
    IPMAT: [
      "Quantitative Aptitude — Maths & Data Interpretation",
      "Logical Reasoning — Puzzles & Sequences",
      "Verbal Ability — Grammar, Vocabulary, Reading",
      "General Awareness — Business & Current Affairs",
      "Mock Tests & Previous Year Papers",
      "PI & WAT Preparation",
    ],
    NPAT: [
      "Quantitative & Numerical Ability",
      "Reasoning & General Intelligence",
      "English Language & Proficiency",
      "General Awareness — Business & Current Affairs",
      "Data Interpretation & Analysis",
      "Mock Tests & Exam Strategy",
    ],
    "UPSC Foundation": [
      "Indian History — Ancient, Medieval, Modern",
      "Indian Polity — Constitution & Governance",
      "Indian Geography — Physical & Economic",
      "Economics — Concepts & Current Developments",
      "Current Affairs — National & International",
      "Ethics, Integrity & Aptitude",
    ],
    SSC: [
      "Quantitative Aptitude — Arithmetic & Advanced",
      "General Intelligence & Reasoning",
      "English Language — Grammar & Comprehension",
      "General Awareness — GK & Current Affairs",
      "Computer Basics",
      "Tier-Wise Preparation Strategy",
    ],
    Railway: [
      "Mathematics — Arithmetic, Algebra, Mensuration",
      "Reasoning — Analogies, Classification, Series",
      "General Science — Physics, Chemistry, Biology",
      "General Awareness — India & Current Affairs",
      "Speed & Accuracy Drills",
      "Previous Year Railway Paper Practice",
    ],
    "Video Editing": [
      "Video Editing Software Basics (Premiere Pro / CapCut)",
      "Cuts, Trims & Transitions",
      "Colour Correction & Grading",
      "Audio Syncing & Background Music",
      "Motion Graphics & Text Animation",
      "YouTube & Reels Editing Workflow",
    ],
    "Spoken English": [
      "Fluency & Pronunciation Drills",
      "Vocabulary Building — Idioms & Phrases",
      "Grammar in Conversation",
      "Debate, GD & Presentation Skills",
      "Mock Interview Practice",
      "Daily Use English Communication",
    ],
    "Interview & Personality Development": [
      "Resume & CV Building",
      "Mock Interview — HR & Technical",
      "Body Language & Confidence Building",
      "Group Discussion Techniques",
      "Grooming & Professional Appearance",
      "Career Planning & Self-Presentation",
    ],
  };

  return (
    topicMap[title] ?? [
      "Structured curriculum with theory & practice",
      "Regular assessments & progress tracking",
      "Hands-on projects & practical application",
      "Expert faculty guidance",
      "Previous year question practice",
      "Performance analysis & feedback",
    ]
  );
}

function getAdditionalProgramGroups(activeTab: string): AdditionalProgramGroup[] {
  switch (activeTab) {
    case "Class 6":
      return [
        {
          heading: "Additional Programs in Class 6",
          standardKey: "class-6-additional",
          programs: CLASS_6_ADDITIONAL_PROGRAMS,
        },
      ];

    case "Class 7":
      return [
        {
          heading: "Additional Programs in Class 7",
          standardKey: "class-7-additional",
          programs: CLASS_7_ADDITIONAL_PROGRAMS,
        },
      ];

    case "Class 8":
      return [
        {
          heading: "Additional Programs in Class 8",
          standardKey: "class-8-additional",
          programs: CLASS_8_ADDITIONAL_PROGRAMS,
        },
      ];

    case "Class 9":
      return [
        {
          heading: "Additional Programs in Class 9",
          standardKey: "class-9-additional",
          programs: CLASS_9_ADDITIONAL_PROGRAMS,
        },
      ];

    case "Class 10":
      return [
        {
          heading: "Additional Programs in Class 10",
          standardKey: "class-10-additional",
          programs: CLASS_10_ADDITIONAL_PROGRAMS,
        },
      ];

    case "Class 11":
      return [
        {
          heading: "Additional Programs in Class 11",
          standardKey: "class-11-additional",
          programs: CLASS_11_ADDITIONAL_PROGRAMS,
        },
      ];

    case "Class 12":
      return [
        {
          heading: "Additional Programs in Class 12",
          standardKey: "class-12-additional",
          programs: CLASS_12_ADDITIONAL_PROGRAMS,
        },
      ];

    default:
      return [];
  }
}

function AdditionalProgramsSection({
  activeTab,
  searchQuery,
  allCourses,
  onSelectCourse,
}: {
  activeTab: string;
  searchQuery: string;
  allCourses: CourseItem[];
  onSelectCourse: (course: CourseItem, additionalProgram?: string, topics?: string[]) => void;
}) {
  const groups = useMemo(() => {
    const baseGroups = getAdditionalProgramGroups(activeTab);
    const q = searchQuery.trim().toLowerCase();

    if (!q) {
      return baseGroups;
    }

    return baseGroups
      .map((group) => ({
        ...group,
        programs: group.programs.filter(
          (program) =>
            program.title.toLowerCase().includes(q) ||
            program.streamLabel.toLowerCase().includes(q) ||
            program.summary.toLowerCase().includes(q) ||
            program.topics?.some((topic) =>
              topic.toLowerCase().includes(q),
            ),
        ),
      }))
      .filter((group) => group.programs.length > 0);
  }, [activeTab, searchQuery]);

  if (!groups.length) {
    return null;
  }

function openEnrollment(standardKey: string, programTitle: string, topics: string[] = []) {
  const matchingCourse = allCourses.find(
    (course) => course.standardKey === standardKey,
  );

  if (matchingCourse) {
    onSelectCourse(matchingCourse, programTitle, topics);
  }
}

  return (
    <section className="space-y-8">
      {groups.map((group) => (
        <div key={group.heading} className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm sm:text-base font-display font-black uppercase tracking-tight text-slate-950">
              {group.heading}
            </h2>

            <span className="hidden sm:inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Optional add-ons
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {group.programs.map((program) => (
              <motion.article
                key={`${group.heading}-${program.title}`}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                    {program.streamLabel}
                  </span>

                  <span className="text-[9px] font-bold text-slate-400">
                    {program.duration}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="font-display text-base font-black leading-snug text-slate-950">
                    {program.title}
                  </h3>

                  <span className="inline-flex rounded bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-blue-600">
                    {activeTab}
                  </span>

                  <p className="text-xs font-medium leading-relaxed text-slate-500">
                    {program.summary}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                    {program.mode}
                  </span>

                  <button
                    type="button"
                    onClick={() => openEnrollment(group.standardKey, program.title, program.topics ?? [])}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 transition-colors hover:text-blue-800"
                  >
                    Enroll Now
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded border border-blue-200 text-[9px]">
                      +
                    </span>
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function CoursesRedesignClient({
  allCourses,
}: CoursesRedesignClientProps) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

const [activeTab, setActiveTab] = useState("Class 6");
const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
const [selectedAdditionalProgram, setSelectedAdditionalProgram] =
  useState<string>("");
const [selectedProgramTopics, setSelectedProgramTopics] =
  useState<string[]>([]);

  useEffect(() => {
    if (isCourseTab(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  const searchQuery = searchParams.get("search") ?? "";

  const coursesWithRequiredSkills = useMemo<CourseItem[]>(() => {
    const coursesWithoutForcedSkills = allCourses.filter(
      (course: CourseItem) =>
        course.standardKey !== "skills-tech-future" &&
        course.standardKey !== "skills-creative-digital",
    );

    const communicationIndex = coursesWithoutForcedSkills.findIndex(
      (course: CourseItem) => course.standardKey === "skills-communication",
    );

    if (communicationIndex === -1) {
      return [
        TECHNOLOGY_FUTURE_SKILLS_COURSE,
        CREATIVE_DIGITAL_SKILLS_COURSE,
        ...coursesWithoutForcedSkills,
      ];
    }

    return [
      ...coursesWithoutForcedSkills.slice(0, communicationIndex + 1),
      TECHNOLOGY_FUTURE_SKILLS_COURSE,
      ...coursesWithoutForcedSkills.slice(communicationIndex + 1),
      CREATIVE_DIGITAL_SKILLS_COURSE,
    ];
  }, [allCourses]);

  const filteredCourses = useMemo<CourseItem[]>(() => {
    if (!searchQuery.trim()) {
      return coursesWithRequiredSkills;
    }

    const q = searchQuery.toLowerCase();

    return coursesWithRequiredSkills.filter(
      (course: CourseItem) =>
        course.title.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q) ||
        course.tagline.toLowerCase().includes(q) ||
        course.summary.toLowerCase().includes(q) ||
        course.subjectsCovered.some((subject: string) =>
          subject.toLowerCase().includes(q),
        ) ||
        course.courseNamesIncluded.some((courseName: string) =>
          courseName.toLowerCase().includes(q),
        ),
    );
  }, [coursesWithRequiredSkills, searchQuery]);

  return (
    <div
      id="smart-tutors-root"
      className="flex min-h-screen flex-col bg-slate-50/50 font-sans selection:bg-blue-100 selection:text-blue-950"
    >
      <main className="mx-auto flex-1 w-full max-w-7xl space-y-12 px-4 pb-8 pt-4 sm:space-y-16 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8">
<SpotlightSection
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  onSelectCourse={(course) => {
    setSelectedAdditionalProgram("");
    setSelectedCourse(course);
  }}
  allCourses={filteredCourses}
/>

<AdditionalProgramsSection
  activeTab={activeTab}
  searchQuery={searchQuery}
  allCourses={coursesWithRequiredSkills}
  onSelectCourse={(course, additionalProgram, topics) => {
    setSelectedAdditionalProgram(additionalProgram ?? "");
    setSelectedProgramTopics(topics ?? []);
    setSelectedCourse(course);
  }}
/>



        <section>
          <WhyChooseSmartTutors />
        </section>

        <section className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-white shadow-sm sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="relative z-10 mx-auto max-w-2xl space-y-4">
            <span className="mx-auto inline-flex items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
              <HelpingHand className="h-3.5 w-3.5" />
              Free consultation
            </span>

            <h3 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              Looking for a Customized Academic Syllabus?
            </h3>

            <p className="text-xs font-medium leading-relaxed text-slate-400">
              Book a free counseling session or 1-on-1 assessment with our
              faculty advisors to outline a bespoke routine that suits your
              learning timeline.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  const fallbackCourse =
                    coursesWithRequiredSkills.find(
                      (course: CourseItem) =>
                        course.standardKey === "class-6-additional",
                    ) ??
                    coursesWithRequiredSkills[0] ??
                    null;

                  if (fallbackCourse) {
                    setSelectedCourse(fallbackCourse);
                  }
                }}
                className="w-full cursor-pointer rounded bg-blue-600 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-blue-500 sm:w-auto"
              >
                Book a Free Counseling Session
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  window.open(
                    "https://api.whatsapp.com/send?phone=918850447887&text=Hi%20Smart%20Tutors,%20I'd%20like%20to%20know%20more%20about%20your%20programs%20and%20schedules.",
                    "_blank",
                  );
                }}
                className="w-full cursor-pointer rounded border border-slate-700 bg-slate-800 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-slate-700 sm:w-auto"
              >
                Contact for more information
              </button>
            </div>
          </div>
        </section>
      </main>

<CourseModal
  course={selectedCourse}
  initialAdditionalCourse={selectedAdditionalProgram}
  programTopics={selectedProgramTopics}
  onClose={() => {
    setSelectedCourse(null);
    setSelectedAdditionalProgram("");
    setSelectedProgramTopics([]);
  }}
/>

      <SmartTutorsAIChatbot />
      <WhatsAppFAB currentCourseTitle={selectedCourse?.title} />
    </div>
  );
}