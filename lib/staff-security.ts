
import { randomUUID } from "node:crypto";
import type { ClientSession, Db, Document } from "mongodb";

import { getSessionUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";
import { extractRequestMeta } from "@/lib/audit-log";
import type { SessionUser } from "@/lib/types";

export type StaffContext = {
  user: SessionUser;
  branch: string;
};

export async function getStaffContext(
  db: Db,
): Promise<StaffContext | null> {
  const user = await getSessionUser();

  if (
    !user ||
    !["staff", "counsellor"].includes(user.role) ||
    user.status !== "active" ||
    user.deletedAt
  ) {
    return null;
  }

  const stored = await db.collection("users").findOne(
    {
      id: user.id,
      role: user.role,
      status: "active",
      deletedAt: { $exists: false },
    },
    {
      projection: {
        "profile.branch": 1,
      },
    },
  );

  if (!stored) {
    return null;
  }

  const branch =
    typeof stored.profile?.branch === "string"
      ? stored.profile.branch.trim()
      : "";

  return {
    user,
    branch,
  };
}

export function safeString(
  value: unknown,
  limit: number,
): string {
  return typeof value === "string"
    ? value.trim().slice(0, limit)
    : "";
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown> | null> {
  const body: unknown = await request
    .json()
    .catch(() => null);

  return body &&
    typeof body === "object" &&
    !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null;
}

/**
 * Performs a staff record operation and writes its
 * audit event inside the same MongoDB transaction.
 *
 * Requires MongoDB transaction support.
 * Never silently falls back to unaudited writes.
 */
export async function withStaffAudit<T>(
  db: Db,
  request: Request,
  context: StaffContext,
  info: {
    action: "create" | "update" | "delete";
    category: "other" | "expenses";
    details: string;
    recordId: string;
    kind: string;
  },
  operation: (
    session: ClientSession,
  ) => Promise<T>,
): Promise<T> {
  const client = await getMongoClient();
  const session = client.startSession();

  try {
    let output!: T;

    await session.withTransaction(
      async () => {
        output = await operation(session);

        const requestMeta =
          extractRequestMeta(request);

        const audit: Document = {
          id: `al-${randomUUID()}`,

          action: info.action,
          category: info.category,
          details: info.details,

          userId: context.user.id,
          userName: context.user.name,
          userEmail: context.user.email,
          userRole: context.user.role,

          ip: requestMeta.ip,
          userAgent: requestMeta.userAgent,
          browser: requestMeta.browser,
          os: requestMeta.os,
          device: requestMeta.device,

          path: new URL(request.url).pathname,
          method: request.method,

          metadata: {
            recordId: info.recordId,
            kind: info.kind,
            branch: context.branch,
          },

          statusCode:
            info.action === "create" ? 201 : 200,

          timestamp: new Date().toISOString(),
        };

        await db.collection("actionLogs").insertOne(
          audit,
          { session },
        );
      },
      {
        writeConcern: {
          w: "majority",
        },
      },
    );

    return output;
  } finally {
    await session.endSession();
  }
}
