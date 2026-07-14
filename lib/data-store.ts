import { cache } from "react";
import { randomUUID } from "crypto";

import type { Document } from "mongodb";

import { getPublicInstituteData as getTemplatePublicInstituteData } from "@/lib/mock-data";
import { getMongoDatabase } from "@/lib/mongodb";
import {
  DEFAULT_COURSE_TEMPLATE_KEY,
  getCourseTemplateByKey,
  getCourseTemplateOptions,
  getCourseTemplateOrder,
  inferCourseTemplateKey,
  courseLibrary,
} from "@/lib/course-library";
import type {
  AttendanceSheet,
  CourseItem,
  ComplaintItem,
  DashboardMetric,
  DashboardBundle,
  DemoCredential,
  FeeInvoice,
  FeeInstallment,
  FeeInstallmentPlan,
  LectureItem,
  PtmSession,
  LibraryBook,
  ManagedUser,
  MessageItem,
  PerformanceHeuristics,
  PerformanceReport,
  PermissionItem,
  PublicInstituteData,
  QuizQuestion,
  Role,
  SessionUser,
  TestItem,
  TestQuestion,
  TestSubmission,
  UserProfile,
  WeeklyTest,
  TeacherFeedback,
  TeacherPayout,
  AppNotification,
StudentDailyActivity,
StudentDailyRoutine,
PlacementApplication,
  PlacementJob,
  PlacementApplicationStatus,
  DashboardAnalytics,
  StudentStats,
  StudentDirectoryEntry,
  StudentRiskLevel,
  BulkUpdateResult,
  ImportResult,
  HomeworkItem,
  HomeworkSubmission,
  AuthLogEntry,
  AuthLogAction,
  GamificationActivity,
  GamificationPointEntry,
  GamificationBadge,
  GamificationStudentBadge,
  GamificationLevel,
  GamificationAutoAwardRule,
  GamificationStats,
  GamificationLeaderboardEntry,
  BadgeCriteriaType,
  AutoAwardTrigger,
  ChatAttachment,
  ChatFlag,
  ChatBlock,
  LeaveRequest,
  LeaveTypeItem,
  HolidayItem,
  LeaveBalanceItem,
  LeaveStatus,
  CustomRole,
  CustomRoleAssignment,
  AvailableModule,
  StaffAttendanceRecord,
  StaffAttendanceStatus,
  StaffAttendanceSummary,
  StaffCategory,
  EmploymentType,
  BiometricDevice,
  BiometricPunchLog,
  RegularisationRequest,
  StaffPayrollProfile,
  PayrollRun,
  PayrollSlip,
  SalaryAdvance,
  SalaryIncrement,
  SalaryTransfer,
  PayrollSlipStatus,
  PayrollRunStatus,
  StaffPayout,
  StaffPayoutStatus,
  StaffPayoutAuditLog,
  StaffPayoutAuditAction,
  PaymentTransaction,
  PaymentMode,
  FeeDeletionAuditLog,
} from "@/lib/types";

import type {
  CrmDashboardSummary,
  CrmLead,
  CrmLeadActivityType,
  CrmLeadStatus,
  CrmStaff,
  CrmStaffDesignation,
} from "@/lib/crm-types";

type DashboardTemplate = {
  roleLabel: string;
  heroTitle: string;
  heroDescription: string;
  stats: DashboardBundle["stats"];
  primaryPanel: DashboardBundle["primaryPanel"];
  permissions: DashboardBundle["permissions"];
};

type UserDocument = SessionUser & {
  password: string;
  program: string;
  mobile?: string;
  mobileKey?: string;
  parentMobile?: string;
  linkedStudentId?: string;
  linkedStudentMobile?: string;
  emailKey?: string;
  status?: "active" | "pending" | "rejected";
  verified?: boolean;
  permissions?: PermissionItem[];
  createdAt?: string;
  updatedAt?: string;
  profile?: UserProfile;
  assignedFacultyIds?: string[];
};

type MessageDocument = MessageItem & {
  audience?: Role[] | Role | null;
  userIds?: string[] | string | null;
  createdAt?: string | Date | null;
  expiresAt?: string | Date | null;
};

export const COLLECTIONS = {
  content: "content",
  users: "users",
  courses: "courses",
  tests: "tests",
  messages: "messages",
  submissions: "test_submissions",
  quizzes: "quiz_questions",
  library: "digital_library",
  performance: "performance_reports",
  heuristics: "performance_heuristics",

  attendanceSheets: "attendanceSheets",
  feeInvoices: "feeInvoices",
  lectures: "lectures",
  ptmSessions: "ptmSessions",

  weeklyTests: "weeklyTests",
 teacherFeedback: "teacherFeedback",


// Teacher-created daily learning records
dailyActivities: "dailyActivities",

// Student-created personal routine records
studentDailyRoutines: "studentDailyRoutines",

feeInstallmentPlans: "feeInstallmentPlans",
  teacherPayouts: "teacherPayouts",
  notifications: "notifications",

  // Complaint Box
  complaints: "complaints",

  placementJobs: "placementJobs",
  placementApplications: "placementApplications",

  crmLeads: "crmLeads",
  crmStaff: "crmStaff",

  enquiries: "enquiries",
  passwordResetRequests: "passwordResetRequests",
  homework: "homework",
  homeworkSubmissions: "homeworkSubmissions",
  authLogs: "authLogs",
  gamificationPoints: "gamification_points",
  gamificationBadges: "gamification_badges",
  gamificationStudentBadges: "gamification_student_badges",
  gamificationRules: "gamification_rules",
  chatFlags: "chat_flags",
  chatBlocks: "chat_blocks",
  chatAttachments: "chat_attachments",

  // Leave Management
  leaveRequests: "leaveRequests",
  leaveTypes: "leaveTypes",
  holidays: "holidays",
  leaveBalances: "leaveBalances",

  // Roles & Permissions
  customRoles: "customRoles",
  roleAssignments: "roleAssignments",

  // Staff Attendance
  staffAttendance: "staffAttendance",

  // Attendance Regularisation
  regularisationRequests: "regularisationRequests",

  // Biometric Integration
  biometricDevices: "biometricDevices",
  biometricPunchLogs: "biometricPunchLogs",

  // Staff Payroll
  staffPayrollProfiles: "staffPayrollProfiles",
  payrollRuns: "payrollRuns",
  salaryAdvances: "salaryAdvances",
  salaryIncrements: "salaryIncrements",
  salaryTransfers: "salaryTransfers",

  // Unified Staff Payouts
  staffPayouts: "staffPayouts",

  // Staff Payout Audit Logs
  staffPayoutAuditLogs: "staffPayoutAuditLogs",

  // Fee Deletion Audit Logs
  feeDeletionAuditLogs: "feeDeletionAuditLogs",
} as const;
// ... (existing code)

export async function createEnquiry(input: {
  name: string;
  contact: string;
  role: string;
  courseTitle: string;
  courseKey: string;
  message: string;
  suggestedCourses?: { standardKey: string; title: string }[];
}) {
  const collection = await getCollection(COLLECTIONS.enquiries);
  const enquiry = {
    ...input,
    suggestedCourses: input.suggestedCourses?.length
      ? input.suggestedCourses
      : [],
    createdAt: new Date().toISOString(),
    status: "new",
  };
  await collection.insertOne(enquiry);
  return enquiry;
}

export async function getAllEnquiries() {
  const collection = await getCollection(COLLECTIONS.enquiries);
  return await collection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function createPasswordResetRequest(input: {
  name: string;
  email: string;
  phone: string;
  lastPassword: string;
  role: string;
}) {
  const collection = await getCollection(COLLECTIONS.passwordResetRequests);
  const request = {
    ...input,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(request);
  return request;
}

export async function getAllPasswordResetRequests() {
  const collection = await getCollection(COLLECTIONS.passwordResetRequests);
  return await collection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function updatePasswordResetRequest(
  id: string,
  update: { status?: string; adminNote?: string },
) {
  const collection = await getCollection(COLLECTIONS.passwordResetRequests);
  await collection.updateOne({ id }, { $set: update });
}

export const DEFAULT_HEURISTICS: PerformanceHeuristics = {
  outstanding: 95,
  excellent: 85,
  good: 70,
  average: 50,
  weak: 40,
};

let userIndexesPromise: Promise<void> | null = null;
let standardCoursesBackfillPromise: Promise<void> | null = null;

function toPlainData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stripMongoId<T>(document: T & { _id?: unknown }) {
  const plain = toPlainData(document) as T & { _id?: unknown };

  if (plain && typeof plain === "object" && "_id" in plain) {
    delete plain._id;
  }

  return plain as T;
}

function stripMongoIds<T extends Array<{ _id?: unknown }>>(documents: T) {
  return documents.map((document) => stripMongoId(document)) as {
    [K in keyof T]: T[K] extends { _id?: unknown } ? Omit<T[K], "_id"> : T[K];
  };
}

export async function getCollection<T extends Document>(
  name: (typeof COLLECTIONS)[keyof typeof COLLECTIONS],
) {
  const db = await getMongoDatabase();
  return db.collection<T>(name);
}

async function ensureUserIndexes() {
  if (!userIndexesPromise) {
    userIndexesPromise = (async () => {
      const collection = await getCollection<UserDocument>(COLLECTIONS.users);
      await collection.updateMany({}, [
        {
          $set: {
            emailKey: { $toLower: "$email" },
          },
        },
      ]);
      await Promise.all([
        collection.createIndex(
          { id: 1 },
          { unique: true, name: "users_unique_id" },
        ),
        collection.createIndex(
          { emailKey: 1 },
          { unique: true, name: "users_unique_emailKey" },
        ),
      ]);
    })().catch((error) => {
      userIndexesPromise = null;
      throw error;
    });
  }

  return userIndexesPromise;
}

async function getUsersCollection() {
  await ensureUserIndexes();
  return getCollection<UserDocument>(COLLECTIONS.users);
}

async function getContentDocument<T extends Document>(id: string) {
  const collection = await getCollection<Document>(COLLECTIONS.content);
  const document = await collection.findOne({ _id: id } as any);

  if (!document) {
    throw new Error(
      `Mongo content document "${id}" was not found. Bootstrap the database first (POST /api/admin/bootstrap with x-bootstrap-key, or run npm run bootstrap:mongo).`,
    );
  }

  return stripMongoId(document as unknown as T & { _id: string });
}

function toSessionUser(user: UserDocument): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    label: user.label,
    status: user.status,
    verified: user.verified,
  };
}

function toManagedUser(user: UserDocument): ManagedUser {
  return {
    ...toSessionUser(user),
    program: user.program,
    status: (user.status === "rejected" ? "pending" : user.status) ?? "active",
    passwordHint: user.password,
    linkedStudentId: user.linkedStudentId,
    assignedFacultyIds: user.assignedFacultyIds,
    mobile: user.mobile,
    profilePhoto: user.profile?.profilePhoto,
    profile: user.profile,
  };
}

function getRoleLabel(role: Role) {
  if (role === "admin") return "Admin Console";
  if (role === "counsellor") return "Counsellor CRM";
  if (role === "educator") return "Educator Desk";
  if (role === "student") return "Student Dashboard";
  if (role === "parent") return "Parent Dashboard";
  return "Dashboard";
}

function buildHeroTitle(
  role: Role,
  template: DashboardTemplate,
  user: SessionUser | null,
) {
  if (!user) {
    return template.heroTitle;
  }

  if (role === "student") {
    return `Welcome back, ${user.name.split(" ")[0]}`;
  }

  if (role === "parent") {
    return `Parent Dashboard`;
  }

  if (role === "educator") {
    return `Educator Console | ${user.name}`;
  }

  if (role === "counsellor") {
    return `Counsellor CRM | ${user.name}`;
  }

  if (role === "admin") {
    return `Admin Command Center | ${user.name}`;
  }

  return template.heroTitle;
}

const STANDARD_ADDITIONAL_COURSE_KEYS = new Set([
  "class-6-additional",
  "class-7-additional",
  "class-8-additional",
  "class-9-additional",
  "class-10-additional",
  "class-11-additional",
  "class-12-additional",
]);

function hydrateCourse(document: Partial<CourseItem> & { id: string }) {
  const templateKey =
    document.standardKey ??
    inferCourseTemplateKey(document.title) ??
    DEFAULT_COURSE_TEMPLATE_KEY;

  const template =
    getCourseTemplateByKey(templateKey) ??
    getCourseTemplateByKey(DEFAULT_COURSE_TEMPLATE_KEY);

  if (!template) {
    throw new Error("Default course template could not be resolved.");
  }

  // Class 6–12 programme pages must always use current library data.
  // This prevents old MongoDB course information from appearing.
  if (STANDARD_ADDITIONAL_COURSE_KEYS.has(template.standardKey)) {
    return {
      id: document.id,
      ...template,
    } satisfies CourseItem;
  }

  return {
    id: document.id,
    category: document.category ?? template.category,
    stream: document.stream ?? template.stream ?? "General",
    sections: document.sections?.length
      ? (() => {
          const validSections = document.sections.filter((section) =>
            template.sections.includes(section),
          );

          return validSections.length
            ? validSections
            : template.sections;
        })()
      : template.sections,
    statusLabel: document.statusLabel ?? template.statusLabel,
    standardKey: template.standardKey,
    tagline: document.tagline ?? template.tagline,
    title: template.title,
    schedule: document.schedule ?? template.schedule,
    summary: document.summary ?? template.summary,
    description: document.description ?? template.description,
    duration: document.duration ?? template.duration,
    mode: document.mode ?? template.mode,
    audienceLabel: document.audienceLabel ?? template.audienceLabel,
    courseNamesIncluded: document.courseNamesIncluded?.length
      ? document.courseNamesIncluded
      : template.courseNamesIncluded,
    branchesIncluded: document.branchesIncluded?.length
      ? document.branchesIncluded
      : template.branchesIncluded,
    subjectsCovered: document.subjectsCovered?.length
      ? document.subjectsCovered
      : template.subjectsCovered,
    points: document.points?.length ? document.points : template.points,
    audience: document.audience?.length
      ? document.audience
      : template.audience,
  } satisfies CourseItem;
}

function createStandardCourseDocument(template: Omit<CourseItem, "id">) {
  return {
    id: `standard-course-${template.standardKey}`,
    ...template,
    createdAt: new Date().toISOString(),
    createdBy: "system-backfill",
  };
}

function dedupeAndSortCourses(courses: CourseItem[]) {
  const byStandardKey = new Map<string, CourseItem>();

  for (const course of courses) {
    if (!byStandardKey.has(course.standardKey)) {
      byStandardKey.set(course.standardKey, course);
    }
  }

  return [...byStandardKey.values()].sort((left, right) => {
    const orderDifference =
      getCourseTemplateOrder(left.standardKey) -
      getCourseTemplateOrder(right.standardKey);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return left.title.localeCompare(right.title);
  });
}

async function ensureStandardCoursesBackfilled() {
  if (!standardCoursesBackfillPromise) {
    standardCoursesBackfillPromise = (async () => {
      const collection = await getCollection<
        CourseItem & { createdAt?: string; createdBy?: string }
      >(COLLECTIONS.courses);
      const existingCourses = stripMongoIds(
        await collection.find({}).toArray(),
      );

      for (const course of existingCourses) {
        if (course.standardKey) {
          continue;
        }

        const inferredKey = inferCourseTemplateKey(course.title);
        if (!inferredKey) {
          continue;
        }

        await collection.updateOne(
          { id: course.id },
          {
            $set: {
              standardKey: inferredKey,
              title: getCourseTemplateByKey(inferredKey)?.title ?? course.title,
            },
          },
        );
      }

      const normalizedCourses = stripMongoIds(
        await collection.find({}).toArray(),
      );
      const existingKeys = new Set(
        normalizedCourses
          .map(
            (course) =>
              course.standardKey ?? inferCourseTemplateKey(course.title),
          )
          .filter((key): key is string => Boolean(key)),
      );

      const missingTemplates = courseLibrary.filter(
        (template) => !existingKeys.has(template.standardKey),
      );

      if (!missingTemplates.length) {
        return;
      }

      await Promise.all(
        missingTemplates.map((template) =>
          collection.updateOne(
            { standardKey: template.standardKey },
            { $setOnInsert: createStandardCourseDocument(template) },
            { upsert: true },
          ),
        ),
      );
    })().catch((error) => {
      standardCoursesBackfillPromise = null;
      throw error;
    });
  }

  return standardCoursesBackfillPromise;
}

function normalizeStringArray(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }

  return [];
}

function toIsoString(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeMessage(document: MessageDocument): MessageItem {
  return {
    ...document,
    audience: normalizeStringArray(document.audience) as Role[],
    userIds: normalizeStringArray(document.userIds),
    createdAt: toIsoString(document.createdAt) ?? undefined,
    expiresAt: toIsoString(document.expiresAt),
  };
}

function isMessageActive(message: MessageItem, now = Date.now()) {
  if (!message.expiresAt) {
    return true;
  }

  const expiryTime = new Date(message.expiresAt).getTime();
  return Number.isNaN(expiryTime) ? true : expiryTime > now;
}

function isMessageVisibleToUser(
  message: MessageItem,
  role: Role,
  userId?: string,
) {
  if (!message.audience.includes(role)) {
    return false;
  }

  if (!message.userIds?.length) {
    return true;
  }

  return userId ? message.userIds.includes(userId) : false;
}

function normalizePublicInstituteData(
  document: PublicInstituteData,
): PublicInstituteData {
  const template = getTemplatePublicInstituteData();

  return {
    ...document,
    profile: {
      ...template.profile,
      ...document.profile,
      name: template.profile.name,
      phone: template.profile.phone,
      directorName: template.profile.directorName,
      directorTitle: template.profile.directorTitle,
      affiliatedInstitutes: template.profile.affiliatedInstitutes,
    },
    socialLinks: template.socialLinks,
    contactMethods: template.contactMethods,
    contactActions: template.contactActions,
    whatsappHref: template.whatsappHref,
    placedStudents: document.placedStudents || template.placedStudents,
  };
}

export const getPublicInstituteData = cache(
  async function getPublicInstituteData() {
    const document =
      await getContentDocument<PublicInstituteData>("public-site");
    return normalizePublicInstituteData(document);
  },
);

export async function getMockQuizQuestions() {
  const collection = await getCollection<QuizQuestion>(COLLECTIONS.quizzes);
  return stripMongoIds(await collection.find({}).toArray());
}

export async function getDemoCredentials() {
  const collection = await getUsersCollection();
  const documents = await collection
    .find({
      role: { $in: ["student", "educator", "admin", "parent"] as Role[] },
    })
    .toArray();

  const byRole = new Map(
    documents.map((document) => [document.role, document]),
  );

  return (["student", "educator", "admin", "parent"] as const)
    .map((role) => byRole.get(role))
    .flatMap((document) =>
      document
        ? [
            {
              role: document.role,
              label: document.label,
              email: document.email,
              password: document.password,
            },
          ]
        : [],
    ) as DemoCredential[];
}

export async function findUserByCredentials(login: string, password: string) {
  const collection = await getUsersCollection();
  const normalizedLogin = login.toLowerCase();
  const mobileLogin = normalizedLogin.replace(/[^\d]/g, "").slice(-10);
  const emailLocalPart = normalizedLogin.includes("@")
    ? normalizedLogin.split("@")[0]
    : normalizedLogin;

  const query: any = {
    password,
    $or: [
      { mobile: mobileLogin },
      { mobileKey: mobileLogin },
      { email: normalizedLogin },
      { emailKey: normalizedLogin },
      { name: login },
      { name: normalizedLogin },
      {
        $expr: {
          $eq: [
            {
              $arrayElemAt: [{ $split: [{ $toLower: "$email" }, "@"] }, 0],
            },
            emailLocalPart,
          ],
        },
      },
    ],
  };

  const user = await collection.findOne(query);
  return user ? toSessionUser(user) : null;
}

export async function findUserById(id: string) {
  const collection = await getUsersCollection();
  const user = await collection.findOne({ id });
  return user ? toSessionUser(user) : null;
}

export async function getCoursesForRole(role: Role) {
  await ensureStandardCoursesBackfilled();
  const collection = await getCollection<CourseItem>(COLLECTIONS.courses);
  const hydrated = stripMongoIds(
    await collection.find({ audience: role }).toArray(),
  ).map((course) => hydrateCourse(course));
  return dedupeAndSortCourses(hydrated);
}

export async function createCourse(input: {
  standardKey: string;
  sections?: string[];
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
  createdBy: string;
}) {
  const template = getCourseTemplateByKey(input.standardKey);

  if (!template) {
    throw new Error("Choose a valid standardized course name.");
  }

  await ensureStandardCoursesBackfilled();

  const collection = await getCollection<
    CourseItem & { createdAt?: string; createdBy?: string }
  >(COLLECTIONS.courses);
  const existing = await collection.findOne({ standardKey: input.standardKey });

  if (existing) {
    throw new Error(
      "This standardized course already exists. Edit the existing course instead.",
    );
  }

  const course: CourseItem & { createdAt: string; createdBy: string } = {
    id: randomUUID(),
    category: template.category,
    stream: template.stream ?? "General",
    sections: input.sections?.length ? input.sections : template.sections,
    statusLabel: template.statusLabel,
    standardKey: input.standardKey,
    tagline: input.tagline || template.tagline,
    title: template.title,
    schedule: input.schedule || template.schedule,
    summary: input.summary || template.summary,
    description: input.description || template.description,
    duration: input.duration || template.duration,
    mode: input.mode || template.mode,
    audienceLabel: input.audienceLabel || template.audienceLabel,
    courseNamesIncluded: input.courseNamesIncluded.length
      ? input.courseNamesIncluded
      : template.courseNamesIncluded,
    branchesIncluded: input.branchesIncluded.length
      ? input.branchesIncluded
      : template.branchesIncluded,
    subjectsCovered: input.subjectsCovered.length
      ? input.subjectsCovered
      : template.subjectsCovered,
    points: input.points.length ? input.points : template.points,
    audience: template.audience,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };

  await collection.insertOne(course);
  return course;
}

export async function updateCourse(input: {
  id: string;
  standardKey: string;
  sections?: string[];
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
}) {
  const template = getCourseTemplateByKey(input.standardKey);

  if (!template) {
    throw new Error("Choose a valid standardized course name.");
  }

  await ensureStandardCoursesBackfilled();

  const collection = await getCollection<CourseItem>(COLLECTIONS.courses);
  const conflictingCourse = await collection.findOne({
    standardKey: input.standardKey,
    id: { $ne: input.id } as any,
  });

  if (conflictingCourse) {
    throw new Error(
      "This standardized course already exists. Edit the existing course instead.",
    );
  }

  await collection.updateOne(
    { id: input.id },
    {
      $set: {
        standardKey: input.standardKey,
        category: template.category,
        stream: template.stream ?? "General",
        sections: input.sections?.length ? input.sections : template.sections,
        statusLabel: template.statusLabel,
        tagline: input.tagline || template.tagline,
        title: template.title,
        schedule: input.schedule || template.schedule,
        summary: input.summary || template.summary,
        description: input.description || template.description,
        duration: input.duration || template.duration,
        mode: input.mode || template.mode,
        audienceLabel: input.audienceLabel || template.audienceLabel,
        courseNamesIncluded: input.courseNamesIncluded.length
          ? input.courseNamesIncluded
          : template.courseNamesIncluded,
        branchesIncluded: input.branchesIncluded.length
          ? input.branchesIncluded
          : template.branchesIncluded,
        subjectsCovered: input.subjectsCovered.length
          ? input.subjectsCovered
          : template.subjectsCovered,
        points: input.points.length ? input.points : template.points,
        audience: template.audience,
        updatedAt: new Date().toISOString(),
      },
    },
  );
  const updated = await collection.findOne({ id: input.id });

  if (!updated) {
    throw new Error("Updated course could not be found in MongoDB.");
  }

  return hydrateCourse(stripMongoId(updated));
}

export async function deleteCourse(courseId: string) {
  const collection = await getCollection<CourseItem>(COLLECTIONS.courses);
  const result = await collection.deleteOne({ id: courseId });
  if (result.deletedCount === 0) {
    throw new Error("Course not found.");
  }
  return { deleted: true };
}

export async function getAllDetailedCourses() {
  await ensureStandardCoursesBackfilled();
  const collection = await getCollection<CourseItem>(COLLECTIONS.courses);
  const hydrated = stripMongoIds(await collection.find({}).toArray()).map(
    (course) => hydrateCourse(course),
  );
  return dedupeAndSortCourses(hydrated);
}

export function getStandardizedCourseOptions() {
  return getCourseTemplateOptions();
}

export async function getTestsForRole(role: Role, userId?: string) {
  const collection = await getCollection<TestItem>(COLLECTIONS.tests);

  if (role === "student") {
    return stripMongoIds(
      await collection
        .find({ audience: role, assignedUserIds: userId })
        .toArray(),
    );
  }

  return stripMongoIds(await collection.find({ audience: role }).toArray());
}

export async function createTest(input: {
  title: string;
  status: string;
  summary: string;

  examType?: TestItem["examType"];

  createdBy: string;
  assignedUserIds: string[];
  questions: TestQuestion[];
}) {
const test: TestItem & { createdAt: string } = {
  id: randomUUID(),

  title: input.title,

  status: input.status,

  summary: input.summary,

  examType:
    input.examType,

  audience: [
    "student",
    "educator",
    "admin",
    "parent",
  ],
    assignedUserIds: input.assignedUserIds,
    createdBy: input.createdBy,
    questions: input.questions,
    createdAt: new Date().toISOString(),
  };

  const collection = await getCollection<typeof test>(COLLECTIONS.tests);
  await collection.insertOne(test);
  return test;
}

export async function updateTest(
  testId: string,
  input: {
    title?: string;

    status?: string;

    summary?: string;

    examType?:
      TestItem["examType"];

    assignedUserIds?:
      string[];

    questions?:
      TestQuestion[];
  },
) {
  const collection = await getCollection(COLLECTIONS.tests);
  const update: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.title !== undefined) update.title = input.title;
  if (input.status !== undefined) update.status = input.status;
if (
  input.summary !==
  undefined
) {
  update.summary =
    input.summary;
}

if (
  input.examType !==
  undefined
) {
  update.examType =
    input.examType;
}

if (
  input.assignedUserIds !==
  undefined
) {
  update.assignedUserIds =
    input.assignedUserIds;
}
  if (input.questions !== undefined) update.questions = input.questions;

  const result = await collection.updateOne({ id: testId }, { $set: update });
  if (result.matchedCount === 0) return null;

  const updated = await collection.findOne({ id: testId });
  return updated ? stripMongoId(updated) : null;
}

