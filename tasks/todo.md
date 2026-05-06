# Task Review

## Checklist

- [x] Inspect the current build status and course coverage.
- [x] Expand the standardized course library to cover more education branches without breaking existing course keys.
- [x] Update bootstrap/public copy so the broader academic coverage is reflected outside the course catalog.
- [x] Auto-backfill missing standardized course records into Mongo at runtime.
- [x] Document the new shared course-template rule in `docs/TEAM_GUIDE.md`.
- [x] Verify the changes with a production build.

## Review

- The standardized course catalog now covers primary classes, middle school, secondary, senior secondary, junior college, diploma/polytechnic, graduation, entrance exams, government exams, and counselling.
- Existing standardized keys were preserved so older Mongo course documents continue to hydrate correctly.
- Public bootstrap copy now reflects the broader scope of Smart Tutor offerings, including primary learning and junior college support.
- Runtime course reads now normalize older Mongo course records and insert any missing standard tracks automatically.
- `npm run build` passed after the catalog expansion.
