import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getActionLogs, getActionLogStats } from "@/lib/data-store";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const stats = searchParams.get("stats") === "true";

  if (stats) {
    const data = await getActionLogStats();
    return NextResponse.json(data);
  }

  const filters = {
    userId: searchParams.get("userId") || undefined,
    action: searchParams.get("action") || undefined,
    category: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
    ip: searchParams.get("ip") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
    sortBy: searchParams.get("sortBy") || undefined,
    sortOrder: searchParams.get("sortOrder") || undefined,
  };

  const result = await getActionLogs(filters);
  return NextResponse.json(result);
}