export async function deleteTest(testId: string) {
  const collection = await getCollection(COLLECTIONS.tests);
  const result = await collection.deleteOne({ id: testId });
  return result.deletedCount > 0;
}

export async function getMessagesForRole(role: Role, userId?: string) {
  const collection = await getCollection<MessageDocument>(COLLECTIONS.messages);
  const now = Date.now();
  const documents = stripMongoIds(await collection.find({}).toArray());

  return documents
    .map((document) => normalizeMessage(document))
    .filter((message) => isMessageVisibleToUser(message, role, userId))
    .filter((message) => isMessageActive(message, now))
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt
        ? new Date(right.createdAt).getTime()
        : 0;
      return rightTime - leftTime;
    });
}

export async function createMessage(input: {
  title: string;
  body: string;
  channel: string;
  author: string;
  audience?: Role[];
  userIds?: string[];
  expiresAt?: string | null;
}) {
  const message: MessageItem & { createdAt: string } = {
    id: randomUUID(),
    title: input.title,
    body: input.body,
    channel: input.channel,
    author: input.author,
    audience: input.audience?.length
      ? input.audience
      : ["student", "educator", "admin", "parent"],
    userIds: input.userIds?.length ? input.userIds : undefined,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt ?? null,
  };

  const collection = await getCollection<typeof message>(COLLECTIONS.messages);
  await collection.insertOne(message);
  return message;
}

export async function createChatMessage(input: {
  senderId: string;
  senderName: string;
  senderRole: Role;
  receiverId: string;
  receiverRole: Role;
  body: string;
}) {
  const message: MessageItem & { createdAt: string } = {
    id: randomUUID(),
    title: `Chat to ${input.receiverId}`,
    body: input.body,
    channel: "Chat",
    author: input.senderName,
    audience: [input.senderRole, input.receiverRole, "admin"],
    userIds: [input.receiverId, input.senderId],
    createdAt: new Date().toISOString(),
    expiresAt: null,
  };

  const collection = await getCollection<MessageItem>(COLLECTIONS.messages);
  await collection.insertOne(message);

  // Create a notification for the receiver
  try {
    await createNotifications({
      userIds: [input.receiverId],
      title: `New message from ${input.senderName}`,
      message: input.body.slice(0, 120),
      type: "feedback",
    });
  } catch {
    // Notification is optional; don't block the message
  }

  return message;
}

export async function createChatFlag(input: {
  messageId: string;
  senderId: string;
  receiverId: string;
  flaggedBy: string;
  reason: "phone" | "email" | "link" | "other";
  reasonDetail: string;
}) {
  const collection = await getCollection<ChatFlag>("chat_flags");
  const flag: ChatFlag = {
    id: randomUUID(),
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(flag);
  return flag;
}

export async function getChatFlags(status?: string) {
  const collection = await getCollection<ChatFlag>("chat_flags");
  const query: any = {};
  if (status) query.status = status;
  return stripMongoIds(
    await collection.find(query).sort({ createdAt: -1 }).toArray(),
  ) as ChatFlag[];
}

export async function resolveChatFlag(
  flagId: string,
  resolution: { status: "allowed" | "blocked"; resolvedBy: string },
) {
  const collection = await getCollection<ChatFlag>("chat_flags");
  await collection.updateOne(
    { id: flagId },
    {
      $set: {
        status: resolution.status,
        resolvedAt: new Date().toISOString(),
        resolvedBy: resolution.resolvedBy,
      },
    },
  );
  const updated = await collection.findOne({ id: flagId });
  return updated ? (stripMongoId(updated) as ChatFlag) : null;
}

export async function blockChat(input: {
  participantIds: string[];
  blockedBy: string;
  reason?: string;
}) {
  const collection = await getCollection<ChatBlock>("chat_blocks");
  const sortedIds = [...input.participantIds].sort();
  const existing = await collection.findOne({ participantIds: sortedIds });
  if (existing) {
    await collection.updateOne(
      { participantIds: sortedIds },
      {
        $set: {
          blocked: true,
          blockedAt: new Date().toISOString(),
          blockedBy: input.blockedBy,
          reason: input.reason,
        },
      },
    );
  } else {
    const block: ChatBlock = {
      id: randomUUID(),
      participantIds: sortedIds,
      blocked: true,
      blockedAt: new Date().toISOString(),
      blockedBy: input.blockedBy,
      reason: input.reason,
    };
    await collection.insertOne(block);
  }
  const updated = await collection.findOne({ participantIds: sortedIds });
  return updated ? (stripMongoId(updated) as ChatBlock) : null;
}

export async function unblockChat(participantIds: string[]) {
  const collection = await getCollection<ChatBlock>("chat_blocks");
  const sortedIds = [...participantIds].sort();
  await collection.updateOne(
    { participantIds: sortedIds },
    { $set: { blocked: false } },
  );
  const updated = await collection.findOne({ participantIds: sortedIds });
  return updated ? (stripMongoId(updated) as ChatBlock) : null;
}

export async function isChatBlocked(participantIds: string[]) {
  const collection = await getCollection<ChatBlock>("chat_blocks");
  const sortedIds = [...participantIds].sort();
  const block = await collection.findOne({ participantIds: sortedIds, blocked: true });
  return block ? (stripMongoId(block) as ChatBlock) : null;
}

export async function getAllBlockedChats() {
  const collection = await getCollection<ChatBlock>("chat_blocks");
  return stripMongoIds(
    await collection.find({ blocked: true }).toArray(),
  ) as ChatBlock[];
}

export async function getAllChatMessagesForAdmin() {
  const collection = await getCollection<MessageItem>("messages");
  const allMessages = stripMongoIds(
    await collection.find({ channel: "Chat" }).sort({ createdAt: -1 }).toArray(),
  ) as MessageItem[];
  return allMessages;
}

export async function uploadChatAttachment(input: {
  name: string;
  type: string;
  size: number;
  url: string;
  messageId: string;
}) {
  const collection = await getCollection<ChatAttachment>("chat_attachments");
  const attachment: ChatAttachment = {
    id: randomUUID(),
    ...input,
  };
  await collection.insertOne(attachment);
  return attachment;
}

export async function getAttachmentsForMessage(messageId: string) {
  const collection = await getCollection<ChatAttachment>("chat_attachments");
  return stripMongoIds(
    await collection.find({ messageId }).toArray(),
  ) as ChatAttachment[];
}

export async function updateMessage(
  messageId: string,
  input: {
    title?: string;
    body?: string;
    channel?: string;
    expiresAt?: string | null;
  },
) {
  const collection = await getCollection<MessageDocument>(COLLECTIONS.messages);
  const update: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.title !== undefined) update.title = input.title;
  if (input.body !== undefined) update.body = input.body;
  if (input.channel !== undefined) update.channel = input.channel;
  if (input.expiresAt !== undefined) update.expiresAt = input.expiresAt;

  const result = await collection.updateOne(
    { id: messageId },
    { $set: update },
  );
  if (result.matchedCount === 0) return null;

  const updated = await collection.findOne({ id: messageId });
  return updated ? normalizeMessage(updated) : null;
}

export async function deleteMessage(messageId: string) {
  const collection = await getCollection<MessageDocument>(COLLECTIONS.messages);
  const result = await collection.deleteOne({ id: messageId });
  return result.deletedCount > 0;
}
// =========================
// Complaint Box
// =========================

export async function getComplaintsForAdmin() {
  const collection = await getCollection<ComplaintItem>(
    COLLECTIONS.complaints,
  );

  return stripMongoIds(
    await collection
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray(),
  );
}

export async function getComplaintById(
  complaintId: string,
) {
  const collection = await getCollection<ComplaintItem>(
    COLLECTIONS.complaints,
  );

  const complaint = await collection.findOne({
    id: complaintId,
  });

  return complaint
    ? stripMongoId(complaint)
    : null;
}

export async function createComplaint(input: {
  submittedById: string;
  submittedByName: string;

  submittedByRole:
    | "student"
    | "parent"
    | "educator";

  category:
    ComplaintItem["category"];

  subject: string;
  description: string;

  priority:
    ComplaintItem["priority"];
}) {
  if (
    !input.submittedById.trim()
  ) {
    throw new Error(
      "Complaint submitter is required.",
    );
  }

  if (
    !input.submittedByName.trim()
  ) {
    throw new Error(
      "Complaint submitter name is required.",
    );
  }

  if (
    input.submittedByRole !==
      "student" &&
    input.submittedByRole !==
      "parent" &&
    input.submittedByRole !==
      "educator"
  ) {
    throw new Error(
      "Only students, parents, and educators can submit complaints.",
    );
  }

  if (
    !input.subject.trim()
  ) {
    throw new Error(
      "Complaint subject is required.",
    );
  }

  if (
    !input.description.trim()
  ) {
    throw new Error(
      "Complaint details are required.",
    );
  }

  const now =
    new Date().toISOString();

  const complaint: ComplaintItem = {
    id:
      `complaint-${randomUUID()}`,

    submittedById:
      input.submittedById,

    submittedByName:
      input.submittedByName.trim(),

    submittedByRole:
      input.submittedByRole,

    category:
      input.category,

    subject:
      input.subject.trim(),

    description:
      input.description.trim(),

    priority:
      input.priority,

    status:
      "submitted",

    createdAt:
      now,

    updatedAt:
      now,
  };

  const collection =
    await getCollection<ComplaintItem>(
      COLLECTIONS.complaints,
    );

  await collection.insertOne(
    complaint,
  );

  return stripMongoId(
    complaint,
  );
}

export async function updateComplaint(
  complaintId: string,

  input: Partial<{
    status:
      ComplaintItem["status"];

    adminNote:
      string;

    reviewedBy:
      string;

    reviewedByName:
      string;
  }>,
) {
  const collection =
    await getCollection<ComplaintItem>(
      COLLECTIONS.complaints,
    );

  const existingComplaint =
    await collection.findOne({
      id: complaintId,
    });

  if (
    !existingComplaint
  ) {
    return null;
  }

  const updates: Partial<ComplaintItem> = {
    updatedAt:
      new Date().toISOString(),
  };

  if (
    input.status ===
      "submitted" ||
    input.status ===
      "under-review" ||
    input.status ===
      "resolved" ||
    input.status ===
      "closed"
  ) {
    updates.status =
      input.status;
  }

  if (
    typeof input.adminNote ===
    "string"
  ) {
    updates.adminNote =
      input.adminNote.trim() ||
      undefined;
  }

  if (
    typeof input.reviewedBy ===
      "string" &&
    input.reviewedBy.trim()
  ) {
    updates.reviewedBy =
      input.reviewedBy.trim();
  }

  if (
    typeof input.reviewedByName ===
      "string" &&
    input.reviewedByName.trim()
  ) {
    updates.reviewedByName =
      input.reviewedByName.trim();
  }

  if (
    input.status ===
      "under-review" ||
    input.status ===
      "resolved" ||
    input.status ===
      "closed"
  ) {
    updates.reviewedAt =
      new Date().toISOString();
  }

  await collection.updateOne(
    {
      id: complaintId,
    },

    {
      $set:
        updates,
    },
  );

  const updatedComplaint =
    await collection.findOne({
      id: complaintId,
    });

  return updatedComplaint
    ? stripMongoId(
        updatedComplaint,
      )
    : null;
}

export async function deleteComplaint(
  complaintId: string,
) {
  const collection =
    await getCollection<ComplaintItem>(
      COLLECTIONS.complaints,
    );

  const result =
    await collection.deleteOne({
      id: complaintId,
    });

  return (
    result.deletedCount >
    0
  );
}
type NotificationTargetMode = "everyone" | "selected-users";

export async function getNotificationsForUser(userId: string) {
  const collection = await getCollection<AppNotification>(
    COLLECTIONS.notifications,
  );

  return stripMongoIds(
    await collection.find({ userId }).sort({ createdAt: -1 }).toArray(),
  );
}

