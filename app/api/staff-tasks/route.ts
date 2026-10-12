
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

const COLLECTION = "staffTasks";

function reply(
  error: string,
  status = 400,
) {
  return NextResponse.json(
    { error },
    { status },
  );
}

export async function GET() {
  try {
    const db = await getMongoDatabase();
    const ctx = await getStaffContext(db);

    if (!ctx) {
      return reply("Forbidden", 403);
    }

    const tasks = await db
      .collection(COLLECTION)
      .find(
        {
          staffId: ctx.user.id,
          deletedAt: { $exists: false },
        },
        {
          projection: { _id: 0 },
        },
      )
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error(
      "staff tasks GET",
      error,
    );

    return reply(
      "Unable to load tasks",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await getMongoDatabase();
    const ctx = await getStaffContext(db);

    if (!ctx) {
      return reply("Forbidden", 403);
    }

    const body = await readJson(request);

    if (!body) {
      return reply("Invalid request body");
    }

    const title = safeString(
      body.title,
      160,
    );

    if (!title) {
      return reply("Title required");
    }

    const priority = [
      "low",
      "medium",
      "high",
    ].includes(String(body.priority))
      ? body.priority
      : "medium";

    const dueDate = safeString(
      body.dueDate,
      10,
    );

    if (
      dueDate &&
      (
        !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
        Number.isNaN(
          Date.parse(`${dueDate}T00:00:00Z`),
        )
      )
    ) {
      return reply("Invalid due date");
    }

    const now = new Date().toISOString();

    const task = {
      id: randomUUID(),

      staffId: ctx.user.id,
      staffName: ctx.user.name,
      branch: ctx.branch,

      title,
      description: safeString(
        body.description,
        2000,
      ),

      priority,
      status: "pending",
      dueDate,

      createdAt: now,
      updatedAt: now,
    };

    await withStaffAudit(
      db,
      request,
      ctx,
      {
        action: "create",
        category: "other",
        details: "Staff task created",
        recordId: task.id,
        kind: "staffTasks",
      },
      async (session) => {
        await db
          .collection(COLLECTION)
          .insertOne(task, { session });
      },
    );

    return NextResponse.json(
      {
        success: true,
        task,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "staff tasks POST",
      error,
    );

    return reply(
      "Unable to create task securely",
      500,
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const db = await getMongoDatabase();
    const ctx = await getStaffContext(db);

    if (!ctx) {
      return reply("Forbidden", 403);
    }

    const body = await readJson(request);

    if (!body) {
      return reply("Invalid request body");
    }

    const id = safeString(
      body.id,
      80,
    );

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
      return reply(
        "Invalid task or status",
      );
    }

    const record = await db
      .collection(COLLECTION)
      .findOne({
        id,
        staffId: ctx.user.id,
        deletedAt: { $exists: false },
      });

    if (!record) {
      return reply(
        "Task not found",
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
        kind: "staffTasks",
      },
      async (session) => {
        const result = await db
          .collection(COLLECTION)
          .updateOne(
            {
              _id: record._id,
              staffId: ctx.user.id,
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
      "staff tasks PATCH",
      error,
    );

    return reply(
      "Unable to update task securely",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getMongoDatabase();
    const ctx = await getStaffContext(db);

    if (!ctx) {
      return reply("Forbidden", 403);
    }

    const body = await readJson(request);

    if (!body) {
      return reply("Invalid request body");
    }

    const id = safeString(body.id, 80);

    if (!id) {
      return reply("Task ID required");
    }

    const record = await db
      .collection(COLLECTION)
      .findOne({
        id,
        staffId: ctx.user.id,
        deletedAt: { $exists: false },
      });

    if (!record) {
      return reply(
        "Task not found",
        404,
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
        kind: "staffTasks",
      },
      async (session) => {
        const now =
          new Date().toISOString();

        const result = await db
          .collection(COLLECTION)
          .updateOne(
            {
              _id: record._id,
              staffId: ctx.user.id,
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
      "staff tasks DELETE",
      error,
    );

    return reply(
      "Unable to delete task securely",
      500,
    );
  }
}
