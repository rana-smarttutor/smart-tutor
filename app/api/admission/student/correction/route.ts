import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status, headers: HEADERS });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return fail("Login required.", 401);
    if (session.role !== "student" || (session.status && session.status !== "active")) {
      return fail("Active student login required.", 403);
    }

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 5_000) return fail("Request too large.", 413);

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail("Invalid JSON.");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return fail("Invalid request body.");
    }

    const input = body as Record<string, unknown>;
    const applicationId = typeof input.applicationId === "string" ? input.applicationId.trim() : "";
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";

    if (!/^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(applicationId)) return fail("Invalid application ID.");
    if (reason.length < 10 || reason.length > 1500) {
      return fail("Describe the correction required (10–1500 characters).");
    }

    const db = await getMongoDatabase();
    const timestamp = new Date().toISOString();
    const result = await db.collection("admissionApplications").updateOne(
      {
        applicationId,
        linkedStudentId: session.id,
        status: "pending_student_approval",
      },
      {
        $set: {
          status: "correction_requested",
          correctionRequest: {
            reason,
            requestedByStudentId: session.id,
            requestedAt: timestamp,
          },
          updatedAt: timestamp,
        },
      },
    );

    if (result.modifiedCount !== 1) {
      return fail("Application is not pending your approval. Refresh and contact admissions if necessary.", 409);
    }

    return NextResponse.json(
      { success: true, status: "correction_requested", requestedAt: timestamp },
      { headers: HEADERS },
    );
  } catch (error) {
    console.error("Admission correction request error:", error);
    return fail("Unable to request a correction.", 500);
  }
}
