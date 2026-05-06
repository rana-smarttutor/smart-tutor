# Smart Tutor Team Guide

## What exists now

- Public landing page with polished institute storytelling and animated sections.
- MongoDB-backed authentication and app content, with the old mock dataset now serving only as a bootstrap template source.
- Mobile header keeps login as a visible quick-access action outside the hamburger menu, opening a compact login sheet on small screens.
- Role-aware dashboard shell for student, educator, and admin.
- Real login form now supports username/email + password, with direct demo role access kept as a secondary shortcut.
- Local API routes for auth, dashboard, courses, messages, tests, users, institute data, bootstrap initialization, and Mongo health checks.
- MongoDB now acts as the runtime source of truth through `MONGODB_URI` and `MONGODB_DB`.
- Public course catalog reads live detailed course data from Mongo and also keeps a browser-side local cache copy.
- Admin can manage standardized courses through the dashboard using a select-only course name list with editable duration, mode, summary, description, and key points.
- The standardized course library now covers primary, middle school, secondary, senior secondary, junior college, diploma, graduation, entrance exams, government exams, and counselling tracks.
- User integrity now requires one unique person id and one unique email per user, with no guest accounts stored in the user system.

## Demo credentials

- Student: `riya@smarttutor.demo` / `Student@123`
- Educator: `amit@smarttutor.demo` / `Educator@123`
- Admin: `admin@smarttutor.demo` / `Admin@123`

## Core files

- `app/page.tsx`: landing page
- `app/login/page.tsx`: real login + direct demo access
- `app/dashboard/page.tsx`: role-aware dashboard
- `app/mock-test/page.tsx`: interactive mock-test experience
- `app/api/**/route.ts`: local APIs
- `app/api/admin/bootstrap/route.ts`: protected bootstrap route for initializing Mongo collections from the template dataset
- `app/api/admin/mongo-status/route.ts`: Mongo connectivity check
- `app/api/courses/details/route.ts`: live detailed course feed for the public catalog
- `components/theme-provider.tsx`: theme state
- `components/real-login-form.tsx`: username/email + password sign-in
- `components/mock-login-form.tsx`: direct demo access flow
- `components/logout-button.tsx`: session cleanup flow
- `components/dashboard-course-manager.tsx`: admin course creation and editing
- `components/course-catalog-client.tsx`: public course catalog fetch + local cache wrapper
- `lib/mock-data.ts`: template seed source only
- `lib/data-store.ts`: Mongo-backed runtime repository for auth, public content, dashboard data, and writes
- `lib/auth.ts`: cookie session helpers
- `lib/validation.ts`: shared sanitization and validation helpers for login and local APIs
- `lib/mongodb.ts`: MongoDB client utility
- `lib/seed-database.ts`: collection bootstrap logic for direct Mongo template upload
- `lib/course-library.ts`: standardized course-name source and template definitions

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
- Use the standardized course templates in `lib/course-library.ts` when creating or editing courses. Admin can edit course details, but not invent arbitrary new course-name variants.
- Keep school-stage coverage explicit in course templates. If Smart Tutor adds a new academic branch, extend `lib/course-library.ts` first and then update public-facing summary copy in `lib/mock-data.ts`.
- Interactive public modules like course popups and mock tests should read from Mongo-backed routes or repository functions, not from page-local arrays.
- Keep public institute identity details such as primary phone, WhatsApp, Instagram, and leadership info centralized in `lib/mock-data.ts` so the Mongo bootstrap content and UI stay aligned.

## Suggested next milestones

1. Add a one-time duplicate-user cleanup script for existing Mongo collections before enforcing unique indexes on older datasets.
2. Introduce hashed passwords instead of plain stored demo passwords.
3. Add media upload and content management routes.
4. Expand admin tooling with archive/delete flows for users and courses.
