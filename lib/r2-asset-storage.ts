import "server-only";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getR2BucketName,
  getR2Client,
} from "@/lib/cloudflare-r2";

const ASSET_PREFIX = "migration/public-assets/";

const ALLOWED_PATH_PREFIXES = [
  "signup/",
  "student-performance/",
  "homework-attachments/",
  "homework-submissions/",
  "chat-uploads/",
] as const;

const MAX_ASSET_BYTES = 20 * 1024 * 1024;

export function isValidAssetPathname(
  value: unknown,
): value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 500
  ) {
    return false;
  }

  if (
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("..") ||
    value.includes("//") ||
    /[\x00-\x1F\x7F]/.test(value)
  ) {
    return false;
  }

  if (!/^[a-zA-Z0-9_./-]+$/.test(value)) {
    return false;
  }

  return ALLOWED_PATH_PREFIXES.some((prefix) =>
    value.startsWith(prefix),
  );
}

export function getR2AssetKey(pathname: string): string {
  if (!isValidAssetPathname(pathname)) {
    throw new Error("Invalid application asset pathname.");
  }

  return `${ASSET_PREFIX}${pathname}`;
}

export function isValidR2AssetKey(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(ASSET_PREFIX) &&
    isValidAssetPathname(
      value.slice(ASSET_PREFIX.length),
    )
  );
}

export async function uploadR2Asset(
  pathname: string,
  file: File,
): Promise<{
  pathname: string;
  key: string;
  size: number;
  contentType: string;
}> {
  if (!isValidAssetPathname(pathname)) {
    throw new Error("Invalid application asset pathname.");
  }

  if (
    !(file instanceof File) ||
    file.size <= 0 ||
    file.size > MAX_ASSET_BYTES
  ) {
    throw new Error(
      "Invalid file or file exceeds the 20 MB storage limit.",
    );
  }

  const key = getR2AssetKey(pathname);

  const bytes = Buffer.from(
    await file.arrayBuffer(),
  );

  const contentType =
    file.type || "application/octet-stream";

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      Body: bytes,
      ContentLength: bytes.length,
      ContentType: contentType,
      IfNoneMatch: "*",
    }),
  );

  return {
    pathname,
    key,
    size: bytes.length,
    contentType,
  };
}

export async function headR2Asset(
  key: string,
) {
  if (!isValidR2AssetKey(key)) {
    throw new Error("Invalid R2 asset key.");
  }

  return getR2Client().send(
    new HeadObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}

export async function getR2Asset(
  key: string,
) {
  if (!isValidR2AssetKey(key)) {
    throw new Error("Invalid R2 asset key.");
  }

  return getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}