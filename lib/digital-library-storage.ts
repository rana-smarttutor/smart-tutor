export const DIGITAL_LIBRARY_BOOK_PREFIX = "digital-library/books/";

export const DIGITAL_LIBRARY_METADATA_PREFIX = "digital-library/metadata/";

export const DIGITAL_LIBRARY_THUMBNAIL_PREFIX = "digital-library/thumbnails/";

export type DigitalLibraryStorageKind = "blob" | "mega" | "r2";

export type MegaBookMetadata = {
  pathname: string;
  title: string;
  description: string;
  price: string;
  fileName: string;
  categoryId?: string;
  categoryLabel?: string;
  thumbnailUrl?: string;
  thumbnailPathname?: string;
  megaDownloadUrl?: string;
  megaNodeId?: string;
  megaFileName?: string;
  blobUrl?: string;
  blobPathname?: string;
  uploadedAt: string;
  updatedAt?: string;
  storageType?: DigitalLibraryStorageKind;
};

/**
 * Supports both existing book pathname formats:
 *
 * digital-library/books/<asset-key>.pdf
 * digital-library/<asset-key>.pdf
 *
 * Does not allow nested folders beyond books/,
 * traversal, URL escapes, or arbitrary extensions.
 */
export function isBookPath(pathname: string): boolean {
  return (
    typeof pathname === "string" &&
    pathname.length <= 500 &&
    /^digital-library\/(?:books\/)?[a-zA-Z0-9_-]+\.pdf$/i.test(pathname)
  );
}

export function getBookAssetKey(pathname: string): string {
  if (!isBookPath(pathname)) {
    return "";
  }

  return pathname
    .replace(/^digital-library\/(?:books\/)?/i, "")
    .replace(/\.pdf$/i, "");
}

export function getMetadataPathForBook(pathname: string): string {
  // Metadata was historically created for
  // digital-library/books/ paths.
  // Do not reinterpret older legacy paths
  // as new metadata records.
  if (!pathname.startsWith(DIGITAL_LIBRARY_BOOK_PREFIX)) {
    return "";
  }

  const assetKey = getBookAssetKey(pathname);

  return assetKey ? `${DIGITAL_LIBRARY_METADATA_PREFIX}${assetKey}.json` : "";
}

export function getThumbnailPathForAssetKey(
  assetKey: string,
  extension = ".jpg",
): string {
  if (
    !assetKey ||
    assetKey.length > 450 ||
    !/^[a-zA-Z0-9_-]+$/.test(assetKey) ||
    !/^\.(png|jpg|jpeg|webp)$/i.test(extension)
  ) {
    return "";
  }

  return `${DIGITAL_LIBRARY_THUMBNAIL_PREFIX}` + `${assetKey}${extension}`;
}

export function getLibraryDownloadRoute(pathname: string): string {
  if (!isBookPath(pathname)) {
    return "";
  }

  return (
    "/api/digital-library/download?pathname=" + encodeURIComponent(pathname)
  );
}
