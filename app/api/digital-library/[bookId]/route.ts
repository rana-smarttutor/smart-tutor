import { del } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    bookId: string;
  }>;
};

async function getCurrentRole() {
  const cookieStore = await cookies();

  const role =
    cookieStore.get("role")?.value ||
    cookieStore.get("userRole")?.value ||
    cookieStore.get("smart_tutors_role")?.value ||
    cookieStore.get("smart-tutors-role")?.value ||
    cookieStore.get("accountRole")?.value ||
    "student";

  return role.toLowerCase();
}

function canManageLibrary(role: string) {
  return ["admin", "educator"].includes(role);
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const role = await getCurrentRole();

    if (!canManageLibrary(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins and educators can delete library materials.",
        },
        { status: 403 }
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "BLOB_READ_WRITE_TOKEN is missing. Add it in .env.local and restart npm run dev.",
        },
        { status: 500 }
      );
    }

    const params = await context.params;
    const pathname = decodeURIComponent(params.bookId);

    if (!pathname.startsWith("digital-library/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid library file.",
        },
        { status: 400 }
      );
    }

    await del(pathname, {
      token,
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error("Digital library delete error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete file.",
      },
      { status: 500 }
    );
  }
}