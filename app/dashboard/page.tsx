import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionUser } from "@/lib/auth";
import {
  getDashboardBundle,
  getStandardizedCourseOptions,
  getStudentDirectory,
  getUsersForAdmin,
} from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  if (session.status === "pending") {
    redirect("/application-submitted");
  }

  if (session.status === "rejected") {
    redirect("/login?error=account_rejected");
  }

  const role = session.role;

  const [dashboard, educatorStudentDirectory, managedUsers] = await Promise.all([
    getDashboardBundle(role, session.id),
    role === "educator" ? getStudentDirectory(session.id) : Promise.resolve([]),
    role === "admin" ? getUsersForAdmin() : Promise.resolve([]),
  ]);

  const studentDirectory =
    role === "admin"
      ? managedUsers.filter((user) => user.role === "student")
      : educatorStudentDirectory;

  const courseOptions =
    role === "admin" ? getStandardizedCourseOptions() : [];

  const supportContact =
    role === "student"
      ? "Faculty Desk | +91 88504 47887 | WhatsApp support available"
      : role === "educator"
        ? "Admin Desk | info@smarttutors.co.in"
        : role === "admin"
          ? "Operations Line | Prof. Ravi Rana | +91 88504 47887"
          : "Admissions Desk | info@smarttutors.co.in";

  return (
    <DashboardShell
      session={session}
      role={role}
      dashboard={dashboard}
      studentDirectory={studentDirectory}
      managedUsers={managedUsers}
      courseOptions={courseOptions}
      supportContact={supportContact}
    />
  );
}