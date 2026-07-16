import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";

import type { Certificate } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const COLLECTION = "certificates";

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const db = await getMongoDatabase();
    const collection = db.collection<Certificate>(COLLECTION);

    const certificate = await collection.findOne({ id });

    if (!certificate) {
      return NextResponse.json(
        {
          error: "Certificate not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      certificate,
    });
  } catch (error) {
    console.error(
      "Get certificate error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch certificate.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Only administrators can update certificates.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;

    const db = await getMongoDatabase();
    const collection = db.collection<Certificate>(COLLECTION);

    const existing = await collection.findOne({ id });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Certificate not found.",
        },
        {
          status: 404,
        },
      );
    }

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const updates: Record<string, unknown> = {};

    if (
      body.status !== undefined
    ) {
      if (
        body.status !== "issued" &&
        body.status !== "revoked"
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid certificate status.",
          },
          {
            status: 400,
          },
        );
      }

      updates.status = body.status;

      if (
        body.status === "revoked"
      ) {
        updates.revokedAt =
          new Date().toISOString();
        updates.revokedBy = session.id;
        updates.revokeReason =
          typeof body.revokeReason === "string"
            ? body.revokeReason.trim()
            : "";
      }
    }

    if (
      body.revokeReason !== undefined
    ) {
      updates.revokeReason =
        typeof body.revokeReason === "string"
          ? body.revokeReason.trim()
          : "";
    }

    if (
      Object.keys(updates).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No update fields were provided.",
        },
        {
          status: 400,
        },
      );
    }

    updates.updatedAt =
      new Date().toISOString();

    await collection.updateOne(
      { id },
      { $set: updates },
    );

    const updated = await collection.findOne({
      id,
    });

    return NextResponse.json({
      certificate: updated,
    });
  } catch (error) {
    console.error(
      "Update certificate error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update certificate.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Only administrators can delete certificates.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;

    const db = await getMongoDatabase();
    const collection = db.collection<Certificate>(COLLECTION);

    const existing = await collection.findOne({ id });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Certificate not found.",
        },
        {
          status: 404,
        },
      );
    }

    const result = await collection.deleteOne({
      id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          error:
            "Certificate could not be deleted.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Delete certificate error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete certificate.",
      },
      {
        status: 500,
      },
    );
  }
}
