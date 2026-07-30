import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { logAction } from "@/lib/audit-log";
import { getSessionUser } from "@/lib/auth";
import { sanitizeTextInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LibrarySection = {
  id: string;
  label: string;
  description: string;
};

const SECTIONS_PATH = "digital-library/sections/sections.json";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

async function readCustomSections(token: string): Promise<LibrarySection[]> {
  const { blobs } = await list({
    prefix: SECTIONS_PATH,
    token,
  });

  const sectionBlob = blobs.find((blob) => blob.pathname === SECTIONS_PATH);

  if (!sectionBlob) {
    return [];
  }

  const response = await fetch(sectionBlob.url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { sections?: LibrarySection[] };

  return Array.isArray(data.sections) ? data.sections : [];
}

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "BLOB_READ_WRITE_TOKEN is missing.",
          sections: [],
        },
        { status: 500 },
      );
    }

    const sections = await readCustomSections(token);

    return NextResponse.json({
      success: true,
      sections,
    });
  } catch (error) {
    console.error("Digital library sections load error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load library sections.",
        sections: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    const role = String(session?.role || "student").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins and educators can create library sections.",
        },
        { status: 403 },
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "BLOB_READ_WRITE_TOKEN is missing.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      label?: string;
      description?: string;
    };

    const label = sanitizeTextInput(body.label, 80);
    const description =
      sanitizeTextInput(body.description, 180) ||
      "Custom digital library section.";

    if (!label) {
      return NextResponse.json(
        {
          success: false,
          message: "Section name is required.",
        },
        { status: 400 },
      );
    }

    const id = slugify(label);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid section name.",
        },
        { status: 400 },
      );
    }

    const existingSections = await readCustomSections(token);

    const alreadyExists = existingSections.some(
      (section) => section.id === id || section.label.toLowerCase() === label.toLowerCase(),
    );

    if (alreadyExists) {
      return NextResponse.json(
        {
          success: false,
          message: "This section already exists.",
        },
        { status: 409 },
      );
    }

    const sections = [
      ...existingSections,
      {
        id,
        label,
        description,
      },
    ];

    await put(
      SECTIONS_PATH,
      JSON.stringify(
        {
          sections,
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      {
        access: "public",
        token,
        contentType: "application/json",
        allowOverwrite: true,
      },
    );

    await logAction({
      action: "create",
      category: "library",
      details: `Library section created: ${label}`,
      path: "/api/digital-library/sections",
      method: "POST",
      request,
      session,
      metadata: { sectionId: id, label },
    });

    return NextResponse.json({
      success: true,
      sections,
      section: {
        id,
        label,
        description,
      },
    });
  } catch (error) {
    console.error("Digital library section create error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create library section.",
      },
      { status: 500 },
    );
  }
}