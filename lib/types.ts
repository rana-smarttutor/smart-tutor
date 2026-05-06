export type Role = "student" | "educator" | "admin";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  label: string;
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
  status: "active" | "pending";
  passwordHint?: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type PermissionItem = {
  title: string;
  description: string;
};

export type CourseItem = {
  id: string;
  standardKey: string;
  tagline: string;
  title: string;
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
};

export type ContactAction = {
  label: string;
  href: string;
  style: "primary" | "secondary";
};

export type DetailedCourse = CourseItem;

export type InstituteProfile = {
  name: string;
  city: string;
  address: string;
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

export type DashboardPrimaryPanel = {
  title: string;
  badge: string;
  items: { title: string; description: string; meta: string }[];
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
};
