import { ObjectId } from "mongodb";
import { getMongoDatabase } from "@/lib/mongodb";
import StudentPerformanceReport from "../../StudentPerformanceReport";
import "../../student-performance.css";

type PageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

async function getReport(reportId: string) {
  try {
    if (!ObjectId.isValid(reportId)) {
      console.log("Invalid report ID:", reportId);
      return null;
    }

    const db = await getMongoDatabase();

    const report = await db.collection("performanceReports").findOne({
      _id: new ObjectId(reportId),
    });

    if (!report) {
      console.log("No report found for ID:", reportId);
      return null;
    }

    return {
      ...report,
      _id: report._id.toString(),
    };
  } catch (error) {
    console.error("Report fetch error:", error);
    return null;
  }
}

export default async function StudentPerformanceReportPage({ params }: PageProps) {
  const resolvedParams = await params;
  const report = await getReport(resolvedParams.reportId);

  if (!report) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-900 p-8">
          <h1 className="text-3xl font-black">Report not found</h1>
          <p className="mt-3 text-slate-300">
            This performance report could not be found or the report ID is invalid.
          </p>

          <p className="mt-5 rounded-xl bg-slate-800 p-4 text-sm text-slate-300">
            Report ID checked: {resolvedParams.reportId}
          </p>
        </section>
      </main>
    );
  }

  return <StudentPerformanceReport report={report as any} />;
}