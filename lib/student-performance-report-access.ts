import { ObjectId } from "mongodb";

import { getMongoDatabase } from "@/lib/mongodb";
import type { SessionUser } from "@/lib/types";

type MongoStudentPerformanceReport = Record<string, unknown> & {
  _id: ObjectId;
  studentId?: string;
  createdBy?: string;
};

export type PrintableStudentPerformanceReport = Omit<
  MongoStudentPerformanceReport,
  "_id"
> & {
  _id: string;
};

export type StudentPerformanceReportAccessResult =
  | {
      status: "ok";
      report: PrintableStudentPerformanceReport;
    }
  | {
      status: "invalid" | "not-found" | "forbidden";
    };

function serializeReport(
  report: MongoStudentPerformanceReport,
): PrintableStudentPerformanceReport {
  const { _id, ...reportData } = report;

  return {
    ...reportData,
    _id: _id.toString(),
  };
}

export async function getAccessibleStudentPerformanceReport(
  reportId: string,
  session: SessionUser,
): Promise<StudentPerformanceReportAccessResult> {
  if (!ObjectId.isValid(reportId)) {
    return { status: "invalid" };
  }

  const db = await getMongoDatabase();

  const report = await db
    .collection<MongoStudentPerformanceReport>("performanceReports")
    .findOne({
      _id: new ObjectId(reportId),
    });

  if (!report) {
    return { status: "not-found" };
  }

  if (session.role === "admin") {
    return {
      status: "ok",
      report: serializeReport(report),
    };
  }

  if (session.role === "student" && report.studentId === session.id) {
    return {
      status: "ok",
      report: serializeReport(report),
    };
  }

  if (session.role === "educator" && report.createdBy === session.id) {
    return {
      status: "ok",
      report: serializeReport(report),
    };
  }

  if (session.role === "parent") {
    const parent = await db
      .collection<{ linkedStudentId?: string }>("users")
      .findOne({
        id: session.id,
        role: "parent",
      });

    if (
      parent?.linkedStudentId &&
      report.studentId === parent.linkedStudentId
    ) {
      return {
        status: "ok",
        report: serializeReport(report),
      };
    }
  }

  return { status: "forbidden" };
}