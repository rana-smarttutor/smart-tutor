import { randomUUID } from "node:crypto";
import { GridFSBucket, type ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getMongoDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
const FILE_KEYS = ["photo", "signatureImage", "photoId", "marksheet"] as const;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

type Submission = Record<string, unknown>;

function str(record: Submission, key: string, maxLength = 250): string {
  const value = record[key];
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validPhone(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value);
}

function invalid(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: NO_STORE_HEADERS,
    },
  );
}

function getPreviousSchoolClass(selected: string): string {
  const match = /^Class (\d+)$/.exec(selected);
  if (!match) return "";

  const n = Number(match[1]);
  return n >= 2 && n <= 12 ? `Class ${n - 1}` : "";
}

function qualificationLevels(qualification: string): string[] {
  switch (qualification) {
    case "Class 10":
      return ["Class 10"];

    case "Class 12":
      return ["Class 10", "Class 12"];

    case "Undergraduate":
    case "Graduate":
      return ["Class 10", "Class 12", "Graduation"];

    case "Postgraduate":
      return [
        "Class 10",
        "Class 12",
        "Graduation",
        "Postgraduation",
      ];

    case "Other":
      return ["Other qualification"];

    default:
      return [];
  }
}

export async function POST(request: Request) {
  const uploadedIds: ObjectId[] = [];
  let db: Awaited<ReturnType<typeof getMongoDatabase>> | null = null;

  try {
    // Only internal staff can submit an application.
    const session = await getSessionUser();

    if (!session) {
      return invalid("Staff login is required.", 401);
    }

    if (
      !["admin", "counsellor", "staff"].includes(session.role) ||
      (session.status && session.status !== "active")
    ) {
      return invalid("Permission denied.", 403);
    }

    const headerSize = Number(request.headers.get("content-length") || 0);

    if (headerSize > MAX_REQUEST_BYTES) {
      return invalid("Total upload size exceeds the allowed limit.", 413);
    }

    const form = await request.formData();
    const raw = form.get("application");

    if (typeof raw !== "string") {
      return invalid("Missing admission application.");
    }

    if (Buffer.byteLength(raw, "utf8") > 500_000) {
      return invalid("Application data is too large.", 413);
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return invalid("Invalid application format.");
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return invalid("Invalid application data.");
    }

    const app = parsed as Submission;

    const required = [
      "course",
      "exam",
      "programme",
      "session",
      "studyMode",
      "medium",
      "batchTime",
      "name",
      "gender",
      "category",
      "mobile",
      "email",
      "flat",
      "street",
      "city",
      "state",
      "pin",
      "qualification",
      "currentStatus",
      "emergencyName",
      "emergencyRelation",
      "emergencyMobile",
      "signature",
    ];

    if (required.some((key) => !str(app, key))) {
      return invalid("Complete all required admission details.");
    }

    if (
      ![
        "Regular batch",
        "Weekend batch",
        "Crash course",
        "Test series only",
      ].includes(str(app, "programme"))
    ) {
      return invalid("Choose a valid programme.");
    }

    if (
      !validPhone(str(app, "mobile")) ||
      !validPhone(str(app, "emergencyMobile"))
    ) {
      return invalid("Enter valid 10-digit contact numbers.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(app, "email"))) {
      return invalid("Enter a valid email address.");
    }

    if (!/^\d{6}$/.test(str(app, "pin"))) {
      return invalid("Enter a valid 6-digit PIN code.");
    }

    const day = str(app, "day", 2);
    const month = str(app, "month", 2);
    const year = str(app, "year", 4);

    const birthDate =
      `${year}-` +
      `${month.padStart(2, "0")}-` +
      `${day.padStart(2, "0")}`;

    const parsedBirth = new Date(`${birthDate}T00:00:00Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
      Number.isNaN(parsedBirth.getTime()) ||
      parsedBirth.toISOString().slice(0, 10) !== birthDate ||
      parsedBirth > new Date()
    ) {
      return invalid("Enter a valid date of birth.");
    }

    const age = Math.floor(
      (Date.now() - parsedBirth.getTime()) / (365.25 * 86400000),
    );

    const fatherName = str(app, "fatherName");
    const motherName = str(app, "motherName");

    if (
      (!fatherName && !motherName) ||
      (age < 18 && (!fatherName || !motherName))
    ) {
      return invalid("Complete the required parent or guardian information.");
    }

    if (fatherName && !validPhone(str(app, "fatherMobile"))) {
      return invalid("Enter a valid father's mobile number.");
    }

    if (motherName && !validPhone(str(app, "motherMobile"))) {
      return invalid("Enter a valid mother's mobile number.");
    }

    if (
      age < 18 &&
      str(app, "contactPreference") === "Student (18 or above)"
    ) {
      return invalid(
        "Applicants under 18 must select a parent as primary contact.",
      );
    }

    if (app.declarationCorrect !== true || app.declarationTerms !== true) {
      return invalid("Accept both mandatory declarations.");
    }

    if (
      str(app, "signature").toLowerCase() !==
      str(app, "name").toLowerCase()
    ) {
      return invalid(
        "The typed signature must match the student's full name.",
      );
    }

    // School admission: require the immediately previous class.
    if (str(app, "course") === "Schooling") {
      const selectedClass = str(app, "exam");
      const previousClass = getPreviousSchoolClass(selectedClass);

      const allowedClasses = [
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
        "Class 11",
        "Class 12",
      ];

      if (!previousClass || !allowedClasses.includes(selectedClass)) {
        return invalid("Choose a valid Schooling class.");
      }

      if (
        str(app, "qualification") !== selectedClass ||
        str(app, "currentStatus") !== "Studying"
      ) {
        return invalid(
          "The admission class and qualification details do not match.",
        );
      }

      const academics = app.academics;

      if (!Array.isArray(academics) || academics.length !== 1) {
        return invalid(
          "Schooling applications must have exactly one previous-class academic record.",
        );
      }

      const first = academics[0];

      const record: Submission =
        first && typeof first === "object" && !Array.isArray(first)
          ? (first as Submission)
          : {};

      if (
        str(record, "level") !== previousClass ||
        !str(record, "institution") ||
        !str(record, "board") ||
        !str(record, "year")
      ) {
        return invalid(
          `Enter school, board and academic year for the previous class (${previousClass}).`,
        );
      }
    }

    // Government/competitive admission: qualification-based records.
    if (str(app, "course") !== "Schooling") {
      const qualification = str(app, "qualification");
      const levels = qualificationLevels(qualification);
      const academics = app.academics;

      if (levels.length === 0) {
        return invalid("Select a valid highest qualification.");
      }

      if (
        qualification === "Other" &&
        !str(app, "otherQualification")
      ) {
        return invalid("Specify your highest qualification.");
      }

      if (
        !Array.isArray(academics) ||
        academics.length < levels.length ||
        academics.length > 8
      ) {
        return invalid(
          "Provide the academic records for your selected qualification.",
        );
      }

      for (let i = 0; i < academics.length; i++) {
        const item = academics[i];

        const record: Submission =
          item && typeof item === "object" && !Array.isArray(item)
            ? (item as Submission)
            : {};

        const isRequired = i < levels.length;

        if (isRequired && str(record, "level") !== levels[i]) {
          return invalid(
            `Academic record ${i + 1} must be ${levels[i]}.`,
          );
        }

        const hasValues = [
          "level",
          "institution",
          "board",
          "year",
          "marks",
        ].some((key) => Boolean(str(record, key)));

        if (
          (isRequired || hasValues) &&
          (!str(record, "level") ||
            !str(record, "institution") ||
            !str(record, "board") ||
            !str(record, "year"))
        ) {
          return invalid(
            `Complete the qualification, institution, board/university and academic year for academic record ${i + 1}.`,
          );
        }
      }
    }

    const photo = form.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      return invalid("A student photograph is required.");
    }

    const signatureImage = form.get("signatureImage");
    if (
      !(signatureImage instanceof File) ||
      signatureImage.size === 0
    ) {
      return invalid("A student signature image is required.");
    }

    const incoming: { key: string; file: File }[] = [];
    let uploadSize = 0;

    for (const key of FILE_KEYS) {
      const file = form.get(key);

      if (file === null) continue;

      if (!(file instanceof File)) {
        return invalid("Invalid document upload.");
      }

      if (file.size === 0) continue;

      if (
        file.size > MAX_FILE_BYTES ||
        !ALLOWED_TYPES.has(file.type)
      ) {
        return invalid(
          "Files must be JPG, PNG or PDF and no larger than 1 MB each.",
        );
      }

      if (
        (key === "photo" || key === "signatureImage") &&
        file.type === "application/pdf"
      ) {
        return invalid("Student photo and signature must be JPG or PNG.");
      }

      uploadSize += file.size;
      incoming.push({ key, file });
    }

    if (
      uploadSize > 4 * MAX_FILE_BYTES ||
      uploadSize + Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES
    ) {
      return invalid("Uploaded documents exceed the allowed size.", 413);
    }

    db = await getMongoDatabase();

    const bucket = new GridFSBucket(db, {
      bucketName: "admissionDocuments",
    });

    const applicationId =
      `SIQ-ADM-${new Date().getUTCFullYear()}-` +
      randomUUID().slice(0, 8).toUpperCase();

    const documents: Record<
      string,
      {
        fileId: string;
        originalName: string;
        mimeType: string;
        size: number;
      }
    > = {};

    for (const { key, file } of incoming) {
      const upload = bucket.openUploadStream(
        `${applicationId}-${key}`,
        {
          metadata: {
            applicationId,
            category: key,
            mimeType: file.type,
          },
        },
      );

      const bytes = Buffer.from(await file.arrayBuffer());

      await new Promise<void>((resolve, reject) => {
        upload.once("finish", () => resolve());
        upload.once("error", reject);
        upload.end(bytes);
      });

      uploadedIds.push(upload.id);

      documents[key] = {
        fileId: upload.id.toHexString(),
        originalName: file.name.slice(0, 100),
        mimeType: file.type,
        size: file.size,
      };
    }

    const permitted = [
      "course",
      "exam",
      "programme",
      "session",
      "studyMode",
      "medium",
      "batchTime",
      "heardFrom",
      "name",
      "day",
      "month",
      "year",
      "gender",
      "category",
      "mobile",
      "email",
      "flat",
      "street",
      "city",
      "state",
      "pin",
      "qualification",
      "otherQualification",
      "currentStatus",
      "fatherName",
      "fatherOccupation",
      "fatherMobile",
      "fatherEmail",
      "motherName",
      "motherOccupation",
      "motherMobile",
      "motherEmail",
      "contactPreference",
      "emergencyName",
      "emergencyRelation",
      "emergencyMobile",
      "signature",
    ];

    const clean: Record<string, string | boolean | unknown[]> = {};

    for (const key of permitted) {
      clean[key] = str(
        app,
        key,
        key === "flat" || key === "street" ? 500 : 250,
      );
    }

    for (const key of [
      "pwd",
      "whatsappSame",
      "declarationCorrect",
      "declarationTerms",
      "declarationContact",
    ]) {
      clean[key] = app[key] === true;
    }

    const normalizeRows = (rows: unknown, keys: string[]) =>
      Array.isArray(rows)
        ? rows.slice(0, 8).map((row) => {
            const record: Submission =
              row && typeof row === "object" && !Array.isArray(row)
                ? (row as Submission)
                : {};

            return Object.fromEntries(
              keys.map((key) => [key, str(record, key)]),
            );
          })
        : [];

    clean.academics = normalizeRows(app.academics, [
      "level",
      "institution",
      "board",
      "year",
      "marks",
    ]).filter((row) =>
      Object.values(row).some((value) => Boolean(value)),
    );

    clean.achievements = normalizeRows(app.achievements, [
      "year",
      "exam",
      "level",
      "score",
    ]);

    await db.collection("admissionApplications").insertOne({
      applicationId,
      ...clean,

      // Audit information comes from the verified session.
      createdByUserId: session.id,
      createdByName: session.name ?? "",
      createdByRole: session.role,

      dateOfBirth: birthDate,
      documents,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    });

    return NextResponse.json(
      {
        applicationId,
        status: "submitted",
      },
      {
        status: 201,
        headers: NO_STORE_HEADERS,
      },
    );
  } catch (error) {
    console.error("Admission application submission error:", error);

    if (db && uploadedIds.length) {
      const bucket = new GridFSBucket(db, {
        bucketName: "admissionDocuments",
      });

      await Promise.allSettled(
        uploadedIds.map((id) => bucket.delete(id)),
      );
    }

    return invalid(
      "Unable to submit your admission application. Please try again.",
      500,
    );
  }
}
export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return invalid("Staff login is required.", 401);
    }

    if (
      !["admin", "counsellor", "staff"].includes(session.role) ||
      (session.status && session.status !== "active")
    ) {
      return invalid("Permission denied.", 403);
    }

    const db = await getMongoDatabase();
    const collection = db.collection("admissionApplications");

    const [
      applications,
      total,
      submitted,
      inReview,
      completed,
    ] = await Promise.all([
      collection
        .find(
          {},
          {
            projection: {
              _id: 0,
              applicationId: 1,
              name: 1,
              course: 1,
              exam: 1,
              programme: 1,
              mobile: 1,
              email: 1,
              city: 1,
              qualification: 1,
              academics: 1,
              status: 1,
              submittedAt: 1,
              createdByName: 1,
              createdByRole: 1,
            },
          },
        )
        .sort({ submittedAt: -1 })
        .limit(200)
        .toArray(),

      collection.countDocuments({}),

      collection.countDocuments({
        status: "submitted",
      }),

      collection.countDocuments({
        status: {
          $in: ["in-review", "under-review", "in_progress"],
        },
      }),

      collection.countDocuments({
        status: {
          $in: ["completed", "approved", "admitted"],
        },
      }),
    ]);

    return NextResponse.json(
      {
        applications,
        stats: {
          total,
          submitted,
          inReview,
          completed,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Load admission applications error:", error);

    return invalid("Unable to load admission applications.", 500);
  }
}