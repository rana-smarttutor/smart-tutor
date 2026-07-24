# Todo: Auth Password Fix + Soft-Delete Account Bin

## Status: 100% Complete

## Completed Work

### 1. `deletedAt` Filters Added to 9 Functions (lib/data-store.ts)
- [x] `enrichWithFacultyNames()` — added filter on faculty lookup
- [x] `approveEducatorRequest()` — filter on updateOne + findOne
- [x] `rejectEducatorRequest()` — filter on updateOne + added `deletedAt` to $set (soft-delete)
- [x] `getPendingUserRequests()` — filter on find
- [x] `approveUserRequest()` — filter on updateOne + findOne
- [x] `rejectUserRequest()` — converted from `deleteOne` to soft-delete (`updateOne` with `deletedAt`)
- [x] `toggleUserVerification()` — filter on updateOne
- [x] `getEducators()` — filter on find
- [x] `getEducatorsForStudent()` — filter on findOne + find

### 2. Vercel Caching Fix
- [x] Rewrote `public/sw.js` — network-first strategy, versioned caches, `skipWaiting()` + `clients.claim()`, stale cache cleanup
- [x] Added `Cache-Control: no-cache, no-store, must-revalidate` to HTML pages in `vercel.json`
- [x] Added `Cache-Control: public, max-age=31536000, immutable` to `_next/static/*` in `vercel.json`

### 3. Optional Cleanup
- [ ] Remove dead `getDemoCredentials()` function
- [ ] Verify demo login page still works (if used)
