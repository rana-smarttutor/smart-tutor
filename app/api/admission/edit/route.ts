import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const ROLES = new Set(["admin", "staff", "counsellor"]);
const EDITABLE = [
  "programme", "session", "studyMode", "medium", "batchTime", "heardFrom",
  "name", "email", "mobile", "flat", "street", "city", "state", "pin",
  "fatherName", "fatherOccupation", "fatherMobile", "fatherEmail",
  "motherName", "motherOccupation", "motherMobile", "motherEmail",
  "contactPreference", "emergencyName", "emergencyRelation", "emergencyMobile",
] as const;
const EDITABLE_SET = new Set<string>(EDITABLE);
const PENDING = ["pending_student_approval", "correction_requested", "submitted"];
const PROGRAMMES = ["Regular batch", "Weekend batch", "Crash course", "Test series only"];
const VALID_CONTACT = ["Father", "Mother", "Student (18 or above)"];

function reply(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status, headers: HEADERS });
}
async function authorized() {
  const user = await getSessionUser();
  return user && ROLES.has(user.role) && (!user.status || user.status === "active") ? user : null;
}
function validId(value: unknown): value is string {
  return typeof value === "string" && /^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(value);
}
function validMobile(value: string) { return /^[6-9]\d{9}$/.test(value); }
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

export async function GET(request: Request) {
  try {
    const user = await authorized();
    if (!user) return reply({ error: "Admin, Staff or Counsellor access required." }, 403);
    const applicationId = new URL(request.url).searchParams.get("applicationId");
    if (!applicationId) return reply({ canEdit: true });
    if (!validId(applicationId)) return reply({ error: "Invalid admission ID." }, 400);
    const db = await getMongoDatabase();
    const application = await db.collection("admissionApplications").findOne({ applicationId }, { projection: { _id: 0 } });
    if (!application) return reply({ error: "Application not found." }, 404);
    if (!PENDING.includes(application.status)) return reply({ error: "Only pending applications can be edited." }, 409);
    return reply({ application: { ...Object.fromEntries(EDITABLE.map((key) => [key, application[key] ?? ""])), linkedStudentId: application.linkedStudentId ?? null } });
  } catch (error) {
    console.error("Admission edit GET error", error);
    return reply({ error: "Unable to load application for editing." }, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await authorized();
    if (!user) return reply({ error: "Admin, Staff or Counsellor access required." }, 403);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return reply({ error: "Invalid request." }, 400);
    const { applicationId, changes } = body as { applicationId?: unknown; changes?: unknown };
    if (!validId(applicationId)) return reply({ error: "Invalid admission ID." }, 400);
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) return reply({ error: "Invalid changes." }, 400);
    const input = changes as Record<string, unknown>;
    const keys = Object.keys(input);
    if (!keys.length || keys.length > EDITABLE.length || keys.some((key) => !EDITABLE_SET.has(key))) return reply({ error: "One or more fields cannot be edited." }, 400);
    const updates: Record<string, string> = {};
    for (const key of keys) {
      if (typeof input[key] !== "string") return reply({ error: `Invalid ${key}.` }, 400);
      const value = input[key].trim();
      if (value.length > (key === "flat" || key === "street" ? 500 : 250)) return reply({ error: `${key} is too long.` }, 400);
      updates[key] = value;
    }
    const db = await getMongoDatabase();
    const applications = db.collection("admissionApplications");
    const existing = await applications.findOne({ applicationId });
    if (!existing) return reply({ error: "Application not found." }, 404);
    if (!PENDING.includes(existing.status) || existing.approvedAt || existing.guardianConsent || existing.studentConsent) {
      return reply({ error: "This application is already finalized and cannot be edited." }, 409);
    }
    const editingIdentity = Object.hasOwn(updates, "name") || Object.hasOwn(updates, "email");
    if (editingIdentity && existing.linkedStudentId) {
      if ((updates.name !== undefined && updates.name !== existing.name) ||
          (updates.email !== undefined && updates.email.toLowerCase() !== String(existing.email ?? "").toLowerCase())) {
        return reply({ error: "Unlinking or changing identity on an already linked admission is not allowed." }, 409);
      }
    }
    const merged = { ...existing, ...updates };
    if (!String(merged.name ?? "").trim() || !validEmail(String(merged.email ?? ""))) {
      return reply({ error: "Student name and a valid email address are required." }, 400);
    }
    if (updates.email !== undefined) updates.email = updates.email.toLowerCase();
    for (const field of ["programme", "session", "studyMode", "medium", "batchTime", "mobile", "flat", "street", "city", "state", "pin", "emergencyName", "emergencyRelation", "emergencyMobile"]) {
      if (!merged[field] || typeof merged[field] !== "string" || !merged[field].trim()) return reply({ error: `Required field ${field} cannot be blank.` }, 400);
    }
    if (!PROGRAMMES.includes(merged.programme)) return reply({ error: "Invalid programme." }, 400);
    if (!validMobile(merged.mobile) || !validMobile(merged.emergencyMobile) || !/^\d{6}$/.test(merged.pin)) return reply({ error: "Invalid mobile number or PIN." }, 400);
    if (!merged.fatherName?.trim() && !merged.motherName?.trim()) return reply({ error: "At least one parent name is required." }, 400);
    for (const parent of ["father", "mother"] as const) {
      if (merged[`${parent}Name`] && !validMobile(String(merged[`${parent}Mobile`] ?? ""))) return reply({ error: `Invalid ${parent} mobile.` }, 400);
      if (merged[`${parent}Email`] && !validEmail(String(merged[`${parent}Email`]))) return reply({ error: `Invalid ${parent} email.` }, 400);
    }
    if (!VALID_CONTACT.includes(merged.contactPreference)) return reply({ error: "Invalid contact preference." }, 400);
    const birth = typeof merged.dateOfBirth === "string" ? new Date(`${merged.dateOfBirth}T00:00:00Z`) : null;
    if (birth && !Number.isNaN(birth.getTime())) {
      const now = new Date();
      let age = now.getUTCFullYear() - birth.getUTCFullYear();
      if (Date.UTC(now.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()) > now.getTime()) age--;
      if (age < 18 && (!merged.fatherName?.trim() || !merged.motherName?.trim() || merged.contactPreference === "Student (18 or above)")) {
        return reply({ error: "Minor student requires valid parent details and contact preference." }, 400);
      }
    }
    // The student must explicitly approve the changed version. No student/guardian consent can be carried over.
    const now = new Date().toISOString();
    const result = await applications.updateOne(
      { applicationId, status: { $in: PENDING }, approvedAt: null, guardianConsent: null, studentConsent: null, ...(existing.linkedStudentId ? { linkedStudentId: existing.linkedStudentId } : { linkedStudentId: null }) },
      { $set: { ...updates, status: "pending_student_approval", updatedAt: now, editedByUserId: user.id, editedByRole: user.role, editedAt: now, studentConsent: null, reviewedAt: null },
        $unset: { correctionRequest: "" } },
    );
    if (result.matchedCount !== 1) return reply({ error: "Application changed or has approval data. Refresh and retry." }, 409);
    return reply({ success: true, applicationId, status: "pending_student_approval" });
  } catch (error) {
    console.error("Admission edit PATCH error", error);
    return reply({ error: "Unable to update admission." }, 500);
  }
}
