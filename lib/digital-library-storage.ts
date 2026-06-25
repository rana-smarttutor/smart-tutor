export const DIGITAL_LIBRARY_BOOK_PREFIX = "digital-library/books/";
export const DIGITAL_LIBRARY_METADATA_PREFIX = "digital-library/metadata/";
export const DIGITAL_LIBRARY_THUMBNAIL_PREFIX = "digital-library/thumbnails/";

export type DigitalLibraryStorageKind = "blob" | "mega";

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

export function isBookPath(pathname: string) {
  return (
    pathname.startsWith(DIGITAL_LIBRARY_BOOK_PREFIX) &&
    pathname.toLowerCase().endsWith(".pdf")
  );
}

export function getBookAssetKey(pathname: string) {
  if (!isBookPath(pathname)) {
    return "";
  }

  return pathname
    .replace(DIGITAL_LIBRARY_BOOK_PREFIX, "")
    .replace(/\.pdf$/i, "");
}

export function getMetadataPathForBook(pathname: string) {
  const assetKey = getBookAssetKey(pathname);

  return assetKey
    ? `${DIGITAL_LIBRARY_METADATA_PREFIX}${assetKey}.json`
    : "";
}

export function getThumbnailPathForAssetKey(
  assetKey: string,
  extension = ".jpg",
) {
  return assetKey
    ? `${DIGITAL_LIBRARY_THUMBNAIL_PREFIX}${assetKey}${extension}`
    : "";
}

export function getLibraryDownloadRoute(pathname: string) {
  return `/api/digital-library/download?pathname=${encodeURIComponent(pathname)}`;
}
