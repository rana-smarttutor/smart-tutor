import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers });

async function guardianContext() {
  const session = await getSessionUser();
  if (!session || session.role !== "parent" || session.status !== "active" || session.verified !== true) return null;
  const db = await getMongoDatabase();
  const parent = await db.collection("users").findOne({
    id: session.id, role: "parent", status: "active", verified: true,
    deletedAt: { $exists: false }, linkedStudentId: { $type: "string" },
  });
  if (!parent || typeof parent.linkedStudentId !== "string" || !parent.linkedStudentId.trim()) return null;
  const student = await db.collection("users").findOne({
    id: parent.linkedStudentId, role: "student", status: "active",
    deletedAt: { $exists: false },
  });
  if (!student) return null;
  return { db, session, studentId: parent.linkedStudentId as string };
}

function isMinor(dob: unknown): boolean {
  if (typeof dob !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== dob) return false;
  const today = new Date();
  let years = today.getUTCFullYear() - birth.getUTCFullYear();
  const birthday = new Date(Date.UTC(today.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
  if (today < birthday) years--;
  return years >= 0 && years < 18;
}

export async function GET() {
  try {
    const ctx = await guardianContext();
    if (!ctx) return fail("An active, verified parent account linked to a student is required.", 403);
    const applications = await ctx.db.collection("admissionApplications")
      .find({ linkedStudentId: ctx.studentId })
      .project({ _id: 0, documents: 0, signature: 0, declarationCorrect: 0, declarationTerms: 0 })
      .limit(2).toArray();
    if (applications.length > 1) return fail("Multiple admissions found. Contact Admin.", 409);
    if (!applications.length) return fail("No linked admission found.", 404);
    return NextResponse.json({ application: applications[0] }, { headers });
  } catch (error) {
    console.error("Guardian admission GET:", error);
    return fail("Unable to load admission.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await guardianContext();
    if (!ctx) return fail("An active, verified linked parent must approve this admission.", 403);
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 3000) return fail("Request too large.", 413);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return fail("Invalid JSON."); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("Invalid body.");
    const body = parsed as Record<string, unknown>;
    const applicationId = typeof body.applicationId === "string" ? body.applicationId.trim() : "";
    if (!/^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(applicationId)) return fail("Invalid admission ID.");
    if (body.confirmDetails !== true || body.acceptPrivacy !== true || body.acceptTerms !== true) {
      return fail("Review the details and accept both policies.");
    }
    const collection = ctx.db.collection("admissionApplications");
    const admission = await collection.findOne({
      applicationId, linkedStudentId: ctx.studentId, status: "pending_guardian_approval",
    });
    if (!admission) return fail("Admission is not awaiting guardian approval.", 409);
    if (!isMinor(admission.dateOfBirth)) return fail("Guardian approval is only available for minors.", 409);
    if (!admission.studentConsent?.confirmDetails || !admission.studentConsent?.acceptPrivacy || !admission.studentConsent?.acceptTerms) {
      return fail("Student verification is incomplete.", 409);
    }
    for (const key of ["photo", "signatureImage", "photoId", "marksheet"]) {
      if (typeof admission.documents?.[key]?.fileId !== "string") return fail("Student documents are incomplete.", 409);
    }
    const approvedAt = new Date().toISOString();
    const result = await collection.updateOne(
      { applicationId, linkedStudentId: ctx.studentId, status: "pending_guardian_approval" },
      { $set: {
        status: "approved", approvedAt, updatedAt: approvedAt,
        guardianConsent: {
          approvedByParentId: ctx.session.id, studentId: ctx.studentId, approvedAt,
          confirmDetails: true, acceptPrivacy: true, acceptTerms: true,
          privacyPolicyPath: "/privacy", termsPath: "/terms",
        },
      } },
    );
    if (result.modifiedCount !== 1) return fail("Admission changed. Refresh and retry.", 409);
    return NextResponse.json({ success: true, status: "approved", approvedAt }, { headers });
  } catch (error) {
    console.error("Guardian admission approval:", error);
    return fail("Unable to approve admission.", 500);
  }
}
