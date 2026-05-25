# Task Review

## Checklist

- [x] Inspect the current build status and course coverage.
- [x] Expand the standardized course library to cover more education branches without breaking existing course keys.
- [x] Update bootstrap/public copy so the broader academic coverage is reflected outside the course catalog.
- [x] Auto-backfill missing standardized course records into Mongo at runtime.
- [x] Document the new shared course-template rule in `docs/TEAM_GUIDE.md`.
- [x] Verify the changes with a production build.

## Current Task

- [x] Inspect the courses page rendering flow for duplicate Class 6-8 entries.
- [x] Merge duplicate `Class 6th-8th Regular Academic (State/CBSE)` cards into one grouped course entry with sub-option selection.
- [x] Verify the grouped course behavior and build stability.

## Review

- The standardized course catalog now covers primary classes, middle school, secondary, senior secondary, junior college, diploma/polytechnic, graduation, entrance exams, government exams, and counselling.
- Existing standardized keys were preserved so older Mongo course documents continue to hydrate correctly.
- Public bootstrap copy now reflects the broader scope of Smart Tutors offerings, including primary learning and junior college support.
- Runtime course reads now normalize older Mongo course records and insert any missing standard tracks automatically.
- `npm run build` passed after the catalog expansion.
- The Class 6-8 regular academic duplicates on the courses page now render as one grouped card with a modal-level option selector for the underlying variants.
- The Class 6-8 regular academic family now appears as one larger combined selector card at the bottom of the section, while the other course cards remain in their normal positions above it.
- `npx tsc --noEmit` passed after the UI change.
- `npm run build` could not complete in this environment because `next/font` failed to fetch `Geist`, `Geist Mono`, and `Playfair Display` from Google Fonts.
