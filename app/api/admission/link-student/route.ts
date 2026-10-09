import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: HEADERS });
}

function normalizeName(value: unknown) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeMobile(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\D/g, "").slice(-10)
    : "";
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) return errorResponse("Login required.", 401);

    if (
      session.role !== "admin" ||
      (session.status && session.status !== "active")
    ) {
      return errorResponse("Admin permission required.", 403);
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid request.", 400);
    }

    const input = body as Record<string, unknown>;
    const applicationId =
      typeof input.applicationId === "string"
        ? input.applicationId.trim()
        : "";
    const studentId =
      typeof input.studentId === "string"
        ? input.studentId.trim()
        : "";

    if (
      !applicationId ||
      !studentId ||
      applicationId.length > 100 ||
      studentId.length > 120
    ) {
      return errorResponse("Valid Admission and Student IDs are required.", 400);
    }

    const db = await getMongoDatabase();
    const users = db.collection("users");
    const applications = db.collection("admissionApplications");

    const [student, application] = await Promise.all([
      users.findOne({
        id: studentId,
        role: "student",
        deletedAt: { $exists: false },
      }),
      applications.findOne({ applicationId }),
    ]);

    if (!student) return errorResponse("Registered student not found.", 404);
    if (!application) return errorResponse("Admission application not found.", 404);

    if (
      student.status &&
      student.status !== "active"
    ) {
      return errorResponse("The student account must be active.", 409);
    }

    if (student.verified === false) {
      return errorResponse("The student account is not verified.", 409);
    }

    if (
      application.linkedStudentId &&
      application.linkedStudentId !== studentId
    ) {
      return errorResponse("This admission is already linked to a different student.", 409);
    }

    // Names must match AND at least one independent contact field must match.
    // Never identify students by name alone, or by a shared family phone alone.
    const nameMatches =
      Boolean(normalizeName(application.name)) &&
      normalizeName(application.name) === normalizeName(student.name);

    const emailMatches =
      Boolean(normalizeEmail(application.email)) &&
      normalizeEmail(application.email) === normalizeEmail(student.email);

    const mobileMatches =
      normalizeMobile(application.mobile).length === 10 &&
      normalizeMobile(application.mobile) === normalizeMobile(student.mobile);

    if (!nameMatches || (!emailMatches && !mobileMatches)) {
      return errorResponse(
        "Identity mismatch. Student name and email or mobile must match the admission application.",
        409,
      );
    }

    // Protect against two different applications linking to one student,
    // even if separate Admin requests arrive simultaneously.
    await applications.createIndex(
      { linkedStudentId: 1 },
      {
        name: "admissions_unique_linkedStudentId",
        unique: true,
        partialFilterExpression: {
          linkedStudentId: { $type: "string" },
        },
      },
    );

    if (application.linkedStudentId === studentId) {
      return NextResponse.json(
        { success: true, applicationId, studentId },
        { headers: HEADERS },
      );
    }

    const update = await applications.updateOne(
      {
        applicationId,
        $or: [
          { linkedStudentId: { $exists: false } },
          { linkedStudentId: null },
        ],
      },
      {
        $set: {
          linkedStudentId: studentId,
          linkedBy: session.id,
          linkedAt: new Date().toISOString(),
        },
      },
    );

    if (!update.matchedCount) {
      return errorResponse("Admission link changed. Refresh and retry.", 409);
    }

    return NextResponse.json(
      { success: true, applicationId, studentId },
      { headers: HEADERS },
    );
  } catch (cause) {
    if (
      cause &&
      typeof cause === "object" &&
      "code" in cause &&
      cause.code === 11000
    ) {
      return errorResponse("Another application is already linked to this student.", 409);
    }

    console.error("Admission linking error:", cause);
    return errorResponse("Unable to link admission application.", 500);
  }
}
