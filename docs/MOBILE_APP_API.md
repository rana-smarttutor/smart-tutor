# Smart Tutors Mobile App — API Reference

Base URL: `https://smarttutors.in/api` (or your deployed domain)

Authentication: HTTP-only cookie (`smart_tutor_session`) set on login. All authenticated requests include credentials (`credentials: "include"` in fetch / `withCredentials: true` in axios).

---

## 1. Auth

### POST /api/auth/login
**Body:** `{ login: string, password: string, role: "student" | "educator" | "parent" }`
**Response:** Sets session cookie. Returns `{ redirectTo?: string }` or `{ error: string }`.

### POST /api/auth/logout
**Body:** (none)
**Response:** Clears session cookie. Returns `{ success: true }`.

### GET /api/auth/session
**Response:** `{ user: SessionUser | null }`

### POST /api/auth/signup
**Body:** Full registration payload (name, email, password, mobile, role, studentType, parent details, courseWanted, education fields, address, etc.)
**Response:** Sets session cookie. Returns `{ redirectTo: "/application-submitted" }` or `{ error: string }`.

### POST /api/forgot-password
**Body:** `{ name, email, phone, lastPassword, role }`
**Response:** `{ message: "Your request has been submitted..." }`

---

## 2. Dashboard

### GET /api/dashboard
**Response:** Full `DashboardBundle` (stats, courses, tests, messages, submissions, attendance, invoices, lectures, profile, batches, weekly tests, feedback, activities, fees, payouts, notifications, analytics).

---

## 3. Users (Admin)

### GET /api/users
**Response:** `{ users: ManagedUser[], studentDirectory: ManagedUser[] }`

### POST /api/users
**Body:** `{ name, email, role, password, program?, mobile?, parentMobile?, assignedFacultyIds?, counsellorId? }`

### PATCH /api/users
**Body:** `{ id, name?, email?, role?, password?, program?, status?, verified?, assignedFacultyIds? }`

### POST /api/users/verify
**Body:** `{ userId }` — Toggles verified status.

---

## 4. Courses

### GET /api/courses
**Response:** `{ courses: CourseItem[], options: StandardCourseOption[] }`

### POST /api/courses
**Body:** Full course object (educator/admin).

### PATCH /api/courses
**Body:** `{ id, ...fields }` (admin).

### DELETE /api/courses?courseId=<id>

### GET /api/courses/details
**Response:** `{ courses: DetailedCourse[], timestamp: string }`

---

## 5. Batches

### GET /api/batches
**Response:** `{ batches: Batch[] }`

### POST /api/batches
**Body:** `{ name, code?, courseName?, subject?, capacity?, schedule?, startDate?, studentIds?, teacherIds? }`

### PATCH /api/batches
**Body:** `{ id, ...fields }` or `{ id, action: "assign-teacher" | "remove-teacher", teacherId }`

### DELETE /api/batches?id=<id>

---

## 6. Lectures

### GET /api/lectures
**Response:** `{ lectures: LectureItem[] }`

### POST /api/lectures
**Body:** Full lecture object + sends notifications.

### PATCH /api/lectures/<lectureId>
**Body:** Fields to update (title, subject, timing, meeting links, report fields).

---

## 7. Attendance

### GET /api/attendance
**Response:** `{ sheets: AttendanceSheet[] }`

### POST /api/attendance
**Body:** `{ title, date, batchName?, subject?, records: AttendanceRecord[], lectureId?, batchId? }`

### PATCH /api/attendance/<attendanceId>
**Body:** Fields to update.

### DELETE /api/attendance/<attendanceId>

---

## 8. Tests & Submissions

### GET /api/tests
**Response:** `{ tests: TestItem[] }`

### POST /api/tests
**Body:** `{ title, status, summary, audience, assignedUserIds?, questions }`

### GET /api/test-submissions
**Response:** `{ submissions: TestSubmission[] }`

### POST /api/test-submissions
**Body:** `{ testId, answers: { questionId, answer }[] }` — auto-grades.

### PATCH /api/test-submissions
**Body:** `{ submissionId, score, feedback }` — manual grading.

---

## 9. Weekly Tests

### GET /api/weekly-tests
**Response:** `{ weeklyTests: WeeklyTest[] }`

### POST /api/weekly-tests
**Body:** `{ title, batchId, subject, testDate, totalMarks, results }`

### PATCH /api/weekly-tests/<weeklyTestId>
**Body:** Fields to update.

### DELETE /api/weekly-tests/<weeklyTestId>

---

## 10. Messages

