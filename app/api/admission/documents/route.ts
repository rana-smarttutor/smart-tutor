import { GridFSBucket, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'; sandbox",
};
const FILE_KEYS = ["photo", "signatureImage", "photoId", "marksheet"] as const;
type DocumentKey = (typeof FILE_KEYS)[number];
type StoredFile = { fileId?: unknown; originalName?: unknown; mimeType?: unknown; size?: unknown };
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: HEADERS });

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !["admin", "staff", "counsellor"].includes(session.role) ||
      (session.status && session.status !== "active") || session.verified === false) {
      return fail("Active admissions team login required.", 403);
    }

    const params = new URL(request.url).searchParams;
    const applicationId = params.get("applicationId")?.trim() ?? "";
    if (!/^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(applicationId)) {
      return fail("Valid application ID required.", 400);
    }
    const keyParam = params.get("key");
    if (keyParam && !FILE_KEYS.includes(keyParam as DocumentKey)) {
      return fail("Invalid document type.", 400);
    }

    const db = await getMongoDatabase();
    const admission = await db.collection("admissionApplications").findOne(
      { applicationId },
      { projection: { _id: 0, applicationId: 1, documents: 1, linkedStudentId: 1 } },
    );
    if (!admission) return fail("Admission not found.", 404);
    const docs = (admission.documents ?? {}) as Record<string, StoredFile | undefined>;

    if (!keyParam) {
      const documents = Object.fromEntries(FILE_KEYS.map((key) => {
        const doc = docs[key];
        const available = !!doc && typeof doc.fileId === "string" && ObjectId.isValid(doc.fileId);
        return [key, {
          available,
          name: available && typeof doc?.originalName === "string" ? doc.originalName.slice(0, 100) : "",
          mimeType: available && typeof doc?.mimeType === "string" ? doc.mimeType : "",
          size: available && typeof doc?.size === "number" ? doc.size : 0,
        }];
      }));
      return NextResponse.json({ applicationId, documents }, { headers: HEADERS });
    }

    const doc = docs[keyParam];
    if (!doc || typeof doc.fileId !== "string" || !ObjectId.isValid(doc.fileId)) {
      return fail("Document has not been uploaded.", 404);
    }
    if (!["image/png", "image/jpeg", "application/pdf"].includes(String(doc.mimeType))) {
      return fail("Unsupported file format.", 415);
    }
    const fileId = new ObjectId(doc.fileId);
    const bucket = new GridFSBucket(db, { bucketName: "admissionDocuments" });
    const files = await db.collection("admissionDocuments.files").findOne({ _id: fileId },
      { projection: { _id: 1, length: 1, metadata: 1 } });
    if (!files || files.length > 1024 * 1024 || files.length <= 0 ||
      files.metadata?.applicationId !== applicationId ||
      files.metadata?.category !== keyParam ||
      (admission.linkedStudentId && files.metadata?.studentId !== admission.linkedStudentId)) {
      return fail("Document storage record does not match this admission.", 409);
    }

    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of bucket.openDownloadStream(fileId)) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > 1024 * 1024) return fail("Document exceeds the allowed size.", 413);
      chunks.push(bytes);
    }
    const bytes = Buffer.concat(chunks);
    const mime = String(doc.mimeType);
    const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const isPdf = bytes.subarray(0, 5).toString("ascii") === "%PDF-";
    if ((mime === "image/png" && !isPng) ||
      (mime === "image/jpeg" && !isJpeg) ||
      (mime === "application/pdf" && !isPdf)) {
      return fail("Stored document format mismatch.", 409);
    }
    const download = params.get("download") === "1";
    const extension = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "pdf";
    const filename = `${applicationId}-${keyParam}.${extension}`;
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...HEADERS,
        "Content-Type": mime,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    console.error("Admission documents API error:", error);
    return fail("Unable to load admission documents.", 500);
  }
}
