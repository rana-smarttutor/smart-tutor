import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { uploadBufferToMega } from "@/lib/mega";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type UploadStreamEvent =
  | {
      type: "status";
      message: string;
      progress: number;
    }
  | {
      type: "progress";
      message: string;
      progress: number;
      megaProgress: number;
    }
  | {
      type: "complete";
      message: string;
      progress: number;
      url: string;
      fileName: string;
      nodeId: string;
    }
  | {
      type: "error";
      message: string;
      progress: number;
    };

function streamUploadEvent(event: UploadStreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    const role = String(session?.role || "student").toLowerCase();

    if (role !== "admin" && role !== "educator") {
      return NextResponse.json(
        {
          success: false,
          message: "Only admins and educators can upload library materials.",
        },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const filename = String(formData.get("name") || "").trim();

    if (!file || !filename) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing file or filename in the upload payload.",
        },
        { status: 400 },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: UploadStreamEvent) => {
          controller.enqueue(encoder.encode(streamUploadEvent(event)));
        };

        void (async () => {
          try {
            send({
              type: "status",
              message: "Preparing full book upload...",
              progress: 10,
            });

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            send({
              type: "status",
              message: "Uploading full book to Mega.nz...",
              progress: 35,
            });

            const result = await uploadBufferToMega(filename, buffer, {
              replaceExisting: true,
              onProgress: ({ percentage }) => {
                send({
                  type: "progress",
                  message: "Uploading full book to Mega.nz...",
                  progress: 35 + Math.round(percentage * 0.6),
                  megaProgress: percentage,
                });
              },
            });

            send({
              type: "complete",
              message: "Full book stored on Mega.nz.",
              progress: 100,
              url: result.url,
              fileName: result.name,
              nodeId: result.nodeId,
            });
          } catch (error) {
            send({
              type: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to upload file to Mega.nz.",
              progress: 0,
            });
          } finally {
            try {
              controller.close();
            } catch (e) {
              // Ignore if already closed
            }
          }
        })();
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Mega.nz upload endpoint error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload file to Mega.nz.",
      },
      { status: 500 },
    );
  }
}
