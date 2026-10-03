import { NextResponse } from "next/server";

import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

import {
  getMongoDatabase,
} from "@/lib/mongodb";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type LooseRecord =
  Record<
    string,
    any
  >;

function round(
  value: number,
) {
  return (
    Math.round(
      value * 100,
    ) / 100
  );
}

function dateOnly(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function startOfUtcDay(
  date: Date,
) {
  const result =
    new Date(date);

  result.setUTCHours(
    0,
    0,
    0,
    0,
  );

  return result;
}

function endOfUtcDay(
  date: Date,
) {
  const result =
    new Date(date);

  result.setUTCHours(
    23,
    59,
    59,
    999,
  );

  return result;
}

function shiftDays(
  date: Date,
  amount: number,
) {
  const result =
    new Date(date);

  result.setUTCDate(
    result.getUTCDate() +
      amount,
  );

  return result;
}

function average(
  values: number[],
):
  | number
  | null {
  if (
    !values.length
  ) {
    return null;
  }

  return round(
    values.reduce(
      (
        total,
        value,
      ) =>
        total +
        value,
      0,
    ) /
      values.length,
  );
}

function getWeeklyTestPercentage(
  test: LooseRecord,
  studentId: string,
):
  | number
  | null {
  const totalMarks =
    Number(
      test.totalMarks,
    );

  if (
    !Number.isFinite(
      totalMarks,
    ) ||
    totalMarks <= 0
  ) {
    return null;
  }

  const results =
    Array.isArray(
      test.results,
    )
      ? test.results
      : [];

  const result =
    results.find(
      (
        item:
          LooseRecord,
      ) =>
        item.studentId ===
        studentId,
    );

  if (
    !result ||
    result.status !==
      "present"
  ) {
    return null;
  }

  const obtainedMarks =
    Number(
      result.obtainedMarks,
    );

  if (
    !Number.isFinite(
      obtainedMarks,
    )
  ) {
    return null;
  }

  return round(
    (
      obtainedMarks /
      totalMarks
    ) *
      100,
  );
}

function getQuizPercentage(
  attempt: LooseRecord,
):
  | number
  | null {
  const correct =
    Number(
      attempt.correctAnswers,
    ) || 0;

  const incorrect =
    Number(
      attempt.incorrectAnswers,
    ) || 0;

  const answered =
    correct +
    incorrect;

  if (
    answered <= 0
  ) {
    return null;
  }

  return round(
    (
      correct /
      answered
    ) *
      100,
  );
}

export async function GET(
  request: Request,
) {
  const session =
    await getSessionUser();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Login required.",
      },
      {
        status: 401,
      },
    );
  }

  if (
    !hasAnyRole(
      session,
      [
        "admin",
        "educator",
      ],
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Only educators and admins can access student performance data.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const {
      searchParams,
    } =
      new URL(
        request.url,
      );

    const studentId =
      (
        searchParams.get(
          "studentId",
        ) || ""
      ).trim();

    const reportType =
      searchParams.get(
        "reportType",
      ) === "monthly"
        ? "monthly"
        : "weekly";

    if (!studentId) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Student ID is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const db =
      await getMongoDatabase();

    /*
     * Confirm that this is a real
     * student account.
     */
    const student =
      await db
        .collection(
          "users",
        )
        .findOne({
          id:
            studentId,

          role:
            "student",

          deletedAt: {
            $exists:
              false,
          },
        });

    if (!student) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Student account was not found.",
        },
        {
          status:
            404,
        },
      );
    }

    /*
     * Faculty should only be able
     * to load students assigned to
     * them.
     */
    if (
      session.role ===
      "educator"
    ) {
      const assignedFacultyIds =
        Array.isArray(
          student.assignedFacultyIds,
        )
          ? student.assignedFacultyIds
          : [];

      if (
        !assignedFacultyIds.includes(
          session.id,
        )
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "This student is not assigned to your account.",
          },
          {
            status:
              403,
          },
        );
      }
    }

    /*
     * Weekly = latest 7 days
     * Monthly = latest 30 days
     */
    const periodDays =
      reportType ===
      "monthly"
        ? 30
        : 7;

    const now =
      endOfUtcDay(
        new Date(),
      );

    const currentStart =
      startOfUtcDay(
        shiftDays(
          now,
          -(
            periodDays -
            1
          ),
        ),
      );

    const previousEnd =
      endOfUtcDay(
        shiftDays(
          currentStart,
          -1,
        ),
      );

    const previousStart =
      startOfUtcDay(
        shiftDays(
          previousEnd,
          -(
            periodDays -
            1
          ),
        ),
      );

    const currentStartIso =
      currentStart.toISOString();

    const currentEndIso =
      now.toISOString();

    const previousStartIso =
      previousStart.toISOString();

    const previousEndIso =
      previousEnd.toISOString();

    const currentStartDate =
      dateOnly(
        currentStart,
      );

    const currentEndDate =
      dateOnly(now);

    const previousStartDate =
      dateOnly(
        previousStart,
      );

    const previousEndDate =
      dateOnly(
        previousEnd,
      );

    /*
     * ---------------------------
     * WEEKLY / FORMAL TEST DATA
     * ---------------------------
     */

    const weeklyTests =
      await db
        .collection(
          "weeklyTests",
        )
        .find({
          published:
            true,

          testDate: {
            $gte:
              previousStartDate,

            $lte:
              currentEndDate,
          },

          "results.studentId":
            studentId,
        })
        .toArray();

    const currentTestScores:
      number[] =
      [];

    const previousTestScores:
      number[] =
      [];

    for (
      const test of
      weeklyTests
    ) {
      const percentage =
        getWeeklyTestPercentage(
          test,
          studentId,
        );

      if (
        percentage ===
        null
      ) {
        continue;
      }

      const testDate =
        typeof test.testDate ===
        "string"
          ? test.testDate
          : "";

      if (
        testDate >=
          currentStartDate &&
        testDate <=
          currentEndDate
      ) {
        currentTestScores.push(
          percentage,
        );
      } else if (
        testDate >=
          previousStartDate &&
        testDate <=
          previousEndDate
      ) {
        previousTestScores.push(
          percentage,
        );
      }
    }

    /*
     * ---------------------------
     * QUIZ ARENA EXAM DATA
     * ---------------------------
     */

    const quizAttempts =
      await db
        .collection(
          "quiz_arena_attempts",
        )
        .find({
          userId:
            studentId,

          completedAt: {
            $gte:
              previousStartIso,

            $lte:
              currentEndIso,
          },
        })
        .sort({
          completedAt:
            1,
        })
        .toArray();

    const currentQuizAttempts =
      quizAttempts.filter(
        (
          attempt,
        ) => {
          const completedAt =
            typeof attempt.completedAt ===
            "string"
              ? attempt.completedAt
              : "";

          return (
            completedAt >=
              currentStartIso &&
            completedAt <=
              currentEndIso
          );
        },
      );

    const previousQuizAttempts =
      quizAttempts.filter(
        (
          attempt,
        ) => {
          const completedAt =
            typeof attempt.completedAt ===
            "string"
              ? attempt.completedAt
              : "";

          return (
            completedAt >=
              previousStartIso &&
            completedAt <=
              previousEndIso
          );
        },
      );

    const currentQuizScores =
      currentQuizAttempts
        .map(
          (
            attempt,
          ) =>
            getQuizPercentage(
              attempt,
            ),
        )
        .filter(
          (
            value,
          ): value is number =>
            value !== null,
        );

    const previousQuizScores =
      previousQuizAttempts
        .map(
          (
            attempt,
          ) =>
            getQuizPercentage(
              attempt,
            ),
        )
        .filter(
          (
            value,
          ): value is number =>
            value !== null,
        );

    /*
     * Combine formal tests and
     * Quiz Arena completed exams.
     */
    const currentScores =
      [
        ...currentTestScores,
        ...currentQuizScores,
      ];

    const previousScores =
      [
        ...previousTestScores,
        ...previousQuizScores,
      ];

    const currentAverage =
      average(
        currentScores,
      );

    const previousAverage =
      average(
        previousScores,
      );

    const improvementPercentage =
      currentAverage !==
        null &&
      previousAverage !==
        null
        ? round(
            currentAverage -
              previousAverage,
          )
        : null;

    /*
     * ---------------------------
     * ACCURACY
     * ---------------------------
     */

    let correct =
      0;

    let wrong =
      0;

    let unattempted =
      0;

    for (
      const attempt of
      currentQuizAttempts
    ) {
      correct +=
        Number(
          attempt.correctAnswers,
        ) || 0;

      wrong +=
        Number(
          attempt.incorrectAnswers,
        ) || 0;

      const questions =
        Array.isArray(
          attempt.questions,
        )
          ? attempt.questions
          : [];

      if (
        questions.length
      ) {
        const answered =
          (
            Number(
              attempt.correctAnswers,
            ) || 0
          ) +
          (
            Number(
              attempt.incorrectAnswers,
            ) || 0
          );

        unattempted +=
          Math.max(
            0,
            questions.length -
              answered,
          );
      }
    }

    const accuracyDenominator =
      correct +
      wrong;

    const accuracyPercentage =
      accuracyDenominator >
      0
        ? round(
            (
              correct /
              accuracyDenominator
            ) *
              100,
          )
        : null;

    /*
     * ---------------------------
     * ATTENDANCE
     * ---------------------------
     */

    const attendanceSheets =
      await db
        .collection(
          "attendanceSheets",
        )
        .find({
          date: {
            $gte:
              currentStartDate,

            $lte:
              currentEndDate,
          },

          lectureId: {
            $ne:
              "faculty",
          },

          "records.studentId":
            studentId,
        })
        .toArray();

    let present =
      0;

    let late =
      0;

    let absent =
      0;

    let excused =
      0;

    for (
      const sheet of
      attendanceSheets
    ) {
      const records =
        Array.isArray(
          sheet.records,
        )
          ? sheet.records
          : [];

      for (
        const record of
        records
      ) {
        if (
          record.studentId !==
          studentId
        ) {
          continue;
        }

        if (
          record.status ===
          "present"
        ) {
          present += 1;
        } else if (
          record.status ===
          "late"
        ) {
          late += 1;
        } else if (
          record.status ===
          "absent"
        ) {
          absent += 1;
        } else if (
          record.status ===
          "excused"
        ) {
          excused += 1;
        }
      }
    }

    /*
     * Excused / leave records do
     * not reduce attendance %.
     */
    const attendanceDenominator =
      present +
      late +
      absent;

    const attendancePercentage =
      attendanceDenominator >
      0
        ? round(
            (
              (
                present +
                late
              ) /
              attendanceDenominator
            ) *
              100,
          )
        : null;

    /*
     * ---------------------------
     * HOMEWORK
     * ---------------------------
     */

    const homeworkItems =
      await db
        .collection(
          "homework",
        )
        .find({
          assignedStudentIds:
            studentId,

          $or: [
            {
              createdAt: {
                $gte:
                  currentStartIso,

                $lte:
                  currentEndIso,
              },
            },

            {
              dueDate: {
                $gte:
                  currentStartDate,

                $lte:
                  currentEndDate,
              },
            },
          ],
        })
        .toArray();

    const homeworkIds =
      homeworkItems
        .map(
          (
            item,
          ) =>
            typeof item.id ===
            "string"
              ? item.id
              : "",
        )
        .filter(
          Boolean,
        );

    let submittedHomework =
      0;

    if (
      homeworkIds.length
    ) {
      const homeworkSubmissions =
        await db
          .collection(
            "homeworkSubmissions",
          )
          .find({
            studentId,

            homeworkId: {
              $in:
                homeworkIds,
            },

            status: {
              $in: [
                "submitted",
                "graded",
              ],
            },
          })
          .toArray();

      const submittedIds =
        new Set(
          homeworkSubmissions.map(
            (
              submission,
            ) =>
              submission.homeworkId,
          ),
        );

      submittedHomework =
        submittedIds.size;
    }

    const assignedHomework =
      homeworkIds.length;

    const homeworkCompletionPercentage =
      assignedHomework > 0
        ? round(
            (
              submittedHomework /
              assignedHomework
            ) *
              100,
          )
        : null;

    return NextResponse.json({
      success:
        true,

      reportType,

      range: {
        start:
          currentStartDate,

        end:
          currentEndDate,

        previousStart:
          previousStartDate,

        previousEnd:
          previousEndDate,
      },

      metrics: {
        averageScore:
          currentAverage,

        attendancePercentage,

        homeworkCompletionPercentage,

        improvementPercentage,

        accuracyPercentage,
      },

      accuracySplit: {
        correct,
        wrong,
        unattempted,
      },

      coverage: {
        currentFormalTests:
          currentTestScores.length,

        currentQuizAttempts:
          currentQuizAttempts.length,

        previousFormalTests:
          previousTestScores.length,

        previousQuizAttempts:
          previousQuizAttempts.length,

        attendanceRecords:
          present +
          late +
          absent +
          excused,

        assignedHomework,

        submittedHomework,
      },
    });
  } catch (
    error
  ) {
    console.error(
      "Student performance metrics error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to calculate student performance metrics.",
      },
      {
        status: 500,
      },
    );
  }
}