### GET /api/messages
**Response:** `{ messages: MessageItem[] }`

### POST /api/messages
**Body:** `{ title, body, channel, audience?, userIds? }` — Role-enforced (students → assigned faculty or admin; educators → admin or their students; admin → all).

### PATCH /api/messages/<id>
**Body:** `{ title?, body?, channel?, expiresAt? }`

### DELETE /api/messages/<id>

---

## 11. Notifications

### GET /api/notifications
**Response:** `{ notifications: AppNotification[] }`

### POST /api/notifications
**Body:** `{ title, message, type, link?, audience: "everyone" | "selected-users", userIds? }`

### PATCH /api/notifications/<notificationId>
**Body:** `{ read: boolean }`

### DELETE /api/notifications/<notificationId>

---

## 12. Student Feedback & Behaviour

### GET /api/student-feedback
**Response:** `{ feedback: TeacherFeedback[], behaviourNotes: BehaviourNote[] }`

### POST /api/student-feedback
**Body (feedback):** `{ type: "feedback", studentId, batchId, subject?, category, strengths?, areasToImprove?, feedback, visibleToParent }`
**Body (behaviour):** `{ type: "behaviour", studentId, batchId?, rating, note, actionTaken?, visibleToParent }`

### PATCH /api/student-feedback/<feedbackId>
**Body:** Fields to update.

### DELETE /api/student-feedback/<feedbackId>

---

## 13. Daily Activities

### GET /api/daily-activities
**Response:** `{ activities: StudentDailyActivity[] }`

### POST /api/daily-activities
**Body:** `{ studentId, batchId, subject?, date, topicStudied?, homeworkCompleted, assignmentCompleted, revisionCompleted, doubtsRaised?, participation, studyMinutes?, teacherVerified, teacherNote?, visibleToParent }`

### PATCH /api/daily-activities/<activityId>
**Body:** Fields to update.

### DELETE /api/daily-activities/<activityId>

---

## 14. Fees & Invoices

### GET /api/invoices
**Query:** `?studentId=<id>` (educator/admin)
**Response:** `{ invoices: FeeInvoice[] }`

### POST /api/invoices
**Body:** `{ studentId, title, amount, dueDate, ... }`

### PATCH /api/invoices/<invoiceId>
**Body:** Fields to update (admin).

### DELETE /api/invoices/<invoiceId> (admin)

---

## 15. Fee Installments

### GET /api/fee-installments
**Response:** `{ plans: FeeInstallmentPlan[] }`

### POST /api/fee-installments
**Body:** Full plan with installments array (admin).

### PATCH /api/fee-installments/<planId>
**Body:** Fields to update (admin).

### DELETE /api/fee-installments/<planId> (admin)

---

## 16. Teacher Payouts

### GET /api/teacher-payouts
**Response:** `{ payouts: TeacherPayout[] }`

### PATCH /api/teacher-payouts/<payoutId>
**Body:** Fields to update (admin).

### DELETE /api/teacher-payouts/<payoutId> (admin)

---

## 17. Performance Reports

### GET /api/student-performance/reports
**Response:** `{ reports: PerformanceReport[] }`

### GET /api/student-performance/reports/<reportId>
**Response:** Single `PerformanceReport`.

### GET /api/student-performance/reports/mine
**Response:** Student's own reports.

### POST /api/student-performance/reports
**Body:** Full `PerformanceReport` object.

### DELETE /api/student-performance/reports?id=<id>

### GET /api/student-performance/registered-students
**Response:** `[ { id, name, program } ]`

### POST /api/student-performance/upload-photo
**FormData:** `photo` (PNG/JPG/WEBP, max 2 MB)

---

## 18. Digital Library

### GET /api/digital-library
**Response:** `{ books: LibraryBook[], sections, canManage, isLoggedIn, role }`

### POST /api/digital-library
**Body:** `{ title, price, description, category, section?, pdfUrl?, thumbnailUrl?, fileSize?, storageType?, megaFileId?, megaDecryptionKey? }`

### PATCH /api/digital-library/<bookId>
**Body:** Fields to update.

### DELETE /api/digital-library/<bookId>

### POST /api/digital-library/upload
**Body:** `{ fileType: "pdf" | "thumbnail", contentType, contentLength }`
**Response:** Signed upload URL for Vercel Blob.

### GET /api/digital-library/download?pathname=<path>
**Response:** Redirects to download URL.

### GET /api/digital-library/sections
**Response:** `{ sections }`

### POST /api/digital-library/sections
**Body:** `{ slug, label, description }`

---

## 19. Placements

