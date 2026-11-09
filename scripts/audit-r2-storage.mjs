import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const required = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

const endpoint =
  process.env.R2_ENDPOINT ||
  `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const bucket = process.env.R2_BUCKET_NAME;

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const objects = [];
let continuationToken;

console.log("Starting READ-ONLY Cloudflare R2 audit.");

do {
  const result = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 1000,
      ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
    }),
  );

  for (const item of result.Contents ?? []) {
    if (!item.Key) continue;

    objects.push({
      key: item.Key,
      size: item.Size ?? 0,
      lastModified: item.LastModified?.toISOString() ?? null,
    });
  }

  continuationToken = result.IsTruncated
    ? result.NextContinuationToken
    : undefined;

  if (result.IsTruncated && !continuationToken) {
    throw new Error("R2 pagination token is missing.");
  }
} while (continuationToken);

const folders = new Map();

let totalBytes = 0;

for (const object of objects) {
  totalBytes += object.size;

  const folder = object.key.includes("/") ? object.key.split("/")[0] : "(root)";

  const entry = folders.get(folder) ?? {
    count: 0,
    bytes: 0,
  };

  entry.count++;
  entry.bytes += object.size;

  folders.set(folder, entry);
}

const outputDir = join(homedir(), "smartiq-storage-audit");

await mkdir(outputDir, { recursive: true });

const outputPath = join(outputDir, "r2-inventory.json");

await writeFile(
  outputPath,
  JSON.stringify(
    {
      auditedAt: new Date().toISOString(),
      bucket,
      totalObjects: objects.length,
      totalBytes,
      objects,
    },
    null,
    2,
  ),
  "utf8",
);

console.log("\n========== R2 STORAGE AUDIT ==========");

console.log("Total objects:", objects.length);

console.log("Total size:", (totalBytes / 1024 / 1024).toFixed(2), "MB");

console.table(
  [...folders.entries()].map(([folder, entry]) => ({
    folder,
    count: entry.count,
    sizeMB: (entry.bytes / 1024 / 1024).toFixed(2),
  })),
);

console.log("\nInventory saved locally:");
console.log(outputPath);

console.log("\nNo files were uploaded, changed or deleted.");
