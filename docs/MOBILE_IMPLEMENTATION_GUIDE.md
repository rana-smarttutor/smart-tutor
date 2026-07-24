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
