import { NextResponse } from "next/server";
import { GridFSBucket, ObjectId } from "mongodb";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const H = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: H });
const str = (v: unknown) =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v);
const formatDate = (v: unknown) => {
  const d = new Date(str(v));
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
};

async function readImage(
  bucket: GridFSBucket,
  value: unknown,
): Promise<Uint8Array | null> {
  if (!value || typeof value !== "object") return null;
  const doc = value as { fileId?: unknown; mimeType?: unknown };
  if (typeof doc.fileId !== "string" || !ObjectId.isValid(doc.fileId))
    return null;
  if (doc.mimeType !== "image/png" && doc.mimeType !== "image/jpeg")
    return null;
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const part of bucket.openDownloadStream(
      new ObjectId(doc.fileId),
    )) {
      const buffer = Buffer.from(part);
      size += buffer.length;
      if (size > 1024 * 1024) throw new Error("Image exceeds expected size");
      chunks.push(buffer);
    }
    return new Uint8Array(Buffer.concat(chunks));
  } catch (err) {
    console.error("Admission PDF document read error", err);
    return null;
  }
}

function sanitize(v: unknown, max = 300) {
  // Standard PDF fonts cannot encode many Unicode symbols; transliterate basic punctuation.
  return (str(v) || "—")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "?")
    .slice(0, max);
}

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    if (
      !session ||
      (session.status && session.status !== "active") ||
      session.verified === false
    ) {
      return fail("Active login required.", 403);
    }
    const db = await getMongoDatabase();
    const staff = ["admin", "staff", "counsellor"].includes(session.role);
    let app: Record<string, any>;
    if (staff) {
      const applicationId =
        new URL(request.url).searchParams.get("applicationId")?.trim() ?? "";
      if (!/^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(applicationId))
        return fail("Valid application ID required.", 400);
      const found = await db
        .collection("admissionApplications")
        .findOne({ applicationId }, { projection: { _id: 0 } });
      if (!found) return fail("Admission not found.", 404);
      app = found;
    } else if (session.role === "student" || session.role === "parent") {
      let studentId = session.id;
      if (session.role === "parent") {
        const parent = await db.collection("users").findOne({
          id: session.id,
          role: "parent",
          status: "active",
          verified: true,
          deletedAt: { $exists: false },
        });
        if (
          !parent ||
          typeof parent.linkedStudentId !== "string" ||
          !parent.linkedStudentId.trim()
        )
          return fail("No verified linked student.", 403);
        studentId = parent.linkedStudentId;
      }
      const student = await db.collection("users").findOne(
        {
          id: studentId,
          role: "student",
          status: "active",
          deletedAt: { $exists: false },
        },
        { projection: { _id: 1 } },
      );
      if (!student) return fail("Student account unavailable.", 403);
      const apps = await db
        .collection("admissionApplications")
        .find({ linkedStudentId: studentId }, { projection: { _id: 0 } })
        .limit(2)
        .toArray();
      if (apps.length !== 1)
        return fail("A uniquely linked admission was not found.", 404);
      app = apps[0];
    } else {
      return fail("Not authorized to view admission PDFs.", 403);
    }
    if (
      app.status !== "approved" ||
      !app.approvedAt ||
      !app.studentConsent?.acceptPrivacy ||
      !app.studentConsent?.acceptTerms
    ) {
      return fail(
        "Admission must have final approval before PDF download.",
        403,
      );
    }
    const birth = new Date(`${str(app.dateOfBirth)}T00:00:00Z`);
    if (!Number.isNaN(birth.getTime())) {
      let age =
        new Date(str(app.approvedAt)).getUTCFullYear() - birth.getUTCFullYear();
      const at = new Date(str(app.approvedAt));
      if (
        at.getUTCMonth() < birth.getUTCMonth() ||
        (at.getUTCMonth() === birth.getUTCMonth() &&
          at.getUTCDate() < birth.getUTCDate())
      )
        age--;
      if (
        age < 18 &&
        (!app.guardianConsent?.approvedByParentId ||
          !app.guardianConsent?.approvedAt)
      )
        return fail("Guardian approval is required.", 403);
    }
    const bucket = new GridFSBucket(db, { bucketName: "admissionDocuments" });
    const [photoData, signData] = await Promise.all([
      readImage(bucket, app.documents?.photo),
      readImage(bucket, app.documents?.signatureImage),
    ]);
    if (!photoData || !signData)
      return fail(
        "Approved photo or signature is missing from document storage.",
        409,
      );

    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const navy = rgb(0.035, 0.11, 0.3);
    const blue = rgb(0.05, 0.31, 0.7);
    const pale = rgb(0.92, 0.95, 0.99);
    const muted = rgb(0.35, 0.4, 0.48);
    const width = 595.28;
    const height = 841.89;
    let page!: PDFPage;
    let y!: number;
    let pageNum = 0;
    const header = () => {
      pageNum++;
      page = pdf.addPage([width, height]);
      page.drawRectangle({
        x: 0,
        y: height - 93,
        width,
        height: 93,
        color: navy,
      });
      page.drawText("SmartIQ Institute", {
        x: 39,
        y: height - 44,
        size: 21,
        font: bold,
        color: rgb(1, 1, 1),
      });
      page.drawText("OFFICIAL ADMISSION APPLICATION", {
        x: 40,
        y: height - 66,
        size: 10,
        font: regular,
        color: rgb(0.76, 0.86, 1),
      });
      page.drawText(`Application ID: ${sanitize(app.applicationId, 70)}`, {
        x: 40,
        y: height - 110,
        size: 9,
        font: bold,
        color: navy,
      });
      page.drawText(`Session: ${sanitize(app.session, 35)}`, {
        x: 40,
        y: height - 124,
        size: 9,
        font: regular,
        color: muted,
      });
      page.drawText(`Page ${pageNum}`, {
        x: 510,
        y: 25,
        size: 9,
        font: regular,
        color: muted,
      });
      y = height - 151;
    };
    header();
    function ensure(h = 30) {
      if (y - h < 60) header();
    }
    function section(title: string) {
      ensure(52);
      page.drawRectangle({
        x: 38,
        y: y - 24,
        width: width - 76,
        height: 28,
        color: pale,
      });
      page.drawText(title, {
        x: 46,
        y: y - 15,
        size: 11,
        font: bold,
        color: blue,
      });
      y -= 38;
    }
    function wrap(
      value: unknown,
      maxWidth: number,
      font: PDFFont,
      fontSize: number,
    ) {
      const text = sanitize(value, 1000);
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(next, fontSize) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else current = next;
      }
      if (current) lines.push(current);
      return lines.slice(0, 12);
    }
    function item(label: string, value: unknown) {
      const lines = wrap(value, 312, regular, 9);
      ensure(Math.max(24, lines.length * 13 + 7));
      page.drawText(sanitize(label, 45), {
        x: 44,
        y,
        size: 9,
        font: bold,
        color: muted,
      });
      lines.forEach((line, i) =>
        page.drawText(line, {
          x: 235,
          y: y - i * 13,
          size: 9,
          font: regular,
          color: navy,
        }),
      );
      y -= Math.max(23, lines.length * 13 + 8);
    }
    const photoMime = app.documents.photo.mimeType;
    const sigMime = app.documents.signatureImage.mimeType;
    const photo =
      photoMime === "image/png"
        ? await pdf.embedPng(photoData)
        : await pdf.embedJpg(photoData);
    const signature =
      sigMime === "image/png"
        ? await pdf.embedPng(signData)
        : await pdf.embedJpg(signData);
    // Photo placement on the first page, before academic details.
    page.drawRectangle({
      x: 449,
      y: y - 122,
      width: 106,
      height: 126,
      borderColor: muted,
      borderWidth: 0.7,
      color: rgb(1, 1, 1),
    });
    const fitted = photo.scale(Math.min(98 / photo.width, 118 / photo.height));
    page.drawImage(photo, {
      x: 453 + (98 - fitted.width) / 2,
      y: y - 118 + (118 - fitted.height) / 2,
      width: fitted.width,
      height: fitted.height,
    });
    section("Student Information");
    item("Full name", app.name);
    item("Date of birth", app.dateOfBirth);
    item("Gender / Category", `${str(app.gender)} / ${str(app.category)}`);
    item("Email", app.email);
    item("Mobile", app.mobile);
    y = Math.min(y, height - 292); // Keep clear of the photograph.
    section("Programme & Enrollment");
    for (const [label, key] of [
      ["Course", "course"],
      ["Class / Exam", "exam"],
      ["Programme", "programme"],
      ["Study mode", "studyMode"],
      ["Medium", "medium"],
      ["Batch time", "batchTime"],
      ["Qualification", "qualification"],
    ])
      item(label, app[key]);
    section("Address");
    item(
      "Address",
      [app.flat, app.street, app.city, app.state, app.pin]
        .filter(Boolean)
        .join(", "),
    );
    section("Academic History");
    if (Array.isArray(app.academics) && app.academics.length) {
      app.academics.forEach((a: Record<string, unknown>, i: number) => {
        item(
          `Record ${i + 1}`,
          `${str(a.level)} | ${str(a.institution)} | ${str(a.board)} | ${str(a.year)} | ${str(a.marks)}`,
        );
      });
    } else item("Academic records", "Not provided");
    if (
      Array.isArray(app.achievements) &&
      app.achievements.some((a: Record<string, unknown>) =>
        Object.values(a).some(Boolean),
      )
    ) {
      section("Achievements");
      app.achievements.forEach((a: Record<string, unknown>, i: number) =>
        item(
          `Achievement ${i + 1}`,
          [a.year, a.exam, a.level, a.score].filter(Boolean).join(" | "),
        ),
      );
    }
    section("Parents & Emergency Contact");
    for (const [label, key] of [
      ["Father", "fatherName"],
      ["Father's phone", "fatherMobile"],
      ["Father's email", "fatherEmail"],
      ["Mother", "motherName"],
      ["Mother's phone", "motherMobile"],
      ["Mother's email", "motherEmail"],
      ["Primary contact", "contactPreference"],
      ["Emergency contact", "emergencyName"],
      ["Relationship", "emergencyRelation"],
      ["Emergency phone", "emergencyMobile"],
    ])
      item(label, app[key]);
    section("Consent & Approval");
    item("Status", "APPROVED");
    item("Approved on", formatDate(app.approvedAt));
    item("Student consent", formatDate(app.studentConsent?.approvedAt));
    if (app.guardianConsent?.approvedAt)
      item("Guardian consent", formatDate(app.guardianConsent.approvedAt));
    ensure(125);
    const sf = signature.scale(
      Math.min(190 / signature.width, 62 / signature.height),
    );
    page.drawRectangle({
      x: 43,
      y: y - 80,
      width: 215,
      height: 86,
      borderColor: pale,
      borderWidth: 0.8,
    });
    page.drawImage(signature, {
      x: 48,
      y: y - 66,
      width: sf.width,
      height: sf.height,
    });
    page.drawText("Student handwritten signature", {
      x: 44,
      y: y - 96,
      size: 9,
      font: regular,
      color: muted,
    });
    pdf.setTitle(`SmartIQ Admission Form - ${sanitize(app.applicationId)}`);
    pdf.setAuthor("SmartIQ Institute");
    pdf.setSubject("Approved admission application");
    const pdfBytes = await pdf.save();
    return new Response(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        ...H,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${sanitize(app.applicationId, 80)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Approved admission PDF error:", err);
    return fail("Unable to generate the admission PDF.", 500);
  }
}
