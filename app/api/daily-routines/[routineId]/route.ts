import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";

import {
  deleteStudentDailyRoutine,
  getStudentDailyRoutineById,
  updateStudentDailyRoutine,
} from "@/lib/data-store";

import type {
  DailyRoutineMood,
  StudentDailyRoutine,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    routineId: string;
  }>;
};

const ALLOWED_MOODS = new Set<DailyRoutineMood>([
  "difficult",
  "okay",
  "good",
  "great",
]);

function hasField(
  body: Record<string, unknown>,
  field: string,
) {
  return Object.prototype.hasOwnProperty.call(
    body,
    field,
  );
}

function getRequiredText(
  value: unknown,
  label: string,
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return value.trim();
}

function getOptionalText(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const cleaned =
    value.trim();

  return cleaned || undefined;
}

function getWholeNumber(
  value: unknown,
  label: string,
) {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(numberValue) ||
    !Number.isInteger(numberValue) ||
    numberValue < 0
  ) {
    throw new Error(
      `${label} must be a whole number of zero or greater.`,
    );
  }

  return numberValue;
}

function validateDate(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "Routine date must use the YYYY-MM-DD format.",
    );
  }

  const parsedDate =
    new Date(
      `${value}T12:00:00`,
    );

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    throw new Error(
      "Choose a valid routine date.",
    );
  }

  return value;
}

function validateTime(
  value: string,
  label: string,
) {
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(
      value,
    )
  ) {
    throw new Error(
      `${label} must use a valid 24-hour time.`,
    );
  }

  return value;
}

function calculateSleepMinutes(
  bedTime: string,
  wakeUpTime: string,
) {
  const [
    bedHour,
    bedMinute,
  ] = bedTime
    .split(":")
    .map(Number);

  const [
    wakeHour,
    wakeMinute,
  ] = wakeUpTime
    .split(":")
    .map(Number);

  const bedTotal =
    bedHour * 60 +
    bedMinute;

  const wakeTotal =
    wakeHour * 60 +
    wakeMinute;

  if (
    bedTotal === wakeTotal
  ) {
    throw new Error(
      "Wake-up time and bedtime cannot be the same.",
    );
  }

  let sleepMinutes =
    wakeTotal -
    bedTotal;

  if (
    sleepMinutes < 0
  ) {
    sleepMinutes +=
      24 * 60;
  }

  return sleepMinutes;
}

export async function PATCH(
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
      "student"
    ) {
      return NextResponse.json(
        {
          error:
            "Only students can edit daily routines.",
        },
        {
          status: 403,
        },
      );
    }

    const {
      routineId,
    } =
      await context.params;

    const existingRoutine =
      await getStudentDailyRoutineById(
        routineId,
        session.id,
      );

    if (!existingRoutine) {
      return NextResponse.json(
        {
          error:
            "Daily routine not found.",
        },
        {
          status: 404,
        },
      );
    }

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const updates: Partial<
      Omit<
        StudentDailyRoutine,
        | "id"
        | "studentId"
        | "studentName"
        | "createdAt"
        | "updatedAt"
      >
    > = {};

    if (
      hasField(
        body,
        "date",
      )
    ) {
      updates.date =
        validateDate(
          getRequiredText(
            body.date,
            "Routine date",
          ),
        );
    }

    if (
      hasField(
        body,
        "wakeUpTime",
      )
    ) {
      updates.wakeUpTime =
        validateTime(
          getRequiredText(
            body.wakeUpTime,
            "Wake-up time",
          ),
          "Wake-up time",
        );
    }

    if (
      hasField(
        body,
        "bedTime",
      )
    ) {
      updates.bedTime =
        validateTime(
          getRequiredText(
            body.bedTime,
            "Bedtime",
          ),
          "Bedtime",
        );
    }

    if (
      hasField(
        body,
        "studyMinutes",
      )
    ) {
      updates.studyMinutes =
        getWholeNumber(
          body.studyMinutes,
          "Study time",
        );
    }

    if (
      hasField(
        body,
        "screenMinutes",
      )
    ) {
      updates.screenMinutes =
        getWholeNumber(
          body.screenMinutes,
          "Screen time",
        );
    }

    if (
      hasField(
        body,
        "exerciseMinutes",
      )
    ) {
      updates.exerciseMinutes =
        getWholeNumber(
          body.exerciseMinutes,
          "Exercise time",
        );
    }

    if (
      hasField(
        body,
        "tasksCompleted",
      )
    ) {
      updates.tasksCompleted =
        getWholeNumber(
          body.tasksCompleted,
          "Tasks completed",
        );
    }

    if (
      hasField(
        body,
        "mood",
      )
    ) {
      const mood =
        getRequiredText(
          body.mood,
          "Mood",
        );

      if (
        !ALLOWED_MOODS.has(
          mood as DailyRoutineMood,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Choose a valid mood.",
          },
          {
            status: 400,
          },
        );
      }

      updates.mood =
        mood as DailyRoutineMood;
    }

    if (
      hasField(
        body,
        "mainGoal",
      )
    ) {
      updates.mainGoal =
        getOptionalText(
          body.mainGoal,
        );
    }

    if (
      hasField(
        body,
        "reflection",
      )
    ) {
      updates.reflection =
        getOptionalText(
          body.reflection,
        );
    }

    const nextWakeUpTime =
      updates.wakeUpTime ??
      existingRoutine.wakeUpTime;

    const nextBedTime =
      updates.bedTime ??
      existingRoutine.bedTime;

    updates.sleepMinutes =
      calculateSleepMinutes(
        nextBedTime,
        nextWakeUpTime,
      );

    const routine =
      await updateStudentDailyRoutine(
        routineId,
        session.id,
        updates,
      );

    if (!routine) {
      return NextResponse.json(
        {
          error:
            "Daily routine not found.",
        },
        {
          status: 404,
        },
      );
    }

    await logAction({
      action: "update",
      category: "other",
      details: `Daily routine ${routineId} updated by ${session.name}`,
      path: "/api/daily-routines/[routineId]",
      method: "PATCH",
      request,
      session,
      metadata: { routineId },
    });

    return NextResponse.json({
      routine,
    });
  } catch (error) {
    console.error(
      "Update student daily routine error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update daily routine.",
      },
      {
        status: 400,
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
      "student"
    ) {
      return NextResponse.json(
        {
          error:
            "Only students can delete daily routines.",
        },
        {
          status: 403,
        },
      );
    }

    const {
      routineId,
    } =
      await context.params;

    const existingRoutine =
      await getStudentDailyRoutineById(
        routineId,
        session.id,
      );

    if (!existingRoutine) {
      return NextResponse.json(
        {
          error:
            "Daily routine not found.",
        },
        {
          status: 404,
        },
      );
    }

    const deleted =
      await deleteStudentDailyRoutine(
        routineId,
        session.id,
      );

    if (!deleted) {
      return NextResponse.json(
        {
          error:
            "Daily routine not found.",
        },
        {
          status: 404,
        },
      );
    }

    await logAction({
      action: "delete",
      category: "other",
      details: `Daily routine ${routineId} deleted by ${session.name}`,
      path: "/api/daily-routines/[routineId]",
      method: "DELETE",
      request: _request,
      session,
      metadata: { routineId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Delete student daily routine error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete daily routine.",
      },
      {
        status: 500,
      },
    );
  }
}