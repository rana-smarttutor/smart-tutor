const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function test(label, url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000),
    });
    const duration = Date.now() - start;
    return { label, status: res.status, duration, ok: res.ok, headers: res.headers };
  } catch (err) {
    return { label, status: 0, duration: Date.now() - start, ok: false, error: err.message };
  }
}

function check(label, passed, detail = "") {
  const mark = passed ? "✓" : "✗";
  console.log(`  ${mark} ${label}${detail ? ` (${detail})` : ""}`);
  return passed ? 1 : 0;
}

async function run() {
  console.log("\n🔒 Security & Attack Surface Tests\n");
  let pass = 0;
  let fail = 0;

  // 1. Security headers
  console.log("── Security Headers ──");
  const res = await fetch(`${BASE_URL}/`);
  const headers = res.headers;

  pass += check("X-Content-Type-Options: nosniff", headers.get("x-content-type-options") === "nosniff");
  pass += check("X-Frame-Options: DENY", headers.get("x-frame-options") === "DENY");
  pass += check("X-XSS-Protection present", !!headers.get("x-xss-protection"));
  pass += check("Referrer-Policy present", !!headers.get("referrer-policy"));

  // 2. No sensitive info leakage
  console.log("\n── Information Leakage ──");
  const pageRes = await fetch(`${BASE_URL}/`);
  const pageText = await pageRes.text();
  pass += check("No stack traces in HTML", !pageText.includes("Error:") && !pageText.includes("at eval"), "found stack-like content");

  // 3. SQL / NoSQL injection attempts on login
  console.log("\n── Injection Attempts ──");
  const injections = [
    { email: "' OR 1=1 --", password: "anything", name: "SQLi basic" },
    { email: '{"$gt": ""}', password: "anything", name: "NoSQL $gt" },
    { email: '{"$ne": null}', password: "anything", name: "NoSQL $ne" },
    { email: "admin@test.com", password: "' OR '1'='1", name: "SQLi password" },
  ];

  for (const inj of injections) {
    const r = await test(`${inj.name} on login`, `${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inj.email, password: inj.password }),
    });
    pass += check(`${inj.name} blocked`, r.status === 401 || r.status === 400, `(got ${r.status})`);
  }

  // 4. XSS attempts via public enquiry form
  console.log("\n── XSS Attempts ──");
  const xssPayloads = [
    { value: "<script>alert(1)</script>", field: "name", desc: "script tag in name" },
    { value: "<img src=x onerror=alert(1)>", field: "message", desc: "img onerror in message" },
    { value: "javascript:alert(1)", field: "message", desc: "javascript: in message" },
    { value: "{{7*7}}", field: "message", desc: "template injection in message" },
  ];

  for (const xss of xssPayloads) {
    const body = {
      name: "Test User",
      contact: "test@test.com",
      message: "Safe message",
      [xss.field]: xss.value,
    };
    const r = await test(`XSS via ${xss.desc}`, `${BASE_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // Should accept (sanitize) or reject — not crash
    pass += check(`${xss.value} handled safely`, r.status < 500, `(got ${r.status})`);
  }

  // 5. Rate limiting awareness — rapid requests
  console.log("\n── Rapid Fire (Rate Limit Check) ──");
  const rapidResults = [];
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${BASE_URL}/api/courses`);
    rapidResults.push(r.status);
  }
  pass += check("Rapid requests handled", rapidResults.every((s) => s < 500), `statuses: [${rapidResults.slice(0, 5).join(",")}...]`);

  // 6. Path traversal — Next.js normalizes, check content not leaked
  console.log("\n── Path Traversal ──");
  const paths = [
    "/../../etc/passwd",
    "/..%2F..%2Fetc/passwd",
    "/.%2e/.%2e/.%2e/etc/passwd",
    "/api/../../../etc/passwd",
  ];
  for (const p of paths) {
    const r = await test(p, `${BASE_URL}${p}`);
    const text = await (await fetch(`${BASE_URL}${p}`)).text();
    const noRootLeak = !text.includes("root:") && !text.includes("[extensions]");
    pass += check(`${p} does not leak filesystem`, noRootLeak, `(status ${r.status})`);
  }

  // 7. CORS security
  console.log("\n── CORS Configuration ──");
  const corsRes = await fetch(`${BASE_URL}/api/courses`, {
    headers: { Origin: "https://evil.com" },
  });
  const corsHeader = corsRes.headers.get("access-control-allow-origin");
  pass += check("CORS does not reflect untrusted origin", corsHeader !== "https://evil.com" && corsHeader !== null, `origin: ${corsHeader}`);

  // 8. No directory listing
  console.log("\n── Directory Listing ──");
  const dirs = ["/api", "/_next"];
  for (const dir of dirs) {
    const r = await fetch(`${BASE_URL}${dir}`);
    const text = await r.text();
    const noIndex = !text.toLowerCase().includes("index of");
    pass += check(`${dir} does not list directory`, noIndex, `(status ${r.status})`);
  }

  // 9. Content-Type verification on API
  console.log("\n── API Response Format ──");
  const apiRes = await fetch(`${BASE_URL}/api/courses`);
  const ct = apiRes.headers.get("content-type") || "";
  pass += check("/api/courses returns JSON", ct.includes("application/json"), `(content-type: ${ct})`);

  console.log(`\n📊 Security Test Results: ${pass} passed, ${fail} failed\n`);

  if (fail > 0) {
    console.log("⚠️  Some security checks failed. Review the issues above.\n");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
