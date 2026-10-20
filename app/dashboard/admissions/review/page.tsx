import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import StudentAdmissionReview from "@/components/student-admission-review";

export const dynamic = "force-dynamic";

export default async function StudentAdmissionReviewPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role !== "student" || (session.status && session.status !== "active")) redirect("/dashboard");
  return <StudentAdmissionReview />;
}
