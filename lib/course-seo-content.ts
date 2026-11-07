/**
 * SmartIQ Institute — Individual Course SEO Content
 *
 * Content for all 42 registered course slugs.
 *
 * These are educational syllabus outlines and preparation
 * descriptions, not verified claims about the exact classes
 * or topics delivered by SmartIQ Institute.
 *
 * Before removing noindex:
 * - Verify each syllabus against the current official source.
 * - Confirm each programme's actual SmartIQ offering.
 * - Review all eligibility and examination information.
 * - Approve unique marketing and location-specific content.
 */

export type CourseSeoContent = {
  overview: string[];
  syllabus: {
    subject: string;
    topics: string[];
  }[];
  preparation: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
};

/**
 * A compact authoring helper that converts individual
 * course information into the structure already used by
 * the universal course-page template.
 */
function defineCourse(
  overview: string[],
  syllabus: [string, string[]][],
  preparation: string[],
  faqs: [string, string][],
): CourseSeoContent {
  return {
    overview,
    syllabus: syllabus.map(([subject, topics]) => ({
      subject,
      topics,
    })),
    preparation,
    faqs: faqs.map(([question, answer]) => ({
      question,
      answer,
    })),
  };
}

export const courseSeoContent: Record<string, CourseSeoContent> = {
  // =====================================================
  // SCHOOL TUITION — CLASSES 6 TO 12
  // =====================================================

  "class-6-tuition": defineCourse(
    [
      "Class 6 is an important transition into middle-school learning. Students begin developing deeper understanding across mathematics, science, languages and social studies while building independent study habits.",
      "Academic support at this stage should focus on conceptual clarity, reading comprehension, foundational calculations, written expression and confidence in classroom learning. The specific curriculum depends on the student's school board.",
    ],
    [
      [
        "Mathematics",
        [
          "Whole numbers and integers",
          "Fractions and decimals",
          "Basic algebraic concepts",
          "Geometry and measurement",
          "Data handling",
        ],
      ],
      [
        "Science",
        [
          "Living organisms",
          "Materials and their properties",
          "Motion and measurement",
          "Light and electricity fundamentals",
          "Environmental awareness",
        ],
      ],
      [
        "Languages and Social Studies",
        [
          "Reading comprehension",
          "Grammar and vocabulary",
          "Writing skills",
          "History and geography fundamentals",
          "Civic understanding",
        ],
      ],
    ],
    [
      "Identify subjects requiring additional academic support.",
      "Build consistent homework and revision habits.",
      "Practise calculations, reading and written answers.",
      "Follow the syllabus prescribed by the student's school.",
    ],
    [
      [
        "Which subjects can Class 6 students study?",
        "Common subjects include Mathematics, Science, English, Social Studies and additional languages, depending on the school board.",
      ],
      [
        "How can Class 6 students improve academically?",
        "Regular revision, concept-based learning, reading practice and feedback on written work can help strengthen academic foundations.",
      ],
      [
        "Does Class 6 tuition follow every school board?",
        "The relevant syllabus depends on the student's board and school. Parents should confirm the applicable curriculum and available tutoring arrangements.",
      ],
    ],
  ),

  "class-7-tuition": defineCourse(
    [
      "Class 7 introduces more complex concepts and requires students to apply knowledge acquired in earlier grades. Building confidence in mathematics, science and language subjects can help prepare learners for higher classes.",
      "A useful learning plan combines school syllabus coverage, clear explanations, regular practice and periodic review of weak areas.",
    ],
    [
      [
        "Mathematics",
        [
          "Integers and rational numbers",
          "Algebraic expressions",
          "Linear equations",
          "Lines and angles",
          "Perimeter and area",
        ],
      ],
      [
        "Science",
        [
          "Nutrition and respiration",
          "Heat and temperature",
          "Physical and chemical changes",
          "Electric current",
          "Natural resources",
        ],
      ],
      [
        "Languages and Humanities",
        [
          "Comprehension",
          "Grammar and composition",
          "History",
          "Geography",
          "Civics",
        ],
      ],
    ],
    [
      "Revise concepts from Class 6 where required.",
      "Practise mathematical problem solving.",
      "Use diagrams and explanations for science topics.",
      "Complete regular written exercises and revisions.",
    ],
    [
      [
        "What is important in Class 7 Mathematics?",
        "Students commonly study rational numbers, algebra, geometry and mensuration according to their board syllabus.",
      ],
      [
        "How can a Class 7 student prepare for examinations?",
        "A subject-wise revision plan, textbook exercises and regular self-assessment can improve preparation.",
      ],
    ],
  ),

  "class-8-tuition": defineCourse(
    [
      "Class 8 strengthens the academic foundations needed for secondary school. Students begin working with more advanced mathematics, scientific explanations and analytical writing.",
      "Preparation should focus on understanding how concepts connect across chapters, practising written responses and developing consistent examination habits.",
    ],
    [
      [
        "Mathematics",
        [
          "Rational numbers",
          "Linear equations",
          "Algebraic identities",
          "Mensuration",
          "Squares, cubes and data handling",
        ],
      ],
      [
        "Science",
        [
          "Force and pressure",
          "Sound and light",
          "Microorganisms",
          "Combustion",
          "Cell structure and reproduction",
        ],
      ],
      [
        "Languages and Social Studies",
        [
          "Reading comprehension",
          "Grammar and essays",
          "History and civics",
          "Geography",
          "Written answer presentation",
        ],
      ],
    ],
    [
      "Identify gaps in mathematical foundations.",
      "Use concept maps and diagrams for science.",
      "Practise writing complete, structured answers.",
      "Review tests to identify weak chapters.",
    ],
    [
      [
        "Why is Class 8 academically important?",
        "Class 8 develops foundations in algebra, science and written communication that support secondary-school learning.",
      ],
      [
        "How should students revise Class 8 subjects?",
        "Students can combine textbook exercises, chapter summaries, practice questions and regular revision.",
      ],
    ],
  ),

  "class-9-tuition": defineCourse(
    [
      "Class 9 introduces secondary-school academic demands and lays the groundwork for Class 10 board preparation. Subjects often require deeper conceptual reasoning and greater independence.",
      "Students benefit from steady coverage of their prescribed syllabus, numerical practice, scientific reasoning and well-structured written responses.",
    ],
    [
      [
        "Mathematics",
        [
          "Number systems",
          "Polynomials",
          "Coordinate geometry",
          "Linear equations",
          "Triangles and statistics",
        ],
      ],
      [
        "Science",
        [
          "Motion and force",
          "Atoms and molecules",
          "Matter",
          "Cell biology",
          "Tissues and natural resources",
        ],
      ],
      [
        "Languages and Social Science",
        [
          "English grammar and literature",
          "History",
          "Geography",
          "Political science",
          "Economics fundamentals",
        ],
      ],
    ],
    [
      "Develop understanding before memorising formulas.",
      "Maintain chapter-wise revision notes.",
      "Solve mathematical and scientific problems regularly.",
      "Practise examination-style written answers.",
    ],
    [
      [
        "How does Class 9 preparation help with Class 10?",
        "Many foundational concepts and study habits developed in Class 9 remain relevant to Class 10.",
      ],
      [
        "Which subjects need regular practice in Class 9?",
        "Mathematics and Science often need consistent problem-solving, while languages and humanities benefit from reading and writing practice.",
      ],
    ],
  ),

  "class-10-tuition": defineCourse(
    [
      "Class 10 is a significant board-examination year for many Indian school systems. Preparation requires syllabus coverage, accurate concepts, time management and structured revision.",
      "Students should follow their own board's examination pattern, prescribed textbooks and assessment requirements rather than assuming all boards use identical papers.",
    ],
    [
      [
        "Mathematics",
        [
          "Real numbers",
          "Polynomials",
          "Quadratic equations",
          "Trigonometry",
          "Coordinate geometry",
          "Statistics and probability",
        ],
      ],
      [
        "Science",
        [
          "Chemical reactions",
          "Acids, bases and salts",
          "Life processes",
          "Electricity",
          "Light and magnetic effects",
        ],
      ],
      [
        "Languages and Social Science",
        [
          "Literature and comprehension",
          "Grammar and writing",
          "History",
          "Geography",
          "Political science and economics",
        ],
      ],
    ],
    [
      "Complete the prescribed syllabus before final revision.",
      "Practise questions from the applicable board pattern.",
      "Use timed tests to evaluate preparation.",
      "Revise difficult chapters through targeted exercises.",
    ],
    [
      [
        "How should students prepare for Class 10 board examinations?",
        "Students should follow the current board syllabus, revise consistently and practise examination-style questions.",
      ],
      [
        "Is the Class 10 syllabus identical across boards?",
        "No. CBSE, ICSE, Maharashtra State Board and international curricula can differ in topics and assessments.",
      ],
    ],
  ),

  "class-11-tuition": defineCourse(
    [
      "Class 11 introduces specialised academic streams and more demanding subject content. Students may study Science, Commerce, Arts or other combinations depending on their board and institution.",
      "Building understanding during Class 11 is useful for Class 12 examinations and future academic or professional pathways.",
    ],
    [
      [
        "Science Stream",
        [
          "Physics fundamentals",
          "Chemistry fundamentals",
          "Mathematics or Biology",
          "Practical and laboratory concepts",
        ],
      ],
      [
        "Commerce Stream",
        [
          "Accountancy",
          "Economics",
          "Business Studies",
          "Mathematics or other electives",
        ],
      ],
      [
        "Arts and Humanities",
        [
          "History",
          "Political science",
          "Geography",
          "Psychology and other electives",
        ],
      ],
    ],
    [
      "Select subjects based on the student's actual stream.",
      "Build fundamentals before attempting advanced exercises.",
      "Follow the prescribed school or junior-college syllabus.",
      "Maintain chapter-wise revision and assessment routines.",
    ],
    [
      [
        "Which streams are available in Class 11?",
        "Common streams include Science, Commerce and Arts, although exact subject combinations vary by institution.",
      ],
      [
        "Why is Class 11 preparation important?",
        "Class 11 concepts form a foundation for Class 12 studies and several higher-education entrance pathways.",
      ],
    ],
  ),

  "class-12-tuition": defineCourse(
    [
      "Class 12 combines advanced subject learning with important school or junior-college examinations. Preparation should balance conceptual understanding, syllabus completion, revision and assessment practice.",
      "Students may also need to plan separately for entrance examinations, whose eligibility, topics and schedules can differ from board examinations.",
    ],
    [
      [
        "Science Stream",
        [
          "Advanced Physics",
          "Advanced Chemistry",
          "Mathematics or Biology",
          "Practical and application-based topics",
        ],
      ],
      [
        "Commerce Stream",
        [
          "Accountancy",
          "Economics",
          "Business Studies",
          "Mathematics or electives",
        ],
      ],
      [
        "Arts and Humanities",
        [
          "History and political science",
          "Geography",
          "Psychology",
          "Languages and electives",
        ],
      ],
    ],
    [
      "Prepare a realistic subject-wise revision timetable.",
      "Practise relevant board examination papers.",
      "Review errors in written and numerical answers.",
      "Keep entrance preparation separate where needed.",
    ],
    [
      [
        "How should Class 12 students manage board preparation?",
        "Students can plan revision around subject difficulty, complete timed practice and follow the relevant board syllabus.",
      ],
      [
        "Is board preparation sufficient for entrance examinations?",
        "Not always. Entrance examinations may require additional topics, question types and preparation strategies.",
      ],
    ],
  ),

  // =====================================================
  // ENTRANCE EXAMINATIONS
  // =====================================================

  "ca-foundation": defineCourse(
    [
      "CA Foundation is an entry-level examination in the Chartered Accountancy pathway administered by the Institute of Chartered Accountants of India.",
      "Preparation involves Accounting, Business Laws, Quantitative Aptitude and Business Economics. Students should refer to the applicable ICAI syllabus and examination requirements for their intended attempt.",
    ],
    [
      [
        "Accounting",
        [
          "Accounting principles and concepts",
          "Journal entries and ledger accounts",
          "Financial statements",
          "Bank reconciliation",
          "Depreciation and inventory",
        ],
      ],
      [
        "Business Laws",
        [
          "Indian Contract Act",
          "Sale of Goods Act",
          "Partnership and LLP concepts",
          "Companies Act fundamentals",
        ],
      ],
      [
        "Quantitative Aptitude",
        [
          "Business Mathematics",
          "Logical Reasoning",
          "Statistics",
          "Time value of money",
        ],
      ],
      [
        "Business Economics",
        [
          "Demand and supply",
          "Production and cost",
          "Market structures",
          "National income",
          "Economic concepts",
        ],
      ],
    ],
    [
      "Build strong accounting and business law fundamentals.",
      "Practise mathematical and statistical problems.",
      "Revise subject-wise topics systematically.",
      "Use current ICAI study material.",
    ],
    [
      [
        "What is CA Foundation?",
        "CA Foundation is an entry-level examination in the Chartered Accountancy pathway administered by ICAI.",
      ],
      [
        "Which subjects are covered?",
        "The principal areas are Accounting, Business Laws, Quantitative Aptitude and Business Economics, subject to the applicable ICAI syllabus.",
      ],
      [
        "How can students prepare effectively?",
        "A structured timetable, conceptual learning, regular numerical practice and revision with current ICAI material can support preparation.",
      ],
    ],
  ),

  "jee-coaching": defineCourse(
    [
      "Joint Entrance Examination preparation focuses on Physics, Chemistry and Mathematics. It combines higher-secondary concepts with analytical reasoning and problem-solving.",
      "JEE Main and JEE Advanced are separate examinations. Students should check the official syllabus, eligibility and applicable examination pattern for each.",
    ],
    [
      [
        "Physics",
        [
          "Mechanics",
          "Thermodynamics",
          "Electricity and magnetism",
          "Optics",
          "Modern physics",
        ],
      ],
      [
        "Chemistry",
        [
          "Physical chemistry",
          "Organic chemistry",
          "Inorganic chemistry",
          "Chemical bonding",
          "Chemical equilibrium",
        ],
      ],
      [
        "Mathematics",
        [
          "Algebra",
          "Calculus",
          "Coordinate geometry",
          "Trigonometry",
          "Vectors and three-dimensional geometry",
        ],
      ],
    ],
    [
      "Strengthen concepts before tackling advanced problems.",
      "Practise application-based questions regularly.",
      "Attempt timed examinations and previous questions.",
      "Analyse mistakes and revise weak topics.",
    ],
    [
      [
        "Which subjects are important for JEE?",
        "JEE preparation focuses on Physics, Chemistry and Mathematics.",
      ],
      [
        "Are JEE Main and JEE Advanced the same?",
        "No. They are separate examinations with different purposes, eligibility conditions and arrangements.",
      ],
      [
        "How can students improve preparation?",
        "Consistent concept revision, problem-solving, timed practice and performance analysis are useful.",
      ],
    ],
  ),

  "neet-coaching": defineCourse(
    [
      "NEET UG preparation focuses on Physics, Chemistry and Biology. Students need clear concepts, accurate interpretation of questions and regular objective-question practice.",
      "The applicable syllabus, eligibility and examination rules should always be confirmed using current official NEET UG information.",
    ],
    [
      [
        "Biology",
        [
          "Cell biology",
          "Human physiology",
          "Genetics and evolution",
          "Ecology",
          "Plant physiology",
        ],
      ],
      [
        "Physics",
        [
          "Mechanics",
          "Thermodynamics",
          "Current electricity",
          "Optics",
          "Modern physics",
        ],
      ],
      [
        "Chemistry",
        [
          "Physical chemistry",
          "Organic chemistry",
          "Inorganic chemistry",
          "Chemical bonding",
          "Equilibrium",
        ],
      ],
    ],
    [
      "Build conceptual understanding from prescribed materials.",
      "Practise subject-wise objective questions.",
      "Review Biology diagrams and terminology.",
      "Take timed tests and correct mistakes.",
    ],
    [
      [
        "Which subjects are covered in NEET UG?",
        "NEET UG preparation is based on Physics, Chemistry and Biology.",
      ],
      [
        "How important is Biology?",
        "Biology is a major part of NEET UG preparation and requires careful study of the applicable syllabus.",
      ],
      [
        "Should students practise mock tests?",
        "Timed tests can help assess subject knowledge, accuracy and time management.",
      ],
    ],
  ),

  "mht-cet": defineCourse(
    [
      "MHT CET is an entrance examination associated with specified undergraduate professional education pathways in Maharashtra.",
      "Students should identify the applicable subject group and course, then follow the current examination pattern and syllabus published by the Maharashtra State Common Entrance Test Cell.",
    ],
    [
      [
        "Physics and Chemistry",
        [
          "Mechanics",
          "Electricity",
          "Thermodynamics",
          "Organic chemistry",
          "Chemical reactions",
        ],
      ],
      [
        "Mathematics or Biology",
        [
          "Algebra",
          "Calculus",
          "Coordinate geometry",
          "Genetics",
          "Human and plant physiology",
        ],
      ],
    ],
    [
      "Confirm the subject group applicable to the intended programme.",
      "Revise the prescribed higher-secondary curriculum.",
      "Practise objective questions.",
      "Review the current examination pattern and official syllabus.",
    ],
    [
      [
        "What is MHT CET?",
        "MHT CET is a Maharashtra entrance examination used for admission pathways specified by the State CET Cell.",
      ],
      [
        "Do all applicants take the same subjects?",
        "No. Subject combinations depend on the applicable programme and examination group.",
      ],
    ],
  ),

  clat: defineCourse(
    [
      "CLAT is the Common Law Admission Test, associated with admission pathways to participating National Law Universities.",
      "Preparation involves reading comprehension, current affairs, legal reasoning, logical reasoning and quantitative techniques. Applicants should check the examination level and current official requirements.",
    ],
    [
      [
        "Language and Current Affairs",
        [
          "Reading comprehension",
          "Vocabulary in context",
          "Current events",
          "General knowledge",
        ],
      ],
      [
        "Reasoning and Quantitative Skills",
        [
          "Legal reasoning",
          "Logical reasoning",
          "Critical thinking",
          "Quantitative techniques",
        ],
      ],
    ],
    [
      "Improve reading comprehension and interpretation.",
      "Practise legal and logical reasoning passages.",
      "Review current affairs consistently.",
      "Use the applicable official CLAT format for mock practice.",
    ],
    [
      [
        "What is CLAT?",
        "CLAT is a law entrance examination associated with participating National Law Universities.",
      ],
      [
        "Is prior law knowledge compulsory?",
        "Candidates should follow the official exam guidance; legal reasoning preparation focuses on applying principles to questions.",
      ],
    ],
  ),

  ailet: defineCourse(
    [
      "AILET is the All India Law Entrance Test associated with specified admissions at National Law University Delhi.",
      "Applicants should prepare for the relevant programme's current examination pattern. Reading, current affairs and reasoning are important preparation areas for the undergraduate examination.",
    ],
    [
      [
        "English Language",
        [
          "Reading comprehension",
          "Vocabulary",
          "Grammar",
          "Passage interpretation",
        ],
      ],
      [
        "General Knowledge and Reasoning",
        [
          "Current affairs",
          "General awareness",
          "Logical reasoning",
          "Critical analysis",
        ],
      ],
    ],
    [
      "Confirm the official AILET examination pattern.",
      "Practise reading comprehension.",
      "Develop reasoning accuracy and speed.",
      "Follow current affairs and take timed tests.",
    ],
    [
      [
        "What is AILET?",
        "AILET is an entrance examination conducted for specified programmes at National Law University Delhi.",
      ],
      [
        "Are AILET and CLAT identical?",
        "No. They are separate law entrance examinations with their own arrangements and requirements.",
      ],
    ],
  ),

  cat: defineCourse(
    [
      "The Common Admission Test is an entrance examination used in postgraduate management admissions, including by Indian Institutes of Management.",
      "CAT preparation centres on quantitative aptitude, data interpretation, logical reasoning and verbal ability. Applicants should review the current examination instructions and admission criteria.",
    ],
    [
      [
        "Quantitative Aptitude",
        ["Arithmetic", "Algebra", "Geometry", "Number systems"],
      ],
      [
        "Data Interpretation and Reasoning",
        [
          "Tables and graphs",
          "Data sets",
          "Logical arrangements",
          "Analytical reasoning",
        ],
      ],
      [
        "Verbal Ability",
        [
          "Reading comprehension",
          "Paragraph organisation",
          "Critical reading",
          "Verbal reasoning",
        ],
      ],
    ],
    [
      "Build fundamentals in quantitative aptitude.",
      "Practise analytical reasoning sets.",
      "Improve reading accuracy and comprehension.",
      "Use timed mocks to assess section performance.",
    ],
    [
      [
        "What is CAT?",
        "CAT is the Common Admission Test used in specified postgraduate management admissions.",
      ],
      [
        "Which sections are important?",
        "Quantitative Aptitude, Data Interpretation and Logical Reasoning, and Verbal Ability and Reading Comprehension are principal preparation areas.",
      ],
    ],
  ),

  cmat: defineCourse(
    [
      "CMAT is the Common Management Admission Test used for specified management programme admissions.",
      "Its preparation areas include quantitative techniques, logical reasoning, language comprehension, general awareness and other subjects identified in the applicable official examination pattern.",
    ],
    [
      [
        "Quantitative Techniques",
        ["Arithmetic", "Algebra", "Data interpretation", "Numerical reasoning"],
      ],
      [
        "Language and Reasoning",
        [
          "Reading comprehension",
          "Vocabulary",
          "Logical reasoning",
          "Critical thinking",
        ],
      ],
      [
        "General and Business Awareness",
        [
          "Current affairs",
          "General knowledge",
          "Innovation and entrepreneurship concepts",
        ],
      ],
    ],
    [
      "Review the official examination syllabus.",
      "Practise quantitative and reasoning questions.",
      "Revise current affairs.",
      "Complete mock tests using the applicable format.",
    ],
    [
      [
        "What is CMAT?",
        "CMAT is a national-level management entrance examination.",
      ],
      [
        "Is CMAT the same as CAT?",
        "No. They are separate examinations and may differ in structure, sections and admission use.",
      ],
    ],
  ),

  "mba-cet": defineCourse(
    [
      "Maharashtra MBA or MMS CET is an entrance examination associated with management admissions in Maharashtra.",
      "Preparation emphasises reasoning, quantitative aptitude and verbal ability. Candidates should use the syllabus and examination pattern issued for the applicable admission year.",
    ],
    [
      [
        "Logical and Abstract Reasoning",
        [
          "Logical arrangements",
          "Critical reasoning",
          "Visual patterns",
          "Abstract reasoning",
        ],
      ],
      [
        "Quantitative and Verbal Ability",
        [
          "Arithmetic",
          "Data interpretation",
          "Reading comprehension",
          "Grammar",
          "Vocabulary",
        ],
      ],
    ],
    [
      "Understand the current Maharashtra MBA CET format.",
      "Practise reasoning under timed conditions.",
      "Improve verbal and numerical accuracy.",
      "Evaluate mock-test performance regularly.",
    ],
    [
      [
        "What is MBA CET?",
        "MBA CET commonly refers to Maharashtra's entrance examination for specified MBA or MMS admissions.",
      ],
      [
        "What skills are important?",
        "Reasoning, quantitative aptitude and verbal ability are major preparation areas.",
      ],
    ],
  ),

  gate: defineCourse(
    [
      "GATE is the Graduate Aptitude Test in Engineering. Candidates select an applicable examination paper based on their academic background and goals.",
      "Preparation generally includes technical subject knowledge, general aptitude and, where applicable, engineering mathematics. The exact syllabus depends on the chosen paper.",
    ],
    [
      [
        "General Aptitude",
        ["Verbal aptitude", "Numerical aptitude", "Analytical reasoning"],
      ],
      [
        "Engineering Mathematics",
        [
          "Linear algebra",
          "Calculus",
          "Differential equations",
          "Probability and statistics",
        ],
      ],
      [
        "Technical Discipline",
        [
          "Paper-specific core subjects",
          "Engineering applications",
          "Technical problem solving",
          "Previous-year paper analysis",
        ],
      ],
    ],
    [
      "Choose the correct GATE examination paper.",
      "Follow its current official syllabus.",
      "Revise technical fundamentals.",
      "Solve previous papers and timed mock tests.",
    ],
    [
      [
        "What is GATE?",
        "GATE is the Graduate Aptitude Test in Engineering, with multiple examination papers.",
      ],
      [
        "Is the syllabus the same for everyone?",
        "No. Technical content varies by examination paper.",
      ],
    ],
  ),

  // =====================================================
  // GOVERNMENT EXAMINATIONS
  // =====================================================

  "banking-exams": defineCourse(
    [
      "Banking recruitment preparation commonly covers aptitude, reasoning, English and financial or general awareness.",
      "The exact examination subjects, stages and eligibility differ by recruiting organisation and post. Candidates should follow the relevant current official notification.",
    ],
    [
      [
        "Quantitative Aptitude",
        [
          "Number systems",
          "Arithmetic",
          "Data interpretation",
          "Simplification",
        ],
      ],
      [
        "Reasoning Ability",
        ["Puzzles", "Seating arrangements", "Syllogisms", "Logical reasoning"],
      ],
      [
        "English Language",
        [
          "Reading comprehension",
          "Grammar",
          "Vocabulary",
          "Sentence arrangement",
        ],
      ],
      [
        "Banking Awareness",
        [
          "Banking terminology",
          "Financial awareness",
          "Current affairs",
          "Economic developments",
        ],
      ],
    ],
    [
      "Identify the specific banking examination.",
      "Practise aptitude and reasoning under time limits.",
      "Improve comprehension and vocabulary.",
      "Revise financial awareness and current affairs.",
    ],
    [
      [
        "Which examinations fall under banking recruitment?",
        "Common examples include IBPS and SBI recruitment examinations, with separate rules for individual posts.",
      ],
      [
        "Which subjects are commonly tested?",
        "Aptitude, reasoning, English and general or banking awareness are common, although the pattern varies.",
      ],
      [
        "Are banking examination patterns identical?",
        "No. Selection stages and requirements depend on the recruiting organisation and position.",
      ],
    ],
  ),

  "ibps-po": defineCourse(
    [
      "IBPS PO is a recruitment pathway for Probationary Officer positions in participating banks.",
      "Preparation involves reasoning, quantitative aptitude, English and other subjects specified in the applicable recruitment notification. Candidates should prepare for each current selection stage.",
    ],
    [
      [
        "Reasoning and Quantitative Aptitude",
        [
          "Puzzles and seating arrangements",
          "Data interpretation",
          "Arithmetic",
          "Logical reasoning",
        ],
      ],
      [
        "English and General Awareness",
        [
          "Reading comprehension",
          "Grammar and vocabulary",
          "Banking awareness",
          "Current affairs",
        ],
      ],
    ],
    [
      "Review the current IBPS PO notification.",
      "Practise section-wise timed questions.",
      "Analyse speed, accuracy and recurring errors.",
    ],
    [
      [
        "What does IBPS PO mean?",
        "IBPS PO refers to the Institute of Banking Personnel Selection Probationary Officer recruitment examination.",
      ],
      [
        "How should candidates prepare?",
        "Review the current pattern, develop subject knowledge and practise timed questions consistently.",
      ],
    ],
  ),

  "ibps-clerk": defineCourse(
    [
      "IBPS clerical recruitment preparation includes numerical ability, reasoning, English and other areas specified in the applicable recruitment process.",
      "Applicants should check the latest official notification for the current examination name, eligibility, stages and syllabus.",
    ],
    [
      [
        "Numerical Ability",
        [
          "Arithmetic",
          "Simplification",
          "Number series",
          "Data interpretation",
        ],
      ],
      [
        "Reasoning and English",
        [
          "Puzzles",
          "Seating arrangements",
          "Reading comprehension",
          "Vocabulary and grammar",
        ],
      ],
    ],
    [
      "Review the current recruitment notification.",
      "Practise numerical and reasoning questions.",
      "Use timed exercises to improve accuracy.",
    ],
    [
      [
        "What subjects are important?",
        "Numerical ability, reasoning and English are common preparation subjects, with other requirements depending on the current examination.",
      ],
      [
        "Where can candidates check eligibility?",
        "Eligibility should be confirmed through the current official IBPS notification.",
      ],
    ],
  ),

  "sbi-po": defineCourse(
    [
      "SBI PO recruitment concerns Probationary Officer positions at State Bank of India. Its official recruitment notification describes the applicable selection process.",
      "Preparation may involve reasoning, numerical aptitude, English and financial or economic awareness, together with preparation for the relevant selection stages.",
    ],
    [
      [
        "Aptitude and Reasoning",
        ["Data interpretation", "Arithmetic", "Logical reasoning", "Puzzles"],
      ],
      [
        "English and Awareness",
        [
          "Reading comprehension",
          "Language usage",
          "Banking terminology",
          "Economic and current affairs",
        ],
      ],
    ],
    [
      "Review the current SBI PO requirements.",
      "Practise numerical and reasoning problems.",
      "Prepare for every applicable selection stage.",
    ],
    [
      [
        "Is SBI PO the same as IBPS PO?",
        "No. They are separate recruitment processes with different notifications and requirements.",
      ],
      [
        "How can applicants prepare?",
        "Use a structured subject plan, timed practice and the current SBI examination guidance.",
      ],
    ],
  ),

  "sbi-clerk": defineCourse(
    [
      "SBI Junior Associate recruitment preparation involves the skills tested in the applicable clerical recruitment examination.",
      "Candidates should check the latest SBI notification for the precise selection process and required subject areas.",
    ],
    [
      [
        "Numerical and Reasoning Ability",
        ["Arithmetic", "Number series", "Logical reasoning", "Puzzles"],
      ],
      [
        "English and Awareness",
        ["Reading comprehension", "Grammar", "Vocabulary", "Banking awareness"],
      ],
    ],
    [
      "Study the current SBI Junior Associate notification.",
      "Practise numerical, reasoning and English questions.",
      "Review mistakes after timed exercises.",
    ],
    [
      [
        "What is SBI Clerk recruitment?",
        "It commonly refers to SBI's recruitment process for Junior Associate positions.",
      ],
      [
        "How can candidates practise?",
        "Topic-wise exercises and timed tests based on the current syllabus can support preparation.",
      ],
    ],
  ),

  "ssc-coaching": defineCourse(
    [
      "Staff Selection Commission examinations recruit candidates for different central government positions.",
      "Common preparation areas include mathematics, reasoning, English and general awareness. The exact examination structure depends on the chosen SSC recruitment pathway.",
    ],
    [
      [
        "Quantitative Aptitude",
        [
          "Arithmetic",
          "Algebra",
          "Geometry",
          "Mensuration",
          "Data interpretation",
        ],
      ],
      [
        "Reasoning",
        [
          "Analogy",
          "Classification",
          "Series",
          "Logical reasoning",
          "Non-verbal reasoning",
        ],
      ],
      [
        "English",
        [
          "Grammar",
          "Vocabulary",
          "Reading comprehension",
          "Sentence improvement",
        ],
      ],
      [
        "General Awareness",
        [
          "History",
          "Geography",
          "Polity",
          "Economy",
          "Science and current affairs",
        ],
      ],
    ],
    [
      "Select the specific SSC examination.",
      "Practise core aptitude and reasoning topics.",
      "Review previous examination questions.",
      "Use timed sectional and full mock tests.",
    ],
    [
      [
        "What is SSC coaching?",
        "It refers to preparation for recruitment examinations conducted by the Staff Selection Commission.",
      ],
      [
        "Does SSC conduct multiple examinations?",
        "Yes. Examples include CGL, CHSL, MTS and CPO, subject to their own recruitment requirements.",
      ],
      [
        "What subjects are common?",
        "Mathematics, reasoning, English and general awareness are common subjects, depending on the examination.",
      ],
    ],
  ),

  "ssc-cgl": defineCourse(
    [
      "SSC CGL is the Combined Graduate Level examination conducted by the Staff Selection Commission for recruitment to specified government posts.",
      "Candidates should prepare according to the current tier structure, subject requirements and post-specific eligibility conditions.",
    ],
    [
      [
        "Mathematics and Reasoning",
        [
          "Arithmetic and algebra",
          "Geometry and mensuration",
          "Logical reasoning",
          "Data interpretation",
        ],
      ],
      [
        "English and General Awareness",
        [
          "Grammar and comprehension",
          "Vocabulary",
          "History and geography",
          "Polity and general science",
        ],
      ],
    ],
    [
      "Check the latest SSC CGL tier structure.",
      "Practise quantitative aptitude and reasoning.",
      "Review previous papers and timed mock tests.",
    ],
    [
      [
        "What does SSC CGL mean?",
        "SSC CGL stands for Staff Selection Commission Combined Graduate Level examination.",
      ],
      [
        "Which subjects are studied?",
        "Mathematics, reasoning, English and general awareness are common, with additional requirements for some stages and posts.",
      ],
    ],
  ),

  "ssc-chsl": defineCourse(
    [
      "SSC CHSL is the Combined Higher Secondary Level recruitment examination conducted by the Staff Selection Commission.",
      "Preparation involves understanding the current examination stages and practising relevant aptitude, English and general awareness topics.",
    ],
    [
      [
        "Quantitative and Reasoning Skills",
        [
          "Basic arithmetic",
          "Algebra and geometry",
          "Logical reasoning",
          "Numerical problem solving",
        ],
      ],
      [
        "English and General Awareness",
        [
          "Grammar",
          "Vocabulary",
          "Reading comprehension",
          "Current affairs and general knowledge",
        ],
      ],
    ],
    [
      "Review the current SSC CHSL notification.",
      "Practise aptitude questions.",
      "Prepare for applicable skill or typing assessments.",
    ],
    [
      [
        "What does SSC CHSL stand for?",
        "Staff Selection Commission Combined Higher Secondary Level.",
      ],
      [
        "Is SSC CHSL identical to SSC CGL?",
        "No. These examinations have different recruitment purposes and requirements.",
      ],
    ],
  ),

  "ssc-mts": defineCourse(
    [
      "SSC MTS is a recruitment examination for Multi-Tasking Staff positions and other posts identified in relevant official notifications.",
      "Preparation commonly focuses on foundational numerical ability, reasoning, English and general awareness.",
    ],
    [
      [
        "Numerical and Reasoning Ability",
        [
          "Basic arithmetic",
          "Number systems",
          "Problem solving",
          "Series and classification",
        ],
      ],
      [
        "English and General Awareness",
        [
          "Vocabulary",
          "Grammar",
          "General science",
          "History and current affairs",
        ],
      ],
    ],
    [
      "Read the latest SSC MTS notification.",
      "Develop accuracy in foundational aptitude.",
      "Practise questions in the current examination format.",
    ],
    [
      [
        "What is SSC MTS?",
        "SSC MTS refers to Staff Selection Commission Multi-Tasking Staff recruitment.",
      ],
      [
        "How should candidates prepare?",
        "Follow the official syllabus and regularly practise basic aptitude and language questions.",
      ],
    ],
  ),

  "ssc-cpo": defineCourse(
    [
      "SSC CPO is a recruitment examination associated with specified police organisation positions identified in the applicable Staff Selection Commission notification.",
      "Candidates should prepare for written examinations and check the official physical, medical and other selection requirements.",
    ],
    [
      [
        "Quantitative and Reasoning Ability",
        ["Arithmetic", "Geometry", "Logical reasoning", "Non-verbal reasoning"],
      ],
      [
        "English and General Awareness",
        [
          "Reading comprehension",
          "Grammar",
          "General knowledge",
          "Current affairs",
        ],
      ],
    ],
    [
      "Review SSC CPO eligibility and selection stages.",
      "Practise written examination subjects.",
      "Check official physical and medical standards.",
    ],
    [
      [
        "What is SSC CPO?",
        "It is a Staff Selection Commission recruitment examination for specified police organisation posts.",
      ],
      [
        "Is selection only through a written examination?",
        "No. Additional selection requirements may apply according to the current official notification.",
      ],
    ],
  ),

  "railway-exams": defineCourse(
    [
      "Railway recruitment examinations cover different positions and qualification levels. Applicants should identify the appropriate RRB or RRC notification for the intended role.",
      "Common preparation areas include mathematics, reasoning, general science and current affairs, although technical and post-specific requirements may also apply.",
    ],
    [
      [
        "Mathematics and Reasoning",
        [
          "Number systems",
          "Arithmetic",
          "Data interpretation",
          "Analogies and series",
          "Logical reasoning",
        ],
      ],
      [
        "General and Technical Awareness",
        [
          "General science",
          "Current affairs",
          "General knowledge",
          "Post-specific technical subjects",
        ],
      ],
    ],
    [
      "Select the correct railway recruitment notification.",
      "Review the examination stage and syllabus.",
      "Practise mathematics and reasoning.",
      "Prepare separately for technical or aptitude tests where applicable.",
    ],
    [
      [
        "Are all railway examinations the same?",
        "No. Examination patterns vary according to the recruitment category and post.",
      ],
      [
        "Which subjects are common?",
        "Mathematics, reasoning, general science and current affairs are common preparation areas.",
      ],
    ],
  ),

  "police-bharti": defineCourse(
    [
      "Police Bharti preparation concerns recruitment examinations and other selection stages for applicable police positions.",
      "Written examination subjects, physical fitness requirements, medical standards and eligibility conditions depend on the relevant recruiting authority.",
    ],
    [
      [
        "Written Examination Topics",
        [
          "General knowledge",
          "Current affairs",
          "Reasoning",
          "Arithmetic",
          "Language skills",
        ],
      ],
      [
        "Selection Awareness",
        [
          "Physical test requirements",
          "Fitness preparation awareness",
          "Recruitment documentation",
          "Medical and eligibility standards",
        ],
      ],
    ],
    [
      "Read the current official recruitment notification.",
      "Practise written examination topics.",
      "Understand the applicable physical selection criteria.",
      "Follow safe fitness practices and official medical guidance.",
    ],
    [
      [
        "Does Police Bharti include physical tests?",
        "Physical selection requirements can apply, depending on the position and recruitment authority.",
      ],
      [
        "Are requirements identical across states?",
        "No. Eligibility and selection procedures vary by recruiting authority.",
      ],
    ],
  ),

  "upsc-coaching": defineCourse(
    [
      "UPSC Civil Services preparation involves a broad understanding of Indian society, governance, history, geography, economics, current affairs and other prescribed areas.",
      "Candidates should plan separately for the preliminary examination, mains examination and personality test, as applicable under the current rules.",
    ],
    [
      [
        "General Studies",
        [
          "Indian history",
          "Geography",
          "Indian polity and governance",
          "Economy",
          "Environment and science",
        ],
      ],
      [
        "Mains and Assessment Skills",
        [
          "Answer writing",
          "Essay writing",
          "Ethics",
          "Optional subject preparation",
          "Current affairs analysis",
        ],
      ],
    ],
    [
      "Read the current UPSC Civil Services syllabus.",
      "Build a structured foundation in general studies.",
      "Practise preliminary questions and mains answers.",
      "Revise current affairs and analyse practice results.",
    ],
    [
      [
        "What are the stages of UPSC Civil Services?",
        "The recruitment process generally includes preliminary, mains and personality-test stages, as defined in the current notification.",
      ],
      [
        "Is answer writing important?",
        "Written-answer practice is important for preparing for the mains examination.",
      ],
    ],
  ),

  "mpsc-coaching": defineCourse(
    [
      "MPSC examinations are conducted by the Maharashtra Public Service Commission for different state-government recruitment pathways.",
      "Preparation may involve Maharashtra-specific history, geography, governance, general studies, aptitude and current affairs. The syllabus depends on the particular examination and post.",
    ],
    [
      [
        "Maharashtra and General Studies",
        [
          "Maharashtra history",
          "Maharashtra geography",
          "Indian polity",
          "Economics",
          "Current affairs",
        ],
      ],
      [
        "Aptitude and Examination Skills",
        [
          "Reasoning",
          "Quantitative aptitude",
          "Language comprehension",
          "Answer writing where applicable",
        ],
      ],
    ],
    [
      "Select the appropriate MPSC examination.",
      "Review its official syllabus and eligibility.",
      "Study Maharashtra-specific topics.",
      "Practise previous questions and applicable written assessments.",
    ],
    [
      ["What is MPSC?", "MPSC is the Maharashtra Public Service Commission."],
      [
        "Are all MPSC examinations identical?",
        "No. Different recruitment examinations may have different patterns and eligibility requirements.",
      ],
    ],
  ),

  "nda-cds-afcat": defineCourse(
    [
      "NDA, CDS and AFCAT are separate defence-related selection pathways. Each has different eligibility, examination requirements and entry arrangements.",
      "Preparation may include mathematics, English, general knowledge, reasoning, current affairs and awareness of subsequent selection stages, depending on the chosen examination.",
    ],
    [
      [
        "Mathematics and Aptitude",
        [
          "Arithmetic",
          "Algebra",
          "Trigonometry",
          "Reasoning",
          "Numerical ability",
        ],
      ],
      [
        "English and General Knowledge",
        [
          "Grammar and vocabulary",
          "Reading comprehension",
          "General science",
          "History and geography",
          "Current affairs",
        ],
      ],
      [
        "Selection Awareness",
        [
          "SSB interview process",
          "Communication skills",
          "Physical and medical eligibility awareness",
        ],
      ],
    ],
    [
      "Identify NDA, CDS or AFCAT as the actual target.",
      "Review the corresponding official notification.",
      "Practise the appropriate written subjects.",
      "Understand the applicable later-stage selection process.",
    ],
    [
      [
        "Are NDA, CDS and AFCAT the same examination?",
        "No. They are separate examinations and selection pathways.",
      ],
      [
        "Does defence selection include more than written tests?",
        "Additional selection, medical and other requirements may apply depending on the entry pathway.",
      ],
    ],
  ),

  ctet: defineCourse(
    [
      "CTET is the Central Teacher Eligibility Test. Candidates should select the applicable paper and review the current eligibility and examination syllabus.",
      "Preparation includes child development and pedagogy, language proficiency and the subject knowledge relevant to the intended teaching level.",
    ],
    [
      [
        "Child Development and Pedagogy",
        [
          "Learning and development",
          "Educational psychology",
          "Inclusive education",
          "Teaching approaches",
        ],
      ],
      [
        "Languages and Subject Knowledge",
        [
          "Language comprehension",
          "Language pedagogy",
          "Mathematics and environmental studies",
          "Science or social studies where applicable",
        ],
      ],
    ],
    [
      "Select the relevant CTET paper.",
      "Follow its current official syllabus.",
      "Study child development and teaching methods.",
      "Practise subject-wise and timed questions.",
    ],
    [
      ["What is CTET?", "CTET is the Central Teacher Eligibility Test."],
      [
        "Are CTET Paper I and Paper II identical?",
        "No. They relate to different teaching levels and have different subject requirements.",
      ],
    ],
  ),

  "ugc-net": defineCourse(
    [
      "UGC NET is a national examination associated with specified academic eligibility and admission pathways, subject to current rules.",
      "Preparation usually involves a general teaching and research aptitude component alongside the chosen subject paper.",
    ],
    [
      [
        "Teaching and Research Aptitude",
        [
          "Teaching aptitude",
          "Research methodology",
          "Communication",
          "Logical reasoning",
          "Data interpretation",
        ],
      ],
      [
        "Subject-Specific Studies",
        [
          "Chosen academic discipline",
          "Core theoretical concepts",
          "Research applications",
          "Previous question analysis",
        ],
      ],
    ],
    [
      "Choose the correct UGC NET subject.",
      "Review the official syllabus for both applicable papers.",
      "Practise reasoning and research aptitude.",
      "Revise discipline-specific material.",
    ],
    [
      [
        "What is UGC NET?",
        "UGC NET is a national-level examination associated with academic eligibility and related pathways specified in current rules.",
      ],
      [
        "Does everyone study the same subject?",
        "No. Candidates select an applicable subject paper in addition to the general component.",
      ],
    ],
  ),

  "rbi-grade-b": defineCourse(
    [
      "RBI Grade B recruitment is a selection process for specified officer positions at the Reserve Bank of India.",
      "Candidates should check the current stream, examination pattern and eligibility requirements. Preparation areas may include aptitude, economics, finance, management and general awareness.",
    ],
    [
      [
        "Aptitude and Awareness",
        ["Quantitative aptitude", "Reasoning", "English", "General awareness"],
      ],
      [
        "Economics, Finance and Management",
        [
          "Economic and social issues",
          "Financial systems",
          "Management principles",
          "Economic developments",
        ],
      ],
    ],
    [
      "Check the applicable RBI Grade B stream.",
      "Follow its current official syllabus.",
      "Develop economic and financial awareness.",
      "Practise relevant examination and written-answer formats.",
    ],
    [
      [
        "What is RBI Grade B?",
        "It refers to recruitment for specified Grade B officer positions at the Reserve Bank of India.",
      ],
      [
        "Is the syllabus the same for every stream?",
        "No. Requirements can vary by recruitment stream.",
      ],
    ],
  ),

  "nabard-grade-a": defineCourse(
    [
      "NABARD Grade A recruitment is associated with specified officer positions at the National Bank for Agriculture and Rural Development.",
      "Preparation may include aptitude, economic and social issues, agriculture and rural development, and stream-specific subjects.",
    ],
    [
      [
        "General Aptitude",
        ["Reasoning", "Quantitative aptitude", "English", "General awareness"],
      ],
      [
        "Agriculture and Rural Development",
        [
          "Agricultural systems",
          "Rural development",
          "Economic and social issues",
          "Financial inclusion",
        ],
      ],
    ],
    [
      "Review the current NABARD recruitment stream.",
      "Study the official syllabus.",
      "Revise rural development and economic issues.",
      "Practise applicable written and objective assessments.",
    ],
    [
      [
        "What is NABARD Grade A?",
        "It is a recruitment pathway for specified officer positions at NABARD.",
      ],
      [
        "Why study rural development?",
        "Agriculture and rural development are relevant subject areas for applicable NABARD recruitment streams.",
      ],
    ],
  ),

  "sebi-grade-a": defineCourse(
    [
      "SEBI Grade A recruitment concerns specified officer positions at the Securities and Exchange Board of India.",
      "The examination content depends on the recruitment stream and may involve finance, commerce, economics, management, English and aptitude.",
    ],
    [
      [
        "Aptitude and English",
        [
          "Quantitative aptitude",
          "Reasoning",
          "English language",
          "General awareness",
        ],
      ],
      [
        "Finance and Professional Knowledge",
        [
          "Financial markets",
          "Economics",
          "Commerce and accounting",
          "Management",
          "Stream-specific knowledge",
        ],
      ],
    ],
    [
      "Select the intended SEBI Grade A stream.",
      "Review the current notification and syllabus.",
      "Revise financial and professional concepts.",
      "Practise relevant examination formats.",
    ],
    [
      [
        "What is SEBI Grade A?",
        "It refers to recruitment for specified officer positions at SEBI.",
      ],
      [
        "Does every stream have the same syllabus?",
        "No. Professional subject requirements can differ by stream.",
      ],
    ],
  ),

  "lic-aao": defineCourse(
    [
      "LIC AAO recruitment is associated with Assistant Administrative Officer positions at Life Insurance Corporation of India.",
      "Preparation depends on the recruitment category and may include reasoning, quantitative aptitude, English, insurance awareness and professional knowledge.",
    ],
    [
      [
        "Reasoning and Quantitative Aptitude",
        ["Puzzles", "Data interpretation", "Arithmetic", "Logical reasoning"],
      ],
      [
        "English and Insurance Awareness",
        [
          "Reading comprehension",
          "Grammar and vocabulary",
          "Insurance terminology",
          "Financial awareness",
        ],
      ],
    ],
    [
      "Review the current LIC AAO recruitment notification.",
      "Identify generalist or specialist requirements.",
      "Practise aptitude and language questions.",
      "Study insurance and financial fundamentals where applicable.",
    ],
    [
      [
        "What does LIC AAO stand for?",
        "LIC AAO stands for Life Insurance Corporation Assistant Administrative Officer.",
      ],
      [
        "Are all AAO posts identical?",
        "No. Recruitment categories can have different professional and eligibility requirements.",
      ],
    ],
  ),

  // =====================================================
  // PROFESSIONAL AND FUTURE SKILLS
  // =====================================================

  "spoken-english": defineCourse(
    [
      "Spoken English learning focuses on developing confidence in everyday communication. Practice often includes vocabulary, pronunciation, sentence construction, listening and conversation.",
      "Learners can develop fluency gradually through speaking exercises, useful expressions, structured discussions and feedback.",
    ],
    [
      [
        "English Communication",
        [
          "Everyday vocabulary",
          "Sentence formation",
          "Conversation practice",
          "Listening comprehension",
          "Pronunciation",
        ],
      ],
      [
        "Practical Speaking Skills",
        [
          "Introductions",
          "Situational conversations",
          "Presentations",
          "Group discussion",
          "Interview communication",
        ],
      ],
    ],
    [
      "Assess current speaking confidence and ability.",
      "Practise short daily conversations.",
      "Improve listening and pronunciation.",
      "Use feedback to develop clarity and fluency.",
    ],
    [
      [
        "Can beginners learn spoken English?",
        "Yes. Beginners can start with everyday vocabulary, short sentences and basic conversations.",
      ],
      [
        "How can speaking confidence improve?",
        "Regular conversation practice, listening and constructive feedback can help.",
      ],
    ],
  ),

  "personality-development": defineCourse(
    [
      "Personality development focuses on practical self-improvement skills, including communication, confidence, emotional awareness, teamwork and professional presentation.",
      "Activities may involve self-reflection, public speaking, goal setting and interpersonal communication, depending on the learner's needs.",
    ],
    [
      [
        "Personal Effectiveness",
        [
          "Self-awareness",
          "Goal setting",
          "Confidence building",
          "Time management",
          "Professional conduct",
        ],
      ],
      [
        "Communication and Interaction",
        [
          "Public speaking",
          "Active listening",
          "Teamwork",
          "Presentation skills",
          "Interpersonal communication",
        ],
      ],
    ],
    [
      "Identify specific personal development goals.",
      "Practise communication in realistic situations.",
      "Reflect on feedback and progress.",
      "Build consistent and constructive habits.",
    ],
    [
      [
        "What is personality development?",
        "It involves improving communication, confidence, self-awareness and other interpersonal and professional skills.",
      ],
      [
        "Is personality development only about public speaking?",
        "No. It also includes self-management, listening, teamwork and personal effectiveness.",
      ],
    ],
  ),

  robotics: defineCourse(
    [
      "Robotics introduces learners to systems that combine mechanical components, electronics, sensors and programming.",
      "Project-based robotics learning can develop logical thinking, experimentation and an understanding of how physical devices respond to programmed instructions.",
    ],
    [
      [
        "Robotics Fundamentals",
        [
          "Basic mechanisms",
          "Motors and actuators",
          "Sensors",
          "Electronic circuits",
          "Microcontrollers",
        ],
      ],
      [
        "Programming and Projects",
        [
          "Programming logic",
          "Input and output",
          "Automation concepts",
          "Robot movement",
          "Testing and troubleshooting",
        ],
      ],
    ],
    [
      "Learn electronics and safety fundamentals.",
      "Understand basic programming logic.",
      "Experiment with guided robotics projects.",
      "Test designs and identify improvements.",
    ],
    [
      [
        "What is robotics?",
        "Robotics involves designing, programming and understanding machines that interact with their environment.",
      ],
      [
        "Do robotics learners need programming knowledge?",
        "Programming is useful, but beginners can start with foundational concepts and guided projects.",
      ],
    ],
  ),

  "coding-ai": defineCourse(
    [
      "Coding and artificial intelligence education introduces learners to programming logic, algorithms, data and the foundations of intelligent computer systems.",
      "Students can begin with basic programming and progress to small applications, problem-solving exercises and introductory AI concepts.",
    ],
    [
      [
        "Coding Foundations",
        [
          "Variables and data types",
          "Conditions and loops",
          "Functions",
          "Algorithms",
          "Debugging",
        ],
      ],
      [
        "Artificial Intelligence Foundations",
        [
          "AI concepts and terminology",
          "Data and patterns",
          "Introductory machine learning",
          "Responsible AI use",
          "Simple practical projects",
        ],
      ],
    ],
    [
      "Start with programming fundamentals.",
      "Practise small coding problems.",
      "Explore AI through understandable examples.",
      "Develop and improve beginner projects.",
    ],
    [
      [
        "Can beginners study coding and AI?",
        "Yes. Beginners can start with programming logic and simple AI concepts before progressing to advanced topics.",
      ],
      [
        "Is coding required for AI?",
        "Programming is useful for many AI development activities, although conceptual AI learning can begin without advanced coding.",
      ],
    ],
  ),
};

/**
 * Return individual course SEO content if available.
 *
 * Returns null for unknown slugs, preventing unrelated
 * or generic syllabus content from being displayed.
 */
export function getCourseSeoContent(slug: string): CourseSeoContent | null {
  return courseSeoContent[slug] ?? null;
}
