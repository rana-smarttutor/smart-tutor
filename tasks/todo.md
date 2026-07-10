# Smart Tutors - Completed Work Log

## Session: Dashboard Fixes, Profile, Roles, Chat (Jul 2026)

### Completed Features

#### 1. Faculty Student Count Fix
- **File:** `app/dashboard/page.tsx:33`
- **Change:** `getStudentDirectory(session.id)` — scoped students to logged-in educator

#### 2. Attendance Default Tab + Confirmation Dialogs
- **File:** `components/staff-attendance-manager.tsx`
- **Changes:** Default tab `"mine"` for non-admins; `window.confirm()` before check-in/out

#### 3. Full Regularisation System
- **Types:** `RegularisationRequest` in `lib/types.ts`
- **API:** `POST /api/staff-attendance` (create), `GET/POST /api/staff-attendance/regularise` (admin approve/reject)
- **UI:** `components/staff-attendance-manager.tsx` — regularise button on records, admin review panel

#### 4. Faculty Chat with Assigned Students
- **Verified:** Works after student directory fix; filters by `assignedFacultyIds`

#### 5. Attendance Calendar Redesign
- **File:** `components/attendance-manager.tsx`
- **Changes:** Angular-style calendar grid, month/week toggle, 5 stat cards, regularize buttons, legend bar

#### 6. Parent Overview = Student Overview
- **File:** `components/dashboard-overview.tsx`
- **Change:** `ParentOverview` mirrors `StudentOverview` with hero, KPI cards, routed via `role === "parent"`

#### 7. Parent Chat = Student Chat
- **File:** `components/dashboard-chat.tsx`
- **Change:** `role === "parent"` case returns admins + assigned educators

#### 8. Sidebar Chat Unread Badge Persistence
- **File:** `components/dashboard-chat.tsx`
- **Change:** `lastReadTimestamps` persisted to `localStorage` key `chat_last_read_${userId}`

#### 9. Assigned Faculty Names on Dashboard Heroes
- **File:** `components/dashboard-overview.tsx`
- **Change:** Student and parent heroes show assigned faculty as pill badges

#### 10. Faculty Dashboard Hero Format
- **File:** `components/dashboard-overview.tsx`
- **Change:** Student count and batch count badges use bold number styling (`text-sm font-black`)

#### 11. My Profile - Full Data Rendering
- **File:** `components/my-profile-client.tsx`
- **Changes:**
  - Left sidebar shows "Profile Details" summary card with all collected fields
  - Students: added Course, Student Type, Parent Name/Email/Mobile, Last Qualification, Academic Score
  - Students: added Weak/Strong Subjects tag inputs (red/green chips)
  - All roles: Gender, DOB, Father's Name, Address/City/State/Pincode fields
  - Phone field fallback chain: `guardianPhone ?? parentMobile ?? mobile` (fixes missing phone bug)

#### 12. Parent Profile - Linked Student Details
- **File:** `lib/types.ts`, `lib/data-store.ts`, `components/my-profile-client.tsx`
- **Changes:**
  - Added `linkedStudentProfile` to `DashboardBundle` type
  - `getDashboardBundle` fetches linked student name, email, phone, course, batch for parents
  - Profile sidebar shows "Student Details" card for parents with child's info

#### 13. Student Phone Merge Fix (Data Layer)
- **File:** `lib/data-store.ts` — `getDashboardBundle()`
- **Change:** Profile response merges root-level `parentMobile` and `mobile` into `guardianPhone` fallback chain, fixing phone not showing when stored via API vs CSV import

#### 14. Roles & Permissions System (Verified)
- **Components:** `components/roles-manager.tsx` — full CRUD, 2 tabs (Roles + Staff Assignments)
- **API:** `app/api/admin/roles/route.ts` (GET/POST), `[id]/route.ts` (PUT/DELETE), `assign/route.ts` (POST/DELETE)
- **Data:** 10 functions in `lib/data-store.ts` — create, read, update, delete, assign, unassign, stats
- **Types:** `CustomRole`, `CustomRoleAssignment`, `AvailableModule` in `lib/types.ts`
- **Sidebar:** Admin sidebar item at position 3: `{ id: "roles", label: "Roles & Permissions" }`
- **Gate:** Renders only for `role === "admin"` in `dashboard-shell.tsx:1256`

#### 15. Parent Sidebar Expansion
- **File:** `components/dashboard-shell.tsx`
- **Change:** Parent sidebar expanded from 11 to 19 items matching student sidebar

#### 16. Student Sidebar Cleanup
- **File:** `components/dashboard-shell.tsx`
- **Change:** Removed "Staff Attendance" entry from student sidebar

### Test Coverage
- **File:** `__tests__/roles-and-profile.test.ts` — 32 new tests
- **Covers:** CustomRole type contract, CustomRoleAssignment, AVAILABLE_MODULES validation, DashboardBundle (linkedStudentProfile, faculty fields), UserProfile phone fields, role creation validation logic, module assignment, isActive toggle, assignment uniqueness, profile phone merge logic
- **Total:** 122 tests across 4 suites, all passing

### Verification
- `npx tsc --noEmit` — zero errors
- `npx jest --no-cache` — 122/122 passing
