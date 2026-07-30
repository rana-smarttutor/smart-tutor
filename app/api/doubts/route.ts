import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";
import {
  createDoubt,
  getDoubts,
} from "@/lib/data-store";
import {
  sanitizeTextInput,
  sanitizeTextareaInput,
} from "@/lib/validation";
import { validateChatContent } from "@/lib/chat-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateDoubtRequest = {
  subject?: string;
  title?: string;
  description?: string;
  attachmentUrl?: string;
  batchId?: string;
  batchName?: string;
};

const allowedRoles = new Set([
  "student",
  "educator",
  "admin",
]);

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Login is required.",
        },
        {
          status: 401,
        },
      );
    }

    if (!allowedRoles.has(session.role)) {
      return NextResponse.json(
        {
          error: "You do not have access to the Doubt Box.",
        },
        {
          status: 403,
        },
      );
    }

    const doubts = await getDoubts();

    return NextResponse.json(
      {
        doubts,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Get doubts error:", error);

    return NextResponse.json(
      {
        error: "Unable to load doubts right now.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Login is required to ask a doubt.",
        },
        {
          status: 401,
        },
      );
    }

    if (session.role !== "student") {
      return NextResponse.json(
        {
          error: "Only students can post new doubts.",
        },
        {
          status: 403,
        },
      );
    }

    let body: CreateDoubtRequest;

    try {
      body = (await request.json()) as CreateDoubtRequest;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request data.",
        },
        {
          status: 400,
        },
      );
    }

    const subject = sanitizeTextInput(
      body.subject,
      80,
    );

    const title = sanitizeTextInput(
      body.title,
      160,
    );

    const description = sanitizeTextareaInput(
      body.description,
      4000,
    );

    const attachmentUrl = sanitizeTextInput(
      body.attachmentUrl,
      1000,
    );

    const batchId = sanitizeTextInput(
      body.batchId,
      100,
    );

    const batchName = sanitizeTextInput(
      body.batchName,
      150,
    );

    if (!subject) {
      return NextResponse.json(
        {
          error: "Please select or enter a subject.",
        },
        {
          status: 400,
        },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          error: "Doubt title is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        {
          error: "Doubt title must be at least 5 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          error: "Please explain your doubt.",
        },
        {
          status: 400,
        },
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        {
          error:
            "Please provide a little more detail about your doubt.",
        },
        {
          status: 400,
        },
      );
    }

    const contentValidation = validateChatContent(
      `${title}\n${description}`,
    );

    if (contentValidation.hasSensitiveContent) {
      return NextResponse.json(
        {
          error:
            "Your doubt contains personal contact information or a restricted link. Remove it before posting.",
        },
        {
          status: 400,
        },
      );
    }

    const doubt = await createDoubt({
      studentId: session.id,
      studentName: session.name,
      subject,
      title,
      description,
      attachmentUrl:
        attachmentUrl || undefined,
      batchId:
        batchId || undefined,
      batchName:
        batchName || undefined,
    });

    await logAction({
      action: "create",
      category: "other",
      details: `Doubt "${title}" posted by ${session.name}`,
      path: "/api/doubts",
      method: "POST",
      request,
      session,
      metadata: { doubtId: doubt.id, subject, title },
    });

    return NextResponse.json(
      {
        doubt,
        message:
          "Your doubt has been posted successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create doubt error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to post your doubt.",
      },
      {
        status: 500,
      },
    );
  }
}