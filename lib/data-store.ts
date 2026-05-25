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
  CourseItem,
  DashboardBundle,
  DashboardMetric,
  DemoCredential,
  ManagedUser,
  MessageItem,
  PermissionItem,
  PublicInstituteData,
  QuizQuestion,
  Role,
  SessionUser,
  TestItem,
  TestQuestion,
  TestSubmission,
  LibraryBook,
  PerformanceHeuristics,
  PerformanceReport,
} from "@/lib/types";

type DashboardTemplate = {
  roleLabel: string;
  heroTitle: string;
  heroDescription: string;
  stats: DashboardMetric[];
  primaryPanel: DashboardBundle["primaryPanel"];
  permissions: PermissionItem[];
};

type UserDocument = SessionUser & {
  password: string;
  program: string;
  emailKey?: string;
  status?: "active" | "pending";
  permissions?: PermissionItem[];
  createdAt?: string;
  updatedAt?: string;
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
} as const;

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
      await collection.updateMany(
        {},
        [
          {
            $set: {
              emailKey: { $toLower: "$email" },
            },
          },
        ],
      );
      await Promise.all([
        collection.createIndex({ id: 1 }, { unique: true, name: "users_unique_id" }),
        collection.createIndex({ emailKey: 1 }, { unique: true, name: "users_unique_emailKey" }),
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
  };
}

function toManagedUser(user: UserDocument): ManagedUser {
  return {
    ...toSessionUser(user),
    program: user.program,
    status: user.status ?? "active",
    passwordHint: user.password,
  };
}

function getRoleLabel(role: Role) {
  if (role === "admin") return "Admin Console";
  if (role === "educator") return "Educator Desk";
  if (role === "student") return "Student Workspace";
  return "Student Workspace";
}

function buildHeroTitle(role: Role, template: DashboardTemplate, user: SessionUser | null) {
  if (!user) {
    return template.heroTitle;
  }

  if (role === "student") {
    return `Welcome back, ${user.name.split(" ")[0]}`;
  }

  if (role === "educator") {
    return `Educator Console | ${user.name}`;
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
    getCourseTemplateByKey(templateKey) ?? getCourseTemplateByKey(DEFAULT_COURSE_TEMPLATE_KEY);

  if (!template) {
    throw new Error("Default course template could not be resolved.");
  }

  return {
    id: document.id,
    category: document.category ?? template.category,
    sections: document.sections?.length ? document.sections : template.sections,
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
    courseNamesIncluded:
      document.courseNamesIncluded?.length ? document.courseNamesIncluded : template.courseNamesIncluded,
    branchesIncluded:
      document.branchesIncluded?.length ? document.branchesIncluded : template.branchesIncluded,
    subjectsCovered:
      document.subjectsCovered?.length ? document.subjectsCovered : template.subjectsCovered,
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
      getCourseTemplateOrder(left.standardKey) - getCourseTemplateOrder(right.standardKey);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return left.title.localeCompare(right.title);
  });
}

