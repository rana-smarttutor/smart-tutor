import { list } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN.");
  process.exit(1);
}

const outputDir = join(homedir(), "smartiq-storage-audit");
const outputPath = join(outputDir, "public-blob-inventory.json");

const allBlobs = [];
const seenCursors = new Set();

let cursor;
let pageNumber = 0;

console.log("Starting READ-ONLY Vercel Public Blob audit.");

try {
  while (true) {
    const response = await list({
      token,
      limit: 1000,
      ...(cursor ? { cursor } : {}),
    });

    pageNumber++;

    for (const blob of response.blobs) {
      allBlobs.push({
        pathname: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType ?? null,
      });
    }

    console.log(`Page ${pageNumber}: ${response.blobs.length} objects listed.`);

    if (!response.hasMore) {
      break;
    }

    if (!response.cursor || seenCursors.has(response.cursor)) {
      throw new Error("Invalid or repeated pagination cursor.");
    }

    seenCursors.add(response.cursor);
    cursor = response.cursor;
  }

  const byFolder = {};
  const byExtension = {};

  let totalBytes = 0;

  for (const blob of allBlobs) {
    totalBytes += blob.size ?? 0;

    const folder = blob.pathname.includes("/")
      ? blob.pathname.split("/")[0]
      : "(root)";

    const filename = blob.pathname.split("/").pop() ?? "";
    const extensionMatch = filename.match(/\.([a-z0-9]+)$/i);

    const extension = extensionMatch
      ? `.${extensionMatch[1].toLowerCase()}`
      : "(no extension)";

    if (!byFolder[folder]) {
      byFolder[folder] = {
        count: 0,
        bytes: 0,
      };
    }

    byFolder[folder].count++;
    byFolder[folder].bytes += blob.size ?? 0;

    if (!byExtension[extension]) {
      byExtension[extension] = {
        count: 0,
        bytes: 0,
      };
    }

    byExtension[extension].count++;
    byExtension[extension].bytes += blob.size ?? 0;
  }

  await mkdir(outputDir, {
    recursive: true,
  });

  await writeFile(
    outputPath,
    JSON.stringify(
      {
        auditedAt: new Date().toISOString(),
        source: "vercel-public-blob",
        totalObjects: allBlobs.length,
        totalBytes,
        objects: allBlobs,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log("\n========== PUBLIC BLOB AUDIT ==========");

  console.log("Total objects:", allBlobs.length);

  console.log("Total storage:", (totalBytes / 1024 / 1024).toFixed(2), "MB");

  console.log("\nStorage by top-level folder:");

  console.table(
    Object.entries(byFolder).map(([folder, details]) => ({
      folder,
      count: details.count,
      sizeMB: (details.bytes / 1024 / 1024).toFixed(2),
    })),
  );

  console.log("\nStorage by file extension:");

  console.table(
    Object.entries(byExtension).map(([extension, details]) => ({
      extension,
      count: details.count,
      sizeMB: (details.bytes / 1024 / 1024).toFixed(2),
    })),
  );

  console.log("\nInventory saved outside the project:");
  console.log(outputPath);

  console.log("\nNo files were copied or deleted.");
} catch (error) {
  console.error("Public Blob audit failed:", error);
  process.exitCode = 1;
}
