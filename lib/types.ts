export type Role =
  | "student"
  | "educator"
  | "admin"
  | "parent"
  | "counsellor";

export type UserStatus = "active" | "pending" | "rejected";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  label: string;
  status?: UserStatus;
  verified?: boolean;
};

export type DemoCredential = {
  role: Role;
  label: string;
  email: string;
  password: string;
};

export type DemoUserRecord = SessionUser & {
  password: string;
  program: string;
};

export type ManagedUser = SessionUser & {
  program: string;
  status: UserStatus;
  passwordHint?: string;
  linkedStudentId?: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type DashboardInsight = {
  title: string;
  description: string;
  tone: "positive" | "warning" | "neutral";
};

export type DashboardAnalytics = {
  refreshedAt: string;
  metrics: DashboardMetric[];

  attendance: {
    rate: number | null;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };

  assessments: {
    averageScore: number | null;
    publishedTests: number;
    resultCount: number;
    subjectPerformance: Array<{
      subject: string;
      percentage: number;
      resultCount: number;
    }>;
  };

  learning: {
    activitiesRecorded: number;
    completionRate: number | null;
    homeworkRate: number | null;
    assignmentRate: number | null;
    revisionRate: number | null;
    averageStudyMinutes: number | null;
  };

  finance: {
    billed: number;
    collected: number;
    pending: number;
    overdueCount: number;
  } | null;

  operations: {
    activeBatches: number;
    learners: number;
    completedLectures: number;
    scheduledLectures: number;
  };

  insights: DashboardInsight[];
};

export type PermissionItem = {
  title: string;
  description: string;
};

export type CourseItem = {
  id: string;
  category: string;
  sections: string[];
  stream?: "Science" | "Commerce" | "Arts" | "General";
  statusLabel: string;
  standardKey: string;
  title: string;
  tagline: string;
  schedule: string;
  summary: string;
  description: string;
  duration: string;
  mode: string;
  audienceLabel: string;
  courseNamesIncluded: string[];
  branchesIncluded: string[];
  subjectsCovered: string[];
  points: string[];
  audience: Role[];
  toppers?: {
    name: string;
    image: string;
    result: string;
    detail?: string;
  }[];
};

export type TestItem = {
  id: string;
  title: string;
  status: string;
  summary: string;
  audience: Role[];
  assignedUserIds?: string[];
  createdBy?: string;
  questions?: TestQuestion[];
};

export type MessageItem = {
  id: string;
  title: string;
  body: string;
  channel: string;
  audience: Role[];
  userIds?: string[];
  author?: string;
  createdAt?: string;
  expiresAt?: string | null;
};

export type SocialLink = {
  label: string;
  href: string;
  color: string;
  glow: string;
};

export type ContactMethod = {
  label: string;
  value: string;
  href: string;
  description: string;
  color?: string;
  icon?: string;
};

export type ContactAction = {
  label: string;
  href: string;
  style: "primary" | "secondary";
};

export type DetailedCourse = CourseItem;

export type InstituteBranch = {
  name: string;
  address: string;
  mapQuery: string;
};

export type InstituteProfile = {
  name: string;
  city: string;
  address: string;
  branches: InstituteBranch[];
  phone: string;
  email: string;
  hours: string;
  specialties: string[];
  directorName: string;
  directorTitle: string;
  affiliatedInstitutes: string[];
};

export type PublicMetric = {
  label: string;
  value: string;
};

export type OperationsHighlight = {
  title: string;
  description: string;
  tag: string;
};

export type ProgramShowcase = {
  category: string;
  title: string;
  duration: string;
  description: string;
  focus: string[];
};

export type RoleShowcase = {
  role: Role;
  title: string;
  summary: string;
  features: string[];
};

export type MediaFeature = {
  title: string;
  description: string;
};

export type DesignPrinciple = {
  title: string;
  description: string;
  metric: string;
};

export type PlacedStudent = {
  id: string;
  name: string;
  location: string;
  course: string;
  company?: string;
  role?: string;
  salary?: string;
  image?: string;
  examName?: string;
  marks?: string;
  rank?: string;
  quote?: string;
};

export type PublicInstituteData = {
  profile: InstituteProfile;
  socialLinks: SocialLink[];
  contactMethods: ContactMethod[];
  contactActions: ContactAction[];
  whatsappHref: string;
  headlineLines: string[];
  metrics: PublicMetric[];
  operationsHighlights: OperationsHighlight[];
  programs: ProgramShowcase[];
  roles: RoleShowcase[];
  mediaFeatures: MediaFeature[];
  designPrinciples: DesignPrinciple[];
  detailedCourses: DetailedCourse[];
  placedStudents: PlacedStudent[];
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
  category: string;
};

export type TestQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

export type TestSubmission = {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  answers: number[];
  score: number | null;
  total: number;
  status: "submitted" | "graded" | "published";
  submittedAt: string;
  publishedMessageTitle: string;
  feedback?: string;
  gradedBy?: string;
};

export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  storageUrl: string;
  fileName: string;
  audience: Role[];
  createdAt: string;
  createdBy: string;
};

