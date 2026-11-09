import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const execute = process.argv.includes("--execute");

const auditDir = join(homedir(), "smartiq-storage-audit");
const manifestPath = join(auditDir, "public-r2-migration-manifest.json");
const reportPath = join(auditDir, "public-r2-copy-results.json");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const required = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name}`);
  }
}

const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

if (
  process.env.R2_ENDPOINT.replace(/\/$/, "") !== endpoint ||
  process.env.R2_BUCKET_NAME !== "smartiq-digital-library"
) {
  throw new Error("Unexpected R2 destination configuration.");
}

const bucket = process.env.R2_BUCKET_NAME;

const client = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
});

const allowedPrefixes = [
  "signup/",
  "student-performance/",
  "homework-attachments/",
  "homework-submissions/",
  "chat-uploads/",
  "library/",
];

const isEligible = (pathname) =>
  allowedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
  (!pathname.includes("/") && pathname.toLowerCase().endsWith(".apk"));

const objects = manifest.pendingReview;

if (
  manifest.mode !== "READ_ONLY" ||
  manifest.summary?.approvedForTransfer !== 0 ||
  manifest.summary?.nonLibraryObjectsPendingReview !== 225 ||
  !Array.isArray(objects) ||
  objects.length !== 225
) {
  throw new Error("Unexpected migration manifest.");
}

const seen = new Set();

for (const object of objects) {
  if (
    typeof object.pathname !== "string" ||
    typeof object.url !== "string" ||
    !Number.isSafeInteger(object.size) ||
    object.size < 0 ||
    object.decision !== "PENDING_ACTIVE_REFERENCE_REVIEW" ||
    !isEligible(object.pathname) ||
    object.pathname.includes("..") ||
    object.proposedR2Key !== `migration/public-assets/${object.pathname}` ||
    seen.has(object.pathname)
  ) {
    throw new Error("Invalid or duplicate migration entry.");
  }

  seen.add(object.pathname);

  const url = new URL(object.url);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "s4hwk9dbjuligkqz.public.blob.vercel-storage.com" ||
    decodeURIComponent(url.pathname.slice(1)) !== object.pathname ||
    url.search ||
    url.hash
  ) {
    throw new Error("Unexpected source URL.");
  }
}

const contentTypes = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".apk": "application/vnd.android.package-archive",
  ".txt": "text/plain",
  ".json": "application/json",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function getContentType(pathname) {
  const extension = pathname.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase();

  return contentTypes[extension] || "application/octet-stream";
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isNotFound(error) {
  return (
    error?.$metadata?.httpStatusCode === 404 ||
    error?.name === "NotFound" ||
    error?.name === "NoSuchKey"
  );
}

async function getExistingObject(key) {
  try {
    return await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

async function verifyR2Object(key, expectedSize, expectedHash) {
  const result = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!result.Body) {
    throw new Error("R2 object has no readable body.");
  }

  const bytes = Buffer.from(await result.Body.transformToByteArray());

  if (bytes.length !== expectedSize || sha256(bytes) !== expectedHash) {
    throw new Error("R2 content verification failed.");
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: execute ? "COPY_ONLY" : "DRY_RUN",
  bucket,
  results: [],
};

async function saveReport() {
  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
}

console.log(
  execute ? "COPY-ONLY migration started." : "DRY RUN: no uploads will happen.",
);

console.log("Objects in source manifest:", objects.length);
console.log("Digital Library objects are excluded.");

if (!execute) {
  const counts = {};

  for (const item of objects) {
    const category = item.category || "other";
    counts[category] = (counts[category] || 0) + 1;
  }

  console.table(
    Object.entries(counts).map(([category, count]) => ({
      category,
      count,
    })),
  );

  console.log("\nRun with --execute to copy and verify the staged assets.");

  process.exit(0);
}

for (const [index, object] of objects.entries()) {
  const key = object.proposedR2Key;

  console.log(`[${index + 1}/${objects.length}] ${object.category}`);

  try {
    const response = await fetch(object.url, {
      signal: AbortSignal.timeout(120000),
      redirect: "error",
    });

    if (!response.ok) {
      throw new Error(`Source fetch failed: HTTP ${response.status}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.length !== object.size) {
      throw new Error("Source file size has changed.");
    }

    const hash = sha256(bytes);

    const existing = await getExistingObject(key);

    if (existing) {
      await verifyR2Object(key, bytes.length, hash);

      report.results.push({
        pathname: object.pathname,
        r2Key: key,
        status: "ALREADY_PRESENT_VERIFIED",
        bytes: bytes.length,
        sha256: hash,
      });

      console.log("  Existing R2 copy verified.");
    } else {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentLength: bytes.length,
          ContentType: getContentType(object.pathname),
          Metadata: {
            sha256: hash,
            migration: "vercel-public-blob",
          },
          IfNoneMatch: "*",
        }),
      );

      await verifyR2Object(key, bytes.length, hash);

      report.results.push({
        pathname: object.pathname,
        r2Key: key,
        status: "COPIED_AND_VERIFIED",
        bytes: bytes.length,
        sha256: hash,
      });

      console.log("  Copied and verified.");
    }
  } catch (error) {
    report.results.push({
      pathname: object.pathname,
      r2Key: key,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("  FAILED:", error instanceof Error ? error.message : error);
  }

  // Save after every object so the report survives
  // interruption and can be used for reconciliation.
  await saveReport();
}

const counts = {};

for (const result of report.results) {
  counts[result.status] = (counts[result.status] || 0) + 1;
}

console.log("\n===== COPY RESULTS =====");

console.table(
  Object.entries(counts).map(([status, count]) => ({
    status,
    count,
  })),
);

console.log("Report:", reportPath);
console.log("Vercel objects were not deleted.");
console.log("No MongoDB changes were made.");

if (counts.FAILED) {
  process.exitCode = 1;
}
