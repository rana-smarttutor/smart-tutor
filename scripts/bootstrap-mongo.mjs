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

const baseUrl = process.env.BOOTSTRAP_BASE_URL || "http://127.0.0.1:3000";
const bootstrapUrl = `${baseUrl}/api/admin/bootstrap`;
const statusUrl = `${baseUrl}/api/admin/mongo-status`;
const bootstrapKey = process.env.MONGODB_BOOTSTRAP_KEY;
const replaceExisting = process.env.BOOTSTRAP_REPLACE_EXISTING === "true";
const waitSeconds = Number(process.env.BOOTSTRAP_WAIT_SECONDS || 30);

if (!bootstrapKey) {
  console.error(
    "Missing MONGODB_BOOTSTRAP_KEY. Add it to `.env.local` (recommended) or export it in your shell before running bootstrap.",
  );
  process.exit(1);
}

try {
  const startedAt = Date.now();
  let lastStatusPayload = null;

  while (true) {
    try {
      const status = await fetch(statusUrl, { 
        method: "GET",
        headers: {
          "x-bootstrap-key": bootstrapKey,
        },
      });
      const statusPayload = await status.json().catch(() => ({}));
      lastStatusPayload = statusPayload;

      if (!status.ok) {
        console.error("Mongo status check failed:", status.status, statusPayload);
        process.exit(1);
      }

      break;
    } catch (error) {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      if (elapsedSeconds > waitSeconds) {
        console.error(
          `Unable to reach ${statusUrl} after ${waitSeconds}s. Make sure \`npm run dev\` is running, then retry.`,
        );
        console.error("Last error:", error);
        if (lastStatusPayload) {
          console.error("Last status payload:", lastStatusPayload);
        }
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const response = await fetch(bootstrapUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bootstrap-key": bootstrapKey,
    },
    body: JSON.stringify({ replaceExisting }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Bootstrap failed:", response.status, payload);
    process.exit(1);
  }

  console.log("Bootstrap OK:", payload);
} catch (error) {
  console.error("Bootstrap request failed. Is `npm run dev` running?", error);
  process.exit(1);
}