export type DashboardPrimaryPanel = {
  title: string;
  badge: string;
  items: { title: string; description: string; meta: string }[];
};

export type PerformanceHeuristics = {
  outstanding: number;
  excellent: number;
  good: number;
  average: number;
  weak: number;
};

export type PerformanceReport = {
  id: string;
  studentId: string;
  studentName: string;
  batchName: string;
  courseType: "JEE" | "NEET" | "Foundation";
  parentContact: string;
  reportType: "weekly" | "monthly";
  period: string; // e.g., "Week 1, May 2026" or "May 2026"

  // Core Metrics
  averageScore: number;
  batchRank: number;
  attendancePercentage: number;
  homeworkCompletionPercentage: number;
  improvementPercentage: number;

  // Weekly Specific
  weeklyMarksTrend?: { day: string; marks: number }[];
  subjectWiseMarks: { subject: string; marks: number }[];
  accuracyAnalysis: { category: string; value: number }[]; // Pie chart data
  attendanceData: { label: string; value: number }[]; // Bar chart data

  // Monthly Specific
  examReadinessScore?: number;
  consistencyScore?: number;
  monthlyGrowthTrend?: { month: string; percentage: number }[];
  rankProgress?: { test: string; rank: number }[];
  chapterAccuracyHeatmap?: { chapter: string; accuracy: number }[];

  // Qualitative Analysis
  strongSubjects: string[];
  weakSubjects: string[];
  weakChapters: string[];
  strongAreas: string[];
  weakAreas: string[];

  // AI/Smart Features (Can be manually entered or suggested)
  accuracyPercentage: number;
  timeManagementAnalysis: string;
  teacherRemark: string;
  improvementSuggestion: string;
  studyRecommendation: string;
  performancePrediction?: string;

  createdAt: string;
  createdBy: string;
};

// =========================
// Attendance System
// =========================

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceRecord = {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
};

export type AttendanceSheet = {
  id: string;
  title: string;
  date: string;
  batchName?: string;
  subject?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  records: AttendanceRecord[];
  lectureId?: string;
  batchId?: string;
};

// =========================
// Fee / Invoice System
// =========================

export type FeeInvoiceStatus = "paid" | "unpaid" | "partial" | "overdue";