async function ensureStandardCoursesBackfilled() {
  if (!standardCoursesBackfillPromise) {
    standardCoursesBackfillPromise = (async () => {
      const collection = await getCollection<CourseItem & { createdAt?: string; createdBy?: string }>(
        COLLECTIONS.courses,
      );
      const existingCourses = stripMongoIds(await collection.find({}).toArray());

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

      const normalizedCourses = stripMongoIds(await collection.find({}).toArray());
      const existingKeys = new Set(
        normalizedCourses
          .map((course) => course.standardKey ?? inferCourseTemplateKey(course.title))
          .filter((key): key is string => Boolean(key)),
      );

      const missingTemplates = courseLibrary.filter((template) => !existingKeys.has(template.standardKey));

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
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
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

function isMessageVisibleToUser(message: MessageItem, role: Role, userId?: string) {
  if (!message.audience.includes(role)) {
    return false;
  }

  if (!message.userIds?.length) {
    return true;
  }

  return userId ? message.userIds.includes(userId) : false;
}

function normalizePublicInstituteData(document: PublicInstituteData): PublicInstituteData {
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

export async function getPublicInstituteData() {
  const document = await getContentDocument<PublicInstituteData>("public-site");
  return normalizePublicInstituteData(document);
}

export async function getMockQuizQuestions() {
  const collection = await getCollection<QuizQuestion>(COLLECTIONS.quizzes);
  return stripMongoIds(await collection.find({}).toArray());
}

export async function getDemoCredentials() {
  const collection = await getUsersCollection();
  const documents = await collection
    .find({
      role: { $in: ["student", "educator", "admin"] as Role[] },
    })
    .toArray();

  const byRole = new Map(documents.map((document) => [document.role, document]));

  return (["student", "educator", "admin"] as const)
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
  const emailLocalPart = normalizedLogin.includes("@")
    ? normalizedLogin.split("@")[0]
    : normalizedLogin;
  const user = await collection.findOne({
    password,
    $or: [
      { email: normalizedLogin },
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
  });
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
  const hydrated = stripMongoIds(await collection.find({ audience: role }).toArray()).map((course) =>
    hydrateCourse(course),
  );
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

  const collection = await getCollection<CourseItem & { createdAt?: string; createdBy?: string }>(
    COLLECTIONS.courses,
  );
  const existing = await collection.findOne({ standardKey: input.standardKey });

  if (existing) {
    throw new Error("This standardized course already exists. Edit the existing course instead.");
  }

  const course: CourseItem & { createdAt: string; createdBy: string } = {
    id: randomUUID(),
    category: template.category,
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
    throw new Error("This standardized course already exists. Edit the existing course instead.");
  }

  await collection.updateOne(
    { id: input.id },
    {
      $set: {
        standardKey: input.standardKey,
        category: template.category,
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
  const hydrated = stripMongoIds(await collection.find({}).toArray()).map((course) =>
    hydrateCourse(course),
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
      await collection.find({ audience: role, assignedUserIds: userId }).toArray(),
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
    audience: ["student", "educator", "admin"],
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
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
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
    audience: input.audience?.length ? input.audience : ["student", "educator", "admin"],
    userIds: input.userIds?.length ? input.userIds : undefined,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt ?? null,
  };

  const collection = await getCollection<typeof message>(COLLECTIONS.messages);
  await collection.insertOne(message);
  return message;
}

export async function getUsersForAdmin() {
  const collection = await getUsersCollection();
  const users = await collection.find({}).sort({ name: 1 }).toArray();
  return users.map(toManagedUser);
}

export async function getStudentDirectory() {
  const collection = await getUsersCollection();
  const students = await collection.find({ role: "student" }).sort({ name: 1 }).toArray();
  return students.map(toManagedUser);
}

export async function createUserRecord(input: {
  name: string;
  email: string;
  role: Role;
  password: string;
  program: string;
  status?: "active" | "pending";
}) {
  const document: UserDocument = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    emailKey: input.email.toLowerCase(),
    role: input.role,
    label: getRoleLabel(input.role),
    password: input.password,
    program: input.program,
    status: input.status ?? "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  status?: "active" | "pending";
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

export async function getTestSubmissionsForRole(role: Role, userId?: string) {
  const collection = await getCollection<TestSubmission>(COLLECTIONS.submissions);

  if (role === "student") {
    return stripMongoIds(
      await collection.find({ studentId: userId }).sort({ submittedAt: -1 }).toArray(),
    );
  }

  if (role === "educator" || role === "admin") {
    return stripMongoIds(await collection.find({}).sort({ submittedAt: -1 }).toArray());
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

  const submissions = await getCollection<TestSubmission>(COLLECTIONS.submissions);
  await submissions.insertOne(submission);
  return { submission };
}

export async function gradeSubmission(input: {
  submissionId: string;
  score: number;
  feedback?: string;
  gradedBy: string;
}) {
  const submissions = await getCollection<TestSubmission>(COLLECTIONS.submissions);
  const submission = await submissions.findOne({ id: input.submissionId });

  if (!submission) {
    return null;
  }

  const publishedMessageTitle = `${submission.studentName} result published`;
  const updatedSubmission: TestSubmission = {
    ...submission,
    score: input.score,
    status: "published",
    feedback: input.feedback || `Result reviewed and published by ${input.gradedBy}.`,
    gradedBy: input.gradedBy,
    publishedMessageTitle,
  };

  await submissions.updateOne({ id: input.submissionId }, { $set: updatedSubmission });

  const message = await createMessage({
    title: publishedMessageTitle,
    body: `${submission.studentName}'s test review has been completed and the result is now available on the board.`,
    channel: "Results",
    audience: ["student", "educator", "admin"],
    userIds: [submission.studentId],
    author: input.gradedBy,
  });

  return {
    submission: updatedSubmission,
    message,
  };
}

export async function getDashboardBundle(role: Role, userId?: string): Promise<DashboardBundle> {
  const config = await getContentDocument<{ templates: Record<Role, DashboardTemplate> }>("dashboard-config");
  const template = config.templates[role];
  const user = userId ? await findUserById(userId) : null;
  const [courses, tests, messages, submissions] = await Promise.all([
    getCoursesForRole(role),
    getTestsForRole(role, userId),
    getMessagesForRole(role, userId),
    getTestSubmissionsForRole(role, userId),
  ]);

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
  };
}

export async function getLibraryBooksForRole(role: Role) {
  const collection = await getCollection<LibraryBook>(COLLECTIONS.library);
  return stripMongoIds(
    await collection
      .find({ audience: role })
      .sort({ createdAt: -1 })
      .toArray(),
  );
}

export async function getLibraryBookById(id: string) {
  const collection = await getCollection<LibraryBook>(COLLECTIONS.library);
  const book = await collection.findOne({ id });
  return book ? stripMongoId(book) : null;
}

export async function createLibraryBook(input: Omit<LibraryBook, "id" | "createdAt">) {
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

export async function getPerformanceReports(filter: { studentId?: string; batchName?: string } = {}) {
  const collection = await getCollection<PerformanceReport>(COLLECTIONS.performance);
  const query: any = {};
  if (filter.studentId) query.studentId = filter.studentId;
  if (filter.batchName) query.batchName = filter.batchName;
  
  return stripMongoIds(
    await collection.find(query).sort({ createdAt: -1 }).toArray()
  );
}

export async function createPerformanceReport(input: Omit<PerformanceReport, "id" | "createdAt">) {
  const report: PerformanceReport = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };

  const collection = await getCollection<PerformanceReport>(COLLECTIONS.performance);
  await collection.insertOne(report);
  return report;
}

export async function getPerformanceHeuristics(educatorId: string) {
  const collection = await getCollection<{ educatorId: string; heuristics: PerformanceHeuristics }>(
    COLLECTIONS.heuristics
  );
  const document = await collection.findOne({ educatorId });
  return document ? document.heuristics : DEFAULT_HEURISTICS;
}

export async function savePerformanceHeuristics(educatorId: string, heuristics: PerformanceHeuristics) {
  const collection = await getCollection<{ educatorId: string; heuristics: PerformanceHeuristics }>(
    COLLECTIONS.heuristics
  );
  await collection.updateOne(
    { educatorId },
    { $set: { heuristics } },
    { upsert: true }
  );
  return heuristics;
}

