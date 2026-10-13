
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getMongoDatabase } from "@/lib/mongodb";
import {
  getStaffContext,
  readJson,
  safeString,
  withStaffAudit,
} from "@/lib/staff-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const collections = {
  tasks: "staffOperationsTasks",
  expenses: "staffOperationsExpenses",
  "daily-reports": "staffOperationsDailyReports",
} as const;

type Kind = keyof typeof collections;

function isKind(kind: string): kind is Kind {
  return Object.prototype.hasOwnProperty.call(
    collections,
    kind,
  );
}

function reply(
  error: string,
  status = 400,
) {
  return NextResponse.json(
    { error },
    { status },
  );
}

async function prepare(request: Request) {
  const db = await getMongoDatabase();
  const ctx = await getStaffContext(db);

  const kind =
    new URL(request.url).searchParams.get("kind") ||
    "";

  return {
    db,
    ctx,
    kind: isKind(kind) ? kind : null,
  };
}

export async function GET(request: Request) {
  try {
    const { db, ctx, kind } =
      await prepare(request);

    if (!ctx || !kind) {
      return reply(
        "Forbidden or invalid section",
        403,
      );
    }

    if (kind !== "tasks" && !ctx.branch) {
      return reply(
        "Your staff account must have an assigned branch to view these records.",
        403,
      );
    }

    const items = await db
      .collection(collections[kind])
      .find(
        {
          ownerId: ctx.user.id,
          ...(kind === "tasks" ? {} : { branch: ctx.branch }),
          deletedAt: { $exists: false },
        },
        {
          projection: { _id: 0 },
        },
      )
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();

    return NextResponse.json({ items });
  } catch (error) {
    console.error(
      "staff operations GET",
      error,
    );

    return reply(
      "Could not load records",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const { db, ctx, kind } =
      await prepare(request);

    if (!ctx || !kind) {
      return reply(
        "Forbidden or invalid section",
        403,
      );
    }

    if (!ctx.branch && kind !== "tasks") {
      return reply(
        "Ask an administrator to assign your branch before submitting.",
        403,
      );
    }

    const body = await readJson(request);

    if (!body) {
      return reply("Invalid request body");
    }

    const title = safeString(
      body.title,
      140,
    );

    if (!title) {
      return reply("Title is required");
    }

    const details = safeString(
      body.details,
      4000,
    );

    const date = safeString(
      body.date,
      10,
    );

    if (
      date &&
      (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(
          Date.parse(`${date}T00:00:00Z`),
        )
      )
    ) {
      return reply("Invalid date");
    }

    const amount = Number(body.amount);

    if (
      kind === "expenses" &&
      (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 100000000
      )
    ) {
      return reply("Invalid amount");
    }

    const now = new Date().toISOString();

    const item = {
      id: randomUUID(),

      ownerId: ctx.user.id,
      ownerName: ctx.user.name,
      branch: ctx.branch,

      title,
      details,
      date,

      amount:
        kind === "expenses"
          ? Math.round(amount * 100) / 100
          : null,

      status:
        kind === "tasks"
          ? "pending"
          : "submitted",

      createdAt: now,
      updatedAt: now,
    };

    await withStaffAudit(
      db,
      request,
      ctx,
      {
        action: "create",
        category:
          kind === "expenses"
            ? "expenses"
            : "other",

        details:
          `Staff ${kind} record created`,

        recordId: item.id,
        kind,
      },
      async (session) => {
        await db
          .collection(collections[kind])
          .insertOne(item, { session });
      },
    );

    return NextResponse.json(
      { item },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "staff operations POST",
      error,
    );

    return reply(
      "Could not create record securely",
      500,
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { db, ctx, kind } =
      await prepare(request);

    if (!ctx || !kind) {
      return reply(
        "Forbidden or invalid section",
        403,
      );
    }

    if (kind !== "tasks") {
      return reply(
        "Only task status can be edited",
        403,
      );
    }

    const body = await readJson(request);

    if (!body) {
      return reply("Invalid request body");
    }

    const id = safeString(body.id, 80);
    const status = safeString(
      body.status,
      30,
    );

    if (
      !id ||
      ![
        "pending",
        "in_progress",
        "completed",
      ].includes(status)
    ) {
      return reply("Invalid status");
    }

    const record = await db
      .collection(collections[kind])
      .findOne({
        id,
        ownerId: ctx.user.id,
        deletedAt: { $exists: false },
      });

    if (!record) {
      return reply(
        "Record not found",
        404,
      );
    }

    await withStaffAudit(
      db,
      request,
      ctx,
      {
        action: "update",
        category: "other",

        details:
          `Staff task status: ${record.status} -> ${status}`,

        recordId: id,
        kind,
      },
      async (session) => {
        const result = await db
          .collection(collections[kind])
          .updateOne(
            {
              _id: record._id,
              ownerId: ctx.user.id,
              status: record.status,
              deletedAt: { $exists: false },
            },
            {
              $set: {
                status,
                updatedAt:
                  new Date().toISOString(),
              },
            },
            { session },
          );

        if (!result.matchedCount) {
          throw new Error(
            "Concurrent task update",
          );
        }
      },
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "staff operations PATCH",
      error,
    );

    return reply(
      "Could not update record securely",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { db, ctx, kind } =
      await prepare(request);

    if (!ctx || !kind) {
      return reply(
        "Forbidden or invalid section",
        403,
      );
    }

    const body = await readJson(request);

    if (!body) {
      return reply("Invalid request body");
    }

    const id = safeString(body.id, 80);

    if (!id) {
      return reply("Record ID required");
    }

    const record = await db
      .collection(collections[kind])
      .findOne({
        id,
        ownerId: ctx.user.id,
        deletedAt: { $exists: false },
      });

    if (!record) {
      return reply(
        "Record not found",
        404,
      );
    }

    // Submitted financial and daily records
    // cannot be deleted by staff.
    if (kind !== "tasks") {
      return reply(
        "Submitted records cannot be deleted. Ask an administrator to review them.",
        403,
      );
    }

    await withStaffAudit(
      db,
      request,
      ctx,
      {
        action: "delete",
        category: "other",
        details: "Staff task soft-deleted",
        recordId: id,
        kind,
      },
      async (session) => {
        const now =
          new Date().toISOString();

        const result = await db
          .collection(collections[kind])
          .updateOne(
            {
              _id: record._id,
              ownerId: ctx.user.id,
              deletedAt: { $exists: false },
            },
            {
              $set: {
                deletedAt: now,
                deletedBy: ctx.user.id,
                updatedAt: now,
              },
            },
            { session },
          );

        if (!result.matchedCount) {
          throw new Error(
            "Concurrent task deletion",
          );
        }
      },
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "staff operations DELETE",
      error,
    );

    return reply(
      "Could not delete record securely",
      500,
    );
  }
}
