# Smart Tutors — Academic Empowerment Platform

Production-grade educational ecosystem for a Vashi-based institute. Next.js 16, MongoDB, AI mentoring.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19, Tailwind CSS v4 |
| **Database** | MongoDB 7 (Native Driver) |
| **Storage** | Vercel Blob + Mega.nz |
| **AI** | Gemini API, OpenAI API |
| **Auth** | HMAC-signed cookie sessions |
| **Charts** | Recharts |
| **Icons** | Lucide React, Motion |
| **Deployment** | Vercel (configured via `vercel.json`) |

---

## Quick Start

```bash
cp example.env .env.local   # fill in your credentials
npm install
npm run dev                 # http://localhost:3000
```

### First-time setup

After starting the dev server, bootstrap the database:

```bash
curl -X POST http://localhost:3000/api/admin/bootstrap \
  -H "x-bootstrap-key: YOUR_BOOTSTRAP_KEY"
```

---

## Project Structure

```
├── app/                  # Next.js App Router pages + API routes
│   ├── api/              #   47 route handlers
│   ├── dashboard/        #   Role-aware dashboard
│   ├── courses/          #   Public course catalog
│   ├── library/          #   Digital library
│   └── ...
├── components/           # 46 React components
├── lib/                  # Shared modules
│   ├── auth.ts           #   Session cookie management
│   ├── data-store.ts     #   MongoDB read/write operations
│   ├── validation.ts     #   Input sanitization
│   ├── mongodb.ts        #   Mongo client singleton
│   └── mock-data.ts      #   Bootstrap template source
├── proxy.ts              # Next.js 16 proxy (auth guard, SEO, security headers)
├── vercel.json           # Vercel deployment configuration
├── scripts/              # Integration, stress, and security test scripts
├── __tests__/            # Unit tests
└── docs/
    ├── TEAM_GUIDE.md     # Developer conventions and architecture
    └── AGENTS.md         # AI-assisted development rules
```

---

## API Routes

All 47 API handlers live under `app/api/`:

| Category | Routes |
|----------|--------|
| **Auth** | login, signup, logout, session |
| **Users** | CRUD, verify, registered students |
| **Courses** | listing, details |
| **Tests** | CRUD, submissions, questions |
| **Library** | books CRUD, upload, download, preview, sections |
| **Dashboard** | aggregated data per role |
| **Admin** | bootstrap, mongo-status, user/educator requests |
| **Messaging** | messages, chat, enquiries |
| **Payments** | Razorpay create-order, verify |
| **Performance** | reports CRUD, photos, analytics |
| **Mega.nz** | upload, stream, folders, delete |
| **Mock Test** | quiz data, AI generation |

---

## Testing

```bash
npm test                  # Unit tests (validation, auth)
npm run test:api          # API endpoint health checks
npm run test:stress       # Load test (20 concurrent × 10 requests)
npm run test:security     # Security audit (XSS, injection, CORS)
```

Test files:
- `__tests__/validation.test.ts` — 30+ sanitization unit tests
- `scripts/api-test.mjs` — endpoint availability + auth guard checks
- `scripts/stress-test.mjs` — concurrent load with latency metrics
- `scripts/security-test.mjs` — 20+ attack surface checks

---

## Deployment

```bash
npm run build             # Zero-error production build
```

### Vercel

1. Push to Git, import into Vercel.
2. Set all env vars from `example.env` plus `SESSION_SECRET`.
3. Deploy — `vercel.json` handles headers, CORS, redirects, and regions.

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `MONGODB_DB` | Yes | Database name |
| `MONGODB_BOOTSTRAP_KEY` | Yes | Bootstrap endpoint secret |
| `SESSION_SECRET` | Yes | 64-char random string for session HMAC |
| `GEMINI_API_KEY` | No | Gemini AI (chatbot + quiz generation) |
| `OPENAI_API_KEY` | No | OpenAI (fallback chatbot) |
| `RAZORPAY_KEY_ID` | No | Razorpay payment gateway |
| `RAZORPAY_KEY_SECRET` | No | Razorpay payment gateway |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob (digital library) |

---

## Security

- **Proxy** (`proxy.ts`): Auth guard with crawler bypass (SEO-friendly). Sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Input sanitization**: All user inputs pass through `lib/validation.ts` (XSS, control chars, length limits).
- **Session auth**: HMAC-signed cookies, httpOnly, secure in production, 8-hour expiry.
- **API auth**: Per-route `getSessionUser()` checks; 401 on missing/invalid session.

---

## Documentation

- **[Owner Manual](./OWNER_MANUAL.md)** — Non-technical guide for institute administrators.
- **[Team Guide](./docs/TEAM_GUIDE.md)** — Architecture, conventions, and contribution rules.
- **[Agent Rules](./AGENTS.md)** — Guidelines for AI-assisted development.

---

## Contact

**Smart Tutors Academy** — Sector 17, Vashi, Navi Mumbai
- Website: [smarttutors.co.in](https://smarttutors.co.in)
