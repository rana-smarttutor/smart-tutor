import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers });
}
const nameKey = (v: unknown) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").toLowerCase() : "";
const emailKey = (v: unknown) =>
  typeof v === "string" ? v.trim().toLowerCase() : "";
const mobileKey = (v: unknown) =>
  typeof v === "string" ? v.replace(/\D/g, "").slice(-10) : "";
const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return fail("Login required.", 401);
    if (
      session.role !== "admin" ||
      (session.status && session.status !== "active")
    ) {
      return fail("Admin permission required.", 403);
    }
    const url = new URL(request.url);
    if (url.searchParams.get("probe") === "1") {
      return NextResponse.json({ canLink: true }, { headers });
    }
    const applicationId = url.searchParams.get("applicationId")?.trim() ?? "";
    if (!/^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(applicationId))
      return fail("Valid application ID required.", 400);

    const db = await getMongoDatabase();
    const admissions = db.collection("admissionApplications");
    const application = await admissions.findOne(
      { applicationId },
      { projection: { name: 1, email: 1, mobile: 1, linkedStudentId: 1 } },
    );
    if (!application) return fail("Admission not found.", 404);
    if (application.linkedStudentId)
      return fail("Admission already linked.", 409);

    const email = emailKey(application.email);
    const mobile = mobileKey(application.mobile);
    const name = nameKey(application.name);
    if (!name || (!email && mobile.length !== 10))
      return fail("Incomplete admission identity fields.", 409);

    const filters: Record<string, unknown>[] = [];
    if (email) {
      filters.push(
        { emailKey: email },
        { email: { $regex: `^${escapeRegex(email)}$`, $options: "i" } },
      );
    }
    if (mobile.length === 10) {
      filters.push(
        { mobileKey: mobile },
        { mobile },
        { mobile: { $regex: `${escapeRegex(mobile)}$` } },
      );
    }
    const users = await db
      .collection("users")
      .find({
        role: "student",
        status: "active",
        verified: { $ne: false },
        deletedAt: { $exists: false },
        $or: filters,
      })
      .limit(100)
      .project({ _id: 0, id: 1, name: 1, email: 1, mobile: 1 })
      .toArray();

    const matches = users.filter((user) => {
      const sameName = nameKey(user.name) === name;
      const sameEmail = !!email && emailKey(user.email) === email;
      const sameMobile =
        mobile.length === 10 && mobileKey(user.mobile) === mobile;
      return (
        sameName && (sameEmail || sameMobile) && typeof user.id === "string"
      );
    });
    if (matches.length !== 1 || users.length === 100) {
      return fail(
        matches.length
          ? "Ambiguous student match. Verify account records before linking."
          : "No matching active student account. Verify student name, email/mobile and active status.",
        409,
      );
    }
    const candidate = matches[0];
    const existing = await admissions.findOne(
      { linkedStudentId: candidate.id },
      { projection: { _id: 1 } },
    );
    if (existing)
      return fail("This student is already linked to another admission.", 409);
    return NextResponse.json(
      {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
        },
      },
      { headers },
    );
  } catch (cause) {
    console.error("Admission link candidate lookup error:", cause);
    return fail("Unable to look up student account.", 500);
  }
}
