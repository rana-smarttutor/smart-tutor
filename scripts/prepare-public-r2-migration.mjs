import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const projectDir = process.cwd();

const auditDir = join(homedir(), "smartiq-storage-audit");

const blobFile = join(auditDir, "public-blob-inventory.json");

const r2File = join(auditDir, "r2-inventory.json");

const retainedFile = join(projectDir, "lib", "library-retained-books.ts");

const [blobRaw, r2Raw, retainedSource] = await Promise.all([
  readFile(blobFile, "utf8"),
  readFile(r2File, "utf8"),
  readFile(retainedFile, "utf8"),
]);

const blobInventory = JSON.parse(blobRaw);
const r2Inventory = JSON.parse(r2Raw);

// Extract IDs only from the explicit retained-book allowlist.
const allowlistMatch = retainedSource.match(
  /export const RETAINED_LIBRARY_BOOK_IDS\s*=\s*\[([\s\S]*?)\]\s*as const/,
);

if (!allowlistMatch) {
  throw new Error("Retained-book allowlist was not found.");
}

const retainedIds = [...allowlistMatch[1].matchAll(/"([a-f0-9]{24})"/gi)].map(
  (match) => match[1].toLowerCase(),
);

if (retainedIds.length !== 47 || new Set(retainedIds).size !== 47) {
  throw new Error("Expected exactly 47 unique retained-book IDs.");
}

if (
  blobInventory.source !== "vercel-public-blob" ||
  !Array.isArray(blobInventory.objects) ||
  !Array.isArray(r2Inventory.objects) ||
  r2Inventory.bucket !== "smartiq-digital-library"
) {
  throw new Error("Unexpected inventory format or destination bucket.");
}

const r2Keys = new Set(r2Inventory.objects.map((object) => object.key));

const retainedSet = new Set(retainedIds);

const retainedBooks = retainedIds.map((id) => {
  const pdfKey = `migration/exam-books/${id}.pdf`;

  const thumbnail = r2Inventory.objects.find((object) =>
    new RegExp(
      `^migration/exam-thumbnails/${id}\\.(png|jpg|jpeg|webp)$`,
      "i",
    ).test(object.key),
  );

  return {
    id,
    pdfKey,
    pdfPresent: r2Keys.has(pdfKey),
    thumbnailKey: thumbnail?.key ?? null,
    thumbnailPresent: Boolean(thumbnail),
  };
});

const missingRetainedAssets = retainedBooks.filter(
  (book) => !book.pdfPresent || !book.thumbnailPresent,
);

const otherR2Objects = r2Inventory.objects.filter((object) => {
  const match = object.key.match(
    /^migration\/exam-(?:books|thumbnails)\/([a-f0-9]{24})\./i,
  );

  return !match || !retainedSet.has(match[1].toLowerCase());
});

const excludedDigitalLibrary = [];
const pendingReview = [];

for (const object of blobInventory.objects) {
  const pathname = object.pathname;

  if (pathname.startsWith("digital-library/")) {
    excludedDigitalLibrary.push({
      ...object,
      decision: "EXCLUDED_FROM_BULK_TRANSFER",
      reason: "Digital Library assets require retained-book ID matching.",
    });

    continue;
  }

  let category = "other";

  if (pathname.startsWith("signup/")) {
    category = "signup";
  } else if (pathname.startsWith("student-performance/")) {
    category = "student-performance";
  } else if (
    pathname.startsWith("homework-attachments/") ||
    pathname.startsWith("homework-submissions/")
  ) {
    category = "homework";
  } else if (pathname.startsWith("chat-uploads/")) {
    category = "chat";
  } else if (pathname.startsWith("library/")) {
    category = "legacy-library";
  } else if (pathname.toLowerCase().endsWith(".apk")) {
    category = "apk";
  }

  pendingReview.push({
    ...object,
    category,
    proposedR2Key: `migration/public-assets/${pathname}`,
    decision: "PENDING_ACTIVE_REFERENCE_REVIEW",
  });
}

const summary = {
  publicBlobObjects: blobInventory.objects.length,
  existingR2Objects: r2Inventory.objects.length,
  retainedBookCount: retainedBooks.length,
  completeRetainedBookPairs:
    retainedBooks.length - missingRetainedAssets.length,
  missingRetainedAssets: missingRetainedAssets.length,
  additionalR2Objects: otherR2Objects.length,
  digitalLibraryObjectsHeld: excludedDigitalLibrary.length,
  nonLibraryObjectsPendingReview: pendingReview.length,
  approvedForTransfer: 0,
};

const manifest = {
  generatedAt: new Date().toISOString(),
  mode: "READ_ONLY",
  summary,
  retainedBooks,
  missingRetainedAssets,
  additionalR2Objects: otherR2Objects,
  excludedDigitalLibrary,
  pendingReview,
};

const outputPath = join(auditDir, "public-r2-migration-manifest.json");

await writeFile(outputPath, JSON.stringify(manifest, null, 2), "utf8");

console.log("\n===== SMARTIQ R2 MIGRATION PLAN =====\n");

console.table(summary);

console.log("\nPending review by category:");

const counts = {};

for (const object of pendingReview) {
  counts[object.category] = (counts[object.category] ?? 0) + 1;
}

console.table(
  Object.entries(counts).map(([category, count]) => ({
    category,
    count,
  })),
);

console.log("\nManifest:", outputPath);
console.log("No data was transferred or deleted.");

if (missingRetainedAssets.length > 0) {
  console.warn("\nWARNING: Some retained book PDFs or thumbnails are missing.");
}
