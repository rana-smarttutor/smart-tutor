## API Route Specifications — Input, Output, Example

---

### 1. POST /api/auth/login

**Input:**
```ts
{ login: string; password: string; }
```

**Output (Success 200):**
```ts
{ user: SessionUser }
// + Set-Cookie: smart_tutor_session=<token>
```

**Output (Pending Approval 200):**
```ts
{ error: "Your account is pending approval."; pendingApproval: true; redirectTo: "/application-submitted"; }
```

**Output (Rejected 403):**
```ts
{ error: "Your account has been rejected."; pendingApproval: false; redirectTo: "/login"; }
```

**Output (Bad Credentials 401):**
```ts
{ error: "The email/mobile number or password is incorrect."; }
```

**Example:**
```ts
const response = await api<LoginResponse>({
  method: 'POST',
  path: '/api/auth/login',
  body: { login: 'student@example.com', password: 'mypassword123' }
});
if (response.error) {
  showToast(response.error);
} else {
  setCurrentUser(response.data.user);
  navigate('/dashboard');
}
```

---

### 2. POST /api/auth/logout

**Input:** None

**Output:**
```ts
{ ok: true }
// + Set-Cookie: smart_tutor_session=; Max-Age=0
```

**Example:**
```ts
await api<{ ok: boolean }>({ method: 'POST', path: '/api/auth/logout' });
clearCurrentUser();
navigate('/login');
```

---

### 3. GET /api/auth/session

**Input:** None

**Output:**
```ts
{ user: SessionUser | null }
```

**Example:**
```ts
const response = await api<{ user: SessionUser | null }>({
  method: 'GET', path: '/api/auth/session'
});
if (response.data?.user) {
  setCurrentUser(response.data.user);
} else {
  navigate('/login');
}
```

---

### 4. POST /api/auth/signup

**Input:** `SignupRequest` (see types)

**Output (Student 200):**
```ts
{ user: SessionUser; message: string; redirectTo: "/dashboard"; }
```

**Output (Educator 200):**
```ts
{ user: SessionUser; message: string; redirectTo: "/application-submitted"; }
```

**Example:**
```ts
const response = await api<SignupResponse>({
  method: 'POST',
  path: '/api/auth/signup',
  body: {
    role: 'student', name: 'Rahul Sharma', email: 'rahul@example.com',
    password: 'securepass123', mobile: '9876543210',
    profilePhoto: 'https://blob.vercel.app/photo.jpg',
    courseWanted: 'Science 11th Regular', studentType: 'campus', campusLocation: 'vashi',
  }
});
```

---

### 5. POST /api/forgot-password

**Input:**
```ts
{ name: string; email: string; phone: string; lastPassword: string; role?: string; }
```

**Output:**
```ts
{ message: "Your request has been submitted. Our team will review it shortly." }
```

**Example:**
```ts
await api<{ message: string }>({
  method: 'POST', path: '/api/forgot-password',
  body: { name: 'Rahul', email: 'rahul@example.com', phone: '9876543210', lastPassword: 'oldpass' }
});
```

---

### 6. GET /api/dashboard

**Input:** None

**Output:**
```ts
{
  user: SessionUser;
  dashboard: DashboardBundle;
  users: ManagedUser[];           // admin only, else []
  students: StudentDirectoryEntry[]; // educator/admin, else []
  submissions: TestSubmission[];
}
```

**Example:**
```ts
const response = await api<DashboardResponse>({ method: 'GET', path: '/api/dashboard' });
if (response.data) setDashboard(response.data.dashboard);
```

---

### 7. GET /api/users (Admin)

**Input:** None

**Output:**
```ts
{ users: ManagedUser[]; students: StudentDirectoryEntry[]; }
```

**Example:**
```ts
const response = await api<{ users: ManagedUser[]; students: StudentDirectoryEntry[] }>({
  method: 'GET', path: '/api/users'
});
```

---

### 8. POST /api/users (Admin — Create)

**Input:** `CreateUserRequest`

**Output (201):**
```ts
{ user: ManagedUser }
```

**Example:**
```ts
const response = await api<{ user: ManagedUser }>({
  method: 'POST', path: '/api/users',
  body: { name: 'New Student', email: 'new@example.com', role: 'student', password: 'temp1234', program: 'Science 11th', confirm: true }
});
```

---

### 9. PATCH /api/users (Admin — Update)

**Input:** `UpdateUserRequest` (id REQUIRED)

**Output (200):**
```ts
{ user: ManagedUser }
```

**Example:**
```ts
const response = await api<{ user: ManagedUser }>({
  method: 'PATCH', path: '/api/users',
  body: { id: 'user-123', name: 'Updated Name', status: 'active', verified: true }
});
```

