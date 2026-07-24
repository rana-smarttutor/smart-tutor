# Smart Tutors — Mobile App Implementation Guide

## Overview

This document describes EVERY feature, role, access level, and UI behavior for the Smart Tutors mobile app built with Capacitor. It is the single source of truth for migration.

---

## Table of Contents

1. [Role System](#1-role-system)
2. [Authentication Flow](#2-authentication-flow)
3. [Session & Cookie Management](#3-session--cookie-management)
4. [Dashboard Layout](#4-dashboard-layout)
5. [Role: Student — Full Feature Spec](#5-role-student)
6. [Role: Educator — Full Feature Spec](#6-role-educator)
7. [Role: Admin — Full Feature Spec](#7-role-admin)
8. [Role: Parent — Full Feature Spec](#8-role-parent)
9. [Role: Counsellor — Full Feature Spec](#9-role-counsellor)
10. [Feature Matrix (Cross-Role)](#10-feature-matrix)
11. [UI Behavior Rules](#11-ui-behavior-rules)
12. [Data Objects & State Shape](#12-data-objects)

---

## 1. Role System

### Role Type Definition

```ts
type Role = 'student' | 'educator' | 'admin' | 'parent' | 'counsellor';
```

### User Status Values

```ts
type UserStatus = 'active' | 'pending' | 'rejected';
```

### SessionUser Object (returned by /api/auth/session and /api/auth/login)

```ts
interface SessionUser {
  id: string;           // human-readable, e.g. "student-001"
  name: string;         // full name
  email: string;        // unique email
  role: Role;           // one of the 5 roles
  label: string;        // display label, e.g. "Student", "Faculty", "Admin"
  status?: UserStatus;  // active/pending/rejected
  verified?: boolean;   // email/identity verification status
}
```

### Role Hierarchy (Access Levels)

| Level | Role | Can Access |
|---|---|---|
| 0 (Lowest) | student | Own data only, limited actions |
| 1 | parent | Linked student's data (read-only mostly) |
| 2 | counsellor | CRM workspace, enquiries, staff attendance |
| 3 | educator | Own students, tests, homework, attendance |
| 4 (Highest) | admin | Everything — all users, all data, all settings |

### How Access Control Works

1. **Server-side**: Every API route calls `getSessionUser()` then `hasAnyRole(session, ['admin'])` or `requireRole(session, 'student')`. Returns 403 if role mismatch.
2. **Client-side**: Dashboard shell checks `user.role` to show/hide sidebar items. Each section component also checks role before rendering content.
3. **Mobile app must implement BOTH**:
   - Pass cookies on every request (server enforces)
   - Hide UI elements for inaccessible features (UX)
   - Never trust client-side checks alone — always handle 403 responses

---

## 2. Authentication Flow

### Step-by-Step Login Flow

```
1. App opens -> GET /api/auth/session
2. If user is null -> show LoginScreen
3. User enters credentials -> POST /api/auth/login
4. Server sets HTTP-only cookie "smart_tutor_session" (8 hour expiry)
5. Response contains { user: SessionUser }
6. Store user in app state (e.g. Zustand/Context)
7. Navigate to role-specific dashboard
8. If user.status === "pending" -> redirect to ApplicationSubmittedScreen
9. If user.status === "rejected" -> show error, stay on LoginScreen
```

### Signup Flow

```
1. User fills registration form
2. POST /api/auth/signup with all fields
3. Students: status = "active" -> redirected to /dashboard
4. Educators: status = "pending" -> redirected to /application-submitted
5. If parentEmail provided and not registered -> parent account auto-created
6. Cookie is set on successful signup
```

### Logout Flow

```
1. POST /api/auth/logout
2. Server clears "smart_tutor_session" cookie (Max-Age=0)
3. Clear app state
4. Navigate to LoginScreen
```

### Forgot Password Flow

```
1. User fills: name, email, phone, lastPassword, role
2. POST /api/forgot-password
3. Server creates a password-reset request in DB
4. Admin reviews and approves/rejects via admin panel
5. No password change happens automatically
```

### Change Password Flow (Logged-in User)

```
1. User enters currentPassword and newPassword (min 8 chars)
2. POST /api/profile/change-password
3. Server verifies currentPassword against stored hash
4. If wrong -> 403 { error: "Current password is incorrect." }
5. If correct -> new password is bcrypt-hashed and stored
```

---

## 3. Session & Cookie Management

### Cookie Details

```
Name: smart_tutor_session
HttpOnly: true (not accessible via JavaScript)
SameSite: Lax
Path: /
Max-Age: 28800 (8 hours)
Secure: true (HTTPS only in production)
```

### How Capacitor Handles This

- `@capacitor/core` HTTP plugin sends cookies automatically on subsequent requests
- Store the cookie value if needed for manual header injection
- On logout, the server clears the cookie with Max-Age=0
- On app cold start, check session with GET /api/auth/session

### Token-less Architecture

There are NO JWT tokens. The session is a signed cookie managed entirely by the server. The mobile app does NOT need to:
- Store tokens in SecureStorage
- Refresh tokens
- Add Authorization headers

Just pass `credentials: 'include'` or use CapacitorHttp which handles cookies natively.

---

## 4. Dashboard Layout

### Sidebar Navigation Items

Each role sees a different set of sidebar items. The mobile app should implement a hamburger menu or bottom tab bar with these sections:

#### Student Sidebar
- Overview (Home)
- Profile
- Lectures
- Timetable
- Complaints
- Chat
- PTM (Parent-Teacher Meeting)
- Homework
- Doubt Box
- Tests / Exams
- Weekly Tests
- Student Feedback
- Daily Activities
- Performance Reports
- Certificates
- Fee Receipts
- Digital Library
- Attendance
- Leave
- Notifications

#### Educator Sidebar
- Overview (Home)
- Profile
- Lectures
- Timetable
- Complaints
- Chat
- PTM
- Homework
- Doubt Box
- Tests / Exams
- Weekly Tests
- Certificates (view)
- Digital Library
- Attendance (mark + view)
- Leave
- Messages (Notice Board)
- Courses (manage own)
- Results (view graded)
- Teacher Payouts
- Rewards
- Staff Payouts
- Gamification
- Notifications

#### Admin Sidebar
- Overview (Home)
- Profile
- Lectures
- Timetable
- Complaints
- Chat
- Chat Monitor
- PTM
- Doubt Box
- Certificates (full management)
- Digital Library (manage)
- Leave
- Messages (Notice Board)
- Courses (full management)
- Results (all)
- Weekly Tests
- Accounts Directory
- Students Manager
- Roles & Permissions
- Branches
- Enquiries
- Password Reset Requests
- Biometric
- Sales CRM
- Placement Jobs
- Fees / Billing Hub
- Profit & Loss
- Fee Deletion Audit
- Teacher Payouts
- Staff Payroll
- Staff Payouts
- Gamification
- Faculty Performance
- Notifications

#### Parent Sidebar
- Overview (Home)
- Profile
- Lectures
- Timetable
- Complaints
- Chat
- PTM
- Homework
- Tests / Exams
- Weekly Tests
- Student Feedback
- Daily Activities
- Performance Reports
- Certificates (view linked student)
- Fee Receipts
- Digital Library
- Attendance (view linked student)
- Notifications

#### Counsellor Sidebar
- Overview (Home)
- Profile
- Chat
- PTM
- Enquiries
- Sales CRM
- Staff Attendance
- Messages (Notice Board)
- Notifications

---

## 5. Role: Student

### Dashboard Overview

The student sees:
- **Profile Card**: Name, email, program, profile photo
- **Attendance Summary**: Percentage, present/absent counts
- **Fee Status**: Outstanding amount, next due date
- **Test Scores**: Recent test scores with percentages
- **Learning Activity**: Daily activity summary
- **Assigned Courses**: List of enrolled courses
- **Quick Actions**: View Tests, Library, Attendance

### Feature Details

#### Tests & Exams
- **View**: GET /api/tests -> shows tests assigned to them
- **Take Test**: Select test -> answer questions (radio buttons, 2 or 4 options per question) -> POST /api/test-submissions with answers array (index of selected option)
- **View Results**: After submission, see score and feedback
- **Cannot**: Create, edit, or delete tests

#### Weekly Tests
- **View**: GET /api/weekly-tests -> shows results for their batch
- **Cannot**: Create or edit

#### Attendance
- **View Only**: GET /api/attendance -> shows their attendance records
- **Cannot**: Mark attendance (educator/admin only)

#### Messages (Notice Board)
- **View**: GET /api/messages -> messages targeted to them
- **Send**: POST /api/messages -> can ONLY send to:
  - `audience: ["educator"]` — their assigned faculty only
  - `audience: ["admin"]` — admin
  - MUST provide `userIds` with specific educator IDs from `assignedFacultyIds`
- **Cannot**: Send to other students, broadcast, or edit/delete messages

#### Chat (Direct Messages)
- **Contacts**: Can chat with admin + their assigned educators + same-class students
- **Cannot**: Chat with students from other classes
- **Violation Policy**: 3 inappropriate messages -> auto-blocked

#### Homework
- **View**: GET /api/homework -> homework assigned to them
- **Submit**: POST /api/homework/submissions with completed work
- **Cannot**: Create or assign homework

#### Doubt Box
- **Post Doubts**: POST /api/doubts with question
- **View**: See their own doubts and AI-generated answers
- **Cannot**: Answer other students' doubts

#### Student Feedback
- **View Only**: GET /api/student-feedback -> feedback about them from teachers
- **Cannot**: Create or edit feedback

#### Daily Activities
- **View Only**: GET /api/daily-activities -> their activity logs
- **Cannot**: Create or edit (educator does this)

#### Performance Reports
- **View Own**: GET /api/student-performance/reports/mine
- **Cannot**: Create reports (educator/admin only)

#### Certificates
- **View Own**: GET /api/certificates?recipientId=<their-id>
- **Download**: Certificate images/PDFs
- **Cannot**: Issue or revoke certificates

#### Fee Receipts
- **View**: GET /api/invoices?studentId=<their-id>
- **Pay**: POST /api/payments/create-order -> Razorpay checkout -> POST /api/payments/verify
- **Cannot**: Create or edit invoices

#### Digital Library
- **Browse**: GET /api/digital-library -> books for their role
- **Download**: GET /api/digital-library/download?pathname=<path>
- **Cannot**: Add, edit, or delete books

#### Profile Management
- **Update**: PATCH /api/profile with name, mobile, dob, gender, address fields
- **Change Password**: POST /api/profile/change-password
- **Cannot**: Delete account (admin only)

#### Notifications
- **View**: GET /api/notifications -> notifications for them
- **Mark Read**: PATCH /api/notifications/<id> with { read: true }
- **Delete**: DELETE /api/notifications/<id>
- **Cannot**: Send notifications (admin/educator only)

---

## 6. Role: Educator

### Dashboard Overview

The educator sees:
- **Profile Card**: Name, qualification, experience, subjects, exam qualifications, profile photo
- **Assigned Students**: List of students assigned to them
- **Homework Assigned**: Homework they have created
- **Attendance**: Recent attendance sheets they have marked
- **Upcoming Lectures**: Today's lectures

### Feature Details

#### Tests & Exams
- **View All**: GET /api/tests -> tests they created or are assigned to
- **Create**: POST /api/tests with title, status, summary, examType, assignedUserIds, questions
- **Edit**: PUT /api/tests/<testId> (partial update)
- **Delete**: DELETE /api/tests/<testId>
- **Grade Submissions**: PATCH /api/test-submissions with submissionId, score, feedback
- **Rules**:
  - examType must be one of: "unit-1", "semester-1", "unit-2", "semester-2"
  - Each question must have exactly 2 or 4 options
  - assignedUserIds determines who can see the test

#### Weekly Tests
- **View**: GET /api/weekly-tests
- **Create**: POST /api/weekly-tests with title, batchId, subject, testDate, totalMarks, results
- **Edit**: PATCH /api/weekly-tests/<id>
- **Delete**: DELETE /api/weekly-tests/<id>

#### Attendance
- **Mark**: POST /api/attendance with title, date, batchName, subject, records (studentId + status pairs)
- **View**: GET /api/attendance -> sheets they have created
- **Edit**: PATCH /api/attendance/<id>
- **Records structure**: `{ studentId: string, status: 'present' | 'absent' | 'late' }[]`

#### Messages (Notice Board)
- **View**: GET /api/messages
- **Send**: POST /api/messages with role restrictions:
  - Can send to `audience: ["admin"]`
  - Can send to `audience: ["student"]` with specific userIds (their assigned students)
  - If no userIds for students, auto-resolves to all assigned students
  - Sender's role auto-included in audience
- **Edit**: PATCH /api/messages/<id>
- **Delete**: DELETE /api/messages/<id>
- **Cannot**: Send to other educators

#### Chat (Direct Messages)
- **Contacts**: Can chat with all active educators + all active students (assigned to them)
- **Cannot**: Chat with parents or counsellors

#### Homework
- **Create**: POST /api/homework with assignment details
- **View**: GET /api/homework -> homework they created
- **View Submissions**: GET /api/homework/submissions -> student submissions
- **Cannot**: Submit homework (student only)

#### Doubt Box
- **View All Doubts**: See doubts from their assigned students
- **Answer Doubts**: Reply to student doubts
- **Cannot**: Post doubts (student only)

#### Courses
- **Create**: POST /api/courses (if educator role allowed)
- **View**: GET /api/courses -> courses for their role
- **Edit Own**: Can edit courses they created
- **Cannot**: Delete courses (admin only)

#### Student Feedback
- **Create**: POST /api/student-feedback with type "feedback" or "behaviour"
  - Feedback: studentId, batchId, subject, category, strengths, areasToImprove, feedback, visibleToParent
  - Behaviour: studentId, batchId, rating, note, actionTaken, visibleToParent
- **View**: GET /api/student-feedback -> feedback they created
- **Edit**: PATCH /api/student-feedback/<id>
- **Delete**: DELETE /api/student-feedback/<id>

#### Daily Activities
- **Create**: POST /api/daily-activities with studentId, date, homeworkCompleted, assignmentCompleted, revisionCompleted, participation, etc.
- **View**: GET /api/daily-activities -> activities they created
- **Edit**: PATCH /api/daily-activities/<id>
- **Delete**: DELETE /api/daily-activities/<id>

#### Performance Reports
- **Create**: POST /api/student-performance/reports
- **View**: GET /api/student-performance/reports -> reports for their students
- **Cannot**: View reports of students not assigned to them

#### Certificates
- **View All**: GET /api/certificates (sees all issued certificates)
- **Cannot**: Issue, revoke, or delete certificates (admin only)

#### Teacher Payouts
- **View Own**: GET /api/teacher-payouts -> their payout records
- **Cannot**: Create or edit payouts (admin only)

#### Digital Library
- **Browse + Manage**: GET /api/digital-library (canManage = true for educator role)
- **Upload**: POST /api/digital-library with book details
- **Edit**: PATCH /api/digital-library/<bookId>
- **Delete**: DELETE /api/digital-library/<bookId>

#### Notifications
- **View**: GET /api/notifications
- **Send**: POST /api/notifications with title, message, type, link
- **Mark Read / Delete**: Same as student

#### Lectures
- **Create**: POST /api/lectures with lecture details
- **View**: GET /api/lectures -> their lectures
- **Edit**: PATCH /api/lectures/<lectureId>

#### Leave
- **Apply**: POST /api/leave-requests
- **View**: GET /api/leave-requests -> their leave requests

---

## 7. Role: Admin

### Dashboard Overview

The admin sees the FULL dashboard:
- **Hero Section**: Institute name, total students, total revenue
- **KPI Cards**: Total Students, Revenue, At-Risk Students, Fee Collection %
- **Quick Actions**: Add Student, New Exam, Attendance, Fees, Broadcast, Reports
- **Enrollment Trend Chart**: Monthly enrollment data
- **Recent Transactions**: Latest fee payments
- **Today's Lectures**: All lectures scheduled today
- **Upcoming Tests**: All tests coming up
- **Recent Invoices**: Latest invoices created

### Feature Details — Admin-Only Features

#### User Management (Full CRUD)

**View All Users**: GET /api/users
- Response: `{ users: ManagedUser[], students: StudentDirectoryEntry[] }`
- Shows ALL active users (soft-deleted excluded)

**Create User**: POST /api/users
- Body: `{ name, email, role, password, program, confirm: true, ... }`
- `confirm: true` is MANDATORY — request fails without it
- Can create any role: student, educator, parent, counsellor
- Auto-creates parent account if parentEmail provided and not registered
- Auto-links counsellor to CRM

**Update User**: PATCH /api/users
- Body: `{ id, name?, email?, role?, password?, status?, verified?, assignedFacultyIds?, profile? }`
- Password: empty string = no change; non-empty = bcrypt-hash and update
- assignedFacultyIds: null = clear all assignments

**Delete User**: DELETE /api/users
- Body: `{ id, mode: "delete" }`
- This is a SOFT-DELETE (sets deletedAt timestamp)
- User goes to Account Bin

**Toggle Verification**: POST /api/users/verify
- Body: `{ userId, verified: boolean }`

#### User Requests (Pending Student Registrations)

**View Pending**: GET /api/admin/user-requests
- Response: `{ ok: true, requests: ManagedUser[] }`
- Only shows users with status "pending" AND no deletedAt

**Approve**: POST /api/admin/user-requests/approve
- Body: `{ userId }`
- Sets status to "active", verified to true
- Response: `{ ok: true, message: "Account approved successfully.", user: ManagedUser }`

**Reject (Soft-Delete)**: POST /api/admin/user-requests/reject
- Body: `{ userId }`
- Sets deletedAt timestamp (soft-delete, NOT permanent)
- Response: `{ ok: true, message: "Account rejected and deleted." }`

#### Educator Requests (Pending Educator Registrations)

**View Pending**: GET /api/admin/educator-requests
- Response: `{ ok: true, requests: ManagedUser[] }`

**Approve**: POST /api/admin/educator-requests/approve
- Body: `{ userId }`
- Sets status to "active", verified to true

**Reject (Soft-Delete)**: POST /api/admin/educator-requests/reject
- Body: `{ userId }`
- Sets status to "rejected" AND deletedAt timestamp

#### Account Bin (Soft-Deleted Users)

**View Deleted**: GET /api/admin/account-bin
- Response: `{ users: ManagedUser[] }`
- Lists all users with deletedAt field set

**Restore**: PATCH /api/admin/account-bin
- Body: `{ id }`
- Removes deletedAt field, user becomes active again
- Response: `{ ok: true, message: "Account restored." }`

**Permanent Delete**: DELETE /api/admin/account-bin
- Body: `{ id }`
- Actually removes the document from MongoDB
- Response: `{ ok: true, message: "Account permanently deleted." }`
- THIS IS IRREVERSIBLE

#### Student Manager (Advanced)

- View student directory with risk scores
- Bulk update students
- Import students via CSV
- Export student data
- View detailed student stats (total, active, at-risk, dropped, newThisMonth)

#### Roles & Permissions (Custom Roles)

- Create custom roles beyond the 5 built-in ones
- Assign custom modules/permissions to users
- Assign custom roles to users

#### Course Management (Full)

- Create: POST /api/courses
- Update: PATCH /api/courses (admin can edit ANY course)
- Delete: DELETE /api/courses (admin can delete ANY course)
- View course details: GET /api/courses/details

#### Fee Management

- Create invoices: POST /api/invoices
- Edit invoices: PATCH /api/invoices/<id>
- Delete invoices: DELETE /api/invoices/<id>
- Manage fee installment plans
- View fee deletion audit log
- View profit & loss reports
- Razorpay payment integration for students

#### Certificate Management

- Issue certificates: POST /api/certificates with templateId, recipientId, title, description, etc.
- Templates: "classic-gold", "modern-blue", "professional-dark"
- Auto-generates certificateNo: "ST-YYYY-XXXX"
- Revoke: PATCH /api/certificates/<id> with { status: "revoked", revokeReason }
- Delete: DELETE /api/certificates/<id>
- View all: Students see own; admin sees all

#### Placement Management

- Create job postings: POST /api/placement-jobs
- Edit/Delete: PATCH/DELETE /api/placement-jobs/<jobId>
- View applications: GET /api/placement-applications
- Update application status: PATCH /api/placement-applications/<applicationId>

#### Enquiries

- View all: GET /api/enquiries (admin only)
- Public can submit: POST /api/enquiries (name, contact, role, courseTitle, message)

#### Sales CRM

- Full workspace: GET /api/crm/leads (admin sees all leads)
- Create leads: POST /api/crm/leads
- Update leads: PATCH /api/crm/leads/<leadId> with action: "update"|"note"|"call"|"demo"|"admission"|"lost"
- Manage CRM staff
- Import leads via CSV
- Export leads as JSON backup

#### Complaints Management

- View all: GET /api/complaints (admin sees all complaints from all roles)
- Resolve/Update: PATCH /api/complaints/<id>
- Cannot create complaints (student/parent/educator only)

#### Chat Monitor

- View all chat conversations: GET /api/chat/admin
- Flag inappropriate messages: POST /api/chat/flag
- Block users: POST /api/chat/block
- View flagged messages: GET /api/chat/flag

#### Notifications (Broadcast)

- Send to everyone: POST /api/notifications with targetMode: "everyone"
- Send to selected users: POST /api/notifications with targetMode: "selected-users", userIds
- Types: "lecture", "homework", "attendance", "test", "feedback", "fees", "payment", "placement"
- Link must start with "/" and not "//"

#### Bootstrap (Database Seeding)

- Check status: GET /api/admin/bootstrap
- Seed data: POST /api/admin/bootstrap with bootstrapKey
- Requires bootstrap key in header or body

---

## 8. Role: Parent

### Dashboard Overview

The parent sees data about their LINKED STUDENT:
- **Linked Student Info**: Name, class, program
- **Child's Attendance**: Attendance percentage and records
- **Child's Fees**: Outstanding amounts, payment history
- **Child's Test Results**: Scores and feedback
- **Performance Reports**: Reports about their child

### Feature Details

#### Data Access Rules

- Parent is linked to a student via `linkedStudentId` field
- Parent can ONLY see data related to their linked student
- Parent cannot see other students' data
- Parent cannot modify student data (read-only mostly)

#### Available Features

- **View Lectures**: GET /api/lectures (lectures for their child's batch)
- **View Timetable**: Schedule view
- **Complaints**: POST /api/complaints (can submit complaints about their child)
- **Chat**: Can chat with their child's educators and admin
- **PTM**: Can view and join parent-teacher meetings
- **Homework**: View homework assigned to their child
- **Tests**: View tests and results for their child
- **Weekly Tests**: View results
- **Student Feedback**: View feedback about their child
- **Daily Activities**: View daily activity logs for their child
- **Performance Reports**: View reports about their child
- **Certificates**: View certificates issued to their child
- **Fee Receipts**: View and pay invoices for their child
- **Digital Library**: Browse books
- **Attendance**: View attendance records for their child
- **Notifications**: View notifications sent to them

#### Cannot Do

- Cannot create tests, homework, attendance records
- Cannot send notifications
- Cannot manage courses
- Cannot grade submissions
- Cannot create performance reports

---

## 9. Role: Counsellor

### Dashboard Overview

The counsellor has a CRM-focused dashboard:
- **CRM Workspace**: Lead management, follow-ups
- **Enquiries**: View and respond to enquiries
- **Staff Attendance**: Mark and view staff attendance

### Feature Details

#### CRM

- View own leads: GET /api/crm/leads (counsellor sees only their assigned leads)
- Create leads: POST /api/crm/leads
- Update leads: PATCH /api/crm/leads/<leadId> with actions
- Cannot import/export (admin only)
- Cannot manage CRM staff (admin only)

#### Enquiries

- View: GET /api/enquiries (counsellor can see enquiries)
- Cannot create enquiries (public endpoint)

#### Staff Attendance

- View: GET /api/staff-attendance
- Mark: POST /api/staff-attendance (check-in/out, bulk mark)

#### Chat

- Can chat with admin and students
- Cannot chat with educators (unless assigned)

#### Messages

- Can view messages targeted to them
- Can send messages to admin

#### Notifications

- View and manage their notifications

#### Cannot Do

- Cannot manage users (admin only)
- Cannot create/manage tests
- Cannot manage courses
- Cannot issue certificates
- Cannot manage fees
- Cannot access placement management

---

## 10. Feature Matrix (Cross-Role)

| Feature | Student | Educator | Admin | Parent | Counsellor |
|---|---|---|---|---|---|
| View Dashboard | own | own students | all data | linked student | CRM workspace |
| Profile Management | own | own | own | own | own |
| Create User | NO | NO | YES (all roles) | NO | NO |
| Delete User | NO | NO | YES (soft-delete) | NO | NO |
| Approve/Reject Requests | NO | NO | YES | NO | NO |
| Account Bin | NO | NO | YES | NO | NO |
| Create Test | NO | YES | YES | NO | NO |
| Take Test | YES | NO | NO | NO | NO |
| Grade Test | NO | YES | YES | NO | NO |
| Mark Attendance | NO | YES | YES | NO | NO |
| View Attendance | own | own students | all | linked student | staff |
| Send Message | limited | limited | unlimited | limited | limited |
| Create Notification | NO | YES | YES | NO | NO |
| View Notifications | YES | YES | YES | YES | YES |
| Post Homework | NO | YES | NO | NO | NO |
| View Homework | own | own created | NO | linked student | NO |
| Post Doubt | YES | NO | NO | NO | NO |
| Answer Doubt | NO | YES | YES | NO | NO |
| Create Feedback | NO | YES | YES | NO | NO |
| View Feedback | own | own created | all | linked student | NO |
| Create Activity Log | NO | YES | YES | NO | NO |
| View Activity Log | own | own created | all | linked student | NO |
| Performance Reports | view own | create + view | create + view | view linked | NO |
| Issue Certificate | NO | NO | YES | NO | NO |
| View Certificate | own | all | all | linked student | NO |
| Create Invoice | NO | limited | YES | NO | NO |
| View Invoice | own | students assigned | all | linked student | NO |
| Pay Fee | YES | NO | NO | YES (for child) | NO |
| Manage Courses | NO | create own | full CRUD | NO | NO |
| Digital Library | browse | browse + manage | full manage | browse | browse |
| CRM Leads | NO | NO | full | NO | own leads |
| Enquiries | NO | NO | YES | NO | YES |
| Placement | apply | NO | full manage | NO | NO |
| Staff Attendance | NO | NO | NO | NO | YES |
| Leave Application | YES | YES | YES | NO | NO |
| Chat Contacts | admin+faculty+classmates | all educators+students | all | linked student's contacts | admin+students |
| Rewards | NO | YES | YES | NO | NO |
| Gamification | NO | YES | YES | NO | NO |
| Roles & Permissions | NO | NO | YES | NO | NO |

---

## 11. UI Behavior Rules

### Login Screen

1. Show email/mobile input + password input
2. Show "Login" button
3. Show "Forgot Password?" link -> opens ForgotPasswordScreen
4. Show "Sign Up" link -> opens SignupScreen
5. On successful login:
   - If status === "active" -> navigate to Dashboard
   - If status === "pending" -> navigate to ApplicationSubmittedScreen
   - If status === "rejected" -> show error toast, stay on login

### Application Submitted Screen (Pending Educators)

1. Show message: "Your application has been submitted. Our team will review it shortly."
2. Show "Back to Login" button
3. No other actions available

### Dashboard Screen

1. Show sidebar/hamburger menu with role-specific items
2. Show top bar with:
   - App logo/name
   - Performance link (admin/educator only)
   - Rewards button (educator only)
   - Notification bell (all roles)
3. Show main content area with selected section
4. Default section: Overview

### Role-Based Sidebar Filtering

```
if (user.role === 'student') -> show student menu items
if (user.role === 'educator') -> show educator menu items
if (user.role === 'admin') -> show admin menu items
if (user.role === 'parent') -> show parent menu items
if (user.role === 'counsellor') -> show counsellor menu items
```

### Section Access Gating

Every section component must check role before rendering:

```
if (sectionRequiresRole && !hasAnyRole(user, allowedRoles)) {
  return null; // or show "Access Denied"
}
```

### Error Handling

1. **401 (Unauthorized)**: Clear session, navigate to login
2. **403 (Forbidden)**: Show "You don't have permission" toast
3. **404 (Not Found)**: Show "Resource not found" toast
4. **500 (Server Error)**: Show "Something went wrong" toast
5. **Network Error**: Show "Check your connection" toast

### Loading States

1. Show skeleton/shimmer while API calls are in progress
2. Disable buttons during API calls to prevent double-submit
3. Show pull-to-refresh on list screens

### Empty States

1. When list is empty, show illustration + "No [items] yet" message
2. Show relevant action button if user can create items
3. Example: "No tests yet" + "Create Test" button (educator/admin)

---

## 12. Data Objects & State Shape

### App State (Recommended Structure)

```ts
interface AppState {
  // Auth
  user: SessionUser | null;
  isAuthenticated: boolean;

  // Dashboard
  dashboard: DashboardBundle | null;

  // Users (admin)
  users: ManagedUser[];
  students: StudentDirectoryEntry[];
  pendingRequests: ManagedUser[];
  pendingEducatorRequests: ManagedUser[];
  deletedUsers: ManagedUser[];

  // Content
  courses: CourseItem[];
  tests: TestItem[];
  submissions: TestSubmission[];
  messages: MessageItem[];
  notifications: AppNotification[];

  // Loading states
  loading: Record<string, boolean>;

  // Errors
  errors: Record<string, string>;
}
```

### ManagedUser Object (used everywhere)

```ts
interface ManagedUser {
  id: string;                    // "student-001"
  name: string;                  // "Rahul Sharma"
  email: string;                 // "rahul@example.com"
  mobile?: string;               // "9876543210"
  role: Role;                    // "student"
  label: string;                 // "Student"
  status?: UserStatus;           // "active"
  verified?: boolean;            // true
  program?: string;              // "Science 11th"
  assignedFacultyIds?: string[]; // ["faculty-001", "faculty-002"]
  assignedFacultyNames?: string[];// ["Dr. Smith", "Prof. Jones"]
  parentEmail?: string;          // "parent@example.com"
  parentMobile?: string;         // "9876543211"
  linkedStudentId?: string;      // for parent role
  profilePhoto?: string;         // "https://blob.vercel.app/photo.jpg"
  createdAt?: string;            // "2026-01-15T10:30:00.000Z"
  updatedAt?: string;            // "2026-07-20T14:22:00.000Z"
}
```

### CourseItem Object

```ts
interface CourseItem {
  id: string;
  category: string;              // "Science"
  sections: string[];            // ["11th", "12th"]
  stream?: string;               // "Science"
  statusLabel: string;           // "Active"
  standardKey: string;           // "science-11"
  title: string;                 // "Science 11th Regular"
  tagline: string;               // "Complete Science Course"
  schedule: string;              // "Mon-Fri 4-6 PM"
  summary: string;               // short description
  description: string;           // full description
  duration: string;              // "10 months"
  mode: string;                  // "In-Person" or "Online"
  audienceLabel: string;         // "Students"
  courseNamesIncluded: string[]; // ["Physics", "Chemistry", "Biology"]
  branchesIncluded: string[];    // ["Vashi", "Panvel"]
  subjectsCovered: string[];     // ["Mechanics", "Organic Chemistry"]
  points: string[];              // key highlights
  audience: string[];            // ["student", "educator"]
}
```

### TestItem Object

```ts
interface TestItem {
  id: string;
  title: string;                 // "Unit 1 Physics Test"
  status: string;                // "published" | "draft"
  summary: string;               // "Covers Newtons Laws"
  examType?: string;             // "unit-1" | "semester-1" | "unit-2" | "semester-2"
  audience?: string;             // "student"
  assignedUserIds?: string[];    // ["student-001", "student-002"]
  questions: Question[];
  createdAt?: string;
}

interface Question {
  id?: string;                   // "q1"
  prompt?: string;               // "What is the SI unit of force?"
  options?: string[];            // ["Newton", "Joule", "Watt", "Pascal"] — exactly 2 or 4
}
```

### TestSubmission Object

```ts
interface TestSubmission {
  id: string;
  testId: string;                // "test-123"
  studentId: string;             // "student-001"
  answers: number[];             // [0, 2, 1, 3, 0] — index of selected option
  score?: number;                // 80 (percentage)
  feedback?: string;             // "Good work on section 2"
  submittedAt?: string;          // "2026-07-20T14:22:00.000Z"
}
```

### MessageItem Object

```ts
interface MessageItem {
  id: string;
  title: string;                 // "Homework Reminder"
  body: string;                  // "Complete chapter 5 by Friday"
  channel: string;               // "Chat" | "Notice Board"
  audience?: string[];           // ["student", "educator"]
  userIds?: string[];            // specific user IDs
  senderId?: string;             // "faculty-001"
  senderName?: string;           // "Dr. Smith"
  senderRole?: string;           // "educator"
  expiresAt?: string | null;     // "2026-08-01T00:00:00.000Z"
  createdAt?: string;            // "2026-07-20T14:22:00.000Z"
}
```

### AppNotification Object

```ts
interface AppNotification {
  id: string;
  title: string;                 // "New Test Available"
  message: string;               // "Unit 2 Chemistry test is live"
  type: string;                  // "test" | "homework" | "attendance" | etc.
  link?: string;                 // "/tests/test-456"
  read?: boolean;                // false
  userId?: string;               // "student-001"
  createdAt?: string;            // "2026-07-20T14:22:00.000Z"
}
```

### DashboardBundle Object (main dashboard data)

```ts
interface DashboardBundle {
  // Stats
  totalStudents?: number;
  totalRevenue?: number;
  atRiskStudents?: number;
  feeCollectionPercent?: number;

  // Lists
  courses: CourseItem[];
  tests: TestItem[];
  messages: MessageItem[];
  submissions: TestSubmission[];
  lectures: LectureItem[];
  weeklyTests: WeeklyTest[];
  feedback: TeacherFeedback[];
  activities: StudentDailyActivity[];
  invoices: FeeInvoice[];
  payouts: TeacherPayout[];
  notifications: AppNotification[];
  certificates: Certificate[];

  // Profile
  profile?: UserProfile;
}
```

### API Response Wrapper (every endpoint)

```ts
// Success
{ [dataField]: DataType }

// Error
{ error: string }

// The mobile app must ALWAYS check:
if (response.error) {
  // handle error
} else {
  // use response.data
}
```
