# Capacitor Conversion Prompt — Smart Tutors Mobile App

## System Prompt (Copy This First)

```
You are a senior mobile developer converting a Next.js web app into a Capacitor-based
Android/iOS app. The backend API is already deployed at https://smarttutors.in/api.

CRITICAL RULES:
1. NEVER modify backend API routes — only build the mobile client
2. ALL API calls go through HTTP to the base URL above
3. Auth uses HTTP-only cookies — use capacitor-http or a cookie-aware HTTP client
4. Every response may contain `error` string on failure — ALWAYS check for it
5. Every endpoint returns JSON — parse all responses as JSON
6. IDs are human-readable strings (not ObjectId)
7. All dates are ISO 8601 strings
8. No pagination exists yet — full datasets are returned
9. File uploads use Vercel Blob signed URLs
10. The session cookie name is "smart_tutor_session"

OUTPUT FORMAT:
- TypeScript/JavaScript for Capacitor + React (or your framework of choice)
- Each API route becomes a typed function in `src/api/` directory
- Types go in `src/types/`
- HTTP client wraps capacitor-http with cookie management
```

---

## Project Structure

```
src/
  api/
    client.ts              # HTTP client with cookie/auth handling
    auth.ts                # Auth endpoints
    users.ts               # User CRUD (admin)
    admin.ts               # Admin request management + account bin
    dashboard.ts           # Dashboard data
    courses.ts             # Course management
    tests.ts               # Tests + submissions
    messages.ts            # Messaging
    notifications.ts       # Notifications
    profile.ts             # Profile + password + delete
    index.ts               # Re-exports all
  types/
    auth.ts                # SessionUser, LoginRequest, LoginResponse
    users.ts               # ManagedUser, StudentDirectoryEntry
    courses.ts             # CourseItem
    tests.ts               # TestItem, TestSubmission, Question
    messages.ts            # MessageItem
    notifications.ts       # AppNotification
    profile.ts             # UpdateProfileRequest
    index.ts               # Re-exports all
  stores/                  # State management (optional)
```

---

## HTTP Client (src/api/client.ts)

```ts
import { CapacitorHttp } from '@capacitor/core';

const BASE_URL = 'https://smarttutors.in';

interface ApiOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  cookies: Record<string, string>;
}

export async function api<T>(options: ApiOptions): Promise<ApiResponse<T>> {
  const { method, path, body, params, headers = {} } = options;
  let url = `${BASE_URL}${path}`;
  if (params) {
    const search = new URLSearchParams(params).toString();
    url += `?${search}`;
  }
  const response = await CapacitorHttp.request({
    method,
    url,
    headers: { 'Content-Type': 'application/json', ...headers },
    data: body,
  });
  const cookies = parseCookies(response.headers);
  return {
    data: response.data as T,
    error: (response.data as any)?.error ?? null,
    status: response.status,
    cookies,
  };
}

function parseCookies(headers: Record<string, string>): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
  if (setCookie) {
    setCookie.split(',').forEach(cookie => {
      const [key, value] = cookie.split(';')[0].split('=');
      if (key && value) cookies[key.trim()] = value.trim();
    });
  }
  return cookies;
}
```

---

## Error Handling Pattern

```ts
async function handleApiCall<T>(
  apiFn: () => Promise<ApiResponse<T>>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await apiFn();
    if (response.error) return { data: null, error: response.error };
    if (response.status >= 400) return { data: null, error: `Request failed (${response.status})` };
    return { data: response.data, error: null };
  } catch (err) {
    return { data: null, error: 'Network error. Please check your connection.' };
  }
}
```
