# Pending Approval Flow for Signups

## Architecture

### 1. Types (`lib/types.ts`)
- Add `verified?: boolean` to `SessionUser`, `UserDocument`, `UserProfile`

### 2. Data Store (`lib/data-store.ts`)
- `toSessionUser()` → include `status` + `verified`
- Student signup → status `"pending"` (not `"active"`)
- `approveUserRequest(id)` → sets `status: "active"`, `verified: true`
- `rejectUserRequest(id)` → deletes the user document
- `getPendingUserRequests()` → all users with `status: "pending"`
- `toggleUserVerification(id, verified)` → set verified boolean
- Parent account gets parentEmail + **parentPassword** (not auto-generated)

### 3. Signup Form
- Add `parentPassword` field to `FormData`
- Add `parentPassword` + `parentConfirmPassword` inputs to Personal Information section
- On success → redirect to `/application-submitted`

### 4. Application Submitted Page
- Create `/application-submitted/page.tsx`
- Shows "Application in Process" with status info
- If pending → "Awaiting admin confirmation"
- If rejected → "Contact admin"

### 5. Login Fix (`app/api/auth/login/route.ts`)
- Fix `user.status` check (was broken because SessionUser dropped status)
- Pending users of ANY role → return pendingApproval=true
- Rejected users → return 403

### 6. Dashboard Guard (`app/dashboard/page.tsx`)
- Add status check: if pending → redirect to `/application-submitted`
- If rejected → redirect to `/login` with error

### 7. Admin Panel
- Add "Verification Requests" tab in `dashboard-account-directory.tsx`
- Table of pending users with Approve / Reject buttons
- In "Registered Directory" edit modal → add verified badge toggle
- New API endpoints: `POST /api/admin/approve`, `POST /api/admin/reject`, `PATCH /api/users/verify`

### 8. Verification Badge
- Show checkmark badge on profile card
- Show in admin user table