export async function getNotificationRecipientIdsForSender(input: {
  senderId: string;
  senderRole: "admin" | "educator";
  targetMode: NotificationTargetMode;
  selectedUserIds: string[];
}) {
  const users = await getUsersCollection();

  const allowedRoles: Role[] =
    input.senderRole === "admin"
      ? ["student", "educator", "parent"]
      : ["student", "parent"];

  const eligibleUsers = await users
    .find({
      id: { $ne: input.senderId },
      role: { $in: allowedRoles },
      verified: { $ne: false },
      $or: [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
      ],
    } as any)
    .toArray();

  const eligibleIds = new Set(eligibleUsers.map((user) => user.id));

  if (input.targetMode === "everyone") {
    return [...eligibleIds];
  }

  const requestedIds = [
    ...new Set(
      input.selectedUserIds
        .filter((id) => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];

  const invalidIds = requestedIds.filter((id) => !eligibleIds.has(id));

  if (invalidIds.length) {
    throw new Error(
      "One or more selected users are not eligible to receive this notification.",
    );
  }

  return requestedIds;
}

export async function getNotificationRecipientIdsForStudents(
  studentIds: string[],
  options: {
    includeLinkedParents?: boolean;
  } = {},
) {
  const normalizedStudentIds = [
    ...new Set(
      studentIds
        .filter((id) => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];

  if (!normalizedStudentIds.length) {
    return [];
  }

  const users = await getUsersCollection();

  const activeUserFilter = {
    verified: { $ne: false },
    $or: [
      { status: "active" },
      { status: { $exists: false } },
      { status: null },
    ],
  };

  const students = await users
    .find({
      id: { $in: normalizedStudentIds },
      role: "student",
      ...activeUserFilter,
    } as any)
    .toArray();

  const validStudentIds = students.map((student) => student.id);

  if (!validStudentIds.length || options.includeLinkedParents === false) {
    return validStudentIds;
  }

  const linkedParents = await users
    .find({
      role: "parent",
      linkedStudentId: { $in: validStudentIds },
      ...activeUserFilter,
    } as any)
    .toArray();

  return [
    ...new Set([
      ...validStudentIds,
      ...linkedParents.map((parent) => parent.id),
    ]),
  ];
}

export async function createNotifications(input: {
  userIds: string[];
  title: string;
  message: string;
  type: AppNotification["type"];
  link?: string;
}) {
  const recipientIds = [
    ...new Set(
      input.userIds
        .filter((id) => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];

  if (!recipientIds.length) {
    throw new Error("At least one notification recipient is required.");
  }

  const now = new Date().toISOString();

  const notifications: AppNotification[] = recipientIds.map((userId) => ({
    id: `notification-${randomUUID()}`,
    userId,
    title: input.title.trim(),
    message: input.message.trim(),
    type: input.type,
    link: input.link?.trim() || undefined,
    read: false,
    createdAt: now,
  }));

  const collection = await getCollection<AppNotification>(
    COLLECTIONS.notifications,
  );

  await collection.insertMany(notifications);

  return notifications;
}

export async function updateNotificationReadState(input: {
  notificationId: string;
  userId: string;
  read: boolean;
}) {
  const collection = await getCollection<AppNotification>(
    COLLECTIONS.notifications,
  );

  const result = await collection.updateOne(
    {
      id: input.notificationId,
      userId: input.userId,
    },
    {
      $set: {
        read: input.read,
      },
    },
  );

  if (result.matchedCount === 0) {
    return null;
  }

  const notification = await collection.findOne({
    id: input.notificationId,
    userId: input.userId,
  });

  return notification ? stripMongoId(notification) : null;
}

export async function deleteNotificationForUser(input: {
  notificationId: string;
  userId: string;
}) {
  const collection = await getCollection<AppNotification>(
    COLLECTIONS.notifications,
  );

  const result = await collection.deleteOne({
    id: input.notificationId,
    userId: input.userId,
  });

  return result.deletedCount > 0;
}

async function enrichWithFacultyNames(
  users: ManagedUser[],
): Promise<ManagedUser[]> {
  const collection = await getUsersCollection();
  const allIds = [...new Set(users.flatMap((u) => u.assignedFacultyIds ?? []))];
  if (!allIds.length) return users;
  const facultyDocs = await collection.find({ id: { $in: allIds } }).toArray();
  const facultyMap = new Map(facultyDocs.map((f) => [f.id, f.name]));
  return users.map((u) => ({
    ...u,
    assignedFacultyNames: u.assignedFacultyIds?.map(
      (id) => facultyMap.get(id) || "To be assigned soon",
    ),
  }));
}

export async function getUsersForAdmin() {
  const collection = await getUsersCollection();

  const users = await collection.find({}).sort({ name: 1 }).toArray();

  return enrichWithFacultyNames(users.map(toManagedUser));
}

export async function getPendingEducatorRequests() {
  const collection = await getUsersCollection();

  const users = await collection
    .find({
      role: "educator",
      status: "pending",
    })
    .sort({ createdAt: -1 })
    .toArray();

  return users.map(toManagedUser);
}

export async function approveEducatorRequest(userId: string) {
  const collection = await getUsersCollection();

  const result = await collection.updateOne(
    {
      id: userId,
      role: "educator",
    },
    {
      $set: {
        status: "active",
        verified: true,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  if (result.matchedCount === 0) {
    return null;
  }

  const updatedUser = await collection.findOne({ id: userId });

  return updatedUser ? toManagedUser(updatedUser) : null;
}

export async function rejectEducatorRequest(userId: string) {
  const collection = await getUsersCollection();

  const result = await collection.updateOne(
    {
      id: userId,
      role: "educator",
    },
    {
      $set: {
        status: "rejected",
        updatedAt: new Date().toISOString(),
      },
    },
  );

  if (result.matchedCount === 0) {
    return null;
  }

  const updatedUser = await collection.findOne({ id: userId });

  return updatedUser ? toManagedUser(updatedUser) : null;
}

export async function getPendingUserRequests() {
  const collection = await getUsersCollection();

  const users = await collection
    .find({ status: "pending" })
    .sort({ createdAt: -1 })
    .toArray();

  return users.map(toManagedUser);
}

export async function approveUserRequest(userId: string) {
  const collection = await getUsersCollection();

  const result = await collection.updateOne(
    { id: userId },
    {
      $set: {
        status: "active",
        verified: true,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  if (result.matchedCount === 0) {
    return null;
  }

  const updatedUser = await collection.findOne({ id: userId });

  return updatedUser ? toManagedUser(updatedUser) : null;
}

export async function rejectUserRequest(userId: string) {
  const collection = await getUsersCollection();

  const result = await collection.deleteOne({ id: userId });

  return result.deletedCount > 0;
}

export async function toggleUserVerification(
  userId: string,
  verified: boolean,
) {
  const collection = await getUsersCollection();

  const result = await collection.updateOne(
    { id: userId },
    {
      $set: {
        verified,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  return result.matchedCount > 0;
}

export async function getStudentDirectory(educatorId?: string) {
  const collection = await getUsersCollection();
  const query: any = { role: "student" };
  if (educatorId) {
    query.assignedFacultyIds = { $in: [educatorId] };
  }
  const students = await collection.find(query).sort({ name: 1 }).toArray();
  const managed = students.map(toManagedUser);
  if (!educatorId) {
    return enrichWithFacultyNames(managed);
  }
  return managed;
}

export async function getEducators() {
  const collection = await getUsersCollection();
  const educators = await collection
    .find({ role: "educator" })
    .sort({ name: 1 })
    .toArray();
  return educators.map(toManagedUser);
}

export async function getEducatorsForStudent(studentId: string) {
  const collection = await getUsersCollection();
  const student = await collection.findOne({ id: studentId, role: "student" });
  const facultyIds = student?.assignedFacultyIds ?? [];
  if (!facultyIds.length) return [];
  const educators = await collection
    .find({ id: { $in: facultyIds }, role: "educator" })
    .toArray();
  return educators.map(toManagedUser);
}

export async function createUserRecord(input: {
  name: string;
  email: string;
  mobile?: string;
  parentMobile?: string;
  linkedStudentId?: string;
  linkedStudentMobile?: string;
  role: Role;
  password: string;
  program: string;
  status?: "active" | "pending" | "rejected";
  profile?: UserProfile;
  assignedFacultyIds?: string[];
}) {
  const document: UserDocument = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    emailKey: input.email.toLowerCase(),
    mobile: input.mobile,
    mobileKey: input.mobile?.replace(/[^\d]/g, "").slice(-10),
    parentMobile: input.parentMobile,
    linkedStudentId: input.linkedStudentId,
    linkedStudentMobile: input.linkedStudentMobile,
    role: input.role,
    label: getRoleLabel(input.role),
    password: input.password,
    program: input.program,
    status: input.status ?? "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profile: input.profile,
    assignedFacultyIds: input.assignedFacultyIds,
  };

  const collection = await getUsersCollection();
  await collection.insertOne(document);
  return toManagedUser(document);
}

export async function updateUserRecord(input: {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  program: string;
  status?: "active" | "pending" | "rejected";
  verified?: boolean;
  assignedFacultyIds?: string[] | null;
  profilePhoto?: string | null;
  profile?: Partial<UserProfile> | null;
}) {
  const collection = await getUsersCollection();

  const setFields: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    emailKey: input.email.toLowerCase(),
    role: input.role,
    label: getRoleLabel(input.role),
    password: input.password,
    program: input.program,
    status: input.status ?? "active",
    updatedAt: new Date().toISOString(),
  };

  if (input.verified !== undefined) {
    setFields.verified = input.verified;
  }

  if (input.assignedFacultyIds !== undefined) {
    setFields.assignedFacultyIds = input.assignedFacultyIds ?? null;
  }

  if (input.profilePhoto !== undefined) {
    setFields["profile.profilePhoto"] = input.profilePhoto || null;
  }

  if (input.profile !== undefined) {
    const existing = await collection.findOne({ id: input.id });
    if (existing) {
      const mergedProfile = {
        ...(existing.profile || {}),
        ...(input.profile || {}),
      };
      setFields.profile =
        Object.keys(mergedProfile).length > 0 ? mergedProfile : undefined;
    } else {
      setFields.profile = input.profile;
    }
  }

  await collection.updateOne({ id: input.id }, { $set: setFields });
  const updated = await collection.findOne({ id: input.id });

  if (!updated) {
    throw new Error("Updated user could not be found in MongoDB.");
  }

  return toManagedUser(updated);
}

export async function assignStudentsToFaculty(
  facultyId: string,
  studentIds: string[],
): Promise<number> {
  const collection = await getUsersCollection();
  const currentStudentDocs = await collection
    .find({ assignedFacultyIds: facultyId, role: "student" })
    .toArray();
  const currentIds = new Set(currentStudentDocs.map((d) => d.id));
  const targetIds = new Set(studentIds);

  const toRemove = [...currentIds].filter((id) => !targetIds.has(id));
  const toAdd = studentIds.filter((id) => !currentIds.has(id));

  if (toRemove.length > 0) {
    await collection.updateMany(
      { id: { $in: toRemove }, role: "student" },
      { $pull: { assignedFacultyIds: facultyId } },
    );
  }

  if (toAdd.length > 0) {
    await collection.updateMany(
      { id: { $in: toAdd }, role: "student" },
      { $addToSet: { assignedFacultyIds: facultyId } },
    );
  }

  return toAdd.length + toRemove.length;
}

export async function getStudentStats(): Promise<StudentStats> {
  const collection = await getUsersCollection();
  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const students = await collection.find({ role: "student" }).toArray();
  return {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    atRisk: 0,
    dropped: students.filter(
      (s) =>
        (s as any).status === "inactive" || (s as any).status === "dropped",
    ).length,
    newThisMonth: students.filter(
      (s) => s.createdAt && s.createdAt >= monthStart,
    ).length,
  };
}

export async function getStudentDirectoryV2(filters?: {
  search?: string;
  status?: string;
}): Promise<StudentDirectoryEntry[]> {
  const collection = await getUsersCollection();
  const query: any = { role: "student" };
  if (filters?.status && filters.status !== "all") {
    if (filters.status === "active") query.status = "active";
    else if (filters.status === "inactive") query.status = "inactive";
    else if (filters.status === "at_risk") query.status = "at_risk";
    else if (filters.status === "dropped") query.status = "dropped";
    else if (filters.status === "graduated") query.status = "graduated";
  }
  let students = await collection.find(query).sort({ name: 1 }).toArray();
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    students = students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s as any).admissionNo?.toLowerCase().includes(q),
    );
  }
  const managed = students.map((s) => ({
    ...toManagedUser(s),
    admissionNo:
      (s as any).admissionNo ?? String((s as any).admissionNumber ?? ""),
    attendancePercent: (s as any).attendancePercent ?? 0,
    feesStatus: "none" as StudentDirectoryEntry["feesStatus"],
    riskLevel: "low" as StudentRiskLevel,
    photoUrl: (s as any).photoUrl ?? undefined,
  })) satisfies StudentDirectoryEntry[];

  const invoiceCollection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);
  for (const entry of managed) {
    const invoices = await invoiceCollection
      .find({ studentId: entry.id })
      .toArray();
    if (!invoices.length) continue;

    const statuses = invoices.map((inv) => stripMongoId(inv) as FeeInvoice);
    const allPaid = statuses.every((inv) => inv.status === "paid");
    const anyPartial = statuses.some((inv) => inv.status === "partial");
    const anyOverdue = statuses.some((inv) => inv.status === "overdue");

    if (allPaid) {
      entry.feesStatus = "paid";
    } else if (anyPartial || anyOverdue) {
      entry.feesStatus = "partial";
    } else {
      entry.feesStatus = "unpaid";
    }
  }

  return enrichWithFacultyNames(managed);
}

export async function computeStudentRiskScores(): Promise<
  { studentId: string; riskLevel: StudentRiskLevel; score: number }[]
> {
  const collection = await getUsersCollection();
  const students = await collection.find({ role: "student" }).toArray();
  const results: {
    studentId: string;
    riskLevel: StudentRiskLevel;
    score: number;
  }[] = [];
  for (const student of students) {
    let score = 50;
    const attendance = (student as any).attendancePercent ?? -1;
    if (attendance >= 0 && attendance < 50) score += 30;
    else if (attendance >= 50 && attendance < 75) score += 15;
    else if (attendance >= 75) score -= 10;
    if (
      (student as any).status === "inactive" ||
      (student as any).status === "dropped"
    )
      score += 40;
    const scoreClamped = Math.max(0, Math.min(100, score));
    let riskLevel: StudentRiskLevel = "low";
    if (scoreClamped >= 70) riskLevel = "high";
    else if (scoreClamped >= 40) riskLevel = "medium";
    results.push({ studentId: student.id, riskLevel, score: scoreClamped });
    await collection.updateOne(
      { id: student.id },
      {
        $set: {
          riskLevel,
          riskScore: scoreClamped,
          updatedAt: new Date().toISOString(),
        },
      },
    );
  }
  return results;
}

export async function exportStudentsCsv(): Promise<string> {
  const collection = await getUsersCollection();
  const students = await collection
    .find({ role: "student" })
    .sort({ name: 1 })
    .toArray();
  const headers = [
    "admission_number",
    "name",
    "email",
    "phone",
    "gender",
    "date_of_birth",
    "father_name",
    "guardian_phone",
    "address",
    "batch_code",
    "status",
    "photo",
    "documents",
  ];
  const rows = students.map((s) => {
    const doc = s as any;
    return [
      doc.admissionNo ?? doc.admissionNumber ?? "",
      s.name,
      s.email,
      doc.mobile ?? "",
      doc.gender ?? "",
      doc.dateOfBirth ?? "",
      doc.fatherName ?? "",
      doc.parentMobile ?? "",
      doc.address ?? "",
      doc.batchName ?? "",
      s.status ?? "active",
      doc.photoUrl ?? "",
      (doc.documents ?? []).join(","),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export async function importStudentsFromCsv(
  rows: Record<string, string>[],
  options: {
    sendWelcomeEmail?: boolean;
    skipDuplicates?: boolean;
    autoGeneratePassword?: boolean;
  },
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  for (const row of rows) {
    try {
      if (!row.name || !row.email || !row.phone) {
        result.skipped++;
        result.errors.push(
          `Row missing required fields: name=${row.name}, email=${row.email}, phone=${row.phone}`,
        );
        continue;
      }
      if (options.skipDuplicates) {
        const existing = await findUserDocumentByEmail(row.email);
        if (existing) {
          result.skipped++;
          continue;
        }
      }
      const password =
        row.password ??
        (options.autoGeneratePassword
          ? Math.random().toString(36).slice(-8) + "A1!"
          : "Pass@123");
      await createUserRecord({
        name: row.name,
        email: row.email,
        mobile: row.phone,
        role: "student",
        password,
        program: row.batch_code ?? "General",
        status: "active",
        profile: {
          dateOfBirth: row.date_of_birth,
          gender: row.gender as any,
          fatherName: row.father_name,
          address: row.address,
          guardianPhone: row.guardian_phone,
        },
      });
      result.imported++;
    } catch (err: any) {
      result.errors.push(`Error importing ${row.email}: ${err.message}`);
      result.skipped++;
    }
  }
  return result;
}

export async function bulkUpdateStudentsFromCsv(
  rows: Record<string, string>[],
): Promise<BulkUpdateResult> {
  const collection = await getUsersCollection();
  const result: BulkUpdateResult = { updated: 0, skipped: 0, errors: [] };
  for (const row of rows) {
    try {
      const admissionNo = row.admission_number;
      if (!admissionNo) {
        result.skipped++;
        continue;
      }
      const student = await collection.findOne({
        role: "student",
        $or: [{ admissionNo }, { admissionNumber: admissionNo }],
      });
      if (!student) {
        result.skipped++;
        result.errors.push(
          `Student not found: admission_number=${admissionNo}`,
        );
        continue;
      }
      const update: any = {};
      if (row.name) update.name = row.name;
      if (row.email) {
        update.email = row.email;
        update.emailKey = row.email.toLowerCase();
      }
      if (row.phone) {
        update.mobile = row.phone;
        update.mobileKey = row.phone.replace(/[^\d]/g, "").slice(-10);
      }
      if (row.gender) update["profile.gender"] = row.gender;
      if (row.date_of_birth) update["profile.dateOfBirth"] = row.date_of_birth;
      if (row.father_name) update["profile.fatherName"] = row.father_name;
      if (row.guardian_phone) update.parentMobile = row.guardian_phone;
      if (row.address) update["profile.address"] = row.address;
      if (row.batch_code) update.batchName = row.batch_code;
      if (row.status) update.status = row.status;
      if (row.photo) update.photoUrl = row.photo;
      if (row.documents)
        update.documents = row.documents
          .split(",")
          .map((d: string) => d.trim())
          .filter(Boolean);
      update.updatedAt = new Date().toISOString();
      await collection.updateOne({ id: student.id }, { $set: update });
      result.updated++;
    } catch (err: any) {
      result.errors.push(
        `Error updating ${row.admission_number}: ${err.message}`,
      );
      result.skipped++;
    }
  }
  return result;
}

export async function deleteUserRecord(userId: string): Promise<boolean> {
  const collection = await getUsersCollection();
  const result = await collection.deleteOne({ id: userId });
  return result.deletedCount > 0;
}

export async function findUserDocumentByEmail(email: string) {
  const collection = await getUsersCollection();
  return collection.findOne({ emailKey: email.toLowerCase() });
}

export async function findUserDocumentByMobile(mobile: string) {
  const collection = await getUsersCollection();
  const mobileKey = mobile.replace(/[^\d]/g, "").slice(-10);

  return collection.findOne({
    $or: [{ mobile: mobileKey }, { mobileKey }],
  });
}

export async function getTestSubmissionsForRole(role: Role, userId?: string) {
  const collection = await getCollection<TestSubmission>(
    COLLECTIONS.submissions,
  );

  if (!userId) {
    return [];
  }

  if (role === "student") {
    return stripMongoIds(
      await collection
        .find({ studentId: userId })
        .sort({ submittedAt: -1 })
        .toArray(),
    );
  }

  if (role === "parent") {
    const users = await getUsersCollection();
    const parent = await users.findOne({ id: userId });

    const linkedStudentId = parent?.linkedStudentId;

    if (!linkedStudentId) {
      return [];
    }

    return stripMongoIds(
      await collection
        .find({ studentId: linkedStudentId })
        .sort({ submittedAt: -1 })
        .toArray(),
    );
  }

  if (role === "educator" || role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ submittedAt: -1 }).toArray(),
    );
  }

  return [];
}

export async function createTestSubmission(input: {
  testId: string;
  studentId: string;
  studentName: string;
  answers: number[];
}) {
  const tests = await getCollection<TestItem>(COLLECTIONS.tests);
  const test = await tests.findOne({ id: input.testId });

  if (!test || !test.questions?.length) {
    return null;
  }

  const submission: TestSubmission = {
    id: randomUUID(),
    testId: test.id,
    studentId: input.studentId,
    studentName: input.studentName,
    answers: input.answers,
    score: null,
    total: test.questions.length,
    status: "submitted",
    submittedAt: new Date().toISOString(),
    publishedMessageTitle: `${test.title} pending review`,
  };

  const submissions = await getCollection<TestSubmission>(
    COLLECTIONS.submissions,
  );
  await submissions.insertOne(submission);
  return { submission };
}

export async function gradeSubmission(input: {
  submissionId: string;
  score: number;
  feedback?: string;
  gradedBy: string;
}) {
  const submissions = await getCollection<TestSubmission>(
    COLLECTIONS.submissions,
  );
  const submission = await submissions.findOne({ id: input.submissionId });

  if (!submission) {
    return null;
  }

  const publishedMessageTitle = `${submission.studentName} result published`;
  const updatedSubmission: TestSubmission = {
    ...submission,
    score: input.score,
    status: "published",
    feedback:
      input.feedback || `Result reviewed and published by ${input.gradedBy}.`,
    gradedBy: input.gradedBy,
    publishedMessageTitle,
  };

  await submissions.updateOne(
    { id: input.submissionId },
    { $set: updatedSubmission },
  );

  const users = await getUsersCollection();
  const linkedParents = await users
    .find({ role: "parent", linkedStudentId: submission.studentId })
    .toArray();

  const linkedParentIds = linkedParents.map((parent) => parent.id);

  const message = await createMessage({
    title: publishedMessageTitle,
    body: `${submission.studentName}'s test review has been completed and the result is now available on the board.`,
    channel: "Results",
    audience: ["student", "educator", "admin", "parent"],
    userIds: [submission.studentId, ...linkedParentIds],
    author: input.gradedBy,
  });
  return {
    submission: updatedSubmission,
    message,
  };
}

async function getLinkedStudentIdForViewer(role: Role, userId?: string) {
  if (!userId) {
    return null;
  }

  if (role === "student") {
    return userId;
  }

  if (role === "parent") {
    const users = await getUsersCollection();
    const parent = await users.findOne({ id: userId });

    return parent?.linkedStudentId ?? null;
  }

  return null;
}
// =========================
// Parent-Teacher Meetings
// =========================

export async function getPtmSessionsForRole(
  role: Role,
  userId?: string,
) {
  const collection = await getCollection<PtmSession>(
    COLLECTIONS.ptmSessions,
  );

  if (role === "admin") {
    return stripMongoIds(
      await collection
        .find({})
        .sort({
          startsAt: -1,
          createdAt: -1,
        })
        .toArray(),
    );
  }

  if (role === "educator") {
    if (!userId) {
      return [];
    }

    return stripMongoIds(
      await collection
        .find({
          $or: [
            { teacherId: userId },
            { createdBy: userId },
          ],
        })
        .sort({
          startsAt: -1,
          createdAt: -1,
        })
        .toArray(),
    );
  }

  const linkedStudentId =
    await getLinkedStudentIdForViewer(
      role,
      userId,
    );

  if (!linkedStudentId) {
    return [];
  }

  return stripMongoIds(
    await collection
      .find({
        studentId: linkedStudentId,
      })
      .sort({
        startsAt: -1,
        createdAt: -1,
      })
      .toArray(),
  );
}

export async function getPtmSessionById(
  ptmId: string,
) {
  const collection = await getCollection<PtmSession>(
    COLLECTIONS.ptmSessions,
  );

  const ptm = await collection.findOne({
    id: ptmId,
  });

  return ptm
    ? stripMongoId(ptm)
    : null;
}

export async function createPtmSession(input: {
  title: string;

  studentId: string;
  studentName: string;

  teacherId: string;
  teacherName: string;

  batchId?: string;
  batchName?: string;

  startsAt: string;
  endsAt?: string;

  mode: PtmSession["mode"];

  meetingLink?: string;
  location?: string;

  agenda?: string;
  notes?: string;

  status?: PtmSession["status"];

  createdBy: string;
}) {
  if (!input.title.trim()) {
    throw new Error(
      "PTM title is required.",
    );
  }

  if (!input.studentId.trim()) {
    throw new Error(
      "Student is required.",
    );
  }

  if (!input.teacherId.trim()) {
    throw new Error(
      "Teacher is required.",
    );
  }

  if (!input.startsAt.trim()) {
    throw new Error(
      "PTM date and time are required.",
    );
  }

  if (
    input.mode === "online" &&
    !input.meetingLink?.trim()
  ) {
    throw new Error(
      "Meeting link is required for an online PTM.",
    );
  }

  if (
    input.mode === "offline" &&
    !input.location?.trim()
  ) {
    throw new Error(
      "Location is required for an offline PTM.",
    );
  }

  const users =
    await getUsersCollection();

  const student =
    await users.findOne({
      id: input.studentId,
      role: "student",
    });

  if (!student) {
    throw new Error(
      "Selected student could not be found.",
    );
  }

  const linkedParent =
    await users.findOne({
      role: "parent",
      linkedStudentId:
        input.studentId,
    });

  const now =
    new Date().toISOString();

  const ptm: PtmSession = {
    id: `ptm-${randomUUID()}`,

    title:
      input.title.trim(),

    studentId:
      student.id,

    studentName:
      student.name,

    parentId:
      linkedParent?.id,

    parentName:
      linkedParent?.name,

    teacherId:
      input.teacherId,

    teacherName:
      input.teacherName.trim(),

    batchId:
      input.batchId?.trim() ||
      undefined,

    batchName:
      input.batchName?.trim() ||
      undefined,

    startsAt:
      input.startsAt,

    endsAt:
      input.endsAt?.trim() ||
      undefined,

    mode:
      input.mode,

    meetingLink:
      input.mode === "online"
        ? input.meetingLink?.trim() ||
          undefined
        : undefined,

    location:
      input.mode === "offline"
        ? input.location?.trim() ||
          undefined
        : undefined,

    agenda:
      input.agenda?.trim() ||
      undefined,

    notes:
      input.notes?.trim() ||
      undefined,

    status:
      input.status ??
      "scheduled",

    createdBy:
      input.createdBy,

    createdAt:
      now,

    updatedAt:
      now,
  };

  const collection =
    await getCollection<PtmSession>(
      COLLECTIONS.ptmSessions,
    );

  await collection.insertOne(
    ptm,
  );

  return stripMongoId(
    ptm,
  );
}

export async function updatePtmSession(
  ptmId: string,
  input: Partial<{
    title: string;

    startsAt: string;
    endsAt: string;

    mode: PtmSession["mode"];

    meetingLink: string;
    location: string;

    agenda: string;
    notes: string;

    status: PtmSession["status"];
  }>,
) {
  const collection =
    await getCollection<PtmSession>(
      COLLECTIONS.ptmSessions,
    );

  const existing =
    await collection.findOne({
      id: ptmId,
    });

  if (!existing) {
    return null;
  }

  const updates: Partial<PtmSession> = {
    updatedAt:
      new Date().toISOString(),
  };

  if (
    typeof input.title ===
    "string"
  ) {
    if (!input.title.trim()) {
      throw new Error(
        "PTM title cannot be empty.",
      );
    }

    updates.title =
      input.title.trim();
  }

  if (
    typeof input.startsAt ===
    "string"
  ) {
    if (!input.startsAt.trim()) {
      throw new Error(
        "PTM date and time are required.",
      );
    }

    updates.startsAt =
      input.startsAt;
  }

  if (
    typeof input.endsAt ===
    "string"
  ) {
    updates.endsAt =
      input.endsAt.trim() ||
      undefined;
  }

  if (
    input.mode === "online" ||
    input.mode === "offline"
  ) {
    updates.mode =
      input.mode;
  }

  if (
    typeof input.meetingLink ===
    "string"
  ) {
    updates.meetingLink =
      input.meetingLink.trim() ||
      undefined;
  }

  if (
    typeof input.location ===
    "string"
  ) {
    updates.location =
      input.location.trim() ||
      undefined;
  }

  if (
    typeof input.agenda ===
    "string"
  ) {
    updates.agenda =
      input.agenda.trim() ||
      undefined;
  }

  if (
    typeof input.notes ===
    "string"
  ) {
    updates.notes =
      input.notes.trim() ||
      undefined;
  }

  if (
    input.status ===
      "scheduled" ||
    input.status ===
      "completed" ||
    input.status ===
      "cancelled"
  ) {
    updates.status =
      input.status;
  }

  await collection.updateOne(
    {
      id: ptmId,
    },
    {
      $set: updates,
    },
  );

  const updated =
    await collection.findOne({
      id: ptmId,
    });

  return updated
    ? stripMongoId(updated)
    : null;
}

export async function deletePtmSession(
  ptmId: string,
) {
  const collection =
    await getCollection<PtmSession>(
      COLLECTIONS.ptmSessions,
    );

  const result =
    await collection.deleteOne({
      id: ptmId,
    });

  return (
    result.deletedCount >
    0
  );
}
export async function getAttendanceSheetsForRole(role: Role, userId?: string) {
  const collection = await getCollection<AttendanceSheet>(
    COLLECTIONS.attendanceSheets,
  );

  if (role === "admin" || role === "educator") {
    return stripMongoIds(
      await collection.find({}).sort({ date: -1, createdAt: -1 }).toArray(),
    );
  }

  const linkedStudentId = await getLinkedStudentIdForViewer(role, userId);

  if (!linkedStudentId) {
    return [];
  }

  return stripMongoIds(
    await collection
      .find({ "records.studentId": linkedStudentId })
      .sort({ date: -1, createdAt: -1 })
      .toArray(),
  );
}

export async function createAttendanceSheet(input: {
  title: string;
  date: string;
  subject?: string;
  lectureId?: string;
  createdBy: string;
  records: AttendanceSheet["records"];
}) {
  const collection = await getCollection<AttendanceSheet>(
    COLLECTIONS.attendanceSheets,
  );

  const now = new Date().toISOString();

  const sheet: AttendanceSheet = {
    id: `attendance-${Date.now()}`,
    title: input.title,
    date: input.date,
    subject: input.subject,
    lectureId: input.lectureId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    records: input.records,
  };

  await collection.insertOne(sheet);

  return stripMongoId(sheet);
}

export async function updateAttendanceSheet(
  attendanceId: string,
  input: Partial<{
    title: string;
    date: string;
    subject: string;
    lectureId: string;
    records: AttendanceSheet["records"];
  }>,
) {
  const collection = await getCollection<AttendanceSheet>(
    COLLECTIONS.attendanceSheets,
  );

  const update = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await collection.updateOne({ id: attendanceId }, { $set: update });

  const updatedSheet = await collection.findOne({ id: attendanceId });

  return updatedSheet ? stripMongoId(updatedSheet) : null;
}

export async function deleteAttendanceSheet(attendanceId: string) {
  const collection = await getCollection<AttendanceSheet>(
    COLLECTIONS.attendanceSheets,
  );

  const result = await collection.deleteOne({ id: attendanceId });

  return result.deletedCount > 0;
}

// =========================
// Leave Management
// =========================

export async function getLeaveRequestsForRole(role: Role, userId?: string) {
  const collection = await getCollection<LeaveRequest>(COLLECTIONS.leaveRequests);

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ createdAt: -1 }).toArray(),
    );
  }

  if (!userId) return [];

  return stripMongoIds(
    await collection.find({ userId }).sort({ createdAt: -1 }).toArray(),
  );
}

export async function createLeaveRequest(input: {
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
}) {
  const collection = await getCollection<LeaveRequest>(COLLECTIONS.leaveRequests);
  const now = new Date().toISOString();
  const request: LeaveRequest = {
    id: `leave-${Date.now()}`,
    ...input,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(request);
  return stripMongoId(request);
}

export async function updateLeaveRequestStatus(
  id: string,
  update: {
    status: LeaveStatus;
    rejectReason?: string;
    approvedBy?: string;
  },
) {
  const collection = await getCollection<LeaveRequest>(COLLECTIONS.leaveRequests);
  const setFields: Record<string, unknown> = {
    status: update.status,
    updatedAt: new Date().toISOString(),
  };
  if (update.rejectReason) setFields.rejectReason = update.rejectReason;
  if (update.approvedBy) {
    setFields.approvedBy = update.approvedBy;
    setFields.approvedAt = new Date().toISOString();
  }
  await collection.updateOne({ id }, { $set: setFields });
  const updated = await collection.findOne({ id });
  return updated ? stripMongoId(updated) : null;
}

export async function getLeaveTypes() {
  const collection = await getCollection<LeaveTypeItem>(COLLECTIONS.leaveTypes);
  return stripMongoIds(
    await collection.find({ isActive: true }).sort({ name: 1 }).toArray(),
  );
}

export async function getAllLeaveTypes() {
  const collection = await getCollection<LeaveTypeItem>(COLLECTIONS.leaveTypes);
  return stripMongoIds(
    await collection.find({}).sort({ name: 1 }).toArray(),
  );
}

export async function createLeaveType(input: {
  name: string;
  category: string;
  daysAllowed: number;
  isPaid: boolean;
  color: string;
}) {
  const collection = await getCollection<LeaveTypeItem>(COLLECTIONS.leaveTypes);
  const item: LeaveTypeItem = {
    id: `leavetype-${Date.now()}`,
    ...input,
    isActive: true,
  };
  await collection.insertOne(item);
  return stripMongoId(item);
}

export async function updateLeaveType(id: string, input: Partial<LeaveTypeItem>) {
  const collection = await getCollection<LeaveTypeItem>(COLLECTIONS.leaveTypes);
  await collection.updateOne({ id }, { $set: input });
  const updated = await collection.findOne({ id });
  return updated ? stripMongoId(updated) : null;
}

export async function deleteLeaveType(id: string) {
  const collection = await getCollection<LeaveTypeItem>(COLLECTIONS.leaveTypes);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function getHolidays() {
  const collection = await getCollection<HolidayItem>(COLLECTIONS.holidays);
  return stripMongoIds(
    await collection.find({}).sort({ date: 1 }).toArray(),
  );
}

export async function createHoliday(input: {
  name: string;
  date: string;
  type: string;
  color: string;
}) {
  const collection = await getCollection<HolidayItem>(COLLECTIONS.holidays);
  const item: HolidayItem = {
    id: `holiday-${Date.now()}`,
    ...input,
  };
  await collection.insertOne(item);
  return stripMongoId(item);
}

export async function deleteHoliday(id: string) {
  const collection = await getCollection<HolidayItem>(COLLECTIONS.holidays);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function getLeaveBalancesForRole(role: Role, userId?: string) {
  const collection = await getCollection<LeaveBalanceItem>(COLLECTIONS.leaveBalances);

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ userName: 1 }).toArray(),
    );
  }

  if (!userId) return [];

  return stripMongoIds(
    await collection.find({ userId }).sort({ leaveTypeName: 1 }).toArray(),
  );
}

export async function createLeaveBalance(input: {
  userId: string;
  userName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  daysAllowed: number;
  note?: string;
}) {
  const collection = await getCollection<LeaveBalanceItem>(COLLECTIONS.leaveBalances);
  const item: LeaveBalanceItem = {
    id: `leavebalance-${Date.now()}`,
    ...input,
    daysUsed: 0,
  };
  await collection.insertOne(item);
  return stripMongoId(item);
}

export async function getPendingLeaveCount() {
  const collection = await getCollection<LeaveRequest>(COLLECTIONS.leaveRequests);
  return await collection.countDocuments({ status: "pending" });
}

export function getLeaveStats(requests: LeaveRequest[]) {
  return {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    total: requests.length,
  };
}

// =========================
// Roles & Permissions
// =========================

export async function getAllCustomRoles() {
  const collection = await getCollection<CustomRole>(COLLECTIONS.customRoles);
  return stripMongoIds(
    await collection.find({}).sort({ name: 1 }).toArray(),
  );
}

export async function getActiveCustomRoles() {
  const collection = await getCollection<CustomRole>(COLLECTIONS.customRoles);
  return stripMongoIds(
    await collection.find({ isActive: true }).sort({ name: 1 }).toArray(),
  );
}

export async function createCustomRole(input: {
  name: string;
  description?: string;
  color: string;
  modules: AvailableModule[];
}) {
  const collection = await getCollection<CustomRole>(COLLECTIONS.customRoles);
  const now = new Date().toISOString();
  const role: CustomRole = {
    id: `role-${Date.now()}`,
    ...input,
    description: input.description || "",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(role);
  return stripMongoId(role);
}

export async function updateCustomRole(
  id: string,
  input: Partial<CustomRole>,
) {
  const collection = await getCollection<CustomRole>(COLLECTIONS.customRoles);
  const update = { ...input, updatedAt: new Date().toISOString() };
  await collection.updateOne({ id }, { $set: update });
  const updated = await collection.findOne({ id });
  return updated ? stripMongoId(updated) : null;
}

export async function deleteCustomRole(id: string) {
  const collection = await getCollection<CustomRole>(COLLECTIONS.customRoles);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function getRoleAssignments() {
  const collection = await getCollection<CustomRoleAssignment>(
    COLLECTIONS.roleAssignments,
  );
  return stripMongoIds(
    await collection.find({}).sort({ assignedAt: -1 }).toArray(),
  );
}

export async function getRoleAssignmentsForUser(userId: string) {
  const collection = await getCollection<CustomRoleAssignment>(
    COLLECTIONS.roleAssignments,
  );
  return stripMongoIds(
    await collection.find({ userId }).toArray(),
  );
}

export async function assignRoleToUser(input: {
  userId: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
}) {
  const collection = await getCollection<CustomRoleAssignment>(
    COLLECTIONS.roleAssignments,
  );
  const existing = await collection.findOne({
    userId: input.userId,
    roleId: input.roleId,
  });
  if (existing) {
    return stripMongoId(existing);
  }
  const assignment: CustomRoleAssignment = {
    id: `roleassign-${Date.now()}`,
    ...input,
    assignedAt: new Date().toISOString(),
  };
  await collection.insertOne(assignment);
  return stripMongoId(assignment);
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  const collection = await getCollection<CustomRoleAssignment>(
    COLLECTIONS.roleAssignments,
  );
  const result = await collection.deleteOne({ userId, roleId });
  return result.deletedCount > 0;
}

export async function getCustomRolesForUser(userId: string) {
  const assignments = await getRoleAssignmentsForUser(userId);
  if (assignments.length === 0) return [];

  const roleCollection = await getCollection<CustomRole>(COLLECTIONS.customRoles);
  const roleIds = assignments.map((a) => a.roleId);
  const roles = await roleCollection
    .find({ id: { $in: roleIds }, isActive: true })
    .toArray();
  return stripMongoIds(roles);
}

export async function getRolesDashboardStats() {
  const roleCollection = await getCollection<CustomRole>(COLLECTIONS.customRoles);
  const assignCollection = await getCollection<CustomRoleAssignment>(
    COLLECTIONS.roleAssignments,
  );

  const [totalRoles, activeRoles, totalAssignments, distinctUsers] =
    await Promise.all([
      roleCollection.countDocuments({}),
      roleCollection.countDocuments({ isActive: true }),
      assignCollection.countDocuments({}),
      assignCollection.distinct("userId"),
    ]);

  return {
    totalRoles,
    activeRoles,
    totalStaff: totalAssignments,
    staffAssigned: distinctUsers.length,
  };
}

export async function getFeeInvoicesForRole(role: Role, userId?: string) {
  const collection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ createdAt: -1 }).toArray(),
    );
  }

  if (role === "educator" || role === "counsellor") {
    return [];
  }

  const linkedStudentId = await getLinkedStudentIdForViewer(role, userId);

  if (!linkedStudentId) {
    return [];
  }

  return stripMongoIds(
    await collection
      .find({ studentId: linkedStudentId })
      .sort({ createdAt: -1 })
      .toArray(),
  );
}

export async function getFeeInvoiceStudentDetails(
  studentId: string,
  dueDate?: string,
) {
  const normalizedStudentId = studentId.trim();

  if (!normalizedStudentId) {
    return null;
  }

  const users = await getUsersCollection();

  const [student, parent] = await Promise.all([
    users.findOne({
      id: normalizedStudentId,
      role: "student",
    }),

    users.findOne({
      role: "parent",
      linkedStudentId: normalizedStudentId,
    }),
  ]);

  if (!student) {
    return null;
  }

  const selectedDate = dueDate ? new Date(`${dueDate}T12:00:00`) : new Date();

  const referenceDate = Number.isNaN(selectedDate.getTime())
    ? new Date()
    : selectedDate;

  const academicStartYear =
    referenceDate.getMonth() >= 3
      ? referenceDate.getFullYear()
      : referenceDate.getFullYear() - 1;

  return {
    studentId: student.id,
    studentName: student.name,
    parentId: parent?.id,

    parentName: parent?.name || student.profile?.parentName || "",

    classCourse:
      student.program?.trim() || "",

    rollNo: "",

    academicYear: `${academicStartYear}-${String(academicStartYear + 1).slice(
      -2,
    )}`,

    mobileNo:
      student.mobile?.trim() ||
      student.profile?.parentMobile?.trim() ||
      parent?.mobile?.trim() ||
      "",
  };
}

export async function createFeeInvoice(input: {
  studentId: string;
  studentName: string;
  parentId?: string;
  title: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  status: FeeInvoice["status"];
  notes?: string;
  createdBy: string;
  receiptNo?: string;
  parentName?: string;
  classCourse?: string;
  rollNo?: string;
  academicYear?: string;
  mobileNo?: string;
  particulars?: string;
  month?: string;
  paymentMode?: string;
  transactions?: FeeInvoice["transactions"];
}) {
  const collection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);
  const receiptNo = await generateFeeReceiptNo();
  const now = new Date().toISOString();

  const invoice: FeeInvoice = {
    id: `invoice-${Date.now()}`,
    studentId: input.studentId,
    studentName: input.studentName,
    parentId: input.parentId,
    title: input.title,
    amount: input.amount,
    paidAmount: input.paidAmount ?? 0,
    dueDate: input.dueDate,
    status: input.status,
    notes: input.notes,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    receiptNo: input.receiptNo ?? receiptNo,
    parentName: input.parentName,
    classCourse: input.classCourse,
    rollNo: input.rollNo,
    academicYear: input.academicYear,
    mobileNo: input.mobileNo,
    particulars: input.particulars,
    month: input.month,
    paymentMode: input.paymentMode,
    transactions: input.transactions ?? [],
  };

  await collection.insertOne(invoice);

  return stripMongoId(invoice);
}

export async function getFeeInvoiceById(invoiceId: string) {
  const collection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);
  const invoice = await collection.findOne({ id: invoiceId });
  return invoice ? stripMongoId(invoice) : null;
}

export async function updateFeeInvoice(
  invoiceId: string,
  input: Partial<{
    title: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    status: FeeInvoice["status"];
    notes: string;
    paymentMode: string;
    transaction: import("@/lib/types").PaymentTransaction;
  }>,
) {
  const collection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);
  const existing = await collection.findOne({ id: invoiceId });
  if (!existing) return null;

  const existingInvoice = stripMongoId(existing) as FeeInvoice;
  const updateFields: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.title !== undefined) updateFields.title = input.title;
  if (input.amount !== undefined) updateFields.amount = input.amount;
  if (input.dueDate !== undefined) updateFields.dueDate = input.dueDate;
  if (input.notes !== undefined) updateFields.notes = input.notes;

  if (input.transaction) {
    const transactions = [...(existingInvoice.transactions ?? []), input.transaction];
    updateFields.transactions = transactions;

    const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0);
    const amount = input.amount ?? existingInvoice.amount;
    updateFields.paidAmount = totalPaid;

    if (totalPaid <= 0) {
      updateFields.status = "unpaid";
    } else if (totalPaid >= amount) {
      updateFields.status = "paid";
    } else {
      updateFields.status = "partial";
    }

    updateFields.paymentMode = input.transaction.paymentMode;
  } else {
    if (input.paidAmount !== undefined) updateFields.paidAmount = input.paidAmount;
    if (input.status !== undefined) updateFields.status = input.status;
    if (input.paymentMode !== undefined) updateFields.paymentMode = input.paymentMode;
  }

  await collection.updateOne({ id: invoiceId }, { $set: updateFields });

  const updatedInvoice = await collection.findOne({ id: invoiceId });

  return updatedInvoice ? stripMongoId(updatedInvoice) : null;
}

