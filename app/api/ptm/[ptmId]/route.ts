import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  createMessage,
  createNotifications,
  deletePtmSession,
  getNotificationRecipientIdsForStudents,
  getPtmSessionById,
  updatePtmSession,
} from "@/lib/data-store";

import type {
  PtmMode,
  PtmStatus,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    ptmId: string;
  }>;
};

function getOptionalText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : undefined;
}

function getPtmMode(
  value: unknown,
): PtmMode | undefined {
  if (
    value === "online" ||
    value === "offline"
  ) {
    return value;
  }

  return undefined;
}

function getPtmStatus(
  value: unknown,
): PtmStatus | undefined {
  if (
    value === "scheduled" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return undefined;
}

function formatPtmDate(
  value: string,
) {
  const date =
    new Date(value);

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

function canManagePtm(
  session: {
    id: string;
    role: string;
  },

  ptm: {
    teacherId: string;
    createdBy: string;
  },
) {
  if (
    session.role ===
    "admin"
  ) {
    return true;
  }

  if (
    session.role ===
      "educator" &&
    (
      ptm.teacherId ===
        session.id ||
      ptm.createdBy ===
        session.id
    )
  ) {
    return true;
  }

  return false;
}

export async function PUT(
  request: Request,

  context: RouteContext,
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

    const {
      ptmId,
    } = await context.params;

    const existingPtm =
      await getPtmSessionById(
        ptmId,
      );

    if (!existingPtm) {
      return NextResponse.json(
        {
          error:
            "PTM session not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !canManagePtm(
        session,
        existingPtm,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to update this PTM.",
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
      getOptionalText(
        body.title,
      );

    const startsAt =
      getOptionalText(
        body.startsAt,
      );

    const endsAt =
      getOptionalText(
        body.endsAt,
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

    const agenda =
      getOptionalText(
        body.agenda,
      );

    const notes =
      getOptionalText(
        body.notes,
      );

    const status =
      getPtmStatus(
        body.status,
      );

    if (
      body.title !==
        undefined &&
      !title
    ) {
      return NextResponse.json(
        {
          error:
            "PTM title cannot be empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.startsAt !==
        undefined &&
      !startsAt
    ) {
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
      startsAt &&
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

    const finalMode =
      mode ??
      existingPtm.mode;

    const finalMeetingLink =
      body.meetingLink !==
      undefined
        ? meetingLink
        : existingPtm.meetingLink;

    const finalLocation =
      body.location !==
      undefined
        ? location
        : existingPtm.location;

    if (
      finalMode ===
        "online" &&
      !finalMeetingLink
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
      finalMode ===
        "offline" &&
      !finalLocation
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

    const updatedPtm =
      await updatePtmSession(
        ptmId,
        {
          title,

          startsAt,

          endsAt,

          mode,

          meetingLink,

          location,

          agenda,

          notes,

          status,
        },
      );

    if (!updatedPtm) {
      return NextResponse.json(
        {
          error:
            "PTM session could not be updated.",
        },
        {
          status: 404,
        },
      );
    }

    const recipientIds =
      await getNotificationRecipientIdsForStudents(
        [
          updatedPtm.studentId,
        ],
        {
          includeLinkedParents:
            true,
        },
      );

    const formattedDate =
      formatPtmDate(
        updatedPtm.startsAt,
      );

    const notificationTitle =
      updatedPtm.status ===
      "cancelled"
        ? "PTM Cancelled"
        : updatedPtm.status ===
            "completed"
          ? "PTM Completed"
          : "PTM Updated";

    const notificationMessage =
      updatedPtm.status ===
      "cancelled"
        ? `${updatedPtm.title} scheduled for ${formattedDate} has been cancelled.`
        : updatedPtm.status ===
            "completed"
          ? `${updatedPtm.title} has been marked as completed.`
          : `${updatedPtm.title} is scheduled for ${formattedDate}.`;

    if (
      recipientIds.length >
      0
    ) {
      await createNotifications({
        userIds:
          recipientIds,

        title:
          notificationTitle,

        message:
          notificationMessage,

        type:
          "ptm",

        link:
          "/dashboard",
      });

      await createMessage({
        title:
          notificationTitle,

        body:
          notificationMessage,

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
    }

    return NextResponse.json({
      ptm:
        updatedPtm,

      notified:
        recipientIds.length >
        0,
    });
  } catch (error) {
    console.error(
      "Update PTM error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to update PTM.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,

  context: RouteContext,
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

    const {
      ptmId,
    } = await context.params;

    const existingPtm =
      await getPtmSessionById(
        ptmId,
      );

    if (!existingPtm) {
      return NextResponse.json(
        {
          error:
            "PTM session not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !canManagePtm(
        session,
        existingPtm,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to delete this PTM.",
        },
        {
          status: 403,
        },
      );
    }

    const deleted =
      await deletePtmSession(
        ptmId,
      );

    if (!deleted) {
      return NextResponse.json(
        {
          error:
            "PTM session could not be deleted.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      deleted:
        true,
    });
  } catch (error) {
    console.error(
      "Delete PTM error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to delete PTM.",
      },
      {
        status: 500,
      },
    );
  }
}