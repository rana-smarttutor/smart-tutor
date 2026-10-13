import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { extractRequestMeta } from "@/lib/audit-log";
import { getMongoClient, getMongoDatabase } from "@/lib/mongodb";
import { readJson, safeString } from "@/lib/staff-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const collections = {
  expenses: "staffOperationsExpenses",
  "daily-reports": "staffOperationsDailyReports",
} as const;

type ApprovalKind = keyof typeof collections;
type Decision = "approved" | "rejected";

function isApprovalKind(value: string): value is ApprovalKind {
  return Object.prototype.hasOwnProperty.call(collections, value);
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAdminContext() {
  const user = await getSessionUser();

  if (
    !user ||
    user.role !== "admin" ||
    user.status !== "active" ||
    user.deletedAt
  ) {
    return null;
  }

  const db = await getMongoDatabase();

  const stored = await db.collection("users").findOne({
    id: user.id,
    role: "admin",
    status: "active",
    deletedAt: { $exists: false },
  });

  if (!stored) {
    return null;
  }

  return { db, user };
}

// List records awaiting review.
// Restricted to active administrators.
export async function GET(request: Request) {
  try {
    const context = await getAdminContext();

    if (!context) {
      return errorResponse("Forbidden", 403);
    }

    const params = new URL(request.url).searchParams;
    const kind = params.get("kind") ?? "";

    if (!isApprovalKind(kind)) {
      return errorResponse("Invalid approval section", 400);
    }

    const status = params.get("status") ?? "submitted";

    if (
      !["submitted", "approved", "rejected"].includes(status)
    ) {
      return errorResponse("Invalid status filter", 400);
    }

    const items = await context.db
      .collection(collections[kind])
      .find(
        {
          status,
          deletedAt: { $exists: false },
        },
        {
          projection: { _id: 0 },
        },
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({
      items,
      kind,
      status,
    });
  } catch (error) {
    console.error("Admin staff approvals GET", error);

    return errorResponse(
      "Could not load staff submissions",
      500,
    );
  }
}

// Approve or reject one submitted record.
export async function PATCH(request: Request) {
  try {
    const context = await getAdminContext();

    if (!context) {
      return errorResponse("Forbidden", 403);
    }

    const body = await readJson(request);

    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const kind = safeString(body.kind, 30);
    const id = safeString(body.id, 80);
    const decision = safeString(body.decision, 20);
    const reason = safeString(body.reason, 1000);

    if (!isApprovalKind(kind) || !id) {
      return errorResponse("Invalid record", 400);
    }

    if (decision !== "approved" && decision !== "rejected") {
      return errorResponse("Invalid decision", 400);
    }

    if (decision === "rejected" && !reason) {
      return errorResponse(
        "A rejection reason is required",
        400,
      );
    }

    const db = context.db;
    const collection = db.collection(collections[kind]);

    const record = await collection.findOne({
      id,
      status: "submitted",
      deletedAt: { $exists: false },
    });

    if (!record) {
      return errorResponse(
        "Record not found or already reviewed",
        409,
      );
    }

    if (
      typeof record.branch !== "string" ||
      !record.branch.trim()
    ) {
      return errorResponse(
        "Record has no assigned branch; correct it before review",
        409,
      );
    }

    if (record.ownerId === context.user.id) {
      return errorResponse(
        "You cannot approve your own submission",
        403,
      );
    }

    const client = await getMongoClient();
    const session = client.startSession();

    const now = new Date().toISOString();
    const meta = extractRequestMeta(request);

    try {
      await session.withTransaction(
        async () => {
          const result = await collection.updateOne(
            {
              _id: record._id,
              status: "submitted",
              deletedAt: { $exists: false },
            },
            {
              $set: {
                status: decision as Decision,
                reviewedBy: context.user.id,
                reviewedByName: context.user.name,
                reviewedAt: now,
                reviewReason: reason,
                updatedAt: now,
              },
            },
            { session },
          );

          if (result.matchedCount !== 1) {
            throw new Error(
              "Record changed before approval was completed",
            );
          }

          await db.collection("actionLogs").insertOne(
            {
              id: `al-${randomUUID()}`,
              action: "update",
              category:
                kind === "expenses" ? "expenses" : "other",
              details: `Staff ${kind} submission ${decision}`,
              userId: context.user.id,
              userName: context.user.name,
              userEmail: context.user.email,
              userRole: "admin",
              ip: meta.ip,
              userAgent: meta.userAgent,
              browser: meta.browser,
              os: meta.os,
              device: meta.device,
              path: new URL(request.url).pathname,
              method: request.method,
              metadata: {
                recordId: id,
                kind,
                branch: record.branch,
                previousStatus: "submitted",
                newStatus: decision,
                reason,
                originalOwnerId: record.ownerId,
              },
              statusCode: 200,
              timestamp: now,
            },
            { session },
          );
        },
        {
          writeConcern: {
            w: "majority",
          },
        },
      );
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      success: true,
      id,
      kind,
      status: decision,
      reviewedAt: now,
    });
  } catch (error) {
    console.error("Admin staff approvals PATCH", error);

    return errorResponse(
      "Could not complete approval securely",
      500,
    );
  }
}