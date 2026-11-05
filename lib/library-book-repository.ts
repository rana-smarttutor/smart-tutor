import "server-only";

import { getMongoDatabase } from "@/lib/mongodb";

import { isValidR2BookKey, isValidR2ThumbnailKey } from "@/lib/cloudflare-r2";

import { RETAINED_LIBRARY_OBJECT_IDS } from "@/lib/library-retained-books";

export type LibraryStorageProvider = "vercel-private" | "mega" | "r2";

export type LibraryBookRecord = {
  pathname: string;
  title: string;
  description: string;
  price: string;
  fileName: string;

  categoryId?: string;
  categoryLabel?: string;

  thumbnailUrl?: string;
  thumbnailPathname?: string;

  storageProvider: LibraryStorageProvider;

  privateBlobPathname?: string;
  megaNodeId?: string;

  r2ObjectKey?: string;
  r2ThumbnailKey?: string;

  uploadedAt: string;
  updatedAt: string;
  migratedAt: Date;
  deletedAt?: Date;
};

export type PublicLibraryBook = {
  id: string;
  pathname: string;
  title: string;
  description: string;
  price: string;
  fileName: string;
  categoryId?: string;
  categoryLabel?: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  storageType: "blob" | "mega" | "r2";
  downloadUrl: string;
};

const COLLECTION_NAME = "digital_library_books";

function validBookPath(pathname: string): boolean {
  return (
    typeof pathname === "string" &&
    pathname.length <= 500 &&
    /^digital-library\/(?:books\/)?[a-zA-Z0-9_-]+\.pdf$/i.test(pathname)
  );
}

function validPrivateBlobPath(pathname: string): boolean {
  return /^digital-library\/private-books\/[0-9a-f-]{36}\.pdf$/i.test(pathname);
}

function validMegaNodeId(nodeId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(nodeId);
}

function validateBook(record: LibraryBookRecord): void {
  if (!validBookPath(record.pathname)) {
    throw new Error("Invalid library book identifier.");
  }

  if (!record.title?.trim() || !record.fileName?.trim()) {
    throw new Error("Book title and filename are required.");
  }

  if (
    !Number.isFinite(new Date(record.uploadedAt).getTime()) ||
    !Number.isFinite(new Date(record.updatedAt).getTime())
  ) {
    throw new Error("Invalid book timestamps.");
  }

  if (
    record.r2ObjectKey !== undefined &&
    !isValidR2BookKey(record.r2ObjectKey)
  ) {
    throw new Error("Invalid R2 PDF object key.");
  }

  if (
    record.r2ThumbnailKey !== undefined &&
    !isValidR2ThumbnailKey(record.r2ThumbnailKey)
  ) {
    throw new Error("Invalid R2 thumbnail object key.");
  }

  if (record.storageProvider === "vercel-private") {
    if (
      !record.privateBlobPathname ||
      !validPrivateBlobPath(record.privateBlobPathname) ||
      record.megaNodeId
    ) {
      throw new Error("Invalid private Vercel storage reference.");
    }

    return;
  }

  if (record.storageProvider === "mega") {
    if (
      !record.megaNodeId ||
      !validMegaNodeId(record.megaNodeId) ||
      record.privateBlobPathname
    ) {
      throw new Error("Invalid MEGA storage reference.");
    }

    return;
  }

  if (record.storageProvider === "r2") {
    if (!record.r2ObjectKey || !isValidR2BookKey(record.r2ObjectKey)) {
      throw new Error("R2 books require a valid PDF object key.");
    }

    // Preserve old storage references
    // for rollback.
    return;
  }

  throw new Error("Unsupported library storage provider.");
}

export function isValidLibraryBookRecord(record: LibraryBookRecord): boolean {
  try {
    validateBook(record);
    return true;
  } catch {
    return false;
  }
}

export async function getLibraryBookCollection() {
  const db = await getMongoDatabase();

  return db.collection<LibraryBookRecord>(COLLECTION_NAME);
}

export async function prepareLibraryBookIndexes() {
  const collection = await getLibraryBookCollection();

  await collection.createIndex(
    { pathname: 1 },
    {
      unique: true,
      name: "unique_library_book_pathname",
    },
  );

  await collection.createIndex(
    { categoryId: 1, uploadedAt: -1 },
    {
      name: "library_category_uploaded",
    },
  );
}

// =====================================================
// FIND ONLY A VERIFIED RETAINED BOOK
// =====================================================

