# Lessons Learned

## Password Security
- Always hash passwords server-side with bcrypt before storing — never trust client or external sources
- When migrating from plaintext to bcrypt: fetch by login ID only, compare password in app code via `comparePassword()`
- Never pass `isBcryptHash` check result to `hashPassword` — check first, skip hash if already hashed
- Password fields should NEVER be returned in API responses — use `toManagedUser()` which strips passwords
- The `passwordHint` pattern is dangerous if it leaks `user.password` — remove it entirely

## Soft-Delete Pattern
- Soft-delete = `updateOne({ $set: { deletedAt: new Date().toISOString() } })` instead of `deleteOne()`
- Every query that lists users MUST include `deletedAt: { $exists: false }` filter
- Restore = `updateOne({ $unset: { deletedAt: "" } })`
- Permanent delete = `deleteOne()` but ONLY for users already in the bin
- `findUserDocumentByEmail` and `findUserDocumentByMobile` need the filter too — otherwise soft-deleted users block re-registration

## API Route Patterns
- Optional fields in PATCH routes: check `body.field ?? ""` then skip if empty
- Profile updates should NOT re-send stored passwords back through `updateUserRecord`
- CSV imports go through `createUserRecord` which handles hashing — don't duplicate logic

## Soft-Delete Completeness
- Every query that lists/updates users MUST include `deletedAt: { $exists: false }` filter
- This includes approve/reject/toggle functions — not just list functions
- `rejectUserRequest` was doing `deleteOne` (permanent) — must be `updateOne` with `deletedAt` (soft-delete)
- `rejectEducatorRequest` already set `status: "rejected"` but still needs `deletedAt` in `$set` block

## Code Smells Caught
- `getDemoCredentials()` is dead code — never imported. Don't return raw passwords even if dead
- `enrichWithFacultyNames` queries users by ID list but doesn't filter deleted — will show names of deleted faculty
- `rejectUserRequest` does `deleteOne` — should be soft-delete to match the pattern
- `approveEducatorRequest` / `rejectEducatorRequest` / `approveUserRequest` don't filter deleted users

## Vercel Caching / Deployment
- Service workers with cache-first strategy cause stale deployments — old HTML references new chunk hashes that 404
- Always use network-first for HTML, cache-first only for hashed static assets (`_next/static/*`)
- `sw.js` must have `skipWaiting()` + `clients.claim()` for immediate activation on deploy
- Old caches must be cleaned up in the `activate` event
- HTML pages need `Cache-Control: no-cache, no-store, must-revalidate` — Vercel edge CDN can serve stale HTML otherwise
- `_next/static/*` is content-hashed and safe to cache with `max-age=31536000, immutable`
- Never cache `/` (the HTML shell) in a service worker — it references chunk hashes that change per build

## Workflow
- When fixing security issues, audit ALL read and write paths systematically
- Use grep to find every occurrence of a pattern before declaring "done"
- Dead code (unused functions) can still leak sensitive data if called in future
