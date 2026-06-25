import { list } from "@vercel/blob";

import {
  DIGITAL_LIBRARY_BOOK_PREFIX,
  DIGITAL_LIBRARY_METADATA_PREFIX,
  getBookAssetKey,
  getLibraryDownloadRoute,
  type DigitalLibraryStorageKind,
  type MegaBookMetadata,
} from "@/lib/digital-library-storage";

export type DigitalLibraryBook = {
  id: string;
  title: string;
  description: string;
  price: string;
  fileName: string;
  pathname: string;
  categoryId?: string;
  categoryLabel?: string;
  url?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  storageType?: DigitalLibraryStorageKind;
};

const DEFAULT_BOOK_DESCRIPTION =
  "Access this PDF study material for focused learning and revision.";

const DEFAULT_CATEGORY_ID = "school-learning";
const DEFAULT_CATEGORY_LABEL = "School Learning Library";

const CATEGORY_LABELS: Record<string, string> = {
  "school-learning": "School Learning Library",
  "competitive-exam": "All Competitive Exam Library",
  "government-exam": "All Government Exam Library",
  fiction: "Fiction Books Library",
  "non-fiction": "Non-Fiction Books Library",
  biography: "Biography & Autobiography Library",
  "personality-development": "Personality Development Library",
  "spoken-english": "Spoken English Library",
  "technology-ai": "Technology & AI Library",
  "career-placement": "Career & Placement Library",
};

type ParsedBookPath = {
  title: string;
  description: string;
  fileName: string;
  price: string;
  categoryId: string;
  categoryLabel: string;
};

function displayPrice(rawPrice: string) {
  if (rawPrice === "free" || Number(rawPrice) <= 0) {
    return "Free";
  }

  return `₹${Number(rawPrice).toLocaleString("en-IN")}`;
}

