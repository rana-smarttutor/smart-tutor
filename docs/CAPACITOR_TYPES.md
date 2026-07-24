## Shared Types (src/types/)

### src/types/auth.ts

```ts
export type Role = 'student' | 'educator' | 'admin' | 'parent' | 'counsellor';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  label: string;
  status?: 'active' | 'pending' | 'rejected';
  verified?: boolean;
}

export interface LoginRequest {
  login: string;    // email, mobile, or name
  password: string;
}

export interface LoginResponse {
  user: SessionUser;
}

export interface SignupRequest {
  role?: string;
  name?: string;
  email?: string;
  password?: string;
  mobile?: string;
  dob?: string;
  parentName?: string;
  parentEmail?: string;
  parentMobile?: string;
  parentPassword?: string;
  courseWanted?: string;
  courseWantedTitle?: string;
  studentType?: string;
  campusLocation?: string;
  referralCode?: string;
  weakSubjects?: string[];
  strongSubjects?: string[];
  latestQualification?: string;
  latestAcademicScore?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profilePhoto?: string;
  confirmPassword?: string;
  qualification?: string;
  cvUrl?: string;
  photoIdFrontUrl?: string;
  photoIdBackUrl?: string;
  experience?: string;
  subjects?: string[];
  examQualifications?: { examName: string; score?: string; year?: string }[];
}

export interface ForgotPasswordRequest {
  name: string;
  email: string;
  phone: string;
  lastPassword: string;
  role?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

### src/types/users.ts

```ts
import { Role } from './auth';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: Role;
  label: string;
  status?: 'active' | 'pending' | 'rejected';
  verified?: boolean;
  program?: string;
  assignedFacultyIds?: string[];
  assignedFacultyNames?: string[];
  parentEmail?: string;
  parentMobile?: string;
  linkedStudentId?: string;
  profilePhoto?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentDirectoryEntry {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  program?: string;
  assignedFacultyIds?: string[];
  assignedFacultyNames?: string[];
}

export interface CreateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  program?: string;
  status?: 'active' | 'pending';
  confirm?: boolean;
  linkedStudentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentMobile?: string;
  assignedFacultyIds?: string[];
  gender?: string;
  profile?: Record<string, unknown>;
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  program?: string;
  status?: 'active' | 'pending';
  verified?: boolean;
  assignedFacultyIds?: string[] | null;
  profilePhoto?: string | null;
  profile?: Record<string, unknown>;
}

export interface DeleteUserRequest {
  id: string;
  mode?: string;
}

export interface VerifyUserRequest {
  userId: string;
  verified?: boolean;
}
```

### src/types/courses.ts

```ts
export interface CourseItem {
  id: string;
  category: string;
  sections: string[];
  stream?: string;
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
  audience: ('student' | 'educator' | 'admin')[];
}

export interface CourseOption {
  standardKey: string;
  title: string;
}

export interface CreateCourseRequest {
  standardKey?: string;
  tagline?: string;
  schedule?: string;
  summary?: string;
  description?: string;
  duration?: string;
  mode?: string;
  audienceLabel?: string;
  courseNamesIncluded?: string[];
  branchesIncluded?: string[];
  subjectsCovered?: string[];
  points?: string[];
}

export interface UpdateCourseRequest extends CreateCourseRequest {
  id: string;
  standardKey: string;
}
```

### src/types/tests.ts

```ts
export interface Question {
  id?: string;
  prompt?: string;
  options?: string[];
}

export interface TestItem {
  id: string;
  title: string;
  status: string;
  summary: string;
  examType?: string;
  audience?: string;
  assignedUserIds?: string[];
  questions: Question[];
  createdAt?: string;
}

export interface TestSubmission {
  id: string;
  testId: string;
  studentId: string;
  answers: number[];
  score?: number;
  feedback?: string;
  submittedAt?: string;
}

export interface CreateTestRequest {
  title?: string;
  status?: string;
  summary?: string;
  examType?: string;
  assignedUserIds?: string[];
  questions?: Question[];
}

export interface UpdateTestRequest {
  title?: string;
  status?: string;
  summary?: string;
  examType?: string;
  assignedUserIds?: string[];
  questions?: Question[];
}

export interface SubmitTestRequest {
  testId?: string;
  answers?: number[];
}

export interface GradeSubmissionRequest {
  submissionId?: string;
  score?: number;
  feedback?: string;
}
```

### src/types/messages.ts

```ts
export interface MessageItem {
  id: string;
  title: string;
  body: string;
  channel: string;
  audience?: string[];
  userIds?: string[];
  senderId?: string;
  senderName?: string;
  senderRole?: string;
  expiresAt?: string | null;
  createdAt?: string;
}

export interface SendMessageRequest {
  title?: string;
  body?: string;
  channel?: string;
  audience?: ('student' | 'educator' | 'admin')[];
  userIds?: string[];
  targetMode?: 'everyone' | 'selected-students';
  expiresAt?: string | null;
}

export interface UpdateMessageRequest {
  title?: string;
  body?: string;
  channel?: string;
  expiresAt?: string | null;
}
```

### src/types/notifications.ts

```ts
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read?: boolean;
  userId?: string;
  createdAt?: string;
}

export interface SendNotificationRequest {
  targetMode?: 'everyone' | 'selected-users';
  userIds?: string[];
  title?: string;
  message?: string;
  type?: 'lecture' | 'homework' | 'attendance' | 'test' | 'feedback' | 'fees' | 'payment' | 'placement';
  link?: string;
}

export interface MarkNotificationReadRequest {
  read: boolean;
}
```

### src/types/profile.ts

```ts
export interface UpdateProfileRequest {
  name?: string;
  profilePhoto?: string | null;
  mobile?: string;
  dob?: string;
  gender?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  guardianPhone?: string;
  qualification?: string;
  experience?: string;
  subjects?: string;
}

export interface DeleteAccountRequest {
  password: string;
}
```
