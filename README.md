# Smart Tutor

Smart Tutor is a Next.js 16 web app for a Vashi-based educational institute. The current app includes a polished public site, MongoDB-backed authentication and content, role-aware workspaces for students, educators, and admins, and admin tools for managing users and standardized courses.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- MongoDB Node driver
- Vercel-ready deployment structure

## Current Roles

- `student`
- `educator`
- `admin`

The old `guest` role has been removed from the account model. Public visitors can still browse the landing page and public routes, but they are not stored as a user role anymore.

## Login Modes

- Real login: username/email + password against the MongoDB `users` collection
- Direct demo login: role-based shortcut for student, educator, and admin

## Demo Accounts

- `riya@smarttutor.demo` / `Student@123`
- `amit@smarttutor.demo` / `Educator@123`
- `admin@smarttutor.demo` / `Admin@123`

## Main Features

- Production-style landing page with institute branding, results imagery, animated reveals, counter stats, and an interactive achiever section
- Contact page and footer with embedded SmartIQ Academy Google Maps frames
- Real login screen plus secondary direct demo access
- Role-aware dashboard shell for students, educators, and admins
- Admin account control with role sorting
- Admin course control with standardized course-name selection and editable course details
- Public course catalog backed by MongoDB, refreshed from the database and cached in browser local storage
- **SmartTutor AI Assistant**: Integrated chatbot providing expert study guidance, course recommendations, and file-based tutoring
- Mongo bootstrap and health-check routes for initial setup and runtime verification
- User integrity rules with unique person `id` and unique normalized email

## AI Integration

Smart Tutor features a custom AI assistant designed to support student learning and institutional efficiency.

- **Expert Tutoring**: Specialized logic for education-related queries including study plans, subject-specific doubts, and exam preparation (UPSC, MPSC, Boards, etc.)
- **Context Awareness**: Remembers student details like name, class, and target exams during the session for personalized advice.
- **Material Analysis**: Students can upload PDFs, Word docs, and images for the AI to analyze and provide tutoring on specific study materials.
- **Quick Actions**: Streamlined navigation for common institute information like location, contact details, and course catalogs.
- **Vercel-Ready Backend**: API routes designed for high-performance AI interactions and secure material handling.

## API Routes

- `GET /api/institute`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/dashboard`
- `GET, POST, PATCH /api/courses`
- `GET /api/courses/details`
- `GET, POST /api/messages`
- `GET, POST /api/tests`
- `GET, POST, PATCH /api/users`
- `GET, POST /api/admin/bootstrap`
- `GET /api/admin/mongo-status`
- `POST /api/smarttutor-chat`: AI assistant core logic and memory processing
- `POST /api/upload-material`: File processing for AI tutoring context

## Environment

Create a local environment file from `example.env` and provide:

```bash
MONGODB_URI=your-mongodb-uri
MONGODB_DB=your-database-name
MONGODB_BOOTSTRAP_KEY=your-bootstrap-secret
```

`MONGODB_URI` and `MONGODB_DB` are required for runtime data. `MONGODB_BOOTSTRAP_KEY` protects the bootstrap route used to initialize content and indexes.

## Data Notes

- MongoDB is the runtime source of truth for users, courses, messages, tests, quiz content, and public site content
- `lib/mock-data.ts` is now a bootstrap template source, not the runtime store
- User integrity is enforced through:
  - unique `id`
  - unique normalized `emailKey`
- Standardized course names come from `lib/course-library.ts`

## Team Notes

See `docs/TEAM_GUIDE.md` and `AGENTS.md` for project conventions, role rules, and collaboration expectations.
