import { NextResponse } from "next/server";

import {
  getSessionUser,
  hasAnyRole,
} from "@/lib/auth";

import {
  getStudentDirectory,
} from "@/lib/data-store";

import {
  getMongoDatabase,
} from "@/lib/mongodb";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

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
          "Only educators and admins can access previous performance reports.",
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
          success: false,
          message:
            "Student ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const students =
      await getStudentDirectory();

    const student =
      students.find(
        (item) =>
          item.id ===
            studentId &&
          item.status ===
            "active",
      );

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected student account was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const db =
      await getMongoDatabase();

    /*
     * Weekly compares with the
     * previous weekly report.
     *
     * Monthly compares with the
     * previous monthly report.
     */
    const previousReport =
      await db
        .collection(
          "performanceReports",
        )
        .find({
          $or: [
            {
              linkedStudentId:
                studentId,
            },
            {
              studentId,
            },
          ],

          reportType,

          "metrics.averageScore": {
            $exists: true,
          },
        })
        .sort({
          createdAt: -1,
        })
        .limit(1)
        .next();

    if (!previousReport) {
      return NextResponse.json({
        success: true,
        found: false,
        previousAverageScore:
          null,
        previousReportId:
          null,
      });
    }

    const previousAverageScore =
      Number(
        previousReport
          .metrics
          ?.averageScore,
      );

    if (
      !Number.isFinite(
        previousAverageScore,
      )
    ) {
      return NextResponse.json({
        success: true,
        found: false,
        previousAverageScore:
          null,
        previousReportId:
          previousReport._id.toString(),
      });
    }

    return NextResponse.json({
      success: true,
      found: true,

      previousAverageScore,

      previousReportId:
        previousReport._id.toString(),
    });
  } catch (error) {
    console.error(
      "Previous performance report error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load previous performance report.",
      },
      {
        status: 500,
      },
    );
  }
}