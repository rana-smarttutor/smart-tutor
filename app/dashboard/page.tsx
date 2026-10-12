import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";

import { getSessionUser } from "@/lib/auth";

import {
  getDashboardBundle,
  getStandardizedCourseOptions,
  getStudentDirectory,
  getUsersForAdmin,
} from "@/lib/data-store";

export const dynamic =
  "force-dynamic";

export default async function DashboardPage() {
  const session =
    await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  if (
    session.status ===
    "pending"
  ) {
    redirect(
      "/application-submitted",
    );
  }

  if (
    session.status ===
    "rejected"
  ) {
    redirect(
      "/login?error=account_rejected",
    );
  }

  const role =
    session.role;

  const [
    dashboard,
    educatorStudentDirectory,
    managedUsers,
  ] =
    await Promise.all([
      getDashboardBundle(
        role,
        session.id,
      ),

      role === "educator"
        ? getStudentDirectory(
            session.id,
          )
        : Promise.resolve(
            [],
          ),

      getUsersForAdmin(),
    ]);

  /*
   * Admin / Branch Operations staff /
   * Counsellor require the institute
   * student directory.
   *
   * Educators retain their assigned
   * student directory.
   */
  const studentDirectory =
    role === "admin" ||
    role === "staff" ||
    role === "counsellor"
      ? managedUsers.filter(
          (user) =>
            user.role ===
            "student",
        )
      : educatorStudentDirectory;

  /*
   * Branch operations also needs
   * course/program options for the
   * management screens.
   */
  const courseOptions =
    role === "admin" ||
    role === "staff" ||
    role === "counsellor"
      ? getStandardizedCourseOptions()
      : [];

  const supportContact =
    role === "student"
      ? "Faculty Desk | +91 88504 47887 | WhatsApp support available"
      : role ===
          "educator"
        ? "Admin Desk | info@smartiqinstitute.in"
        : role ===
            "admin"
          ? "Operations Line | +91 88504 47887"
          : role ===
              "staff"
            ? "Head Office | +91 88504 47887 | info@smartiqinstitute.in"
            : "Admissions Desk | info@smartiqinstitute.in";

  return (
    <DashboardShell
      session={session}
      role={role}
      dashboard={
        dashboard
      }
      studentDirectory={
        studentDirectory
      }
      managedUsers={
        managedUsers
      }
      courseOptions={
        courseOptions
      }
      supportContact={
        supportContact
      }
    />
  );
}