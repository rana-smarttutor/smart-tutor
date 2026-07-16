# Smart Tutors Team Guide

## What exists now

- Public landing page with polished institute storytelling and animated sections.
- MongoDB-backed authentication and app content, with the old mock dataset now serving only as a bootstrap template source.
- Mobile header keeps login as a visible quick-access action outside the hamburger menu, opening a compact login sheet on small screens.
- Role-aware dashboard shell for student, educator, and admin.
- Real login form now supports username/email + password, with direct demo role access kept as a secondary shortcut.
- Local API routes for auth, dashboard, courses, messages, tests, users, institute data, bootstrap initialization, and Mongo health checks.
- Digital library PDF content is split across two stores: book PDFs live in Mega.nz through `lib/mega.ts`, while thumbnails, sections, and book metadata stay in Vercel Blob.
- MongoDB now acts as the runtime source of truth through `MONGODB_URI` and `MONGODB_DB`.
- Public course catalog reads live detailed course data from Mongo and also keeps a browser-side local cache copy.
- Admin can manage standardized courses through the dashboard using a select-only course name list with editable duration, mode, summary, description, and key points.
- The standardized course library now covers primary, middle school, secondary, senior secondary, junior college, diploma, graduation, entrance exams, government exams, and counselling tracks.
- User integrity now requires one unique person id and one unique email per user, with no guest accounts stored in the user system.

## Core files

- `app/page.tsx`: landing page
- `app/login/page.tsx`: real login + direct demo access
- `app/dashboard/page.tsx`: role-aware dashboard
- `app/mock-test/page.tsx`: interactive mock-test experience
- `app/api/**/route.ts`: local APIs
- `app/api/admin/bootstrap/route.ts`: protected bootstrap route for initializing Mongo collections from the template dataset
- `app/api/admin/mongo-status/route.ts`: Mongo connectivity check
- `app/api/digital-library/**`: library listing, upload, download, preview, and metadata routes
- `app/api/courses/details/route.ts`: live detailed course feed for the public catalog
- `components/theme-provider.tsx`: theme state
- `components/real-login-form.tsx`: username/email + password sign-in
- `components/logout-button.tsx`: session cleanup flow
- `components/dashboard-course-manager.tsx`: admin course creation and editing
- `lib/mock-data.ts`: template seed source only
- `lib/data-store.ts`: Mongo-backed runtime repository for auth, public content, dashboard data, and writes
- `lib/auth.ts`: cookie session helpers
- `lib/validation.ts`: shared sanitization and validation helpers for login and local APIs
- `lib/mongodb.ts`: MongoDB client utility
- `lib/seed-database.ts`: collection bootstrap logic for direct Mongo template upload
- `lib/course-library.ts`: standardized course-name source and template definitions

## Architecture

- **Proxy (`proxy.ts`)**: Next.js 16 proxy file at root. Handles auth guard (redirects unauthenticated users to `/login`), SEO (crawlers bypass auth), and security headers. All route protection lives here — do not create separate middleware.
- **Route protection**: Public routes are defined in `proxy.ts`. Dashboard and authenticated pages get automatic redirect. API routes are protected per-route using `getSessionUser()` from `lib/auth.ts`.

## Working rules

- Keep the design system centralized in `app/globals.css`.
- Keep public and dashboard copy concise. Prefer short headings, short support text, and direct action labels.
- Prefer editing runtime read/write logic in `lib/data-store.ts`; use `lib/mock-data.ts` only when changing the bootstrap template set.
- Treat MongoDB as the source of truth. If a page is supposed to show live app data, do not fall back to page-local arrays.
- When adding a role capability, update:
  1. Dashboard content
  2. API route authorization
  3. `AGENTS.md` or this guide if the pattern becomes a project convention
- Do not connect Firebase auth until the team is ready to replace the mock flow end-to-end.
- Keep route handlers JSON-based and route all runtime reads/writes through `lib/data-store.ts`.
- Reuse `lib/validation.ts` when adding or expanding form-based local API inputs so mobile UI and backend rules stay aligned.
- Before first use against a new cluster, initialize content with `POST /api/admin/bootstrap` and the `x-bootstrap-key` header matching `MONGODB_BOOTSTRAP_KEY`.
- Preserve user integrity rules:
  1. one unique id per person
  2. one unique normalized email per person
  3. no duplicate user across multiple categories
