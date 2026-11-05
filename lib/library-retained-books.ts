import "server-only";

import { ObjectId } from "mongodb";

// The 47 books retained for the final
// SmartIQ Digital Library.
//
// The five previously retained books without
// R2 thumbnails have been excluded.
//
// Keep this allowlist until the controlled
// MongoDB cutover has been verified.

export const RETAINED_LIBRARY_BOOK_IDS = [
  "6ae1a5ce9a919bb8e6ebcdb0",
  "6ae1a5ce9a919bb8e6ebcdc8",
  "6ae1a5ce9a919bb8e6ebcdc9",
  "6ae1a5ce9a919bb8e6ebcdca",
  "6ae1a5ce9a919bb8e6ebcdcb",
  "6ae1a5ce9a919bb8e6ebcdcc",
  "6ae1a5ce9a919bb8e6ebcdcd",
  "6ae1a5ce9a919bb8e6ebcdce",
  "6ae1a5ce9a919bb8e6ebcdcf",
  "6ae1a5ce9a919bb8e6ebcdd0",
  "6ae1a5ce9a919bb8e6ebcdd1",
  "6ae1a5ce9a919bb8e6ebcdd2",
  "6ae1a5ce9a919bb8e6ebcdd3",
  "6ae1a5ce9a919bb8e6ebcdd4",
  "6ae1a5ce9a919bb8e6ebcdd5",
  "6ae1a5ce9a919bb8e6ebcdd6",
  "6ae1a5ce9a919bb8e6ebcdd7",
  "6ae1a5ce9a919bb8e6ebcdd8",
  "6ae1a5ce9a919bb8e6ebcdd9",
  "6ae1a5ce9a919bb8e6ebcdda",
  "6ae1a5ce9a919bb8e6ebcddb",
  "6ae1a5ce9a919bb8e6ebcddc",
  "6ae1a5ce9a919bb8e6ebcddd",
  "6ae1a5ce9a919bb8e6ebcdde",
  "6ae1a5ce9a919bb8e6ebcddf",
  "6ae1a5ce9a919bb8e6ebcde0",
  "6ae1a5ce9a919bb8e6ebcde1",
  "6ae1a5ce9a919bb8e6ebcde2",
  "6ae1a5ce9a919bb8e6ebcde3",
  "6ae1a5ce9a919bb8e6ebcde4",
  "6ae1a5ce9a919bb8e6ebcde5",
  "6ae1a5ce9a919bb8e6ebcde6",
  "6ae1a5ce9a919bb8e6ebcde7",
  "6ae1a5ce9a919bb8e6ebcde8",
  "6ae1a5ce9a919bb8e6ebcde9",
  "6ae1a5ce9a919bb8e6ebcdea",
  "6ae1a5ce9a919bb8e6ebcdeb",
  "6ae1a5ce9a919bb8e6ebcdec",
  "6ae1a5ce9a919bb8e6ebcded",
  "6ae1a5ce9a919bb8e6ebcdee",
  "6ae1a5ce9a919bb8e6ebcdef",
  "6ae1a5ce9a919bb8e6ebcdf0",
  "6ae1a5ce9a919bb8e6ebcdf1",
  "6ae1a5ce9a919bb8e6ebcdf2",
  "6ae1a5ce9a919bb8e6ebcdf3",
  "6ae1a5ce9a919bb8e6ebcdf4",
  "6ae1a5ce9a919bb8e6ebce01",
] as const;

if (
  RETAINED_LIBRARY_BOOK_IDS.length !== 47 ||
  new Set(RETAINED_LIBRARY_BOOK_IDS).size !== 47
) {
  throw new Error("Invalid retained Digital Library book allowlist.");
}

export const RETAINED_LIBRARY_OBJECT_IDS = RETAINED_LIBRARY_BOOK_IDS.map(
  (id) => new ObjectId(id),
);

export const RETAINED_LIBRARY_BOOK_COUNT = 47;
