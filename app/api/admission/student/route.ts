import { randomUUID } from "node:crypto";
import { GridFSBucket, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const MAX_FILE = 1024 * 1024;
const MAX_TOTAL = 5 * 1024 * 1024;
const KEYS = ["photo", "signatureImage", "photoId", "marksheet"] as const;
type DocumentKey = (typeof KEYS)[number];

type StoredFile = {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
};
function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status, headers: HEADERS });
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function actualMime(bytes: Buffer): string | null {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "image/jpeg";
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-")
    return "application/pdf";
  return null;
}
function ageAtBirthDate(date: unknown): number | null {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return null;
  const birth = new Date(`${date}T00:00:00Z`);
  if (
    Number.isNaN(birth.getTime()) ||
    birth.toISOString().slice(0, 10) !== date
  )
    return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const thisYearBirthday = new Date(
    Date.UTC(now.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()),
  );
  if (now < thisYearBirthday) age--;
  return age >= 0 && age < 130 ? age : null;
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (
      !session ||
      session.role !== "student" ||
      (session.status && session.status !== "active")
    ) {
      return fail("Active student login required.", 403);
    }
    const db = await getMongoDatabase();
    const records = await db
      .collection("admissionApplications")
      .find({ linkedStudentId: session.id })
      .project({
        _id: 0,
        documents: 0,
        signature: 0,
        declarationCorrect: 0,
        declarationTerms: 0,
      })
      .limit(2)
      .toArray();
    if (records.length > 1)
      return fail("Multiple linked admissions. Contact admin.", 409);
    if (!records.length)
      return fail(
        "No linked admission is available yet. Contact the admissions team.",
        404,
      );
    return NextResponse.json({ application: records[0] }, { headers: HEADERS });
  } catch (error) {
    console.error("Student admission GET error:", error);
    return fail("Unable to load student admission.", 500);
  }
}

export async function POST(request: Request) {
  const uploaded: ObjectId[] = [];
  let bucket: GridFSBucket | null = null;
  try {
    const session = await getSessionUser();
    if (
      !session ||
      session.role !== "student" ||
      (session.status && session.status !== "active")
    ) {
      return fail("Active student login required.", 403);
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_TOTAL)
      return fail("Upload exceeds 5 MB total.", 413);
    const form = await request.formData();
    const applicationId = form.get("applicationId");
    if (
      typeof applicationId !== "string" ||
      !/^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(applicationId)
    ) {
      return fail("Invalid admission ID.");
    }
    if (
      form.get("confirmDetails") !== "true" ||
      form.get("acceptPrivacy") !== "true" ||
      form.get("acceptTerms") !== "true"
    ) {
      return fail("Confirm your admission details and accept both policies.");
    }
    const db = await getMongoDatabase();
    const collection = db.collection("admissionApplications");
    const admission = await collection.findOne({
      applicationId,
      linkedStudentId: session.id,
    });
    if (!admission)
      return fail("Admission is not linked to your student account.", 404);
    if (admission.status !== "pending_student_approval") {
      return fail(
        "This admission cannot be approved in its current status.",
        409,
      );
    }
    const age = ageAtBirthDate(admission.dateOfBirth);
    if (age === null)
      return fail(
        "Date of birth requires correction by admissions staff.",
        409,
      );
    // Minors submit documents first; only a linked parent can finalize approval.

    const files: Partial<
      Record<DocumentKey, { name: string; mime: string; bytes: Buffer }>
    > = {};
    let total = 0;
    for (const key of KEYS) {
      const file = form.get(key);
      if (!(file instanceof File) || file.size === 0)
        return fail(`Upload the required ${key} document.`);
      if (file.size > MAX_FILE)
        return fail(`${key} must be at most 1 MB.`, 413);
      const bytes = Buffer.from(await file.arrayBuffer());
      const mime = actualMime(bytes);
      if (!mime || mime !== file.type)
        return fail(`Invalid file format for ${key}.`);
      if (
        (key === "photo" || key === "signatureImage") &&
        mime === "application/pdf"
      )
        return fail(`${key} must be PNG or JPEG.`);
      total += bytes.length;
      files[key] = { name: file.name.slice(0, 100), mime, bytes };
    }
    if (total > 4 * MAX_FILE)
      return fail("Files exceed the total upload limit.", 413);
    bucket = new GridFSBucket(db, { bucketName: "admissionDocuments" });
    const documents: Record<string, StoredFile> = {};
    for (const key of KEYS) {
      const file = files[key]!;
      const upload = bucket.openUploadStream(
        `${applicationId}-${key}-${randomUUID()}`,
        {
          metadata: {
            applicationId,
            category: key,
            studentId: session.id,
            mimeType: file.mime,
          },
        },
      );
      await new Promise<void>((resolve, reject) => {
        upload.once("finish", resolve);
        upload.once("error", reject);
        upload.end(file.bytes);
      });
      uploaded.push(upload.id);
      documents[key] = {
        fileId: upload.id.toHexString(),
        originalName: file.name,
        mimeType: file.mime,
        size: file.bytes.length,
      };
    }
    const approvedAt = new Date().toISOString();
    const result = await collection.updateOne(
      {
        applicationId,
        linkedStudentId: session.id,
        status: "pending_student_approval",
      },
      {
        $set: {
          status: age < 18 ? "pending_guardian_approval" : "approved",
          ...(age >= 18 ? { approvedAt } : {}),
          reviewedAt: approvedAt,
          documents,
          studentConsent: {
            approvedByStudentId: session.id,
            approvedAt,
            confirmDetails: true,
            acceptPrivacy: true,
            acceptTerms: true,
            privacyPolicyPath: "/privacy",
            termsPath: "/terms",
          },
        },
      },
    );
    if (result.modifiedCount !== 1)
      return fail("Admission status changed. Refresh and try again.", 409);
    return NextResponse.json(
      {
        success: true,
        applicationId,
        status: age < 18 ? "pending_guardian_approval" : "approved",
        approvedAt: age < 18 ? null : approvedAt,
      },
      { headers: HEADERS },
    );
  } catch (error) {
    console.error("Student admission approval error:", error);
    return fail("Unable to approve admission.", 500);
  } finally {
    if (bucket && uploaded.length) {
      // Retain only files referenced by the successfully approved application.
      try {
        const db = await getMongoDatabase();
        const ids = uploaded.map((id) => id.toHexString());
        const count = await db
          .collection("admissionApplications")
          .countDocuments({
            status: { $in: ["approved", "pending_guardian_approval"] },
            "documents.signatureImage.fileId": { $in: ids },
          });
        if (!count)
          await Promise.allSettled(uploaded.map((id) => bucket!.delete(id)));
      } catch (cleanupError) {
        console.error("Admission document cleanup:", cleanupError);
      }
    }
  }
}
