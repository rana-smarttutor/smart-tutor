const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "10", 10);
const REQUESTS_PER_WORKER = parseInt(process.env.REQUESTS_PER_WORKER || "5", 10);

async function fetchWithTiming(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const duration = Date.now() - start;
    return { status: res.status, duration, ok: res.ok };
  } catch (err) {
    return { status: 0, duration: Date.now() - start, ok: false, error: true };
  }
}

async function worker(url, id) {
  const results = [];
  for (let i = 0; i < REQUESTS_PER_WORKER; i++) {
    const result = await fetchWithTiming(url);
    results.push(result);
    if (i % 3 === 0) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  return results;
}

function printStats(label, allResults) {
  const total = allResults.length;
  const succeeded = allResults.filter((r) => r.ok).length;
  const failed = allResults.filter((r => !r.ok)).length;
  const durations = allResults.filter((r) => r.duration > 0).map((r) => r.duration);
  const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const max = durations.length ? Math.max(...durations) : 0;
  const min = durations.length ? Math.min(...durations) : 0;
  const errors = allResults.filter((r) => r.error).length;

  console.log(`  Total: ${total}  OK: ${succeeded}  Fail: ${failed}  Errors: ${errors}`);
  console.log(`  Latency: min=${min}ms  avg=${avg}ms  max=${max}ms`);

  if (failed > total * 0.1) {
    console.log(`  ⚠️  High failure rate (${((failed / total) * 100).toFixed(1)}%) — review server health`);
  }
}

async function run() {
  console.log(`\n⚡ Stress Test — ${CONCURRENCY} concurrent × ${REQUESTS_PER_WORKER} requests`);
  console.log(`   Base URL: ${BASE_URL}\n`);

  const targets = [
    { name: "Homepage", url: `${BASE_URL}/` },
    { name: "Courses", url: `${BASE_URL}/courses` },
    { name: "Library", url: `${BASE_URL}/library` },
    { name: "API Courses", url: `${BASE_URL}/api/courses` },
    { name: "API Institute", url: `${BASE_URL}/api/institute` },
    { name: "API Enquiries (POST)", url: `${BASE_URL}/api/enquiries`, method: "POST", body: { name: "Stress Test", contact: "test@stress.local", message: "Stress test enquiry" } },
  ];

  for (const target of targets) {
    console.log(`── ${target.name} ──`);

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push((async () => {
        const results = [];
        for (let j = 0; j < REQUESTS_PER_WORKER; j++) {
          const start = Date.now();
          try {
            const opts = { signal: AbortSignal.timeout(15000) };
            if (target.method === "POST") {
              opts.method = "POST";
              opts.headers = { "Content-Type": "application/json" };
              opts.body = JSON.stringify(target.body);
            }
            const res = await fetch(target.url, opts);
            results.push({ status: res.status, duration: Date.now() - start, ok: res.ok });
          } catch {
            results.push({ status: 0, duration: Date.now() - start, ok: false, error: true });
          }
          if (j % 3 === 0) await new Promise((r) => setTimeout(r, 50));
        }
        return results;
      })());
    }

    const allResults = (await Promise.all(workers)).flat();
    printStats(target.name, allResults);
    console.log("");
  }

  const exitCode = 0;
  console.log(`\n📊 Stress test complete. Exit code: ${exitCode}\n`);
  process.exit(exitCode);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});