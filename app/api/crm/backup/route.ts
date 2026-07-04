import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getCrmAdminWorkspace } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();

  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can download CRM backups." },
      { status: 403 },
    );
  }

  const workspace = await getCrmAdminWorkspace();

  const backup = {
    exportedAt: new Date().toISOString(),
    exportedBy: {
      id: session.id,
      name: session.name,
    },
    product: "Smart Tutors Sales CRM",
    version: 1,
    ...workspace,
  };

  const fileDate = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="smart-tutors-crm-backup-${fileDate}.json"`,
      "Cache-Control": "no-store",
    },
  });
}