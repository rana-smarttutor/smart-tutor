import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(process.env, key)) continue;

    // Strip wrapping quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

// `next dev` loads `.env.local`, but `node scripts/*.mjs` does not.
loadEnvFile(".env.local");
loadEnvFile(".env");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const start = Date.now();
  const res = await fetch(url, options);
  const duration = Date.now() - start;

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data, duration, ok: res.ok };
}

let pass = 0;
let fail = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label} ${detail}`);
  }
}

async function run() {
  console.log("\n🧪 API Health Check Tests\n");
  console.log(BASE_URL);

  // Public pages
  console.log("── Public Endpoints ──");
  const pagePaths = ["/", "/courses", "/library", "/placements", "/contact", "/login", "/signup"];

  for (const path of pagePaths) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, { method: "HEAD" });
      assert(`${path} returns ${res.status}`, res.status < 500, `(got ${res.status})`);
    } catch {
      assert(`${path} is reachable`, false, "(connection refused)");
    }
  }

  // Public API routes
  console.log("\n── Public API ──");
  let apiRes = await request("GET", "/api/courses");
  assert("GET /api/courses returns 200", apiRes.status === 200, `(got ${apiRes.status})`);

  apiRes = await request("GET", "/api/institute");
  assert("GET /api/institute returns 200", apiRes.status === 200, `(got ${apiRes.status})`);

  apiRes = await request("GET", "/api/auth/session");
  assert("GET /api/auth/session returns 200 with user:null", apiRes.status === 200 && apiRes.data && apiRes.data.user === null, `(got ${apiRes.status})`);

  // Validation tests
  console.log("\n── Input Validation ──");
  apiRes = await request("POST", "/api/enquiries", { name: "", contact: "" });
  assert("Enquiry form rejects empty name & contact", apiRes.status === 400, `(got ${apiRes.status})`);

  apiRes = await request("POST", "/api/auth/signup", {});
  assert("Signup rejects empty body", apiRes.status === 400, `(got ${apiRes.status})`);

  apiRes = await request("POST", "/api/auth/login", { email: "test@test.com", password: "" });
  assert("Login rejects empty password", apiRes.status === 400 || apiRes.status === 401, `(got ${apiRes.status})`);

  // API auth guard — routes that require a session
  console.log("\n── Auth Guards ──");
  const guardedRoutes = [
    ["POST", "/api/users",        [401, 403], "returns 401/403"],
    ["POST", "/api/tests",        [401, 403], "returns 401/403"],
    ["POST", "/api/messages",     [401, 403], "returns 401/403"],
    ["POST", "/api/upload-material", [401],   "returns 401"],
  ];

  for (const [method, route, expected, note] of guardedRoutes) {
    const r = await request(method, route, {});
    assert(`${method} ${route} rejects unauthenticated (${note})`, expected.includes(r.status), `(got ${r.status})`);
  }

  // Enquiries POST is public (no auth required), should accept valid input
  console.log("\n── Public Submission ──");
  apiRes = await request("POST", "/api/enquiries", {
    name: "Test User",
    contact: "test@example.com",
    message: "Test enquiry from API health check",
  });
  assert("POST /api/enquiries accepts valid input", apiRes.status === 201 || apiRes.status === 200, `(got ${apiRes.status})`);

  // Certificate routes
  console.log("\n── Certificate Routes ──");
  apiRes = await request("GET", "/api/certificates");
  assert("GET /api/certificates requires auth (401)", apiRes.status === 401 || apiRes.status === 403, `(got ${apiRes.status})`);

  apiRes = await request("POST", "/api/certificates", {});
  assert("POST /api/certificates rejects unauthenticated", apiRes.status === 401 || apiRes.status === 403, `(got ${apiRes.status})`);

  apiRes = await request("GET", "/api/certificates/nonexistent-id");
  assert("GET /api/certificates/:id returns 404 for missing", apiRes.status === 404, `(got ${apiRes.status})`);

  apiRes = await request("PATCH", "/api/certificates/nonexistent-id", { status: "revoked" });
  assert("PATCH /api/certificates/:id rejects unauthenticated", apiRes.status === 401 || apiRes.status === 403, `(got ${apiRes.status})`);

  apiRes = await request("DELETE", "/api/certificates/nonexistent-id");
  assert("DELETE /api/certificates/:id rejects unauthenticated", apiRes.status === 401 || apiRes.status === 403, `(got ${apiRes.status})`);

  console.log(`\n📊 Results: ${pass} passed, ${fail} failed\n`);

  if (fail > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
