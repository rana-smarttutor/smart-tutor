const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "20", 10);
const REQUESTS_PER_WORKER = parseInt(process.env.REQUESTS || "10", 10);

async function fetchWithTiming(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const duration = Date.now() - start;
    return { status: res.status, duration, ok: res.ok };
  } catch {
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

async function run() {
  console.log(`\n⚡ Stress Test — ${CONCURRENCY} concurrent × ${REQUESTS_PER_WORKER} requests\n`);

  const targets = [
    { name: "Homepage", url: `${BASE_URL}/` },
    { name: "Courses", url: `${BASE_URL}/courses` },
    { name: "Library", url: `${BASE_URL}/library` },
    { name: "API Courses", url: `${BASE_URL}/api/courses` },
    { name: "API Institute", url: `${BASE_URL}/api/institute` },
  ];

  for (const target of targets) {
    console.log(`── ${target.name} ──`);

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(worker(target.url, i));
    }

    const allResults = (await Promise.all(workers)).flat();
    const total = allResults.length;
    const succeeded = allResults.filter((r) => r.ok).length;
    const failed = allResults.filter((r => !r.ok)).length;
    const durations = allResults.filter((r) => r.duration > 0).map((r) => r.duration);
    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const max = Math.max(...durations);
    const min = Math.min(...durations);
    const errors = allResults.filter((r) => r.error).length;

    console.log(`  Total: ${total}  OK: ${succeeded}  Fail: ${failed}  Errors: ${errors}`);
    console.log(`  Latency: min=${min}ms  avg=${avg}ms  max=${max}ms`);

    if (failed > total * 0.1) {
      console.log(`  ⚠️  High failure rate (${((failed / total) * 100).toFixed(1)}%)`);
    }
    console.log("");
  }
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