export type FeeInvoice = {
  id: string;
  studentId: string;
  studentName: string;
  parentId?: string;

  receiptNo?: string;
  parentName?: string;
  classCourse?: string;
  batch?: string;
  rollNo?: string;
  academicYear?: string;
  mobileNo?: string;
  particulars?: string;
  month?: string;
  paymentMode?: string;

  title: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  status: FeeInvoiceStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

// =========================
// Lecture / Live Class System
// =========================

export type LectureStatus = "scheduled" | "completed" | "cancelled";

export type LectureItem = {
  id: string;
  title: string;
  subject?: string;
  batchName?: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  meetingLink?: string;
  recordingLink?: string;
  materialLink?: string;
  assignedStudentIds?: string[];
  status: LectureStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  topicCovered?: string;
  homeworkGiven?: string;
  assignmentGiven?: string;
  revisionTask?: string;
  doubtsSolved?: string;
  nextTopic?: string;
  attendanceSheetId?: string;
  lectureReportSubmittedAt?: string;
  batchId?: string;
  teacherId?: string;
  teacherName?: string;
};

// =========================
// Enquiry System
// =========================

export type EnquiryStatus = "new" | "contacted" | "enrolled" | "closed";

export type Enquiry = {
  id?: string;
  name: string;
  contact: string;
  role: string;
  courseTitle: string;
  courseKey: string;
  message: string;
  createdAt: string;
  status: EnquiryStatus;
  suggestedCourses?: {
    standardKey: string;
    title: string;
  }[];
};

// =========================
// Dashboard Bundle
// =========================

export type UserProfile = {
  verified?: boolean;
  dob?: string;
  profilePhoto?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Student specific
  parentName?: string;
  parentEmail?: string;
  parentMobile?: string;
  courseWanted?: string;
  courseWantedTitle?: string;
  studentType?: "online" | "centre-based" | "home" | "on-campus";
  weakSubjects?: string[];
  strongSubjects?: string[];
  latestQualification?: string;
  latestAcademicScore?: string;

  // Educator specific
  qualification?: string;
  cvUrl?: string;
  experience?: string;
  subjects?: string[];
};

export type DashboardBundle = {
  roleLabel: string;
  heroTitle: string;
  heroDescription: string;
  stats: DashboardMetric[];
  primaryPanel: DashboardPrimaryPanel;
  permissions: PermissionItem[];
  courses: CourseItem[];
  tests: TestItem[];
  messages: MessageItem[];
  submissions: TestSubmission[];
  attendanceSheets: AttendanceSheet[];
  feeInvoices: FeeInvoice[];
  lectures: LectureItem[];
  linkedStudentId?: string;
  profile?: UserProfile;
  batches?: Batch[];
  teacherBatchAssignments?: TeacherBatchAssignment[];
  weeklyTests?: WeeklyTest[];
  teacherFeedback?: TeacherFeedback[];
  behaviourNotes?: BehaviourNote[];
  dailyActivities?: StudentDailyActivity[];
  feeInstallmentPlans?: FeeInstallmentPlan[];
  teacherPayouts?: TeacherPayout[];
  notifications?: AppNotification[];
  analytics?: DashboardAnalytics;
};

// =========================
// batch items
// =========================

export type Batch = {
  id: string;
  name: string;
  courseId?: string;
  courseName?: string;
  subject?: string;
  studentIds: string[];
  teacherIds: string[];
  schedule?: string;
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

export type TeacherBatchAssignment = {
  id: string;
  teacherId: string;
  batchId: string;
  subject?: string;
  assignedAt: string;
  assignedBy: string;
};

// =========================
// weeklyy test items
// =========================

export type WeeklyTestResultStatus =
  | "present"
  | "absent"
  | "not-submitted";

export type WeeklyTestResult = {
  studentId: string;
  studentName: string;
  obtainedMarks?: number;
  status: WeeklyTestResultStatus;
  remarks?: string;
};

export type WeeklyTest = {
  id: string;
  title: string;
  batchId: string;
  batchName: string;
  teacherId: string;
  subject: string;
  testDate: string;
  totalMarks: number;
  published: boolean;
  results: WeeklyTestResult[];
  createdAt: string;
  updatedAt?: string;
};

// =========================
// TeacherFeedback
// =========================

export type FeedbackCategory =
  | "academic"
  | "homework"
  | "attendance"
  | "improvement";

export type TeacherFeedback = {
  id: string;

  studentId: string;
  studentName: string;

  teacherId: string;
  teacherName?: string;

  batchId?: string;
  batchName?: string;
  subject?: string;

  category: FeedbackCategory;

  strengths?: string;
  areasToImprove?: string;
  feedback: string;

  visibleToParent: boolean;

  createdAt: string;
  updatedAt?: string;
};


// =========================
// BehaviourNote
// =========================

export type BehaviourRating =
  | "excellent"
  | "good"
  | "needs-improvement"
  | "concern";

export type BehaviourNote = {
  id: string;

  studentId: string;
  studentName: string;

  teacherId: string;
  teacherName?: string;

  batchId?: string;
  batchName?: string;

  rating: BehaviourRating;
  note: string;
  actionTaken?: string;

  visibleToParent: boolean;
  resolved?: boolean;

  createdAt: string;
  updatedAt?: string;
};

// =========================
// StudentDailyActivity
// =========================

export type DailyActivityParticipation =
  | "excellent"
  | "good"
  | "needs-improvement"
  | "not-recorded";

export type StudentDailyActivity = {
  id: string;

  studentId: string;
  studentName: string;

  batchId: string;
  batchName: string;

  teacherId: string;
  teacherName?: string;

  subject?: string;
  date: string;

  topicStudied?: string;

  homeworkCompleted: boolean;
  assignmentCompleted: boolean;
  revisionCompleted: boolean;

  doubtsRaised?: string;
  participation: DailyActivityParticipation;

  studyMinutes?: number;
  teacherVerified: boolean;
  teacherNote?: string;

  visibleToParent: boolean;

  createdAt: string;
  updatedAt?: string;
};

// =========================
//  TeacherPayout
// =========================

export type TeacherPayoutStatus = "pending" | "partial" | "paid";

export type TeacherPayout = {
  id: string;
  teacherId: string;
  month: string;

  basePay: number;
  perClassRate: number;
  completedClasses: number;
  classEarnings: number;

  bonus: number;
  deductions: number;

  totalPayable: number;
  paidAmount: number;
  pendingAmount: number;

  status: TeacherPayoutStatus;
  payoutDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};


// =========================
// Fee Installment Plans
// =========================

export type FeeInstallmentStatus =
  | "paid"
  | "partial"
  | "due"
  | "overdue";

export type FeeInstallment = {
  installmentNumber: number;

  amount: number;
  paidAmount: number;
  pendingAmount: number;

  dueDate: string;
  paidDate?: string;

  status: FeeInstallmentStatus;

  receiptNumber?: string;
  paymentMode?: string;
  notes?: string;
};

export type FeeInstallmentPlanStatus =
  | "active"
  | "completed"
  | "cancelled";

export type FeeInstallmentPlan = {
  id: string;

  studentId: string;
  studentName: string;
  parentId?: string;

  invoiceId?: string;
  title: string;

  courseName?: string;
  batchName?: string;
  academicYear?: string;

  totalFee: number;
  paidAmount: number;
  pendingAmount: number;

  status: FeeInstallmentPlanStatus;

  installments: FeeInstallment[];

  notes?: string;

  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

// =========================
// Notifications
// =========================

export type AppNotificationType =
  | "lecture"
  | "homework"
  | "attendance"
  | "test"
  | "feedback"
  | "fees"
  | "payment"
  | "placement";

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: AppNotificationType;
  link?: string;
  read: boolean;
  createdAt: string;
};


// =========================
// Placement Jobs System
// =========================

export type PlacementJobStatus = "draft" | "published" | "closed";

export type PlacementJobType =
  | "full-time"
  | "internship"
  | "part-time"
  | "contract";

export type PlacementApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "selected"
  | "rejected";

export type PlacementApplicationQuestion = {
  id: string;
  label: string;
  required: boolean;
};

export type PlacementJob = {
  id: string;
  company: string;
  role: string;
  location: string;
  salary?: string;
  eligibility?: string;
  jobType: PlacementJobType;
  deadline: string;
  description: string;
  skills: string[];
  applicationQuestions: PlacementApplicationQuestion[];

  status: PlacementJobStatus;

  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
};

export type PlacementApplicationAnswer = {
  questionId: string;
  questionLabel: string;
  answer: string;
};

export type PlacementApplication = {
  id: string;

  jobId: string;
  company: string;
  jobRole: string;

  studentId: string;
  studentName: string;
  studentEmail: string;

  phone: string;
  programme: string;
  skills: string[];
  resumeUrl?: string;
  experience?: string;
  message?: string;
  answers: PlacementApplicationAnswer[];

  status: PlacementApplicationStatus;
  statusNote?: string;

  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
};