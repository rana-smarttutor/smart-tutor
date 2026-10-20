import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import { logAction } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

const EDITABLE_FIELDS = new Set([
  "flat", "street", "city", "state", "pin",
  "fatherName", "fatherMobile", "fatherEmail", "motherName",
  "motherMobile", "motherEmail", "emergencyName", "emergencyRelation",
  "emergencyMobile", "otherQualification",
]);

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status, headers: HEADERS });
}

function isObject(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === "object" && !Array.isArray(input);
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return fail("Login required.", 401);
    if (!["admin", "staff", "counsellor"].includes(session.role) ||
        (session.status && session.status !== "active")) {
      return fail("Access denied.", 403);
    }

    const db = await getMongoDatabase();
    const applications = await db.collection<{
  applicationId: string;
  correctionHistory?: {
    reason: string;
    changes: string[];
    correctedByUserId: string;
    correctedAt: string;
  }[];
    status: string;
  correctionRequest?: {
    requestedAt: string;
    reason: string;
  };
}>("admissionApplications")
      .find({ status: "correction_requested" }, {
        projection: {
          _id: 0, applicationId: 1, name: 1, email: 1, mobile: 1,
          linkedStudentId: 1, status: 1, correctionRequest: 1,
          course: 1, exam: 1, updatedAt: 1,
        },
      })
      .sort({ "correctionRequest.requestedAt": -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ applications }, { headers: HEADERS });
  } catch (error) {
    console.error("Admission correction list error:", error);
    return fail("Unable to load corrections.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return fail("Login required.", 401);
    if (!["admin", "staff", "counsellor"].includes(session.role) ||
        (session.status && session.status !== "active")) {
      return fail("Access denied.", 403);
    }

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 15_000) return fail("Request is too large.", 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return fail("Invalid JSON."); }
    if (!isObject(body)) return fail("Invalid request body.");

    const applicationId = typeof body.applicationId === "string"
      ? body.applicationId.trim() : "";
    if (!/^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(applicationId)) {
      return fail("Invalid admission ID.");
    }
    if (!isObject(body.changes)) return fail("Provide the corrected admission fields.");

    const entries = Object.entries(body.changes);
    if (entries.length === 0 || entries.length > 16) {
      return fail("Provide 1â€“16 corrected fields.");
    }

    const changes: Record<string, string> = {};
    for (const [key, value] of entries) {
      if (!EDITABLE_FIELDS.has(key)) return fail(`Field ${key} cannot be edited here.`);
      if (typeof value !== "string" || value.trim().length === 0 || value.length > 500) {
        return fail(`Enter a valid value for ${key}.`);
      }
      changes[key] = value.trim();
    }

    if (changes.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.email)) {
      return fail("Enter a valid email address.");
    }
    if (changes.pin && !/^\d{6}$/.test(changes.pin)) return fail("Enter a valid PIN code.");
    for (const key of ["mobile", "fatherMobile", "motherMobile", "emergencyMobile"]) {
      if (changes[key] && !/^[6-9]\d{9}$/.test(changes[key])) {
        return fail(`Enter a valid 10-digit number for ${key}.`);
      }
    }

    const db = await getMongoDatabase();
    const collection = db.collection<{
  applicationId: string;
  correctionHistory?: {
    reason: string;
    changes: string[];
    correctedByUserId: string;
    correctedAt: string;
  }[];
    status: string;
  correctionRequest?: {
    requestedAt: string;
    reason: string;
  };
}>("admissionApplications");
    const existing = await collection.findOne({ applicationId, status: "correction_requested" });
    if (!existing) return fail("Correction request no longer pending.", 409);

    const different = Object.fromEntries(
      Object.entries(changes).filter(([key, value]) => (existing as Record<string, unknown>)[key] !== value),
    );
    if (Object.keys(different).length === 0) return fail("No values have changed.");

    const now = new Date().toISOString();
    const result = await collection.updateOne(
      {
        applicationId,
        status: "correction_requested",
        "correctionRequest.requestedAt": existing.correctionRequest?.requestedAt,
      },
      {
        $set: {
          ...different,
          status: "pending_student_approval",
          updatedAt: now,
          correctedAt: now,
          correctedByUserId: session.id,
        },
        $push: {
          correctionHistory: {
            reason: existing.correctionRequest?.reason ?? "",
            changes: Object.keys(different),
            correctedByUserId: session.id,
            correctedAt: now,
          },
        },
        $unset: { correctionRequest: "" },
      },
    );
    if (result.modifiedCount !== 1) return fail("Application changed; refresh and retry.", 409);

    await logAction({
      action: "update", category: "students", details: "Resolved admission correction request",
      path: new URL(request.url).pathname, method: request.method,
      request, session, statusCode: 200,
      metadata: { applicationId, fields: Object.keys(different), module: "admission" },
    });

    return NextResponse.json({ success: true, applicationId, status: "pending_student_approval" },
      { headers: HEADERS });
  } catch (error) {
    console.error("Admission correction resolution error:", error);
    return fail("Unable to resolve correction request.", 500);
  }
}

