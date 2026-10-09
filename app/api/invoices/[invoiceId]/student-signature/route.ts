
import { GridFSBucket, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getFeeInvoiceById } from "@/lib/data-store";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return errorResponse("Login required.", 401);
    }

    if (session.status && session.status !== "active") {
      return errorResponse("Account is not active.", 403);
    }

    const { invoiceId } = await context.params;

    if (!invoiceId || invoiceId.length > 150) {
      return errorResponse("Invalid invoice ID.", 400);
    }

    // Find the original fee invoice.
    const invoice = await getFeeInvoiceById(invoiceId);

    if (!invoice) {
      return errorResponse("Invoice not found.", 404);
    }

    const db = await getMongoDatabase();

    // Only Admin, the relevant student, or their
    // verified linked parent may view this signature.
    let canView = session.role === "admin";

    if (
      session.role === "student" &&
      session.id === invoice.studentId
    ) {
      canView = true;
    }

    if (session.role === "parent") {
      const parent = await db.collection("users").findOne({
        id: session.id,
        role: "parent",
        linkedStudentId: invoice.studentId,
        deletedAt: { $exists: false },
      });

      canView = Boolean(parent);
    }

    if (!canView) {
      return errorResponse("Permission denied.", 403);
    }

    // Retrieve admission applications linked to
    // exactly this registered student.
    const applications = await db
      .collection("admissionApplications")
      .find({
        linkedStudentId: invoice.studentId,
        "documents.signatureImage.fileId": {
          $type: "string",
        },
      })
      .limit(2)
      .toArray();

    if (applications.length === 0) {
      return errorResponse(
        "Student signature is not available.",
        404,
      );
    }

    // Never guess which signature belongs to the student.
    if (applications.length > 1) {
      return errorResponse(
        "Multiple admission records are linked. Admin review required.",
        409,
      );
    }

    const signature = applications[0]?.documents
      ?.signatureImage as
      | {
          fileId?: string;
          mimeType?: string;
        }
      | undefined;

    const fileId = signature?.fileId ?? "";
    const mimeType = signature?.mimeType ?? "";

    if (!/^[0-9a-fA-F]{24}$/.test(fileId)) {
      return errorResponse(
        "Student signature file is unavailable.",
        404,
      );
    }

    if (
      mimeType !== "image/png" &&
      mimeType !== "image/jpeg"
    ) {
      return errorResponse(
        "Unsupported signature image.",
        415,
      );
    }

    // The admission form stores uploaded files
    // in the admissionDocuments GridFS bucket.
    const bucket = new GridFSBucket(db, {
      bucketName: "admissionDocuments",
    });

    const stream = bucket.openDownloadStream(
      new ObjectId(fileId),
    );

    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of stream) {
      const bytes = Buffer.from(chunk);

      totalBytes += bytes.length;

      if (totalBytes > 1024 * 1024) {
        stream.destroy();

        return errorResponse(
          "Signature image exceeds the size limit.",
          413,
        );
      }

      chunks.push(bytes);
    }

    if (!totalBytes) {
      return errorResponse(
        "Student signature file is empty.",
        404,
      );
    }

    const image = new Uint8Array(
      Buffer.concat(chunks),
    );

    return new NextResponse(image, {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        "Content-Type": mimeType,
        "Content-Length": String(image.byteLength),
        "Content-Disposition":
          'inline; filename="student-signature"',
      },
    });
  } catch (error) {
    console.error(
      "Student receipt signature retrieval error:",
      error,
    );

    return errorResponse(
      "Unable to retrieve student signature.",
      500,
    );
  }
}
