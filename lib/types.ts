export type Role = "student" | "educator" | "admin" | "parent" | "counsellor";

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
    dailyRecords?: Array<{
      date: string;
      rate: number;
      present: number;
      total: number;
    }>;
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

export type ExamType = "unit-1" | "semester-1" | "unit-2" | "semester-2";

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
  courseType: "JEE" | "NEET" | "Foundation";
  parentContact: string;
  reportType: "weekly" | "monthly";
  period: string; // e.g., "Week 1, May 2026" or "May 2026"

  // Core Metrics
  averageScore: number;
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
  subject?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  records: AttendanceRecord[];
  lectureId?: string;
};

// =========================
// Fee / Invoice System
// =========================

export type FeeInvoiceStatus = "paid" | "unpaid" | "partial" | "overdue";

export type PaymentMode =
  | "Cash"
  | "UPI"
  | "Bank Transfer"
  | "Card"
  | "Online Payment"
  | "Cheque";

export type PaymentTransaction = {
  paidAmount: number;
  paidDate: string;
  paymentMode: PaymentMode;
  transactionId?: string;
  chequeNumber?: string;
  bankName?: string;
  accountLast4?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
};

export type FeeInvoice = {
  id: string;
  studentId: string;
  studentName: string;
  parentId?: string;

  receiptNo?: string;
  parentName?: string;
  classCourse?: string;
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
  transactions: PaymentTransaction[];
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
  studentType?: "online" | "campus" | "home" | "centre-based" | "on-campus";

  campusLocation?: "vashi" | "panvel";

  campusLocationTitle?: "Vashi Campus" | "Panvel Campus";

  weakSubjects?: string[];
  strongSubjects?: string[];
  latestQualification?: string;
  latestAcademicScore?: string;

  // Educator specific
  qualification?: string;
  cvUrl?: string;
  photoIdFrontUrl?: string;
  photoIdBackUrl?: string;
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
  linkedStudentProfile?: {
    name?: string;
    email?: string;
    phone?: string;
    course?: string;
    batch?: string;
    attendance?: number | null;
  };
  assignedFacultyIds?: string[];
  assignedFacultyNames?: string[];
  profile?: UserProfile;
  weeklyTests?: WeeklyTest[];
  teacherFeedback?: TeacherFeedback[];
  dailyActivities?: StudentDailyActivity[];
  feeInstallmentPlans?: FeeInstallmentPlan[];
  teacherPayouts?: TeacherPayout[];
  notifications?: AppNotification[];
  analytics?: DashboardAnalytics;
  certificates?: Certificate[];
  staffAttendanceRecords?: StaffAttendanceRecord[];
};

// =========================
// weeklyy test items
// =========================

export type WeeklyTestResultStatus = "present" | "absent" | "not-submitted";

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

export type DailyRoutineMood = "difficult" | "okay" | "good" | "great";

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
// Staff Payout (Unified)
// =========================

export type StaffPayoutStatus = "paid" | "unpaid" | "partial";