export async function deleteFeeInvoice(invoiceId: string) {
  const collection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);

  const result = await collection.deleteOne({ id: invoiceId });

  return result.deletedCount > 0;
}

export async function getLecturesForRole(role: Role, userId?: string) {
  const collection = await getCollection<LectureItem>(COLLECTIONS.lectures);

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ startsAt: -1 }).toArray(),
    );
  }

  if (role === "educator") {
    if (!userId) {
      return [];
    }

    return stripMongoIds(
      await collection
        .find({
          $or: [{ teacherId: userId }, { createdBy: userId }],
        })
        .sort({ startsAt: -1 })
        .toArray(),
    );
  }
  const linkedStudentId = await getLinkedStudentIdForViewer(role, userId);

  if (!linkedStudentId) {
    return [];
  }

  return stripMongoIds(
    await collection
      .find({
        assignedStudentIds: linkedStudentId,
      })
      .sort({ startsAt: -1 })
      .toArray(),
  );
}

export async function createLecture(input: {
  title: string;
  subject?: string;
  teacherId?: string;
  teacherName?: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  meetingLink?: string;
  recordingLink?: string;
  materialLink?: string;
  assignedStudentIds?: string[];
  status: LectureItem["status"];
  topicCovered?: string;
  homeworkGiven?: string;
  assignmentGiven?: string;
  revisionTask?: string;
  doubtsSolved?: string;
  nextTopic?: string;
  attendanceSheetId?: string;
  lectureReportSubmittedAt?: string;
  createdBy: string;
}) {
  const collection = await getCollection<LectureItem>(COLLECTIONS.lectures);

  const now = new Date().toISOString();

  const lecture: LectureItem = {
    id: `lecture-${Date.now()}`,
    title: input.title,
    subject: input.subject,
    teacherId: input.teacherId ?? input.createdBy,
    teacherName: input.teacherName?.trim() || undefined,
    description: input.description,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    meetingLink: input.meetingLink,
    recordingLink: input.recordingLink,
    materialLink: input.materialLink,
    assignedStudentIds: input.assignedStudentIds ?? [],
    status: input.status,
    topicCovered: input.topicCovered,
    homeworkGiven: input.homeworkGiven,
    assignmentGiven: input.assignmentGiven,
    revisionTask: input.revisionTask,
    doubtsSolved: input.doubtsSolved,
    nextTopic: input.nextTopic,
    attendanceSheetId: input.attendanceSheetId,
    lectureReportSubmittedAt: input.lectureReportSubmittedAt,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(lecture);

  return stripMongoId(lecture);
}

export async function updateLecture(
  lectureId: string,
  input: Partial<{
    title: string;
    subject: string;
    description: string;
    startsAt: string;
    endsAt: string;
    meetingLink: string;
    recordingLink: string;
    materialLink: string;
    assignedStudentIds: string[];
    status: LectureItem["status"];
    teacherId: string;
    topicCovered: string;
    homeworkGiven: string;
    assignmentGiven: string;
    revisionTask: string;
    doubtsSolved: string;
    nextTopic: string;
    attendanceSheetId: string;
    lectureReportSubmittedAt: string;
  }>,
) {
  const collection = await getCollection<LectureItem>(COLLECTIONS.lectures);

  const update = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await collection.updateOne({ id: lectureId }, { $set: update });

  const updatedLecture = await collection.findOne({ id: lectureId });

  return updatedLecture ? stripMongoId(updatedLecture) : null;
}

function getAnalyticsPercent(value: number, total: number) {
  if (total <= 0) {
    return null;
  }

  return Math.round((value / total) * 100);
}

function formatAnalyticsCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function buildDashboardAnalytics(input: {
  role: Role;
  studentId?: string;
  attendanceSheets: AttendanceSheet[];
  weeklyTests: WeeklyTest[];
  dailyActivities: StudentDailyActivity[];
  feeInvoices: FeeInvoice[];
  feeInstallmentPlans: FeeInstallmentPlan[];
  lectures: LectureItem[];
  teacherPayouts: TeacherPayout[];
  users: ManagedUser[];
}): DashboardAnalytics {
  const targetStudentId = input.studentId;

  const attendanceRecords = input.attendanceSheets.flatMap((sheet) =>
    sheet.records
      .filter(
        (record) => !targetStudentId || record.studentId === targetStudentId,
      )
      .map((record) => ({
        ...record,
        date: sheet.date,
      })),
  );

  const present = attendanceRecords.filter(
    (record) => record.status === "present",
  ).length;

  const late = attendanceRecords.filter(
    (record) => record.status === "late",
  ).length;

  const absent = attendanceRecords.filter(
    (record) => record.status === "absent",
  ).length;

  const excused = attendanceRecords.filter(
    (record) => record.status === "excused",
  ).length;

  const attendanceEligibleRecords = attendanceRecords.filter(
    (record) => record.status !== "excused",
  ).length;

  const attendanceRate = getAnalyticsPercent(
    present + late,
    attendanceEligibleRecords,
  );

  const assessmentRows = input.weeklyTests.flatMap((weeklyTest) =>
    weeklyTest.results.flatMap((result) => {
      if (targetStudentId && result.studentId !== targetStudentId) {
        return [];
      }

      if (
        result.status !== "present" ||
        typeof result.obtainedMarks !== "number" ||
        !Number.isFinite(result.obtainedMarks)
      ) {
        return [];
      }

      return [
        {
          subject: weeklyTest.subject || "General",
          obtainedMarks: result.obtainedMarks,
          totalMarks: weeklyTest.totalMarks,
        },
      ];
    }),
  );

  const assessmentTotalMarks = assessmentRows.reduce(
    (sum, row) => sum + row.totalMarks,
    0,
  );

  const assessmentObtainedMarks = assessmentRows.reduce(
    (sum, row) => sum + row.obtainedMarks,
    0,
  );

  const averageScore = getAnalyticsPercent(
    assessmentObtainedMarks,
    assessmentTotalMarks,
  );

  const subjectMap = new Map<
    string,
    {
      obtainedMarks: number;
      totalMarks: number;
      resultCount: number;
    }
  >();

  for (const row of assessmentRows) {
    const current = subjectMap.get(row.subject) ?? {
      obtainedMarks: 0,
      totalMarks: 0,
      resultCount: 0,
    };

    current.obtainedMarks += row.obtainedMarks;
    current.totalMarks += row.totalMarks;
    current.resultCount += 1;

    subjectMap.set(row.subject, current);
  }

  const subjectPerformance = [...subjectMap.entries()]
    .map(([subject, value]) => ({
      subject,
      percentage:
        getAnalyticsPercent(value.obtainedMarks, value.totalMarks) ?? 0,
      resultCount: value.resultCount,
    }))
    .sort((left, right) => right.percentage - left.percentage)
    .slice(0, 4);

  const learningActivities = input.dailyActivities.filter(
    (activity) => !targetStudentId || activity.studentId === targetStudentId,
  );

  const homeworkCompleted = learningActivities.filter(
    (activity) => activity.homeworkCompleted,
  ).length;

  const assignmentCompleted = learningActivities.filter(
    (activity) => activity.assignmentCompleted,
  ).length;

  const revisionCompleted = learningActivities.filter(
    (activity) => activity.revisionCompleted,
  ).length;

  const homeworkRate = getAnalyticsPercent(
    homeworkCompleted,
    learningActivities.length,
  );

  const assignmentRate = getAnalyticsPercent(
    assignmentCompleted,
    learningActivities.length,
  );

  const revisionRate = getAnalyticsPercent(
    revisionCompleted,
    learningActivities.length,
  );

  const learningRates = [homeworkRate, assignmentRate, revisionRate].filter(
    (value): value is number => value !== null,
  );

  const completionRate = learningRates.length
    ? Math.round(
        learningRates.reduce((sum, value) => sum + value, 0) /
          learningRates.length,
      )
    : null;

  const studyMinuteEntries = learningActivities
    .map((activity) => activity.studyMinutes)
    .filter(
      (minutes): minutes is number =>
        typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0,
    );

  const averageStudyMinutes = studyMinuteEntries.length
    ? Math.round(
        studyMinuteEntries.reduce((sum, minutes) => sum + minutes, 0) /
          studyMinuteEntries.length,
      )
    : null;

  let finance: DashboardAnalytics["finance"] = null;

  if (input.role !== "educator") {
    if (input.feeInvoices.length > 0) {
      const billed = input.feeInvoices.reduce(
        (sum, invoice) => sum + invoice.amount,
        0,
      );

      const collected = input.feeInvoices.reduce(
        (sum, invoice) =>
          sum + Math.min(invoice.amount, invoice.paidAmount ?? 0),
        0,
      );

      const pending = Math.max(0, billed - collected);
      const today = new Date().toISOString().slice(0, 10);

      const overdueCount = input.feeInvoices.filter((invoice) => {
        const outstanding = Math.max(
          0,
          invoice.amount - (invoice.paidAmount ?? 0),
        );

        return (
          outstanding > 0 &&
          (invoice.status === "overdue" ||
            (Boolean(invoice.dueDate) && invoice.dueDate < today))
        );
      }).length;

      finance = {
        billed,
        collected,
        pending,
        overdueCount,
      };
    } else if (input.feeInstallmentPlans.length > 0) {
      const billed = input.feeInstallmentPlans.reduce(
        (sum, plan) => sum + plan.totalFee,
        0,
      );

      const collected = input.feeInstallmentPlans.reduce(
        (sum, plan) => sum + plan.paidAmount,
        0,
      );

      const pending = input.feeInstallmentPlans.reduce(
        (sum, plan) => sum + plan.pendingAmount,
        0,
      );

      const overdueCount = input.feeInstallmentPlans.reduce(
        (sum, plan) =>
          sum +
          plan.installments.filter(
            (installment) => installment.status === "overdue",
          ).length,
        0,
      );

      finance = {
        billed,
        collected,
        pending,
        overdueCount,
      };
    } else {
      finance = {
        billed: 0,
        collected: 0,
        pending: 0,
        overdueCount: 0,
      };
    }
  }

  const activeStudents = input.users.filter(
    (user) => user.role === "student" && user.status === "active",
  ).length;

  const learners = activeStudents;

  const completedLectures = input.lectures.filter(
    (lecture) => lecture.status === "completed",
  ).length;

  const scheduledLectures = input.lectures.filter(
    (lecture) => lecture.status === "scheduled",
  ).length;

  const pendingPayout = input.teacherPayouts.reduce(
    (sum, payout) => sum + payout.pendingAmount,
    0,
  );

  const attendanceValue = attendanceRate === null ? "—" : `${attendanceRate}%`;

  const assessmentValue = averageScore === null ? "—" : `${averageScore}%`;

  const learningValue = completionRate === null ? "—" : `${completionRate}%`;

  let metrics: DashboardMetric[];

  if (input.role === "admin") {
    metrics = [
      {
        label: "Active Learners",
        value: `${learners}`,
        detail: "Active student accounts",
      },
      {
        label: "Attendance",
        value: attendanceValue,
        detail: `${attendanceRecords.length} attendance records analysed`,
      },
      {
        label: "Fee Pending",
        value: formatAnalyticsCurrency(finance?.pending ?? 0),
        detail: `${finance?.overdueCount ?? 0} overdue invoice or installment items`,
      },
    ];
  } else if (input.role === "educator") {
    metrics = [
      {
        label: "Learners",
        value: `${learners}`,
        detail: "Students in the system",
      },
      {
        label: "Attendance",
        value: attendanceValue,
        detail: `${attendanceRecords.length} records created by you`,
      },
      {
        label: "Pending Earnings",
        value: formatAnalyticsCurrency(pendingPayout),
        detail: "Outstanding teacher payout amount",
      },
    ];
  } else {
    metrics = [
      {
        label: "Attendance",
        value: attendanceValue,
        detail: `${attendanceRecords.length} recorded attendance entries`,
      },
      {
        label: "Test Average",
        value: assessmentValue,
        detail: `${assessmentRows.length} marked weekly-test results`,
      },
      {
        label: "Learning Completion",
        value: learningValue,
        detail: `${learningActivities.length} daily learning activities`,
      },
      {
        label: "Fee Pending",
        value: formatAnalyticsCurrency(finance?.pending ?? 0),
        detail: `${finance?.overdueCount ?? 0} overdue invoice or installment items`,
      },
    ];
  }

  const insights: DashboardAnalytics["insights"] = [];

  if (attendanceRate === null) {
    insights.push({
      title: "Attendance data is pending",
      description:
        "Record attendance consistently to unlock a reliable attendance trend.",
      tone: "neutral",
    });
  } else if (attendanceRate < 75) {
    insights.push({
      title: "Attendance needs attention",
      description: `Attendance is ${attendanceRate}%. Review absences and follow up early.`,
      tone: "warning",
    });
  } else {
    insights.push({
      title: "Attendance is on track",
      description: `Attendance is currently ${attendanceRate}%, including present and late records.`,
      tone: "positive",
    });
  }

  if (averageScore === null) {
    insights.push({
      title: "Assessment data is pending",
      description:
        "Publish weekly-test results to begin tracking academic performance.",
      tone: "neutral",
    });
  } else if (averageScore < 50) {
    insights.push({
      title: "Test performance needs support",
      description: `The current weekly-test average is ${averageScore}%. Focus on weak subjects and revision.`,
      tone: "warning",
    });
  } else if (averageScore >= 75) {
    insights.push({
      title: "Assessment performance is strong",
      description: `The current weekly-test average is ${averageScore}%. Maintain the same consistency.`,
      tone: "positive",
    });
  } else {
    insights.push({
      title: "Assessment progress is developing",
      description: `The current weekly-test average is ${averageScore}%. Target regular practice for improvement.`,
      tone: "neutral",
    });
  }

  if (completionRate !== null && completionRate < 70) {
    insights.push({
      title: "Daily learning completion is low",
      description: `Only ${completionRate}% of recorded learning work is complete. Prioritise homework, assignments, and revision.`,
      tone: "warning",
    });
  }

  if (finance && finance.pending > 0) {
    insights.push({
      title: "Fee follow-up is required",
      description: `${formatAnalyticsCurrency(finance.pending)} remains pending across the available fee records.`,
      tone: finance.overdueCount > 0 ? "warning" : "neutral",
    });
  }

  if (
    (input.role === "admin" || input.role === "educator") &&
    scheduledLectures > 0
  ) {
    insights.push({
      title: "Upcoming delivery workload",
      description: `${scheduledLectures} lecture${
        scheduledLectures === 1 ? "" : "s"
      } are currently scheduled.`,
      tone: "neutral",
    });
  }

  if (!insights.length) {
    insights.push({
      title: "Analytics will grow with activity",
      description:
        "Continue recording attendance, learning activity, tests, lectures, and fee updates.",
      tone: "neutral",
    });
  }

  return {
    refreshedAt: new Date().toISOString(),
    metrics,
    attendance: {
      rate: attendanceRate,
      totalRecords: attendanceRecords.length,
      present,
      absent,
      late,
      excused,
    },
    assessments: {
      averageScore,
      publishedTests: input.weeklyTests.filter(
        (weeklyTest) => weeklyTest.published,
      ).length,
      resultCount: assessmentRows.length,
      subjectPerformance,
    },
    learning: {
      activitiesRecorded: learningActivities.length,
      completionRate,
      homeworkRate,
      assignmentRate,
      revisionRate,
      averageStudyMinutes,
    },
    finance,
    operations: {
      learners,
      completedLectures,
      scheduledLectures,
    },
    insights: insights.slice(0, 4),
  };
}

export async function getDashboardBundle(
  role: Role,
  userId?: string,
): Promise<DashboardBundle> {
  const [
    config,
    user,
    userDoc,
    courses,
    tests,
    messages,
    submissions,
    attendanceSheets,
    feeInvoices,
    lectures,
    weeklyTests,
    dailyActivities,
    feeInstallmentPlans,
    teacherPayouts,
    users,
  ] = await Promise.all([
    getContentDocument<{ templates: Record<Role, DashboardTemplate> }>(
      "dashboard-config",
    ),
    userId ? findUserById(userId) : Promise.resolve(null),
    userId ? findFullUserById(userId) : Promise.resolve(null),
    getCoursesForRole(role),
    getTestsForRole(role, userId),
    getMessagesForRole(role, userId),
    getTestSubmissionsForRole(role, userId),
    getAttendanceSheetsForRole(role, userId),
    getFeeInvoicesForRole(role, userId),
    getLecturesForRole(role, userId),
    getWeeklyTestsForRole(role, userId),
    getDailyActivitiesForRole(role, userId),
    getFeeInstallmentPlansForRole(role, userId),
    getTeacherPayoutsForRole(role, userId),
    role === "admin" ? getUsersForAdmin() : Promise.resolve([]),
  ]);

  const templates = config.templates as Partial<
    Record<Role, DashboardTemplate>
  >;

  const template = templates[role] ?? templates.educator;

  if (!template) {
    throw new Error("Dashboard template could not be resolved.");
  }

  const linkedStudentId =
    role === "student"
      ? userId
      : role === "parent"
        ? userDoc?.linkedStudentId
        : undefined;

  const analytics = buildDashboardAnalytics({
    role,
    studentId: linkedStudentId,
    attendanceSheets,
    weeklyTests,
    dailyActivities,
    feeInvoices,
    feeInstallmentPlans,
    lectures,
    teacherPayouts,
    users,
  });

  let assignedFacultyIds: string[] | undefined;
  let assignedFacultyNames: string[] | undefined;
  if (role === "student" && userDoc?.assignedFacultyIds?.length) {
    assignedFacultyIds = userDoc.assignedFacultyIds;
    const facultyDocs = await Promise.all(
      userDoc.assignedFacultyIds.map((id) => findFullUserById(id)),
    );
    assignedFacultyNames = facultyDocs.map(
      (d) => d?.name ?? "To be assigned soon",
    );
  } else if (role === "parent" && userDoc?.linkedStudentId) {
    const linkedStudentDoc = await findFullUserById(userDoc.linkedStudentId);
    if (linkedStudentDoc?.assignedFacultyIds?.length) {
      assignedFacultyIds = linkedStudentDoc.assignedFacultyIds;
      const facultyDocs = await Promise.all(
        linkedStudentDoc.assignedFacultyIds.map((id) => findFullUserById(id)),
      );
      assignedFacultyNames = facultyDocs.map(
        (d) => d?.name ?? "To be assigned soon",
      );
    }
  }

  let linkedStudentProfile: { name?: string; email?: string; phone?: string; course?: string; attendance?: number | null } | undefined;
  if (role === "parent" && userDoc?.linkedStudentId) {
    const linkedStudentDoc = await findFullUserById(userDoc.linkedStudentId);
    if (linkedStudentDoc) {
      linkedStudentProfile = {
        name: linkedStudentDoc.name,
        email: linkedStudentDoc.email,
        phone: linkedStudentDoc.profile?.guardianPhone ?? linkedStudentDoc.parentMobile ?? linkedStudentDoc.mobile,
        course: linkedStudentDoc.profile?.courseWantedTitle ?? linkedStudentDoc.profile?.courseWanted,
      };
    }
  }

  return {
    roleLabel: user?.label ?? template.roleLabel,
    heroTitle: buildHeroTitle(role, template, user),
    heroDescription: template.heroDescription,
    stats: analytics.metrics,
    primaryPanel: template.primaryPanel,
    permissions: template.permissions,
    courses: role === "admin" ? courses : courses.slice(0, 3),
    tests: tests.slice(0, 4),
    messages: messages.slice(0, 6),
    submissions: submissions.slice(0, 6),
    attendanceSheets,
    feeInvoices,
    feeInstallmentPlans,
    lectures,
    linkedStudentId: userDoc?.linkedStudentId,
    linkedStudentProfile,
    assignedFacultyIds,
    assignedFacultyNames,
    profile: userDoc?.profile ? {
      ...userDoc.profile,
      guardianPhone: userDoc.profile.guardianPhone ?? userDoc.parentMobile ?? userDoc.mobile,
      parentMobile: userDoc.profile.parentMobile ?? userDoc.parentMobile,
    } : undefined,
    analytics,
  };
}

export async function findFullUserById(id: string) {
  const collection = await getUsersCollection();
  const user = await collection.findOne({ id });
  return user as UserDocument | null;
}

export async function getLibraryBooksForRole(role: Role) {
  const collection = await getCollection<LibraryBook>(COLLECTIONS.library);
  return stripMongoIds(
    await collection.find({ audience: role }).sort({ createdAt: -1 }).toArray(),
  );
}

export async function getLibraryBookById(id: string) {
  const collection = await getCollection<LibraryBook>(COLLECTIONS.library);
  const book = await collection.findOne({ id });
  return book ? stripMongoId(book) : null;
}

export async function createLibraryBook(
  input: Omit<LibraryBook, "id" | "createdAt">,
) {
  const book: LibraryBook = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };

  const collection = await getCollection<LibraryBook>(COLLECTIONS.library);
  await collection.insertOne(book);
  return book;
}