---

### 10. DELETE /api/users (Admin)

**Input:**
```ts
{ id: string; mode?: string; }
```

**Output:**
```ts
{ ok: true; message: "User deleted."; }
```

**Example:**
```ts
await api<{ ok: boolean; message: string }>({
  method: 'DELETE', path: '/api/users', body: { id: 'user-123', mode: 'delete' }
});
```

---

### 11. POST /api/users/verify (Admin)

**Input:**
```ts
{ userId: string; verified?: boolean; }
```

**Output:**
```ts
{ ok: true; message: string; }
```

**Example:**
```ts
await api<{ ok: boolean; message: string }>({
  method: 'POST', path: '/api/users/verify', body: { userId: 'user-123', verified: true }
});
```

---

### 12. GET /api/admin/user-requests (Admin)

**Input:** None

**Output:**
```ts
{ ok: true; requests: ManagedUser[]; }
```

**Example:**
```ts
const response = await api<{ ok: boolean; requests: ManagedUser[] }>({
  method: 'GET', path: '/api/admin/user-requests'
});
setPendingStudents(response.data.requests);
```

---

### 13. POST /api/admin/user-requests/approve (Admin)

**Input:**
```ts
{ userId: string; }
```

**Output:**
```ts
{ ok: true; message: "Account approved successfully."; user: ManagedUser; }
```

**Example:**
```ts
await api<{ ok: boolean; message: string; user: ManagedUser }>({
  method: 'POST', path: '/api/admin/user-requests/approve', body: { userId: 'user-456' }
});
```

---

### 14. POST /api/admin/user-requests/reject (Admin — Soft-Delete)

**Input:**
```ts
{ userId: string; }
```

**Output:**
```ts
{ ok: true; message: "Account rejected and deleted."; }
// NOTE: SOFT-DELETE — user goes to Account Bin
```

**Example:**
```ts
await api<{ ok: boolean; message: string }>({
  method: 'POST', path: '/api/admin/user-requests/reject', body: { userId: 'user-789' }
});
```

---

### 15. GET /api/admin/educator-requests (Admin)

**Input:** None

**Output:**
```ts
{ ok: true; requests: ManagedUser[]; }
```

---

### 16. POST /api/admin/educator-requests/approve (Admin)

**Input:**
```ts
{ userId: string; }
```

**Output:**
```ts
{ ok: true; message: "Faculty account approved successfully."; user: ManagedUser; }
```

---

### 17. POST /api/admin/educator-requests/reject (Admin — Soft-Delete)

**Input:**
```ts
{ userId: string; }
```

**Output:**
```ts
{ ok: true; message: "Faculty account rejected."; user: ManagedUser; }
// NOTE: Sets status="rejected" AND deletedAt timestamp
```

---

### 18. GET /api/admin/account-bin (Admin)

**Input:** None

**Output:**
```ts
{ users: ManagedUser[]; }
```

**Example:**
```ts
const response = await api<{ users: ManagedUser[] }>({
  method: 'GET', path: '/api/admin/account-bin'
});
setDeletedUsers(response.data.users);
```

---

### 19. PATCH /api/admin/account-bin (Admin — Restore)

**Input:**
```ts
{ id: string; }
```

**Output:**
```ts
{ ok: true; message: "Account restored."; }
```

**Example:**
```ts
await api<{ ok: boolean; message: string }>({
  method: 'PATCH', path: '/api/admin/account-bin', body: { id: 'user-123' }
});
```

---

### 20. DELETE /api/admin/account-bin (Admin — Permanent Delete)

**Input:**
```ts
{ id: string; }
```

**Output:**
```ts
{ ok: true; message: "Account permanently deleted."; }
```

**Example:**
```ts
await api<{ ok: boolean; message: string }>({
  method: 'DELETE', path: '/api/admin/account-bin', body: { id: 'user-123' }
});
```

---

### 21. GET /api/courses

**Input:** None

**Output:**
```ts
{ role: string; courses: CourseItem[]; courseOptions: CourseOption[]; }
```

**Example:**
```ts
const response = await api<{ role: string; courses: CourseItem[]; courseOptions: CourseOption[] }>({
  method: 'GET', path: '/api/courses'
});
```

---

### 22. POST /api/courses (Educator/Admin)

**Input:** `CreateCourseRequest`

**Output (201):**
```ts
{ course: CourseItem; }
```

