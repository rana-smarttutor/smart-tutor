import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { AdmissionApplicationForm } from "@/components/admission-application-form";

export const dynamic = "force-dynamic";

export default async function NewAdmissionFormPage() {
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

  if (
    !["admin", "counsellor", "staff"].includes(session.role) ||
    (session.status && session.status !== "active")
  ) {
    redirect("/dashboard");
  }

  return <AdmissionApplicationForm draftOwnerId={session.id} />;
}