export async function deleteLibraryBook(id: string) {
  const collection = await getCollection<LibraryBook>(COLLECTIONS.library);
  const book = await collection.findOne({ id });

  if (!book) return null;

  await collection.deleteOne({ id });
  return book;
}

export async function getPerformanceReports(
  filter: { studentId?: string } = {},
) {
  const collection = await getCollection<PerformanceReport>(
    COLLECTIONS.performance,
  );
  const query: any = {};
  if (filter.studentId) query.studentId = filter.studentId;

  return stripMongoIds(
    await collection.find(query).sort({ createdAt: -1 }).toArray(),
  );
}

export async function createPerformanceReport(
  input: Omit<PerformanceReport, "id" | "createdAt">,
) {
  const report: PerformanceReport = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };

  const collection = await getCollection<PerformanceReport>(
    COLLECTIONS.performance,
  );
  await collection.insertOne(report);
  return report;
}

export async function getPerformanceHeuristics(educatorId: string) {
  const collection = await getCollection<{
    educatorId: string;
    heuristics: PerformanceHeuristics;
  }>(COLLECTIONS.heuristics);
  const document = await collection.findOne({ educatorId });
  return document ? document.heuristics : DEFAULT_HEURISTICS;
}

export async function savePerformanceHeuristics(
  educatorId: string,
  heuristics: PerformanceHeuristics,
) {
  const collection = await getCollection<{
    educatorId: string;
    heuristics: PerformanceHeuristics;
  }>(COLLECTIONS.heuristics);
  await collection.updateOne(
    { educatorId },
    { $set: { heuristics } },
    { upsert: true },
  );
  return heuristics;
}

async function generateFeeReceiptNo() {
  const collection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);

  const year = new Date().getFullYear();
  const prefix = `ST-REC-${year}-`;

  const latestReceipt = await collection
    .find({ receiptNo: { $regex: `^${prefix}` } })
    .sort({ receiptNo: -1 })
    .limit(1)
    .next();

  const lastNumber = latestReceipt?.receiptNo?.startsWith(prefix)
    ? Number(latestReceipt.receiptNo.replace(prefix, ""))
    : 0;

  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

export async function getWeeklyTestsForRole(role: Role, userId?: string) {
  const collection = await getCollection<WeeklyTest>(COLLECTIONS.weeklyTests);

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ testDate: -1, createdAt: -1 }).toArray(),
    );
  }

  if (role === "educator") {
    if (!userId) {
      return [];
    }

    return stripMongoIds(
      await collection
        .find({ teacherId: userId })
        .sort({ testDate: -1, createdAt: -1 })
        .toArray(),
    );
  }

  const linkedStudentId = await getLinkedStudentIdForViewer(role, userId);

  if (!linkedStudentId) {
    return [];
  }

  return stripMongoIds(
    await collection
      .find({
        published: true,
        "results.studentId": linkedStudentId,
      })
      .sort({ testDate: -1, createdAt: -1 })
      .toArray(),
  );
}

export async function createWeeklyTest(input: {
  title: string;
  teacherId: string;
  subject: string;
  testDate: string;
  totalMarks: number;
  published?: boolean;
  results: WeeklyTest["results"];
}) {
  if (!input.title.trim()) {
    throw new Error("Test title is required.");
  }

  if (!input.subject.trim()) {
    throw new Error("Subject is required.");
  }

  if (!input.testDate) {
    throw new Error("Test date is required.");
  }

  if (!Number.isFinite(input.totalMarks) || input.totalMarks <= 0) {
    throw new Error("Total marks must be greater than zero.");
  }

  if (!input.results.length) {
    throw new Error("Add at least one student result.");
  }

  const collection = await getCollection<WeeklyTest>(COLLECTIONS.weeklyTests);

  const now = new Date().toISOString();

  const weeklyTest: WeeklyTest = {
    id: `weekly-test-${randomUUID()}`,
    title: input.title.trim(),
    teacherId: input.teacherId,
    subject: input.subject.trim(),
    testDate: input.testDate,
    totalMarks: input.totalMarks,
    published: input.published ?? false,
    results: input.results.map((result) => ({
      studentId: result.studentId,
      studentName: result.studentName,
      obtainedMarks:
        typeof result.obtainedMarks === "number"
          ? result.obtainedMarks
          : undefined,
      status: result.status,
      remarks: result.remarks?.trim() || undefined,
    })),
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(weeklyTest);

  return stripMongoId(weeklyTest);
}

export async function updateWeeklyTest(
  weeklyTestId: string,
  input: Partial<{
    title: string;
    subject: string;
    testDate: string;
    totalMarks: number;
    published: boolean;
    results: WeeklyTest["results"];
  }>,
) {
  const collection = await getCollection<WeeklyTest>(COLLECTIONS.weeklyTests);

  const updates: Partial<WeeklyTest> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof input.title === "string") {
    updates.title = input.title.trim();
  }

  if (typeof input.subject === "string") {
    updates.subject = input.subject.trim();
  }

  if (typeof input.testDate === "string") {
    updates.testDate = input.testDate;
  }

  if (
    typeof input.totalMarks === "number" &&
    Number.isFinite(input.totalMarks) &&
    input.totalMarks > 0
  ) {
    updates.totalMarks = input.totalMarks;
  }

  if (typeof input.published === "boolean") {
    updates.published = input.published;
  }

  if (Array.isArray(input.results)) {
    updates.results = input.results.map((result) => ({
      studentId: result.studentId,
      studentName: result.studentName,
      obtainedMarks:
        typeof result.obtainedMarks === "number"
          ? result.obtainedMarks
          : undefined,
      status: result.status,
      remarks: result.remarks?.trim() || undefined,
    }));
  }

  await collection.updateOne({ id: weeklyTestId }, { $set: updates });

  const updatedTest = await collection.findOne({ id: weeklyTestId });

  return updatedTest ? stripMongoId(updatedTest) : null;
}

export async function deleteWeeklyTest(weeklyTestId: string) {
  const collection = await getCollection<WeeklyTest>(COLLECTIONS.weeklyTests);

  const result = await collection.deleteOne({ id: weeklyTestId });

  return result.deletedCount > 0;
}

export async function getTeacherFeedbackForRole(role: Role, userId?: string) {
  const collection = await getCollection<TeacherFeedback>(
    COLLECTIONS.teacherFeedback,
  );

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ createdAt: -1 }).toArray(),
    );
  }

  if (role === "educator") {
    if (!userId) {
      return [];
    }

    return stripMongoIds(
      await collection
        .find({ teacherId: userId })
        .sort({ createdAt: -1 })
        .toArray(),
    );
  }

  const linkedStudentId = await getLinkedStudentIdForViewer(role, userId);

  if (!linkedStudentId) {
    return [];
  }

  return stripMongoIds(
    await collection
      .find({
        studentId: linkedStudentId,
        visibleToParent: true,
      })
      .sort({ createdAt: -1 })
      .toArray(),
  );
}

export async function createTeacherFeedback(input: {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName?: string;
  subject?: string;
  category: TeacherFeedback["category"];
  strengths?: string;
  areasToImprove?: string;
  feedback: string;
  visibleToParent: boolean;
}) {
  if (!input.studentId) {
    throw new Error("Student is required.");
  }

  if (!input.teacherId) {
    throw new Error("Teacher is required.");
  }

  if (!input.feedback.trim()) {
    throw new Error("Feedback is required.");
  }

  const collection = await getCollection<TeacherFeedback>(
    COLLECTIONS.teacherFeedback,
  );

  const now = new Date().toISOString();

  const feedback: TeacherFeedback = {
    id: `feedback-${randomUUID()}`,
    studentId: input.studentId,
    studentName: input.studentName.trim(),
    teacherId: input.teacherId,
    teacherName: input.teacherName?.trim() || undefined,
    subject: input.subject?.trim() || undefined,
    category: input.category,
    strengths: input.strengths?.trim() || undefined,
    areasToImprove: input.areasToImprove?.trim() || undefined,
    feedback: input.feedback.trim(),
    visibleToParent: input.visibleToParent,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(feedback);

  return stripMongoId(feedback);
}

export async function updateTeacherFeedback(
  feedbackId: string,
  input: Partial<{
    category: TeacherFeedback["category"];
    strengths: string;
    areasToImprove: string;
    feedback: string;
    visibleToParent: boolean;
    subject: string;
  }>,
) {
  const collection = await getCollection<TeacherFeedback>(
    COLLECTIONS.teacherFeedback,
  );

  const updates: Partial<TeacherFeedback> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.category) {
    updates.category = input.category;
  }

  if (typeof input.strengths === "string") {
    updates.strengths = input.strengths.trim() || undefined;
  }

  if (typeof input.areasToImprove === "string") {
    updates.areasToImprove = input.areasToImprove.trim() || undefined;
  }

  if (typeof input.feedback === "string") {
    if (!input.feedback.trim()) {
      throw new Error("Feedback cannot be empty.");
    }

    updates.feedback = input.feedback.trim();
  }

  if (typeof input.subject === "string") {
    updates.subject = input.subject.trim() || undefined;
  }

  if (typeof input.visibleToParent === "boolean") {
    updates.visibleToParent = input.visibleToParent;
  }

  await collection.updateOne({ id: feedbackId }, { $set: updates });

  const updatedFeedback = await collection.findOne({ id: feedbackId });

  return updatedFeedback ? stripMongoId(updatedFeedback) : null;
}

export async function deleteTeacherFeedback(feedbackId: string) {
  const collection = await getCollection<TeacherFeedback>(
    COLLECTIONS.teacherFeedback,
  );

  const result = await collection.deleteOne({ id: feedbackId });

  return result.deletedCount > 0;
}





export async function getDailyActivitiesForRole(role: Role, userId?: string) {
  const collection = await getCollection<StudentDailyActivity>(
    COLLECTIONS.dailyActivities,
  );

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ date: -1, createdAt: -1 }).toArray(),
    );
  }

  if (role === "educator") {
    if (!userId) {
      return [];
    }

    return stripMongoIds(
      await collection
        .find({ teacherId: userId })
        .sort({ date: -1, createdAt: -1 })
        .toArray(),
    );
  }

  const linkedStudentId = await getLinkedStudentIdForViewer(role, userId);

  if (!linkedStudentId) {
    return [];
  }

  return stripMongoIds(
    await collection
      .find({
        studentId: linkedStudentId,
        visibleToParent: true,
      })
      .sort({ date: -1, createdAt: -1 })
      .toArray(),
  );
}

export async function createDailyActivity(input: {
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
  participation: StudentDailyActivity["participation"];

  studyMinutes?: number;
  teacherVerified: boolean;
  teacherNote?: string;

  visibleToParent: boolean;
}) {
  if (!input.studentId) {
    throw new Error("Student is required.");
  }

  if (!input.teacherId) {
    throw new Error("Teacher is required.");
  }

  if (!input.date) {
    throw new Error("Activity date is required.");
  }

  const collection = await getCollection<StudentDailyActivity>(
    COLLECTIONS.dailyActivities,
  );

  const now = new Date().toISOString();

  const activity: StudentDailyActivity = {
    id: `daily-activity-${randomUUID()}`,

    studentId: input.studentId,
    studentName: input.studentName.trim(),

    teacherId: input.teacherId,
    teacherName: input.teacherName?.trim() || undefined,

    subject: input.subject?.trim() || undefined,
    date: input.date,

    topicStudied: input.topicStudied?.trim() || undefined,

    homeworkCompleted: input.homeworkCompleted,
    assignmentCompleted: input.assignmentCompleted,
    revisionCompleted: input.revisionCompleted,

    doubtsRaised: input.doubtsRaised?.trim() || undefined,
    participation: input.participation,

    studyMinutes:
      typeof input.studyMinutes === "number" &&
      Number.isFinite(input.studyMinutes) &&
      input.studyMinutes >= 0
        ? input.studyMinutes
        : undefined,

    teacherVerified: input.teacherVerified,
    teacherNote: input.teacherNote?.trim() || undefined,

    visibleToParent: input.visibleToParent,

    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(activity);

  return stripMongoId(activity);
}

export async function updateDailyActivity(
  activityId: string,
  input: Partial<{
    subject: string;
    date: string;

    topicStudied: string;

    homeworkCompleted: boolean;
    assignmentCompleted: boolean;
    revisionCompleted: boolean;

    doubtsRaised: string;
    participation: StudentDailyActivity["participation"];

    studyMinutes: number;
    teacherVerified: boolean;
    teacherNote: string;

    visibleToParent: boolean;
  }>,
) {
  const collection = await getCollection<StudentDailyActivity>(
    COLLECTIONS.dailyActivities,
  );

  const updates: Partial<StudentDailyActivity> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof input.subject === "string") {
    updates.subject = input.subject.trim() || undefined;
  }

  if (typeof input.date === "string" && input.date.trim()) {
    updates.date = input.date;
  }

  if (typeof input.topicStudied === "string") {
    updates.topicStudied = input.topicStudied.trim() || undefined;
  }

  if (typeof input.homeworkCompleted === "boolean") {
    updates.homeworkCompleted = input.homeworkCompleted;
  }

  if (typeof input.assignmentCompleted === "boolean") {
    updates.assignmentCompleted = input.assignmentCompleted;
  }

  if (typeof input.revisionCompleted === "boolean") {
    updates.revisionCompleted = input.revisionCompleted;
  }

  if (typeof input.doubtsRaised === "string") {
    updates.doubtsRaised = input.doubtsRaised.trim() || undefined;
  }

  if (input.participation) {
    updates.participation = input.participation;
  }

  if (
    typeof input.studyMinutes === "number" &&
    Number.isFinite(input.studyMinutes) &&
    input.studyMinutes >= 0
  ) {
    updates.studyMinutes = input.studyMinutes;
  }

  if (typeof input.teacherVerified === "boolean") {
    updates.teacherVerified = input.teacherVerified;
  }

  if (typeof input.teacherNote === "string") {
    updates.teacherNote = input.teacherNote.trim() || undefined;
  }

  if (typeof input.visibleToParent === "boolean") {
    updates.visibleToParent = input.visibleToParent;
  }

  await collection.updateOne({ id: activityId }, { $set: updates });

  const updatedActivity = await collection.findOne({ id: activityId });

  return updatedActivity ? stripMongoId(updatedActivity) : null;
}

export async function deleteDailyActivity(activityId: string) {
  const collection = await getCollection<StudentDailyActivity>(
    COLLECTIONS.dailyActivities,
  );

  const result = await collection.deleteOne({ id: activityId });

  return result.deletedCount > 0;
}
// =========================
// Student Daily Routine
// =========================

export async function getStudentDailyRoutines(
  studentId: string,
) {
  const collection =
    await getCollection<StudentDailyRoutine>(
      COLLECTIONS.studentDailyRoutines,
    );

  return stripMongoIds(
    await collection
      .find({
        studentId,
      })
      .sort({
        date: -1,
        createdAt: -1,
      })
      .toArray(),
  );
}

export async function getStudentDailyRoutineById(
  routineId: string,
  studentId: string,
) {
  const collection =
    await getCollection<StudentDailyRoutine>(
      COLLECTIONS.studentDailyRoutines,
    );

  const routine =
    await collection.findOne({
      id: routineId,
      studentId,
    });

  return routine
    ? stripMongoId(routine)
    : null;
}

export async function createStudentDailyRoutine(
  input: Omit<
    StudentDailyRoutine,
    "id" | "createdAt" | "updatedAt"
  >,
) {
  if (!input.studentId.trim()) {
    throw new Error(
      "Student is required.",
    );
  }

  if (!input.studentName.trim()) {
    throw new Error(
      "Student name is required.",
    );
  }

  if (!input.date.trim()) {
    throw new Error(
      "Routine date is required.",
    );
  }

  const collection =
    await getCollection<StudentDailyRoutine>(
      COLLECTIONS.studentDailyRoutines,
    );

  /*
   * One routine entry per student per date.
   */
  const existingRoutine =
    await collection.findOne({
      studentId: input.studentId,
      date: input.date,
    });

  if (existingRoutine) {
    throw new Error(
      "A daily routine has already been saved for this date.",
    );
  }

  const now =
    new Date().toISOString();

  const routine: StudentDailyRoutine = {
    id: `daily-routine-${randomUUID()}`,

    studentId:
      input.studentId,

    studentName:
      input.studentName.trim(),

    date:
      input.date,

    wakeUpTime:
      input.wakeUpTime,

    bedTime:
      input.bedTime,

    sleepMinutes:
      input.sleepMinutes,

    studyMinutes:
      input.studyMinutes,

    screenMinutes:
      input.screenMinutes,

    exerciseMinutes:
      input.exerciseMinutes,

    tasksCompleted:
      input.tasksCompleted,

    mood:
      input.mood,

    mainGoal:
      input.mainGoal?.trim() ||
      undefined,

    reflection:
      input.reflection?.trim() ||
      undefined,

    createdAt:
      now,

    updatedAt:
      now,
  };

  await collection.insertOne(
    routine,
  );

  return stripMongoId(
    routine,
  );
}

export async function updateStudentDailyRoutine(
  routineId: string,
  studentId: string,
  input: Partial<
    Omit<
      StudentDailyRoutine,
      | "id"
      | "studentId"
      | "studentName"
      | "createdAt"
      | "updatedAt"
    >
  >,
) {
  const collection =
    await getCollection<StudentDailyRoutine>(
      COLLECTIONS.studentDailyRoutines,
    );

  const existingRoutine =
    await collection.findOne({
      id: routineId,
      studentId,
    });

  if (!existingRoutine) {
    return null;
  }

  /*
   * Prevent two routine records
   * for the same student and date.
   */
  if (
    typeof input.date ===
      "string" &&
    input.date !==
      existingRoutine.date
  ) {
    const duplicate =
      await collection.findOne({
        studentId,
        date: input.date,
        id: {
          $ne: routineId,
        } as any,
      });

    if (duplicate) {
      throw new Error(
        "A daily routine has already been saved for this date.",
      );
    }
  }

  const updates: Partial<StudentDailyRoutine> =
    {
      ...input,

      mainGoal:
        typeof input.mainGoal ===
        "string"
          ? input.mainGoal.trim() ||
            undefined
          : input.mainGoal,

      reflection:
        typeof input.reflection ===
        "string"
          ? input.reflection.trim() ||
            undefined
          : input.reflection,

      updatedAt:
        new Date().toISOString(),
    };

  await collection.updateOne(
    {
      id: routineId,
      studentId,
    },
    {
      $set: updates,
    },
  );

  const updatedRoutine =
    await collection.findOne({
      id: routineId,
      studentId,
    });

  return updatedRoutine
    ? stripMongoId(
        updatedRoutine,
      )
    : null;
}

export async function deleteStudentDailyRoutine(
  routineId: string,
  studentId: string,
) {
  const collection =
    await getCollection<StudentDailyRoutine>(
      COLLECTIONS.studentDailyRoutines,
    );

  const result =
    await collection.deleteOne({
      id: routineId,
      studentId,
    });

  return result.deletedCount > 0;
}

function getInstallmentStatus(
  amount: number,
  paidAmount: number,
  dueDate: string,
): FeeInstallment["status"] {
  if (paidAmount >= amount) {
    return "paid";
  }

  if (paidAmount > 0) {
    return "partial";
  }

  const dueTime = new Date(`${dueDate}T23:59:59`).getTime();

  if (!Number.isNaN(dueTime) && dueTime < Date.now()) {
    return "overdue";
  }

  return "due";
}

function normalizeInstallments(
  installments: Array<
    Pick<
      FeeInstallment,
      | "installmentNumber"
      | "amount"
      | "paidAmount"
      | "dueDate"
      | "paidDate"
      | "receiptNumber"
      | "paymentMode"
      | "notes"
    >
  >,
): FeeInstallment[] {
  if (!installments.length) {
    throw new Error("Add at least one installment.");
  }

  const usedNumbers = new Set<number>();

  return installments
    .map((installment) => {
      const installmentNumber = Number(installment.installmentNumber);
      const amount = Number(installment.amount);
      const paidAmount = Number(installment.paidAmount ?? 0);

      if (!Number.isInteger(installmentNumber) || installmentNumber < 1) {
        throw new Error(
          "Each installment must have a valid installment number.",
        );
      }

      if (usedNumbers.has(installmentNumber)) {
        throw new Error("Installment numbers cannot be repeated.");
      }

      usedNumbers.add(installmentNumber);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Every installment amount must be greater than zero.");
      }

      if (
        !Number.isFinite(paidAmount) ||
        paidAmount < 0 ||
        paidAmount > amount
      ) {
        throw new Error(
          `Paid amount for installment ${installmentNumber} must be between 0 and ${amount}.`,
        );
      }

      if (
        typeof installment.dueDate !== "string" ||
        !installment.dueDate.trim()
      ) {
        throw new Error(
          `Due date is required for installment ${installmentNumber}.`,
        );
      }

      const pendingAmount = Math.max(0, amount - paidAmount);

      return {
        installmentNumber,
        amount,
        paidAmount,
        pendingAmount,
        dueDate: installment.dueDate,
        paidDate:
          paidAmount > 0 && typeof installment.paidDate === "string"
            ? installment.paidDate
            : undefined,
        status: getInstallmentStatus(amount, paidAmount, installment.dueDate),
        receiptNumber: installment.receiptNumber?.trim() || undefined,
        paymentMode: installment.paymentMode?.trim() || undefined,
        transactions: [],
        notes: installment.notes?.trim() || undefined,
      };
    })
    .sort((left, right) => left.installmentNumber - right.installmentNumber);
}

function calculatePlanAmounts(installments: FeeInstallment[]) {
  const totalFee = installments.reduce(
    (sum, installment) => sum + installment.amount,
    0,
  );

  const paidAmount = installments.reduce(
    (sum, installment) => sum + installment.paidAmount,
    0,
  );

  const pendingAmount = Math.max(0, totalFee - paidAmount);

  return {
    totalFee,
    paidAmount,
    pendingAmount,
    status: pendingAmount === 0 ? ("completed" as const) : ("active" as const),
  };
}

export async function getFeeInstallmentPlansForRole(
  role: Role,
  userId?: string,
) {
  const collection = await getCollection<FeeInstallmentPlan>(
    COLLECTIONS.feeInstallmentPlans,
  );

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ createdAt: -1 }).toArray(),
    );
  }

  if (role === "educator") {
    return [];
  }

  const linkedStudentId = await getLinkedStudentIdForViewer(role, userId);

  if (!linkedStudentId) {
    return [];
  }

  return stripMongoIds(
    await collection
      .find({ studentId: linkedStudentId })
      .sort({ createdAt: -1 })
      .toArray(),
  );
}

export async function getFeeInstallmentPlanById(planId: string) {
  const collection = await getCollection<FeeInstallmentPlan>(
    COLLECTIONS.feeInstallmentPlans,
  );

  const plan = await collection.findOne({ id: planId });

  return plan ? stripMongoId(plan) : null;
}

