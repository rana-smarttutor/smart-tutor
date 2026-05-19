<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Smart Tutors Project Rules

## Product scope

- Build for Smart Tutors, a Vashi-based educational institute.
- Keep the visual design professional, colorful, and consistent.
- Light theme is the default. Dark theme must remain polished and fully usable.
- Desktop is the primary target, but every screen must remain mobile friendly.
- Contain horizontal overflow everywhere.

## Authorization model

- Roles are `student`, `educator`, and `admin`.
- Keep role rules centralized in `lib/mock-data.ts` and `lib/auth.ts`.
- Do not add Firebase auth yet. Use the Mongo-backed cookie session flow until the team explicitly replaces it.
- Public visitors can browse public content without a stored user role.
- Students can access personal dashboards, notices, tests, and learning material.
- Educators can manage courses, create and grade tests, and coordinate messages.
- Admins can create users, control access levels, and manage permissions.

## Architecture conventions

- Use the App Router only.
- Put local API routes under `app/api/**/route.ts`.
- Keep shared bootstrap content in `lib/mock-data.ts`.
- Keep MongoDB connection logic in `lib/mongodb.ts`.
- Use `.env.local` from `example.env` with `MONGODB_URI`, `MONGODB_DB`, and `MONGODB_BOOTSTRAP_KEY`.
- Prefer server components for pages unless client state is required.
- Use small client components for theme switching, login actions, and logout actions.
- Standardized course names belong in `lib/course-library.ts`.
- User integrity rules belong at the API/data-store boundary: one unique id and one unique email per person.

## Team consistency

- Extend existing design tokens in `app/globals.css` rather than introducing isolated color systems.
- Keep new pages on the same Figma-inspired Smart Tutors theme: white shells, soft gray spacing, violet accents, rounded product panels, Inter typography, and consistent spacing across desktop and mobile.
- Reuse the same surface, section, pill, and action button styles where possible.
- Keep copy professional and institute-appropriate.
- When adding new role features, update both UI and API authorization together.
- Document any new shared pattern in `docs/TEAM_GUIDE.md`.

## Workflow Orchestration
### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
### 3. Subagent Strategy
- Use subagents liberally to keap main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
-
One task per subagent for focused execution
### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate conrectness
### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
-
-
If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
Skip this for simple, obvious fixes -- don't over-engineer
Challenge your own work before presenting it
### 6. Autonomous Bug Figing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, arrors, falling tests -- then resolve them
Zero context switching required from the user
Go fix failing Cl tests without being told how
## Task Management
1. Plan First: Write plan to tasks/todo.md with checkable items
2. Verify Plan: Check in before starting implementation
3. Track Progress: Mark items complete as you go
4. Explain Changes: High-level summary at each step
5. Document Results: Add review section to tasks/todo.md
6. Capture Lessons: Update tasks/lessons md after corrections
## Core Principles
- Simplicity First: Make every change as simple as possible. Impact minimal code. - No Laziness: Find root couses. No temporary fixes. Senior developer standards. - Minimal Impact: Only touch what's necessary. No side effects with new bugs.
