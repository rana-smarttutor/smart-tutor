import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  findFullUserById,
  getHomeworkById,
  getHomeworkForStudent,
  getStudentDirectory,
  getSubmissionsForHomework,
} from "@/lib/data-store";
import {
  getR2AssetKey,
  isValidAssetPathname,
} from "@/lib/r2-asset-storage";
import { createPrivateR2FileResponse } from "@/lib/r2-asset-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL_PREFIX = "/api/r2/homework/file?pathname=";

const FACULTY_PATTERN =
  /^homework-attachments\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;

const SUBMISSION_PATTERN =
  /^homework-submissions\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;

function fail(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

function getFileType(pathname: string) {
  const extension = pathname.split(".").pop()?.toLowerCase();

  const types: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    txt: "text/plain",
  };

  return types[extension || ""] || "application/octet-stream";
}

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getSessionUser();

    if (!session) return fail("Login required.", 401);

    if (
      (session.status && session.status !== "active") ||
      session.verified === false
    ) {
      return fail("Active account required.", 403);
    }

    const pathname = new URL(request.url)
      .searchParams.get("pathname") || "";

    if (
      !isValidAssetPathname(pathname) ||
      (!FACULTY_PATTERN.test(pathname) &&
        !SUBMISSION_PATTERN.test(pathname))
    ) {
      return fail("Invalid homework file.", 400);
    }

    const expectedUrl =
      `${URL_PREFIX}${encodeURIComponent(pathname)}`;

    const isFacultyFile = FACULTY_PATTERN.test(pathname);
    const role = String(session.role || "").toLowerCase();

    if (
      role !== "admin" &&
      role !== "educator" &&
      role !== "student"
    ) {
      return fail("Access denied.", 403);
    }

    const maxBytes = isFacultyFile
      ? 4 * 1024 * 1024
      : 10 * 1024 * 1024;

    let authorised = false;

    if (isFacultyFile) {
      const ownerId = pathname.split("/")[1];

      if (role === "admin" || (
        role === "educator" && ownerId === session.id
      )) {
        authorised = true;
      }

      if (!authorised) {
        const user = await findFullUserById(session.id);
        const studentBatchIds =
          role === "student" && user?.program
            ? [user.program]
            : [];

        const homework =
          role === "student"
            ? await getHomeworkForStudent(
                session.id,
                studentBatchIds,
              )
            : [];

        authorised = homework.some(
          (item) => item.attachmentUrl === expectedUrl,
        );
      }

      // Require a saved assignment reference, even for admins.
      if (authorised) {
        const homework =
          role === "admin" || role === "educator"
            ? await import("@/lib/data-store").then(
                (store) =>
                  role === "admin"
                    ? store.getAllHomeworkForAdmin()
                    : store.getHomeworkForTeacher(session.id),
              )
            : await getHomeworkForStudent(
                session.id,
                (await findFullUserById(session.id))?.program
                  ? [(await findFullUserById(session.id))!.program]
                  : [],
              );

        authorised = homework.some(
          (item) => item.attachmentUrl === expectedUrl,
        );
      }
    } else {
      // A student can read only their own saved submission.
      // An educator can read submissions from students in
      // their assigned directory. Admins can review all.
      const ownerId = pathname.split("/")[1];

      if (role === "student" && ownerId !== session.id) {
        return fail("Access denied.", 403);
      }

      let educatorStudentIds: Set<string> | null = null;

      if (role === "educator") {
        const students = await getStudentDirectory(session.id);
        educatorStudentIds = new Set(
          students.map((student) => student.id),
        );
      }

      const homework =
        role === "student"
          ? await getHomeworkForStudent(
              session.id,
              (await findFullUserById(session.id))?.program
                ? [(await findFullUserById(session.id))!.program]
                : [],
            )
          : role === "educator"
            ? await import("@/lib/data-store").then(
                (store) => store.getHomeworkForTeacher(session.id),
              )
            : await import("@/lib/data-store").then(
                (store) => store.getAllHomeworkForAdmin(),
              );

      for (const item of homework) {
        const existing = await getHomeworkById(item.id);
        if (!existing) continue;

        const submissions = await getSubmissionsForHomework(item.id);

        if (
          submissions.some((submission) => {
            if (submission.attachmentUrl !== expectedUrl) {
              return false;
            }

            if (role === "admin") return true;

            if (role === "student") {
              return submission.studentId === session.id;
            }

            return Boolean(
              educatorStudentIds?.has(submission.studentId),
            );
          })
        ) {
          authorised = true;
          break;
        }
      }
    }

    if (!authorised) {
      return fail("File not found or access denied.", 404);
    }

    const key = getR2AssetKey(pathname);

    return createPrivateR2FileResponse({
      key,
      contentType: getFileType(pathname),
      maxBytes,
      disposition: "attachment",
    });
  } catch (error) {
    const status = (
      error as {
        $metadata?: { httpStatusCode?: number };
      }
    )?.$metadata?.httpStatusCode;

    if (status === 404) {
      return fail("File not found.", 404);
    }

    console.error(
      "Private homework file error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return fail("Unable to retrieve homework file.", 500);
  }
}