export async function createFeeInstallmentPlan(input: {
  studentId: string;
  studentName: string;
  parentId?: string;

  invoiceId?: string;
  title: string;

  courseName?: string;
  academicYear?: string;
  notes?: string;

  createdBy: string;

  installments: Array<
    Pick<
      FeeInstallment,
      | "installmentNumber"
      | "amount"
      | "paidAmount"
      | "dueDate"
      | "paidDate"
      | "receiptNumber"
      | "paymentMode"
      | "notes"
    >
  >;
}) {
  if (!input.studentId) {
    throw new Error("Student is required.");
  }

  if (!input.studentName.trim()) {
    throw new Error("Student name is required.");
  }

  if (!input.title.trim()) {
    throw new Error("Fee plan title is required.");
  }

  if (!input.createdBy) {
    throw new Error("Plan creator is required.");
  }

  const normalizedInstallments = normalizeInstallments(input.installments);
  const amounts = calculatePlanAmounts(normalizedInstallments);

  const collection = await getCollection<FeeInstallmentPlan>(
    COLLECTIONS.feeInstallmentPlans,
  );

  const now = new Date().toISOString();

  const plan: FeeInstallmentPlan = {
    id: `fee-plan-${randomUUID()}`,

    studentId: input.studentId,
    studentName: input.studentName.trim(),
    parentId: input.parentId,

    invoiceId: input.invoiceId?.trim() || undefined,
    title: input.title.trim(),

    courseName: input.courseName?.trim() || undefined,
    academicYear: input.academicYear?.trim() || undefined,

    totalFee: amounts.totalFee,
    paidAmount: amounts.paidAmount,
    pendingAmount: amounts.pendingAmount,
    status: amounts.status,

    installments: normalizedInstallments,
    notes: input.notes?.trim() || undefined,

    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(plan);

  return stripMongoId(plan);
}

export async function updateFeeInstallmentPlan(
  planId: string,
  input: Partial<{
    title: string;
    courseName: string;
    academicYear: string;
    notes: string;
    status: FeeInstallmentPlan["status"];
    installments: Array<
      Pick<
        FeeInstallment,
        | "installmentNumber"
        | "amount"
        | "paidAmount"
        | "dueDate"
        | "paidDate"
        | "receiptNumber"
        | "paymentMode"
        | "notes"
      >
    >;
    installmentTransaction: {
      installmentNumber: number;
      transaction: import("@/lib/types").PaymentTransaction;
    };
  }>,
) {
  const collection = await getCollection<FeeInstallmentPlan>(
    COLLECTIONS.feeInstallmentPlans,
  );

  const existingPlan = await collection.findOne({ id: planId });

  if (!existingPlan) {
    return null;
  }

  const existingPlanData = stripMongoId(existingPlan) as FeeInstallmentPlan;
  const updates: Partial<FeeInstallmentPlan> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof input.title === "string") {
    if (!input.title.trim()) {
      throw new Error("Fee plan title cannot be empty.");
    }

    updates.title = input.title.trim();
  }

  if (typeof input.courseName === "string") {
    updates.courseName = input.courseName.trim() || undefined;
  }

  if (typeof input.academicYear === "string") {
    updates.academicYear = input.academicYear.trim() || undefined;
  }

  if (typeof input.notes === "string") {
    updates.notes = input.notes.trim() || undefined;
  }

  if (input.installmentTransaction) {
    const { installmentNumber, transaction } = input.installmentTransaction;
    const installments = existingPlanData.installments.map((inst) => {
      if (inst.installmentNumber !== installmentNumber) return inst;

      const newTransactions = [...(inst.transactions ?? []), transaction];
      const totalPaid = newTransactions.reduce((s, t) => s + t.paidAmount, 0);
      const clampedPaid = Math.min(totalPaid, inst.amount);

      return {
        ...inst,
        paidAmount: clampedPaid,
        pendingAmount: Math.max(0, inst.amount - clampedPaid),
        paidDate: transaction.paidDate,
        paymentMode: transaction.paymentMode,
        transactions: newTransactions,
        status: getInstallmentStatus(inst.amount, clampedPaid, inst.dueDate),
      };
    });

    updates.installments = installments;
    const amounts = calculatePlanAmounts(installments);
    updates.totalFee = amounts.totalFee;
    updates.paidAmount = amounts.paidAmount;
    updates.pendingAmount = amounts.pendingAmount;
    updates.status = amounts.status;
  } else if (Array.isArray(input.installments)) {
    const normalizedInstallments = normalizeInstallments(input.installments);
    const amounts = calculatePlanAmounts(normalizedInstallments);

    updates.installments = normalizedInstallments;
    updates.totalFee = amounts.totalFee;
    updates.paidAmount = amounts.paidAmount;
    updates.pendingAmount = amounts.pendingAmount;
    updates.status = amounts.status;
  }

  if (input.status === "cancelled" && existingPlan.paidAmount === 0) {
    updates.status = "cancelled";
  }

  await collection.updateOne({ id: planId }, { $set: updates });

  const updatedPlan = await collection.findOne({ id: planId });

  return updatedPlan ? stripMongoId(updatedPlan) : null;
}

export async function deleteFeeInstallmentPlan(planId: string) {
  const collection = await getCollection<FeeInstallmentPlan>(
    COLLECTIONS.feeInstallmentPlans,
  );

  const result = await collection.deleteOne({ id: planId });

  return result.deletedCount > 0;
}
function normalizePayoutMonth(month: string) {
  const normalizedMonth = month.trim();

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(normalizedMonth)) {
    throw new Error("Payout month must use the YYYY-MM format.");
  }

  return normalizedMonth;
}

