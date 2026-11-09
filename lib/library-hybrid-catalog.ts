import "server-only";

import {
  findLibraryBook,
  getLibraryBookCollection,
  listStoredLibraryBooks,
  toPublicLibraryBook,
  isValidLibraryBookRecord,
  type LibraryBookRecord,
  type PublicLibraryBook,
} from "@/lib/library-book-repository";

import { isValidR2BookKey, isValidR2ThumbnailKey } from "@/lib/cloudflare-r2";

export const EXPECTED_LIBRARY_BOOK_COUNT = 110;
export const TARGET_RETAINED_BOOK_COUNT = 47;

export type LibraryCatalogStatus = {
  total: number;
  vercelPrivate: number;
  mega: number;
  r2: number;
  invalid: number;
  migrationComplete: boolean;
  r2MigrationComplete: boolean;
};

function hasValidStorageReference(book: LibraryBookRecord): boolean {
  if (!isValidLibraryBookRecord(book)) {
    return false;
  }

  if (book.storageProvider === "vercel-private") {
    return Boolean(
      book.privateBlobPathname &&
      /^digital-library\/private-books\/[0-9a-f-]{36}\.pdf$/i.test(
        book.privateBlobPathname,
      ),
    );
  }

  if (book.storageProvider === "mega") {
    return Boolean(book.megaNodeId && /^[a-zA-Z0-9_-]+$/.test(book.megaNodeId));
  }

  if (book.storageProvider === "r2") {
    return Boolean(
      book.r2ObjectKey &&
      isValidR2BookKey(book.r2ObjectKey) &&
      (!book.r2ThumbnailKey || isValidR2ThumbnailKey(book.r2ThumbnailKey)),
    );
  }

  return false;
}

export async function getHybridLibraryCatalog(): Promise<PublicLibraryBook[]> {
  const records = await listStoredLibraryBooks();

  return records.map(toPublicLibraryBook);
}

export async function getHybridLibraryBook(
  pathname: string,
): Promise<LibraryBookRecord | null> {
  return findLibraryBook(pathname);
}

export async function getHybridLibraryCatalogStatus(): Promise<LibraryCatalogStatus> {
  const records = await listStoredLibraryBooks();

  const collection = await getLibraryBookCollection();

  const originalTotal = await collection.countDocuments({});

  const vercelPrivate = records.filter(
    (book) => book.storageProvider === "vercel-private",
  ).length;

  const mega = records.filter((book) => book.storageProvider === "mega").length;

  const r2 = records.filter((book) => book.storageProvider === "r2").length;

  const invalid = records.filter(
    (book) => !hasValidStorageReference(book),
  ).length;

  // Preserve the existing MongoDB catalogue
  // compatibility check while the migration
  // is still in progress.
  const migrationComplete =
    originalTotal >= EXPECTED_LIBRARY_BOOK_COUNT && invalid === 0;

  // This describes the final active catalogue.
  // It does not replace the separate R2 object
  // integrity and application-access tests.
  const r2MigrationComplete =
    records.length === TARGET_RETAINED_BOOK_COUNT &&
    r2 === TARGET_RETAINED_BOOK_COUNT &&
    invalid === 0;

  return {
    total: records.length,
    vercelPrivate,
    mega,
    r2,
    invalid,
    migrationComplete,
    r2MigrationComplete,
  };
}

export async function hasHybridLibraryBook(pathname: string): Promise<boolean> {
  const collection = await getLibraryBookCollection();

  const result = await collection.countDocuments(
    {
      pathname,
      deletedAt: { $exists: false },
    },
    { limit: 1 },
  );

  return result > 0;
}
