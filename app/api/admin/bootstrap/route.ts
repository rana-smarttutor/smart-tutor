import { NextResponse } from "next/server";

import { seedMongoTemplateCollections } from "@/lib/seed-database";
import { getMongoDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const secretFromHeader = request.headers.get("x-bootstrap-key");
    const session = await getSessionUser();
    const isAdmin = session && session.role === "admin";

    if (!isAdmin && (!secretFromHeader || secretFromHeader !== process.env.MONGODB_BOOTSTRAP_KEY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getMongoDatabase();
    const content = db.collection("content");
    const ids = ["public-site", "dashboard-config"];
    const found = await content
      .find({ _id: { $in: ids } } as any)
      .project({ _id: 1 })
      .toArray();
    const present = new Set(found.map((item) => String((item as any)._id)));
    const missing = ids.filter((id) => !present.has(id));

    return NextResponse.json(
      {
        ok: missing.length === 0,
        requiredContent: ids,
        missingContent: missing,
      },
      { status: 200 },
    );
  } catch (error) {
    const details =
      error && typeof error === "object"
        ? {
            message: (error as any).message ?? String(error),
            code: (error as any).code,
            syscall: (error as any).syscall,
            hostname: (error as any).hostname,
          }
        : { message: String(error) };
    return NextResponse.json({ ok: false, error: details }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: { bootstrapKey?: string; replaceExisting?: boolean } = {};

  try {
    body = (await request.json()) as { bootstrapKey?: string; replaceExisting?: boolean };
  } catch {
    body = {};
  }

  const secretFromHeader = request.headers.get("x-bootstrap-key");
  const secret = secretFromHeader ?? body.bootstrapKey;

  if (!process.env.MONGODB_BOOTSTRAP_KEY) {
    return NextResponse.json(
      { error: "MONGODB_BOOTSTRAP_KEY is not configured." },
      { status: 500 },
    );
  }

  if (!secret || secret !== process.env.MONGODB_BOOTSTRAP_KEY) {
    return NextResponse.json(
      { error: "Bootstrap authorization failed." },
      { status: 403 },
    );
  }

  try {
    const result = await seedMongoTemplateCollections({
      replaceExisting: Boolean(body.replaceExisting),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const details =
      error && typeof error === "object"
        ? {
          message: (error as any).message ?? String(error),
          code: (error as any).code,
          syscall: (error as any).syscall,
          hostname: (error as any).hostname,
        }
        : { message: String(error) };
    return NextResponse.json({ ok: false, error: details }, { status: 503 });
  }
}
