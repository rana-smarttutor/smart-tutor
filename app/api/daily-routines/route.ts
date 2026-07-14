import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

import {
  createStudentDailyRoutine,
  findFullUserById,
  getStudentDailyRoutines,
  getStudentDirectory,
} from "@/lib/data-store";

import type {
  DailyRoutineMood,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MOODS = new Set<DailyRoutineMood>([
  "difficult",
  "okay",
  "good",
  "great",
]);

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

  const cleaned = value.trim();

  return cleaned || undefined;
}

function getRequiredWholeNumber(
  value: unknown,
  label: string,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }

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

function getOptionalWholeNumber(
  value: unknown,
  label: string,
  fallback = 0,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

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
    wakeTotal - bedTotal;

  /*
   * Example:
   * Bedtime 23:00
   * Wake-up 07:00
   *
   * 07:00 is on the next day,
   * so add 24 hours.
   */
  if (
    sleepMinutes < 0
  ) {
    sleepMinutes +=
      24 * 60;
  }

  return sleepMinutes;
}

/*
 * Load the logged-in student's
 * daily routine history.
 */
export async function GET(
  request: Request,
) {
  try {
    const session =
      await getSessionUser();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const requestUrl =
      new URL(request.url);

    const requestedStudentId =
      requestUrl.searchParams
        .get("studentId")
        ?.trim() ?? "";

    let targetStudentId = "";

    let targetStudentName:
      | string
      | null = null;

    /*
     * Student:
     * Always load only their
     * own routine records.
     */
    if (
      session.role ===
      "student"
    ) {
      targetStudentId =
        session.id;

      targetStudentName =
        session.name;
    }

    /*
     * Parent:
     * Automatically load the
     * linked student's records.
     */
    else if (
      session.role ===
      "parent"
    ) {
      const parent =
        await findFullUserById(
          session.id,
        );

      if (
        !parent?.linkedStudentId
      ) {
        return NextResponse.json({
          routines: [],
          studentId: null,
          studentName: null,
        });
      }

      const linkedStudent =
        await findFullUserById(
          parent.linkedStudentId,
        );

      if (
        !linkedStudent ||
        linkedStudent.role !==
          "student"
      ) {
        return NextResponse.json({
          routines: [],
          studentId: null,
          studentName: null,
        });
      }

      targetStudentId =
        linkedStudent.id;

      targetStudentName =
        linkedStudent.name;
    }

    /*
     * Admin:
     * Can select and view
     * any student.
     */
    else if (
      session.role ===
      "admin"
    ) {
      if (
        !requestedStudentId
      ) {
        return NextResponse.json({
          routines: [],
          studentId: null,
          studentName: null,
        });
      }

      const selectedStudent =
        await findFullUserById(
          requestedStudentId,
        );

      if (
        !selectedStudent ||
        selectedStudent.role !==
          "student"
      ) {
        return NextResponse.json(
          {
            error:
              "Selected student was not found.",
          },
          {
            status: 404,
          },
        );
      }

      targetStudentId =
        selectedStudent.id;

      targetStudentName =
        selectedStudent.name;
    }

    /*
     * Educator:
     * Can view only students
     * assigned directly or
     * through an active batch.
     */
    else if (
      session.role ===
      "educator"
    ) {
      if (
        !requestedStudentId
      ) {
        return NextResponse.json({
          routines: [],
          studentId: null,
          studentName: null,
        });
      }

      const assignedStudents =
        await getStudentDirectory(
          session.id,
        );

      const allowedStudentIds =
        new Set(
          assignedStudents.map(
            (student) =>
              student.id,
          ),
        );

      if (
        !allowedStudentIds.has(
          requestedStudentId,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "You can view routines only for students assigned to you.",
          },
          {
            status: 403,
          },
        );
      }

      const selectedStudent =
        await findFullUserById(
          requestedStudentId,
        );

      if (
        !selectedStudent ||
        selectedStudent.role !==
          "student"
      ) {
        return NextResponse.json(
          {
            error:
              "Selected student was not found.",
          },
          {
            status: 404,
          },
        );
      }

      targetStudentId =
        selectedStudent.id;

      targetStudentName =
        selectedStudent.name;
    }

    /*
     * Other roles cannot
     * access routine records.
     */
    else {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view daily routines.",
        },
        {
          status: 403,
        },
      );
    }

    const routines =
      await getStudentDailyRoutines(
        targetStudentId,
      );

    return NextResponse.json({
      routines,

      studentId:
        targetStudentId,

      studentName:
        targetStudentName,
    });
  } catch (error) {
    console.error(
      "Get student daily routines error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load daily routines.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * Create one daily routine
 * for the logged-in student.
 */
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
      "student"
    ) {
      return NextResponse.json(
        {
          error:
            "Only students can create daily routines.",
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

    const date =
      validateDate(
        getRequiredText(
          body.date,
          "Routine date",
        ),
      );

    const wakeUpTime =
      validateTime(
        getRequiredText(
          body.wakeUpTime,
          "Wake-up time",
        ),
        "Wake-up time",
      );

    const bedTime =
      validateTime(
        getRequiredText(
          body.bedTime,
          "Bedtime",
        ),
        "Bedtime",
      );

    const studyMinutes =
      getRequiredWholeNumber(
        body.studyMinutes,
        "Study time",
      );

    const screenMinutes =
      getRequiredWholeNumber(
        body.screenMinutes,
        "Screen time",
      );

    const exerciseMinutes =
      getOptionalWholeNumber(
        body.exerciseMinutes,
        "Exercise time",
        0,
      );

    const tasksCompleted =
      getOptionalWholeNumber(
        body.tasksCompleted,
        "Tasks completed",
        0,
      );

    const rawMood =
      getRequiredText(
        body.mood,
        "Mood",
      );

    if (
      !ALLOWED_MOODS.has(
        rawMood as DailyRoutineMood,
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

    const sleepMinutes =
      calculateSleepMinutes(
        bedTime,
        wakeUpTime,
      );

    const routine =
      await createStudentDailyRoutine(
        {
          studentId:
            session.id,

          studentName:
            session.name,

          date,

          wakeUpTime,

          bedTime,

          sleepMinutes,

          studyMinutes,

          screenMinutes,

          exerciseMinutes,

          tasksCompleted,

          mood:
            rawMood as DailyRoutineMood,

          mainGoal:
            getOptionalText(
              body.mainGoal,
            ),

          reflection:
            getOptionalText(
              body.reflection,
            ),
        },
      );

    return NextResponse.json(
      {
        routine,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create student daily routine error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save daily routine.",
      },
      {
        status: 400,
      },
    );
  }
}