export async function findLibraryBook(
  pathname: string,
): Promise<LibraryBookRecord | null> {
  if (!validBookPath(pathname)) {
    return null;
  }

  const collection = await getLibraryBookCollection();

  return collection.findOne(
    {
      pathname,
      _id: {
        $in: RETAINED_LIBRARY_OBJECT_IDS,
      },
      deletedAt: {
        $exists: false,
      },
    },
    {
      projection: {
        _id: 0,
      },
    },
  );
}

// =====================================================
// LIST ONLY THE 52 VERIFIED RETAINED BOOKS
// =====================================================

export async function listStoredLibraryBooks(): Promise<LibraryBookRecord[]> {
  const collection = await getLibraryBookCollection();

  return collection
    .find(
      {
        _id: {
          $in: RETAINED_LIBRARY_OBJECT_IDS,
        },
        deletedAt: {
          $exists: false,
        },
      },
      {
        projection: {
          _id: 0,
        },
      },
    )
    .sort({
      uploadedAt: -1,
    })
    .toArray();
}

// =====================================================
// SAVE BOOK
// =====================================================

export async function saveLibraryBook(book: LibraryBookRecord): Promise<void> {
  validateBook(book);

  const collection = await getLibraryBookCollection();

  const existing = await collection.findOne(
    {
      pathname: book.pathname,
    },
    {
      projection: {
        _id: 1,
      },
    },
  );

  if (existing) {
    throw new Error("This library book already exists.");
  }

  await collection.insertOne(book);
}

// =====================================================
// UPDATE BOOK DETAILS
// =====================================================

export async function updateLibraryBookDetails(
  pathname: string,
  changes: Partial<
    Pick<
      LibraryBookRecord,
      | "title"
      | "description"
      | "price"
      | "fileName"
      | "categoryId"
      | "categoryLabel"
      | "thumbnailUrl"
      | "thumbnailPathname"
    >
  >,
): Promise<boolean> {
  if (!validBookPath(pathname)) {
    throw new Error("Invalid library book identifier.");
  }

  const collection = await getLibraryBookCollection();

  // The book must be in the retained set.
  const existing = await collection.findOne({
    pathname,
    _id: {
      $in: RETAINED_LIBRARY_OBJECT_IDS,
    },
    deletedAt: {
      $exists: false,
    },
  });

  if (!existing) {
    return false;
  }

  const updated: LibraryBookRecord = {
    ...existing,
    ...changes,
    updatedAt: new Date().toISOString(),
  };

  validateBook(updated);

  const result = await collection.updateOne(
    {
      pathname,
      _id: {
        $in: RETAINED_LIBRARY_OBJECT_IDS,
      },
      deletedAt: {
        $exists: false,
      },
    },
    {
      $set: {
        ...changes,
        updatedAt: updated.updatedAt,
      },
    },
  );

  return result.matchedCount === 1;
}

// =====================================================
// PUBLIC BOOK TRANSFORMATION
// =====================================================

export function toPublicLibraryBook(
  record: LibraryBookRecord,
): PublicLibraryBook {
  const storageType: PublicLibraryBook["storageType"] =
    record.storageProvider === "r2"
      ? "r2"
      : record.storageProvider === "mega"
        ? "mega"
        : "blob";

  let thumbnailUrl = record.thumbnailUrl || "";

  if (
    record.storageProvider === "r2" &&
    record.r2ThumbnailKey &&
    isValidR2ThumbnailKey(record.r2ThumbnailKey)
  ) {
    thumbnailUrl = `/api/digital-library/thumbnail?pathname=${encodeURIComponent(
      record.pathname,
    )}`;
  }

  return {
    id: encodeURIComponent(record.pathname),
    pathname: record.pathname,
    title: record.title,
    description: record.description,
    price: record.price,
    fileName: record.fileName,
    categoryId: record.categoryId,
    categoryLabel: record.categoryLabel,
    thumbnailUrl,
    uploadedAt: record.uploadedAt,
    storageType,
    downloadUrl: `/api/digital-library/download?pathname=${encodeURIComponent(
      record.pathname,
    )}`,
  };
}

// =====================================================
// SOFT DELETE BOOK
// =====================================================

export async function softDeleteLibraryBook(
  pathname: string,
): Promise<boolean> {
  if (!validBookPath(pathname)) {
    throw new Error("Invalid book identifier.");
  }

  const collection = await getLibraryBookCollection();

  const result = await collection.updateOne(
    {
      pathname,
      _id: {
        $in: RETAINED_LIBRARY_OBJECT_IDS,
      },
      deletedAt: {
        $exists: false,
      },
    },
    {
      $set: {
        deletedAt: new Date(),
        updatedAt: new Date().toISOString(),
      },
    },
  );

  return result.modifiedCount === 1;
}