**Example:**
```ts
const response = await api<{ course: CourseItem }>({
  method: 'POST', path: '/api/courses',
  body: {
    standardKey: 'science-11', tagline: 'Complete Science Course',
    schedule: 'Mon-Fri 4-6 PM', summary: 'Covers Physics, Chemistry, Biology',
    description: 'Detailed course...', duration: '10 months', mode: 'In-Person',
    audienceLabel: 'Students', courseNamesIncluded: ['Physics', 'Chemistry', 'Biology'],
    subjectsCovered: ['Mechanics', 'Organic Chemistry', 'Cell Biology'],
  }
});
```

---

### 23. PATCH /api/courses (Admin — Update)

**Input:** `UpdateCourseRequest` (id + standardKey REQUIRED)

**Output:**
```ts
{ course: CourseItem; }
```

---

### 24. DELETE /api/courses (Admin)

**Input:**
```ts
{ id: string; }
```

**Output:**
```ts
{ ok: true; }
```

---

### 25. GET /api/tests

**Input:** None

**Output:**
```ts
{ tests: TestItem[]; }
```

**Example:**
```ts
const response = await api<{ tests: TestItem[] }>({
  method: 'GET', path: '/api/tests'
});
```

---

### 26. POST /api/tests (Educator/Admin)

**Input:** `CreateTestRequest`

**Output (201):**
```ts
{ test: TestItem; }
```

**Example:**
```ts
const response = await api<{ test: TestItem }>({
  method: 'POST', path: '/api/tests',
  body: {
    title: 'Unit 1 Physics Test', status: 'published',
    summary: 'Covers Newtons Laws', examType: 'unit-1',
    assignedUserIds: ['student-001', 'student-002'],
    questions: [
      { id: 'q1', prompt: 'What is the SI unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'] },
      { id: 'q2', prompt: 'F = ma is which law?', options: ['First', 'Second', 'Third', 'Zeroth'] }
    ]
  }
});
```

---

### 27. PUT /api/tests/[testId] (Educator/Admin)

**Input:** `UpdateTestRequest`

**Output:**
```ts
{ test: TestItem; }
```

**Example:**
```ts
const response = await api<{ test: TestItem }>({
  method: 'PUT', path: '/api/tests/test-123',
  body: { title: 'Updated Test', status: 'draft', questions: [{ id: 'q1', prompt: 'Updated?', options: ['A', 'B', 'C', 'D'] }] }
});
```

---

### 28. DELETE /api/tests/[testId] (Educator/Admin)

**Input:** None (testId in URL)

**Output:**
```ts
{ deleted: true; }
```

---

### 29. GET /api/test-submissions

**Input:** None

**Output:**
```ts
{ submissions: TestSubmission[]; }
```

---

### 30. POST /api/test-submissions (Student)

**Input:**
```ts
{ testId?: string; answers?: number[]; }
```

**Output (201):**
```ts
{ submission: TestSubmission; }
```

**Example:**
```ts
const response = await api<{ submission: TestSubmission }>({
  method: 'POST', path: '/api/test-submissions',
  body: { testId: 'test-123', answers: [0, 2, 1, 3, 0] }
});
```

---

### 31. PATCH /api/test-submissions (Educator/Admin — Grade)

**Input:**
```ts
{ submissionId?: string; score?: number; feedback?: string; }
```

**Output:**
```ts
{ submission: TestSubmission; }  // with updated score and feedback
```

---

### 32. GET /api/messages

**Input:** None

**Output:**
```ts
{ messages: MessageItem[]; }
```

---

### 33. POST /api/messages (All Roles — Send)

**Input:** `SendMessageRequest`

**Output (201):**
```ts
{ message: MessageItem; }
```

**Role Restrictions:**
- student -> can only send to ["educator"] or ["admin"], must provide userIds
- educator -> can send to ["admin"] or ["student"]
- admin -> can send to any combination

**Example:**
```ts
const response = await api<{ message: MessageItem }>({
  method: 'POST', path: '/api/messages',
  body: {
    title: 'Homework Reminder', body: 'Complete chapter 5 by Friday.',
    channel: 'Chat', audience: ['student'], userIds: ['student-001', 'student-002'],
  }
});
```

---

### 34. PATCH /api/messages/[id] (Educator/Admin)

**Input:**
```ts
{ title?: string; body?: string; channel?: string; expiresAt?: string | null; }
```

**Output:**
```ts
{ message: MessageItem; }
```

---

### 35. DELETE /api/messages/[id] (Educator/Admin)

**Input:** None (id in URL)

**Output:**
```ts
{ success: true; }
```

---

### 36. GET /api/notifications

**Input:** None

**Output:**
```ts
{ notifications: AppNotification[]; }
```

---

### 37. POST /api/notifications (Admin/Educator)

**Input:** `SendNotificationRequest`

**Output (201):**
```ts
{ notifications: AppNotification[]; createdCount: number; }
```

