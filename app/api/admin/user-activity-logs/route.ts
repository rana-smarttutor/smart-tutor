import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMongoDatabase } from "@/lib/mongodb";
import type { Document, Filter } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = [
  "admin", "staff", "educator",
  "student", "parent", "counsellor",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();

    if (
      !user ||
      user.role !== "admin" ||
      user.status !== "active" ||
      user.deletedAt
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const db = await getMongoDatabase();

    const activeAdmin = await db.collection("users").findOne({
      id: user.id,
      role: "admin",
      status: "active",
      deletedAt: { $exists: false },
    });

    if (!activeAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const query = url.searchParams;
    const role = query.get("role") || "";
    const action = query.get("action") || "";
    const search = (query.get("search") || "").trim().slice(0, 100);
    const from = query.get("from") || "";
    const to = query.get("to") || "";

    const page = Math.min(
      10000,
      Math.max(1, Number(query.get("page")) || 1)
    );

    const limit = Math.min(
      100,
      Math.max(1, Number(query.get("limit")) || 30)
    );

    const filter: Filter<Document> = {
      userId: { $exists: true, $nin: [null, ""] },
    };

    if (role && ROLES.includes(role)) {
      filter.userRole = role;
    }

    if (action && /^[a-z_]{2,40}$/.test(action)) {
      filter.action = action;
    }

    if (search) {
      const regex = escapeRegex(search);
      filter.$or = [
        { userName: { $regex: regex, $options: "i" } },
        { userEmail: { $regex: regex, $options: "i" } },
        { userId: { $regex: regex, $options: "i" } },
        { details: { $regex: regex, $options: "i" } },
      ];
    }

    if (
      (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) ||
      (to && /^\d{4}-\d{2}-\d{2}$/.test(to))
    ) {
      const range: Record<string, string> = {};

      if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
        range.$gte = `${from}T00:00:00.000Z`;
      }

      if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
        range.$lte = `${to}T23:59:59.999Z`;
      }

      filter.timestamp = range;
    }

    const collection = db.collection("actionLogs");

    const [logs, total] = await Promise.all([
      collection
        .find(filter)
        .project({
          _id: 0,
          id: 1,
          userId: 1,
          userName: 1,
          userEmail: 1,
          userRole: 1,
          action: 1,
          category: 1,
          details: 1,
          timestamp: 1,
          ip: 1,
          browser: 1,
          device: 1,
          path: 1,
          method: 1,
          statusCode: 1,
        })
        .sort({ timestamp: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        logs,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("User activity logs error:", error);
    return NextResponse.json(
      { error: "Unable to load activity logs" },
      { status: 500 }
    );
  }
}