function normalizePayoutNumber(value: number, fieldLabel: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldLabel} must be a valid non-negative number.`);
  }

  return value;
}

function calculateTeacherPayoutAmounts(input: {
  basePay: number;
  perClassRate: number;
  completedClasses: number;
  bonus: number;
  deductions: number;
  paidAmount: number;
}) {
  const basePay = normalizePayoutNumber(input.basePay, "Base pay");
  const perClassRate = normalizePayoutNumber(
    input.perClassRate,
    "Per class rate",
  );
  const completedClasses = normalizePayoutNumber(
    input.completedClasses,
    "Completed classes",
  );
  const bonus = normalizePayoutNumber(input.bonus, "Bonus");
  const deductions = normalizePayoutNumber(input.deductions, "Deductions");
  const paidAmount = normalizePayoutNumber(input.paidAmount, "Paid amount");

  const classEarnings = perClassRate * completedClasses;
  const totalPayable = Math.max(
    0,
    basePay + classEarnings + bonus - deductions,
  );

  if (paidAmount > totalPayable) {
    throw new Error("Paid amount cannot be greater than total payable.");
  }

  const pendingAmount = Math.max(0, totalPayable - paidAmount);

  return {
    basePay,
    perClassRate,
    completedClasses,
    classEarnings,
    bonus,
    deductions,
    totalPayable,
    paidAmount,
    pendingAmount,
    status:
      pendingAmount === 0
        ? ("paid" as const)
        : paidAmount > 0
          ? ("partial" as const)
          : ("pending" as const),
  };
}

export async function getTeacherPayoutsForRole(role: Role, userId?: string) {
  const collection = await getCollection<TeacherPayout>(
    COLLECTIONS.teacherPayouts,
  );

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ month: -1, createdAt: -1 }).toArray(),
    );
  }

  if (role === "educator" && userId) {
    return stripMongoIds(
      await collection
        .find({ teacherId: userId })
        .sort({ month: -1, createdAt: -1 })
        .toArray(),
    );
  }

  return [];
}

export async function createTeacherPayout(input: {
  teacherId: string;
  month: string;
  basePay: number;
  perClassRate: number;
  completedClasses: number;
  bonus: number;
  deductions: number;
  paidAmount: number;
  payoutDate?: string;
  createdBy: string;
}) {
  if (!input.teacherId) {
    throw new Error("Educator is required.");
  }

  if (!input.createdBy) {
    throw new Error("Payout creator is required.");
  }

  const month = normalizePayoutMonth(input.month);

  const users = await getUsersCollection();
  const educator = await users.findOne({
    id: input.teacherId,
    role: "educator",
    status: "active",
  });

  if (!educator) {
    throw new Error("Choose a valid active educator.");
  }

  const collection = await getCollection<TeacherPayout>(
    COLLECTIONS.teacherPayouts,
  );

  const existingPayout = await collection.findOne({
    teacherId: input.teacherId,
    month,
  });

  if (existingPayout) {
    throw new Error(
      "A payout record already exists for this educator and month.",
    );
  }

  const amounts = calculateTeacherPayoutAmounts(input);
  const now = new Date().toISOString();

  const payout: TeacherPayout = {
    id: `teacher-payout-${randomUUID()}`,
    teacherId: input.teacherId,
    month,
    ...amounts,
    payoutDate: input.payoutDate?.trim() || undefined,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(payout);

  return stripMongoId(payout);
}

export async function updateTeacherPayout(
  payoutId: string,
  input: Partial<{
    month: string;
    basePay: number;
    perClassRate: number;
    completedClasses: number;
    bonus: number;
    deductions: number;
    paidAmount: number;
    payoutDate: string;
  }>,
) {
  const collection = await getCollection<TeacherPayout>(
    COLLECTIONS.teacherPayouts,
  );

  const existingPayout = await collection.findOne({ id: payoutId });

  if (!existingPayout) {
    return null;
  }

  const month =
    typeof input.month === "string"
      ? normalizePayoutMonth(input.month)
      : existingPayout.month;

  if (month !== existingPayout.month) {
    const conflictingPayout = await collection.findOne({
      teacherId: existingPayout.teacherId,
      month,
      id: { $ne: payoutId } as any,
    });

    if (conflictingPayout) {
      throw new Error(
        "A payout record already exists for this educator and month.",
      );
    }
  }

  const amounts = calculateTeacherPayoutAmounts({
    basePay:
      typeof input.basePay === "number"
        ? input.basePay
        : existingPayout.basePay,
    perClassRate:
      typeof input.perClassRate === "number"
        ? input.perClassRate
        : existingPayout.perClassRate,
    completedClasses:
      typeof input.completedClasses === "number"
        ? input.completedClasses
        : existingPayout.completedClasses,
    bonus: typeof input.bonus === "number" ? input.bonus : existingPayout.bonus,
    deductions:
      typeof input.deductions === "number"
        ? input.deductions
        : existingPayout.deductions,
    paidAmount:
      typeof input.paidAmount === "number"
        ? input.paidAmount
        : existingPayout.paidAmount,
  });

  const updates: Partial<TeacherPayout> = {
    month,
    ...amounts,
    updatedAt: new Date().toISOString(),
  };

  if (typeof input.payoutDate === "string") {
    updates.payoutDate = input.payoutDate.trim() || undefined;
  }

  await collection.updateOne({ id: payoutId }, { $set: updates });

  const updatedPayout = await collection.findOne({ id: payoutId });

  return updatedPayout ? stripMongoId(updatedPayout) : null;
}

export async function deleteTeacherPayout(payoutId: string) {
  const collection = await getCollection<TeacherPayout>(
    COLLECTIONS.teacherPayouts,
  );

  const result = await collection.deleteOne({ id: payoutId });

  return result.deletedCount > 0;
}

function createCrmActivity(input: {
  type: CrmLeadActivityType;
  message: string;
  actorId: string;
  actorName: string;
}) {
  return {
    id: `crm-activity-${randomUUID()}`,
    type: input.type,
    message: input.message,
    actorId: input.actorId,
    actorName: input.actorName,
    createdAt: new Date().toISOString(),
  };
}

function crmDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function getCrmMonthKey(value?: string) {
  const timestamp = crmDateValue(value);

  if (!timestamp) {
    return null;
  }

  return new Date(timestamp).toISOString().slice(0, 7);
}

function getCrmSummary(leads: CrmLead[]): CrmDashboardSummary {
  const now = new Date();
  const nowTime = now.getTime();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const activeLeads = leads.filter(
    (lead) => lead.status !== "lost" && lead.status !== "admitted",
  );

  const newToday = leads.filter((lead) => {
    const createdAt = crmDateValue(lead.createdAt);
    return createdAt !== null && createdAt >= todayStart;
  }).length;

  const newThisMonth = leads.filter((lead) => {
    const createdAt = crmDateValue(lead.createdAt);
    return createdAt !== null && createdAt >= monthStart;
  }).length;

  const dueToday = activeLeads.filter((lead) => {
    const followUpAt = crmDateValue(lead.nextFollowUpAt);

    return (
      followUpAt !== null &&
      followUpAt >= todayStart &&
      followUpAt < tomorrowStart
    );
  }).length;

  const overdueFollowUps = activeLeads.filter((lead) => {
    const followUpAt = crmDateValue(lead.nextFollowUpAt);
    return followUpAt !== null && followUpAt < nowTime;
  }).length;

  const demoScheduled = leads.filter(
    (lead) =>
      lead.demo.status === "scheduled" || lead.demo.status === "rescheduled",
  ).length;

  const admissionsConfirmed = leads.filter(
    (lead) => lead.status === "admitted",
  ).length;

  const revenueGenerated = leads.reduce(
    (total, lead) => total + (lead.admission.paidAmount || 0),
    0,
  );

  const pendingFeeCollection = leads.reduce(
    (total, lead) => total + (lead.admission.pendingAmount || 0),
    0,
  );

  const pipelineStatuses: CrmLeadStatus[] = [
    "new",
    "contacted",
    "follow-up",
    "counselling",
    "demo-scheduled",
    "admission-pending",
    "admitted",
    "lost",
  ];

  const pipeline = pipelineStatuses.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));

  const sourceAnalysis = [
    "website",
    "whatsapp",
    "instagram",
    "google",
    "referral",
    "walk-in",
    "other",
  ].map((source) => ({
    source: source as CrmLead["source"],
    count: leads.filter((lead) => lead.source === source).length,
  }));

  const staffMap = new Map<
    string,
    {
      staffId: string;
      staffName: string;
      leadsAssigned: number;
      demosBooked: number;
      admissionsConverted: number;
      revenueGenerated: number;
    }
  >();

  for (const lead of leads) {
    if (!lead.assignedStaffId) {
      continue;
    }

    const current = staffMap.get(lead.assignedStaffId) ?? {
      staffId: lead.assignedStaffId,
      staffName: lead.assignedStaffName ?? "Unassigned staff",
      leadsAssigned: 0,
      demosBooked: 0,
      admissionsConverted: 0,
      revenueGenerated: 0,
    };

    current.leadsAssigned += 1;

    if (
      lead.demo.status === "scheduled" ||
      lead.demo.status === "attended" ||
      lead.demo.status === "rescheduled"
    ) {
      current.demosBooked += 1;
    }

    if (lead.status === "admitted") {
      current.admissionsConverted += 1;
      current.revenueGenerated += lead.admission.paidAmount || 0;
    }

    staffMap.set(lead.assignedStaffId, current);
  }

  const counsellorPerformance = [...staffMap.values()]
    .map((staff) => ({
      ...staff,
      conversionRate: staff.leadsAssigned
        ? Math.round((staff.admissionsConverted / staff.leadsAssigned) * 100)
        : 0,
    }))
    .sort(
      (left, right) =>
        right.revenueGenerated - left.revenueGenerated ||
        right.admissionsConverted - left.admissionsConverted,
    );

  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = date.toISOString().slice(0, 7);

    const matchingLeads = leads.filter(
      (lead) => getCrmMonthKey(lead.admission.convertedAt) === key,
    );

    return {
      label: new Intl.DateTimeFormat("en-IN", {
        month: "short",
      }).format(date),
      revenue: matchingLeads.reduce(
        (total, lead) => total + (lead.admission.paidAmount || 0),
        0,
      ),
      admissions: matchingLeads.filter((lead) => lead.status === "admitted")
        .length,
    };
  });

  return {
    totalLeads: leads.length,
    newToday,
    newThisMonth,
    activeFollowUps: activeLeads.filter((lead) => Boolean(lead.nextFollowUpAt))
      .length,
    dueToday,
    overdueFollowUps,
    demoScheduled,
    admissionsConfirmed,
    conversionRate: leads.length
      ? Math.round((admissionsConfirmed / leads.length) * 100)
      : 0,
    revenueGenerated,
    pendingFeeCollection,
    hotLeads: leads.filter(
      (lead) =>
        lead.interest === "interested" &&
        lead.status !== "lost" &&
        lead.status !== "admitted",
    ).length,
    pipeline,
    sourceAnalysis,
    counsellorPerformance,
    monthlyRevenue,
  };
}

export async function getCrmLeads() {
  const collection = await getCollection<CrmLead>(COLLECTIONS.crmLeads);

  return stripMongoIds(
    await collection.find({}).sort({ updatedAt: -1 }).toArray(),
  );
}

export async function getCrmLeadById(leadId: string) {
  const collection = await getCollection<CrmLead>(COLLECTIONS.crmLeads);
  const lead = await collection.findOne({ id: leadId });

  return lead ? stripMongoId(lead) : null;
}

export async function getCrmStaff() {
  const collection = await getCollection<CrmStaff>(COLLECTIONS.crmStaff);

  return stripMongoIds(
    await collection.find({}).sort({ active: -1, name: 1 }).toArray(),
  );
}

export async function getCrmAdminWorkspace() {
  const [leads, staff] = await Promise.all([getCrmLeads(), getCrmStaff()]);

  return {
    leads,
    staff,
    summary: getCrmSummary(leads),
  };
}

export async function createCrmLead(
  input: Omit<CrmLead, "id" | "createdAt" | "updatedAt" | "activityLog">,
) {
  const now = new Date().toISOString();

  const lead: CrmLead = {
    ...input,
    id: `crm-lead-${randomUUID()}`,
    status: input.interest === "not-interested" ? "lost" : input.status,
    createdAt: now,
    updatedAt: now,
    activityLog: [
      createCrmActivity({
        type: "created",
        message: "Lead added to the Sales CRM.",
        actorId: input.createdBy,
        actorName: input.createdByName,
      }),
    ],
  };

  const collection = await getCollection<CrmLead>(COLLECTIONS.crmLeads);
  await collection.insertOne(lead);

  return lead;
}

export async function updateCrmLead(input: {
  leadId: string;
  actorId: string;
  actorName: string;
  activityType: CrmLeadActivityType;
  activityMessage: string;
  updates: Partial<
    Omit<
      CrmLead,
      "id" | "createdAt" | "updatedAt" | "activityLog" | "demo" | "admission"
    >
  > & {
    demo?: Partial<CrmLead["demo"]>;
    admission?: Partial<CrmLead["admission"]>;
  };
}) {
  const collection = await getCollection<CrmLead>(COLLECTIONS.crmLeads);

  const existingDocument = await collection.findOne({
    id: input.leadId,
  });

  if (!existingDocument) {
    return null;
  }

  const existing = stripMongoId(existingDocument);
  const now = new Date().toISOString();

  const nextInterest = input.updates.interest ?? existing.interest;
  const nextStatus =
    nextInterest === "not-interested"
      ? "lost"
      : (input.updates.status ?? existing.status);

  const updatedLead: CrmLead = {
    ...existing,
    ...input.updates,
    status: nextStatus,
    demo: {
      ...existing.demo,
      ...input.updates.demo,
    },
    admission: {
      ...existing.admission,
      ...input.updates.admission,
    },
    updatedBy: input.actorId,
    updatedByName: input.actorName,
    updatedAt: now,
    activityLog: [
      createCrmActivity({
        type: input.activityType,
        message: input.activityMessage,
        actorId: input.actorId,
        actorName: input.actorName,
      }),
      ...existing.activityLog,
    ].slice(0, 250),
  };

  await collection.updateOne(
    { id: input.leadId },
    {
      $set: updatedLead,
    },
  );

  return updatedLead;
}

export async function deleteCrmLead(leadId: string) {
  const collection = await getCollection<CrmLead>(COLLECTIONS.crmLeads);

  const deleted = await collection.findOneAndDelete({
    id: leadId,
  });

  return deleted ? stripMongoId(deleted) : null;
}

export async function createCrmStaff(input: {
  name: string;
  designation: CrmStaffDesignation;
  email?: string;
  phone?: string;
  linkedUserId?: string;
}) {
  const now = new Date().toISOString();

  const staff: CrmStaff = {
    id: `crm-staff-${randomUUID()}`,
    linkedUserId: input.linkedUserId,
    name: input.name,
    designation: input.designation,
    email: input.email,
    phone: input.phone,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  const collection = await getCollection<CrmStaff>(COLLECTIONS.crmStaff);
  await collection.insertOne(staff);

  return staff;
}

export async function updateCrmStaff(
  staffId: string,
  updates: Partial<
    Pick<CrmStaff, "name" | "designation" | "email" | "phone" | "active">
  >,
) {
  const collection = await getCollection<CrmStaff>(COLLECTIONS.crmStaff);

  const existingDocument = await collection.findOne({
    id: staffId,
  });

  if (!existingDocument) {
    return null;
  }

  const existing = stripMongoId(existingDocument);

  const updated: CrmStaff = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await collection.updateOne(
    { id: staffId },
    {
      $set: updated,
    },
  );

  return updated;
}

export async function deleteCrmStaff(staffId: string) {
  const collection = await getCollection<CrmStaff>(COLLECTIONS.crmStaff);

  const deleted = await collection.findOneAndDelete({
    id: staffId,
  });

  return deleted ? stripMongoId(deleted) : null;
}

export async function getCrmCounsellorStaff(userId: string) {
  const collection = await getCollection<CrmStaff>(COLLECTIONS.crmStaff);

  const staff = await collection.findOne({
    linkedUserId: userId,
    designation: "counsellor",
    active: true,
  });

  return staff ? stripMongoId(staff) : null;
}

export async function getCrmCounsellorWorkspace(userId: string) {
  const staff = await getCrmCounsellorStaff(userId);

  if (!staff) {
    throw new Error(
      "This counsellor account is not linked to an active CRM staff profile.",
    );
  }

  const collection = await getCollection<CrmLead>(COLLECTIONS.crmLeads);

  const leads = stripMongoIds(
    await collection
      .find({ assignedStaffId: staff.id })
      .sort({ updatedAt: -1 })
      .toArray(),
  );

  return {
    leads,
    staff: [staff],
    summary: getCrmSummary(leads),
  };
}

export async function createOrLinkCrmCounsellor(input: {
  userId: string;
  name: string;
  email: string;
}) {
  const collection = await getCollection<CrmStaff>(COLLECTIONS.crmStaff);

  const existingDocument = await collection.findOne({
    $or: [{ linkedUserId: input.userId }, { email: input.email }],
  });

  if (!existingDocument) {
    return createCrmStaff({
      name: input.name,
      designation: "counsellor",
      email: input.email,
      linkedUserId: input.userId,
    });
  }

  const existing = stripMongoId(existingDocument);

  if (existing.linkedUserId && existing.linkedUserId !== input.userId) {
    throw new Error(
      "This CRM staff profile is already linked to another counsellor account.",
    );
  }

  const updated: CrmStaff = {
    ...existing,
    name: input.name,
    email: input.email,
    designation: "counsellor",
    linkedUserId: input.userId,
    active: true,
    updatedAt: new Date().toISOString(),
  };

  await collection.updateOne({ id: existing.id }, { $set: updated });

  return updated;
}
let placementIndexesPromise: Promise<void> | null = null;

async function ensurePlacementIndexes() {
  if (!placementIndexesPromise) {
    placementIndexesPromise = (async () => {
      const applications = await getCollection<PlacementApplication>(
        COLLECTIONS.placementApplications,
      );

      await Promise.all([
        applications.createIndex(
          { jobId: 1, studentId: 1 },
          {
            unique: true,
            name: "placement_application_unique_job_student",
          },
        ),
        applications.createIndex(
          { studentId: 1, createdAt: -1 },
          {
            name: "placement_application_student_created",
          },
        ),
        applications.createIndex(
          { jobId: 1, createdAt: -1 },
          {
            name: "placement_application_job_created",
          },
        ),
      ]);
    })().catch((error) => {
      placementIndexesPromise = null;
      throw error;
    });
  }

  return placementIndexesPromise;
}

export async function getPlacementJobs(
  options: {
    includeUnpublished?: boolean;
  } = {},
) {
  const collection = await getCollection<PlacementJob>(
    COLLECTIONS.placementJobs,
  );

  const filter = options.includeUnpublished
    ? {}
    : {
        status: "published" as const,
      };

  return stripMongoIds(
    await collection
      .find(filter)
      .sort({
        publishedAt: -1,
        createdAt: -1,
      })
      .toArray(),
  );
}

export async function getPlacementJobById(jobId: string) {
  const collection = await getCollection<PlacementJob>(
    COLLECTIONS.placementJobs,
  );

  const job = await collection.findOne({
    id: jobId.trim(),
  });

  return job ? stripMongoId(job) : null;
}

export async function createPlacementJob(input: {
  company: string;
  role: string;
  location: string;
  salary?: string;
  eligibility?: string;
  jobType: PlacementJob["jobType"];
  deadline: string;
  description: string;
  skills: string[];
  applicationQuestions: PlacementJob["applicationQuestions"];
  status: PlacementJob["status"];
  createdBy: string;
}) {
  const collection = await getCollection<PlacementJob>(
    COLLECTIONS.placementJobs,
  );

  const now = new Date().toISOString();

  const job: PlacementJob = {
    id: `placement-job-${randomUUID()}`,
    company: input.company.trim(),
    role: input.role.trim(),
    location: input.location.trim(),
    salary: input.salary?.trim() || undefined,
    eligibility: input.eligibility?.trim() || undefined,
    jobType: input.jobType,
    deadline: input.deadline,
    description: input.description.trim(),
    skills: [
      ...new Set(input.skills.map((skill) => skill.trim()).filter(Boolean)),
    ],
    applicationQuestions: input.applicationQuestions,
    status: input.status,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === "published" ? now : undefined,
  };

  await collection.insertOne(job);

  return stripMongoId(job);
}

export async function updatePlacementJob(
  jobId: string,
  input: Partial<{
    company: string;
    role: string;
    location: string;
    salary: string;
    eligibility: string;
    jobType: PlacementJob["jobType"];
    deadline: string;
    description: string;
    skills: string[];
    applicationQuestions: PlacementJob["applicationQuestions"];
    status: PlacementJob["status"];
  }>,
) {
  const collection = await getCollection<PlacementJob>(
    COLLECTIONS.placementJobs,
  );

  const existingJob = await collection.findOne({
    id: jobId.trim(),
  });

  if (!existingJob) {
    return null;
  }

  const updates: Partial<PlacementJob> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof input.company === "string") {
    updates.company = input.company.trim();
  }

  if (typeof input.role === "string") {
    updates.role = input.role.trim();
  }

  if (typeof input.location === "string") {
    updates.location = input.location.trim();
  }

  if (typeof input.salary === "string") {
    updates.salary = input.salary.trim() || undefined;
  }

  if (typeof input.eligibility === "string") {
    updates.eligibility = input.eligibility.trim() || undefined;
  }

  if (input.jobType) {
    updates.jobType = input.jobType;
  }

  if (typeof input.deadline === "string") {
    updates.deadline = input.deadline;
  }

  if (typeof input.description === "string") {
    updates.description = input.description.trim();
  }

  if (Array.isArray(input.skills)) {
    updates.skills = [
      ...new Set(input.skills.map((skill) => skill.trim()).filter(Boolean)),
    ];
  }

  if (Array.isArray(input.applicationQuestions)) {
    updates.applicationQuestions = input.applicationQuestions;
  }

  if (input.status) {
    updates.status = input.status;

    if (input.status === "published" && existingJob.status !== "published") {
      updates.publishedAt = new Date().toISOString();
    }
  }

  await collection.updateOne(
    { id: jobId.trim() },
    {
      $set: updates,
    },
  );

  const updatedJob = await collection.findOne({
    id: jobId.trim(),
  });

  return updatedJob ? stripMongoId(updatedJob) : null;
}

export async function deletePlacementJob(jobId: string) {
  const normalizedJobId = jobId.trim();

  const jobs = await getCollection<PlacementJob>(COLLECTIONS.placementJobs);

  const applications = await getCollection<PlacementApplication>(
    COLLECTIONS.placementApplications,
  );

  const result = await jobs.deleteOne({
    id: normalizedJobId,
  });

  if (!result.deletedCount) {
    return false;
  }

  await applications.deleteMany({
    jobId: normalizedJobId,
  });

  return true;
}

export async function getPlacementApplicationsForAdmin() {
  const collection = await getCollection<PlacementApplication>(
    COLLECTIONS.placementApplications,
  );

  return stripMongoIds(
    await collection
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray(),
  );
}

export async function getPlacementApplicationsForStudent(studentId: string) {
  const collection = await getCollection<PlacementApplication>(
    COLLECTIONS.placementApplications,
  );

  return stripMongoIds(
    await collection
      .find({
        studentId: studentId.trim(),
      })
      .sort({
        createdAt: -1,
      })
      .toArray(),
  );
}

export async function getPlacementApplicationForStudent(
  jobId: string,
  studentId: string,
) {
  const collection = await getCollection<PlacementApplication>(
    COLLECTIONS.placementApplications,
  );

  const application = await collection.findOne({
    jobId: jobId.trim(),
    studentId: studentId.trim(),
  });

  return application ? stripMongoId(application) : null;
}

export async function getPlacementStudentProfile(studentId: string) {
  const users = await getUsersCollection();

  const student = await users.findOne({
    id: studentId.trim(),
    role: "student",
  });

  if (!student) {
    return null;
  }

  return {
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
    phone: student.mobile?.trim() || "",
    programme: student.program?.trim() || "",
  };
}

export async function createPlacementApplication(input: {
  job: PlacementJob;
  studentId: string;
  studentName: string;
  studentEmail: string;
  phone: string;
  programme: string;
  skills: string[];
  resumeUrl?: string;
  experience?: string;
  message?: string;
  answers: PlacementApplication["answers"];
}) {
  await ensurePlacementIndexes();

  const collection = await getCollection<PlacementApplication>(
    COLLECTIONS.placementApplications,
  );

  const existingApplication = await collection.findOne({
    jobId: input.job.id,
    studentId: input.studentId,
  });

  if (existingApplication) {
    throw new Error("You have already applied for this job.");
  }

  const now = new Date().toISOString();

  const application: PlacementApplication = {
    id: `placement-application-${randomUUID()}`,
    jobId: input.job.id,
    company: input.job.company,
    jobRole: input.job.role,
    studentId: input.studentId,
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    phone: input.phone.trim(),
    programme: input.programme.trim(),
    skills: [
      ...new Set(input.skills.map((skill) => skill.trim()).filter(Boolean)),
    ],
    resumeUrl: input.resumeUrl?.trim() || undefined,
    experience: input.experience?.trim() || undefined,
    message: input.message?.trim() || undefined,
    answers: input.answers,
    status: "applied",
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(application);

  return stripMongoId(application);
}

export async function updatePlacementApplicationStatus(
  applicationId: string,
  input: {
    status: PlacementApplicationStatus;
    statusNote?: string;
    updatedBy: string;
  },
) {
  const collection = await getCollection<PlacementApplication>(
    COLLECTIONS.placementApplications,
  );

  await collection.updateOne(
    {
      id: applicationId.trim(),
    },
    {
      $set: {
        status: input.status,
        statusNote: input.statusNote?.trim() || undefined,
        updatedBy: input.updatedBy,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  const application = await collection.findOne({
    id: applicationId.trim(),
  });

  return application ? stripMongoId(application) : null;
}

export async function getAdminNotificationRecipientIds() {
  const users = await getUsersCollection();

  const admins = await users
    .find({
      role: "admin",
      verified: { $ne: false },
      $or: [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
      ],
    } as any)
    .toArray();

  return admins.map((admin) => admin.id);
}

// =========================
// Homework Data-Store Functions
// =========================

export async function createHomework(input: {
  title: string;
  description?: string;
  objective?: string;
  keySteps?: string[];
  deliverables?: string;
  evaluationCriteria?: string;
  estimatedHours?: number;
  taskNumber?: number;
  subject?: string;
  hwType: string;
  maxMarks: number;
  dueDate: string;
  allowLateSubmission: boolean;
  attachmentUrl?: string;
  createdBy: string;
  createdByName?: string;
}) {
  const collection = await getCollection<HomeworkItem>(COLLECTIONS.homework);
  const homework: HomeworkItem = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    objective: input.objective,
    keySteps: input.keySteps,
    deliverables: input.deliverables,
    evaluationCriteria: input.evaluationCriteria,
    estimatedHours: input.estimatedHours,
    taskNumber: input.taskNumber,
    subject: input.subject,
    hwType: input.hwType as HomeworkItem["hwType"],
    maxMarks: input.maxMarks,
    dueDate: input.dueDate,
    allowLateSubmission: input.allowLateSubmission,
    attachmentUrl: input.attachmentUrl,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(homework);
  return homework;
}

export async function getHomeworkById(id: string) {
  const collection = await getCollection<HomeworkItem>(COLLECTIONS.homework);
  const hw = await collection.findOne({ id });
  return hw ? stripMongoId(hw) : null;
}

export async function getHomeworkForBatch(batchId: string) {
  const collection = await getCollection<HomeworkItem>(COLLECTIONS.homework);
  const items = await collection
    .find({ batchId })
    .sort({ createdAt: -1 })
    .toArray();
  return items.map(stripMongoId);
}

export async function getHomeworkForTeacher(teacherId: string) {
  const collection = await getCollection<HomeworkItem>(COLLECTIONS.homework);
  const items = await collection
    .find({ createdBy: teacherId })
    .sort({ createdAt: -1 })
    .toArray();
  return items.map(stripMongoId);
}

export async function getHomeworkForStudent(studentBatchIds: string[]) {
  const collection = await getCollection<HomeworkItem>(COLLECTIONS.homework);
  const items = await collection
    .find({ batchId: { $in: studentBatchIds } })
    .sort({ createdAt: -1 })
    .toArray();
  return items.map(stripMongoId);
}

export async function updateHomework(
  id: string,
  updates: Partial<Omit<HomeworkItem, "id" | "createdBy" | "createdAt">>,
) {
  const collection = await getCollection<HomeworkItem>(COLLECTIONS.homework);
  await collection.updateOne(
    { id },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
  );
  return getHomeworkById(id);
}

export async function deleteHomework(id: string) {
  const collection = await getCollection<HomeworkItem>(COLLECTIONS.homework);
  await collection.deleteOne({ id });
}

export async function submitHomework(input: {
  homeworkId: string;
  studentId: string;
  studentName: string;
  content?: string;
  attachmentUrl?: string;
}) {
  const subsCollection = await getCollection<HomeworkSubmission>(
    COLLECTIONS.homeworkSubmissions,
  );
  const existing = await subsCollection.findOne({
    homeworkId: input.homeworkId,
    studentId: input.studentId,
  });
  if (existing) {
    await subsCollection.updateOne(
      { _id: existing._id },
      {
        $set: {
          content: input.content,
          attachmentUrl: input.attachmentUrl,
          submittedAt: new Date().toISOString(),
        },
      },
    );
    const updated = await subsCollection.findOne({ _id: existing._id });
    return updated ? stripMongoId(updated) : null;
  }
  const submission: HomeworkSubmission = {
    id: randomUUID(),
    homeworkId: input.homeworkId,
    studentId: input.studentId,
    studentName: input.studentName,
    content: input.content,
    attachmentUrl: input.attachmentUrl,
    submittedAt: new Date().toISOString(),
    status: "submitted",
  };
  await subsCollection.insertOne(submission);
  return submission;
}

export async function getSubmissionsForHomework(homeworkId: string) {
  const collection = await getCollection<HomeworkSubmission>(
    COLLECTIONS.homeworkSubmissions,
  );
  const items = await collection
    .find({ homeworkId })
    .sort({ submittedAt: -1 })
    .toArray();
  return items.map(stripMongoId);
}

export async function getAllHomeworkForAdmin() {
  const collection = await getCollection<HomeworkItem>(COLLECTIONS.homework);
  const items = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return items.map(stripMongoId);
}

export async function getSubmissionsForHomeworkBatch(homeworkIds: string[]) {
  if (!homeworkIds.length) return [];
  const collection = await getCollection<HomeworkSubmission>(
    COLLECTIONS.homeworkSubmissions,
  );
  const items = await collection
    .find({ homeworkId: { $in: homeworkIds } })
    .toArray();
  return items.map(stripMongoId);
}

export async function getSubmissionForStudent(
  homeworkId: string,
  studentId: string,
) {
  const collection = await getCollection<HomeworkSubmission>(
    COLLECTIONS.homeworkSubmissions,
  );
  const sub = await collection.findOne({ homeworkId, studentId });
  return sub ? stripMongoId(sub) : null;
}

export async function gradeHomeworkSubmission(input: {
  submissionId: string;
  marks: number;
  feedback?: string;
  gradedBy: string;
}) {
  const collection = await getCollection<HomeworkSubmission>(
    COLLECTIONS.homeworkSubmissions,
  );
  await collection.updateOne(
    { id: input.submissionId },
    {
      $set: {
        marks: input.marks,
        feedback: input.feedback,
        gradedBy: input.gradedBy,
        status: "graded" as const,
        gradedAt: new Date().toISOString(),
      },
    },
  );
  const updated = await collection.findOne({ id: input.submissionId });
  return updated ? stripMongoId(updated) : null;
}

export const DEFAULT_GAMIFICATION_LEVELS: GamificationLevel[] = [
  { level: 1, name: "Beginner", pointsRequired: 0 },
  { level: 2, name: "Explorer", pointsRequired: 500 },
  { level: 3, name: "Scholar", pointsRequired: 1000 },
  { level: 4, name: "Expert", pointsRequired: 2000 },
  { level: 5, name: "Champion", pointsRequired: 5000 },
];

export function computeLevel(totalPoints: number): GamificationLevel {
  let current = DEFAULT_GAMIFICATION_LEVELS[0];
  for (const lvl of DEFAULT_GAMIFICATION_LEVELS) {
    if (totalPoints >= lvl.pointsRequired) current = lvl;
  }
  return current;
}

export async function awardGamificationPoints(input: {
  studentId: string;
  points: number;
  activity: GamificationActivity;
  description?: string;
  awardedBy: string;
  awardedByName?: string;
}) {
  const collection = await getCollection<GamificationPointEntry>(COLLECTIONS.gamificationPoints);
  const entry: GamificationPointEntry = {
    id: randomUUID(),
    studentId: input.studentId,
    points: input.points,
    activity: input.activity,
    description: input.description,
    awardedBy: input.awardedBy,
    awardedByName: input.awardedByName,
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(entry);
  return entry;
}

export async function getStudentTotalPoints(studentId: string) {
  const collection = await getCollection<GamificationPointEntry>(COLLECTIONS.gamificationPoints);
  const entries = await collection.find({ studentId }).toArray();
  return entries.reduce((sum, e) => sum + e.points, 0);
}

export async function getAllStudentsPoints() {
  const collection = await getCollection<GamificationPointEntry>(COLLECTIONS.gamificationPoints);
  const entries = await collection.find({}).toArray();
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.studentId, (map.get(e.studentId) || 0) + e.points);
  }
  return map;
}

export async function getGamificationLeaderboard(batchId?: string) {
  const usersCollection = await getUsersCollection();
  const studentQuery: any = { role: "student" };
  if (batchId) studentQuery.program = batchId;
  const students = await usersCollection.find(studentQuery).toArray();
  const pointsMap = await getAllStudentsPoints();
  const badgesCollection = await getCollection<GamificationStudentBadge>(COLLECTIONS.gamificationStudentBadges);
  const allBadges = await badgesCollection.find({}).toArray();
  const badgeCountMap = new Map<string, number>();
  for (const b of allBadges) {
    badgeCountMap.set(b.studentId, (badgeCountMap.get(b.studentId) || 0) + 1);
  }
  const entries: GamificationLeaderboardEntry[] = students.map((s) => {
    const totalPoints = pointsMap.get(s.id) || 0;
    const level = computeLevel(totalPoints);
    return {
      studentId: s.id,
      studentName: s.name,
      studentPhoto: (s as any).profilePhoto,
      points: totalPoints,
      badges: badgeCountMap.get(s.id) || 0,
      level: level.level,
      levelName: level.name,
      rank: 0,
    };
  });
  entries.sort((a, b) => b.points - a.points);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

export async function createGamificationBadge(input: {
  name: string;
  icon: string;
  description?: string;
  criteriaType: BadgeCriteriaType;
  criteriaValue: number;
  color: string;
}) {
  const collection = await getCollection<GamificationBadge>(COLLECTIONS.gamificationBadges);
  const badge: GamificationBadge = {
    id: randomUUID(),
    name: input.name,
    icon: input.icon,
    description: input.description,
    criteriaType: input.criteriaType,
    criteriaValue: input.criteriaValue,
    color: input.color,
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(badge);
  return badge;
}

export async function getAllGamificationBadges() {
  const collection = await getCollection<GamificationBadge>(COLLECTIONS.gamificationBadges);
  return stripMongoIds(await collection.find({}).sort({ createdAt: -1 }).toArray());
}

export async function awardBadgeToStudent(input: {
  studentId: string;
  badgeId: string;
  reason?: string;
  awardedBy: string;
}) {
  const badgesCollection = await getCollection<GamificationBadge>(COLLECTIONS.gamificationBadges);
  const badge = await badgesCollection.findOne({ id: input.badgeId });
  if (!badge) throw new Error("Badge not found");
  const collection = await getCollection<GamificationStudentBadge>(COLLECTIONS.gamificationStudentBadges);
  const sb: GamificationStudentBadge = {
    id: randomUUID(),
    studentId: input.studentId,
    badgeId: input.badgeId,
    badgeName: badge.name,
    badgeIcon: badge.icon,
    badgeColor: badge.color,
    reason: input.reason,
    awardedBy: input.awardedBy,
    awardedAt: new Date().toISOString(),
  };
  await collection.insertOne(sb);
  return sb;
}

export async function getStudentBadges(studentId: string) {
  const collection = await getCollection<GamificationStudentBadge>(COLLECTIONS.gamificationStudentBadges);
  return stripMongoIds(await collection.find({ studentId }).toArray());
}

export async function getAllStudentBadges() {
  const collection = await getCollection<GamificationStudentBadge>(COLLECTIONS.gamificationStudentBadges);
  return stripMongoIds(await collection.find({}).toArray());
}

export async function createGamificationAutoAwardRule(input: {
  name: string;
  trigger: AutoAwardTrigger;
  points: number;
  badgeId?: string;
}) {
  const collection = await getCollection<GamificationAutoAwardRule>(COLLECTIONS.gamificationRules);
  const rule: GamificationAutoAwardRule = {
    id: randomUUID(),
    name: input.name,
    trigger: input.trigger,
    points: input.points,
    badgeId: input.badgeId,
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(rule);
  return rule;
}

export async function getAllGamificationAutoAwardRules() {
  const collection = await getCollection<GamificationAutoAwardRule>(COLLECTIONS.gamificationRules);
  return stripMongoIds(await collection.find({}).sort({ createdAt: -1 }).toArray());
}

export async function getGamificationStats() {
  const pointsCollection = await getCollection<GamificationPointEntry>(COLLECTIONS.gamificationPoints);
  const totalPointsAgg = await pointsCollection.aggregate([
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]).toArray();
  const totalPointsAwarded = totalPointsAgg[0]?.total || 0;
  const usersCollection = await getUsersCollection();
  const activeStudents = await usersCollection.countDocuments({ role: "student", status: "active" });
  const badgesCollection = await getCollection<GamificationStudentBadge>(COLLECTIONS.gamificationStudentBadges);
  const totalBadgesGiven = await badgesCollection.countDocuments({});
  const stats: GamificationStats = { totalPointsAwarded, activeStudents, totalBadgesGiven };
  return stats;
}

// =========================
// Staff Attendance CRUD
// =========================

function getStaffCategory(role: Role): StaffCategory {
  if (role === "admin") return "Admin";
  if (role === "counsellor") return "Counsellor";
  if (role === "educator") return "Teacher";
  return "Staff";
}

function getEmploymentType(_user: any): EmploymentType {
  return "full_time";
}

export async function getStaffAttendanceForDate(date: string) {
  const collection = await getCollection<StaffAttendanceRecord>(COLLECTIONS.staffAttendance);
  return stripMongoIds(
    await collection.find({ date }).sort({ userName: 1 }).toArray(),
  );
}

export async function getStaffAttendanceForDateRange(startDate: string, endDate: string, userId?: string) {
  const collection = await getCollection<StaffAttendanceRecord>(COLLECTIONS.staffAttendance);
  const query: Record<string, unknown> = {
    date: { $gte: startDate, $lte: endDate },
  };
  if (userId) query.userId = userId;
  return stripMongoIds(
    await collection.find(query).sort({ date: 1 }).toArray(),
  );
}

export async function getStaffAttendanceForUser(userId: string, limit = 30) {
  const collection = await getCollection<StaffAttendanceRecord>(COLLECTIONS.staffAttendance);
  return stripMongoIds(
    await collection
      .find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .toArray(),
  );
}

export async function getStaffAttendanceForToday(userId: string, date: string) {
  const collection = await getCollection<StaffAttendanceRecord>(COLLECTIONS.staffAttendance);
  const doc = await collection.findOne({ userId, date } as any);
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest as StaffAttendanceRecord;
}

export async function upsertStaffAttendance(record: StaffAttendanceRecord) {
  const collection = await getCollection<StaffAttendanceRecord>(COLLECTIONS.staffAttendance);
  const existing = await collection.findOne({ userId: record.userId, date: record.date } as any);
  if (existing) {
    await collection.updateOne(
      { _id: existing._id } as any,
      { $set: { ...record, updatedAt: new Date().toISOString() } },
    );
    return { ...record, id: existing.id };
  }
  await collection.insertOne(record);
  return record;
}

export async function bulkMarkStaffAttendance(
  records: { userId: string; userName: string; userEmail: string; category: StaffCategory; employmentType: EmploymentType; status: StaffAttendanceStatus; checkIn?: string; checkOut?: string }[],
  date: string,
  markedBy: string,
) {
  const collection = await getCollection<StaffAttendanceRecord>(COLLECTIONS.staffAttendance);
  const now = new Date().toISOString();
  const results: StaffAttendanceRecord[] = [];
  for (const rec of records) {
    const id = randomUUID();
    const doc: StaffAttendanceRecord = {
      id,
      ...rec,
      date,
      markedBy,
      markedAt: now,
    };
    const existing = await collection.findOne({ userId: rec.userId, date } as any);
    if (existing) {
      await collection.updateOne(
        { _id: existing._id } as any,
        { $set: { status: rec.status, checkIn: rec.checkIn, checkOut: rec.checkOut, updatedAt: now, markedBy } },
      );
      results.push({ ...doc, id: existing.id });
    } else {
      await collection.insertOne(doc);
      results.push(doc);
    }
  }
  return results;
}

export async function selfCheckIn(userId: string, userName: string, userEmail: string, role: Role, date: string) {
  const collection = await getCollection<StaffAttendanceRecord>(COLLECTIONS.staffAttendance);
  const existing = await collection.findOne({ userId, date } as any);
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);
  const id = existing?.id ?? randomUUID();
  const category = getStaffCategory(role);
  if (existing) {
    await collection.updateOne(
      { _id: existing._id } as any,
      { $set: { checkIn: timeStr, status: "present", updatedAt: now.toISOString() } },
    );
  } else {
    await collection.insertOne({
      id,
      userId,
      userName,
      userEmail,
      category,
      employmentType: "full_time",
      date,
      status: "present",
      checkIn: timeStr,
      markedBy: userId,
      markedAt: now.toISOString(),
    });
  }
  return id;
}

export async function selfCheckOut(userId: string, date: string) {
  const collection = await getCollection<StaffAttendanceRecord>(COLLECTIONS.staffAttendance);
  const existing = await collection.findOne({ userId, date } as any);
  if (!existing) return null;
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);
  const checkIn = existing.checkIn || "00:00";
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = timeStr.split(":").map(Number);
  const hoursWorked = Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 10) / 10;
  await collection.updateOne(
    { _id: existing._id } as any,
    { $set: { checkOut: timeStr, hoursWorked: Math.max(0, hoursWorked), updatedAt: now.toISOString() } },
  );
  return existing.id;
}

export async function getStaffAttendanceStats(date: string) {
  const records = await getStaffAttendanceForDate(date);
  const stats: StaffAttendanceSummary = {
    total: records.length,
    present: 0,
    absent: 0,
    halfDay: 0,
    late: 0,
    onLeave: 0,
    holiday: 0,
  };
  for (const r of records) {
    if (r.status === "present") stats.present++;
    else if (r.status === "absent") stats.absent++;
    else if (r.status === "half_day") stats.halfDay++;
    else if (r.status === "late") stats.late++;
    else if (r.status === "on_leave") stats.onLeave++;
    else if (r.status === "holiday") stats.holiday++;
  }
  return stats;
}

// =========================
// Biometric Integration CRUD
// =========================

export async function getAllBiometricDevices() {
  const collection = await getCollection<BiometricDevice>(COLLECTIONS.biometricDevices);
  return stripMongoIds(await collection.find({}).sort({ createdAt: -1 }).toArray());
}

export async function createBiometricDevice(input: {
  name: string;
  location?: string;
  autoMarkAttendance?: boolean;
  sendParentSms?: boolean;
  sendStaffSms?: boolean;
}) {
  const collection = await getCollection<BiometricDevice>(COLLECTIONS.biometricDevices);
  const device: BiometricDevice = {
    id: randomUUID(),
    name: input.name,
    location: input.location ?? "",
    serialNumber: "",
    webhookToken: randomUUID(),
    autoMarkAttendance: input.autoMarkAttendance ?? true,
    sendParentSms: input.sendParentSms ?? true,
    sendStaffSms: input.sendStaffSms ?? true,
    isOnline: false,
    lastSeenAt: undefined,
    totalPunches: 0,
    mappedStudents: 0,
    mappedStaff: 0,
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(device);
  return device;
}

export async function updateBiometricDevice(id: string, updates: Partial<BiometricDevice>) {
  const collection = await getCollection<BiometricDevice>(COLLECTIONS.biometricDevices);
  await collection.updateOne(
    { id } as any,
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
  );
}

export async function deleteBiometricDevice(id: string) {
  const collection = await getCollection<BiometricDevice>(COLLECTIONS.biometricDevices);
  await collection.deleteOne({ id } as any);
  const punchCollection = await getCollection<BiometricPunchLog>(COLLECTIONS.biometricPunchLogs);
  await punchCollection.deleteMany({ deviceId: id } as any);
}

export async function getPunchLogs(limit = 20) {
  const collection = await getCollection<BiometricPunchLog>(COLLECTIONS.biometricPunchLogs);
  return stripMongoIds(
    await collection.find({}).sort({ punchedAt: -1 }).limit(limit).toArray(),
  );
}

export async function createPunchLog(log: BiometricPunchLog) {
  const collection = await getCollection<BiometricPunchLog>(COLLECTIONS.biometricPunchLogs);
  await collection.insertOne(log);
  return log;
}

// =========================
// Attendance Regularisation
// =========================

export async function createRegularisationRequest(input: {
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  reason: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  requestedStatus: string;
}): Promise<RegularisationRequest> {
  const request: RegularisationRequest = {
    id: randomUUID(),
    ...input,
    requestedStatus: input.requestedStatus as StaffAttendanceStatus,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const collection = await getCollection<RegularisationRequest>(COLLECTIONS.regularisationRequests);
  await collection.insertOne(request);
  return request;
}

export async function getRegularisationRequests(filter?: {
  status?: "pending" | "approved" | "rejected";
  userId?: string;
}): Promise<RegularisationRequest[]> {
  const collection = await getCollection<RegularisationRequest>(COLLECTIONS.regularisationRequests);
  const query: any = {};
  if (filter?.status) query.status = filter.status;
  if (filter?.userId) query.userId = filter.userId;
  return stripMongoIds(
    await collection.find(query).sort({ createdAt: -1 }).toArray(),
  );
}

export async function reviewRegularisationRequest(
  requestId: string,
  reviewedBy: string,
  status: "approved" | "rejected",
  reviewComment?: string,
): Promise<boolean> {
  const collection = await getCollection<RegularisationRequest>(COLLECTIONS.regularisationRequests);
  const result = await collection.updateOne(
    { id: requestId } as any,
    {
      $set: {
        status,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        reviewComment: reviewComment || "",
      },
    },
  );
  return result.matchedCount > 0;
}

// =========================
// Staff Payroll / Salary Management
// =========================

export async function getStaffPayrollProfiles() {
  const collection = await getCollection<StaffPayrollProfile>(COLLECTIONS.staffPayrollProfiles);
  return stripMongoIds(await collection.find({}).sort({ userName: 1 }).toArray());
}

export async function getStaffPayrollProfileByUserId(userId: string) {
  const collection = await getCollection<StaffPayrollProfile>(COLLECTIONS.staffPayrollProfiles);
  const profile = await collection.findOne({ userId });
  return profile ? stripMongoId(profile) : null;
}

export async function createStaffPayrollProfile(input: {
  userId: string;
  userName: string;
  employeeId?: string;
  employmentType: string;
  salaryType: string;
  monthlySalary: number;
  hourlyRate: number;
  perClassRate: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  pfEnabled: boolean;
  tdsEnabled: boolean;
  notes?: string;
}) {
  const collection = await getCollection<StaffPayrollProfile>(COLLECTIONS.staffPayrollProfiles);
  const now = new Date().toISOString();

  const profile: StaffPayrollProfile = {
    id: `sp-${randomUUID()}`,
    userId: input.userId,
    userName: input.userName,
    employeeId: input.employeeId?.trim() || undefined,
    employmentType: input.employmentType as StaffPayrollProfile["employmentType"],
    salaryType: input.salaryType as StaffPayrollProfile["salaryType"],
    monthlySalary: input.monthlySalary,
    hourlyRate: input.hourlyRate,
    perClassRate: input.perClassRate,
    bankName: input.bankName?.trim() || undefined,
    accountNumber: input.accountNumber?.trim() || undefined,
    ifscCode: input.ifscCode?.trim() || undefined,
    panNumber: input.panNumber?.trim() || undefined,
    pfEnabled: input.pfEnabled,
    tdsEnabled: input.tdsEnabled,
    effectiveFrom: now.slice(0, 10),
    notes: input.notes?.trim() || undefined,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(profile);
  return stripMongoId(profile);
}

export async function updateStaffPayrollProfile(
  profileId: string,
  input: Partial<{
    employeeId: string;
    employmentType: string;
    salaryType: string;
    monthlySalary: number;
    hourlyRate: number;
    perClassRate: number;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
    pfEnabled: boolean;
    tdsEnabled: boolean;
    notes: string;
    isActive: boolean;
  }>
) {
  const collection = await getCollection<StaffPayrollProfile>(COLLECTIONS.staffPayrollProfiles);
  const existing = await collection.findOne({ id: profileId });
  if (!existing) return null;

  const updateFields: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.employeeId !== undefined) updateFields.employeeId = input.employeeId?.trim() || undefined;
  if (input.employmentType !== undefined) updateFields.employmentType = input.employmentType;
  if (input.salaryType !== undefined) updateFields.salaryType = input.salaryType;
  if (input.monthlySalary !== undefined) updateFields.monthlySalary = input.monthlySalary;
  if (input.hourlyRate !== undefined) updateFields.hourlyRate = input.hourlyRate;
  if (input.perClassRate !== undefined) updateFields.perClassRate = input.perClassRate;
  if (input.bankName !== undefined) updateFields.bankName = input.bankName?.trim() || undefined;
  if (input.accountNumber !== undefined) updateFields.accountNumber = input.accountNumber?.trim() || undefined;
  if (input.ifscCode !== undefined) updateFields.ifscCode = input.ifscCode?.trim() || undefined;
  if (input.panNumber !== undefined) updateFields.panNumber = input.panNumber?.trim() || undefined;
  if (input.pfEnabled !== undefined) updateFields.pfEnabled = input.pfEnabled;
  if (input.tdsEnabled !== undefined) updateFields.tdsEnabled = input.tdsEnabled;
  if (input.notes !== undefined) updateFields.notes = input.notes?.trim() || undefined;
  if (input.isActive !== undefined) updateFields.isActive = input.isActive;

  await collection.updateOne({ id: profileId }, { $set: updateFields });
  return stripMongoId({ ...existing, ...updateFields } as StaffPayrollProfile);
}

export async function getPayrollRuns(month?: number, year?: number) {
  const collection = await getCollection<PayrollRun>(COLLECTIONS.payrollRuns);
  const query: Record<string, unknown> = {};
  if (month) query.month = month;
  if (year) query.year = year;
  return stripMongoIds(await collection.find(query).sort({ year: -1, month: -1 }).toArray());
}

export async function getPayrollRunById(runId: string) {
  const collection = await getCollection<PayrollRun>(COLLECTIONS.payrollRuns);
  const run = await collection.findOne({ id: runId });
  return run ? stripMongoId(run) : null;
}

export async function createPayrollRun(input: {
  month: number;
  year: number;
  workingDays: number;
  createdBy: string;
}) {
  const collection = await getCollection<PayrollRun>(COLLECTIONS.payrollRuns);
  const profiles = await getStaffPayrollProfiles();
  const activeProfiles = profiles.filter(p => p.isActive);
  const now = new Date().toISOString();

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const label = `${monthNames[input.month - 1]} ${input.year}`;

  const existingRun = await collection.findOne({ month: input.month, year: input.year });
  if (existingRun) {
    throw new Error(`A payroll run already exists for ${label}. Rollback or edit the existing one.`);
  }

  const slips: PayrollSlip[] = activeProfiles.map(profile => {
    const attendancePercent = 0;
    const grossPay = profile.salaryType === "monthly"
      ? profile.monthlySalary
      : profile.salaryType === "hourly"
        ? profile.hourlyRate * 8 * input.workingDays
        : profile.perClassRate * 0;
    const pfDeduction = profile.pfEnabled ? Math.round(grossPay * 0.12) : 0;
    const tdsDeduction = profile.tdsEnabled ? Math.round(grossPay * 0.10) : 0;
    const totalDeductions = pfDeduction + tdsDeduction;
    const netPay = Math.max(0, grossPay - totalDeductions);

    return {
      id: `slip-${randomUUID()}`,
      payrollRunId: "",
      staffProfileId: profile.id,
      userId: profile.userId,
      userName: profile.userName,
      employeeId: profile.employeeId,
      employmentType: profile.employmentType,
      monthlySalary: profile.monthlySalary,
      hourlyRate: profile.hourlyRate,
      perClassRate: profile.perClassRate,
      workingDays: input.workingDays,
      presentDays: 0,
      attendancePercent,
      grossPay,
      pfDeduction,
      tdsDeduction,
      advanceRecovery: 0,
      totalDeductions,
      netPay,
      status: "pending" as const,
      paidAmount: 0,
      createdAt: now,
      updatedAt: now,
    };
  });

  const totalGross = slips.reduce((s, sl) => s + sl.grossPay, 0);
  const totalDeductions = slips.reduce((s, sl) => s + sl.totalDeductions, 0);
  const totalNet = slips.reduce((s, sl) => s + sl.netPay, 0);

  const run: PayrollRun = {
    id: `pr-${randomUUID()}`,
    month: input.month,
    year: input.year,
    label,
    status: "draft",
    totalStaff: activeProfiles.length,
    profilesSetUp: activeProfiles.filter(p => p.monthlySalary > 0 || p.hourlyRate > 0 || p.perClassRate > 0).length,
    workingDays: input.workingDays,
    totalGross,
    totalDeductions,
    totalNet,
    totalSettled: 0,
    slips,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  // Set payrollRunId on each slip
  run.slips.forEach(s => { s.payrollRunId = run.id; });

  await collection.insertOne(run);
  return stripMongoId(run);
}

export async function updatePayrollSlip(
  runId: string,
  slipId: string,
  input: Partial<{
    presentDays: number;
    grossPay: number;
    pfDeduction: number;
    tdsDeduction: number;
    advanceRecovery: number;
    netPay: number;
    paidAmount: number;
    paidDate: string;
    paymentMode: string;
    transactionRef: string;
    notes: string;
    status: string;
  }>
) {
  const collection = await getCollection<PayrollRun>(COLLECTIONS.payrollRuns);
  const run = await collection.findOne({ id: runId });
  if (!run) return null;

  const slipIndex = run.slips.findIndex(s => s.id === slipId);
  if (slipIndex === -1) return null;

  const slip = run.slips[slipIndex];
  if (input.presentDays !== undefined) {
    slip.presentDays = input.presentDays;
    slip.attendancePercent = slip.workingDays > 0 ? Math.round((input.presentDays / slip.workingDays) * 100) : 0;
  }
  if (input.grossPay !== undefined) slip.grossPay = input.grossPay;
  if (input.pfDeduction !== undefined) slip.pfDeduction = input.pfDeduction;
  if (input.tdsDeduction !== undefined) slip.tdsDeduction = input.tdsDeduction;
  if (input.advanceRecovery !== undefined) slip.advanceRecovery = input.advanceRecovery;
  if (input.netPay !== undefined) slip.netPay = input.netPay;
  if (input.paidAmount !== undefined) slip.paidAmount = input.paidAmount;
  if (input.paidDate !== undefined) slip.paidDate = input.paidDate;
  if (input.paymentMode !== undefined) slip.paymentMode = input.paymentMode;
  if (input.transactionRef !== undefined) slip.transactionRef = input.transactionRef;
  if (input.notes !== undefined) slip.notes = input.notes;
  if (input.status !== undefined) slip.status = input.status as PayrollSlipStatus;
  slip.updatedAt = new Date().toISOString();

  // Recalculate totals
  run.totalGross = run.slips.reduce((s, sl) => s + sl.grossPay, 0);
  run.totalDeductions = run.slips.reduce((s, sl) => s + sl.totalDeductions, 0);
  run.totalNet = run.slips.reduce((s, sl) => s + sl.netPay, 0);
  run.totalSettled = run.slips.filter(s => s.status === "paid").reduce((s, sl) => s + sl.paidAmount, 0);
  run.updatedAt = new Date().toISOString();

  await collection.updateOne({ id: runId }, { $set: run });
  return stripMongoId(run);
}

export async function updatePayrollRunStatus(
  runId: string,
  status: PayrollRunStatus,
  userId: string,
  reason?: string
) {
  const collection = await getCollection<PayrollRun>(COLLECTIONS.payrollRuns);
  const run = await collection.findOne({ id: runId });
  if (!run) return null;

  const now = new Date().toISOString();
  run.status = status;
  run.updatedAt = now;

  if (status === "approved") {
    run.approvedBy = userId;
    run.approvedAt = now;
  } else if (status === "finalized") {
    run.finalizedBy = userId;
    run.finalizedAt = now;
  } else if (status === "settled") {
    run.settledBy = userId;
    run.settledAt = now;
  } else if (status === "rolled_back") {
    run.rolledBackBy = userId;
    run.rolledBackAt = now;
    run.rollbackReason = reason;
    run.status = "draft";
    run.slips.forEach(s => {
      s.status = "pending";
      s.paidAmount = 0;
      s.paidDate = undefined;
      s.paymentMode = undefined;
      s.transactionRef = undefined;
    });
    run.totalSettled = 0;
  }

  await collection.updateOne({ id: runId }, { $set: run });
  return stripMongoId(run);
}

export async function getPayrollRunsForFaculty(userId: string) {
  const collection = await getCollection<PayrollRun>(COLLECTIONS.payrollRuns);
  const runs = await collection.find({}).sort({ year: -1, month: -1 }).toArray();
  return stripMongoIds(
    runs
      .map(run => ({
        ...run,
        slips: run.slips.filter(s => s.userId === userId),
      }))
      .filter(run => run.slips.length > 0)
  );
}

export async function createSalaryAdvance(input: {
  userId: string;
  userName: string;
  amount: number;
  reason: string;
  createdBy: string;
}) {
  const collection = await getCollection<SalaryAdvance>(COLLECTIONS.salaryAdvances);
  const now = new Date().toISOString();
  const advance: SalaryAdvance = {
    id: `sa-${randomUUID()}`,
    userId: input.userId,
    userName: input.userName,
    amount: input.amount,
    reason: input.reason,
    status: "pending",
    createdBy: input.createdBy,
    createdAt: now,
  };
  await collection.insertOne(advance);
  return stripMongoId(advance);
}

export async function getSalaryAdvances() {
  const collection = await getCollection<SalaryAdvance>(COLLECTIONS.salaryAdvances);
  return stripMongoIds(await collection.find({}).sort({ createdAt: -1 }).toArray());
}

export async function createSalaryIncrement(input: {
  userId: string;
  userName: string;
  previousSalary: number;
  newSalary: number;
  effectiveDate: string;
  reason?: string;
  createdBy: string;
}) {
  const collection = await getCollection<SalaryIncrement>(COLLECTIONS.salaryIncrements);
  const now = new Date().toISOString();
  const increment: SalaryIncrement = {
    id: `si-${randomUUID()}`,
    userId: input.userId,
    userName: input.userName,
    previousSalary: input.previousSalary,
    newSalary: input.newSalary,
    effectiveDate: input.effectiveDate,
    reason: input.reason,
    createdBy: input.createdBy,
    createdAt: now,
  };
  await collection.insertOne(increment);

  // Also update the payroll profile
  const profileCollection = await getCollection<StaffPayrollProfile>(COLLECTIONS.staffPayrollProfiles);
  const profile = await profileCollection.findOne({ userId: input.userId });
  if (profile) {
    await profileCollection.updateOne(
      { userId: input.userId },
      { $set: { monthlySalary: input.newSalary, updatedAt: now } }
    );
  }

  return stripMongoId(increment);
}

export async function getSalaryIncrements() {
  const collection = await getCollection<SalaryIncrement>(COLLECTIONS.salaryIncrements);
  return stripMongoIds(await collection.find({}).sort({ createdAt: -1 }).toArray());
}

export async function createSalaryTransfer(input: {
  userId: string;
  userName: string;
  payrollRunId?: string;
  amount: number;
  paymentMode: string;
  transactionRef?: string;
  notes?: string;
  transferredBy: string;
  transferredByName: string;
}) {
  const collection = await getCollection<SalaryTransfer>(COLLECTIONS.salaryTransfers);
  const now = new Date().toISOString();
  const transfer: SalaryTransfer = {
    id: `st-${randomUUID()}`,
    userId: input.userId,
    userName: input.userName,
    payrollRunId: input.payrollRunId,
    amount: input.amount,
    paymentMode: input.paymentMode,
    transactionRef: input.transactionRef?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    transferredBy: input.transferredBy,
    transferredByName: input.transferredByName,
    transferredAt: now,
    createdAt: now,
  };
  await collection.insertOne(transfer);
  return stripMongoId(transfer);
}

export async function getSalaryTransfers() {
  const collection = await getCollection<SalaryTransfer>(COLLECTIONS.salaryTransfers);
  return stripMongoIds(await collection.find({}).sort({ createdAt: -1 }).toArray());
}

// =========================
// Staff Payouts (Unified)
// =========================

async function generateStaffPayoutReceiptNo() {
  const year = new Date().getFullYear();
  const prefix = `STF-REC-${year}-`;
  const collection = await getCollection<StaffPayout>(COLLECTIONS.staffPayouts);
  const latest = await collection
    .find({ id: { $regex: `^sp-${year}` } })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  let seq = 1;
  if (latest.length > 0) {
    const last = stripMongoId(latest[0]);
    const match = (last as any).receiptNo?.match(/-(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export async function getStaffPayoutsForRole(role: Role, userId?: string) {
  const collection = await getCollection<StaffPayout>(COLLECTIONS.staffPayouts);
  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ createdAt: -1 }).toArray(),
    );
  }
  if (role === "educator" && userId) {
    return stripMongoIds(
      await collection.find({ staffId: userId }).sort({ createdAt: -1 }).toArray(),
    );
  }
  return [];
}

export async function createStaffPayout(input: {
  staffId: string;
  staffName: string;
  month: string;
  title: string;
  particulars: string;
  amount: number;
  paymentMode?: string;
  transactionId?: string;
  paidDate?: string;
  createdBy: string;
}) {
  const collection = await getCollection<StaffPayout>(COLLECTIONS.staffPayouts);
  const receiptNo = await generateStaffPayoutReceiptNo();
  const now = new Date().toISOString();

  const hasPayment = input.paymentMode && input.paidDate;
  const transactions: PaymentTransaction[] = hasPayment
    ? [
        {
          paidAmount: input.amount,
          paidDate: input.paidDate!,
          paymentMode: input.paymentMode as PaymentMode,
          transactionId: input.transactionId || undefined,
          recordedBy: input.createdBy,
          recordedAt: now,
        },
      ]
    : [];

  const payout: StaffPayout & { receiptNo: string } = {
    id: `sp-${Date.now()}-${randomUUID().slice(0, 8)}`,
    receiptNo,
    staffId: input.staffId,
    staffName: input.staffName,
    month: input.month,
    title: input.title,
    particulars: input.particulars,
    amount: input.amount,
    paidAmount: hasPayment ? input.amount : 0,
    status: hasPayment ? "paid" : "unpaid",
    paymentMode: hasPayment ? input.paymentMode : undefined,
    transactionId: hasPayment ? input.transactionId : undefined,
    paidDate: hasPayment ? input.paidDate : undefined,
    transactions,
    createdBy: input.createdBy,
    createdAt: now,
  };

  await collection.insertOne(payout as any);
  return stripMongoId(payout as any) as StaffPayout & { receiptNo: string };
}

export async function updateStaffPayout(
  payoutId: string,
  input: {
    title?: string;
    particulars?: string;
    amount?: number;
    paymentMode?: string;
    transactionId?: string;
    paidDate?: string;
    month?: string;
  },
) {
  const collection = await getCollection<StaffPayout>(COLLECTIONS.staffPayouts);
  const existing = await collection.findOne({ id: payoutId });
  if (!existing) return null;

  const current = stripMongoId(existing) as StaffPayout;
  const now = new Date().toISOString();

  const updatedAmount = input.amount ?? current.amount;
  const hasPayment = input.paymentMode && input.paidDate;

  let transactions = [...(current.transactions || [])];
  if (hasPayment) {
    const alreadyHasPayment = transactions.length > 0 && current.status === "paid";
    if (!alreadyHasPayment) {
      transactions.push({
        paidAmount: updatedAmount,
        paidDate: input.paidDate!,
        paymentMode: input.paymentMode as PaymentMode,
        transactionId: input.transactionId || undefined,
        recordedBy: current.createdBy,
        recordedAt: now,
      });
    }
  }

  const totalPaid = transactions.reduce((s, t) => s + (t.paidAmount || 0), 0);
  const status: StaffPayoutStatus =
    totalPaid >= updatedAmount ? "paid"
    : totalPaid > 0 ? "partial"
    : "unpaid";

  const updateData: Record<string, unknown> = {
    title: input.title ?? current.title,
    particulars: input.particulars ?? current.particulars,
    amount: updatedAmount,
    month: input.month ?? current.month,
    paidAmount: totalPaid,
    status,
    transactions,
    paymentMode: hasPayment ? input.paymentMode : (current.paymentMode ?? undefined),
    transactionId: hasPayment ? (input.transactionId ?? undefined) : (current.transactionId ?? undefined),
    paidDate: hasPayment ? input.paidDate : (current.paidDate ?? undefined),
    updatedAt: now,
  };

  await collection.updateOne({ id: payoutId }, { $set: updateData });
  const updated = await collection.findOne({ id: payoutId });
  return updated ? stripMongoId(updated) : null;
}

export async function deleteStaffPayout(payoutId: string) {
  const collection = await getCollection<StaffPayout>(COLLECTIONS.staffPayouts);
  await collection.deleteOne({ id: payoutId });
}

// =========================
// Staff Payout Audit Logs (Append-only, immutable)
// =========================

export async function appendStaffPayoutAuditLog(entry: {
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
}): Promise<StaffPayoutAuditLog> {
  const collection = await getCollection<StaffPayoutAuditLog>(
    COLLECTIONS.staffPayoutAuditLogs,
  );
  const log: StaffPayoutAuditLog = {
    id: `spl-${Date.now()}-${randomUUID().slice(0, 8)}`,
    payoutId: entry.payoutId,
    receiptNo: entry.receiptNo,
    staffId: entry.staffId,
    staffName: entry.staffName,
    action: entry.action,
    title: entry.title,
    month: entry.month,
    amount: entry.amount,
    paidAmount: entry.paidAmount,
    previousAmount: entry.previousAmount,
    paymentMode: entry.paymentMode,
    transactionId: entry.transactionId,
    paidDate: entry.paidDate,
    changes: entry.changes,
    performedBy: entry.performedBy,
    performedByName: entry.performedByName,
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(log as any);
  return log;
}

export async function getStaffPayoutAuditLogs(filters?: {
  staffId?: string;
  action?: StaffPayoutAuditAction;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<StaffPayoutAuditLog[]> {
  const collection = await getCollection<StaffPayoutAuditLog>(
    COLLECTIONS.staffPayoutAuditLogs,
  );
  const query: Record<string, unknown> = {};
  if (filters?.staffId) query.staffId = filters.staffId;
  if (filters?.action) query.action = filters.action;
  if (filters?.dateFrom || filters?.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) (query.createdAt as any).$gte = filters.dateFrom;
    if (filters.dateTo) (query.createdAt as any).$lte = filters.dateTo + "T23:59:59.999Z";
  }
  const limit = Math.min(filters?.limit || 200, 500);
  return stripMongoIds(
    await collection.find(query).sort({ createdAt: -1 }).limit(limit).toArray(),
  );
}

export async function getStaffPayoutAuditLogsByPayout(
  payoutId: string,
): Promise<StaffPayoutAuditLog[]> {
  const collection = await getCollection<StaffPayoutAuditLog>(
    COLLECTIONS.staffPayoutAuditLogs,
  );
  return stripMongoIds(
    await collection.find({ payoutId }).sort({ createdAt: -1 }).toArray(),
  );
}

// ═══ Fee Deletion Audit Log ═══

export async function appendFeeDeletionAuditLog(entry: Omit<FeeDeletionAuditLog, "id" | "createdAt">) {
  const collection = await getCollection<FeeDeletionAuditLog>(COLLECTIONS.feeDeletionAuditLogs);
  const log: FeeDeletionAuditLog = {
    id: `fdl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...entry,
    createdAt: new Date().toISOString(),
  };
  await collection.insertOne(log as any);
  return log;
}

