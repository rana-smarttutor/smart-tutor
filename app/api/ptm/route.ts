import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  createMessage,
  createNotifications,
  createPtmSession,
  getNotificationRecipientIdsForStudents,
  getPtmSessionsForRole,
  getStudentDirectory,
} from "@/lib/data-store";

import type {
  PtmMode,
  PtmStatus,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOptionalText(
  value: unknown,
) {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : undefined;
}

function getRequiredText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getPtmMode(
  value: unknown,
): PtmMode | null {
  if (
    value === "online" ||
    value === "offline"
  ) {
    return value;
  }

  return null;
}

function getPtmStatus(
  value: unknown,
): PtmStatus {
  if (
    value === "scheduled" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "scheduled";
}

function formatPtmDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      timeZone:
        "Asia/Kolkata",

      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  );
}

export async function GET() {
  try {
    const session =
      await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const ptmSessions =
      await getPtmSessionsForRole(
        session.role,
        session.id,
      );

    const canManage =
      session.role ===
        "admin" ||
      session.role ===
        "educator";

    const students =
      canManage
        ? await getStudentDirectory(
            session.role ===
              "educator"
              ? session.id
              : undefined,
          )
        : [];

    return NextResponse.json({
      ptmSessions,

      students:
        students.map(
          (student) => ({
            id:
              student.id,

            name:
              student.name,

            email:
              student.email,

            program:
              student.program,

            profilePhoto:
              student.profilePhoto,
          }),
        ),
    });
  } catch (error) {
    console.error(
      "Get PTM sessions error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load PTM sessions.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const session =
      await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    if (
      session.role !==
        "admin" &&
      session.role !==
        "educator"
    ) {
      return NextResponse.json(
        {
          error:
            "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const title =
      getRequiredText(
        body.title,
      );

    const studentId =
      getRequiredText(
        body.studentId,
      );

    const startsAt =
      getRequiredText(
        body.startsAt,
      );

    const mode =
      getPtmMode(
        body.mode,
      );

    const meetingLink =
      getOptionalText(
        body.meetingLink,
      );

    const location =
      getOptionalText(
        body.location,
      );

    if (!title) {
      return NextResponse.json(
        {
          error:
            "PTM title is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!studentId) {
      return NextResponse.json(
        {
          error:
            "Select a student.",
        },
        {
          status: 400,
        },
      );
    }

    if (!startsAt) {
      return NextResponse.json(
        {
          error:
            "PTM date and time are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      Number.isNaN(
        new Date(
          startsAt,
        ).getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid PTM date and time.",
        },
        {
          status: 400,
        },
      );
    }

    if (!mode) {
      return NextResponse.json(
        {
          error:
            "Choose online or offline PTM mode.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      mode ===
        "online" &&
      !meetingLink
    ) {
      return NextResponse.json(
        {
          error:
            "Meeting link is required for an online PTM.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      mode ===
        "offline" &&
      !location
    ) {
      return NextResponse.json(
        {
          error:
            "Location is required for an offline PTM.",
        },
        {
          status: 400,
        },
      );
    }

    const allowedStudents =
      await getStudentDirectory(
        session.role ===
          "educator"
          ? session.id
          : undefined,
      );

    const selectedStudent =
      allowedStudents.find(
        (student) =>
          student.id ===
          studentId,
      );

    if (
      !selectedStudent
    ) {
      return NextResponse.json(
        {
          error:
            session.role ===
            "educator"
              ? "You can schedule a PTM only for students assigned to you."
              : "Selected student could not be found.",
        },
        {
          status: 400,
        },
      );
    }

    const ptm =
      await createPtmSession({
        title,

        studentId:
          selectedStudent.id,

        studentName:
          selectedStudent.name,

        teacherId:
          session.id,

        teacherName:
          session.name,

        batchId:
          getOptionalText(
            body.batchId,
          ),

        batchName:
          getOptionalText(
            body.batchName,
          ),

        startsAt,

        endsAt:
          getOptionalText(
            body.endsAt,
          ),

        mode,

        meetingLink,

        location,

        agenda:
          getOptionalText(
            body.agenda,
          ),

        notes:
          getOptionalText(
            body.notes,
          ),

        status:
          getPtmStatus(
            body.status,
          ),

        createdBy:
          session.id,
      });

    const recipientIds =
      await getNotificationRecipientIdsForStudents(
        [
          ptm.studentId,
        ],
        {
          includeLinkedParents:
            true,
        },
      );

    const formattedDate =
      formatPtmDate(
        ptm.startsAt,
      );

    let messageBody =
      `A Parent-Teacher Meeting has been scheduled.\n\n`;

    messageBody +=
      `Student: ${ptm.studentName}\n`;

    messageBody +=
      `Teacher: ${ptm.teacherName}\n`;

    messageBody +=
      `Date & Time: ${formattedDate}\n`;

    messageBody +=
      `Mode: ${
        ptm.mode ===
        "online"
          ? "Online"
          : "Offline"
      }\n`;

    if (
      ptm.agenda
    ) {
      messageBody +=
        `Agenda: ${ptm.agenda}\n`;
    }

    if (
      ptm.mode ===
        "online" &&
      ptm.meetingLink
    ) {
      messageBody +=
        `Meeting Link: ${ptm.meetingLink}\n`;
    }

    if (
      ptm.mode ===
        "offline" &&
      ptm.location
    ) {
      messageBody +=
        `Location: ${ptm.location}\n`;
    }

    await createMessage({
      title:
        `PTM Scheduled: ${ptm.title}`,

      body:
        messageBody,

      channel:
        "PTM",

      author:
        session.name,

      audience: [
        "student",
        "parent",
      ],

      userIds:
        recipientIds,

      expiresAt:
        null,
    });

    if (
      recipientIds.length >
      0
    ) {
      await createNotifications({
        userIds:
          recipientIds,

        title:
          "New PTM Scheduled",

        message:
          `${ptm.title} is scheduled for ${formattedDate}.`,

        type:
          "ptm",

        link:
          "/dashboard",
      });
    }

    return NextResponse.json(
      {
        ptm,

        notified:
          recipientIds.length >
          0,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create PTM error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to schedule PTM.",
      },
      {
        status: 500,
      },
    );
  }
}