**Example:**
```ts
const response = await api<{ notifications: AppNotification[]; createdCount: number }>({
  method: 'POST', path: '/api/notifications',
  body: {
    title: 'New Test Available', message: 'Unit 2 Chemistry test is live.',
    type: 'test', link: '/tests/test-456', targetMode: 'everyone'
  }
});
```

---

### 38. PATCH /api/notifications/[notificationId]

**Input:**
```ts
{ read: boolean; }  // REQUIRED
```

**Output:**
```ts
{ notification: AppNotification; }
```

**Example:**
```ts
await api<{ notification: AppNotification }>({
  method: 'PATCH', path: '/api/notifications/notif-123', body: { read: true }
});
```

---

### 39. DELETE /api/notifications/[notificationId]

**Input:** None (notificationId in URL)

**Output:**
```ts
{ success: true; }
```

---

### 40. PATCH /api/profile (All Roles)

**Input:** `UpdateProfileRequest`

**Output (200):**
```ts
{ user: ManagedUser; }
```

**Example:**
```ts
const response = await api<{ user: ManagedUser }>({
  method: 'PATCH', path: '/api/profile',
  body: { name: 'Rahul Updated', mobile: '9876543211', dob: '2005-03-15', gender: 'male', city: 'Vashi', state: 'Maharashtra', pincode: '400703' }
});
```

---

### 41. POST /api/profile/change-password (All Roles)

**Input:**
```ts
{ currentPassword: string; newPassword: string; }  // min 8 chars
```

**Output:**
```ts
{ success: true; }
```

**Output (Wrong Password 403):**
```ts
{ error: "Current password is incorrect."; }
```

**Example:**
```ts
const response = await api<{ success: boolean }>({
  method: 'POST', path: '/api/profile/change-password',
  body: { currentPassword: 'oldpass123', newPassword: 'newsecure456' }
});
```

---

### 42. POST /api/profile/delete-account (Admin Only)

**Input:**
```ts
{ password: string; }  // REQUIRED
```

**Output:**
```ts
{ ok: true; }
// + Clears session cookie
```

**Example:**
```ts
await api<{ ok: boolean }>({
  method: 'POST', path: '/api/profile/delete-account',
  body: { password: 'adminpassword123' }
});
```

---

## Authorization Summary

| Endpoint | Public | Student | Educator | Admin |
|---|---|---|---|---|
| POST /api/auth/login | YES | - | - | - |
| POST /api/auth/logout | YES | - | - | - |
| GET /api/auth/session | YES | - | - | - |
| POST /api/auth/signup | YES | - | - | - |
| POST /api/forgot-password | YES | - | - | - |
| GET /api/courses | YES | - | - | - |
| GET /api/dashboard | - | YES | YES | YES |
| GET /api/users | - | - | - | YES |
| POST /api/users | - | - | - | YES |
| PATCH /api/users | - | - | - | YES |
| DELETE /api/users | - | - | - | YES |
| POST /api/users/verify | - | - | - | YES |
| GET /api/admin/user-requests | - | - | - | YES |
| POST /api/admin/user-requests/approve | - | - | - | YES |
| POST /api/admin/user-requests/reject | - | - | - | YES |
| GET /api/admin/educator-requests | - | - | - | YES |
| POST /api/admin/educator-requests/approve | - | - | - | YES |
| POST /api/admin/educator-requests/reject | - | - | - | YES |
| GET /api/admin/account-bin | - | - | - | YES |
| PATCH /api/admin/account-bin | - | - | - | YES |
| DELETE /api/admin/account-bin | - | - | - | YES |
| GET /api/tests | - | YES | YES | YES |
| POST /api/tests | - | - | YES | YES |
| PUT /api/tests/[testId] | - | - | YES | YES |
| DELETE /api/tests/[testId] | - | - | YES | YES |
| GET /api/test-submissions | - | YES | YES | YES |
| POST /api/test-submissions | - | YES | - | - |
| PATCH /api/test-submissions | - | - | YES | YES |
| GET /api/messages | - | YES | YES | YES |
| POST /api/messages | - | YES | YES | YES |
| PATCH /api/messages/[id] | - | - | YES | YES |
| DELETE /api/messages/[id] | - | - | YES | YES |
| GET /api/notifications | - | YES | YES | YES |
| POST /api/notifications | - | - | YES | YES |
| PATCH /api/notifications/[id] | - | YES | YES | YES |
| DELETE /api/notifications/[id] | - | YES | YES | YES |
| PATCH /api/profile | - | YES | YES | YES |
| POST /api/profile/change-password | - | YES | YES | YES |
| POST /api/profile/delete-account | - | - | - | YES |