- Keep the digital library storage split stable:
  1. main PDFs belong in Mega.nz
  2. thumbnails, sections, and metadata stay in Blob
  3. use the metadata blobs to resolve Mega download links for library listings and edits
- Use the standardized course templates in `lib/course-library.ts` when creating or editing courses. Admin can edit course details, but not invent arbitrary new course-name variants.
- Keep school-stage coverage explicit in course templates. If Smart Tutors adds a new academic branch, extend `lib/course-library.ts` first and then update public-facing summary copy in `lib/mock-data.ts`.
- Interactive public modules like course popups and mock tests should read from Mongo-backed routes or repository functions, not from page-local arrays.
- Keep public institute identity details such as primary phone, WhatsApp, Instagram, and leadership info centralized in `lib/mock-data.ts` so the Mongo bootstrap content and UI stay aligned.

## Testing

Tests live in `__tests__/` (unit) and `scripts/` (integration/stress/security).

```bash
npm test              # Jest unit tests
npm run test:api      # API endpoint health checks
npm run test:stress   # Concurrent load testing
npm run test:security # XSS, injection, CORS, path traversal audit
```

## Build & Deploy

```bash
npm run build         # Production build (zero errors required)
npm run typecheck     # TypeScript check
```

Vercel deployment uses `vercel.json` for routing, headers, CORS, and regions.

## New features

### Many-to-many faculty-student assignment
- `assignedFacultyIds: string[]` replaces `assignedFacultyId` on student documents.
- Faculty-assignment derived by querying `{ assignedFacultyIds: facultyId }` — no dual-write.
- API: `assignStudentsToFaculty(facultyId, studentIds)` in data-store; bulk idempotent via `$addToSet` / `$pull`.
- Directory shows comma-separated faculty names for students/parents.

### Batch manager (card-grid redesign)
- `Batch` type extended with optional `code`, `capacity`, `startDate`, `endDate` fields.
- `createBatch` and `updateBatch` in `lib/data-store.ts` handle all new fields.
- `deleteBatch(batchId)` removes batch + cascade-deletes teacher assignments.
- API: `DELETE /api/batches` with `{ batchId }` body, admin-only.
- UI: card-grid layout with stats row (Total/Active/Students/Expiring/Inactive), search filter, occupancy bar, teacher avatar, date range, modal-based CRUD with gradient headers (primary for add, warning for edit) and delete confirmation.

### Timetable (weekly grid)
- Full week view with hourly time slots (07:00–21:00) × day columns (Mon–Sun).
- Batch filter pills, teacher dropdown, today banner with upcoming classes.
- Type badges: Lecture (indigo), Lab (blue), Doubt (amber), Test (red), Special (purple).
- Week navigation (Previous / This Week / Next), auto-collision layout via CSS grid.

### Sidebar (CoachSutra-style)
- Clean white surface with grouped navigation (Overview, Academics, People, Curriculum, Finance).
- Search bar with real-time client-side filtering (`data-label` attribute matching).
- User footer with avatar, name, role, logout — replaces previous "Active Session" card.
- SVG icons per nav item, active state with indigo background/tint.
- Full-height layout (`h-fit`) — no internal scrolling, content dictates height.

### Legal pages & footer
- `/privacy` — Privacy Policy
- `/terms` — Terms & Conditions
- `/eula` — End User License Agreement
- `SiteFooter` component in root layout links to all three.

### Color scheme (indigo)
- Primary: `#4f46e5` (indigo-600), strong: `#4338ca`, soft: `rgba(79,70,229,0.1)`.
- Dark mode primary: `#818cf8` (indigo-400).
- Heading: `#1e293b`, border: `#e2e8f0`.
- All shadow/glow/scrim values updated to match indigo palette.
- Light body background uses indigo-teal radial gradients.

## Suggested next milestones

1. Add a one-time duplicate-user cleanup script for existing Mongo collections before enforcing unique indexes on older datasets.
2. Introduce hashed passwords instead of plain stored demo passwords.
3. Add media upload and content management routes.
4. Expand admin tooling with archive/delete flows for users and courses.

---

## New features (Jul 2026 session)

