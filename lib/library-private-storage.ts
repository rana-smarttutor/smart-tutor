import "server-only";

import { head } from "@vercel/blob";

const PRIVATE_BOOK_PATTERN =
  /^digital-library\/private-books\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/i;

export function isPrivateLibraryBookPath(
  pathname: string
): boolean {
  return PRIVATE_BOOK_PATTERN.test(pathname);
}

function getPrivateBlobToken(): string {
  const token =
    process.env.LIBRARY_PRIVATE_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "Private Digital Library Blob storage is not configured."
    );
  }

  return token;
}

export async function verifyPrivateLibraryBook(
  pathname: string
): Promise<{
  pathname: string;
  size: number;
}> {
  if (!isPrivateLibraryBookPath(pathname)) {
    throw new Error("Invalid private PDF pathname.");
  }

  const blob = await head(pathname, {
    token: getPrivateBlobToken(),
  });

  if (
    blob.pathname !== pathname ||
    blob.size <= 0 ||
    blob.contentType !== "application/pdf"
  ) {
    throw new Error(
      "Private PDF verification failed."
    );
  }

  return {
    pathname: blob.pathname,
    size: blob.size,
  };
}
