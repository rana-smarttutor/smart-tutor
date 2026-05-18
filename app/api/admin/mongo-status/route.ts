import { NextResponse } from "next/server";

import { getMongoDatabase } from "@/lib/mongodb";
import { getSessionUser, hasAnyRole } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const secretFromHeader = request.headers.get("x-bootstrap-key");
    const session = await getSessionUser();
    const isAdmin = hasAnyRole(session, ["admin"]);
    
    if (!isAdmin && (!secretFromHeader || secretFromHeader !== process.env.MONGODB_BOOTSTRAP_KEY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getMongoDatabase();
    await db.command({ ping: 1 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("MongoDB Status Check Error:", error);
    
    const details = {
      message: error?.message || String(error),
      code: error?.code,
      syscall: error?.syscall,
      hostname: error?.hostname,
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    };
    
    return NextResponse.json(
      { ok: false, error: details }, 
      { 
        status: 503,
        headers: { "Retry-After": "30" }
      }
    );
  }
}

