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
  assignedFacultyIds?: string[];
};

export type ManagedUser = SessionUser & {
  program: string;
  status: UserStatus;
  passwordHint?: string;
  linkedStudentId?: string;
  assignedFacultyIds?: string[];
  assignedFacultyNames?: string[];
  profilePhoto?: string;
  mobile?: string;
  profile?: UserProfile;
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
    dailyRecords?: Array<{ date: string; rate: number; present: number; total: number }>;
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

  activeStudents?: number;

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
// =========================
// Exam Types
// =========================

export type ExamType =
  | "unit-1"
  | "semester-1"
  | "unit-2"
  | "semester-2";

export type TestItem = {
  id: string;

  title: string;
  status: string;
  summary: string;

  examType?: ExamType;

  audience: Role[];

  assignedUserIds?: string[];

  createdBy?: string;

  questions?: TestQuestion[];

  total?: number;

  subject?: string;

  duration?: number;
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
transactionId?: string;

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
  date?: string;
  duration?: number;
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
  dateOfBirth?: string;
  gender?: string;
  fatherName?: string;
  guardianPhone?: string;
  profilePhoto?: string;
  addressLine1?: string;
  addressLine2?: string;
  address?: string;
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
  examQualifications?: ExamQualification[];

  // Permissions
  chatDisabled?: boolean;
};

export type ExamQualification = {
  examName: string;
  score?: string;
  year?: string;
  rank?: string;
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
  linkedStudentProfile?: { name?: string; email?: string; phone?: string; course?: string; batch?: string; attendance?: number | null };
  assignedFacultyIds?: string[];
  assignedFacultyNames?: string[];
  profile?: UserProfile;
  batches?: Batch[];
  teacherBatchAssignments?: TeacherBatchAssignment[];
  weeklyTests?: WeeklyTest[];
  teacherFeedback?: TeacherFeedback[];
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
  code?: string;
  courseId?: string;
  courseName?: string;
  subject?: string;
  capacity?: number;
  studentIds: string[];
  teacherIds: string[];
  schedule?: string;
  startDate?: string;
  endDate?: string;
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
  status?: string;
  duration?: number;
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
// Student Daily Routine
// =========================

export type DailyRoutineMood =
  | "difficult"
  | "okay"
  | "good"
  | "great";

export type StudentDailyRoutine = {
  id: string;

  studentId: string;
  studentName: string;

  date: string;

  wakeUpTime: string;
  bedTime: string;

  sleepMinutes: number;
  studyMinutes: number;
  screenMinutes: number;
  exerciseMinutes: number;

  tasksCompleted: number;

  mood: DailyRoutineMood;

  mainGoal?: string;
  reflection?: string;

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

export type AuthLogAction = "login" | "logout" | "signup";

export type AuthLogEntry = {
  id: string;
  action: AuthLogAction;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: Role;
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  timestamp: string;
  success: boolean;
  error?: string;
};

export type StudentRiskLevel = "low" | "medium" | "high";

export type StudentStats = {
  total: number;
  active: number;
  atRisk: number;
  dropped: number;
  newThisMonth: number;
};

export type StudentDirectoryEntry = ManagedUser & {
  admissionNo?: string;
  batchName?: string;
  attendancePercent?: number;
  feesStatus?: "paid" | "partial" | "unpaid" | "none";
  riskLevel?: StudentRiskLevel;
  photoUrl?: string;
};

export type BulkUpdateResult = {
  updated: number;
  skipped: number;
  errors: string[];
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export type PasswordResetRequestStatus = "new" | "contacted" | "resolved";

export type PasswordResetRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastPassword: string;
  role: Role;
  message?: string;
  status: PasswordResetRequestStatus;
  createdAt: string;
  adminNote?: string;
};

// =========================
// Homework / Assignment System
// =========================

export type HomeworkType = "homework" | "assignment" | "classwork" | "project" | "test";

export type HomeworkItem = {
  id: string;
  title: string;
  description?: string;
  objective?: string;
  keySteps?: string[];
  deliverables?: string;
  evaluationCriteria?: string;
  estimatedHours?: number;
  taskNumber?: number;
  subject?: string;
  hwType: HomeworkType;
  maxMarks: number;
  dueDate: string;
  batchId: string;
  batchName?: string;
  allowLateSubmission: boolean;
  attachmentUrl?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
};

export type HomeworkSubmissionStatus = "submitted" | "graded";

export type HomeworkSubmission = {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  content?: string;
  attachmentUrl?: string;
  submittedAt: string;
  status: HomeworkSubmissionStatus;
  marks?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
};

export type GamificationActivity =
  | "exam_pass"
  | "full_attendance"
  | "homework_submit"
  | "top_performer"
  | "good_conduct"
  | "participation"
  | "manual";

export type BadgeCriteriaType =
  | "points_threshold"
  | "exam_score"
  | "attendance_streak"
  | "homework_count";

export type AutoAwardTrigger =
  | "attendance_100_week"
  | "attendance_above_90"
  | "exam_score_above_90"
  | "exam_score_above_75"
  | "homework_submitted"
  | "homework_on_time"
  | "rank_1_class"
  | "rank_top3_class";

export type GamificationPointEntry = {
  id: string;
  studentId: string;
  points: number;
  activity: GamificationActivity;
  description?: string;
  awardedBy: string;
  awardedByName?: string;
  createdAt: string;
};

export type GamificationBadge = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  criteriaType: BadgeCriteriaType;
  criteriaValue: number;
  color: string;
  createdAt: string;
};

export type GamificationStudentBadge = {
  id: string;
  studentId: string;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  reason?: string;
  awardedBy: string;
  awardedAt: string;
};

export type GamificationLevel = {
  level: number;
  name: string;
  pointsRequired: number;
};

export type GamificationAutoAwardRule = {
  id: string;
  name: string;
  trigger: AutoAwardTrigger;
  points: number;
  badgeId?: string;
  createdAt: string;
};

export type GamificationStats = {
  totalPointsAwarded: number;
  activeStudents: number;
  totalBadgesGiven: number;
};

export type GamificationLeaderboardEntry = {
  studentId: string;
  studentName: string;
  studentPhoto?: string;
  points: number;
  badges: number;
  level: number;
  levelName: string;
  rank: number;
};

export type ChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  messageId: string;
};

export type ChatFlag = {
  id: string;
  messageId: string;
  senderId: string;
  receiverId: string;
  flaggedBy: string;
  reason: "phone" | "email" | "link" | "other";
  reasonDetail: string;
  status: "pending" | "allowed" | "blocked";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

export type ChatBlock = {
  id: string;
  participantIds: string[];
  blocked: boolean;
  blockedAt?: string;
  blockedBy?: string;
  reason?: string;
};

// =========================
// Roles & Permissions System
// =========================

export type AvailableModule =
  | "overview"
  | "accounts"
  | "students"
  | "attendance"
  | "leave"
  | "fees"
  | "fee-installments"
  | "lectures"
  | "timetable"
  | "courses"
  | "batches"
  | "tests"
  | "weekly-tests"
  | "messages"
  | "chat"
  | "notifications"
  | "enquiries"
  | "library"
  | "performance"
  | "daily-activities"
  | "homework"
  | "student-feedback"
  | "teacher-payouts"
  | "placement-jobs"
  | "sales-crm"
  | "gamification"
  | "ptm"
  | "chat-monitor"
  | "password-reset-requests";

export const AVAILABLE_MODULES: { id: AvailableModule; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts" },
  { id: "students", label: "Students" },
  { id: "attendance", label: "Attendance" },
  { id: "leave", label: "Leave" },
  { id: "fees", label: "Fees" },
  { id: "fee-installments", label: "Fee Installments" },
  { id: "lectures", label: "Lectures" },
  { id: "timetable", label: "Timetable" },
  { id: "courses", label: "Courses" },
  { id: "batches", label: "Batches" },
  { id: "tests", label: "Exams" },
  { id: "weekly-tests", label: "Weekly Tests" },
  { id: "messages", label: "Messages" },
  { id: "chat", label: "Chat" },
  { id: "notifications", label: "Notifications" },
  { id: "enquiries", label: "Enquiries" },
  { id: "library", label: "Library" },
  { id: "performance", label: "Performance" },
  { id: "daily-activities", label: "Daily Activities" },
  { id: "homework", label: "Homework" },
  { id: "student-feedback", label: "Feedback" },
  { id: "teacher-payouts", label: "Teacher Payouts" },
  { id: "placement-jobs", label: "Placement Jobs" },
  { id: "sales-crm", label: "Sales CRM" },
  { id: "gamification", label: "Gamification" },
  { id: "ptm", label: "PTM" },
  { id: "chat-monitor", label: "Chat Monitor" },
  { id: "password-reset-requests", label: "Password Reset" },
];

export type CustomRole = {
  id: string;
  name: string;
  description?: string;
  color: string;
  modules: AvailableModule[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type CustomRoleAssignment = {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  assignedAt: string;
  assignedBy: string;
};

// =========================
// Leave Management System
// =========================

export type LeaveStatus = "pending" | "approved" | "rejected";

export type LeaveRequest = {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  leaveTypeId: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  documentUrl?: string;
  status: LeaveStatus;
  rejectReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type LeaveTypeItem = {
  id: string;
  name: string;
  category: string;
  daysAllowed: number;
  isPaid: boolean;
  color: string;
  isActive: boolean;
};

export type HolidayItem = {
  id: string;
  name: string;
  date: string;
  type: string;
  color: string;
};

export type LeaveBalanceItem = {
  id: string;
  userId: string;
  userName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  daysAllowed: number;
  daysUsed: number;
  note?: string;
};

// =========================
// Staff Attendance System
// =========================

export type StaffAttendanceStatus = "present" | "absent" | "half_day" | "late" | "on_leave" | "holiday";
export type EmploymentType = "full_time" | "part_time" | "contractual" | "hourly";
export type StaffCategory = "Teacher" | "Staff" | "Admin" | "Counsellor";

export type StaffAttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: StaffCategory;
  employmentType: EmploymentType;
  date: string;
  status: StaffAttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  biometricId?: string;
  markedBy?: string;
  markedAt: string;
  updatedAt?: string;
};

export type StaffAttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  halfDay: number;
  late: number;
  onLeave: number;
  holiday: number;
};

// =========================
// Biometric Integration Types
// =========================

export type BiometricDevice = {
  id: string;
  name: string;
  location: string;
  serialNumber?: string;
  webhookToken: string;
  autoMarkAttendance: boolean;
  sendParentSms: boolean;
  sendStaffSms: boolean;
  isOnline: boolean;
  lastSeenAt?: string;
  totalPunches: number;
  mappedStudents: number;
  mappedStaff: number;
  createdAt: string;
  updatedAt?: string;
};

export type BiometricPunchLog = {
  id: string;
  deviceId: string;
  deviceName: string;
  personId: string;
  personName: string;
  personType: "Student" | "Staff";
  biometricId: string;
  punchType: "CheckIn" | "CheckOut";
  inputType: string;
  temperature?: string;
  punchedAt: string;
  status: "marked" | "pending" | "skipped";
  createdAt: string;
};

// =========================
// Attendance Regularisation
// =========================

export type RegularisationRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  reason: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  requestedStatus: StaffAttendanceStatus;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
};