### GET /api/placement-jobs
**Query:** `?scope=admin` (for drafts)
**Response:** `{ jobs: PlacementJob[] }`

### POST /api/placement-jobs
**Body:** Full `PlacementJob` object (admin).

### GET /api/placement-jobs/<jobId>

### PATCH /api/placement-jobs/<jobId>
**Body:** Fields to update (admin).

### DELETE /api/placement-jobs/<jobId> (admin)

### GET /api/placement-applications
**Response:** `{ applications: PlacementApplication[] }`

### POST /api/placement-applications
**Body:** `{ jobId, answers, resumeUrl }`

### PATCH /api/placement-applications/<applicationId>
**Body:** `{ status }` (admin)

---

## 20. Enquiries (Public + Admin)

### GET /api/enquiries (admin)
**Response:** `{ enquiries: Enquiry[] }`

### POST /api/enquiries (public)
**Body:** `{ name, contact, role, courseTitle, courseKey, message, suggestedCourses? }`

---

## 21. CRM

### GET /api/crm/leads
**Response:** Full CRM workspace (admin: all, counsellor: own).

### POST /api/crm/leads
**Body:** `{ name, email?, phone?, courseInterest?, source?, priority?, assignedTo?, notes? }`

### PATCH /api/crm/leads/<leadId>
**Body:** `{ action: "update" | "note" | "call" | "demo" | "admission" | "lost", ... }`

### DELETE /api/crm/leads/<leadId> (admin)

### GET /api/crm/staff (admin)
### POST /api/crm/staff (admin)
### PATCH /api/crm/staff (admin)
### DELETE /api/crm/staff (admin)

### POST /api/crm/import (admin — CSV upload)
### GET /api/crm/backup (admin — JSON export)

---

## 22. Admin

### GET /api/admin/user-requests — Pending students
### POST /api/admin/user-requests/approve — `{ userId }`
### POST /api/admin/user-requests/reject — `{ userId }`
### GET /api/admin/educator-requests — Pending educators
### POST /api/admin/educator-requests/approve — `{ userId }`
### POST /api/admin/educator-requests/reject — `{ userId }`
### GET /api/admin/password-reset-requests
### PATCH /api/admin/password-reset-requests — `{ id, status, adminNote? }`
### GET /api/admin/mongo-status
### GET|POST /api/admin/bootstrap — Seed database (requires bootstrap key)

---

## 23. Payments

### POST /api/payments/create-order
**Body:** `{ amount, currency?, receipt? }`
**Response:** `{ orderId, amount, currency, keyId }`

### POST /api/payments/verify
**Body:** `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId? }`

---

## 24. Quiz Arena

### POST /api/quiz-arena/generate
**Body:** `{ level, exam, subject, difficulty, count? }`
**Response:** `{ questions: QuizQuestion[] }`

---

## 25. Misc

### GET /api/institute
**Response:** Public institute data (profile, social links, programs, placed students).

### GET /api/mock-test
**Response:** Sample quiz questions for demo.

### POST /api/upload/signup
**FormData:** `file` (profile photo or CV, max 5 MB)

---

## Key Data Types

### SessionUser
```json
{ "id": "string", "name": "string", "email": "string", "role": "student|educator|admin|parent|counsellor", "label": "string", "status?": "active|pending|rejected", "verified?": "boolean" }
```

### CourseItem
```json
{ "id": "string", "category": "string", "sections": ["string"], "stream?": "Science|Commerce|Arts|General", "statusLabel": "string", "standardKey": "string", "title": "string", "tagline": "string", "schedule": "string", "summary": "string", "description": "string", "duration": "string", "mode": "string", "audienceLabel": "string", "courseNamesIncluded": ["string"], "branchesIncluded": ["string"], "subjectsCovered": ["string"], "points": ["string"], "audience": ["student|educator|admin"] }
```

### Role
`"student" | "educator" | "admin" | "parent" | "counsellor"`

---

## Auth Flow

1. App opens → hit `GET /api/auth/session`
2. If `user` is null → show login screen
3. Login → `POST /api/auth/login` with credentials
4. On success, cookie is set → redirect to dashboard
5. All subsequent API calls include the cookie automatically

---

## Notes for Mobile Dev

- All date/time fields are ISO 8601 strings
- IDs are human-readable (e.g., `student-001`, `course-9-regular-academic`)
- File uploads use Vercel Blob (signed URLs)
- Notifications are pushed via API polling (no WebSocket yet)
- Cookie-based auth means no token management needed on mobile — just use cookie storage
- Pagination is not implemented yet — all list endpoints return full datasets