export type StaffPayout = {
  id: string;
  staffId: string;
  staffName: string;

  month: string;
  title: string;
  particulars: string;

  amount: number;
  paidAmount: number;
  status: StaffPayoutStatus;

  paymentMode?: string;
  transactionId?: string;
  paidDate?: string;

  transactions: PaymentTransaction[];

  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

// =========================
// Staff Payout Audit Log
// =========================

export type StaffPayoutAuditAction =
  | "created"
  | "updated"
  | "payment_recorded"
  | "deleted";

export type StaffPayoutAuditLog = {
  id: string;
  payoutId: string;
  receiptNo: string;
  staffId: string;
  staffName: string;
  action: StaffPayoutAuditAction;
  title?: string;
  month?: string;
  amount?: number;
  paidAmount?: number;
  previousAmount?: number;
  paymentMode?: string;
  transactionId?: string;
  paidDate?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  performedBy: string;
  performedByName: string;
  createdAt: string;
};

// =========================
// Business Expenses
// =========================

export type BusinessExpenseCategory =
  | "Rent"
  | "Electricity"
  | "Internet"
  | "Marketing"
  | "Software"
  | "Office Supplies"
  | "Travel"
  | "Maintenance"
  | "Taxes"
  | "Other";

export type BusinessExpense = {
  id: string;

  title: string;
  category: BusinessExpenseCategory;

  amount: number;
  expenseDate: string;

  paymentMode: PaymentMode;
  transactionId?: string;

  vendor?: string;
  notes?: string;
  receiptUrl?: string;

  createdBy: string;
  createdByName?: string;

  createdAt: string;
  updatedAt?: string;
};

// =========================
// Profit & Loss
// =========================

export type ProfitLossMonthlyRow = {
  month: string;
  monthLabel: string;

  invoiceIncome: number;
  installmentIncome: number;
  totalIncome: number;

  staffExpense: number;
  businessExpense: number;
  totalExpense: number;

  netProfit: number;
};

export type ProfitLossSummary = {
  fromDate: string;
  toDate: string;
  generatedAt: string;

  income: {
    invoicePayments: number;
    installmentPayments: number;
    total: number;
  };

  expenses: {
    staffPayouts: number;
    businessExpenses: number;
    total: number;
  };

  pendingFees: {
    invoices: number;
    installments: number;
    total: number;
  };

  netProfit: number;
  profitMargin: number;

  monthly: ProfitLossMonthlyRow[];

  recentExpenses: BusinessExpense[];
};

// =========================
// Fee Installment Plans
// =========================

export type FeeInstallmentStatus = "paid" | "partial" | "due" | "overdue";

export type FeeInstallment = {
  installmentNumber: number;
  installmentTitle?: string;

  amount: number;
  paidAmount: number;
  pendingAmount: number;

  dueDate: string;
  paidDate?: string;

  status: FeeInstallmentStatus;

  receiptNumber?: string;
  paymentMode?: string;
  transactions: PaymentTransaction[];
  notes?: string;
};

export type FeeInstallmentPlanStatus = "active" | "completed" | "cancelled";

export type FeeInstallmentPlan = {
  id: string;

  studentId: string;
  studentName: string;
  parentId?: string;

  invoiceId?: string;
  title: string;

  courseName?: string;
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
// Personal Mentorship System
// =========================

export type MentorshipMode =
  | "online"
  | "vashi-campus"
  | "panvel-campus";

export type MentorshipRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

export type FacultyMentorshipProfile = {
  id: string;

  facultyId: string;
  facultyName: string;

  isAvailable: boolean;

  subjects: string[];
  modes: MentorshipMode[];

  availableDays: string[];
  availableFrom?: string;
  availableTo?: string;

  maximumActiveStudents: number;

  bio?: string;
  languages?: string[];

  createdAt: string;
  updatedAt?: string;
};

export type MentorshipFacultyCard =
  FacultyMentorshipProfile & {
    facultyEmail?: string;
    facultyPhoto?: string;
    qualification?: string;
    experience?: string;

    activeStudentCount: number;
    remainingCapacity: number;
  };

export type MentorshipRequest = {
  id: string;

  studentId: string;
  studentName: string;
  studentEmail?: string;

  facultyId: string;
  facultyName: string;

  subject: string;
  goal: string;
  message?: string;

  preferredMode: MentorshipMode;
  preferredDate?: string;
  preferredTime?: string;

  status: MentorshipRequestStatus;

  facultyResponse?: string;

  scheduledAt?: string;
  meetingLink?: string;
  location?: string;

  acceptedAt?: string;
  declinedAt?: string;
  cancelledAt?: string;
  completedAt?: string;

  createdAt: string;
  updatedAt?: string;
};

// =========================
// Parent-Teacher Meeting System
// =========================

export type PtmMode = "online" | "offline";

export type PtmStatus = "scheduled" | "completed" | "cancelled";

export type PtmSession = {
  id: string;

  title: string;

  studentId: string;
  studentName: string;

  parentId?: string;
  parentName?: string;

  teacherId: string;
  teacherName: string;

  batchId?: string;
  batchName?: string;

  startsAt: string;
  endsAt?: string;

  mode: PtmMode;

  meetingLink?: string;
  location?: string;

  agenda?: string;
  notes?: string;

  status: PtmStatus;

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
  | "placement"
  | "ptm"
  | "doubt"
  | "mentorship";

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
// Complaint Box System
// =========================

export type ComplaintCategory =
  | "academic"
  | "faculty"
  | "fees"
  | "attendance"
  | "technical"
  | "facilities"
  | "safety"
  | "other";

export type ComplaintPriority = "low" | "medium" | "high" | "urgent";

export type ComplaintStatus =
  | "submitted"
  | "under-review"
  | "resolved"
  | "closed";

export type ComplaintItem = {
  id: string;

  submittedById: string;
  submittedByName: string;
  submittedByRole: "student" | "parent" | "educator";

  category: ComplaintCategory;

  subject: string;
  description: string;

  priority: ComplaintPriority;
  status: ComplaintStatus;

  adminNote?: string;

  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;

  createdAt: string;
  updatedAt?: string;
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

export type HomeworkType =
  | "homework"
  | "assignment"
  | "classwork"
  | "project"
  | "test";

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
  allowLateSubmission: boolean;
  attachmentUrl?: string;

  assignedStudentIds: string[];
  assignedStudentNames?: string[];

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
// =========================
// Doubt Box System
// =========================

export type DoubtStatus = "open" | "answered" | "resolved" | "closed";

export type DoubtAnswerAuthorRole = "student" | "educator" | "admin" | "ai";

export type DoubtAnswer = {
  id: string;
  doubtId: string;

  authorId: string;
  authorName: string;
  authorRole: DoubtAnswerAuthorRole;

  content: string;
  attachmentUrl?: string;

  isAccepted: boolean;

  createdAt: string;
  updatedAt?: string;
};

export type DoubtItem = {
  id: string;

  studentId: string;
  studentName: string;

  batchId?: string;
  batchName?: string;

  subject: string;
  title: string;
  description: string;
  attachmentUrl?: string;

  status: DoubtStatus;
  isLocked: boolean;

  acceptedAnswerId?: string;

  aiAnswerRequestedAt?: string;

  answerCount?: number;
  answers?: DoubtAnswer[];

  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
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
  | "doubt-box"
  | "personal-mentorship"
  | "student-feedback"
  | "teacher-payouts"
  | "placement-jobs"
  | "sales-crm"
  | "gamification"
  | "ptm"
  | "complaints"
  | "chat-monitor"
  | "password-reset-requests"
  | "certificates";

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
{ id: "doubt-box", label: "Doubt Box" },
{
  id: "personal-mentorship",
  label: "Personal Mentorship",
},
{ id: "student-feedback", label: "Feedback" },
  { id: "teacher-payouts", label: "Teacher Payouts" },
  { id: "placement-jobs", label: "Placement Jobs" },
  { id: "sales-crm", label: "Sales CRM" },
  { id: "gamification", label: "Gamification" },
  { id: "ptm", label: "PTM" },
  { id: "complaints", label: "Complaint Box" },
  { id: "chat-monitor", label: "Chat Monitor" },
  { id: "password-reset-requests", label: "Password Reset" },
  { id: "certificates", label: "Certificates" },
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

export type StaffAttendanceStatus =
  | "present"
  | "absent"
  | "half_day"
  | "late"
  | "on_leave"
  | "holiday";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contractual"
  | "hourly";
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

// =========================
// Staff Payroll / Salary Management System
// =========================

export type PayrollEmploymentType =
  | "full_time"
  | "part_time"
  | "contractual"
  | "hourly";

export type PayrollSalaryType = "monthly" | "hourly" | "per_class";

export type StaffPayrollProfile = {
  id: string;
  userId: string;
  userName: string;
  employeeId?: string;
  employmentType: PayrollEmploymentType;
  salaryType: PayrollSalaryType;
  monthlySalary: number;
  hourlyRate: number;
  perClassRate: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  pfEnabled: boolean;
  tdsEnabled: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type PayrollRunStatus =
  | "draft"
  | "approved"
  | "finalized"
  | "settled"
  | "rolled_back";

export type PayrollSlipStatus =
  | "pending"
  | "generated"
  | "approved"
  | "paid"
  | "held";

export type PayrollSlip = {
  id: string;
  payrollRunId: string;
  staffProfileId: string;
  userId: string;
  userName: string;
  employeeId?: string;
  employmentType: PayrollEmploymentType;
  monthlySalary: number;
  hourlyRate: number;
  perClassRate: number;
  workingDays: number;
  presentDays: number;
  attendancePercent: number;
  grossPay: number;
  pfDeduction: number;
  tdsDeduction: number;
  advanceRecovery: number;
  totalDeductions: number;
  netPay: number;
  status: PayrollSlipStatus;
  paidAmount: number;
  paidDate?: string;
  paymentMode?: string;
  transactionRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type PayrollRun = {
  id: string;
  month: number;
  year: number;
  label: string;
  status: PayrollRunStatus;
  totalStaff: number;
  profilesSetUp: number;
  workingDays: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalSettled: number;
  slips: PayrollSlip[];
  approvedBy?: string;
  approvedAt?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  settledBy?: string;
  settledAt?: string;
  rolledBackBy?: string;
  rolledBackAt?: string;
  rollbackReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

export type SalaryAdvance = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  reason: string;
  repayMonth?: string;
  status: "pending" | "deducted" | "cancelled";
  createdBy: string;
  createdAt: string;
};

export type SalaryIncrement = {
  id: string;
  userId: string;
  userName: string;
  previousSalary: number;
  newSalary: number;
  effectiveDate: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
};

export type SalaryTransfer = {
  id: string;
  userId: string;
  userName: string;
  payrollRunId?: string;
  amount: number;
  paymentMode: string;
  transactionRef?: string;
  notes?: string;
  transferredBy: string;
  transferredByName: string;
  transferredAt: string;
  createdAt: string;
};

// =========================
// Fee Deletion Audit Log
// =========================

export type FeeDeletionAuditLog = {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  studentAdmNo?: string;
  courseName?: string;
  feeTitle: string;
  feeType?: string;
  principalAmount: number;
  fineAmount: number;
  discountAmount: number;
  netReversed: number;
  paymentMode: string;
  paymentDate: string;
  performedByName: string;
  performedByEmail: string;
  ipAddress?: string;
  balanceBeforePaid: number;
  balanceBeforeDue: number;
  balanceAfterPaid: number;
  balanceAfterDue: number;
  previousFeeStatus: string;
  newFeeStatus: string;
  createdAt: string;
};

// =========================
// Certificate System
// =========================

export type CertificateTemplateId =
  | "classic-gold"
  | "modern-blue"
  | "professional-dark";

export type CertificateRecipientType = "student" | "educator" | "parent";

export type Certificate = {
  id: string;
  templateId: CertificateTemplateId;
  recipientId: string;
  recipientName: string;
  recipientType: CertificateRecipientType;
  recipientEmail?: string;
  title: string;
  description: string;
  courseName?: string;
  issuedDate: string;
  issuedBy: string;
  issuedByName: string;
  certificateNo: string;
  status: "issued" | "revoked";
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  createdAt: string;
  updatedAt?: string;
};
