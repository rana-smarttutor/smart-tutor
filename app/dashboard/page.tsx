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

  const dashboard = await getDashboardBundle(session.role, session.id);
  const role = session.role;
  const studentDirectory =
    role === "educator" || role === "admin" ? await getStudentDirectory() : [];
  const managedUsers = role === "admin" ? await getUsersForAdmin() : [];
  const courseOptions = role === "admin" ? getStandardizedCourseOptions() : [];

  const supportContact =
    role === "student"
      ? "Faculty Desk | +91 88504 47887 | WhatsApp support available"
      : role === "educator"
        ? "Admin Desk | admissions@smarttutors.co.in"
        : role === "admin"
          ? "Operations Line | Prof. Ravi Rana | +91 88504 47887"
          : "Admissions Desk | admissions@smarttutors.co.in";

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
