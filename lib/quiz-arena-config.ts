export type EducationLevel =
  | 'class-1-2'
  | 'class-3-5'
  | 'class-6-8'
  | 'class-9-10'
  | 'class-11-12'
  | 'undergraduate'
  | 'graduate'
  | 'competitive-exam';

export type Stream = 'science' | 'commerce' | 'humanities';

export type CompetitiveExam =
  | 'upsc'
  | 'ssc'
  | 'banking'
  | 'railways'
  | 'cat'
  | 'cuet'
  | 'neet'
  | 'jee'
  | 'government-exams'
  | 'general-aptitude';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type LevelOption = {
  id: EducationLevel;
  title: string;
  subtitle: string;
  icon: string;
};

export type ExamOption = {
  id: CompetitiveExam;
  title: string;
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
    id: 'class-1-2',
    title: 'Class 1–2',
    subtitle: 'Foundation Learner',
    icon: '🌟',
  },
  {
    id: 'class-3-5',
    title: 'Class 3–5',
    subtitle: 'Primary Explorer',
    icon: '🚀',
  },
  {
    id: 'class-6-8',
    title: 'Class 6–8',
    subtitle: 'Middle School Challenger',
    icon: '🧠',
  },
  {
    id: 'class-9-10',
    title: 'Class 9–10',
    subtitle: 'Board Prep Learner',
    icon: '📘',
  },
  {
    id: 'class-11-12',
    title: 'Class 11–12',
    subtitle: 'Senior Secondary',
    icon: '🎓',
  },
  {
    id: 'undergraduate',
    title: 'Undergraduate',
    subtitle: 'College Learner',
    icon: '💻',
  },
  {
    id: 'graduate',
    title: 'Graduate',
    subtitle: 'Advanced Learner',
    icon: '🏆',
  },
  {
    id: 'competitive-exam',
    title: 'Competitive Exams',
    subtitle: 'Exam Aspirant',
    icon: '🎯',
  },
];

export const streamSubjects: Record<Stream, string[]> = {
  science: [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Computer Science',
  ],
  commerce: [
    'Accountancy',
    'Business Studies',
    'Economics',
    'English',
    'Mathematics',
  ],
  humanities: [
    'History',
    'Political Science',
    'Geography',
    'Economics',
    'English',
  ],
};

export const levelSubjects: Partial<Record<EducationLevel, string[]>> = {
  'class-1-2': [
    'Mathematics',
    'English',
    'Environmental Studies',
    'General Awareness',
  ],
  'class-3-5': [
    'Mathematics',
    'English',
    'Science',
    'Environmental Studies',
    'General Knowledge',
  ],
  'class-6-8': [
    'Mathematics',
    'Science',
    'English',
    'Social Science',
    'Computer Basics',
    'General Knowledge',
  ],
  'class-9-10': [
    'Mathematics',
    'Science',
    'English',
    'Social Science',
    'Computer Science',
    'General Knowledge',
  ],
  undergraduate: [
    'Aptitude',
    'Computer Science',
    'Economics',
    'Business Studies',
    'Communication Skills',
    'Logical Reasoning',
  ],
  graduate: [
    'Advanced Aptitude',
    'Professional Skills',
    'Computer Science',
    'Business & Management',
    'Economics',
    'Logical Reasoning',
    'Current Affairs',
  ],
};

export const competitiveExams: ExamOption[] = [
  {
    id: 'upsc',
    title: 'UPSC',
    subjects: [
      'History',
      'Geography',
      'Polity',
      'Economics',
      'Current Affairs',
      'Environment',
    ],
  },
  {
    id: 'ssc',
    title: 'SSC',
    subjects: [
      'Quantitative Aptitude',
      'Reasoning',
      'English',
      'General Awareness',
    ],
  },
  {
    id: 'banking',
    title: 'Banking',
    subjects: [
      'Quantitative Aptitude',
      'Reasoning',
      'English',
      'Banking Awareness',
    ],
  },
  {
    id: 'railways',
    title: 'Railways',
    subjects: [
      'Mathematics',
      'Reasoning',
      'General Awareness',
      'General Science',
    ],
  },
  {
    id: 'cat',
    title: 'CAT',
    subjects: [
      'Quantitative Aptitude',
      'VARC',
      'Logical Reasoning',
      'Data Interpretation',
    ],
  },
  {
    id: 'cuet',
    title: 'CUET',
    subjects: ['English', 'General Test', 'Mathematics', 'Economics'],
  },
  {
    id: 'neet',
    title: 'NEET',
    subjects: ['Physics', 'Chemistry', 'Biology'],
  },
  {
    id: 'jee',
    title: 'JEE',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
  },
  {
    id: 'government-exams',
    title: 'Government Exams',
    subjects: [
      'General Awareness',
      'Reasoning',
      'English',
      'Quantitative Aptitude',
    ],
  },
  {
    id: 'general-aptitude',
    title: 'General Aptitude',
    subjects: [
      'Quantitative Aptitude',
      'Logical Reasoning',
      'English',
    ],
  },
];

export const difficultyOptions: DifficultyOption[] = [
  {
    id: 'easy',
    title: 'Easy',
    questions: 5,
    description: 'Warm up and build confidence',
    icon: '🌱',
  },
  {
    id: 'medium',
    title: 'Medium',
    questions: 10,
    description: 'Test your understanding',
    icon: '⚡',
  },
  {
    id: 'hard',
    title: 'Hard',
    questions: 15,
    description: 'Take the ultimate challenge',
    icon: '🔥',
  },
];

export function getLevelTitle(level: EducationLevel | null): string {
  return levelOptions.find((option) => option.id === level)?.title ?? '';
}

export function getExamTitle(exam: CompetitiveExam | null): string {
  return competitiveExams.find((option) => option.id === exam)?.title ?? '';
}