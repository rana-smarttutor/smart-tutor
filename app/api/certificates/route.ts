import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import type { Certificate } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getText(value: unknown, maxLength = 300) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function generateCertificateNo() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `ST-${year}-${seq}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipientId")?.trim();
    const status = searchParams.get("status")?.trim();

    const db = await getMongoDatabase();
    const filter: Record<string, unknown> = {};

    if (session.role === "student") {
      filter.recipientId = session.id;
    } else if (recipientId) {
      filter.recipientId = recipientId;
    }

    if (status === "issued" || status === "revoked") {
      filter.status = status;
    }

    const certificates = await db
      .collection<Certificate>("certificates")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = certificates.map((cert) => ({
      ...cert,
      id: cert.id ?? String((cert as unknown as { _id: { toString(): string } })._id),
    }));

    return NextResponse.json({ certificates: serialized });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch certificates.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create certificates." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const templateId = getText(body.templateId, 60);
    const recipientId = getText(body.recipientId, 120);
    const recipientName = getText(body.recipientName, 150);
    const recipientType = getText(body.recipientType, 30);
    const title = getText(body.title, 200);
    const description = getText(body.description, 1000);
    const courseName = getText(body.courseName, 200);
    const issuedDate = getText(body.issuedDate, 20);
    const issuedBy = getText(body.issuedBy, 120);
    const issuedByName = getText(body.issuedByName, 150);
    const recipientEmail = getText(body.recipientEmail, 200);

    if (
      !templateId ||
      !recipientId ||
      !recipientName ||
      !recipientType ||
      !title ||
      !description ||
      !issuedDate ||
      !issuedBy ||
      !issuedByName
    ) {
      return NextResponse.json(
        {
          error:
            "templateId, recipientId, recipientName, recipientType, title, description, issuedDate, issuedBy, and issuedByName are required.",
        },
        { status: 400 },
      );
    }

    const validTemplateIds = new Set([
      "classic-gold",
      "modern-blue",
      "professional-dark",
    ]);

    if (!validTemplateIds.has(templateId)) {
      return NextResponse.json(
        { error: "Invalid templateId." },
        { status: 400 },
      );
    }

    const validRecipientTypes = new Set(["student", "educator", "parent"]);

    if (!validRecipientTypes.has(recipientType)) {
      return NextResponse.json(
        { error: "Invalid recipientType." },
        { status: 400 },
      );
    }

    const db = await getMongoDatabase();
    const now = new Date().toISOString();

    const certificate: Certificate = {
      id: randomUUID(),
      templateId: templateId as Certificate["templateId"],
      recipientId,
      recipientName,
      recipientType: recipientType as Certificate["recipientType"],
      recipientEmail: recipientEmail || undefined,
      title,
      description,
      courseName: courseName || undefined,
      issuedDate,
      issuedBy,
      issuedByName,
      certificateNo: generateCertificateNo(),
      status: "issued",
      createdAt: now,
    };

    await db.collection("certificates").insertOne(certificate);

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create certificate.",
      },
      { status: 500 },
    );
  }
}
