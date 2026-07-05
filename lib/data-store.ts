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
  Batch,
  CourseItem,
  DashboardMetric,
  DashboardBundle,
  DemoCredential,
  FeeInvoice,
  FeeInstallment,
  FeeInstallmentPlan,
  LectureItem,
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
  TeacherBatchAssignment,
  TestItem,
  TestQuestion,
  TestSubmission,
  UserProfile,
  WeeklyTest,
  BehaviourNote,
  TeacherFeedback,
  TeacherPayout,
  AppNotification,
  StudentDailyActivity,
  DashboardAnalytics,
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
};

type MessageDocument = MessageItem & {
  audience?: Role[] | Role | null;
  userIds?: string[] | string | null;
  createdAt?: string | Date | null;
  expiresAt?: string | Date | null;
};

const COLLECTIONS = {
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

  batches: "batches",
  teacherBatchAssignments: "teacherBatchAssignments",
  weeklyTests: "weeklyTests",
  teacherFeedback: "teacherFeedback",
  behaviourNotes: "behaviourNotes",
  dailyActivities: "dailyActivities",
  feeInstallmentPlans: "feeInstallmentPlans",
  teacherPayouts: "teacherPayouts",
  notifications: "notifications",

  crmLeads: "crmLeads",
  crmStaff: "crmStaff",

  enquiries: "enquiries",
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
    suggestedCourses: input.suggestedCourses?.length ? input.suggestedCourses : [],
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

async function getCollection<T extends Document>(
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

  return {
    id: document.id,
    category: document.category ?? template.category,
    stream: document.stream ?? template.stream ?? "General",
    sections: document.sections?.length
      ? (() => {
          const valid = document.sections.filter((s) =>
            template.sections.includes(s),
          );
          return valid.length ? valid : template.sections;
        })()
      : template.sections,
    statusLabel: document.statusLabel ?? template.statusLabel,
    standardKey: templateKey,
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
    audience: document.audience?.length ? document.audience : template.audience,
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
  createdBy: string;
  assignedUserIds: string[];
  questions: TestQuestion[];
}) {
  const test: TestItem & { createdAt: string } = {
    id: randomUUID(),
    title: input.title,
    status: input.status,
    summary: input.summary,
    audience: ["student", "educator", "admin", "parent"],
    assignedUserIds: input.assignedUserIds,
    createdBy: input.createdBy,
    questions: input.questions,
    createdAt: new Date().toISOString(),
  };

  const collection = await getCollection<typeof test>(COLLECTIONS.tests);
  await collection.insertOne(test);
  return test;
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

type NotificationTargetMode = "everyone" | "selected-users";

export async function getNotificationsForUser(userId: string) {
  const collection = await getCollection<AppNotification>(
    COLLECTIONS.notifications,
  );

  return stripMongoIds(
    await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray(),
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

export async function getUsersForAdmin() {
  const collection = await getUsersCollection();

  const users = await collection.find({}).sort({ name: 1 }).toArray();

  return users.map(toManagedUser);
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

export async function getStudentDirectory() {
  const collection = await getUsersCollection();
  const students = await collection
    .find({ role: "student" })
    .sort({ name: 1 })
    .toArray();
  return students.map(toManagedUser);
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
}) {
  const collection = await getUsersCollection();
  const document: Partial<UserDocument> = {
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
    document.verified = input.verified;
  }

  await collection.updateOne({ id: input.id }, { $set: document });
  const updated = await collection.findOne({ id: input.id });

  if (!updated) {
    throw new Error("Updated user could not be found in MongoDB.");
  }

  return toManagedUser(updated);
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

export async function getAttendanceSheetsForRole(role: Role, userId?: string) {
  const collection = await getCollection<AttendanceSheet>(
    COLLECTIONS.attendanceSheets,
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
        .find({ createdBy: userId })
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
      .find({ "records.studentId": linkedStudentId })
      .sort({ date: -1, createdAt: -1 })
      .toArray(),
  );
}

export async function createAttendanceSheet(input: {
  title: string;
  date: string;
  batchName?: string;
  batchId?: string;
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
    batchName: input.batchName,
    batchId: input.batchId,
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
    batchName: string;
    batchId: string;
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

export async function getFeeInvoicesForRole(role: Role, userId?: string) {
  const collection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);

  if (role === "admin" || role === "educator") {
    return stripMongoIds(
      await collection.find({}).sort({ createdAt: -1 }).toArray(),
    );
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
  const batches = await getCollection<Batch>(COLLECTIONS.batches);

  const [student, parent, activeBatchDocuments] = await Promise.all([
    users.findOne({
      id: normalizedStudentId,
      role: "student",
    }),

    users.findOne({
      role: "parent",
      linkedStudentId: normalizedStudentId,
    }),

    batches
      .find({
        studentIds: normalizedStudentId,
        status: "active",
      })
      .sort({
        updatedAt: -1,
        createdAt: -1,
      })
      .toArray(),
  ]);

  if (!student) {
    return null;
  }

  const activeBatch = stripMongoIds(activeBatchDocuments)[0];

  const selectedDate = dueDate
    ? new Date(`${dueDate}T12:00:00`)
    : new Date();

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

    parentName:
      parent?.name ||
      student.profile?.parentName ||
      "",

    classCourse:
      activeBatch?.courseName?.trim() ||
      student.program?.trim() ||
      "",

    batch: activeBatch?.name?.trim() || "",

    rollNo: "",

    academicYear: `${academicStartYear}-${String(
      academicStartYear + 1,
    ).slice(-2)}`,

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
  batch?: string;
  rollNo?: string;
  academicYear?: string;
  mobileNo?: string;
  particulars?: string;
  month?: string;
  paymentMode?: string;
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
    batch: input.batch,
    rollNo: input.rollNo,
    academicYear: input.academicYear,
    mobileNo: input.mobileNo,
    particulars: input.particulars,
    month: input.month,
    paymentMode: input.paymentMode,
  };

  await collection.insertOne(invoice);

  return stripMongoId(invoice);
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
  }>,
) {
  const collection = await getCollection<FeeInvoice>(COLLECTIONS.feeInvoices);

  const update = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await collection.updateOne({ id: invoiceId }, { $set: update });

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
  batchName?: string;
  batchId?: string;
  teacherId?: string;
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
    batchName: input.batchName,
    batchId: input.batchId,
    teacherId: input.teacherId ?? input.createdBy,
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
    batchName: string;
    description: string;
    startsAt: string;
    endsAt: string;
    meetingLink: string;
    recordingLink: string;
    materialLink: string;
    assignedStudentIds: string[];
    status: LectureItem["status"];
    batchId: string;
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
  batches: Batch[];
  lectures: LectureItem[];
  teacherPayouts: TeacherPayout[];
  users: ManagedUser[];
}): DashboardAnalytics {
  const targetStudentId = input.studentId;

  const attendanceRecords = input.attendanceSheets.flatMap((sheet) =>
    sheet.records
      .filter(
        (record) =>
          !targetStudentId || record.studentId === targetStudentId,
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
      if (
        targetStudentId &&
        result.studentId !== targetStudentId
      ) {
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
      percentage: getAnalyticsPercent(
        value.obtainedMarks,
        value.totalMarks,
      ) ?? 0,
      resultCount: value.resultCount,
    }))
    .sort((left, right) => right.percentage - left.percentage)
    .slice(0, 4);

  const learningActivities = input.dailyActivities.filter(
    (activity) =>
      !targetStudentId || activity.studentId === targetStudentId,
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

  const learningRates = [
    homeworkRate,
    assignmentRate,
    revisionRate,
  ].filter((value): value is number => value !== null);

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
        typeof minutes === "number" &&
        Number.isFinite(minutes) &&
        minutes >= 0,
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

  const activeBatches = input.batches.filter(
    (batch) => batch.status === "active",
  );

  const batchLearnerIds = new Set(
    activeBatches.flatMap((batch) => batch.studentIds),
  );

  const activeStudents = input.users.filter(
    (user) => user.role === "student" && user.status === "active",
  ).length;

  const learners =
    input.role === "admin"
      ? Math.max(activeStudents, batchLearnerIds.size)
      : batchLearnerIds.size;

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

  const attendanceValue =
    attendanceRate === null ? "—" : `${attendanceRate}%`;

  const assessmentValue =
    averageScore === null ? "—" : `${averageScore}%`;

  const learningValue =
    completionRate === null ? "—" : `${completionRate}%`;

  let metrics: DashboardMetric[];

  if (input.role === "admin") {
    metrics = [
      {
        label: "Active Learners",
        value: `${learners}`,
        detail: "Active student accounts and enrolled batch learners",
      },
      {
        label: "Active Batches",
        value: `${activeBatches.length}`,
        detail: "Current active batches across the institute",
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
        label: "Assigned Batches",
        value: `${activeBatches.length}`,
        detail: "Active batches assigned to your account",
      },
      {
        label: "Learners",
        value: `${learners}`,
        detail: "Unique students in your active batches",
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
      activeBatches: activeBatches.length,
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
    batches,
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
    getBatchesForRole(role, userId),
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
    batches,
    lectures,
    teacherPayouts,
    users,
  });

  return {
    roleLabel: user?.label ?? template.roleLabel,
    heroTitle: buildHeroTitle(role, template, user),
    heroDescription: template.heroDescription,
    stats: template.stats,
    primaryPanel: template.primaryPanel,
    permissions: template.permissions,
    courses: role === "admin" ? courses : courses.slice(0, 3),
    tests: tests.slice(0, 4),
    messages: messages.slice(0, 6),
    submissions: submissions.slice(0, 6),
    attendanceSheets,
    feeInvoices,
    lectures,
    linkedStudentId: userDoc?.linkedStudentId,
    profile: userDoc?.profile,
    analytics,
  };
}

async function findFullUserById(id: string) {
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
  filter: { studentId?: string; batchName?: string } = {},
) {
  const collection = await getCollection<PerformanceReport>(
    COLLECTIONS.performance,
  );
  const query: any = {};
  if (filter.studentId) query.studentId = filter.studentId;
  if (filter.batchName) query.batchName = filter.batchName;

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

export async function getBatchesForRole(role: Role, userId?: string) {
  const collection = await getCollection<Batch>(COLLECTIONS.batches);

  if (role === "admin") {
    return stripMongoIds(
      await collection.find({}).sort({ createdAt: -1 }).toArray(),
    );
  }

  if (role === "educator") {
    if (!userId) return [];

    return stripMongoIds(
      await collection
        .find({ teacherIds: userId, status: "active" })
        .sort({ createdAt: -1 })
        .toArray(),
    );
  }

  const linkedStudentId = await getLinkedStudentIdForViewer(role, userId);

  if (!linkedStudentId) return [];

  return stripMongoIds(
    await collection
      .find({ studentIds: linkedStudentId, status: "active" })
      .sort({ createdAt: -1 })
      .toArray(),
  );
}

export async function createBatch(input: {
  name: string;
  courseId?: string;
  courseName?: string;
  subject?: string;
  schedule?: string;
  studentIds?: string[];
  teacherIds?: string[];
  createdBy: string;
}) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Batch name is required.");
  }

  const collection = await getCollection<Batch>(COLLECTIONS.batches);
  const now = new Date().toISOString();

  const batch: Batch = {
    id: `batch-${randomUUID()}`,
    name,
    courseId: input.courseId?.trim() || undefined,
    courseName: input.courseName?.trim() || undefined,
    subject: input.subject?.trim() || undefined,
    schedule: input.schedule?.trim() || undefined,
    studentIds: [...new Set(input.studentIds ?? [])],
    teacherIds: [...new Set(input.teacherIds ?? [])],
    status: "active",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(batch);

  return batch;
}

export async function updateBatch(
  batchId: string,
  input: Partial<{
    name: string;
    courseId: string;
    courseName: string;
    subject: string;
    schedule: string;
    studentIds: string[];
    teacherIds: string[];
    status: "active" | "archived";
  }>,
) {
  const collection = await getCollection<Batch>(COLLECTIONS.batches);

  const updates: Partial<Batch> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof input.name === "string") {
    updates.name = input.name.trim();
  }

  if (typeof input.courseId === "string") {
    updates.courseId = input.courseId.trim() || undefined;
  }

  if (typeof input.courseName === "string") {
    updates.courseName = input.courseName.trim() || undefined;
  }

  if (typeof input.subject === "string") {
    updates.subject = input.subject.trim() || undefined;
  }

  if (typeof input.schedule === "string") {
    updates.schedule = input.schedule.trim() || undefined;
  }

  if (Array.isArray(input.studentIds)) {
    updates.studentIds = [...new Set(input.studentIds)];
  }

  if (Array.isArray(input.teacherIds)) {
    updates.teacherIds = [...new Set(input.teacherIds)];
  }

  if (input.status === "active" || input.status === "archived") {
    updates.status = input.status;
  }

  await collection.updateOne({ id: batchId }, { $set: updates });

  const updatedBatch = await collection.findOne({ id: batchId });
  return updatedBatch ? stripMongoId(updatedBatch) : null;
}

export async function assignTeacherToBatch(input: {
  batchId: string;
  teacherId: string;
  subject?: string;
  assignedBy: string;
}) {
  const batchCollection = await getCollection<Batch>(COLLECTIONS.batches);
  const assignmentCollection = await getCollection<TeacherBatchAssignment>(
    COLLECTIONS.teacherBatchAssignments,
  );

  const batch = await batchCollection.findOne({ id: input.batchId });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  const existingAssignment = await assignmentCollection.findOne({
    batchId: input.batchId,
    teacherId: input.teacherId,
  });

  const now = new Date().toISOString();

  if (!existingAssignment) {
    const assignment: TeacherBatchAssignment = {
      id: `teacher-batch-${randomUUID()}`,
      batchId: input.batchId,
      teacherId: input.teacherId,
      subject: input.subject?.trim() || undefined,
      assignedAt: now,
      assignedBy: input.assignedBy,
    };

    await assignmentCollection.insertOne(assignment);
  }

  await batchCollection.updateOne(
    { id: input.batchId },
    {
      $set: {
        teacherIds: [
          ...new Set([...(batch.teacherIds ?? []), input.teacherId]),
        ],
        updatedAt: now,
      },
    },
  );

  const updatedBatch = await batchCollection.findOne({ id: input.batchId });
  return updatedBatch ? stripMongoId(updatedBatch) : null;
}

export async function removeTeacherFromBatch(input: {
  batchId: string;
  teacherId: string;
}) {
  const batchCollection = await getCollection<Batch>(COLLECTIONS.batches);
  const assignmentCollection = await getCollection<TeacherBatchAssignment>(
    COLLECTIONS.teacherBatchAssignments,
  );

  const batch = await batchCollection.findOne({ id: input.batchId });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  await assignmentCollection.deleteOne({
    batchId: input.batchId,
    teacherId: input.teacherId,
  });

  await batchCollection.updateOne(
    { id: input.batchId },
    {
      $set: {
        teacherIds: (batch.teacherIds ?? []).filter(
          (teacherId) => teacherId !== input.teacherId,
        ),
        updatedAt: new Date().toISOString(),
      },
    },
  );

  const updatedBatch = await batchCollection.findOne({ id: input.batchId });
  return updatedBatch ? stripMongoId(updatedBatch) : null;
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
  batchId: string;
  batchName: string;
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

  if (!input.batchId) {
    throw new Error("Batch is required.");
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
    batchId: input.batchId,
    batchName: input.batchName.trim(),
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
  batchId?: string;
  batchName?: string;
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
    batchId: input.batchId,
    batchName: input.batchName?.trim() || undefined,
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

export async function getBehaviourNotesForRole(role: Role, userId?: string) {
  const collection = await getCollection<BehaviourNote>(
    COLLECTIONS.behaviourNotes,
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

export async function createBehaviourNote(input: {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName?: string;
  batchId?: string;
  batchName?: string;
  rating: BehaviourNote["rating"];
  note: string;
  actionTaken?: string;
  visibleToParent: boolean;
  resolved?: boolean;
}) {
  if (!input.studentId) {
    throw new Error("Student is required.");
  }

  if (!input.teacherId) {
    throw new Error("Teacher is required.");
  }

  if (!input.note.trim()) {
    throw new Error("Behaviour note is required.");
  }

  const collection = await getCollection<BehaviourNote>(
    COLLECTIONS.behaviourNotes,
  );

  const now = new Date().toISOString();

  const behaviourNote: BehaviourNote = {
    id: `behaviour-${randomUUID()}`,
    studentId: input.studentId,
    studentName: input.studentName.trim(),
    teacherId: input.teacherId,
    teacherName: input.teacherName?.trim() || undefined,
    batchId: input.batchId,
    batchName: input.batchName?.trim() || undefined,
    rating: input.rating,
    note: input.note.trim(),
    actionTaken: input.actionTaken?.trim() || undefined,
    visibleToParent: input.visibleToParent,
    resolved: input.resolved ?? false,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(behaviourNote);

  return stripMongoId(behaviourNote);
}

export async function updateBehaviourNote(
  behaviourNoteId: string,
  input: Partial<{
    rating: BehaviourNote["rating"];
    note: string;
    actionTaken: string;
    visibleToParent: boolean;
    resolved: boolean;
  }>,
) {
  const collection = await getCollection<BehaviourNote>(
    COLLECTIONS.behaviourNotes,
  );

  const updates: Partial<BehaviourNote> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.rating) {
    updates.rating = input.rating;
  }

  if (typeof input.note === "string") {
    if (!input.note.trim()) {
      throw new Error("Behaviour note cannot be empty.");
    }

    updates.note = input.note.trim();
  }

  if (typeof input.actionTaken === "string") {
    updates.actionTaken = input.actionTaken.trim() || undefined;
  }

  if (typeof input.visibleToParent === "boolean") {
    updates.visibleToParent = input.visibleToParent;
  }

  if (typeof input.resolved === "boolean") {
    updates.resolved = input.resolved;
  }

  await collection.updateOne({ id: behaviourNoteId }, { $set: updates });

  const updatedNote = await collection.findOne({ id: behaviourNoteId });

  return updatedNote ? stripMongoId(updatedNote) : null;
}

export async function deleteBehaviourNote(behaviourNoteId: string) {
  const collection = await getCollection<BehaviourNote>(
    COLLECTIONS.behaviourNotes,
  );

  const result = await collection.deleteOne({ id: behaviourNoteId });

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
  participation: StudentDailyActivity["participation"];

  studyMinutes?: number;
  teacherVerified: boolean;
  teacherNote?: string;

  visibleToParent: boolean;
}) {
  if (!input.studentId) {
    throw new Error("Student is required.");
  }

  if (!input.batchId) {
    throw new Error("Batch is required.");
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

    batchId: input.batchId,
    batchName: input.batchName.trim(),

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

      if (
        !Number.isInteger(installmentNumber) ||
        installmentNumber < 1
      ) {
        throw new Error("Each installment must have a valid installment number.");
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
        status: getInstallmentStatus(
          amount,
          paidAmount,
          installment.dueDate,
        ),
        receiptNumber: installment.receiptNumber?.trim() || undefined,
        paymentMode: installment.paymentMode?.trim() || undefined,
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
    status:
      pendingAmount === 0
        ? ("completed" as const)
        : ("active" as const),
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
      await collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray(),
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
  batchName?: string;
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
    batchName: input.batchName?.trim() || undefined,
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
    batchName: string;
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
  }>,
) {
  const collection = await getCollection<FeeInstallmentPlan>(
    COLLECTIONS.feeInstallmentPlans,
  );

  const existingPlan = await collection.findOne({ id: planId });

  if (!existingPlan) {
    return null;
  }

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

  if (typeof input.batchName === "string") {
    updates.batchName = input.batchName.trim() || undefined;
  }

  if (typeof input.academicYear === "string") {
    updates.academicYear = input.academicYear.trim() || undefined;
  }

  if (typeof input.notes === "string") {
    updates.notes = input.notes.trim() || undefined;
  }

  if (Array.isArray(input.installments)) {
    const normalizedInstallments = normalizeInstallments(input.installments);
    const amounts = calculatePlanAmounts(normalizedInstallments);

    updates.installments = normalizedInstallments;
    updates.totalFee = amounts.totalFee;
    updates.paidAmount = amounts.paidAmount;
    updates.pendingAmount = amounts.pendingAmount;
    updates.status = amounts.status;
  }

  if (
    input.status === "cancelled" &&
    existingPlan.paidAmount === 0
  ) {
    updates.status = "cancelled";
  }

  await collection.updateOne(
    { id: planId },
    { $set: updates },
  );

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

export async function getTeacherPayoutsForRole(
  role: Role,
  userId?: string,
) {
  const collection = await getCollection<TeacherPayout>(
    COLLECTIONS.teacherPayouts,
  );

  if (role === "admin") {
    return stripMongoIds(
      await collection
        .find({})
        .sort({ month: -1, createdAt: -1 })
        .toArray(),
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
    bonus:
      typeof input.bonus === "number" ? input.bonus : existingPayout.bonus,
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

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).getTime();

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
      lead.demo.status === "scheduled" ||
      lead.demo.status === "rescheduled",
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
      admissions: matchingLeads.filter(
        (lead) => lead.status === "admitted",
      ).length,
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
    await collection
      .find({})
      .sort({ active: -1, name: 1 })
      .toArray(),
  );
}

export async function getCrmAdminWorkspace() {
  const [leads, staff] = await Promise.all([
    getCrmLeads(),
    getCrmStaff(),
  ]);

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
    status:
      input.interest === "not-interested" ? "lost" : input.status,
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
      | "id"
      | "createdAt"
      | "updatedAt"
      | "activityLog"
      | "demo"
      | "admission"
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
      : input.updates.status ?? existing.status;

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

  if (
    existing.linkedUserId &&
    existing.linkedUserId !== input.userId
  ) {
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

  await collection.updateOne(
    { id: existing.id },
    { $set: updated },
  );

  return updated;
}