export async function getFeeDeletionAuditLogs(filters?: {
  studentSearch?: string;
  deletedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMode?: string;
  limit?: number;
}) {
  const collection = await getCollection<FeeDeletionAuditLog>(COLLECTIONS.feeDeletionAuditLogs);
  const query: Record<string, unknown> = {};

  if (filters?.studentSearch) {
    query.$or = [
      { studentName: { $regex: filters.studentSearch, $options: "i" } },
      { studentAdmNo: { $regex: filters.studentSearch, $options: "i" } },
      { receiptNo: { $regex: filters.studentSearch, $options: "i" } },
    ];
  }
  if (filters?.deletedBy) {
    query.performedByName = { $regex: filters.deletedBy, $options: "i" };
  }
  if (filters?.dateFrom || filters?.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
    if (filters.dateTo) (query.createdAt as Record<string, unknown>).$lte = filters.dateTo + "T23:59:59.999Z";
  }
  if (filters?.paymentMode) {
    query.paymentMode = { $regex: filters.paymentMode, $options: "i" };
  }

  const logs = await collection.find(query).sort({ createdAt: -1 }).limit(filters?.limit ?? 200).toArray();
  return stripMongoIds(logs);
}

export async function getFeeDeletionAuditLogStats() {
  const collection = await getCollection<FeeDeletionAuditLog>(COLLECTIONS.feeDeletionAuditLogs);
  const all = await collection.find({}).toArray();
  const now = new Date();
  const thisMonth = all.filter((l) => {
    const d = new Date(l.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  return {
    totalDeletions: all.length,
    thisMonth: thisMonth.length,
    totalPrincipalDeleted: all.reduce((s, l) => s + (l.principalAmount || 0), 0),
    totalNetReversed: all.reduce((s, l) => s + (l.netReversed || 0), 0),
    totalFineReversed: all.reduce((s, l) => s + (l.fineAmount || 0), 0),
  };
}
