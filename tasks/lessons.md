# Lessons Learned

## Phone Data Storage Inconsistency (Jul 2026)

### Problem
Student phone numbers appeared empty on My Profile page despite being collected during registration.

### Root Cause
Phone numbers are stored in **two different locations** depending on the import method:
- `profile.guardianPhone` — set by `importStudentsFromCsv()` (line 1983 of data-store.ts)
- Root-level `parentMobile` — set by `createUser()` (line 1680) and `bulkUpdateStudentsFromCsv()` (line 2031)

The profile component read only `profile.guardianPhone`, missing data stored at root level.

### Fix
In `getDashboardBundle()`, merge root-level phone fields into profile response:
```ts
profile: userDoc?.profile ? {
  ...userDoc.profile,
  guardianPhone: userDoc.profile.guardianPhone ?? userDoc.parentMobile ?? userDoc.mobile,
  parentMobile: userDoc.profile.parentMobile ?? userDoc.parentMobile,
} : undefined
```

### Lesson
When data can be written from multiple entry points (CSV import, API creation, bulk update), always create a **single merge point** at the read layer. Do not assume data lives in exactly one field — use fallback chains.

---

## Parent Profile Missing Child Data (Jul 2026)

### Problem
Parents couldn't see their child's name, phone, or course on their profile page.

### Root Cause
`DashboardBundle` only passed `linkedStudentId` (the ID string) without the full linked student profile. The parent profile component had no student data to render.

### Fix
1. Added `linkedStudentProfile` optional field to `DashboardBundle` type
2. In `getDashboardBundle()`, fetch the linked student document and extract name, email, phone, course, batch
3. Added "Student Details" card to parent profile sidebar

### Lesson
Always check what data the **consumer** needs, not just what the **database** stores. An ID reference is useless without the resolved data.

---

## Role Permissions System Visibility (Jul 2026)

### Problem
User reported not seeing Roles & Permissions in admin panel.

### Investigation
Code review confirmed:
- Admin sidebar has `{ id: "roles", label: "Roles & Permissions" }` at position 3
- `RolesManager` renders when `showRoles && role === "admin"`
- All 6 API endpoints exist and are wired
- All 10 data-store CRUD functions exist

### Likely Cause
User may not have been logged in as admin, or the sidebar item wasn't clicked. The feature is fully implemented and wired.

### Lesson
Before investigating a "missing feature" bug, first verify:
1. The correct role is logged in
2. The sidebar item is being clicked
3. The component doesn't have a runtime error (check browser console)

---

## Chat Badge Stuck on Refresh (Jul 2026)

### Problem
Chat notification badge count persisted incorrectly across page refreshes.

### Root Cause
`lastReadTimestamps` was stored in React `useState` which resets to empty on page reload. Unread counts recalculated from scratch every time.

### Fix
Persist `lastReadTimestamps` to `localStorage`:
```ts
const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>(() => {
  if (typeof window === "undefined" || !session?.id) return {};
  try {
    const raw = localStorage.getItem(`chat_last_read_${session.id}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
});
```

### Lesson
For any "last seen/read" tracking that must survive page refresh, use `localStorage` (or a server endpoint). React state alone is ephemeral.
