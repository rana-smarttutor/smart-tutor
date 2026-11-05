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
    throw new Error("Unable to load library section metadata.");
  }

  const data = (await response.json()) as {
    sections?: LibrarySection[];
  };

  return Array.isArray(data.sections) ? data.sections : [];
}

function fail(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

// =====================================================
// GET - READ LIBRARY SECTIONS
// =====================================================

// Browsing library sections is allowed.
//
// The Digital Library download lockdown is
// enforced separately by the download API.
//
// Do not use the download lockdown to prevent
// users from browsing course sections.

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Library section storage is not configured.",
          sections: [],
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const sections = await readCustomSections(token);

    return NextResponse.json(
      {
        success: true,
        sections,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Digital Library sections load error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load library sections.",
        sections: [],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

// =====================================================
// POST - CREATE LIBRARY SECTION
// =====================================================

// Only admins and educators can create sections.
// Existing Vercel section metadata is preserved
// during the R2 migration.

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    const role = String(session?.role || "").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return fail(
        "Only admins and educators can create library sections.",
        403,
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return fail("Library section storage is not configured.", 503);
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
      return fail("Section name is required.", 400);
    }

    const id = slugify(label);

    if (!id) {
      return fail("Invalid section name.", 400);
    }

    const existingSections = await readCustomSections(token);

    const alreadyExists = existingSections.some(
      (section) =>
        section.id === id ||
        section.label.toLowerCase() === label.toLowerCase(),
    );

    if (alreadyExists) {
      return fail("This section already exists.", 409);
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
      metadata: {
        sectionId: id,
        label,
      },
    });

    return NextResponse.json(
      {
        success: true,
        sections,
        section: {
          id,
          label,
          description,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Digital Library section create error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to create library section.", 500);
  }
}