### Roles & Permissions (Custom Role System)
- Admin-only CRUD for custom staff roles with color, description, and module-level access control.
- 28 available modules (Overview, Students, Attendance, Fees, Batches, etc.) defined in `AVAILABLE_MODULES`.
- Full assignment system: assign/remove custom roles to/from staff members.
- **Files:**
  - `components/roles-manager.tsx` — full UI with 2 tabs (Roles + Staff Assignments), create/edit/delete roles, assign/unassign staff
  - `app/api/admin/roles/route.ts` — GET (list+stats), POST (create)
  - `app/api/admin/roles/[id]/route.ts` — PUT (update), DELETE (remove)
  - `app/api/admin/roles/assign/route.ts` — POST (assign), DELETE (unassign)
  - `lib/data-store.ts` — 10 functions: `getAllCustomRoles`, `getActiveCustomRoles`, `createCustomRole`, `updateCustomRole`, `deleteCustomRole`, `getRoleAssignments`, `getRoleAssignmentsForUser`, `assignRoleToUser`, `removeRoleFromUser`, `getCustomRolesForUser`, `getRolesDashboardStats`
  - `lib/types.ts` — `CustomRole`, `CustomRoleAssignment`, `AvailableModule` types

### Profile Data Layer Fixes
- Student phone number fallback chain: `profile.guardianPhone ?? root.parentMobile ?? root.mobile` — fixes phone not showing when data was created via different import paths.
- Parent profile shows linked student details (name, email, phone, course, batch) via `linkedStudentProfile` on `DashboardBundle`.
- **Files:** `lib/data-store.ts` (getDashboardBundle), `lib/types.ts` (DashboardBundle.linkedStudentProfile), `components/my-profile-client.tsx`

### My Profile Page - Complete Redesign
- Left sidebar shows "Profile Details" summary card with all collected fields.
- Students: Course, Student Type, Parent Name/Email/Mobile, Last Qualification, Academic Score, Weak/Strong Subjects (tag inputs).
- All roles: Gender, DOB, Father's Name, Address/City/State/Pincode.
- **File:** `components/my-profile-client.tsx`

### Assigned Faculty on Dashboard Heroes
- Student and parent dashboard heroes show assigned faculty names as pill badges with avatar initials.
- **File:** `components/dashboard-overview.tsx`

### Chat Persistence
- `lastReadTimestamps` persisted to `localStorage` — unread badge counts survive page refresh.
- **File:** `components/dashboard-chat.tsx`

### Certificate System (Admin Issue + All Roles Download)
- Admin-only certificate creation with 3 template designs: Classic Gold, Modern Blue, Professional Dark.
- Templates rendered as HTML components for preview and PDF generation via html2canvas + jsPDF.
- Certificates stored in MongoDB `certificates` collection, fetched in dashboard bundle for all roles.
- Students/educators/parents see their own certificates with download capability; admin has full management panel.
- Certificate numbers auto-generated as `ST-YYYY-XXXX`. Revocation support with reason tracking.
- **Files:**
  - `lib/types.ts` — `Certificate`, `CertificateTemplateId`, `CertificateRecipientType` types; `certificates` added to `AvailableModule` and `DashboardBundle`
  - `lib/certificate-templates.ts` — template configurations (3 designs), `getTemplateConfig()`, `generateCertificateNo()`
  - `lib/data-store.ts` — `getCertificatesForRole()`, added to `getDashboardBundle()` Promise.all
  - `lib/seed-database.ts` — certificates collection seeding
  - `lib/mock-data.ts` — 3 sample certificates in seed data
  - `app/api/certificates/route.ts` — GET (list with role filtering), POST (admin-only create)
  - `app/api/certificates/[id]/route.ts` — GET (public read), PATCH (admin revoke), DELETE (admin)
  - `components/certificate-template-renderer.tsx` — 3 visual certificate designs (Classic Gold, Modern Blue, Professional Dark) with compact/full modes
  - `components/admin-certificate-manager.tsx` — admin panel: template picker, recipient search, form, live preview, certificate table, PDF download
  - `components/certificate-card.tsx` — `DashboardCertificatesSection` + `CertificateCard` + preview modal with PDF download
  - `components/dashboard-shell.tsx` — sidebar nav added for all roles; lazy-loaded modules for admin and student/educator/parent views
  - `components/ui-icons.tsx` — added Search, Trash2, Ban, Plus, ChevronDown, AlertTriangle, Eye icons
  - `docs/MOBILE_APP_API.md` — Section 23: full certificate API reference for Android migration
