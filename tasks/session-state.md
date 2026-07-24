# Session State: Auth Password Fix + Soft-Delete Account Bin

## What Was The Problem?
1. **Auth failing on production** — passwords in MongoDB were inconsistently stored (some plaintext, some bcrypt hashes from external Atlas trigger)
2. **Admin UI leaked passwords** via `passwordHint: user.password` in `toManagedUser()`
3. **Admin edit re-saved raw hashes** — `passwordHint` was sent as `password` on every save
4. **No soft-delete** — deleting users was permanent with no undo

## What We Built

### bcrypt Auth Layer (`lib/auth.ts`)
```
isBcryptHash(pw) → boolean
hashPassword(pw) → Promise<string>
comparePassword(pw, hash) → Promise<boolean>
```

### Login Flow (now bcrypt-aware)
- `findUserByCredentials` fetches user by login identifier ONLY (no password in MongoDB query)
- Compares password in app code via `comparePassword()` — transparently handles both plaintext and bcrypt
- Already filters `deletedAt: { $exists: false }`

### Write Paths (now hash passwords)
- `createUserRecord()` — hashes before insert
- `updateUserRecord()` — only updates password when non-empty; hashes new passwords; skips if already bcrypt
- `seed-database.ts` — hashes before seed

### Soft-Delete System
- `deleteUserRecord(id)` → sets `deletedAt` timestamp (soft-delete)
- `restoreUserRecord(id)` → removes `deletedAt`
- `getDeletedUsers()` → lists soft-deleted users
- `permanentDeleteUserRecord(id)` → actual DB removal
- New API: `app/api/admin/account-bin/route.ts` (GET/PATCH/DELETE)

### Password Leak Fixes
- Removed `passwordHint: user.password` from `toManagedUser()` in `lib/data-store.ts`
- Removed `passwordHint: user.password` from mock `toManagedUser()` in `lib/mock-data.ts`
- Removed `passwordHint: defaultPassword` from `createUserDraft()` in `lib/mock-data.ts`
- Removed `passwordHint` display from `admin-student-manager.tsx`
- Profile route passes `password: ""` instead of stored hash

### TypeScript Types
- `SessionUser` in `lib/types.ts` — added `deletedAt?: string`
- `UserDocument` in `lib/data-store.ts` — added `deletedAt?: string`
- `ManagedUser` — kept `passwordHint` as optional (for client-side draft state only)

## Status: COMPLETE (all items done)

## Key Files Modified
```
lib/auth.ts                    — bcrypt helpers
lib/data-store.ts              — findUserByCredentials, createUserRecord, updateUserRecord, deleteUserRecord, restoreUserRecord, getDeletedUsers, permanentDeleteUserRecord, toSessionUser, toManagedUser, getUsersForAdmin, getStudentDirectory, getPendingEducatorRequests, findFullUserById, findUserDocumentByEmail, findUserDocumentByMobile, getStudentStats, getStudentDirectoryV2, computeStudentRiskScores, exportStudentsCsv
lib/types.ts                   — SessionUser.deletedAt
lib/mock-data.ts               — removed passwordHint leaks
lib/seed-database.ts           — hashes passwords before seed
app/api/users/route.ts         — password optional in PATCH
app/api/profile/route.ts       — passes "" instead of stored password
app/api/profile/delete-account/route.ts — soft-delete
app/api/admin/account-bin/route.ts       — NEW: soft-delete bin API
components/dashboard-account-directory.tsx — password field optional
components/admin-student-manager.tsx      — removed passwordHint display
package.json                               — added bcryptjs
```

## DB Info
- MongoDB Atlas: `mongodb://ankit:Prodpass69@ac-fffxkjk-shard-00-{0,1,2}.hexnnuf.mongodb.net:27017/smart_tutor`
- 40 users total
- bcrypt hashes came from external Atlas trigger (not in this codebase)
- `supriya@smarttutors.co.in` had bcrypt hash; all others plaintext
