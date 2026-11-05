import "server-only";

import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const PDF_KEY_PATTERN = /^migration\/exam-books\/[a-f0-9]{24}\.pdf$/i;

const THUMBNAIL_KEY_PATTERN =
  /^migration\/exam-thumbnails\/[a-f0-9]{24}\.(png|jpg|jpeg|webp)$/i;

let client: S3Client | null = null;

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const endpoint = process.env.R2_ENDPOINT?.trim();

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !endpoint
  ) {
    throw new Error("Cloudflare R2 environment variables are missing.");
  }

  const expectedEndpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  if (
    endpoint.replace(/\/$/, "") !== expectedEndpoint ||
    bucketName !== "smartiq-digital-library"
  ) {
    throw new Error("Invalid Cloudflare R2 configuration.");
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint: expectedEndpoint,
  };
}

export function isValidR2BookKey(key: unknown): key is string {
  return typeof key === "string" && PDF_KEY_PATTERN.test(key);
}

export function isValidR2ThumbnailKey(key: unknown): key is string {
  return typeof key === "string" && THUMBNAIL_KEY_PATTERN.test(key);
}

export function getR2Client(): S3Client {
  if (!client) {
    const config = getR2Config();

    client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      maxAttempts: 3,
    });
  }

  return client;
}

export function getR2BucketName(): string {
  return getR2Config().bucketName;
}

export async function headR2Book(key: string) {
  if (!isValidR2BookKey(key)) {
    throw new Error("Invalid R2 book key.");
  }

  return getR2Client().send(
    new HeadObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}

export async function getR2Book(key: string) {
  if (!isValidR2BookKey(key)) {
    throw new Error("Invalid R2 book key.");
  }

  return getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}

export async function getR2Thumbnail(key: string) {
  if (!isValidR2ThumbnailKey(key)) {
    throw new Error("Invalid R2 thumbnail key.");
  }

  return getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}