function humanizeSlug(value: string) {
  return decodeURIComponent(value || "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function guessCategoryFromText(text: string) {
  const value = text.toLowerCase().replace(/[_-]/g, " ");

  if (
    [
      "python",
      "computer",
      "coding",
      "programming",
      "ai",
      "deep learning",
      "machine learning",
      "data",
      "analytics",
      "google analytics",
    ].some((keyword) => value.includes(keyword))
  ) {
    return {
      categoryId: "technology-ai",
      categoryLabel: CATEGORY_LABELS["technology-ai"],
    };
  }

  if (
    [
      "banking",
      "railway",
      "ssc cgl",
      "government",
      "upsc",
      "mpsc",
      "ibps",
    ].some((keyword) => value.includes(keyword))
  ) {
    return {
      categoryId: "government-exam",
      categoryLabel: CATEGORY_LABELS["government-exam"],
    };
  }

  if (
    ["jee", "neet", "cet", "entrance", "competitive"].some((keyword) =>
      value.includes(keyword),
    )
  ) {
    return {
      categoryId: "competitive-exam",
      categoryLabel: CATEGORY_LABELS["competitive-exam"],
    };
  }

  if (
    [
      "algebra",
      "trigonometry",
      "chemistry",
      "physics",
      "calculus",
      "economics",
      "science",
      "school",
      "cbse",
      "ssc",
      "hsc",
    ].some((keyword) => value.includes(keyword))
  ) {
    return {
      categoryId: "school-learning",
      categoryLabel: CATEGORY_LABELS["school-learning"],
    };
  }

  return {
    categoryId: DEFAULT_CATEGORY_ID,
    categoryLabel: DEFAULT_CATEGORY_LABEL,
  };
}

function parseNewBookPath(pathname: string): ParsedBookPath {
  const value = pathname
    .replace("digital-library/books/", "")
    .replace(/\.pdf$/i, "");

  const [id, rawPrice = "free", thirdPart = "", fourthPart = "", ...restParts] =
    value.split("__");

  let categoryId = "";
  let categoryLabel = "";
  let storedDescription = "";
  let storedTitle = "";

  if (restParts.length > 0) {
    categoryId = thirdPart || DEFAULT_CATEGORY_ID;
    categoryLabel = CATEGORY_LABELS[categoryId] || humanizeSlug(categoryId);
    storedDescription = fourthPart || "";
    storedTitle = restParts.join("__");
  } else if (fourthPart) {
    storedDescription = thirdPart || "";
    storedTitle = fourthPart;
    const guessed = guessCategoryFromText(`${storedTitle} ${storedDescription}`);
    categoryId = guessed.categoryId;
    categoryLabel = guessed.categoryLabel;
  } else {
    storedTitle = thirdPart;
    const guessed = guessCategoryFromText(storedTitle);
    categoryId = guessed.categoryId;
    categoryLabel = guessed.categoryLabel;
  }

  return {
    title: humanizeSlug(storedTitle),
    description: humanizeSlug(storedDescription) || DEFAULT_BOOK_DESCRIPTION,
    fileName: `${storedTitle}.pdf`,
    price: displayPrice(rawPrice),
    categoryId,
    categoryLabel,
  };
}

function parseOldBookPath(pathname: string): ParsedBookPath {
  const rawName = pathname.replace("digital-library/", "");
  const parts = rawName.split("-");

  const possibleTimestamp = parts[0] || "";
  const hasTimestamp = /^\d{10,}$/.test(possibleTimestamp);

  const possiblePrice = hasTimestamp ? parts[1] || "free" : "free";
  const hasPrice = possiblePrice === "free" || /^\d+$/.test(possiblePrice);

  const fileName =
    hasTimestamp && hasPrice
      ? parts.slice(2).join("-") || rawName
      : hasTimestamp
        ? parts.slice(1).join("-") || rawName
        : rawName;

  const title = fileName.replace(/\.[^/.]+$/, "").replace(/-/g, " ");
  const guessed = guessCategoryFromText(title);

  return {
    title,
    description: DEFAULT_BOOK_DESCRIPTION,
    fileName,
    price: hasTimestamp && hasPrice ? displayPrice(possiblePrice) : "Free",
    categoryId: guessed.categoryId,
    categoryLabel: guessed.categoryLabel,
  };
}

function getThumbnailMap(blobs: Awaited<ReturnType<typeof list>>["blobs"]) {
  return new Map(
    blobs
      .filter((blob) =>
        blob.pathname.startsWith("digital-library/thumbnails/"),
      )
      .map((blob) => {
        const thumbnailKey = blob.pathname
          .replace("digital-library/thumbnails/", "")
          .replace(/\.(png|jpg|jpeg|webp)$/i, "");

        return [thumbnailKey, blob.url];
      }),
  );
}

async function readMetadataRecord(blobUrl: string) {
  const response = await fetch(blobUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to read book metadata.");
  }

  return (await response.json()) as MegaBookMetadata;
}

function normalizeMetadataBook(
  record: MegaBookMetadata,
  canAccessPdf: boolean,
  thumbnailUrl: string | undefined,
): DigitalLibraryBook {
  return {
    id: encodeURIComponent(record.pathname),
    title: record.title,
    description: record.description,
    price: record.price,
    fileName: record.fileName,
    pathname: record.pathname,
    categoryId: record.categoryId,
    categoryLabel: record.categoryLabel,
    url: canAccessPdf ? (record.megaDownloadUrl || record.blobUrl) : undefined,
    downloadUrl: getLibraryDownloadRoute(record.pathname),
    thumbnailUrl: record.thumbnailUrl || thumbnailUrl,
    uploadedAt: new Date(record.updatedAt || record.uploadedAt).toISOString(),
    storageType: record.storageType || "blob",
  };
}

function normalizeBlobBook(
  pathname: string,
  blobUrl: string,
  uploadedAt: string | Date,
  canAccessPdf: boolean,
  thumbnailUrl: string | undefined,
): DigitalLibraryBook {
  const parsed = parseNewBookPath(pathname);

  return {
    id: encodeURIComponent(pathname),
    title: parsed.title,
    description: parsed.description,
    price: parsed.price,
    fileName: parsed.fileName,
    pathname,
    categoryId: parsed.categoryId,
    categoryLabel: parsed.categoryLabel,
    url: canAccessPdf ? blobUrl : undefined,
    downloadUrl: getLibraryDownloadRoute(pathname),
    thumbnailUrl,
    uploadedAt: new Date(uploadedAt).toISOString(),
    storageType: "blob",
  };
}

function normalizeLegacyBook(
  pathname: string,
  blobUrl: string,
  uploadedAt: string | Date,
  canAccessPdf: boolean,
) {
  const parsed = parseOldBookPath(pathname);

  return {
    id: encodeURIComponent(pathname),
    title: parsed.title,
    description: parsed.description,
    price: parsed.price,
    fileName: parsed.fileName,
    pathname,
    categoryId: parsed.categoryId,
    categoryLabel: parsed.categoryLabel,
    url: canAccessPdf ? blobUrl : undefined,
    downloadUrl: getLibraryDownloadRoute(pathname),
    thumbnailUrl: undefined,
    uploadedAt: new Date(uploadedAt).toISOString(),
    storageType: "blob" as const,
  };
}

export async function getDigitalLibraryBooks(
  canAccessPdf: boolean,
): Promise<DigitalLibraryBook[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  }

  const { blobs } = await list({
    prefix: "digital-library/",
    token,
  });

  const thumbnailMap = getThumbnailMap(blobs);

  const metadataBlobs = blobs.filter((blob) =>
    blob.pathname.startsWith(DIGITAL_LIBRARY_METADATA_PREFIX) &&
    blob.pathname.toLowerCase().endsWith(".json"),
  );

  const metadataBooks = await Promise.all(
    metadataBlobs.map(async (blob) => {
      const record = await readMetadataRecord(blob.url);
      const thumbnailKey = getBookAssetKey(record.pathname);

      return normalizeMetadataBook(
        record,
        canAccessPdf,
        record.thumbnailUrl || thumbnailMap.get(thumbnailKey),
      );
    }),
  );

  const metadataPathSet = new Set(
    metadataBooks.map((book) => book.pathname),
  );

  const blobBooks = blobs
    .filter((blob) =>
      blob.pathname.startsWith(DIGITAL_LIBRARY_BOOK_PREFIX) &&
      blob.pathname.toLowerCase().endsWith(".pdf") &&
      !metadataPathSet.has(blob.pathname),
    )
    .map((blob) =>
      normalizeBlobBook(
        blob.pathname,
        blob.url,
        blob.uploadedAt,
        canAccessPdf,
        thumbnailMap.get(getBookAssetKey(blob.pathname)),
      ),
    );

  const legacyBooks = blobs
    .filter(
      (blob) =>
        /^digital-library\/[^/]+\.pdf$/i.test(blob.pathname) &&
        !metadataPathSet.has(blob.pathname),
    )
    .map((blob) =>
      normalizeLegacyBook(blob.pathname, blob.url, blob.uploadedAt, canAccessPdf),
    );

  return [...metadataBooks, ...blobBooks, ...legacyBooks].sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}
